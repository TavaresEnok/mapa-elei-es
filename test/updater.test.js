'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { unidadeDe, minutoDe } = require('../src/updater/transform');
const { validarUnidade, validarMunicipio, validarResultado, validarHistorico } = require('../src/updater/validate');
const { aplicar, arquivoDe, titulo, carregarTabelas, caminho } = require('../src/updater/municipios');
const { retrato } = require('../src/updater/linha-do-tempo');
const { ehJpeg } = require('../src/updater/fotos');
const { SimProvider, sorteio, cenarioSegundoTurno, repartir } = require('../src/updater/providers/simulado');
const { makeConfig, turnoAutomatico, ALL, UFS } = require('../src/updater/config');

const doc = (extra = {}) => ({
  dt: '04/10/2026', ht: '17:30:00',
  s: { ts: '100', st: '80' }, e: { te: '1000', esa: '800', c: '700' }, v: { tv: '700', vb: '10', tvn: '20' },
  carg: [{ cd: '1', nv: '1', agr: [{ par: [
    { sg: 'PT', cand: [{ n: '13', sqcand: '280000000001', nm: 'FULANA DE TAL', nmu: 'FULANA', vap: '400', dvt: 'Válido', st: 'Não eleito' }] },
    { sg: 'PL', cand: [{ n: '22', nm: 'BELTRANO', vap: '250', dvt: 'Válido', st: 'Não eleito' }] },
    { sg: 'XX', cand: [{ n: '30', nm: 'SUB JUDICE', vap: '20', dvt: 'Anulado sub judice', st: 'Não eleito' }] },
  ] }] }],
  ...extra,
});

test('unidadeDe converte o documento do TSE', () => {
  const u = unidadeDe(doc(), 'pres');
  assert.deepStrictEqual(u.candidatos.map(c => [c.numero, c.nome, c.partido, c.votos, !!c.anulado]),
    [['13', 'FULANA', 'PT', 400, false], ['22', 'BELTRANO', 'PL', 250, false], ['30', 'SUB JUDICE', 'XX', 20, true]]);
  assert.strictEqual(u.candidatos[0].sq, '280000000001');
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

test('makeConfig: pastas por turno, turno automático pela data e simulação isolada', () => {
  const antes = new Date('2026-10-10T12:00:00-03:00'), depois = new Date('2026-10-25T08:00:00-03:00');
  assert.strictEqual(turnoAutomatico(antes), 1);
  assert.strictEqual(turnoAutomatico(depois), 2);
  assert.strictEqual(turnoAutomatico(new Date('2026-10-24T23:30:00-03:00')), 1, 'usa o fuso de Brasília');
  const c = makeConfig({}, antes);
  assert.strictEqual(path.relative(c.root, c.dirDados), path.join('public', 'data', 'turno1'));
  assert.strictEqual(path.relative(c.root, c.cacheDir), '.cache');
  assert.strictEqual(c.turnoAuto, true);
  const c2 = makeConfig({}, depois);
  assert.strictEqual(c2.turno, 2); assert.strictEqual(c2.eleFed, '6258'); assert.strictEqual(c2.dia, '2026-10-25');
  assert.ok(c2.dirDados.endsWith(path.join('data', 'turno2')));
  assert.strictEqual(makeConfig({ turno: '1' }, depois).turno, 1);
  assert.strictEqual(makeConfig({ turno: '1' }, depois).turnoAuto, false);
  assert.ok(makeConfig({ simular: true }, antes).dirDados.endsWith(path.join('data', 'simulacao')));
});

test('municípios: nomes, carga a partir da config do TSE e aplicação de unidades', () => {
  assert.strictEqual(titulo('SÃO JOÃO DEL REI'), 'São João del Rei');
  assert.strictEqual(titulo("SANTA BÁRBARA D'OESTE"), "Santa Bárbara D'Oeste");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa-mun-'));
  const cfg = { dirDados: dir };
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
  assert.deepStrictEqual(linha.votos, { 13: 400, 22: 250 });
  assert.strictEqual(linha.anulados, 20, 'sub judice entra só como total');
  assert.strictEqual(validarMunicipio(linha, 'AC'), null);
  assert.match(validarMunicipio({ ...linha, totalizadas: 999 }, 'AC'), /seções/);

  const arq = arquivoDe('pres', 'AC', tabelas.AC, 123);
  assert.strictEqual(arq.cargo, 'presidente'); assert.strictEqual(arq.municipios.length, 2);
  assert.strictEqual(caminho('gov', 'SP'), path.join('municipios', 'governador', 'SP.json'));
  // o que já foi apurado é preservado numa nova carga
  fs.mkdirSync(path.join(dir, 'municipios', 'presidente'), { recursive: true });
  fs.writeFileSync(path.join(dir, caminho('pres', 'AC')), JSON.stringify(arq));
  assert.strictEqual(carregarTabelas(cfg, cm).tabelas.AC.get(1200013).votos[13], 400);
  // governador e senador não têm exterior
  assert.strictEqual(carregarTabelas(cfg, cm, 'gov').tabelas.ZZ, undefined);

  // retrato da linha do tempo: líder, margem e andamento em milésimos, na ordem dos ids
  const todas = Object.fromEntries(UFS.map(uf => [uf, tabelas[uf] || new Map()]));
  const r = retrato(1050, { BR: u, AC: u }, todas, [1200013, 1200054]);
  assert.deepStrictEqual(r.lider, [13, 0]);
  assert.deepStrictEqual(r.margem, [Math.round(150 / 650 * 1000), 0]);
  assert.deepStrictEqual(r.apurado, [800, 0]);
  assert.deepStrictEqual(r.br.votos, { 13: 400, 22: 250 });
});

test('validarHistorico e validarResultado', () => {
  assert.strictEqual(validarHistorico({ versao: 2, pontos: [{ minuto: 1, totalizadas: 1, secoes: 2, votos: { 13: 1 } }] }), null);
  assert.strictEqual(validarHistorico({ versao: 2, pontos: [{ minuto: 1, totalizadas: 3, secoes: 2, votos: {} }] }), 'ponto');
  assert.strictEqual(validarResultado({ versao: 1 }, { turno: 1 }), 'cabeçalho');
  assert.strictEqual(validarResultado({ versao: 3, gerado: 1, minuto: 1, turno: 2, cargos: {} }, { turno: 1 }), 'turno');
  assert.strictEqual(ehJpeg(Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(300)])), true);
  assert.strictEqual(ehJpeg(Buffer.from('<html>erro</html>'.repeat(20))), false);
});

const DADOS = path.join(__dirname, '..', 'public', 'data');
const temTurno1 = fs.existsSync(path.join(DADOS, 'turno1', 'resultado.json'));

test('feed atual do 1º turno passa na validação e casa com a malha do IBGE (se existir)', { skip: !temTurno1 }, () => {
  const cfg = makeConfig({ turno: '1' });
  const r = JSON.parse(fs.readFileSync(path.join(cfg.dirDados, 'resultado.json'), 'utf8'));
  assert.strictEqual(validarResultado(r, cfg), null);
  for (const uf of ALL) assert.ok(fs.existsSync(path.join(cfg.dirDados, caminho('pres', uf))), uf);
  const geo = JSON.parse(fs.readFileSync(path.join(cfg.publicDir, 'data/geo/brasil.json'), 'utf8'));
  const ids = new Set(geo.municipios.map(m => m.id));
  const faltando = [];
  for (const uf of UFS) {
    for (const m of JSON.parse(fs.readFileSync(path.join(cfg.dirDados, caminho('pres', uf)), 'utf8')).municipios) if (!ids.has(m.id)) faltando.push(m.nome);
  }
  // municípios criados depois da malha do IBGE (ex.: Boa Esperança do Norte, MT) contam nos totais, mas não têm polígono
  assert.ok(faltando.length <= 3, `municípios do TSE sem polígono no IBGE: ${faltando.join(', ')}`);
  assert.strictEqual(ids.size, 5570);
  assert.ok(Object.values(geo.ufs).every(u => Array.isArray(u.centro)), 'todo estado tem centroide');
});

test('simulação: começa vazia, termina igual ao resultado real e nunca passa do total', { skip: !temTurno1 }, async () => {
  const cfg = makeConfig({ turno: '1', simular: true, 'sim-minutos': '1' });
  const sim = new SimProvider(cfg);
  const real = JSON.parse(fs.readFileSync(path.join(DADOS, 'turno1', 'resultado.json'), 'utf8'));
  const total = async cargo => unidadeDe((await sim.doc({ cargo, abr: cargo === 'pres' ? 'br' : 'sp' })).doc, cargo);

  sim.inicio = Date.now(); sim.avancar();
  assert.strictEqual((await total('pres')).totalizadas, 0);

  sim.inicio = Date.now() - 30000; sim.avancar();              // metade do caminho
  const meio = await total('pres');
  assert.ok(meio.totalizadas > 0 && meio.totalizadas < real.cargos.presidente.br.secoes);
  assert.strictEqual(validarUnidade(meio, 'sim', 'pres'), null);
  assert.strictEqual(meio.situacao, 'apurando');
  for (const cargo of ['gov', 'sen']) assert.strictEqual(validarUnidade(await total(cargo), 'sim ' + cargo, cargo, cargo === 'sen' ? 2 : 1), null);

  sim.inicio = Date.now() - 120000; sim.avancar();             // fim
  const fim = await total('pres');
  const votos = u => u.candidatos.map(c => [c.numero, c.votos, c.resultado]);
  assert.deepStrictEqual(votos(fim), votos(real.cargos.presidente.br));
  assert.deepStrictEqual(votos(await total('gov')), votos(real.cargos.governador.uf.SP));
  assert.ok(sorteio(3550308) >= 0 && sorteio(3550308) < 1);
});

test('ciclo completo com o provider simulado grava um feed válido (integração)', { skip: !temTurno1, timeout: 60000 }, async () => {
  const { runCycle } = require('../src/updater/cycle');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa-ciclo-'));
  const cfg = { ...makeConfig({ turno: '1', simular: true, 'sim-minutos': '1', 'no-fotos': true }), dirDados: path.join(out, 'simulacao'), cacheDir: out };
  const provider = new SimProvider(cfg);
  provider.inicio = Date.now() - 30000;   // meio da apuração
  const ctx = { cfg, provider, state: {}, written: 0, first: true };
  const silencio = console.log; console.log = () => {};
  try { await runCycle(ctx); } finally { console.log = silencio; }
  const ler = rel => JSON.parse(fs.readFileSync(path.join(cfg.dirDados, rel), 'utf8'));
  const r = ler('resultado.json');
  assert.strictEqual(validarResultado(r, cfg), null);
  assert.strictEqual(r.simulacao, true);
  const hist = ler('historico.json');
  assert.ok(Object.keys(hist.pontos[0].lideres).length > 20, 'histórico guarda o líder de cada UF');
  assert.strictEqual(ler('linha-do-tempo/indice.json').minutos.length, 1);
  for (const cargo of ['presidente', 'governador', 'senador']) assert.ok(ler(`municipios/${cargo}/SP.json`).municipios.length > 600, cargo);
  assert.ok(!fs.existsSync(path.join(DADOS, '..', '..', 'indice-nao-deve-existir')), 'simulação não mexe no índice real');
});

test('ensaio do 2º turno: só dois candidatos, votos conservados, sem Senado', { skip: !temTurno1 }, () => {
  assert.deepStrictEqual(repartir({ 13: 40, 22: 60, 70: 10 }, ['22', '13']), { 22: 66, 13: 44 });
  assert.deepStrictEqual(repartir({ 70: 9 }, ['22', '13']), { 22: 5, 13: 4 }, 'sem votos nos dois, divide ao meio');
  const real = JSON.parse(fs.readFileSync(path.join(DADOS, 'turno1', 'resultado.json'), 'utf8'));
  const { final } = cenarioSegundoTurno(real, { pres: {}, gov: {}, sen: {} });
  const br = final.cargos.presidente.br;
  assert.strictEqual(br.candidatos.length, 2);
  const soma = u => u.candidatos.filter(c => !c.anulado).reduce((t, c) => t + c.votos, 0);
  assert.strictEqual(soma(br), soma(real.cargos.presidente.br), 'nenhum voto some nem aparece');
  assert.strictEqual(br.candidatos.filter(c => c.resultado === 'eleito').length, 1);
  assert.deepStrictEqual(Object.keys(final.cargos.senador.uf), []);
  const emDisputa = Object.keys(real.cargos.governador.uf).filter(uf => real.cargos.governador.uf[uf].situacao === 'segundo-turno');
  assert.deepStrictEqual(Object.keys(final.cargos.governador.uf).sort(), emDisputa.sort());
  assert.strictEqual(validarResultado({ ...final, versao: 3, gerado: 1, minuto: 1 }, { turno: 2 }), null);
});
