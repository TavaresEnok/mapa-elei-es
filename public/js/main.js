// Orquestra o painel: carrega dados, mantém a seleção, pinta o mapa e atualiza em intervalos.
import * as api from './api.js';
import { Mapa } from './mapa.js';
import { Busca } from './busca.js';
import { desenharGrafico } from './grafico.js';
import { painelUnidade, tabelaUfs, tabelaMunicipios, blocoCandidatos, blocoNumeros } from './painel.js';
import { corDaUnidade, lider, unidadeDeMunicipio, apuradoPct, validos } from './dados.js';
import { corDoPartido, intensidade } from './cores.js';
import { h, pct, nomeProprio } from './fmt.js';
import { NOMES_UF, LISTA_UFS } from './ufs.js';

const INTERVALO_MS = 30000;
const CARGOS = { presidente: 'Presidente', governador: 'Governador', senador: 'Senador' };
const PLURAL = { presidente: 'Presidente', governador: 'Governadores', senador: 'Senadores' };
const $ = id => document.getElementById(id);

const estado = {
  cargo: 'presidente', nivel: 'estados', uf: null, mun: null,
  resultado: null, historico: null, geo: null,
  linhas: {},               // UF → Map(id → linha de município)
  corMun: new Map(),        // id → { cor, opacidade }
  cadastro: new Map(),      // número do candidato a presidente → { nome, partido }
  nomeMun: new Map(),       // id → nome (geometria)
  ultimaConsulta: null, erro: false,
};

let mapa, busca;

/* ───────────── acesso aos dados ───────────── */

const unidadesDoCargo = () => (estado.resultado ? estado.resultado.cargos[estado.cargo].uf : {});
const unidadeBrasil = () => estado.resultado && estado.resultado.cargos.presidente.br;
const linhaMun = (uf, id) => estado.linhas[uf] && estado.linhas[uf].get(id);
const nomeMunicipio = (uf, id) => (linhaMun(uf, id) && linhaMun(uf, id).nome) || estado.nomeMun.get(id) || String(id);

function recalcularMunicipios() {
  estado.corMun.clear();
  for (const uf of Object.keys(estado.linhas)) {
    for (const [id, linha] of estado.linhas[uf]) {
      if (!linha.secoes || !linha.totalizadas) continue;
      const u = unidadeDeMunicipio(linha, estado.cadastro), l = lider(u);
      if (l) estado.corMun.set(id, { cor: corDoPartido(l.candidato.partido, l.candidato.numero), opacidade: intensidade(l.margem) });
    }
  }
}

/* ───────────── renderização ───────────── */

function renderStatus() {
  const r = estado.resultado, br = unidadeBrasil();
  const ponto = $('ponto-status'), texto = $('texto-status');
  ponto.className = 'ponto';
  if (!r) { texto.textContent = estado.erro ? 'Aguardando os primeiros dados do TSE…' : 'Carregando…'; return; }
  const concluida = br.totalizadas >= br.secoes;
  if (estado.erro) { ponto.classList.add('erro'); texto.textContent = 'Sem conexão — exibindo os últimos dados recebidos'; }
  else {
    if (!concluida) ponto.classList.add('ao-vivo');
    const quando = r.atualizadoTse.hora ? `dados do TSE de ${r.atualizadoTse.data} às ${r.atualizadoTse.hora}` : 'dados do TSE';
    texto.textContent = `${concluida ? 'Apuração concluída' : 'Ao vivo'} · ${quando}`;
  }
  $('turno-rotulo').textContent = `2026 · ${r.turno}º turno`;
  const f = apuradoPct(br);
  $('progresso-valor').textContent = `${pct(f, 2)} (${br.totalizadas.toLocaleString('pt-BR')} de ${br.secoes.toLocaleString('pt-BR')} seções)`;
  $('progresso-preenchimento').style.width = `${f * 100}%`;
  $('progresso-barra').setAttribute('aria-valuenow', Math.round(f * 100));
}

function renderControles() {
  document.querySelectorAll('[data-cargo]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.cargo === estado.cargo)));
  document.querySelectorAll('[data-nivel]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.nivel === estado.nivel));
    if (b.dataset.nivel === 'municipios') {
      b.disabled = estado.cargo !== 'presidente';
      b.title = b.disabled ? 'Resultado por município disponível apenas para presidente' : '';
    }
  });
}

function renderMapa() {
  if (!mapa || !estado.resultado) return;
  mapa.definirNivel(estado.nivel);
  const unidades = unidadesDoCargo();
  mapa.pintar(uf => corDaUnidade(unidades[uf]), estado.nivel === 'municipios' ? id => estado.corMun.get(id) : null);
  mapa.selecionar(estado.uf, estado.mun);
  $('voltar').hidden = !estado.uf;
  $('mapa-titulo').textContent = estado.mun ? `${nomeMunicipio(estado.uf, estado.mun)} · ${estado.uf}` : estado.uf ? NOMES_UF[estado.uf] : 'Brasil';
  $('svg-mapa').setAttribute('aria-label', `Mapa ${estado.uf ? 'de ' + NOMES_UF[estado.uf] : 'do Brasil'} colorido pelo candidato mais votado em cada ${estado.nivel === 'municipios' ? 'município' : 'estado'}`);
  const aviso = $('mapa-aviso');
  aviso.hidden = !(estado.cargo !== 'presidente');
  aviso.textContent = estado.cargo !== 'presidente' ? `Governador e senador são decididos por estado; o mapa mostra o mais votado em cada UF.` : '';
}

function renderLegenda() {
  const alvo = $('legenda');
  if (!estado.resultado) { alvo.replaceChildren(); return; }
  const mapaCand = new Map();
  if (estado.cargo === 'presidente') {
    for (const c of validos(unidadeBrasil()).slice(0, 5)) mapaCand.set(c.partido + c.numero, c);
  } else {
    for (const u of Object.values(unidadesDoCargo())) { const l = lider(u); if (l) mapaCand.set(l.candidato.partido, l.candidato); }
  }
  const itens = [...mapaCand.values()].map(c => h('span', null, h('i', { classe: 'amostra', estilo: { background: corDoPartido(c.partido, c.numero) } }),
    estado.cargo === 'presidente' ? `${nomeProprio(c.nome)} (${c.partido})` : c.partido));
  alvo.replaceChildren(...itens, h('span', null, h('i', { classe: 'amostra', estilo: { background: 'var(--vazio)' } }), 'Sem dados'), h('span', null, 'Cor mais forte = maior vantagem'));
}

function renderPainel() {
  const alvo = $('painel');
  const r = estado.resultado;
  if (!r) { alvo.replaceChildren(h('p', { classe: 'vazio-msg' }, estado.erro ? 'Os primeiros resultados ainda não foram publicados. Esta página atualiza sozinha.' : 'Carregando…')); return; }
  const rotuloCargo = CARGOS[estado.cargo];
  const unidades = unidadesDoCargo();
  const partes = [];

  if (estado.uf && estado.mun) {
    const linha = linhaMun(estado.uf, estado.mun);
    if (linha && linha.secoes) {
      partes.push(...painelUnidade({ titulo: linha.nome, subtitulo: `${NOMES_UF[estado.uf]} · presidente`, unidade: unidadeDeMunicipio(linha, estado.cadastro) }));
    } else partes.push(h('h2', null, nomeMunicipio(estado.uf, estado.mun)), h('p', { classe: 'vazio-msg' }, 'Sem dados apurados para este município ainda.'));
    partes.push(h('button', { classe: 'botao-leve', type: 'button', onclick: () => selecionar({ uf: estado.uf }) }, `← ${NOMES_UF[estado.uf]}`));
  } else if (estado.uf) {
    const u = unidades[estado.uf];
    if (u) partes.push(...painelUnidade({ titulo: NOMES_UF[estado.uf], subtitulo: rotuloCargo, unidade: u,
      nota: estado.cargo === 'senador' ? `Eleição para ${u.vagas} vaga${u.vagas > 1 ? 's' : ''}; cada eleitor vota em até ${u.vagas}.` : '' }));
    else partes.push(h('h2', null, NOMES_UF[estado.uf]), h('p', { classe: 'vazio-msg' }, `Não há disputa para ${rotuloCargo.toLowerCase()} neste estado neste turno.`));
    if (estado.cargo === 'presidente' && estado.linhas[estado.uf]) {
      partes.push(tabelaMunicipios([...estado.linhas[estado.uf].values()].filter(l => l.secoes), estado.cadastro, id => selecionar({ uf: estado.uf, mun: id })));
    }
  } else if (estado.cargo === 'presidente') {
    const br = unidadeBrasil(), ex = r.cargos.presidente.exterior;
    partes.push(...painelUnidade({ titulo: 'Brasil', subtitulo: 'Presidente', unidade: br }));
    partes.push(tabelaUfs(unidades, uf => selecionar({ uf })));
    if (ex && ex.secoes) partes.push(h('details', null, h('summary', null, `Votos no exterior (${pct(apuradoPct(ex), 0)} apurado)`),
      h('div', { classe: 'lista-cand', estilo: { marginTop: '12px' } }, blocoCandidatos(ex, 4), blocoNumeros(ex))));
  } else {
    partes.push(h('div', null, h('h2', null, PLURAL[estado.cargo]),
      h('p', { classe: 'sub' }, 'Selecione um estado no mapa ou na tabela para ver os candidatos.')));
    partes.push(tabelaUfs(unidades, uf => selecionar({ uf })));
  }
  alvo.replaceChildren(...partes);
}

function renderTudo() {
  renderStatus(); renderControles(); renderMapa(); renderLegenda(); renderPainel();
  desenharGrafico($('grafico'), estado.historico, estado.cadastro);
  atualizarHash();
}

/* ───────────── seleção e navegação ───────────── */

async function selecionar({ uf = null, mun = null }) {
  estado.uf = uf; estado.mun = mun;
  renderControles(); renderMapa(); renderPainel(); atualizarHash();
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
  mapa.irPara(mapa.ajustar([b.x, b.y, b.width, b.height], 1.2));
}

function trocarCargo(cargo) {
  estado.cargo = cargo;
  if (cargo !== 'presidente') { estado.nivel = 'estados'; estado.mun = null; }
  renderTudo();
}

async function trocarNivel(nivel) {
  if (nivel === 'municipios' && estado.cargo !== 'presidente') return;
  estado.nivel = nivel;
  renderTudo();
  if (nivel === 'municipios' && estado.uf) { await garantirDetalhe(estado.uf); }
}

function atualizarHash() {
  const partes = [estado.cargo, estado.nivel, estado.uf, estado.mun].filter(Boolean);
  try { history.replaceState(null, '', '#/' + partes.join('/')); } catch { /* ignore */ }
}

function lerHash() {
  const [cargo, nivel, uf, mun] = location.hash.replace(/^#\/?/, '').split('/');
  if (CARGOS[cargo]) estado.cargo = cargo;
  if (nivel === 'municipios' && estado.cargo === 'presidente') estado.nivel = 'municipios';
  if (LISTA_UFS.includes(uf)) { estado.uf = uf; if (/^\d+$/.test(mun || '')) estado.mun = +mun; }
}

/* ───────────── tooltip ───────────── */

function mostrarDica(alvo, evento) {
  const dica = $('dica');
  let u, titulo, sub;
  if (alvo.tipo === 'mun') {
    const linha = linhaMun(alvo.uf, alvo.id);
    titulo = nomeMunicipio(alvo.uf, alvo.id); sub = `${NOMES_UF[alvo.uf]} · presidente`;
    u = linha && linha.secoes && linha.totalizadas ? unidadeDeMunicipio(linha, estado.cadastro) : null;
  } else {
    titulo = NOMES_UF[alvo.uf]; sub = CARGOS[estado.cargo];
    u = unidadesDoCargo()[alvo.uf];
  }
  const l = u && lider(u);
  const filhos = [h('h3', null, titulo), h('div', { classe: 'sub' }, sub)];
  if (l) {
    for (const c of validos(u).slice(0, 3)) {
      filhos.push(h('div', { classe: 'linha' }, h('i', { classe: 'amostra', estilo: { background: corDoPartido(c.partido, c.numero) } }),
        nomeProprio(c.nome), h('span', { classe: 'num' }, pct(c.votos / l.total, 1))));
    }
    filhos.push(h('div', { classe: 'sub', estilo: { marginTop: '6px' } }, `${pct(apuradoPct(u), 0)} das seções apuradas`));
  } else filhos.push(h('div', { classe: 'sub', estilo: { marginTop: '6px' } }, u === undefined && alvo.tipo === 'uf' ? 'Sem disputa neste turno' : 'Sem dados apurados ainda'));
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

async function carregarMunicipios() {
  const resultados = await Promise.allSettled(LISTA_UFS.map(uf => api.carregarMunicipios(uf)));
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') estado.linhas[LISTA_UFS[i]] = new Map(r.value.municipios.map(m => [m.id, m]));
  });
  recalcularMunicipios();
}

async function atualizar() {
  try {
    const r = await api.carregarResultado();
    estado.erro = false;
    estado.ultimaConsulta = Date.now();
    if (!estado.resultado || r.gerado !== estado.resultado.gerado) {
      estado.resultado = r;
      estado.cadastro = new Map(validos(r.cargos.presidente.br).map(c => [c.numero, { nome: c.nome, partido: c.partido }]));
      await Promise.all([carregarMunicipios(), api.carregarHistorico().then(x => { estado.historico = x; }).catch(() => {})]);
      renderTudo();
      if (estado.uf && estado.nivel === 'municipios') garantirDetalhe(estado.uf);
    } else renderStatus();
  } catch (e) {
    estado.erro = true;
    renderStatus();
    if (!estado.resultado) renderPainel();
  }
}

async function iniciar() {
  lerHash();
  try {
    estado.geo = await api.carregarGeo();
  } catch {
    $('painel').replaceChildren(h('p', { classe: 'vazio-msg' }, 'Não foi possível carregar o mapa. Recarregue a página.'));
    return;
  }
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

  busca = new Busca({
    dialogo: $('busca'), campo: $('busca-campo'), lista: $('busca-lista'), abrirBotao: $('abrir-busca'), geo: estado.geo,
    aoEscolher: r => {
      if (r.tipo === 'uf') selecionar({ uf: r.uf });
      else { estado.nivel = estado.cargo === 'presidente' ? 'municipios' : estado.nivel; renderTudo(); selecionar({ uf: r.uf, mun: r.id }); }
    },
  });

  document.querySelectorAll('[data-cargo]').forEach(b => b.addEventListener('click', () => trocarCargo(b.dataset.cargo)));
  document.querySelectorAll('[data-nivel]').forEach(b => b.addEventListener('click', () => trocarNivel(b.dataset.nivel)));
  $('voltar').addEventListener('click', () => selecionar({}));
  $('zoom-mais').addEventListener('click', () => mapa.zoom(0.7));
  $('zoom-menos').addEventListener('click', () => mapa.zoom(1.4));
  $('zoom-reset').addEventListener('click', () => mapa.enquadrar(estado.uf));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('busca').open && (estado.uf || estado.mun)) selecionar(estado.mun ? { uf: estado.uf } : {}); });
  window.addEventListener('resize', () => mapa.enquadrar(estado.uf));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) atualizar(); });

  renderTudo();
  await atualizar();
  if (estado.uf) { if (estado.nivel === 'municipios') await garantirDetalhe(estado.uf); estado.mun ? enquadrarMunicipio(estado.uf, estado.mun) : mapa.enquadrar(estado.uf); }
  setInterval(atualizar, INTERVALO_MS);
}

iniciar();
