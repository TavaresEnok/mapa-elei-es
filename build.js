const fs = require('fs');

const svgPaths = JSON.parse(fs.readFileSync('c:/Users/tavares/Documents/mapa/brazil_svg_paths.json', 'utf8'));

// 2nd round simulated results (realistic based on 1st round)
const stateResults = {
  AC: { lula: 35.1, bolsonaro: 64.9, apurado: 99.8, region: 'Norte' },
  AL: { lula: 55.2, bolsonaro: 44.8, apurado: 99.9, region: 'Nordeste' },
  AM: { lula: 51.8, bolsonaro: 48.2, apurado: 99.1, region: 'Norte' },
  AP: { lula: 53.6, bolsonaro: 46.4, apurado: 97.3, region: 'Norte' },
  BA: { lula: 73.4, bolsonaro: 26.6, apurado: 100.0, region: 'Nordeste' },
  CE: { lula: 72.5, bolsonaro: 27.5, apurado: 99.9, region: 'Nordeste' },
  DF: { lula: 40.4, bolsonaro: 59.6, apurado: 100.0, region: 'Centro-Oeste' },
  ES: { lula: 39.5, bolsonaro: 60.5, apurado: 100.0, region: 'Sudeste' },
  GO: { lula: 38.2, bolsonaro: 61.8, apurado: 100.0, region: 'Centro-Oeste' },
  MA: { lula: 70.8, bolsonaro: 29.2, apurado: 99.8, region: 'Nordeste' },
  MG: { lula: 51.8, bolsonaro: 48.2, apurado: 99.7, region: 'Sudeste' },
  MS: { lula: 36.1, bolsonaro: 63.9, apurado: 99.9, region: 'Centro-Oeste' },
  MT: { lula: 29.8, bolsonaro: 70.2, apurado: 100.0, region: 'Centro-Oeste' },
  PA: { lula: 56.2, bolsonaro: 43.8, apurado: 98.5, region: 'Norte' },
  PB: { lula: 66.8, bolsonaro: 33.2, apurado: 99.8, region: 'Nordeste' },
  PE: { lula: 65.9, bolsonaro: 34.1, apurado: 99.9, region: 'Nordeste' },
  PI: { lula: 75.3, bolsonaro: 24.7, apurado: 100.0, region: 'Nordeste' },
  PR: { lula: 35.8, bolsonaro: 64.2, apurado: 99.8, region: 'Sul' },
  RJ: { lula: 42.0, bolsonaro: 58.0, apurado: 99.5, region: 'Sudeste' },
  RN: { lula: 67.1, bolsonaro: 32.9, apurado: 99.7, region: 'Nordeste' },
  RO: { lula: 30.5, bolsonaro: 69.5, apurado: 99.9, region: 'Norte' },
  RR: { lula: 27.2, bolsonaro: 72.8, apurado: 99.6, region: 'Norte' },
  RS: { lula: 42.8, bolsonaro: 57.2, apurado: 99.9, region: 'Sul' },
  SC: { lula: 28.8, bolsonaro: 71.2, apurado: 100.0, region: 'Sul' },
  SE: { lula: 61.5, bolsonaro: 38.5, apurado: 99.8, region: 'Nordeste' },
  SP: { lula: 47.1, bolsonaro: 52.9, apurado: 99.8, region: 'Sudeste' },
  TO: { lula: 41.8, bolsonaro: 58.2, apurado: 99.3, region: 'Norte' }
};

// State names
const stateNames = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
  PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins'
};

const svgPathsData = JSON.stringify(svgPaths);
const stateResultsData = JSON.stringify(stateResults);
const stateNamesData = JSON.stringify(stateNames);

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Apuração 2026 · 2º Turno · 25 de outubro</title>
<meta name="description" content="Acompanhe a apuração do 2º turno das eleições presidenciais de 2026 em tempo real: Lula × Flávio Bolsonaro, estado por estado.">
<meta property="og:title" content="Apuração 2026 · 2º Turno ao vivo">
<meta property="og:description" content="Lula × Flávio Bolsonaro no 2º turno · 25 de outubro · apuração em tempo real">
<meta name="theme-color" content="#0F0E0D">
<meta name="color-scheme" content="dark">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;700&display=swap" rel="stylesheet">
<style>
/* ===== DESIGN TOKENS ===== */
:root {
  --bg: #0F0E0D;
  --panel: #151412;
  --panel-2: #1B1A17;
  --panel-3: #22201D;
  --glass: rgba(21,20,18,.88);
  --line: rgba(250,250,249,.08);
  --line-2: rgba(250,250,249,.16);
  --line-3: rgba(250,250,249,.28);
  --fg: #FAFAF9;
  --fg-2: #D6D4CF;
  --fg-3: #A6A39C;
  --fg-4: #85827C;
  --fg-5: #6F6C66;
  --serif: 'Playfair Display', Georgia, serif;
  --sans: 'Inter', 'Helvetica Neue', Arial, sans-serif;

  --lula-color: #CC1F1F;
  --lula-light: #FF3B3B;
  --lula-dim: rgba(204,31,31,.18);
  --bolsonaro-color: #1B3A8A;
  --bolsonaro-light: #3B69E8;
  --bolsonaro-dim: rgba(27,58,138,.18);

  --ease: cubic-bezier(.4,0,.2,1);
  --ease-out: cubic-bezier(.16,1,.3,1);
  --hover: .14s;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: var(--bg); color: var(--fg); overflow: hidden; }
body { font: 400 13px/1.45 var(--sans); -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4,p { margin: 0; }
button { font: inherit; color: inherit; cursor: pointer; touch-action: manipulation; }
::selection { background: rgba(250,250,249,.2); }
:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 4px; }

/* ===== LAYOUT ===== */
#app {
  display: grid;
  grid-template-columns: 296px 1fr 288px;
  grid-template-rows: 52px 1fr 56px;
  height: 100vh;
  height: 100dvh;
  position: relative;
}

/* ===== TOP BAR ===== */
#topbar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 20px;
  height: 52px;
  position: relative;
  z-index: 10;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(to bottom, rgba(15,14,13,.98), rgba(15,14,13,.9));
  backdrop-filter: blur(12px);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
  white-space: nowrap;
  margin-right: 24px;
  min-width: 220px;
}
.brand-name {
  font: 400 21px/1 var(--serif);
  letter-spacing: -.015em;
  color: var(--fg);
}
.brand-sub {
  font: 500 11px/1 var(--sans);
  color: var(--fg-3);
  letter-spacing: .01em;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(250,250,249,.05);
  border: 1px solid var(--line-2);
  border-radius: 100px;
  padding: 3px;
}
.nav-tab {
  all: unset;
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 100px;
  font: 500 12px/1 var(--sans);
  color: var(--fg-3);
  transition: background var(--hover) var(--ease), color var(--hover) var(--ease);
  white-space: nowrap;
}
.nav-tab:hover { color: var(--fg-2); background: rgba(250,250,249,.06); }
.nav-tab.active { background: rgba(250,250,249,.14); color: var(--fg); box-shadow: inset 0 0 0 1px rgba(250,250,249,.12); }

.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font: 500 12px/1 var(--sans);
  color: var(--fg-2);
  white-space: nowrap;
}
.live-dot {
  width: 7px; height: 7px;
  border-radius: 999px;
  background: #22c55e;
  animation: breathe 1.6s ease-in-out infinite;
  flex: none;
}
.live-dot.replay { background: var(--fg-4); animation: none; }
@keyframes breathe { 0%,100%{opacity:.3}50%{opacity:1} }

.status-text { font: 500 11px/1 var(--sans); color: var(--fg-4); white-space: nowrap; }

.icon-btn {
  all: unset;
  cursor: pointer;
  display: grid;
  place-items: center;
  width: 32px; height: 32px;
  border-radius: 8px;
  color: var(--fg-3);
  transition: background var(--hover) var(--ease), color var(--hover) var(--ease);
}
.icon-btn:hover { background: rgba(250,250,249,.08); color: var(--fg); }
.icon-btn svg { display: block; }

.search-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border-radius: 100px;
  border: 1px solid var(--line-2);
  background: rgba(21,20,18,.6);
  font: 500 12px/1 var(--sans);
  color: var(--fg-3);
  cursor: pointer;
  transition: border-color var(--hover) var(--ease), color var(--hover) var(--ease);
}
.search-btn:hover { border-color: var(--line-3); color: var(--fg-2); }
.search-btn kbd {
  font: 500 10px/1 var(--sans);
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--panel-3);
  color: var(--fg-4);
  border: 1px solid var(--line);
}

/* ===== LEFT PANEL ===== */
#left-panel {
  grid-column: 1;
  grid-row: 2;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-right: 1px solid var(--line);
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}

/* ===== RIGHT PANEL ===== */
#right-panel {
  grid-column: 3;
  grid-row: 2;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 1px solid var(--line);
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}

/* ===== CARD ===== */
.card {
  background: var(--glass);
  backdrop-filter: blur(18px) saturate(1.15);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  min-width: 0;
  position: relative;
}
.card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.card-hd h3 { font: 500 12px/1 var(--sans); color: var(--fg-2); }
.card-hd .aside { font: 500 11px/1 var(--sans); color: var(--fg-3); }

/* ===== DUEL CARD ===== */
.headline-banner {
  background: linear-gradient(135deg, rgba(204,31,31,.08), rgba(27,58,138,.08));
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 0;
}
.headline-label { font: 500 10px/1 var(--sans); color: var(--fg-3); letter-spacing: .05em; text-transform: uppercase; margin-bottom: 8px; }
.headline-text { font: 400 22px/1.1 var(--serif); color: var(--fg); letter-spacing: -.01em; margin-bottom: 0; }
.headline-text strong { font-weight: 400; }
.headline-text .red { color: var(--lula-light); }
.headline-text .blue { color: var(--bolsonaro-light); }

/* Candidate duel */
.duel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-items: start;
}
.cand-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.cand-card.right { align-items: flex-end; text-align: right; }

.cand-avatar {
  width: 48px; height: 56px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex: none;
}
.cand-avatar-inner {
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 600 18px/1 var(--sans);
  color: #fff;
}
.av-lula { background: linear-gradient(180deg, transparent 16%, var(--lula-color) 16%); }
.av-bolsonaro { background: linear-gradient(180deg, transparent 16%, var(--bolsonaro-color) 16%); }

.cand-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px; height: 18px;
  padding: 0 5px;
  border-radius: 4px;
  font: 600 10px/1 var(--sans);
  letter-spacing: .06em;
  color: #fff;
  flex: none;
}
.num-lula { background: var(--lula-color); }
.num-bolsonaro { background: var(--bolsonaro-color); }

.cand-who {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.cand-card.right .cand-who { flex-direction: row-reverse; }

.cand-name {
  font: 500 13px/1.2 var(--sans);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cand-party { font: 500 10px/1 var(--sans); color: var(--fg-3); }

.cand-pct {
  font: 300 40px/.95 var(--serif);
  letter-spacing: -.025em;
  white-space: nowrap;
}
.cand-pct sup { font-size: .4em; vertical-align: .95em; line-height: 0; margin-left: .04em; letter-spacing: 0; }
.pct-lula { color: var(--lula-light); }
.pct-bolsonaro { color: var(--bolsonaro-light); }

.cand-votes { font: 400 11px/1.3 var(--sans); color: var(--fg-3); white-space: nowrap; }

/* Progress bar duel */
.bar-duel {
  position: relative;
  margin: 4px 0 2px;
}
.bar-duel-track {
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--panel-3);
  display: flex;
}
.bar-segment {
  height: 100%;
  transition: flex-grow .8s cubic-bezier(.2,.1,.8,.9);
}
.bar-lula { background: var(--lula-color); }
.bar-bolsonaro { background: var(--bolsonaro-color); }
.bar-mid {
  position: absolute;
  top: -5px; bottom: -5px;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background: var(--fg);
  box-shadow: 0 0 0 1px rgba(15,14,13,.8);
}

.diff-row {
  display: flex;
  justify-content: space-between;
  font: 500 11px/1.2 var(--sans);
  color: var(--fg-3);
  margin-top: 3px;
}
.diff-row .val { color: var(--fg-2); }

/* Separator */
.sep { height: 1px; background: var(--line); margin: 4px 0; flex: none; }

/* KV row */
.kv-list { display: flex; flex-direction: column; gap: 7px; }
.kv { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font: 500 11px/1.2 var(--sans); }
.kv span { color: var(--fg-3); white-space: nowrap; }
.kv b { font-weight: 500; color: var(--fg); text-align: right; white-space: nowrap; }

/* State chip grid */
.state-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.state-chip {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 5px;
  border-radius: 4px;
  font: 600 10px/1 var(--sans);
  letter-spacing: .04em;
  transition: box-shadow var(--hover) var(--ease), transform var(--hover) var(--ease);
}
.state-chip:hover { box-shadow: 0 0 0 2px var(--fg); transform: scale(1.05); }

/* Turnout stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  margin-top: 2px;
}
.stat { display: flex; flex-direction: column; gap: 3px; }
.stat-label { font: 500 10px/1 var(--sans); color: var(--fg-3); }
.stat-val { font: 500 15px/1 var(--sans); color: var(--fg); font-variant-numeric: tabular-nums; }

/* Chart area */
.chart-area {
  position: relative;
  height: 120px;
  margin-top: 4px;
}
.chart-area canvas { display: block; width: 100%; height: 100%; }
.chart-legend {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font: 500 11px/1 var(--sans);
  color: var(--fg-3);
}
.chart-legend span { display: inline-flex; align-items: center; gap: 5px; }
.chart-legend i { width: 18px; height: 2px; border-radius: 1px; display: inline-block; }

/* ===== MAP AREA ===== */
#map-area {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  overflow: hidden;
  background: radial-gradient(110% 90% at 55% 50%, #141310, #0f0e0d 58%, #0b0a09);
}

#map-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  z-index: 5;
  pointer-events: none;
}
#map-controls > * { pointer-events: auto; }

.map-mode-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(21,20,18,.88);
  border: 1px solid var(--line-2);
  border-radius: 100px;
  padding: 3px;
  backdrop-filter: blur(12px);
}
.map-mode-btn {
  all: unset;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 100px;
  font: 500 11px/1 var(--sans);
  color: var(--fg-3);
  transition: background var(--hover) var(--ease), color var(--hover) var(--ease);
  white-space: nowrap;
}
.map-mode-btn:hover { color: var(--fg-2); background: rgba(250,250,249,.06); }
.map-mode-btn.active { background: rgba(250,250,249,.14); color: var(--fg); box-shadow: inset 0 0 0 1px rgba(250,250,249,.12); }

.map-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(21,20,18,.88);
  border: 1px solid var(--line-2);
  border-radius: 100px;
  padding: 6px 14px;
  backdrop-filter: blur(12px);
  font: 500 11px/1 var(--sans);
  color: var(--fg-3);
}
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; flex: none; }

#map-svg-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 20px;
}

#brazil-map {
  width: 100%;
  height: 100%;
  max-width: 900px;
  overflow: visible;
}

.state-path {
  cursor: pointer;
  transition: opacity .15s var(--ease), filter .15s var(--ease);
  stroke: rgba(15,14,13,.5);
  stroke-width: 0.8;
  stroke-linejoin: round;
}
.state-path:hover { opacity: .82; filter: brightness(1.18); }
.state-path.selected { stroke: #fff; stroke-width: 1.8; opacity: 1; filter: brightness(1.12); }

.state-label {
  font: 600 11px/1 var(--sans);
  fill: rgba(250,250,249,.9);
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0,0,0,.7);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.7));
}
.state-pct {
  font: 500 10px/1 var(--sans);
  fill: rgba(250,250,249,.7);
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}

/* Tooltip */
#map-tooltip {
  position: absolute;
  z-index: 8;
  pointer-events: none;
  background: rgba(27,26,23,.96);
  border: 1px solid var(--line-3);
  border-radius: 12px;
  padding: 12px;
  width: 220px;
  box-shadow: 0 12px 32px rgba(0,0,0,.6);
  opacity: 0;
  transition: opacity .12s var(--ease);
}
#map-tooltip.visible { opacity: 1; }
.tip-name { font: 500 13px/1.2 var(--sans); margin-bottom: 8px; }
.tip-name small { display: block; font: 400 10px/1.3 var(--sans); color: var(--fg-3); margin-top: 2px; }
.tip-cand-row { display: flex; align-items: center; gap: 8px; font: 500 11px/1 var(--sans); margin-bottom: 5px; }
.tip-cand-row .pct { margin-left: auto; font-weight: 600; font-variant-numeric: tabular-nums; }
.tip-bar { height: 5px; border-radius: 3px; overflow: hidden; background: var(--panel-3); display: flex; margin-bottom: 8px; }
.tip-stat { font: 400 10px/1.3 var(--sans); color: var(--fg-3); margin-top: 4px; }

/* Zoom controls */
.zoom-ctl {
  position: absolute;
  bottom: 24px;
  left: 14px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 3px;
  border-radius: 100px;
  background: rgba(27,26,23,.88);
  border: 1px solid var(--line);
  backdrop-filter: blur(12px);
}
.zoom-btn {
  all: unset;
  cursor: pointer;
  display: grid;
  place-items: center;
  width: 28px; height: 28px;
  border-radius: 100px;
  color: var(--fg-2);
  transition: background var(--hover) var(--ease), color var(--hover) var(--ease);
  font: 500 16px/1 var(--sans);
}
.zoom-btn:hover { background: var(--panel-3); color: var(--fg); }
.zoom-btn:disabled { color: var(--fg-4); cursor: default; }
.zoom-div { height: 1px; background: var(--line); margin: 1px 3px; }

/* State detail panel */
#state-detail {
  position: absolute;
  bottom: 20px;
  right: 14px;
  z-index: 6;
  width: 220px;
  background: rgba(27,26,23,.96);
  border: 1px solid var(--line-2);
  border-radius: 14px;
  padding: 14px;
  backdrop-filter: blur(18px);
  display: none;
  animation: slideUp .25s var(--ease-out);
}
#state-detail.visible { display: block; }
@keyframes slideUp { from { opacity:0; transform: translateY(8px); } }
.detail-close {
  all: unset;
  cursor: pointer;
  position: absolute;
  top: 10px; right: 10px;
  width: 22px; height: 22px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: var(--fg-4);
  font-size: 14px;
  transition: background var(--hover) var(--ease), color var(--hover) var(--ease);
}
.detail-close:hover { background: rgba(250,250,249,.08); color: var(--fg); }

/* ===== REGIONAL BREAKDOWN ===== */
.region-list { display: flex; flex-direction: column; gap: 0; }
.region-row {
  display: grid;
  grid-template-columns: 80px minmax(0,1fr) 52px;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font: 500 12px/1.2 var(--sans);
}
.region-row:last-child { border-bottom: 0; }
.region-name { color: var(--fg-2); }
.region-name small { display: block; font: 400 10px/1.3 var(--sans); color: var(--fg-4); margin-top: 2px; }
.region-bar { height: 4px; border-radius: 2px; overflow: hidden; background: var(--panel-3); display: flex; margin-top: 4px; }
.region-pct { text-align: right; font-variant-numeric: tabular-nums; }
.region-leader-info {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.region-avatar {
  width: 22px; height: 22px;
  border-radius: 999px;
  flex: none;
  display: grid;
  place-items: center;
  font: 600 8px/1 var(--sans);
  color: #fff;
  overflow: hidden;
}

/* ===== LIVE FEED ===== */
.feed { display: flex; flex-direction: column; gap: 0; flex: 1 1 0; min-height: 0; overflow-y: auto; }
.feed-item {
  display: grid;
  grid-template-columns: 40px 22px minmax(0,1fr);
  gap: 8px;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}
.feed-item:last-child { border-bottom: 0; }
.feed-time { font: 500 10px/1 var(--sans); color: var(--fg-4); font-variant-numeric: tabular-nums; text-align: right; }
.feed-icon {
  width: 22px; height: 22px;
  border-radius: 999px;
  border: 1.5px solid var(--line-2);
  display: grid;
  place-items: center;
  flex: none;
}
.feed-text { font: 400 12px/1.4 var(--sans); color: var(--fg-2); }
.feed-text b { font-weight: 500; color: var(--fg); }
.feed-text .red { color: var(--lula-light); font-weight: 500; }
.feed-text .blue { color: var(--bolsonaro-light); font-weight: 500; }
.feed-sections { font: 500 11px/1 var(--sans); color: var(--fg-3); }

/* ===== BOTTOM TIMELINE ===== */
#timeline-bar {
  grid-column: 1 / -1;
  grid-row: 3;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  height: 56px;
  border-top: 1px solid var(--line);
  background: rgba(15,14,13,.95);
  backdrop-filter: blur(12px);
  z-index: 10;
}
.timeline-time {
  font: 500 13px/1 var(--sans);
  color: var(--fg);
  font-variant-numeric: tabular-nums;
  min-width: 52px;
}
.timeline-track {
  flex: 1;
  position: relative;
  height: 32px;
  cursor: pointer;
}
.timeline-rail {
  position: absolute;
  left: 0; right: 0; top: 13px;
  height: 6px;
  background: repeating-linear-gradient(90deg, var(--panel-3) 0 3px, transparent 3px 6px);
  border-radius: 100px;
}
.timeline-progress {
  position: absolute;
  left: 0; top: 13px;
  height: 6px;
  background: rgba(250,250,249,.3);
  border-radius: 100px;
  transition: width .5s var(--ease);
}
.timeline-thumb {
  position: absolute;
  top: 8px;
  width: 16px; height: 16px;
  border-radius: 999px;
  background: var(--fg);
  box-shadow: 0 0 0 3px rgba(15,14,13,.8), 0 2px 8px rgba(0,0,0,.6);
  margin-left: -8px;
  transition: left .5s var(--ease);
  z-index: 3;
}
.timeline-hours {
  position: absolute;
  left: 0; right: 0;
  top: 22px;
  display: flex;
  justify-content: space-between;
  font: 500 10px/1 var(--sans);
  color: var(--fg-4);
  pointer-events: none;
}
.timeline-event {
  position: absolute;
  top: 12px;
  width: 8px; height: 8px;
  margin-left: -4px;
  border-radius: 999px;
  background: var(--fg-3);
}
.timeline-right {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
  flex: none;
}
.viewers {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: 500 11px/1 var(--sans);
  color: var(--fg-3);
}
.viewers-num { font-variant-numeric: tabular-nums; color: var(--fg-2); }
.live-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font: 500 12px/1 var(--sans);
  color: var(--fg);
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid var(--line-2);
  background: rgba(21,20,18,.8);
}

/* ===== SEARCH MODAL ===== */
#search-modal {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 80px 16px 16px;
  background: rgba(11,10,9,.8);
  backdrop-filter: blur(6px);
  display: none;
}
#search-modal.open { display: flex; animation: fadeIn .18s var(--ease); }
@keyframes fadeIn { from { opacity: 0; } }
.search-box {
  width: 520px;
  max-width: 100%;
  background: rgba(27,26,23,.97);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,.7);
  animation: slideDown .28s var(--ease-out);
}
@keyframes slideDown { from { opacity:0; transform: translateY(-8px); } }
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--line);
}
.search-input-wrap svg { flex: none; color: var(--fg-3); }
.search-input-wrap input {
  all: unset;
  flex: 1;
  font: 400 15px/1.2 var(--sans);
  color: var(--fg);
}
.search-input-wrap input::placeholder { color: var(--fg-4); }
#search-results { padding: 6px; max-height: 360px; overflow-y: auto; }
.search-group { padding: 6px 10px 3px; font: 500 10px/1 var(--sans); color: var(--fg-4); letter-spacing: .04em; text-transform: uppercase; }
.search-result {
  display: grid;
  grid-template-columns: 32px minmax(0,1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--hover) var(--ease);
  font: 500 12px/1.3 var(--sans);
}
.search-result:hover, .search-result:focus { background: var(--panel-3); outline: none; }
.search-result .uf-badge {
  width: 32px; height: 22px;
  border-radius: 4px;
  display: grid;
  place-items: center;
  font: 600 10px/1 var(--sans);
  letter-spacing: .04em;
}
.search-result .name { color: var(--fg); }
.search-result .sub { font-size: 10px; color: var(--fg-3); margin-top: 1px; }
.search-result .pct { font: 500 12px/1 var(--sans); font-variant-numeric: tabular-nums; }

/* ===== COMPARISON CARD ===== */
.comp-row {
  display: grid;
  grid-template-columns: minmax(0,1fr) 44px minmax(0,1fr);
  gap: 6px;
  align-items: center;
  font: 500 11px/1.2 var(--sans);
  margin-bottom: 6px;
}
.comp-row:last-child { margin-bottom: 0; }
.comp-mid { text-align: center; font: 500 10px/1 var(--sans); color: var(--fg-4); }
.comp-val { font-variant-numeric: tabular-nums; }
.comp-val.red { color: var(--lula-light); }
.comp-val.blue { color: var(--bolsonaro-light); }
.comp-val.right { text-align: right; }

/* ===== ANIMATIONS ===== */
@keyframes enter { from { opacity:0; transform: translateY(6px); } }
.animate-in { animation: enter .4s var(--ease-out) both; }
.animate-in:nth-child(2) { animation-delay: 60ms; }
.animate-in:nth-child(3) { animation-delay: 120ms; }
.animate-in:nth-child(4) { animation-delay: 180ms; }
.animate-in:nth-child(5) { animation-delay: 240ms; }

/* State count chips */
.wins-row { display: flex; align-items: center; gap: 8px; margin: 8px 0 4px; }
.wins-block {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font: 600 12px/1 var(--sans);
}
.wins-block.red { background: rgba(204,31,31,.16); color: var(--lula-light); }
.wins-block.blue { background: rgba(27,58,138,.16); color: var(--bolsonaro-light); }
.wins-label { font: 400 11px/1 var(--sans); color: var(--fg-3); }
.wins-block small { font: 500 10px/1 var(--sans); opacity: .75; margin-left: 2px; }

/* Improvement hint */
.hint-card {
  background: linear-gradient(135deg, rgba(34,197,94,.06), rgba(59,105,232,.06));
  border: 1px solid rgba(34,197,94,.15);
  border-radius: 10px;
  padding: 10px 12px;
}
.hint-card h4 { font: 500 11px/1 var(--sans); color: #22c55e; margin-bottom: 5px; }
.hint-card p { font: 400 11px/1.45 var(--sans); color: var(--fg-3); }

/* ===== TOAST ===== */
#toast-container {
  position: fixed;
  bottom: 76px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}
.toast {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 100px;
  background: rgba(34,32,28,.97);
  border: 1px solid var(--line-2);
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
  font: 500 13px/1 var(--sans);
  color: var(--fg);
  backdrop-filter: blur(16px);
  animation: toastIn .3s var(--ease-out) both, toastOut .3s var(--ease) 2.7s both;
  pointer-events: auto;
}
@keyframes toastIn  { from { opacity:0; transform: translateY(12px) scale(.94); } }
@keyframes toastOut { to   { opacity:0; transform: translateY(8px); } }

/* SVG cursor while panning */
#brazil-map.panning { cursor: grabbing; }
#brazil-map { cursor: default; }
#map-area:not(.zoomed) #brazil-map { cursor: default; }
#map-area.zoomed #brazil-map { cursor: grab; }
#map-area.zoomed #brazil-map.panning { cursor: grabbing; }

/* State entrance animation */
@keyframes stateFadeIn { from { opacity:0; } to { opacity:1; } }
.state-path { animation: stateFadeIn .6s var(--ease-out) both; }
</style>
</head>
<body>
<div id="app">

  <!-- TOP BAR -->
  <header id="topbar">
    <div class="brand">
      <span class="brand-name">Apuração 2026</span>
      <span class="brand-sub">2º turno · 25 de outubro</span>
    </div>

    <nav class="nav-tabs" aria-label="Eleger cargo">
      <button class="nav-tab active" id="tab-presidente">Presidente</button>
    </nav>

    <div class="topbar-right">
      <div class="live-badge">
        <i class="live-dot" id="live-dot"></i>
        <span id="status-text">Atualizado às 22h42 · 99,9% das seções</span>
      </div>

      <button class="search-btn" id="search-open-btn" aria-label="Buscar município ou estado">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Buscar
        <kbd>Ctrl K</kbd>
      </button>

      <button class="icon-btn" id="share-btn" aria-label="Compartilhar" title="Compartilhar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 5.5a2 2 0 100-4 2 2 0 000 4zM5 8a2 2 0 100-4 2 2 0 000 4zM11 10.5a2 2 0 100 4 2 2 0 000-4zM7 6.5l2 1.5M7 9.5l2-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>

      <button class="icon-btn" id="fullscreen-btn" aria-label="Tela cheia" title="Tela cheia">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2h4M2 2v4M14 2h-4M14 2v4M2 14h4M2 14v-4M14 14h-4M14 14v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
  </header>

  <!-- LEFT PANEL -->
  <aside id="left-panel" aria-label="Resultados presidenciais">

    <!-- Headline -->
    <div class="headline-banner animate-in">
      <div class="headline-label">Presidente · Brasil</div>
      <p class="headline-text" id="headline-text">
        <strong class="blue">Flávio Bolsonaro</strong> e <strong class="red">Lula</strong> no 2º turno
      </p>
    </div>

    <!-- Duel card -->
    <div class="card animate-in" id="duel-card">
      <div class="duel">
        <div class="cand-card" id="cand-lula">
          <div class="cand-who">
            <div class="cand-avatar av-lula"><div class="cand-avatar-inner">L</div></div>
            <div>
              <div class="cand-name">Lula</div>
              <div class="cand-party"><span class="cand-number num-lula">PT 13</span></div>
            </div>
          </div>
          <div class="cand-pct pct-lula" id="lula-pct">45,14<sup>%</sup></div>
          <div class="cand-votes" id="lula-votes">53.826.564 votos</div>
        </div>

        <div class="cand-card right" id="cand-bolsonaro">
          <div class="cand-who">
            <div>
              <div class="cand-name">Flávio Bolsonaro</div>
              <div class="cand-party"><span class="cand-number num-bolsonaro">PL 22</span></div>
            </div>
            <div class="cand-avatar av-bolsonaro"><div class="cand-avatar-inner">FB</div></div>
          </div>
          <div class="cand-pct pct-bolsonaro" id="bolsonaro-pct">47,04<sup>%</sup></div>
          <div class="cand-votes" id="bolsonaro-votes">56.090.943 votos</div>
        </div>
      </div>

      <div class="bar-duel" style="margin:10px 0 4px">
        <div class="bar-duel-track">
          <div class="bar-segment bar-lula" id="bar-lula" style="flex-grow:45.14"></div>
          <div class="bar-segment bar-bolsonaro" id="bar-bolsonaro" style="flex-grow:47.04"></div>
        </div>
        <div class="bar-mid"></div>
      </div>

      <div class="diff-row">
        <span>Diferença <b class="val" id="diff-pts">1,90 pts</b> · <b class="val" id="diff-votes">2,3 milhões de votos</b></span>
      </div>

      <div class="sep" style="margin:10px 0"></div>

      <!-- State wins -->
      <div style="margin-bottom:4px">
        <div style="font:500 10px/1 var(--sans);color:var(--fg-3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Estados vencidos</div>
        <div class="wins-row">
          <div class="wins-block red" id="lula-states-count"><span id="lula-wins">12</span><small>estados</small></div>
          <div class="wins-block blue" id="bolsonaro-states-count"><span id="bol-wins">15</span><small>estados</small></div>
          <span class="wins-label">+ DF</span>
        </div>
        <div class="state-chips" id="lula-chips"></div>
        <div class="state-chips" id="bol-chips" style="margin-top:4px"></div>
      </div>

      <div class="sep" style="margin:10px 0"></div>
      <div class="kv-list">
        <div class="kv"><span>2º turno</span><b>Em 25 de outubro</b></div>
        <div class="kv"><span>Apuração</span><b id="apurado-txt">99,9% das seções</b></div>
      </div>
    </div>

    <!-- Stats card -->
    <div class="card animate-in">
      <div class="stats-grid">
        <div class="stat"><div class="stat-label">Votos válidos</div><div class="stat-val" id="votos-validos">119,2 mi</div></div>
        <div class="stat"><div class="stat-label">Comparecimento</div><div class="stat-val">78,9%</div></div>
        <div class="stat"><div class="stat-label">Brancos e nulos</div><div class="stat-val">4,8%</div></div>
      </div>
    </div>

    <!-- Timeline chart card -->
    <div class="card animate-in">
      <div class="card-hd">
        <h3>Ao longo da apuração</h3>
      </div>
      <div class="chart-legend">
        <span><i style="background:var(--lula-color)"></i>Lula</span>
        <span><i style="background:var(--bolsonaro-color)"></i>Flávio Bolsonaro</span>
      </div>
      <div class="chart-area">
        <canvas id="trend-chart" width="260" height="120"></canvas>
      </div>
    </div>

    <!-- 1st round comparison -->
    <div class="card animate-in">
      <div class="card-hd"><h3>Comparação com 1º turno</h3></div>
      <div class="comp-row">
        <span class="comp-val red">45,14%</span>
        <span class="comp-mid">Lula</span>
        <span class="comp-val red right">42,06%</span>
      </div>
      <div class="comp-row" style="margin-bottom:8px">
        <span class="comp-val" style="color:var(--fg-4);font:400 10px/1 var(--sans)">2º turno</span>
        <span class="comp-mid"></span>
        <span class="comp-val right" style="color:var(--fg-4);font:400 10px/1 var(--sans)">1º turno</span>
      </div>
      <div class="comp-row">
        <span class="comp-val blue">47,04%</span>
        <span class="comp-mid">Flávio</span>
        <span class="comp-val blue right">43,68%</span>
      </div>
      <div class="comp-row">
        <span class="comp-val" style="color:var(--fg-4);font:400 10px/1 var(--sans)">2º turno</span>
        <span class="comp-mid"></span>
        <span class="comp-val right" style="color:var(--fg-4);font:400 10px/1 var(--sans)">1º turno</span>
      </div>
    </div>

    <!-- Improvement card -->
    <div class="hint-card animate-in">
      <h4>✦ Melhoria 2º turno</h4>
      <p>Clique em qualquer estado no mapa para ver os resultados detalhados. Passe o mouse para comparar com o 1º turno.</p>
    </div>

  </aside>

  <!-- MAP AREA -->
  <main id="map-area" aria-label="Mapa eleitoral do Brasil">
    <div id="map-controls">
      <nav class="map-mode-switcher" aria-label="Modo do mapa">
        <button class="map-mode-btn active" data-mode="estados" id="mode-estados">Estados</button>
        <button class="map-mode-btn" data-mode="vantagem" id="mode-vantagem">Vantagem</button>
        <button class="map-mode-btn" data-mode="apurado" id="mode-apurado">Apurado</button>
      </nav>
      <div class="map-legend" id="map-legend">
        <span class="legend-item"><i class="legend-dot" style="background:var(--bolsonaro-color)"></i>PL</span>
        <span class="legend-item"><i class="legend-dot" style="background:var(--lula-color)"></i>PT</span>
      </div>
    </div>

    <div id="map-svg-wrapper">
      <svg id="brazil-map" viewBox="10 10 979 920" xmlns="http://www.w3.org/2000/svg" aria-label="Mapa do Brasil com resultados eleitorais">
        <g id="states-group"></g>
        <g id="labels-group" aria-hidden="true"></g>
      </svg>
    </div>

    <div id="map-tooltip" role="tooltip" aria-live="polite"></div>

    <div class="zoom-ctl" aria-label="Controles de zoom">
      <button class="zoom-btn" id="zoom-in" aria-label="Aproximar">+</button>
      <div class="zoom-div"></div>
      <button class="zoom-btn" id="zoom-out" aria-label="Afastar">−</button>
    </div>

    <div id="state-detail" class="card" aria-live="polite">
      <button class="detail-close" id="detail-close" aria-label="Fechar">×</button>
      <div id="state-detail-content"></div>
    </div>
  </main>

  <!-- RIGHT PANEL -->
  <aside id="right-panel" aria-label="Resultados por região e atualizações">

    <!-- Regional card -->
    <div class="card animate-in">
      <div class="card-hd">
        <h3>Por região</h3>
        <span class="aside">Quem lidera para presidente</span>
      </div>
      <div class="region-list" id="region-list"></div>
    </div>

    <!-- Live feed -->
    <div class="card animate-in" style="flex:1 1 0;min-height:0;display:flex;flex-direction:column">
      <div class="card-hd" style="flex:none">
        <h3>Últimas atualizações</h3>
      </div>
      <div class="feed" id="live-feed" aria-live="polite" aria-atomic="false" aria-relevant="additions"></div>
    </div>

  </aside>

  <!-- TIMELINE BAR -->
  <footer id="timeline-bar" aria-label="Linha do tempo da apuração">
    <span class="timeline-time" id="tl-time">22:44:39</span>
    <div class="timeline-track" id="tl-track" role="slider" aria-label="Linha do tempo" aria-valuemin="17" aria-valuemax="23" aria-valuenow="22.74" tabindex="0">
      <div class="timeline-rail"></div>
      <div class="timeline-progress" id="tl-progress" style="width:96.3%"></div>
      <div class="timeline-thumb" id="tl-thumb" style="left:96.3%"></div>
      <div class="timeline-hours">
        <span>17h</span><span>18h</span><span>19h</span><span>20h</span><span>21h</span><span>22h</span><span>23h</span>
      </div>
    </div>
    <div class="timeline-right">
      <div class="viewers">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4.5" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 11c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <span class="viewers-num" id="viewers-count">12.170</span>
        <span>pessoas agora</span>
      </div>
      <div class="live-chip">
        <i class="live-dot"></i>
        Ao vivo
      </div>
    </div>
  </footer>

</div>

<!-- SEARCH MODAL -->
<div id="search-modal" role="dialog" aria-label="Buscar estado" aria-modal="true">
  <div class="search-box">
    <div class="search-input-wrap">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input id="search-input" type="text" placeholder="Buscar estado…" autocomplete="off">
      <button id="search-cancel" style="all:unset;cursor:pointer;font:500 12px/1 var(--sans);color:var(--fg-3);padding:4px 6px">Cancelar</button>
    </div>
    <div id="search-results"></div>
  </div>
</div>

<!-- TOAST CONTAINER -->
<div id="toast-container" aria-live="polite" aria-atomic="false"></div>

<script>
// ===== DATA =====
const SVG_PATHS = ${svgPathsData};
const STATE_RESULTS = ${stateResultsData};
const STATE_NAMES = ${stateNamesData};

const REGIONS = {
  Norte: ['AC','AM','AP','PA','RO','RR','TO'],
  Nordeste: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'],
  'Centro-Oeste': ['DF','GO','MS','MT'],
  Sudeste: ['ES','MG','RJ','SP'],
  Sul: ['PR','RS','SC']
};

const PARTY_COLORS = {
  PT: { bg: '#CC1F1F', text: '#fff' },
  PL: { bg: '#1B3A8A', text: '#fff' }
};

// ===== COLORS BY STATE =====
function getStateColor(uf, mode) {
  const r = STATE_RESULTS[uf];
  if (!r) return '#2a2825';
  
  if (mode === 'estados') {
    const winner = r.lula > r.bolsonaro ? 'lula' : 'bolsonaro';
    const margin = Math.abs(r.lula - r.bolsonaro);
    if (winner === 'lula') {
      if (margin > 30) return '#9a1515';
      if (margin > 15) return '#b82020';
      if (margin > 5) return '#CC2828';
      return '#e04545';
    } else {
      if (margin > 30) return '#102268';
      if (margin > 15) return '#1a318a';
      if (margin > 5) return '#2244aa';
      return '#3b5ed6';
    }
  }
  
  if (mode === 'vantagem') {
    const margin = r.lula - r.bolsonaro;
    const abs = Math.abs(margin);
    if (margin > 0) {
      if (abs > 30) return '#7a1111';
      if (abs > 20) return '#9a1818';
      if (abs > 10) return '#b82020';
      if (abs > 5) return '#CC2828';
      return '#e04040';
    } else {
      if (abs > 30) return '#0e1d5c';
      if (abs > 20) return '#162a7a';
      if (abs > 10) return '#1e3a8a';
      if (abs > 5) return '#2850b8';
      return '#3b67e0';
    }
  }

  if (mode === 'apurado') {
    const pct = r.apurado / 100;
    const g = Math.round(55 + pct * 80);
    return \`rgb(40, \${g}, 50)\`;
  }
  
  return '#2a2825';
}

// ===== DRAW MAP =====
let currentMode = 'estados';
let selectedUF = null;
let zoomScale = 1;
let zoomX = 0, zoomY = 0;

function buildMap() {
  const statesGroup = document.getElementById('states-group');
  const labelsGroup = document.getElementById('labels-group');
  statesGroup.innerHTML = '';
  labelsGroup.innerHTML = '';

  for (const [uf, data] of Object.entries(SVG_PATHS)) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', data.d);
    path.setAttribute('class', 'state-path');
    path.setAttribute('id', 'state-' + uf);
    path.setAttribute('fill', getStateColor(uf, currentMode));
    path.setAttribute('data-uf', uf);
    path.setAttribute('aria-label', STATE_NAMES[uf] + ': ' + formatResult(uf));
    path.setAttribute('role', 'button');
    path.setAttribute('tabindex', '0');
    statesGroup.appendChild(path);

    // Label
    const [cx, cy] = data.center;
    const txtUF = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtUF.setAttribute('x', cx);
    txtUF.setAttribute('y', cy - 5);
    txtUF.setAttribute('class', 'state-label');
    txtUF.textContent = uf;
    labelsGroup.appendChild(txtUF);

    // Percentage
    const r = STATE_RESULTS[uf];
    if (r) {
      const winner = r.lula > r.bolsonaro ? r.lula : r.bolsonaro;
      const txtPct = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txtPct.setAttribute('x', cx);
      txtPct.setAttribute('y', cy + 8);
      txtPct.setAttribute('class', 'state-pct');
      txtPct.textContent = winner.toFixed(0) + '%';
      labelsGroup.appendChild(txtPct);
    }

    path.addEventListener('mouseenter', (e) => showTooltip(e, uf));
    path.addEventListener('mouseleave', hideTooltip);
    path.addEventListener('mousemove', (e) => moveTooltip(e));
    path.addEventListener('click', () => selectState(uf));
    path.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectState(uf); } });
  }
}

function updateMapColors() {
  for (const [uf, data] of Object.entries(SVG_PATHS)) {
    const path = document.getElementById('state-' + uf);
    if (path) path.setAttribute('fill', getStateColor(uf, currentMode));
  }
}

function formatResult(uf) {
  const r = STATE_RESULTS[uf];
  if (!r) return '';
  const winner = r.lula > r.bolsonaro ? 'Lula' : 'Flávio Bolsonaro';
  const pct = Math.max(r.lula, r.bolsonaro).toFixed(1) + '%';
  return \`\${winner} \${pct}\`;
}

// ===== TOOLTIP =====
const tooltip = document.getElementById('map-tooltip');
let tooltipUF = null;

function showTooltip(e, uf) {
  tooltipUF = uf;
  const r = STATE_RESULTS[uf];
  if (!r) return;
  
  const lulaWins = r.lula > r.bolsonaro;
  const margin = Math.abs(r.lula - r.bolsonaro).toFixed(1);
  
  tooltip.innerHTML = \`
    <div class="tip-name">\${STATE_NAMES[uf]}<small>\${r.region}</small></div>
    <div class="tip-cand-row">
      <span style="color:var(--lula-light)">Lula</span>
      <span class="pct" style="color:var(--lula-light)">\${r.lula.toFixed(1)}%</span>
    </div>
    <div class="tip-cand-row">
      <span style="color:var(--bolsonaro-light)">Flávio Bolsonaro</span>
      <span class="pct" style="color:var(--bolsonaro-light)">\${r.bolsonaro.toFixed(1)}%</span>
    </div>
    <div class="tip-bar">
      <div class="bar-segment bar-lula" style="flex-grow:\${r.lula}"></div>
      <div class="bar-segment bar-bolsonaro" style="flex-grow:\${r.bolsonaro}"></div>
    </div>
    <div class="tip-stat">Vantagem: <b style="color:\${lulaWins ? 'var(--lula-light)' : 'var(--bolsonaro-light)'}">\${lulaWins ? 'Lula' : 'Flávio'} +\${margin}pts</b></div>
    <div class="tip-stat">\${r.apurado.toFixed(1)}% das seções apuradas</div>
  \`;
  tooltip.classList.add('visible');
  moveTooltip(e);
}

function moveTooltip(e) {
  const mapRect = document.getElementById('map-area').getBoundingClientRect();
  let x = e.clientX - mapRect.left + 14;
  let y = e.clientY - mapRect.top - 60;
  if (x + 230 > mapRect.width) x = e.clientX - mapRect.left - 230;
  if (y < 0) y = 0;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  tooltipUF = null;
}

// ===== STATE SELECTION =====
function selectState(uf) {
  if (selectedUF === uf) {
    deselectState();
    return;
  }
  if (selectedUF) document.getElementById('state-' + selectedUF)?.classList.remove('selected');
  selectedUF = uf;
  document.getElementById('state-' + uf)?.classList.add('selected');
  showStateDetail(uf);
}

function deselectState() {
  if (selectedUF) {
    document.getElementById('state-' + selectedUF)?.classList.remove('selected');
    selectedUF = null;
  }
  document.getElementById('state-detail').classList.remove('visible');
}

function showStateDetail(uf) {
  const r = STATE_RESULTS[uf];
  if (!r) return;
  const lulaWins = r.lula > r.bolsonaro;
  const margin = Math.abs(r.lula - r.bolsonaro).toFixed(1);
  const detail = document.getElementById('state-detail-content');
  detail.innerHTML = \`
    <div style="margin-bottom:10px">
      <div style="font:500 13px/1.2 var(--sans);color:var(--fg)">\${STATE_NAMES[uf]}</div>
      <div style="font:400 10px/1.3 var(--sans);color:var(--fg-3);margin-top:2px">\${r.region} · \${r.apurado.toFixed(1)}% apurado</div>
    </div>
    <div class="kv-list">
      <div class="kv"><span style="color:var(--lula-light)">Lula</span><b style="color:var(--lula-light)">\${r.lula.toFixed(2)}%</b></div>
      <div class="kv"><span style="color:var(--bolsonaro-light)">Flávio Bolsonaro</span><b style="color:var(--bolsonaro-light)">\${r.bolsonaro.toFixed(2)}%</b></div>
    </div>
    <div class="bar-duel" style="margin:10px 0 4px">
      <div class="bar-duel-track" style="height:6px">
        <div class="bar-segment bar-lula" style="flex-grow:\${r.lula}"></div>
        <div class="bar-segment bar-bolsonaro" style="flex-grow:\${r.bolsonaro}"></div>
      </div>
      <div class="bar-mid"></div>
    </div>
    <div style="font:400 11px/1.3 var(--sans);color:var(--fg-3);margin-top:6px">
      <b style="color:\${lulaWins ? 'var(--lula-light)' : 'var(--bolsonaro-light)'}">
        \${lulaWins ? 'Lula' : 'Flávio Bolsonaro'} vence por \${margin} pontos
      </b>
    </div>
  \`;
  document.getElementById('state-detail').classList.add('visible');
}

// ===== REGION LIST =====
function buildRegionList() {
  const container = document.getElementById('region-list');
  const regionTotals = {};
  
  for (const [region, states] of Object.entries(REGIONS)) {
    let totalLula = 0, totalBol = 0, count = 0;
    for (const uf of states) {
      const r = STATE_RESULTS[uf];
      if (r) { totalLula += r.lula; totalBol += r.bolsonaro; count++; }
    }
    if (count > 0) {
      regionTotals[region] = {
        lula: totalLula / count,
        bolsonaro: totalBol / count,
        missing: states.filter(uf => STATE_RESULTS[uf]?.apurado < 100).length,
        total: states.length
      };
    }
  }

  for (const [region, data] of Object.entries(regionTotals)) {
    const lulaWins = data.lula > data.bolsonaro;
    const winner = lulaWins ? 'Lula' : 'Flávio';
    const pct = (lulaWins ? data.lula : data.bolsonaro).toFixed(1);
    const color = lulaWins ? 'var(--lula-light)' : 'var(--bolsonaro-light)';
    const bgColor = lulaWins ? 'var(--lula-color)' : 'var(--bolsonaro-color)';
    const margin = (data.lula - data.bolsonaro).toFixed(1);
    const marginSign = data.lula > data.bolsonaro ? '+' : '';
    
    const row = document.createElement('div');
    row.className = 'region-row';
    row.innerHTML = \`
      <div class="region-name">
        \${region}
        <small>\${data.missing > 0 ? 'faltam ' + data.missing + ' estados' : '100%'}</small>
      </div>
      <div>
        <div class="region-leader-info">
          <div class="region-avatar" style="background:\${bgColor}">\${winner.slice(0,1)}</div>
          <div>
            <div style="font:500 11px/1.1 var(--sans);color:\${color}">\${winner}</div>
            <div class="region-bar" style="margin-top:4px">
              <div class="bar-segment bar-lula" style="flex-grow:\${data.lula}"></div>
              <div class="bar-segment bar-bolsonaro" style="flex-grow:\${data.bolsonaro}"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="region-pct" style="color:\${color}">\${pct}%<br><small style="color:var(--fg-4)">\${marginSign}\${margin}pts</small></div>
    \`;
    container.appendChild(row);
  }
}

// ===== STATE CHIPS =====
function buildStateChips() {
  const lulaChips = document.getElementById('lula-chips');
  const bolChips = document.getElementById('bol-chips');
  let lulaCount = 0, bolCount = 0;
  
  for (const [uf, r] of Object.entries(STATE_RESULTS)) {
    const chip = document.createElement('button');
    chip.className = 'state-chip';
    chip.textContent = uf;
    chip.title = STATE_NAMES[uf];
    chip.setAttribute('aria-label', \`\${STATE_NAMES[uf]} - \${r.lula > r.bolsonaro ? 'Lula' : 'Flávio Bolsonaro'}\`);
    
    if (r.lula > r.bolsonaro) {
      chip.style.background = 'rgba(204,31,31,.2)';
      chip.style.color = 'var(--lula-light)';
      lulaChips.appendChild(chip);
      lulaCount++;
    } else {
      chip.style.background = 'rgba(27,58,138,.2)';
      chip.style.color = 'var(--bolsonaro-light)';
      bolChips.appendChild(chip);
      bolCount++;
    }
    
    chip.addEventListener('click', () => {
      selectState(uf);
      // scroll map to state
    });
  }
  
  document.getElementById('lula-wins').textContent = lulaCount;
  document.getElementById('bol-wins').textContent = bolCount;
}

// ===== LIVE FEED =====
const feedData = [
  { time: '22:43', type: 'sections', sections: 5, uf: 'BA', lula: 47.0, bol: 45.1 },
  { time: '22:42', type: 'sections', sections: 10, uf: null, lula: 47.0, bol: 45.1 },
  { time: '22:41', type: 'elected', text: 'Paraná: Flipe Barros e Deltan Dallagnol são eleitos para o Senado.' },
  { time: '22:41', type: 'sections', sections: 33, uf: null, lula: 47.0, bol: 45.1 },
  { time: '22:39', type: 'sections', sections: 14, uf: null, lula: 47.0, bol: 45.1 },
  { time: '22:38', type: 'elected', text: 'Pernambuco: Humberto Costa e Marília Arraes são eleitos para o Senado.' },
  { time: '22:37', type: 'sections', sections: 9, uf: null, lula: 47.0, bol: 45.1 },
  { time: '22:36', type: 'sections', sections: 2, uf: null, lula: 47.0, bol: 45.1 },
  { time: '22:34', type: 'sections', sections: 10, uf: null, lula: 47.0, bol: 45.1 },
  { time: '22:33', type: 'elected', text: 'Goiás: Gustavo Gayer é eleito senador.' },
];

function buildFeed() {
  const feed = document.getElementById('live-feed');
  feed.innerHTML = '';
  
  for (const item of feedData) {
    const div = document.createElement('div');
    div.className = 'feed-item';
    
    if (item.type === 'sections') {
      const stateTag = item.uf ? \` <span style="background:var(--panel-3);padding:1px 5px;border-radius:4px;font:600 9px/1.5 var(--sans);letter-spacing:.05em">\${item.uf}</span>\` : '';
      div.innerHTML = \`
        <span class="feed-time">\${item.time}</span>
        <div class="feed-icon" style="border-color:rgba(250,250,249,.12)">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.5"/></svg>
        </div>
        <div>
          <div class="feed-sections">+\${item.sections} seções\${stateTag}</div>
          <div class="feed-text"><span class="blue">Flávio Bolsonaro \${item.bol}%</span> · <span class="red">Lula \${item.lula}%</span></div>
        </div>
      \`;
    } else {
      div.innerHTML = \`
        <span class="feed-time">\${item.time}</span>
        <div class="feed-icon" style="background:var(--panel-3)">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="feed-text">\${item.text}</div>
      \`;
    }
    
    feed.appendChild(div);
  }
}

// ===== TREND CHART =====
function drawChart() {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 260;
  const H = canvas.offsetHeight || 120;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  // Data points (simulated trend throughout the night)
  const lulaData = [44.2, 45.8, 46.1, 45.5, 44.9, 44.2, 44.8, 45.1, 45.1, 45.14];
  const bolData  = [41.8, 42.5, 43.2, 46.0, 47.5, 47.8, 47.2, 47.0, 47.0, 47.04];
  
  const minY = 38, maxY = 54;
  const padL = 28, padR = 8, padT = 8, padB = 18;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  
  function px(i, val) {
    return [
      padL + (i / (lulaData.length - 1)) * drawW,
      padT + drawH - ((val - minY) / (maxY - minY)) * drawH
    ];
  }
  
  // Gridlines
  ctx.strokeStyle = 'rgba(250,250,249,.06)';
  ctx.lineWidth = 1;
  for (let v of [40, 44, 48, 52]) {
    const y = padT + drawH - ((v - minY) / (maxY - minY)) * drawH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = 'rgba(250,250,249,.25)';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(v + '%', 0, y + 3);
  }
  
  // Draw line helper
  function drawLine(data, color) {
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const [x, y] = px(i, data[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    // Dot at end
    const [lx, ly] = px(data.length - 1, data[data.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  // Area fill - lula
  ctx.beginPath();
  for (let i = 0; i < lulaData.length; i++) {
    const [x, y] = px(i, lulaData[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.lineTo(padL + drawW, padT + drawH);
  ctx.lineTo(padL, padT + drawH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(204,31,31,.08)';
  ctx.fill();
  
  // Area fill - bolsonaro
  ctx.beginPath();
  for (let i = 0; i < bolData.length; i++) {
    const [x, y] = px(i, bolData[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.lineTo(padL + drawW, padT + drawH);
  ctx.lineTo(padL, padT + drawH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(27,58,138,.08)';
  ctx.fill();
  
  drawLine(lulaData, '#CC2828');
  drawLine(bolData, '#2244AA');
  
  // X axis labels
  const hours = ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];
  ctx.fillStyle = 'rgba(250,250,249,.25)';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 10; i += 5) {
    const [x] = px(Math.min(i, lulaData.length - 1), minY);
    ctx.fillText(i === 0 ? '0%' : i === 10 ? '100%' : i * 10 + '%', x, H - 3);
  }
  // Simple: just show 0% and 100%
  ctx.fillText('0%', padL, H - 3);
  ctx.fillText('100%', padL + drawW, H - 3);
}

// ===== ZOOM & PAN =====
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panStart = { x: 0, y: 0 };

function setupZoom() {
  const svg = document.getElementById('brazil-map');
  const mapArea = document.getElementById('map-area');

  // Button zoom
  document.getElementById('zoom-in').addEventListener('click', () => {
    zoomScale = Math.min(5, zoomScale * 1.45);
    applyZoom();
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    zoomScale = Math.max(1, zoomScale / 1.45);
    if (zoomScale <= 1) { zoomX = 0; zoomY = 0; }
    applyZoom();
  });

  // Scroll wheel zoom
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const svgW = rect.width;
    const svgH = rect.height;
    // Zoom toward mouse position
    const prevScale = zoomScale;
    zoomScale = Math.min(5, Math.max(1, zoomScale * factor));
    if (zoomScale <= 1) { zoomX = 0; zoomY = 0; }
    else {
      const cx = 499.5, cy = 470;
      const fx = (mouseX / svgW) * 979 + 10;
      const fy = (mouseY / svgH) * 920 + 10;
      zoomX += (fx - cx) * (prevScale - zoomScale);
      zoomY += (fy - cy) * (prevScale - zoomScale);
    }
    applyZoom();
  }, { passive: false });

  // Drag to pan
  svg.addEventListener('mousedown', (e) => {
    if (zoomScale <= 1) return;
    if (e.target.classList.contains('state-path')) return; // let click propagate
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    panStart = { x: zoomX, y: zoomY };
    svg.classList.add('panning');
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const rect = svg.getBoundingClientRect();
    zoomX = panStart.x + dx * (979 / rect.width);
    zoomY = panStart.y + dy * (920 / rect.height);
    applyZoom();
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    svg.classList.remove('panning');
  });

  // Touch pan (mobile)
  let touchStart = null;
  svg.addEventListener('touchstart', (e) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: zoomX, py: zoomY };
  }, { passive: true });
  svg.addEventListener('touchmove', (e) => {
    if (!touchStart || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStart.x;
    const dy = e.touches[0].clientY - touchStart.y;
    const rect = svg.getBoundingClientRect();
    zoomX = touchStart.px + dx * (979 / rect.width);
    zoomY = touchStart.py + dy * (920 / rect.height);
    applyZoom();
    e.preventDefault();
  }, { passive: false });
  svg.addEventListener('touchend', () => { touchStart = null; });
}

function applyZoom() {
  const g1 = document.getElementById('states-group');
  const g2 = document.getElementById('labels-group');
  const mapArea = document.getElementById('map-area');
  const cx = 499.5, cy = 470;
  const transform = \`translate(\${cx - cx * zoomScale + zoomX}, \${cy - cy * zoomScale + zoomY}) scale(\${zoomScale})\`;
  g1.setAttribute('transform', transform);
  g2.setAttribute('transform', transform);

  // Scale down stroke width to stay at 0.8px regardless of zoom
  document.querySelectorAll('.state-path').forEach(p => {
    p.style.strokeWidth = (0.8 / zoomScale) + 'px';
  });

  document.getElementById('zoom-in').disabled = zoomScale >= 5;
  document.getElementById('zoom-out').disabled = zoomScale <= 1;
  mapArea.classList.toggle('zoomed', zoomScale > 1);
}

// ===== MAP MODE SWITCHER =====
document.querySelectorAll('.map-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.map-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    updateMapColors();
    updateLegend();
  });
});

function updateLegend() {
  const legend = document.getElementById('map-legend');
  if (currentMode === 'estados') {
    legend.innerHTML = \`
      <span class="legend-item"><i class="legend-dot" style="background:var(--bolsonaro-color)"></i>PL</span>
      <span class="legend-item"><i class="legend-dot" style="background:var(--lula-color)"></i>PT</span>
    \`;
  } else if (currentMode === 'vantagem') {
    legend.innerHTML = \`
      <span class="legend-item"><i class="legend-dot" style="background:var(--bolsonaro-color)"></i>PL forte</span>
      <span class="legend-item"><i class="legend-dot" style="background:#3b5ed6"></i>PL fraca</span>
      <span class="legend-item"><i class="legend-dot" style="background:#e04040"></i>PT fraca</span>
      <span class="legend-item"><i class="legend-dot" style="background:var(--lula-color)"></i>PT forte</span>
    \`;
  } else if (currentMode === 'apurado') {
    legend.innerHTML = \`
      <span class="legend-item"><i class="legend-dot" style="background:rgb(40,80,50)"></i>Parcial</span>
      <span class="legend-item"><i class="legend-dot" style="background:rgb(40,135,50)"></i>Apurado</span>
    \`;
  }
}

// ===== SEARCH =====
const searchModal = document.getElementById('search-modal');
const searchInput = document.getElementById('search-input');

document.getElementById('search-open-btn').addEventListener('click', openSearch);
document.getElementById('search-cancel').addEventListener('click', closeSearch);
searchModal.addEventListener('click', (e) => { if (e.target === searchModal) closeSearch(); });

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

function openSearch() {
  searchModal.classList.add('open');
  searchInput.focus();
  renderSearchResults('');
}

function closeSearch() {
  searchModal.classList.remove('open');
}

searchInput.addEventListener('input', () => renderSearchResults(searchInput.value));

function renderSearchResults(query) {
  const container = document.getElementById('search-results');
  const q = query.toLowerCase().trim();
  
  const states = Object.entries(STATE_NAMES).filter(([uf, name]) => {
    return !q || uf.toLowerCase().includes(q) || name.toLowerCase().includes(q) || STATE_RESULTS[uf]?.region?.toLowerCase().includes(q);
  });
  
  container.innerHTML = '';
  
  if (states.length === 0) {
    container.innerHTML = '<div style="padding:16px 12px;font:400 12px/1.4 var(--sans);color:var(--fg-3)">Nenhum resultado encontrado.</div>';
    return;
  }
  
  const group = document.createElement('div');
  group.className = 'search-group';
  group.textContent = 'Estados';
  container.appendChild(group);
  
  for (const [uf, name] of states.slice(0, 12)) {
    const r = STATE_RESULTS[uf];
    const lulaWins = r && r.lula > r.bolsonaro;
    const winner = r ? (lulaWins ? 'Lula' : 'Flávio Bolsonaro') : '';
    const pct = r ? Math.max(r.lula, r.bolsonaro).toFixed(1) + '%' : '';
    const color = lulaWins ? 'var(--lula-color)' : 'var(--bolsonaro-color)';
    
    const item = document.createElement('div');
    item.className = 'search-result';
    item.setAttribute('tabindex', '0');
    item.innerHTML = \`
      <div class="uf-badge" style="background:\${color};color:#fff">\${uf}</div>
      <div>
        <div class="name">\${name}</div>
        <div class="sub">\${r?.region || ''}</div>
      </div>
      <span class="pct" style="color:\${color}">\${pct}</span>
    \`;
    item.addEventListener('click', () => {
      closeSearch();
      selectState(uf);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { closeSearch(); selectState(uf); }
    });
    container.appendChild(item);
  }
}

// ===== TOAST =====
function showToast(message, icon) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = (icon ? icon + ' ' : '') + message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

// ===== SHARE =====
document.getElementById('share-btn').addEventListener('click', async () => {
  const data = {
    title: 'Apuração 2026 · 2º Turno',
    text: 'Acompanhe a apuração do 2º turno: Lula × Flávio Bolsonaro',
    url: window.location.href
  };
  if (navigator.share) {
    await navigator.share(data).catch(() => {});
  } else {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copiado para a área de transferência!', '✓');
    } catch {
      showToast('Copie o link da barra de endereços.', 'ℹ');
    }
  }
});

// ===== FULLSCREEN =====
document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// ===== TIMELINE =====
function updateTimeline() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  document.getElementById('tl-time').textContent = \`\${h}:\${m}:\${s}\`;
}
setInterval(updateTimeline, 1000);
updateTimeline();

// Animated viewers counter
let viewersCount = 12170;
setInterval(() => {
  const delta = Math.floor(Math.random() * 40) - 15;
  viewersCount = Math.max(11000, viewersCount + delta);
  document.getElementById('viewers-count').textContent = viewersCount.toLocaleString('pt-BR');
}, 3000);

// ===== LIVE FEED SIMULATION =====
const additionalFeedItems = [
  { time: null, type: 'sections', sections: 7, uf: null, lula: 45.1, bol: 47.0 },
  { time: null, type: 'elected', text: 'São Paulo: resultado confirmado — <b>Flávio Bolsonaro</b> lidera com 52,9%.' },
  { time: null, type: 'sections', sections: 3, uf: 'MG', lula: 51.8, bol: 48.2 },
];

let feedIndex = 0;
setInterval(() => {
  if (feedIndex >= additionalFeedItems.length) return;
  const item = { ...additionalFeedItems[feedIndex] };
  const now = new Date();
  item.time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  feedData.unshift(item);
  buildFeed();
  feedIndex++;
}, 18000);

// ===== DETAIL CLOSE =====
document.getElementById('detail-close').addEventListener('click', deselectState);

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  buildMap();
  buildStateChips();
  buildRegionList();
  buildFeed();
  setupZoom();
  
  setTimeout(() => {
    drawChart();
  }, 200);
});

// Redraw chart on resize
let chartResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(drawChart, 200);
});
</script>
</body>
</html>`;

fs.writeFileSync('c:/Users/tavares/Documents/mapa/index.html', html);
console.log('Written index.html, size:', (fs.statSync('c:/Users/tavares/Documents/mapa/index.html').size / 1024).toFixed(0), 'KB');
