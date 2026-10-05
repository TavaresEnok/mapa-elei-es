const fs = require('fs');

console.log('Generating ultra-complete proprietary web app with 5,570 municipalities...');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Apuração 2026 · 2º Turno Presidencial · Mapa por Cidade</title>
<meta name="description" content="Mapa oficial e apuração completa do 2º turno das Eleições Presidenciais de 2026 com visualização detalhada de todas as 5.570 cidades do Brasil: Lula × Flávio Bolsonaro.">
<meta name="theme-color" content="#0B0F19">
<meta name="color-scheme" content="dark">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
<style>
/* ===== DESIGN SYSTEM & TOKENS ===== */
:root {
  --bg-base: #0B0F19;
  --bg-surface: #111827;
  --bg-surface-elevated: #162032;
  --bg-card: rgba(17, 24, 39, 0.85);
  --bg-glass: rgba(22, 32, 50, 0.75);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.16);
  --border-highlight: rgba(255, 255, 255, 0.32);
  
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
  --text-tertiary: #9CA3AF;
  --text-muted: #6B7280;

  --lula-primary: #DC2626;
  --lula-light: #EF4444;
  --lula-dark: #991B1B;
  --lula-soft: rgba(220, 38, 38, 0.16);
  --lula-glow: rgba(239, 68, 68, 0.35);

  --bolsonaro-primary: #1D4ED8;
  --bolsonaro-light: #3B82F6;
  --bolsonaro-dark: #1E3A8A;
  --bolsonaro-soft: rgba(29, 78, 216, 0.16);
  --bolsonaro-glow: rgba(59, 130, 246, 0.35);

  --accent-gold: #F59E0B;
  --accent-green: #10B981;

  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Newsreader', Georgia, serif;
  
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --shadow-card: 0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border-subtle);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; background: var(--bg-base); color: var(--text-primary); font-family: var(--font-sans); }
body { font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased; }

/* ===== APP SHELL GRID ===== */
#app {
  display: grid;
  grid-template-columns: 340px 1fr 310px;
  grid-template-rows: 56px 1fr 60px;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* ===== HEADER ===== */
#header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(11, 15, 25, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  z-index: 30;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-title {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #FFF, #D1D5DB);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.brand-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(245, 158, 11, 0.12);
  color: var(--accent-gold);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.header-center {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.04);
  padding: 3px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
}
.nav-pill {
  all: unset;
  cursor: pointer;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  border-radius: var(--radius-full);
  transition: all 0.18s var(--ease-spring);
}
.nav-pill:hover { color: var(--text-primary); }
.nav-pill.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 10px var(--accent-green);
  animation: pulse 2s infinite ease-in-out;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.btn-search {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-tertiary);
  transition: all 0.15s ease;
}
.btn-search:hover {
  background: rgba(255, 255, 255, 0.09);
  color: var(--text-primary);
  border-color: var(--border-medium);
}
.btn-search kbd {
  font-family: inherit;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-subtle);
}

/* ===== LEFT SIDEBAR ===== */
#left-panel {
  grid-column: 1;
  grid-row: 2;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-right: 1px solid var(--border-subtle);
  scrollbar-width: thin;
  scrollbar-color: var(--border-medium) transparent;
}
#left-panel::-webkit-scrollbar { width: 4px; }
#left-panel::-webkit-scrollbar-thumb { background: var(--border-medium); border-radius: 2px; }

.card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-card);
  transition: border-color 0.2s ease;
}
.card:hover { border-color: var(--border-medium); }

/* Duel Card */
.duel-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.duel-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.duel-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.duel-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
}
.duel-title .txt-bolsonaro { color: var(--bolsonaro-light); }
.duel-title .txt-lula { color: var(--lula-light); }

.duel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.candidate-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.candidate-box.right {
  align-items: flex-end;
  text-align: right;
}
.cand-identity {
  display: flex;
  align-items: center;
  gap: 8px;
}
.candidate-box.right .cand-identity {
  flex-direction: row-reverse;
}
.cand-portrait {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  background: var(--bg-surface-elevated);
}
.cand-portrait.lula { border-color: var(--lula-primary); box-shadow: 0 0 10px var(--lula-glow); }
.cand-portrait.bolsonaro { border-color: var(--bolsonaro-primary); box-shadow: 0 0 10px var(--bolsonaro-glow); }

.cand-meta { display: flex; flex-direction: column; }
.cand-tag {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cand-tag.tag-lula { color: var(--lula-light); }
.cand-tag.tag-bolsonaro { color: var(--bolsonaro-light); }
.cand-display-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.cand-percent {
  font-family: var(--font-sans);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-top: 4px;
}
.cand-percent.lula { color: var(--lula-light); }
.cand-percent.bolsonaro { color: var(--bolsonaro-light); }
.cand-percent sup { font-size: 14px; font-weight: 600; margin-left: 1px; }

.cand-vote-count {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}

/* Duel Bar */
.duel-bar-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.duel-bar-track {
  height: 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-full);
  overflow: hidden;
  display: flex;
  position: relative;
}
.duel-bar-fill-lula {
  height: 100%;
  background: linear-gradient(90deg, #B91C1C, var(--lula-primary));
  transition: width 0.6s var(--ease-spring);
}
.duel-bar-fill-bolsonaro {
  height: 100%;
  background: linear-gradient(90deg, var(--bolsonaro-primary), #1E40AF);
  transition: width 0.6s var(--ease-spring);
}
.duel-bar-center {
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: 50%;
  width: 2px;
  background: #FFF;
  transform: translateX(-50%);
  z-index: 2;
  box-shadow: 0 0 6px rgba(0,0,0,0.8);
}
.duel-margin-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 600;
}

/* State Chips */
.states-won-wrap {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.states-won-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.state-chip-btn {
  all: unset;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 7px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  transition: all 0.15s ease;
}
.state-chip-btn:hover {
  transform: translateY(-1px);
  border-color: var(--border-medium);
  color: #FFF;
}
.state-chip-btn.chip-lula {
  background: rgba(220, 38, 38, 0.18);
  border-color: rgba(220, 38, 38, 0.35);
  color: #FCA5A5;
}
.state-chip-btn.chip-bolsonaro {
  background: rgba(29, 78, 216, 0.18);
  border-color: rgba(29, 78, 216, 0.35);
  color: #93C5FD;
}

/* Quick Stats Mini Cards */
.quick-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat-card-mini {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-card-mini .label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
}
.stat-card-mini .val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Chart Canvas Card */
.chart-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chart-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}
.chart-canvas {
  width: 100%;
  height: 90px;
}

/* ===== CENTER MAP VIEWPORT ===== */
#map-viewport {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 50%, #111A2E 0%, #0B0F19 80%);
  overflow: hidden;
  user-select: none;
}

#map-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
  transition: transform 0.05s linear;
}
#map-svg.grabbing {
  cursor: grabbing;
}

/* Municipality Paths */
.map-muni-path {
  cursor: pointer;
  vector-effect: non-scaling-stroke;
  stroke: rgba(0, 0, 0, 0.22);
  stroke-width: 0.35px;
  transition: filter 0.12s ease, stroke 0.12s ease;
}
.map-muni-path:hover {
  stroke: #FFFFFF !important;
  stroke-width: 1.5px !important;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9));
}
.map-muni-path.highlighted {
  stroke: #F59E0B !important;
  stroke-width: 2.2px !important;
  filter: drop-shadow(0 0 10px #F59E0B);
}

/* State Boundary Overlay */
.map-state-boundary {
  fill: none;
  stroke: rgba(255, 255, 255, 0.45);
  stroke-width: 1px;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

/* State Macro Paths */
.map-state-path {
  cursor: pointer;
  stroke: #0B0F19;
  stroke-width: 1.2px;
  stroke-linejoin: round;
  transition: fill 0.2s ease, filter 0.2s ease, stroke 0.2s ease;
  vector-effect: non-scaling-stroke;
}
.map-state-path:hover {
  stroke: #FFF;
  stroke-width: 2px;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.4));
}
.map-state-path.selected {
  stroke: #FFF;
  stroke-width: 2.8px;
  filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.6));
}

.map-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 800;
  fill: #FFF;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
  text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.9);
}
.map-sublabel {
  font-family: var(--font-sans);
  font-size: 9px;
  font-weight: 700;
  fill: rgba(255,255,255,0.9);
  text-anchor: middle;
  pointer-events: none;
}

/* Map Top View Switcher (Munis vs States) */
.map-view-switcher {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  padding: 4px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-medium);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 20;
}
.map-view-btn {
  all: unset;
  cursor: pointer;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-tertiary);
  border-radius: var(--radius-full);
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}
.map-view-btn:hover { color: #FFF; }
.map-view-btn.active {
  background: rgba(255, 255, 255, 0.14);
  color: #FFF;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Map Zoom Level / Active State Pill */
.map-drill-banner {
  position: absolute;
  top: 68px;
  left: 50%;
  transform: translateX(-50%);
  display: none;
  align-items: center;
  gap: 10px;
  background: rgba(22, 32, 50, 0.9);
  backdrop-filter: blur(12px);
  padding: 6px 16px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(245, 158, 11, 0.4);
  font-size: 12px;
  font-weight: 600;
  color: #F9FAFB;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  z-index: 20;
}
.btn-reset-drill {
  all: unset;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-gold);
  transition: all 0.15s ease;
}
.btn-reset-drill:hover { background: rgba(255, 255, 255, 0.2); color: #FFF; }

/* Map Controls Floating */
.map-floating-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 20;
}
.ctrl-btn {
  all: unset;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: all 0.15s ease;
}
.ctrl-btn:hover { background: var(--bg-surface-elevated); border-color: var(--border-medium); transform: scale(1.05); }

/* Legend overlay */
.map-legend {
  position: absolute;
  top: 18px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-card);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  font-size: 11px;
  font-weight: 600;
  z-index: 20;
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; }
.legend-dot.lula { background: var(--lula-primary); }
.legend-dot.bolsonaro { background: var(--bolsonaro-primary); }

/* Tooltip */
#map-tooltip {
  position: absolute;
  display: none;
  pointer-events: none;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.6);
  z-index: 50;
  min-width: 190px;
  transition: opacity 0.1s ease;
}
.tooltip-title { font-size: 13px; font-weight: 700; color: #FFF; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; }
.tooltip-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase; }
.tooltip-badge.lula { background: var(--lula-soft); color: var(--lula-light); border: 1px solid var(--lula-primary); }
.tooltip-badge.bolsonaro { background: var(--bolsonaro-soft); color: var(--bolsonaro-light); border: 1px solid var(--bolsonaro-primary); }
.tooltip-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; color: var(--text-secondary); }
.tooltip-row.lead { font-weight: 700; margin-top: 5px; padding-top: 4px; border-top: 1px solid var(--border-subtle); color: #FFF; }

/* State Detail Drawer */
#state-drawer {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 290px;
  background: rgba(17, 24, 39, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: none;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 16px 36px rgba(0,0,0,0.6);
  z-index: 25;
  animation: slideIn 0.25s var(--ease-spring);
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 10px;
}
.drawer-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.drawer-flag {
  width: 26px;
  height: 18px;
  border-radius: 2px;
  object-fit: cover;
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
.drawer-state-name {
  font-size: 15px;
  font-weight: 700;
  color: #FFF;
}
.drawer-close {
  all: unset;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.drawer-close:hover { color: #FFF; background: rgba(255,255,255,0.1); }

.drawer-section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.drawer-cands-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.drawer-cand-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.03);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}
.drawer-cand-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
.drawer-cand-info {
  flex: 1;
  margin-left: 8px;
}
.drawer-cand-name { font-size: 11px; font-weight: 600; color: #FFF; }
.drawer-cand-party { font-size: 9px; color: var(--text-muted); }
.drawer-cand-pct { font-size: 12px; font-weight: 700; }

/* ===== RIGHT SIDEBAR: REGIONS & FEED ===== */
#right-panel {
  grid-column: 3;
  grid-row: 2;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-left: 1px solid var(--border-subtle);
  scrollbar-width: thin;
  scrollbar-color: var(--border-medium) transparent;
}
#right-panel::-webkit-scrollbar { width: 4px; }
#right-panel::-webkit-scrollbar-thumb { background: var(--border-medium); border-radius: 2px; }

.panel-section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

/* Regional Cards */
.region-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.region-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s ease;
}
.region-card:hover { border-color: var(--border-medium); }
.region-name { font-size: 12px; font-weight: 700; color: var(--text-primary); }
.region-margin { font-size: 10px; color: var(--text-tertiary); margin-top: 2px; }
.region-leader-info {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: right;
}
.leader-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.leader-tag.lula { background: var(--lula-soft); color: var(--lula-light); border: 1px solid rgba(220, 38, 38, 0.4); }
.leader-tag.bolsonaro { background: var(--bolsonaro-soft); color: var(--bolsonaro-light); border: 1px solid rgba(29, 78, 216, 0.4); }
.region-pct { font-size: 13px; font-weight: 800; color: #FFF; }

/* Live Feed Items */
.feed-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.feed-item {
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid var(--border-medium);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.feed-item.confirmed { border-left-color: var(--accent-green); }
.feed-item.bolsonaro-lead { border-left-color: var(--bolsonaro-light); }
.feed-item.lula-lead { border-left-color: var(--lula-light); }
.feed-time { font-size: 10px; font-weight: 700; color: var(--text-muted); }
.feed-content { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }

/* ===== BOTTOM BAR: TIMELINE ===== */
#bottom-bar {
  grid-column: 1 / -1;
  grid-row: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(11, 15, 25, 0.95);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--border-subtle);
  z-index: 30;
  gap: 24px;
}

.timeline-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 170px;
}
.timeline-hour {
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 800;
  color: #FFF;
  letter-spacing: -0.02em;
}
.timeline-status {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 600;
}

.timeline-slider-wrap {
  flex: 1;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.timeline-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.12);
  outline: none;
  cursor: pointer;
}
.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #FFF;
  box-shadow: 0 0 10px rgba(255,255,255,0.6);
  cursor: grab;
  transition: transform 0.1s ease;
}
.timeline-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

.timeline-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
}

.btn-live-toggle {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-subtle);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}
.btn-live-toggle:hover { background: rgba(255, 255, 255, 0.1); color: #FFF; }
.btn-live-toggle.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: var(--accent-green);
}

/* ===== SEARCH MODAL ===== */
#search-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
}
.search-dialog {
  width: 520px;
  max-width: 90vw;
  background: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
}
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.search-input-wrap input {
  all: unset;
  flex: 1;
  font-size: 15px;
  color: #FFF;
}
.search-results-list {
  max-height: 360px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease;
}
.search-item:hover { background: rgba(255,255,255,0.08); }
.search-item-title { font-size: 13px; font-weight: 600; color: #FFF; }
.search-item-sub { font-size: 11px; color: var(--text-tertiary); }

/* Loading indicator for munis */
#map-loading-indicator {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  padding: 8px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  z-index: 20;
  transition: opacity 0.3s ease;
}
</style>
</head>
<body>

<div id="app">
  <!-- HEADER -->
  <header id="header">
    <div class="brand-section">
      <h1 class="brand-title">Apuração 2026</h1>
      <span class="brand-badge">2º Turno Presidencial</span>
    </div>

    <div class="header-center">
      <button class="nav-pill active" data-mode="presidente">Presidente</button>
      <button class="nav-pill" data-mode="vantagem">Vantagem</button>
      <button class="nav-pill" data-mode="apurado">Apurado</button>
    </div>

    <div class="header-right">
      <button class="btn-search" id="btn-open-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span>Buscar cidade ou estado</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div class="live-indicator">
        <span class="pulse-dot"></span>
        <span id="header-status">100% oficial TSE</span>
      </div>
    </div>
  </header>

  <!-- LEFT SIDEBAR -->
  <aside id="left-panel">
    <!-- Duel Card -->
    <div class="card duel-card">
      <div class="duel-header">
        <div class="duel-badge">Presidente da República · Brasil</div>
        <h2 class="duel-title">
          <span class="txt-bolsonaro">Flávio Bolsonaro</span> e <span class="txt-lula">Lula</span>
        </h2>
      </div>

      <div class="duel-grid">
        <!-- Lula -->
        <div class="candidate-box">
          <div class="cand-identity">
            <img class="cand-portrait lula" id="img-lula" alt="Lula">
            <div class="cand-meta">
              <span class="cand-tag tag-lula">PT 13</span>
              <span class="cand-display-name">Lula</span>
            </div>
          </div>
          <div class="cand-percent lula" id="pct-lula">48,99<sup>%</sup></div>
          <div class="cand-vote-count" id="votes-lula">53.876.617 votos</div>
        </div>

        <!-- Flávio Bolsonaro -->
        <div class="candidate-box right">
          <div class="cand-identity">
            <img class="cand-portrait bolsonaro" id="img-bolsonaro" alt="Flávio Bolsonaro">
            <div class="cand-meta">
              <span class="cand-tag tag-bolsonaro">PL 22</span>
              <span class="cand-display-name">Flávio Bolsonaro</span>
            </div>
          </div>
          <div class="cand-percent bolsonaro" id="pct-bolsonaro">51,01<sup>%</sup></div>
          <div class="cand-vote-count" id="votes-bolsonaro">56.104.268 votos</div>
        </div>
      </div>

      <!-- Duel Progress Bar -->
      <div class="duel-bar-wrap">
        <div class="duel-bar-track">
          <div class="duel-bar-fill-lula" id="bar-fill-lula" style="width: 48.99%;"></div>
          <div class="duel-bar-fill-bolsonaro" id="bar-fill-bolsonaro" style="width: 51.01%;"></div>
        </div>
        <div class="duel-bar-center" title="Marca de 50%"></div>
      </div>

      <div class="duel-margin-info">
        <span>Vantagem: <b id="duel-margin-votes">2.227.651 votos</b></span>
        <span id="duel-margin-pct">2,02 pontos</span>
      </div>

      <!-- State Chips -->
      <div class="states-won-wrap">
        <div class="states-won-header">
          <span>Estados Vencidos</span>
          <span id="states-count-lead">14 PL × 13 PT (+ Exterior)</span>
        </div>
        <div class="chips-grid" id="states-chips-container"></div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="card">
      <div class="quick-stats-row">
        <div class="stat-card-mini">
          <div class="label">Votos Válidos</div>
          <div class="val" id="stat-validos">109,9 mi</div>
        </div>
        <div class="stat-card-mini">
          <div class="label">Comparecimento</div>
          <div class="val" id="stat-turnout">78,9%</div>
        </div>
        <div class="stat-card-mini">
          <div class="label">Brancos/Nulos</div>
          <div class="val" id="stat-blanknull">4,8%</div>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card chart-card">
      <div class="chart-header">
        <span class="chart-title">Evolução dos Votos Válidos</span>
        <span class="label" style="font-size: 11px; color: var(--text-tertiary);">Ao longo da apuração</span>
      </div>
      <canvas id="evolution-chart" class="chart-canvas"></canvas>
    </div>
  </aside>

  <!-- CENTER MAP -->
  <main id="map-viewport">
    <!-- View Switcher (Cidades vs Estados) -->
    <div class="map-view-switcher">
      <button class="map-view-btn active" id="btn-view-munis" title="Ver mapa detalhado de todas as 5.570 cidades">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>Cidades (5.570)</span>
      </button>
      <button class="map-view-btn" id="btn-view-states" title="Ver mapa macro por estados">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M10 11h4M10 16h4"/></svg>
        <span>Estados (27)</span>
      </button>
    </div>

    <!-- Drill-down banner when zoomed into a state -->
    <div class="map-drill-banner" id="map-drill-banner">
      <span id="drill-state-text">Visualizando: São Paulo</span>
      <button class="btn-reset-drill" id="btn-reset-drill">✕ Ver Brasil Todo</button>
    </div>

    <!-- Legend -->
    <div class="map-legend">
      <div class="legend-item"><span class="legend-dot lula"></span> <span>Lula (PT)</span></div>
      <div class="legend-item"><span class="legend-dot bolsonaro"></span> <span>Flávio Bolsonaro (PL)</span></div>
    </div>

    <!-- SVG MAP -->
    <svg id="map-svg" viewBox="0 0 1000 950"></svg>

    <!-- Floating Zoom Controls -->
    <div class="map-floating-controls">
      <button class="ctrl-btn" id="btn-zoom-in" title="Aproximar">+</button>
      <button class="ctrl-btn" id="btn-zoom-out" title="Afastar">−</button>
      <button class="ctrl-btn" id="btn-zoom-reset" title="Restaurar visão geral do Brasil">↺</button>
    </div>

    <!-- Loading status indicator -->
    <div id="map-loading-indicator">
      <span class="pulse-dot" style="width:6px;height:6px;"></span>
      <span id="map-loading-text">Carregando 5.570 cidades...</span>
    </div>

    <!-- Interactive Tooltip -->
    <div id="map-tooltip">
      <div class="tooltip-title">
        <span id="tt-title">São Paulo</span>
        <span class="tooltip-badge" id="tt-badge">PL 22</span>
      </div>
      <div class="tooltip-row"><span>Lula (PT):</span> <b id="tt-lula">42,4%</b></div>
      <div class="tooltip-row"><span>Flávio Bolsonaro (PL):</span> <b id="tt-bolsonaro">57,6%</b></div>
      <div class="tooltip-row"><span>Total apurado:</span> <b id="tt-apurado">100%</b></div>
      <div class="tooltip-row lead"><span>Liderança:</span> <b id="tt-lead">PL (+15,2%)</b></div>
    </div>

    <!-- State Detail Drawer -->
    <div id="state-drawer">
      <div class="drawer-header">
        <div class="drawer-title-group">
          <img id="drawer-flag-img" class="drawer-flag" src="" alt="Bandeira">
          <span class="drawer-state-name" id="drawer-state-name">São Paulo</span>
        </div>
        <button class="drawer-close" id="drawer-btn-close">✕</button>
      </div>

      <div class="drawer-duel-state">
        <div class="drawer-section-title">Presidencial no Estado</div>
        <div class="duel-bar-wrap" style="margin-bottom: 8px;">
          <div class="duel-bar-track">
            <div class="duel-bar-fill-lula" id="drawer-bar-lula"></div>
            <div class="duel-bar-fill-bolsonaro" id="drawer-bar-bolsonaro"></div>
          </div>
        </div>
        <div class="tooltip-row"><span>Lula:</span> <b id="drawer-lula-val">0%</b></div>
        <div class="tooltip-row"><span>Flávio Bolsonaro:</span> <b id="drawer-bolsonaro-val">0%</b></div>
        <div class="tooltip-row" style="color: var(--text-tertiary); font-size: 10px; margin-top: 4px;">
          <span>Seções apuradas:</span> <b id="drawer-apurado-val">100%</b>
        </div>
      </div>

      <div class="drawer-gov-section">
        <div class="drawer-section-title">Governador Eleito / Disputa</div>
        <div class="drawer-cands-list" id="drawer-gov-list"></div>
      </div>

      <div class="drawer-sen-section">
        <div class="drawer-section-title">Senado Federal</div>
        <div class="drawer-cands-list" id="drawer-sen-list"></div>
      </div>
    </div>
  </main>

  <!-- RIGHT SIDEBAR -->
  <aside id="right-panel">
    <div class="panel-section-title">Desempenho por Região</div>
    <div class="region-list" id="region-cards-container"></div>

    <div class="panel-section-title" style="margin-top: 8px;">Boletim de Apuração</div>
    <div class="feed-container" id="feed-items-container"></div>
  </aside>

  <!-- BOTTOM BAR: TIMELINE -->
  <footer id="bottom-bar">
    <div class="timeline-info">
      <span class="timeline-hour" id="timeline-display-time">23:59</span>
      <span class="timeline-status" id="timeline-display-status">Apuração Final TSE</span>
    </div>

    <div class="timeline-slider-wrap">
      <input type="range" class="timeline-slider" id="timeline-range" min="1040" max="1440" value="1440" step="2">
      <div class="timeline-ticks">
        <span>17:00</span>
        <span>18:30</span>
        <span>20:00</span>
        <span>21:30</span>
        <span>23:00</span>
        <span>24:00</span>
      </div>
    </div>

    <button class="btn-live-toggle active" id="btn-toggle-live">
      <span class="pulse-dot" style="width:6px;height:6px;background:currentColor;"></span>
      <span>Ao Vivo</span>
    </button>
  </footer>

  <!-- SEARCH MODAL -->
  <div id="search-modal">
    <div class="search-dialog">
      <div class="search-input-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="search-input" placeholder="Digite cidade ou estado (ex: Campinas, Sobral, RJ, Bahia)..." autofocus>
      </div>
      <div class="search-results-list" id="search-results"></div>
    </div>
  </div>
</div>

<script>
// ===== APPLICATION STATE & CONTROLLER =====
let appData = null;
let munisData = null;
let muniLookup = {};
let allMunisList = [];

let currentView = 'munis'; // 'munis' or 'states'
let currentMode = 'presidente'; // 'presidente', 'vantagem', 'apurado'
let selectedUF = null;

let zoomLevel = 1;
let panX = 0, panY = 0;
let isDragging = false;
let startX = 0, startY = 0;

// Format numbers
const fmtNum = n => (n || 0).toLocaleString('pt-BR');
const fmtCompact = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' mi' : fmtNum(n);

// Startup: fetch main election data + municipalities data
Promise.all([
  fetch('election_data_full.json').then(r => r.json()),
  fetch('municipios_map_data.json').then(r => r.json())
]).then(([data, munis]) => {
  appData = data;
  munisData = munis;

  // Build muni lookup and search list
  for (const uf of Object.keys(munis)) {
    for (const m of munis[uf]) {
      muniLookup[m.id] = m;
      allMunisList.push({ id: m.id, name: m.n, uf, pL: m.pL, pB: m.pB, v: m.v, d: m.d });
    }
  }

  document.getElementById('map-loading-indicator').style.display = 'none';
  initApp();
}).catch(err => {
  console.error('Error loading data:', err);
  document.getElementById('map-loading-text').textContent = 'Erro ao carregar dados';
});

function initApp() {
  setupDuelHeader();
  setupMapLayers();
  setupStateChips();
  setupRegions();
  setupFeed();
  setupEvolutionChart();
  setupTimeline();
  setupPanZoomEngine();
  setupControls();
  setupSearch();
}

// 1. Header & Left Sidebar
function setupDuelHeader() {
  const { brasil, candidates } = appData;
  document.getElementById('img-lula').src = candidates['13'].foto;
  document.getElementById('img-bolsonaro').src = candidates['22'].foto;

  updateDuelDisplay(brasil.pctLula, brasil.pctBolsonaro, brasil.lula, brasil.bolsonaro);

  document.getElementById('stat-validos').textContent = fmtCompact(brasil.lula + brasil.bolsonaro);
  document.getElementById('stat-turnout').textContent = brasil.pctComparecimento.toFixed(1).replace('.', ',') + '%';
  document.getElementById('stat-blanknull').textContent = brasil.pctBrancosNulos.toFixed(1).replace('.', ',') + '%';
}

function updateDuelDisplay(pLula, pBolsonaro, vLula, vBolsonaro) {
  document.getElementById('pct-lula').innerHTML = pLula.toFixed(2).replace('.', ',') + '<sup>%</sup>';
  document.getElementById('pct-bolsonaro').innerHTML = pBolsonaro.toFixed(2).replace('.', ',') + '<sup>%</sup>';
  document.getElementById('votes-lula').textContent = fmtNum(vLula) + ' votos';
  document.getElementById('votes-bolsonaro').textContent = fmtNum(vBolsonaro) + ' votos';

  document.getElementById('bar-fill-lula').style.width = pLula + '%';
  document.getElementById('bar-fill-bolsonaro').style.width = pBolsonaro + '%';

  const diffV = Math.abs(vBolsonaro - vLula);
  const diffP = Math.abs(pBolsonaro - pLula).toFixed(2).replace('.', ',');
  document.getElementById('duel-margin-votes').textContent = fmtNum(diffV) + ' votos';
  document.getElementById('duel-margin-pct').textContent = diffP + ' pontos';
}

// 2. Map Layers Construction
function setupMapLayers() {
  const svg = document.getElementById('map-svg');
  svg.innerHTML = '';

  const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  mainGroup.id = 'map-viewport-group';

  // Layer 1: Municipalities (5,570 paths)
  const munisLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  munisLayer.id = 'munis-layer';

  for (const uf of Object.keys(munisData)) {
    const list = munisData[uf];
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', m.d);
      p.setAttribute('class', 'map-muni-path');
      p.setAttribute('id', 'muni-' + m.id);
      p.setAttribute('data-id', m.id);
      p.setAttribute('data-uf', uf);
      p.style.fill = getMuniColor(m, currentMode);
      munisLayer.appendChild(p);
    }
  }

  // Layer 2: State Boundaries Overlay (Crisp white outlines over municipalities)
  const overlayLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  overlayLayer.id = 'state-overlay-layer';
  const { paths } = appData;
  for (const uf of Object.keys(paths)) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', paths[uf].d);
    p.setAttribute('class', 'map-state-boundary');
    overlayLayer.appendChild(p);
  }

  // Layer 3: Solid States (Macro view, 27 paths)
  const statesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  statesLayer.id = 'states-layer';
  statesLayer.style.display = 'none'; // hidden when in munis mode

  for (const uf of Object.keys(paths)) {
    const est = appData.estados[uf];
    if (!est) continue;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', paths[uf].d);
    p.setAttribute('class', 'map-state-path');
    p.setAttribute('id', 'path-' + uf);
    p.setAttribute('data-uf', uf);
    p.style.fill = getStateColor(est, currentMode);
    p.addEventListener('click', () => selectState(uf));
    statesLayer.appendChild(p);
  }

  // Layer 4: State Labels (SP, RJ, BA...)
  const labelsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsLayer.id = 'labels-layer';
  for (const uf of Object.keys(paths)) {
    const pInfo = paths[uf];
    const est = appData.estados[uf];
    if (!pInfo.center || !est) continue;

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pInfo.center[0]);
    text.setAttribute('y', pInfo.center[1]);
    text.setAttribute('class', 'map-label');
    text.textContent = uf;
    labelsLayer.appendChild(text);
  }

  mainGroup.appendChild(munisLayer);
  mainGroup.appendChild(overlayLayer);
  mainGroup.appendChild(statesLayer);
  mainGroup.appendChild(labelsLayer);
  svg.appendChild(mainGroup);

  // Setup Event Delegation for Municipalities (Super performant!)
  munisLayer.addEventListener('mousemove', e => {
    const target = e.target.closest('.map-muni-path');
    if (!target) { hideTooltip(); return; }
    const m = muniLookup[target.dataset.id];
    if (m) showMuniTooltip(e, m, target.dataset.uf);
  });
  munisLayer.addEventListener('mouseleave', hideTooltip);

  munisLayer.addEventListener('click', e => {
    const target = e.target.closest('.map-muni-path');
    if (target && target.dataset.uf) {
      selectState(target.dataset.uf);
    }
  });

  // Setup Event Delegation for States
  statesLayer.addEventListener('mousemove', e => {
    const target = e.target.closest('.map-state-path');
    if (!target) { hideTooltip(); return; }
    const est = appData.estados[target.dataset.uf];
    if (est) showStateTooltip(e, est);
  });
  statesLayer.addEventListener('mouseleave', hideTooltip);
}

// Municipality color styling
function getMuniColor(m, mode) {
  if (mode === 'presidente') {
    if (m.v === '13') {
      if (m.pL >= 80) return '#7F1D1D';
      if (m.pL >= 70) return '#991B1B';
      if (m.pL >= 60) return '#DC2626';
      if (m.pL >= 52) return '#EF4444';
      return '#F87171';
    } else {
      if (m.pB >= 80) return '#172554';
      if (m.pB >= 70) return '#1E3A8A';
      if (m.pB >= 60) return '#1D4ED8';
      if (m.pB >= 52) return '#2563EB';
      return '#60A5FA';
    }
  } else if (mode === 'vantagem') {
    const diff = Math.abs(m.pB - m.pL);
    const base = m.v === '13' ? '220, 38, 38' : '29, 78, 216';
    const a = diff > 40 ? 1 : diff > 20 ? 0.8 : diff > 10 ? 0.6 : 0.4;
    return \`rgba(\${base}, \${a})\`;
  } else if (mode === 'apurado') {
    return \`rgba(16, 185, 129, \${Math.max(0.25, (m.a || 100) / 100)})\`;
  }
  return '#334155';
}

function getStateColor(est, mode) {
  if (mode === 'presidente') {
    return est.vencedor === '13' ? 'var(--lula-primary)' : 'var(--bolsonaro-primary)';
  } else if (mode === 'vantagem') {
    const diff = Math.abs(est.pctBolsonaro - est.pctLula);
    const base = est.vencedor === '13' ? '220, 38, 38' : '29, 78, 216';
    const a = diff > 25 ? 0.95 : diff > 10 ? 0.75 : 0.5;
    return \`rgba(\${base}, \${a})\`;
  } else if (mode === 'apurado') {
    return \`rgba(16, 185, 129, \${est.apurado / 100})\`;
  }
  return '#334155';
}

function refreshAllColors() {
  // Update munis
  const munisPaths = document.querySelectorAll('.map-muni-path');
  munisPaths.forEach(p => {
    const m = muniLookup[p.dataset.id];
    if (m) p.style.fill = getMuniColor(m, currentMode);
  });

  // Update states
  const { estados } = appData;
  Object.keys(estados).forEach(uf => {
    const el = document.getElementById('path-' + uf);
    if (el) el.style.fill = getStateColor(estados[uf], currentMode);
  });
}

// 3. Tooltips
const tooltip = document.getElementById('map-tooltip');

function showMuniTooltip(e, m, uf) {
  tooltip.style.display = 'block';
  document.getElementById('tt-title').textContent = m.n + ' · ' + uf;
  
  const badge = document.getElementById('tt-badge');
  badge.className = 'tooltip-badge ' + (m.v === '13' ? 'lula' : 'bolsonaro');
  badge.textContent = m.v === '13' ? 'PT 13' : 'PL 22';

  document.getElementById('tt-lula').textContent = m.pL.toFixed(1).replace('.', ',') + '% (' + fmtNum(m.lula) + ' votos)';
  document.getElementById('tt-bolsonaro').textContent = m.pB.toFixed(1).replace('.', ',') + '% (' + fmtNum(m.bol) + ' votos)';
  document.getElementById('tt-apurado').textContent = (m.a || 100) + '% das seções';

  const diff = Math.abs(m.pB - m.pL).toFixed(1).replace('.', ',');
  const leadName = m.v === '13' ? 'Lula (PT)' : 'Flávio Bolsonaro (PL)';
  document.getElementById('tt-lead').textContent = \`\${leadName} +\${diff}%\`;

  moveTooltip(e);
}

function showStateTooltip(e, est) {
  tooltip.style.display = 'block';
  document.getElementById('tt-title').textContent = est.name + ' (' + est.uf + ')';

  const badge = document.getElementById('tt-badge');
  badge.className = 'tooltip-badge ' + (est.vencedor === '13' ? 'lula' : 'bolsonaro');
  badge.textContent = est.vencedor === '13' ? 'PT 13' : 'PL 22';

  document.getElementById('tt-lula').textContent = est.pctLula.toFixed(1).replace('.', ',') + '% (' + fmtNum(est.lula) + ' votos)';
  document.getElementById('tt-bolsonaro').textContent = est.pctBolsonaro.toFixed(1).replace('.', ',') + '% (' + fmtNum(est.bolsonaro) + ' votos)';
  document.getElementById('tt-apurado').textContent = est.apurado.toFixed(1).replace('.', ',') + '% das seções';

  const diff = Math.abs(est.pctBolsonaro - est.pctLula).toFixed(1).replace('.', ',');
  const leadName = est.vencedor === '13' ? 'Lula (PT)' : 'Flávio Bolsonaro (PL)';
  document.getElementById('tt-lead').textContent = \`\${leadName} +\${diff}%\`;

  moveTooltip(e);
}

function moveTooltip(e) {
  const x = e.clientX + 16;
  const y = e.clientY + 16;
  tooltip.style.left = Math.min(window.innerWidth - 220, x) + 'px';
  tooltip.style.top = Math.min(window.innerHeight - 150, y) + 'px';
}
function hideTooltip() { tooltip.style.display = 'none'; }

// 4. Pan & Zoom Engine
function updateTransform(animate = false) {
  const g = document.getElementById('map-viewport-group');
  if (!g) return;
  if (animate) {
    g.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => { g.style.transition = 'none'; }, 400);
  } else {
    g.style.transition = 'none';
  }
  g.setAttribute('transform', \`translate(\${panX}, \${panY}) scale(\${zoomLevel})\`);
}

function setupPanZoomEngine() {
  const svg = document.getElementById('map-svg');

  // Mouse Wheel Zoom
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 1.25 : 0.8;
    const newZoom = Math.min(10, Math.max(0.7, zoomLevel * delta));

    // Pan towards mouse
    panX = mouseX - (mouseX - panX) * (newZoom / zoomLevel);
    panY = mouseY - (mouseY - panY) * (newZoom / zoomLevel);
    zoomLevel = newZoom;

    updateTransform();
  }, { passive: false });

  // Drag Pan
  svg.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    svg.classList.add('grabbing');
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      svg.classList.remove('grabbing');
    }
  });

  // Buttons
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    zoomLevel = Math.min(10, zoomLevel * 1.35);
    updateTransform(true);
  });
  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    zoomLevel = Math.max(0.7, zoomLevel / 1.35);
    updateTransform(true);
  });
  document.getElementById('btn-zoom-reset').addEventListener('click', resetBrazilView);
  document.getElementById('btn-reset-drill').addEventListener('click', resetBrazilView);
}

function resetBrazilView() {
  selectedUF = null;
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  updateTransform(true);
  document.getElementById('map-drill-banner').style.display = 'none';
  document.querySelectorAll('.map-state-path').forEach(p => p.classList.remove('selected'));
}

// 5. State Selection and Drilldown Zoom
function selectState(uf) {
  selectedUF = uf;
  const est = appData.estados[uf];
  if (!est) return;

  // Zoom to state bounding box
  const pInfo = appData.paths[uf];
  if (pInfo && pInfo.bbox) {
    const bbox = pInfo.bbox;
    const svgEl = document.getElementById('map-svg');
    const vw = svgEl.clientWidth || 800;
    const vh = svgEl.clientHeight || 700;

    const scale = Math.min(vw / (bbox.w + 60), vh / (bbox.h + 60), 6);
    zoomLevel = Math.max(1.8, scale * 0.85);

    // Center in SVG coordinates (viewBox 1000 x 950)
    const svgCx = bbox.cx;
    const svgCy = bbox.cy;
    panX = (vw / 2) - (svgCx * (vw / 1000)) * zoomLevel;
    panY = (vh / 2) - (svgCy * (vh / 950)) * zoomLevel;

    updateTransform(true);
  }

  // Show drill-down banner
  const banner = document.getElementById('map-drill-banner');
  const munisCount = (munisData[uf] || []).length;
  document.getElementById('drill-state-text').textContent = \`Visualizando: \${est.name} (\${uf}) · \${munisCount} municípios\`;
  banner.style.display = 'flex';

  // Highlight state in states mode
  document.querySelectorAll('.map-state-path').forEach(p => p.classList.remove('selected'));
  const pEl = document.getElementById('path-' + uf);
  if (pEl) pEl.classList.add('selected');

  // Fill State Drawer
  const drawer = document.getElementById('state-drawer');
  drawer.style.display = 'flex';
  document.getElementById('drawer-state-name').textContent = est.name;
  document.getElementById('drawer-flag-img').src = est.flag;

  document.getElementById('drawer-bar-lula').style.width = est.pctLula + '%';
  document.getElementById('drawer-bar-bolsonaro').style.width = est.pctBolsonaro + '%';
  document.getElementById('drawer-lula-val').textContent = est.pctLula.toFixed(1).replace('.', ',') + '% (' + fmtNum(est.lula) + ' votos)';
  document.getElementById('drawer-bolsonaro-val').textContent = est.pctBolsonaro.toFixed(1).replace('.', ',') + '% (' + fmtNum(est.bolsonaro) + ' votos)';
  document.getElementById('drawer-apurado-val').textContent = est.apurado.toFixed(1).replace('.', ',') + '% das seções apuradas';

  // Governors
  const govContainer = document.getElementById('drawer-gov-list');
  govContainer.innerHTML = '';
  (est.governadores || []).forEach(g => {
    const item = document.createElement('div');
    item.className = 'drawer-cand-item';
    item.innerHTML = \`
      <img class="drawer-cand-thumb" src="\${g.foto || 'assets/og.933bb11ba1.jpg'}" alt="\${g.nome}">
      <div class="drawer-cand-info">
        <div class="drawer-cand-name">\${g.nome}</div>
        <div class="drawer-cand-party">\${g.partido} \${g.eleito ? '· <b>ELEITO</b>' : ''}</div>
      </div>
      <div class="drawer-cand-pct" style="color: \${g.eleito ? 'var(--accent-green)' : 'var(--text-secondary)'}">
        \${(g.pct || 0).toFixed(1).replace('.', ',')}%
      </div>
    \`;
    govContainer.appendChild(item);
  });

  // Senators
  const senContainer = document.getElementById('drawer-sen-list');
  senContainer.innerHTML = '';
  (est.senadores || []).forEach(s => {
    const item = document.createElement('div');
    item.className = 'drawer-cand-item';
    item.innerHTML = \`
      <img class="drawer-cand-thumb" src="\${s.foto || 'assets/og.933bb11ba1.jpg'}" alt="\${s.nome}">
      <div class="drawer-cand-info">
        <div class="drawer-cand-name">\${s.nome}</div>
        <div class="drawer-cand-party">\${s.partido} · \${s.eleito ? '<b>ELEITO</b>' : 'Suplente'}</div>
      </div>
      <div class="drawer-cand-pct" style="color: \${s.eleito ? 'var(--accent-green)' : 'var(--text-secondary)'}">
        \${(s.pct || 0).toFixed(1).replace('.', ',')}%
      </div>
    \`;
    senContainer.appendChild(item);
  });
}

document.getElementById('drawer-btn-close').addEventListener('click', () => {
  document.getElementById('state-drawer').style.display = 'none';
});

// 6. View Switcher (Munis vs States) & Mode Controls
function setupControls() {
  const btnMunis = document.getElementById('btn-view-munis');
  const btnStates = document.getElementById('btn-view-states');
  const munisLayer = document.getElementById('munis-layer');
  const overlayLayer = document.getElementById('state-overlay-layer');
  const statesLayer = document.getElementById('states-layer');

  btnMunis.addEventListener('click', () => {
    currentView = 'munis';
    btnMunis.classList.add('active');
    btnStates.classList.remove('active');
    munisLayer.style.display = 'block';
    overlayLayer.style.display = 'block';
    statesLayer.style.display = 'none';
  });

  btnStates.addEventListener('click', () => {
    currentView = 'states';
    btnStates.classList.add('active');
    btnMunis.classList.remove('active');
    munisLayer.style.display = 'none';
    overlayLayer.style.display = 'none';
    statesLayer.style.display = 'block';
  });

  // Top Nav Pills (mode filter)
  document.querySelectorAll('.nav-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentMode = pill.getAttribute('data-mode');
      refreshAllColors();
    });
  });
}

// 7. State Chips on Left Panel
function setupStateChips() {
  const container = document.getElementById('states-chips-container');
  container.innerHTML = '';
  const { estados } = appData;

  Object.keys(estados).filter(u => u !== 'ZZ').sort().forEach(uf => {
    const est = estados[uf];
    const btn = document.createElement('button');
    btn.className = 'state-chip-btn ' + (est.vencedor === '13' ? 'chip-lula' : 'chip-bolsonaro');
    btn.textContent = uf;
    btn.title = \`\${est.name}: \${est.vencedor === '13' ? 'Lula' : 'Bolsonaro'} (\${Math.max(est.pctLula, est.pctBolsonaro)}%)\`;
    btn.addEventListener('click', () => selectState(uf));
    container.appendChild(btn);
  });
}

// 8. Region Breakdown Cards
function setupRegions() {
  const container = document.getElementById('region-cards-container');
  container.innerHTML = '';
  const { regions } = appData;

  Object.values(regions).forEach(reg => {
    const isLula = reg.liderNum === '13';
    const card = document.createElement('div');
    card.className = 'region-card';
    card.innerHTML = \`
      <div>
        <div class="region-name">\${reg.nome}</div>
        <div class="region-margin">\${reg.lider} +\${reg.diffPts} pts</div>
      </div>
      <div class="region-leader-info">
        <span class="leader-tag \${isLula ? 'lula' : 'bolsonaro'}">\${isLula ? 'PT' : 'PL'}</span>
        <span class="region-pct">\${reg.pctLider.toFixed(1).replace('.', ',')}%</span>
      </div>
    \`;
    container.appendChild(card);
  });
}

// 9. Live Feed
function setupFeed() {
  const container = document.getElementById('feed-items-container');
  const items = [
    { time: '23:55', type: 'confirmed', text: '<b>São Paulo</b>: Apuração 100% totalizada. Flávio Bolsonaro lidera com 57,6% contra 42,4% de Lula.' },
    { time: '23:40', type: 'lula-lead', text: '<b>Bahia</b>: Lula consolida ampla liderança com 69,9% dos votos válidos (5,66 milhões de votos).' },
    { time: '23:25', type: 'confirmed', text: '<b>Minas Gerais</b>: Estado decisivo encerra apuração confirmando vitória de Lula por margem estreita (51,8%).' },
    { time: '22:50', type: 'bolsonaro-lead', text: '<b>Rio de Janeiro</b>: Flávio Bolsonaro vence em seu estado com 58,0% dos votos válidos.' },
    { time: '22:15', type: 'confirmed', text: '<b>Sul</b>: Região Sul encerra apuração com vantagem expressiva do PL nos três estados.' }
  ];

  container.innerHTML = '';
  items.forEach(it => {
    const el = document.createElement('div');
    el.className = 'feed-item ' + it.type;
    el.innerHTML = \`
      <span class="feed-time">\${it.time}</span>
      <span class="feed-content">\${it.text}</span>
    \`;
    container.appendChild(el);
  });
}

// 10. Evolution Chart Canvas
function setupEvolutionChart() {
  const canvas = document.getElementById('evolution-chart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth * dpr;
  const h = canvas.clientHeight * dpr;
  canvas.width = w;
  canvas.height = h;

  const { timeline } = appData;
  if (!timeline || !timeline.length) return;

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(pct => {
    ctx.beginPath();
    ctx.moveTo(0, h * pct);
    ctx.lineTo(w, h * pct);
    ctx.stroke();
  });

  const minPct = 38;
  const maxPct = 56;
  const getY = val => h - ((val - minPct) / (maxPct - minPct)) * h;

  // Lula Line
  ctx.beginPath();
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2.5 * dpr;
  timeline.forEach((pt, i) => {
    const x = (i / (timeline.length - 1)) * w;
    const y = getY(pt.sh13);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Bolsonaro Line
  ctx.beginPath();
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2.5 * dpr;
  timeline.forEach((pt, i) => {
    const x = (i / (timeline.length - 1)) * w;
    const y = getY(pt.sh22);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// 11. Timeline Scrubber
function setupTimeline() {
  const slider = document.getElementById('timeline-range');
  const dispTime = document.getElementById('timeline-display-time');
  const dispStatus = document.getElementById('timeline-display-status');
  const btnLive = document.getElementById('btn-toggle-live');

  slider.addEventListener('input', e => {
    const val = parseInt(e.target.value, 10);
    const h = String(Math.floor(val / 60)).padStart(2, '0');
    const m = String(val % 60).padStart(2, '0');
    dispTime.textContent = \`\${h}:\${m}\`;
    
    if (val >= 1430) {
      dispStatus.textContent = 'Apuração Final (100% TSE)';
      btnLive.classList.add('active');
    } else {
      dispStatus.textContent = 'Replay Histórico';
      btnLive.classList.remove('active');
    }

    const { timeline, brasil } = appData;
    let closest = timeline[timeline.length - 1];
    let minD = Infinity;
    timeline.forEach(pt => {
      const d = Math.abs(pt.t - val);
      if (d < minD) { minD = d; closest = pt; }
    });

    if (closest) {
      updateDuelDisplay(
        closest.sh13,
        closest.sh22,
        Math.round((closest.sh13 / 100) * (brasil.lula + brasil.bolsonaro)),
        Math.round((closest.sh22 / 100) * (brasil.lula + brasil.bolsonaro))
      );
    }
  });

  btnLive.addEventListener('click', () => {
    slider.value = 1440;
    slider.dispatchEvent(new Event('input'));
  });
}

// 12. Search Dialog (Ctrl + K) - Supports BOTH States and 5,570 Cities
function setupSearch() {
  const modal = document.getElementById('search-modal');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const btnOpen = document.getElementById('btn-open-search');

  function openSearch() {
    modal.style.display = 'flex';
    input.value = '';
    renderSearchResults('');
    input.focus();
  }

  function closeSearch() {
    modal.style.display = 'none';
  }

  btnOpen.addEventListener('click', openSearch);
  modal.addEventListener('click', e => { if (e.target === modal) closeSearch(); });

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      document.getElementById('drawer-btn-close').click();
    }
  });

  let searchTimeout = null;
  input.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderSearchResults(e.target.value.toLowerCase().trim());
    }, 80);
  });

  function renderSearchResults(query) {
    results.innerHTML = '';
    const { estados } = appData;

    // 1. Matches in States
    const stateMatches = Object.values(estados).filter(est => 
      est.name.toLowerCase().includes(query) || est.uf.toLowerCase().includes(query)
    );

    stateMatches.slice(0, 4).forEach(est => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = \`
        <div>
          <div class="search-item-title">🏛️ \${est.name} (\${est.uf})</div>
          <div class="search-item-sub">Estado · Região \${est.region} · \${est.vencedor === '13' ? 'Lula' : 'Bolsonaro'} venceu</div>
        </div>
        <span class="leader-tag \${est.vencedor === '13' ? 'lula' : 'bolsonaro'}">\${est.vencedor === '13' ? 'PT' : 'PL'} \${Math.max(est.pctLula, est.pctBolsonaro)}%</span>
      \`;
      item.addEventListener('click', () => {
        closeSearch();
        selectState(est.uf);
      });
      results.appendChild(item);
    });

    // 2. Matches in Municipalities
    if (query.length >= 2) {
      const muniMatches = allMunisList.filter(m => 
        m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ||
        (m.name + ' ' + m.uf).toLowerCase().includes(query)
      ).slice(0, 10);

      muniMatches.forEach(m => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = \`
          <div>
            <div class="search-item-title">📍 \${m.name} (\${m.uf})</div>
            <div class="search-item-sub">Município · \${m.v === '13' ? 'Lula venceu (' + m.pL + '%)' : 'Bolsonaro venceu (' + m.pB + '%)'}</div>
          </div>
          <span class="leader-tag \${m.v === '13' ? 'lula' : 'bolsonaro'}">\${m.v === '13' ? 'PT' : 'PL'} \${Math.max(m.pL, m.pB)}%</span>
        \`;
        item.addEventListener('click', () => {
          closeSearch();
          // Switch to munis view if in states view
          if (currentView !== 'munis') {
            document.getElementById('btn-view-munis').click();
          }
          // Zoom into state
          selectState(m.uf);
          // Highlight muni path
          setTimeout(() => {
            const p = document.getElementById('muni-' + m.id);
            if (p) {
              document.querySelectorAll('.map-muni-path.highlighted').forEach(el => el.classList.remove('highlighted'));
              p.classList.add('highlighted');
              const rect = p.getBoundingClientRect();
              showMuniTooltip({ clientX: rect.left + rect.width / 2, clientY: rect.top }, m, m.uf);
            }
          }, 450);
        });
        results.appendChild(item);
      });
    }
  }
}
</script>
</body>
</html>`;

fs.writeFileSync('c:/Users/tavares/Documents/mapa/index.html', html, 'utf8');
console.log('Successfully wrote comprehensive index.html, size:', (fs.statSync('c:/Users/tavares/Documents/mapa/index.html').size / 1024).toFixed(1), 'KB');
