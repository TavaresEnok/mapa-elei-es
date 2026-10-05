// Cálculos sobre as unidades do feed (Brasil, UF, exterior, município).
import { corDoPartido, intensidade } from './cores.js';

export const validos = u => u.candidatos.filter(c => !c.anulado);
export const totalValidos = u => validos(u).reduce((t, c) => t + c.votos, 0);

/** Candidato mais votado e margem sobre o segundo (fração dos votos válidos). null se ainda não há votos. */
export function lider(u) {
  const v = validos(u);
  const total = v.reduce((t, c) => t + c.votos, 0);
  if (!total || !v.length) return null;
  const ordenados = [...v].sort((a, b) => b.votos - a.votos);
  return { candidato: ordenados[0], margem: (ordenados[0].votos - (ordenados[1] ? ordenados[1].votos : 0)) / total, total };
}

export function corDaUnidade(u) {
  const l = u && lider(u);
  return l ? { cor: corDoPartido(l.candidato.partido, l.candidato.numero), opacidade: intensidade(l.margem) } : null;
}

/** Linha de município (votos por número) → unidade com candidatos, usando nome/partido do cadastro nacional. */
export function unidadeDeMunicipio(linha, cadastro) {
  const candidatos = Object.entries(linha.votos).map(([numero, votos]) => {
    const c = cadastro.get(numero) || { nome: numero, partido: '' };
    return { numero, nome: c.nome, partido: c.partido, votos, resultado: null };
  }).sort((a, b) => b.votos - a.votos);
  return { ...linha, candidatos };
}

export const apuradoPct = u => (u.secoes ? u.totalizadas / u.secoes : 0);
