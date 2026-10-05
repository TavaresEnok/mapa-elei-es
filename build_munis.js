const fs = require('fs');

console.log('Building municipality-level election dataset...');

const munisRaw = JSON.parse(fs.readFileSync('municipios_by_uf.json', 'utf8'));
const retratos = JSON.parse(fs.readFileSync('retratos.json', 'utf8'));

const ufs = Object.keys(munisRaw);
const muniData = {}; // ibge_id -> {d, name, uf, pctLula, pctBolsonaro, vencedor, apurado}
let count = 0;

for (const uf of ufs) {
  const feedPath = 'feed/uf/' + uf.toLowerCase() + '.json';
  if (!fs.existsSync(feedPath)) {
    console.warn('Missing feed for', uf);
    continue;
  }

  const feed = JSON.parse(fs.readFileSync(feedPath, 'utf8'));
  const ibgeCodes = feed.ibge; // array of ibge codes in order
  const v13 = feed.votos['13'] || [];
  const v22 = feed.votos['22'] || [];
  const secoes = feed.secoes || [];
  const totalizadas = feed.totalizadas || [];

  // Build lookup: ibge_id -> index in feed
  const feedIdx = {};
  ibgeCodes.forEach((id, i) => { feedIdx[String(id)] = i; });

  // Build lookup: ibge_id -> svg path data
  const svgById = {};
  munisRaw[uf].forEach(m => { svgById[String(m.id)] = m; });

  // Match and build
  for (const [id, m] of Object.entries(svgById)) {
    const i = feedIdx[id];
    if (i === undefined) continue;

    const lula = v13[i] || 0;
    const bol = v22[i] || 0;
    const total = lula + bol;
    const pctL = total > 0 ? (lula / total) * 100 : 0;
    const pctB = total > 0 ? (bol / total) * 100 : 0;
    const apurado = secoes[i] > 0 ? (totalizadas[i] / secoes[i]) * 100 : 0;

    muniData[id] = {
      id,
      name: m.name,
      uf,
      d: m.d,
      pctLula: Math.round(pctL * 10) / 10,
      pctBolsonaro: Math.round(pctB * 10) / 10,
      vencedor: lula > bol ? '13' : '22',
      apurado: Math.round(apurado),
      lula,
      bolsonaro: bol
    };
    count++;
  }

  console.log(`${uf}: ${Object.keys(svgById).length} municipalities processed`);
}

console.log(`\nTotal municipalities in dataset: ${count}`);

// Save lean version (no SVG paths inline - paths stored separately for perf)
// Instead, we build a "paths" file and a "votes" file separately
const muniPaths = {}; // id -> {d, name, uf}
const muniVotes = {}; // id -> {pctLula, pctBolsonaro, vencedor, apurado, lula, bolsonaro}

for (const [id, m] of Object.entries(muniData)) {
  muniPaths[id] = { d: m.d, name: m.name, uf: m.uf };
  muniVotes[id] = {
    pL: m.pctLula,
    pB: m.pctBolsonaro,
    v: m.vencedor,
    a: m.apurado,
    lula: m.lula,
    bol: m.bolsonaro
  };
}

fs.writeFileSync('municipios_paths.json', JSON.stringify(muniPaths));
fs.writeFileSync('municipios_votes.json', JSON.stringify(muniVotes));

console.log('municipios_paths.json:', (fs.statSync('municipios_paths.json').size / 1024).toFixed(0), 'KB');
console.log('municipios_votes.json:', (fs.statSync('municipios_votes.json').size / 1024).toFixed(0), 'KB');
console.log('Done!');
