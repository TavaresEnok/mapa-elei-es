'use strict';
/** Tabelas de municípios por cargo e UF: carga do disco, atualização incremental e gravação. */
const path = require('path');
const { UFS, ALL, EXTERIOR, CARGOS } = require('./config');
const { loadJson } = require('./util');

const zerada = (id, nome) => ({ id, nome, secoes: 0, totalizadas: 0, eleitorado: 0, apurado: 0, comparecimento: 0, brancos: 0, nulos: 0, votos: {} });

/** UFs que têm resultado por município para o cargo (o exterior só vota para presidente). */
const ufsDoCargo = cargo => (cargo === 'pres' ? ALL : UFS);
const caminho = (cargo, uf) => path.join('municipios', CARGOS[cargo].nome, uf + '.json');

/**
 * Monta a tabela de cada UF a partir da config de municípios do TSE (nome, código TSE, código IBGE),
 * preservando o que já foi apurado em rodadas anteriores. No exterior, o "município" é o país (id = código TSE).
 */
function carregarTabelas(cfg, cm, cargo = 'pres') {
  const tabelas = {}, codigoTse = new Map();
  for (const uf of ufsDoCargo(cargo)) {
    const abr = cm.abr.find(a => a.cd === uf.toLowerCase());
    const anterior = loadJson(path.join(cfg.dirDados, caminho(cargo, uf)));
    const antes = new Map(((anterior && anterior.municipios) || []).map(m => [m.id, m]));
    const linhas = new Map();
    for (const m of (abr ? abr.mu : [])) {
      const id = +(uf === EXTERIOR ? m.cd : m.cdi);
      if (!id) continue;
      const nome = titulo(m.nm);
      linhas.set(id, antes.has(id) ? { ...antes.get(id), nome } : zerada(id, nome));
      codigoTse.set(uf + ':' + id, m.cd);
    }
    tabelas[uf] = linhas;
  }
  return { tabelas, codigoTse };
}

/** "SÃO JOÃO DEL REI" → "São João del Rei" */
function titulo(s) {
  const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'del']);
  return String(s || '').toLowerCase().split(' ')
    .map((p, i) => (i > 0 && minusculas.has(p)) ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    .replace(/(^|[-'])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
}

/** Unidade (com candidatos) → linha do município. Votos anulados não entram. */
function aplicar(tabela, id, u) {
  const atual = tabela.get(id);
  if (!atual) return false;
  const votos = {};
  for (const c of u.candidatos) if (!c.anulado) votos[c.numero] = c.votos;
  tabela.set(id, { ...atual, secoes: u.secoes, totalizadas: u.totalizadas, eleitorado: u.eleitorado, apurado: u.apurado,
    comparecimento: u.comparecimento, brancos: u.brancos, nulos: u.nulos, votos });
  return true;
}

function arquivoDe(cargo, uf, tabela, gerado) {
  return { versao: 3, cargo: CARGOS[cargo].nome, uf, gerado, municipios: [...tabela.values()].sort((a, b) => a.id - b.id) };
}

module.exports = { carregarTabelas, aplicar, arquivoDe, titulo, ufsDoCargo, caminho };
