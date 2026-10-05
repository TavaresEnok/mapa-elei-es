// Cores por partido (escolha própria) e intensidade pela margem de vitória.
const PARTIDOS = {
  PT: '#d62839', PL: '#1f5fbf', UNIÃO: '#0b8bb5', PP: '#5a7fd6', MDB: '#12945a', PSD: '#e0a100', REPUBLICANOS: '#0f766e',
  PSB: '#e8590c', PDT: '#c2185b', PSDB: '#2f80ed', PODE: '#6aa84f', PODEMOS: '#6aa84f', NOVO: '#f57c00', PSOL: '#c9a300',
  AVANTE: '#8e5bd1', PRD: '#7c5a48', SOLIDARIEDADE: '#e64a19', DC: '#2e7d32', MISSÃO: '#00897b', PCO: '#a31621',
  PSTU: '#b71c1c', UP: '#8b1a1a', PCB: '#a01818', AGIR: '#5e35b1', PMB: '#6d4c41', PRTB: '#455a64', DEMOCRATA: '#00796b',
  CIDADANIA: '#ad1457', 'PC DO B': '#c62828', PV: '#388e3c', REDE: '#2e9e6b',
};
const FALLBACK = ['#7b61c4', '#c0497a', '#3f8f8f', '#a8793a', '#5f7d3a', '#8a5a9e', '#4a6fa5', '#b0603d'];

const hash = t => { let x = 0; for (const c of t) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };

export const corDoPartido = (sigla, numero = '') => {
  const chave = String(sigla || '').toUpperCase().trim();
  return PARTIDOS[chave] || FALLBACK[hash(chave || String(numero)) % FALLBACK.length];
};

/** Intensidade da cor no mapa: 0,34 (empate) → 1 (vantagem de 30 pontos ou mais). */
export const intensidade = margem => 0.34 + 0.66 * Math.min(1, Math.max(0, margem) / 0.3);
