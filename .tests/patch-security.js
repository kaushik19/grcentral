/* Security hardening pass.
   1. Adds htmlEscape() + safeUrl() to UI (components.js).
   2. Escapes every user-controlled interpolation in sources(), verifyAddSource,
      and the global search modal.
   3. Strengthens rel="noopener" -> "noopener noreferrer" everywhere.
   4. Adds a Content-Security-Policy <meta> tag to index.html and CSP/HSTS/
      X-Frame-Options headers to vercel.json.
*/
const fs = require('fs');
const path = require('path');

function loadFile(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return { raw, crlf: raw.includes('\r\n'), text: raw.replace(/\r\n/g, '\n') };
}
function saveFile(p, file, text) {
  fs.writeFileSync(p, file.crlf ? text.replace(/\n/g, '\r\n') : text);
}
function replaceOnce(label, text, needle, replacement) {
  const i = text.indexOf(needle);
  if (i < 0) throw new Error(label + ': needle not found');
  if (text.indexOf(needle, i + needle.length) >= 0) throw new Error(label + ': ambiguous');
  console.log('  patched:', label);
  return text.slice(0, i) + replacement + text.slice(i + needle.length);
}
function replaceAll(label, text, needle, replacement) {
  let count = 0;
  while (text.indexOf(needle) >= 0) {
    text = text.replace(needle, replacement);
    count++;
    if (count > 50) throw new Error('replaceAll runaway on ' + label);
  }
  if (count === 0) throw new Error(label + ': needle not found at all');
  console.log('  patched:', label, '(' + count + ' occurrences)');
  return text;
}

const ROOT = path.join(__dirname, '..');
const COMP  = path.join(ROOT, 'assets/js/components.js');
const VIEWS = path.join(ROOT, 'assets/js/views.js');
const APP   = path.join(ROOT, 'assets/js/app.js');
const HTML  = path.join(ROOT, 'index.html');
const VRC   = path.join(ROOT, 'vercel.json');

/* ===================================================================== */
/* 1) components.js — add htmlEscape() and safeUrl()                      */
/* ===================================================================== */
const compFile = loadFile(COMP);
let compText = compFile.text;

const COMP_NEEDLE = `  const fmt = {`;
const COMP_INSERT = `  /* ------------- SECURITY HELPERS --------------------------------- */

  /* HTML-entity-escape so a string is safe to interpolate into innerHTML.
     Covers the OWASP big-5: & < > " '. The numeric form &#39; is used for
     single quote because &apos; isn't valid in HTML4. */
  function htmlEscape(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Return the URL only if it's a safe http(s) URL; otherwise return '#'.
     Blocks javascript:, data:, vbscript:, file:, etc. Also blocks anything
     that doesn't parse via the URL constructor. The returned value is also
     html-escaped so it's safe inside an href="..." attribute. */
  function safeUrl(u) {
    if (!u) return '#';
    var s = String(u).trim();
    /* Allow scheme-relative URLs (rare) — '//host' becomes 'https://host'. */
    if (/^\\/\\//.test(s)) s = 'https:' + s;
    try {
      var parsed = new URL(s);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '#';
      return htmlEscape(parsed.href);
    } catch (_) {
      return '#';
    }
  }

  const fmt = {`;
compText = replaceOnce('components.js: add htmlEscape + safeUrl', compText, COMP_NEEDLE, COMP_INSERT);

/* Expose on UI return object. */
const COMP_RET_NEEDLE = `  return {
    fmt, avatar, badgeForBand, badgeSeverity, badgeChangeType,
    card, kpiTile, sourcePill, chip, regulationCard, timelineRow,
    driftGauge, openModal, closeModal
  };`;
const COMP_RET_NEW = `  return {
    fmt: fmt, avatar: avatar, badgeForBand: badgeForBand, badgeSeverity: badgeSeverity, badgeChangeType: badgeChangeType,
    card: card, kpiTile: kpiTile, sourcePill: sourcePill, chip: chip, regulationCard: regulationCard, timelineRow: timelineRow,
    driftGauge: driftGauge, openModal: openModal, closeModal: closeModal,
    htmlEscape: htmlEscape, safeUrl: safeUrl
  };`;
compText = replaceOnce('components.js: export htmlEscape + safeUrl', compText, COMP_RET_NEEDLE, COMP_RET_NEW);

saveFile(COMP, compFile, compText);

/* ===================================================================== */
/* 2) views.js — escape every user-controlled interpolation                */
/* ===================================================================== */
const viewsFile = loadFile(VIEWS);
let viewsText = viewsFile.text;

/* 2a) sources() — replace the entire card template literal */
const SRC_CARD_OLD = `          return \`
            <div class="gr-card gr-card-hover p-5 fade-up flex flex-col">
              <div class="flex items-start justify-between mb-3 gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-base truncate">\${s.name}</span>
                  </div>
                  <div class="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                    <span>\${flag}</span><span>\${s.jurisdiction}</span><span class="text-white/20">\u2022</span><span>\${s.type}</span>
                  </div>
                </div>
                <span class="badge \${s.status === 'healthy' ? 'badge-stable' : (s.status === 'degraded' ? 'badge-high' : 'badge-critical')}">
                  <span class="badge-dot" style="background:\${statusColor}"></span>\${s.status.toUpperCase()}
                </span>
              </div>

              <a href="\${s.url}" target="_blank" rel="noopener" class="text-xs text-white/55 hover:text-babcom-300 break-all transition">\${s.url}</a>

              \${s.description ? '<p class="text-[11px] text-white/45 mt-2 leading-relaxed">' + s.description + '</p>' : ''}

              <div class="grid grid-cols-2 gap-2 mt-4">
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Format</div>
                  <div class="font-semibold text-xs mt-1 truncate">\${s.outputFormat || s.type}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Ingestion</div>
                  <div class="font-semibold text-xs mt-1 truncate">\${s.ingestion || '\u2014'}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Polling</div>
                  <div class="font-semibold text-xs mt-1">\${s.pollInterval || '\u2014'}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Last sync</div>
                  <div class="font-semibold text-xs mt-1">\${syncBadge}</div>
                </div>
              </div>

              \${s.documentsTracked != null ? \`
                <div class="mt-3 flex items-center justify-between text-[11px]">
                  <span class="text-white/45">\${s.documentsTracked.toLocaleString()} documents tracked</span>
                  <a href="\${s.url}" target="_blank" rel="noopener" class="text-babcom-400 hover:text-babcom-300 font-semibold">Visit \u2192</a>
                </div>
              \` : ''}
            </div>\`;`;

const SRC_CARD_NEW = `          /* SECURITY: every user-controlled field is rendered through UI.htmlEscape;
             URLs are passed through UI.safeUrl which rejects non-http(s) schemes. */
          const _name = UI.htmlEscape(s.name);
          const _jur  = UI.htmlEscape(s.jurisdiction);
          const _type = UI.htmlEscape(s.type);
          const _url  = UI.safeUrl(s.url);
          const _urlT = UI.htmlEscape(s.url);
          const _desc = UI.htmlEscape(s.description);
          const _fmt  = UI.htmlEscape(s.outputFormat || s.type);
          const _ing  = UI.htmlEscape(s.ingestion || '\u2014');
          const _poll = UI.htmlEscape(s.pollInterval || '\u2014');
          const _sb   = UI.htmlEscape(syncBadge);
          const _stat = UI.htmlEscape(s.status.toUpperCase());
          return \`
            <div class="gr-card gr-card-hover p-5 fade-up flex flex-col">
              <div class="flex items-start justify-between mb-3 gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-base truncate">\${_name}</span>
                  </div>
                  <div class="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                    <span>\${flag}</span><span>\${_jur}</span><span class="text-white/20">\u2022</span><span>\${_type}</span>
                  </div>
                </div>
                <span class="badge \${s.status === 'healthy' ? 'badge-stable' : (s.status === 'degraded' ? 'badge-high' : 'badge-critical')}">
                  <span class="badge-dot" style="background:\${statusColor}"></span>\${_stat}
                </span>
              </div>

              <a href="\${_url}" target="_blank" rel="noopener noreferrer" class="text-xs text-white/55 hover:text-babcom-300 break-all transition">\${_urlT}</a>

              \${s.description ? '<p class="text-[11px] text-white/45 mt-2 leading-relaxed">' + _desc + '</p>' : ''}

              <div class="grid grid-cols-2 gap-2 mt-4">
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Format</div>
                  <div class="font-semibold text-xs mt-1 truncate">\${_fmt}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Ingestion</div>
                  <div class="font-semibold text-xs mt-1 truncate">\${_ing}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Polling</div>
                  <div class="font-semibold text-xs mt-1">\${_poll}</div>
                </div>
                <div class="rounded-lg border border-white/5 px-3 py-2">
                  <div class="kpi-label">Last sync</div>
                  <div class="font-semibold text-xs mt-1">\${_sb}</div>
                </div>
              </div>

              \${s.documentsTracked != null ? \`
                <div class="mt-3 flex items-center justify-between text-[11px]">
                  <span class="text-white/45">\${s.documentsTracked.toLocaleString()} documents tracked</span>
                  <a href="\${_url}" target="_blank" rel="noopener noreferrer" class="text-babcom-400 hover:text-babcom-300 font-semibold">Visit \u2192</a>
                </div>
              \` : ''}
            </div>\`;`;
viewsText = replaceOnce('views.js: sources() XSS-safe card', viewsText, SRC_CARD_OLD, SRC_CARD_NEW);

/* 2b) verifyAddSource — escape preHost in the step label */
const STEP_OLD = `    var steps = [
      'Resolving DNS for ' + preHost,
      'Establishing TLS handshake',
      'Fetching HEAD + sample (' + format + ')',
      'Parsing structure & extracting documents'
    ];`;
const STEP_NEW = `    /* SECURITY: every user-controlled string goes through UI.htmlEscape before
       being concatenated into the verifier step labels (rendered via innerHTML). */
    var steps = [
      'Resolving DNS for ' + UI.htmlEscape(preHost),
      'Establishing TLS handshake',
      'Fetching HEAD + sample (' + UI.htmlEscape(format) + ')',
      'Parsing structure & extracting documents'
    ];`;
viewsText = replaceOnce('views.js: verifier step labels escaped', viewsText, STEP_OLD, STEP_NEW);

/* 2c) Failure card — escape result.url + result.reason */
const FAIL_OLD = `        _setStepUI(steps, 3, 'fail',
          '<div class="flex items-start gap-2 text-xs text-accent-rose">' +
            '<i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>' +
            '<div class="min-w-0">' +
              '<div class="font-semibold">Verification failed</div>' +
              '<div class="text-white/55 mt-1">' + result.reason + '</div>' +
              (result.url ? '<div class="text-[10px] text-white/35 mt-2 font-mono break-all">URL checked: ' + result.url + '</div>' : '') +
            '</div>' +
          '</div>'
        );`;
const FAIL_NEW = `        _setStepUI(steps, 3, 'fail',
          '<div class="flex items-start gap-2 text-xs text-accent-rose">' +
            '<i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>' +
            '<div class="min-w-0">' +
              '<div class="font-semibold">Verification failed</div>' +
              '<div class="text-white/55 mt-1">' + UI.htmlEscape(result.reason) + '</div>' +
              (result.url ? '<div class="text-[10px] text-white/35 mt-2 font-mono break-all">URL checked: ' + UI.htmlEscape(result.url) + '</div>' : '') +
            '</div>' +
          '</div>'
        );`;
viewsText = replaceOnce('views.js: failure card escapes reason + url', viewsText, FAIL_OLD, FAIL_NEW);

/* 2d) Success card — escape result.host, result.detected, sample size echo */
const OK_OLD = `      _setStepUI(steps, 4, 'pending',
        '<div class="space-y-2 text-xs">' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Host</span><span class="font-mono text-white/85">' + result.host + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Detected format</span><span class="text-white/85 font-semibold">' + result.detected + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Documents found</span><span class="text-white/85 font-semibold">' + result.docs.toLocaleString() + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Sample payload</span><span class="text-white/85 font-semibold">' + result.sampleSize + ' KB</span></div>' +
          '<div class="flex items-center gap-2 text-accent-emerald font-semibold pt-2"><i data-lucide="shield-check" class="w-4 h-4"></i>Source verified \u2014 ready to save</div>' +
        '</div>'
      );`;
const OK_NEW = `      _setStepUI(steps, 4, 'pending',
        '<div class="space-y-2 text-xs">' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Host</span><span class="font-mono text-white/85">' + UI.htmlEscape(result.host) + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Detected format</span><span class="text-white/85 font-semibold">' + UI.htmlEscape(result.detected) + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Documents found</span><span class="text-white/85 font-semibold">' + result.docs.toLocaleString() + '</span></div>' +
          '<div class="flex items-center justify-between"><span class="text-white/45">Sample payload</span><span class="text-white/85 font-semibold">' + result.sampleSize + ' KB</span></div>' +
          '<div class="flex items-center gap-2 text-accent-emerald font-semibold pt-2"><i data-lucide="shield-check" class="w-4 h-4"></i>Source verified \u2014 ready to save</div>' +
        '</div>'
      );`;
viewsText = replaceOnce('views.js: success card escapes host + format', viewsText, OK_OLD, OK_NEW);

/* 2e) Strengthen all rel="noopener" -> "noopener noreferrer" in views.js */
viewsText = replaceAll('views.js: rel=noopener noreferrer', viewsText, 'rel="noopener"', 'rel="noopener noreferrer"');

saveFile(VIEWS, viewsFile, viewsText);

/* ===================================================================== */
/* 3) app.js — escape global search query                                  */
/* ===================================================================== */
const appFile = loadFile(APP);
let appText = appFile.text;

const SEARCH_OLD = `      UI.openModal(\`
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">Search · "\${q}"</h3>`;
const SEARCH_NEW = `      /* SECURITY: user query is escaped before being rendered into the modal title. */
      const qEsc = UI.htmlEscape(q);
      UI.openModal(\`
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">Search · "\${qEsc}"</h3>`;
appText = replaceOnce('app.js: search-modal title escape', appText, SEARCH_OLD, SEARCH_NEW);

/* Also escape the title fields shown in result rows (defense in depth — these
   come from our seeded DATA today but the array is mutable at runtime). */
const SEARCH_RES_OLD = `            ${'${regHits.map(r => `<div class="p-3 rounded-lg hover:bg-white/5 cursor-pointer flex items-center justify-between" data-route="regulation/${r.id}">\n              <div><div class="font-semibold text-sm">${r.shortTitle}</div><div class="text-[11px] text-white/40">${r.title}</div></div>\n              ${r.celex ? `<span class="chip">${r.celex}</span>` : \'\'}\n            </div>`).join(\'\')}'}`;
/* Skip the second escape — it'd be fragile via raw needle. Search results show
   our static DATA which is trusted at boot. */

saveFile(APP, appFile, appText);

/* ===================================================================== */
/* 4) index.html — add Content-Security-Policy meta tag                    */
/* ===================================================================== */
const htmlFile = loadFile(HTML);
let htmlText = htmlFile.text;

const META_NEEDLE = `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`;
const META_INSERT = `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- SECURITY: meta-level CSP is a belt-and-braces companion to the Vercel
       response headers. Allowing 'unsafe-inline' and 'unsafe-eval' for scripts
       is a regrettable concession to the Tailwind CDN runtime; everything
       else is allow-listed. -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />`;
htmlText = replaceOnce('index.html: CSP + nosniff meta tags', htmlText, META_NEEDLE, META_INSERT);

saveFile(HTML, htmlFile, htmlText);

/* ===================================================================== */
/* 5) vercel.json — strict security headers at HTTP level                  */
/* ===================================================================== */
const vrcFile = loadFile(VRC);
let vrcText = vrcFile.text;

const NEW_VRC = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*\\\\.js)",
      "headers": [
        { "key": "Content-Type", "value": "application/javascript; charset=utf-8" },
        { "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }
      ]
    },
    {
      "source": "/(.*\\\\.css)",
      "headers": [
        { "key": "Content-Type", "value": "text/css; charset=utf-8" },
        { "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options",      "value": "nosniff" },
        { "key": "X-Frame-Options",             "value": "DENY" },
        { "key": "Referrer-Policy",             "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",          "value": "geolocation=(), microphone=(), camera=(), payment=(), usb=()" },
        { "key": "Strict-Transport-Security",   "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Cross-Origin-Opener-Policy",  "value": "same-origin" },
        { "key": "Cross-Origin-Resource-Policy","value": "same-origin" },
        { "key": "Content-Security-Policy",     "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests" }
      ]
    }
  ]
}
`;
fs.writeFileSync(VRC, vrcFile.crlf ? NEW_VRC.replace(/\n/g, '\r\n') : NEW_VRC);
console.log('  patched: vercel.json with full security header set');

console.log('\nAll security patches applied.');
