const https = require('https');
const fs = require('fs');

const files = ['assets/mapa.4d9d76173d.js', 'assets/dados.c3d3520920.js', 'assets/app.1e2cc0fa46.js'];

files.forEach(file => {
  const localName = file.replace('assets/', 'seu_');
  const fileStream = fs.createWriteStream(localName);
  https.get('https://seuimposto.com/' + file, res => {
    res.pipe(fileStream);
    fileStream.on('finish', () => console.log('Saved', localName));
  });
});
