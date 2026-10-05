'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const { createServer, resolveSafe, criarCacheGzip } = require('../src/server');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa-srv-'));
fs.writeFileSync(path.join(root, 'index.html'), '<h1>ok</h1>');
fs.mkdirSync(path.join(root, 'assets'));
fs.writeFileSync(path.join(root, 'assets', 'app.1e2cc0fa46.js'), 'x');
fs.writeFileSync(path.join(root, '.secret'), 'nope');
fs.writeFileSync(path.join(path.dirname(root), 'mapa-outside.txt'), 'outside');

function get(port, p, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, host: '127.0.0.1', path: p, method: 'GET', ...opts }, res => {
      const partes = []; res.on('data', d => partes.push(d));
      res.on('end', () => { const bruto = Buffer.concat(partes); resolve({ status: res.statusCode, headers: res.headers, bruto, body: bruto.toString() }); });
    });
    req.on('error', reject); req.end();
  });
}

test('servidor estático', async t => {
  const server = createServer({ root });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  t.after(() => server.close());

  await t.test('serve / como index.html, sem CORS aberto', async () => {
    const r = await get(port, '/');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body, '<h1>ok</h1>');
    assert.strictEqual(r.headers['access-control-allow-origin'], undefined);
    assert.strictEqual(r.headers['cache-control'], 'no-cache');
  });
  await t.test('política de segurança de conteúdo e gzip (com cache)', async () => {
    const conteudo = JSON.stringify({ x: 'a'.repeat(5000) });
    fs.writeFileSync(path.join(root, 'grande.json'), conteudo);
    for (let i = 0; i < 2; i++) {   // a 2ª resposta vem do cache
      const r = await get(port, '/grande.json', { headers: { 'Accept-Encoding': 'gzip' } });
      assert.strictEqual(r.headers['content-encoding'], 'gzip');
      assert.strictEqual(+r.headers['content-length'], r.bruto.length);
      assert.strictEqual(zlib.gunzipSync(r.bruto).toString(), conteudo);
    }
    fs.writeFileSync(path.join(root, 'grande.json'), conteudo + ' ');   // arquivo mudou: cache não pode servir o antigo
    fs.utimesSync(path.join(root, 'grande.json'), new Date(), new Date(Date.now() + 5000));
    const novo = await get(port, '/grande.json', { headers: { 'Accept-Encoding': 'gzip' } });
    assert.strictEqual(zlib.gunzipSync(novo.bruto).toString(), conteudo + ' ');
    assert.strictEqual((await get(port, '/grande.json')).body, conteudo + ' ', 'sem gzip para quem não pede');
    const i = await get(port, '/');
    assert.match(i.headers['content-security-policy'], /default-src 'self'/);
    assert.match(i.headers['content-security-policy'], /script-src 'self'/);
  });
  await t.test('/saude: 503 sem dados, 200 com resultado publicado', async () => {
    assert.strictEqual((await get(port, '/saude')).status, 503);
    fs.mkdirSync(path.join(root, 'data', 'turno1'), { recursive: true });
    fs.writeFileSync(path.join(root, 'data', 'turno1', 'resultado.json'), JSON.stringify({ turno: 1, gerado: Date.now() - 4000,
      atualizadoTse: { hora: '18:00:00' }, cargos: { presidente: { br: { secoes: 10, totalizadas: 4 } } } }));
    const r = await get(port, '/saude');
    assert.strictEqual(r.status, 200);
    const j = JSON.parse(r.body);
    assert.strictEqual(j.ok, true); assert.strictEqual(j.totalizadas, 4); assert.ok(j.idadeSegundos >= 3);
  });
  await t.test('assets com hash são imutáveis', async () => {
    const r = await get(port, '/assets/app.1e2cc0fa46.js');
    assert.match(r.headers['cache-control'], /immutable/);
  });
  await t.test('304 com ETag', async () => {
    const a = await get(port, '/assets/app.1e2cc0fa46.js');
    const b = await get(port, '/assets/app.1e2cc0fa46.js', { headers: { 'If-None-Match': a.headers.etag } });
    assert.strictEqual(b.status, 304);
  });
  await t.test('path traversal é bloqueado', async () => {
    for (const p of ['/../mapa-outside.txt', '/%2e%2e/mapa-outside.txt', '/..%2fmapa-outside.txt', '/assets/../../mapa-outside.txt']) {
      const r = await get(port, p);
      assert.notStrictEqual(r.body, 'outside', p);
      assert.ok([400, 404].includes(r.status), `${p} → ${r.status}`);
    }
  });
  await t.test('dotfiles e URLs inválidas', async () => {
    assert.strictEqual((await get(port, '/.secret')).status, 400);
    assert.strictEqual((await get(port, '/%E0%A4%A')).status, 400);
    assert.strictEqual((await get(port, '/nao-existe')).status, 404);
  });
  await t.test('só GET/HEAD', async () => {
    const r = await get(port, '/', { method: 'POST' });
    assert.strictEqual(r.status, 405);
  });
});

test('cache de gzip respeita o limite de memória', () => {
  const c = criarCacheGzip(250);
  c.guardar('a', '1', Buffer.alloc(100)); c.guardar('b', '1', Buffer.alloc(100));
  assert.ok(c.obter('a', '1'));                       // 'a' passa a ser o mais recente
  c.guardar('c', '1', Buffer.alloc(100));             // estoura: sai o menos recente ('b')
  assert.strictEqual(c.obter('b', '1'), null);
  assert.ok(c.obter('a', '1')); assert.ok(c.obter('c', '1'));
  assert.strictEqual(c.obter('a', '2'), null, 'ETag diferente não serve');
});

test('resolveSafe', () => {
  assert.strictEqual(resolveSafe('/a/b', '/x/../../etc/passwd'), path.resolve('/a/b/etc/passwd'));
  assert.strictEqual(resolveSafe('/a/b', '/x.json?v=1'), path.resolve('/a/b/x.json'));
});
