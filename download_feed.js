const https = require('https');
const fs = require('fs');
const path = require('path');

function download(urlPath) {
  return new Promise((resolve) => {
    const cleanPath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const localPath = path.join(__dirname, cleanPath);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
      return resolve({ urlPath, ok: true, cached: true });
    }
    const file = fs.createWriteStream(localPath);
    https.get('https://seuimposto.com/' + cleanPath, res => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve({ urlPath, ok: true, size: fs.statSync(localPath).size }); });
      } else {
        file.close();
        try { fs.unlinkSync(localPath); } catch(e){}
        resolve({ urlPath, ok: false, status: res.statusCode });
      }
    }).on('error', err => {
      try { fs.unlinkSync(localPath); } catch(e){}
      resolve({ urlPath, ok: false, err: err.message });
    });
  });
}

const ufs = ['ac','al','am','ap','ba','ce','df','es','go','ma','mg','ms','mt','pa','pb','pe','pi','pr','rj','rn','ro','rr','rs','sc','se','sp','to','zz'];
const cands = ['13','22','70','14','55','30','80','16','21','27','29','35'];

async function main() {
  console.log('Downloading core feed files...');
  const core = [
    'feed/agora.json',
    'feed/municipios.json',
    'feed/historico.json',
    'feed/arquivo/indice.json'
  ];
  for (const f of core) {
    const res = await download(f);
    console.log(f, res.ok ? `OK (${res.size || 'cached'} bytes)` : `FAIL ${res.status}`);
  }

  console.log('Downloading all UF feed files...');
  for (const uf of ufs) {
    const res = await download(`feed/uf/${uf}.json`);
    console.log(`UF ${uf}:`, res.ok ? 'OK' : `FAIL ${res.status}`);
  }

  console.log('Downloading candidate breakdown files...');
  for (const c of cands) {
    const res = await download(`feed/candidatos/${c}.json`);
    console.log(`Cand ${c}:`, res.ok ? 'OK' : `FAIL ${res.status}`);
  }

  console.log('Feed downloads completed successfully!');
}

main().catch(console.error);
