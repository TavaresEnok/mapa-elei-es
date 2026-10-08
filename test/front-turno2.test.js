'use strict';
/**
 * 2º turno no front. Monta uma pasta public temporária com o 1º turno real e um 2º turno de ensaio
 * (gerado pelo próprio updater), e confere a troca de turno e o que muda na tela.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { montarApp, existe, PUBLIC } = require('./apoio/dom');
const { makeConfig } = require('../src/updater/config');
const { SimProvider } = require('../src/updater/providers/simulado');
const { runCycle } = require('../src/updater/cycle');

test('front: 2º turno ao lado do 1º', { skip: !existe('data/turno1/municipios/governador/RJ.json'), timeout: 120000 }, async t => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'mapa-t2-'));
  fs.mkdirSync(path.join(raiz, 'data'));
  for (const d of ['geo', 'fotos', 'turno1']) fs.symlinkSync(path.join(PUBLIC, 'data', d), path.join(raiz, 'data', d));
  // 2º turno de ensaio, já encerrado, gravado como se fosse o turno2 real desta pasta temporária
  const cfg = { ...makeConfig({ turno: '2', simular: true, 'no-fotos': true }), cacheDir: raiz, dirDados: path.join(raiz, 'data', 'turno2') };
  const provider = new SimProvider(cfg);
  provider.inicio = 0;
  const log = console.log; console.log = () => {};
  try { await runCycle({ cfg, provider, state: {}, written: 0, first: true }); } finally { console.log = log; }
  fs.writeFileSync(path.join(raiz, 'data', 'indice.json'), JSON.stringify({ versao: 3, turnos: [1, 2], atual: 2 }));

  const { $, $$, ate, evento, erros, window } = await montarApp(t, 'http://localhost/', raiz);

  await t.test('abre no turno mais recente, com seletor de turno e sem a aba do Senado', () => {
    assert.match($('#turno-rotulo').textContent, /2º turno/);
    assert.strictEqual($('#turno-escolha').hidden, false);
    assert.deepStrictEqual($$('#turno-select option').map(o => o.value), ['turno1', 'turno2']);
    assert.strictEqual($('[data-cargo="senador"]').hidden, true);
    assert.match($('#placar .manchete').textContent, /é eleito presidente da República/);
    assert.match($('#placar .veredito').textContent, /venceu o 2º turno/);
    assert.strictEqual($$('#ficha > .lista-cand > .candidato').length, 2, 'só dois candidatos');
  });

  await t.test('governadores: 7 em disputa; os demais mostram o eleito do 1º turno', async () => {
    $('[data-cargo="governador"]').click();
    await ate(() => /governos em disputa no 2º turno/.test($('#placar .manchete').textContent), 'manchete dos governos');
    assert.match($('#placar .manchete').textContent, /^7 de 7 /);
    assert.match($('#painel tr[data-chave="SP"]').textContent, /Tarcísio.*1º turno/);
    assert.match($('#painel tr[data-chave="RJ"]').textContent, /100%/);
    assert.strictEqual($$('#svg-mapa .u').filter(e => e.style.fill).length, 27, 'decididos no 1º turno também recebem cor (apagada)');
    evento($('#painel tr[data-chave="SP"]'), 'click');
    await ate(() => /decidiu no 1º turno/.test($('#placar .manchete').textContent), 'estado sem disputa');
    assert.match($('#ficha').textContent, /Resultado do 1º turno/);
    evento($('#voltar'), 'click');
  });

  await t.test('trocar para o 1º turno traz o Senado de volta', async () => {
    $('#turno-select').value = 'turno1';
    evento($('#turno-select'), 'change');
    await ate(() => /1º turno/.test($('#turno-rotulo').textContent), 'rótulo do 1º turno');
    assert.strictEqual($('[data-cargo="senador"]').hidden, false);
    await ate(() => $$('#painel tr[data-chave]').length === 27, 'tabela de estados');
    assert.deepStrictEqual(erros, []);
    window.close();
  });
});
