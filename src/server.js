'use strict';
/**
 * Servidor estático do mapa (somente leitura). Serve apenas o diretório public/, com gzip,
 * ETag e política de segurança de conteúdo (nenhum script, estilo ou fonte externos).
 *
 *   PORT (3100) · HOST (127.0.0.1; use 0.0.0.0 para expor na rede) · PUBLIC_DIR · LOG=1 (log de acessos)
 */
const http = require('http');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

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

const HASHED = /\.[0-9a-f]{8,}\.[a-z0-9]+$/;   // arquivos com hash de conteúdo no nome: cache imutável
const COMPRIMIVEIS = new Set(['.html', '.js', '.css', '.json', '.svg']);

// O app só carrega recursos da própria origem.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; " +
  "connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

/** URL → caminho absoluto dentro de root, ou null se for inválida / tentar escapar de root. */
function resolveSafe(root, rawUrl) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(rawUrl, 'http://x').pathname); } catch { return null; }
  if (pathname.includes('\0')) return null;
  const file = path.resolve(root, '.' + path.posix.normalize('/' + pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  const rel = path.relative(root, file);
  if (rel.split(path.sep).some(seg => seg.startsWith('.'))) return null;   // dotfiles
  return file;
}

function cacheControl(file) {
  const ext = path.extname(file).toLowerCase();
  if (HASHED.test(file)) return 'public, max-age=31536000, immutable';
  if (['.html', '.json', '.js', '.css'].includes(ext)) return 'no-cache';   // revalida por ETag
  return 'public, max-age=86400';
}

const SEGURANCA = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': CSP,
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

function createServer({ root, log = false } = {}) {
  root = path.resolve(root);

  return http.createServer((req, res) => {
    const t0 = Date.now();
    const done = (status, headers = {}, body) => {
      res.writeHead(status, { ...SEGURANCA, ...headers });
      res.end(body);
      if (log) console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${status} ${Date.now() - t0}ms`);
    };
    const text = (status, msg, headers) => done(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers }, msg);

    if (req.method !== 'GET' && req.method !== 'HEAD') return text(405, 'Method not allowed', { Allow: 'GET, HEAD' });

    let file = resolveSafe(root, req.url);
    if (!file) return text(400, 'Bad request');

    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) { file = path.join(file, 'index.html'); return fs.stat(file, (e, s) => serve(e, s)); }
      serve(err, st);
    });

    function serve(err, st) {
      if (err || !st.isFile()) return text(404, 'Not found');
      const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
      const headers = {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': cacheControl(file),
        'Last-Modified': st.mtime.toUTCString(),
        ETag: etag,
      };
      if (req.headers['if-none-match'] === etag) return done(304, headers);
      headers['Content-Length'] = st.size;
      if (req.method === 'HEAD') return done(200, headers);
      const gzip = COMPRIMIVEIS.has(path.extname(file).toLowerCase()) && st.size > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
      if (gzip) { headers['Content-Encoding'] = 'gzip'; delete headers['Content-Length']; }
      headers.Vary = 'Accept-Encoding';
      res.writeHead(200, { ...SEGURANCA, ...headers });
      const stream = fs.createReadStream(file);
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      if (gzip) stream.pipe(zlib.createGzip({ level: 6 })).pipe(res); else stream.pipe(res);
      if (log) res.on('finish', () => console.log(`${new Date().toISOString()} ${req.method} ${req.url} 200 ${Date.now() - t0}ms`));
    }
  });
}

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3100;
  const HOST = process.env.HOST || '127.0.0.1';
  const root = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');
  const server = createServer({ root, log: process.env.LOG === '1' });
  server.listen(PORT, HOST, () => {
    console.log(`Mapa Eleições · Apuração 2026`);
    console.log(`  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}   (servindo ${path.resolve(root)})`);
  });
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000).unref(); });
  }
}

module.exports = { createServer, resolveSafe };
