const fs = require('fs');
const paths = require('./brazil_svg_paths.json');
const agora = require('./feed/agora.json');
const tse = require('./election_tse_data.json');
const retratos = require('./retratos.json');
const historico = require('./feed/historico.json');

const stateNames = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
  PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
  ZZ: 'Exterior'
};

const stateFlags = {
  AC: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Bandeira_do_Acre.svg',
  AL: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Bandeira_de_Alagoas.svg',
  AM: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Bandeira_do_Amazonas.svg',
  AP: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Bandeira_do_Amap%C3%A1.svg',
  BA: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Bandeira_da_Bahia.svg',
  CE: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Bandeira_do_Cear%C3%A1.svg',
  DF: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Bandeira_do_Distrito_Federal_%28Brasil%29.svg',
  ES: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Bandeira_do_Esp%C3%ADrito_Santo.svg',
  GO: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Bandeira_de_Goi%C3%A1s.svg',
  MA: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Bandeira_do_Maranh%C3%A3o.svg',
  MG: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Bandeira_de_Minas_Gerais.svg',
  MS: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Bandeira_de_Mato_Grosso_do_Sul.svg',
  MT: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Bandeira_de_Mato_Grosso.svg',
  PA: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Bandeira_do_Par%C3%A1.svg',
  PB: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Bandeira_da_Para%C3%ADba.svg',
  PE: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Bandeira_de_Pernambuco.svg',
  PI: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Bandeira_do_Piau%C3%AD.svg',
  PR: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Bandeira_do_Paran%C3%A1.svg',
  RJ: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Bandeira_do_estado_do_Rio_de_Janeiro.svg',
  RN: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Bandeira_do_Rio_Grande_do_Norte.svg',
  RO: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Bandeira_de_Rond%C3%B4nia.svg',
  RR: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Bandeira_de_Roraima.svg',
  RS: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Bandeira_do_Rio_Grande_do_Sul.svg',
  SC: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Bandeira_de_Santa_Catarina.svg',
  SE: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Bandeira_de_Sergipe.svg',
  SP: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Bandeira_do_estado_de_S%C3%A3o_Paulo.svg',
  TO: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Bandeira_do_Tocantins.svg',
};

const regionsDef = {
  Norte: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  Nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  Sudeste: ['ES', 'MG', 'RJ', 'SP'],
  Sul: ['PR', 'RS', 'SC'],
  Exterior: ['ZZ']
};

const ufs = [...Object.keys(paths), 'ZZ'];
const estados = {};

for (const uf of ufs) {
  const p = agora.presidente?.uf[uf] || {};
  const v13 = p.votos ? (p.votos['13'] || 0) : 0;
  const v22 = p.votos ? (p.votos['22'] || 0) : 0;
  const totalValidos = v13 + v22;
  const pctLula = totalValidos ? Number(((v13 / totalValidos) * 100).toFixed(2)) : 0;
  const pctBolsonaro = totalValidos ? Number(((v22 / totalValidos) * 100).toFixed(2)) : 0;

  const govVotes = (agora.governador?.uf[uf] || {}).votos || {};
  const govCands = (tse.candidatos?.governador || {})[uf] || [];
  const govTotal = Object.values(govVotes).reduce((a, b) => a + b, 0);
  const govList = Object.keys(govVotes).map(num => {
    const c = govCands.find(x => x.n === num) || {};
    const votes = govVotes[num];
    return {
      n: num,
      nome: c.exib || c.nome || ('Candidato ' + num),
      partido: c.partido || '',
      votos: votes,
      pct: govTotal ? Number(((votes / govTotal) * 100).toFixed(1)) : 0,
      foto: c.sq && retratos[c.sq] ? retratos[c.sq] : null,
      eleito: agora.governador?.uf[uf]?.situacao === 'eleito' && Object.keys(govVotes).sort((a,b)=>govVotes[b]-govVotes[a])[0] === num
    };
  }).sort((a, b) => b.votos - a.votos);

  const senVotes = (agora.senado?.uf[uf] || {}).votos || {};
  const senCands = (tse.candidatos?.senador || {})[uf] || [];
  const senTotal = Object.values(senVotes).reduce((a, b) => a + b, 0);
  const senList = Object.keys(senVotes).map(num => {
    const c = senCands.find(x => x.n === num) || {};
    const votes = senVotes[num];
    return {
      n: num,
      nome: c.exib || c.nome || ('Candidato ' + num),
      partido: c.partido || '',
      votos: votes,
      pct: senTotal ? Number(((votes / senTotal) * 100).toFixed(1)) : 0,
      foto: c.sq && retratos[c.sq] ? retratos[c.sq] : null,
      eleito: agora.senado?.uf[uf]?.situacao === 'eleitos' && Object.keys(senVotes).sort((a,b)=>senVotes[b]-senVotes[a]).slice(0, 2).includes(num)
    };
  }).sort((a, b) => b.votos - a.votos).slice(0, 5);

  let regionName = 'Sudeste';
  for (const [r, list] of Object.entries(regionsDef)) {
    if (list.includes(uf)) { regionName = r; break; }
  }

  estados[uf] = {
    uf,
    name: stateNames[uf] || uf,
    region: regionName,
    flag: stateFlags[uf] || '',
    path: paths[uf] ? paths[uf].d : null,
    center: paths[uf] ? paths[uf].center : null,
    lula: v13,
    bolsonaro: v22,
    pctLula,
    pctBolsonaro,
    vencedor: v13 > v22 ? '13' : '22',
    secoes: p.secoes || 0,
    totalizadas: p.totalizadas || 0,
    apurado: p.secoes ? Number(((p.totalizadas / p.secoes) * 100).toFixed(1)) : 100,
    eleitorado: p.eleitorado || 0,
    comparecimento: p.comparecimento || 0,
    brancos: p.brancos || 0,
    nulos: p.nulos || 0,
    governadores: govList.slice(0, 4),
    senadores: senList,
    senadorFica: tse.senado?.ficam?.[uf] || null
  };
}

// Brasil national
const br = agora.presidente.br;
const br13 = br.votos['13'] || 0;
const br22 = br.votos['22'] || 0;
const brValidos = br13 + br22;

const brasil = {
  lula: br13,
  bolsonaro: br22,
  pctLula: Number(((br13 / brValidos) * 100).toFixed(2)),
  pctBolsonaro: Number(((br22 / brValidos) * 100).toFixed(2)),
  diffVotos: Math.abs(br22 - br13),
  diffPct: Number(Math.abs((br22 / brValidos * 100) - (br13 / brValidos * 100)).toFixed(2)),
  vencedor: br22 > br13 ? '22' : '13',
  secoes: br.secoes,
  totalizadas: br.totalizadas,
  apurado: Number(((br.totalizadas / br.secoes) * 100).toFixed(1)),
  eleitorado: br.eleitorado,
  comparecimento: br.comparecimento,
  pctComparecimento: Number(((br.comparecimento / br.eleitorado) * 100).toFixed(1)),
  brancos: br.brancos,
  nulos: br.nulos,
  pctBrancosNulos: Number((((br.brancos + br.nulos) / br.comparecimento) * 100).toFixed(1))
};

// Region summaries
const regions = {};
for (const [r, ufsList] of Object.entries(regionsDef)) {
  let r13 = 0, r22 = 0;
  for (const u of ufsList) {
    if (estados[u]) { r13 += estados[u].lula; r22 += estados[u].bolsonaro; }
  }
  const total = r13 + r22;
  const p13 = total ? Number(((r13 / total) * 100).toFixed(1)) : 0;
  const p22 = total ? Number(((r22 / total) * 100).toFixed(1)) : 0;
  regions[r] = {
    nome: r,
    lula: r13,
    bolsonaro: r22,
    pctLula: p13,
    pctBolsonaro: p22,
    lider: r13 > r22 ? 'Lula' : 'Flávio Bolsonaro',
    liderNum: r13 > r22 ? '13' : '22',
    pctLider: Math.max(p13, p22),
    diffPts: Math.abs(p22 - p13).toFixed(1)
  };
}

// Timeline
const timeline = (historico.pontos || []).map(pt => {
  const v13 = pt.votos?.['13'] || 0;
  const v22 = pt.votos?.['22'] || 0;
  const sum = v13 + v22;
  return {
    t: pt.t,
    apurado: Number(((pt.totalizadas / pt.secoes) * 100).toFixed(1)),
    sh13: sum ? Number(((v13 / sum) * 100).toFixed(2)) : 0,
    sh22: sum ? Number(((v22 / sum) * 100).toFixed(2)) : 0
  };
});

for (const [uf, info] of Object.entries(paths)) {
  const coords = info.d.match(/-?[\d.]+/g);
  if (!coords) continue;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < coords.length; i += 2) {
    const x = parseFloat(coords[i]);
    const y = parseFloat(coords[i+1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  info.bbox = {
    x: Math.round(minX),
    y: Math.round(minY),
    w: Math.round(maxX - minX),
    h: Math.round(maxY - minY),
    cx: Math.round((minX + maxX) / 2),
    cy: Math.round((minY + maxY) / 2)
  };
}

const candidates = {
  '13': { n: '13', nome: 'Lula', nomeCompleto: 'Luiz Inácio Lula da Silva', partido: 'PT', cor: '#DC2626', foto: retratos['280002542548'] || 'retratos/280002542548.cbf4ef28.webp' },
  '22': { n: '22', nome: 'Flávio Bolsonaro', nomeCompleto: 'Flávio Nantes Bolsonaro', partido: 'PL', cor: '#1D4ED8', foto: retratos['280002551544'] || 'retratos/280002551544.d8a60933.webp' }
};

fs.writeFileSync('election_data_full.json', JSON.stringify({ brasil, estados, regions, timeline, candidates, paths }, null, 2));
console.log('Saved election_data_full.json:', (fs.statSync('election_data_full.json').size / 1024).toFixed(0), 'KB');
