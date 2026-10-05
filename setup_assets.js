const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      resolve();
      return;
    }
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
    }).on('error', err => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading fonts...');
  await download('https://seuimposto.com/assets/faustina-300-400.422fca6043.woff2', 'assets/faustina-300-400.422fca6043.woff2');
  await download('https://seuimposto.com/assets/geist-400-500-600.9b6f5ff45b.woff2', 'assets/geist-400-500-600.9b6f5ff45b.woff2');
  console.log('Fonts downloaded.');

  // Copy js files to assets/
  fs.mkdirSync('assets', { recursive: true });
  fs.copyFileSync('seu_mapa.4d9d76173d.js', 'assets/mapa.4d9d76173d.js');
  fs.copyFileSync('seu_dados.c3d3520920.js', 'assets/dados.c3d3520920.js');
  fs.copyFileSync('seu_app.1e2cc0fa46.js', 'assets/app.1e2cc0fa46.js');
  console.log('JS assets copied to assets/.');

  // Let's download Lula and Flavio Bolsonaro portraits + sample portraits
  const retratos = require('./retratos.json');
  console.log('Total retratos available:', Object.keys(retratos).length);
  
  // Download all or key portraits
  const keys = Object.keys(retratos);
  console.log(`Downloading ${keys.length} portraits...`);
  let done = 0;
  for (let i = 0; i < keys.length; i += 10) {
    const batch = keys.slice(i, i + 10);
    await Promise.all(batch.map(async k => {
      const relPath = retratos[k];
      if (!relPath) return;
      try {
        await download(`https://seuimposto.com/${relPath}`, relPath);
        done++;
      } catch (e) {
        // ignore individual failed portraits
      }
    }));
    if (done % 50 === 0 || i + 10 >= keys.length) {
      console.log(`Downloaded ${done}/${keys.length} portraits`);
    }
  }
  console.log('All downloads completed!');
}

run().catch(console.error);
