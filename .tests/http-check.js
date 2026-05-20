/* HTTP smoke-test: fetch every asset and confirm 200 + non-empty body. */
const http = require('http');

const PORT = Number(process.env.PORT) || 8080;
const targets = [
  { path: '/',                                   contains: ['GRCentral', 'Montserrat'] },
  { path: '/index.html',                         contains: ['GRCentral', 'assets/js/app.js'] },
  { path: '/assets/css/styles.css',              contains: ['Montserrat', 'gr-card'] },
  { path: '/assets/js/data.js',                  contains: ['window.DATA', '32024R1689'] },
  { path: '/assets/js/risk-engine.js',           contains: ['RiskEngine', 'TrendMultiplier'] },
  { path: '/assets/js/components.js',            contains: ['window.UI', 'driftGauge'] },
  { path: '/assets/js/views.js',                 contains: ['window.Views', 'regulationDetail'] },
  { path: '/assets/js/app.js',                   contains: ['Regulatory Radar', 'personaSwitcher'] },
  { path: '/README.md',                          contains: ['GRCentral', 'Risk Drift'] },
  { path: '/this-must-404',                      expectStatus: 404 }
];

function fetch(p) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port: PORT, path: p }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('timeout')));
  });
}

(async () => {
  let ok = 0, fail = 0;
  console.log('\nHitting http://localhost:' + PORT + ' ...\n');
  for (const t of targets) {
    try {
      const r = await fetch(t.path);
      const expected = t.expectStatus || 200;
      if (r.status !== expected) throw new Error('expected ' + expected + ', got ' + r.status);
      if (t.contains) {
        const missing = t.contains.filter(s => !r.body.includes(s));
        if (missing.length) throw new Error('missing markers: ' + missing.join(', '));
      }
      ok++;
      const ct = r.headers['content-type'] || '?';
      console.log('  \x1b[32mPASS\x1b[0m ' + r.status + ' ' + t.path.padEnd(36) + ' (' + r.body.length + 'B, ' + ct + ')');
    } catch (err) {
      fail++;
      console.log('  \x1b[31mFAIL\x1b[0m ' + t.path + '  -- ' + err.message);
    }
  }
  console.log('\nResult:  \x1b[32m' + ok + ' passed\x1b[0m, \x1b[31m' + fail + ' failed\x1b[0m');
  process.exit(fail === 0 ? 0 : 1);
})();
