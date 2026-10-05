const fs = require('fs');

const states = JSON.parse(fs.readFileSync('c:/Users/tavares/Documents/mapa/estados_geo.json', 'utf8'));

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

function getCentroid(geom) {
  let sumX = 0, sumY = 0, count = 0;
  function addCoords(coords) {
    if (typeof coords[0] === 'number') {
      const [px, py] = project(coords[0], coords[1]);
      sumX += px;
      sumY += py;
      count++;
    } else {
      for (const c of coords) addCoords(c);
    }
  }
  addCoords(geom.coordinates);
  return [Math.round(sumX / count), Math.round(sumY / count)];
}

const statePaths = {};
const centroids = {
  // Manual optical adjustments if needed for smaller states or islands
};

for (const f of states.features) {
  const uf = f.properties.uf;
  const d = geomToPath(f.geometry);
  const center = getCentroid(f.geometry);
  statePaths[uf] = {
    uf,
    d,
    center
  };
}

fs.writeFileSync('c:/Users/tavares/Documents/mapa/brazil_svg_paths.json', JSON.stringify(statePaths, null, 2));
console.log('Saved brazil_svg_paths.json with', Object.keys(statePaths).length, 'states');
