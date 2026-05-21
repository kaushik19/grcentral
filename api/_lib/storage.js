/* Tiny helper layer around @vercel/blob so the route handlers stay tidy.
 *
 * Layout in Blob storage:
 *   policies/meta/<id>.json       <- metadata (predictable path so we can list/get by id)
 *   policies/files/<id>.<ext>     <- binary payload (PDF / md / html / txt)
 *
 * Everything lives under a single bucket gated by BLOB_READ_WRITE_TOKEN.
 * Files are stored as `access: 'public'` so the browser can <iframe> the URL
 * directly without a signed-URL roundtrip. The metadata path is also public
 * because the whole point of this product is that uploaded policies are
 * visible to every visitor (the toy collaboration story the PO asked for). */

const { put, del, list } = require('@vercel/blob');

const META_PREFIX = 'policies/meta/';
const FILE_PREFIX = 'policies/files/';

const MAX_BYTES = 4 * 1024 * 1024;                                 // 4 MB hard cap (Vercel function body limit is 4.5 MB)
const ALLOWED_FORMATS  = ['pdf', 'markdown', 'html', 'text', 'link'];
const ALLOWED_EXTS     = { pdf: 'pdf', markdown: 'md', html: 'html', text: 'txt', link: '' };
const ALLOWED_MIME     = /^(application\/pdf|text\/markdown|text\/html|text\/plain|application\/octet-stream)$/i;

/* Throws an Error with .status / .code so the route can render a stable
 * JSON envelope without sprinkling try/catch noise everywhere. */
function http(status, code, message) {
  const e = new Error(message);
  e.status = status;
  e.code   = code;
  return e;
}

/* Are we configured to talk to Vercel Blob at all? Lets us fail fast with a
 * 503 instead of letting `put()` throw an opaque "missing token" error. */
function isConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function metaKey(id) { return META_PREFIX + id + '.json'; }
function fileKey(id, format) {
  const ext = ALLOWED_EXTS[format] || 'bin';
  return ext ? FILE_PREFIX + id + '.' + ext : null;
}

/* Server-side validation that mirrors DATA.addUserPolicy. Kept identical so
 * the toast/UI errors look the same whether the upload landed locally or
 * went to the cloud. */
function validateUpload(meta, base64, mimeType) {
  if (!meta || !meta.title || !String(meta.title).trim()) {
    throw http(400, 'TITLE_REQUIRED', 'Title is required');
  }
  const fmt = String(meta.format || 'pdf').toLowerCase();
  if (ALLOWED_FORMATS.indexOf(fmt) === -1) {
    throw http(400, 'BAD_FORMAT', 'Unsupported format (allowed: ' + ALLOWED_FORMATS.join(', ') + ')');
  }
  if (base64) {
    /* Reject anything that isn't a real base64 string before we hand it to Buffer. */
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) {
      throw http(400, 'BAD_PAYLOAD', 'Payload is not valid base64');
    }
    const bytes = Math.ceil((base64.length * 3) / 4);
    if (bytes > MAX_BYTES) {
      throw http(413, 'TOO_LARGE', 'File too large (max ' + (MAX_BYTES / 1024 / 1024) + ' MB)');
    }
    if (mimeType && !ALLOWED_MIME.test(mimeType)) {
      throw http(400, 'BAD_MIME', 'Unsupported MIME type');
    }
  }
  if (fmt === 'link' && meta.documentUrl) {
    const u = String(meta.documentUrl);
    if (!/^https?:\/\//i.test(u)) throw http(400, 'BAD_URL', 'documentUrl must be http(s)');
  }
}

/* Strip control characters from any user-supplied string before we write it
 * back to disk. We escape on render too, but defence-in-depth is cheap. */
function safeStr(s) {
  if (s == null) return '';
  return String(s).replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function makeId() {
  return 'pol-srv-' + (Date.now().toString(36)) + '-' + Math.random().toString(36).slice(2, 8);
}

async function savePolicy(meta, base64, mimeType) {
  validateUpload(meta, base64, mimeType);

  const id  = makeId();
  const fmt = String(meta.format || 'pdf').toLowerCase();

  let fileUrl = null;
  let fileSize = 0;
  if (base64 && fmt !== 'link') {
    const bytes = Buffer.from(base64, 'base64');
    fileSize = bytes.length;
    const key = fileKey(id, fmt);
    const result = await put(key, bytes, {
      access: 'public',
      contentType: mimeType || 'application/octet-stream',
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000
    });
    fileUrl = result.url;
  }

  const policy = {
    id:                    id,
    title:                 safeStr(meta.title),
    version:               safeStr(meta.version) || '1.0',
    status:                meta.status === 'draft' ? 'draft' : 'published',
    ownerId:               meta.ownerId    || null,
    approverId:            meta.approverId || null,
    effectiveDate:         meta.effectiveDate   || new Date().toISOString().slice(0, 10),
    nextReviewDate:        meta.nextReviewDate  || null,
    source:                'server',
    format:                fmt,
    documentUrl:           fmt === 'link' ? (safeStr(meta.documentUrl) || null) : null,
    fileName:              safeStr(meta.fileName) || null,
    fileSize:              fileSize,
    fileUrl:               fileUrl,
    uploadedAt:            new Date().toISOString(),
    description:           safeStr(meta.description),
    mapsToRegulations:     Array.isArray(meta.mapsToRegulations)     ? meta.mapsToRegulations.map(safeStr).filter(Boolean)     : [],
    mapsToArticles:        Array.isArray(meta.mapsToArticles)        ? meta.mapsToArticles.map(safeStr).filter(Boolean)        : [],
    implementedByControls: Array.isArray(meta.implementedByControls) ? meta.implementedByControls.map(safeStr).filter(Boolean) : [],
    attestations:          { required: 0, completed: 0 },
    tags:                  Array.isArray(meta.tags) ? meta.tags.map(safeStr).filter(Boolean).slice(0, 12) : [],
    hasFile:               !!fileUrl
  };

  /* Persist metadata as a tiny JSON blob. */
  await put(metaKey(id), JSON.stringify(policy), {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
    cacheControlMaxAge: 0
  });

  return policy;
}

async function listPolicies() {
  const { blobs } = await list({ prefix: META_PREFIX });
  /* Newest first. Each metadata blob is tiny (~1 KB) so fetching N of them
   * in parallel is fine for the demo scale of < a few hundred uploads. */
  const ordered = (blobs || []).slice().sort(function (a, b) {
    return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
  });
  const out = [];
  await Promise.all(ordered.map(async function (b) {
    try {
      /* `b.downloadUrl` is the public URL, identical to `b.url` for public blobs. */
      const r = await fetch(b.url, { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      out.push(j);
    } catch (_) { /* ignore individual failures */ }
  }));
  out.sort(function (a, b) { return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0); });
  return out;
}

async function getPolicyMeta(id) {
  if (!id) throw http(400, 'ID_REQUIRED', 'id required');
  const { blobs } = await list({ prefix: metaKey(id) });
  const hit = (blobs || []).find(function (b) { return b.pathname === metaKey(id); });
  if (!hit) return null;
  const r = await fetch(hit.url, { cache: 'no-store' });
  if (!r.ok) return null;
  return await r.json();
}

async function deletePolicy(id) {
  if (!id) throw http(400, 'ID_REQUIRED', 'id required');
  /* Find every blob under both prefixes that belongs to this id. We list
   * separately (not by exact key) so the file blob is found regardless of
   * its extension. */
  const [{ blobs: metaHits }, { blobs: fileHits }] = await Promise.all([
    list({ prefix: metaKey(id) }),
    list({ prefix: FILE_PREFIX + id + '.' })
  ]);
  const urls = []
    .concat((metaHits || []).map(function (b) { return b.url; }))
    .concat((fileHits || []).map(function (b) { return b.url; }));
  if (urls.length === 0) return false;
  await del(urls);
  return true;
}

module.exports = {
  isConfigured: isConfigured,
  savePolicy:   savePolicy,
  listPolicies: listPolicies,
  getPolicyMeta: getPolicyMeta,
  deletePolicy: deletePolicy,
  http:         http,
  MAX_BYTES:    MAX_BYTES
};
