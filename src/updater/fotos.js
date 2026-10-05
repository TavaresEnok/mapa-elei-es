'use strict';
/** Fotos oficiais dos candidatos (TSE): baixa uma vez cada e marca `foto: true` em quem tem arquivo local. */
const fs = require('fs');
const path = require('path');
const { pool, writeFileAtomic, warn } = require('./util');

const REFAZER_FALHAS_MS = 6 * 3600e3;
const ehJpeg = b => b && b.length > 200 && b.length < 2e6 && b[0] === 0xff && b[1] === 0xd8;

function fotosLocais(ctx) {
  if (!ctx.fotos) {
    ctx.fotosDir = path.join(ctx.cfg.out, 'fotos');
    let nomes = [];
    try { nomes = fs.readdirSync(ctx.fotosDir); } catch { /* pasta ainda não existe */ }
    ctx.fotos = new Set(nomes.filter(n => n.endsWith('.jpeg')).map(n => n.slice(0, -5)));
    ctx.fotosFalhas = new Map();
  }
  return ctx.fotos;
}

/** `unidades`: { pres: { BR: unidade, AC: … }, gov: { … }, sen: { … } } */
async function atualizarFotos(ctx, unidades) {
  const tem = fotosLocais(ctx);
  const pendentes = new Map();
  for (const cargo of Object.keys(unidades)) {
    for (const [uf, u] of Object.entries(unidades[cargo])) {
      for (const c of (u && u.candidatos) || []) {
        if (!c.sq || tem.has(c.sq) || pendentes.has(c.sq)) continue;
        const falhou = ctx.fotosFalhas.get(c.sq);
        if (falhou && Date.now() - falhou < REFAZER_FALHAS_MS) continue;
        pendentes.set(c.sq, { cargo, abr: cargo === 'pres' ? 'br' : uf.toLowerCase(), sq: c.sq });
      }
    }
  }
  let baixadas = 0;
  if (ctx.cfg.fotos && !ctx.cfg.dryRun && pendentes.size && ctx.provider.foto) {
    await pool([...pendentes.values()], 8, async j => {
      try {
        const bytes = await ctx.provider.foto(j);
        if (!ehJpeg(bytes)) { ctx.fotosFalhas.set(j.sq, Date.now()); return; }
        writeFileAtomic(path.join(ctx.fotosDir, j.sq + '.jpeg'), bytes);
        tem.add(j.sq); baixadas++;
      } catch (e) { ctx.fotosFalhas.set(j.sq, Date.now()); if (baixadas === 0) warn('foto', j.sq, e.message); }
    });
  }
  for (const cargo of Object.keys(unidades)) {
    for (const u of Object.values(unidades[cargo])) {
      for (const c of (u && u.candidatos) || []) { if (c.sq && tem.has(c.sq)) c.foto = true; else delete c.foto; }
    }
  }
  return baixadas;
}

module.exports = { atualizarFotos, ehJpeg };
