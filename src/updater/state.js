'use strict';
/** Estado persistente do updater (impressão digital da última rodada e do último sweep completo). */
const fs = require('fs');
const path = require('path');
const { loadJson, warn } = require('./util');

const arquivoDe = cfg => path.join(cfg.cacheDir, `estado.${path.basename(cfg.out)}.json`);

function loadState(ctx) {
  return loadJson(arquivoDe(ctx.cfg)) || {};
}

function saveState(ctx) {
  if (ctx.cfg.dryRun) return;
  try {
    fs.mkdirSync(ctx.cfg.cacheDir, { recursive: true });
    fs.writeFileSync(arquivoDe(ctx.cfg), JSON.stringify(ctx.state));
  } catch (e) { warn('estado:', e.message); }
}

module.exports = { loadState, saveState };
