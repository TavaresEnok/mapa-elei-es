#!/usr/bin/env node
'use strict';
/**
 * Gera a geometria do mapa a partir das malhas oficiais do IBGE (API de Malhas v3 e Localidades v1).
 *
 *   node scripts/build-geo.js
 *
 * Saída (versionada, estática):
 *   public/data/geo/brasil.json     UFs (com centroide) + 5.570 municípios em baixa resolução (visão nacional)
 *   public/data/geo/uf/<UF>.json    municípios da UF em resolução intermediária (zoom no estado)
 *
 * Todas as coordenadas passam pela mesma projeção (equiretangular com correção de latitude), então os
 * arquivos de detalhe encaixam exatamente sobre o mapa nacional.
 */
const fs = require('fs');
const path = require('path');

const API = 'https://servicodados.ibge.gov.br/api';
const OUT = path.join(__dirname, '..', 'public', 'data', 'geo');
const WIDTH = 1000;        // largura do mapa nacional, em unidades do SVG
const LAT0 = -15;          // latitude de referência da projeção

const UF_POR_CODIGO = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN',
  25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC',
  43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};

async function getJson(url, tentativas = 4) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i >= tentativas - 1) throw new Error(`${e.message} (${url})`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

/** Projeção: lon/lat → plano. Origem e escala são fixadas depois de conhecer o limite do país. */
const kx = Math.cos(LAT0 * Math.PI / 180);
const raw = (lon, lat) => [lon * kx, -lat];

function limites(features) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const visita = c => {
    if (typeof c[0] === 'number') {
      const [x, y] = raw(c[0], c[1]);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    } else c.forEach(visita);
  };
  features.forEach(f => visita(f.geometry.coordinates));
  return { x0, y0, x1, y1 };
}

function criarProjecao(b) {
  const s = WIDTH / (b.x1 - b.x0);
  return {
    s, h: Math.ceil((b.y1 - b.y0) * s),
    xy: (lon, lat) => { const [x, y] = raw(lon, lat); return [(x - b.x0) * s, (y - b.y0) * s]; },
  };
}

const r1 = v => Math.round(v * 10) / 10;

/** Geometria → path SVG com comandos relativos (compacto) e 1 casa decimal. */
function paraPath(geom, proj) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let d = '', minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const poly of polys) {
    for (const ring of poly) {
      let px = 0, py = 0, parte = '', n = 0;
      ring.forEach((c, i) => {
        const [x, y] = proj.xy(c[0], c[1]);
        const qx = r1(x), qy = r1(y);
        if (qx < minX) minX = qx; if (qx > maxX) maxX = qx; if (qy < minY) minY = qy; if (qy > maxY) maxY = qy;
        if (i === 0) parte = `M${qx} ${qy}`;
        else {
          const dx = r1(qx - px), dy = r1(qy - py);
          if (dx === 0 && dy === 0) return;
          parte += `${n === 0 ? 'l' : ' '}${dx} ${dy}`; n++;
        }
        px = qx; py = qy;
      });
      if (n >= 2) d += parte + 'z';
    }
  }
  return { d, bbox: [r1(minX), r1(minY), r1(maxX - minX), r1(maxY - minY)] };
}

/** Centroide (ponderado pela área) do maior polígono da geometria, já projetado — posição do rótulo. */
function centroide(geom, proj) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let melhor = null;
  for (const poly of polys) {
    const anel = poly[0].map(c => proj.xy(c[0], c[1]));
    let area = 0, cx = 0, cy = 0;
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      const f = anel[j][0] * anel[i][1] - anel[i][0] * anel[j][1];
      area += f; cx += (anel[j][0] + anel[i][0]) * f; cy += (anel[j][1] + anel[i][1]) * f;
    }
    if (!area) continue;
    if (!melhor || Math.abs(area) > Math.abs(melhor.area)) melhor = { area, x: cx / (3 * area), y: cy / (3 * area) };
  }
  return melhor ? [r1(melhor.x), r1(melhor.y)] : null;
}

function escrever(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj));
  console.log(path.relative(process.cwd(), file), (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
}

async function main() {
  console.log('baixando malhas do IBGE…');
  const [nacional, estados, nomes] = await Promise.all([
    getJson(`${API}/v3/malhas/paises/BR?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=minima`),
    getJson(`${API}/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json&qualidade=minima`),
    getJson(`${API}/v1/localidades/municipios`),
  ]);
  if (nacional.features.length !== 5570) throw new Error(`esperava 5570 municípios, vieram ${nacional.features.length}`);

  const proj = criarProjecao(limites(nacional.features));
  const nomeDe = new Map(nomes.map(m => [m.id, m.nome]));
  const ufDe = id => UF_POR_CODIGO[Math.floor(id / 100000)];

  const ufs = {};
  for (const f of estados.features) {
    const sigla = UF_POR_CODIGO[+f.properties.codarea];
    ufs[sigla] = { ...paraPath(f.geometry, proj), centro: centroide(f.geometry, proj) };
  }
  const municipios = nacional.features.map(f => {
    const id = +f.properties.codarea;
    return { id, uf: ufDe(id), n: nomeDe.get(id) || String(id), ...paraPath(f.geometry, proj) };
  }).sort((a, b) => a.id - b.id);
  for (const m of municipios) if (!m.uf) throw new Error('município sem UF: ' + m.id);

  escrever(path.join(OUT, 'brasil.json'), { largura: WIDTH, altura: proj.h, ufs, municipios });

  for (const [codigo, sigla] of Object.entries(UF_POR_CODIGO)) {
    const g = await getJson(`${API}/v3/malhas/estados/${codigo}?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=intermediaria`);
    const lista = g.features.map(f => ({ id: +f.properties.codarea, ...paraPath(f.geometry, proj) })).sort((a, b) => a.id - b.id);
    escrever(path.join(OUT, 'uf', sigla + '.json'), { uf: sigla, municipios: lista });
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
