// Cálculos sobre as unidades do feed (Brasil, UF, exterior, município).
import { corDoPartido, intensidade } from './cores.js';

export const validos = u => u.candidatos.filter(c => !c.anulado);
export const totalValidos = u => validos(u).reduce((t, c) => t + c.votos, 0);

/**
 * Candidato mais votado e margem (fração dos votos válidos). Com uma vaga, a margem é sobre o segundo;
 * com `vagas` > 1 (Senado), é sobre o primeiro que ficaria de fora. null se ainda não há votos.
 */
export function lider(u, vagas = u.vagas || 1) {
  const v = validos(u);
  const total = v.reduce((t, c) => t + c.votos, 0);
  if (!total || !v.length) return null;
  const ordenados = [...v].sort((a, b) => b.votos - a.votos);
  const rival = ordenados[vagas] || null;
  return { candidato: ordenados[0], segundo: ordenados[1] || null, margem: (ordenados[0].votos - (rival ? rival.votos : 0)) / total, total };
}

export function corDaUnidade(u) {
  const l = u && lider(u);
  return l ? { cor: corDoPartido(l.candidato.partido, l.candidato.numero), opacidade: intensidade(l.margem) } : null;
}

/** Cadastro (número → candidato) a partir de uma unidade completa. */
export const cadastroDe = u => new Map((u ? u.candidatos : []).map(c => [c.numero, c]));

/** { numero: votos } → lista de candidatos ordenada, com nome/partido/foto vindos do cadastro. */
function candidatosDe(votos, cadastro) {
  return Object.entries(votos).map(([numero, v]) => {
    const c = cadastro.get(numero) || { nome: numero, partido: '' };
    return { numero, nome: c.nome, partido: c.partido, sq: c.sq, foto: c.foto, votos: v, resultado: null };
  }).sort((a, b) => b.votos - a.votos);
}

/** Linha de município (votos por número) → unidade com candidatos. */
export const unidadeDeMunicipio = (linha, cadastro, vagas = 1) => ({ ...linha, vagas, candidatos: candidatosDe(linha.votos, cadastro) });

/** Resumo de um retrato da linha do tempo ({ secoes, totalizadas, votos }) → unidade parcial (sem eleitorado etc.). */
export const unidadeDeRetrato = (resumo, cadastro) => ({ ...resumo, parcial: true, situacao: 'apurando', candidatos: candidatosDe(resumo.votos, cadastro) });

export const apuradoPct = u => (u.secoes ? u.totalizadas / u.secoes : 0);
