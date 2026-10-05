'use strict';
/** Configuração do updater: constantes do domínio (UFs, cargos) e opções de linha de comando. */
const path = require('path');

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const EXTERIOR = 'ZZ';
const ALL = [...UFS, EXTERIOR];
// código do cargo na API do TSE e nome usado no nosso feed
const CARGOS = {
  pres: { cd: '1', nome: 'presidente' },
  gov: { cd: '3', nome: 'governador' },
  sen: { cd: '5', nome: 'senador' },
};
const UA = 'Mozilla/5.0 (X11; Linux x86_64) mapa-apuracao';

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2), nx = argv[i + 1];
    if (nx === undefined || nx.startsWith('--')) o[k] = true; else { o[k] = nx; i++; }
  }
  return o;
}

function makeConfig(a = {}) {
  const turno = String(a.turno) === '2' ? 2 : 1;
  const root = path.resolve(__dirname, '..', '..');
  return {
    root,
    publicDir: path.join(root, 'public'),
    cacheDir: path.join(root, '.cache'),
    turno,
    once: !!a.once,
    dryRun: !!a['dry-run'],
    ano: '2026',
    base: 'https://resultados.tse.jus.br/oficial',
    eleFed: String(a['ele-federal'] || (turno === 2 ? '6258' : '6257')),
    eleEst: String(a['ele-estadual'] || (turno === 2 ? '6260' : '6259')),
    dia: String(a.dia || (turno === 2 ? '2026-10-25' : '2026-10-04')),
    out: path.resolve(root, String(a.out || 'public/data')),
    interval: Math.max(5, +a.interval || 45),
    concurrency: Math.max(1, +a.concurrency || 16),
    rps: Math.max(5, +a.rps || 120),
    munis: !a['no-munis'],
    fullSweepMs: (+a['full-sweep'] || 20) * 60000,
  };
}

module.exports = { UFS, EXTERIOR, ALL, CARGOS, UA, parseArgs, makeConfig };
