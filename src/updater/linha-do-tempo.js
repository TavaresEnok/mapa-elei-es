'use strict';
/**
 * Linha do tempo: um retrato compacto por minuto da apuração para presidente, para o front poder
 * "voltar no tempo" e repintar o mapa.
 *
 *   linha-do-tempo/indice.json     { versao, ids: [IBGE…], minutos: [1020, 1021, …] }
 *   linha-do-tempo/<minuto>.json   { versao, minuto, br, uf: { AC: … }, lider: […], margem: […], apurado: […] }
 *
 * Os três vetores seguem a ordem de `ids`: número do mais votado (0 = sem votos), vantagem sobre o
 * segundo e seções apuradas, os dois últimos em milésimos (0–1000).
 */
const path = require('path');
const { UFS } = require('./config');
const { loadJson, writeJson } = require('./util');

const resumo = u => ({
  secoes: u.secoes, totalizadas: u.totalizadas,
  votos: Object.fromEntries(u.candidatos.filter(c => !c.anulado).map(c => [c.numero, c.votos])),
});

function retrato(minuto, presidente, tabelas, ids) {
  const posicao = new Map(ids.map((id, i) => [id, i]));
  const lider = new Array(ids.length).fill(0), margem = new Array(ids.length).fill(0), apurado = new Array(ids.length).fill(0);
  for (const uf of UFS) {
    for (const m of tabelas[uf].values()) {
      const i = posicao.get(m.id);
      if (i == null) continue;
      let total = 0, primeiro = 0, segundo = 0, numero = 0;
      for (const [n, v] of Object.entries(m.votos)) {
        total += v;
        if (v > primeiro) { segundo = primeiro; primeiro = v; numero = +n; } else if (v > segundo) segundo = v;
      }
      lider[i] = total ? numero : 0;
      margem[i] = total ? Math.round(((primeiro - segundo) / total) * 1000) : 0;
      apurado[i] = m.secoes ? Math.min(1000, Math.round((m.totalizadas / m.secoes) * 1000)) : 0;
    }
  }
  const uf = {};
  for (const sigla of UFS) if (presidente[sigla]) uf[sigla] = resumo(presidente[sigla]);
  return { versao: 1, minuto, br: resumo(presidente.BR), uf, lider, margem, apurado };
}

/** Grava o retrato do minuto e atualiza o índice. Os ids só são redefinidos se o conjunto de municípios mudar. */
function registrar(ctx, minuto, presidente, tabelas) {
  const atual = [].concat(...UFS.map(uf => [...tabelas[uf].keys()])).sort((a, b) => a - b);
  const indice = loadJson(path.join(ctx.cfg.dirDados, 'linha-do-tempo', 'indice.json'));
  const mesmos = indice && Array.isArray(indice.ids) && indice.ids.length === atual.length && indice.ids.every((id, i) => id === atual[i]);
  const minutos = mesmos ? indice.minutos.filter(m => m !== minuto) : [];
  writeJson(ctx, `linha-do-tempo/${minuto}.json`, retrato(minuto, presidente, tabelas, atual));
  writeJson(ctx, 'linha-do-tempo/indice.json', { versao: 1, ids: atual, minutos: minutos.concat(minuto).sort((a, b) => a - b) });
}

module.exports = { retrato, registrar };
