'use strict';
/** Front de ponta a ponta com os dados reais do 1º turno (ignorado se o updater ainda não gerou public/data/turno1). */
const test = require('node:test');
const assert = require('node:assert');
const { montarApp, existe } = require('./apoio/dom');

test('front: mapa, painel, cargos e seleção', { skip: !existe('data/turno1/resultado.json'), timeout: 90000 }, async t => {
  const { $, $$, espera, ate, evento, erros, pedidos } = await montarApp(t, 'http://localhost/?fonte=turno1');
  const pintados = sel => $$(sel).filter(e => e.style.fill).length;

  await t.test('desenha 5.570 municípios, 27 estados pintados e os rótulos', () => {
    assert.strictEqual($$('#svg-mapa .m').length, 5570);
    assert.strictEqual($$('#svg-mapa .u').length, 27);
    assert.strictEqual(pintados('#svg-mapa .u'), 27, 'estados pintados via estilo (CSS venceria o atributo fill)');
    assert.strictEqual($$('#svg-mapa .rotulo').length, 27);
    assert.match($('#svg-mapa').getAttribute('viewBox'), /^[\d. -]+$/);
  });

  await t.test('painel do Brasil: disputa, candidatos com foto e tabela de estados', () => {
    assert.ok($('#painel h2').textContent.startsWith('Brasil'));
    assert.ok($('#painel .disputa'), 'barra de disputa');
    assert.ok($('#painel .candidato .nome'));
    assert.match($('#painel .avatar img').getAttribute('src'), /^data\/fotos\/\d+\.jpeg$/);
    assert.strictEqual($$('#painel tr[data-chave]').length, 27);
    assert.match($('#progresso-valor').textContent, /%/);
    assert.match($('#texto-status').textContent, /TSE/);
    assert.strictEqual($('#faixa-simulacao').hidden, true, 'dados reais não mostram a faixa de simulação');
    assert.ok(!pedidos.some(p => p.includes('/municipios/')), 'municípios só são baixados quando necessários');
  });

  await t.test('selecionar um estado abre a ficha e a tabela de municípios', async () => {
    evento($('#painel tr[data-chave="SP"]'), 'click');
    await ate(() => $$('#painel tr[data-chave]').length > 600, 'municípios de SP');
    assert.match($('#painel h2').textContent, /São Paulo/);
    assert.strictEqual($('#voltar').hidden, false);
    assert.strictEqual($$('#svg-mapa .u.fora').length, 26);
  });

  await t.test('município mostra ficha própria', async () => {
    evento($('#painel tr[data-chave]'), 'click');
    await espera(80);
    assert.match($('#mapa-titulo').textContent, /· SP$/);
    assert.ok($('#painel .candidato'));
  });

  await t.test('nível municípios pinta o país; governador e senador também têm municípios', async () => {
    $('[data-nivel="municipios"]').click();
    await ate(() => pintados('#svg-mapa .m') > 5500, 'municípios de presidente pintados');
    $('[data-cargo="governador"]').click();
    assert.strictEqual($('[data-nivel="municipios"]').disabled, false);
    await ate(() => pedidos.some(p => p.includes('municipios/governador/SP.json')) && pintados('#svg-mapa .m') > 5500, 'municípios de governador');
    await ate(() => $('#painel .candidato'), 'ficha do município para governador');
    $('#voltar').click(); await espera(50);
    assert.strictEqual($('#painel h2').textContent, 'Governadores');
    $('[data-cargo="senador"]').click(); await espera(50);
    assert.strictEqual($('#painel h2').textContent, 'Senadores');
    evento($('#painel tr[data-chave="SP"]'), 'click'); await espera(50);
    assert.match($('#painel').textContent, /vagas/);
    assert.strictEqual($('#painel .disputa'), null, 'com duas vagas não há duelo');
  });

  await t.test('busca encontra município sem acento', async () => {
    $('[data-cargo="presidente"]').click(); await espera(30);
    $('#abrir-busca').click();
    $('#busca-campo').value = 'sao paulo';
    evento($('#busca-campo'), 'input');
    const itens = $$('#busca-lista li').map(li => li.textContent);
    assert.ok(itens[0].startsWith('São Paulo'), itens.join('|'));
    assert.ok(itens.some(x => x === 'São PauloSP'), 'a capital aparece: ' + itens.join('|'));
    $('#busca-campo').value = 'campinas';
    evento($('#busca-campo'), 'input');
    assert.strictEqual($('#busca-lista li').textContent, 'CampinasSP', 'nome exato vem primeiro');
  });

  await t.test('sem erros de execução e sem recursos externos', () => {
    assert.deepStrictEqual(erros, []);
    const externos = $$('[src],[href]').map(e => e.getAttribute('src') || e.getAttribute('href'))
      .filter(u => /^(https?:)?\/\//.test(u) && !/ibge\.gov\.br|resultados\.tse\.jus\.br/.test(u));
    assert.deepStrictEqual(externos, []);
  });
});
