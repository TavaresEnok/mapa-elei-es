const fs = require('fs');
const app = fs.readFileSync('seu_app.1e2cc0fa46.js', 'utf8');
console.log('Has canvas:', app.includes('getContext'));
console.log('Has 2d context:', app.includes('"2d"') || app.includes("'2d'"));
console.log('Has webgl:', app.includes('webgl'));
console.log('Has geoPath:', app.includes('geoPath'));
console.log('Has topojson:', app.includes('topojson'));
console.log('Has svg:', app.includes('createElementNS'));
