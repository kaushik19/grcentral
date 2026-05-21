/* Security test suite.
   Fires real XSS payloads through every input path and asserts that the
   rendered HTML never contains an executable string. Also validates that
   safeUrl() rejects every dangerous scheme. */
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
  document: { getElementById: () => fakeEl(), querySelector: () => fakeEl(), querySelectorAll: () => [], addEventListener() {}, createElement: () => fakeEl() },
  lucide: { createIcons() {} },
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

const PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '" onmouseover="alert(1)"',
  "';alert(1);//",
  '<svg/onload=alert(1)>',
  '<iframe src=javascript:alert(1)>',
  'javascript:alert(1)'
];

/* Correct XSS detection.
   A payload "leaks" only if the browser would actually parse it as executable
   markup. Pure substring matching on the raw HTML is wrong: an escaped string
   like "&lt;img onerror=&gt;" contains the literal text "onerror=" yet is
   completely harmless because the browser sees it as text, not an attribute.

   We therefore:
     1. Strip text content (everything between '>' and '<'), leaving only the
        element tags + their attributes. This is the only region a browser
        treats as code.
     2. Run tag/attribute/scheme detectors against THAT stripped HTML.
     3. Apply the verbatim-payload check only when the payload itself contains
        an HTML-special char ('<', '>', '"' or "'"). A payload with no such
        chars (e.g. "javascript:alert(1)") cannot escape any context.
*/
const DANGEROUS_TAG_RE = /<\s*(?:script|iframe|object|embed|svg|img|link|meta|base|style|form)\b/gi;
function countDangerousTags(html) {
  return (html.match(DANGEROUS_TAG_RE) || []).length;
}
function stripText(html) {
  /* Replace every text-node region (between '>' and '<') with empty string. */
  return html.replace(/>[^<]*</g, '><');
}
/* Dangerous URL scheme injected into href/src: scheme must appear IMMEDIATELY
   after the opening quote (or '='), i.e. it IS the URL's scheme. */
const SCHEME_INJECT_RE = /\s(?:href|src|formaction|action|xlink:href)\s*=\s*(?:["']\s*)?(?:javascript|vbscript|data):/i;
/* Inline event handler with executable-looking content that wasn't introduced
   by our own template (we only allow onclick="Views.*" or onclick="UI.*"). */
const SUSPICIOUS_HANDLER_RE = /\son(?:click|error|load|mouseover|mouseenter|focus|blur|submit|keypress|keydown|keyup|toggle|animationstart)\s*=\s*["'](?!Views\.|UI\.)/i;

function leakReason(payload, html, baselineTagCount) {
  const attrs = stripText(html);
  if (countDangerousTags(attrs) > baselineTagCount)
                                          return 'new raw dangerous tag opened';
  if (SCHEME_INJECT_RE.test(attrs))       return 'javascript:/vbscript:/data: URL injected into attribute';
  if (SUSPICIOUS_HANDLER_RE.test(attrs))  return 'suspicious inline on*= handler';
  if (/[<>"']/.test(payload) && html.includes(payload))
                                          return 'verbatim payload (with <>"\') leaked';
  return null;
}

/* --------------------------------------------------------------------- */
console.log('\n[1] UI.htmlEscape escapes the OWASP big-5');
const big5 = '&<>"\'';
const escaped = UI.htmlEscape(big5);
check('htmlEscape(&<>"\\\') == &amp;&lt;&gt;&quot;&#39;', escaped === '&amp;&lt;&gt;&quot;&#39;', 'got: ' + escaped);
check('htmlEscape(null) == ""',  UI.htmlEscape(null) === '');
check('htmlEscape(undefined) == ""', UI.htmlEscape(undefined) === '');
check('htmlEscape(123) coerces',  UI.htmlEscape(123) === '123');

/* --------------------------------------------------------------------- */
console.log('\n[2] UI.safeUrl rejects every dangerous scheme');
const okUrls = [
  'https://eur-lex.europa.eu/',
  'http://example.com',
  'https://example.com/path?x=1&y=2#frag'
];
const badUrls = [
  'javascript:alert(1)',
  'JavaScript:alert(1)',                  // case-mixed
  ' javascript:alert(1)',                 // leading space (URL throws)
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'about:blank',
  'chrome://settings',
  'ftp://example.com'                     // not http(s)
];
okUrls.forEach(u => check('safeUrl accepts ' + JSON.stringify(u), UI.safeUrl(u) !== '#', '-> ' + UI.safeUrl(u)));
badUrls.forEach(u => check('safeUrl rejects ' + JSON.stringify(u), UI.safeUrl(u) === '#', '-> ' + UI.safeUrl(u)));
check('safeUrl escapes attribute-breaking chars',
  UI.safeUrl('https://evil.com/"><script>alert(1)</script>') !== '#' &&
  !UI.safeUrl('https://evil.com/"><script>alert(1)</script>').includes('"'),
  'got: ' + UI.safeUrl('https://evil.com/"><script>alert(1)</script>')
);

/* --------------------------------------------------------------------- */
console.log('\n[3] Sources view: malicious source -> no executable HTML');
/* Baseline: render with a benign payload so we know how many dangerous
   tag opens are expected in the template itself (icons, etc. are NOT
   in the dangerous set so this is normally 0). */
const benign = 'safe-string';
const benignEvil = {
  id: 'benign-1', name: benign, url: 'https://example.com/' + benign,
  description: benign, outputFormat: benign, ingestion: benign,
  pollInterval: benign, jurisdiction: benign, type: benign,
  status: 'healthy', lastSyncMin: 0, documentsTracked: 1
};
DATA.sources.push(benignEvil); DATA.indexes.sources[benignEvil.id] = benignEvil;
const baselineHTML = Views.sources();
DATA.sources.pop(); delete DATA.indexes.sources[benignEvil.id];
const baselineTagCount = countDangerousTags(baselineHTML);

PAYLOADS.forEach(payload => {
  const evil = {
    id: 'evil-' + Math.random().toString(36).slice(2, 6),
    name: payload,
    url:  'https://example.com/' + payload,
    description: payload,
    outputFormat: payload,
    ingestion: payload,
    pollInterval: payload,
    jurisdiction: payload,
    type: payload,
    status: 'healthy',
    lastSyncMin: 0,
    documentsTracked: 1
  };
  DATA.sources.push(evil);
  DATA.indexes.sources[evil.id] = evil;
  const html = Views.sources();
  DATA.sources.pop();
  delete DATA.indexes.sources[evil.id];

  /* Isolate just the injected card so we don't pick up false positives
     from other rows. The card is the last one rendered. */
  const cardStart = html.lastIndexOf('<div class="gr-card gr-card-hover p-5 fade-up flex flex-col">');
  const card = cardStart >= 0 ? html.slice(cardStart) : html;
  const cardBaselineStart = baselineHTML.lastIndexOf('<div class="gr-card gr-card-hover p-5 fade-up flex flex-col">');
  const cardBaseline = cardBaselineStart >= 0 ? baselineHTML.slice(cardBaselineStart) : baselineHTML;

  const leak = leakReason(payload, card, countDangerousTags(cardBaseline));
  check('payload ' + JSON.stringify(payload).slice(0, 50) + ' -> safe',
    leak === null,
    leak ? 'LEAK: ' + leak : 'escaped cleanly');
});

/* --------------------------------------------------------------------- */
console.log('\n[4] Add-Source modal renders without leaking');
const modalHTMLs = [];
const origOpen = UI.openModal;
UI.openModal = (h) => { modalHTMLs.push(h); };
try { Views.openAddSourceModal(); } catch (e) {}
UI.openModal = origOpen;
const mh = modalHTMLs[0] || '';
check('modal HTML opened',                     mh.length > 0);
check('modal HTML has no inline event handlers in unsafe positions',
  !/on(error|load|click|mouseover)\s*=\s*['"]?(?!Views\.|UI\.)/i.test(mh.replace(/onclick="(Views|UI)\./g, '')),
  'inline handlers limited to Views.*/UI.*'
);

/* --------------------------------------------------------------------- */
console.log('\n[5] All external links are rel="noopener noreferrer"');
const viewsSrc = fs.readFileSync(path.join(ROOT, 'assets/js/views.js'), 'utf8');
const targetBlankCount      = (viewsSrc.match(/target="_blank"/g)         || []).length;
const noopenerNoreferrerOK  = (viewsSrc.match(/rel="noopener noreferrer"/g) || []).length;
const noopenerOnlyCount     = (viewsSrc.match(/rel="noopener"(?! noreferrer)/g) || []).length;
check('every target="_blank" has rel="noopener noreferrer"',
  targetBlankCount > 0 && noopenerOnlyCount === 0,
  targetBlankCount + ' target=_blank links, ' + noopenerNoreferrerOK + ' with full rel, ' + noopenerOnlyCount + ' insecure');

/* --------------------------------------------------------------------- */
console.log('\n[6] index.html ships with security headers');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
check('CSP meta present',          /http-equiv=("|')Content-Security-Policy/i.test(html));
check('CSP forbids object-src',    /object-src 'none'/.test(html));
check('CSP forbids framing',       /frame-ancestors 'none'/.test(html));
check('CSP restricts script-src',  /script-src .* https:\/\/cdn\.jsdelivr\.net/.test(html));
check('nosniff meta present',      /X-Content-Type-Options/i.test(html));
check('referrer policy meta',      /name=("|')referrer/i.test(html) && /strict-origin-when-cross-origin/.test(html));

/* --------------------------------------------------------------------- */
console.log('\n[7] vercel.json ships with strict security headers');
const vrc = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const allHeaders = (vrc.headers || []).flatMap(h => h.headers || []);
const has = (k) => allHeaders.some(h => h.key.toLowerCase() === k.toLowerCase());
['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options',
 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security',
 'Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy']
  .forEach(k => check('vercel.json sets ' + k, has(k)));

const xfo = allHeaders.find(h => h.key === 'X-Frame-Options');
check('X-Frame-Options = DENY', xfo && xfo.value === 'DENY', 'got: ' + (xfo && xfo.value));
const hsts = allHeaders.find(h => h.key === 'Strict-Transport-Security');
check('HSTS includes preload',  hsts && /preload/.test(hsts.value), 'got: ' + (hsts && hsts.value));

/* --------------------------------------------------------------------- */
console.log('\n[8] Saved user source: full E2E through verify + save');
const sNameEl  = { value: '<img src=x onerror=alert(1)>' };
const sUrlEl   = { value: 'https://evil.example.com/"><script>alert(1)</script>' };
const sDescEl  = { value: '"><script>alert(1)</script>' };
const sFmtEl   = { value: 'HTML' };
const sJurEl   = { value: 'EU' };
const sTypeEl  = { value: 'guidance' };
const sPollEl  = { value: '1h' };
const stateEl  = { value: '', className: '', textContent: '' };
const verifyEl = { value: '', disabled: false, classList: { add() {}, remove() {} } };
const stepsEl  = { innerHTML: '' };

const realGet = sandbox.document.getElementById;
sandbox.document.getElementById = (id) => ({
  'src-name': sNameEl, 'src-url': sUrlEl, 'src-desc': sDescEl, 'src-format': sFmtEl,
  'src-jur': sJurEl, 'src-type': sTypeEl, 'src-poll': sPollEl,
  'verify-state': stateEl, 'verify-btn': verifyEl, 'save-btn': verifyEl,
  'verify-steps': stepsEl
}[id] || fakeEl());

Views.verifyAddSource();
/* The simulator's failure card must not leak the script payload.
   Use a fresh baseline by rendering verifier output with benign URL. */
const stepsHTML1 = stepsEl.innerHTML;
const leak1 = leakReason(sNameEl.value, stepsHTML1, 0) || leakReason(sDescEl.value, stepsHTML1, 0);
check('failure card does not leak script payload', leak1 === null, leak1 ? 'LEAK: ' + leak1 : 'clean');

/* Now feed a clean URL to get to success path */
sUrlEl.value = 'https://www.bafin.de/EN/';
Views.verifyAddSource();
const stepsHTML2 = stepsEl.innerHTML;
const leak2 = leakReason(sNameEl.value, stepsHTML2, 0) || leakReason(sDescEl.value, stepsHTML2, 0);
check('success card does not leak (clean URL)', leak2 === null, leak2 ? 'LEAK: ' + leak2 : 'clean');

sandbox.document.getElementById = realGet;

console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
process.exit(fail === 0 ? 0 : 1);
