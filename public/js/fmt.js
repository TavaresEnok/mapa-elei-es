// Formatação e utilidades de DOM.
const inteiro = new Intl.NumberFormat('pt-BR');

export const num = v => inteiro.format(v);
const compactoFmt = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
/** 2.600.000 → "2,6 mi" */
export const compacto = v => compactoFmt.format(v);
export const pct = (fracao, casas = 2) =>
  (fracao * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';
export const semAcento = s => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Minutos desde 00:00 do dia da eleição → "HH:MM" (passa da meia-noite sem estourar 24h). */
export const hhmm = minuto => `${String(Math.floor(minuto / 60) % 24).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`;

export const iniciais = nome => {
  const p = String(nome).trim().split(/\s+/).filter(x => x.length > 2 || /^\d+$/.test(x));
  const base = p.length ? p : String(nome).trim().split(/\s+/);
  return ((base[0] || '?')[0] + (base.length > 1 ? base[base.length - 1][0] : '')).toUpperCase();
};

/** Capitaliza nomes em caixa alta ("FERNANDO HADDAD" → "Fernando Haddad"). */
export const nomeProprio = s => {
  const minusc = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  return String(s).toLowerCase().split(/\s+/).map((p, i) => i && minusc.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
};

/** Cria elementos com textContent (nunca innerHTML — os dados vêm de fora). */
export function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'classe') el.className = v;
    else if (k === 'estilo') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) el.append(f.nodeType ? f : document.createTextNode(String(f)));
  return el;
}

export const NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  return el;
}
