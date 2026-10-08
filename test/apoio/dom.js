'use strict';
/**
 * Monta o front real (public/index.html + public/js/main.js) dentro do jsdom, servindo os arquivos de
 * public/ pelo fetch. Cada arquivo de teste roda em processo próprio, então main.js é carregado uma vez.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');

const PUBLIC = path.join(__dirname, '..', '..', 'public');
const espera = ms => new Promise(r => setTimeout(r, ms));
const existe = rel => fs.existsSync(path.join(PUBLIC, rel));

async function montarApp(t, url = 'http://localhost/', raiz = PUBLIC) {
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8').replace(/<script[^>]*><\/script>/, '');
  const { window } = new JSDOM(html, { url, pretendToBeVisual: true });
  const erros = [], pedidos = [];
  Object.assign(globalThis, {
    window, document: window.document, location: window.location, history: window.history, localStorage: window.localStorage,
    URLSearchParams: window.URLSearchParams,
    SVGPathElement: window.SVGElement,
    DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } },
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame: f => setTimeout(() => f(performance.now()), 0), cancelAnimationFrame: clearTimeout,
    fetch: async caminho => {
      const rel = String(caminho).split('?')[0];
      pedidos.push(rel);
      const arq = path.join(raiz, rel);
      if (!fs.existsSync(arq)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(arq, 'utf8')) };
    },
  });
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 });
  window.Element.prototype.scrollIntoView = () => {};
  window.addEventListener('error', e => erros.push(e.message));
  process.on('unhandledRejection', e => erros.push(String(e && e.message || e)));
  const intervalos = [];
  const original = globalThis.setInterval;
  globalThis.setInterval = (f, ms) => { const i = original(f, ms); intervalos.push(i); return i; };
  t.after(() => { intervalos.forEach(clearInterval); window.close(); });

  await import(pathToFileURL(path.join(PUBLIC, 'js', 'main.js')).href);
  const $ = sel => window.document.querySelector(sel), $$ = sel => [...window.document.querySelectorAll(sel)];
  for (let i = 0; i < 80 && !$('#placar .manchete'); i++) await espera(100);
  /** Espera uma condição ficar verdadeira (até ~6 s). */
  const ate = async (cond, rotulo = 'condição') => {
    for (let i = 0; i < 120; i++) { if (cond()) return; await espera(50); }
    throw new Error('tempo esgotado esperando: ' + rotulo);
  };
  const evento = (el, tipo) => el.dispatchEvent(new window.Event(tipo, { bubbles: true }));
  return { window, $, $$, espera, ate, evento, erros, pedidos };
}

module.exports = { montarApp, existe, espera, PUBLIC };
