// Acesso aos dados. A "fonte" é a pasta do turno (turno1, turno2) ou a simulação; a geometria é estática.
let base = 'data/turno1/';

async function json(caminho) {
  const r = await fetch(caminho, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
  return r.json();
}

export const definirFonte = nome => { base = `data/${nome}/`; };
export const fotoUrl = sq => `data/fotos/${sq}.jpeg`;

export const carregarIndice = () => json('data/indice.json');
export const carregarResultado = () => json(base + 'resultado.json');
export const carregarHistorico = () => json(base + 'historico.json');
export const carregarMunicipios = (cargo, uf) => json(`${base}municipios/${cargo}/${uf}.json`);
export const carregarLinhaDoTempo = () => json(base + 'linha-do-tempo/indice.json');
export const carregarRetrato = minuto => json(`${base}linha-do-tempo/${minuto}.json`);
export const carregarGeo = () => json('data/geo/brasil.json');
export const carregarGeoUf = uf => json(`data/geo/uf/${uf}.json`);
