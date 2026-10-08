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
export function veredito(u, { decide2Turno = false, inteira = false, turno = 1, dataSegundoTurno = '' } = {}) {
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
    else if (u.situacao === 'segundo-turno') partes.push(' ', h('strong', null, `Haverá 2º turno entre ${a} e ${b}${dataSegundoTurno ? `, em ${dataSegundoTurno}` : ''}.`));
    else if (p.fracaoLider > 0.5) partes.push(` ${a} tem mais de 50% e venceria no 1º turno.`);
    else partes.push(' Ninguém chega a 50%: caminha para o 2º turno.');
  } else if (turno === 2 && inteira && u.situacao === 'eleito') partes.push(' ', h('strong', null, `${a} venceu o 2º turno.`));
  return h('p', { classe: 'veredito' }, partes);
}

const CARGO_ELEITO = { presidente: 'presidente', governador: 'governador' };
const lista = nomes => (nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0] || '');

/**
 * A notícia do recorte aberto, em uma frase. `local` é o nome do lugar; `preposicao` é como ele entra na
 * frase ("no Brasil", "em São Paulo"); `inteira` diz se a unidade é a disputa toda daquele cargo.
 */
export function manchete(u, { cargo, local, preposicao, inteira = false, turno = 1 }) {
  const v = u ? [...validos(u)].sort((a, b) => b.votos - a.votos) : [];
  const total = u ? totalValidos(u) : 0;
  if (!total || !v.length) return `Ainda sem votos apurados ${preposicao}`;
  const nome = c => nomeProprio(c.nome), fim = apuradoPct(u) >= 1;
  const a = v[0], fa = pct(a.votos / total, 1);
  if ((u.vagas || 1) > 1) {
    const dupla = lista(v.slice(0, u.vagas).map(nome));
    if (inteira && u.situacao === 'definido') return `${dupla} são eleitos para o Senado por ${local}`;
    return fim ? `${dupla} são os mais votados para o Senado ${preposicao}` : `${dupla} lideram a disputa pelo Senado ${preposicao}`;
  }
  if (inteira && u.situacao === 'eleito') {
    if (cargo === 'presidente') return turno === 2 ? `${nome(a)} é eleito presidente da República` : `${nome(a)} é eleito presidente no 1º turno`;
    return `${nome(a)} é eleito ${CARGO_ELEITO[cargo] || cargo} de ${local} no ${turno}º turno`;
  }
  if (inteira && u.situacao === 'segundo-turno' && v[1]) return `${nome(a)} e ${nome(v[1])} vão ao 2º turno`;
  return fim ? `${nome(a)} vence ${preposicao} com ${fa}` : `${nome(a)} lidera ${preposicao} com ${fa}`;
}

/** Placar do recorte aberto: a manchete, os dois primeiros frente a frente, a marca dos 50% e o veredito. */
export function placar(u, { cargo, rotulo, local, preposicao, inteira = false, decide2Turno = false, turno = 1, dataSegundoTurno = '' }) {
  const titulo = h('h2', { classe: 'manchete' }, manchete(u, { cargo, local, preposicao, inteira, turno }));
  const onde = h('p', { classe: 'placar-local' }, rotulo);
  const l = u && lider(u, 1);
  if (!l || !l.segundo) return [onde, titulo];
  const a = l.candidato, b = l.segundo, fa = a.votos / l.total, fb = b.votos / l.total;
  const lado = (c, f, classe) => h('div', { classe: 'duelo-lado ' + classe, estilo: { '--cor': corDoPartido(c.partido, c.numero) } },
    h('div', { classe: 'duelo-quem' }, avatar(c, 'avatar grande'),
      h('div', null, h('strong', null, nomeProprio(c.nome)), h('span', { classe: 'partido' }, `${c.partido} ${c.numero}`))),
    h('div', { classe: 'duelo-numero' }, pct(f, 2).replace('%', ''), h('small', null, '%')),
    h('div', { classe: 'duelo-votos' }, `${num(c.votos)} votos`));
  return [
    onde, titulo,
    h('div', { classe: 'duelo' }, lado(a, fa, 'esq'), lado(b, fb, 'dir')),
    h('div', { classe: 'disputa-barra', role: 'img', 'aria-label': `${nomeProprio(a.nome)} ${pct(fa, 1)}, ${nomeProprio(b.nome)} ${pct(fb, 1)} dos votos válidos` },
      h('i', { estilo: { width: `${fa * 100}%`, background: corDoPartido(a.partido, a.numero) } }),
      h('i', { classe: 'outros', estilo: { width: `${Math.max(0, 1 - fa - fb) * 100}%` } }),
      h('i', { estilo: { width: `${fb * 100}%`, background: corDoPartido(b.partido, b.numero) } }),
      h('span', { classe: 'meio', title: '50% dos votos válidos' })),
    veredito(u, { decide2Turno, inteira, turno, dataSegundoTurno }),
    h('p', { classe: 'placar-dif' }, `Diferença de ${pct(Math.abs(fa - fb), 2).replace('%', '')} pontos, com ${pct(apuradoPct(u), 1)} das seções apuradas`),
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
    anulados.length ? h('p', { classe: 'sub' }, `Votos sub judice (não elegem, mas entram na base do percentual, como no TSE): ${anulados.map(c => `${nomeProprio(c.nome)} ${num(c.votos)}`).join(', ')}.`) : null,
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

/** Candidatos e números do recorte aberto (o título fica por conta da manchete). */
export function fichaUnidade(unidade, nota) {
  return [h('h3', null, 'Todos os candidatos'), nota ? h('p', { classe: 'sub' }, nota) : null, blocoCandidatos(unidade), blocoNumeros(unidade)];
}

function tabela(titulo, colunas, linhas, classe = '') {
  return h('div', null, h('h3', null, titulo),
    h('div', { classe: 'rolagem' }, h('table', { classe: 'tabela-ufs ' + classe },
      h('thead', null, h('tr', null, colunas.map(t => h('th', { scope: 'col' }, t)))), h('tbody', null, linhas))));
}

function linhaTabela(chave, rotuloAria, aoEscolher, celulas) {
  return h('tr', { 'data-chave': chave, tabindex: 0, role: 'button', 'aria-label': rotuloAria, onclick: aoEscolher,
    onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoEscolher(); } } }, celulas.map(c => h('td', null, c)));
}

const celulaLider = l => h('span', { classe: 'cel-lider', title: nomeProprio(l.candidato.nome) },
  h('i', { classe: 'amostra', estilo: { background: corDoPartido(l.candidato.partido, l.candidato.numero) } }), h('span', null, nomeProprio(l.candidato.nome)));

/**
 * Tabela com uma linha por UF: mais votado, percentual e andamento. `anteriores` traz as unidades do
 * 1º turno, para mostrar quem já foi eleito nos estados sem disputa no 2º.
 */
export function tabelaUfs(unidadesPorUf, aoEscolher, anteriores = {}) {
  return tabela('Por estado', ['UF', 'Mais votado', '%', 'Apurado'], LISTA_UFS.map(uf => {
    const u = unidadesPorUf[uf], l = u && lider(u);
    const antes = !u && anteriores[uf] && lider(anteriores[uf]);
    if (antes) return linhaTabela(uf, `Abrir ${NOMES_UF[uf]}`, () => aoEscolher(uf), [uf, h('span', { classe: 'ja-eleito' }, celulaLider(antes)), '', '1º turno']);
    return linhaTabela(uf, `Abrir ${NOMES_UF[uf]}`, () => aoEscolher(uf),
      [uf, l ? celulaLider(l) : (u ? '—' : 'sem disputa'), l ? pct(l.candidato.votos / l.total, 1) : '', u ? pct(apuradoPct(u), 0) : '']);
  }), 'estados');
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
    return h('tr', null, [nome, l ? celulaLider(l) : '—', l ? pct(l.candidato.votos / l.total, 1) : '', p && !p.concluido ? compacto(p.faltam) : ''].map(c => h('td', null, c)));
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

/** Quantos eleitos cada partido já tem nas disputas estaduais (governos ou vagas no Senado). */
export function bancada(unidades, titulo) {
  const porPartido = new Map();
  for (const u of unidades) {
    for (const c of u.candidatos) if (c.resultado === 'eleito') porPartido.set(c.partido, { n: (porPartido.get(c.partido)?.n || 0) + 1, numero: c.numero });
  }
  if (!porPartido.size) return null;
  const ordem = [...porPartido.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]));
  const maior = ordem[0][1].n;
  return h('div', null, h('h3', null, titulo), h('ul', { classe: 'bancada' }, ordem.map(([partido, x]) => {
    const cor = corDoPartido(partido, x.numero);
    return h('li', null, h('span', { classe: 'nome-partido' }, h('i', { classe: 'amostra', estilo: { background: cor } }), partido),
      h('span', { classe: 'trilho' }, h('i', { estilo: { width: `${(x.n / maior) * 100}%`, background: cor } })), h('strong', null, x.n));
  })));
}
