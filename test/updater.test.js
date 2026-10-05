'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { unidadeDe, minutoDe } = require('../src/updater/transform');
const { validarUnidade, validarMunicipio, validarResultado, validarHistorico } = require('../src/updater/validate');
const { aplicar, arquivoDe, titulo, carregarTabelas } = require('../src/updater/municipios');
const { makeConfig, ALL } = require('../src/updater/config');

const doc = (extra = {}) => ({
  dt: '04/10/2026', ht: '17:30:00',
  s: { ts: '100', st: '80' }, e: { te: '1000', esa: '800', c: '700' }, v: { tv: '700', vb: '10', tvn: '20' },
  carg: [{ cd: '1', nv: '1', agr: [{ par: [
    { sg: 'PT', cand: [{ n: '13', nm: 'FULANA DE TAL', nmu: 'FULANA', vap: '400', dvt: 'Válido', st: 'Não eleito' }] },
    { sg: 'PL', cand: [{ n: '22', nm: 'BELTRANO', vap: '250', dvt: 'Válido', st: 'Não eleito' }] },
    { sg: 'XX', cand: [{ n: '30', nm: 'SUB JUDICE', vap: '20', dvt: 'Anulado sub judice', st: 'Não eleito' }] },
  ] }] }],
  ...extra,
});

test('unidadeDe converte o documento do TSE', () => {
  const u = unidadeDe(doc(), 'pres');
  assert.deepStrictEqual(u.candidatos.map(c => [c.numero, c.nome, c.partido, c.votos, !!c.anulado]),
    [['13', 'FULANA', 'PT', 400, false], ['22', 'BELTRANO', 'PL', 250, false], ['30', 'SUB JUDICE', 'XX', 20, true]]);
  assert.strictEqual(u.totalizadas, 80);
  assert.strictEqual(u.nulos, 20);
  assert.strictEqual(u.situacao, 'apurando');
  assert.strictEqual(validarUnidade(u, 'x', 'pres'), null);
});

test('unidadeDe detecta 2º turno, eleito e vagas do senado', () => {
  const d = doc(); d.carg[0].agr[0].par[0].cand[0].st = '2º turno';
  assert.strictEqual(unidadeDe(d, 'pres').situacao, 'segundo-turno');
  d.carg[0].agr[0].par[0].cand[0].st = 'Eleito';
  assert.strictEqual(unidadeDe(d, 'pres').situacao, 'eleito');
  assert.strictEqual(unidadeDe(d, 'pres').candidatos[0].resultado, 'eleito');
  const sen = doc(); sen.carg[0].cd = '5'; sen.carg[0].nv = '2'; sen.carg[0].agr[0].par[0].cand[0].st = 'Eleito';
  const u = unidadeDe(sen, 'sen');
  assert.strictEqual(u.vagas, 2); assert.strictEqual(u.situacao, 'parcial');
  assert.strictEqual(unidadeDe({}, 'pres'), null);
});

test('validarUnidade rejeita dados inconsistentes', () => {
  const ok = unidadeDe(doc(), 'pres');
  assert.match(validarUnidade({ ...ok, totalizadas: 101 }, 'u'), /mais seções/);
  assert.match(validarUnidade({ ...ok, candidatos: [{ ...ok.candidatos[0], votos: 9999 }] }, 'u'), /somam mais/);
  assert.match(validarUnidade({ ...ok, brancos: -1 }, 'u'), /brancos/);
  assert.match(validarUnidade({ ...ok, situacao: 'xyz' }, 'u'), /situacao/);
  assert.match(validarUnidade({ ...ok, candidatos: [ok.candidatos[0], ok.candidatos[0]] }, 'u'), /repetido/);
  assert.match(validarUnidade(null, 'u'), /ausente/);
});

test('minutoDe: minutos desde 00:00 do dia da eleição', () => {
  const cfg = { dia: '2026-10-04' };
  assert.strictEqual(minutoDe({ dt: '04/10/2026', ht: '17:30:00' }, cfg), 17 * 60 + 30);
  assert.strictEqual(minutoDe({ dt: '05/10/2026', ht: '01:00:00' }, cfg), 1500);
  assert.strictEqual(minutoDe({ dt: '01/01/2020', ht: '01:00:00' }, cfg), null);
  assert.strictEqual(minutoDe({}, cfg), null);
});

test('makeConfig: caminhos padrão', () => {
  const c = makeConfig({});
  assert.strictEqual(path.relative(c.root, c.out), path.join('public', 'data'));
  assert.strictEqual(path.relative(c.root, c.cacheDir), '.cache');
  assert.strictEqual(makeConfig({ turno: '2' }).turno, 2);
  assert.strictEqual(makeConfig({ turno: '2' }).eleFed, '6258');
});

test('municípios: nomes, carga a partir da config do TSE e aplicação de unidades', () => {
  assert.strictEqual(titulo('SÃO JOÃO DEL REI'), 'São João del Rei');
  assert.strictEqual(titulo("SANTA BÁRBARA D'OESTE"), "Santa Bárbara D'Oeste");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa-mun-'));
  const cfg = { out: dir };
  const cm = { abr: [
    { cd: 'ac', mu: [{ cd: '01120', cdi: '1200013', nm: 'ACRELÂNDIA' }, { cd: '01570', cdi: '1200054', nm: 'ASSIS BRASIL' }] },
    { cd: 'zz', mu: [{ cd: '29173', cdi: '', nm: 'KATMANDU' }] },
  ] };
  const { tabelas, codigoTse } = carregarTabelas(cfg, cm);
  assert.deepStrictEqual([...tabelas.AC.keys()], [1200013, 1200054]);
  assert.strictEqual(codigoTse.get('AC:1200054'), '01570');
  assert.strictEqual(tabelas.ZZ.get(29173).nome, 'Katmandu');
  assert.strictEqual(tabelas.SP.size, 0);

  const u = unidadeDe(doc(), 'pres');
  assert.ok(aplicar(tabelas.AC, 1200013, u));
  assert.strictEqual(aplicar(tabelas.AC, 999, u), false);
  const linha = tabelas.AC.get(1200013);
  assert.deepStrictEqual(linha.votos, { 13: 400, 22: 250 });   // anulado fora
  assert.strictEqual(validarMunicipio(linha, 'AC'), null);
  assert.match(validarMunicipio({ ...linha, totalizadas: 999 }, 'AC'), /seções/);

  const arq = arquivoDe('AC', tabelas.AC, 123);
  assert.strictEqual(arq.versao, 2); assert.strictEqual(arq.municipios.length, 2);
  // o que já foi apurado é preservado numa nova carga
  fs.mkdirSync(path.join(dir, 'municipios'));
  fs.writeFileSync(path.join(dir, 'municipios', 'AC.json'), JSON.stringify(arq));
  assert.strictEqual(carregarTabelas(cfg, cm).tabelas.AC.get(1200013).votos[13], 400);
});

test('validarHistorico e validarResultado', () => {
  assert.strictEqual(validarHistorico({ versao: 2, pontos: [{ minuto: 1, totalizadas: 1, secoes: 2, votos: { 13: 1 } }] }), null);
  assert.strictEqual(validarHistorico({ versao: 2, pontos: [{ minuto: 1, totalizadas: 3, secoes: 2, votos: {} }] }), 'ponto');
  assert.strictEqual(validarResultado({ versao: 1 }, { turno: 1 }), 'cabeçalho');
  assert.strictEqual(validarResultado({ versao: 2, gerado: 1, minuto: 1, turno: 2, cargos: {} }, { turno: 1 }), 'turno');
});

test('feed atual em public/data passa na validação (se existir)', { skip: !fs.existsSync(path.join(__dirname, '..', 'public/data/resultado.json')) }, () => {
  const cfg = makeConfig({});
  const r = JSON.parse(fs.readFileSync(path.join(cfg.out, 'resultado.json'), 'utf8'));
  cfg.turno = r.turno;
  assert.strictEqual(validarResultado(r, cfg), null);
  for (const uf of ALL) assert.ok(fs.existsSync(path.join(cfg.out, 'municipios', uf + '.json')), uf);
  const geo = JSON.parse(fs.readFileSync(path.join(cfg.publicDir, 'data/geo/brasil.json'), 'utf8'));
  const ids = new Set(geo.municipios.map(m => m.id));
  const faltando = [];
  for (const uf of ALL.filter(u => u !== 'ZZ')) {
    for (const m of JSON.parse(fs.readFileSync(path.join(cfg.out, 'municipios', uf + '.json'), 'utf8')).municipios) if (!ids.has(m.id)) faltando.push(m.nome);
  }
  // municípios criados depois da malha do IBGE (ex.: Boa Esperança do Norte, MT) contam nos totais, mas não têm polígono
  assert.ok(faltando.length <= 3, `municípios do TSE sem polígono no IBGE: ${faltando.join(', ')}`);
  assert.strictEqual(ids.size, 5570);
});
