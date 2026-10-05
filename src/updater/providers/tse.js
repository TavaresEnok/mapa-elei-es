'use strict';
/** Provider real: busca os JSONs públicos do TSE. */
const fs = require('fs');
const path = require('path');
const { CARGOS } = require('../config');
const { loadJson, warn } = require('../util');
const { httpJson } = require('../http');

class TseProvider {
  constructor(cfg) {
    this.cfg = cfg;
    this.etags = new Map();
    this.cmFile = path.join(cfg.cacheDir, 'tse_cm.json');
  }
  ele(cargo) { return cargo === 'pres' ? this.cfg.eleFed : this.cfg.eleEst; }
  url({ cargo, abr, mun }) {
    const ele = this.ele(cargo), e6 = ele.padStart(6, '0');
    const name = mun ? abr + mun.cd : abr;
    return `${this.cfg.base}/ele${this.cfg.ano}/${ele}/dados/${abr}/${name}-c${CARGOS[cargo].cd.padStart(4, '0')}-e${e6}-u.json`;
  }
  /** Mapa município TSE <-> IBGE. Cache em disco; renovado a cada 6h. */
  async cm() {
    if (this._cm && Date.now() - this._cmAt < 6 * 3600e3) return this._cm;
    const ele = this.cfg.eleFed;
    try {
      const r = await httpJson(`${this.cfg.base}/ele${this.cfg.ano}/${ele}/config/mun-e${ele.padStart(6, '0')}-cm.json`, { timeout: 60000 });
      if (r.status === 200 && Array.isArray(r.json.abr)) {
        this._cm = r.json; this._cmAt = Date.now();
        if (!this.cfg.dryRun) {
          fs.mkdirSync(this.cfg.cacheDir, { recursive: true });
          fs.writeFileSync(this.cmFile, JSON.stringify(r.json));
        }
        return this._cm;
      }
    } catch (e) { warn('config de municípios indisponível:', e.message); }
    const cached = loadJson(this.cmFile);
    if (!cached) throw new Error('sem config de municípios (rede e cache indisponíveis)');
    this._cm = cached; this._cmAt = Date.now();
    return cached;
  }
  /** → null (não publicado) | {unchanged:true} (304) | {doc, ack()} */
  async doc(q) {
    const url = this.url(q);
    const r = await httpJson(url, { etag: q.mun ? this.etags.get(url) : undefined });
    if (r.status === 404) return null;
    if (r.status === 304) return { unchanged: true };
    return { doc: r.json, ack: () => { if (q.mun && r.etag) this.etags.set(url, r.etag); } };
  }
}

module.exports = { TseProvider };
