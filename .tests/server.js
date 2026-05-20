/* Tiny static file server for GRCentral. Defaults to http://localhost:8080.
   Aggressively no-cache so iterating in the browser never needs a hard reload. */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.map':  'application/json'
};

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma':        'no-cache',
  'Expires':       '0'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, Object.assign({ 'Content-Type': 'text/plain' }, NO_CACHE));
      res.end('404 Not Found: ' + urlPath);
      console.log(new Date().toISOString(), '404', urlPath);
      return;
    }
    const ext  = path.extname(file).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, Object.assign({
      'Content-Type':  mime,
      'Last-Modified': stat.mtime.toUTCString(),
      'ETag':          'W/"' + stat.size + '-' + stat.mtimeMs + '"'
    }, NO_CACHE));
    fs.createReadStream(file).pipe(res);
    console.log(new Date().toISOString(), '200', urlPath, '(' + stat.size + 'B)');
  });
});

server.listen(PORT, () => {
  console.log('\nGRCentral is running at  >>  http://localhost:' + PORT + '/\n');
});
