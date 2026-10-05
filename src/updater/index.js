#!/usr/bin/env node
/**
 * Atualizador de apuração ao vivo
 *
 * Busca os resultados da API pública do TSE (sem token) e grava em public/data/ os JSON que o mapa
 * consome. O navegador consulta resultado.json periodicamente, então a tela atualiza sozinha.
 *
 * Fonte (resultados.tse.jus.br/oficial/ele2026/<eleicao>/...):
 *   config/mun-e<eleicao>-cm.json                      municípios: código TSE <-> IBGE, nomes
 *   dados/<uf|br|zz>/<uf>-c0001-e<eleicao>-u.json      presidente  (eleição federal)
 *   dados/<uf>/<uf>-c0003|c0005-e<eleicao>-u.json      governador / senador (eleição estadual)
 *   dados/<uf>/<uf><cdTSE>-c000N-e<eleicao>-u.json     os mesmos cargos, por município
 *   fotos/<uf|br>/<sqcand>.jpeg                        foto oficial do candidato
 *
 * Saída (public/data/):
 *   indice.json                              turnos disponíveis
 *   fotos/<sq>.jpeg                          fotos dos candidatos
 *   turno<N>/resultado.json                  Brasil, exterior, UFs e cargos, candidatos ordenados por votos
 *   turno<N>/municipios/<cargo>/<UF>.json    uma linha por município (ZZ = países do exterior)
 *   turno<N>/historico.json                  série por minuto do total nacional
 *   turno<N>/linha-do-tempo/                 retrato compacto do mapa a cada minuto
 *
 * Uso:
 *   node src/updater/index.js                 tempo real, em loop (Ctrl+C encerra); turno pela data
 *   node src/updater/index.js --once          uma rodada e sai
 *   node src/updater/index.js --turno 1       força o turno (padrão: 2 a partir de 25/10/2026)
 *   node src/updater/index.js --dry-run       coleta e valida, não grava nada
 *   node src/updater/index.js --simular       reencena a apuração em public/data/simulacao/ (abra /?fonte=simulacao)
 *
 * Opções: --out DIR (public/data) · --interval S (45) · --concurrency N (16) · --rps N (120, req/s máx.)
 *   --no-munis (só nível UF) · --no-fotos · --full-sweep MIN (20) · --sim-minutos M (4)
 *   --dia AAAA-MM-DD · --ele-federal N · --ele-estadual N
 *
 * Garantias: nada é gravado se a validação falhar; escrita atômica (tmp + rename); resultado.json é
 * gravado por último, então o app nunca vê dados novos pela metade.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs, makeConfig, turnoAutomatico } = require('./config');
const { sleep, log, warn } = require('./util');
const { limiter } = require('./http');
const { TseProvider } = require('./providers/tse');
const { SimProvider } = require('./providers/simulado');
const { loadState } = require('./state');
const { runCycle } = require('./cycle');

function criarContexto(args) {
  const cfg = makeConfig(args);
  limiter.max = limiter.rps = cfg.rps;
  if (cfg.simular && !cfg.dryRun && path.basename(cfg.dirDados) === 'simulacao') fs.rmSync(cfg.dirDados, { recursive: true, force: true });
  const ctx = { cfg, provider: cfg.simular ? new SimProvider(cfg) : new TseProvider(cfg), written: 0, first: true };
  if (!cfg.dryRun) fs.mkdirSync(cfg.dirDados, { recursive: true });
  ctx.state = cfg.simular ? {} : loadState(ctx);
  console.log(`Atualizador de apuração · ${cfg.simular ? 'SIMULAÇÃO a partir do ' : ''}${cfg.turno}º turno · eleições ${cfg.eleFed}/${cfg.eleEst}${cfg.dryRun ? ' · dry-run' : ''}`);
  console.log(`saída: ${cfg.dirDados} · intervalo ${cfg.interval}s · municípios ${cfg.munis ? 'sim' : 'não'}\n`);
  return ctx;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); return; }
  let ctx = criarContexto(args);

  let parar = false, falhas = 0;
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.on(sinal, () => { parar = true; log('encerrando…'); setTimeout(() => process.exit(0), 3000).unref(); });
  }
  while (!parar) {
    // virou o dia do 2º turno com o processo no ar: troca de eleição sem precisar reiniciar
    if (ctx.cfg.turnoAuto && !ctx.cfg.simular && turnoAutomatico() !== ctx.cfg.turno) { log('mudança de turno detectada'); ctx = criarContexto(args); }
    try { await runCycle(ctx); falhas = 0; ctx.first = false; }
    catch (e) { falhas++; warn('rodada falhou:', e.message); if (ctx.cfg.once) process.exitCode = 1; }
    if (ctx.cfg.once) break;
    if (ctx.cfg.simular && ctx.provider.p >= 1 && !ctx.first && falhas === 0) { log('simulação concluída'); break; }
    await sleep((falhas ? Math.min(120, ctx.cfg.interval * 2 ** Math.min(falhas, 3)) : ctx.cfg.interval) * 1000);
  }
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
