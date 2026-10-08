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
    assert.match($('#placar .manchete').textContent, /2º turno|lidera|vence|eleito/);
    assert.ok($('#placar .disputa-barra'), 'placar com a barra de disputa');
    assert.match($('#placar .veredito').textContent, /2º turno|Ainda pode virar|Não vira mais|concluída/);
    assert.ok($('#painel').textContent.includes('Por região'));
    assert.strictEqual(document.documentElement.dataset.tema, 'escuro', 'escuro por padrão');
    $('#alternar-tema').click();
    assert.strictEqual(document.documentElement.dataset.tema, 'claro');
    $('#alternar-tema').click();
    assert.ok($('#ficha .candidato .nome'));
    assert.match($('#ficha .avatar img').getAttribute('src'), /^data\/fotos\/\d+\.jpeg$/);
    assert.strictEqual($$('#painel tr[data-chave]').length, 27);
    assert.match($('#progresso-barra').getAttribute('aria-valuetext'), /% das seções/);
    assert.match($('#texto-status').textContent, /Apuração concluída|Ao vivo/);
    assert.strictEqual($('#faixa-simulacao').hidden, true, 'dados reais não mostram a faixa de simulação');
    assert.ok(!pedidos.some(p => p.includes('/municipios/')), 'municípios só são baixados quando necessários');
  });

  await t.test('selecionar um estado abre a ficha e a tabela de municípios', async () => {
    evento($('#painel tr[data-chave="SP"]'), 'click');
    await ate(() => $$('#painel tr[data-chave]').length > 600, 'municípios de SP');
    assert.match($('#placar .placar-local').textContent, /em São Paulo/);
    assert.strictEqual($('#voltar').hidden, false);
    assert.strictEqual($$('#svg-mapa .u.fora').length, 26);
  });

  await t.test('município mostra ficha própria', async () => {
    evento($('#painel tr[data-chave]'), 'click');
    await espera(80);
    assert.match($('#mapa-titulo').textContent, /, SP$/);
    assert.ok($('#ficha .candidato'));
  });

  await t.test('nível municípios pinta o país; governador e senador também têm municípios', async () => {
    $('[data-nivel="municipios"]').click();
    await ate(() => pintados('#svg-mapa .m') > 5500, 'municípios de presidente pintados');
    $('[data-cargo="governador"]').click();
    assert.strictEqual($('[data-nivel="municipios"]').disabled, false);
    await ate(() => pedidos.some(p => p.includes('municipios/governador/SP.json')) && pintados('#svg-mapa .m') > 5500, 'municípios de governador');
    await ate(() => $('#ficha .candidato'), 'ficha do município para governador');
    $('#voltar').click(); await espera(50);
    assert.match($('#placar .manchete').textContent, /governos estaduais já têm resultado/);
    assert.ok($('#ficha .bancada li'), 'eleitos por partido');
    $('[data-cargo="senador"]').click(); await espera(50);
    assert.match($('#placar .manchete').textContent, /disputas pelo Senado/);
    evento($('#painel tr[data-chave="SP"]'), 'click'); await espera(50);
    assert.match($('#ficha').textContent, /vagas/);
    assert.match($('#placar .manchete').textContent, /Senado por São Paulo|Senado em São Paulo/);
    assert.match($('#placar .veredito').textContent, /Última vaga/);
    // percentuais na mesma base do TSE (inclui sub judice): RJ, governador, líder com 49,27%
    $('[data-cargo="governador"]').click(); $('#voltar').click(); await espera(30);
    evento($('#painel tr[data-chave="RJ"]'), 'click'); await espera(60);
    assert.strictEqual($('#ficha .candidato .valor strong').textContent, '49,27%');
    assert.match($('#placar .manchete').textContent, /vão ao 2º turno/);
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
