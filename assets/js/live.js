/* ============================================================================
   Live engine
   ----------------------------------------------------------------------------
   Drives the "real-time" feel of the app without any network calls:

     - A live clock (HH:MM:SS, refreshed every 1000 ms).
     - A rolling activity feed: every 6 to 12 seconds a new poll event is
       generated against the seeded source table. Most events are no-ops
       ("EUR-Lex polled, no changes"); a few are material ("CISA: 1 new
       advisory") and a small minority are HOT (push a new entry into
       DATA.changes, prepend on the Radar with a NEW pulse).
     - Every element annotated with `data-live-since="<unix-ms>"` has its
       text re-written every second to a human relative timestamp
       ("just now", "12s ago", "4m ago", "1h ago").
     - Per-source "next poll in Xm Ys" countdowns on the Sources view.
     - A subscriber bus so any view can react to new events.

   Designed so the module loads cleanly in the Node `vm` sandbox used by
   the test suite : the timers only start when `Live.start()` is called
   explicitly from `app.js` after `DOMContentLoaded`. Tests can drive the
   engine deterministically by calling `Live._tick()` directly.
   ============================================================================ */
window.Live = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Configuration                                                     */
  /* ------------------------------------------------------------------ */
  var CLOCK_INTERVAL_MS   = 1000;
  var TICK_MIN_MS         = 6000;
  var TICK_JITTER_MS      = 6000;
  var MAX_LOG             = 50;
  var HOT_CHANCE          = 0.10;        /* % of ticks that bump DATA.changes */
  var ACTIVITY_RENDER_MAX = 4;           /* rows in sidebar feed              */

  /* ------------------------------------------------------------------ */
  /*  Weighted event table : the realistic, mostly-quiet stream         */
  /* ------------------------------------------------------------------ */
  var EVENTS = [
    /* Quiet polls (~70% combined) */
    { w: 14, srcId: 'eur-lex', label: 'EUR-Lex SPARQL',     detail: 'polled, no changes',                           tone: 'quiet' },
    { w: 10, srcId: 'edpb',    label: 'EDPB',               detail: 'polled, no changes',                           tone: 'quiet' },
    { w:  9, srcId: 'enisa',   label: 'ENISA',              detail: 'polled, no changes',                           tone: 'quiet' },
    { w:  7, srcId: 'ico',     label: 'UK ICO',             detail: 'polled, no changes',                           tone: 'quiet' },
    { w:  7, srcId: 'nist',    label: 'NIST CSRC',          detail: 'API check, no new publications',               tone: 'quiet' },
    { w:  8, srcId: 'cisa',    label: 'CISA',               detail: 'advisory feed polled',                         tone: 'quiet' },
    { w:  5, srcId: 'cert-in', label: 'CERT-In',            detail: 'scraped, no changes',                          tone: 'quiet' },
    { w:  4, srcId: 'owasp',   label: 'OWASP',              detail: 'GitHub poll, no releases',                     tone: 'quiet' },
    { w:  4, srcId: 'cis',     label: 'CIS Benchmarks',     detail: 'version check, no update',                     tone: 'quiet' },
    { w:  3, srcId: 'ec-dig',  label: 'EC Digital Strategy',detail: 'polled, no changes',                           tone: 'quiet' },

    /* Soft events (~25%) : visible but not material */
    { w:  3, srcId: 'cisa',    label: 'CISA',               detail: '1 new advisory (KEV catalog)',                 tone: 'soft' },
    { w:  2, srcId: 'enisa',   label: 'ENISA',              detail: 'threat-landscape report draft updated',        tone: 'soft' },
    { w:  2, srcId: 'nist',    label: 'NIST CSRC',          detail: 'SP 800-53 errata published',                   tone: 'soft' },
    { w:  2, srcId: 'ico',     label: 'UK ICO',             detail: 'guidance updated: cookies & similar tech',     tone: 'soft' },
    { w:  2, srcId: 'cis',     label: 'CIS Benchmarks',     detail: 'Kubernetes v1.8.0 published',                  tone: 'soft' },
    { w:  2, srcId: 'cert-in', label: 'CERT-In',            detail: 'advisory CIVN-2026-0341 published',            tone: 'soft' },

    /* Hot events (~5%) : push into DATA.changes and surface on the Radar */
    { w:  1, srcId: 'eur-lex', label: 'EUR-Lex SPARQL',     detail: 'AI Act Article 53 consolidated version published', tone: 'hot', regId: 'reg-ai-act',          impact: 'high',     articleId: 'art-53', changeType: 'modify' },
    { w:  1, srcId: 'edpb',    label: 'EDPB',               detail: 'Opinion 5/2026: data-portability scope clarified', tone: 'hot', regId: 'reg-edpb-opn-4-2026', impact: 'medium',   articleId: null,     changeType: 'add'    },
    { w:  1, srcId: 'eur-lex', label: 'EUR-Lex SPARQL',     detail: 'DORA RTS: ICT third-party concentration thresholds revised', tone: 'hot', regId: 'reg-dora', impact: 'high', articleId: 'dora-28', changeType: 'modify' }
  ];
  var TOTAL_WEIGHT = EVENTS.reduce(function (s, e) { return s + e.w; }, 0);

  function _pick() {
    var r = Math.random() * TOTAL_WEIGHT;
    var cum = 0;
    for (var i = 0; i < EVENTS.length; i++) {
      cum += EVENTS[i].w;
      if (r <= cum) return EVENTS[i];
    }
    return EVENTS[0];
  }

  /* ------------------------------------------------------------------ */
  /*  Time formatting                                                   */
  /* ------------------------------------------------------------------ */
  function fmtClock(at) {
    var d = new Date(at);
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  }
  function fmtAgo(at) {
    var s = Math.max(0, Math.floor((Date.now() - at) / 1000));
    if (s < 5)      return 'just now';
    if (s < 60)     return s + 's ago';
    if (s < 3600)   return Math.floor(s / 60)  + 'm ago';
    if (s < 86400)  return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
  function fmtCountdown(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    var m = Math.floor(seconds / 60), s = seconds % 60;
    return m + 'm ' + (s < 10 ? '0' + s : s) + 's';
  }

  /* ------------------------------------------------------------------ */
  /*  State                                                             */
  /* ------------------------------------------------------------------ */
  var log         = [];                  /* events, newest first */
  var subscribers = [];
  var started     = false;
  var clockTimer  = null;
  var tickTimer   = null;
  /* Per-source next-poll absolute timestamp (filled lazily) */
  var nextPollAt  = {};

  function _emit(ev) {
    subscribers.forEach(function (fn) {
      try { fn(ev, log); } catch (e) { if (typeof console !== 'undefined') console.warn('Live subscriber threw:', e); }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Public : seed, tick, render                                       */
  /* ------------------------------------------------------------------ */
  function _seedHistory() {
    /* Six backdated events spaced 20-70 seconds apart so the activity tile
       doesn't look empty on first paint. */
    var now = Date.now();
    log = [];
    for (var i = 0; i < 6; i++) {
      var ev = _pick();
      log.push({
        id:     'lv-seed-' + i + '-' + Math.random().toString(36).slice(2, 7),
        at:     now - (i + 1) * (20000 + Math.floor(Math.random() * 50000)),
        srcId:  ev.srcId,
        label:  ev.label,
        detail: ev.detail,
        tone:   ev.tone === 'hot' ? 'soft' : ev.tone,    /* never replay HOT */
        regId:  null,
        impact: null
      });
    }
    log.sort(function (a, b) { return b.at - a.at; });
  }

  function _tick() {
    var pick = _pick();
    var isHot = pick.tone === 'hot' && Math.random() < HOT_CHANCE * 2;   /* dampen hot rate */
    var event = {
      id:     'lv-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      at:     Date.now(),
      srcId:  pick.srcId,
      label:  pick.label,
      detail: pick.detail,
      tone:   pick.tone,
      regId:  isHot ? pick.regId  : null,
      impact: isHot ? pick.impact : null
    };
    log.unshift(event);
    if (log.length > MAX_LOG) log.length = MAX_LOG;

    /* Reset the next-poll countdown for this source. */
    nextPollAt[event.srcId] = Date.now() + (180 + Math.floor(Math.random() * 240)) * 1000;

    /* If this event is HOT, push a real DATA.changes entry so the rest of
       the app (Radar timeline, drift recompute, Top Drift Regulations)
       picks it up on next render. */
    if (isHot && window.DATA && pick.regId && DATA.indexes.regulations[pick.regId]) {
      DATA.changes.unshift({
        id:         'chg-live-' + event.id,
        regId:      pick.regId,
        detectedAt: new Date(event.at).toISOString(),
        summary:    pick.detail,
        impact:     pick.impact || 'medium',
        articleId:  pick.articleId || null,
        changeType: pick.changeType || 'modify',
        live:       true
      });
      DATA.indexes.regulations[pick.regId].lastChange = new Date(event.at).toISOString().slice(0, 10);
    }

    _emit(event);
  }

  /* ------------------------------------------------------------------ */
  /*  Sidebar activity feed renderer                                    */
  /* ------------------------------------------------------------------ */
  function _renderActivityFeed() {
    if (typeof document === 'undefined') return;
    var ul = document.getElementById('live-activity');
    if (!ul) return;
    var rows = log.slice(0, ACTIVITY_RENDER_MAX);
    var safe = function (s) { return (window.UI && UI.htmlEscape) ? UI.htmlEscape(s) : String(s == null ? '' : s); };
    ul.innerHTML = rows.map(function (e, i) {
      var dotColor = e.tone === 'hot' ? '#fb7185' : (e.tone === 'soft' ? '#fbbf24' : '#34d399');
      var fresh    = i === 0 ? ' live-row-fresh' : '';
      return '<li class="flex items-start gap-2 leading-tight' + fresh + '">' +
               '<span class="h-1.5 w-1.5 rounded-full mt-1 flex-shrink-0" style="background:' + dotColor + '"></span>' +
               '<div class="min-w-0">' +
                 '<div class="text-white/80 truncate"><span class="font-semibold">' + safe(e.label) + '</span> <span class="text-white/45">' + safe(e.detail) + '</span></div>' +
                 '<div class="text-white/35 tabular-nums" data-live-since="' + e.at + '">' + safe(fmtAgo(e.at)) + '</div>' +
               '</div>' +
             '</li>';
    }).join('');
  }

  /* ------------------------------------------------------------------ */
  /*  Per-second sweep : clock, relative times, source countdowns        */
  /* ------------------------------------------------------------------ */
  function _sweep() {
    if (typeof document === 'undefined') return;

    var clock = document.getElementById('live-clock');
    if (clock) clock.textContent = fmtClock(Date.now());

    /* Relative-time stamps (used everywhere). */
    var nodes = document.querySelectorAll('[data-live-since]');
    for (var i = 0; i < nodes.length; i++) {
      var at = Number(nodes[i].getAttribute('data-live-since'));
      if (at) nodes[i].textContent = fmtAgo(at);
    }

    /* Per-source countdowns (Sources view). */
    var counts = document.querySelectorAll('[data-live-next]');
    for (var j = 0; j < counts.length; j++) {
      var srcId = counts[j].getAttribute('data-live-next');
      var nxt = nextPollAt[srcId];
      if (!nxt) {
        nxt = Date.now() + (60 + Math.floor(Math.random() * 240)) * 1000;
        nextPollAt[srcId] = nxt;
      }
      var remaining = Math.floor((nxt - Date.now()) / 1000);
      if (remaining <= 0) {
        counts[j].textContent = 'polling…';
        nextPollAt[srcId] = Date.now() + (180 + Math.floor(Math.random() * 240)) * 1000;
      } else {
        counts[j].textContent = 'next in ' + fmtCountdown(remaining);
      }
    }
  }

  function start() {
    if (started || typeof setInterval === 'undefined') return;
    started = true;

    _seedHistory();
    _renderActivityFeed();
    _sweep();

    clockTimer = setInterval(_sweep, CLOCK_INTERVAL_MS);

    function loop() {
      var jitter = TICK_MIN_MS + Math.floor(Math.random() * TICK_JITTER_MS);
      tickTimer = setTimeout(function () {
        _tick();
        _renderActivityFeed();
        loop();
      }, jitter);
    }
    loop();
  }

  function syncNow() {
    /* Force three quick ticks back-to-back, like a manual poll. */
    _tick();
    setTimeout(function () { _tick(); _renderActivityFeed(); }, 350);
    setTimeout(function () { _tick(); _renderActivityFeed(); }, 750);
    _renderActivityFeed();
  }

  function subscribe(fn) { if (typeof fn === 'function') subscribers.push(fn); }

  function recent(n) { return log.slice(0, Math.max(1, n || 4)); }

  /* Inject a custom event into the live feed (used by Preventive Actions
     so closing a risk shows up in the activity tile in real time). */
  function injectEvent(opts) {
    var o = opts || {};
    var event = {
      id:     'lv-' + (o.idHint || Date.now().toString(36)) + Math.random().toString(36).slice(2, 5),
      at:     o.at || Date.now(),
      srcId:  o.srcId || 'system',
      label:  o.label || 'System event',
      detail: o.detail || '',
      tone:   o.tone || 'soft',
      regId:  o.regId || null,
      impact: o.impact || null
    };
    log.unshift(event);
    if (log.length > MAX_LOG) log.length = MAX_LOG;
    try { _renderActivityFeed(); } catch (_) {}
    return event;
  }

  return {
    start:           start,
    syncNow:         syncNow,
    subscribe:       subscribe,
    recent:          recent,
    injectEvent:     injectEvent,
    fmtClock:        fmtClock,
    fmtAgo:          fmtAgo,
    fmtCountdown:    fmtCountdown,
    /* exposed for tests */
    _tick:           _tick,
    _seedHistory:    _seedHistory,
    _renderActivityFeed: _renderActivityFeed,
    _sweep:          _sweep,
    _log:            function () { return log; },
    _nextPollAt:     function () { return nextPollAt; }
  };
})();
