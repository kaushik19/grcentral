/* Cloud-storage contract tests.
 *
 *   Layer 1 — Client adapter (cloud-policies.js)
 *     Verifies feature-detection (`ping`), the fetch shapes, list/upload/delete
 *     paths, and that DATA.* falls back to local mode whenever the API is not
 *     available (which is the production behaviour for any deployment without
 *     BLOB_READ_WRITE_TOKEN set).
 *
 *   Layer 2 — Server-side handlers (api/policies.js + api/policies/[id].js)
 *     Loaded with a stubbed @vercel/blob module so we can exercise GET / POST
 *     / DELETE without touching a real bucket.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
let ok = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { ok++; console.log('  \x1b[32mPASS\x1b[0m ' + label + (extra ? '  -- ' + extra : '')); }
  else      { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (extra ? '  -- ' + extra : '')); }
}

/* =====================================================================
 * Layer 1: Client adapter (cloud-policies.js + DATA fallback)
 * ===================================================================== */
console.log('\n[1] Client adapter: ping + isAvailable');

function makeBrowserSandbox(fetchImpl) {
  const sandbox = {
    console,
    document: {
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      addEventListener: () => {}, createElement: () => ({ style: {} })
    },
    lucide: { createIcons() {} },
    fetch: fetchImpl,
    localStorage: (function () {
      const store = {};
      return {
        getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
        setItem(k, v) { store[k] = String(v); },
        removeItem(k) { delete store[k]; }
      };
    })(),
    Buffer,
    URL: global.URL,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    TextDecoder: global.TextDecoder
  };
  sandbox.window = sandbox;
  /* Chart shim - data.js doesn't need it but views.js does when loaded. */
  function MockChart() { return { destroy() {} }; }
  MockChart.defaults = { color: '', font: {}, borderColor: '' };
  sandbox.Chart = MockChart;
  vm.createContext(sandbox);
  return sandbox;
}

function loadInto(sandbox, files) {
  files.forEach(function (rel) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  });
}

/* ---------- 1a. Server says "not configured" (503) ------------------ */
(async function clientNotConfigured() {
  const fetchStub = async (url, opts) => ({
    ok: false, status: 503,
    json: async () => ({ ok: false, available: false, error: { code: 'BLOB_NOT_CONFIGURED', message: 'no token' } })
  });
  const sb = makeBrowserSandbox(fetchStub);
  loadInto(sb, ['assets/js/cloud-policies.js']);
  check('CloudPolicies exposed on window', typeof sb.CloudPolicies === 'object');
  check('CloudPolicies.ping is a function', typeof sb.CloudPolicies.ping === 'function');
  check('CloudPolicies.isAvailable is a function', typeof sb.CloudPolicies.isAvailable === 'function');
  const v = await sb.CloudPolicies.ping();
  check('ping() resolves to false when API returns 503', v === false, 'got: ' + v);
  check('isAvailable() is false after a failed ping', sb.CloudPolicies.isAvailable() === false);
})();

/* ---------- 1b. Server says "configured" (200 + available:true) ------ */
(async function clientConfigured() {
  let getCount = 0;
  const fetchStub = async (url, opts) => {
    if ((!opts || opts.method === 'GET') && /^\/api\/policies$/.test(url)) {
      getCount++;
      return {
        ok: true, status: 200,
        json: async () => ({ ok: true, available: true, policies: [{ id: 'pol-srv-fake-001', title: 'Server policy', source: 'server' }] })
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const sb = makeBrowserSandbox(fetchStub);
  loadInto(sb, ['assets/js/cloud-policies.js']);
  const v = await sb.CloudPolicies.ping();
  check('ping() resolves to true when API is live', v === true);
  check('isAvailable() is true after a successful ping', sb.CloudPolicies.isAvailable() === true);

  /* Single-flight: a second ping should not refetch. */
  const before = getCount;
  await sb.CloudPolicies.ping();
  check('repeat ping() is cached (no extra fetch)', getCount === before, 'getCount stayed at ' + getCount);

  const list = await sb.CloudPolicies.list();
  check('list() returns the server array', Array.isArray(list) && list.length === 1 && list[0].id === 'pol-srv-fake-001');
})();

/* ---------- 1c. Upload happy + error path --------------------------- */
(async function clientUpload() {
  let lastBody = null;
  const fetchStub = async (url, opts) => {
    if (opts && opts.method === 'POST' && url === '/api/policies') {
      lastBody = JSON.parse(opts.body);
      if (!lastBody.meta || !lastBody.meta.title) {
        return { ok: false, status: 400, json: async () => ({ ok: false, error: { code: 'TITLE_REQUIRED', message: 'Title is required' } }) };
      }
      return {
        ok: true, status: 201,
        json: async () => ({ ok: true, policy: { id: 'pol-srv-new-001', title: lastBody.meta.title, source: 'server', fileUrl: 'https://x.public.blob.vercel-storage.com/policies/files/pol-srv-new-001.pdf' } })
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const sb = makeBrowserSandbox(fetchStub);
  loadInto(sb, ['assets/js/cloud-policies.js']);

  const okRes = await sb.CloudPolicies.upload({ title: 'Hello' }, 'JVBERi0xLjQK', 'application/pdf');
  check('upload(ok) returns { ok: true, policy }', okRes.ok === true && okRes.policy && okRes.policy.id === 'pol-srv-new-001');
  check('upload(ok) policy has source = server', okRes.policy && okRes.policy.source === 'server');
  check('upload(ok) policy carries a fileUrl on the blob CDN', okRes.policy && /\.public\.blob\.vercel-storage\.com\//.test(okRes.policy.fileUrl));
  check('upload sends base64 + mimeType in the body', lastBody && lastBody.base64 === 'JVBERi0xLjQK' && lastBody.mimeType === 'application/pdf');

  const failRes = await sb.CloudPolicies.upload({ title: '' }, null, null);
  check('upload(no title) returns { ok: false } with code', failRes.ok === false && failRes.code === 'TITLE_REQUIRED', 'msg=' + failRes.error);
})();

/* ---------- 1d. Delete -------------------------------------------- */
(async function clientDelete() {
  let lastUrl = null;
  let lastMethod = null;
  const fetchStub = async (url, opts) => {
    if (opts && opts.method === 'DELETE') {
      lastUrl = url; lastMethod = opts.method;
      return { ok: true, status: 200, json: async () => ({ ok: true, deleted: 'pol-srv-bye' }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const sb = makeBrowserSandbox(fetchStub);
  loadInto(sb, ['assets/js/cloud-policies.js']);

  const res = await sb.CloudPolicies.remove('pol-srv-bye');
  check('remove() returns { ok: true } on 200', res.ok === true);
  check('remove() sends DELETE to /api/policies/<id>', lastMethod === 'DELETE' && lastUrl === '/api/policies/pol-srv-bye');

  const res2 = await sb.CloudPolicies.remove('');
  check('remove() rejects empty id', res2.ok === false);
})();

/* ---------- 1e. DATA hydration + addServerPolicy fall-through ------ */
(async function dataHydration() {
  let listed = false;
  let posted = null;
  const fetchStub = async (url, opts) => {
    if ((!opts || opts.method === 'GET') && url === '/api/policies') {
      listed = true;
      return {
        ok: true, status: 200,
        json: async () => ({ ok: true, available: true, policies: [
          { id: 'pol-srv-fake-A', title: 'Server policy A', source: 'server', tags: [], format: 'pdf', mapsToRegulations: ['reg-gdpr'], implementedByControls: [], fileUrl: 'https://x.public.blob.vercel-storage.com/policies/files/pol-srv-fake-A.pdf', uploadedAt: new Date().toISOString() }
        ] })
      };
    }
    if (opts && opts.method === 'POST' && url === '/api/policies') {
      posted = JSON.parse(opts.body);
      return {
        ok: true, status: 201,
        json: async () => ({ ok: true, policy: { id: 'pol-srv-fake-B', title: posted.meta.title, source: 'server', tags: [], format: 'pdf', mapsToRegulations: posted.meta.mapsToRegulations || [], implementedByControls: posted.meta.implementedByControls || [], fileUrl: 'https://x.public.blob.vercel-storage.com/policies/files/pol-srv-fake-B.pdf', uploadedAt: new Date().toISOString() } })
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const sb = makeBrowserSandbox(fetchStub);
  loadInto(sb, ['assets/js/data.js', 'assets/js/cloud-policies.js']);

  /* Before refresh: server policies are empty. */
  check('DATA.getServerPolicies starts empty', sb.DATA.getServerPolicies().length === 0);

  /* Hydrate. */
  const refreshed = await sb.DATA.refreshServerPolicies();
  check('refreshServerPolicies() hits the API', listed === true);
  check('refreshServerPolicies() populates the cache', Array.isArray(refreshed) && refreshed.length === 1);
  check('getServerPolicies() returns the hydrated rows', sb.DATA.getServerPolicies().length === 1);
  check('getAllPolicies() merges server in between seeded + uploaded',
    sb.DATA.getAllPolicies().some(p => p.id === 'pol-srv-fake-A'));

  /* Add. */
  const added = await sb.DATA.addServerPolicy({ title: 'New server policy', mapsToRegulations: ['reg-nis2'], implementedByControls: [] }, null, null);
  check('addServerPolicy returns { ok, policy }', added.ok === true && added.policy && added.policy.id === 'pol-srv-fake-B');
  check('addServerPolicy ingested into the local cache', sb.DATA.getServerPolicies().some(p => p.id === 'pol-srv-fake-B'));
  check('POST body carried the meta',
    posted && posted.meta && posted.meta.title === 'New server policy' && Array.isArray(posted.meta.mapsToRegulations));

  /* Delete. */
  const fetchDelStub = async (url, opts) => {
    if (opts && opts.method === 'DELETE') return { ok: true, status: 200, json: async () => ({ ok: true }) };
    return { ok: false, status: 404, json: async () => ({}) };
  };
  sb.fetch = fetchDelStub;
  const deleted = await sb.DATA.deleteServerPolicy('pol-srv-fake-B');
  check('deleteServerPolicy returns true on 200', deleted === true);
  check('deleteServerPolicy evicts from the cache', !sb.DATA.getServerPolicies().some(p => p.id === 'pol-srv-fake-B'));
})();

/* ---------- 1f. Deterministic re-derive on hydration -------------- */
(async function dataReDerive() {
  /* The point of this test: visitor B should see the same Compliance Gaps
     as visitor A even though only the *policy* is persisted on Blob (not
     the derived risks). We confirm hydration triggers applyComplianceGaps
     and that DELETE evicts the derived risks/evidence. */
  const serverPolicy = {
    id: 'pol-srv-fake-C',
    title: 'Cross-Visitor Policy',
    description: 'Test policy that maps to NIS2 with weak coverage.',
    source: 'server',
    format: 'markdown',
    tags: [],
    sections: [],
    mapsToRegulations: ['reg-nis2'],
    implementedByControls: [],
    fileUrl: 'https://x.public.blob.vercel-storage.com/policies/files/pol-srv-fake-C.md',
    uploadedAt: new Date().toISOString()
  };
  let respondWith = [serverPolicy];
  const fetchStub = async (url, opts) => {
    if ((!opts || opts.method === 'GET') && url === '/api/policies') {
      return { ok: true, status: 200, json: async () => ({ ok: true, available: true, policies: respondWith }) };
    }
    if (opts && opts.method === 'DELETE') {
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const sb = makeBrowserSandbox(fetchStub);
  loadInto(sb, ['assets/js/data.js', 'assets/js/cloud-policies.js']);

  const risksBefore = sb.DATA.risks.length;
  await sb.DATA.refreshServerPolicies();
  const risksAfter  = sb.DATA.risks.length;
  check('hydration creates derived risks for server policies', risksAfter > risksBefore, 'before=' + risksBefore + ', after=' + risksAfter);
  check('every derived risk tags sourcePolicyId',
    sb.DATA.risks.filter(r => r.sourcePolicyId === 'pol-srv-fake-C').length > 0);

  /* Calling again should NOT duplicate risks (alreadyDerived guard). */
  await sb.DATA.refreshServerPolicies();
  check('repeat hydration does not duplicate risks',
    sb.DATA.risks.length === risksAfter, 'risks=' + sb.DATA.risks.length);

  /* Delete : derived rows should go away too. */
  await sb.DATA.deleteServerPolicy('pol-srv-fake-C');
  check('after delete, no risks tag the removed policy',
    sb.DATA.risks.every(r => r.sourcePolicyId !== 'pol-srv-fake-C'));
  check('after delete, no evidence rows tag the removed policy',
    sb.DATA.evidence.every(e => e.policyId !== 'pol-srv-fake-C'));
})();

/* =====================================================================
 * Layer 2: Server-side handlers
 *   Stub @vercel/blob, then load api/_lib/storage.js + api/policies.js +
 *   api/policies/[id].js via require() so the handler functions execute
 *   inside Node natively.
 * ===================================================================== */
async function runServerTests() {
console.log('\n[2] Server handlers: GET/POST/DELETE with stubbed @vercel/blob');

/* Build a stub blob store. */
const blobStore = {};                                              // path -> { contents, contentType, url }
const stub = {
  put: async (key, body, opts) => {
    const url = 'https://stub.public.blob.vercel-storage.com/' + key;
    blobStore[key] = { contents: body, contentType: (opts && opts.contentType) || 'application/octet-stream', url };
    return { url, pathname: key, contentType: blobStore[key].contentType };
  },
  list: async (opts) => {
    const prefix = (opts && opts.prefix) || '';
    const blobs = Object.keys(blobStore)
      .filter(k => k.startsWith(prefix))
      .map(k => ({ pathname: k, url: blobStore[k].url, uploadedAt: new Date().toISOString() }));
    return { blobs };
  },
  del: async (urls) => {
    const arr = Array.isArray(urls) ? urls : [urls];
    arr.forEach(u => {
      const key = Object.keys(blobStore).find(k => blobStore[k].url === u);
      if (key) delete blobStore[key];
    });
  },
  head: async () => null
};

/* Stub the @vercel/blob package via the module loader before requiring. */
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === '@vercel/blob') return '@vercel/blob/stub';
  return origResolve.call(this, request, parent, ...rest);
};
require.cache['@vercel/blob/stub'] = { id: '@vercel/blob/stub', filename: '@vercel/blob/stub', exports: stub, loaded: true };

/* fetch() inside Storage.listPolicies/getPolicyMeta must read back the
   stub URLs. Patch global.fetch to read from blobStore. */
const origFetch = global.fetch;
global.fetch = async function (url) {
  const key = Object.keys(blobStore).find(k => blobStore[k].url === url);
  if (!key) return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
  const entry = blobStore[key];
  const isJson = entry.contentType && entry.contentType.indexOf('json') >= 0;
  return {
    ok: true, status: 200,
    json: async () => isJson ? JSON.parse(entry.contents.toString()) : null,
    text: async () => entry.contents.toString()
  };
};

/* Token = configured. */
process.env.BLOB_READ_WRITE_TOKEN = 'stub-token';

/* Clear require caches for our modules so they pick up the stub. */
['./../api/_lib/storage.js', './../api/policies.js', './../api/policies/[id].js'].forEach(p => {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
});

const policiesRoute = require('../api/policies.js');
const policyIdRoute = require('../api/policies/[id].js');

function mockRes() {
  const res = {
    _status: 200, _headers: {}, _body: null, _ended: false,
    status(s) { this._status = s; return this; },
    setHeader(k, v) { this._headers[k] = v; },
    json(obj) { this._body = obj; this._ended = true; return this; }
  };
  return res;
}

/* ---- 2a. GET /api/policies (empty) ---- */
{
  const res = mockRes();
  await policiesRoute({ method: 'GET', query: {} }, res);
  check('GET /api/policies returns 200 when configured', res._status === 200, 'status=' + res._status);
  check('GET /api/policies returns ok:true and empty policies[]',
    res._body && res._body.ok === true && Array.isArray(res._body.policies) && res._body.policies.length === 0);
  check('GET sets available: true', res._body && res._body.available === true);
}

/* ---- 2b. POST /api/policies (invalid: no title) ---- */
{
  const res = mockRes();
  await policiesRoute({ method: 'POST', query: {}, body: { meta: {} } }, res);
  check('POST /api/policies rejects missing title (400)', res._status === 400, 'status=' + res._status);
  check('POST error carries code TITLE_REQUIRED',
    res._body && res._body.error && res._body.error.code === 'TITLE_REQUIRED');
}

/* ---- 2c. POST /api/policies (happy path with file) ---- */
{
  const meta = {
    title: 'Server Test Policy',
    version: '1.0',
    description: 'Tested in cloud-check.js',
    format: 'pdf',
    fileName: 'test.pdf',
    mapsToRegulations: ['reg-gdpr'],
    implementedByControls: ['C-DR-040'],
    tags: ['test']
  };
  const base64 = Buffer.from('%PDF-1.4\n%%EOF\n').toString('base64');
  const res = mockRes();
  await policiesRoute({ method: 'POST', query: {}, body: { meta, base64, mimeType: 'application/pdf' } }, res);
  check('POST happy path returns 201', res._status === 201, 'status=' + res._status);
  check('POST returns ok:true with a policy object', res._body && res._body.ok === true && res._body.policy);
  check('Returned policy has source=server', res._body && res._body.policy && res._body.policy.source === 'server');
  check('Returned policy has a Blob CDN fileUrl',
    res._body && res._body.policy && /stub\.public\.blob\.vercel-storage\.com/.test(res._body.policy.fileUrl));
  check('Returned policy has the hasFile flag', res._body && res._body.policy && res._body.policy.hasFile === true);
  check('Returned policy preserved mapsToRegulations',
    res._body && res._body.policy && Array.isArray(res._body.policy.mapsToRegulations) && res._body.policy.mapsToRegulations[0] === 'reg-gdpr');
  /* Blob store now has two keys for this id. */
  const id = res._body.policy.id;
  const metaKey = 'policies/meta/' + id + '.json';
  const fileKey = 'policies/files/' + id + '.pdf';
  check('Blob store has metadata at policies/meta/<id>.json', !!blobStore[metaKey]);
  check('Blob store has file at policies/files/<id>.pdf',     !!blobStore[fileKey]);
  /* Stash id for downstream tests. */
  global.__lastServerId = id;
}

/* ---- 2d. GET /api/policies (now non-empty) ---- */
{
  const res = mockRes();
  await policiesRoute({ method: 'GET', query: {} }, res);
  check('GET after POST returns 1 policy',
    res._body && Array.isArray(res._body.policies) && res._body.policies.length === 1);
}

/* ---- 2e. GET /api/policies/<id> ---- */
{
  const id = global.__lastServerId;
  const res = mockRes();
  await policyIdRoute({ method: 'GET', query: { id } }, res);
  check('GET /api/policies/<id> returns 200', res._status === 200);
  check('GET /api/policies/<id> returns the same policy',
    res._body && res._body.policy && res._body.policy.id === id);
}

/* ---- 2f. GET /api/policies/<bogus> (404) ---- */
{
  const res = mockRes();
  await policyIdRoute({ method: 'GET', query: { id: 'pol-srv-doesntexist-zzz' } }, res);
  check('GET /api/policies/<missing> returns 404', res._status === 404);
}

/* ---- 2g. Path-traversal id is rejected (400) ---- */
{
  const res = mockRes();
  await policyIdRoute({ method: 'GET', query: { id: '../../etc/passwd' } }, res);
  check('Invalid id (path traversal) returns 400', res._status === 400);
}

/* ---- 2h. Oversized base64 is rejected (413) ---- */
{
  const huge = 'A'.repeat(5 * 1024 * 1024 * 4 / 3 + 4);             // > 4 MB after decode
  const res = mockRes();
  await policiesRoute({ method: 'POST', query: {}, body: { meta: { title: 'big' }, base64: huge, mimeType: 'application/pdf' } }, res);
  check('Oversized payload returns 413', res._status === 413, 'status=' + res._status);
  check('Oversized payload error code = TOO_LARGE',
    res._body && res._body.error && res._body.error.code === 'TOO_LARGE');
}

/* ---- 2i. DELETE /api/policies/<id> ---- */
{
  const id = global.__lastServerId;
  const res = mockRes();
  await policyIdRoute({ method: 'DELETE', query: { id } }, res);
  check('DELETE /api/policies/<id> returns 200', res._status === 200);
  check('DELETE removed metadata blob', !blobStore['policies/meta/' + id + '.json']);
  check('DELETE removed file blob',     !blobStore['policies/files/' + id + '.pdf']);
}

/* ---- 2j. DELETE missing id (404) ---- */
{
  const res = mockRes();
  await policyIdRoute({ method: 'DELETE', query: { id: 'pol-srv-gone-zzz' } }, res);
  check('DELETE of missing policy returns 404', res._status === 404);
}

/* ---- 2k. Wrong method on /api/policies ---- */
{
  const res = mockRes();
  await policiesRoute({ method: 'PUT', query: {}, body: {} }, res);
  check('PUT /api/policies returns 405', res._status === 405);
}

/* ---- 2l. Not configured (no token) ---- */
{
  delete process.env.BLOB_READ_WRITE_TOKEN;
  /* Reload the modules so they re-read the env. */
  delete require.cache[require.resolve('../api/_lib/storage.js')];
  delete require.cache[require.resolve('../api/policies.js')];
  delete require.cache[require.resolve('../api/policies/[id].js')];
  const route  = require('../api/policies.js');
  const route2 = require('../api/policies/[id].js');
  const res = mockRes();
  await route({ method: 'GET', query: {} }, res);
  check('Without BLOB_READ_WRITE_TOKEN, GET /api/policies returns 503', res._status === 503);
  check('503 response carries available: false', res._body && res._body.available === false);
  check('503 error code is BLOB_NOT_CONFIGURED',
    res._body && res._body.error && res._body.error.code === 'BLOB_NOT_CONFIGURED');
  const res2 = mockRes();
  await route2({ method: 'GET', query: { id: 'anything' } }, res2);
  check('Without token, GET /api/policies/<id> also 503', res2._status === 503);
}

/* ---- 2m. Path-traversal id is rejected even before token check fails ---- */
{
  process.env.BLOB_READ_WRITE_TOKEN = 'stub-token';
  delete require.cache[require.resolve('../api/policies/[id].js')];
  const route = require('../api/policies/[id].js');
  const res = mockRes();
  await route({ method: 'DELETE', query: { id: '../meta/x' } }, res);
  check('DELETE with invalid id returns 400 (not 500)', res._status === 400);
}

/* Restore globals. */
Module._resolveFilename = origResolve;
global.fetch = origFetch;
delete process.env.BLOB_READ_WRITE_TOKEN;

}                                                                  /* end runServerTests */

(async function main() {
  /* Force the Layer-1 microtasks to drain before Layer 2 starts (and before
     we print the summary). The IIFEs above are already async so we use a
     small delay. */
  await new Promise(r => setTimeout(r, 250));
  await runServerTests();
  console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
  process.exit(fail === 0 ? 0 : 1);
})();
