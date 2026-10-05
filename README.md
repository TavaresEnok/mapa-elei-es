# Mapa da Apuração 2026

Painel web de apuração ao vivo das eleições gerais de 2026: presidente, governador e senador, estado por estado e município por município (5.570 cidades, mapa em SVG).

- Mapa por estados ou municípios, para os três cargos, com zoom, arraste e ficha de cada local
- Fotos oficiais dos candidatos, disputa frente a frente, tabelas por estado e por município
- Linha do tempo: volte a qualquer minuto da apuração e veja o mapa daquele momento
- Busca de cidade ou estado (`Ctrl+K`), modo claro/escuro, funciona no celular
- 1º e 2º turnos lado a lado (cada um na sua pasta de dados)

Todo o código, o visual e o formato dos dados são deste repositório. As únicas fontes externas são **dados públicos oficiais**:

| Dado | Fonte |
|---|---|
| Resultados, candidatos, partidos, fotos | API aberta do TSE (`resultados.tse.jus.br`), sem chave nem cadastro |
| Malhas dos municípios e estados | API de Malhas do IBGE (`servicodados.ibge.gov.br`) |

O navegador só fala com o próprio servidor (a política de segurança de conteúdo bloqueia qualquer outra origem); não há bibliotecas, fontes ou scripts de terceiros.

## Como funciona

```
TSE ──► src/updater ──► public/data/turno<N>/*.json ──► src/server.js ──► navegador
        (a cada 45 s)   (escrita atômica)               (estático, gzip)   (consulta resultado.json a cada 30 s)

IBGE ──► scripts/build-geo.js ──► public/data/geo/*.json   (gerado uma vez, versionado)
```

- **Updater** (`src/updater/`): busca os documentos do TSE, converte para o nosso formato, valida e só então grava. Unidade inválida mantém o valor anterior. Cada ciclo tem duas fases: primeiro Brasil/UFs e os municípios de presidente (e `resultado.json` por último, para a tela nunca ver dados pela metade); depois os municípios de governador e senador. O turno é escolhido pela data (2º turno a partir de 25/10/2026), sem reiniciar o processo.
- **Servidor** (`src/server.js`): serve só `public/`, somente leitura (GET/HEAD), com gzip em cache, ETag, CSP restritiva e bloqueio de path traversal e dotfiles. `GET /saude` devolve a situação do feed.
- **Front** (`public/`): HTML, CSS e módulos ES escritos à mão, sem etapa de build.

## Executar

Requer Node 20+. Não há dependências de runtime (o `jsdom` é só para os testes).

```bash
npm start            # servidor em http://127.0.0.1:3100
npm run updater      # coleta ao vivo em loop (Ctrl+C encerra)
npm test             # testes (node:test + jsdom)
```

Em produção, com PM2: `npm run pm2` (`ecosystem.config.js`: `mapa-web` + `mapa-tse`).

Servidor: `PORT` (3100), `HOST` (`127.0.0.1`; `0.0.0.0` para expor na rede), `PUBLIC_DIR`, `LOG=1`.

Updater (`node src/updater/index.js --help` lista tudo): `--once`, `--turno 1|2`, `--dry-run`, `--interval S`, `--no-munis`, `--no-fotos`.

### Simular uma apuração

Para testar ou demonstrar antes do dia da eleição, o simulador reencena a apuração a partir do resultado real já baixado, passando pelo mesmo pipeline do updater:

```bash
npm run simular                      # ~4 minutos; use -- --sim-minutos 1 para acelerar
```

Abra `http://127.0.0.1:3100/?fonte=simulacao`. Os dados simulados ficam em `public/data/simulacao/`, nunca se misturam com os reais, e a tela mostra uma faixa de aviso.

### Geometria

`public/data/geo/` já vem no repositório. Para regerar a partir do IBGE: `npm run geo`.

## Estrutura

```
public/
  index.html, css/app.css, img/favicon.svg
  js/            main (orquestra) · mapa (SVG, zoom) · painel · grafico · busca · dados · cores · fmt · api · ufs
  data/
    geo/           malhas do IBGE (versionado)
    indice.json · fotos/ · turno1/ · turno2/ · simulacao/     (gerados; ignorados pelo git)
src/
  server.js
  updater/       index · config · http · transform · validate · municipios · fotos · linha-do-tempo · cycle · state
                 providers/tse (real) · providers/simulado
scripts/build-geo.js
test/            servidor, updater e front de ponta a ponta (jsdom)
```

## Formato dos dados

Dentro de `public/data/turno<N>/`:

- `resultado.json` — `{ versao: 3, gerado, turno, minuto, atualizadoTse, cargos: { presidente: { br, exterior, uf }, governador: { uf }, senador: { uf } } }`. Cada unidade traz `secoes`, `totalizadas`, `eleitorado`, `apurado`, `comparecimento`, `brancos`, `nulos`, `situacao` e `candidatos` (número, nome, partido, votos, resultado, `sq`/`foto`), já ordenados por votos.
- `municipios/<cargo>/<UF>.json` — uma linha por município com contadores e `votos` por número de candidato (`ZZ` = países do exterior, só para presidente).
- `historico.json` — série por minuto do total nacional.
- `linha-do-tempo/<minuto>.json` — retrato compacto do mapa naquele minuto (líder, vantagem e andamento por município); `indice.json` lista os minutos e a ordem dos municípios.

Fora das pastas de turno: `indice.json` (turnos disponíveis) e `fotos/<sq>.jpeg`.

## Limitações conhecidas

- A linha do tempo só existe para o que o updater presenciou: como ele começou a rodar depois do fim da apuração do 1º turno, esse turno tem um único retrato. No 2º turno ela é gravada minuto a minuto.
- Municípios criados depois da malha do IBGE (hoje, Boa Esperança do Norte/MT) entram nos totais e nas tabelas, mas ainda não têm polígono no mapa.
- Os números são parciais até 100% das seções; o resultado oficial é o do TSE.
