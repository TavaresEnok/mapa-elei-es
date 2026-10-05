// Busca de cidade ou estado (Ctrl+K), sem acento e sem diferenciar maiúsculas.
import { h, semAcento } from './fmt.js';
import { NOMES_UF } from './ufs.js';

export class Busca {
  constructor({ dialogo, campo, lista, abrirBotao, geo, aoEscolher }) {
    this.dialogo = dialogo; this.campo = campo; this.lista = lista; this.aoEscolher = aoEscolher;
    this.itens = [
      ...Object.entries(NOMES_UF).map(([uf, nome]) => ({ tipo: 'uf', uf, nome, chave: semAcento(nome + ' ' + uf), rotulo: nome, sub: 'Estado' })),
      ...geo.municipios.map(m => ({ tipo: 'mun', id: m.id, uf: m.uf, nome: m.n, chave: semAcento(m.n), rotulo: m.n, sub: m.uf })),
    ];
    this.resultados = []; this.ativo = 0;
    abrirBotao.addEventListener('click', () => this.abrir());
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.abrir(); }
    });
    campo.addEventListener('input', () => this.buscar());
    campo.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); this.mover(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.mover(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); this.escolher(this.ativo); }
    });
    lista.addEventListener('click', e => { const li = e.target.closest('li'); if (li) this.escolher(+li.dataset.i); });
    dialogo.addEventListener('click', e => { if (e.target === dialogo) dialogo.close(); });
  }

  abrir() { this.campo.value = ''; this.buscar(); this.dialogo.showModal(); this.campo.focus(); }

  buscar() {
    const q = semAcento(this.campo.value.trim());
    if (!q) { this.resultados = this.itens.filter(i => i.tipo === 'uf'); }
    else {
      const comeca = [], contem = [];
      for (const i of this.itens) {
        const pos = i.chave.indexOf(q);
        if (pos === 0 || (pos > 0 && i.chave[pos - 1] === ' ')) comeca.push(i); else if (pos > 0) contem.push(i);
        if (comeca.length >= 12) break;
      }
      this.resultados = [...comeca, ...contem].slice(0, 12);
    }
    this.ativo = 0; this.renderizar();
  }

  mover(d) {
    if (!this.resultados.length) return;
    this.ativo = (this.ativo + d + this.resultados.length) % this.resultados.length;
    this.renderizar();
  }

  renderizar() {
    this.lista.replaceChildren(...this.resultados.map((r, i) =>
      h('li', { role: 'option', 'data-i': i, 'aria-selected': i === this.ativo ? 'true' : 'false' }, r.rotulo, h('small', null, r.sub))));
    const ativo = this.lista.querySelector('[aria-selected="true"]');
    if (ativo) ativo.scrollIntoView({ block: 'nearest' });
    if (!this.resultados.length) this.lista.append(h('li', { role: 'option', 'aria-disabled': 'true' }, 'Nada encontrado'));
  }

  escolher(i) {
    const r = this.resultados[i];
    if (!r) return;
    this.dialogo.close();
    this.aoEscolher(r);
  }
}
