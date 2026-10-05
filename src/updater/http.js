'use strict';
/** Cliente HTTP do TSE: limite global de req/s, ETag, retry com backoff e tratamento de 429. */
const { UA } = require('./config');
const { sleep } = require('./util');

/** Limitador global de requisições/s: o TSE responde 429 acima de certa taxa; recua sozinho e volta a subir. */
const limiter = { max: 120, rps: 120, next: 0, pausedUntil: 0, ok: 0 };
async function throttle() {
  const now = Date.now(), at = Math.max(now, limiter.next, limiter.pausedUntil);
  limiter.next = at + 1000 / limiter.rps;
  if (at > now) await sleep(at - now);
}

/**
 * GET com limite de taxa, retry e tratamento de 429. Devolve { status: 200, corpo, etag } ou { status: 304 | 404 }.
 * `ler` converte a resposta (texto → JSON, ou bytes).
 */
async function requisitar(url, { etag, timeout = 20000, retries = 2, accept = 'application/json', ler }) {
  let tooMany = 0;
  for (let a = 0; ; a++) {
    try {
      await throttle();
      const headers = { 'User-Agent': UA, Accept: accept };
      if (etag) headers['If-None-Match'] = etag;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
      if (res.status === 429) {
        const wait = (parseFloat(res.headers.get('retry-after')) || 1.5) * 1000;
        limiter.pausedUntil = Math.max(limiter.pausedUntil, Date.now() + wait);
        limiter.rps = Math.max(10, limiter.rps * 0.6);
        limiter.ok = 0;
        if (++tooMany > 10) throw new Error('HTTP 429 persistente');
        a--; continue;   // 429 não conta como tentativa
      }
      if (res.status === 404 || res.status === 403) return { status: 404 };
      if (res.status === 304) return { status: 304 };
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (++limiter.ok % 100 === 0) limiter.rps = Math.min(limiter.max, limiter.rps * 1.15);
      return { status: 200, corpo: await ler(res), etag: res.headers.get('etag') };
    } catch (e) {
      if (a >= retries) throw new Error(e.message + ' (' + url + ')');
      await sleep(400 * 2 ** a);
    }
  }
}

async function httpJson(url, opcoes = {}) {
  const r = await requisitar(url, { ...opcoes, ler: async res => JSON.parse((await res.text()).replace(/^\uFEFF/, '')) });
  return r.status === 200 ? { status: 200, json: r.corpo, etag: r.etag } : r;
}

async function httpBytes(url, opcoes = {}) {
  const r = await requisitar(url, { accept: '*/*', ...opcoes, ler: async res => Buffer.from(await res.arrayBuffer()) });
  return r.status === 200 ? r.corpo : null;
}

module.exports = { limiter, throttle, httpJson, httpBytes };
