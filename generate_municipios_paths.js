const fs = require('fs');
const topojson = require('topojson-client');

const topo = JSON.parse(fs.readFileSync('c:/Users/tavares/Documents/mapa/brasil_topo.json', 'utf8'));
const featureCollection = topojson.feature(topo, topo.objects.municipios);

const minX = 2796253.2837168733;
const maxX = 7397957.544768411;
const minY = 6264566.912771739;
const maxY = 10586372.34014859;

const targetW = 1000;
const targetH = 940;
const padding = 20;

const drawW = targetW - padding * 2;
const drawH = targetH - padding * 2;

const scaleX = drawW / (maxX - minX);
const scaleY = drawH / (maxY - minY);
const scale = Math.min(scaleX, scaleY);

const offsetX = padding + (drawW - (maxX - minX) * scale) / 2;
const offsetY = padding + (drawH - (maxY - minY) * scale) / 2;

function project(x, y) {
  const px = offsetX + (x - minX) * scale;
  const py = offsetY + (maxY - y) * scale;
  return [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
}

function ringToPath(ring) {
  if (!ring || ring.length === 0) return '';
  let str = '';
  for (let i = 0; i < ring.length; i++) {
    const [px, py] = project(ring[i][0], ring[i][1]);
    str += (i === 0 ? `M${px},${py}` : `L${px},${py}`);
  }
  return str + 'Z';
}

function geomToPath(geom) {
  let path = '';
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) {
      path += ringToPath(ring) + ' ';
    }
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        path += ringToPath(ring) + ' ';
      }
    }
  }
  return path.trim();
}

const muniByUf = {};

for (const feat of featureCollection.features) {
  const uf = feat.properties.uf;
  if (!muniByUf[uf]) muniByUf[uf] = [];
  muniByUf[uf].push({
    id: feat.properties.id,
    name: feat.properties.n,
    uf: feat.properties.uf,
    pop: feat.properties.p,
    d: geomToPath(feat.geometry)
  });
}

console.log('Processed municipalities for', Object.keys(muniByUf).length, 'UFs');
fs.writeFileSync('c:/Users/tavares/Documents/mapa/municipios_by_uf.json', JSON.stringify(muniByUf));
console.log('Saved municipios_by_uf.json, size:', (fs.statSync('c:/Users/tavares/Documents/mapa/municipios_by_uf.json').size / 1024 / 1024).toFixed(2), 'MB');
