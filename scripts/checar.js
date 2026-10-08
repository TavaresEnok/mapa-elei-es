#!/usr/bin/env node
'use strict';
/**
 * Conferência antes (e durante) a apuração: o que está pronto e o que falta.
 *
 *   node scripts/checar.js            confere o turno vigente pela data
 *   node scripts/checar.js --turno 2  confere o 2º turno, mesmo antes do dia
 *
 * Sai com código 1 se houver algum item crítico com falha.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { makeConfig, parseArgs, ELEICAO, UA } = require('../src/updater/config');

const cfg = makeConfig(parseArgs(process.argv.slice(2)));
const PORTA = process.env.PORT || 3100;
let falhas = 0;

const ok = (msg) => console.log(`  ✔ ${msg}`);
const info = (msg) => console.log(`  • ${msg}`);
const falha = (msg) => { falhas++; console.log(`  ✖ ${msg}`); };

async function http(url, comoJson = true) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { status: r.status };
    return { status: 200, corpo: comoJson ? JSON.parse((await r.text()).replace(/^﻿/, '')) : await r.text() };
  } catch (e) { return { status: 0, erro: e.message }; }
}

async function tse() {
  console.log(`\nTSE (${cfg.turno}º turno, eleições ${cfg.eleFed} federal / ${cfg.eleEst} estadual, dia ${cfg.dia})`);
  const base = `${cfg.base}/ele${cfg.ano}`;
  const lista = await http(`${cfg.base}/comum/config/ele-c.json`);
  if (lista.status !== 200) return falha(`API do TSE inacessível (${lista.erro || 'HTTP ' + lista.status})`);
  ok('API do TSE responde');
  const eleicoes = (lista.corpo.pl || []).flatMap(p => p.e || []);
  const federal = eleicoes.find(e => e.cd === ELEICAO[1].federal), estadual = eleicoes.find(e => e.cd === ELEICAO[1].estadual);
  if (federal && estadual && federal.cdt2 === ELEICAO[2].federal && estadual.cdt2 === ELEICAO[2].estadual) ok(`códigos do 2º turno conferem com o TSE (${federal.cdt2} e ${estadual.cdt2})`);
  else falha(`códigos do 2º turno diferentes do esperado: TSE informa ${federal && federal.cdt2} / ${estadual && estadual.cdt2}. Use --ele-federal e --ele-estadual`);

  const e6 = cfg.eleFed.padStart(6, '0');
  const cm = await http(`${base}/${cfg.eleFed}/config/mun-e${e6}-cm.json`);
  if (cm.status === 200) ok('config de municípios publicada');
  else if (fs.existsSync(path.join(cfg.cacheDir, 'tse_cm.json'))) info(`config de municípios do ${cfg.turno}º turno ainda não publicada (HTTP ${cm.status}); o updater usa a cópia local do 1º turno`);
  else falha('sem config de municípios (nem no TSE, nem em cache)');

  const br = await http(`${base}/${cfg.eleFed}/dados/br/br-c0001-e${e6}-u.json`);
  if (br.status === 200) {
    const s = br.corpo.s || {};
    ok(`resultado de presidente publicado: ${s.st} de ${s.ts} seções (${br.corpo.dt} ${br.corpo.ht})`);
  } else info(`resultado de presidente ainda não publicado (HTTP ${br.status}): normal antes das 17h do dia ${cfg.dia}`);
}

function local() {
  console.log('\nDados locais');
  const geo = path.join(cfg.publicDir, 'data', 'geo', 'brasil.json');
  fs.existsSync(geo) ? ok('geometria do IBGE presente') : falha('falta public/data/geo/brasil.json (rode npm run geo)');
  const r1 = path.join(cfg.out, 'turno1', 'resultado.json');
  fs.existsSync(r1) ? ok('resultado do 1º turno presente (referência dos estados já decididos)') : info('sem resultado do 1º turno em disco');
  const atual = path.join(cfg.dirDados, 'resultado.json');
  if (fs.existsSync(atual)) {
    const r = JSON.parse(fs.readFileSync(atual, 'utf8')), br = r.cargos.presidente.br;
    ok(`${cfg.turno}º turno: ${br.totalizadas} de ${br.secoes} seções, gravado há ${Math.round((Date.now() - r.gerado) / 60000)} min`);
  } else info(`ainda sem dados do ${cfg.turno}º turno em ${path.relative(cfg.root, cfg.dirDados)}/`);
  let fotos = 0;
  try { fotos = fs.readdirSync(path.join(cfg.out, 'fotos')).length; } catch { /* sem pasta */ }
  fotos ? ok(`${fotos} fotos de candidatos`) : info('nenhuma foto baixada ainda');
  try {
    const d = fs.statfsSync(cfg.root), livreGb = (d.bavail * d.bsize) / 1e9;
    livreGb > 2 ? ok(`${livreGb.toFixed(1)} GB livres em disco`) : falha(`pouco espaço em disco: ${livreGb.toFixed(1)} GB`);
  } catch { /* statfs indisponível */ }
}

async function servicos() {
  console.log('\nServiços');
  const s = await http(`http://127.0.0.1:${PORTA}/saude`);
  if (s.status === 200) ok(`servidor web responde na porta ${PORTA} (turno ${s.corpo.turno}, dados de ${s.corpo.idadeSegundos}s atrás)`);
  else falha(`servidor web não responde em 127.0.0.1:${PORTA}/saude (${s.erro || 'HTTP ' + s.status})`);
  try {
    const lista = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    for (const nome of ['mapa-web', 'mapa-tse']) {
      const p = lista.find(x => x.name === nome);
      if (!p) falha(`${nome} não está no PM2`);
      else if (p.pm2_env.status !== 'online') falha(`${nome} está ${p.pm2_env.status}`);
      else ok(`${nome} online (${p.pm2_env.restart_time} reinícios, ${Math.round(p.monit.memory / 1e6)} MB)`);
    }
  } catch { info('PM2 não encontrado: confira os processos manualmente'); }
}

(async () => {
  console.log(`Conferência do Mapa da Apuração, ${new Date().toLocaleString('pt-BR')}`);
  await tse(); local(); await servicos();
  console.log(falhas ? `\n${falhas} item(ns) precisam de atenção.` : '\nTudo pronto.');
  process.exit(falhas ? 1 : 0);
})();
