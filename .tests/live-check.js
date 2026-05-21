/* ============================================================================
   Live engine test suite
   ----------------------------------------------------------------------------
   Drives Live._tick() deterministically and asserts:
     - The formatters do what they say
     - Seeding the history fills the activity log to 6 entries
     - A regular tick prepends an event
     - A hot tick prepends both an event AND a DATA.changes entry
     - Subscribers fire
     - The DOM sweep updates `[data-live-since]` and `[data-live-next]`
     - The Sources view renders the per-source countdown markup
     - The Radar timeline marks rows < 60s old with the NEW pulse
   ============================================================================ */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT = path.join(__dirname, '..');

/* Tiny DOM that supports getElementById / querySelectorAll keyed by attribute
   so we can verify Live's per-second sweep writes back into real elements. */
function makeDom() {
  const byId = new Map();
  const byAttr = { 'data-live-since': new Set(), 'data-live-next': new Set() };
  function fakeEl(id) {
    const el = {
      id: id || '',
      _text: '',
      _attrs: {},
      innerHTML: '',
      get textContent() { return this._text; },
      set textContent(v) { this._text = String(v); },
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, removeEventListener() {}, appendChild() {},
      querySelector() { return fakeEl(); }, querySelectorAll() { return []; },
      focus() {}, getContext() { return {}; },
      getBoundingClientRect() { return { width: 600, height: 200 }; },
      setAttribute(k, v) { this._attrs[k] = String(v); },
      getAttribute(k)    { return this._attrs[k] != null ? this._attrs[k] : ''; },
      remove() {}, scrollTop: 0, style: {}
    };
    return el;
  }
  return {
    document: {
      getElementById(id) {
        if (!byId.has(id)) byId.set(id, fakeEl(id));
        return byId.get(id);
      },
      querySelector: () => fakeEl(),
      querySelectorAll(sel) {
        if (sel === '[data-live-since]') return [...byAttr['data-live-since']];
        if (sel === '[data-live-next]')  return [...byAttr['data-live-next']];
        return [];
      },
      addEventListener: () => {},
      createElement: () => fakeEl()
    },
    /* helpers for tests to register pseudo-nodes the engine should sweep */
    addLiveSince(at) {
      const el = fakeEl();
      el._attrs['data-live-since'] = String(at);
      byAttr['data-live-since'].add(el);
      return el;
    },
    addLiveNext(srcId) {
      const el = fakeEl();
      el._attrs['data-live-next'] = String(srcId);
      byAttr['data-live-next'].add(el);
      return el;
    },
    byId
  };
}

const harness = makeDom();
const sandbox = {
  console,
  document:   harness.document,
  lucide:     { createIcons() {} },
  setTimeout: () => 0,
  setInterval: () => 0,
  Math, Date, JSON, Number, Object, Array, Buffer
};
sandbox.window = sandbox;
function MockChart() { return { destroy() {} }; }
MockChart.defaults = { color: '', font: {}, borderColor: '' };
sandbox.Chart = MockChart;
vm.createContext(sandbox);

['assets/js/data.js','assets/js/risk-engine.js','assets/js/components.js','assets/js/live.js','assets/js/views.js','assets/js/app.js']
  .forEach(rel => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel }));

const DATA  = sandbox.DATA;
const Live  = sandbox.Live;
const Views = sandbox.Views;

let ok = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32mPASS\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
  else      { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
};

/* --------------------------------------------------------------------- */
console.log('\n[1] Module surface');
check('window.Live exists',                     !!Live);
['start','syncNow','subscribe','recent','fmtClock','fmtAgo','fmtCountdown','_tick','_seedHistory','_sweep','_log']
  .forEach(k => check('Live.' + k + ' is a function', typeof Live[k] === 'function'));

/* --------------------------------------------------------------------- */
console.log('\n[2] Formatters');
check('fmtClock(midnight) == 00:00:00',         Live.fmtClock(new Date(2026, 0, 1, 0, 0, 0).getTime()) === '00:00:00');
check('fmtClock(09:14:07) == 09:14:07',         Live.fmtClock(new Date(2026, 0, 1, 9, 14, 7).getTime()) === '09:14:07');
check('fmtAgo(now) == "just now"',              Live.fmtAgo(Date.now()) === 'just now');
check('fmtAgo(15s ago) ~ "15s ago"',            /^\d+s ago$/.test(Live.fmtAgo(Date.now() - 15_000)));
check('fmtAgo(5m ago) == "5m ago"',             Live.fmtAgo(Date.now() - 5 * 60_000) === '5m ago');
check('fmtAgo(2h ago) == "2h ago"',             Live.fmtAgo(Date.now() - 2 * 3600_000) === '2h ago');
check('fmtCountdown(125) == "2m 05s"',          Live.fmtCountdown(125) === '2m 05s');
check('fmtCountdown(0)   == "0m 00s"',          Live.fmtCountdown(0)   === '0m 00s');

/* --------------------------------------------------------------------- */
console.log('\n[3] Seeding the activity log');
Live._seedHistory();
const seeded = Live._log();
check('history seeded with 6 events',           seeded.length === 6, 'got ' + seeded.length);
check('events are sorted newest first',         seeded.every((e, i, a) => i === 0 || a[i-1].at >= e.at));
check('every seeded event has srcId, label',    seeded.every(e => !!e.srcId && !!e.label));
check('no seeded event is HOT',                 seeded.every(e => !e.regId && !e.impact));

/* --------------------------------------------------------------------- */
console.log('\n[4] Live._tick prepends an event');
const beforeLen = Live._log().length;
const events = [];
Live.subscribe(ev => events.push(ev));
Live._tick();
const log1 = Live._log();
check('log grew by exactly 1',                  log1.length === beforeLen + 1);
check('new event is at index 0',                log1[0].at >= log1[1].at);
check('subscriber received the event',          events.length === 1 && events[0] === log1[0]);
check('new event has a tone',                   ['quiet','soft','hot'].indexOf(log1[0].tone) >= 0);
check('new event has fresh timestamp',          (Date.now() - log1[0].at) < 1000);

/* --------------------------------------------------------------------- */
console.log('\n[5] Hot tick injects into DATA.changes');
/* Force a hot pick by stubbing Math.random:
   - first call (picks the event)         -> r > 0.965 lands inside the hot
                                              weight band of EVENTS table
   - second call (HOT_CHANCE gate)        -> r < 0.20  passes the gate    */
const changesBefore = DATA.changes.length;
const origRandom = sandbox.Math.random;
const queue = [0.99, 0.01];
sandbox.Math.random = function () {
  return queue.length ? queue.shift() : origRandom.call(sandbox.Math);
};
let hotSeen = false;
try {
  Live._tick();
  if (DATA.changes.length > changesBefore) hotSeen = true;
  /* Fallback to the original probabilistic loop if the stub didn't take
     (e.g. inlined `Math.random` reference) - keeps the test resilient. */
  for (let i = 0; i < 400 && !hotSeen; i++) {
    Live._tick();
    if (DATA.changes.length > changesBefore) hotSeen = true;
  }
} finally {
  sandbox.Math.random = origRandom;
}
check('eventually a hot tick lands in DATA.changes', hotSeen, 'changes ' + changesBefore + ' -> ' + DATA.changes.length);
if (hotSeen) {
  const fresh = DATA.changes[0];
  check('injected change has live=true',        fresh.live === true);
  check('injected change has regId we know',    !!DATA.indexes.regulations[fresh.regId]);
  check('injected change has detectedAt now',   (Date.now() - new Date(fresh.detectedAt).getTime()) < 60_000);
}

/* --------------------------------------------------------------------- */
console.log('\n[6] Per-second sweep updates the DOM');
const clockEl = sandbox.document.getElementById('live-clock');
const sinceEl = harness.addLiveSince(Date.now() - 32_000);   /* should render "32s ago" */
const nextEl  = harness.addLiveNext('eur-lex');
Live._sweep();
check('clock element updated',                  /^\d{2}:\d{2}:\d{2}$/.test(clockEl.textContent), 'got: ' + clockEl.textContent);
check('relative-time element updated',          /^\d+s ago$/.test(sinceEl.textContent) || sinceEl.textContent === 'just now', 'got: ' + sinceEl.textContent);
check('countdown element seeded',               /^next in \d+m \d{2}s$|^polling…$/.test(nextEl.textContent), 'got: ' + nextEl.textContent);

/* --------------------------------------------------------------------- */
console.log('\n[7] recent(n) returns newest N events');
const r3 = Live.recent(3);
check('recent(3) returns 3 items',              r3.length === 3);
check('recent(3) is newest first',              r3[0].at >= r3[1].at && r3[1].at >= r3[2].at);

/* --------------------------------------------------------------------- */
console.log('\n[8] syncNow forces immediate ticks');
/* The log may already be at its MAX_LOG cap from the earlier hot-event hunt,
   so we can't rely on the length growing. Instead, syncNow MUST leave a
   freshly-timestamped event at the head of the log. */
const headBefore = Live._log()[0];
const headBeforeAt = headBefore ? headBefore.at : 0;
/* Sleep 5ms so the timestamps definitely differ. */
const sleepUntil = Date.now() + 5;
while (Date.now() < sleepUntil) { /* spin */ }
Live.syncNow();
const headAfter = Live._log()[0];
check('syncNow leaves a fresh event at head',   !!headAfter && headAfter.at > headBeforeAt, 'before=' + headBeforeAt + ', after=' + (headAfter ? headAfter.at : 'null'));
check('syncNow head is timestamped now (<1s)',  (Date.now() - headAfter.at) < 1000);

/* --------------------------------------------------------------------- */
console.log('\n[9] Sources view renders the countdown markup');
const sourcesHtml = Views.sources();
check('sources HTML carries [data-live-next]',  /data-live-next="[a-z0-9-]+"/.test(sourcesHtml));
check('sources HTML uses [data-live-since] for last-sync', /data-live-since="\d+"/.test(sourcesHtml));
check('sources HTML shows "next in" placeholder', /next in &mdash;/.test(sourcesHtml));

/* --------------------------------------------------------------------- */
console.log('\n[10] Radar timeline marks fresh items');
/* Push a synthetic "just now" change to confirm the NEW pulse renders. */
DATA.changes.unshift({
  id: 'chg-fresh-test',
  regId: 'reg-ai-act',
  detectedAt: new Date().toISOString(),
  summary: 'Live-engine smoke test',
  impact: 'high',
  articleId: null,
  changeType: 'modify',
  live: true
});
const radarHtml = Views.radar();
check('radar marks fresh row with NEW chip',    radarHtml.indexOf('>NEW<') >= 0);
check('radar fresh row has pulse class',        /live-fresh-pulse/.test(radarHtml));
check('radar carries [data-live-since] timestamps', /data-live-since="\d+"/.test(radarHtml));
/* clean up */
DATA.changes.shift();

console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
process.exit(fail === 0 ? 0 : 1);
