// Painel lateral: disputa, ranking de candidatos, números da unidade e tabelas de estados / municípios.
import { h, num, pct, compacto, hhmm, iniciais, nomeProprio } from './fmt.js';
import { corDoPartido } from './cores.js';
import { fotoUrl } from './api.js';
import { lider, validos, totalValidos, apuradoPct, unidadeDeMunicipio, panorama } from './dados.js';
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

/**
 * Frase que responde "ainda pode virar?" e, quando a unidade é a disputa inteira de um cargo majoritário
 * no 1º turno (`decide2Turno`), se ela caminha para o 2º turno.
 */
export function veredito(u, { decide2Turno = false } = {}) {
  const p = panorama(u);
  if (!p) return null;
  const a = nomeProprio(p.dentro.nome), b = nomeProprio(p.fora.nome);
  const partes = [];
  if (p.concluido) partes.push(h('strong', null, 'Apuração concluída.'));
  else if (p.decidido) partes.push(h('strong', null, 'Não vira mais.'), ` Faltam cerca de ${compacto(p.faltam)} votos, menos que a diferença de ${compacto(p.diferenca)}.`);
  else partes.push(h('strong', null, 'Ainda pode virar.'), ` Faltam cerca de ${compacto(p.faltam)} votos, mais que a diferença de ${compacto(p.diferenca)}.`);
  if (p.vagas > 1) partes.push(` Última vaga: ${a} à frente de ${b}.`);
  else if (decide2Turno) {
    if (u.situacao === 'eleito') partes.push(' ', h('strong', null, `${a} venceu no 1º turno.`));
    else if (u.situacao === 'segundo-turno') partes.push(' ', h('strong', null, `Haverá 2º turno entre ${a} e ${b}.`));
    else if (p.fracaoLider > 0.5) partes.push(` ${a} tem mais de 50% e venceria no 1º turno.`);
    else partes.push(' Ninguém chega a 50%: caminha para o 2º turno.');
  }
  return h('p', { classe: 'veredito' }, partes);
}

/** Placar do recorte aberto: os dois primeiros frente a frente, a marca dos 50% e o veredito. */
export function placar(u, { rotulo, decide2Turno = false }) {
  const l = u && lider(u, 1);
  if (!l || !l.segundo) return [h('p', { classe: 'placar-vazio' }, rotulo, ' · ainda sem votos apurados')];
  const a = l.candidato, b = l.segundo, fa = a.votos / l.total, fb = b.votos / l.total;
  const lado = (c, classe) => h('div', { classe: 'placar-cand ' + classe }, avatar(c, 'avatar grande'),
    h('div', null, h('strong', null, nomeProprio(c.nome)), h('span', { estilo: { color: corDoPartido(c.partido, c.numero) } }, `${c.partido} ${c.numero}`)));
  const valor = (c, f) => h('div', { classe: 'placar-valor' }, h('strong', null, pct(f, 1)), h('span', null, `${num(c.votos)} votos`));
  return [
    h('div', { classe: 'placar-linha' }, lado(a, 'esq'), h('div', { classe: 'placar-centro' }, valor(a, fa), valor(b, fb)), lado(b, 'dir')),
    h('div', { classe: 'disputa-barra', role: 'img', 'aria-label': `${nomeProprio(a.nome)} ${pct(fa, 1)}, ${nomeProprio(b.nome)} ${pct(fb, 1)} dos votos válidos` },
      h('i', { estilo: { width: `${fa * 100}%`, background: corDoPartido(a.partido, a.numero) } }),
      h('i', { classe: 'outros', estilo: { width: `${Math.max(0, 1 - fa - fb) * 100}%` } }),
      h('i', { estilo: { width: `${fb * 100}%`, background: corDoPartido(b.partido, b.numero) } }),
      h('span', { classe: 'meio', title: '50% dos votos válidos' })),
    h('div', { classe: 'placar-rodape' }, h('span', { classe: 'placar-local' }, rotulo), veredito(u, { decide2Turno }),
      h('span', { classe: 'placar-dif' }, `Diferença de ${pct(Math.abs(fa - fb), 1).replace('%', '')} pts · ${pct(apuradoPct(u), 1)} das seções`)),
  ];
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
  return [cabecalho(titulo, subtitulo, unidade, nota), blocoCandidatos(unidade), blocoNumeros(unidade)];
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

/** Uma linha por região: quem lidera, com quanto e quantos votos ainda faltam. */
export function tabelaRegioes(regioes) {
  return tabela('Por região', ['Região', 'Mais votado', '%', 'Faltam'], Object.entries(regioes).map(([nome, u]) => {
    const l = lider(u), p = panorama(u);
    return h('tr', null, [nome, l ? celulaLider(l) : '—', l ? pct(l.candidato.votos / l.total, 1) : '', p && !p.concluido ? `${compacto(p.faltam)} votos` : (p ? 'concluído' : '')].map(c => h('td', null, c)));
  }));
}

/** Estados que trocaram de líder durante a apuração. */
export function listaViradas(viradas, cadastro, nomesUf, limite = 6) {
  if (!viradas.length) return null;
  return h('div', null, h('h3', null, 'Viradas'), h('ul', { classe: 'viradas' }, viradas.slice(0, limite).map(v => {
    const c = cadastro.get(v.para) || { nome: v.para, partido: '' };
    return h('li', null, h('time', null, hhmm(v.minuto)), h('span', null, h('strong', null, nomesUf[v.uf]), ' virou para ',
      h('i', { classe: 'amostra', estilo: { background: corDoPartido(c.partido, v.para) } }), ' ', nomeProprio(c.nome)));
  })));
}
