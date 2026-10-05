const fs = require('fs');
const topojson = require('topojson-client');

const topo = JSON.parse(fs.readFileSync('c:/Users/tavares/Documents/mapa/brasil_topo.json', 'utf8'));

console.log('Converting TopoJSON to GeoJSON FeatureCollection...');
const featureCollection = topojson.feature(topo, topo.objects.municipios);
console.log('Total municipality features:', featureCollection.features.length);

// Group by UF to create state boundaries
const ufs = {};
for (const feat of featureCollection.features) {
  const uf = feat.properties.uf;
  if (!ufs[uf]) ufs[uf] = [];
  ufs[uf].push(feat);
}

console.log('Unique UFs:', Object.keys(ufs).sort());

// Also merge into states using topojson.merge
const stateFeatures = [];
for (const uf of Object.keys(ufs)) {
  const stateGeom = topojson.merge(topo, topo.objects.municipios.geometries.filter(g => g.properties && g.properties.uf === uf));
  stateFeatures.push({
    type: 'Feature',
    properties: { uf: uf },
    geometry: stateGeom
  });
}

const statesGeoJSON = {
  type: 'FeatureCollection',
  features: stateFeatures
};

fs.writeFileSync('c:/Users/tavares/Documents/mapa/estados_geo.json', JSON.stringify(statesGeoJSON));
console.log('Saved estados_geo.json, size:', fs.statSync('c:/Users/tavares/Documents/mapa/estados_geo.json').size);
