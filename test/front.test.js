'use strict';
/**
 * Teste de ponta a ponta do front: carrega public/index.html e public/js/main.js no jsdom, serve os arquivos de
 * public/ pelo fetch e exercita cargo, nível, seleção de UF e município. Requer public/data/resultado.json
 * (gerado pelo updater); sem ele, o teste é ignorado.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');

const PUBLIC = path.join(__dirname, '..', 'public');
const temDados = fs.existsSync(path.join(PUBLIC, 'data', 'resultado.json'));
const espera = ms => new Promise(r => setTimeout(r, ms));

test('front: mapa, painel, cargos e seleção', { skip: !temDados, timeout: 60000 }, async t => {
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8').replace(/<script[^>]*><\/script>/, '');
  const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true });
  const { window } = dom;
  const erros = [];
  Object.assign(globalThis, {
    window, document: window.document, location: window.location, history: window.history,
    SVGPathElement: window.SVGElement, DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } },
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame: f => setTimeout(() => f(performance.now()), 0), cancelAnimationFrame: clearTimeout,
    fetch: async url => {
      const arq = path.join(PUBLIC, String(url).split('?')[0]);
      if (!fs.existsSync(arq)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(arq, 'utf8')) };
    },
  });
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 });
  window.Element.prototype.scrollIntoView = () => {};
  window.addEventListener('error', e => erros.push(e.message));
  const intervalos = [];
  const setI = globalThis.setInterval; globalThis.setInterval = (f, ms) => { const i = setI(f, ms); intervalos.push(i); return i; };
  t.after(() => { intervalos.forEach(clearInterval); window.close(); });

  await import(pathToFileURL(path.join(PUBLIC, 'js', 'main.js')).href);
  const $ = sel => document.querySelector(sel);
  for (let i = 0; i < 60 && !$('#painel h2'); i++) await espera(100);

  await t.test('desenha 5.570 municípios e 27 estados', () => {
    assert.strictEqual(document.querySelectorAll('#svg-mapa .m').length, 5570);
    assert.strictEqual(document.querySelectorAll('#svg-mapa .u').length, 27);
    assert.ok(document.querySelectorAll('#svg-mapa .u[fill]').length >= 27, 'estados pintados');
    assert.match($('#svg-mapa').getAttribute('viewBox'), /^[\d. -]+$/);
  });

  await t.test('painel do Brasil lista candidatos e estados', () => {
    assert.strictEqual($('#painel h2').textContent.startsWith('Brasil'), true);
    assert.ok($('#painel .candidato .nome'));
    assert.strictEqual(document.querySelectorAll('#painel tr[data-uf]').length, 27);
    assert.match($('#progresso-valor').textContent, /%/);
    assert.match($('#texto-status').textContent, /TSE/);
  });

  await t.test('selecionar um estado abre a ficha e a tabela de municípios', async () => {
    $('#painel tr[data-uf="SP"]').dispatchEvent(new window.Event('click'));
    await espera(50);
    assert.match($('#painel h2').textContent, /São Paulo/);
    assert.ok(document.querySelectorAll('#painel tr[data-uf]').length > 600, 'municípios de SP');
    assert.strictEqual($('#voltar').hidden, false);
    assert.ok(document.querySelectorAll('#svg-mapa .u.fora').length === 26);
  });

  await t.test('município mostra ficha própria', async () => {
    $('#painel tr[data-uf]').dispatchEvent(new window.Event('click'));
    await espera(50);
    assert.match($('#mapa-titulo').textContent, /· SP$/);
    assert.ok($('#painel .candidato'));
  });

  await t.test('governador e senador: troca de cargo, nível some', async () => {
    $('[data-nivel="municipios"]').click(); await espera(20);
    $('[data-cargo="governador"]').click(); await espera(20);
    assert.strictEqual($('[data-nivel="municipios"]').disabled, true);
    assert.strictEqual($('#svg-mapa').classList.contains('nivel-estados'), true);
    $('#voltar').click(); await espera(20);
    assert.strictEqual($('#painel h2').textContent, 'Governadores');
    $('[data-cargo="senador"]').click(); await espera(20);
    assert.strictEqual($('#painel h2').textContent, 'Senadores');
  });

  await t.test('busca encontra município sem acento', async () => {
    $('[data-cargo="presidente"]').click(); await espera(20);
    $('#abrir-busca').click();
    $('#busca-campo').value = 'sao paulo';
    $('#busca-campo').dispatchEvent(new window.Event('input'));
    const itens = [...document.querySelectorAll('#busca-lista li')].map(li => li.textContent);
    assert.ok(itens.some(x => x.startsWith('São Paulo')), itens.join('|'));
  });

  await t.test('sem erros de execução e sem recursos externos', () => {
    assert.deepStrictEqual(erros, []);
    const externos = [...document.querySelectorAll('[src],[href]')].map(e => e.getAttribute('src') || e.getAttribute('href'))
      .filter(u => /^(https?:)?\/\//.test(u) && !/ibge\.gov\.br|resultados\.tse\.jus\.br/.test(u));
    assert.deepStrictEqual(externos, []);
  });
});
