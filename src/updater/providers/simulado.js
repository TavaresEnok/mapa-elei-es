'use strict';
/**
 * Provider simulado: reencena uma apuração a partir do resultado final real de um turno, revelando os
 * municípios aos poucos e devolvendo documentos no MESMO formato do TSE. Assim o pipeline inteiro
 * (transformação, validação, linha do tempo, gravação) é exercitado sem depender do dia da eleição.
 *
 * Os dados simulados vão para public/data/simulacao/ — nunca se misturam com os reais.
 */
const path = require('path');
const { UFS, ALL, CARGOS } = require('../config');
const { loadJson, clamp } = require('../util');

const INICIO_MIN = 17 * 60;     // 17h: fechamento das urnas
const DURACAO_MIN = 240;        // a apuração simulada "dura" 4 horas de relógio
const CONTADORES = ['apurado', 'comparecimento', 'brancos', 'nulos'];

const vazio = () => ({ secoes: 0, totalizadas: 0, eleitorado: 0, apurado: 0, comparecimento: 0, brancos: 0, nulos: 0, votos: {} });

/** Momento (0–1) em que cada município começa a aparecer: determinístico pelo id. */
const sorteio = id => (Math.imul(id, 2654435761) >>> 0) / 2 ** 32;

class SimProvider {
  constructor(cfg) {
    this.cfg = cfg;
    this.inicio = Date.now();
    // Sem resultado real do 2º turno (ou seja, antes dele acontecer), ensaia-se um 2º turno fictício
    // montado a partir do 1º: só os dois mais votados de cada disputa que não se decidiu.
    let origem = path.join(cfg.out, `turno${cfg.turno}`);
    this.final = loadJson(path.join(origem, 'resultado.json'));
    const ensaio = !this.final && cfg.turno === 2;
    if (ensaio) { origem = path.join(cfg.out, 'turno1'); this.final = loadJson(path.join(origem, 'resultado.json')); }
    if (!this.final) throw new Error(`a simulação precisa do resultado real em ${origem} (rode o updater normal uma vez)`);
    this.linhas = { pres: {}, gov: {}, sen: {} };
    for (const cargo of Object.keys(CARGOS)) {
      for (const uf of cargo === 'pres' ? ALL : UFS) {
        const f = loadJson(path.join(origem, 'municipios', CARGOS[cargo].nome, uf + '.json'));
        if (f && Array.isArray(f.municipios)) this.linhas[cargo][uf] = f.municipios.filter(m => m.secoes);
      }
    }
    if (!Object.keys(this.linhas.pres).length) throw new Error(`faltam os municípios de presidente em ${origem}`);
    this.ensaio = ensaio;
    if (ensaio) ({ final: this.final, linhas: this.linhas } = cenarioSegundoTurno(this.final, this.linhas));
    this.porId = {};
    for (const cargo of Object.keys(CARGOS)) {
      this.porId[cargo] = new Map();
      for (const [uf, lista] of Object.entries(this.linhas[cargo])) for (const m of lista) this.porId[cargo].set(uf + ':' + m.id, m);
    }
    this.avancar();
  }

  /** Atualiza o progresso global e recalcula os agregados (chamado a cada ciclo). */
  avancar() {
    this.p = clamp((Date.now() - this.inicio) / (this.cfg.simMinutos * 60000), 0, 1);
    const minuto = INICIO_MIN + Math.floor(this.p * DURACAO_MIN);
    const [y, m, d] = this.cfg.dia.split('-');
    this.data = `${d}/${m}/${y}`;
    this.hora = `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}:00`;
    this.agregados = { pres: { BR: vazio() }, gov: {}, sen: {} };
    for (const cargo of Object.keys(CARGOS)) {
      for (const [uf, lista] of Object.entries(this.linhas[cargo])) {
        const a = this.agregados[cargo][uf] = vazio();
        for (const m of lista) {
          const parcial = this.parcial(m);
          somar(a, parcial);
          if (cargo === 'pres') somar(this.agregados.pres.BR, parcial);
        }
      }
    }
  }

  fracao(id) { return clamp((this.p - sorteio(id) * 0.75) / 0.25, 0, 1); }

  parcial(m) {
    const q = this.fracao(m.id);
    const o = { secoes: m.secoes, totalizadas: Math.round(m.totalizadas * q), eleitorado: m.eleitorado, votos: {} };
    for (const k of CONTADORES) o[k] = Math.round(m[k] * q);
    for (const n in m.votos) o.votos[n] = Math.round(m.votos[n] * q);
    return o;
  }

  unidadeFinal(cargo, UF) {
    const c = this.final.cargos[CARGOS[cargo].nome];
    return c && (UF === 'BR' ? c.br : UF === 'ZZ' ? c.exterior : c.uf && c.uf[UF]);
  }

  async cm() {
    return { abr: Object.entries(this.linhas.pres).map(([uf, lista]) => ({
      cd: uf.toLowerCase(),
      mu: lista.map(m => ({ cd: String(m.id), cdi: uf === 'ZZ' ? '' : String(m.id), nm: m.nome.toUpperCase() })),
    })) };
  }

  async doc({ cargo, abr, mun }) {
    const UF = abr.toUpperCase();
    const base = this.unidadeFinal(cargo, UF);
    if (!base) return null;
    let numeros;
    if (mun) {
      const m = this.porId[cargo].get(UF + ':' + (mun.id ?? +mun.cd));
      if (!m) return null;
      numeros = this.parcial(m);
    } else {
      numeros = this.agregados[cargo][UF];
      if (!numeros) {   // sem municípios para este cargo/UF: escala a unidade inteira pelo progresso global
        numeros = vazio(); numeros.secoes = base.secoes; numeros.eleitorado = base.eleitorado;
        numeros.totalizadas = Math.round(base.totalizadas * this.p);
        for (const k of CONTADORES) numeros[k] = Math.round(base[k] * this.p);
        for (const c of base.candidatos) if (!c.anulado) numeros.votos[c.numero] = Math.round(c.votos * this.p);
      }
    }
    const concluido = !mun && numeros.totalizadas >= numeros.secoes;
    // Votos anulados (sub judice) só existem no total da UF: entram proporcionais ao comparecimento e
    // nunca além da folga entre o comparecimento e os demais votos. No município ficam zerados.
    const somaVotos = Object.values(numeros.votos).reduce((t, v) => t + v, 0);
    let folga = mun ? 0 : Math.max(0, numeros.comparecimento * (cargo === 'sen' ? 2 : 1) - somaVotos - numeros.brancos - numeros.nulos);
    const parte = base.comparecimento ? numeros.comparecimento / base.comparecimento : 0;
    const anulado = c => { const v = Math.min(folga, Math.round(c.votos * parte)); folga -= v; return v; };
    const par = base.candidatos.map(c => ({
      sg: c.partido,
      cand: [{
        n: c.numero, nm: c.nome, nmu: c.nome, sqcand: c.sq || '',
        vap: String(c.anulado ? anulado(c) : (numeros.votos[c.numero] || 0)),
        dvt: c.anulado ? 'Anulado sub judice' : 'Válido',
        st: !concluido ? 'Não eleito' : c.resultado === 'eleito' ? 'Eleito' : c.resultado === 'segundo-turno' ? '2º turno' : 'Não eleito',
      }],
    }));
    return {
      doc: {
        dt: this.data, ht: this.hora, dg: this.data, hg: this.hora,
        s: { ts: String(numeros.secoes), st: String(numeros.totalizadas) },
        e: { te: String(numeros.eleitorado), esa: String(numeros.apurado), c: String(numeros.comparecimento) },
        v: { tv: String(numeros.comparecimento), vb: String(numeros.brancos), tvn: String(numeros.nulos) },
        carg: [{ cd: CARGOS[cargo].cd, nv: String(base.vagas || 1), agr: [{ par }] }],
      },
      ack() {},
    };
  }
}

/** Mantém só os dois números de `dupla` num mapa de votos, repartindo os demais na proporção entre eles. */
function repartir(votos, dupla) {
  const [a, b] = dupla, va = votos[a] || 0, vb = votos[b] || 0;
  const outros = Object.entries(votos).reduce((t, [n, v]) => (n === a || n === b ? t : t + v), 0);
  const paraA = va + vb ? Math.round(outros * va / (va + vb)) : Math.round(outros / 2);
  return { [a]: va + paraA, [b]: vb + outros - paraA };
}

/**
 * 2º turno fictício a partir do resultado do 1º: presidente (se não houve eleito) e os governos que foram
 * ao 2º turno, cada um só com os dois mais votados; os votos dos demais candidatos são repartidos entre
 * eles. Não há Senado. Serve só para ensaiar a tela e o pipeline — não é previsão de resultado.
 */
function cenarioSegundoTurno(final1, linhas1) {
  const duplaDe = u => u.candidatos.filter(c => !c.anulado).slice(0, 2).map(c => c.numero);
  const converter = (u, dupla, vencedor) => {
    const votos = repartir(Object.fromEntries(u.candidatos.filter(c => !c.anulado).map(c => [c.numero, c.votos])), dupla);
    const candidatos = dupla.map(n => ({ ...u.candidatos.find(c => c.numero === n), votos: votos[n], resultado: n === vencedor ? 'eleito' : null }))
      .sort((a, b) => b.votos - a.votos);
    const { vagas, ...resto } = u;
    return { ...resto, situacao: 'eleito', candidatos };
  };
  const vencedorDe = (u, dupla) => { const v = repartir(Object.fromEntries(u.candidatos.filter(c => !c.anulado).map(c => [c.numero, c.votos])), dupla); return v[dupla[0]] >= v[dupla[1]] ? dupla[0] : dupla[1]; };
  const linhasDe = (lista, dupla) => lista.map(m => { const { anulados, ...resto } = m; return { ...resto, votos: repartir(m.votos, dupla) }; });

  const cargos = { presidente: { uf: {} }, governador: { uf: {} }, senador: { uf: {} } };
  const linhas = { pres: {}, gov: {}, sen: {} };
  const p = final1.cargos.presidente;
  if (p.br.situacao === 'segundo-turno') {
    const dupla = duplaDe(p.br), vencedor = vencedorDe(p.br, dupla);
    cargos.presidente.br = converter(p.br, dupla, vencedor);
    cargos.presidente.exterior = converter(p.exterior, dupla, vencedor);
    for (const uf of Object.keys(p.uf)) cargos.presidente.uf[uf] = converter(p.uf[uf], dupla, vencedor);
    for (const uf of Object.keys(linhas1.pres)) linhas.pres[uf] = linhasDe(linhas1.pres[uf], dupla);
  }
  for (const [uf, u] of Object.entries(final1.cargos.governador.uf)) {
    if (u.situacao !== 'segundo-turno') continue;
    const dupla = duplaDe(u);
    cargos.governador.uf[uf] = converter(u, dupla, vencedorDe(u, dupla));
    if (linhas1.gov[uf]) linhas.gov[uf] = linhasDe(linhas1.gov[uf], dupla);
  }
  if (!cargos.presidente.br) throw new Error('o 1º turno elegeu o presidente: não há 2º turno nacional para ensaiar');
  return { final: { ...final1, turno: 2, cargos }, linhas };
}

function somar(a, b) {
  a.secoes += b.secoes; a.totalizadas += b.totalizadas; a.eleitorado += b.eleitorado;
  for (const k of CONTADORES) a[k] += b[k];
  for (const n in b.votos) a.votos[n] = (a.votos[n] || 0) + b.votos[n];
}

module.exports = { SimProvider, sorteio, cenarioSegundoTurno, repartir };
