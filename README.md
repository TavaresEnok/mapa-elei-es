# Mapa da Apuração 2026

Painel web de apuração ao vivo: presidente, governador e senador, estado por estado, e o presidente também município por município (5.570 cidades, mapa em SVG). Tem busca (`Ctrl+K`), zoom e arraste, ficha de cada local, tabelas por estado/município e gráfico da evolução da apuração.

Todo o código, o visual e os dados são deste repositório. As únicas fontes externas são **dados públicos oficiais**:

| Dado | Fonte |
|---|---|
| Resultados, candidatos, partidos | API aberta do TSE (`resultados.tse.jus.br`), sem chave nem cadastro |
| Malhas dos municípios e estados | API de Malhas do IBGE (`servicodados.ibge.gov.br`) |

O navegador só fala com o próprio servidor (a política de segurança de conteúdo bloqueia qualquer outra origem); não há bibliotecas, fontes ou scripts de terceiros.

## Como funciona

```
TSE ──► src/updater ──► public/data/*.json ──► src/server.js ──► navegador
        (a cada 45 s)   (escrita atômica)      (estático, gzip)   (consulta resultado.json a cada 30 s)

IBGE ──► scripts/build-geo.js ──► public/data/geo/*.json   (gerado uma vez, versionado)
```

- **Updater** (`src/updater/`): busca os documentos do TSE, converte para o nosso formato, valida e só então grava. Unidade inválida mantém o valor anterior. `resultado.json` é gravado por último, então a tela nunca vê dados pela metade.
- **Servidor** (`src/server.js`): serve só `public/`, somente leitura (GET/HEAD), com gzip, ETag, CSP restritiva e bloqueio de path traversal e dotfiles.
- **Front** (`public/`): HTML, CSS e módulos ES escritos à mão, sem build.

## Executar

Requer Node 20+. Não há dependências de runtime.

```bash
npm start            # servidor em http://127.0.0.1:3100
npm run updater      # coleta ao vivo em loop (Ctrl+C encerra)
npm test             # testes (node:test + jsdom)
```

Em produção, com PM2: `npm run pm2` (`ecosystem.config.js`: `mapa-web` + `mapa-tse`).

Servidor: `PORT` (3100), `HOST` (`127.0.0.1`; `0.0.0.0` para expor na rede), `PUBLIC_DIR`, `LOG=1`.

Updater (`node src/updater/index.js --help` lista tudo): `--once`, `--turno 2` (2º turno), `--dry-run`, `--interval S`, `--no-munis`, `--dia AAAA-MM-DD`.

### Geometria

`public/data/geo/` já vem no repositório. Para regerar a partir do IBGE: `node scripts/build-geo.js`.

## Estrutura

```
public/
  index.html, css/app.css, img/favicon.svg
  js/            main (orquestra) · mapa (SVG, zoom) · painel · grafico · busca · dados · cores · fmt · api · ufs
  data/
    geo/           malhas do IBGE (versionado)
    resultado.json · historico.json · municipios/<UF>.json   (gerados; ignorados pelo git)
src/
  server.js
  updater/       index · config · http · transform · validate · municipios · cycle · state · providers/tse
scripts/build-geo.js
test/            servidor, updater e front (ponta a ponta no jsdom)
```

## Formato dos dados

- `resultado.json` — `{ versao: 2, gerado, turno, minuto, atualizadoTse, cargos: { presidente: { br, exterior, uf: { AC… } }, governador: { uf }, senador: { uf } } }`. Cada unidade traz `secoes`, `totalizadas`, `eleitorado`, `apurado`, `comparecimento`, `brancos`, `nulos`, `situacao` e `candidatos` (número, nome, partido, votos, resultado), já ordenados por votos.
- `municipios/<UF>.json` — uma linha por município com contadores e `votos` por número de candidato a presidente (`ZZ` = países do exterior; o id é o código do TSE).
- `historico.json` — série por minuto do total nacional.

## Limitações conhecidas

- O resultado por município existe só para presidente; governador e senador são mostrados por estado.
- Municípios criados depois da malha do IBGE (hoje, Boa Esperança do Norte/MT) entram nos totais e nas tabelas, mas ainda não têm polígono no mapa.
- Os números são parciais até 100% das seções; o resultado oficial é o do TSE.
