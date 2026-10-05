'use strict';
/** Utilidades compartilhadas: log, conversões numéricas, JSON em disco e pool de concorrência. */
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('pt-BR')}]`, ...a);
const warn = (...a) => console.warn(`[${new Date().toLocaleTimeString('pt-BR')}] ⚠`, ...a);
const int = v => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : 0; };
const isNat = v => Number.isInteger(v) && v >= 0;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function loadJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

/** Escrita atômica: grava em tmp e renomeia, para ninguém ler um arquivo pela metade. */
function writeFileAtomic(file, dados) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, dados);
  try { fs.renameSync(tmp, file); }
  catch (e) { try { fs.unlinkSync(tmp); } catch {} throw e; }
}

/** Grava um JSON na pasta de dados do turno (ou em `base`, se informado). No dry-run, não grava. */
function writeJson(ctx, rel, obj, base = ctx.cfg.dirDados) {
  if (ctx.cfg.dryRun) return;
  writeFileAtomic(path.join(base, rel), JSON.stringify(obj));
  ctx.written++;
}

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

module.exports = { sleep, log, warn, int, isNat, clamp, norm, loadJson, pool, writeJson, writeFileAtomic };
