// Acesso aos dados: feed ao vivo (public/data) e geometria estática (public/data/geo).
async function json(caminho) {
  const r = await fetch(caminho, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
  return r.json();
}

export const carregarResultado = () => json('data/resultado.json');
export const carregarHistorico = () => json('data/historico.json');
export const carregarMunicipios = uf => json(`data/municipios/${uf}.json`);
export const carregarGeo = () => json('data/geo/brasil.json');
export const carregarGeoUf = uf => json(`data/geo/uf/${uf}.json`);
