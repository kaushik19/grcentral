/* /api/policies/<id>
 *   GET    → single policy metadata
 *   DELETE → removes both the metadata blob and the binary payload
 *
 * The file URL itself is on Vercel Blob's public CDN, so reading the file
 * never hits this function — only metadata + lifecycle ops do. */

const Storage = require('../_lib/storage.js');

function jsonError(res, status, code, message) {
  res.status(status).json({ ok: false, error: { code: code, message: message } });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type',  'application/json; charset=utf-8');

  if (!Storage.isConfigured()) {
    return res.status(503).json({ ok: false, available: false, error: { code: 'BLOB_NOT_CONFIGURED', message: 'Server-side storage is not configured.' } });
  }

  const id = (req.query && req.query.id) ? String(req.query.id) : '';
  /* Defence in depth: ids we mint look like pol-srv-<base36>-<6-char>. We
   * accept anything that is purely alphanumeric + dashes and short enough,
   * so malicious path traversal can't escape the policies/meta/ prefix. */
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(id)) {
    return jsonError(res, 400, 'BAD_ID', 'Invalid policy id');
  }

  try {
    if (req.method === 'GET') {
      const policy = await Storage.getPolicyMeta(id);
      if (!policy) return jsonError(res, 404, 'NOT_FOUND', 'Policy not found');
      return res.status(200).json({ ok: true, available: true, policy: policy });
    }

    if (req.method === 'DELETE') {
      const removed = await Storage.deletePolicy(id);
      if (!removed) return jsonError(res, 404, 'NOT_FOUND', 'Policy not found');
      return res.status(200).json({ ok: true, available: true, deleted: id });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return jsonError(res, 405, 'METHOD_NOT_ALLOWED', 'Method ' + req.method + ' not allowed');
  } catch (err) {
    const status = err && err.status ? err.status : 500;
    const code   = err && err.code   ? err.code   : 'INTERNAL_ERROR';
    const msg    = err && err.message ? err.message : 'Server error';
    return jsonError(res, status, code, msg);
  }
};
