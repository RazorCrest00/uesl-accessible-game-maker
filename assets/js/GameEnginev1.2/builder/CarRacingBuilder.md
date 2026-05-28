---
layout: opencs
title: Car Racing Builder
description: Build and race custom cars on custom tracks
permalink: /car-racing-builder
---

<style>
/* Hide the site header (logo + nav) on this page */
.site-header {
  display: none !important;
}

/* ── Page-level resets (same as GameBuilder) ──────────────────────────── */
.page-content {
  padding: 0 !important;
  overflow: hidden;
}
.page-content .wrapper {
  max-width: 100% !important;
  padding: 0 !important;
}
.opencs_root {
  overflow: hidden;
}

/* ── Racing Builder title — site-matching blue aesthetic ── */
.gamebuilder-title {
  color: var(--pref-accent-color, #4CAFEF) !important;
  font-family: 'Segoe UI', system-ui, sans-serif !important;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem) !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em !important;
  text-shadow: 0 0 18px color-mix(in srgb, var(--pref-accent-color, #4CAFEF) 55%, transparent),
               0 1px 4px rgba(0,0,0,0.6) !important;
  padding: 6px 0 2px !important;
  background: none !important;
}

/* ── Mode switch pill row ─────────────────────────────────────────────── */
.crb-mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.crb-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 16px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  background: linear-gradient(135deg, #3730a3, #6366f1);
  color: #c7d2fe;
  text-decoration: none;
  border: 1px solid #4f46e5;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;
  user-select: none;
}
.crb-mode-btn:hover {
  background: linear-gradient(135deg, #4338ca, #818cf8);
  box-shadow: 0 0 12px rgba(99,102,241,0.5);
  color: #fff;
  text-decoration: none;
}
.crb-mode-active {
  background: linear-gradient(135deg, #b45309, #f59e0b) !important;
  border-color: #d97706 !important;
  color: #fef3c7 !important;
  box-shadow: 0 0 14px rgba(245,158,11,0.45);
  pointer-events: none;
}

/* ── Performance stat sliders ─────────────────────────────────────────── */
.stat-bar {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 4px;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: clamp(0.68rem, 0.78vw, 0.78rem);
}
.stat-row label {
  width: 100px;
  flex-shrink: 0;
  color: #94a3b8;
  font-size: clamp(0.65rem, 0.75vw, 0.75rem);
  margin: 0;
}
.stat-row input[type="range"] {
  flex: 1;
  accent-color: #6366f1;
  height: 4px;
  cursor: pointer;
}
.stat-val {
  width: 20px;
  text-align: right;
  color: #a5b4fc;
  font-weight: 700;
  font-size: 0.75rem;
}

/* ── Power rating display ──────────────────────────────────────────────── */
.power-rating {
  text-align: center;
  margin-top: 8px;
  padding: 8px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 8px;
}
.power-rating .pr-label {
  font-size: 0.68rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.power-rating .pr-score {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f59e0b;
  line-height: 1.2;
}
.power-rating .pr-max {
  font-size: 0.65rem;
  color: #475569;
}

/* ── XP / Garage bar ──────────────────────────────────────────────────── */
.crb-xp-bar-wrap {
  background: #0f172a;
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
  margin: 6px 0 4px;
  border: 1px solid #1e293b;
}
.crb-xp-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  border-radius: 999px;
  transition: width 0.4s ease;
}
.crb-xp-label {
  font-size: 0.68rem;
  color: #64748b;
  text-align: right;
}
.crb-badges {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 4px;
  line-height: 1.6;
}

/* ── Race HUD overlay on canvas ───────────────────────────────────────── */
.race-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}
.race-hud-item {
  position: absolute;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 4px 10px;
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
}
.hud-speed  { top: 12px; left: 12px; min-width: 110px; }
.hud-lap    { top: 12px; left: 50%; transform: translateX(-50%); }
.hud-pos    { top: 12px; right: 12px; }
.hud-nitro  { bottom: 12px; left: 12px; display: flex; align-items: center; gap: 6px; }
.hud-nitro-bar-wrap { width: 80px; height: 8px; background: #0f172a; border-radius: 999px; overflow: hidden; border: 1px solid #1e293b; }
.hud-nitro-bar { height: 100%; background: linear-gradient(90deg,#3b82f6,#06b6d4); border-radius: 999px; transition: width 0.1s; }
.minimap-canvas { position: absolute; bottom: 12px; right: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.5); }

/* ── Countdown overlay ────────────────────────────────────────────────── */
.crb-countdown {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}
.crb-countdown-num {
  font-size: 8rem;
  font-weight: 900;
  color: #f59e0b;
  text-shadow: 0 0 40px rgba(245,158,11,0.8), 0 4px 20px rgba(0,0,0,0.8);
  animation: crbPop 0.5s ease-out forwards;
  display: none;
}
.crb-countdown-num.go { color: #22c55e; }
@keyframes crbPop {
  0%   { transform: scale(2); opacity: 0; }
  40%  { transform: scale(1); opacity: 1; }
  80%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0; }
}

/* ── Pre-race track preview banner ───────────────────────────────────── */
.crb-preview {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 28px;
  pointer-events: none;
  z-index: 45;
}
.crb-preview-box {
  background: rgba(0,0,0,0.72);
  border: 2px solid var(--pref-accent-color, #4CAFEF);
  border-radius: 14px;
  padding: 12px 36px 14px;
  text-align: center;
  backdrop-filter: blur(4px);
  animation: previewFadeIn 0.4s ease-out forwards;
}
@keyframes previewFadeIn {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.crb-preview-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f59e0b;
  margin-bottom: 4px;
}
.crb-preview-track {
  font-size: 1.7rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.1;
}
.crb-preview-sub {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 5px;
}
.crb-preview-arrow {
  width: 0; height: 0;
  margin-top: 6px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid var(--pref-accent-color, #4CAFEF);
  animation: arrowBounce 0.6s ease-in-out infinite alternate;
}
@keyframes arrowBounce {
  from { transform: translateY(0); }
  to   { transform: translateY(6px); }
}

/* ── Results overlay ──────────────────────────────────────────────────── */
.crb-results {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.82);
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 60;
  border-radius: 12px;
  color: #e2e8f0;
  text-align: center;
  gap: 10px;
}
.crb-results.visible { display: flex; pointer-events: auto; }
.crb-results h2 { font-size: 2rem; font-weight: 900; color: #f59e0b; margin: 0; text-shadow: 0 0 20px rgba(245,158,11,0.7); }
.crb-results .res-table { font-size: 0.9rem; background: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 24px; min-width: 260px; border: 1px solid rgba(255,255,255,0.1); }
.crb-results .res-row { display: flex; justify-content: space-between; gap: 24px; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.crb-results .res-row:last-child { border-bottom: none; }
.crb-results .xp-gained { font-size: 1.1rem; color: #a78bfa; font-weight: 700; }
.crb-results button { margin-top: 6px; padding: 8px 28px; background: linear-gradient(135deg,#4f46e5,#7c3aed); border: none; border-radius: 8px; color: #fff; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.crb-results button:hover { opacity: 0.85; }

/* ── Colour pickers row ───────────────────────────────────────────────── */
.color-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 4px;
}
.color-row label { font-size: 0.7rem; color: #64748b; margin: 0; }
.color-row input[type="color"] { width: 36px; height: 28px; border-radius: 6px; border: 1px solid #334155; padding: 1px; background: #0f172a; cursor: pointer; }

/* ── Panel-game position fix for HUD ─────────────────────────────────── */
.panel-game { position: relative; }
</style>

<!-- Socket.IO -->
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>

<!-- Mode switch + title -->
<div style="text-align:center;padding:4px 0 4px;">
  <div class="gamebuilder-title" style="font-size:clamp(1.4rem,3vw,2.2rem);margin-bottom:10px;">
    🏎️ Car Racing Builder
  </div>
  <div style="display:flex;justify-content:center;align-items:center;gap:32px;flex-wrap:wrap;">
    <a href="{{site.baseurl}}/gamebuilderv1-2" style="padding:7px 28px;border-radius:24px;background:#1e293b;border:1px solid #6366f1;color:#a5b4fc;font-size:.85rem;font-weight:700;text-decoration:none;letter-spacing:.04em;transition:background .15s,box-shadow .15s;">🎮 Game Builder</a>
    <span style="padding:7px 28px;border-radius:24px;background:linear-gradient(135deg,#b45309,#d97706);color:#fff;font-size:.85rem;font-weight:700;cursor:default;letter-spacing:.04em;box-shadow:0 0 12px rgba(245,158,11,0.4);">🏎️ Racing Builder</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════════════
     MAIN LAYOUT  (reuses GameBuilder CSS classes)
═══════════════════════════════════════════════════════════════════════ -->
<div class="creator-layout">

  <!-- ── Left panel ──────────────────────────────────────────────────── -->
  <div class="col-asset" id="col-asset">
    <div class="glass-panel creator-panel">

      <!-- panel header buttons -->
      <div class="panel-header">
        <span>Car Config</span>
        <div class="panel-controls">
          <button id="crb-btn-confirm"  class="icon-btn" data-tooltip="Confirm &amp; Apply">✓</button>
          <button id="crb-btn-refresh"  class="icon-btn" data-tooltip="Reset to defaults">⟳</button>
          <button id="crb-btn-help"     class="icon-btn" data-tooltip="Help">?</button>
          <button id="crb-btn-race"     class="icon-btn" data-tooltip="Quick Race" style="color:#f59e0b">▶</button>
        </div>
      </div>

      <!-- help panel -->
      <div class="help-panel" id="crb-help-panel" style="display:none;">
        <strong>How to race:</strong><br>
        1. Design your car (body, color, decals)<br>
        2. Set performance stats with sliders<br>
        3. Choose race settings (track, laps, weather)<br>
        4. Click ▶ Quick Race or Confirm<br><br>
        <strong>Controls:</strong><br>
        Arrow keys / WASD = steer<br>
        Space = handbrake (drift!)<br>
        Shift = nitro boost (2s)<br><br>
        <strong>Tip:</strong> Edit the code panel to add custom race events!
      </div>

      <!-- scrollable form -->
      <div class="scroll-form">

        <!-- ── 1. CAR BUILDER ──────────────────────────────────────── -->
        <div class="asset-group">
          <div class="group-title">CAR BUILDER</div>

          <label>Car Name</label>
          <input type="text" id="crb-car-name" value="My Racer" placeholder="Name your car...">

          <label>Body Kit</label>
          <select id="crb-body-kit">
            <option value="stock">🏎️ Stock</option>
            <option value="sedan">🚗 Sedan</option>
            <option value="suv">🚙 SUV</option>
            <option value="formula">🏁 Formula</option>
            <option value="pickup">🛻 Pickup</option>
            <option value="muscle">🚓 Muscle</option>
          </select>

          <label>Colors</label>
          <div class="color-row">
            <label>Primary</label>
            <input type="color" id="crb-color-primary" value="#6366f1">
            <label>Secondary</label>
            <input type="color" id="crb-color-secondary" value="#f59e0b">
          </div>

          <label>Wheel Style</label>
          <select id="crb-wheel-style">
            <option value="stock">🔵 Stock</option>
            <option value="sport">⚫ Sport</option>
            <option value="slick">🔴 Racing Slicks</option>
            <option value="offroad">⚪ Off-Road</option>
            <option value="chrome">🟡 Chrome</option>
          </select>

          <label>Decal</label>
          <select id="crb-decal">
            <option value="none">None</option>
            <option value="flames">Flames 🔥</option>
            <option value="lightning">Lightning ⚡</option>
            <option value="stripes">Stripes</option>
            <option value="stars">Stars ⭐</option>
            <option value="camo">Camo</option>
          </select>
        </div>

        <!-- ── 2. PERFORMANCE STATS ────────────────────────────────── -->
        <div class="asset-group">
          <div class="group-title">PERFORMANCE STATS</div>
          <div class="stat-bar">
            <div class="stat-row">
              <label>Speed</label>
              <input type="range" class="crb-stat" id="stat-speed"        min="1" max="10" value="5">
              <span class="stat-val" id="val-speed">5</span>
            </div>
            <div class="stat-row">
              <label>Acceleration</label>
              <input type="range" class="crb-stat" id="stat-accel"        min="1" max="10" value="5">
              <span class="stat-val" id="val-accel">5</span>
            </div>
            <div class="stat-row">
              <label>Handling</label>
              <input type="range" class="crb-stat" id="stat-handling"     min="1" max="10" value="5">
              <span class="stat-val" id="val-handling">5</span>
            </div>
            <div class="stat-row">
              <label>Braking</label>
              <input type="range" class="crb-stat" id="stat-braking"      min="1" max="10" value="5">
              <span class="stat-val" id="val-braking">5</span>
            </div>
            <div class="stat-row">
              <label>Aerodynamics</label>
              <input type="range" class="crb-stat" id="stat-aero"         min="1" max="10" value="5">
              <span class="stat-val" id="val-aero">5</span>
            </div>
            <div class="stat-row">
              <label>Tire Grip</label>
              <input type="range" class="crb-stat" id="stat-grip"         min="1" max="10" value="5">
              <span class="stat-val" id="val-grip">5</span>
            </div>
          </div>
          <div class="power-rating">
            <div class="pr-label">Power Rating</div>
            <div class="pr-score" id="crb-power-score">300</div>
            <div class="pr-max">/ 600</div>
          </div>
        </div>

        <!-- ── 3. ENGINE & TIRES ───────────────────────────────────── -->
        <div class="asset-group">
          <div class="group-title">ENGINE &amp; TIRES</div>

          <label>Engine</label>
          <select id="crb-engine">
            <option value="stock4">🔧 Stock 4-Cyl</option>
            <option value="turbo4">⚡ Turbo 4-Cyl</option>
            <option value="v6">🔥 V6 Sport</option>
            <option value="v8">💨 V8 Muscle</option>
            <option value="v12">🚀 V12 Hypercar</option>
            <option value="electric">⚡ Electric Motor</option>
          </select>

          <label>Tires</label>
          <select id="crb-tires">
            <option value="allseason">🟤 All Season</option>
            <option value="sport">🔵 Sport Compound</option>
            <option value="slick">🔴 Racing Slick</option>
            <option value="offroad">⛰️ Off-Road</option>
            <option value="wet">🌧️ Wet Weather</option>
          </select>
        </div>

        <!-- ── 4. RACE SETTINGS ────────────────────────────────────── -->
        <div class="asset-group">
          <div class="group-title">RACE SETTINGS</div>

          <label>Track</label>
          <select id="crb-track">
            <option value="city_sprint">🏁 City Sprint</option>
            <option value="mountain_pass">🌄 Mountain Pass</option>
            <option value="desert_dash">🏜️ Desert Dash</option>
            <option value="coastal_circuit">🌊 Coastal Circuit</option>
            <option value="forest_rally">🌲 Forest Rally</option>
            <option value="night_circuit">🌙 Night Circuit</option>
          </select>

          <label>Laps</label>
          <input type="number" id="crb-laps" min="1" max="20" value="3">

          <label>AI Opponents</label>
          <input type="number" id="crb-opponents" min="0" max="7" value="3">

          <label>AI Difficulty</label>
          <select id="crb-difficulty">
            <option value="rookie">🐢 Rookie</option>
            <option value="amateur">🚗 Amateur</option>
            <option value="pro">🏎️ Pro</option>
            <option value="legend">💀 Legend</option>
          </select>

          <label>Weather</label>
          <select id="crb-weather">
            <option value="clear">☀️ Clear</option>
            <option value="rain">🌧️ Rain</option>
            <option value="snow">❄️ Snow</option>
            <option value="fog">🌫️ Fog</option>
          </select>
        </div>

        <!-- ── 5. UPGRADES / GARAGE ───────────────────────────────── -->
        <div class="asset-group">
          <div class="group-title">UPGRADES / GARAGE</div>
          <div class="crb-xp-label">XP: <span id="crb-xp-cur">0</span> / <span id="crb-xp-next">100</span></div>
          <div class="crb-xp-bar-wrap">
            <div class="crb-xp-bar" id="crb-xp-bar" style="width:0%"></div>
          </div>
          <div class="crb-badges" id="crb-badges">
            🏆 0 wins &nbsp;|&nbsp; ⭐ 0 stars &nbsp;|&nbsp; 🔓 0 unlocks
          </div>
          <button class="draw-btn draw-btn-danger" id="crb-reset-garage" style="margin-top:8px;">Reset Garage</button>
        </div>

        <!-- ── MULTIPLAYER ─────────────────────────────────────────── -->
        <div class="asset-group">
          <div class="group-title">MULTIPLAYER</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="draw-btn" id="crb-host-btn" style="flex:1">📡 Host Race</button>
            <button class="draw-btn" id="crb-join-btn" style="flex:1">🔗 Join Race</button>
          </div>
          <input type="text" id="crb-room-code" placeholder="Room code…" style="margin-top:6px;">
          <div id="crb-mp-status" style="font-size:0.68rem;color:#64748b;margin-top:4px;">Not connected</div>
        </div>

      </div><!-- /scroll-form -->
    </div><!-- /glass-panel creator-panel -->
  </div><!-- /col-asset -->

  <!-- ── Right panel ─────────────────────────────────────────────────── -->
  <div class="col-main view-split" id="crb-col-main">

    <!-- view controls -->
    <div class="view-controls">
      <button class="icon-btn" id="crb-view-code"  data-tooltip="Code Only">&#60;/&#62;</button>
      <button class="icon-btn" id="crb-view-split" data-tooltip="Split View" style="color:#6366f1">⊟</button>
      <button class="icon-btn" id="crb-view-game"  data-tooltip="Game Only">▶</button>
    </div>

    <!-- game panel -->
    <div class="glass-panel panel-game">
      <!-- HUD overlay -->
      <div class="race-hud" id="race-hud">
        <div class="race-hud-item hud-speed" id="hud-speed">🚗 0 km/h</div>
        <div class="race-hud-item hud-lap"   id="hud-lap">Lap 0 / 3</div>
        <div class="race-hud-item hud-pos"   id="hud-pos">P1</div>
        <div class="race-hud-item hud-nitro">
          ⚡
          <div class="hud-nitro-bar-wrap">
            <div class="hud-nitro-bar" id="hud-nitro-bar" style="width:100%"></div>
          </div>
        </div>
        <canvas id="crb-minimap" class="minimap-canvas" width="120" height="90"></canvas>
        <!-- pre-race track preview banner -->
        <div class="crb-preview" id="crb-preview" style="display:none;">
          <div class="crb-preview-box">
            <div class="crb-preview-label">Get Ready</div>
            <div class="crb-preview-track" id="crb-preview-track">City Sprint</div>
            <div class="crb-preview-sub">Find your car on the track ↓</div>
          </div>
          <div class="crb-preview-arrow"></div>
        </div>
        <!-- countdown -->
        <div class="crb-countdown" id="crb-countdown">
          <div class="crb-countdown-num" id="crb-countdown-num">3</div>
        </div>
        <!-- results -->
        <div class="crb-results" id="crb-results">
          <h2 id="crb-res-title">🏆 Race Complete!</h2>
          <div class="res-table" id="crb-res-table"></div>
          <div class="xp-gained" id="crb-xp-gained">+0 XP</div>
          <button id="crb-res-close">Play Again</button>
        </div>
      </div>
      <canvas id="race-canvas" width="900" height="580" style="display:block;width:100%;height:100%;border-radius:inherit;"></canvas>
    </div>

    <!-- code panel -->
    <div class="glass-panel code-panel panel-code">
      <textarea id="code-editor" class="code-layer" spellcheck="false">// 🏎️ Car Racing Builder — Custom Race Script
// Edit this code to customize your race experience!

// Called once when the race starts
function onRaceStart(race) {
  // race.cars  = array of all cars
  // race.track = current track data
  console.log('Race started on: ' + race.track.name);
}

// Called every frame during the race (~60 fps)
function onRaceUpdate(race, delta) {
  // race.playerCar = your car object
  // race.aiCars    = array of AI competitor objects
  // race.lap       = current lap number
  // Add boost zones, weather changes, custom events here!
}

// Called when any car completes a lap
function onLapComplete(car, lapNumber) {
  if (car.isPlayer) {
    console.log('Lap ' + lapNumber + ' complete!');
    // Give a small nitro boost on lap completion
    car.nitro = Math.min(car.nitro + 30, 100);
  }
}

// Called when the race ends
function onRaceEnd(results) {
  // results.winner    = the winning car object
  // results.times     = array of finish times (ms)
  // results.positions = ordered array of cars
  console.log('Winner: ' + results.winner.name);
}

// --- EXAMPLES ---

// Add a boost zone at (400, 200) with radius 50 — cars get 1.5x speed for 3s:
// race.addBoostZone({ x: 400, y: 200, radius: 50, multiplier: 1.5, duration: 3000 });

// Trigger an oil slick at (300, 350) — reduces grip for 4s:
// race.addHazard({ x: 300, y: 350, radius: 30, type: 'oil', duration: 4000 });

// Give the player unlimited nitro for 5 seconds:
// function onRaceStart(race) { setInterval(() => { race.playerCar.nitro = 100; }, 100); }
</textarea>
    </div>

  </div><!-- /col-main -->
</div><!-- /creator-layout -->

<!-- ══════════════════════════════════════════════════════════════════════
     RACING ENGINE
═══════════════════════════════════════════════════════════════════════ -->
<script type="module">
'use strict';

/* ─────────────────────────────────────────────
   CONSTANTS & CONFIG
───────────────────────────────────────────── */
const PYTHON_URI = (() => {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:8424';
  }
  return 'https://uesl.opencodingsociety.com';
})();

const STORAGE_KEY = 'crb_garage';

const DIFF_SPEED = { rookie: 0.45, amateur: 0.65, pro: 0.82, legend: 0.96 };

/* ── Track definitions (closed-loop center-line waypoints) ───────────── */
const TRACKS = {
  city_sprint: {
    name: 'City Sprint',
    bgColor: '#1a1a2e',
    roadColor: '#3a3a3a',
    lineColor: '#ffffff',
    edgeColor: '#f59e0b',
    width: 64,
    startIdx: 0,
    points: [
      {x:200,y:150},{x:400,y:140},{x:600,y:150},{x:700,y:200},
      {x:750,y:300},{x:700,y:420},{x:580,y:490},{x:420,y:500},
      {x:270,y:490},{x:160,y:420},{x:120,y:300},{x:150,y:200}
    ]
  },
  mountain_pass: {
    name: 'Mountain Pass',
    bgColor: '#0d1b2a',
    roadColor: '#4a4040',
    lineColor: '#ffffff',
    edgeColor: '#ef4444',
    width: 56,
    startIdx: 0,
    points: [
      {x:150,y:520},{x:200,y:420},{x:160,y:340},{x:250,y:280},
      {x:350,y:320},{x:300,y:230},{x:400,y:160},{x:500,y:200},
      {x:480,y:300},{x:580,y:260},{x:680,y:180},{x:750,y:280},
      {x:700,y:380},{x:620,y:440},{x:500,y:480},{x:350,y:500}
    ]
  },
  desert_dash: {
    name: 'Desert Dash',
    bgColor: '#1c1008',
    roadColor: '#5a4a30',
    lineColor: '#ffffff',
    edgeColor: '#f59e0b',
    width: 72,
    startIdx: 0,
    points: [
      {x:130,y:290},{x:260,y:160},{x:450,y:120},{x:640,y:160},
      {x:760,y:250},{x:780,y:390},{x:680,y:480},{x:500,y:510},
      {x:300,y:490},{x:160,y:410}
    ]
  },
  coastal_circuit: {
    name: 'Coastal Circuit',
    bgColor: '#071a2e',
    roadColor: '#334155',
    lineColor: '#e2e8f0',
    edgeColor: '#06b6d4',
    width: 60,
    startIdx: 0,
    points: [
      {x:200,y:200},{x:400,y:140},{x:600,y:180},{x:700,y:300},
      {x:600,y:380},{x:450,y:340},{x:350,y:400},{x:420,y:480},
      {x:600,y:500},{x:720,y:440},{x:760,y:340},
      {x:680,y:220},{x:550,y:160},{x:400,y:200},
      {x:280,y:320},{x:160,y:380},{x:120,y:300}
    ]
  },
  forest_rally: {
    name: 'Forest Rally',
    bgColor: '#071a0d',
    roadColor: '#2d3a20',
    lineColor: '#a7f3d0',
    edgeColor: '#22c55e',
    width: 52,
    startIdx: 0,
    points: [
      {x:160,y:180},{x:280,y:150},{x:340,y:240},{x:260,y:320},
      {x:320,y:400},{x:440,y:370},{x:520,y:300},{x:600,y:360},
      {x:660,y:460},{x:560,y:520},{x:420,y:510},{x:300,y:480},
      {x:180,y:450},{x:130,y:360},{x:150,y:270}
    ]
  },
  night_circuit: {
    name: 'Night Circuit',
    bgColor: '#050510',
    roadColor: '#12124a',
    lineColor: '#818cf8',
    edgeColor: '#a78bfa',
    width: 66,
    startIdx: 0,
    neon: true,
    points: [
      {x:200,y:480},{x:160,y:360},{x:180,y:240},{x:280,y:160},
      {x:400,y:130},{x:520,y:160},{x:640,y:240},{x:700,y:340},
      {x:680,y:440},{x:580,y:500},{x:450,y:520},{x:320,y:510}
    ]
  }
};

/* ── Decal draw functions ─────────────────────────────────────────────── */
const DECALS = {
  flames(ctx, w, h, col) {
    ctx.fillStyle = col;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-w*0.4 + i*w*0.3, -h*0.2);
      ctx.quadraticCurveTo(-w*0.35 + i*w*0.3, -h*0.5, -w*0.25 + i*w*0.3, -h*0.3);
      ctx.quadraticCurveTo(-w*0.15 + i*w*0.3, -h*0.55, -w*0.05 + i*w*0.3, -h*0.2);
      ctx.closePath();
      ctx.fill();
    }
  },
  lightning(ctx, w, h, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h*0.4); ctx.lineTo(-w*0.1, 0);
    ctx.lineTo(w*0.05, 0); ctx.lineTo(-w*0.08, h*0.4);
    ctx.stroke();
  },
  stripes(ctx, w, h, col) {
    ctx.fillStyle = col; ctx.globalAlpha = 0.5;
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(i*w*0.25 - 2, -h*0.45, 4, h*0.9);
    }
    ctx.globalAlpha = 1;
  },
  stars(ctx, w, h, col) {
    ctx.fillStyle = col;
    const drawStar = (cx, cy, r) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const b = ((i * 4 + 2) * Math.PI / 5) - Math.PI / 2;
        i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
                : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
        ctx.lineTo(cx + r*0.4*Math.cos(b), cy + r*0.4*Math.sin(b));
      }
      ctx.closePath(); ctx.fill();
    };
    drawStar(-w*0.25, -h*0.15, 6);
    drawStar( w*0.25, -h*0.15, 6);
    drawStar(0, h*0.1, 5);
  },
  camo(ctx, w, h, col) {
    ctx.globalAlpha = 0.45;
    const cols = ['#4ade80','#166534','#365314','#78716c'];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      const bx = (Math.random()-0.5)*w, by = (Math.random()-0.5)*h;
      ctx.ellipse(bx, by, w*0.18, h*0.12, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  none() {}
};

/* ── Body kit dimensions ─────────────────────────────────────────────── */
const BODY_DIMS = {
  stock:   { w: 36, h: 20 },
  sedan:   { w: 40, h: 19 },
  suv:     { w: 38, h: 22 },
  formula: { w: 44, h: 16 },
  pickup:  { w: 40, h: 22 },
  muscle:  { w: 42, h: 21 }
};

/* ─────────────────────────────────────────────
   GARAGE (localStorage persistence)
───────────────────────────────────────────── */
function loadGarage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {xp:0, level:1, wins:0, stars:0, unlocks:0}; }
  catch { return {xp:0, level:1, wins:0, stars:0, unlocks:0}; }
}
function saveGarage(g) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(g));
}
function addXP(amount) {
  const g = loadGarage();
  g.xp += amount;
  while (g.xp >= 100) { g.xp -= 100; g.level = (g.level || 1) + 1; g.unlocks = (g.unlocks || 0) + 1; }
  saveGarage(g);
  refreshGarageUI();
}
function refreshGarageUI() {
  const g = loadGarage();
  document.getElementById('crb-xp-cur').textContent  = g.xp;
  document.getElementById('crb-xp-next').textContent = 100;
  document.getElementById('crb-xp-bar').style.width  = g.xp + '%';
  document.getElementById('crb-badges').textContent   =
    `🏆 ${g.wins||0} wins | ⭐ ${g.stars||0} stars | 🔓 ${g.unlocks||0} unlocks`;
}

/* ─────────────────────────────────────────────
   TRACK GEOMETRY HELPERS
───────────────────────────────────────────── */
function trackSegments(points) {
  const segs = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i+1) % points.length];
    segs.push({ax:a.x, ay:a.y, bx:b.x, by:b.y});
  }
  return segs;
}

function nearestPointOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx-ax, dy = by-ay;
  const lenSq = dx*dx + dy*dy;
  if (lenSq === 0) return {x:ax, y:ay, t:0};
  const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / lenSq));
  return {x: ax + t*dx, y: ay + t*dy, t};
}

function distToTrack(px, py, segs) {
  let minDist = Infinity, nearSeg = 0, nearT = 0;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const np = nearestPointOnSegment(px, py, s.ax, s.ay, s.bx, s.by);
    const d = Math.hypot(px - np.x, py - np.y);
    if (d < minDist) { minDist = d; nearSeg = i; nearT = np.t; }
  }
  return {dist: minDist, seg: nearSeg, t: nearT};
}

/* Track "progress" scalar (0→1 per lap) from position */
function trackProgress(px, py, segs) {
  const n = segs.length;
  let minDist = Infinity, seg = 0, t = 0;
  for (let i = 0; i < n; i++) {
    const s = segs[i];
    const np = nearestPointOnSegment(px, py, s.ax, s.ay, s.bx, s.by);
    const d = Math.hypot(px - np.x, py - np.y);
    if (d < minDist) { minDist = d; seg = i; t = np.t; }
  }
  return (seg + t) / n;
}

/* Point along track at fraction f (0-1) */
function pointOnTrack(f, points) {
  const n = points.length;
  const i = Math.floor(f * n) % n;
  const j = (i + 1) % n;
  const lt = (f * n) - Math.floor(f * n);
  return {
    x: points[i].x + (points[j].x - points[i].x) * lt,
    y: points[i].y + (points[j].y - points[i].y) * lt
  };
}

/* ─────────────────────────────────────────────
   PARTICLE SYSTEM
───────────────────────────────────────────── */
class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color; this.size = size;
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vx *= 0.97; this.vy *= 0.97;
    this.life -= dt;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * a, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* ─────────────────────────────────────────────
   CAR CLASS
───────────────────────────────────────────── */
class Car {
  constructor(cfg) {
    this.name      = cfg.name || 'Racer';
    this.isPlayer  = cfg.isPlayer || false;
    this.x         = cfg.x || 0;
    this.y         = cfg.y || 0;
    this.angle     = cfg.angle || 0;
    this.speed     = 0;
    this.maxSpeed  = (cfg.statSpeed     || 5) * 28;  // px/s
    this.accel     = (cfg.statAccel     || 5) * 180;
    this.handling  = (cfg.statHandling  || 5) * 0.022;
    this.brakePow  = (cfg.statBraking   || 5) * 220;
    this.aero      = (cfg.statAero      || 5) * 0.004;
    this.gripBase  = (cfg.statGrip      || 5) * 0.1;
    this.color     = cfg.color     || '#6366f1';
    this.color2    = cfg.color2    || '#f59e0b';
    this.bodyKit   = cfg.bodyKit   || 'stock';
    this.wheelStyle = cfg.wheelStyle || 'stock';
    this.decal     = cfg.decal     || 'none';
    this.dims      = BODY_DIMS[this.bodyKit] || {w:36, h:20};
    // state
    this.velX      = 0;
    this.velY      = 0;
    this.driftAngle = 0;
    this.drift     = 0;
    this.nitro     = 100;
    this.nitroActive = false;
    this.nitroCooldown = 0;
    this.handbrake = false;
    this.lap       = 0;
    this.lapProgress = 0;
    this.lastProgress = 0;
    this.finishTime = null;
    this.finished  = false;
    this.aiWpIdx      = 0;
    this.stuckTimer   = 0;   // seconds NPC has been nearly stationary
    this.stuckX       = 0;
    this.stuckY       = 0;
    this.recovering   = 0;   // seconds left in reverse-recovery phase
    this.particles = [];
    this.boostMul  = 1;
    this.boostTimer = 0;
    // engine modifier
    const engMods = {stock4:1, turbo4:1.12, v6:1.22, v8:1.35, v12:1.5, electric:1.3};
    const tireMods = {allseason:1, sport:1.08, slick:1.15, offroad:0.9, wet:1.05};
    const em = engMods[cfg.engine || 'stock4'] || 1;
    const tm = tireMods[cfg.tires || 'allseason'] || 1;
    this.maxSpeed  *= em;
    this.gripBase  *= tm;
  }

  update(dt, keys, segs, trackDef, weatherMul, boostZones, hazards) {
    const pts = trackDef.points;
    const rw  = trackDef.width / 2;

    // weather grip modifier
    const grip = this.gripBase * weatherMul;

    // ── Player input ──────────────────────────────────────
    let throttle = 0, steer = 0, brake = false;
    if (this.isPlayer) {
      if (keys['ArrowUp']   || keys['w'] || keys['W']) throttle =  1;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) throttle = -0.5;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) steer = -1;
      if (keys['ArrowRight']|| keys['d'] || keys['D']) steer =  1;
      brake = keys[' '] === true;
      // nitro
      if ((keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'])
          && this.nitro > 0 && this.nitroCooldown <= 0) {
        this.nitroActive = true;
      }
      if (this.nitroActive) {
        this.nitro -= dt * 50;
        if (this.nitro <= 0) {
          this.nitro = 0; this.nitroActive = false; this.nitroCooldown = 10;
        }
      } else {
        this.nitro = Math.min(100, this.nitro + dt * 8);
      }
      if (this.nitroCooldown > 0) this.nitroCooldown -= dt;
      this.handbrake = brake;
    }

    // ── AI steering ───────────────────────────────────────
    if (!this.isPlayer) {
      // ── Stuck detection ──────────────────────────────────
      // Sample position every 0.5 s; if the car barely moved, declare stuck
      this.stuckTimer += dt;
      if (this.stuckTimer >= 0.5) {
        const moved = Math.hypot(this.x - this.stuckX, this.y - this.stuckY);
        if (moved < 8 && this.recovering <= 0) {
          // teleport-free recovery: reverse for 1.2 s then re-aim
          this.recovering = 1.2;
          // find the nearest waypoint ahead so the AI recovers toward track
          let bestDist = Infinity, bestIdx = this.aiWpIdx;
          for (let i = 0; i < pts.length; i++) {
            const d = Math.hypot(pts[i].x - this.x, pts[i].y - this.y);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
          }
          this.aiWpIdx = (bestIdx + 2) % pts.length; // aim 2 WPs ahead of nearest
          this.driftAngle = 0;
          this.drift      = 0;
        }
        this.stuckTimer = 0;
        this.stuckX = this.x;
        this.stuckY = this.y;
      }

      if (this.recovering > 0) {
        // Reverse + steer hard to get off the wall
        this.recovering -= dt;
        throttle = -1;
        steer = 1; // always turn right while reversing; flips direction quickly
      } else {
        throttle = 1;
        // Snap to nearest waypoint if drastically off-course
        const curTarget = pts[this.aiWpIdx % pts.length];
        const dx0 = curTarget.x - this.x, dy0 = curTarget.y - this.y;
        if (Math.hypot(dx0, dy0) < 30) {
          this.aiWpIdx = (this.aiWpIdx + 1) % pts.length;
        }
        const target = pts[this.aiWpIdx % pts.length];
        const dx = target.x - this.x, dy = target.y - this.y;
        const desiredAngle = Math.atan2(dy, dx);
        let aDiff = desiredAngle - this.angle;
        while (aDiff >  Math.PI) aDiff -= Math.PI * 2;
        while (aDiff < -Math.PI) aDiff += Math.PI * 2;
        steer = Math.sign(aDiff) * Math.min(1, Math.abs(aDiff) / 0.5);
      }
    }

    // ── Nitro boost ────────────────────────────────────────
    const nitroMul = (this.isPlayer && this.nitroActive) ? 1.5 : 1;
    // external boost zones
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
    } else {
      this.boostMul = 1;
    }

    // ── Acceleration / braking ────────────────────────────
    const maxSp = this.maxSpeed * nitroMul * this.boostMul;
    if (throttle > 0) {
      this.speed = Math.min(maxSp, this.speed + this.accel * dt * throttle);
    } else if (throttle < 0) {
      this.speed = Math.max(maxSp * throttle, this.speed + this.brakePow * dt * throttle);
    } else {
      // aero drag
      this.speed *= (1 - this.aero * 60 * dt);
      if (Math.abs(this.speed) < 1) this.speed = 0;
    }
    // handbrake
    if (brake) {
      this.speed *= Math.max(0, 1 - this.brakePow * 0.003 * dt * 60);
    }

    // ── Steering & drift ──────────────────────────────────
    const speedFrac = Math.abs(this.speed) / this.maxSpeed;
    const turnRate  = this.handling * Math.sign(this.speed);
    const driftTrigger = brake && speedFrac > 0.4;
    if (driftTrigger) {
      this.drift = Math.min(1, this.drift + dt * 3);
    } else {
      this.drift = Math.max(0, this.drift - dt * 2);
    }
    this.driftAngle = this.driftAngle * (1 - grip * dt * 5) + steer * this.drift * 0.8 * dt * 60;
    this.angle += steer * turnRate * 60 * dt * (1 - this.drift * 0.3);

    // ── Move ──────────────────────────────────────────────
    const moveAngle = this.angle + this.driftAngle;
    this.x += Math.cos(moveAngle) * this.speed * dt;
    this.y += Math.sin(moveAngle) * this.speed * dt;

    // ── Track boundary push-back ──────────────────────────
    const nearest = distToTrack(this.x, this.y, segs);
    if (nearest.dist > rw - 4) {
      // find nearest segment endpoint and push toward track center
      const seg = segs[nearest.seg];
      const np  = nearestPointOnSegment(this.x, this.y, seg.ax, seg.ay, seg.bx, seg.by);
      const pushDist = rw - 4;
      const nx = this.x - np.x, ny = this.y - np.y;
      const nl = Math.hypot(nx, ny) || 1;
      this.x = np.x + (nx / nl) * pushDist;
      this.y = np.y + (ny / nl) * pushDist;
      this.speed *= 0.55;
    }

    // ── Boost zones ───────────────────────────────────────
    if (boostZones) {
      for (const bz of boostZones) {
        if (Math.hypot(this.x - bz.x, this.y - bz.y) < bz.radius) {
          this.boostMul   = bz.multiplier;
          this.boostTimer = bz.duration / 1000;
        }
      }
    }

    // ── Hazards (oil, etc.) ───────────────────────────────
    if (hazards) {
      for (const hz of hazards) {
        if (hz.active && Math.hypot(this.x - hz.x, this.y - hz.y) < hz.radius) {
          if (hz.type === 'oil') { this.drift = 1; }
        }
      }
    }

    // ── Particles ─────────────────────────────────────────
    if (this.drift > 0.3 || (this.isPlayer && driftTrigger)) {
      const smokeX = this.x - Math.cos(this.angle) * this.dims.h * 0.5;
      const smokeY = this.y - Math.sin(this.angle) * this.dims.h * 0.5;
      this.particles.push(new Particle(smokeX, smokeY,
        (Math.random()-0.5)*30, (Math.random()-0.5)*30,
        0.6, '#94a3b8', 5 + Math.random()*4));
    }
    if (this.isPlayer && this.nitroActive) {
      const sx = this.x - Math.cos(this.angle) * this.dims.h;
      const sy = this.y - Math.sin(this.angle) * this.dims.h;
      this.particles.push(new Particle(sx, sy,
        -Math.cos(this.angle)*60 + (Math.random()-0.5)*40,
        -Math.sin(this.angle)*60 + (Math.random()-0.5)*40,
        0.4, '#60a5fa', 4));
    }

    // update particles
    this.particles = this.particles.filter(p => { p.update(dt); return p.life > 0; });

    // ── Lap progress ──────────────────────────────────────
    const prog = trackProgress(this.x, this.y, segs);
    // Tick down grace-period cooldown (seeded in startRace to prevent false
    // start-line crossing on the very first movement)
    if (this.lapCooldown > 0) {
      this.lapCooldown -= dt;
      this.lastProgress = prog;
      this.lapProgress  = prog;
      return null;
    }
    // Detect crossing start/finish: progress wraps from ~1 back to ~0
    if (this.lastProgress > 0.85 && prog < 0.15) {
      this.lastProgress = prog;
      this.lapProgress  = prog;
      this.lapCooldown  = 2; // prevent double-counting for 2s after each lap
      return 'lap';
    }
    this.lastProgress = prog;
    this.lapProgress  = prog;
    return null;
  }

  draw(ctx, camX, camY) {
    const sx = this.x - camX, sy = this.y - camY;
    const {w, h} = this.dims;

    // draw particles first (behind car)
    for (const p of this.particles) p.draw(ctx);

    // len = dimension along direction of travel (x-axis when angle=0)
    // wid = dimension perpendicular (y-axis when angle=0)
    const len = w, wid = h;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle + this.driftAngle);

    // car body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-len/2, -wid/2, len, wid, 4);
    ctx.fill();

    // secondary color roof stripe
    ctx.fillStyle = this.color2;
    ctx.beginPath();
    ctx.roundRect(-len*0.15, -wid*0.38, len*0.4, wid*0.76, 3);
    ctx.fill();

    // decal
    if (DECALS[this.decal]) DECALS[this.decal](ctx, len, wid, this.color2);

    // wheels
    const wheelColor = {
      stock:'#374151', sport:'#111827', slick:'#dc2626', offroad:'#6b7280', chrome:'#fbbf24'
    }[this.wheelStyle] || '#374151';
    ctx.fillStyle = wheelColor;
    const ww = 5, wh = 9;
    // front-left, front-right, rear-left, rear-right
    [[ len*0.33, -wid*0.42], [ len*0.33,  wid*0.42],
     [-len*0.33, -wid*0.42], [-len*0.33,  wid*0.42]].forEach(([wx, wy]) => {
      ctx.beginPath();
      ctx.roundRect(wx - wh/2, wy - ww/2, wh, ww, 2);
      ctx.fill();
    });

    // headlights (front = positive x, direction of travel)
    ctx.fillStyle = '#fef9c3';
    ctx.shadowColor = '#fef08a'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc( len*0.45, -wid*0.3, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( len*0.45,  wid*0.3, 3, 0, Math.PI*2); ctx.fill();

    // taillights (rear = negative x)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(-len*0.45, -wid*0.3, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-len*0.45,  wid*0.3, 2.5, 0, Math.PI*2); ctx.fill();

    ctx.shadowBlur = 0;

    // player indicator
    if (this.isPlayer) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(len, wid) * 0.65, 0, Math.PI*2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/* ─────────────────────────────────────────────
   WEATHER EFFECTS
───────────────────────────────────────────── */
function drawWeather(ctx, W, H, weather, t) {
  if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(147,197,253,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const rx = ((i * 137 + t * 200) % W);
      const ry = ((i * 97  + t * 400) % H);
      ctx.beginPath();
      ctx.moveTo(rx, ry); ctx.lineTo(rx + 4, ry + 14);
      ctx.stroke();
    }
  } else if (weather === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 50; i++) {
      const rx = ((i * 173 + t * 40) % W);
      const ry = ((i * 113 + t * 60) % H);
      ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI*2); ctx.fill();
    }
  } else if (weather === 'fog') {
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H));
    grad.addColorStop(0,   'rgba(148,163,184,0)');
    grad.addColorStop(0.6, 'rgba(148,163,184,0.12)');
    grad.addColorStop(1,   'rgba(148,163,184,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ─────────────────────────────────────────────
   DRAW TRACK
───────────────────────────────────────────── */
function drawTrack(ctx, trackDef, camX, camY, W, H) {
  const pts  = trackDef.points;
  const rw   = trackDef.width;
  const isNight = trackDef.neon;

  // background
  ctx.fillStyle = trackDef.bgColor;
  ctx.fillRect(0, 0, W, H);

  // optional decorative grid for city / night
  if (isNight) {
    ctx.strokeStyle = 'rgba(99,102,241,0.08)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
    }
  }

  const toPt = (p) => ({x: p.x - camX, y: p.y - camY});

  // road surface
  ctx.lineWidth   = rw;
  ctx.strokeStyle = trackDef.roadColor;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  if (isNight) {
    ctx.shadowColor = trackDef.lineColor;
    ctx.shadowBlur  = 8;
  }
  ctx.beginPath();
  const p0 = toPt(pts[0]);
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i <= pts.length; i++) {
    const p = toPt(pts[i % pts.length]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // edge lines
  ctx.lineWidth   = rw + 4;
  ctx.strokeStyle = trackDef.edgeColor;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i <= pts.length; i++) {
    const p = toPt(pts[i % pts.length]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // center dashes
  ctx.lineWidth   = 2;
  ctx.strokeStyle = trackDef.lineColor;
  ctx.setLineDash([18, 18]);
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i <= pts.length; i++) {
    const p = toPt(pts[i % pts.length]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // start/finish line
  const sp = toPt(pts[0]), sp2 = toPt(pts[1]);
  const ang = Math.atan2(sp2.y - sp.y, sp2.x - sp.x) + Math.PI / 2;
  ctx.save();
  ctx.translate(sp.x, sp.y);
  ctx.rotate(ang);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#000000';
    ctx.fillRect(-rw/2 + i*(rw/8), -3, rw/8, 6);
  }
  ctx.restore();
}

/* ─────────────────────────────────────────────
   DRAW MINIMAP
───────────────────────────────────────────── */
function drawMinimap(mmCtx, trackDef, cars) {
  const W = 120, H = 90;
  mmCtx.clearRect(0, 0, W, H);
  mmCtx.fillStyle = 'rgba(0,0,0,0.7)';
  mmCtx.fillRect(0, 0, W, H);

  // find track bounds
  const pts = trackDef.points;
  let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
  pts.forEach(p => { mnX=Math.min(mnX,p.x); mxX=Math.max(mxX,p.x); mnY=Math.min(mnY,p.y); mxY=Math.max(mxY,p.y); });
  const scX = (W-16) / (mxX - mnX || 1);
  const scY = (H-12) / (mxY - mnY || 1);
  const sc  = Math.min(scX, scY);
  const offX = 8 + ((W-16) - (mxX-mnX)*sc)/2;
  const offY = 6 + ((H-12) - (mxY-mnY)*sc)/2;
  const tp = p => ({x: offX + (p.x - mnX)*sc, y: offY + (p.y - mnY)*sc});

  // track
  mmCtx.strokeStyle = '#475569'; mmCtx.lineWidth = 6; mmCtx.lineCap='round'; mmCtx.lineJoin='round';
  mmCtx.beginPath();
  const mp0 = tp(pts[0]); mmCtx.moveTo(mp0.x, mp0.y);
  for (let i = 1; i <= pts.length; i++) { const p = tp(pts[i%pts.length]); mmCtx.lineTo(p.x, p.y); }
  mmCtx.stroke();

  // cars
  cars.forEach(c => {
    const cp = tp({x:c.x, y:c.y});
    mmCtx.fillStyle = c.isPlayer ? '#f59e0b' : '#ef4444';
    mmCtx.beginPath(); mmCtx.arc(cp.x, cp.y, c.isPlayer ? 4 : 3, 0, Math.PI*2); mmCtx.fill();
  });
}

/* ─────────────────────────────────────────────
   RACE MANAGER
───────────────────────────────────────────── */
class RaceManager {
  constructor() {
    this.canvas    = document.getElementById('race-canvas');
    this.ctx       = this.canvas.getContext('2d');
    this.mmCanvas  = document.getElementById('crb-minimap');
    this.mmCtx     = this.mmCanvas.getContext('2d');
    this.running   = false;
    this.countdown = false;
    this.t         = 0;
    this.lastTime  = 0;
    this.keys      = {};
    this.cars      = [];
    this.boostZones = [];
    this.hazards   = [];
    this.camX      = 0; this.camY = 0;
    this.targetCamX = 0; this.targetCamY = 0;
    this.trackDef  = TRACKS.city_sprint;
    this.segs      = trackSegments(this.trackDef.points);
    this.totalLaps = 3;
    this.weather   = 'clear';
    this.weatherMul = 1;
    this.userHooks = { onRaceStart: null, onRaceUpdate: null, onLapComplete: null, onRaceEnd: null };
    this.startTime = 0;
    this.raceEnded = false;
    this._raf      = null;

    // resize canvas to panel
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.canvas.parentElement);
    this._resize();

    // keyboard
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key) && this.running) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; });
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.canvas.width  = rect.width;
      this.canvas.height = rect.height;
    }
  }

  /* Build car list from UI config */
  buildConfig() {
    const g = id => document.getElementById(id);
    const statVal = sid => parseInt(g(sid).value);
    return {
      name:         g('crb-car-name').value || 'My Racer',
      bodyKit:      g('crb-body-kit').value,
      color:        g('crb-color-primary').value,
      color2:       g('crb-color-secondary').value,
      wheelStyle:   g('crb-wheel-style').value,
      decal:        g('crb-decal').value,
      engine:       g('crb-engine').value,
      tires:        g('crb-tires').value,
      statSpeed:    statVal('stat-speed'),
      statAccel:    statVal('stat-accel'),
      statHandling: statVal('stat-handling'),
      statBraking:  statVal('stat-braking'),
      statAero:     statVal('stat-aero'),
      statGrip:     statVal('stat-grip'),
      trackKey:     g('crb-track').value,
      totalLaps:    parseInt(g('crb-laps').value) || 3,
      opponents:    parseInt(g('crb-opponents').value) || 3,
      difficulty:   g('crb-difficulty').value,
      weather:      g('crb-weather').value
    };
  }

  /* Start race with current UI config */
  startRace() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this.raceEnded = false;
    document.getElementById('crb-results').classList.remove('visible');

    const cfg      = this.buildConfig();
    this.trackDef  = TRACKS[cfg.trackKey] || TRACKS.city_sprint;
    this.segs      = trackSegments(this.trackDef.points);
    this.totalLaps = cfg.totalLaps;
    this.weather   = cfg.weather;
    this.weatherMul = {clear:1, rain:0.72, snow:0.5, fog:0.88}[cfg.weather] || 1;
    this.boostZones = [];
    this.hazards   = [];

    // place player car at start
    const sp = this.trackDef.points[0];
    const sp2= this.trackDef.points[1];
    const startAngle = Math.atan2(sp2.y - sp.y, sp2.x - sp.x);
    this.camX = sp.x - this.canvas.width  / 2;
    this.camY = sp.y - this.canvas.height / 2;

    const playerCar = new Car({
      ...cfg,
      x: sp.x, y: sp.y + 10, angle: startAngle,
      isPlayer: true
    });

    // AI cars
    const diffSpeed = DIFF_SPEED[cfg.difficulty] || 0.65;
    const aiColors  = ['#ef4444','#22c55e','#f59e0b','#06b6d4','#a78bfa','#f97316','#ec4899'];
    const aiNames   = ['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Ghost'];
    const aiCars    = [];
    for (let i = 0; i < Math.min(cfg.opponents, 7); i++) {
      const offset = (i + 1) * 20;
      const ai = new Car({
        name: aiNames[i],
        bodyKit: ['stock','sedan','formula','muscle','suv','pickup','stock'][i % 7],
        color: aiColors[i],
        color2: '#ffffff',
        wheelStyle: 'sport',
        decal: 'none',
        engine: 'v6',
        tires: 'sport',
        statSpeed:    Math.round(diffSpeed * 10 * (0.8 + Math.random()*0.4)),
        statAccel:    Math.round(diffSpeed * 10 * (0.8 + Math.random()*0.4)),
        statHandling: Math.round(diffSpeed * 10),
        statBraking:  5,
        statAero:     5,
        statGrip:     5,
        x: sp.x - Math.cos(startAngle)*offset,
        y: sp.y - Math.sin(startAngle)*offset + (i%2===0 ? -15 : 15),
        angle: startAngle,
        isPlayer: false
      });
      ai.aiWpIdx = 1;
      ai.stuckX  = ai.x;
      ai.stuckY  = ai.y;
      aiCars.push(ai);
    }

    this.cars = [playerCar, ...aiCars];
    this.playerCar = playerCar;

    // Seed lastProgress from actual position so the start-line crossing
    // check never fires falsely on the first movement
    for (const car of this.cars) {
      car.lastProgress = trackProgress(car.x, car.y, this.segs);
      car.lapCooldown  = 3; // seconds of grace before first lap can register
    }

    // try to load user hooks from code editor
    this._loadUserHooks();

    // fire onRaceStart
    const raceObj = this._raceObj();
    if (this.userHooks.onRaceStart) {
      try { this.userHooks.onRaceStart(raceObj); } catch(e) { console.warn('onRaceStart error', e); }
    }

    // update HUD laps
    document.getElementById('hud-lap').textContent = `Lap 0 / ${this.totalLaps}`;

    // show track preview AND run countdown at the same time
    const stopPreview = this._showPreview();
    this._doCountdown(() => {
      stopPreview();
      this.running   = true;
      this.startTime = performance.now();
      this.t         = 0;
      this.lastTime  = performance.now();
      this._raf      = requestAnimationFrame(ts => this._loop(ts));
    });
  }

  // Starts the static pre-race render loop and returns a stop() function.
  // The caller decides when to stop (e.g. when the countdown finishes).
  _showPreview() {
    document.getElementById('crb-preview-track').textContent = this.trackDef.name;
    document.getElementById('crb-preview').style.display = 'flex';

    const W = this.canvas.width, H = this.canvas.height;
    const ctx = this.ctx;

    let raf;
    const renderStatic = () => {
      ctx.clearRect(0, 0, W, H);
      drawTrack(ctx, this.trackDef, this.camX, this.camY, W, H);
      drawWeather(ctx, W, H, this.weather, 0);

      for (const car of this.cars) car.draw(ctx, this.camX, this.camY);

      // glowing "YOU" arrow so the player spots their car instantly
      const px = this.playerCar.x - this.camX;
      const py = this.playerCar.y - this.camY;
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'var(--pref-accent-color, #4CAFEF)';
      ctx.shadowColor = 'var(--pref-accent-color, #4CAFEF)';
      ctx.shadowBlur = 8;
      ctx.fillText('YOU', px, py - 28);
      ctx.beginPath();
      ctx.moveTo(px - 6, py - 24);
      ctx.lineTo(px + 6, py - 24);
      ctx.lineTo(px,     py - 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      drawMinimap(this.mmCtx, this.trackDef, this.cars);
      raf = requestAnimationFrame(renderStatic);
    };
    raf = requestAnimationFrame(renderStatic);

    return () => {
      cancelAnimationFrame(raf);
      document.getElementById('crb-preview').style.display = 'none';
    };
  }

  _doCountdown(cb) {
    const numEl = document.getElementById('crb-countdown-num');
    numEl.classList.remove('go');
    const steps = ['3','2','1','GO!'];
    let i = 0;
    const next = () => {
      if (i >= steps.length) { numEl.style.display = 'none'; cb(); return; }
      numEl.style.display = 'block';
      numEl.style.animation = 'none';
      numEl.textContent = steps[i];
      if (steps[i] === 'GO!') numEl.classList.add('go');
      // force reflow to restart animation
      void numEl.offsetWidth;
      numEl.style.animation = '';
      i++;
      setTimeout(next, 900);
    };
    next();
  }

  _loop(ts) {
    if (!this.running) return;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    this.t += dt;

    const W = this.canvas.width, H = this.canvas.height;
    const ctx = this.ctx;

    // user update hook
    const raceObj = this._raceObj();
    if (this.userHooks.onRaceUpdate) {
      try { this.userHooks.onRaceUpdate(raceObj, dt); } catch(e) {}
    }

    // update cars
    for (const car of this.cars) {
      const signal = car.update(dt, this.keys, this.segs, this.trackDef, this.weatherMul, this.boostZones, this.hazards);
      if (signal === 'lap') {
        car.lap++;
        if (this.userHooks.onLapComplete) {
          try { this.userHooks.onLapComplete(car, car.lap); } catch(e) {}
        }
        // update HUD
        if (car.isPlayer) {
          document.getElementById('hud-lap').textContent = `Lap ${Math.min(car.lap, this.totalLaps)} / ${this.totalLaps}`;
        }
        // check finish
        if (car.lap >= this.totalLaps && !car.finished) {
          car.finished   = true;
          car.finishTime = this.t;
        }
      }
    }

    // check if player finished
    if (this.playerCar.finished && !this.raceEnded) {
      this.raceEnded = true;
      this._endRace();
    }

    // smooth camera follow player
    const tCX = this.playerCar.x - W / 2;
    const tCY = this.playerCar.y - H / 2;
    this.camX += (tCX - this.camX) * Math.min(1, 5 * dt);
    this.camY += (tCY - this.camY) * Math.min(1, 5 * dt);

    // ── RENDER ────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // track
    drawTrack(ctx, this.trackDef, this.camX, this.camY, W, H);

    // boost zones
    for (const bz of this.boostZones) {
      ctx.save();
      ctx.translate(bz.x - this.camX, bz.y - this.camY);
      ctx.fillStyle = 'rgba(251,191,36,0.25)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, bz.radius, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⚡', 0, 5);
      ctx.restore();
    }

    // hazards
    for (const hz of this.hazards) {
      if (!hz.active) continue;
      ctx.save();
      ctx.translate(hz.x - this.camX, hz.y - this.camY);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 0, hz.radius, hz.radius*0.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // cars (draw furthest first)
    const sortedCars = [...this.cars].sort((a,b) => {
      const pa = a.lapProgress + a.lap, pb = b.lapProgress + b.lap;
      return pa - pb;
    });
    for (const car of sortedCars) car.draw(ctx, this.camX, this.camY);

    // weather FX
    drawWeather(ctx, W, H, this.weather, this.t);

    // night track: headlight glow around player
    if (this.trackDef.neon) {
      const cx = this.playerCar.x - this.camX;
      const cy = this.playerCar.y - this.camY;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160);
      grad.addColorStop(0,   'rgba(254,249,195,0.18)');
      grad.addColorStop(1,   'rgba(254,249,195,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    }

    // ── HUD UPDATE ─────────────────────────────────────────
    const spKmh = Math.abs(Math.round(this.playerCar.speed * 0.5));
    document.getElementById('hud-speed').textContent = `🚗 ${spKmh} km/h`;
    document.getElementById('hud-nitro-bar').style.width = this.playerCar.nitro + '%';

    // position
    const sortedPos = [...this.cars].sort((a,b) =>
      (b.lap + b.lapProgress) - (a.lap + a.lapProgress));
    const pos = sortedPos.findIndex(c => c.isPlayer) + 1;
    const suffix = ['st','nd','rd'][pos-1] || 'th';
    document.getElementById('hud-pos').textContent = `P${pos}${suffix}`;

    // minimap
    drawMinimap(this.mmCtx, this.trackDef, this.cars);

    this._raf = requestAnimationFrame(ts => this._loop(ts));
  }

  _raceObj() {
    const self = this;
    return {
      cars:      this.cars,
      playerCar: this.playerCar,
      aiCars:    this.cars.filter(c => !c.isPlayer),
      track:     { name: this.trackDef.name, points: this.trackDef.points },
      lap:       this.playerCar.lap,
      addBoostZone(bz) { self.boostZones.push(bz); },
      addHazard(hz)    { hz.active = true; self.hazards.push(hz); }
    };
  }

  _endRace() {
    this.running = false;

    const elapsedMs = this.t * 1000;
    const finishedCars = this.cars.filter(c => c.finished)
      .sort((a,b) => a.finishTime - b.finishTime);
    const position = finishedCars.findIndex(c => c.isPlayer) + 1;
    const winner   = finishedCars[0] || this.cars[0];

    if (this.userHooks.onRaceEnd) {
      try {
        this.userHooks.onRaceEnd({
          winner,
          times: finishedCars.map(c => c.finishTime * 1000),
          positions: finishedCars
        });
      } catch(e) {}
    }

    // XP award
    let xpGain = 10;
    if (position === 1) xpGain = 50;
    else if (position <= 3) xpGain = 25;

    // update garage
    const g = loadGarage();
    if (position === 1) g.wins = (g.wins || 0) + 1;
    if (position <= 3)  g.stars = (g.stars || 0) + 1;
    saveGarage(g);
    addXP(xpGain);

    // build results table
    const fmt = ms => {
      const s = ms / 1000;
      return `${Math.floor(s/60)}:${(s%60).toFixed(2).padStart(5,'0')}`;
    };
    const rows = finishedCars.slice(0, 8).map((c, i) =>
      `<div class="res-row"><span>${i+1}. ${c.name}</span><span>${fmt(c.finishTime * 1000)}</span></div>`
    ).join('');

    const titles = ['🏆 WINNER!', '🥈 2nd Place!', '🥉 3rd Place!', '🏁 Race Done!'];
    document.getElementById('crb-res-title').textContent = titles[Math.min(position-1, 3)] || '🏁 Finished!';
    document.getElementById('crb-res-table').innerHTML  = rows;
    document.getElementById('crb-xp-gained').textContent = `+${xpGain} XP earned`;
    document.getElementById('crb-results').classList.add('visible');
  }

  _loadUserHooks() {
    const code = document.getElementById('code-editor').value;
    try {
      const fn = new Function(code + `
        return {
          onRaceStart:   typeof onRaceStart   === 'function' ? onRaceStart   : null,
          onRaceUpdate:  typeof onRaceUpdate   === 'function' ? onRaceUpdate  : null,
          onLapComplete: typeof onLapComplete  === 'function' ? onLapComplete : null,
          onRaceEnd:     typeof onRaceEnd      === 'function' ? onRaceEnd     : null
        };
      `);
      this.userHooks = fn();
    } catch(e) {
      console.warn('[CRB] Could not parse user hooks:', e.message);
      this.userHooks = {};
    }
  }

  /* Idle frame (shows track before race) */
  drawIdle() {
    const W = this.canvas.width, H = this.canvas.height;
    const ctx = this.ctx;
    const td  = this.trackDef;
    ctx.clearRect(0, 0, W, H);
    // center camera on track centroid
    const pts = td.points;
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p.x; cy += p.y; });
    cx /= pts.length; cy /= pts.length;
    this.camX = cx - W/2; this.camY = cy - H/2;
    drawTrack(ctx, td, this.camX, this.camY, W, H);
    // overlay text
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${td.name}`, W/2, H/2 - 16);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Press ▶ Quick Race or click Confirm to start', W/2, H/2 + 16);
  }
}

/* ─────────────────────────────────────────────
   STAT SLIDERS
───────────────────────────────────────────── */
function initStatSliders() {
  const statIds = ['speed','accel','handling','braking','aero','grip'];
  const updatePower = () => {
    const total = statIds.reduce((sum, id) => sum + parseInt(document.getElementById('stat-'+id).value), 0);
    document.getElementById('crb-power-score').textContent = total * 10;
  };
  statIds.forEach(id => {
    const slider = document.getElementById('stat-' + id);
    const valEl  = document.getElementById('val-'  + id);
    slider.addEventListener('input', () => {
      valEl.textContent = slider.value;
      updatePower();
    });
  });
  updatePower();
}

/* ─────────────────────────────────────────────
   VIEW TOGGLE (code / split / game)
───────────────────────────────────────────── */
function initViewControls(race) {
  const main = document.getElementById('crb-col-main');
  const views = ['code', 'split', 'game'];
  const btns  = ['crb-view-code', 'crb-view-split', 'crb-view-game'];
  const setView = v => {
    main.className = `col-main view-${v}`;
    btns.forEach((bid, i) => {
      document.getElementById(bid).style.color = views[i] === v ? '#f59e0b' : '';
    });
    // re-render idle when switching to game / split view
    if (v !== 'code' && !race.running) setTimeout(() => race.drawIdle(), 50);
  };
  btns.forEach((bid, i) => {
    document.getElementById(bid).addEventListener('click', () => setView(views[i]));
  });
}

/* ─────────────────────────────────────────────
   MULTIPLAYER (Socket.IO)
───────────────────────────────────────────── */
function initMultiplayer(race) {
  let socket = null;
  let _pendingAction = null; // { type: 'host'|'join', room, code }
  const statusEl  = document.getElementById('crb-mp-status');
  const roomInput = document.getElementById('crb-room-code');

  function mpStatus(msg, color) {
    statusEl.textContent = msg;
    statusEl.style.color = color || '#94a3b8';
  }

  function doDisconnect() {
    if (socket) { socket.disconnect(); socket = null; }
  }

  const connect = () => {
    if (socket && socket.connected) return socket;
    doDisconnect();
    mpStatus('Connecting…', '#f59e0b');
    socket = io(PYTHON_URI, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      if (_pendingAction) {
        const { type, room, code } = _pendingAction;
        if (type === 'host') {
          roomInput.value = code;
          socket.emit('crb:host', { room: code, config: race.buildConfig() });
          mpStatus(`Hosting room: ${code} — share with a friend`, '#22c55e');
        } else {
          socket.emit('crb:join', { room, config: race.buildConfig() });
          mpStatus(`Joining ${room}…`, '#f59e0b');
        }
        _pendingAction = null;
      } else {
        mpStatus('Connected ✓', '#22c55e');
      }
    });

    socket.on('crb:room-joined', ({ room }) => {
      mpStatus(`In room ${room} — race ready!`, '#22c55e');
    });

    socket.on('crb:join-error', ({ msg }) => {
      mpStatus(`⚠ ${msg || 'Could not join — check the room code.'}`, '#ef4444');
    });

    socket.on('crb:player-update', data => {
      const remCar = race.cars.find(c => c.name === data.name && !c.isPlayer);
      if (remCar) { remCar.x = data.x; remCar.y = data.y; remCar.angle = data.angle; }
    });

    socket.on('crb:race-start', () => {
      mpStatus('Race started!', '#22c55e');
      race.startRace();
    });

    socket.on('disconnect', reason => {
      if (reason === 'transport upgrade') return;
      mpStatus('Connection lost — reconnecting…', '#f59e0b');
    });

    socket.on('reconnect', () => {
      mpStatus('Reconnected ✓', '#22c55e');
    });

    socket.on('reconnect_failed', () => {
      mpStatus('⚠ Could not reconnect. Try hosting/joining again.', '#ef4444');
    });

    socket.on('connect_error', err => {
      mpStatus('⚠ Could not reach server — check your connection and try again.', '#ef4444');
    });

    return socket;
  };

  document.getElementById('crb-host-btn').addEventListener('click', () => {
    const code = Math.random().toString(36).slice(2,8).toUpperCase();
    _pendingAction = { type: 'host', code, room: code };
    connect();
  });

  document.getElementById('crb-join-btn').addEventListener('click', () => {
    const room = roomInput.value.trim().toUpperCase();
    if (!room) { mpStatus('Enter a room code first', '#ef4444'); return; }
    _pendingAction = { type: 'join', room };
    connect();
  });

  // broadcast player position every 50ms while racing
  setInterval(() => {
    if (!socket || !socket.connected || !race.running || !race.playerCar) return;
    socket.emit('crb:player-update', {
      name:  race.playerCar.name,
      x:     race.playerCar.x,
      y:     race.playerCar.y,
      angle: race.playerCar.angle
    });
  }, 50);
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
const race = new RaceManager();

initStatSliders();
initViewControls(race);
initMultiplayer(race);
refreshGarageUI();

// Panel buttons
document.getElementById('crb-btn-race').addEventListener('click', () => {
  // switch to split/game view
  document.getElementById('crb-col-main').className = 'col-main view-split';
  race.startRace();
});
document.getElementById('crb-btn-confirm').addEventListener('click', () => {
  document.getElementById('crb-col-main').className = 'col-main view-game';
  race.startRace();
});
document.getElementById('crb-btn-refresh').addEventListener('click', () => {
  // reset stat sliders
  ['speed','accel','handling','braking','aero','grip'].forEach(id => {
    document.getElementById('stat-' + id).value = 5;
    document.getElementById('val-'  + id).textContent = 5;
  });
  document.getElementById('crb-power-score').textContent = 300;
});
document.getElementById('crb-btn-help').addEventListener('click', () => {
  const hp = document.getElementById('crb-help-panel');
  hp.style.display = hp.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('crb-reset-garage').addEventListener('click', () => {
  if (confirm('Reset all garage data? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    refreshGarageUI();
  }
});
document.getElementById('crb-res-close').addEventListener('click', () => {
  document.getElementById('crb-results').classList.remove('visible');
  race.startRace();
});

// Live track preview when track select changes
document.getElementById('crb-track').addEventListener('change', e => {
  race.trackDef = TRACKS[e.target.value] || TRACKS.city_sprint;
  race.segs     = trackSegments(race.trackDef.points);
  if (!race.running) race.drawIdle();
});

// Initial idle render (slight delay to allow layout to settle)
setTimeout(() => race.drawIdle(), 200);

</script>
