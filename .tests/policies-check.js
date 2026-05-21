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
  /* Browser-ish globals the viewer needs : */
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  Buffer: Buffer,
  TextDecoder: global.TextDecoder,
  Blob: global.Blob || class { constructor(parts, opts) { this.parts = parts; this.type = (opts || {}).type || ''; } },
  URL: {
    createObjectURL: () => 'blob:test/' + Math.random().toString(36).slice(2),
    revokeObjectURL: () => {}
  }
};
sandbox.window = sandbox;
function MockChart() { return { destroy() {} }; }
MockChart.defaults = { color: '', font: {}, borderColor: '' };
sandbox.Chart = MockChart;
vm.createContext(sandbox);

['assets/js/data.js','assets/js/risk-engine.js','assets/js/components.js','assets/js/live.js','assets/js/views.js','assets/js/app.js']
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

/* --------------------------------------------------------------------- */
console.log('\n[11] In-app policy viewer');
check('Views.openPolicyViewer is a function',       typeof Views.openPolicyViewer === 'function');
check('every seeded policy now ships sections[]',   seeded.every(p => Array.isArray(p.sections) && p.sections.length > 0));
check('Responsible AI Use Policy has \u00a73 section', (seeded.find(p => p.id === 'pol-ai-use').sections.find(s => s.id === 's3')) != null);
check('Responsible AI Use \u00a73 mentions high-risk', /high-risk/i.test(seeded.find(p => p.id === 'pol-ai-use').sections.find(s => s.id === 's3').body));

const viewerHtmls = [];
UI.openModal = (h) => { viewerHtmls.push(h); };
try { Views.openPolicyViewer('pol-ai-use'); } catch (e) {}
UI.openModal = origOpen;
const vh = viewerHtmls[0] || '';
check('viewer modal opened for seeded policy',      vh.length > 0);
check('viewer header shows policy title',           vh.indexOf('Responsible AI Use Policy') >= 0);
check('viewer header shows owner field',            /kpi-label">Owner/.test(vh));
check('viewer header shows next-review field',      /kpi-label">Next review/.test(vh));
check('viewer renders each section title',          seeded.find(p => p.id === 'pol-ai-use').sections.every(s => vh.indexOf(UI.htmlEscape(s.title)) >= 0));
check('viewer renders \u00a7 numbering',            (vh.match(/\u00a7\d+/g) || []).length >= 6);
check('seeded viewer does NOT contain raw iframe',  vh.indexOf('<iframe') === -1);

/* highlightSectionId path */
const viewerHl = [];
UI.openModal = (h) => { viewerHl.push(h); };
try { Views.openPolicyViewer('pol-ai-use', { highlightSectionId: 's3' }); } catch (e) {}
UI.openModal = origOpen;
const vhl = viewerHl[0] || '';
check('highlight banner appears when called from demo', /requires updating section/.test(vhl));
check('highlight badge appears on the section',     /NEEDS UPDATE/.test(vhl));

/* PDF rendering: valid magic header should produce an iframe + new-tab CTA. */
const pdfOk = DATA.addUserPolicy({
  title:           'Real PDF Policy',
  format:          'pdf',
  fileName:        'real.pdf',
  fileSize:        100,
  mapsToRegulations: ['reg-gdpr']
}, 'JVBERi0xLjQK', 'application/pdf');                                // "%PDF-1.4\n"
const pdfOkViewer = [];
UI.openModal = (h) => { pdfOkViewer.push(h); };
try { Views.openPolicyViewer(pdfOk.policy.id); } catch (e) {}
UI.openModal = origOpen;
const pdfOkH = pdfOkViewer[0] || '';
check('valid PDF opens viewer with an <iframe>',     /<iframe[^>]+blob:/i.test(pdfOkH) || /<iframe[^>]+src="blob:/i.test(pdfOkH) || pdfOkH.indexOf('<iframe') >= 0);
check('valid PDF viewer omits restrictive sandbox',  !/<iframe[^>]*sandbox="allow-same-origin"/i.test(pdfOkH));
check('valid PDF viewer shows "open in new tab" CTA', /open it in a new tab|Open in new tab/i.test(pdfOkH));
DATA.deleteUserPolicy(pdfOk.policy.id);

/* PDF rendering: bad magic header should show a clear warning + no iframe. */
const pdfBad = DATA.addUserPolicy({
  title:           'Fake PDF Policy',
  format:          'pdf',
  fileName:        'fake.pdf',
  fileSize:        20,
  mapsToRegulations: ['reg-gdpr']
}, 'aGVsbG8gd29ybGQ=', 'application/pdf');                            // "hello world"
const pdfBadViewer = [];
UI.openModal = (h) => { pdfBadViewer.push(h); };
try { Views.openPolicyViewer(pdfBad.policy.id); } catch (e) {}
UI.openModal = origOpen;
const pdfBadH = pdfBadViewer[0] || '';
check('invalid PDF viewer does NOT contain an iframe', pdfBadH.indexOf('<iframe') === -1);
check('invalid PDF viewer surfaces a warning',       /does not look like a valid PDF/i.test(pdfBadH));
check('invalid PDF viewer still offers new-tab open', /Try opening it anyway|open it in a new tab/i.test(pdfBadH));
DATA.deleteUserPolicy(pdfBad.policy.id);

/* XSS on viewer: a malicious policy title must NOT leak. */
const xssVw = DATA.addUserPolicy({
  title:       '<img src=x onerror=alert(7)>',
  description: '"><script>alert(7)</script>',
  format:      'markdown',
  fileName:    'evil.md',
  fileSize:    7
}, Buffer.from('# heading\n<script>alert(7)</script>').toString('base64'), 'text/markdown');
check('upload of evil markdown accepted',           xssVw.ok);
const evilViewer = [];
UI.openModal = (h) => { evilViewer.push(h); };
try { Views.openPolicyViewer(xssVw.policy.id); } catch (e) {}
UI.openModal = origOpen;
const evh = evilViewer[0] || '';
check('viewer escapes evil title',                  evh.indexOf('<img src=x onerror=alert(7)>') === -1);
check('viewer escapes script tags in markdown body',evh.indexOf('<script>alert(7)</script>') === -1);
check('viewer markdown still produced a heading',   /<h\d[^>]*>\s*heading/i.test(evh));
DATA.deleteUserPolicy(xssVw.policy.id);

/* --------------------------------------------------------------------- */
console.log('\n[12] No demo-only surfaces leak into production');
check('Views.runDemoScenario is NOT exposed',       typeof Views.runDemoScenario === 'undefined');
check('Views.resetDemoScenario is NOT exposed',     typeof Views.resetDemoScenario === 'undefined');

/* --------------------------------------------------------------------- */
console.log('\n[13] Policy analyzer surface');
check('DATA.analyzePolicy is a function',           typeof DATA.analyzePolicy === 'function');
check('DATA.applyPolicyFindings is a function',     typeof DATA.applyPolicyFindings === 'function');

const empty = DATA.analyzePolicy({}, null, null);
check('analyzer returns findings/summary/projectedDriftDelta keys',
  empty && Array.isArray(empty.findings) && empty.summary && empty.projectedDriftDelta);
check('empty metadata flags missing description (low)',
  empty.findings.some(f => /description/i.test(f.title) && f.severity === 'low'));
check('empty metadata flags missing owner (medium)',
  empty.findings.some(f => /owner/i.test(f.title) && f.severity === 'medium'));
check('empty metadata flags missing approver (medium)',
  empty.findings.some(f => /approver/i.test(f.title) && f.severity === 'medium'));
check('empty metadata flags no regulation mapping (high)',
  empty.findings.some(f => /not mapped/i.test(f.title) && f.severity === 'high'));
check('empty metadata flags no controls linked (medium)',
  empty.findings.some(f => /no technical controls/i.test(f.title) && f.severity === 'medium'));
check('summary tallies match findings',
  empty.summary.total === empty.findings.length &&
  empty.summary.high   === empty.findings.filter(f => f.severity === 'high').length);
check('opensRisks = critical+high count',
  empty.summary.opensRisks === empty.summary.critical + empty.summary.high);

/* Overdue review date should produce a HIGH finding. */
const overdue = DATA.analyzePolicy({
  title:           'My Policy',
  ownerId:         'aarav',
  approverId:      'vikram',
  description:     'A reasonably detailed description of what this policy governs.',
  mapsToRegulations: ['reg-gdpr'],
  implementedByControls: ['C-DR-040'],
  nextReviewDate:  '2020-01-01'
}, null, null);
check('overdue review produces high-severity finding',
  overdue.findings.some(f => /overdue/i.test(f.title) && f.severity === 'high'));

/* Future review within 30 days should be MEDIUM. */
const soon = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
const reviewSoon = DATA.analyzePolicy({
  title: 'My Policy', ownerId: 'aarav', approverId: 'vikram',
  description: 'A reasonably detailed description of what this policy governs.',
  mapsToRegulations: ['reg-gdpr'], implementedByControls: ['C-DR-040'],
  nextReviewDate: soon
}, null, null);
check('review-due-soon produces medium-severity finding',
  reviewSoon.findings.some(f => /due within 30 days/i.test(f.title) && f.severity === 'medium'));

/* Draft status check. */
const draftCheck = DATA.analyzePolicy({
  title: 'Draft policy', status: 'draft', ownerId: 'aarav', approverId: 'vikram',
  description: 'A reasonably detailed description of what this policy governs.',
  mapsToRegulations: ['reg-gdpr'], implementedByControls: ['C-DR-040']
}, null, null);
check('draft status produces low-severity finding',
  draftCheck.findings.some(f => /draft/i.test(f.title) && f.severity === 'low'));

/* Duplicate-title check against seeded catalogue. */
const dup = DATA.analyzePolicy({
  title: 'Data Protection Policy', ownerId: 'aarav', approverId: 'vikram',
  description: 'A reasonably detailed description of what this policy governs.',
  mapsToRegulations: ['reg-gdpr'], implementedByControls: ['C-DR-040']
}, null, null);
check('duplicate title detected (medium)',
  dup.findings.some(f => /overlaps/i.test(f.title) && f.severity === 'medium'));

/* Content-based: short body. */
const short = DATA.analyzePolicy({
  title: 'Tiny Policy', ownerId: 'aarav', approverId: 'vikram',
  description: 'A reasonably detailed description of what this policy governs.',
  mapsToRegulations: ['reg-gdpr'], implementedByControls: ['C-DR-040']
}, Buffer.from('Just a few words.').toString('base64'), 'text/markdown');
check('short content body flagged medium',
  short.findings.some(f => /unusually short/i.test(f.title) && f.severity === 'medium'));

/* Content-based: missing keywords for a mapped regulation. */
const noEnc = DATA.analyzePolicy({
  title: 'Vague GDPR Policy', ownerId: 'aarav', approverId: 'vikram',
  description: 'A reasonably detailed description of what this policy governs.',
  mapsToRegulations: ['reg-gdpr'], implementedByControls: ['C-DR-040']
}, Buffer.from('This policy talks about wellness, lunch hours, and parking. We care about people.').toString('base64'), 'text/markdown');
check('missing GDPR keywords produce a high coverage finding',
  noEnc.findings.some(f => /may not cover key/i.test(f.title) && f.severity === 'high' && /gdpr/i.test(f.title.toLowerCase())));
check('projected drift delta records the GDPR impact',
  (noEnc.projectedDriftDelta['reg-gdpr'] || 0) >= 8);

/* PDF body: analyzer cannot text-extract -> low informational finding. */
const pdfBody = DATA.analyzePolicy({
  title: 'PDF Policy', ownerId: 'aarav', approverId: 'vikram',
  description: 'A reasonably detailed description of what this policy governs.',
  mapsToRegulations: ['reg-gdpr'], implementedByControls: ['C-DR-040']
}, 'JVBERi0xLjQK', 'application/pdf');
check('PDF body produces informational low finding',
  pdfBody.findings.some(f => /pdf body/i.test(f.title) && f.severity === 'low'));

/* --------------------------------------------------------------------- */
console.log('\n[14] applyPolicyFindings opens risks + bumps drift');

const before14 = DATA.risks.length;
const driftBefore = DATA.indexes.controls['C-DR-040'].drift;
const upl = DATA.addUserPolicy({
  title:           'Test Upload Policy',
  ownerId:         'aarav',
  approverId:      'vikram',
  description:     'A reasonably detailed description of what this policy governs.',
  format:          'markdown',
  fileName:        'test.md',
  fileSize:        50,
  mapsToRegulations: ['reg-gdpr'],
  implementedByControls: ['C-DR-040']
}, Buffer.from('This policy talks about wellness. It does not mention encryption.').toString('base64'), 'text/markdown');
check('upload of analyzable policy accepted',       upl.ok);

const ana = DATA.analyzePolicy({
  title:           upl.policy.title,
  ownerId:         upl.policy.ownerId,
  approverId:      upl.policy.approverId,
  description:     upl.policy.description,
  mapsToRegulations: upl.policy.mapsToRegulations,
  implementedByControls: upl.policy.implementedByControls
}, 'VGhpcyBwb2xpY3kgdGFsa3MgYWJvdXQgd2VsbG5lc3MuIEl0IGRvZXMgbm90IG1lbnRpb24gZW5jcnlwdGlvbi4=', 'text/markdown');
check('analysis produced at least one high finding', ana.summary.high >= 1);

const applied = DATA.applyPolicyFindings(upl.policy.id, ana);
check('applyPolicyFindings returns openedRisks array',  Array.isArray(applied.openedRisks));
check('opened at least one risk',                       applied.openedRisks.length >= 1);
check('opened risks tagged with sourcePolicyId',        applied.openedRisks.every(r => r.sourcePolicyId === upl.policy.id));
check('opened risks have severity high/critical',
  applied.openedRisks.every(r => r.severity === 'high' || r.severity === 'critical'));
check('opened risks attached to mapped regulation',
  applied.openedRisks.every(r => r.regId === 'reg-gdpr'));
check('DATA.risks grew by openedRisks count',
  DATA.risks.length === before14 + applied.openedRisks.length);
check('control C-DR-040 drift was bumped',
  DATA.indexes.controls['C-DR-040'].drift > driftBefore);

/* Risk engine should now reflect the change for reg-gdpr. */
const ctx = {
  regulations: DATA.regulations, changes: DATA.changes, controls: DATA.controls,
  risks: DATA.risks, evidence: DATA.evidence, businessUnits: DATA.businessUnits,
  driftHistoryByReg: DATA.driftHistoryByReg
};
const allScores = sandbox.RiskEngine.computeAll(ctx);
const gdprScore = allScores.find(s => s.regId === 'reg-gdpr');
check('risk engine produced a score for GDPR',          gdprScore && typeof gdprScore.score === 'number');
check('GDPR remediation sub-score > 0 after risk added', gdprScore.components.remediation > 0);

/* cleanup */
applied.openedRisks.forEach(r => {
  const i = DATA.risks.indexOf(r);
  if (i >= 0) DATA.risks.splice(i, 1);
});
DATA.deleteUserPolicy(upl.policy.id);

/* --------------------------------------------------------------------- */
console.log('\n[15] Verification panel + clickable KPI tiles');

/* Verification panel HTML emitted from the upload modal. */
const verifModalHTMLs = [];
UI.openModal = (h) => { verifModalHTMLs.push(h); };
try { Views.openUploadPolicyModal(); } catch (e) {}
UI.openModal = origOpen;
const vmh = verifModalHTMLs[0] || '';
check('upload modal exposes "Run checks" button',     /Views\.runPolicyVerification\(\)/.test(vmh));
check('upload modal has verification output region',  /id="pol-verify-out"/.test(vmh));
check('upload modal has save button id (for relabel)', /id="pol-save-btn"/.test(vmh));
check('Views.runPolicyVerification is exported',      typeof Views.runPolicyVerification === 'function');

/* Dashboard KPI tiles should be routable. */
const dashHtml = Views.dashboard(DATA.personas[0]);
check('Open Risks tile routes to gaps',         /Open Risks[\s\S]{0,400}data-route="gaps"|data-route="gaps"[\s\S]{0,400}Open Risks/.test(dashHtml));
check('Aged Evidence tile routes to evidence',  /data-route="evidence"/.test(dashHtml));
check('Reg. changes tile routes to radar',      /data-route="radar"/.test(dashHtml));
check('clickable KPI tiles have hover class',   /kpi-tile-clickable/.test(dashHtml));

/* UI.toast helper. */
check('UI.toast is a function',                 typeof UI.toast === 'function');

/* --------------------------------------------------------------------- */
console.log('\n[16] Framework controls (PO: frameworks = regulations, controls = clauses)');
check('DATA.frameworkControls is an object',          typeof DATA.frameworkControls === 'object');
check('GDPR has framework controls',                  Array.isArray(DATA.frameworkControls['reg-gdpr']) && DATA.frameworkControls['reg-gdpr'].length >= 5);
check('AI Act has framework controls',                Array.isArray(DATA.frameworkControls['reg-ai-act']) && DATA.frameworkControls['reg-ai-act'].length >= 5);
check('NIS2 has framework controls',                  Array.isArray(DATA.frameworkControls['reg-nis2']) && DATA.frameworkControls['reg-nis2'].length >= 3);
check('DORA has framework controls',                  Array.isArray(DATA.frameworkControls['reg-dora']) && DATA.frameworkControls['reg-dora'].length >= 3);
check('every framework control has keywords',
  DATA.allFrameworkControls().every(fc => Array.isArray(fc.keywords) && fc.keywords.length > 0));
check('every framework control has severity in {critical,high,medium,low}',
  DATA.allFrameworkControls().every(fc => ['critical','high','medium','low'].indexOf(fc.severity) >= 0));
check('GDPR Art. 32 is critical',
  DATA.getFrameworkControlById('gdpr-fc-art32').severity === 'critical');
check('getFrameworkControlsForReg returns a copy (mutation-safe)',
  DATA.getFrameworkControlsForReg('reg-gdpr') !== DATA.frameworkControls['reg-gdpr']);

/* --------------------------------------------------------------------- */
console.log('\n[17] scanPolicyCompliance classifies framework controls');
const scanSeed = DATA.scanPolicyCompliance(DATA.getPolicyById('pol-data-protection'));
check('scan returns byFramework[] array',             Array.isArray(scanSeed.byFramework));
check('seeded GDPR policy is scanned against GDPR',
  scanSeed.byFramework.some(b => b.regId === 'reg-gdpr'));
const gdprBlock = scanSeed.byFramework.find(b => b.regId === 'reg-gdpr');
check('GDPR block has total = number of GDPR framework controls',
  gdprBlock && gdprBlock.total === DATA.frameworkControls['reg-gdpr'].length);
check('compliant + partial + missing == total',
  gdprBlock && (gdprBlock.compliant + gdprBlock.partial + gdprBlock.missing === gdprBlock.total));
check('coveragePct is 0..100',
  gdprBlock && gdprBlock.coveragePct >= 0 && gdprBlock.coveragePct <= 100);
check('compliant controls carry evidence section refs',
  gdprBlock.controls.filter(c => c.status === 'compliant').every(c => c.evidenceRefs.length > 0));
check('summary aggregates across frameworks',
  scanSeed.summary.totalControls === scanSeed.byFramework.reduce((s,b)=>s+b.total,0));

/* A deliberately empty policy mapped to GDPR should be ALL missing. */
const emptyPol = {
  id: 'pol-empty-test', title: 'Empty test', description: '',
  mapsToRegulations: ['reg-gdpr'], sections: [], source: 'seeded'
};
const emptyScan = DATA.scanPolicyCompliance(emptyPol);
const emptyGdpr = emptyScan.byFramework.find(b => b.regId === 'reg-gdpr');
check('empty policy → 0 compliant GDPR controls',     emptyGdpr.compliant === 0);
check('empty policy → all GDPR controls missing',     emptyGdpr.missing === emptyGdpr.total);

/* A rich policy mapped to GDPR should hit some controls. */
const richPol = {
  id: 'pol-rich-test',
  title: 'Rich Policy',
  description: 'Comprehensive policy covering encryption, lawful basis, breach notification, dpia.',
  mapsToRegulations: ['reg-gdpr'],
  sections: [
    { id: 's1', num: '1', title: 'Security of processing', body: 'Encryption at rest and in transit per Art. 32. Pseudonymisation enforced where feasible.' },
    { id: 's2', num: '2', title: 'Records of processing activities', body: 'A central ROPA inventory captures every processing activity.' },
    { id: 's3', num: '3', title: 'Breach notification', body: 'Personal data breach notifications are filed within 72 hours.' }
  ],
  source: 'seeded'
};
const richScan = DATA.scanPolicyCompliance(richPol);
const richGdpr = richScan.byFramework.find(b => b.regId === 'reg-gdpr');
check('rich policy covers Art. 32 (compliant)',
  richGdpr.controls.find(c => c.id === 'gdpr-fc-art32').status === 'compliant');
check('rich policy covers Art. 30 (records of processing)',
  richGdpr.controls.find(c => c.id === 'gdpr-fc-art30').status !== 'missing');
check('rich policy covers Art. 33 (breach notification)',
  richGdpr.controls.find(c => c.id === 'gdpr-fc-art33').status !== 'missing');
check('rich policy generates evidence items',         richScan.evidenceItems.length >= 1);
check('evidence items carry frameworkControlId',      richScan.evidenceItems.every(e => !!e.frameworkControlId));
check('evidence items carry a section reference',     richScan.evidenceItems.every(e => !!e.policySectionRef));

/* --------------------------------------------------------------------- */
console.log('\n[18] applyComplianceGaps opens risks + auto-evidence');
const riskBefore = DATA.risks.length;
const evidBefore = DATA.evidence.length;
const uploaded = DATA.addUserPolicy({
  title: 'Partial Cloud Policy',
  ownerId: 'aarav',
  approverId: 'vikram',
  description: 'Cloud security policy with incident-reporting clauses but weak governance.',
  format: 'markdown',
  fileName: 'partial-cloud.md',
  fileSize: 100,
  mapsToRegulations: ['reg-nis2'],
  implementedByControls: ['C-AC-001']
}, Buffer.from('# Partial Cloud Policy\nWe report incidents to the competent authority via an early warning within 24 hours and a full incident reporting filing within 72 hours. The incident handling process is documented but board oversight and explicit accountability matrices are still being defined.').toString('base64'), 'text/markdown');
const sc = DATA.scanPolicyCompliance(uploaded.policy);
const applied2 = DATA.applyComplianceGaps(uploaded.policy.id, sc);
check('applyComplianceGaps returns openedRisks',      Array.isArray(applied2.openedRisks));
check('opens at least one risk for missing NIS2 control',
  applied2.openedRisks.length >= 1);
check('opened risks tag the source policy id',
  applied2.openedRisks.every(r => r.sourcePolicyId === uploaded.policy.id));
check('opened risks carry a frameworkControlId',
  applied2.openedRisks.every(r => !!r.frameworkControlId));
check('opened risks have a gapType in {missing,partial}',
  applied2.openedRisks.every(r => r.gapType === 'missing' || r.gapType === 'partial'));
check('opened risks have a title that mentions the framework code',
  applied2.openedRisks.every(r => /Art\.|Annex|§/.test(r.title)));
check('DATA.risks grew by openedRisks count',
  DATA.risks.length === riskBefore + applied2.openedRisks.length);
check('auto-evidence created for compliant controls',
  DATA.evidence.length === evidBefore + applied2.evidence.length);
if (applied2.evidence.length) {
  check('first auto-evidence has policyId + frameworkControlId + snippet',
    !!applied2.evidence[0].policyId && !!applied2.evidence[0].frameworkControlId && typeof applied2.evidence[0].snippet === 'string');
  check('auto-evidence marked auto=true',
    applied2.evidence.every(e => e.auto === true));
}

/* --------------------------------------------------------------------- */
console.log('\n[19] Compliance Gaps page: Policy + Framework Control columns');
sandbox.window.__gapsFilter = {};
const gapsHtml = Views.gaps();
check('Gaps page heading is "Compliance Gaps"',       gapsHtml.indexOf('Compliance Gaps') >= 0);
check('Gaps page has Framework control column',       gapsHtml.indexOf('Framework control') >= 0);
check('Gaps page surfaces the uploaded policy title',
  gapsHtml.indexOf(uploaded.policy.title) >= 0);
check('Gaps page has framework filter chips',         /All frameworks/.test(gapsHtml));
check('Gaps page renders a Coverage CTA per group',   /openPolicyComplianceModal/.test(gapsHtml));

/* Apply the policy-scoped filter and re-render. */
sandbox.window.__gapsFilter = { policyId: uploaded.policy.id };
const gapsScoped = Views.gaps();
check('policy filter shows the active-filter banner',
  /Showing gaps for policy/.test(gapsScoped));
check('policy filter restricts the rows to that policy',
  gapsScoped.indexOf(uploaded.policy.title) >= 0);
sandbox.window.__gapsFilter = {};

/* --------------------------------------------------------------------- */
console.log('\n[20] Per-policy compliance modal');
check('Views.openPolicyComplianceModal exported',     typeof Views.openPolicyComplianceModal === 'function');
const covHtmls = [];
UI.openModal = (h) => { covHtmls.push(h); };
try { Views.openPolicyComplianceModal(uploaded.policy.id); } catch (e) {}
UI.openModal = origOpen;
const covH = covHtmls[0] || '';
check('coverage modal opened',                        covH.length > 0);
check('coverage modal shows policy title',            covH.indexOf(uploaded.policy.title) >= 0);
check('coverage modal shows framework block (NIS2)',  /NIS2/.test(covH));
check('coverage modal has "Open in Compliance Gaps" CTA',
  /Open in Compliance Gaps|All framework controls compliant/.test(covH));

/* --------------------------------------------------------------------- */
console.log('\n[21] Evidence Vault: policy + framework-control + snippet columns');
const evH = Views.evidence();
check('Evidence Vault has Policy column',             /<th>Policy<\/th>/.test(evH));
check('Evidence Vault has Framework control column',  /<th>Framework control<\/th>/.test(evH));
check('Evidence Vault has Section / snippet column',  /<th>Section \/ snippet<\/th>/.test(evH));
check('auto-derived evidence rendered with chip',     /auto-derived/.test(evH));
check('uploaded policy title appears as evidence source', evH.indexOf(uploaded.policy.title) >= 0);

/* --------------------------------------------------------------------- */
console.log('\n[22] Controls page: framework-controls section');
const ctrlsH2 = Views.controls();
check('Controls page has Framework controls section', /Framework controls/.test(ctrlsH2));
check('Controls page has Operational controls section', /Operational controls/.test(ctrlsH2));
check('Controls page lists GDPR framework controls',  /Art\.\s*32/.test(ctrlsH2));
check('Controls page lists AI Act framework controls', /Annex III|Art\.\s*5/.test(ctrlsH2));

/* cleanup */
applied2.openedRisks.forEach(r => { const i = DATA.risks.indexOf(r); if (i>=0) DATA.risks.splice(i,1); });
applied2.evidence.forEach(e => { const i = DATA.evidence.indexOf(e); if (i>=0) DATA.evidence.splice(i,1); });
DATA.deleteUserPolicy(uploaded.policy.id);

console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
process.exit(fail === 0 ? 0 : 1);
