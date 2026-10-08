// Orquestra o painel: carrega dados, mantém a seleção, pinta o mapa, controla a linha do tempo e atualiza em intervalos.
import * as api from './api.js';
import { Mapa } from './mapa.js';
import { Busca } from './busca.js';
import { desenharGrafico } from './grafico.js';
import { fichaUnidade, bancada, tabelaUfs, tabelaMunicipios, blocoCandidatos, blocoNumeros, placar, tabelaRegioes, listaViradas } from './painel.js';
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
  anterior: null,           // resultado do 1º turno, consultado quando a tela mostra o 2º
  fonteFixa: false,         // true se a pessoa escolheu a fonte (URL ou seletor): não troca sozinha
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
/** No 2º turno, a unidade do 1º para o cargo atual (quem já foi eleito onde não há mais disputa). */
const unidadeAnterior = uf => (estado.anterior && estado.resultado && estado.resultado.turno === 2 && !emReprise() ? estado.anterior.cargos[estado.cargo].uf[uf] : undefined);
const anteriores = () => Object.fromEntries(LISTA_UFS.map(uf => [uf, unidadeAnterior(uf)]).filter(([, u]) => u));
const temSenado = () => !estado.resultado || Object.keys(estado.resultado.cargos.senador.uf).length > 0;
const dataPorExtenso = iso => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) : '');
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
  // só as UFs que têm disputa para o cargo (no 2º turno, poucos estados elegem governador)
  const ufs = LISTA_UFS.filter(uf => cargo === 'presidente' || r.cargos[cargo].uf[uf]);
  pendentes[cargo] = Promise.allSettled(ufs.map(uf => api.carregarMunicipios(cargo, uf))).then(resultados => {
    delete pendentes[cargo];
    if (fonte !== estado.fonte) return;
    resultados.forEach((x, i) => { if (x.status === 'fulfilled') estado.linhas[cargo][ufs[i]] = new Map(x.value.municipios.map(m => [m.id, m])); });
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
  const f = apuradoPct(br), secoes = `${pct(f, 2)} das seções`;
  if (emReprise()) texto.textContent = `Reprise das ${hhmm(estado.tempo.minuto)}`;
  else if (estado.erro) { ponto.classList.add('erro'); texto.textContent = 'Sem conexão. Exibindo os últimos dados recebidos'; }
  else {
    if (!concluida) ponto.classList.add('ao-vivo');
    const hora = (r.atualizadoTse.hora || '').slice(0, 5);
    texto.textContent = concluida ? 'Apuração concluída' : `Ao vivo, ${pct(f, 1)} das seções`;
    texto.title = `${secoes} apuradas${hora ? `. Dados do TSE de ${r.atualizadoTse.data} às ${r.atualizadoTse.hora}` : ''}`;
  }
  $('turno-rotulo').textContent = `2026, ${r.turno}º turno`;
  const faixa = $('faixa-simulacao');
  faixa.hidden = !r.simulacao;
  if (r.simulacao) faixa.replaceChildren(h('strong', null, r.ensaio ? 'Ensaio do 2º turno.' : 'Simulação.'),
    r.ensaio ? ' A eleição ainda não aconteceu: estes números são fictícios, montados a partir do 1º turno, e não indicam vencedor.'
      : ' Estes números são uma reencenação para teste e não são o resultado oficial.');
  $('progresso-preenchimento').style.width = `${f * 100}%`;
  $('progresso-barra').setAttribute('aria-valuenow', Math.round(f * 100));
  $('progresso-barra').setAttribute('aria-valuetext', `${secoes} apuradas (${br.totalizadas.toLocaleString('pt-BR')} de ${br.secoes.toLocaleString('pt-BR')})`);
}

function renderControles() {
  document.querySelectorAll('[data-cargo]').forEach(b => {
    b.setAttribute('aria-selected', String(b.dataset.cargo === estado.cargo));
    if (b.dataset.cargo === 'senador') b.hidden = !temSenado();   // no 2º turno não há eleição para o Senado
  });
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
  mapa.pintar(uf => {
    const cor = corDaUnidade(unidadeUf(uf));
    if (cor) return cor;
    const antes = corDaUnidade(unidadeAnterior(uf));
    return antes ? { cor: antes.cor, opacidade: 0.22 } : null;
  }, estado.nivel === 'municipios' ? corDoMunicipio : null);
  mapa.selecionar(estado.uf, estado.mun);
  $('voltar').hidden = !estado.uf;
  $('mapa-titulo').textContent = estado.mun ? `${nomeMunicipio(estado.uf, estado.mun)}, ${estado.uf}` : estado.uf ? NOMES_UF[estado.uf] : 'Brasil';
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
  const nota = Object.keys(anteriores()).length ? h('span', null, 'Tom apagado: decidido no 1º turno') : null;
  alvo.replaceChildren(...[...itens, h('span', null, amostra('var(--vazio)'), 'Sem dados'), nota, escala].filter(Boolean));
}

function botaoVoltar(rotulo, aoClicar) { return h('button', { classe: 'botao-leve', type: 'button', onclick: aoClicar }, rotulo); }
const aviso = texto => h('p', { classe: 'vazio-msg' }, texto);

/** Cada recorte devolve { ficha: coluna da esquerda (sob o placar), contexto: coluna da direita }. */
function painelMunicipio() {
  const { uf, mun } = estado, ficha = [], contexto = [];
  if (!emReprise()) {
    const linha = linhaMun(uf, mun);
    if (linha && linha.secoes) ficha.push(...fichaUnidade(unidadeDeMunicipio(linha, cadastro(uf), vagasDe(uf))));
    else ficha.push(aviso(estado.carregandoMun ? 'Carregando…' : 'Sem dados apurados para este município.'));
  }
  contexto.push(botaoVoltar(`Voltar a ${NOMES_UF[uf]}`, () => selecionar({ uf })));
  const linhas = linhasUf(uf);
  if (linhas && !emReprise()) contexto.push(tabelaMunicipios([...linhas.values()].filter(l => l.secoes), cadastro(uf), id => selecionar({ uf, mun: id }), vagasDe(uf)));
  return { ficha, contexto };
}

function painelEstado() {
  const { uf } = estado, u = unidadeUf(uf), ficha = [], contexto = [];
  if (u) ficha.push(...fichaUnidade(u, estado.cargo === 'senador' && u.vagas ? `Eleição para ${u.vagas} vaga${u.vagas > 1 ? 's' : ''}; cada eleitor vota em até ${u.vagas}.` : ''));
  else if (unidadeAnterior(uf)) ficha.push(...fichaUnidade(unidadeAnterior(uf), 'Resultado do 1º turno, em 4 de outubro.'));
  const linhas = linhasUf(uf);
  if (u && linhas && !emReprise()) contexto.push(tabelaMunicipios([...linhas.values()].filter(l => l.secoes), cadastro(uf), id => selecionar({ uf, mun: id }), vagasDe(uf)));
  else if (u) contexto.push(aviso(emReprise() ? 'A lista de municípios volta quando você sair da reprise.' : 'Carregando os municípios…'));
  return { ficha, contexto };
}

function painelBrasil() {
  const r = estado.resultado, ficha = [], contexto = [];
  const unidades = Object.fromEntries(LISTA_UFS.map(uf => [uf, unidadeUf(uf)]).filter(([, u]) => u));
  if (estado.cargo === 'presidente') {
    ficha.push(...fichaUnidade(unidadeBrasil()));
    const ex = r.cargos.presidente.exterior;
    if (ex && ex.secoes && !emReprise()) ficha.push(h('details', null, h('summary', null, `Votos no exterior (${pct(apuradoPct(ex), 0)} apurado)`),
      h('div', { classe: 'lista-cand interna' }, blocoCandidatos(ex, 4), blocoNumeros(ex))));
    contexto.push(listaViradas(viradas(estado.historico, emReprise() ? estado.tempo.minuto : Infinity), cadastroPresidente(), NOMES_UF));
    contexto.push(tabelaRegioes(porRegiao(unidades, REGIOES, cadastroPresidente())));
  } else {
    ficha.push(bancada([...Object.values(unidades), ...Object.values(anteriores())], estado.cargo === 'governador' ? 'Governadores eleitos por partido' : 'Senadores eleitos por partido'));
    ficha.push(aviso('Escolha um estado no mapa ou na lista para ver os candidatos.'));
  }
  contexto.push(tabelaUfs(unidades, uf => selecionar({ uf }), anteriores()));
  return { ficha, contexto };
}

function renderPainel() {
  const ficha = $('ficha'), contexto = $('painel');
  if (!estado.resultado) {
    ficha.replaceChildren(aviso(estado.erro ? 'Os primeiros resultados ainda não foram publicados. Esta página atualiza sozinha.' : 'Carregando…'));
    contexto.replaceChildren();
    return;
  }
  const p = estado.uf && estado.mun ? painelMunicipio() : estado.uf ? painelEstado() : painelBrasil();
  ficha.replaceChildren(...p.ficha.filter(Boolean));
  contexto.replaceChildren(...p.contexto.filter(Boolean));
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
  $('tempo-rotulo').textContent = `${hhmm(minuto)}, ${pct(apuradoPct(br), 1)} apurado`;
  $('tempo-vivo').hidden = t.minuto == null;
  $('tempo-tocar').textContent = t.tocando ? '❚❚' : '▶';
  $('tempo-tocar').setAttribute('aria-label', t.tocando ? 'Pausar' : 'Reproduzir a apuração');
}

const DE_UF = { AC: 'do', AL: 'de', AM: 'do', AP: 'do', BA: 'da', CE: 'do', DF: 'do', ES: 'do', GO: 'de', MA: 'do', MG: 'de', MS: 'de', MT: 'de',
  PA: 'do', PB: 'da', PE: 'de', PI: 'do', PR: 'do', RJ: 'do', RN: 'do', RO: 'de', RR: 'de', RS: 'do', SC: 'de', SE: 'de', SP: 'de', TO: 'do' };
const emUf = uf => `${DE_UF[uf].replace('d', 'n').replace(/^ne$/, 'em')} ${NOMES_UF[uf]}`;   // "no Acre", "na Bahia", "em Goiás"

/** Placar e manchete do recorte aberto (Brasil, estado ou município) para o cargo atual. */
function renderPlacar() {
  const alvo = $('placar');
  if (!estado.resultado) { alvo.replaceChildren(); return; }
  const { uf, mun, cargo } = estado;
  const quando = emReprise() ? `, às ${hhmm(estado.tempo.minuto)}` : '';
  const prefixo = estado.resultado.simulacao ? 'Simulação. ' : '';   // dado fictício sempre identificado junto da manchete
  if (!uf && cargo !== 'presidente') {   // visão nacional de um cargo estadual: resumo das 27 disputas
    const us = Object.values(unidadesReais());
    const definidos = us.filter(u => u.situacao === 'eleito' || u.situacao === 'definido').length;
    const segundo = us.filter(u => u.situacao === 'segundo-turno').length;
    const segundoTurno = estado.resultado.turno === 2;
    const oQue = cargo !== 'governador' ? 'disputas pelo Senado' : segundoTurno ? 'governos em disputa no 2º turno' : 'governos estaduais';
    alvo.replaceChildren(h('p', { classe: 'placar-local' }, `${prefixo}${PLURAL[cargo]} no Brasil`),
      h('h2', { classe: 'manchete' }, `${definidos} de ${us.length} ${oQue} já têm resultado${segundo ? `; ${segundo} vão ao 2º turno` : ''}`));
    return;
  }
  let u = null, local = 'Brasil', preposicao = 'no Brasil', inteira = false;
  if (uf && mun) {
    const nome = nomeMunicipio(uf, mun);
    local = nome; preposicao = `em ${nome}`;
    if (emReprise()) {
      const m = munNoRetrato(mun), c = m && cadastroPresidente().get(m.numero);
      alvo.replaceChildren(h('p', { classe: 'placar-local' }, `${prefixo}Presidente em ${nome} (${uf})${quando}`),
        h('h2', { classe: 'manchete' }, m ? `${nomeProprio(c ? c.nome : m.numero)} na frente em ${nome} por ${pct(m.margem, 1).replace('%', '')} pontos` : `Ainda sem votos apurados em ${nome}`),
        m ? h('p', { classe: 'placar-dif' }, `${pct(m.apurado, 0)} das seções apuradas naquele momento`) : null);
      return;
    }
    const linha = linhaMun(uf, mun);
    u = linha && linha.secoes ? unidadeDeMunicipio(linha, cadastro(uf), vagasDe(uf)) : null;
  } else if (uf) { u = unidadeUf(uf); local = NOMES_UF[uf]; preposicao = emUf(uf); inteira = cargo !== 'presidente'; }
  else { u = unidadeBrasil(); inteira = true; }
  if (uf && !mun && !u) {
    const antes = unidadeAnterior(uf), eleito = antes && antes.candidatos.find(c => c.resultado === 'eleito');
    alvo.replaceChildren(h('p', { classe: 'placar-local' }, `${prefixo}${CARGOS[cargo]} ${emUf(uf)}`),
      h('h2', { classe: 'manchete' }, eleito ? `${NOMES_UF[uf]} decidiu no 1º turno: ${nomeProprio(eleito.nome)} é o governador eleito`
        : `Não há disputa para ${CARGOS[cargo].toLowerCase()} ${emUf(uf)} neste turno`));
    return;
  }
  alvo.replaceChildren(...placar(u, { cargo, local, preposicao, inteira, turno: estado.resultado.turno,
    dataSegundoTurno: dataPorExtenso(estado.resultado.segundoTurno),
    rotulo: `${prefixo}${CARGOS[cargo]} ${uf && mun ? `em ${local} (${uf})` : preposicao}${quando}`,
    decide2Turno: inteira && cargo !== 'senador' && estado.resultado.turno === 1 }).filter(Boolean));
}

/** Clique no gráfico: leva a linha do tempo ao retrato mais próximo daquele minuto. */
function irParaMinuto(minuto) {
  const { minutos } = estado.tempo;
  if (minutos.length < 2) return;
  let melhor = 0;
  minutos.forEach((m, i) => { if (Math.abs(m - minuto) < Math.abs(minutos[melhor] - minuto)) melhor = i; });
  pararReprise(); irParaIndice(melhor);
}
function redesenharGrafico() {
  const temSerie = !!estado.historico && (estado.historico.pontos || []).length >= 2;
  $('grafico-bloco').hidden = !temSerie || estado.cargo !== 'presidente';
  if (temSerie) desenharGrafico($('grafico'), estado.historico, cadastroPresidente(), emReprise() ? estado.tempo.minuto : null, irParaMinuto);
}

async function baixarMapa() {
  try {
    const blob = await mapa.exportarPng(1600, estado.resultado && estado.resultado.simulacao ? 'SIMULAÇÃO: números fictícios' : '');
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
  Object.assign(estado, { fonte, resultado: null, historico: null, anterior: null, erro: false });
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
    else {
      const antes = alvo.tipo === 'uf' && unidadeAnterior(alvo.uf), eleito = antes && antes.candidatos.find(c => c.resultado === 'eleito');
      filhos.push(rodape(eleito ? `Decidido no 1º turno: ${nomeProprio(eleito.nome)} foi eleito`
        : u === undefined && alvo.tipo === 'uf' ? 'Sem disputa neste turno' : estado.carregandoMun ? 'Carregando…' : 'Sem dados apurados ainda'));
    }
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
      if (estado.cargo === 'senador' && !temSenado()) estado.cargo = 'presidente';
      if (r.turno === 2 && !estado.anterior) estado.anterior = await api.carregarResultadoDe('turno1').catch(() => null);
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
  conferirTurno();
}

/** Quando o updater publica um turno novo, a tela passa a mostrá-lo sozinha (a menos que a pessoa tenha escolhido outro). */
async function conferirTurno() {
  if (estado.fonte === 'simulacao') return;
  let indice;
  try { indice = await api.carregarIndice(); } catch { return; }
  const turnos = indice.turnos || [1];
  const mudou = turnos.length !== estado.turnos.length;
  estado.turnos = turnos;
  if (mudou) renderControles();
  if (mudou && !estado.fonteFixa && estado.fonte !== `turno${indice.atual}`) trocarFonte(`turno${indice.atual}`);
}

async function escolherFonte() {
  const pedido = new URLSearchParams(location.search).get('fonte');
  let indice = null;
  try { indice = await api.carregarIndice(); } catch { /* sem índice: assume o 1º turno */ }
  estado.turnos = (indice && indice.turnos) || [1];
  estado.fonte = pedido === 'simulacao' ? 'simulacao' : /^turno[12]$/.test(pedido || '') ? pedido : `turno${(indice && indice.atual) || 1}`;
  estado.fonteFixa = !!pedido;
  api.definirFonte(estado.fonte);
}

/** Tema escuro por padrão; a escolha da pessoa fica guardada no navegador. */
function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tema === 'claro' ? '#f6f0e6' : '#1c1815');
}
function temaGuardado() { try { return localStorage.getItem('tema'); } catch { return null; } }
function alternarTema() {
  const novo = document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro';
  aplicarTema(novo);
  try { localStorage.setItem('tema', novo); } catch { /* navegação privada */ }
}

async function iniciar() {
  aplicarTema(temaGuardado() === 'claro' ? 'claro' : 'escuro');
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
  $('alternar-tema').addEventListener('click', alternarTema);
  $('turno-select').addEventListener('change', e => { estado.fonteFixa = true; trocarFonte(e.target.value); });
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
