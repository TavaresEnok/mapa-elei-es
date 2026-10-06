// Gráfico de linhas: participação dos principais candidatos nos votos válidos ao longo da apuração.
import { h, s, pct, hhmm, nomeProprio } from './fmt.js';
import { corDoPartido } from './cores.js';

const A = 250, M = { e: 44, d: 14, c: 12, b: 28 };

/** `marca`: minuto da reprise, destacado com uma linha vertical. `aoEscolher(minuto)`: chamado ao clicar num ponto. */
export function desenharGrafico(container, historico, cadastro, marca = null, aoEscolher = null) {
  container.replaceChildren();
  // largura real do contêiner: 1 unidade do SVG = 1 px, então o texto não cresce em telas largas
  const L = Math.max(320, Math.round(container.clientWidth) || 720);
  const pontos = (historico && historico.pontos) || [];
  if (pontos.length < 2) {
    container.append(h('p', { classe: 'vazio-msg' }, 'O gráfico aparece quando houver pelo menos dois momentos registrados da apuração.'));
    return;
  }
  const ultimo = pontos[pontos.length - 1];
  const topo = Object.entries(ultimo.votos).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
  const series = topo.map(n => ({
    numero: n, ...(cadastro.get(n) || { nome: n, partido: '' }),
    valores: pontos.map(p => { const t = Object.values(p.votos).reduce((x, y) => x + y, 0); return t ? (p.votos[n] || 0) / t : null; }),
  }));
  const todos = series.flatMap(x => x.valores).filter(v => v != null);
  const y0 = Math.max(0, Math.floor(Math.min(...todos) * 20) / 20 - 0.05), y1 = Math.min(1, Math.ceil(Math.max(...todos) * 20) / 20 + 0.05);
  const t0 = pontos[0].minuto, t1 = pontos[pontos.length - 1].minuto || t0 + 1;
  const X = t => M.e + ((t - t0) / (t1 - t0 || 1)) * (L - M.e - M.d);
  const Y = v => A - M.b - ((v - y0) / (y1 - y0 || 1)) * (A - M.b - M.c);

  const svg = s('svg', { viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-label': 'Evolução dos três candidatos mais votados' });
  const passoY = (y1 - y0) > 0.4 ? 0.1 : 0.05;
  for (let v = Math.ceil(y0 / passoY) * passoY; v <= y1 + 1e-9; v += passoY) {
    svg.append(s('line', { x1: M.e, x2: L - M.d, y1: Y(v), y2: Y(v), class: 'eixo' }));
    const r = s('text', { x: M.e - 6, y: Y(v) + 4, 'text-anchor': 'end' }); r.textContent = pct(v, 0); svg.append(r);
  }
  const marcas = Math.min(L < 520 ? 4 : 7, pontos.length);
  for (let i = 0; i < marcas; i++) {
    const t = t0 + ((t1 - t0) * i) / (marcas - 1 || 1);
    const r = s('text', { x: X(t), y: A - 8, 'text-anchor': i === 0 ? 'start' : i === marcas - 1 ? 'end' : 'middle' });
    r.textContent = hhmm(Math.round(t)); svg.append(r);
  }
  for (const serie of series) {
    const d = serie.valores.map((v, i) => v == null ? '' : `${i && serie.valores[i - 1] != null ? 'L' : 'M'}${X(pontos[i].minuto).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
    svg.append(s('path', { d, fill: 'none', stroke: corDoPartido(serie.partido, serie.numero), 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  }
  if (marca != null && marca >= t0 && marca <= t1) svg.append(s('line', { x1: X(marca), x2: X(marca), y1: M.c, y2: A - M.b, class: 'marca' }));
  const guia = s('line', { y1: M.c, y2: A - M.b, class: 'guia', visibility: 'hidden' });
  svg.append(guia);
  const dica = h('div', { classe: 'grafico-dica', hidden: true });

  svg.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * L;
    let melhor = 0;
    pontos.forEach((p, i) => { if (Math.abs(X(p.minuto) - x) < Math.abs(X(pontos[melhor].minuto) - x)) melhor = i; });
    const p = pontos[melhor];
    guia.setAttribute('x1', X(p.minuto)); guia.setAttribute('x2', X(p.minuto)); guia.setAttribute('visibility', 'visible');
    dica.replaceChildren(h('strong', null, `${hhmm(p.minuto)} · ${pct(p.secoes ? p.totalizadas / p.secoes : 0, 1)} apurado`),
      ...series.map(sr => h('div', null, `${nomeProprio(sr.nome)}: ${sr.valores[melhor] == null ? '—' : pct(sr.valores[melhor], 2)}`)));
    dica.hidden = false;
    const lado = X(p.minuto) / L > 0.6;
    dica.style.left = lado ? '' : `${(X(p.minuto) / L) * r.width + 12}px`;
    dica.style.right = lado ? `${r.width - (X(p.minuto) / L) * r.width + 12}px` : '';
  });
  svg.addEventListener('pointerleave', () => { dica.hidden = true; guia.setAttribute('visibility', 'hidden'); });
  if (aoEscolher) {
    svg.classList.add('clicavel');
    svg.addEventListener('click', e => {
      const r = svg.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * L;
      let melhor = 0;
      pontos.forEach((p, i) => { if (Math.abs(X(p.minuto) - x) < Math.abs(X(pontos[melhor].minuto) - x)) melhor = i; });
      aoEscolher(pontos[melhor].minuto);
    });
  }

  container.append(svg, dica, h('div', { classe: 'grafico-legenda' }, series.map(sr =>
    h('span', null, h('i', { classe: 'amostra', estilo: { background: corDoPartido(sr.partido, sr.numero) } }), ` ${nomeProprio(sr.nome)} (${sr.partido})`))));
}
