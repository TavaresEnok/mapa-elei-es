'use strict';
/** Linha do tempo no front, usando os dados da simulação (ignorado se `npm run simular` nunca foi executado). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { montarApp, existe } = require('./apoio/dom');

const temSimulacao = existe('data/simulacao/linha-do-tempo/indice.json')
  && JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public/data/simulacao/linha-do-tempo/indice.json'), 'utf8')).minutos.length >= 3;

test('front: reprise da apuração (simulação)', { skip: !temSimulacao, timeout: 90000 }, async t => {
  const { $, $$, ate, evento, erros } = await montarApp(t, 'http://localhost/?fonte=simulacao#/presidente/municipios');
  const pintados = () => $$('#svg-mapa .m').filter(e => e.style.fill).length;

  await t.test('simulação é sinalizada e a linha do tempo aparece', async () => {
    assert.strictEqual($('#faixa-simulacao').hidden, false);
    assert.strictEqual($('#tempo').hidden, false);
    assert.ok(+$('#tempo-cursor').max >= 2);
    await ate(() => pintados() > 5000, 'municípios do estado atual');
  });

  await t.test('voltar no tempo repinta o mapa e o painel com o retrato daquele minuto', async () => {
    const final = pintados(), votosFinais = $('#ficha .candidato .valor span').textContent;
    $('#tempo-cursor').value = '1';
    evento($('#tempo-cursor'), 'input');
    await ate(() => /Reprise/.test($('#texto-status').textContent), 'modo reprise');
    assert.ok(pintados() < final, `menos municípios pintados no começo (${pintados()} < ${final})`);
    assert.notStrictEqual($('#ficha .candidato .valor span').textContent, votosFinais);
    assert.match($('#placar .placar-local').textContent, /às \d\d:\d\d/);
    assert.strictEqual($('#tempo-vivo').hidden, false);
  });

  await t.test('"voltar ao atual" sai da reprise', async () => {
    $('#tempo-vivo').click();
    await ate(() => !/Reprise/.test($('#texto-status').textContent), 'fim da reprise');
    assert.strictEqual($('#tempo-vivo').hidden, true);
    assert.deepStrictEqual(erros, []);
  });
});
