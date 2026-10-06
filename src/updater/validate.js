'use strict';
/** Regras de consistência — nada é gravado se alguma falhar. Cada função devolve null (ok) ou a descrição do problema. */
const { UFS, ALL } = require('./config');
const { isNat } = require('./util');

const SITUACOES = {
  pres: new Set(['apurando', 'eleito', 'segundo-turno']),
  gov: new Set(['apurando', 'eleito', 'segundo-turno']),
  sen: new Set(['apurando', 'parcial', 'definido']),
};
const CONTADORES = ['secoes', 'totalizadas', 'eleitorado', 'apurado', 'comparecimento', 'brancos', 'nulos'];

/** Unidade (Brasil, UF, exterior ou município). `vagas` é o nº de votos por eleitor (2 para senador em eleição de 2/3). */
function validarUnidade(u, rotulo, cargo = 'pres', votosPorEleitor = 1) {
  if (!u || typeof u !== 'object') return `${rotulo}: ausente`;
  for (const k of CONTADORES) if (!isNat(u[k])) return `${rotulo}.${k}: ${u[k]}`;
  if (!u.secoes) return `${rotulo}: sem seções`;
  if (u.totalizadas > u.secoes) return `${rotulo}: mais seções totalizadas que seções`;
  if (u.apurado > u.eleitorado * 1.01 + 10) return `${rotulo}: apurado maior que o eleitorado`;
  if (u.comparecimento > u.apurado * 1.01 + 10) return `${rotulo}: comparecimento maior que o apurado`;
  if (!Array.isArray(u.candidatos)) return `${rotulo}.candidatos: ausente`;
  let validos = 0;
  const vistos = new Set();
  for (const c of u.candidatos) {
    if (!c || !/^\d+$/.test(c.numero) || !isNat(c.votos)) return `${rotulo}: candidato inválido`;
    if (vistos.has(c.numero)) return `${rotulo}: candidato ${c.numero} repetido`;
    vistos.add(c.numero);
    validos += c.votos;
  }
  if (validos + u.brancos + u.nulos > u.comparecimento * votosPorEleitor * 1.005 + 10) return `${rotulo}: votos somam mais que o comparecimento`;
  return SITUACOES[cargo].has(u.situacao) ? null : `${rotulo}.situacao: ${u.situacao}`;
}

/** Linha de município (sem lista de candidatos; votos em { numero: votos }). */
function validarMunicipio(m, rotulo) {
  if (!m || typeof m !== 'object') return `${rotulo}: ausente`;
  for (const k of CONTADORES) if (!isNat(m[k])) return `${rotulo}.${k}: ${m[k]}`;
  if (!m.secoes || m.totalizadas > m.secoes) return `${rotulo}: seções`;
  if (!m.votos || typeof m.votos !== 'object') return `${rotulo}.votos: ausente`;
  let soma = 0;
  for (const k in m.votos) { if (!isNat(m.votos[k])) return `${rotulo}.votos.${k}`; soma += m.votos[k]; }
  if (m.anulados != null && !isNat(m.anulados)) return `${rotulo}.anulados`;
  if (soma + (m.anulados || 0) + m.brancos + m.nulos > m.comparecimento * 2.01 + 10) return `${rotulo}: votos somam mais que o dobro do comparecimento`;
  if (m.comparecimento > m.apurado * 1.01 + 10) return `${rotulo}: comparecimento maior que o apurado`;
  return null;
}

function validarResultado(r, cfg) {
  if (!r || r.versao !== 3 || !isNat(r.gerado) || !isNat(r.minuto) || r.minuto > 2880) return 'cabeçalho';
  if (r.turno !== cfg.turno) return 'turno';
  const { presidente: p, governador: g, senador: s } = r.cargos || {};
  if (!p || !p.uf || !g || !g.uf || !s || !s.uf) return 'cargos ausentes';
  let erro = validarUnidade(p.br, 'presidente.br', 'pres');
  if (erro) return erro;
  let totalizadas = 0;
  for (const uf of ALL) {
    const u = uf === 'ZZ' ? p.exterior : p.uf[uf];
    if ((erro = validarUnidade(u, 'presidente.' + uf, 'pres'))) return erro;
    totalizadas += u.totalizadas;
  }
  if (Math.abs(totalizadas - p.br.totalizadas) > Math.max(2, p.br.secoes * 0.25)) return 'Brasil não é a soma dos estados';
  // no 2º turno só alguns estados têm governador / senador em disputa
  for (const uf of UFS) {
    if ((g.uf[uf] != null || cfg.turno !== 2) && (erro = validarUnidade(g.uf[uf], 'governador.' + uf, 'gov'))) return erro;
    if ((s.uf[uf] != null || cfg.turno !== 2) && (erro = validarUnidade(s.uf[uf], 'senador.' + uf, 'sen', 2))) return erro;
  }
  return null;
}

function validarHistorico(h) {
  if (!h || h.versao !== 2 || !Array.isArray(h.pontos)) return 'cabeçalho';
  for (const p of h.pontos) {
    if (!p || !isNat(p.minuto) || !isNat(p.totalizadas) || !(p.secoes > 0) || p.totalizadas > p.secoes || !p.votos) return 'ponto';
    for (const k in p.votos) if (!isNat(p.votos[k])) return 'votos';
  }
  return null;
}

module.exports = { SITUACOES, validarUnidade, validarMunicipio, validarResultado, validarHistorico };
