// Orquestra o painel: carrega dados, mantém a seleção, pinta o mapa, controla a linha do tempo e atualiza em intervalos.
import * as api from './api.js';
import { Mapa } from './mapa.js';
import { Busca } from './busca.js';
import { desenharGrafico } from './grafico.js';
import { painelUnidade, tabelaUfs, tabelaMunicipios, blocoCandidatos, blocoNumeros, placar, tabelaRegioes, listaViradas } from './painel.js';
import { corDaUnidade, lider, unidadeDeMunicipio, unidadeDeRetrato, cadastroDe, apuradoPct, validos, porRegiao, viradas } from './dados.js';
import { corDoPartido, intensidade } from './cores.js';
import { h, pct, hhmm, nomeProprio } from './fmt.js';
import { NOMES_UF, LISTA_UFS, REGIOES } from './ufs.js';

const CARGOS = { presidente: 'Presidente', governador: 'Governador', senador: 'Senador' };
const PLURAL = { presidente: 'Presidente', governador: 'Governadores', senador: 'Senadores' };
const PASSO_REPRISE_MS = 650;
const $ = id => document.getElementById(id);

const estado = {
  fonte: 'turno1', turnos: [],
  cargo: 'presidente', nivel: 'estados', uf: null, mun: null,
  resultado: null, historico: null, geo: null,
  linhas: { presidente: {}, governador: {}, senador: {} },       // cargo → UF → Map(id → linha de município)
  linhasDe: { presidente: 0, governador: 0, senador: 0 },        // `gerado` do resultado a que as linhas correspondem
  corMun: { presidente: new Map(), governador: new Map(), senador: new Map() },
  carregandoMun: false,
  tempo: { minutos: [], posicao: new Map(), minuto: null, retrato: null, cache: new Map(), tocando: 0 },
  nomeMun: new Map(),
  erro: false,
};

let mapa;
const pendentes = {};   // cargo → promessa de carga dos municípios em andamento

/* ───────────── acesso aos dados ───────────── */

const emReprise = () => estado.tempo.minuto != null && estado.cargo === 'presidente' && !!estado.tempo.retrato;
const unidadesReais = () => (estado.resultado ? estado.resultado.cargos[estado.cargo].uf : {});
const cadastroPresidente = () => cadastroDe(estado.resultado && estado.resultado.cargos.presidente.br);
/** Quem são os candidatos do cargo atual numa UF (para presidente, os mesmos no país todo). */
const cadastro = uf => (estado.cargo === 'presidente' ? cadastroPresidente() : cadastroDe(unidadesReais()[uf]));
const vagasDe = uf => (unidadesReais()[uf] && unidadesReais()[uf].vagas) || 1;

function unidadeUf(uf) {
  if (emReprise()) { const r = estado.tempo.retrato.uf[uf]; return r ? unidadeDeRetrato(r, cadastroPresidente()) : undefined; }
  return unidadesReais()[uf];
}
function unidadeBrasil() {
  if (!estado.resultado) return null;
  return emReprise() ? unidadeDeRetrato(estado.tempo.retrato.br, cadastroPresidente()) : estado.resultado.cargos.presidente.br;
}
const linhasUf = uf => estado.linhas[estado.cargo][uf];
const linhaMun = (uf, id) => linhasUf(uf) && linhasUf(uf).get(id);
const nomeMunicipio = (uf, id) => (linhaMun(uf, id) && linhaMun(uf, id).nome) || estado.nomeMun.get(id) || String(id);

/** Situação de um município no retrato da reprise: { numero, margem, apurado } ou null. */
function munNoRetrato(id) {
  const i = estado.tempo.posicao.get(id), r = estado.tempo.retrato;
  if (i == null || !r || !r.lider[i]) return null;
  return { numero: String(r.lider[i]), margem: r.margem[i] / 1000, apurado: r.apurado[i] / 1000 };
}

function corDoMunicipio(id, uf) {
  if (emReprise()) {
    const m = munNoRetrato(id);
    if (!m) return null;
    const c = cadastroPresidente().get(m.numero);
    return { cor: corDoPartido(c ? c.partido : '', m.numero), opacidade: intensidade(m.margem) };
  }
  return estado.corMun[estado.cargo].get(id);
}

function recalcularCores(cargo) {
  const cores = estado.corMun[cargo];
  cores.clear();
  const unidades = estado.resultado.cargos[cargo].uf;
  const nacional = cadastroPresidente();
  for (const [uf, linhas] of Object.entries(estado.linhas[cargo])) {
    const cad = cargo === 'presidente' ? nacional : cadastroDe(unidades[uf]);
    const vagas = (unidades[uf] && unidades[uf].vagas) || 1;
    for (const [id, linha] of linhas) {
      if (!linha.secoes || !linha.totalizadas) continue;
      const l = lider(unidadeDeMunicipio(linha, cad, vagas));
      if (l) cores.set(id, { cor: corDoPartido(l.candidato.partido, l.candidato.numero), opacidade: intensidade(l.margem) });
    }
  }
}

/** Carrega (uma vez por atualização) os municípios do cargo, quando o mapa ou o painel precisam deles. */
function garantirMunicipios(cargo = estado.cargo) {
  const r = estado.resultado;
  if (!r) return Promise.resolve();
  if (estado.linhasDe[cargo] === r.gerado) return Promise.resolve();
  if (pendentes[cargo]) return pendentes[cargo];
  estado.carregandoMun = true; renderAviso();
  const gerado = r.gerado, fonte = estado.fonte;
  pendentes[cargo] = Promise.allSettled(LISTA_UFS.map(uf => api.carregarMunicipios(cargo, uf))).then(resultados => {
    delete pendentes[cargo];
    if (fonte !== estado.fonte) return;
    resultados.forEach((x, i) => { if (x.status === 'fulfilled') estado.linhas[cargo][LISTA_UFS[i]] = new Map(x.value.municipios.map(m => [m.id, m])); });
    estado.linhasDe[cargo] = gerado;
    recalcularCores(cargo);
    estado.carregandoMun = Object.keys(pendentes).length > 0;
    if (cargo === estado.cargo) { renderPlacar(); renderMapa(); renderLegenda(); renderPainel(); }
    renderAviso();
  });
  return pendentes[cargo];
}
const precisaDeMunicipios = () => estado.nivel === 'municipios' || !!estado.uf;

/* ───────────── renderização ───────────── */

function renderStatus() {
  const r = estado.resultado, br = unidadeBrasil();
  const ponto = $('ponto-status'), texto = $('texto-status');
  ponto.className = 'ponto';
  if (!r) { texto.textContent = estado.erro ? 'Aguardando os primeiros dados do TSE…' : 'Carregando…'; return; }
  const real = r.cargos.presidente.br, concluida = real.totalizadas >= real.secoes;
  if (emReprise()) texto.textContent = `Reprise · ${hhmm(estado.tempo.minuto)}`;
  else if (estado.erro) { ponto.classList.add('erro'); texto.textContent = 'Sem conexão — exibindo os últimos dados recebidos'; }
  else {
    if (!concluida) ponto.classList.add('ao-vivo');
    const quando = r.atualizadoTse.hora ? `dados do TSE de ${r.atualizadoTse.data} às ${r.atualizadoTse.hora}` : 'dados do TSE';
    texto.textContent = `${concluida ? 'Apuração concluída' : 'Ao vivo'} · ${quando}`;
  }
  $('turno-rotulo').textContent = `2026 · ${r.turno}º turno`;
  $('faixa-simulacao').hidden = !r.simulacao;
  const f = apuradoPct(br);
  $('progresso-valor').replaceChildren(pct(f, 2), h('span', { classe: 'detalhe' }, ` (${br.totalizadas.toLocaleString('pt-BR')} de ${br.secoes.toLocaleString('pt-BR')} seções)`));
  $('progresso-preenchimento').style.width = `${f * 100}%`;
  $('progresso-barra').setAttribute('aria-valuenow', Math.round(f * 100));
}

function renderControles() {
  document.querySelectorAll('[data-cargo]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.cargo === estado.cargo)));
  document.querySelectorAll('[data-nivel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.nivel === estado.nivel)));
  const escolha = $('turno-escolha'), sel = $('turno-select');
  escolha.hidden = estado.turnos.length < 2;
  if (!escolha.hidden && sel.options.length !== estado.turnos.length) {
    sel.replaceChildren(...estado.turnos.map(t => h('option', { value: `turno${t}` }, `${t}º turno`)));
  }
  sel.value = estado.fonte;
}

function renderAviso() {
  const aviso = $('mapa-aviso');
  aviso.hidden = !(estado.carregandoMun && precisaDeMunicipios());
  aviso.textContent = 'Carregando os municípios…';
}

function renderMapa() {
  if (!mapa || !estado.resultado) return;
  mapa.definirNivel(estado.nivel);
  mapa.pintar(uf => corDaUnidade(unidadeUf(uf)), estado.nivel === 'municipios' ? corDoMunicipio : null);
  mapa.selecionar(estado.uf, estado.mun);
  $('voltar').hidden = !estado.uf;
  $('mapa-titulo').textContent = estado.mun ? `${nomeMunicipio(estado.uf, estado.mun)} · ${estado.uf}` : estado.uf ? NOMES_UF[estado.uf] : 'Brasil';
  $('svg-mapa').setAttribute('aria-label', `Mapa ${estado.uf ? 'de ' + NOMES_UF[estado.uf] : 'do Brasil'} colorido pelo candidato a ${estado.cargo} mais votado em cada ${estado.nivel === 'municipios' ? 'município' : 'estado'}`);
  renderAviso();
}

function renderLegenda() {
  const alvo = $('legenda');
  if (!estado.resultado) { alvo.replaceChildren(); return; }
  const vistos = new Map();
  if (estado.cargo === 'presidente') {
    for (const c of validos(unidadeBrasil()).slice(0, 4)) vistos.set(c.numero, c);
  } else {
    for (const uf of LISTA_UFS) { const l = unidadeUf(uf) && lider(unidadeUf(uf)); if (l && !vistos.has(l.candidato.partido)) vistos.set(l.candidato.partido, l.candidato); }
  }
  const amostra = cor => h('i', { classe: 'amostra', estilo: { background: cor } });
  const itens = [...vistos.values()].map(c => h('span', null, amostra(corDoPartido(c.partido, c.numero)),
    estado.cargo === 'presidente' ? `${nomeProprio(c.nome)} (${c.partido})` : c.partido));
  const escala = h('span', { classe: 'escala' }, 'vantagem pequena',
    h('i', { classe: 'degrade' }), 'grande');
  alvo.replaceChildren(...itens, h('span', null, amostra('var(--vazio)'), 'Sem dados'), escala);
}

function botaoVoltar(rotulo, aoClicar) { return h('button', { classe: 'botao-leve', type: 'button', onclick: aoClicar }, rotulo); }

function painelMunicipio() {
  const { uf, mun } = estado;
  const nome = nomeMunicipio(uf, mun), partes = [];
  if (emReprise()) {
    const m = munNoRetrato(mun), c = m && cadastroPresidente().get(m.numero);
    partes.push(h('div', { classe: 'painel-topo' }, h('h2', null, nome), h('p', { classe: 'sub' }, `${NOMES_UF[uf]} · às ${hhmm(estado.tempo.minuto)}`)));
    partes.push(h('p', { classe: m ? '' : 'vazio-msg' }, m
      ? `${nomeProprio(c ? c.nome : m.numero)} na frente por ${pct(m.margem, 1).replace('%', '')} pontos, com ${pct(m.apurado, 0)} das seções apuradas.`
      : 'Sem votos apurados neste momento da apuração.'));
  } else {
    const linha = linhaMun(uf, mun);
    if (linha && linha.secoes) partes.push(...painelUnidade({ titulo: linha.nome, subtitulo: `${NOMES_UF[uf]} · ${CARGOS[estado.cargo]}`, unidade: unidadeDeMunicipio(linha, cadastro(uf), vagasDe(uf)) }));
    else partes.push(h('div', { classe: 'painel-topo' }, h('h2', null, nome)), h('p', { classe: 'vazio-msg' }, estado.carregandoMun ? 'Carregando…' : 'Sem dados apurados para este município.'));
  }
  partes.push(botaoVoltar(`← ${NOMES_UF[uf]}`, () => selecionar({ uf })));
  return partes;
}

function painelEstado() {
  const { uf } = estado, u = unidadeUf(uf), rotulo = CARGOS[estado.cargo], partes = [];
  if (u) {
    partes.push(...painelUnidade({ titulo: NOMES_UF[uf], subtitulo: emReprise() ? `${rotulo} · às ${hhmm(estado.tempo.minuto)}` : rotulo, unidade: u,
      nota: estado.cargo === 'senador' && u.vagas ? `Eleição para ${u.vagas} vaga${u.vagas > 1 ? 's' : ''}; cada eleitor vota em até ${u.vagas}.` : '' }));
  } else partes.push(h('div', { classe: 'painel-topo' }, h('h2', null, NOMES_UF[uf])), h('p', { classe: 'vazio-msg' }, `Não há disputa para ${rotulo.toLowerCase()} neste estado neste turno.`));
  const linhas = linhasUf(uf);
  if (u && linhas && !emReprise()) partes.push(tabelaMunicipios([...linhas.values()].filter(l => l.secoes), cadastro(uf), id => selecionar({ uf, mun: id }), vagasDe(uf)));
  return partes;
}

function painelBrasil() {
  const r = estado.resultado, partes = [];
  const unidades = Object.fromEntries(LISTA_UFS.map(uf => [uf, unidadeUf(uf)]).filter(([, u]) => u));
  if (estado.cargo === 'presidente') {
    partes.push(...painelUnidade({ titulo: 'Brasil', subtitulo: emReprise() ? `Presidente · às ${hhmm(estado.tempo.minuto)}` : 'Presidente', unidade: unidadeBrasil() }));
    partes.push(listaViradas(viradas(estado.historico, emReprise() ? estado.tempo.minuto : Infinity), cadastroPresidente(), NOMES_UF));
    partes.push(tabelaRegioes(porRegiao(unidades, REGIOES, cadastroPresidente())));
    partes.push(tabelaUfs(unidades, uf => selecionar({ uf })));
    const ex = r.cargos.presidente.exterior;
    if (ex && ex.secoes && !emReprise()) partes.push(h('details', null, h('summary', null, `Votos no exterior (${pct(apuradoPct(ex), 0)} apurado)`),
      h('div', { classe: 'lista-cand interna' }, blocoCandidatos(ex, 4), blocoNumeros(ex))));
  } else {
    const definidos = Object.values(unidades).filter(u => u.situacao === 'eleito' || u.situacao === 'definido').length;
    const segundo = Object.values(unidades).filter(u => u.situacao === 'segundo-turno').length;
    partes.push(h('div', { classe: 'painel-topo' }, h('h2', null, PLURAL[estado.cargo]),
      h('p', { classe: 'sub' }, `${definidos} de ${Object.keys(unidades).length} disputas definidas${segundo ? ` · ${segundo} vão ao 2º turno` : ''}. Escolha um estado no mapa ou na tabela.`)));
    partes.push(tabelaUfs(unidades, uf => selecionar({ uf })));
  }
  return partes;
}

function renderPainel() {
  const alvo = $('painel');
  if (!estado.resultado) { alvo.replaceChildren(h('p', { classe: 'vazio-msg' }, estado.erro ? 'Os primeiros resultados ainda não foram publicados. Esta página atualiza sozinha.' : 'Carregando…')); return; }
  alvo.replaceChildren(...(estado.uf && estado.mun ? painelMunicipio() : estado.uf ? painelEstado() : painelBrasil()).filter(Boolean));
}

function renderTempo() {
  const t = estado.tempo, barra = $('tempo');
  const disponivel = estado.cargo === 'presidente' && t.minutos.length >= 2;
  barra.hidden = !disponivel;
  if (!disponivel) return;
  const cursor = $('tempo-cursor'), ultimo = t.minutos.length - 1;
  const indice = t.minuto == null ? ultimo : Math.max(0, t.minutos.indexOf(t.minuto));
  cursor.max = ultimo; cursor.value = indice;
  const minuto = t.minutos[indice], br = unidadeBrasil();
  cursor.setAttribute('aria-valuetext', hhmm(minuto));
  $('tempo-rotulo').textContent = `${hhmm(minuto)} · ${pct(apuradoPct(br), 1)} apurado`;
  $('tempo-vivo').hidden = t.minuto == null;
  $('tempo-tocar').textContent = t.tocando ? '❚❚' : '▶';
  $('tempo-tocar').setAttribute('aria-label', t.tocando ? 'Pausar' : 'Reproduzir a apuração');
}

/** Placar do recorte aberto (Brasil, estado ou município) para o cargo atual. */
function renderPlacar() {
  const alvo = $('placar');
  if (!estado.resultado) { alvo.replaceChildren(); return; }
  const { uf, mun, cargo } = estado;
  let u = null, local = 'Brasil', inteira = false;
  if (uf && mun) {
    const linha = !emReprise() && linhaMun(uf, mun);
    u = linha && linha.secoes ? unidadeDeMunicipio(linha, cadastro(uf), vagasDe(uf)) : null;
    local = `${nomeMunicipio(uf, mun)} (${uf})`;
  } else if (uf) { u = unidadeUf(uf); local = NOMES_UF[uf]; inteira = cargo === 'governador'; }
  else if (cargo === 'presidente') { u = unidadeBrasil(); inteira = true; }
  alvo.hidden = !uf && cargo !== 'presidente';
  if (alvo.hidden) return;
  alvo.replaceChildren(...placar(u, { rotulo: h('span', null, h('strong', null, CARGOS[cargo]), ` em ${local}${emReprise() ? ` · às ${hhmm(estado.tempo.minuto)}` : ''}`),
    decide2Turno: inteira && estado.resultado.turno === 1 }));
}

/** Clique no gráfico: leva a linha do tempo ao retrato mais próximo daquele minuto. */
function irParaMinuto(minuto) {
  const { minutos } = estado.tempo;
  if (minutos.length < 2) return;
  let melhor = 0;
  minutos.forEach((m, i) => { if (Math.abs(m - minuto) < Math.abs(minutos[melhor] - minuto)) melhor = i; });
  pararReprise(); irParaIndice(melhor);
}
const redesenharGrafico = () => desenharGrafico($('grafico'), estado.historico, cadastroPresidente(), emReprise() ? estado.tempo.minuto : null, irParaMinuto);

async function baixarMapa() {
  try {
    const blob = await mapa.exportarPng();
    const link = h('a', { href: URL.createObjectURL(blob), download: `mapa-${estado.cargo}-${(estado.uf || 'brasil').toLowerCase()}.png` });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  } catch { /* navegador sem suporte: nada a fazer */ }
}

function renderTudo() {
  renderStatus(); renderControles(); renderPlacar(); renderMapa(); renderLegenda(); renderPainel(); renderTempo();
  redesenharGrafico();
  atualizarHash();
  if (precisaDeMunicipios()) garantirMunicipios();
}

/* ───────────── linha do tempo ───────────── */

async function irParaIndice(indice) {
  const t = estado.tempo, ultimo = t.minutos.length - 1;
  if (indice >= ultimo) { t.minuto = null; t.retrato = null; pararReprise(); renderTudo(); return; }
  const minuto = t.minutos[Math.max(0, indice)];
  let retrato = t.cache.get(minuto);
  if (!retrato) {
    try { retrato = await api.carregarRetrato(minuto); } catch { return; }
    t.cache.set(minuto, retrato);
  }
  t.minuto = minuto; t.retrato = retrato;
  renderTudo();
}

function pararReprise() { clearInterval(estado.tempo.tocando); estado.tempo.tocando = 0; }

function alternarReprise() {
  const t = estado.tempo;
  if (t.tocando) { pararReprise(); renderTempo(); return; }
  let indice = t.minuto == null ? 0 : t.minutos.indexOf(t.minuto) + 1;
  irParaIndice(indice);
  t.tocando = setInterval(() => {
    indice++;
    irParaIndice(indice);
    if (indice >= t.minutos.length - 1) pararReprise();
  }, PASSO_REPRISE_MS);
  renderTempo();
}

async function carregarLinhaDoTempo() {
  try {
    const i = await api.carregarLinhaDoTempo();
    estado.tempo.minutos = i.minutos || [];
    if (estado.tempo.posicao.size !== i.ids.length) estado.tempo.posicao = new Map(i.ids.map((id, k) => [id, k]));
  } catch { estado.tempo.minutos = []; }
}

/* ───────────── seleção e navegação ───────────── */

async function selecionar({ uf = null, mun = null }) {
  estado.uf = uf; estado.mun = mun;
  renderControles(); renderPlacar(); renderMapa(); renderPainel(); atualizarHash();
  if (precisaDeMunicipios()) garantirMunicipios();
  if (!mapa) return;
  if (uf && estado.nivel === 'municipios') await garantirDetalhe(uf);
  if (mun && uf) enquadrarMunicipio(uf, mun); else mapa.enquadrar(uf);
}

async function garantirDetalhe(uf) {
  if (mapa.detalhados.has(uf)) return;
  try { mapa.detalhar(uf, await api.carregarGeoUf(uf)); } catch { /* segue com a geometria simplificada */ }
}

function enquadrarMunicipio(uf, id) {
  const el = mapa.pathMun.get(id);
  if (!el) return mapa.enquadrar(uf);
  const b = el.getBBox();
  mapa.irPara(mapa.ajustar([b.x, b.y, b.width, b.height], 1.6));
}

function trocarCargo(cargo) {
  estado.cargo = cargo;
  if (cargo !== 'presidente') pararReprise();
  renderTudo();
}

async function trocarNivel(nivel) {
  estado.nivel = nivel;
  if (nivel === 'estados') estado.mun = null;
  renderTudo();
  if (nivel === 'municipios' && estado.uf) await garantirDetalhe(estado.uf);
}

async function trocarFonte(fonte) {
  if (fonte === estado.fonte) return;
  pararReprise();
  Object.assign(estado, { fonte, resultado: null, historico: null, erro: false });
  estado.linhas = { presidente: {}, governador: {}, senador: {} };
  estado.linhasDe = { presidente: 0, governador: 0, senador: 0 };
  for (const m of Object.values(estado.corMun)) m.clear();
  estado.tempo = { minutos: [], posicao: new Map(), minuto: null, retrato: null, cache: new Map(), tocando: 0 };
  api.definirFonte(fonte);
  renderTudo();
  await atualizar();
}

function atualizarHash() {
  const partes = [estado.cargo, estado.nivel, estado.uf, estado.mun].filter(Boolean);
  try { history.replaceState(null, '', location.pathname + location.search + '#/' + partes.join('/')); } catch { /* ignore */ }
}

function lerHash() {
  const [cargo, nivel, uf, mun] = location.hash.replace(/^#\/?/, '').split('/');
  if (CARGOS[cargo]) estado.cargo = cargo;
  if (nivel === 'municipios') estado.nivel = 'municipios';
  if (LISTA_UFS.includes(uf)) { estado.uf = uf; if (/^\d+$/.test(mun || '')) estado.mun = +mun; }
}

/* ───────────── tooltip ───────────── */

function mostrarDica(alvo, evento) {
  const dica = $('dica');
  const filhos = [];
  const rodape = texto => h('div', { classe: 'sub rodape-dica' }, texto);
  const linhasCandidatos = (u, l) => validos(u).slice(0, 3).map(c => h('div', { classe: 'linha' },
    h('i', { classe: 'amostra', estilo: { background: corDoPartido(c.partido, c.numero) } }), nomeProprio(c.nome), h('span', { classe: 'num' }, pct(c.votos / l.total, 1))));

  if (alvo.tipo === 'mun' && emReprise()) {
    const m = munNoRetrato(alvo.id), c = m && cadastroPresidente().get(m.numero);
    filhos.push(h('h3', null, nomeMunicipio(alvo.uf, alvo.id)), h('div', { classe: 'sub' }, `${NOMES_UF[alvo.uf]} · às ${hhmm(estado.tempo.minuto)}`));
    if (m) filhos.push(h('div', { classe: 'linha' }, h('i', { classe: 'amostra', estilo: { background: corDoPartido(c ? c.partido : '', m.numero) } }),
      nomeProprio(c ? c.nome : m.numero), h('span', { classe: 'num' }, `+${pct(m.margem, 1).replace('%', '')} pts`)), rodape(`${pct(m.apurado, 0)} das seções apuradas`));
    else filhos.push(rodape('Sem votos apurados neste momento'));
  } else {
    let u, titulo, sub;
    if (alvo.tipo === 'mun') {
      const linha = linhaMun(alvo.uf, alvo.id);
      titulo = nomeMunicipio(alvo.uf, alvo.id); sub = `${NOMES_UF[alvo.uf]} · ${CARGOS[estado.cargo]}`;
      u = linha && linha.secoes && linha.totalizadas ? unidadeDeMunicipio(linha, cadastro(alvo.uf), vagasDe(alvo.uf)) : null;
    } else { titulo = NOMES_UF[alvo.uf]; sub = CARGOS[estado.cargo]; u = unidadeUf(alvo.uf); }
    const l = u && lider(u);
    filhos.push(h('h3', null, titulo), h('div', { classe: 'sub' }, sub));
    if (l) filhos.push(...linhasCandidatos(u, l), rodape(`${pct(apuradoPct(u), 0)} das seções apuradas`));
    else filhos.push(rodape(u === undefined && alvo.tipo === 'uf' ? 'Sem disputa neste turno' : estado.carregandoMun ? 'Carregando…' : 'Sem dados apurados ainda'));
  }
  dica.replaceChildren(...filhos);
  dica.hidden = false;
  const area = $('mapa').getBoundingClientRect();
  let x = evento.clientX - area.left + 14, y = evento.clientY - area.top + 14;
  if (x + dica.offsetWidth > area.width - 6) x = evento.clientX - area.left - dica.offsetWidth - 14;
  if (y + dica.offsetHeight > area.height - 6) y = evento.clientY - area.top - dica.offsetHeight - 14;
  dica.style.left = `${Math.max(6, x)}px`; dica.style.top = `${Math.max(6, y)}px`;
}
const esconderDica = () => { $('dica').hidden = true; };

/* ───────────── carga e atualização periódica ───────────── */

async function atualizar() {
  const fonte = estado.fonte;
  try {
    const r = await api.carregarResultado();
    if (fonte !== estado.fonte) return;
    estado.erro = false;
    if (!estado.resultado || r.gerado !== estado.resultado.gerado) {
      estado.resultado = r;
      await Promise.all([
        api.carregarHistorico().then(x => { estado.historico = x; }).catch(() => {}),
        carregarLinhaDoTempo(),
      ]);
      if (fonte !== estado.fonte) return;
      renderTudo();
      if (estado.uf && estado.nivel === 'municipios') garantirDetalhe(estado.uf);
    } else renderStatus();
  } catch {
    if (fonte !== estado.fonte) return;
    estado.erro = true;
    renderStatus();
    if (!estado.resultado) renderPainel();
  }
}

async function escolherFonte() {
  const pedido = new URLSearchParams(location.search).get('fonte');
  let indice = null;
  try { indice = await api.carregarIndice(); } catch { /* sem índice: assume o 1º turno */ }
  estado.turnos = (indice && indice.turnos) || [1];
  estado.fonte = pedido === 'simulacao' ? 'simulacao' : /^turno[12]$/.test(pedido || '') ? pedido : `turno${(indice && indice.atual) || 1}`;
  api.definirFonte(estado.fonte);
}

async function iniciar() {
  lerHash();
  try { [estado.geo] = await Promise.all([api.carregarGeo(), escolherFonte()]); }
  catch { $('painel').replaceChildren(h('p', { classe: 'vazio-msg' }, 'Não foi possível carregar o mapa. Recarregue a página.')); return; }
  estado.geo.municipios.forEach(m => estado.nomeMun.set(m.id, m.n));

  mapa = new Mapa($('svg-mapa'), {
    aoPassar: mostrarDica, aoSair: esconderDica,
    aoClicar: a => {
      esconderDica();
      if (a.tipo === 'mun' && estado.uf === a.uf) selecionar({ uf: a.uf, mun: a.id });
      else selecionar({ uf: a.uf });
    },
  });
  mapa.construir(estado.geo);
  mapa.definirNivel(estado.nivel);

  new Busca({
    dialogo: $('busca'), campo: $('busca-campo'), lista: $('busca-lista'), abrirBotao: $('abrir-busca'), geo: estado.geo,
    aoEscolher: r => {
      if (r.tipo === 'uf') { selecionar({ uf: r.uf }); return; }
      estado.nivel = 'municipios'; renderTudo(); selecionar({ uf: r.uf, mun: r.id });
    },
  });

  document.querySelectorAll('[data-cargo]').forEach(b => b.addEventListener('click', () => trocarCargo(b.dataset.cargo)));
  document.querySelectorAll('[data-nivel]').forEach(b => b.addEventListener('click', () => trocarNivel(b.dataset.nivel)));
  $('voltar').addEventListener('click', () => selecionar({}));
  $('zoom-mais').addEventListener('click', () => mapa.zoom(0.7));
  $('zoom-menos').addEventListener('click', () => mapa.zoom(1.4));
  $('zoom-reset').addEventListener('click', () => mapa.enquadrar(estado.uf));
  $('baixar-mapa').addEventListener('click', baixarMapa);
  $('turno-select').addEventListener('change', e => trocarFonte(e.target.value));
  $('tempo-cursor').addEventListener('input', e => { pararReprise(); irParaIndice(+e.target.value); });
  $('tempo-tocar').addEventListener('click', alternarReprise);
  $('tempo-vivo').addEventListener('click', () => irParaIndice(Infinity));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('busca').open && (estado.uf || estado.mun)) selecionar(estado.mun ? { uf: estado.uf } : {}); });
  window.addEventListener('resize', () => { mapa.enquadrar(estado.uf); redesenharGrafico(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) atualizar(); });

  renderTudo();
  await atualizar();
  if (estado.uf) {
    if (estado.nivel === 'municipios') await garantirDetalhe(estado.uf);
    if (estado.mun) enquadrarMunicipio(estado.uf, estado.mun); else mapa.enquadrar(estado.uf);
  }
  setInterval(atualizar, estado.fonte === 'simulacao' ? 3000 : 30000);
}

iniciar();
