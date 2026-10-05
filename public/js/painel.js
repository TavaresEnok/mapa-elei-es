// Painel lateral: disputa, ranking de candidatos, números da unidade e tabelas de estados / municípios.
import { h, num, pct, iniciais, nomeProprio } from './fmt.js';
import { corDoPartido } from './cores.js';
import { fotoUrl } from './api.js';
import { lider, validos, totalValidos, apuradoPct, unidadeDeMunicipio } from './dados.js';
import { NOMES_UF, LISTA_UFS } from './ufs.js';

const ROTULO_RESULTADO = { eleito: 'Eleito', 'segundo-turno': '2º turno' };

/** Foto oficial do candidato; se não houver (ou falhar), círculo com as iniciais na cor do partido. */
export function avatar(c, classe = 'avatar') {
  const cor = corDoPartido(c.partido, c.numero);
  const el = h('div', { classe, estilo: { background: cor }, 'aria-hidden': 'true' }, iniciais(c.nome));
  if (c.foto && c.sq) {
    const img = h('img', { src: fotoUrl(c.sq), alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => img.remove());
    el.append(img);
    el.style.setProperty('--anel', cor);
    el.classList.add('com-foto');
  }
  return el;
}

function candidato(c, total, maior) {
  const cor = corDoPartido(c.partido, c.numero);
  const fracao = total ? c.votos / total : 0;
  return h('div', { classe: 'candidato' },
    avatar(c),
    h('div', { classe: 'nome' }, nomeProprio(c.nome), h('small', null, `${c.partido} · ${c.numero}`),
      c.resultado ? h('span', { classe: c.resultado === 'eleito' ? 'selo' : 'selo neutro' }, ROTULO_RESULTADO[c.resultado]) : null),
    h('div', { classe: 'valor' }, h('strong', null, pct(fracao)), h('span', null, `${num(c.votos)} votos`)),
    h('div', { classe: 'trilho' }, h('i', { estilo: { width: `${maior ? (c.votos / maior) * 100 : 0}%`, background: cor } })),
  );
}

/** Barra única com os dois mais votados frente a frente e a marca dos 50% dos votos válidos. */
export function barraDisputa(u) {
  const l = lider(u);
  if (!l || !l.segundo || u.vagas > 1) return null;
  const a = l.candidato, b = l.segundo;
  const fa = a.votos / l.total, fb = b.votos / l.total;
  const lado = (c, f, classe) => h('div', { classe: 'lado ' + classe }, h('strong', null, pct(f, 1)), h('span', null, nomeProprio(c.nome)));
  return h('div', { classe: 'disputa', role: 'img', 'aria-label': `${nomeProprio(a.nome)} ${pct(fa, 1)}, ${nomeProprio(b.nome)} ${pct(fb, 1)} dos votos válidos` },
    h('div', { classe: 'disputa-rotulos' }, lado(a, fa, 'esq'), lado(b, fb, 'dir')),
    h('div', { classe: 'disputa-barra' },
      h('i', { estilo: { width: `${fa * 100}%`, background: corDoPartido(a.partido, a.numero) } }),
      h('i', { classe: 'outros', estilo: { width: `${Math.max(0, 1 - fa - fb) * 100}%` } }),
      h('i', { estilo: { width: `${fb * 100}%`, background: corDoPartido(b.partido, b.numero) } }),
      h('span', { classe: 'meio', title: '50% dos votos válidos' })),
    h('p', { classe: 'sub disputa-nota' }, `Diferença: ${num(a.votos - b.votos)} votos (${pct(l.margem, 2).replace('%', '')} pontos)`));
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
      h('div', { classe: 'lista-cand interna' }, demais.map(c => candidato(c, total, maior)))) : null,
    anulados.length ? h('p', { classe: 'sub' }, `Votos anulados (sub judice) não contam: ${anulados.map(c => `${nomeProprio(c.nome)} ${num(c.votos)}`).join(', ')}.`) : null,
  );
}

export function blocoNumeros(u) {
  const item = (rotulo, valor, extra) => h('div', null, h('dt', null, rotulo), h('dd', null, valor, extra ? h('small', null, ' ' + extra) : null));
  if (u.parcial) return h('dl', { classe: 'numeros' }, item('Seções apuradas', `${num(u.totalizadas)} / ${num(u.secoes)}`), item('Votos válidos', num(totalValidos(u))));
  const abst = Math.max(0, u.apurado - u.comparecimento);
  return h('dl', { classe: 'numeros' },
    item('Eleitorado', num(u.eleitorado)),
    item('Comparecimento', num(u.comparecimento), u.apurado ? pct(u.comparecimento / u.apurado, 1) : ''),
    item('Abstenção', num(abst), u.apurado ? pct(abst / u.apurado, 1) : ''),
    item('Brancos', num(u.brancos), u.comparecimento ? pct(u.brancos / u.comparecimento, 1) : ''),
    item('Nulos', num(u.nulos), u.comparecimento ? pct(u.nulos / u.comparecimento, 1) : ''),
    item('Seções apuradas', `${num(u.totalizadas)} / ${num(u.secoes)}`),
  );
}

const SELO_SITUACAO = { eleito: 'Definido', definido: 'Definido', 'segundo-turno': 'Vai ao 2º turno', parcial: '1 vaga definida' };

function cabecalho(titulo, subtitulo, u, nota) {
  const selo = u && SELO_SITUACAO[u.situacao];
  return h('div', { classe: 'painel-topo' },
    h('h2', null, titulo, selo ? h('span', { classe: u.situacao === 'segundo-turno' ? 'selo neutro' : 'selo' }, selo) : null),
    h('p', { classe: 'sub' }, subtitulo, u ? ` · ${pct(apuradoPct(u), 1)} das seções apuradas` : ''),
    nota ? h('p', { classe: 'sub' }, nota) : null);
}

export function painelUnidade({ titulo, subtitulo, unidade, nota }) {
  return [cabecalho(titulo, subtitulo, unidade, nota), barraDisputa(unidade), blocoCandidatos(unidade), blocoNumeros(unidade)];
}

function tabela(titulo, colunas, linhas) {
  return h('div', null, h('h3', null, titulo),
    h('div', { classe: 'rolagem' }, h('table', { classe: 'tabela-ufs' },
      h('thead', null, h('tr', null, colunas.map(t => h('th', { scope: 'col' }, t)))), h('tbody', null, linhas))));
}

function linhaTabela(chave, rotuloAria, aoEscolher, celulas) {
  return h('tr', { 'data-chave': chave, tabindex: 0, role: 'button', 'aria-label': rotuloAria, onclick: aoEscolher,
    onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoEscolher(); } } }, celulas.map(c => h('td', null, c)));
}

const celulaLider = l => h('span', { classe: 'cel-lider' },
  h('i', { classe: 'amostra', estilo: { background: corDoPartido(l.candidato.partido, l.candidato.numero) } }), nomeProprio(l.candidato.nome));

/** Tabela com uma linha por UF: mais votado, percentual e andamento. */
export function tabelaUfs(unidadesPorUf, aoEscolher) {
  return tabela('Por estado', ['UF', 'Mais votado', '%', 'Apurado'], LISTA_UFS.map(uf => {
    const u = unidadesPorUf[uf], l = u && lider(u);
    return linhaTabela(uf, `Abrir ${NOMES_UF[uf]}`, () => aoEscolher(uf),
      [uf, l ? celulaLider(l) : (u ? '—' : 'sem disputa'), l ? pct(l.candidato.votos / l.total, 1) : '', u ? pct(apuradoPct(u), 0) : '']);
  }));
}

/** Tabela dos municípios de uma UF, do maior eleitorado para o menor. */
export function tabelaMunicipios(linhas, cadastro, aoEscolher, vagas = 1) {
  return tabela(`Municípios (${linhas.length})`, ['Município', 'Mais votado', '%', 'Apurado'],
    [...linhas].sort((a, b) => b.eleitorado - a.eleitorado).map(linha => {
      const l = linha.secoes && lider(unidadeDeMunicipio(linha, cadastro, vagas));
      return linhaTabela(linha.id, `Abrir ${linha.nome}`, () => aoEscolher(linha.id),
        [linha.nome, l ? celulaLider(l) : '—', l ? pct(l.candidato.votos / l.total, 1) : '', pct(linha.secoes ? linha.totalizadas / linha.secoes : 0, 0)]);
    }));
}
