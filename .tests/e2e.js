/* End-to-end check: load every JS file in a sandboxed VM with mocked browser
   globals, render every Views.* function, and assert the output is non-empty
   and contains the expected markers. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const files = [
  'assets/js/data.js',
  'assets/js/risk-engine.js',
  'assets/js/components.js',
  'assets/js/views.js',
  'assets/js/app.js'
];

let ok = 0, fail = 0;
const pass   = (msg)      => { ok++; console.log('  \x1b[32mPASS\x1b[0m ' + msg); };
const failed = (msg, err) => { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + msg + (err ? '  -- ' + err.message : '')); };

const fakeEl = () => ({
  innerHTML: '', textContent: '', value: '', disabled: false,
  classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {}, removeEventListener() {}, appendChild() {},
  querySelector() { return fakeEl(); }, querySelectorAll() { return []; },
  focus() {}, getContext() { return {}; },
  getBoundingClientRect() { return { width: 600, height: 200 }; },
  setAttribute() {}, getAttribute() { return ''; }, remove() {}, scrollTop: 0, style: {}
});

const sandbox = {
  console,
  document: {
    getElementById: () => fakeEl(),
    querySelector: () => fakeEl(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => fakeEl()
  },
  lucide: { createIcons() {} }
};
sandbox.window = sandbox;
function MockChart() { return { destroy() {} }; }
MockChart.defaults = { color: '', font: {}, borderColor: '' };
sandbox.Chart = MockChart;

vm.createContext(sandbox);

console.log('\n[1/4] Static-load every JS module ...');
files.forEach(rel => {
  try {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
    pass('loaded ' + rel);
  } catch (err) {
    failed('loaded ' + rel, err);
  }
});

const DATA  = sandbox.DATA;
const RE    = sandbox.RiskEngine;
const Views = sandbox.Views;

console.log('\n[2/4] Validate dataset and risk engine ...');
try {
  const must = ['regulations','personas','sources','controls','changes','risks','evidence','actions','businessUnits','driftHistoryByReg','indexes'];
  must.forEach(k => { if (!DATA[k]) throw new Error('missing DATA.' + k); });
  pass('DATA exposes ' + must.length + ' keys');
  if (DATA.regulations.length < 10) throw new Error('expected >=10 regulations, got ' + DATA.regulations.length);
  pass(DATA.regulations.length + ' regulations seeded');
  const aiAct = DATA.indexes.regulations['reg-ai-act'];
  if (!aiAct || aiAct.celex !== '32024R1689') throw new Error('AI Act CELEX mismatch');
  pass('AI Act CELEX = 32024R1689 (matches EUR-Lex)');
  if (!DATA.driftHistoryByReg['reg-ai-act'] || DATA.driftHistoryByReg['reg-ai-act'].length !== 90)
    throw new Error('expected 90-day history per regulation');
  pass('90-day drift history present for every regulation');
} catch (err) { failed('dataset shape', err); }

try {
  const ctx = {
    regulations: DATA.regulations, controls: DATA.controls, risks: DATA.risks,
    changes: DATA.changes, evidence: DATA.evidence, actions: DATA.actions,
    businessUnits: DATA.businessUnits, driftHistoryByReg: DATA.driftHistoryByReg
  };
  const scores = RE.computeAll(ctx);
  if (scores.length !== DATA.regulations.length) throw new Error('scores count mismatch');
  scores.forEach(s => {
    if (s.score < 0 || s.score > 100) throw new Error('score out of band for ' + s.regId + ': ' + s.score);
    if (!['stable','elevated','high','critical'].includes(s.band)) throw new Error('bad band ' + s.band);
    if (s.trend < 0.7 || s.trend > 1.5) throw new Error('trend not clamped: ' + s.trend);
    Object.values(s.components).forEach(v => {
      if (v < 0 || v > 100) throw new Error('component out of 0..100: ' + v);
    });
  });
  pass('Risk Drift formula produces valid scores for every regulation');
  const ent = RE.rollUpEnterprise(scores);
  if (ent.score < 0 || ent.score > 100) throw new Error('enterprise out of band');
  pass('Enterprise rollup ' + ent.score + ' (' + ent.band + ')');
} catch (err) { failed('risk engine sanity', err); }

console.log('\n[3/4] Render every view ...');
const renderTargets = [
  ['dashboard',         () => Views.dashboard(DATA.personas[0]),       ['Enterprise compliance posture','Drift composition','Top drift regulations','Risk by category','Risk heatmap','Upcoming reviews']],
  ['radar',             () => Views.radar(),                            ['Regulatory Radar','Most active regulations','Source health']],
  ['regulation/ai-act', () => Views.regulationDetail('reg-ai-act'),     ['EU Artificial Intelligence Act','Article-level diff','32024R1689']],
  ['regulation/gdpr',   () => Views.regulationDetail('reg-gdpr'),       ['General Data Protection Regulation','Article 32']],
  ['drift',             () => Views.drift(),                            ['Risk Drift','Per-regulation breakdown','TrendMultiplier']],
  ['gaps',              () => Views.gaps(),                             ['Compliance Gaps','Critical','High']],
  ['actions',           () => Views.actions(),                          ['Preventive Actions','Planned','In progress','Done']],
  ['evidence',          () => Views.evidence(),                         ['Evidence Vault','Expired','Healthy']],
  ['controls',          () => Views.controls(),                         ['Controls Library','Maturity']],
  ['team',              () => Views.team(),                             ['Aarav Mehta','Priya Sharma','Ananya Reddy']],
  ['sources',           () => Views.sources(),                          ['EUR-Lex','EDPB','ENISA','NIST','CISA','CERT-In']],
  ['about',             () => Views.about(),                            ['Risk Drift formula','RegulationImpact','TrendMultiplier']]
];

renderTargets.forEach(arr => {
  const label = arr[0], fn = arr[1], must = arr[2];
  try {
    const html = fn();
    if (!html || html.length < 200) throw new Error('output too small (' + (html ? html.length : 0) + ' chars)');
    const missing = must.filter(s => !html.includes(s));
    if (missing.length) throw new Error('missing markers: ' + missing.join(', '));
    pass('view ' + label.padEnd(20) + ' (' + html.length + ' chars, all ' + must.length + ' markers present)');
  } catch (err) {
    failed('view ' + label, err);
  }
});

console.log('\n[4/4] Validate chart mounting (no missing canvas wrappers, helpers callable) ...');
try {
  /* Render dashboard, then run mountCharts('dashboard') on the (mock) DOM.
     Should NOT throw. */
  const html = Views.dashboard(DATA.personas[0]);
  if (!html.includes('position: relative; height: 240px;')) throw new Error('chart-trend not wrapped');
  if (!html.includes('chart-risk-category')) throw new Error('risk-category canvas missing');
  pass('chart-trend wrapped in 240px container');
  pass('chart-risk-category canvas present');
  Views.mountCharts('dashboard');
  pass('mountCharts("dashboard") executed without error');
  Views.mountCharts('drift');
  pass('mountCharts("drift") executed without error');
  Views.mountCharts('regulation/reg-ai-act');
  pass('mountCharts("regulation/reg-ai-act") executed without error');
} catch (err) { failed('chart mounting', err); }

console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
process.exit(fail === 0 ? 0 : 1);
