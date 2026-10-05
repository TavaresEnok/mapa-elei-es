'use strict';
/** Configuração do updater: constantes do domínio (UFs, cargos, datas) e opções de linha de comando. */
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

// Eleições gerais de 2026: dia de votação e códigos das eleições federal/estadual no TSE, por turno.
const ELEICAO = {
  1: { dia: '2026-10-04', federal: '6257', estadual: '6259' },
  2: { dia: '2026-10-25', federal: '6258', estadual: '6260' },
};

/** Turno vigente pela data de Brasília: 2 a partir do dia do 2º turno. */
function turnoAutomatico(agora = new Date()) {
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora);
  return hoje >= ELEICAO[2].dia ? 2 : 1;
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2), nx = argv[i + 1];
    if (nx === undefined || nx.startsWith('--')) o[k] = true; else { o[k] = nx; i++; }
  }
  return o;
}

function makeConfig(a = {}, agora = new Date()) {
  const fixo = ['1', '2'].includes(String(a.turno));
  const turno = fixo ? +a.turno : turnoAutomatico(agora);
  const ele = ELEICAO[turno];
  const root = path.resolve(__dirname, '..', '..');
  const out = path.resolve(root, String(a.out || 'public/data'));
  const simular = !!a.simular;
  return {
    root,
    publicDir: path.join(root, 'public'),
    cacheDir: path.join(root, '.cache'),
    args: a,
    turno, turnoAuto: !fixo,
    simular,
    simMinutos: Math.max(0.2, +a['sim-minutos'] || 4),
    once: !!a.once,
    dryRun: !!a['dry-run'],
    ano: '2026',
    base: 'https://resultados.tse.jus.br/oficial',
    eleFed: String(a['ele-federal'] || ele.federal),
    eleEst: String(a['ele-estadual'] || ele.estadual),
    dia: String(a.dia || ele.dia),
    out,
    // cada turno tem a sua pasta; a simulação nunca toca nos dados reais
    nomeDados: simular ? 'simulacao' : `turno${turno}`,
    dirDados: path.join(out, simular ? 'simulacao' : `turno${turno}`),
    interval: Math.max(2, +a.interval || (simular ? 4 : 45)),
    concurrency: Math.max(1, +a.concurrency || 16),
    rps: Math.max(5, +a.rps || 120),
    munis: !a['no-munis'],
    fotos: !a['no-fotos'],
    fullSweepMs: (+a['full-sweep'] || 20) * 60000,
  };
}

module.exports = { UFS, EXTERIOR, ALL, CARGOS, UA, ELEICAO, turnoAutomatico, parseArgs, makeConfig };
