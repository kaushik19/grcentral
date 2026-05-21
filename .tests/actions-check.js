/* ============================================================================
   Preventive-Action lifecycle test suite
   ----------------------------------------------------------------------------
   Covers:
     - enriched Action schema (steps[], evidenceRequirements[],
       expectedDriftReduction, approverId, history[])
     - DATA.actionProgress / DATA.nextBestAction ranking
     - lifecycle: start, toggleStep, attachEvidence (4 kinds),
                  markBlocked, unblock, submitForReview, approve
     - side-effects of approveAction:
         * linked risk closed
         * linked control drift dropped
         * Evidence Vault row written
         * onActionApproved hook fired
     - generateActionsFromRisks bulk-create
     - render: Views.actions() shows hero + groups + KPIs
     - detail modal: Views.openActionDetail renders steps, evidence,
                     history + status-aware buttons
     - Compliance Gaps: "Generate preventive actions" button present
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
  setAttribute() {}, getAttribute() { return ''; }, remove() {}, scrollTop: 0, style: {},
  files: []
});

const sandbox = {
  console,
  document: {
    getElementById: () => fakeEl(),
    querySelector:  () => fakeEl(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement:  () => fakeEl(),
    body: fakeEl()
  },
  lucide:  { createIcons() {} },
  setTimeout: () => 0,
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

let ok = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32mPASS\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
  else      { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
};

/* --------------------------------------------------------------------- */
console.log('\n[1] Action schema is enriched');
check('DATA.actionProgress is a function',          typeof DATA.actionProgress === 'function');
check('DATA.nextBestAction is a function',          typeof DATA.nextBestAction === 'function');
check('DATA.startAction is a function',             typeof DATA.startAction === 'function');
check('DATA.toggleActionStep is a function',        typeof DATA.toggleActionStep === 'function');
check('DATA.attachActionEvidence is a function',    typeof DATA.attachActionEvidence === 'function');
check('DATA.markActionBlocked is a function',       typeof DATA.markActionBlocked === 'function');
check('DATA.unblockAction is a function',           typeof DATA.unblockAction === 'function');
check('DATA.submitActionForReview is a function',   typeof DATA.submitActionForReview === 'function');
check('DATA.approveAction is a function',           typeof DATA.approveAction === 'function');
check('DATA.generateActionsFromRisks is a function',typeof DATA.generateActionsFromRisks === 'function');
check('DATA.onActionApproved is a function',        typeof DATA.onActionApproved === 'function');

const seedActions = DATA.actions;
check('every action has steps[]',                seedActions.every(a => Array.isArray(a.steps)));
check('every action has evidenceRequirements[]', seedActions.every(a => Array.isArray(a.evidenceRequirements)));
check('every action has expectedDriftReduction', seedActions.every(a => typeof a.expectedDriftReduction === 'number'));
check('every action has approverId',             seedActions.every(a => !!a.approverId));
check('every action has history[]',              seedActions.every(a => Array.isArray(a.history)));
check('every action has summary string',         seedActions.every(a => typeof a.summary === 'string'));

const evKinds = {};
seedActions.forEach(a => (a.evidenceRequirements || []).forEach(r => { evKinds[r.kind] = (evKinds[r.kind]||0)+1; }));
check('multiple evidence kinds seeded',          Object.keys(evKinds).length >= 3,
      'kinds=' + JSON.stringify(evKinds));

/* --------------------------------------------------------------------- */
console.log('\n[2] actionProgress maths');
const a1 = DATA.indexes.actions['A-2001'];
const p1 = DATA.actionProgress(a1);
const expDone   = a1.steps.filter(s => s.done).length + a1.evidenceRequirements.filter(r => r.fulfilled).length;
const expTotal  = a1.steps.length + a1.evidenceRequirements.length;
const expPct    = Math.round((expDone/expTotal)*100);
check('progress.stepsDone equals seeded value',  p1.stepsDone === a1.steps.filter(s => s.done).length, p1.stepsDone + ' vs ' + a1.steps.filter(s => s.done).length);
check('progress.percent matches manual calc',    p1.percent === expPct, p1.percent + ' vs ' + expPct);
check('progress.complete only when 100%',        p1.complete === (expDone === expTotal));

/* --------------------------------------------------------------------- */
console.log('\n[3] nextBestAction picks highest impact * severity');
const nb = DATA.nextBestAction();
check('nextBestAction returns an action',        nb && nb.id, 'id=' + (nb && nb.id));
check('nextBestAction is not a closed one',      nb && nb.status !== 'done');
check('nextBestAction has expectedDriftReduction > 0', nb && nb.expectedDriftReduction > 0);

/* --------------------------------------------------------------------- */
console.log('\n[4] startAction transitions planned -> in-progress');
const r4a = DATA.startAction('A-2002', 'priya');
check('startAction returns ok',                  r4a.ok === true);
check('status is now in-progress',               DATA.indexes.actions['A-2002'].status === 'in-progress');
check('startedAt is set',                        !!DATA.indexes.actions['A-2002'].startedAt);
check('history recorded the start',              DATA.indexes.actions['A-2002'].history.some(h => /started/.test(h.what)));

/* --------------------------------------------------------------------- */
console.log('\n[5] toggleActionStep flips done flag + auto-starts');
const r5a = DATA.toggleActionStep('A-2006', 's1', 'rohan');     // planned -> auto-start
check('toggle returns ok',                       r5a.ok === true);
check('step is now done',                        r5a.step.done === true);
check('step.doneAt is set',                      !!r5a.step.doneAt);
check('action auto-transitioned to in-progress', DATA.indexes.actions['A-2006'].status === 'in-progress');
const r5b = DATA.toggleActionStep('A-2006', 's1', 'rohan');     // toggle off
check('toggle off marks step undone',            r5b.step.done === false);
check('toggle off cleared doneAt',               !r5b.step.doneAt);

/* --------------------------------------------------------------------- */
console.log('\n[6] attachActionEvidence by kind');
const r6a = DATA.attachActionEvidence('A-2004', 'e1', { fileName: 'mtls-policy.yaml', fileSize: 500 }, 'vikram');
check('document evidence accepted',              r6a.ok === true && r6a.req.fulfilled === true);
const r6b = DATA.attachActionEvidence('A-2004', 'e2', { text: 'verified the dashboard, no plaintext traffic' }, 'vikram');
check('confirmation evidence accepted',          r6b.ok === true && r6b.req.fulfilled === true);
const r6bad = DATA.attachActionEvidence('A-2004', 'e2', { text: 'no' }, 'vikram');   /* too short, but already fulfilled now */
/* now check link + policy-section flavours on a different action */
const r6c = DATA.attachActionEvidence('A-2005', 'e1', { url: 'https://pagerduty.example/team/eu' }, 'vikram');
check('link evidence accepted (http(s))',        r6c.ok === true && r6c.req.fulfilled === true);
const r6cBad = DATA.attachActionEvidence('A-2002', 'e2', { url: 'javascript:alert(1)' }, 'priya');
check('link evidence rejects non-http url',      r6cBad.ok === false, 'err=' + (r6cBad.error || ''));
const r6d = DATA.attachActionEvidence('A-2008', 'e2', { policyId: 'pol-ai-use', sectionTitle: 'High-risk reviews' }, 'ananya');
check('policy-section evidence accepted',        r6d.ok === true && r6d.req.fulfilled === true);
check('confirmation rejects empty text',         DATA.attachActionEvidence('A-2002', 'e1', { text: '' }).ok === false);
check('document rejects no fileName',            DATA.attachActionEvidence('A-2002', 'e1', { }).ok === false);

/* --------------------------------------------------------------------- */
console.log('\n[7] markActionBlocked + unblockAction');
const r7a = DATA.markActionBlocked('A-2007', 'Waiting on appsec to release the gate rule', 'vikram');
check('markActionBlocked ok',                    r7a.ok === true);
check('status -> blocked',                       DATA.indexes.actions['A-2007'].status === 'blocked');
check('blockedReason captured',                  /appsec/.test(DATA.indexes.actions['A-2007'].blockedReason || ''));
const r7b = DATA.markActionBlocked('A-2007', '');
check('markActionBlocked rejects empty reason',  r7b.ok === false);
const r7c = DATA.unblockAction('A-2007', 'vikram');
check('unblockAction ok',                        r7c.ok === true);
check('status -> in-progress after unblock',     DATA.indexes.actions['A-2007'].status === 'in-progress');

/* --------------------------------------------------------------------- */
console.log('\n[8] submitActionForReview requires 100% progress');
const r8early = DATA.submitActionForReview('A-2002', 'priya');
check('submit refused when not 100%',            r8early.ok === false);

/* --- finish A-2003 properly so we can use it for the approval flow --- */
DATA.toggleActionStep('A-2003', 's3', 'vikram');
DATA.toggleActionStep('A-2003', 's4', 'vikram');
DATA.attachActionEvidence('A-2003', 'e1', { fileName: 'kms-rotation.csv', fileSize: 800 }, 'vikram');
DATA.attachActionEvidence('A-2003', 'e2', { policyId: 'pol-encryption-standard', sectionTitle: 'Encryption at rest' }, 'vikram');
const prog2003 = DATA.actionProgress('A-2003');
check('A-2003 is now 100% complete',             prog2003.complete === true,
      JSON.stringify(prog2003));
const r8late = DATA.submitActionForReview('A-2003', 'vikram');
check('submit accepted at 100%',                 r8late.ok === true);
check('A-2003 status -> review',                 DATA.indexes.actions['A-2003'].status === 'review');
check('A-2003 has submittedAt',                  !!DATA.indexes.actions['A-2003'].submittedAt);

/* --------------------------------------------------------------------- */
console.log('\n[9] approveAction closes risk + drops drift + writes evidence');
let hookFired = null;
DATA.onActionApproved(p => { hookFired = p; });

const beforeDrift   = DATA.indexes.controls['C-DP-014'].drift;
const beforeRisk    = DATA.indexes.risks['R-003'].status;
const beforeEvCount = DATA.evidence.length;

const r9 = DATA.approveAction('A-2003', 'aarav');
check('approveAction returns ok',                r9.ok === true);
check('action status -> done',                   DATA.indexes.actions['A-2003'].status === 'done');
check('action has completedAt + approvedAt',     !!DATA.indexes.actions['A-2003'].completedAt && !!DATA.indexes.actions['A-2003'].approvedAt);
check('linked risk R-003 closed',                DATA.indexes.risks['R-003'].status === 'closed' && beforeRisk !== 'closed');
check('linked risk carries closedById',          DATA.indexes.risks['R-003'].closedById === 'A-2003');
check('linked control drift dropped',            DATA.indexes.controls['C-DP-014'].drift < beforeDrift,
      beforeDrift + ' -> ' + DATA.indexes.controls['C-DP-014'].drift);
check('Evidence Vault gained rows',              DATA.evidence.length > beforeEvCount,
      beforeEvCount + ' -> ' + DATA.evidence.length);
check('written evidence tags actionId',          (r9.evidence || []).every(e => e.actionId === 'A-2003'));
check('onActionApproved hook fired',             hookFired && hookFired.action.id === 'A-2003');
check('hook payload includes driftDropped',      hookFired && typeof hookFired.driftDropped === 'number' && hookFired.driftDropped > 0);

/* re-approval is a no-op */
const r9again = DATA.approveAction('A-2003', 'aarav');
check('re-approval refused (already done)',      r9again.ok === false);

/* --------------------------------------------------------------------- */
console.log('\n[10] generateActionsFromRisks bulk-create');
/* Create a synthetic risk that has no action yet and verify bulk creates one. */
DATA.risks.push({ id: 'R-TEST-1', regId: 'reg-gdpr', controlId: 'C-DR-040', title: 'Test risk for bulk-create', severity: 'high', businessUnitId: 'bu-retail', ownerId: 'ananya', openSince: '2026-05-20', remediationDueDays: 7 });
DATA.indexes.risks['R-TEST-1'] = DATA.risks[DATA.risks.length - 1];
const beforeActions = DATA.actions.length;
const bulk = DATA.generateActionsFromRisks(['R-TEST-1', 'R-003', 'R-007']);   /* R-003/R-007 already have actions */
check('bulk returns ok',                         bulk.ok === true);
check('bulk created exactly 1 new action',       bulk.created.length === 1, 'created ' + bulk.created.length);
check('new action targets R-TEST-1',             bulk.created[0].riskId === 'R-TEST-1');
check('new action has steps[]',                  bulk.created[0].steps.length >= 3);
check('new action has evidence reqs[]',          bulk.created[0].evidenceRequirements.length >= 1);
check('new action has expectedDriftReduction',   bulk.created[0].expectedDriftReduction > 0);
check('DATA.actions grew by 1',                  DATA.actions.length === beforeActions + 1);

/* --------------------------------------------------------------------- */
console.log('\n[11] Views.actions() renders new layout');
const html = Views.actions();
check('actions view has "Preventive Actions" heading', /Preventive Actions/.test(html));
check('view renders Next best action hero',      /Next best action/.test(html));
check('view renders Open actions KPI tile',      /Open actions/.test(html));
check('view renders Awaiting approval KPI tile', /Awaiting approval/.test(html));
check('view renders Projected drift drop KPI',   /Projected drift drop/.test(html));
check('view renders all 5 status groups when filter=all', (function () {
  sandbox.window.__actionFilter = { status: 'all', owner: 'all' };
  const h = Views.actions();
  return /Planned/.test(h) && /In progress/.test(h) && /Blocked/.test(h) && /Awaiting approval/.test(h) && /Done/.test(h);
})());
sandbox.window.__actionFilter = { status: 'open', owner: 'all' };
const html2 = Views.actions();
check('cards show "-N drift" pill',              /-\d+ drift/.test(html2));
check('cards expose openActionDetail handler',   /Views\.openActionDetail/.test(html2));
check('owner filter dropdown is present',        /action-owner-filter/.test(html2));

/* --------------------------------------------------------------------- */
console.log('\n[12] Compliance Gaps: bulk-generate button');
const gapsHtml = Views.gaps();
check('gaps view exposes Generate preventive actions CTA',
      /Generate preventive actions/.test(gapsHtml));
check('CTA wires to Views.generateActionsFromVisibleGaps',
      /Views\.generateActionsFromVisibleGaps/.test(gapsHtml));

/* --------------------------------------------------------------------- */
console.log('\n[13] Action detail modal renders (status-aware)');
/* Render against A-2001 (in-progress with steps/evidence) by capturing
   the html UI.openModal receives. */
let captured = '';
sandbox.UI.openModal = function (html) { captured = html; };
Views.openActionDetail('A-2001');
check('modal captured',                          typeof captured === 'string' && captured.length > 0);
check('modal shows the action title',            /GPAI documentation register/.test(captured));
check('modal shows status badge',                /(In progress|Awaiting approval|Planned|Done|Blocked)/.test(captured));
check('modal shows "-N drift on approval" pill', /drift on approval/.test(captured));
check('modal renders Steps section',             /Steps/.test(captured));
check('modal renders Required evidence section', /Required evidence/.test(captured));
check('modal renders History section',           /History/.test(captured));
check('modal exposes Submit for review button (when in-progress)', /Submit for review/.test(captured) || /Mark blocked/.test(captured));

/* status-aware buttons: render an action in review and confirm "Approve" CTA */
const reviewAction = DATA.indexes.actions['A-2002'];
reviewAction.status = 'review';
captured = '';
Views.openActionDetail('A-2002');
check('review state shows "Approve & close risk" CTA',
      /Approve &amp; close risk|Approve & close risk/.test(captured));

/* status-aware: blocked shows Resume */
DATA.markActionBlocked('A-2010', 'Waiting on legal', 'ananya');
captured = '';
Views.openActionDetail('A-2010');
check('blocked state shows Resume CTA',          /Resume/.test(captured));

/* --------------------------------------------------------------------- */
console.log('\n--------------------------------------------------');
console.log('Result: ', ok + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
