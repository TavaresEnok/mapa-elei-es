// Cálculos sobre as unidades do feed (Brasil, UF, exterior, município).
import { corDoPartido, intensidade } from './cores.js';

export const validos = u => u.candidatos.filter(c => !c.anulado);
/**
 * Base dos percentuais, igual à do TSE: votos dos candidatos concorrentes, incluindo os anulados sub judice
 * (que não elegem ninguém, mas contam na base enquanto a Justiça não decide). Nas linhas de município, onde
 * não há lista de candidatos anulados, o total vem em `u.anulados`.
 */
export const totalValidos = u => u.candidatos.reduce((t, c) => t + c.votos, 0) + (u.candidatos.some(c => c.anulado) ? 0 : (u.anulados || 0));

/**
 * Candidato mais votado e margem (fração dos votos válidos). Com uma vaga, a margem é sobre o segundo;
 * com `vagas` > 1 (Senado), é sobre o primeiro que ficaria de fora. null se ainda não há votos.
 */
export function lider(u, vagas = u.vagas || 1) {
  const v = validos(u);
  const total = totalValidos(u);
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

/**
 * "Ainda pode virar?": compara os votos válidos que faltam (estimados pelo ritmo das seções já apuradas)
 * com a diferença em disputa. Com uma vaga, a disputa é 1º × 2º; com `vagas` > 1, é o último que entraria
 * contra o primeiro que ficaria de fora. Devolve null se não há votos.
 */
export function panorama(u) {
  const vagas = u.vagas || 1, v = [...validos(u)].sort((a, b) => b.votos - a.votos);
  const total = totalValidos(u), f = apuradoPct(u);
  if (!total || !f || v.length <= vagas) return null;
  const dentro = v[vagas - 1], fora = v[vagas];
  const diferenca = dentro.votos - fora.votos;
  const faltam = f >= 1 ? 0 : Math.round(total * (1 / f - 1));
  return { dentro, fora, diferenca, faltam, concluido: f >= 1, decidido: f >= 1 || diferenca > faltam, fracaoLider: v[0].votos / total, vagas };
}

/** Soma unidades de UF por região: { Norte: { secoes, totalizadas, candidatos }, … } */
export function porRegiao(unidadesPorUf, regioes, cadastro) {
  const saida = {};
  for (const [nome, ufs] of Object.entries(regioes)) {
    const soma = { secoes: 0, totalizadas: 0, votos: {} };
    for (const uf of ufs) {
      const u = unidadesPorUf[uf];
      if (!u) continue;
      soma.secoes += u.secoes; soma.totalizadas += u.totalizadas;
      for (const c of validos(u)) soma.votos[c.numero] = (soma.votos[c.numero] || 0) + c.votos;
    }
    if (soma.secoes) saida[nome] = unidadeDeRetrato(soma, cadastro);
  }
  return saida;
}

/** Estados que mudaram de líder ao longo do histórico, do mais recente para o mais antigo. */
export function viradas(historico, ateMinuto = Infinity) {
  const pontos = ((historico && historico.pontos) || []).filter(p => p.lideres && p.minuto <= ateMinuto);
  const lista = [];
  for (let i = 1; i < pontos.length; i++) {
    for (const [uf, numero] of Object.entries(pontos[i].lideres)) {
      const antes = pontos[i - 1].lideres[uf];
      if (antes && antes !== numero) lista.push({ minuto: pontos[i].minuto, uf, de: antes, para: numero });
    }
  }
  return lista.reverse();
}
