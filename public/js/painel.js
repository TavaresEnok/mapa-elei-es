// Painel lateral: ranking de candidatos, números da unidade e tabelas de estados / municípios.
import { h, num, pct, iniciais, nomeProprio } from './fmt.js';
import { corDoPartido } from './cores.js';
import { lider, validos, totalValidos, apuradoPct, unidadeDeMunicipio } from './dados.js';
import { NOMES_UF, LISTA_UFS } from './ufs.js';

const ROTULO_RESULTADO = { eleito: 'Eleito', 'segundo-turno': '2º turno' };

function candidato(c, total, maior) {
  const cor = corDoPartido(c.partido, c.numero);
  const fracao = total ? c.votos / total : 0;
  return h('div', { classe: 'candidato' },
    h('div', { classe: 'avatar', estilo: { background: cor }, 'aria-hidden': 'true' }, iniciais(c.nome)),
    h('div', { classe: 'nome' }, nomeProprio(c.nome), h('small', null, `${c.partido} · ${c.numero}`),
      c.resultado ? h('span', { classe: c.resultado === 'eleito' ? 'selo' : 'selo neutro' }, ROTULO_RESULTADO[c.resultado]) : null),
    h('div', { classe: 'valor' }, h('strong', null, pct(fracao)), h('span', null, `${num(c.votos)} votos`)),
    h('div', { classe: 'trilho' }, h('i', { estilo: { width: `${maior ? (c.votos / maior) * 100 : 0}%`, background: cor } })),
  );
}

export function blocoCandidatos(u, limite = 6) {
  const lista = validos(u);
  const total = totalValidos(u), maior = lista.length ? Math.max(...lista.map(c => c.votos)) : 0;
  if (!total) return h('p', { classe: 'vazio-msg' }, 'Ainda não há votos apurados neste local.');
  const principais = lista.slice(0, limite), demais = lista.slice(limite);
  const anulados = u.candidatos.filter(c => c.anulado && c.votos);
  return h('div', { classe: 'lista-cand' },
    principais.map(c => candidato(c, total, maior)),
    demais.length ? h('details', null, h('summary', null, `Ver os outros ${demais.length} candidatos`),
      h('div', { classe: 'lista-cand', estilo: { marginTop: '12px' } }, demais.map(c => candidato(c, total, maior)))) : null,
    anulados.length ? h('p', { classe: 'sub' }, `Votos anulados (sub judice) não contam: ${anulados.map(c => `${nomeProprio(c.nome)} ${num(c.votos)}`).join(', ')}.`) : null,
  );
}

export function blocoNumeros(u) {
  const abst = Math.max(0, u.apurado - u.comparecimento);
  const item = (rotulo, valor, extra) => h('div', null, h('dt', null, rotulo), h('dd', null, valor, extra ? h('small', { classe: 'sub' }, ' ' + extra) : null));
  return h('dl', { classe: 'numeros' },
    item('Eleitorado', num(u.eleitorado)),
    item('Comparecimento', num(u.comparecimento), u.apurado ? pct(u.comparecimento / u.apurado, 1) : ''),
    item('Abstenção', num(abst), u.apurado ? pct(abst / u.apurado, 1) : ''),
    item('Brancos', num(u.brancos), u.comparecimento ? pct(u.brancos / u.comparecimento, 1) : ''),
    item('Nulos', num(u.nulos), u.comparecimento ? pct(u.nulos / u.comparecimento, 1) : ''),
    item('Seções apuradas', `${num(u.totalizadas)} / ${num(u.secoes)}`),
  );
}

function cabecalho(titulo, subtitulo, u, nota) {
  return h('div', null,
    h('h2', null, titulo, u && u.situacao === 'eleito' ? h('span', { classe: 'selo' }, 'Definido') : null),
    h('p', { classe: 'sub' }, subtitulo, u ? ` · ${pct(apuradoPct(u), 1)} das seções apuradas` : ''),
    nota ? h('p', { classe: 'sub' }, nota) : null);
}

export function painelUnidade({ titulo, subtitulo, unidade, nota }) {
  return [cabecalho(titulo, subtitulo, unidade, nota), blocoCandidatos(unidade), blocoNumeros(unidade)];
}

/** Tabela com uma linha por UF: mais votado, percentual e andamento. */
export function tabelaUfs(unidadesPorUf, aoEscolher) {
  const corpo = h('tbody');
  for (const uf of LISTA_UFS) {
    const u = unidadesPorUf[uf], l = u && lider(u);
    const escolher = () => aoEscolher(uf);
    corpo.append(h('tr', { 'data-uf': uf, tabindex: 0, role: 'button', 'aria-label': `Abrir ${NOMES_UF[uf]}`, onclick: escolher,
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(); } } },
      h('td', null, uf),
      h('td', null, l ? h('span', { classe: 'cel-lider' }, h('i', { classe: 'amostra', estilo: { background: corDoPartido(l.candidato.partido, l.candidato.numero) } }), nomeProprio(l.candidato.nome)) : (u ? '—' : 'sem disputa')),
      h('td', null, l ? pct(l.candidato.votos / l.total, 1) : ''),
      h('td', null, u ? pct(apuradoPct(u), 0) : '')));
  }
  return h('div', null, h('h3', null, 'Por estado'),
    h('div', { classe: 'rolagem' }, h('table', { classe: 'tabela-ufs' },
      h('thead', null, h('tr', null, ['UF', 'Mais votado', '%', 'Apurado'].map(t => h('th', { scope: 'col' }, t)))), corpo)));
}

/** Tabela dos municípios de uma UF (presidente), do maior eleitorado para o menor. */
export function tabelaMunicipios(linhas, cadastro, aoEscolher) {
  const corpo = h('tbody');
  for (const linha of [...linhas].sort((a, b) => b.eleitorado - a.eleitorado)) {
    const u = unidadeDeMunicipio(linha, cadastro), l = linha.secoes && lider(u);
    const escolher = () => aoEscolher(linha.id);
    corpo.append(h('tr', { 'data-uf': linha.id, tabindex: 0, role: 'button', 'aria-label': `Abrir ${linha.nome}`, onclick: escolher,
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(); } } },
      h('td', null, linha.nome),
      h('td', null, l ? h('span', { classe: 'cel-lider' }, h('i', { classe: 'amostra', estilo: { background: corDoPartido(l.candidato.partido, l.candidato.numero) } }), nomeProprio(l.candidato.nome)) : '—'),
      h('td', null, l ? pct(l.candidato.votos / l.total, 1) : ''),
      h('td', null, pct(linha.secoes ? linha.totalizadas / linha.secoes : 0, 0))));
  }
  return h('div', null, h('h3', null, `Municípios (${linhas.length})`),
    h('div', { classe: 'rolagem' }, h('table', { classe: 'tabela-ufs' },
      h('thead', null, h('tr', null, ['Município', 'Mais votado', '%', 'Apurado'].map(t => h('th', { scope: 'col' }, t)))), corpo)));
}
