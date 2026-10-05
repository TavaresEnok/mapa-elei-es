const fs = require('fs');

const html = fs.readFileSync('seuimposto_index.html', 'utf8');
const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)];
console.log('Images in HTML:', imgs.map(i => i[1]));

const appJs = fs.readFileSync('seu_app.1e2cc0fa46.js', 'utf8');
const imgMatchesInApp = [...appJs.matchAll(/["']([^"']+\.(?:png|jpg|jpeg|webp|svg))["']/gi)];
console.log('Images in app.js:', [...new Set(imgMatchesInApp.map(i => i[1]))]);

const dadosJs = fs.readFileSync('seu_dados.c3d3520920.js', 'utf8');
const imgMatchesInDados = [...dadosJs.matchAll(/["']([^"']+\.(?:png|jpg|jpeg|webp|svg))["']/gi)];
console.log('Images in dados.js:', [...new Set(imgMatchesInDados.map(i => i[1]))]);
