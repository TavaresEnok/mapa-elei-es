const fs = require('fs');

const states = JSON.parse(fs.readFileSync('c:/Users/tavares/Documents/mapa/estados_geo.json', 'utf8'));

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

function visit(coords) {
  if (typeof coords[0] === 'number') {
    const [x, y] = coords;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  } else {
    for (const c of coords) visit(c);
  }
}

for (const f of states.features) {
  visit(f.geometry.coordinates);
}

console.log('Bounds:', { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY });
