/* /api/policies
 *   GET  → list of every server-hosted policy (newest first)
 *   POST → upload a new policy { meta, base64?, mimeType? } → { policy }
 *
 * Falls back to a 503 with `{ available: false }` whenever
 * BLOB_READ_WRITE_TOKEN is not set, which the client uses as the signal
 * to stay on the localStorage path. */

const Storage = require('./_lib/storage.js');

function jsonError(res, status, code, message) {
  res.status(status).json({ ok: false, error: { code: code, message: message } });
}

module.exports = async function handler(req, res) {
  /* Always JSON, always uncached. The server-side list IS the source of truth
   * for the policies page, so we want browsers to fetch fresh on every call. */
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type',  'application/json; charset=utf-8');

  if (!Storage.isConfigured()) {
    /* Make this discoverable so the client can flip back to local mode
     * with one round-trip instead of poking at multiple endpoints. */
    return res.status(503).json({ ok: false, available: false, error: { code: 'BLOB_NOT_CONFIGURED', message: 'Server-side storage is not configured. Set BLOB_READ_WRITE_TOKEN on Vercel to enable.' } });
  }

  try {
    if (req.method === 'GET') {
      const policies = await Storage.listPolicies();
      return res.status(200).json({ ok: true, available: true, policies: policies });
    }

    if (req.method === 'POST') {
      /* Vercel parses application/json bodies automatically. */
      const body = req.body || {};
      const meta     = body.meta || {};
      const base64   = body.base64 || null;
      const mimeType = body.mimeType || null;
      const policy = await Storage.savePolicy(meta, base64, mimeType);
      return res.status(201).json({ ok: true, available: true, policy: policy });
    }

    res.setHeader('Allow', 'GET, POST');
    return jsonError(res, 405, 'METHOD_NOT_ALLOWED', 'Method ' + req.method + ' not allowed');
  } catch (err) {
    const status = err && err.status ? err.status : 500;
    const code   = err && err.code   ? err.code   : 'INTERNAL_ERROR';
    const msg    = err && err.message ? err.message : 'Server error';
    /* Don't leak stack traces. */
    return jsonError(res, status, code, msg);
  }
};
