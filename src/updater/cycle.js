'use strict';
/** Um ciclo de atualização: coleta, valida, atualiza municípios e grava o feed (resultado.json por último). */
const path = require('path');
const { UFS, ALL, EXTERIOR, CARGOS } = require('./config');
const { loadJson, writeJson, pool, log, warn } = require('./util');
const { unidadeDe, minutoDe } = require('./transform');
const { validarUnidade, validarMunicipio, validarResultado, validarHistorico } = require('./validate');
const { carregarTabelas, aplicar, arquivoDe } = require('./municipios');
const { saveState } = require('./state');

async function varrerMunicipios(ctx, tabelas, codigoTse, completo) {
  const jobs = [];
  for (const uf of ALL) {
    for (const m of tabelas[uf].values()) {
      if (!completo && m.secoes && m.totalizadas >= m.secoes) continue;   // já 100%: só reconfere no sweep completo
      const cd = codigoTse.get(uf + ':' + m.id);
      if (cd) jobs.push({ uf, id: m.id, cd });
    }
  }
  const st = { consultados: jobs.length, aplicados: 0, iguais: 0, ausentes: 0, invalidos: 0, erros: 0 };
  await pool(jobs, ctx.cfg.concurrency, async j => {
    try {
      const r = await ctx.provider.doc({ cargo: 'pres', abr: j.uf.toLowerCase(), mun: { cd: j.cd } });
      if (!r) return void st.ausentes++;
      if (r.unchanged) return void st.iguais++;
      const u = unidadeDe(r.doc, 'pres');
      if (!u || validarUnidade(u, `${j.uf}:${j.id}`, 'pres')) { st.invalidos++; return; }
      if (aplicar(tabelas[j.uf], j.id, u)) { st.aplicados++; r.ack(); }
    } catch (e) { st.erros++; if (st.erros <= 3) warn('município', j.uf, j.id, e.message); }
  });
  return st;
}

async function runCycle(ctx) {
  const { cfg, provider, state } = ctx;
  const t0 = Date.now();
  ctx.written = 0;

  const brRes = await provider.doc({ cargo: 'pres', abr: 'br' });
  if (!brRes || !brRes.doc) { log('TSE ainda não publicou resultados — aguardando…'); return; }
  const brDoc = brRes.doc;
  const impressao = [brDoc.ht, brDoc.s && brDoc.s.st, brDoc.v && brDoc.v.tv].join('|');
  if (!ctx.first && impressao === state.impressao) { log(`sem novidade (dados de ${brDoc.ht})`); return; }

  const anterior = loadJson(path.join(cfg.out, 'resultado.json'));
  const minuto = minutoDe(brDoc, cfg) ?? Math.min(2880, (anterior && anterior.minuto) || 0);

  // 1) unidades por cargo / UF
  const brasil = unidadeDe(brDoc, 'pres');
  if (!brasil) throw new Error('documento do Brasil sem s/e/v/carg — formato inesperado');
  const novas = { pres: { BR: brasil }, gov: {}, sen: {} };
  const consultas = [...ALL.map(u => ['pres', u]), ...UFS.map(u => ['gov', u]), ...UFS.map(u => ['sen', u])];
  let falhasUf = 0;
  await pool(consultas, cfg.concurrency, async ([cargo, uf]) => {
    try {
      const r = await provider.doc({ cargo, abr: uf.toLowerCase() });
      const u = r && r.doc && unidadeDe(r.doc, cargo);
      if (u) novas[cargo][uf] = u;
    } catch (e) { falhasUf++; warn(`${cargo} ${uf}:`, e.message); }
  });

  // 2) valida cada unidade; se falhar, mantém a anterior
  const antes = (cargo, uf) => {
    const c = anterior && anterior.cargos && anterior.cargos[CARGOS[cargo].nome];
    if (!c) return null;
    return uf === 'BR' ? c.br : uf === EXTERIOR ? c.exterior : c.uf && c.uf[uf];
  };
  const finais = { pres: {}, gov: {}, sen: {} }, mantidas = [];
  for (const cargo of ['pres', 'gov', 'sen']) {
    for (const uf of cargo === 'pres' ? ['BR', ...ALL] : UFS) {
      const u = novas[cargo][uf];
      const erro = u ? validarUnidade(u, `${cargo}.${uf}`, cargo, cargo === 'sen' ? 2 : 1) : 'indisponível';
      if (!erro) { finais[cargo][uf] = u; continue; }
      const velha = antes(cargo, uf);
      if (velha) { finais[cargo][uf] = velha; mantidas.push(`${cargo}.${uf}`); }
      if (u) warn(`${cargo}.${uf} rejeitado: ${erro}${velha ? ' — mantido valor anterior' : ''}`);
    }
  }
  if (mantidas.length > 10) log(`${mantidas.length} unidades sem dado novo (mantidas)`);

  // 3) municípios
  let varredura = null, tabelas = null;
  if (cfg.munis) {
    const cm = await provider.cm();
    const carregadas = carregarTabelas(cfg, cm);
    tabelas = carregadas.tabelas;
    const completo = ctx.first || Date.now() - (state.ultimoCompleto || 0) > cfg.fullSweepMs;
    varredura = await varrerMunicipios(ctx, tabelas, carregadas.codigoTse, completo);
    if (completo) state.ultimoCompleto = Date.now();
    for (const uf of ALL) for (const m of tabelas[uf].values()) {
      if (m.secoes) { const e = validarMunicipio(m, `${uf}:${m.id}`); if (e) warn('município inconsistente:', e); }
    }
  }

  // 4) monta e valida o resultado
  const gerado = Date.now();
  const { BR, ...ufsPres } = finais.pres;
  const exterior = ufsPres[EXTERIOR]; delete ufsPres[EXTERIOR];
  const resultado = {
    versao: 2, gerado, turno: cfg.turno, minuto,
    atualizadoTse: { data: brDoc.dt || brDoc.dg || '', hora: brDoc.ht || brDoc.hg || '' },
    cargos: {
      presidente: { br: BR, exterior, uf: ufsPres },
      governador: { uf: finais.gov },
      senador: { uf: finais.sen },
    },
  };
  const erroResultado = validarResultado(resultado, cfg);
  if (erroResultado) throw new Error('resultado inválido: ' + erroResultado + ' — nada foi gravado');

  const hist = loadJson(path.join(cfg.out, 'historico.json')) || { versao: 2, pontos: [] };
  const votos = Object.fromEntries(BR.candidatos.filter(c => !c.anulado).map(c => [c.numero, c.votos]));
  const ponto = { minuto, totalizadas: BR.totalizadas, secoes: BR.secoes, votos };
  const historico = { versao: 2, pontos: (hist.pontos || []).filter(p => p.minuto !== minuto).concat(ponto).sort((a, b) => a.minuto - b.minuto) };
  const erroHist = validarHistorico(historico);
  if (erroHist) throw new Error('historico inválido: ' + erroHist);

  // 5) grava: tudo antes, resultado.json por último (o front nunca vê dados novos pela metade)
  if (tabelas) for (const uf of ALL) writeJson(ctx, `municipios/${uf}.json`, arquivoDe(uf, tabelas[uf], gerado));
  writeJson(ctx, 'historico.json', historico);
  writeJson(ctx, 'resultado.json', resultado);

  state.impressao = impressao;
  saveState(ctx);

  const pct = (BR.totalizadas / BR.secoes * 100).toFixed(2);
  const lideres = BR.candidatos.slice(0, 2).map(c => `${c.nome}: ${c.votos.toLocaleString('pt-BR')}`).join(' · ');
  const hh = `${String(Math.floor(minuto / 60) % 24).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`;
  log(`${cfg.dryRun ? '[dry-run] ' : ''}t=${minuto} (${hh}) · ${pct}% seções · ${lideres} · ${BR.situacao}`
    + (varredura ? ` · municípios ${varredura.aplicados}/${varredura.consultados}${varredura.iguais ? ` (${varredura.iguais} iguais)` : ''}`
      + (varredura.invalidos + varredura.erros + varredura.ausentes ? ` ⚠ inválidos:${varredura.invalidos} erros:${varredura.erros} 404:${varredura.ausentes}` : '') : '')
    + ` · ${ctx.written} arquivos · ${Date.now() - t0}ms${falhasUf ? ` · ${falhasUf} falhas de UF` : ''}`);
}

module.exports = { varrerMunicipios, runCycle };
