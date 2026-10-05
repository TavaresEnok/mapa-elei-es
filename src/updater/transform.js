'use strict';
/**
 * Documento do TSE (-u.json) → "unidade" do nosso feed.
 *
 * Campos do TSE usados: s.ts/s.st seções · e.te/e.esa/e.c eleitorado/apurado/comparecimento ·
 * v.vb brancos, v.tvn nulos · carg[].agr[].par[].cand[]: n número, nm/nmu nome, vap votos,
 * dvt validade ("Válido" / "Anulado…"), st situação ("Eleito", "2º turno"…); par.sg sigla do partido.
 */
const { CARGOS } = require('./config');
const { int, norm } = require('./util');

/** Percorre os candidatos de um cargo, devolvendo também a sigla do partido. */
function* candidatosDe(carg) {
  const partidos = [];
  for (const agr of carg.agr || []) for (const p of agr.par || []) partidos.push(p);
  for (const p of carg.par || []) partidos.push(p);
  for (const p of partidos) for (const c of p.cand || []) yield { c, partido: p.sg || '' };
}

function unidadeDe(doc, cargo) {
  if (!doc || !doc.s || !doc.e || !doc.v || !Array.isArray(doc.carg)) return null;
  const carg = doc.carg.find(c => String(c.cd) === CARGOS[cargo].cd) || doc.carg[0];
  if (!carg) return null;

  const candidatos = [];
  let eleitos = 0, segundoTurno = 0;
  for (const { c, partido } of candidatosDe(carg)) {
    const numero = String(c.n);
    if (!/^\d+$/.test(numero)) continue;
    const st = norm(c.st);
    const eleito = /^eleit/.test(st), vaiAoSegundo = /^2/.test(st) && /turno/.test(st);
    if (eleito) eleitos++; else if (vaiAoSegundo) segundoTurno++;
    const cand = {
      numero,
      nome: String(c.nmu || c.nm || numero).trim(),
      partido,
      votos: int(c.vap),
      resultado: eleito ? 'eleito' : vaiAoSegundo ? 'segundo-turno' : null,
    };
    if (/^\d+$/.test(String(c.sqcand || ''))) cand.sq = String(c.sqcand);   // chave da foto oficial
    if (/^anulad/.test(norm(c.dvt))) cand.anulado = true;
    candidatos.push(cand);
  }
  candidatos.sort((a, b) => (a.anulado ? 1 : 0) - (b.anulado ? 1 : 0) || b.votos - a.votos);

  const { s, e, v } = doc;
  const unidade = {
    secoes: int(s.ts), totalizadas: int(s.st),
    eleitorado: int(e.te), apurado: int(e.esa),
    comparecimento: int(e.c != null ? e.c : v.tv),
    brancos: int(v.vb),
    nulos: v.tvn != null ? int(v.tvn) : int(v.vn) + int(v.vnt),
    situacao: 'apurando',
    candidatos,
  };
  if (cargo === 'sen') {
    const vagas = Math.max(1, int(carg.nv) || 1);
    unidade.vagas = vagas;
    unidade.situacao = eleitos === 0 ? 'apurando' : eleitos < vagas ? 'parcial' : 'definido';
  } else {
    unidade.situacao = eleitos > 0 ? 'eleito' : segundoTurno > 0 ? 'segundo-turno' : 'apurando';
  }
  return unidade;
}

/** Minutos desde 00:00 do dia da eleição (passa de 1440 após a meia-noite); null se o documento não trouxer data/hora válidas. */
function minutoDe(doc, cfg) {
  const d = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(doc.dt || doc.dg || ''), h = /^(\d\d):(\d\d)/.exec(doc.ht || doc.hg || '');
  if (!d || !h) return null;
  const [y, m, dd] = cfg.dia.split('-').map(Number);
  const dias = Math.round((Date.UTC(+d[3], +d[2] - 1, +d[1]) - Date.UTC(y, m - 1, dd)) / 864e5);
  const t = dias * 1440 + +h[1] * 60 + +h[2];
  return t >= 0 && t <= 2880 ? t : null;
}

module.exports = { unidadeDe, minutoDe };
