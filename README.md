# 🇧🇷 Mapa de Apuração Eleições Presidenciais (2º Turno)

Aplicação web completa, moderna e 100% proprietária para acompanhamento da apuração presidencial município por município (todas as 5.570 cidades do Brasil) e estado por estado.

![Preview](assets/og.933bb11ba1.jpg)

## ✨ Funcionalidades

- **🗺️ Mosaico Nacional de 5.570 Cidades**: Visualização vetorial (SVG) de todos os municípios brasileiros com cores graduadas pela margem eleitoral de cada candidato.
- **🏛️ Modo Macro Estadual (27 UFs)**: Alternância instantânea entre visão por municípios e visão por estados.
- **⚡ Tooltips Instantâneos**: Informações detalhadas em tempo real ao passar o mouse em qualquer cidade (votos nominais, percentual, vencedor e urnas apuradas).
- **🔍 Busca Inteligente (`Ctrl + K`)**: Localize rapidamente qualquer cidade ou estado do país e dê zoom imediato.
- **🔍 Zoom & Pan Fluido**: Navegue pelo mapa com a roda do mouse, arraste com o botão esquerdo, controles na tela ou clicando direto no estado para dar zoom e abrir a ficha lateral.
- **📊 Painel Lateral e Ficha Estadual**: Governador eleito, senadores, comparecimento, abstenção, brancos e nulos.
- **⏱️ Linha do Tempo da Apuração**: Scrubber para navegar minuto a minuto na história da apuração das 17h às 24h.
- **🔒 100% Independente e Proprietário**: Zero dependências de servidores ou bibliotecas externas. Todo o código, dados e mapas rodam localmente.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado (v16+)

### Instalação e Execução
```bash
# Iniciar o servidor local
node server.js
```
Acesse no seu navegador: **`http://localhost:3000/`**

---

## 📡 Como Acompanhar a Próxima Eleição ao Vivo (TSE API)

### 1. A API do TSE é pública? Precisa se cadastrar?
**Não precisa de cadastro nem chave de API (sem token/auth)!**
O Tribunal Superior Eleitoral (TSE) disponibiliza durante o período eleitoral uma API pública e aberta em formato JSON, sob a infraestrutura oficial:
`https://resultados.tse.jus.br/oficial/ele2026/...`

### 2. Formato e Endpoints da API Oficial do TSE
Durante as eleições, o TSE publica arquivos JSON atualizados a cada 1-2 minutos:
- **Resumo Nacional (Presidente)**:
  `https://resultados.tse.jus.br/oficial/ele2026/{codigo_eleicao}/dados-simplificados/br/br-c0001-e000000-r.json`
- **Por Estado (UF)**:
  `https://resultados.tse.jus.br/oficial/ele2026/{codigo_eleicao}/dados-simplificados/{uf}/{uf}-c0001-e000000-r.json`
- **Por Município**:
  `https://resultados.tse.jus.br/oficial/ele2026/{codigo_eleicao}/dados/{uf}/{codigo_ibge}/...`

### 3. Como funciona a ingestão no projeto
Para acompanhar a apuração ao vivo em tempo real:
1. Um script Node.js (ex: `polling_tse.js`) faz requisições periódicas a cada 60 segundos nos endpoints oficiais do TSE.
2. O script atualiza os arquivos `municipios_map_data.json` e `election_data_full.json`.
3. O frontend recarrega os dados com `fetch()` sem necessidade de reload da página, refletindo a apuração ao vivo no mapa!

---

## 📁 Estrutura do Projeto

```
├── index.html                  # Aplicação web principal (HTML, CSS e JS proprietários)
├── server.js                   # Servidor HTTP local em Node.js
├── build_clean_app.js          # Construtor da aplicação web
├── build_dataset.js            # Construtor do dataset eleitoral
├── build_munis.js              # Construtor do dataset dos 5.570 municípios
├── municipios_map_data.json    # Dados geográficos e de apuração das 5.570 cidades
├── election_data_full.json     # Totais nacionais, estados, candidatos e linha do tempo
├── brazil_svg_paths.json       # Contornos vetoriais dos estados
├── retratos/                   # Fotos oficiais dos candidatos
├── feed/                       # Histórico das seções e feeds de apuração
└── assets/                     # Imagens e ícones de apoio
```

---

Desenvolvido para fins de transparência de dados públicos e cartografia eleitoral.
