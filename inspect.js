const fs = require('fs');
const html = fs.readFileSync('seuimposto_index.html', 'utf8');

console.log('--- Scripts ---');
const scriptMatches = [...html.matchAll(/src=["']([^"']+)["']/g)];
scriptMatches.forEach(m => console.log(m[1]));

console.log('--- Links / Data ---');
const linkMatches = [...html.matchAll(/href=["']([^"']+)["']/g)];
linkMatches.forEach(m => console.log(m[1]));

console.log('--- Topojson / Geojson / Map references ---');
const mapMatches = [...html.matchAll(/(https?:\/\/[^\s"']+\.(?:json|svg|topojson|geojson|png|webp|avif))/gi)];
mapMatches.forEach(m => console.log(m[1]));
