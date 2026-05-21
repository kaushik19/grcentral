/* ============================================================================
   Internal-Policies feature test suite
   ----------------------------------------------------------------------------
   Covers: data model, seeded content, in-memory localStorage shim,
   addUserPolicy validation, linkControlToPolicy / getPolicyForControl,
   render of Views.policies() with filters, upload-modal HTML, picker HTML,
   delete + XSS hardening for the new code paths.
   ============================================================================ */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

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
    querySelector:  () => fakeEl(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement:  () => fakeEl()
  },
  lucide:  { createIcons() {} },
  setTimeout: () => 0,
  URL: global.URL
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

/* --------------------------------------------------------------------- */
console.log('\n[1] Seeded policies and data API surface');
check('DATA.getAllPolicies is a function',          typeof DATA.getAllPolicies === 'function');
check('DATA.addUserPolicy is a function',           typeof DATA.addUserPolicy === 'function');
check('DATA.linkControlToPolicy is a function',     typeof DATA.linkControlToPolicy === 'function');
check('DATA.getPolicyForControl is a function',     typeof DATA.getPolicyForControl === 'function');
check('DATA.deleteUserPolicy is a function',        typeof DATA.deleteUserPolicy === 'function');
check('DATA.getPolicyFile is a function',           typeof DATA.getPolicyFile === 'function');
check('DATA.MAX_POLICY_FILE_BYTES = 3 MB',          DATA.MAX_POLICY_FILE_BYTES === 3 * 1024 * 1024);

const seeded = DATA.seededPolicies;
check('6 seeded policies',                          seeded.length === 6, 'got ' + seeded.length);
check('every seeded policy has id, title, version', seeded.every(p => p.id && p.title && p.version));
check('every seeded policy has source = seeded',    seeded.every(p => p.source === 'seeded'));
check('every seeded policy has tags array',         seeded.every(p => Array.isArray(p.tags)));
check('Data Protection Policy present',             !!seeded.find(p => p.id === 'pol-data-protection'));
check('Encryption Standard maps to GDPR',           (seeded.find(p => p.id === 'pol-encryption-standard') || {}).mapsToRegulations.indexOf('reg-gdpr') >= 0);
check('Responsible AI Use Policy maps to AI Act',   (seeded.find(p => p.id === 'pol-ai-use') || {}).mapsToRegulations.indexOf('reg-ai-act') >= 0);
check('Third-Party Risk Policy is draft',           (seeded.find(p => p.id === 'pol-third-party-risk') || {}).status === 'draft');

/* --------------------------------------------------------------------- */
console.log('\n[2] getPolicyForControl resolves seeded mappings');
const pol1 = DATA.getPolicyForControl('C-DR-040');
check('C-DR-040 resolves to Data Protection Policy', pol1 && pol1.id === 'pol-data-protection', 'got: ' + (pol1 && pol1.id));
const pol2 = DATA.getPolicyForControl('C-AI-002');
check('C-AI-002 resolves to Responsible AI Use',     pol2 && pol2.id === 'pol-ai-use', 'got: ' + (pol2 && pol2.id));
const pol3 = DATA.getPolicyForControl('C-IR-007');
check('C-IR-007 resolves to Incident Response Plan', pol3 && pol3.id === 'pol-incident-response', 'got: ' + (pol3 && pol3.id));

/* --------------------------------------------------------------------- */
console.log('\n[3] addUserPolicy: validation, persistence, indexes');
const r1 = DATA.addUserPolicy({}, null, null);
check('rejects empty title',                       !r1.ok && /title/i.test(r1.error || ''), 'got: ' + r1.error);
const r2 = DATA.addUserPolicy({ title: 'X', format: 'exe' }, null, null);
check('rejects unsupported format',                !r2.ok && /format/i.test(r2.error || ''), 'got: ' + r2.error);
const tooBigB64 = 'A'.repeat(5 * 1024 * 1024);
const r3 = DATA.addUserPolicy({ title: 'X', format: 'pdf' }, tooBigB64, 'application/pdf');
check('rejects > 3 MB file',                       !r3.ok && /large/i.test(r3.error || ''), 'got: ' + r3.error);

const beforeCount = DATA.getAllPolicies().length;
const r4 = DATA.addUserPolicy({
  title:           'Cloud Security Standard',
  version:         '0.9',
  ownerId:         'vikram',
  approverId:      'aarav',
  effectiveDate:   '2026-06-01',
  nextReviewDate:  '2027-06-01',
  status:          'draft',
  description:     'Hardening baseline for cloud workloads.',
  format:          'pdf',
  fileName:        'cloud-sec-v0.9.pdf',
  fileSize:        51210,
  mapsToRegulations: ['reg-nis2', 'reg-dora'],
  implementedByControls: ['C-AC-001']
}, 'JVBERi0xLjQK', 'application/pdf');                               // tiny fake PDF base64
check('accepts valid upload',                       r4.ok, r4.ok ? 'id=' + r4.policy.id : ('error=' + r4.error));
check('new policy has source = uploaded',           r4.ok && r4.policy.source === 'uploaded');
check('new policy has hasFile = true',              r4.ok && r4.policy.hasFile === true);
check('new policy preserves draft status',          r4.ok && r4.policy.status === 'draft');
check('new policy has uploadedAt timestamp',        r4.ok && !!r4.policy.uploadedAt);
check('getAllPolicies grew by exactly 1',           DATA.getAllPolicies().length === beforeCount + 1, 'before=' + beforeCount + ', after=' + DATA.getAllPolicies().length);
check('uploaded policy listed first after seeded',  DATA.getAllPolicies()[6].id === r4.policy.id);
const file = DATA.getPolicyFile(r4.policy.id);
check('file payload retrievable from store',        file && file.base64 === 'JVBERi0xLjQK' && file.mimeType === 'application/pdf');

/* --------------------------------------------------------------------- */
console.log('\n[4] linkControlToPolicy + override behaviour');
const before = DATA.getPolicyForControl('C-DP-014');
check('C-DP-014 inherits seeded mapping',           before && before.id === 'pol-encryption-standard', 'got: ' + (before && before.id));
DATA.linkControlToPolicy('C-DP-014', r4.policy.id);
const after = DATA.getPolicyForControl('C-DP-014');
check('explicit user mapping wins',                 after && after.id === r4.policy.id, 'got: ' + (after && after.id));
DATA.linkControlToPolicy('C-DP-014', null);
const restored = DATA.getPolicyForControl('C-DP-014');
check('clearing the link falls back to inferred',   restored && restored.id === 'pol-encryption-standard', 'got: ' + (restored && restored.id));

/* --------------------------------------------------------------------- */
console.log('\n[5] deleteUserPolicy cleans up file + mappings');
DATA.linkControlToPolicy('C-AC-001', r4.policy.id);
const removed = DATA.deleteUserPolicy(r4.policy.id);
check('deleteUserPolicy returns true',              removed);
check('policy no longer findable',                  DATA.getPolicyById(r4.policy.id) === null);
check('file payload also removed',                  DATA.getPolicyFile(r4.policy.id) === null);
check('control mapping unlinked',                   DATA.controlPolicyMap['C-AC-001'] == null);

/* --------------------------------------------------------------------- */
console.log('\n[6] Views.policies() renders with all filters');
const allHtml = Views.policies({ status: 'all', source: 'all' });
check('renders main heading',                       allHtml.indexOf('Internal Policies') >= 0);
check('renders Upload policy CTA',                  allHtml.indexOf('Views.openUploadPolicyModal()') >= 0);
check('shows every seeded policy title',
  seeded.every(p => allHtml.indexOf(UI.htmlEscape(p.title)) >= 0));
check('renders both PUBLISHED and DRAFT badges',    /PUBLISHED/.test(allHtml) && /DRAFT/.test(allHtml));
check('all seeded policies show Seeded badge',      (allHtml.match(/Seeded/g) || []).length >= seeded.length);

const draftHtml = Views.policies({ status: 'draft', source: 'all' });
check('status=draft hides published policies',      draftHtml.indexOf('Data Protection Policy') === -1 && draftHtml.indexOf('Third-Party Risk Management Policy') >= 0);

const uploadedHtml = Views.policies({ status: 'all', source: 'uploaded' });
check('source=uploaded with zero uploads shows empty-state',
  /No policies match/.test(uploadedHtml));

/* --------------------------------------------------------------------- */
console.log('\n[7] Views.controls() now shows linked-policy affordance');
const ctrlHtml = Views.controls();
check('controls view has Linked policy section',    /Linked policy/.test(ctrlHtml));
check('controls view has Change CTA',               /openPolicyPickerModal/.test(ctrlHtml));
check('Encryption Standard appears as linked policy', ctrlHtml.indexOf('Encryption Standard') >= 0);

/* --------------------------------------------------------------------- */
console.log('\n[8] Upload modal renders + has all wiring');
const modalHTMLs = [];
const origOpen = UI.openModal;
UI.openModal = (h) => { modalHTMLs.push(h); };
try { Views.openUploadPolicyModal(); } catch (e) { /* no-op for headless DOM */ }
UI.openModal = origOpen;
const mh = modalHTMLs[0] || '';
check('upload modal opened',                        mh.length > 0);
check('drop-zone present',                          /class="policy-drop"/.test(mh));
check('file input with accept whitelist',           /accept="\.pdf,\.md,\.markdown,\.html,\.htm,\.txt/.test(mh));
check('title input present',                        /id="pol-title"/.test(mh));
check('owner dropdown present',                     /id="pol-owner"/.test(mh));
check('all 11 regulations listed as checkboxes',    (mh.match(/name="pol-regs"/g) || []).length === DATA.regulations.length);
check('all 12 controls listed as checkboxes',       (mh.match(/name="pol-ctrls"/g) || []).length === DATA.controls.length);
check('Save policy button present',                 /Views\.savePolicyUpload\(\)/.test(mh));

/* --------------------------------------------------------------------- */
console.log('\n[9] Picker modal renders for a control');
const pickerHTMLs = [];
UI.openModal = (h) => { pickerHTMLs.push(h); };
try { Views.openPolicyPickerModal('C-DR-040'); } catch (e) {}
UI.openModal = origOpen;
const ph = pickerHTMLs[0] || '';
check('picker modal opened',                        ph.length > 0);
check('picker shows current control id + name',     ph.indexOf('C-DR-040') >= 0 && ph.indexOf('Records of processing activities') >= 0);
check('picker lists every seeded policy',
  seeded.every(p => ph.indexOf(UI.htmlEscape(p.title)) >= 0));
check('picker pre-selects the current policy',
  /policy-pick is-selected" data-pick="pol-data-protection/.test(ph));
check('picker has Clear link button',               /selectPolicyForControl\([^)]*null\)/.test(ph));
check('picker search input present',                /id="pol-pick-search"/.test(ph));

/* --------------------------------------------------------------------- */
console.log('\n[10] XSS hardening of the new code paths');
const evilTitle = '<img src=x onerror=alert(1)>';
const evilDesc  = '"><script>alert(1)</script>';
const evil = DATA.addUserPolicy({
  title:       evilTitle,
  description: evilDesc,
  format:      'pdf',
  fileName:    '<script>alert(1)</script>.pdf',
  fileSize:    100,
  documentUrl: 'javascript:alert(1)'                                 // would-be unsafe URL
}, 'AAAA', 'application/pdf');
check('upload accepted',                            evil.ok);

const html = Views.policies({ status: 'all', source: 'all' });
function stripText(s) { return s.replace(/>[^<]*</g, '><'); }
const DANGEROUS_TAG = /<\s*(?:script|iframe|object|embed|svg|img|link|meta|base|style|form)\b/gi;
const baseline = (Views.policies({ status: 'all', source: 'seeded' }).match(DANGEROUS_TAG) || []).length;
const seen     = (stripText(html).match(DANGEROUS_TAG) || []).length;
check('no new raw dangerous tags vs baseline',     seen <= baseline, 'baseline=' + baseline + ', seen=' + seen);
check('literal payload not present unescaped',     html.indexOf(evilTitle) === -1);
check('literal description not present unescaped', html.indexOf(evilDesc) === -1);
check('no raw javascript: href attribute',         !/\s(?:href|src)\s*=\s*["']?\s*javascript:/i.test(stripText(html)));

/* picker should be safe too */
const pickerEvil = [];
UI.openModal = (h) => { pickerEvil.push(h); };
try { Views.openPolicyPickerModal('C-DR-040'); } catch (e) {}
UI.openModal = origOpen;
const peh = pickerEvil[0] || '';
check('picker doesn\'t leak XSS payload either',   peh.indexOf(evilTitle) === -1 && peh.indexOf(evilDesc) === -1);

/* cleanup */
DATA.deleteUserPolicy(evil.policy.id);

console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
process.exit(fail === 0 ? 0 : 1);
