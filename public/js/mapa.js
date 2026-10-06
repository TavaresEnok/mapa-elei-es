// Mapa SVG: desenha estados e municípios, pinta, seleciona e controla zoom/arraste.
import { s } from './fmt.js';

const REDUZIR = matchMedia('(prefers-reduced-motion: reduce)');
const GRUPOS_EXTERNOS = [['RN', 'PB', 'PE', 'AL', 'SE'], ['ES', 'RJ']];   // rótulos puxados para fora do mapa
const LIMITE_ARRASTE = 5;   // px antes de um clique virar arraste

export class Mapa {
  constructor(svg, { aoPassar, aoSair, aoClicar }) {
    this.svg = svg;
    this.aoPassar = aoPassar; this.aoSair = aoSair; this.aoClicar = aoClicar;
    this.pathMun = new Map(); this.pathUf = new Map(); this.bboxUf = new Map();
    this.detalhados = new Set();
    this.ufSel = null; this.munSel = null;
    this.ponteiros = new Map();
    this.anim = 0;
  }

  construir(geo) {
    const { svg } = this;
    this.cheio = { x: 0, y: 0, w: geo.largura, h: geo.altura };
    this.vb = { ...this.cheio };
    svg.replaceChildren();
    const gMun = s('g', { id: 'camada-municipios' }), gUf = s('g', { id: 'camada-estados' });
    for (const m of geo.municipios) {
      const p = s('path', { d: m.d, class: 'm', 'data-id': m.id, 'data-uf': m.uf });
      this.pathMun.set(m.id, p); gMun.append(p);
    }
    for (const [uf, g] of Object.entries(geo.ufs)) {
      const p = s('path', { d: g.d, class: 'u', 'data-uf': uf });
      this.pathUf.set(uf, p); this.bboxUf.set(uf, g.bbox); gUf.append(p);
    }
    // rótulos com a sigla de cada estado, no centroide
    const gRot = s('g', { id: 'camada-rotulos', 'aria-hidden': 'true' });
    this.rotulos = new Map();
    for (const [uf, g] of Object.entries(geo.ufs)) {
      if (!g.centro) continue;
      const t = s('text', { x: g.centro[0], y: g.centro[1], class: 'rotulo', 'data-uf': uf });
      t.textContent = uf;
      const item = { texto: t, centro: g.centro, bbox: g.bbox };
      if (GRUPOS_EXTERNOS.some(grupo => grupo.includes(uf))) { item.linha = s('line', { class: 'rotulo-linha' }); gRot.append(item.linha); }
      this.rotulos.set(uf, item);
      gRot.append(t);
    }
    svg.append(gMun, gUf, gRot);
    this.gMun = gMun;
    this.aplicarVb();
    this.ligarEventos();
  }

  definirNivel(nivel) {
    this.svg.classList.toggle('nivel-estados', nivel === 'estados');
    this.svg.classList.toggle('nivel-municipios', nivel === 'municipios');
  }

  /** Pinta com funções que devolvem { cor, opacidade } ou null (= sem dados). */
  pintar(corUf, corMun) {
    for (const [uf, el] of this.pathUf) aplicarCor(el, corUf && corUf(uf));
    for (const [id, el] of this.pathMun) aplicarCor(el, corMun && corMun(id, el.dataset.uf));
  }

  /** Troca a geometria dos municípios de uma UF pela versão detalhada (resolução maior). */
  detalhar(uf, geoUf) {
    if (this.detalhados.has(uf)) return;
    for (const m of geoUf.municipios) { const el = this.pathMun.get(m.id); if (el) el.setAttribute('d', m.d); }
    this.detalhados.add(uf);
  }

  selecionar(uf, mun) {
    this.ufSel = uf || null; this.munSel = mun || null;
    this.svg.classList.toggle('com-foco', !!uf);
    for (const [codigo, el] of this.pathUf) {
      el.classList.toggle('fora', !!uf && codigo !== uf);
      el.classList.toggle('sel', codigo === uf && !mun);
    }
    for (const [id, el] of this.pathMun) {
      el.classList.toggle('fora', !!uf && el.dataset.uf !== uf);
      const marcado = id === mun;
      el.classList.toggle('sel', marcado);
      if (marcado) this.gMun.append(el);
    }
  }

  /** Enquadra uma UF (ou o Brasil inteiro, se null). */
  enquadrar(uf) { this.irPara(this.ajustar(uf ? this.bboxUf.get(uf) : [0, 0, this.cheio.w, this.cheio.h], uf ? 0.14 : 0.02)); }

  ajustar([x, y, w, h], folga) {
    const caixa = this.svg.getBoundingClientRect();
    const aspecto = caixa.width && caixa.height ? caixa.width / caixa.height : this.cheio.w / this.cheio.h;
    const W = Math.max(w * (1 + folga * 2), h * (1 + folga * 2) * aspecto), H = W / aspecto;
    return { x: x + w / 2 - W / 2, y: y + h / 2 - H / 2, w: W, h: H };
  }

  aplicarVb() {
    const { x, y, w, h } = this.vb;
    this.svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    // unidades do SVG por pixel de tela: mantém os rótulos com tamanho constante em qualquer zoom
    const caixa = this.svg.getBoundingClientRect();
    if (caixa.width && caixa.height) {
      const u = Math.max(w / caixa.width, h / caixa.height);
      this.svg.style.setProperty('--u', u);
      if (!this.ufSel && Math.abs(u - (this.uRotulos || 0)) > u * 0.04) this.posicionarRotulos(u);
    }
  }

  /**
   * Estados pequenos e vizinhos (litoral do Nordeste, ES/RJ) têm o rótulo puxado para o mar, numa coluna,
   * ligado ao estado por uma linha. O espaçamento acompanha a escala para o texto nunca se sobrepor.
   */
  posicionarRotulos(u) {
    this.uRotulos = u;
    for (const grupo of GRUPOS_EXTERNOS) {
      const itens = grupo.map(uf => this.rotulos.get(uf)).filter(Boolean).sort((a, b) => a.centro[1] - b.centro[1]);
      if (!itens.length) continue;
      const x = Math.max(...itens.map(i => i.bbox[0] + i.bbox[2])) + 16 * u;
      const passo = 14 * u, meio = itens.reduce((t, i) => t + i.centro[1], 0) / itens.length;
      itens.forEach((item, k) => {
        const y = meio + (k - (itens.length - 1) / 2) * passo;
        item.texto.setAttribute('x', x); item.texto.setAttribute('y', y);
        item.texto.classList.add('externo');
        for (const [a, v] of [['x1', item.centro[0]], ['y1', item.centro[1]], ['x2', x - 3 * u], ['y2', y]]) item.linha.setAttribute(a, v);
      });
    }
  }

  /**
   * Gera um PNG do mapa como está na tela. O SVG depende do CSS da página, então cada forma do clone
   * recebe os valores já calculados (cor, traço, fonte) antes de ser desenhada num canvas.
   */
  async exportarPng(largura = 1600) {
    const { svg } = this, { w, h } = this.vb;
    const clone = svg.cloneNode(true);
    const originais = svg.querySelectorAll('path, text, line'), copias = clone.querySelectorAll('path, text, line');
    const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-opacity', 'opacity', 'font-size', 'font-weight', 'font-family', 'text-anchor', 'dominant-baseline', 'paint-order', 'stroke-linejoin', 'letter-spacing'];
    originais.forEach((el, i) => {
      const cs = getComputedStyle(el), c = copias[i];
      if (cs.display === 'none') { c.remove(); return; }
      c.removeAttribute('class'); c.removeAttribute('style');
      for (const p of PROPS) { const v = cs.getPropertyValue(p); if (v) c.setAttribute(p, v); }
      if (el.tagName !== 'text') c.setAttribute('vector-effect', 'non-scaling-stroke');
    });
    const altura = Math.round(largura * h / w);
    const fundo = getComputedStyle(svg.parentElement).backgroundColor;
    clone.removeAttribute('class'); clone.removeAttribute('style'); clone.removeAttribute('id');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', largura); clone.setAttribute('height', altura);
    const img = new Image();
    await new Promise((ok, erro) => { img.onload = ok; img.onerror = () => erro(new Error('não foi possível desenhar o mapa'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone)); });
    const canvas = document.createElement('canvas');
    canvas.width = largura; canvas.height = altura;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = fundo; ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(img, 0, 0, largura, altura);
    return new Promise(ok => canvas.toBlob(ok, 'image/png'));
  }

  irPara(alvo) {
    cancelAnimationFrame(this.anim);
    if (REDUZIR.matches) { this.vb = alvo; this.aplicarVb(); return; }
    const de = { ...this.vb }, t0 = performance.now(), dur = 380;
    const passo = agora => {
      const k = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      this.vb = { x: de.x + (alvo.x - de.x) * e, y: de.y + (alvo.y - de.y) * e, w: de.w + (alvo.w - de.w) * e, h: de.h + (alvo.h - de.h) * e };
      this.aplicarVb();
      if (k < 1) this.anim = requestAnimationFrame(passo);
    };
    this.anim = requestAnimationFrame(passo);
  }

  /** Zoom por fator (<1 aproxima) ao redor de um ponto em coordenadas do SVG. */
  zoom(fator, ponto) {
    cancelAnimationFrame(this.anim);
    const { vb, cheio } = this;
    const novoW = Math.min(cheio.w * 1.1, Math.max(cheio.w / 60, vb.w * fator));
    const f = novoW / vb.w;
    const p = ponto || { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
    this.vb = { x: p.x - (p.x - vb.x) * f, y: p.y - (p.y - vb.y) * f, w: novoW, h: vb.h * f };
    this.aplicarVb();
  }

  paraSvg(clientX, clientY) {
    const m = this.svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  ligarEventos() {
    const { svg } = this;
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom(e.deltaY < 0 ? 0.8 : 1.25, this.paraSvg(e.clientX, e.clientY));
    }, { passive: false });

    svg.addEventListener('pointerdown', e => {
      svg.setPointerCapture(e.pointerId);
      this.ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
      this.moveu = false;
      this.distancia = this.distanciaPinca();
    });
    svg.addEventListener('pointermove', e => {
      const p = this.ponteiros.get(e.pointerId);
      if (!p) { this.passar(e); return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > LIMITE_ARRASTE) { this.moveu = true; svg.classList.add('arrastando'); this.aoSair(); }
      if (!this.moveu) return;
      if (this.ponteiros.size === 2) {
        const d = this.distanciaPinca();
        if (this.distancia && d) { const [a, b] = [...this.ponteiros.values()]; this.zoom(this.distancia / d, this.paraSvg((a.x + b.x) / 2, (a.y + b.y) / 2)); }
        this.distancia = d;
      } else {
        const r = svg.getBoundingClientRect();
        this.vb = { ...this.vb, x: this.vb.x - dx * this.vb.w / r.width, y: this.vb.y - dy * this.vb.h / r.height };
        this.aplicarVb();
      }
    });
    const soltar = e => {
      this.ponteiros.delete(e.pointerId);
      this.distancia = this.distanciaPinca();
      if (!this.ponteiros.size) setTimeout(() => svg.classList.remove('arrastando'), 0);
    };
    svg.addEventListener('pointerup', e => {
      const foiClique = !this.moveu && this.ponteiros.size === 1;
      soltar(e);
      if (foiClique) this.clicar(e);
    });
    svg.addEventListener('pointercancel', soltar);
    svg.addEventListener('pointerleave', () => this.aoSair());
  }

  distanciaPinca() {
    if (this.ponteiros.size !== 2) return 0;
    const [a, b] = [...this.ponteiros.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  alvo(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !(el instanceof SVGPathElement)) return null;
    if (el.classList.contains('m')) return { tipo: 'mun', id: +el.dataset.id, uf: el.dataset.uf };
    if (el.classList.contains('u')) return { tipo: 'uf', uf: el.dataset.uf };
    return null;
  }

  passar(e) {
    const a = this.alvo(e);
    if (a) this.aoPassar(a, e); else this.aoSair();
  }

  clicar(e) {
    const a = this.alvo(e);
    if (a) this.aoClicar(a);
  }
}

// Estilo inline (CSSOM) e não atributo: regras de CSS vencem atributos de apresentação do SVG.
// A intensidade mistura a cor do partido com um tom neutro do tema (--papel), então funciona no claro e no escuro.
function aplicarCor(el, c) {
  if (c) el.style.fill = `color-mix(in srgb, ${c.cor} ${Math.round(c.opacidade * 100)}%, var(--papel))`;
  else el.style.removeProperty('fill');
}
