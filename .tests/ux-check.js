/* Targeted check for this UX round: heal-CIS, beautified charts, new sources
   markup, Add-Source modal wiring. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

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
  lucide: { createIcons() {} },
  setTimeout: () => 0
};
sandbox.window = sandbox;
function MockChart() { return { destroy() {} }; }
MockChart.defaults = { color: '', font: {}, borderColor: '' };
sandbox.Chart = MockChart;
vm.createContext(sandbox);

['assets/js/data.js','assets/js/risk-engine.js','assets/js/components.js','assets/js/views.js','assets/js/app.js']
  .forEach(rel => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel }));

const DATA  = sandbox.DATA;
const Views = sandbox.Views;
const UI    = sandbox.UI;

let ok = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32mPASS\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
  else      { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
};

console.log('\n[A] Data: CIS healed and sources enriched');
const cis = DATA.indexes.sources['cis'];
check('CIS Benchmarks is healthy now',         cis && cis.status === 'healthy', 'status=' + (cis && cis.status));
check('CIS lastSyncMin <= 120',                 cis && cis.lastSyncMin <= 120,   'lastSyncMin=' + (cis && cis.lastSyncMin));
check('Every source has outputFormat',          DATA.sources.every(s => s.outputFormat),     DATA.sources.length + ' sources');
check('Every source has pollInterval',          DATA.sources.every(s => s.pollInterval));
check('Every source has documentsTracked',      DATA.sources.every(s => typeof s.documentsTracked === 'number'));
check('Every source has description',           DATA.sources.every(s => typeof s.description === 'string' && s.description.length > 10));
check('No source has status=degraded',          DATA.sources.every(s => s.status === 'healthy'));

console.log('\n[B] Sources view: new structure + Add source button');
const srcHTML = Views.sources();
check('Sources view contains "Add source" CTA', srcHTML.includes('Add source') && srcHTML.includes('openAddSourceModal'));
check('Sources view shows totals strip',        srcHTML.includes('Feeds') && srcHTML.includes('Documents'));
check('Sources cards show Format',              srcHTML.includes('Format'));
check('Sources cards show Polling',             srcHTML.includes('Polling'));
check('Sources cards show Ingestion',           srcHTML.includes('Ingestion'));
check('Sources cards show document count',      srcHTML.includes('documents tracked'));
check('Sources cards show flags',               srcHTML.includes('\u{1F1EA}\u{1F1FA}') || srcHTML.includes('🇪🇺'));

console.log('\n[C] Chart code: beautified options + helpers');
const v = fs.readFileSync(path.join(ROOT, 'assets/js/views.js'), 'utf8');
check('makeGradient helper present',            v.includes('function makeGradient'));
check('chartOptsTime uses monotone interp',     v.includes("cubicInterpolationMode: 'monotone'"));
check('chartOptsTime uses bordered tooltip',    v.includes("'rgba(255,90,31,0.35)'") || v.includes('rgba(255,90,31,0.35)'));
check('Donut has hoverOffset',                  v.includes('hoverOffset: 10'));
check('Donut has center-label plugin',          v.includes('donutCenterLabel') && v.includes('TOTAL RISKS'));
check('Lines have hover point styling',         v.includes('pointHoverBackgroundColor'));

console.log('\n[D] Add Source: functions exposed on Views');
check('Views.openAddSourceModal exposed',       typeof Views.openAddSourceModal === 'function');
check('Views.verifyAddSource exposed',          typeof Views.verifyAddSource === 'function');
check('Views.saveAddSource exposed',            typeof Views.saveAddSource === 'function');

console.log('\n[E] Add Source: opening the modal does not throw');
let openErr = null;
let modalHTML = '';
const origOpen = UI.openModal;
UI.openModal = (h) => { modalHTML = h; };
try { Views.openAddSourceModal(); } catch (e) { openErr = e; }
UI.openModal = origOpen;
check('openAddSourceModal() did not throw',      !openErr, openErr && openErr.message);
check('modal HTML has Verify button',            modalHTML.includes('Verify source'));
check('modal HTML has disabled Save button',     modalHTML.includes('save-btn') && modalHTML.includes('disabled'));
check('modal HTML has format + polling fields',  modalHTML.includes('src-format') && modalHTML.includes('src-poll'));
check('modal HTML has all 6 source-type options',
  ['Primary law','Guidance','Advisory','Standard / framework','Policy portal','Cyber advisory']
    .every(opt => modalHTML.includes(opt))
);

console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
process.exit(fail === 0 ? 0 : 1);
