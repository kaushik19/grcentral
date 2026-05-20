/* Targeted regression test for the verifier — covers the Bafin path, paste-
   gunk, and missing-scheme. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'assets/js/views.js'), 'utf8');

/* Extract just _canonicaliseUrl + _addSrcSimulate into an isolated context. */
const canonStart = src.indexOf('function _canonicaliseUrl');
const canonEnd   = src.indexOf('\n  }', canonStart) + 4;
const simStart   = src.indexOf('function _addSrcSimulate');
const simEnd     = src.indexOf('\n  }', simStart) + 4;
const code = src.slice(canonStart, canonEnd) + '\n' + src.slice(simStart, simEnd);

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(
  code.replace(/^function _canonicaliseUrl/, 'var _canonicaliseUrl = function')
      .replace(/function _addSrcSimulate/,  'var _addSrcSimulate = function'),
  ctx
);

let ok = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32mPASS\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
  else      { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (detail ? '  -- ' + detail : '')); }
};

console.log('\n[1] _canonicaliseUrl');
const tests1 = [
  ['  https://www.bafin.de/EN/  ',          'https://www.bafin.de/EN/'],
  ['www.bafin.de',                          'https://www.bafin.de'],
  ['eur-lex.europa.eu/eli/reg/2024/1689',   'https://eur-lex.europa.eu/eli/reg/2024/1689'],
  ['\u200Bhttps://example.com',             'https://example.com'],     // zero-width space
  ['\uFEFFhttps://example.com',             'https://example.com'],     // BOM
  ['http://example.com',                    'http://example.com'],
  ['',                                      '']
];
tests1.forEach(t => check('canonicalise(' + JSON.stringify(t[0]) + ')', ctx._canonicaliseUrl(t[0]) === t[1], 'expected ' + JSON.stringify(t[1]) + ', got ' + JSON.stringify(ctx._canonicaliseUrl(t[0]))));

console.log('\n[2] _addSrcSimulate · accepts');
[
  'https://www.bafin.de/EN/',
  '  https://www.bafin.de/EN/  ',
  'www.bafin.de',                              // no scheme — should be auto-prefixed
  'eur-lex.europa.eu',
  'https://www.cisa.gov/news-events/cybersecurity-advisories'
].forEach(u => {
  const r = ctx._addSrcSimulate(u, 'HTML');
  check('accepts ' + JSON.stringify(u), r.ok === true, 'host=' + r.host + ', detected=' + r.detected);
});

console.log('\n[3] _addSrcSimulate · rejects');
[
  ['localhost:9000',          /private/i],
  ['127.0.0.1/feed.json',     /private/i],
  ['ftp://example.com',       /URL must start/i],
  ['https://x',               /TLD/i],
  ['javascript:alert(1)',     /URL must start/i]
].forEach(t => {
  const r = ctx._addSrcSimulate(t[0], 'HTML');
  check('rejects ' + JSON.stringify(t[0]), r.ok === false && t[1].test(r.reason), 'reason=' + r.reason);
});

console.log('\n[4] Simulator carries canonical URL forward');
const r1 = ctx._addSrcSimulate('  www.bafin.de  ', 'HTML');
check('success result contains canonical url', r1.ok && r1.url === 'https://www.bafin.de', 'url=' + r1.url);
const r2 = ctx._addSrcSimulate('javascript:alert(1)', 'HTML');
check('failure result contains canonical url', r2.ok === false && r2.url === 'javascript:alert(1)', 'url=' + r2.url);

console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
process.exit(fail === 0 ? 0 : 1);
