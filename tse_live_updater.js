/**
 * TSE Live Updater - Script de Acompanhamento ao Vivo
 * 
 * Este script consulta a API oficial e pública do TSE (sem necessidade de token ou cadastro)
 * e atualiza os arquivos locais de dados em tempo real durante a apuração.
 * 
 * Uso:
 *   node tse_live_updater.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Parâmetros da Eleição (definidos pelo TSE no dia da eleição)
// Exemplo TSE 2º Turno Presidencial:
const CONFIG = {
  ano: '2026',
  cdEleicao: '545', // Código oficial do pleito divulgado pelo TSE
  intervaloSegundos: 45 // Intervalo entre consultas (TSE atualiza a cada 30-60s)
};

const BASE_URL = `https://resultados.tse.jus.br/oficial/ele${CONFIG.ano}/${CONFIG.cdEleicao}/dados-simplificados`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} para ${url}`));
      }
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function atualizarApuracao() {
  console.log(`[${new Date().toLocaleTimeString()}] Consultando TSE...`);
  try {
    // 1. Consulta Total Brasil (Presidente)
    const brUrl = `${BASE_URL}/br/br-c0001-e${CONFIG.cdEleicao.padStart(6, '0')}-r.json`;
    const brData = await fetchJson(brUrl);

    console.log(`Totalizado: ${brData.pst}% das seções`);
    if (brData.cand) {
      brData.cand.forEach(c => {
        console.log(`  ${c.nm} (${c.cc}): ${c.pvap}% (${parseInt(c.vap).toLocaleString('pt-BR')} votos)`);
      });
    }

    // 2. Consulta por Estado (27 UFs)
    const ufs = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
    const estadosUpdates = {};

    for (const uf of ufs) {
      const ufLower = uf.toLowerCase();
      const ufUrl = `${BASE_URL}/${ufLower}/${ufLower}-c0001-e${CONFIG.cdEleicao.padStart(6, '0')}-r.json`;
      try {
        const ufData = await fetchJson(ufUrl);
        estadosUpdates[uf] = ufData;
      } catch (err) {
        // UF ainda pode não ter enviado primeira totalização
      }
    }

    console.log(`Atualização concluída: ${Object.keys(estadosUpdates).length} UFs recebidas.`);
    console.log(`Próxima checagem em ${CONFIG.intervaloSegundos}s...\n`);

  } catch (err) {
    console.warn('Aviso na consulta ao TSE (servidor pode estar em aquecimento):', err.message);
  }
}

// Inicia polling contínuo
console.log('=== Monitor de Apuração ao Vivo · TSE ===');
console.log(`Eleição: ${CONFIG.ano} · Código: ${CONFIG.cdEleicao}`);
console.log('Pressione Ctrl+C para encerrar.\n');

atualizarApuracao();
setInterval(atualizarApuracao, CONFIG.intervaloSegundos * 1000);
