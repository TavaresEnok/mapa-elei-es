'use strict';
/**
 * Um ciclo de atualização, em duas fases:
 *   A) Brasil/UFs de todos os cargos + municípios de presidente → grava resultado.json (por último)
 *   B) municípios de governador e senador → grava depois, para não atrasar o resultado principal
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { UFS, ALL, EXTERIOR, CARGOS } = require('./config');
const { loadJson, writeJson, pool, log, warn } = require('./util');
const { unidadeDe, minutoDe } = require('./transform');
const { validarUnidade, validarMunicipio, validarResultado, validarHistorico } = require('./validate');
const { carregarTabelas, aplicar, arquivoDe, ufsDoCargo, caminho } = require('./municipios');
const { atualizarFotos } = require('./fotos');
const linhaDoTempo = require('./linha-do-tempo');
const { saveState } = require('./state');

const ORDEM = ['pres', 'gov', 'sen'];
const votosPorEleitor = cargo => (cargo === 'sen' ? 2 : 1);

/** Busca Brasil + UFs de todos os cargos. Devolve null se o TSE ainda não publicou nada. */
async function coletarUnidades(ctx) {
  const { cfg, provider } = ctx;
  const brRes = await provider.doc({ cargo: 'pres', abr: 'br' });
  if (!brRes || !brRes.doc) return null;
  const docs = { pres: { BR: brRes.doc }, gov: {}, sen: {} };
  const consultas = [...ALL.map(u => ['pres', u]), ...UFS.map(u => ['gov', u]), ...UFS.map(u => ['sen', u])];
  let falhas = 0;
  await pool(consultas, cfg.concurrency, async ([cargo, uf]) => {
    try {
      const r = await provider.doc({ cargo, abr: uf.toLowerCase() });
      if (r && r.doc) docs[cargo][uf] = r.doc;
    } catch (e) { falhas++; warn(`${cargo} ${uf}:`, e.message); }
  });
  // impressão digital de tudo o que veio: se nada mudou, a rodada termina aqui
  const partes = [];
  for (const cargo of ORDEM) for (const uf of Object.keys(docs[cargo]).sort()) {
    const d = docs[cargo][uf];
    partes.push(`${cargo}.${uf}:${d.ht || d.hg}|${d.s && d.s.st}|${d.v && d.v.tv}`);
  }
  return { docs, falhas, impressao: crypto.createHash('sha1').update(partes.join('\n')).digest('hex') };
}

async function varrerMunicipios(ctx, cargo, tabelas, codigoTse, ufs, completo) {
  const jobs = [];
  for (const uf of ufs) {
    for (const m of tabelas[uf].values()) {
      if (!completo && m.secoes && m.totalizadas >= m.secoes) continue;   // já 100%: só reconfere no sweep completo
      const cd = codigoTse.get(uf + ':' + m.id);
      if (cd) jobs.push({ uf, id: m.id, cd });
    }
  }
  const st = { consultados: jobs.length, aplicados: 0, iguais: 0, ausentes: 0, invalidos: 0, erros: 0 };
  await pool(jobs, ctx.cfg.concurrency, async j => {
    try {
      const r = await ctx.provider.doc({ cargo, abr: j.uf.toLowerCase(), mun: { cd: j.cd, id: j.id } });
      if (!r) return void st.ausentes++;
      if (r.unchanged) return void st.iguais++;
      const u = unidadeDe(r.doc, cargo);
      if (!u || validarUnidade(u, `${cargo} ${j.uf}:${j.id}`, cargo, votosPorEleitor(cargo))) { st.invalidos++; return; }
      if (aplicar(tabelas[j.uf], j.id, u)) { st.aplicados++; r.ack(); }
    } catch (e) { st.erros++; if (st.erros <= 3) warn('município', cargo, j.uf, j.id, e.message); }
  });
  return st;
}

const textoVarredura = (rotulo, v) => ` · ${rotulo} ${v.aplicados}/${v.consultados}${v.iguais ? ` (${v.iguais} iguais)` : ''}`
  + (v.invalidos + v.erros + v.ausentes ? ` ⚠ inválidos:${v.invalidos} erros:${v.erros} 404:${v.ausentes}` : '');

/** Lista os turnos que já têm resultado, para o front oferecer a troca. */
function gravarIndice(ctx) {
  const { cfg } = ctx;
  if (cfg.simular) return;
  const turnos = [1, 2].filter(t => t === cfg.turno || fs.existsSync(path.join(cfg.out, `turno${t}`, 'resultado.json')));
  writeJson(ctx, 'indice.json', { versao: 3, turnos, atual: Math.max(...turnos) }, cfg.out);
}

async function runCycle(ctx) {
  const { cfg, provider, state } = ctx;
  const t0 = Date.now();
  ctx.written = 0;
  if (provider.avancar) provider.avancar();

  const coleta = await coletarUnidades(ctx);
  if (!coleta) { log('TSE ainda não publicou resultados — aguardando…'); return; }
  const { docs } = coleta;
  if (!ctx.first && coleta.impressao === state.impressao) { log(`sem novidade (dados de ${docs.pres.BR.ht || docs.pres.BR.hg})`); return; }

  const anterior = loadJson(path.join(cfg.dirDados, 'resultado.json'));
  const minuto = minutoDe(docs.pres.BR, cfg) ?? Math.min(2880, (anterior && anterior.minuto) || 0);

  // 1) valida cada unidade; se falhar, mantém a anterior
  const antes = (cargo, uf) => {
    const c = anterior && anterior.cargos && anterior.cargos[CARGOS[cargo].nome];
    if (!c) return null;
    return uf === 'BR' ? c.br : uf === EXTERIOR ? c.exterior : c.uf && c.uf[uf];
  };
  const finais = { pres: {}, gov: {}, sen: {} }, mantidas = [];
  for (const cargo of ORDEM) {
    for (const uf of cargo === 'pres' ? ['BR', ...ALL] : UFS) {
      const u = docs[cargo][uf] ? unidadeDe(docs[cargo][uf], cargo) : null;
      const erro = u ? validarUnidade(u, `${cargo}.${uf}`, cargo, votosPorEleitor(cargo)) : 'indisponível';
      if (!erro) { finais[cargo][uf] = u; continue; }
      const velha = antes(cargo, uf);
      if (velha) { finais[cargo][uf] = velha; mantidas.push(`${cargo}.${uf}`); }
      if (u) warn(`${cargo}.${uf} rejeitado: ${erro}${velha ? ' — mantido valor anterior' : ''}`);
    }
  }
  if (!finais.pres.BR) throw new Error('documento do Brasil inválido e sem valor anterior');
  if (mantidas.length > 10) log(`${mantidas.length} unidades sem dado novo (mantidas)`);

  const fotosNovas = await atualizarFotos(ctx, finais);

  // 2) municípios de presidente
  const completo = ctx.first || Date.now() - (state.ultimoCompleto || 0) > cfg.fullSweepMs;
  let cm = null, pres = null, varPres = null;
  if (cfg.munis) {
    cm = await provider.cm();
    pres = carregarTabelas(cfg, cm, 'pres');
    varPres = await varrerMunicipios(ctx, 'pres', pres.tabelas, pres.codigoTse, ALL, completo);
    for (const uf of ALL) for (const m of pres.tabelas[uf].values()) {
      if (m.secoes) { const e = validarMunicipio(m, `${uf}:${m.id}`); if (e) warn('município inconsistente:', e); }
    }
  }

  // 3) monta e valida o resultado
  const gerado = Date.now();
  const { BR, ...ufsPres } = finais.pres;
  const exterior = ufsPres[EXTERIOR]; delete ufsPres[EXTERIOR];
  const resultado = {
    versao: 3, gerado, turno: cfg.turno, minuto,
    atualizadoTse: { data: docs.pres.BR.dt || docs.pres.BR.dg || '', hora: docs.pres.BR.ht || docs.pres.BR.hg || '' },
    cargos: {
      presidente: { br: BR, exterior, uf: ufsPres },
      governador: { uf: finais.gov },
      senador: { uf: finais.sen },
    },
  };
  if (cfg.simular) resultado.simulacao = true;
  const erroResultado = validarResultado(resultado, cfg);
  if (erroResultado) throw new Error('resultado inválido: ' + erroResultado + ' — nada foi gravado');

  const hist = loadJson(path.join(cfg.dirDados, 'historico.json')) || { versao: 2, pontos: [] };
  const votos = Object.fromEntries(BR.candidatos.filter(c => !c.anulado).map(c => [c.numero, c.votos]));
  const ponto = { minuto, totalizadas: BR.totalizadas, secoes: BR.secoes, votos };
  const historico = { versao: 2, pontos: (hist.pontos || []).filter(p => p.minuto !== minuto).concat(ponto).sort((a, b) => a.minuto - b.minuto) };
  const erroHist = validarHistorico(historico);
  if (erroHist) throw new Error('historico inválido: ' + erroHist);

  // 4) grava a fase A: tudo antes, resultado.json por último (o front nunca vê dados novos pela metade)
  if (pres) {
    for (const uf of ALL) writeJson(ctx, caminho('pres', uf), arquivoDe('pres', uf, pres.tabelas[uf], gerado));
    linhaDoTempo.registrar(ctx, minuto, finais.pres, pres.tabelas);
  }
  writeJson(ctx, 'historico.json', historico);
  writeJson(ctx, 'resultado.json', resultado);
  gravarIndice(ctx);
  const msFaseA = Date.now() - t0;

  // 5) fase B: municípios de governador e senador (só nas UFs com disputa neste turno)
  let textoB = '';
  if (cfg.munis) {
    for (const cargo of ['gov', 'sen']) {
      const ufs = ufsDoCargo(cargo).filter(uf => finais[cargo][uf]);
      if (!ufs.length) continue;
      const { tabelas, codigoTse } = carregarTabelas(cfg, cm, cargo);
      const v = await varrerMunicipios(ctx, cargo, tabelas, codigoTse, ufs, completo);
      for (const uf of ufs) writeJson(ctx, caminho(cargo, uf), arquivoDe(cargo, uf, tabelas[uf], gerado));
      textoB += textoVarredura(CARGOS[cargo].nome, v);
    }
    if (completo) state.ultimoCompleto = Date.now();
  }

  state.impressao = coleta.impressao;
  saveState(ctx);

  const pct = (BR.totalizadas / BR.secoes * 100).toFixed(2);
  const lideres = BR.candidatos.slice(0, 2).map(c => `${c.nome}: ${c.votos.toLocaleString('pt-BR')}`).join(' · ');
  const hh = `${String(Math.floor(minuto / 60) % 24).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`;
  log(`${cfg.dryRun ? '[dry-run] ' : ''}${cfg.simular ? '[simulação] ' : ''}t=${minuto} (${hh}) · ${pct}% seções · ${lideres} · ${BR.situacao}`
    + (varPres ? textoVarredura('presidente', varPres) : '') + textoB
    + (fotosNovas ? ` · ${fotosNovas} fotos novas` : '')
    + ` · ${ctx.written} arquivos · ${msFaseA}ms + ${Date.now() - t0 - msFaseA}ms${coleta.falhas ? ` · ${coleta.falhas} falhas de UF` : ''}`);
}

module.exports = { coletarUnidades, varrerMunicipios, runCycle };
