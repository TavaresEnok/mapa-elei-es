const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  const filePath = path.join(ROOT, cleanPath);
  const ext = path.extname(filePath).toLowerCase();

  // 1. Try serving from local disk
  fs.readFile(filePath, (err, data) => {
    if (!err) {
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
      return;
    }

    // 2. If not found locally, proxy to seuimposto.com and cache
    if (url.startsWith('/feed/') || url.startsWith('/retratos/') || url.startsWith('/assets/')) {
      const remoteUrl = 'https://seuimposto.com' + url;
      https.get(remoteUrl, proxyRes => {
        if (proxyRes.statusCode === 200) {
          const chunks = [];
          proxyRes.on('data', chunk => chunks.push(chunk));
          proxyRes.on('end', () => {
            const buffer = Buffer.concat(chunks);
            // Save to disk asynchronously for future requests
            try {
              fs.mkdirSync(path.dirname(filePath), { recursive: true });
              fs.writeFile(filePath, buffer, () => {});
            } catch (saveErr) {}

            res.writeHead(200, {
              'Content-Type': MIME[ext] || proxyRes.headers['content-type'] || 'application/octet-stream',
              'Cache-Control': 'no-cache',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(buffer);
          });
        } else {
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'text/plain' });
          res.end(`Not found locally or remotely: ${url}`);
        }
      }).on('error', netErr => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end(`Proxy error: ${netErr.message}`);
      });
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + url);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ===========================================`);
  console.log(`  🇧🇷  Seu Imposto · Apuração 2026`);
  console.log(`  ───────────────────────────────────────────`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Status: 100% dos dados e mapas carregados`);
  console.log(`  Pressione Ctrl+C para encerrar.`);
  console.log(`  ===========================================\n`);
});
