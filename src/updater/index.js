#!/usr/bin/env node
/**
 * Atualizador de apuração ao vivo
 *
 * Busca os resultados da API pública do TSE (sem token) e grava em public/data/ os JSON que o mapa
 * consome. O navegador faz polling em data/resultado.json, então a tela atualiza sozinha.
 *
 * Fonte (resultados.tse.jus.br/oficial/ele2026/<eleicao>/...):
 *   config/mun-e<eleicao>-cm.json                      municípios: código TSE <-> IBGE, nomes
 *   dados/<uf|br|zz>/<uf>-c0001-e<eleicao>-u.json      presidente  (eleição federal)
 *   dados/<uf>/<uf>-c0003-e<eleicao>-u.json            governador  (eleição estadual)
 *   dados/<uf>/<uf>-c0005-e<eleicao>-u.json            senador     (eleição estadual)
 *   dados/<uf>/<uf><cdTSE>-c0001-e<eleicao>-u.json     presidente por município
 *
 * Saída (public/data/):
 *   resultado.json         Brasil, exterior, UFs e cargos, com candidatos ordenados por votos
 *   municipios/<UF>.json   uma linha por município (presidente); ZZ = países do exterior
 *   historico.json         série por minuto do total nacional
 *
 * Uso:
 *   node src/updater/index.js                 tempo real, em loop (Ctrl+C encerra)
 *   node src/updater/index.js --once          uma rodada e sai
 *   node src/updater/index.js --turno 2       2º turno (eleições 6258/6260)
 *   node src/updater/index.js --dry-run       coleta e valida, não grava nada
 *
 * Opções: --out DIR (public/data) · --interval S (45) · --concurrency N (16) · --rps N (120, req/s máx.)
 *   --no-munis (só nível UF) · --full-sweep MIN (20) · --dia AAAA-MM-DD · --ele-federal N · --ele-estadual N
 *
 * Garantias: nada é gravado se a validação falhar; escrita atômica (tmp + rename); resultado.json é
 * gravado por último, então o app nunca vê dados novos pela metade.
 */
'use strict';

const fs = require('fs');
const { parseArgs, makeConfig } = require('./config');
const { sleep, log, warn } = require('./util');
const { limiter } = require('./http');
const { TseProvider } = require('./providers/tse');
const { loadState } = require('./state');
const { runCycle } = require('./cycle');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); return; }
  const cfg = makeConfig(args);
  limiter.max = limiter.rps = cfg.rps;
  const ctx = { cfg, provider: new TseProvider(cfg), written: 0, first: true };
  if (!cfg.dryRun) fs.mkdirSync(cfg.out, { recursive: true });
  ctx.state = loadState(ctx);

  console.log(`Atualizador de apuração · turno ${cfg.turno} · eleições ${cfg.eleFed}/${cfg.eleEst}${cfg.dryRun ? ' · dry-run' : ''}`);
  console.log(`saída: ${cfg.out} · intervalo ${cfg.interval}s · municípios ${cfg.munis ? 'sim' : 'não'}\n`);

  let parar = false, falhas = 0;
  process.on('SIGINT', () => { parar = true; log('encerrando…'); setTimeout(() => process.exit(0), 3000).unref(); });
  process.on('SIGTERM', () => { parar = true; log('encerrando…'); setTimeout(() => process.exit(0), 3000).unref(); });
  while (!parar) {
    try { await runCycle(ctx); falhas = 0; ctx.first = false; }
    catch (e) { falhas++; warn('rodada falhou:', e.message); if (cfg.once) process.exitCode = 1; }
    if (cfg.once) break;
    await sleep((falhas ? Math.min(120, cfg.interval * 2 ** Math.min(falhas, 3)) : cfg.interval) * 1000);
  }
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
