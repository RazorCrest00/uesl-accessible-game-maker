---
layout: opencs 
title: GameBuilder
description: Helping programmers understand how to create a game
permalink: /gamebuilderv1-2
---

<!-- 
  All GameBuilder styles are now in _sass/open-coding/game-builder.scss
  This uses the standardized three-panel layout system with reusable mixins.
  _sass/open-coding/
  ├── game-builder.scss (reusable!)
  │   ├── Layout mixins
  │   ├── Visual mixins
  │   ├── Form mixins
  │   └── GameBuilder implementation
  └── _main.scss
      └── @import "game-builder"

┌────────────────────────────────────────────────────────┐
│                    Page Title                          │
├─────────────┬──────────────────────────────────────────┤
│             │                                          │
│   Asset/    │         Main Content Panel               │
│   Config    │  ┌─────────────────────────────────┐     │
│   Panel     │  │     View Mode Controls          │     │
│             │  ├─────────────────────────────────┤     │
│  ┌────────┐ │  │                                 │     │
│  │Section │ │  │   Code Editor / Preview Split   │     │
│  │        │ │  │                                 │     │
│  │Forms   │ │  │   - View Code Only              │     │
│  │        │ │  │   - View Preview Only           │     │
│  │Controls│ │  │   - Split View (Side-by-Side)   │     │
│  │        │ │  │                                 │     │
│  └────────┘ │  └─────────────────────────────────┘     │
│             │                                           │
└─────────────┴──────────────────────────────────────────┘
    20% width            80% width (flexible)
<!-- Minimal page-specific overrides only -->
<style>
/* Remove default page wrapper constraints for full-width layout */
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

/* ── Draw overlay: visual layer on top of the game frame ── */
.game-frame {
  position: relative;  /* anchor for the absolute overlay */
}
/* Cursor feedback on the game-frame when draw mode is active */
.game-frame.drawing-active {
  cursor: crosshair;
}
.draw-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none; /* never intercepts events — game-frame handles mousedown */
  z-index: 50;
  overflow: visible; /* must be visible so SVG route lines and dots aren't clipped */
}
/* Drawn rectangle previews and confirmed walls */
.draw-rect {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid rgba(99, 102, 241, 0.9);
  background: rgba(99, 102, 241, 0.18);
  pointer-events: none;
}
.draw-rect.preview {
  border-style: dashed;
  border-color: rgba(99, 102, 241, 0.7);
  background: rgba(99, 102, 241, 0.1);
}
.draw-rect.barrier {
  border-color: rgba(239, 68, 68, 0.9);
  background: rgba(239, 68, 68, 0.2);
}
/* Draw toolbar button styles */
.draw-toolbar { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.draw-btn {
  padding: 6px 10px;
  font-size: clamp(0.68rem, 0.8vw, 0.78rem);
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 7px;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  text-align: left;
  width: 100%;
}
@media (max-width: 1200px) {
  .draw-btn { padding: 5px 8px; }
}
@media (max-width: 1000px) {
  .draw-btn { padding: 4px 7px; font-size: 0.68rem; }
  .draw-toolbar { gap: 3px; }
}
.draw-btn:hover { background: #273449; color: #e2e8f0; }
.draw-btn.active { background: #312e81; border-color: #6366f1; color: #a5b4fc; }
/* Row of two paired buttons (draw + finish) */
.draw-btn-pair {
  display: flex;
  gap: 4px;
}
.draw-btn-pair .draw-btn { flex: 1; }
.draw-btn-pair .draw-btn.finish-btn { flex: 0 0 auto; width: auto; padding: 6px 10px; }
@media (max-width: 1000px) {
  .draw-btn-pair .draw-btn.finish-btn { padding: 4px 7px; }
}
/* Danger / clear button */
.draw-btn.draw-btn-danger {
  border-color: #4c1d1d;
  color: #f87171;
}
.draw-btn.draw-btn-danger:hover { background: #3b0e0e; border-color: #ef4444; color: #fca5a5; }
/* Section divider label inside toolbar */
.draw-section-label {
  font-size: clamp(0.58rem, 0.65vw, 0.67rem);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #475569;
  font-weight: 700;
  padding: 6px 2px 2px;
  border-top: 1px solid rgba(255,255,255,0.06);
  margin-top: 2px;
}
.draw-section-label:first-child { border-top: none; padding-top: 2px; }
@media (max-width: 1000px) {
  .draw-section-label { padding: 4px 2px 1px; margin-top: 1px; }
}

/* ── Left panel resize handle ───────────────────────────────────────────── */
.col-asset { position: relative; }
#left-panel-resize {
  position: absolute;
  right: -5px;
  top: 0;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
#left-panel-resize::after {
  content: '';
  display: block;
  width: 3px;
  height: 40px;
  background: #334155;
  border-radius: 3px;
  transition: background 0.15s, height 0.15s;
}
#left-panel-resize:hover::after,
#left-panel-resize.dragging::after {
  background: #6366f1;
  height: 60px;
}
/* ── Route/Attack NPC path visualisation layer ──────────────────────────────
   Uses position:fixed so it sits above everything, immune to overflow:hidden
   on any ancestor. JavaScript repositions it over the game-frame each render. */
#route-vis-layer {
  position: fixed;
  pointer-events: none;
  z-index: 99999;
  overflow: visible;
  top: 0; left: 0;
  width: 0; height: 0;          /* sized dynamically by JS */
}
#route-vis-layer.game-running {
  display: none;                 /* hidden while game plays */
}
/* Dots are inside the fixed layer so they are always visible */
.route-npc-dot {
  position: absolute;
  width: 13px; height: 13px;
  background: #10b981;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 0 6px rgba(16,185,129,0.7);
}
.route-npc-dot.start {
  background: #059669;
  width: 16px; height: 16px;
  border-color: #a7f3d0;
}
.route-npc-label {
  position: absolute;
  font-size: 10px; font-weight: 700;
  color: #a7f3d0;
  background: rgba(5,36,28,0.85);
  border: 1px solid #10b981;
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 61;
}
/* Attack NPC overlay elements */
.attack-npc-dot {
  position: absolute;
  width: 13px; height: 13px;
  background: #ef4444;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 60;
  pointer-events: auto;
  box-shadow: 0 0 6px rgba(239,68,68,0.7);
}
.attack-npc-dot.start {
  background: #b91c1c;
  width: 16px; height: 16px;
  border-color: #fca5a5;
}
.attack-npc-label {
  position: absolute;
  font-size: 10px; font-weight: 700;
  color: #fca5a5;
  background: rgba(36,5,5,0.85);
  border: 1px solid #ef4444;
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 61;
}
/* Embed mode: hide nav/header/footer when ?embed=1 is in URL */
.embed-mode #side-nav,
.embed-mode header,
.embed-mode footer,
.embed-mode #masterFooter,
.embed-mode .navbar,
.embed-mode nav,
.embed-mode .site-header,
.embed-mode .site-footer,
.embed-mode .site-nav,
.embed-mode .gamebuilder-title { display: none !important; }
.embed-mode body,
.embed-mode .page-content,
.embed-mode .page-content .wrapper { padding: 0 !important; margin: 0 !important; }
.embed-mode .opencs_root { padding: 0 !important; margin: 0 !important; }

/* ── Level Tabs ─────────────────────────────────────────────────── */
.level-tabs-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px 0;
  border-bottom: 1px solid #1e293b;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
  background: rgba(0,0,0,.15);
  border-radius: 8px 8px 0 0;
}
.level-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 7px 7px 0 0;
  border-bottom: none;
  color: #94a3b8;
  font-size: clamp(0.65rem, 0.75vw, 0.75rem);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s, color 0.12s;
  user-select: none;
  min-width: 0;
  flex-shrink: 0;
}
@media (max-width: 1000px) {
  .level-tab { padding: 3px 7px; gap: 3px; }
  .level-tabs-bar { padding: 4px 6px 0; gap: 3px; }
}
.level-tab:hover { background: #273449; color: #e2e8f0; }
.level-tab.active {
  background: #0f172a;
  border-color: #6366f1;
  color: #a5b4fc;
  font-weight: 600;
}
.level-tab-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.level-tab-del {
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 0 0 2px;
  line-height: 1;
  display: flex;
  align-items: center;
}
.level-tab-del:hover { color: #ef4444; }
.level-tab-add {
  padding: 4px 9px;
  background: none;
  border: 1px dashed #334155;
  border-radius: 6px;
  color: #475569;
  font-size: 0.8rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.12s, border-color 0.12s;
}
.level-tab-add:hover { color: #6366f1; border-color: #6366f1; }
.level-tab-name[contenteditable="true"] {
  outline: 1px solid #6366f1;
  border-radius: 3px;
  min-width: 40px;
  padding: 0 2px;
}
</style>

<script>
  if (new URLSearchParams(location.search).get('embed')) {
    document.documentElement.classList.add('embed-mode');
  }
</script>

<!-- title banner for the GameBuilder page -->
<div class="gamebuilder-title">
  {{page.title}}
  <a href="{{site.baseurl}}/gamebuilderv1-2/doc" target="_blank" rel="noopener noreferrer">📜</a>
  <a href="{{site.baseurl}}/rpg/game" target="_blank" rel="noopener noreferrer">🕹️</a>
</div>

<!-- Ensure GameTemplatesV1_1 is available as a global by loading templates.js -->
<script>
    (function(){
        try {
            const s = document.createElement('script');
            s.src = "{{ site.baseurl }}/assets/js/GameEnginev1.2/builder/templates.js";
            s.defer = true;
            document.head.appendChild(s);
        } catch (e) { console.error('GameTemplatesV1_1 loader failed; templates.js must be available', e); }
    })();
</script>

<!-- MediaPipe + Face Tracker + Socket.IO -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js" crossorigin="anonymous"></script>
<script src="{{ site.baseurl }}/assets/js/face-tracker.js"></script>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>

<!-- main builder layout: left (assets) + right (code and game) -->
<div class="creator-layout">
    <div class="col-asset" id="col-asset">
        <!-- Drag this handle to resize the left panel -->
        <div id="left-panel-resize" title="Drag to resize panel"></div>
        <!-- assets panel: background, player, NPCs, and walls inputs -->
        <div class="glass-panel creator-panel" style="position: relative;">
            <div class="panel-header">
                <span>Assets</span>
                <div class="panel-controls">
                    <span class="step-indicator" id="step-indicator-mini">Step 1/2</span>
                    <button id="btn-confirm" class="icon-btn" data-tooltip="Confirm Step">✓</button>
                    <button id="btn-refresh-assets" class="icon-btn" data-tooltip="Refresh Assets">⟳</button>
                    <button id="btn-help" class="icon-btn" data-tooltip="Help">?</button>
                </div>
            </div>
            <!-- help panel: shows step-by-step guidance and tips -->
            <div class="help-panel" id="help-panel">
                <strong>Steps:</strong><br>
                1. Background - Select environment<br>
                2. Player - Configure character<br>
                3. Freestyle - Add NPCs, Walls, etc<br><br>
                <strong>Tips:</strong> Draw red barriers directly on the game view. Barriers collide. Walls are visible in-game by default; use the Walls toggle to hide them while testing.
            </div>
            <!-- level tabs: switch between saved levels -->
            <div class="level-tabs-bar" id="level-tabs-bar">
                <!-- tabs rendered by JS -->
            </div>
            <!-- scrollable form: asset configuration sections -->
            <div class="scroll-form">
                <div class="asset-group">
                    <!-- environment selection and upload instructions -->
                    <div class="group-title">ENVIRONMENT</div>
                    <label>Background Selection</label>
                    <select id="bg-select">
                        <option value="" selected disabled>Select background…</option>
                        <option value="desert">Desert Dunes</option>
                        <option value="alien">Alien Planet</option>
                        <option value="skykingdom">Sky Kingdom</option>
                    </select>
                    <div class="upload-instructions" style="margin-top:6px;">
                        <button id="bg-instructions-btn" class="btn btn-sm">Upload Instructions ▸</button>
                        <div id="bg-instructions-panel" class="instructions-panel" style="display:none; font-size:0.75em; margin-top:6px;">
                            To add your own backgrounds, place files under <code>images/gamebuilder/bg</code> and then press the Refresh Assets button. See <a href="{{ site.baseurl }}/gamebuilder/doc" target="_blank" rel="noopener noreferrer">upload instructions</a>.
                            <div style="margin-top:4px;">Backgrounds json: <a href="{{ site.baseurl }}/images/gamebuilder/bg/index.json" target="_blank" rel="noopener noreferrer">images/gamebuilder/bg/index.json</a></div>
                        </div>
                    </div>
                </div>
                <div class="asset-group">
                    <!-- player configuration: name, sprite, position, controls, advanced settings -->
                    <div class="group-title">PLAYER</div>
                    <label>Name</label>
                    <input type="text" id="player-name" value="" placeholder="Player name">
                    <label>Sprite</label>
                    <select id="player-select">
                        <option value="" selected disabled>Select sprite…</option>
                        <optgroup label="Superheroes">
                        <option value="ironman">Iron Man</option>
                        <option value="spiderman">Spider-Man</option>
                        <option value="captain_america">Captain America</option>
                        <option value="batman">Batman</option>
                        <option value="superman">Superman</option>
                        <option value="wonder_woman">Wonder Woman</option>
                        <option value="thor">Thor</option>
                        </optgroup>
                        <option value="chillguy">Chill Guy</option>
                        <option value="tux">Tux</option>
                        <optgroup label="Pokémon">
                        <option value="pikachu">Pikachu</option>
                        <option value="charizard">Charizard</option>
                        <option value="mewtwo">Mewtwo</option>
                        <option value="eevee">Eevee</option>
                        <option value="gengar">Gengar</option>
                        <option value="lucario">Lucario</option>
                        </optgroup>
                    </select>
                    <div class="upload-instructions" style="margin-top:6px;">
                        <button id="sprite-instructions-btn" class="btn btn-sm">Upload Instructions ▸</button>
                        <div id="sprite-instructions-panel" class="instructions-panel" style="display:none; font-size:0.75em; margin-top:6px;">
                            To add your own spritesheets, place files under <code>images/gamebuilder/sprites</code> (and set rows/cols in index.json). Then press Refresh Assets. See <a href="{{ site.baseurl }}/gamebuilder/doc" target="_blank" rel="noopener noreferrer">upload instructions</a>.
                            <div style="margin-top:4px;">Sprites json: <a href="{{ site.baseurl }}/images/gamebuilder/sprites/index.json" target="_blank" rel="noopener noreferrer">images/gamebuilder/sprites/index.json</a></div>
                        </div>
                    </div>
                    <label>X Position</label>
                    <input type="range" id="player-x" min="0" max="800" value="100">
                    <label>Y Position</label>
                    <input type="range" id="player-y" min="0" max="600" value="300">
                    <label>Movement Keys</label>
                    <select id="movement-keys">
                        <option value="" selected disabled>Select keys…</option>
                        <option value="wasd">WASD</option>
                        <option value="arrows">Arrow Keys</option>
                    </select>
                    <div class="upload-instructions" style="margin-top:6px;">
                        <button id="player-advanced-btn" class="btn btn-sm">Advanced ▸</button>
                        <div id="player-advanced-panel" class="instructions-panel" style="display:none; font-size:0.85em; margin-top:6px;">
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; align-items:end;">
                                <div>
                                    <label>Scale Factor</label>
                                    <input type="number" id="player-scale" min="1" max="40" value="10">
                                </div>
                                <div>
                                    <label>Step Factor</label>
                                    <input type="number" id="player-step" min="100" max="5000" value="1000">
                                </div>
                                <div>
                                    <label>Animation Rate (ms)</label>
                                    <input type="number" id="player-anim" min="10" max="500" value="50">
                                </div>
                                <div>
                                    <label>Rows</label>
                                    <input type="number" id="player-rows" min="1" value="1">
                                </div>
                                <div>
                                    <label>Columns</label>
                                    <input type="number" id="player-cols" min="1" value="1">
                                </div>
                            </div>
                            <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1);">
                                <div style="font-weight:600; margin-bottom:6px;">Directional Rows</div>
                                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; align-items:end;">
                                    <div>
                                        <label>Down Row</label>
                                        <input type="number" id="player-dir-down-row" min="0" value="0">
                                    </div>
                                    <div>
                                        <label>Right Row</label>
                                        <input type="number" id="player-dir-right-row" min="0" value="1">
                                    </div>
                                    <div>
                                        <label>Left Row</label>
                                        <input type="number" id="player-dir-left-row" min="0" value="2">
                                    </div>
                                    <div>
                                        <label>Up Row</label>
                                        <input type="number" id="player-dir-up-row" min="0" value="3">
                                    </div>
                                    <div>
                                        <label>Up-Right Row</label>
                                        <input type="number" id="player-dir-upright-row" min="0" value="3">
                                    </div>
                                    <div>
                                        <label>Down-Right Row</label>
                                        <input type="number" id="player-dir-downright-row" min="0" value="1">
                                    </div>
                                    <div>
                                        <label>Up-Left Row</label>
                                        <input type="number" id="player-dir-upleft-row" min="0" value="2">
                                    </div>
                                    <div>
                                        <label>Down-Left Row</label>
                                        <input type="number" id="player-dir-downleft-row" min="0" value="0">
                                    </div>
                                </div>
                                <div style="display:grid; grid-template-columns: 1fr; gap:8px; align-items:end; margin-top:8px;">
                                    <div>
                                        <label>Direction Frames (columns)</label>
                                        <input type="number" id="player-dir-columns" min="1" value="3">
                                    </div>
                                </div>
                                <div style="margin-top:12px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1);">
                                    <div style="font-weight:600; margin-bottom:6px;">Hitbox (collision box)</div>
                                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; align-items:end;">
                                        <div>
                                            <label>Width Reduction (%)</label>
                                            <input type="number" id="player-hitbox-width" min="0" max="0.9" step="0.01" value="0.00">
                                        </div>
                                        <div>
                                            <label>Height Reduction (%)</label>
                                            <input type="number" id="player-hitbox-height" min="0" max="0.9" step="0.01" value="0.00">
                                        </div>
                                    </div>
                                    <div style="margin-top:6px; font-size:0.75em;">
                                        Smaller values mean a larger collision box (closer to sprite edges). Larger values trim the box inward symmetrically.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="asset-group">
                    <!-- NPC builder: dynamic slots with sprite and dialogue -->
                    <div class="group-title">
                        <span>NPC</span>
                        <button class="add-item-btn" id="add-npc">+</button>
                    </div>
                    <div class="upload-instructions" style="margin-top:6px;">
                        <button id="npc-sprite-instructions-btn" class="btn btn-sm">Upload Instructions ▸</button>
                        <div id="npc-sprite-instructions-panel" class="instructions-panel" style="display:none; font-size:0.75em; margin-top:6px;">
                            NPCs use the same spritesheet system as the Player. Place files under <code>images/gamebuilder/sprites</code> and set <code>rows</code>/<code>cols</code> in index.json, then press Refresh Assets. See <a href="{{ site.baseurl }}/gamebuilder/doc" target="_blank" rel="noopener noreferrer">upload instructions</a>.
                            <div style="margin-top:4px;">Sprites json: <a href="{{ site.baseurl }}/images/gamebuilder/sprites/index.json" target="_blank" rel="noopener noreferrer">images/gamebuilder/sprites/index.json</a></div>
                            <div style="margin-top:6px;">
                                Interaction: Walk up to an NPC and press <strong>E</strong> to open their dialogue. Interactions trigger on collision or close proximity. Ensure the NPC has either a <code>greeting</code> or <code>dialogues</code> set for text to appear.
                            </div>
                        </div>
                    </div>
                    <div id="npcs-container"></div>
                </div>
                <div class="asset-group">
                    <!-- walls: toggle visibility, draw barriers, clear shapes -->
                    <div class="group-title"><span>WALLS &amp; OBJECTS</span></div>
                    <div class="draw-toolbar">

                        <!-- Visibility -->
                        <div class="draw-section-label">Visibility</div>
                        <button id="toggle-walls-game" class="draw-btn">👁 Show Walls in Game</button>

                        <!-- Drawing -->
                        <div class="draw-section-label">Drawing</div>
                        <button id="draw-barrier" class="draw-btn">🧱 Draw Collision Wall</button>
                        <button id="draw-star"    class="draw-btn">⭐ Place Stars</button>

                        <!-- NPCs -->
                        <div class="draw-section-label">NPCs</div>
                        <div class="draw-btn-pair">
                            <button id="draw-route-npc"  class="draw-btn">🧍 Route NPC</button>
                            <button id="finish-route-npc" class="draw-btn finish-btn" style="display:none;background:#065f46;border-color:#10b981;color:#a7f3d0;">✓ Done</button>
                        </div>
                        <div class="draw-btn-pair">
                            <button id="draw-attack-npc" class="draw-btn" title="Click to draw a patrol route. Click again after ✓ Done to add more.">⚔️ Attack NPC <span id="attack-npc-count" style="display:none;background:#ef4444;color:#fff;border-radius:9px;padding:0 5px;font-size:.7rem;font-weight:700;margin-left:2px;vertical-align:middle;"></span></button>
                            <button id="finish-attack-npc" class="draw-btn finish-btn" style="display:none;background:#7f1d1d;border-color:#ef4444;color:#fca5a5;">✓ Done</button>
                        </div>

                        <!-- Game Settings -->
                        <div class="draw-section-label">Game Settings</div>
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 2px;gap:8px;">
                            <label for="global-max-hearts" style="font-size:.78rem;color:#94a3b8;white-space:nowrap;">❤️ Player Hearts</label>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <button id="hearts-dec" style="width:24px;height:24px;background:#1e293b;border:1px solid #334155;border-radius:5px;color:#e2e8f0;cursor:pointer;font-size:.9rem;line-height:1;padding:0;">−</button>
                                <input type="number" id="global-max-hearts" min="1" max="10" value="3"
                                       style="width:42px;text-align:center;padding:3px 4px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.85rem;">
                                <button id="hearts-inc" style="width:24px;height:24px;background:#1e293b;border:1px solid #334155;border-radius:5px;color:#e2e8f0;cursor:pointer;font-size:.9rem;line-height:1;padding:0;">+</button>
                            </div>
                        </div>

                        <!-- Clear -->
                        <div class="draw-section-label">Actions</div>
                        <button id="draw-clear" class="draw-btn draw-btn-danger">🗑 Clear All Walls</button>

                    </div>
                    <div id="drawn-barriers-list" style="margin-top:8px;display:flex;flex-direction:column;gap:4px;"></div>
                    <div id="walls-container"></div>
                </div>
                <!-- ── SETTINGS ─────────────────────────────────────── -->
                <details id="settings-panel" open style="margin-top:12px;">
                  <summary style="cursor:pointer;font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;padding:6px 0;">⚙ Settings</summary>
                  <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
                    <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;cursor:pointer;">
                      <input type="checkbox" id="gb-slow-mode"> 🐌 Slow Mode
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;cursor:pointer;">
                      <input type="checkbox" id="gb-high-contrast"> ⚡ High Contrast
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;cursor:pointer;">
                      <input type="checkbox" id="gb-large-sprites"> 🔍 Large Sprites
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;cursor:pointer;">
                      <input type="checkbox" id="gb-dpad-right" checked> 📱 D-pad on Right
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;cursor:pointer;">
                      <input type="checkbox" id="gb-voice"> 🎤 Voice Commands
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;cursor:pointer;">
                      <input type="checkbox" id="gb-face"> 📷 Face Tracking
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;cursor:pointer;">
                      <input type="checkbox" id="gb-coach"> 🧑‍🏫 UESL Coach
                    </label>
                    <div id="gb-coach-speed-panel" style="display:none;flex-direction:column;gap:7px;padding:4px 0 6px 22px;">
                      <label style="font-size:.78rem;color:#94a3b8;display:flex;align-items:center;gap:6px;">
                        👾 Character:
                        <select id="gb-coach-char" style="flex:1;background:#0f172a;color:#c4b5fd;border:1px solid #3730a3;border-radius:6px;padding:2px 4px;font-size:.78rem;cursor:pointer;">
                          <option value="chillguy">😎 Chill Guy</option>
                          <option value="enderman">🖤 Enderman</option>
                          <option value="creepa">💥 Creeper</option>
                          <option value="robot">🤖 Robot</option>
                          <option value="mzombie">🧟 Zombie</option>
                        </select>
                      </label>
                      <label style="font-size:.78rem;color:#94a3b8;display:flex;align-items:center;gap:6px;">
                        ⚡ Speed:
                        <input type="range" id="gb-coach-speed" min="0.5" max="8" step="0.5" value="2.5" style="width:80px;accent-color:#6366f1;">
                        <span id="gb-coach-speed-val" style="min-width:24px;color:#a5b4fc;">2.5</span>
                      </label>
                      <label style="font-size:.78rem;color:#94a3b8;display:flex;align-items:center;gap:6px;">
                        ❤️ Hearts:
                        <input type="range" id="gb-coach-hearts" min="1" max="5" step="1" value="3" style="width:80px;accent-color:#ef4444;">
                        <span id="gb-coach-hearts-val" style="min-width:24px;color:#fca5a5;">3</span>
                      </label>
                      <label style="font-size:.78rem;color:#94a3b8;display:flex;align-items:center;gap:6px;">
                        👁️ Chase Range:
                        <input type="range" id="gb-coach-range" min="80" max="700" step="20" value="300" style="width:80px;accent-color:#f59e0b;">
                        <span id="gb-coach-range-val" style="min-width:28px;color:#fcd34d;">300</span>px
                      </label>
                    </div>
                    <div id="gb-face-panel" style="display:none;background:rgba(0,0,0,.25);border-radius:8px;padding:8px;margin-top:4px;">
                      <video id="gb-face-video" style="display:none;"></video>
                      <canvas id="gb-face-preview" width="120" height="90" style="border-radius:6px;width:100%;"></canvas>
                      <button id="gb-recalibrate" style="margin-top:6px;width:100%;padding:4px;background:#3730a3;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:.78rem;">🔄 Recalibrate</button>
                    </div>
                    <div id="gb-voice-status" style="display:none;font-size:.75rem;color:#94a3b8;margin-top:2px;padding:4px 8px;background:rgba(0,0,0,.2);border-radius:6px;">Voice: off</div>
                  </div>
                </details>
            </div>
        </div>
    </div>
    <div class="col-main view-split">
        <!-- view controls: switch between code, game, or split view -->
        <div class="view-controls">
            <button class="view-btn" data-view="game">🎮 Game</button>
            <button class="view-btn" data-view="code">💻 Code</button>
            <button class="view-btn active" data-view="split">⬜ Split</button>
        </div>
        <div class="main-content">
            <!-- game panel + drawing overlay -->
            <div class="glass-panel panel-game">
                <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between;">
                    <span>Game Viewer</span>
                    <span id="uesl-heart-hud" style="font-size:1.3rem;letter-spacing:3px;pointer-events:none;"></span>
                </div>
                <div class="game-frame">
                    <div class="game-output"
                        id="game-output-builder">
                        <div id="game-container-builder" class="gameContainer">
                            <canvas id="game-canvas-builder"></canvas>
                        </div>
                    </div>
                    <div id="draw-overlay" class="draw-overlay"></div>
                </div>
            </div>
            <!-- Fixed-position layer for route/attack NPC path lines.
                 Lives outside the game-frame so overflow:hidden on ancestors can't clip it. -->
            <div id="route-vis-layer"></div>
            <!-- code panel: live JS editor with highlight -->
            <div class="glass-panel code-panel panel-code">
                <div class="panel-header">
                    <span>Code Runner</span>
                    <div class="panel-controls">
                        <button id="btn-code-play" class="icon-btn" data-tooltip="Run Code">▶</button>
                        <button id="btn-code-stop" class="icon-btn" data-tooltip="Stop Game">■</button>
                        <button id="btn-export" class="icon-btn" data-tooltip="Export Code">⤓</button>
                        <button id="gb-save-btn" title="Save / Load Games" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.85rem;">💾</button>
                        <button id="gb-mp-btn" title="Multiplayer" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.85rem;">👥</button>
                    </div>
                </div>
                <!-- Multiplayer mode notice — shown when in a room -->
                <div id="gb-mp-edit-banner" style="display:none;background:linear-gradient(90deg,#1e1b4b,#312e81);border:1px solid #4f46e5;border-radius:8px;padding:8px 14px;margin-bottom:6px;font-size:.82rem;color:#a5b4fc;align-items:center;gap:10px;">
                  <span style="font-size:1rem;">🎮</span>
                  <span>You are in <strong style="color:#c4b5fd;">multiplayer mode</strong>. Editing is disabled while playing. <a id="gb-mp-exit-edit" href="#" style="color:#818cf8;text-decoration:underline;">Exit multiplayer</a> to make changes.</span>
                </div>
                <div class="editor-container" id="editor-container">
                    <div id="highlight-layer" class="highlight-layer"></div>
                    <textarea id="code-editor" class="code-layer" spellcheck="false"></textarea>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- My Games Modal -->
<div id="gb-save-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
  <div style="position:relative;background:linear-gradient(160deg,#0f1729 0%,#0e1117 100%);border:1px solid #334455;border-radius:18px;padding:28px 28px 24px;min-width:340px;max-width:480px;width:92%;color:#e2e8f0;font-family:sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.7);">
    <button id="gb-save-close" style="position:absolute;top:14px;right:16px;background:rgba(255,255,255,.07);border:none;color:#94a3b8;font-size:1.1rem;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;">×</button>

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
      <div style="width:38px;height:38px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">💾</div>
      <div>
        <h3 style="margin:0;color:#7dd3fc;font-size:1.05rem;">My Games</h3>
        <div style="font-size:.72rem;color:#64748b;">Save &amp; load your game projects</div>
      </div>
    </div>

    <!-- Not logged in notice -->
    <div id="gb-save-login-msg" style="display:none;background:#1e2030;border:1px solid #f59e0b;border-radius:10px;padding:14px 16px;font-size:.85rem;color:#fbbf24;text-align:center;margin-bottom:12px;">
      ⚠ You must be logged in to save or load games.<br>
      <a href="https://uesl.opencodingsociety.com/login" target="_blank" rel="noopener" style="color:#60a5fa;margin-top:6px;display:inline-block;">Log in to UESL →</a>
    </div>

    <!-- Save current game -->
    <div id="gb-save-form" style="display:none;margin-bottom:16px;">
      <div style="display:flex;gap:8px;">
        <input id="gb-save-name" placeholder="Game name…" maxlength="120"
          style="flex:1;padding:9px 12px;background:#1a2035;border:1px solid #2d3a55;border-radius:9px;color:#e2e8f0;font-size:.9rem;outline:none;">
        <button id="gb-save-confirm" style="padding:9px 16px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border:none;border-radius:9px;color:#fff;font-weight:700;font-size:.85rem;cursor:pointer;white-space:nowrap;">Save</button>
      </div>
      <div id="gb-save-status" style="min-height:18px;font-size:.78rem;color:#64748b;margin-top:5px;"></div>
    </div>

    <!-- Saved games list -->
    <div id="gb-save-list-wrap" style="display:none;">
      <div style="font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Saved Games</div>
      <div id="gb-save-list" style="display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;"></div>
      <p id="gb-save-empty" style="display:none;font-size:.82rem;color:#475569;margin:8px 0 0;text-align:center;">No saved games yet. Build something and hit Save!</p>
    </div>

    <div id="gb-save-loading" style="display:none;font-size:.85rem;color:#64748b;text-align:center;padding:16px 0;">Loading…</div>
  </div>
</div>

<!-- Multiplayer Modal -->
<div id="gb-mp-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
  <div style="position:relative;background:linear-gradient(160deg,#0f1729 0%,#0e1117 100%);border:1px solid #3344aa;border-radius:18px;padding:28px 28px 24px;min-width:340px;max-width:420px;width:90%;color:#e2e8f0;font-family:sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.7);">
    <button id="gb-mp-close" style="position:absolute;top:14px;right:16px;background:rgba(255,255,255,.07);border:none;color:#94a3b8;font-size:1.1rem;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;">×</button>

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
      <div style="width:38px;height:38px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">👥</div>
      <div>
        <h3 style="margin:0;color:#c4b5fd;font-size:1.05rem;">Multiplayer</h3>
        <div id="gb-mp-conn-dot" style="font-size:.72rem;color:#64748b;">● Not connected</div>
      </div>
    </div>

    <!-- Setup panel (shown when not in a room) -->
    <div id="gb-mp-setup">
      <button id="gb-mp-create" style="width:100%;padding:11px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:10px;color:#fff;font-weight:700;font-size:.95rem;cursor:pointer;letter-spacing:.02em;transition:opacity .15s;">🚀 Create Room</button>
      <div style="display:flex;align-items:center;gap:8px;margin:10px 0;">
        <div style="flex:1;height:1px;background:#1e293b;"></div>
        <span style="font-size:.75rem;color:#475569;">or join with a code</span>
        <div style="flex:1;height:1px;background:#1e293b;"></div>
      </div>
      <div style="display:flex;gap:8px;">
        <input id="gb-mp-join-code" placeholder="Room code (e.g. AB12CD)" style="flex:1;padding:9px 12px;background:#1a2035;border:1px solid #2d3a55;border-radius:9px;color:#e2e8f0;font-size:.9rem;letter-spacing:.08em;text-transform:uppercase;outline:none;">
        <button id="gb-mp-join" style="padding:9px 16px;background:#1a2035;border:1px solid #6366f1;border-radius:9px;color:#818cf8;cursor:pointer;font-weight:700;white-space:nowrap;">Join →</button>
      </div>
    </div>

    <!-- Active room panel (shown when in a room) -->
    <div id="gb-mp-room-active" style="display:none;">
      <!-- Room code card -->
      <div style="background:#1a2035;border:1px solid #2d3a55;border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Room Code</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span id="gb-mp-room-code" style="font-size:1.4rem;font-weight:800;color:#a78bfa;letter-spacing:.18em;font-family:monospace;"></span>
          <button id="gb-mp-copy-btn" style="padding:5px 12px;background:#312e81;border:1px solid #4f46e5;border-radius:7px;color:#a5b4fc;font-size:.78rem;cursor:pointer;">📋 Copy</button>
        </div>
        <div style="font-size:.73rem;color:#475569;margin-top:5px;">Share this code — your partner enters it to join</div>
      </div>

      <!-- Players in room -->
      <div style="background:#1a2035;border:1px solid #2d3a55;border-radius:10px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Players in Room</div>
        <div id="gb-mp-player-list" style="display:flex;flex-direction:column;gap:5px;"></div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;">
        <button id="gb-mp-send-level" style="flex:1;padding:9px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border:none;border-radius:9px;color:#fff;font-weight:700;font-size:.85rem;cursor:pointer;">📤 Share Level</button>
        <button id="gb-mp-leave" style="padding:9px 14px;background:#1a2035;border:1px solid #ef4444;border-radius:9px;color:#f87171;font-size:.85rem;cursor:pointer;font-weight:600;">Leave</button>
      </div>

      <!-- Invite friends (logged-in only) -->
      <div id="gb-mp-friends-section" style="display:none;margin-top:12px;">
        <div style="font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Invite a Friend</div>
        <div id="gb-mp-friends-list" style="display:flex;flex-direction:column;gap:5px;max-height:120px;overflow-y:auto;"></div>
        <p id="gb-mp-no-friends" style="display:none;font-size:.78rem;color:#475569;margin:4px 0 0;">No friends found. Add friends on the UESL hub first.</p>
      </div>

      <p id="gb-mp-login-note" style="font-size:.75rem;color:#f59e0b;margin:8px 0 0;display:none;">⚠ Log in on the UESL hub to invite friends directly.</p>
    </div>

    <!-- Status bar -->
    <div id="gb-mp-status" style="margin-top:12px;font-size:.8rem;color:#64748b;min-height:18px;padding:6px 0 0;border-top:1px solid #1e293b;"></div>
  </div>
</div>

<script>
/* builder bootstrapping and asset scanning */
document.addEventListener('DOMContentLoaded', () => {
    const SITE_BASE = "{{ site.baseurl }}" || "";
    const assets = {
        bg: {
            desert: { src: "/images/gamify/desert.png", h: 580, w: 1038 },
            alien: { src: "/images/gamebuilder/bg/alien_planet.jpg", h: 600, w: 1000 },
            skykingdom: { src: "/images/gamebuilder/bg/clouds.jpg", h: 720, w: 1280 },
            maze: { type: 'maze', h: 600, w: 900 }
        },
        sprites: {
            // Adventure
            chillguy:        { src: "/images/gamify/chillguy.png",           h:384, w:512,  rows:3, cols:4 },
            tux:             { src: "/images/gamify/tux.png",                h:256, w:352,  rows:8, cols:11 },
            r2d2:            { src: "/images/gamify/r2_idle.png",            h:223, w:505,  rows:1, cols:3 },
            octocat:         { src: "/images/gamify/octocat.png",            h:301, w:801,  rows:1, cols:9 },
            robot:           { src: "/images/gamify/robot.png",              h:316, w:627,  rows:3, cols:6 },
            // Superheroes
            ironman:         { src: "/images/gamify/ironman.png",            h:132, w:96,   rows:1, cols:1 },
            spiderman:       { src: "/images/gamify/spiderman.png",          h:132, w:96,   rows:1, cols:1 },
            captain_america: { src: "/images/gamify/captain_america.png",    h:132, w:96,   rows:1, cols:1 },
            batman:          { src: "/images/gamify/batman.png",             h:132, w:96,   rows:1, cols:1 },
            superman:        { src: "/images/gamify/superman.png",           h:132, w:96,   rows:1, cols:1 },
            wonder_woman:    { src: "/images/gamify/wonder_woman.png",       h:132, w:96,   rows:1, cols:1 },
            thor:            { src: "/images/gamify/thor.png",               h:132, w:96,   rows:1, cols:1 },
            // Pokémon
            pikachu:         { src: "/images/gamify/pokemon/pikachu.png",   h:475, w:475,  rows:1, cols:1 },
            charizard:       { src: "/images/gamify/pokemon/charizard.png", h:475, w:475,  rows:1, cols:1 },
            mewtwo:          { src: "/images/gamify/pokemon/mewtwo.png",    h:475, w:475,  rows:1, cols:1 },
            eevee:           { src: "/images/gamify/pokemon/eevee.png",     h:475, w:475,  rows:1, cols:1 },
            gengar:          { src: "/images/gamify/pokemon/gengar.png",    h:475, w:475,  rows:1, cols:1 },
            lucario:         { src: "/images/gamify/pokemon/lucario.png",   h:475, w:475,  rows:1, cols:1 },
        }
    };
    const GB_BG_DIRS = ['/images/gamebuilder/bg'];
    const GB_SPR_DIRS = ['/images/gamebuilder/sprites'];
    const IMG_EXT_RE = /\.(png|jpg|jpeg|gif|webp|bmp)$/i;

    async function fetchJson(url) {
        try {
            const res = await fetch((SITE_BASE ? (SITE_BASE + url) : url), { cache: 'no-store' });
            if (!res.ok) return null;
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) return await res.json();
            return null;
        } catch (_) { return null; }
    }

    async function fetchText(url) {
        try {
            const res = await fetch((SITE_BASE ? (SITE_BASE + url) : url), { cache: 'no-store' });
            if (!res.ok) return null;
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('text/html')) return await res.text();
            return null;
        } catch (_) { return null; }
    }

    // label normalization
    function sanitizeKey(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    // select option management
    function clearSelectOptions(selectEl) {
        if (!selectEl) return;
        const opts = Array.from(selectEl.options || []);
        for (const opt of opts) {
            if (!opt.disabled) {
                opt.remove();
            }
        }
    }

    // asset discovery: scan directory listing for image files
    async function scanDirForImages(dirUrl) {
        const html = await fetchText(dirUrl);
        const results = [];
        if (!html) return results;
        const aRe = /href\s*=\s*"([^"]+)"/gi;
        let m;
        while ((m = aRe.exec(html)) !== null) {
            const href = m[1];
            const fullRel = href.startsWith('http') ? href : (dirUrl.replace(/\/$/, '') + '/' + href.replace(/^\//, ''));
            const full = SITE_BASE ? (SITE_BASE + fullRel) : fullRel;
            if (IMG_EXT_RE.test(full)) results.push(full);
        }
        return results;
    }

    // asset metadata: ensure image dimensions by loading it
    async function ensureImageDims(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ h: img.naturalHeight, w: img.naturalWidth });
            img.onerror = () => resolve({ h: undefined, w: undefined });
            img.src = SITE_BASE ? (SITE_BASE + src) : src;
        });
    }

    function dedupSelectOptions(selectEl) {
        if (!selectEl) return;
        const seen = new Set();
        for (let i = 0; i < selectEl.options.length; i++) {
            const opt = selectEl.options[i];
            const label = (opt.textContent || '').trim().toLowerCase();
            if (opt.disabled) continue;
            if (seen.has(label)) {
                selectEl.removeChild(opt);
                i--;
            } else {
                seen.add(label);
            }
        }
    }

    /* server asset scan → populate background/sprite selectors */
    async function scanServerAssets() {
        clearSelectOptions(ui.bg);
        clearSelectOptions(ui.pSprite);
        document.querySelectorAll('.npc-sprite').forEach(sel => clearSelectOptions(sel));

        for (const dir of GB_BG_DIRS) {
            const manifestUrls = [dir + '/index.json', dir + '/manifest.json'];
            let data = null;
            for (const u of manifestUrls) { data = await fetchJson(u); if (data) break; }
            if (data && Array.isArray(data)) {
                for (const item of data) {
                    const name = item.name || item.key || item.src;
                    const key = sanitizeKey(name);
                    const srcRel = item.src?.startsWith('/') ? item.src : (dir.replace(/\/$/, '') + '/' + (item.src || ''));
                    const src = srcRel;
                    const dims = (item.h && item.w) ? { h: item.h, w: item.w } : await ensureImageDims(src);
                    if (!assets.bg[key]) assets.bg[key] = { src, h: dims.h, w: dims.w };
                    const opt = document.createElement('option'); opt.value = key; opt.textContent = name; ui.bg.appendChild(opt);
                }
            } else {
                const imgs = await scanDirForImages(dir);
                for (const src of imgs) {
                    const base = src.split('/').pop();
                    const name = base.replace(/\.[^.]+$/, '');
                    const key = sanitizeKey(name);
                    if (assets.bg[key]) continue;
                    const relSrc = src.replace(SITE_BASE, '');
                    const dims = await ensureImageDims(relSrc);
                    assets.bg[key] = { src: relSrc, h: dims.h, w: dims.w };
                    const opt = document.createElement('option'); opt.value = key; opt.textContent = name; ui.bg.appendChild(opt);
                }
            }
        }

        // Add procedural backgrounds (not image-file based) after server scan
        if (ui.bg && !Array.from(ui.bg.options).some(o => o.value === 'maze')) {
            const mazeOpt = document.createElement('option');
            mazeOpt.value = 'maze'; mazeOpt.textContent = 'Maze';
            ui.bg.appendChild(mazeOpt);
        }
        // Pre-scan Newmaze.png for wall barriers so they're ready when the user confirms
        _mazeScanBarriersAsync(900, 600).then(() => {
            // If maze is already selected, re-stage the code now that barriers are loaded
            if (ui.bg && ui.bg.value === 'maze') {
                state.lastEdited = 'background';
                syncFromControlsIfFreestyle();
            }
        });

        dedupSelectOptions(ui.bg);

        for (const dir of GB_SPR_DIRS) {
            const manifestUrls = [dir + '/index.json', dir + '/manifest.json'];
            let data = null;
            for (const u of manifestUrls) { data = await fetchJson(u); if (data) break; }
            if (data && Array.isArray(data)) {
                for (const item of data) {
                    const name = item.name || item.key || item.src;
                    const key = sanitizeKey(name);
                    const srcRel = item.src?.startsWith('/') ? item.src : (dir.replace(/\/$/, '') + '/' + (item.src || ''));
                    const src = srcRel;
                    const dims = (item.h && item.w) ? { h: item.h, w: item.w } : await ensureImageDims(src);
                    const rows = item.rows || 4; const cols = item.cols || 3;
                    if (!assets.sprites[key]) assets.sprites[key] = { src, h: dims.h, w: dims.w, rows, cols, mirrorLeft: item.mirrorLeft };
                    const opt = document.createElement('option'); opt.value = key; opt.textContent = name; ui.pSprite.appendChild(opt);
                    document.querySelectorAll('.npc-sprite').forEach(sel => {
                        const o = document.createElement('option'); o.value = key; o.textContent = name; sel.appendChild(o);
                    });
                }
            } else {
                const imgs = await scanDirForImages(dir);
                for (const src of imgs) {
                    const base = src.split('/').pop();
                    const name = base.replace(/\.[^.]+$/, '');
                    const key = sanitizeKey(name);
                    if (assets.sprites[key]) continue;
                    const relSrc = src.replace(SITE_BASE, '');
                    const dims = await ensureImageDims(relSrc);
                    const rows = 4, cols = 3;
                    assets.sprites[key] = { src: relSrc, h: dims.h, w: dims.w, rows, cols };
                    const opt = document.createElement('option'); opt.value = key; opt.textContent = name; ui.pSprite.appendChild(opt);
                    document.querySelectorAll('.npc-sprite').forEach(sel => {
                        const o = document.createElement('option'); o.value = key; o.textContent = name; sel.appendChild(o);
                    });
                }
            }
        }

        dedupSelectOptions(ui.pSprite);
        document.querySelectorAll('.npc-sprite').forEach(sel => dedupSelectOptions(sel));
    }

    /*  UI element references and state containers */
    const ui = {
        bg: document.getElementById('bg-select'),
        bgInstructionsBtn: document.getElementById('bg-instructions-btn'),
        bgInstructionsPanel: document.getElementById('bg-instructions-panel'),
        pSprite: document.getElementById('player-select'),
        spriteInstructionsBtn: document.getElementById('sprite-instructions-btn'),
        spriteInstructionsPanel: document.getElementById('sprite-instructions-panel'),
        pScale: document.getElementById('player-scale'),
        pStep: document.getElementById('player-step'),
        pAnim: document.getElementById('player-anim'),
        pRows: document.getElementById('player-rows'),
        pCols: document.getElementById('player-cols'),
        pHitboxW: document.getElementById('player-hitbox-width'),
        pHitboxH: document.getElementById('player-hitbox-height'),
        pDownRow: document.getElementById('player-dir-down-row'),
        pRightRow: document.getElementById('player-dir-right-row'),
        pLeftRow: document.getElementById('player-dir-left-row'),
        pUpRow: document.getElementById('player-dir-up-row'),
        pUpRightRow: document.getElementById('player-dir-upright-row'),
        pDownRightRow: document.getElementById('player-dir-downright-row'),
        pUpLeftRow: document.getElementById('player-dir-upleft-row'),
        pDownLeftRow: document.getElementById('player-dir-downleft-row'),
        pDirCols: document.getElementById('player-dir-columns'),

        playerAdvancedBtn: document.getElementById('player-advanced-btn'),
        playerAdvancedPanel: document.getElementById('player-advanced-panel'),
        npcSpriteInstructionsBtn: document.getElementById('npc-sprite-instructions-btn'),
        npcSpriteInstructionsPanel: document.getElementById('npc-sprite-instructions-panel'),
        pX: document.getElementById('player-x'),
        pY: document.getElementById('player-y'),
        pName: document.getElementById('player-name'),

        // NPCs UI
        addNpcBtn: document.getElementById('add-npc'),
        npcsContainer: document.getElementById('npcs-container'),
        npcs: [],

        // Walls UI
        addWallBtn: document.getElementById('add-wall'),
        wallsContainer: document.getElementById('walls-container'),
        walls: [],
        drawOverlay: document.getElementById('draw-overlay'),
        drawBarrierBtn: document.getElementById('draw-barrier'),
        drawStarBtn: document.getElementById('draw-star'),
        routeVisLayer: document.getElementById('route-vis-layer'),
        drawRouteNpcBtn: document.getElementById('draw-route-npc'),
        finishRouteNpcBtn: document.getElementById('finish-route-npc'),
        drawAttackNpcBtn: document.getElementById('draw-attack-npc'),
        finishAttackNpcBtn: document.getElementById('finish-attack-npc'),
        drawClearBtn: document.getElementById('draw-clear'),
        globalMaxHeartsInput: document.getElementById('global-max-hearts'),
        drawState: { mode: null, isDrawing: false, startX: 0, startY: 0, activeBarrier: null, activeRoute: null, activeAttackRoute: null },
        drawShapes: [],
        toggleWallsGameBtn: document.getElementById('toggle-walls-game'),
        gameWallsVisible: true,
        overlayConfirmed: false,

        editor: document.getElementById('code-editor'),
        hLayer: document.getElementById('highlight-layer'),
        gameContainer: document.getElementById('game-container-builder'),
        gameCanvas: document.getElementById('game-canvas-builder'),
        codePlayBtn: document.getElementById('btn-code-play'),
        codeStopBtn: document.getElementById('btn-code-stop'),

        colMain: document.querySelector('.col-main'),
        viewBtns: document.querySelectorAll('.view-btn')
    };

    // view switching: preview/game/code panels
    ui.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            ui.colMain.className = `col-main view-${view}`;
            ui.viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    let envTopOffset = 0;
    let envLeftOffset = 0;
    // live game container dimensions
    let envWidth = 0;
    let envHeight = 0;
    // track overlay size to rescale drawn shapes on container changes
    let overlayPrevW = 0;
    let overlayPrevH = 0;
    // Initialize env metrics using local container.
    try {
        const containerEl = document.getElementById('game-container-builder');
        const rect = containerEl?.getBoundingClientRect?.() || { width: 0, height: 0 };
        envWidth = Math.max(0, Math.floor(rect.width));
        envHeight = Math.max(0, Math.floor(rect.height));
    } catch (_) {}

    // simple toggler for disclosure panels
    function toggle(el) {
        if (!el) return;
        const isHidden = el.style.display === 'none';
        el.style.display = isHidden ? '' : 'none';
    }
    if (ui.bgInstructionsPanel) ui.bgInstructionsPanel.style.display = 'none';
    if (ui.spriteInstructionsPanel) ui.spriteInstructionsPanel.style.display = 'none';
    if (ui.npcSpriteInstructionsPanel) ui.npcSpriteInstructionsPanel.style.display = 'none';
    if (ui.playerAdvancedPanel) ui.playerAdvancedPanel.style.display = 'none';

    if (ui.bgInstructionsBtn) ui.bgInstructionsBtn.addEventListener('click', () => toggle(ui.bgInstructionsPanel));
    if (ui.spriteInstructionsBtn) ui.spriteInstructionsBtn.addEventListener('click', () => toggle(ui.spriteInstructionsPanel));
    if (ui.npcSpriteInstructionsBtn) ui.npcSpriteInstructionsBtn.addEventListener('click', () => toggle(ui.npcSpriteInstructionsPanel));
    if (ui.playerAdvancedBtn) ui.playerAdvancedBtn.addEventListener('click', () => toggle(ui.playerAdvancedPanel));

    /* overlay drawing (barriers) */
    function removePreview() {
        if (!ui.drawOverlay) return;
        const preview = ui.drawOverlay.querySelector('.draw-rect.preview');
        if (preview) preview.remove();
    }

    function setDrawMode(mode) {
        if (ui.drawState.mode === mode) {
            mode = null;
        }
        ui.drawState.mode = mode;
        if (ui.drawBarrierBtn) ui.drawBarrierBtn.classList.toggle('active', mode === 'barrier');
        // Toggle crosshair cursor on the game-frame (always interactable, no pointer-events issues)
        const gf = document.querySelector('.game-frame');
        if (gf) gf.classList.toggle('drawing-active', !!mode);
        if (ui.drawStarBtn)    ui.drawStarBtn.classList.toggle('active', mode === 'star');
        if (ui.drawRouteNpcBtn)  ui.drawRouteNpcBtn.classList.toggle('active',  mode === 'routeNpc');
        if (ui.drawAttackNpcBtn) ui.drawAttackNpcBtn.classList.toggle('active', mode === 'attackNpc');
        if (ui.drawOverlay) {
            ui.drawOverlay.classList.toggle('active', !!mode);
            ui.drawOverlay.classList.toggle('mode-barrier',   mode === 'barrier');
            ui.drawOverlay.classList.toggle('mode-star',      mode === 'star');
            ui.drawOverlay.classList.toggle('mode-routeNpc',  mode === 'routeNpc');
            ui.drawOverlay.classList.toggle('mode-attackNpc', mode === 'attackNpc');
        }
        // If leaving routeNpc mode, finish any in-progress route
        if (!mode && ui.drawState.activeRoute) {
            finishActiveRoute();
        }
        // If leaving attackNpc mode, finish any in-progress attack route
        if (!mode && ui.drawState.activeAttackRoute) {
            finishActiveAttackRoute();
        }
        // Show/hide the "Finish Route" button
        if (ui.finishRouteNpcBtn) {
            ui.finishRouteNpcBtn.style.display = (mode === 'routeNpc') ? '' : 'none';
        }
        // Show/hide the "Finish Attack" button
        if (ui.finishAttackNpcBtn) {
            ui.finishAttackNpcBtn.style.display = (mode === 'attackNpc') ? '' : 'none';
        }
        if (!mode) removePreview();
    }
    if (ui.drawBarrierBtn) ui.drawBarrierBtn.addEventListener('click', () => { state.lastEdited = 'walls'; setDrawMode('barrier'); });
    if (ui.drawStarBtn)    ui.drawStarBtn.addEventListener('click', () => { state.lastEdited = 'background'; setDrawMode('star'); });
    if (ui.drawRouteNpcBtn)  ui.drawRouteNpcBtn.addEventListener('click',  () => { state.lastEdited = 'background'; setDrawMode('routeNpc'); });
    if (ui.finishRouteNpcBtn) ui.finishRouteNpcBtn.addEventListener('click', () => { finishActiveRoute(); setDrawMode(null); });
    if (ui.drawAttackNpcBtn) ui.drawAttackNpcBtn.addEventListener('click',  () => { state.lastEdited = 'background'; setDrawMode('attackNpc'); });
    if (ui.finishAttackNpcBtn) ui.finishAttackNpcBtn.addEventListener('click', () => { finishActiveAttackRoute(); setDrawMode(null); });
    if (ui.drawClearBtn) ui.drawClearBtn.addEventListener('click', () => { state.lastEdited = 'walls'; ui.drawShapes = []; ui.drawState.activeRoute = null; ui.drawState.activeAttackRoute = null; ui.overlayConfirmed = false; renderDrawShapes(); syncFromControlsIfFreestyle(); });

    // ── Hearts +/− stepper ──────────────────────────────────────────────────
    document.getElementById('hearts-dec')?.addEventListener('click', () => {
        const inp = ui.globalMaxHeartsInput;
        if (!inp) return;
        inp.value = Math.max(1, (parseInt(inp.value) || 3) - 1);
    });
    document.getElementById('hearts-inc')?.addEventListener('click', () => {
        const inp = ui.globalMaxHeartsInput;
        if (!inp) return;
        inp.value = Math.min(10, (parseInt(inp.value) || 3) + 1);
    });

    // show/hide overlay per game walls visibility
    function updateOverlayVisibility() {
        if (!ui.drawOverlay) return;
        ui.drawOverlay.style.display = ui.gameWallsVisible ? '' : 'none';
    }

    // render overlay rectangles and sync to game
    function renderDrawShapes() {
        if (!ui.drawOverlay) return;
        const rect = ui.drawOverlay.getBoundingClientRect();
        // auto-rescale shapes when overlay size changes (before confirmation)
        if (!ui.overlayConfirmed && overlayPrevW && overlayPrevH && rect.width && rect.height && (rect.width !== overlayPrevW || rect.height !== overlayPrevH)) {
            const scaleX = rect.width / overlayPrevW;
            const scaleY = rect.height / overlayPrevH;
            ui.drawShapes = ui.drawShapes.map(s => ({
                ...s,
                x: Math.round((s.x || 0) * scaleX),
                y: Math.round((s.y || 0) * scaleY),
                width: Math.round((s.width || 0) * scaleX),
                height: Math.round((s.height || 0) * scaleY)
            }));
        }
        overlayPrevW = rect.width || overlayPrevW;
        overlayPrevH = rect.height || overlayPrevH;

        // Render overlay rects
        ui.drawOverlay.innerHTML = '';
        const frag = document.createDocumentFragment();
        ui.drawShapes.forEach((shape, idx) => {
            const el = document.createElement('div');
            el.className = `draw-rect ${shape.type}`;
            el.style.left = shape.x + 'px';
            el.style.top = shape.y + 'px';
            el.style.width = Math.max(0, shape.width) + 'px';
            el.style.height = Math.max(0, shape.height) + 'px';
            el.style.background = shape.type === 'star' ? 'transparent' : (shape.color || '#4466ff');
            el.style.opacity = shape.visible === false ? '0.2' : (shape.type === 'star' ? '1' : '0.7');
            if (shape.type === 'star') {
                el.textContent = '⭐';
                el.style.fontSize = '20px';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.border = 'none';
                el.style.filter = 'drop-shadow(0 0 4px #FFD700)';
            }
            el.style.cursor = ui.drawState.mode ? 'crosshair' : 'pointer';
            el.title = ui.drawState.mode ? '' : `${shape.type === 'star' ? 'Star' : 'Wall'} ${idx+1} — click to edit`;
            el.addEventListener('click', (e) => {
                if (ui.drawState.mode) return; // don't open editor while drawing
                e.stopPropagation();
                showDrawnShapeEditor(shape, idx);
            });
            frag.appendChild(el);
        });
        ui.drawOverlay.appendChild(frag);
        // Route/attack NPC paths are rendered into the fixed #route-vis-layer
        // (immune to overflow:hidden on ancestors) — see renderRoutePaths() below
        renderRoutePaths();

        // Render sidebar barriers list
        const listEl = document.getElementById('drawn-barriers-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        if (ui.drawShapes.length === 0) return;
        let starCount = 0, wallCount = 0, routeCount = 0, attackCount = 0;
        ui.drawShapes.forEach((shape, idx) => {
            const isStar   = shape.type === 'star';
            const isRoute  = shape.type === 'routeNpc';
            const isAttack = shape.type === 'attackNpc';
            const label    = isAttack ? `⚔️ ${shape.id || `AttackNPC_${++attackCount}`}`
                           : isRoute  ? `🧍 ${shape.id || `RouteNPC_${++routeCount}`}`
                           : isStar   ? `⭐ Star ${++starCount}`
                           : `🧱 Wall ${++wallCount}`;
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 6px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:.78rem;';
            row.innerHTML = isAttack ? `
                <span style="font-size:15px;flex-shrink:0;">⚔️</span>
                <span style="flex:1;color:#fca5a5;">${label} <span style="color:#6b7280;font-size:.72rem;">(${(shape.waypoints||[]).length} pts)</span></span>
                <button class="atk-edit-btn" title="Edit attack NPC" style="background:#7f1d1d;border:none;border-radius:5px;color:#fca5a5;padding:2px 7px;cursor:pointer;font-size:.8rem;">✏️</button>
                <button title="Delete attack NPC" style="background:#450a0a;border:none;border-radius:5px;color:#fff;padding:2px 7px;cursor:pointer;font-size:.8rem;">🗑</button>
            ` : isRoute ? `
                <span style="font-size:15px;flex-shrink:0;">🧍</span>
                <span style="flex:1;color:#a7f3d0;">${label} <span style="color:#6b7280;font-size:.72rem;">(${(shape.waypoints||[]).length} pts)</span></span>
                <button class="rte-edit-btn" title="Edit route NPC" style="background:#065f46;border:none;border-radius:5px;color:#a7f3d0;padding:2px 7px;cursor:pointer;font-size:.8rem;">✏️</button>
                <button title="Delete route NPC" style="background:#7f1d1d;border:none;border-radius:5px;color:#fff;padding:2px 7px;cursor:pointer;font-size:.8rem;">🗑</button>
            ` : `
                ${isStar ? `<span style="font-size:16px;flex-shrink:0;">⭐</span>` : `<input type="color" value="${shape.color || '#4466ff'}" title="Change color" style="width:24px;height:20px;border:none;background:none;cursor:pointer;padding:0;flex-shrink:0;">`}
                <span style="flex:1;color:${isStar ? '#FFD700' : '#cbd5e1'};">${label}</span>
                <label style="display:flex;align-items:center;gap:3px;color:#94a3b8;cursor:pointer;white-space:nowrap;">
                    <input type="checkbox" ${shape.visible !== false ? 'checked' : ''} title="Visible in game"> Visible
                </label>
                <button title="Delete this ${isStar ? 'star' : 'wall'}" style="background:#7f1d1d;border:none;border-radius:5px;color:#fff;padding:2px 7px;cursor:pointer;font-size:.8rem;">🗑</button>
            `;
            if (isAttack) {
                const editBtn   = row.querySelector('.atk-edit-btn');
                const deleteBtn = row.querySelector('button:last-child');
                if (editBtn) editBtn.addEventListener('click', () => showAttackNpcEditor(shape, idx));
                if (deleteBtn) deleteBtn.addEventListener('click', () => {
                    if (ui.drawState.activeAttackRoute === shape) ui.drawState.activeAttackRoute = null;
                    ui.drawShapes.splice(idx, 1);
                    renderDrawShapes(); syncFromControlsIfFreestyle();
                });
            } else if (isRoute) {
                const editBtn   = row.querySelector('.rte-edit-btn');
                const deleteBtn = row.querySelector('button:last-child');
                if (editBtn) editBtn.addEventListener('click', () => showRouteNpcEditor(shape, idx));
                if (deleteBtn) deleteBtn.addEventListener('click', () => {
                    if (ui.drawState.activeRoute === shape) ui.drawState.activeRoute = null;
                    ui.drawShapes.splice(idx, 1);
                    renderDrawShapes(); syncFromControlsIfFreestyle();
                });
            } else {
                const colorInput  = row.querySelector('input[type=color]');
                const visibleInput = row.querySelector('input[type=checkbox]');
                const deleteBtn   = row.querySelector('button');
                if (colorInput) colorInput.addEventListener('input', () => {
                    shape.color = colorInput.value;
                    renderDrawShapes(); syncFromControlsIfFreestyle();
                });
                if (visibleInput) visibleInput.addEventListener('change', () => {
                    shape.visible = visibleInput.checked;
                    renderDrawShapes(); syncFromControlsIfFreestyle();
                });
                if (deleteBtn) deleteBtn.addEventListener('click', () => {
                    ui.drawShapes.splice(idx, 1);
                    renderDrawShapes(); syncFromControlsIfFreestyle();
                });
            }
            listEl.appendChild(row);
        });
    }

    /**
     * Renders route/attack NPC path lines and dots into the fixed-position
     * #route-vis-layer element. Because it uses position:fixed it sits above
     * all ancestors and is immune to overflow:hidden clipping.
     * The layer is repositioned to exactly cover the game-frame each call.
     */
    function renderRoutePaths() {
        const layer = ui.routeVisLayer;
        if (!layer) return;

        // Clear previous contents
        layer.innerHTML = '';

        const gameFrame = document.querySelector('.game-frame');
        if (!gameFrame) return;

        // Position the fixed layer exactly over the game-frame viewport
        const fr = gameFrame.getBoundingClientRect();
        layer.style.left   = fr.left + 'px';
        layer.style.top    = fr.top  + 'px';
        layer.style.width  = fr.width  + 'px';
        layer.style.height = fr.height + 'px';

        const routeShapes  = ui.drawShapes.filter(s => s.type === 'routeNpc');
        const attackShapes = ui.drawShapes.filter(s => s.type === 'attackNpc');

        // Update the Attack NPC count badge on the draw button
        const atkBadge = document.getElementById('attack-npc-count');
        if (atkBadge) {
            const n = attackShapes.length;
            atkBadge.textContent = n;
            atkBadge.style.display = n > 0 ? 'inline' : 'none';
        }

        // Helper: build one SVG line element
        function makeLine(x1, y1, x2, y2, stroke, width, dash, opacity) {
            const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            l.setAttribute('x1', x1); l.setAttribute('y1', y1);
            l.setAttribute('x2', x2); l.setAttribute('y2', y2);
            l.setAttribute('stroke', stroke);
            l.setAttribute('stroke-width', width);
            if (dash)    l.setAttribute('stroke-dasharray', dash);
            if (opacity) l.setAttribute('opacity', opacity);
            return l;
        }

        // Helper: create and return an SVG element sized to the layer
        function makeSvg() {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
            return svg;
        }

        // ── Route NPC paths (green) ──────────────────────────────────────────
        if (routeShapes.length > 0) {
            const svg = makeSvg();
            layer.appendChild(svg);
            routeShapes.forEach(route => {
                const pts = route.waypoints || [];
                if (pts.length < 2) return;
                for (let i = 0; i < pts.length - 1; i++) {
                    svg.appendChild(makeLine(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, '#10b981', '2', '7,3', null));
                }
                svg.appendChild(makeLine(pts[pts.length-1].x, pts[pts.length-1].y, pts[0].x, pts[0].y, '#10b981', '1.5', '3,7', '0.45'));
            });
            routeShapes.forEach(route => {
                const pts = route.waypoints || [];
                pts.forEach((pt, ptIdx) => {
                    const dot = document.createElement('div');
                    dot.className = 'route-npc-dot' + (ptIdx === 0 ? ' start' : '');
                    dot.style.cssText = `position:absolute;left:${pt.x}px;top:${pt.y}px;`;
                    dot.title = `${route.id} — waypoint ${ptIdx + 1} (click to remove)`;
                    dot.style.pointerEvents = 'auto';
                    dot.addEventListener('click', (e) => {
                        if (ui.drawState.mode === 'routeNpc') {
                            route.waypoints.splice(ptIdx, 1);
                            if (route.waypoints.length === 0) {
                                ui.drawShapes.splice(ui.drawShapes.indexOf(route), 1);
                                if (ui.drawState.activeRoute === route) ui.drawState.activeRoute = null;
                            }
                            renderDrawShapes(); e.stopPropagation(); return;
                        }
                        e.stopPropagation();
                        showRouteNpcEditor(route, ui.drawShapes.indexOf(route));
                    });
                    layer.appendChild(dot);
                });
                if (pts.length > 0) {
                    const lbl = document.createElement('div');
                    lbl.className = 'route-npc-label';
                    lbl.style.cssText = `position:absolute;left:${pts[0].x}px;top:${pts[0].y - 20}px;`;
                    lbl.textContent = `🧍 ${route.id}`;
                    layer.appendChild(lbl);
                }
            });
        }

        // ── Attack NPC paths (red) ───────────────────────────────────────────
        if (attackShapes.length > 0) {
            const svg = makeSvg();
            layer.appendChild(svg);
            attackShapes.forEach(route => {
                const pts = route.waypoints || [];
                if (pts.length < 2) return;
                for (let i = 0; i < pts.length - 1; i++) {
                    svg.appendChild(makeLine(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, '#ef4444', '2', '7,3', null));
                }
                svg.appendChild(makeLine(pts[pts.length-1].x, pts[pts.length-1].y, pts[0].x, pts[0].y, '#ef4444', '1.5', '3,7', '0.45'));
            });
            attackShapes.forEach(route => {
                const pts = route.waypoints || [];
                pts.forEach((pt, ptIdx) => {
                    const dot = document.createElement('div');
                    dot.className = 'attack-npc-dot' + (ptIdx === 0 ? ' start' : '');
                    dot.style.cssText = `position:absolute;left:${pt.x}px;top:${pt.y}px;`;
                    dot.title = `${route.id} — waypoint ${ptIdx + 1} (click to remove)`;
                    dot.style.pointerEvents = 'auto';
                    dot.addEventListener('click', (e) => {
                        if (ui.drawState.mode === 'attackNpc') {
                            route.waypoints.splice(ptIdx, 1);
                            if (route.waypoints.length === 0) {
                                ui.drawShapes.splice(ui.drawShapes.indexOf(route), 1);
                                if (ui.drawState.activeAttackRoute === route) ui.drawState.activeAttackRoute = null;
                            }
                            renderDrawShapes(); e.stopPropagation(); return;
                        }
                        e.stopPropagation();
                        showAttackNpcEditor(route, ui.drawShapes.indexOf(route));
                    });
                    layer.appendChild(dot);
                });
                if (pts.length > 0) {
                    const lbl = document.createElement('div');
                    lbl.className = 'attack-npc-label';
                    lbl.style.cssText = `position:absolute;left:${pts[0].x}px;top:${pts[0].y - 20}px;`;
                    lbl.textContent = `⚔️ ${route.id}`;
                    layer.appendChild(lbl);
                }
            });
        }
    }

    /** Called when user presses Enter / Finish Route button / Escape while in route mode. */
    function finishActiveRoute() {
        const route = ui.drawState.activeRoute;
        ui.drawState.activeRoute = null;
        if (!route || (route.waypoints || []).length === 0) return;
        // Drop routes with < 2 waypoints (they won't loop anywhere useful)
        if (route.waypoints.length < 2) return;
        showRouteNpcEditor(route, ui.drawShapes.indexOf(route));
    }

    // ── sprite catalog ────────────────────────────────────────────────────────
    // Known character sprites with their spritesheet metadata.
    // w/h = spritesheet pixel dimensions, rows/cols = animation grid.
    const SPRITE_CATALOG = [
        // ── Superheroes ──
        { name:'Iron Man',        file:'ironman',           w:96,  h:132, rows:1, cols:1 },
        { name:'Spider-Man',      file:'spiderman',         w:96,  h:132, rows:1, cols:1 },
        { name:'Captain America', file:'captain_america',   w:96,  h:132, rows:1, cols:1 },
        { name:'Batman',          file:'batman',            w:96,  h:132, rows:1, cols:1 },
        { name:'Superman',        file:'superman',          w:96,  h:132, rows:1, cols:1 },
        { name:'Wonder Woman',    file:'wonder_woman',      w:96,  h:132, rows:1, cols:1 },
        { name:'Thor',            file:'thor',              w:96,  h:132, rows:1, cols:1 },
        // ── Pokémon ──
        { name:'Pikachu',         file:'pokemon/pikachu',   w:475, h:475, rows:1, cols:1 },
        { name:'Charizard',       file:'pokemon/charizard', w:475, h:475, rows:1, cols:1 },
        { name:'Mewtwo',          file:'pokemon/mewtwo',    w:475, h:475, rows:1, cols:1 },
        { name:'Eevee',           file:'pokemon/eevee',     w:475, h:475, rows:1, cols:1 },
        { name:'Gengar',          file:'pokemon/gengar',    w:475, h:475, rows:1, cols:1 },
        { name:'Lucario',         file:'pokemon/lucario',   w:475, h:475, rows:1, cols:1 },
        // ── Adventure / Tech ──
        { name:'Chill Guy',       file:'chillguy',          w:512, h:384, rows:3, cols:4 },
        { name:'R2D2',            file:'r2_idle',           w:505, h:223, rows:1, cols:3 },
        { name:'Tux',             file:'tux',               w:352, h:256, rows:8, cols:11 },
        { name:'Alex',            file:'Alex',              w:128, h:256, rows:1, cols:1 },
        { name:'Octocat',         file:'octocat',           w:801, h:301, rows:1, cols:9 },
        { name:'Robot',           file:'robot',             w:627, h:316, rows:3, cols:6 },
        { name:'Miku',            file:'miku',              w:189, h:316, rows:4, cols:1 },
        { name:'Nezuko',          file:'nezuko',            w:189, h:316, rows:4, cols:1 },
        // ── Other ──
        { name:'Sword',           file:'sword',             w:500, h:500, rows:1, cols:1 },
        { name:'Fireball',        file:'fireball_10',       w:256, h:256, rows:1, cols:1 },
        { name:'Creeper',         file:'creepa',            w:1600,h:1200,rows:6, cols:8 },
        { name:'Enderman',        file:'enderman',          w:574, h:1504,rows:8, cols:2 },
        { name:'Chicken',         file:'chicken',           w:400, h:400, rows:2, cols:2 },
        { name:'Hist. Prof',      file:'historyProf',       w:559, h:263, rows:1, cols:3 },
        { name:'Sinatra',         file:'frankSinatra',      w:280, h:281, rows:1, cols:1 },
        { name:'Villager',        file:'villager',          w:700, h:1400,rows:4, cols:1 },
    ];

    /** Render a sprite-picker grid HTML string for use inside an editor panel. */
    function _buildSpritePicker(selectedFile, pickerIdPrefix, basePath) {
        const path = basePath || ('{{ site.baseurl }}' + '/images/gamify');
        let html = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:160px;overflow-y:auto;padding:4px 0;">`;
        SPRITE_CATALOG.forEach(sp => {
            const sel = selectedFile === sp.file ? 'border-color:#6366f1;background:#1e1b4b;' : 'border-color:#334155;background:#0f172a;';
            html += `<div data-file="${sp.file}" data-w="${sp.w}" data-h="${sp.h}" data-rows="${sp.rows}" data-cols="${sp.cols}"
                style="cursor:pointer;border:2px solid;border-radius:6px;padding:3px;text-align:center;${sel}transition:border-color .15s;">
                <img src="${path}/${sp.file}.png" style="width:100%;height:40px;object-fit:contain;image-rendering:pixelated;" draggable="false">
                <div style="font-size:9px;color:#94a3b8;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${sp.name}</div>
            </div>`;
        });
        html += `</div>`;
        return html;
    }

    /** Wire click events on a sprite picker grid; calls onChange(spriteObj) on selection. */
    function _wireSpritePicker(container, onChange) {
        container.querySelectorAll('[data-file]').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('[data-file]').forEach(e => {
                    e.style.borderColor = '#334155'; e.style.background = '#0f172a';
                });
                el.style.borderColor = '#6366f1'; el.style.background = '#1e1b4b';
                onChange({
                    file: el.dataset.file,
                    w: parseInt(el.dataset.w),
                    h: parseInt(el.dataset.h),
                    rows: parseInt(el.dataset.rows),
                    cols: parseInt(el.dataset.cols),
                });
            });
        });
    }

    /** Popup editor for a route NPC's properties (id, speed, greeting, sprite). */
    function showRouteNpcEditor(route, idx) {
        document.getElementById('gb-route-editor')?.remove();
        const panel = document.createElement('div');
        panel.id = 'gb-route-editor';
        panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #10b981;border-radius:14px;padding:22px 26px;z-index:9999;color:#e2e8f0;font-family:sans-serif;min-width:320px;max-width:400px;box-shadow:0 0 28px rgba(16,185,129,.35);';
        const imgBase = ('{{ site.baseurl }}') + '/images/gamify';
        panel.innerHTML = `
            <div style="font-weight:700;font-size:1rem;margin-bottom:14px;color:#a7f3d0;">🧍 Route NPC — ${(route.waypoints||[]).length} waypoints</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <label style="font-size:.83rem;display:flex;align-items:center;gap:8px;">
                    Name / ID
                    <input id="grte-id" type="text" value="${route.id || ''}" style="flex:1;padding:4px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;">
                </label>
                <label style="font-size:.83rem;display:flex;align-items:center;gap:8px;">
                    Speed
                    <input id="grte-speed" type="number" min="0.2" max="10" step="0.1" value="${route.speed || 1.5}" style="width:60px;padding:4px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;">
                    <span style="color:#6b7280;font-size:.75rem;">px/frame</span>
                </label>
                <label style="font-size:.83rem;display:flex;align-items:center;gap:8px;">
                    Scale
                    <input id="grte-scale" type="number" min="3" max="20" step="1" value="${route.scale || 8}" style="width:55px;padding:4px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;">
                </label>
                <label style="font-size:.83rem;display:flex;flex-direction:column;gap:4px;">
                    Greeting / dialogue
                    <textarea id="grte-greeting" rows="2" style="padding:5px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;resize:vertical;">${route.greeting || 'Hello, traveler!'}</textarea>
                </label>
                <div style="font-size:.83rem;color:#94a3b8;margin-bottom:2px;">Character sprite</div>
                <div id="grte-sprite-picker">${_buildSpritePicker(route.spriteFile || 'chillguy', 'grte', imgBase)}</div>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;">
                <button id="grte-save" style="flex:1;padding:8px;background:#059669;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer;font-size:.85rem;">✓ Save</button>
                <button id="grte-delete" style="padding:8px 12px;background:#7f1d1d;border:none;border-radius:8px;color:#fff;cursor:pointer;">🗑</button>
                <button id="grte-cancel" style="padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#94a3b8;cursor:pointer;">✕</button>
            </div>
        `;
        document.body.appendChild(panel);
        let _rteSprite = SPRITE_CATALOG.find(s => s.file === (route.spriteFile || 'chillguy')) || SPRITE_CATALOG[0];
        _wireSpritePicker(panel.querySelector('#grte-sprite-picker'), sp => { _rteSprite = sp; });
        document.getElementById('grte-save').onclick = () => {
            route.id         = document.getElementById('grte-id').value.trim() || route.id;
            route.speed      = parseFloat(document.getElementById('grte-speed').value) || 1.5;
            route.scale      = parseInt(document.getElementById('grte-scale').value)   || 8;
            route.greeting   = document.getElementById('grte-greeting').value.trim() || 'Hello, traveler!';
            route.spriteFile = _rteSprite.file;
            route.spriteW    = _rteSprite.w;
            route.spriteH    = _rteSprite.h;
            route.spriteRows = _rteSprite.rows;
            route.spriteCols = _rteSprite.cols;
            panel.remove(); renderDrawShapes(); syncFromControlsIfFreestyle();
        };
        document.getElementById('grte-delete').onclick = () => {
            if (idx >= 0) ui.drawShapes.splice(idx, 1);
            panel.remove(); renderDrawShapes(); syncFromControlsIfFreestyle();
        };
        document.getElementById('grte-cancel').onclick = () => panel.remove();
    }

    /** Called when user presses Enter / Finish Attack button / Escape while in attackNpc mode. */
    function finishActiveAttackRoute() {
        const route = ui.drawState.activeAttackRoute;
        ui.drawState.activeAttackRoute = null;
        if (!route || (route.waypoints || []).length === 0) return;
        if (route.waypoints.length < 2) return;
        showAttackNpcEditor(route, ui.drawShapes.indexOf(route));
    }

    /** Popup editor for an Attack NPC's properties (id, speed, scale, hearts). */
    function showAttackNpcEditor(route, idx) {
        document.getElementById('gb-attack-editor')?.remove();
        const panel = document.createElement('div');
        panel.id = 'gb-attack-editor';
        panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #ef4444;border-radius:14px;padding:22px 26px;z-index:9999;color:#e2e8f0;font-family:sans-serif;min-width:320px;max-width:400px;box-shadow:0 0 28px rgba(239,68,68,.35);';
        const imgBaseA = ('{{ site.baseurl }}') + '/images/gamify';
        panel.innerHTML = `
            <div style="font-weight:700;font-size:1rem;margin-bottom:14px;color:#fca5a5;">⚔️ Attack NPC — ${(route.waypoints||[]).length} waypoints</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <label style="font-size:.83rem;display:flex;align-items:center;gap:8px;">
                    Name / ID
                    <input id="gatk-id" type="text" value="${route.id || ''}" style="flex:1;padding:4px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;">
                </label>
                <label style="font-size:.83rem;display:flex;align-items:center;gap:8px;">
                    Speed
                    <input id="gatk-speed" type="number" min="0.2" max="10" step="0.1" value="${route.speed || 2.0}" style="width:60px;padding:4px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;">
                    <span style="color:#6b7280;font-size:.75rem;">px/frame</span>
                </label>
                <label style="font-size:.83rem;display:flex;align-items:center;gap:8px;">
                    Scale
                    <input id="gatk-scale" type="number" min="3" max="30" step="1" value="${route.scale || 14}" style="width:55px;padding:4px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;">
                </label>
                <label style="font-size:.83rem;display:flex;align-items:center;gap:8px;">
                    Hearts (player health)
                    <input id="gatk-hearts" type="number" min="1" max="10" step="1" value="${route.maxHearts || 3}" style="width:55px;padding:4px 7px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:.83rem;">
                </label>
                <div style="font-size:.83rem;color:#94a3b8;margin-bottom:2px;">Character sprite</div>
                <div id="gatk-sprite-picker">${_buildSpritePicker(route.spriteFile || 'sword', 'gatk', imgBaseA)}</div>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;">
                <button id="gatk-save" style="flex:1;padding:8px;background:#b91c1c;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer;font-size:.85rem;">✓ Save</button>
                <button id="gatk-delete" style="padding:8px 12px;background:#450a0a;border:none;border-radius:8px;color:#fff;cursor:pointer;">🗑</button>
                <button id="gatk-cancel" style="padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#94a3b8;cursor:pointer;">✕</button>
            </div>
        `;
        document.body.appendChild(panel);
        let _atkSprite = SPRITE_CATALOG.find(s => s.file === (route.spriteFile || 'sword')) || SPRITE_CATALOG[0];
        _wireSpritePicker(panel.querySelector('#gatk-sprite-picker'), sp => { _atkSprite = sp; });
        document.getElementById('gatk-save').onclick = () => {
            route.id         = document.getElementById('gatk-id').value.trim() || route.id;
            route.speed      = parseFloat(document.getElementById('gatk-speed').value) || 2.0;
            route.scale      = parseInt(document.getElementById('gatk-scale').value)   || 14;
            route.maxHearts  = parseInt(document.getElementById('gatk-hearts').value)  || 3;
            route.spriteFile = _atkSprite.file;
            route.spriteW    = _atkSprite.w;
            route.spriteH    = _atkSprite.h;
            route.spriteRows = _atkSprite.rows;
            route.spriteCols = _atkSprite.cols;
            panel.remove(); renderDrawShapes(); syncFromControlsIfFreestyle();
        };
        document.getElementById('gatk-delete').onclick = () => {
            if (idx >= 0) ui.drawShapes.splice(idx, 1);
            panel.remove(); renderDrawShapes(); syncFromControlsIfFreestyle();
        };
        document.getElementById('gatk-cancel').onclick = () => panel.remove();
    }

    function showDrawnShapeEditor(shape, idx) {
        document.getElementById('gb-shape-editor')?.remove();
        const panel = document.createElement('div');
        panel.id = 'gb-shape-editor';
        panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;border:1px solid #6366f1;border-radius:12px;padding:20px 24px;z-index:9999;color:#e2e8f0;font-family:sans-serif;min-width:220px;box-shadow:0 0 24px rgba(99,102,241,.4);';
        panel.innerHTML = `
            <div style="font-weight:700;margin-bottom:12px;">✏️ Edit Wall ${idx+1}</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <label style="font-size:.85rem;display:flex;align-items:center;gap:8px;">
                    Color <input type="color" id="gbe-color" value="${shape.color||'#4466ff'}" style="width:36px;height:24px;border:none;background:none;cursor:pointer;">
                </label>
                <label style="font-size:.85rem;display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="gbe-visible" ${shape.visible !== false ? 'checked' : ''}> Visible in game
                </label>
            </div>
            <div style="display:flex;gap:8px;margin-top:14px;">
                <button id="gbe-save" style="flex:1;padding:7px;background:#6366f1;border:none;border-radius:8px;color:#fff;font-weight:700;cursor:pointer;">Apply</button>
                <button id="gbe-delete" style="padding:7px 12px;background:#7f1d1d;border:none;border-radius:8px;color:#fff;cursor:pointer;">🗑</button>
                <button id="gbe-cancel" style="padding:7px 12px;background:#334155;border:none;border-radius:8px;color:#94a3b8;cursor:pointer;">✕</button>
            </div>
        `;
        document.body.appendChild(panel);
        document.getElementById('gbe-save').onclick = () => {
            shape.color = document.getElementById('gbe-color').value;
            shape.visible = document.getElementById('gbe-visible').checked;
            panel.remove();
            renderDrawShapes();
            syncFromControlsIfFreestyle();
        };
        document.getElementById('gbe-delete').onclick = () => {
            ui.drawShapes.splice(idx, 1);
            panel.remove();
            renderDrawShapes();
            syncFromControlsIfFreestyle();
        };
        document.getElementById('gbe-cancel').onclick = () => panel.remove();
    }

    function currentPreviewEl() {
        if (!ui.drawOverlay) return null;
        let el = ui.drawOverlay.querySelector('.draw-rect.preview');
        if (!el) {
            el = document.createElement('div');
            el.className = 'draw-rect preview';
            ui.drawOverlay.appendChild(el);
        }
        return el;
    }

    function updatePreview(clientX, clientY) {
        const mode = ui.drawState.mode;
        if (!mode) return;
        const bounds = ui.drawOverlay.getBoundingClientRect();
        let x = Math.min(Math.max(0, ui.drawState.startX), bounds.width);
        let y = Math.min(Math.max(0, ui.drawState.startY), bounds.height);
        let cx = Math.min(Math.max(0, clientX - bounds.left), bounds.width);
        let cy = Math.min(Math.max(0, clientY - bounds.top), bounds.height);
        const left = Math.min(x, cx);
        const top = Math.min(y, cy);
        const width = Math.abs(cx - x);
        const height = Math.abs(cy - y);
        const el = currentPreviewEl();
        el.className = `draw-rect ${mode} preview`;
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.width = width + 'px';
        el.style.height = height + 'px';
    }

    function finalizeShape(clientX, clientY) {
        const mode = ui.drawState.mode;
        if (!mode) return;
        const bounds = ui.drawOverlay.getBoundingClientRect();
        let x = Math.min(Math.max(0, ui.drawState.startX), bounds.width);
        let y = Math.min(Math.max(0, ui.drawState.startY), bounds.height);
        let cx = Math.min(Math.max(0, clientX - bounds.left), bounds.width);
        let cy = Math.min(Math.max(0, clientY - bounds.top), bounds.height);
        removePreview();

        // Route NPC: each click adds a waypoint to the active route
        if (mode === 'routeNpc') {
            const pt = { x: Math.round(x), y: Math.round(y) };
            if (!ui.drawState.activeRoute) {
                const routeIdx = ui.drawShapes.filter(s => s.type === 'routeNpc').length + 1;
                ui.drawState.activeRoute = {
                    type: 'routeNpc',
                    id: `RouteNPC_${routeIdx}`,
                    waypoints: [],
                    speed: 1.5,
                    sprite: 'chillguy',
                    greeting: 'Hello, traveler!',
                    scale: 8,
                    visible: true
                };
                ui.drawShapes.push(ui.drawState.activeRoute);
            }
            ui.drawState.activeRoute.waypoints.push(pt);
            ui.overlayConfirmed = false;
            renderDrawShapes();
            state.lastEdited = 'background';
            syncFromControlsIfFreestyle();
            return; // stay in routeNpc mode for continuous placement
        }

        // Attack NPC: each click adds a waypoint to the active attack route
        if (mode === 'attackNpc') {
            const pt = { x: Math.round(x), y: Math.round(y) };
            if (!ui.drawState.activeAttackRoute) {
                const attackIdx = ui.drawShapes.filter(s => s.type === 'attackNpc').length + 1;
                ui.drawState.activeAttackRoute = {
                    type: 'attackNpc',
                    id: `AttackNPC_${attackIdx}`,
                    waypoints: [],
                    speed: 2.0,
                    scale: 14,
                    maxHearts: 3,
                    spriteFile: 'sword',
                    spriteW: 500, spriteH: 500, spriteRows: 1, spriteCols: 1,
                    visible: true
                };
                ui.drawShapes.push(ui.drawState.activeAttackRoute);
            }
            ui.drawState.activeAttackRoute.waypoints.push(pt);
            ui.overlayConfirmed = false;
            renderDrawShapes();
            state.lastEdited = 'background';
            syncFromControlsIfFreestyle();
            return; // stay in attackNpc mode for continuous placement
        }

        // Stars: single-click placement (no drag required)
        if (mode === 'star') {
            const sx = Math.max(0, Math.round(x - 12));
            const sy = Math.max(0, Math.round(y - 12));
            ui.drawShapes.push({ type: 'star', x: sx, y: sy, width: 24, height: 24, color: '#FFD700', visible: true });
            ui.overlayConfirmed = false;
            renderDrawShapes();
            state.lastEdited = 'background';
            syncFromControlsIfFreestyle();
            return; // stay in star mode for continuous placement
        }

        const left = Math.min(x, cx);
        const top = Math.min(y, cy);
        const width = Math.abs(cx - x);
        const height = Math.abs(cy - y);
        if (width >= 4 && height >= 4) {
            ui.drawShapes.push({ type: mode, x: Math.round(left), y: Math.round(top), width: Math.round(width), height: Math.round(height), color: '#4466ff', visible: true });
            ui.overlayConfirmed = false;
            renderDrawShapes();
            syncFromControlsIfFreestyle();
        }
    }

    // Attach mousedown to the game-frame container rather than the overlay itself.
    // The overlay uses pointer-events:none by default (so the game stays interactive)
    // and pointer-events:auto only when .active — but attaching to game-frame avoids
    // any pointer-events/z-index race. We just check ui.drawState.mode as a gate.
    const gameFrameEl = document.querySelector('.game-frame');
    const drawTarget = gameFrameEl || ui.drawOverlay;
    if (drawTarget) {
        drawTarget.addEventListener('mousedown', (e) => {
            if (!ui.drawState.mode) return;
            e.preventDefault();
            const bounds = (ui.drawOverlay || drawTarget).getBoundingClientRect();
            const localX = e.clientX - bounds.left;
            const localY = e.clientY - bounds.top;
            ui.drawState.activeBarrier = null;
            ui.drawState.isDrawing = true;
            ui.drawState.startX = localX;
            ui.drawState.startY = localY;
        });
    }
    // Reposition route-vis-layer whenever the viewport is resized
    window.addEventListener('resize', () => {
        if (ui.routeVisLayer && !ui.routeVisLayer.classList.contains('game-running')) {
            renderRoutePaths();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!ui.drawState.isDrawing) return;
        updatePreview(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', (e) => {
        if (!ui.drawState.isDrawing) return;
        ui.drawState.isDrawing = false;
        finalizeShape(e.clientX, e.clientY);
        ui.drawState.activeBarrier = null;
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (ui.drawState.mode === 'routeNpc' && ui.drawState.activeRoute) {
                finishActiveRoute();
            }
            if (ui.drawState.mode === 'attackNpc' && ui.drawState.activeAttackRoute) {
                finishActiveAttackRoute();
            }
            setDrawMode(null);
        }
        // Enter: finish the in-progress route without leaving route mode
        if (e.key === 'Enter' && ui.drawState.mode === 'routeNpc' && ui.drawState.activeRoute) {
            finishActiveRoute();
        }
        // Enter: finish the in-progress attack route
        if (e.key === 'Enter' && ui.drawState.mode === 'attackNpc' && ui.drawState.activeAttackRoute) {
            finishActiveAttackRoute();
        }
    });

    /* NPC UI slots and interactions */
    function makeNpcSlot(index) {
        const slot = {
            index,
            locked: false,
            displayName: '',
            container: document.createElement('div'),
            fieldsOpen: false
        };
        slot.container.className = 'wall-slot';
        const headerBtn = document.createElement('button');
        headerBtn.className = 'btn';
        headerBtn.textContent = `NPC ${index} ▸`;
        const fields = document.createElement('div');
        fields.className = 'wall-fields';
        fields.style.display = 'none';
        fields.innerHTML = `
            <label>ID</label>
            <input type="text" placeholder="NPC id" class="npc-id">
            <label>Message</label>
            <input type="text" placeholder="Message when interacted with" class="npc-msg">
            <label>Sprite</label>
            <select class="npc-sprite"></select>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; align-items:end;">
                <div>
                    <label>Rows</label>
                    <input type="number" min="1" value="1" class="npc-rows">
                </div>
                <div>
                    <label>Columns</label>
                    <input type="number" min="1" value="1" class="npc-cols">
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; align-items:end; margin-top:8px;">
                <div>
                    <label>Scale Factor</label>
                    <input type="number" min="1" max="40" value="14" class="npc-scale">
                </div>
                <div>
                    <label>Animation Rate (ms)</label>
                    <input type="number" min="10" max="500" value="50" class="npc-anim">
                </div>
            </div>
            <label>Position X</label>
            <input type="range" min="0" max="800" value="500" class="npc-x">
            <label>Position Y</label>
            <input type="range" min="0" max="600" value="300" class="npc-y">
            <div style="margin-top:8px; display:flex; gap:8px;">
                <button class="btn btn-sm btn-danger npc-delete">Delete</button>
            </div>
        `;
        slot.container.appendChild(headerBtn);
        slot.container.appendChild(fields);
        if (!ui.npcsContainer) {
            ui.npcsContainer = document.createElement('div');
            ui.npcsContainer.id = 'npcs-container';
            document.body.appendChild(ui.npcsContainer);
        }
        ui.npcsContainer.appendChild(slot.container);

        slot.addBtn = headerBtn;
        slot.fieldsContainer = fields;
        slot.nId = fields.querySelector('.npc-id');
        slot.nMsg = fields.querySelector('.npc-msg');
        slot.nSprite = fields.querySelector('.npc-sprite');
        slot.nRows = fields.querySelector('.npc-rows');
        slot.nCols = fields.querySelector('.npc-cols');
        slot.nScale = fields.querySelector('.npc-scale');
        slot.nAnim = fields.querySelector('.npc-anim');
        if (slot.nSprite) {
            const none = document.createElement('option'); none.value = ''; none.disabled = true; none.selected = true; none.textContent = 'Select sprite…'; slot.nSprite.appendChild(none);
            if (assets && assets.sprites) {
                Object.keys(assets.sprites).forEach((key) => {
                    const opt = document.createElement('option');
                    opt.value = key; opt.textContent = key;
                    slot.nSprite.appendChild(opt);
                });
            }
        }
        slot.nX = fields.querySelector('.npc-x');
        slot.nY = fields.querySelector('.npc-y');
        slot.deleteBtn = fields.querySelector('.npc-delete');

        headerBtn.addEventListener('click', () => {
            const wasOpen = fields.style.display !== 'none';
            fields.style.display = wasOpen ? 'none' : '';
            slot.fieldsOpen = !wasOpen;
            const labelBase = slot.displayName && slot.locked ? slot.displayName : `NPC ${index}`;
            headerBtn.textContent = labelBase + (wasOpen ? ' ▸' : ' ▾');
            if (slot.locked && slot.displayName) headerBtn.classList.add('btn-confirm'); else headerBtn.classList.remove('btn-confirm');
            updateStepUI();
            syncFromControlsIfFreestyle();
        });

        // NPC deletion handler
        // removes the slot, updates UI, rescans assets, and re-syncs code.
        slot.deleteBtn.addEventListener('click', () => {
            slot.container.remove();
            ui.npcs = ui.npcs.filter(n => n !== slot);
            updateStepUI();
            scanServerAssets();
            syncFromControlsIfFreestyle();
        });

        ['input','change'].forEach(evt => {
            // Stage changes only; do not reload game until Confirm is pressed
            const rerun = () => { try { syncFromControlsIfFreestyle(); } catch (_) {} };
            slot.nId?.addEventListener(evt, () => { rerun(); });
            slot.nMsg?.addEventListener(evt, () => { rerun(); });
            slot.nSprite?.addEventListener(evt, (e) => {
                const key = slot.nSprite.value;
                const spr = assets && assets.sprites ? assets.sprites[key] : null;
                if (spr) {
                    if (slot.nRows) slot.nRows.value = spr.rows ?? 1;
                    if (slot.nCols) slot.nCols.value = spr.cols ?? 1;
                }
                rerun();
            });
            slot.nRows?.addEventListener(evt, () => { rerun(); });
            slot.nCols?.addEventListener(evt, () => { rerun(); });
            slot.nScale?.addEventListener(evt, () => { rerun(); });
            slot.nAnim?.addEventListener(evt, () => { rerun(); });
            slot.nX?.addEventListener(evt, () => { rerun(); });
            slot.nY?.addEventListener(evt, () => { rerun(); });
        });

        if (!ui.npcs) ui.npcs = [];
        ui.npcs.push(slot);
        updateStepUI();
        return slot;
    }

    if (ui.addNpcBtn) {
        ui.addNpcBtn.addEventListener('click', () => {
            if (typeof state !== 'undefined') state.userEdited = false;
            const slot = makeNpcSlot(ui.npcs.length + 1);
            if (slot.fieldsContainer) slot.fieldsContainer.style.display = '';
            slot.fieldsOpen = true;
            slot.addBtn.textContent = `NPC ${ui.npcs.length} ▾`;
            updateStepUI();
        });
    }

    /* wall UI slots and interactions */
    function makeWallSlot(index) {
        const slot = {
            index,
            locked: false,
            displayName: '',
            container: document.createElement('div'),
            fieldsOpen: false
        };
        slot.container.className = 'wall-slot';
        const headerBtn = document.createElement('button');
        headerBtn.className = 'btn';
        headerBtn.textContent = `Wall ${index} ▸`;
        const fields = document.createElement('div');
        fields.className = 'wall-fields';
        fields.style.display = 'none';
        fields.innerHTML = `
            <label>X</label>
            <input type="range" min="0" max="800" value="100" class="wall-x">
            <label>Y</label>
            <input type="range" min="0" max="600" value="100" class="wall-y">
            <label>Width</label>
            <input type="range" min="10" max="800" value="150" class="wall-w">
            <label>Height</label>
            <input type="range" min="10" max="600" value="20" class="wall-h">
            <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
                <label style="font-size:.8rem;margin:0;">Color</label>
                <input type="color" value="#4466ff" class="wall-color" style="width:36px;height:24px;border:none;background:none;cursor:pointer;padding:0;">
                <label style="font-size:.8rem;margin:0;display:flex;align-items:center;gap:4px;">
                    <input type="checkbox" class="wall-visible" checked> Visible in game
                </label>
            </div>
            <div style="margin-top:8px; display:flex; gap:8px;">
                <button class="btn btn-sm btn-danger wall-delete">Delete</button>
            </div>
        `;
        slot.container.appendChild(headerBtn);
        slot.container.appendChild(fields);
        ui.wallsContainer.appendChild(slot.container);

        slot.addBtn = headerBtn;
        slot.fieldsContainer = fields;
        slot.wX = fields.querySelector('.wall-x');
        slot.wY = fields.querySelector('.wall-y');
        slot.wW = fields.querySelector('.wall-w');
        slot.wH = fields.querySelector('.wall-h');
        slot.wColor = fields.querySelector('.wall-color');
        slot.wVisible = fields.querySelector('.wall-visible');
        slot.deleteBtn = fields.querySelector('.wall-delete');

        headerBtn.addEventListener('click', () => {
            const wasOpen = fields.style.display !== 'none';
            fields.style.display = wasOpen ? 'none' : '';
            slot.fieldsOpen = !wasOpen;
            const labelBase = slot.displayName && slot.locked ? slot.displayName : `Wall ${index}`;
            headerBtn.textContent = labelBase + (wasOpen ? ' ▸' : ' ▾');
            if (slot.locked && slot.displayName) headerBtn.classList.add('btn-confirm'); else headerBtn.classList.remove('btn-confirm');
            updateStepUI();
            syncFromControlsIfFreestyle();
        });

        slot.deleteBtn.addEventListener('click', () => {
            slot.container.remove();
            ui.walls = ui.walls.filter(w => w !== slot);
            updateStepUI();
            scanServerAssets();
            syncFromControlsIfFreestyle();
        });

        ['input','change'].forEach(evt => {
            slot.wX.addEventListener(evt, () => { state.lastEdited = 'walls'; syncFromControlsIfFreestyle(); });
            slot.wY.addEventListener(evt, () => { state.lastEdited = 'walls'; syncFromControlsIfFreestyle(); });
            slot.wW.addEventListener(evt, () => { state.lastEdited = 'walls'; syncFromControlsIfFreestyle(); });
            slot.wH.addEventListener(evt, () => { state.lastEdited = 'walls'; syncFromControlsIfFreestyle(); });
            slot.wColor.addEventListener(evt, () => { state.lastEdited = 'walls'; syncFromControlsIfFreestyle(); });
            slot.wVisible.addEventListener(evt, () => { state.lastEdited = 'walls'; syncFromControlsIfFreestyle(); });
        });

        ui.walls.push(slot);
        return slot;
    }

    if (ui.addWallBtn) {
        ui.addWallBtn.addEventListener('click', () => {
            if (typeof state !== 'undefined') state.userEdited = false;
            state.lastEdited = 'walls';
            const slot = makeWallSlot(ui.walls.length + 1);
            if (slot.fieldsContainer) slot.fieldsContainer.style.display = '';
            slot.fieldsOpen = true;
            slot.addBtn.textContent = `Wall ${ui.walls.length} ▾`;
            updateStepUI();
            scanServerAssets();
            syncFromControlsIfFreestyle();
        });
    }

    /* editor overlay + state */
    const LINE_HEIGHT = 20;
    const state = { persistent: null, typing: null, userEdited: false, programmaticEdit: false, lastEdited: null };
    let stagedCode = null;
    let stagedStep = null;
    const steps = ['background','player','freestyle'];
    let stepIndex = 0;
    const stepIndicatorMini = document.getElementById('step-indicator-mini');
    const helpBtn = document.getElementById('btn-help');
    const helpPanel = document.getElementById('help-panel');

    if (helpBtn && helpPanel) {
        helpBtn.addEventListener('click', () => {
            helpPanel.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!helpBtn.contains(e.target) && !helpPanel.contains(e.target)) {
                helpPanel.classList.remove('active');
            }
        });
    }


    function setIndicator() {
        const current = steps[stepIndex];
        const freestyleIndex = steps.indexOf('freestyle');
        if (stepIndicatorMini) {
            if (stepIndex < freestyleIndex) {
                stepIndicatorMini.textContent = `Step ${stepIndex + 1}/${freestyleIndex}`;
            } else {
                stepIndicatorMini.textContent = 'Freestyle';
            }
        }
    }

    // field lock/unlock helpers for step gating
    function lockField(el) { if (el) { el.disabled = true; el.classList.add('locked'); } }
    function unlockField(el) { if (el) { el.disabled = false; el.classList.remove('locked'); } }

    function updateStepUI() {
        const current = steps[stepIndex];
        ui.editor.readOnly = false;
        const mv = document.getElementById('movement-keys');
        [ui.bg, ui.pSprite, ui.pX, ui.pY, ui.pName, mv].forEach(el => { if (el) el.disabled = true; });
        if (ui.addWallBtn) ui.addWallBtn.disabled = true;

        // Draw buttons always enabled — overlay drawing works at any step
        if (ui.drawBarrierBtn) ui.drawBarrierBtn.disabled = false;
        if (ui.drawClearBtn) ui.drawClearBtn.disabled = false;

        ui.walls.forEach(slot => {
            const fields = [slot.wX, slot.wY, slot.wW, slot.wH, slot.deleteBtn];
            if (slot.addBtn) slot.addBtn.disabled = true;
            fields.forEach(el => { if (el) el.disabled = true; });
        });

        if (current === 'background') {
            unlockField(ui.bg);
        } else if (current === 'player') {
            unlockField(ui.pSprite);
            unlockField(ui.pX);
            unlockField(ui.pY);
            unlockField(ui.pName);
            unlockField(mv);
            unlockField(ui.pScale);
            unlockField(ui.pStep);
            unlockField(ui.pAnim);
            unlockField(ui.pRows);
            unlockField(ui.pCols);
            [ui.pDownRow, ui.pRightRow, ui.pLeftRow, ui.pUpRow, ui.pUpRightRow, ui.pDownRightRow, ui.pUpLeftRow, ui.pDownLeftRow, ui.pDirCols, ui.pHitboxW, ui.pHitboxH]
                .forEach(el => unlockField(el));

        } else if (current === 'npc') {
            if (ui.addNpcBtn) ui.addNpcBtn.disabled = false;
            ui.npcs.forEach(slot => {
                if (slot.addBtn) slot.addBtn.disabled = false;
                if (slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none') {
                    [slot.nId, slot.nMsg, slot.nSprite, slot.nRows, slot.nCols, slot.nScale, slot.nAnim, slot.nX, slot.nY].forEach(el => unlockField(el));
                    if (slot.deleteBtn) { slot.deleteBtn.disabled = false; slot.deleteBtn.style.display = ''; }
                } else {
                    if (slot.deleteBtn) { slot.deleteBtn.disabled = !slot.locked; slot.deleteBtn.style.display = slot.locked ? '' : 'none'; }
                }
            });

        } else if (current === 'walls') {
            if (ui.addWallBtn) ui.addWallBtn.disabled = false;
            ui.walls.forEach(slot => {
                if (slot.addBtn) slot.addBtn.disabled = false;
                if (slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none') {
                    [slot.wX, slot.wY, slot.wW, slot.wH].forEach(el => unlockField(el));
                    if (slot.deleteBtn) { slot.deleteBtn.disabled = false; slot.deleteBtn.style.display = ''; }
                } else {
                    if (slot.deleteBtn) { slot.deleteBtn.disabled = !slot.locked; slot.deleteBtn.style.display = slot.locked ? '' : 'none'; }
                }
            });

        } else if (current === 'freestyle') {
            ui.editor.readOnly = false;
            [ui.bg, ui.pSprite, ui.pX, ui.pY, ui.pName, mv].forEach(el => { if (el) el.disabled = false; });
            [ui.pScale, ui.pStep, ui.pAnim, ui.pRows, ui.pCols].forEach(el => { if (el) el.disabled = false; });
            [ui.pDownRow, ui.pRightRow, ui.pLeftRow, ui.pUpRow, ui.pUpRightRow, ui.pDownRightRow, ui.pUpLeftRow, ui.pDownLeftRow, ui.pDirCols, ui.pHitboxW, ui.pHitboxH]
                .forEach(el => { if (el) el.disabled = false; });
            if (ui.addNpcBtn) ui.addNpcBtn.disabled = false;
            ui.npcs.forEach(slot => {
                if (slot.addBtn) slot.addBtn.disabled = false;
                [slot.nId, slot.nMsg, slot.nSprite, slot.nRows, slot.nCols, slot.nScale, slot.nAnim, slot.nX, slot.nY].forEach(el => { if (el) el.disabled = false; });
                if (slot.deleteBtn) { slot.deleteBtn.disabled = false; slot.deleteBtn.style.display = ''; }
            });
            if (ui.addWallBtn) ui.addWallBtn.disabled = false;
            ui.walls.forEach(slot => {
                if (slot.addBtn) slot.addBtn.disabled = false;
                [slot.wX, slot.wY, slot.wW, slot.wH].forEach(el => unlockField(el));
                if (slot.deleteBtn) { slot.deleteBtn.disabled = false; slot.deleteBtn.style.display = ''; }
            });

        }

        // Always allow NPC edits, even after confirmation
        ui.npcs.forEach(slot => {
            if (slot.addBtn) slot.addBtn.disabled = false;
            if (slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none') {
                [slot.nId, slot.nMsg, slot.nSprite, slot.nRows, slot.nCols, slot.nScale, slot.nAnim, slot.nX, slot.nY]
                    .forEach(el => unlockField(el));
                if (slot.deleteBtn) { slot.deleteBtn.disabled = false; slot.deleteBtn.style.display = ''; }
            } else {
                if (slot.deleteBtn) { slot.deleteBtn.disabled = !slot.locked; slot.deleteBtn.style.display = slot.locked ? '' : 'none'; }
            }
        });

        // Always allow Player edits, even after confirmation or code edits
        try {
            const mv = document.getElementById('movement-keys');
            [ui.pSprite, ui.pName, mv, ui.pScale, ui.pStep, ui.pAnim, ui.pRows, ui.pCols, ui.pX, ui.pY]
                .forEach(el => unlockField(el));
            [ui.pDownRow, ui.pRightRow, ui.pLeftRow, ui.pUpRow, ui.pUpRightRow, ui.pDownRightRow, ui.pUpLeftRow, ui.pDownLeftRow, ui.pDirCols, ui.pHitboxW, ui.pHitboxH]
                .forEach(el => unlockField(el));
        } catch (_) {}
    }

/*
=====================================
SECTION: Code Building and Generation
=====================================
*/

/**
 * Extract and normalize background data from UI
 * @param {Object} bg - The ui.bg object from the form
 * @param {String} name - Name for background environment
 * @returns {Object} bg - Normalized background object
 */
function bg_extract(bg, name = "custom_bg") {
  // Extraction logic related to GameBuilder panels
  const bgIsData = bg && bg.src && bg.src.startsWith('data:');
  const bgSrcVal = bgIsData
    ? `'${bg.src.replace(/'/g, "\\'")}'`
    : `path + "${bg.src}"`;

  return {
    name: `"${name}"`,
    src: bgSrcVal,
    h: parseInt(bg.h) || 0,
    w: parseInt(bg.w) || 0
  };
}

/**
 * Build background literal text/code that is ready for GameEngine
 * @param {Object} bg - Normalized background object
 * @param {String} name - Variable name for the background data
 * @returns {Object} { def: string, classEntry: string } - Background definition and class entry
 */
function bg_code(bg, name = "bgData") {

  const def = `
        const ${name} = {
            name: ${bg.name},
            src: ${bg.src},
            pixels: { height: ${bg.h}, width: ${bg.w} }
        };`;

  const classEntry = `{ class: GameEnvBackground, data: ${name} }`;

  return { def, classEntry };
}

/**
 * Extract and normalize player data from GameBuilder Panel
 * @param {Object} ui - The ui object/data from the form
 * @param {Object} p - The player object/data from the form
 * @returns {Object} p - Normalized player object
 */
function player_extract(ui, p) {
    // Extraction logic related to rows in sprite?
    const dirRowsTotal = Math.max(1, parseInt((ui.pRows?.value ?? '').trim() || '3', 10));
    const clamp = (v) => {
            const maxIndex = Math.max(0, (dirRowsTotal|0) - 1);
            return Math.max(0, Math.min(maxIndex, v|0));
    };

    // Extract keypress/movement keys
    const mvElGen = document.getElementById('movement-keys');
    const movement = (mvElGen && mvElGen.value) ? mvElGen.value : 'wasd';
    const keypress = movement === 'arrows'
        ? '{ up: 38, left: 37, down: 40, right: 39 }'
        : '{ up: 87, left: 65, down: 83, right: 68 }';

    return {
     name: (ui.pName && ui.pName.value ? ui.pName.value.trim() : 'Hero').replace(/'/g, "\\'"),
     pIsData: p && p.src && p.src.startsWith('data:'),
     pSrcVal: p.pIsData ? `'${p.src.replace(/'/g, "\\'")}'` : `path + "${p.src}"`,
     pScaleVal: parseInt(ui.pScale?.value || '5', 10),
     pStepVal: parseInt(ui.pStep?.value || '1000', 10),
     pAnimVal: parseInt(ui.pAnim?.value || '50', 10),
     initX: Math.max(0, parseInt(ui.pX?.value || '0', 10)),
     initY: Math.max(0, parseInt(ui.pY?.value || '0', 10)),
     pRowsVal: dirRowsTotal,
     pColsVal: Math.max(1, parseInt((ui.pCols?.value ?? '').trim() || '4', 10)),
     pixelsH: p.h,
     pixelsW: p.w,
     dirRowsTotal: dirRowsTotal,
     dirCols: Math.max(1, parseInt(ui.pDirCols?.value || 3, 10)),
     dRow: clamp(parseInt(ui.pDownRow?.value ?? 0)),
     dDefault: 0,
     rDefault: 1,
     lDefault: 2,
     uDefault: 3,
     rRow: clamp(parseInt(ui.pRightRow?.value ?? rDefault)),
     lRow: clamp(parseInt(ui.pLeftRow?.value ?? lDefault)),
     uRow: clamp(parseInt(ui.pUpRow?.value ?? uDefault)),
     urRow: clamp(parseInt(ui.pUpRightRow?.value ?? uRow)),
     drRow: clamp(parseInt(ui.pDownRightRow?.value ?? rRow)),
     ulRow: clamp(parseInt(ui.pUpLeftRow?.value ?? lRow)),
     dlRow: clamp(parseInt(ui.pDownLeftRow?.value ?? dRow)),
     hbW: Math.max(0, Math.min(parseFloat(ui.pHitboxW?.value || '0'), 0.9)),
     hbH: Math.max(0, Math.min(parseFloat(ui.pHitboxH?.value || '0'), 0.9)),
     keypress: keypress
    }
}

/**
 * Build player literal text/code that is ready for GameEngine
 * @param {Object} px - Normalized player object
 * @param {String} name - Variable name for the player data
 * @returns {Object} { def: string, classEntry: string } - Player definition and class entry
 */
function player_code(px, p, name = "playerData" ) {
    // Require external template generator from templates.js
    if (!(typeof window !== 'undefined' && window && window.GameTemplatesV1_1 && typeof window.GameTemplatesV1_1.playerData === 'function')) {
        console.error('GameTemplatesV1_1.playerData is required but not available; templates.js must be loaded');
        throw new Error('GameTemplatesV1_1.playerData is required');
    }

    const tpl = window.GameTemplatesV1_1.playerData({ name: px.name || 'player', p: p || {}, ui: ui, keypress: px.keypress, bg: (assets && assets.bg && assets.bg[ui.bg?.value]) || null });
    return { def: tpl, classEntry: `{ class: Player, data: ${name} }` };
}

/**
 * Extract and normalize NPC data from GameBuilder Panel slot
 * @param {Object} slot - The NPC slot object from the form
 * @param {Object} assets - The assets object containing sprites
 * @returns {Object} nx - Normalized NPC object
 */
function npc_extract(slot, assets) {
    const nId = (slot.nId && slot.nId.value ? slot.nId.value.trim() : 'NPC').replace(/'/g, "\\'");
    const nMsg = (slot.nMsg && slot.nMsg.value ? slot.nMsg.value.trim() : '').replace(/'/g, "\\'");
    const nMsgSafe = nMsg && nMsg.length ? nMsg : 'Hello!';
    const nSpriteKey = (slot.nSprite && slot.nSprite.value) ? slot.nSprite.value : 'chillguy';
    const nSprite = assets.sprites[nSpriteKey] || assets.sprites['chillguy'] || { src: '', h: 0, w: 0, rows: 1, cols: 1 };

    // If no valid sprite found, log warning
    if (!nSprite.src) {
        console.warn(`NPC sprite not found: ${nSpriteKey}, using placeholder values`);
    }

    const nX = (slot.nX && slot.nX.value) ? parseInt(slot.nX.value, 10) : 500;
    const nY = (slot.nY && slot.nY.value) ? parseInt(slot.nY.value, 10) : 300;
    const nIsData = nSprite && nSprite.src && nSprite.src.startsWith('data:');
    const nSrcVal = nIsData ? `'${(nSprite.src||'').replace(/'/g, "\\'")}'` : `path + "${nSprite.src || ''}"`;
    const nRows = Math.max(1, parseInt(slot.nRows?.value || nSprite.rows || 1, 10));
    const nCols = Math.max(1, parseInt(slot.nCols?.value || nSprite.cols || 1, 10));
    const nScale = Math.max(1, parseInt(slot.nScale?.value || 14, 10));
    const nAnim = Math.max(1, parseInt(slot.nAnim?.value || 50, 10));

    return {
        id: nId,
        greeting: nMsgSafe,
        srcVal: nSrcVal,
        scaleFactor: nScale,
        animRate: nAnim,
        initX: nX,
        initY: nY,
        pixelsH: nSprite.h || 0,
        pixelsW: nSprite.w || 0,
        rows: nRows,
        cols: nCols,
        nSprite: nSprite
    };
}

/**
 * Build NPC literal text/code that is ready for GameEngine
 * @param {Object} nx - Normalized NPC object
 * @param {Number} index - The NPC index for naming
 * @param {Boolean} includeAlert - Whether to include alert fallback in interact function
 * @returns {Object} { def: string, classEntry: string } - NPC definition and class entry
 */
function npc_code(nx, index, includeAlert = false) {
    const varName = `npcData${index}`;
    const interactFunc = includeAlert
        ? `function() {
                if (this.dialogueSystem) {
                    this.showRandomDialogue();
                } else if (this.greeting) {
                    alert(this.greeting);
                } else {
                    alert('Hello!');
                }
            }`
        : `function() { if (this.dialogueSystem) { this.showRandomDialogue(); } }`;
    // Try external templates first
    // Require external NPC template generator from templates.js
    if (!(typeof window !== 'undefined' && window && window.GameTemplatesV1_1 && typeof window.GameTemplatesV1_1.npcData === 'function')) {
        console.error('GameTemplatesV1_1.npcData is required but not available; templates.js must be loaded');
        throw new Error('GameTemplatesV1_1.npcData is required');
    }

    const tpl = window.GameTemplatesV1_1.npcData({ index: index, nId: nx.id, nMsg: nx.greeting, nSprite: nx.nSprite || { src: '', h: nx.pixelsH, w: nx.pixelsW, rows: nx.rows, cols: nx.cols }, nX: nx.initX, nY: nx.initY });
    return { def: tpl, classEntry: `{ class: Npc, data: npcData${index} }` };
}

/**
 * Extract and normalize barrier data from wall UI element or drawn shape
 * @param {Object} source - The wall object or drawn shape object
 * @param {String} type - 'wall' or 'drawn'
 * @param {Number} idx - The barrier index for naming
 * @param {Object} options - Optional parameters (visible, scaleX, scaleY)
 * @returns {Object} barrier - Normalized barrier object
 */
function barrier_extract(source, type, idx, options = {}) {
    if (type === 'wall') {
        const overlayW = options.overlayW || 900;
        const overlayH = options.overlayH || 600;
        return {
            id: `wall_${idx+1}`,
            varName: `barrierData${idx+1}`,
            x: Math.max(0, parseInt(source.wX?.value || 100, 10) / overlayW),
            y: Math.max(0, parseInt(source.wY?.value || 100, 10) / overlayH),
            width: Math.max(0, parseInt(source.wW?.value || 150, 10) / overlayW),
            height: Math.max(0, parseInt(source.wH?.value || 20, 10) / overlayH),
            visible: source.wVisible ? source.wVisible.checked : true,
            color: source.wColor?.value || '#4466ff',
            fromOverlay: false
        };
    } else if (type === 'drawn') {
        const overlayW = options.overlayW || 900;
        const overlayH = options.overlayH || 600;
        return {
            id: `dbarrier_${idx+1}`,
            varName: `dbarrier_${idx+1}`,
            x: Math.max(0, (source.x || 0) / overlayW),
            y: Math.max(0, (source.y || 0) / overlayH),
            width: Math.max(0, (source.width || 0) / overlayW),
            height: Math.max(0, (source.height || 0) / overlayH),
            visible: source.visible !== undefined ? source.visible : true,
            color: source.color || '#4466ff',
            fromOverlay: true
        };
    }
}

/**
 * Build barrier literal text/code that is ready for GameEngine
 * @param {Object} barrierData - Normalized barrier object
 * @returns {Object} { def: string, classEntry: string } - Barrier definition and class entry
 */
function barrier_code(barrierData) {
    const { varName, id, x, y, width, height, visible, color, fromOverlay } = barrierData;
    const comment = fromOverlay ? ' /* BUILDER_DEFAULT */' : '';
    const overlayPart = fromOverlay ? ',\n            fromOverlay: true' : '';
    const colorPart = color ? `,\n            color: '${color}'` : '';

    const def = `
        const ${varName} = {
            id: '${id}', x: ${x}, y: ${y}, width: ${width}, height: ${height}, visible: ${visible}${comment}${colorPart},
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 }${overlayPart}
        };`;

    const classEntry = `{ class: Barrier, data: ${varName} }`;

    return { def, classEntry };
}

/**
 * Generate a maze using recursive-backtracker DFS, render it to a canvas data URL,
 * and return barrier objects that match each wall segment.
 *
 * @param {number} canvasW - Canvas pixel width
 * @param {number} canvasH - Canvas pixel height
 * @returns {Object} { dataURL: string, barriers: Array<{x,y,width,height}> }
 */
function maze_generate(canvasW = 900, canvasH = 600) {
    // 6×4 grid: 150×150px cells, WALL=32 → barrier thickness=64px.
    //
    // WHY THIS GRID AND WALL SIZE:
    // The engine collision system (isCollision in GameObject.js) uses touch-point
    // conditions that only fire when the player STRADDLES a barrier edge — one side
    // inside, one side outside. If the player steps far enough in one frame to land
    // with BOTH edges inside the barrier, no touch point fires and velocity is not
    // zeroed → the player ghosts through or enters an undefined stuck state.
    //
    // No-tunnelling guarantee requires:
    //   barrier_thickness  >  player_width + player_x_velocity
    //   64px               >  23px          + 27px              = 50px  ✓
    //
    // Player defaults (from Character.js):
    //   width    = canvasHeight / SCALE_FACTOR  = 580 / 25 ≈ 23px
    //   xVelocity = (canvasWidth / STEP_FACTOR) * 3 = (900/100)*3 = 27px/frame
    //
    // 64px barrier is also VISUALLY thick, giving the maze a clear stone-wall look.
    // 225px cells leave 161px of open corridor (225 - 2×32 = 161px), wide enough
    // for comfortable navigation — player (23px) has 138px of clearance on each side.
    const COLS = 4;
    const ROWS = 3;
    const cellW = canvasW / COLS;   // 225px
    const cellH = canvasH / ROWS;   // ~193px
    const WALL = 32;                // half-wall thickness; barrier = WALL*2 = 64px

    const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    const walls   = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({ N: true, E: true, S: true, W: true }))
    );

    // Seeded RNG (fixed seed = 42) — same seed produces the same maze every run
    let _seed = 42;
    const _rng = () => { _seed = (_seed * 1664525 + 1013904223) & 0xffffffff; return (_seed >>> 0) / 0xffffffff; };

    // Iterative backtracker (perfect maze — exactly one path between any two cells)
    const stack = [[0, 0]];
    visited[0][0] = true;
    const DIRS = [
        { dr: -1, dc: 0, to: 'N', from: 'S' },
        { dr:  0, dc: 1, to: 'E', from: 'W' },
        { dr:  1, dc: 0, to: 'S', from: 'N' },
        { dr:  0, dc:-1, to: 'W', from: 'E' },
    ];
    while (stack.length) {
        const [r, c] = stack[stack.length - 1];
        const unvisited = DIRS
            .map(d => ({ ...d, nr: r + d.dr, nc: c + d.dc }))
            .filter(d => d.nr >= 0 && d.nr < ROWS && d.nc >= 0 && d.nc < COLS && !visited[d.nr][d.nc]);
        if (!unvisited.length) { stack.pop(); continue; }
        const { to, from, nr, nc } = unvisited[Math.floor(_rng() * unvisited.length)];
        walls[r][c][to] = false;
        walls[nr][nc][from] = false;
        visited[nr][nc] = true;
        stack.push([nr, nc]);
    }

    // --- Render maze with Catmull-Rom spline corridors ---
    // Corridors connect cell centres through each passage opening.
    // Round lineCap/lineJoin and a teal glow give smooth, organic spline-style paths.
    const oc = document.createElement('canvas');
    oc.width = canvasW; oc.height = canvasH;
    const ctx = oc.getContext('2d');

    // Stone-wall background with faint masonry grid texture
    ctx.fillStyle = '#12100f';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.strokeStyle = 'rgba(55,42,30,0.55)';
    ctx.lineWidth = 0.8;
    for (let gx = 0; gx < canvasW; gx += 32) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvasH); ctx.stroke();
    }
    for (let gy = 0; gy < canvasH; gy += 28) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvasW, gy); ctx.stroke();
    }

    // Cell-centre node positions (passage midpoints)
    const nodeX = Array.from({ length: COLS }, (_, c) => (c + 0.5) * cellW);
    const nodeY = Array.from({ length: ROWS }, (_, r) => (r + 0.5) * cellH);

    // Collect open-corridor segments: [[x0,y0],[x1,y1]]
    const corridors = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!walls[r][c].E && c + 1 < COLS)
                corridors.push([[nodeX[c], nodeY[r]], [nodeX[c + 1], nodeY[r]]]);
            if (!walls[r][c].S && r + 1 < ROWS)
                corridors.push([[nodeX[c], nodeY[r]], [nodeX[c], nodeY[r + 1]]]);
        }
    }

    // Corridor stroke width — fills each passage opening (min interior dimension)
    const COR_W = Math.min(cellW, cellH) - WALL * 2;

    // Catmull-Rom spline path helper (bezier approximation)
    function _crPath(c2, pts) {
        if (pts.length < 2) return;
        c2.moveTo(pts[0][0], pts[0][1]);
        if (pts.length === 2) { c2.lineTo(pts[1][0], pts[1][1]); return; }
        const p = [pts[0], ...pts, pts[pts.length - 1]];
        for (let i = 1; i < p.length - 2; i++) {
            const [x0,y0]=p[i-1],[x1,y1]=p[i],[x2,y2]=p[i+1],[x3,y3]=p[i+2];
            c2.bezierCurveTo(x1+(x2-x0)/6,y1+(y2-y0)/6,x2-(x3-x1)/6,y2-(y3-y1)/6,x2,y2);
        }
    }

    // Layer 1 — outer glow halo
    ctx.save();
    ctx.shadowColor = '#00e5cc'; ctx.shadowBlur = 26;
    ctx.strokeStyle = 'rgba(0,200,180,0.18)';
    ctx.lineWidth = COR_W + 20; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const seg of corridors) { ctx.beginPath(); _crPath(ctx, seg); ctx.stroke(); }
    ctx.restore();

    // Layer 2 — corridor floor (dark teal fill)
    ctx.strokeStyle = '#0b2924';
    ctx.lineWidth = COR_W; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const seg of corridors) { ctx.beginPath(); _crPath(ctx, seg); ctx.stroke(); }

    // Layer 3 — inner glow centerline (spline highlight)
    ctx.save();
    ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(0,235,185,0.55)';
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const seg of corridors) { ctx.beginPath(); _crPath(ctx, seg); ctx.stroke(); }
    ctx.restore();

    // EXIT marker — gold pulsing dot at bottom-right cell
    ctx.save();
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 22;
    ctx.fillStyle = 'rgba(255,215,0,0.85)';
    ctx.beginPath(); ctx.arc(nodeX[COLS - 1], nodeY[ROWS - 1], 14, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#000';
    ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', nodeX[COLS - 1], nodeY[ROWS - 1] + 1);
    ctx.restore();

    // START marker — green dot at top-left cell
    ctx.save();
    ctx.shadowColor = '#00FF88'; ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0,255,136,0.5)';
    ctx.beginPath(); ctx.arc(nodeX[0], nodeY[0], 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const dataURL = oc.toDataURL('image/png');

    // --- Collision barriers ---
    //
    // Design rules:
    // 1. CENTERED on each grid boundary (±WALL) so barrier blocks equally on
    //    both the approach and departure sides.
    // 2. CORNER-TRIMMED (inset WALL on perpendicular sides) so barriers at
    //    two adjacent walls never overlap at grid intersections, keeping
    //    passage corners collision-free.
    // 3. PER-CELL (one rect per wall segment) so a run of walls in one row
    //    never accidentally extends past an adjacent open passage.
    // 4. 64px THICK so barrier_width (64) > player_width+step (50), ensuring
    //    the player always straddles the barrier edge before penetrating it,
    //    which is the precondition for touch-point detection to work correctly.

    const barriers = [];
    let bIdx = 0;
    function addB(px, py, pw, ph) {
        barriers.push({
            varName: `mw${bIdx}`,
            id: `mw-${bIdx++}`,
            x: px / canvasW,
            y: py / canvasH,
            width:  pw / canvasW,
            height: ph / canvasH,
            visible: false,
        });
    }

    // NOTE: outer border barriers are intentionally omitted.
    // super.move() in Character.js already clamps the player to [0, innerWidth] x [0, innerHeight].
    // Generating border barriers at x=0 / y=0 caused AABB SAT to push the player to negative
    // coordinates (overriding the clamping), which looked like phantom invisible walls everywhere.

    // Interior south walls — centered on row boundary, trimmed left/right by WALL
    for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!walls[r][c].S) continue;
            addB(c * cellW + WALL,       // x: inset WALL from left edge
                 (r+1) * cellH - WALL,   // y: centered on boundary
                 cellW - WALL * 2,        // width: full cell minus corner trim
                 WALL * 2);              // height: WALL above + WALL below boundary
        }
    }

    // Interior east walls — centered on column boundary, trimmed top/bottom by WALL
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 1; c++) {
            if (!walls[r][c].E) continue;
            addB((c+1) * cellW - WALL,   // x: centered on boundary
                 r * cellH + WALL,        // y: inset WALL from top edge
                 WALL * 2,               // width: WALL left + WALL right of boundary
                 cellH - WALL * 2);      // height: full cell minus corner trim
        }
    }

    return { dataURL, barriers };
}

/**
 * Generate background code with defs and classes
 * @param {Object} bg - Background asset object
 * @returns {Object} { defs: array, classes: array }
 */
/* ── Maze barrier scanner ───────────────────────────────────────────────────
 * Loads Newmaze.png onto an offscreen canvas, detects wall positions by
 * finding rows/columns with high dark-pixel density, then scans each wall
 * band's centre-line for horizontal/vertical wall segments. Results are
 * cached in _mazeBarrierData after the first call.
 *
 * BARRIER_HALF = 6 px   →  barrier total = 12 px (hugs visual wall, ~46px passable corridor)
 * Player SCALE_FACTOR=20 → 30px player fits 46px corridor with 8px clearance each side
 * ─────────────────────────────────────────────────────────────────────────── */
let _mazeBarrierData = null;

function _mazeScanBarriersAsync(canvasW = 900, canvasH = 600) {
    if (_mazeBarrierData) return Promise.resolve(_mazeBarrierData);
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = '';
        img.onload = () => {
            try {
                const oc = document.createElement('canvas');
                oc.width = canvasW; oc.height = canvasH;
                const c2 = oc.getContext('2d');
                c2.drawImage(img, 0, 0, canvasW, canvasH);
                const px = c2.getImageData(0, 0, canvasW, canvasH).data;
                const W = canvasW, H = canvasH;
                const dark = (x, y) => px[(y * W + x) * 4] < 100;

                // Per-row darkness fraction
                const rowDark = new Float32Array(H);
                for (let y = 0; y < H; y++) {
                    let d = 0;
                    for (let x = 0; x < W; x++) if (dark(x, y)) d++;
                    rowDark[y] = d / W;
                }
                // Per-column darkness fraction
                const colDark = new Float32Array(W);
                for (let x = 0; x < W; x++) {
                    let d = 0;
                    for (let y = 0; y < H; y++) if (dark(x, y)) d++;
                    colDark[x] = d / H;
                }

                const THRESH = 0.025;      // min darkness fraction to count as a wall band
                const BARRIER_HALF = 6;    // barrier extends 6 px each side of wall centre (~12px total, hugs the visual wall)

                // Find centre-line y of each horizontal wall band
                const hBands = [];
                let inB = false, bs = 0;
                for (let y = 0; y <= H; y++) {
                    const w = y < H && rowDark[y] > THRESH;
                    if (w && !inB) { inB = true; bs = y; }
                    if (!w && inB) { hBands.push(Math.round((bs + y - 1) / 2)); inB = false; }
                }

                // Find centre-line x of each vertical wall band
                const vBands = [];
                inB = false; bs = 0;
                for (let x = 0; x <= W; x++) {
                    const w = x < W && colDark[x] > THRESH;
                    if (w && !inB) { inB = true; bs = x; }
                    if (!w && inB) { vBands.push(Math.round((bs + x - 1) / 2)); inB = false; }
                }

                const barriers = [];
                let bIdx = 0;
                const addB = (x1, y1, x2, y2) => {
                    x1 = Math.max(0, x1); y1 = Math.max(0, y1);
                    x2 = Math.min(W, x2); y2 = Math.min(H, y2);
                    if (x2 - x1 < 2 || y2 - y1 < 2) return;
                    barriers.push({
                        varName: `mw${bIdx}`, id: `mw-${bIdx++}`,
                        x: x1 / W, y: y1 / H,
                        width: (x2 - x1) / W, height: (y2 - y1) / H,
                        visible: false,
                    });
                };

                // Horizontal bands → scan centre row for wall runs → horizontal barriers
                for (const yCtr of hBands) {
                    let run = -1;
                    for (let x = 0; x <= W; x++) {
                        const d = x < W && dark(x, yCtr);
                        if (d && run < 0) run = x;
                        if (!d && run >= 0) { addB(run, yCtr - BARRIER_HALF, x, yCtr + BARRIER_HALF); run = -1; }
                    }
                }

                // Vertical bands → scan centre column for wall runs → vertical barriers
                for (const xCtr of vBands) {
                    let run = -1;
                    for (let y = 0; y <= H; y++) {
                        const d = y < H && dark(xCtr, y);
                        if (d && run < 0) run = y;
                        if (!d && run >= 0) { addB(xCtr - BARRIER_HALF, run, xCtr + BARRIER_HALF, y); run = -1; }
                    }
                }

                _mazeBarrierData = barriers;
            } catch (e) {
                console.warn('Maze barrier scan failed:', e);
                _mazeBarrierData = [];
            }
            resolve(_mazeBarrierData);
        };
        img.onerror = () => { _mazeBarrierData = []; resolve([]); };
        img.src = '/images/gamebuilder/Newmaze.png';
    });
}

function background_generate(bg) {
    if (!bg) return { defs: [], classes: [] };

    // Maze background — use Newmaze.png with auto-scanned pixel barriers
    if (bg.type === 'maze') {
        const canvasH = parseInt(bg.h) || 600;
        const canvasW = parseInt(bg.w) || 900;
        const mazeBg = { src: '/images/gamebuilder/Newmaze.png', h: canvasH, w: canvasW };
        const bgx = bg_extract(mazeBg, 'maze_bg');
        const bgCode = bg_code(bgx, 'mazeData');
        const defs = [bgCode.def];
        const classes = [bgCode.classEntry];
        // Include pre-scanned wall barriers (ready if _mazeScanBarriersAsync was called earlier)
        for (const b of (_mazeBarrierData || [])) {
            const bc = barrier_code(b);
            defs.push(bc.def);
            classes.push(bc.classEntry);
        }
        return { defs, classes };
    }

    const bgx = bg_extract(bg);
    const bgCode = bg_code(bgx);
    const defs = [bgCode.def];
    const classes = [bgCode.classEntry];

    return { defs, classes };
}

/**
 * Generate player code with defs and classes
 * @param {Object} ui - UI object with player controls
 * @param {Object} p - Player sprite asset object
 * @returns {Object} { defs: array, classes: array }
 */
function player_generate(ui, p) {
    if (!p) return { defs: [], classes: [] };

    const playerx = player_extract(ui, p);
    const playerCode = player_code(playerx, p);
    const defs = [playerCode.def];
    const classes = [playerCode.classEntry];

    return { defs, classes };
}

/**
 * Generate NPC code for all NPCs with defs and classes
 * @param {Array} npcs - Array of NPC slot objects
 * @param {Object} assets - Assets object containing sprites
 * @param {Boolean} includeAlert - Whether to include alert fallback in interact function
 * @returns {Object} { defs: array, classes: array }
 */
function npcs_generate(npcs, assets, includeAlert = false) {
    if (!npcs || npcs.length === 0) return { defs: [], classes: [] };
    if (!assets || !assets.sprites) {
        console.warn('npcs_generate: assets or assets.sprites is undefined');
        return { defs: [], classes: [] };
    }

    const defs = [];
    const classes = [];

    npcs.forEach((slot, idx) => {
        // Ensure slot has index property, fallback to array index + 1
        const slotIndex = slot.index !== undefined ? slot.index : (idx + 1);

        try {
            const nx = npc_extract(slot, assets);
            const npcCode = npc_code(nx, slotIndex, includeAlert);
            defs.push(npcCode.def);
            classes.push(npcCode.classEntry);
        } catch (e) {
            console.error('Error generating NPC code for slot', slotIndex, e);
        }
    });

    return { defs, classes };
}

/**
 * Generate barrier code for both wall and drawn barriers
 * @param {Array} walls - Array of wall UI elements
 * @param {Array} drawShapes - Array of drawn shapes (barriers)
 * @param {Object} options - Options for barrier generation (visible, scaleX, scaleY)
 * @returns {Object} { defs: array, classes: array }
 */
function barriers_generate(walls, drawShapes, options = {}) {
    const defs = [];
    const classes = [];
    const visible = options.visible !== undefined ? options.visible : true;
    const overlayW = options.overlayW || 900;
    const overlayH = options.overlayH || 600;

    // Process walls (manual panel entries)
    walls.forEach((w, idx) => {
        const bData = barrier_extract(w, 'wall', idx, { visible: visible, overlayW: overlayW, overlayH: overlayH });
        const barrierCode = barrier_code(bData);
        defs.push(barrierCode.def);
        classes.push(barrierCode.classEntry);
    });

    // Process drawn barriers (from Draw Collision Wall button)
    const drawnBarriers = (drawShapes || []).filter(s => s.type === 'barrier');
    drawnBarriers.forEach((b, bIdx) => {
        const bData = barrier_extract(b, 'drawn', bIdx, { overlayW: overlayW, overlayH: overlayH });
        const barrierCode = barrier_code(bData);
        defs.push(barrierCode.def);
        classes.push(barrierCode.classEntry);
    });

    return { defs, classes };
}

/**
 * Generate code for a single star placed on the draw overlay.
 * @param {Object} starData - { varName, id, x, y, width, height, overlayW, overlayH }
 * @returns {{ def: string, classEntry: string }}
 */
function star_code(starData) {
    const { varName, id, x, y, width, height, overlayW, overlayH } = starData;
    // Convert pixel overlay coords to fractional position (0–1) matching INIT_POSITION
    const fx = overlayW ? ((x + width  / 2) / overlayW).toFixed(4) : '0.5';
    const fy = overlayH ? ((y + height / 2) / overlayH).toFixed(4) : '0.5';

    const def = `
        const ${varName} = {
            id: '${id}',
            INIT_POSITION: { x: ${fx}, y: ${fy} },
            SCALE_FACTOR: 16,
            color: '#FFD700',
            zIndex: 50,
        };`;

    const classEntry = `{ class: Star, data: ${varName} }`;
    return { def, classEntry };
}

/**
 * Generate Star class entries from drawn star shapes.
 * @param {Array}  drawShapes - ui.drawShapes array (filters type === 'star')
 * @param {number} overlayW   - overlay pixel width (for coordinate conversion)
 * @param {number} overlayH   - overlay pixel height
 * @returns {{ defs: string[], classes: string[] }}
 */
function stars_generate(drawShapes, overlayW, overlayH) {
    const defs    = [];
    const classes = [];
    const starShapes = (drawShapes || []).filter(s => s.type === 'star');
    starShapes.forEach((s, idx) => {
        const varName = `starData${idx + 1}`;
        const id      = `star_${idx + 1}`;
        const { def, classEntry } = star_code({ varName, id, x: s.x, y: s.y, width: s.width || 24, height: s.height || 24, overlayW, overlayH });
        defs.push(def);
        classes.push(classEntry);
    });
    return { defs, classes };
}

/* SECTION: Game Level Template Code Generation */

/**
 * Generate builder-only code section for postMessage communication and event listeners
 * This code enables real-time sync between builder UI and running game
 * @returns {String} - Builder-only code block with BUILDER_ONLY_START/END markers
 */
function builder_code() {
    return `

        /* BUILDER_ONLY_START */
        // Post object summary to builder (debugging visibility of NPCs/walls)
        try {
            setTimeout(() => {
                try {
                    const objs = Array.isArray(gameEnv?.gameObjects) ? gameEnv.gameObjects : [];
                    const summary = objs.map(o => ({ cls: o?.constructor?.name || 'Unknown', id: o?.canvas?.id || '', z: o?.canvas?.style?.zIndex || '' }));
                    if (window && window.parent) window.parent.postMessage({ type: 'rpg:objects', summary }, '*');
                } catch (_) {}
            }, 250);
        } catch (_) {}
        // Report environment metrics (like top offset) to builder
        try {
            if (window && window.parent) {
                try {
                    const rect = (gameEnv && gameEnv.container && gameEnv.container.getBoundingClientRect) ? gameEnv.container.getBoundingClientRect() : { top: gameEnv.top || 0, left: 0 };
                    window.parent.postMessage({ type: 'rpg:env-metrics', top: rect.top, left: rect.left }, '*');
                } catch (_) {
                    try { window.parent.postMessage({ type: 'rpg:env-metrics', top: gameEnv.top, left: 0 }, '*'); } catch (__){ }
                }
            }
        } catch (_) {}
        // Listen for in-game wall visibility toggles from builder
        try {
            window.addEventListener('message', (e) => {
                if (!e || !e.data) return;
                if (e.data.type === 'rpg:toggle-walls') {
                    const show = !!e.data.visible;
                    if (Array.isArray(gameEnv?.gameObjects)) {
                        for (const obj of gameEnv.gameObjects) {
                            if (obj instanceof Barrier) {
                                obj.visible = show;
                            }
                        }
                    }
                } else if (e.data.type === 'rpg:set-drawn-barriers') {
                    const arr = Array.isArray(e.data.barriers) ? e.data.barriers : [];
                    // Track overlay barriers locally so we can remove/replace
                    window.__overlayBarriers = window.__overlayBarriers || [];
                    // Remove previous overlay barriers
                    try {
                        for (const ob of window.__overlayBarriers) {
                            if (ob && typeof ob.destroy === 'function') ob.destroy();
                        }
                    } catch (_) {}
                    window.__overlayBarriers = [];
                    // Add new overlay barriers
                    for (const bd of arr) {
                        try {
                            const data = {
                                id: bd.id,
                                x: bd.x,
                                y: bd.y,
                                width: bd.width,
                                height: bd.height,
                                visible: !!bd.visible,
                                hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
                                fromOverlay: true
                            };
                            const bobj = new Barrier(data, gameEnv);
                            gameEnv.gameObjects.push(bobj);
                            window.__overlayBarriers.push(bobj);
                        } catch (_) {}
                    }
                }
            });
        } catch (_) {}
        // Multiplayer: broadcast this player's position to partner every 50ms
        try {
            const _mpPosInterval = setInterval(() => {
                const _s = window.__mpSocket, _r = window.__mpRoom;
                if (!_s || !_r || !_s.connected) return;
                const objs = Array.isArray(gameEnv?.gameObjects) ? gameEnv.gameObjects : [];
                const player = objs.find(o => o?.constructor?.name === 'Player');
                if (!player) return;
                _s.emit('player_update', {
                    room_id: _r,
                    x: Math.round(player.position?.x || 0),
                    y: Math.round(player.position?.y || 0),
                    width: Math.round(player.width || 32),
                    height: Math.round(player.height || 32),
                });
            }, 50);
            window.__mpPosIntervals = window.__mpPosIntervals || [];
            window.__mpPosIntervals.push(_mpPosInterval);
        } catch (_) {}
        /* BUILDER_ONLY_END */`;
}

/**
 * Generate complete GameLevelCustom class template code
 * Composes imports, class structure, entity definitions, and class array
 * @param {Array} defs - Array of entity data definitions (bgData, playerData, npcData, etc.)
 * @param {Array} classes - Array of class entry strings for this.classes array
 * @returns {String} - Complete game level class code ready for execution
 */
function gamelevel_code(defs = [], classes = []) {
/* Do not change formattting
 * This organization illustrates the look of intended output
 * Literals are defined at left edge to comply with Code Generation .
*/
const importsSection = `
import GameEnvBackground from '/assets/js/GameEnginev1.2/essentials/GameEnvBackground.js';
import Player from '/assets/js/GameEnginev1.2/essentials/Player.js';
import Npc from '/assets/js/GameEnginev1.2/essentials/Npc.js';
import Barrier from '/assets/js/GameEnginev1.2/essentials/Barrier.js';
`; // end of importSection

const gameLevelStart = `
class GameLevelCustom {
    constructor(gameEnv) {
        const path = gameEnv.path;
        const width = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;`
 ; // end of GameLevelStart

    // Format definitions: each def starts with \n, join with \n for blank lines between
    const defsSection = defs.length > 0
        ? '\n' + defs.join('\n')
        : '\n\n        // Definitions will be added here per step';

    const classesArray = classes.length > 0
        ? `\n

        this.classes = [
            ${classes.join(',\n            ')}
        ];`
        : `

        this.classes = [
            // Step 1: add GameEnvBackground
            // Step 2: add Player
            // Step 3: add Npc
        ];`;

    const builderSection = builder_code();

    const gameLevelEnd = `
    }
}

export const gameLevelClasses = [GameLevelCustom];`
; // end of gameLevelEnd

// Actual formatting of code returned here
return importsSection + gameLevelStart + defsSection + classesArray + builderSection + gameLevelEnd;
}

/**
 * Generate baseline/empty game level template
 * Used when no entities have been configured yet
 * @returns {String} - Baseline template with placeholder comments
 */
function base_generate() {
    // Empty lists returns placeholder code
    return gamelevel_code([], []);
}

/**
 * Generate game level code based on what's currently configured in UI
 * This compositional approach generates code for ALL configured elements,
 * regardless of workflow step, avoiding false dependencies between entities
 * @param {String} currentStep - Current workflow step ('background', 'player', or 'freestyle')
 * @returns {String} - Complete game level code for all configured elements
 */
function step_generate(currentStep = 'background') {
    // Safe logic does not use currentStep, but
    //   checks what's actually configured in the UI
    const hasBackground = !!ui.bg.value; // The !! forces boolean result vs assignment
    const hasPlayer = !!ui.pSprite.value;
    const hasNPCs = ui.npcs && ui.npcs.length > 0;
    const hasWalls = (ui.walls && ui.walls.length > 0) ||
                     (ui.drawShapes && ui.drawShapes.some(s => s.type === 'barrier'));
    const hasStars = ui.drawShapes && ui.drawShapes.some(s => s.type === 'star');

    // Generate code for ALL configured elements (compositional approach)
    // Button controls should determine when it's appropriate to call this function
    const defs = [];
    const classes = [];

    // Add background code if configured
    if (hasBackground) {
        const bg = assets.bg[ui.bg.value];
        const bgGen = background_generate(bg);
        defs.push(...bgGen.defs);
        classes.push(...bgGen.classes);
    }

    // Add player code if configured
    if (hasPlayer) {
        const p = assets.sprites[ui.pSprite.value];
        const playerGen = player_generate(ui, p);
        defs.push(...playerGen.defs);
        classes.push(...playerGen.classes);
    }

    // Add NPCs code if configured
    if (hasNPCs) {
        const npcsGen = npcs_generate(ui.npcs.slice(), assets, false);
        defs.push(...npcsGen.defs);
        classes.push(...npcsGen.classes);
    }

    // Add barriers/walls code if configured
    if (hasWalls) {
        const _or = ui.drawOverlay?.getBoundingClientRect() || {};
        const barriersGen = barriers_generate(ui.walls.slice(), ui.drawShapes, { visible: true, overlayW: _or.width || 900, overlayH: _or.height || 600 });
        defs.push(...barriersGen.defs);
        classes.push(...barriersGen.classes);
    }

    // Add stars if placed
    if (hasStars) {
        const overlayRect = ui.drawOverlay ? ui.drawOverlay.getBoundingClientRect() : { width: 900, height: 600 };
        const starsGen = stars_generate(ui.drawShapes, overlayRect.width || 900, overlayRect.height || 600);
        defs.push(...starsGen.defs);
        classes.push(...starsGen.classes);
    }

    // If nothing configured, return baseline template
    if (defs.length === 0) {
        return base_generate();
    }

    // Builds Level Code using composition of defs and classes
    let levelCode = gamelevel_code(defs, classes);

    // Prepend Star import if stars were added (not already present in template imports)
    if (hasStars && !/import\s+Star\s+from/.test(levelCode)) {
        levelCode = `import Star from '/assets/js/GameEnginev1.2/Star.js';\n` + levelCode;
    }

    return levelCode;
}

/**
 * Wrapper for legacy generateBaselineCode calls
 * @returns {String} - Baseline game level template
 */
function generateBaselineCode() {
    return base_generate();
}

/**
 * Wrapper for legacy generateStepCode calls
 * @param {String} currentStep - Current workflow step
 * @returns {String|null} - Generated code for step or null
 */
function generateStepCode(currentStep) {
    return step_generate(currentStep);
}


/* SECTION: Code Editor Diff and Highlight Overlay Management */

    /**
     * Compute the range of lines that changed between two code strings
     * Used to determine which lines to highlight during typing animations
     * @param {String} oldCode - The original code before changes
     * @param {String} newCode - The new code after changes
     * @returns {Object} { startLine: number, lineCount: number } - Changed line range
     */
    function computeChangeRange(oldCode, newCode) {
        const oldLines = oldCode.split('\n');
        const newLines = newCode.split('\n');
        let start = 0;
        while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) start++;
        let endOld = oldLines.length - 1;
        let endNew = newLines.length - 1;
        while (endOld >= start && endNew >= start && oldLines[endOld] === newLines[endNew]) { endOld--; endNew--; }
        const lineCount = Math.max(0, endNew - start + 1);
        return { startLine: start, lineCount };
    }

    /**
     * Clear all highlight overlays from the editor
     */
    function clearOverlay() { ui.hLayer.innerHTML = ''; }

    /**
     * Render highlight overlay boxes for typing animations and persistent code blocks
     * Positions overlay boxes based on line numbers and editor scroll position
     */
    function renderOverlay() {
        clearOverlay();
        ui.hLayer.style.transform = `translateY(${-ui.editor.scrollTop}px)`;
        const addBox = (cls, start, count) => {
            if (!count || count < 1) return;
            const box = document.createElement('div');
            box.className = cls;
            box.style.top = (start * LINE_HEIGHT) + 'px';
            box.style.height = (count * LINE_HEIGHT) + 'px';
            ui.hLayer.appendChild(box);
        };
        if (state.typing) addBox('typing-highlight', state.typing.startLine, state.typing.lineCount);
        if (state.persistent) addBox('highlight-persistent-block', state.persistent.startLine, state.persistent.lineCount);
    }

    ui.editor.addEventListener('scroll', renderOverlay);
    ui.editor.addEventListener('input', () => {
        if (!state.programmaticEdit) {
            state.userEdited = true;
            // Do NOT light the asset builder confirm button on code edits
            // Light up only the code run buttons to indicate runnable changes
            if (ui.codePlayBtn) ui.codePlayBtn.classList.add('staged');
            const topRunBtn = document.getElementById('btn-run');
            if (topRunBtn) topRunBtn.classList.add('staged');
            // Keep UI controls in sync when user edits code directly
            try { syncControlsFromEditor(); } catch (_) {}
            // Switch builder to Freestyle so all controls stay editable
            try {
                const fi = steps.indexOf('freestyle');
                if (fi !== -1) { stepIndex = fi; setIndicator(); updateStepUI(); }
            } catch (_) {}
        }
    });

    /**
     * Synchronize code generation from UI controls when in freestyle mode
     * Stages changes for confirmation rather than applying immediately
     * Detects which entity type was last edited and generates appropriate code
     */
    function syncFromControlsIfFreestyle() {
        if (typeof _restoringLevel !== 'undefined' && _restoringLevel) return;
        const current = steps[stepIndex];
        // Always stage builder changes, even after manual code edits
        const hasNPCs = ui.npcs.length > 0;
        const hasWalls = (ui.walls.length > 0) || (ui.drawShapes && ui.drawShapes.some(s => s.type === 'barrier'));
        const hasPlayer = !!ui.pSprite.value;
        const hasBackground = !!ui.bg.value;
        let stepToCompose;
        if (current === 'freestyle' && state.lastEdited) {
            stepToCompose = state.lastEdited;
        } else {
            stepToCompose = hasWalls ? 'walls' : (hasNPCs ? 'npc' : (hasPlayer ? 'player' : (hasBackground ? 'background' : null)));
        }
        const oldCode = ui.editor.value;
        let composed = null;
        let composedStep = stepToCompose;
        if (stepToCompose === 'npc') {
            const ins = buildNpcInsertText();
            composed = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
        } else if (stepToCompose === 'walls') {
            const ins = buildBarrierInsertText();
            composed = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
        } else {
            composed = stepToCompose ? generateStepCode(stepToCompose) : generateBaselineCode();
        }
        if (composed) {
            // Always stage, do not apply immediately (confirm-only workflow)
            stagedCode = composed;
            stagedStep = composedStep;
            const btn = document.getElementById('btn-confirm');
            if (btn) btn.classList.add('staged');
        }
    }

    /* SECTION: Two-Way Code and UI Panel Synchronization */

    /**
     * Parse code from editor and update UI controls to match (two-way sync)
     * Extracts player, background, and entity data from code and populates form fields
     * Enables users to edit code directly while keeping UI controls synchronized
     */
    function syncControlsFromEditor() {
        const code = String(ui.editor?.value || '');
        const pdMatch = /const\s+playerData\s*=\s*\{([\s\S]*?)\}\s*;/.exec(code);
        const bdMatch = /const\s+bgData\s*=\s*\{([\s\S]*?)\}\s*;/.exec(code);
        try {
            if (bdMatch) {
                const bdBlock = bdMatch[1];
                const m = /src\s*:\s*(?:path\s*\+\s*)?['"]([^'"]+)['"]/i.exec(bdBlock);
                const srcRel = m ? m[1] : null;
                if (srcRel && assets && assets.bg && ui.bg) {
                    for (const key of Object.keys(assets.bg)) {
                        if (assets.bg[key]?.src === srcRel) { ui.bg.value = key; break; }
                    }
                }
            }
        } catch (_) {}
        if (!pdMatch) return;
        const block = pdMatch[1];
        const intFrom = (re) => {
            const m = re.exec(block);
            if (!m) return null;
            const v = parseInt(m[1], 10);
            return Number.isFinite(v) ? v : null;
        };
        const floatFrom = (re) => {
            const m = re.exec(block);
            if (!m) return null;
            const v = parseFloat(m[1]);
            return Number.isFinite(v) ? v : null;
        };
        const rowFor = (dir) => intFrom(new RegExp(dir + "\\s*:\\s*\\{[\\s\\S]*?row\\s*:\\s*(\\d+)", 'i'));
        const colsFor = (dir) => intFrom(new RegExp(dir + "\\s*:\\s*\\{[\\s\\S]*?columns\\s*:\\s*(\\d+)", 'i'));
        const oRows = intFrom(/orientation\s*:\s*\{[\s\S]*?rows\s*:\s*(\d+)/i);
        const oCols = intFrom(/orientation\s*:\s*\{[\s\S]*?columns\s*:\s*(\d+)/i);
        if (oRows !== null && ui.pRows) ui.pRows.value = String(Math.max(1, oRows));
        if (oCols !== null && ui.pCols) ui.pCols.value = String(Math.max(1, oCols));
        const scale = intFrom(/SCALE_FACTOR\s*:\s*(\d+)/i);
        const step = intFrom(/STEP_FACTOR\s*:\s*(\d+)/i);
        const anim = intFrom(/ANIMATION_RATE\s*:\s*(\d+)/i);
        if (scale !== null && ui.pScale) ui.pScale.value = String(Math.max(1, scale));
        if (step !== null && ui.pStep) ui.pStep.value = String(Math.max(1, step));
        if (anim !== null && ui.pAnim) ui.pAnim.value = String(Math.max(1, anim));
        let dirCols = colsFor('down');
        dirCols = dirCols ?? colsFor('right');
        dirCols = dirCols ?? colsFor('left');
        dirCols = dirCols ?? colsFor('up');
        if (dirCols !== null && ui.pDirCols) ui.pDirCols.value = String(Math.max(1, dirCols));
        const clampToRows = (v) => {
            const rows = Math.max(1, parseInt(ui.pRows?.value || '1', 10));
            const maxIndex = Math.max(0, rows - 1);
            return Math.max(0, Math.min(maxIndex, v|0));
        };
        const downRow = rowFor('down');
        const rightRow = rowFor('right');
        const leftRow = rowFor('left');
        const upRow = rowFor('up');
        const upRightRow = rowFor('upRight');
        const downRightRow = rowFor('downRight');
        const upLeftRow = rowFor('upLeft');
        const downLeftRow = rowFor('downLeft');
        if (downRow !== null && ui.pDownRow) ui.pDownRow.value = String(clampToRows(downRow));
        if (rightRow !== null && ui.pRightRow) ui.pRightRow.value = String(clampToRows(rightRow));
        if (leftRow !== null && ui.pLeftRow) ui.pLeftRow.value = String(clampToRows(leftRow));
        if (upRow !== null && ui.pUpRow) ui.pUpRow.value = String(clampToRows(upRow));
        if (upRightRow !== null && ui.pUpRightRow) ui.pUpRightRow.value = String(clampToRows(upRightRow));
        if (downRightRow !== null && ui.pDownRightRow) ui.pDownRightRow.value = String(clampToRows(downRightRow));
        if (upLeftRow !== null && ui.pUpLeftRow) ui.pUpLeftRow.value = String(clampToRows(upLeftRow));
        if (downLeftRow !== null && ui.pDownLeftRow) ui.pDownLeftRow.value = String(clampToRows(downLeftRow));
        const hbW = floatFrom(/hitbox\s*:\s*\{[\s\S]*?widthPercentage\s*:\s*([0-9.]+)/i);
        const hbH = floatFrom(/hitbox\s*:\s*\{[\s\S]*?heightPercentage\s*:\s*([0-9.]+)/i);
        if (hbW !== null && ui.pHitboxW) ui.pHitboxW.value = String(Math.max(0, Math.min(hbW, 0.9)));
        if (hbH !== null && ui.pHitboxH) ui.pHitboxH.value = String(Math.max(0, Math.min(hbH, 0.9)));
        const posMatch = /INIT_POSITION\s*:\s*\{[\s\S]*?x\s*:\s*(\d+)\s*,\s*y\s*:\s*(\d+)/i.exec(block);
        if (posMatch) {
            const x = parseInt(posMatch[1], 10);
            const y = parseInt(posMatch[2], 10);
            if (ui.pX && Number.isFinite(x)) ui.pX.value = String(Math.max(0, x));
            if (ui.pY && Number.isFinite(y)) ui.pY.value = String(Math.max(0, y));
        }
        try {
            const mvSel = document.getElementById('movement-keys');
            const kpMatch = /keypress\s*:\s*\{[\s\S]*?up\s*:\s*(\d+)/i.exec(block);
            if (mvSel && kpMatch) {
                const upCode = parseInt(kpMatch[1], 10);
                mvSel.value = (upCode === 38) ? 'arrows' : 'wasd';
            }
        } catch (_) {}
        // Player src and name -> UI selects
        try {
            const srcMatch = /src\s*:\s*(?:path\s*\+\s*)?['"]([^'"]+)['"]/i.exec(block);
            const idMatch = /id\s*:\s*['"]([^'"]+)['"]/i.exec(block);
            const srcRel = srcMatch ? srcMatch[1] : null;
            if (srcRel && assets && assets.sprites && ui.pSprite) {
                for (const key of Object.keys(assets.sprites)) {
                    if (assets.sprites[key]?.src === srcRel) { ui.pSprite.value = key; break; }
                }
            }
            if (idMatch && ui.pName) ui.pName.value = idMatch[1];
        } catch (_) {}
    }

    /* SECTION: Code Typing Animation and Visual Feedback */

    /**
     * Simulate code being typed into editor with character-by-character animation
     * Provides visual feedback when code is generated or modified by the builder
     * Highlights changed region during typing, then persists highlight when complete
     * @param {String} oldCode - The current editor code before changes
     * @param {String} newCode - The new code to type into the editor
     * @param {Function} onDone - Callback function to execute when typing animation completes
     */
    function simulateTypingChange(oldCode, newCode, onDone) {
        const { startLine, lineCount } = computeChangeRange(oldCode, newCode);
        if (!lineCount || lineCount < 1) {
            state.programmaticEdit = true;
            ui.editor.value = newCode;
            state.typing = null;
            state.persistent = null;
            renderOverlay();
            state.programmaticEdit = false;
            if (typeof onDone === 'function') onDone();
            return;
        }

        const newLines = newCode.split('\n');
        const before = newLines.slice(0, startLine).join('\n');
        const changed = newLines.slice(startLine, startLine + lineCount).join('\n');
        const after = newLines.slice(startLine + lineCount).join('\n');

        const join3 = (a, b, c) => {
            const s1 = a ? a + (b ? '\n' : (c ? '\n' : '')) : '';
            const s2 = b ? b + (c ? '\n' : '') : '';
            const s3 = c || '';
            return s1 + s2 + s3;
        };

        const TICK_MS = 16;
        const CHARS_PER_TICK = 50;
        let idx = 0;

        state.programmaticEdit = true;
        state.typing = { startLine, lineCount: Math.max(1, lineCount) };
        renderOverlay();

        const typeStep = () => {
            const nextIdx = Math.min(changed.length, idx + CHARS_PER_TICK);
            const typedSegment = changed.slice(0, nextIdx);
            ui.editor.value = join3(before, typedSegment, after);
            renderOverlay();
            idx = nextIdx;
            if (idx < changed.length) {
                window.setTimeout(typeStep, TICK_MS);
            } else {
                ui.editor.value = newCode;
                state.typing = null;
                state.persistent = { startLine, lineCount: Math.max(1, lineCount) };
                renderOverlay();
                state.programmaticEdit = false;
                if (typeof onDone === 'function') onDone();
            }
        };

        // Initialize the editor with the unchanged prefix and empty typed region
        ui.editor.value = join3(before, '', after);
        window.setTimeout(typeStep, TICK_MS);
    }

    /* SECTION: Entity Code Generation for Confirm Workflow */

    /**
     * Build NPC definition code and class entries for insertion into existing code
     * Used by confirm workflow to merge NPC entities into the editor
     * @returns {Object} { defs: string, classes: array } - NPC definitions and class entries
     */
    function buildNpcInsertText() {
        const includedSlots = ui.npcs.slice();
        if (!includedSlots.length) return { defs: '', classes: [] };
        const generated = npcs_generate(includedSlots, assets, false);
        return { defs: generated.defs.join('\n'), classes: generated.classes };
    }

    /**
     * Build barrier/wall definition code and class entries for insertion
     * Includes both manually placed walls and drawn collision barriers
     * @returns {Object} { defs: string, classes: array } - Barrier definitions and class entries
     */
    function buildBarrierInsertText() {
        const _or = ui.drawOverlay?.getBoundingClientRect() || {};
        const generated = barriers_generate(ui.walls, ui.drawShapes, { visible: true, overlayW: _or.width || 900, overlayH: _or.height || 600 });
        return { defs: generated.defs.join('\n'), classes: generated.classes };
    }

    /**
     * Build background definition code and class entry for insertion
     * @returns {Object} { defs: string, classes: array } - Background definition and class entry
     */
    function buildBackgroundInsertText() {
        const bg = assets.bg[ui.bg.value];
        if (!bg) return { defs: '', classes: [] };
        const generated = background_generate(bg);
        return { defs: generated.defs.join('\n'), classes: generated.classes };
    }

    /**
     * Build player and background definition code for insertion
     * Combines both background and player since player requires background context
     * @returns {Object} { defs: string, classes: array } - Combined definitions and class entries
     */
    function buildPlayerInsertText() {
        const bg = assets.bg[ui.bg.value];
        const p = assets.sprites[ui.pSprite.value];
        if (!bg || !p) return { defs: '', classes: [] };

        const bgGen = background_generate(bg);
        const playerGen = player_generate(ui, p);
        const defs = [...bgGen.defs, ...playerGen.defs].join('\n');
        const classes = [...bgGen.classes, ...playerGen.classes];
        return { defs, classes };
    }

    /* SECTION: Code Merge and Class Array Management */

    /**
     * Merge new entity definitions and class entries into existing editor code
     * Intelligently removes old definitions before inserting new ones to avoid duplicates
     * Updates constructor definitions and this.classes array while preserving other code
     * @param {String} oldCode - The current editor code
     * @param {String} insertDefs - New entity definitions to insert (e.g., const npcData1 = {...})
     * @param {Array} insertClasses - New class entries to add to this.classes array
     * @returns {String} - Merged code with new definitions and updated class array
     */
    function mergeDefsAndClasses(oldCode, insertDefs, insertClasses) {
        let code = oldCode;
        try {
            const exportRe = /export\s+const\s+gameLevelClasses\s*=\s*\[GameLevelCustom\];/;
            const m = exportRe.exec(code);
            if (m) {
                code = code.slice(0, m.index + m[0].length);
            }
        } catch (_) {}

        try {
            const scan = insertDefs || '';
            const npcDefs = [];
            let mm;
            const npcRe = /\bconst\s+(npcData\d+)\s*=\s*\{/g;
            while ((mm = npcRe.exec(scan)) !== null) npcDefs.push(mm[1]);
            npcDefs.forEach(vn => {
                const blockRe = new RegExp("\\n\\s*const\\s+" + vn + "\\s*=\\s*\\{[\\s\\S]*?\\};\\s*", 'g');
                code = code.replace(blockRe, '\n');
            });

            const barrierDefs = [];
            let bm;
            const bRe = /\bconst\s+(barrierData\d+)\s*=\s*\{/g;
            while ((bm = bRe.exec(scan)) !== null) barrierDefs.push(bm[1]);
            barrierDefs.forEach(vn => {
                const blockRe = new RegExp("\\n\\s*const\\s+" + vn + "\\s*=\\s*\\{[\\s\\S]*?\\};\\s*", 'g');
                code = code.replace(blockRe, '\n');
            });

            const dbarrierDefs = [];
            let dm;
            const dRe = /\bconst\s+(dbarrier_\d+)\s*=\s*\{/g;
            while ((dm = dRe.exec(scan)) !== null) dbarrierDefs.push(dm[1]);
            dbarrierDefs.forEach(vn => {
                const blockRe = new RegExp("\\n\\s*const\\s+" + vn + "\\s*=\\s*\\{[\\s\\S]*?\\};\\s*", 'g');
                code = code.replace(blockRe, '\n');
            });

            const willInsertBg = /\bconst\s+bgData\s*=\s*\{/.test(scan);
            const willInsertPlayer = /\bconst\s+playerData\s*=\s*\{/.test(scan);
            if (willInsertBg) {
                code = code.replace(/\n\s*const\s+bgData\s*=\s*\{[\s\S]*?\};\s*/g, '\n');
            }
            if (willInsertPlayer) {
                code = code.replace(/\n\s*const\s+playerData\s*=\s*\{[\s\S]*?\};\s*/g, '\n');
            }
        } catch (_) {}

        const ctorRe = /(class\s+GameLevelCustom[\s\S]*?constructor\s*\(gameEnv\)\s*\{[\s\S]*?)(this\.classes\s*=\s*\[)/;
        code = code.replace(ctorRe, (m, p1, p2) => p1 + (insertDefs || '') + '\n' + p2);

        const classesRe = /(this\.classes\s*=\s*\[)([\s\S]*?)(\]\s*;)/;
        code = code.replace(classesRe, (m, p1, inner, p3) => {
            const toClean = s => s.replace(/,\s*$/, '').trim();
            const existingLines = inner.split('\n').map(l => toClean(l)).filter(l => l.length);
            const existingSet = new Set(existingLines);
            const newLines = (insertClasses || []).map(l => toClean(l));
            const combined = [...existingLines];
            for (const nl of newLines) {
                if (!existingSet.has(nl)) {
                    combined.push(nl);
                    existingSet.add(nl);
                }
            }
            if (!combined.length) return p1 + p3;
            const rebuilt = combined.map(l => '      ' + l).join(',\n');
            return p1 + rebuilt + '\n' + p3;
        });
        return code;
    }

    /* SECTION: Player Control Event Handlers and Live Code Updates */

    const mvEl = document.getElementById('movement-keys');

    /**
     * Trigger code regeneration from controls if in freestyle mode
     */
    const rerunPlayer = () => { syncFromControlsIfFreestyle(); };

    /**
     * Apply player UI control changes directly to code without full regeneration
     * Used for slider controls (scale, step, animation) to provide immediate feedback
     * Performs in-place code replacement for numeric values and position updates
     */
    function applyPlayerUIToCodeImmediate() {
        try {
            let code = String(ui.editor?.value || '');
            const pdBlockRe = /const\s+playerData\s*=\s*\{[\s\S]*?\};/i;
            if (!pdBlockRe.test(code)) { rerunPlayer(); return; }
            const numSet = (label, val) => {
                if (val === null || val === undefined) return;
                const v = parseInt(String(val), 10);
                if (!Number.isFinite(v)) return;
                const re = new RegExp(`(${label}\\s*:\\s*)(\\d+)`, 'i');
                code = code.replace(re, `$1${v}`);
            };
            numSet('SCALE_FACTOR', ui.bg?.value === 'maze' ? '20' : ui.pScale?.value);
            numSet('STEP_FACTOR', ui.pStep?.value);
            numSet('ANIMATION_RATE', ui.pAnim?.value);

            // INIT_POSITION x,y
            try {
                const x = parseInt(ui.pX?.value || '', 10);
                const y = parseInt(ui.pY?.value || '', 10);
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    code = code.replace(/(INIT_POSITION\s*:\s*\{[\s\S]*?x\s*:\s*)(\d+)([\s\S]*?y\s*:\s*)(\d+)/i, `$1${Math.max(0,x)}$3${Math.max(0,y)}`);
                }
            } catch (_) {}

            // Movement keys mapping
            try {
                const mvSel = document.getElementById('movement-keys');
                const useArrows = mvSel && mvSel.value === 'arrows';
                const kpText = useArrows
                    ? '{ up: 38, left: 37, down: 40, right: 39 }'
                    : '{ up: 87, left: 65, down: 83, right: 68 }';
                code = code.replace(/(keypress\s*:\s*)\{[\s\S]*?\}/i, `$1${kpText}`);
            } catch (_) {}

            // Write and run
            state.programmaticEdit = true;
            ui.editor.value = code;
            state.programmaticEdit = false;
            renderOverlay();
            runInRunner();
        } catch (_) {
            // Fallback to existing path
            rerunPlayer();
        }
    }
    /**
     * Update player position in code when X/Y input fields change
     * Marks player as last edited entity for correct code generation
     */
    function updatePlayerPositionInEditor() {
        state.lastEdited = 'player';
        rerunPlayer();
    }

    // Background change event handler
    if (ui.bg) ui.bg.addEventListener('change', () => { if (_restoringLevel) return; state.lastEdited = 'background'; rerunPlayer(); });
    if (ui.pSprite) ui.pSprite.addEventListener('change', () => {
        if (_restoringLevel) return;
        try {
            const key = ui.pSprite.value;
            const spr = assets && assets.sprites ? assets.sprites[key] : null;
            if (spr) {
                if (ui.pRows) ui.pRows.value = spr.rows ?? 1;
                if (ui.pCols) ui.pCols.value = spr.cols ?? 1;
                const rows = Math.max(1, parseInt(ui.pRows?.value || spr.rows || 1, 10));
                const clamp = (v) => Math.max(0, Math.min(rows - 1, v));
                if (ui.pDownRow) ui.pDownRow.value = clamp(0);
                if (ui.pRightRow) ui.pRightRow.value = clamp(1);
                if (ui.pLeftRow) ui.pLeftRow.value = clamp(2);
                if (ui.pUpRow) ui.pUpRow.value = clamp(3);
                if (ui.pUpRightRow) ui.pUpRightRow.value = clamp(3);
                if (ui.pDownRightRow) ui.pDownRightRow.value = clamp(1);
                if (ui.pUpLeftRow) ui.pUpLeftRow.value = clamp(2);
                if (ui.pDownLeftRow) ui.pDownLeftRow.value = clamp(0);
                if (ui.pDirCols) ui.pDirCols.value = Math.max(1, Math.min(3, spr.cols ?? 1));
            }
        } finally {
            state.lastEdited = 'player';
            rerunPlayer();
        }
    });
    if (ui.pX) ui.pX.addEventListener('input', updatePlayerPositionInEditor);
    if (ui.pY) ui.pY.addEventListener('input', updatePlayerPositionInEditor);
    if (ui.pName) ui.pName.addEventListener('input', () => { state.lastEdited = 'player'; rerunPlayer(); });
    if (mvEl) mvEl.addEventListener('change', () => { state.lastEdited = 'player'; rerunPlayer(); });
    if (ui.pScale) ui.pScale.addEventListener('input', () => { state.lastEdited = 'player'; applyPlayerUIToCodeImmediate(); });
    if (ui.pStep) ui.pStep.addEventListener('input', () => { state.lastEdited = 'player'; applyPlayerUIToCodeImmediate(); });
    if (ui.pAnim) ui.pAnim.addEventListener('input', () => { state.lastEdited = 'player'; applyPlayerUIToCodeImmediate(); });
    if (ui.pRows) ui.pRows.addEventListener('input', () => { state.lastEdited = 'player'; rerunPlayer(); });
    if (ui.pCols) ui.pCols.addEventListener('input', () => { state.lastEdited = 'player'; rerunPlayer(); });
    if (ui.pHitboxW) ui.pHitboxW.addEventListener('input', () => { state.lastEdited = 'player'; rerunPlayer(); });
    if (ui.pHitboxH) ui.pHitboxH.addEventListener('input', () => { state.lastEdited = 'player'; rerunPlayer(); });
    [ui.pDownRow, ui.pRightRow, ui.pLeftRow, ui.pUpRow, ui.pUpRightRow, ui.pDownRightRow, ui.pUpLeftRow, ui.pDownLeftRow, ui.pDirCols]
        .forEach(el => { if (el) el.addEventListener('input', () => { state.lastEdited = 'player'; rerunPlayer(); }); });

    ui.npcs.forEach(slot => {
        if (slot.nId) slot.nId.addEventListener('input', () => { state.lastEdited = 'npc'; syncFromControlsIfFreestyle(); });
        if (slot.nId) slot.nId.addEventListener('input', () => {
            const name = slot.nId.value.trim();
            if (name.length) {
                slot.displayName = name;
                const isVisible = slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none';
                const caret = isVisible ? ' ▾' : ' ▸';
                slot.addBtn.textContent = (slot.locked ? name : 'NPC') + caret;
            }
        });
        if (slot.nMsg) slot.nMsg.addEventListener('input', () => { state.lastEdited = 'npc'; syncFromControlsIfFreestyle(); });
        if (slot.nSprite) slot.nSprite.addEventListener('change', () => { state.lastEdited = 'npc'; syncFromControlsIfFreestyle(); });
        if (slot.nX) slot.nX.addEventListener('input', () => { state.lastEdited = 'npc'; syncFromControlsIfFreestyle(); });
        if (slot.nY) slot.nY.addEventListener('input', () => { state.lastEdited = 'npc'; syncFromControlsIfFreestyle(); });
    });

    /* SECTION: Confirm Button Handler - Apply Staged Changes with Animation */

    /**
     * Main confirm button click handler
     * Applies staged code changes to editor with typing animation
     * Locks confirmed fields and advances workflow step
     * Handles multiple scenarios:
     * - Freestyle mode with NPCs/Walls to merge
     * - User-edited code with entities to insert
     * - Step-based workflow progression
     * - Staged code from UI control changes
     */
    document.getElementById('btn-confirm').addEventListener('click', () => {
        const btn = document.getElementById('btn-confirm');
        const oldCode = ui.editor.value;
        const current = steps[stepIndex];

        try {
            const npcInsAll = buildNpcInsertText();
            const wallInsAll = buildBarrierInsertText();
            const hasNpcAll = (npcInsAll.defs && npcInsAll.defs.trim().length) || (npcInsAll.classes && npcInsAll.classes.length);
            const hasWallAll = (wallInsAll.defs && wallInsAll.defs.trim().length) || (wallInsAll.classes && wallInsAll.classes.length);
            if (hasNpcAll || hasWallAll) {
                const merged = mergeDefsAndClasses(oldCode, (npcInsAll.defs || '') + (wallInsAll.defs || ''), [...(npcInsAll.classes || []), ...(wallInsAll.classes || [])]);
                simulateTypingChange(oldCode, merged, () => {
                    ui.npcs.forEach(slot => {
                        if (slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none') {
                            slot.locked = true;
                            const name = (slot.nId && slot.nId.value ? slot.nId.value.trim() : 'NPC');
                            slot.displayName = name;
                            if (slot.addBtn) {
                                const open = slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none';
                                slot.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                slot.addBtn.classList.add('btn-confirm');
                            }
                            if (slot.deleteBtn) { slot.deleteBtn.disabled = false; slot.deleteBtn.style.display = ''; }
                        }
                    });
                    ui.walls.forEach(w => {
                        if (w.fieldsContainer && w.fieldsContainer.style.display !== 'none') {
                            w.locked = true;
                            const name = w.displayName || `Wall ${w.index}`;
                            w.displayName = name;
                            if (w.addBtn) {
                                const open = w.fieldsContainer && w.fieldsContainer.style.display !== 'none';
                                w.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                w.addBtn.classList.add('btn-confirm');
                            }
                            if (w.deleteBtn) { w.deleteBtn.disabled = false; w.deleteBtn.style.display = ''; }
                        }
                    });
                    stepIndex = steps.indexOf('freestyle');
                    setIndicator();
                    updateStepUI();
                    ui.overlayConfirmed = ui.overlayConfirmed || hasWallAll;
                    stagedCode = null; stagedStep = null;
                    runInRunner();
                    if (btn) btn.classList.remove('staged');
                });
                return;
            }
        } catch (_) {}

        if (state.userEdited) {
            const npcIns = buildNpcInsertText();
            const hasNpcIns = (npcIns.defs && npcIns.defs.trim().length) || (npcIns.classes && npcIns.classes.length);
            if (hasNpcIns) {
                const merged = mergeDefsAndClasses(oldCode, npcIns.defs, npcIns.classes);
                simulateTypingChange(oldCode, merged, () => {
                    ui.npcs.forEach(slot => {
                        if (slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none') {
                            slot.locked = true;
                            const name = (slot.nId && slot.nId.value ? slot.nId.value.trim() : 'NPC');
                            slot.displayName = name;
                            if (slot.addBtn) {
                                const open = slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none';
                                slot.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                slot.addBtn.classList.add('btn-confirm');
                            }
                            if (slot.deleteBtn) {
                                slot.deleteBtn.disabled = false;
                                slot.deleteBtn.style.display = '';
                            }
                        }
                    });
                    stepIndex = steps.indexOf('freestyle');
                    setIndicator();
                    updateStepUI();
                    runInRunner();
                    const btnDone = document.getElementById('btn-confirm');
                    if (btnDone) btnDone.classList.remove('staged');
                });
                return;
            }
            if (current === 'walls') {
                const ins = buildBarrierInsertText();
                const merged = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
                simulateTypingChange(oldCode, merged, () => {
                    ui.walls.forEach(w => {
                        if (w.fieldsContainer && w.fieldsContainer.style.display !== 'none') {
                            w.locked = true;
                            const name = w.displayName || `Wall ${w.index}`;
                            w.displayName = name;
                            if (w.addBtn) {
                                const open = w.fieldsContainer && w.fieldsContainer.style.display !== 'none';
                                w.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                w.addBtn.classList.add('btn-confirm');
                            }
                            if (w.deleteBtn) { w.deleteBtn.disabled = false; w.deleteBtn.style.display = ''; }
                        }
                    });
                    stepIndex = Math.min(stepIndex + 1, steps.length - 1);
                    setIndicator();
                    updateStepUI();
                    ui.overlayConfirmed = true;
                    runInRunner();
                    const btnDone = document.getElementById('btn-confirm');
                    if (btnDone) btnDone.classList.remove('staged');
                });
                return;
            }
            if (current === 'player' || current === 'background') {
                const ins = (current === 'player') ? buildPlayerInsertText() : buildBackgroundInsertText();
                const merged = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
                simulateTypingChange(oldCode, merged, () => {
                    stepIndex = steps.indexOf('freestyle');
                    setIndicator();
                    updateStepUI();
                    runInRunner();
                    const btnDone = document.getElementById('btn-confirm');
                    if (btnDone) btnDone.classList.remove('staged');
                });
                return;
            }
            return;
        }

        if (stagedCode) {
            const applyingStep = stagedStep || current;
            if (applyingStep === 'npc') {
                const ins = buildNpcInsertText();
                const merged = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
                simulateTypingChange(oldCode, merged, () => {
                    ui.npcs.forEach(slot => {
                        if (slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none') {
                            slot.locked = true;
                            const name = (slot.nId && slot.nId.value ? slot.nId.value.trim() : 'NPC');
                            slot.displayName = name;
                            if (slot.addBtn) {
                                const open = slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none';
                                slot.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                slot.addBtn.classList.add('btn-confirm');
                            }
                            if (slot.deleteBtn) {
                                slot.deleteBtn.disabled = false;
                                slot.deleteBtn.style.display = '';
                            }
                        }
                    });
                    stepIndex = steps.indexOf('freestyle');
                    stagedCode = null; stagedStep = null;
                    if (btn) btn.classList.remove('staged');
                    setIndicator();
                    updateStepUI();
                    runInRunner();
                });
                return;
            }
            if (applyingStep === 'walls') {
                const ins = buildBarrierInsertText();
                const merged = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
                simulateTypingChange(oldCode, merged, () => {
                    ui.walls.forEach(w => {
                        if (w.fieldsContainer && w.fieldsContainer.style.display !== 'none') {
                            w.locked = true;
                            const name = w.displayName || `Wall ${w.index}`;
                            w.displayName = name;
                            if (w.addBtn) {
                                const open = w.fieldsContainer && w.fieldsContainer.style.display !== 'none';
                                w.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                w.addBtn.classList.add('btn-confirm');
                            }
                            if (w.deleteBtn) { w.deleteBtn.disabled = false; w.deleteBtn.style.display = ''; }
                        }
                    });
                    stepIndex = Math.min(stepIndex + 1, steps.length - 1);
                    stagedCode = null; stagedStep = null;
                    if (btn) btn.classList.remove('staged');
                    setIndicator();
                    updateStepUI();
                    ui.overlayConfirmed = true;
                    runInRunner();
                });
                return;
            }
            let codeToApply = stagedCode;
            if (!codeToApply) {
                let stepToCompose;
                const current = steps[stepIndex];
                const hasNPCs = ui.npcs.length > 0;
                const hasWalls = (ui.walls.length > 0) || (ui.drawShapes && ui.drawShapes.some(s => s.type === 'barrier'));
                const hasPlayer = !!ui.pSprite.value;
                const hasBackground = !!ui.bg.value;
                if (current === 'freestyle') {
                    stepToCompose = state.lastEdited || (hasWalls ? 'walls' : (hasNPCs ? 'npc' : (hasPlayer ? 'player' : (hasBackground ? 'background' : null))));
                } else {
                    stepToCompose = current;
                }
                if (stepToCompose === 'npc') {
                    const ins = buildNpcInsertText();
                    codeToApply = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
                } else if (stepToCompose === 'walls') {
                    const ins = buildBarrierInsertText();
                    codeToApply = mergeDefsAndClasses(oldCode, ins.defs, ins.classes);
                } else {
                    codeToApply = stepToCompose ? generateStepCode(stepToCompose) : generateBaselineCode();
                }
            }
            simulateTypingChange(oldCode, codeToApply, () => {
                if (applyingStep === 'background') { lockField(ui.bg); }
                if (applyingStep === 'player') { lockField(ui.pSprite); lockField(ui.pX); lockField(ui.pY); lockField(ui.pName); lockField(document.getElementById('movement-keys')); }
                if (applyingStep === 'walls') {
                    ui.walls.forEach(w => {
                        if (w.fieldsContainer && w.fieldsContainer.style.display !== 'none') {
                            w.locked = true;
                            const name = w.displayName || `Wall ${w.index}`;
                            w.displayName = name;
                            if (w.addBtn) {
                                const open = w.fieldsContainer && w.fieldsContainer.style.display !== 'none';
                                w.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                w.addBtn.classList.add('btn-confirm');
                            }
                            if (w.deleteBtn) { w.deleteBtn.disabled = false; w.deleteBtn.style.display = ''; }
                        }
                    });
                }
                stepIndex = Math.min(stepIndex + 1, steps.length - 1);

                stagedCode = null; stagedStep = null;
                if (btn) btn.classList.remove('staged');

                setIndicator();
                updateStepUI();
                if (applyingStep === 'walls') ui.overlayConfirmed = true;
                runInRunner();
            });
            return;
        }

        const newCode = generateStepCode(current);
        if (!newCode) {
            if (current === 'background') alert('Select a Background, then Confirm Step.');
            else if (current === 'player') alert('Select a Player sprite (and optional keys), then Confirm Step.');
            else alert('Add at least one NPC, then Confirm Step.');
            return;
        }
        simulateTypingChange(oldCode, newCode, () => {
            if (current === 'background') { lockField(ui.bg); }
            if (current === 'player') { lockField(ui.pSprite); lockField(ui.pX); lockField(ui.pY); lockField(ui.pName); lockField(document.getElementById('movement-keys')); }
            if (current === 'npc') {
                ui.npcs.forEach(slot => {
                    if (slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none') {
                        slot.locked = true;
                        const name = (slot.nId && slot.nId.value ? slot.nId.value.trim() : 'NPC');
                        slot.displayName = name;
                        if (slot.addBtn) {
                            const open = slot.fieldsContainer && slot.fieldsContainer.style.display !== 'none';
                            slot.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                            slot.addBtn.classList.add('btn-confirm');
                        }
                        if (slot.deleteBtn) {
                            slot.deleteBtn.disabled = false;
                            slot.deleteBtn.style.display = '';
                        }
                    }
                });

                stepIndex = steps.indexOf('freestyle');
            } else {
                if (current === 'walls') {
                    ui.walls.forEach(w => {
                        if (w.fieldsContainer && w.fieldsContainer.style.display !== 'none') {
                            w.locked = true;
                            const name = w.displayName || `Wall ${w.index}`;
                            w.displayName = name;
                            if (w.addBtn) {
                                const open = w.fieldsContainer && w.fieldsContainer.style.display !== 'none';
                                w.addBtn.textContent = name + (open ? ' ▾' : ' ▸');
                                w.addBtn.classList.add('btn-confirm');
                            }
                            if (w.deleteBtn) { w.deleteBtn.disabled = false; w.deleteBtn.style.display = ''; }
                        }
                    });
                }
                stepIndex = Math.min(stepIndex + 1, steps.length - 1);
            }
            setIndicator();
            updateStepUI();
            if (current === 'walls') ui.overlayConfirmed = true;
            runInRunner();
        });
    });

    /* SECTION: Runtime */
    function safeCodeToRun() {
        // Multiplayer: if a level was received via socket, use it directly and bypass
        // all staged/editor logic so syncControlsFromEditor can't interfere.
        // Trust the host's code unconditionally — don't re-validate it here.
        if (typeof window.__mpInjectedCode === 'string' && window.__mpInjectedCode.length) {
            const code = window.__mpInjectedCode;
            window.__mpInjectedCode = null; // consume it
            return code;
        }
        const preferStaged = (typeof stagedStep !== 'undefined' && !['npc','walls'].includes(stagedStep));
        const preferred = (preferStaged && typeof stagedCode === 'string' && stagedCode.length) ? stagedCode : (ui.editor.value || '');
        const hasLevels = /export\s+const\s+gameLevelClasses/.test(preferred);
        return hasLevels ? preferred : generateBaselineCode();
    }


    let runnerGameControl = null;
    let runnerGameInstance = null;
    let runnerEscapeKeyHandler = null;
    let originalCanvasId = null;
    let originalContainerId = null;

    function stopRunner() {
        if (runnerGameControl) {
            try {
                if (runnerGameControl.destroy) {
                    runnerGameControl.destroy();
                }
            } catch (e) {
                console.warn('Error destroying game:', e);
            }
            runnerGameControl = null;
            runnerGameInstance = null;
        }

        const canvas = document.getElementById('gameCanvas') || ui.gameCanvas;
        const container = document.getElementById('gameContainer') || ui.gameContainer;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 900;
            canvas.height = 580;
        }
        if (container) {
            const canvases = container.querySelectorAll('canvas:not(#game-canvas-builder):not(#gameCanvas)');
            canvases.forEach(c => c.remove());
        }

        if (canvas && originalCanvasId !== null) {
            canvas.id = originalCanvasId;
            originalCanvasId = null;
        }
        if (container && originalContainerId !== null) {
            container.id = originalContainerId;
            originalContainerId = null;
        }

        if (runnerEscapeKeyHandler) {
            document.removeEventListener('keydown', runnerEscapeKeyHandler);
            runnerEscapeKeyHandler = null;
        }
        // Clean up multiplayer overlay and position broadcast intervals
        document.getElementById('gb-mp-remote-overlay')?.remove();
        (window.__mpPosIntervals || []).forEach(id => clearInterval(id));
        window.__mpPosIntervals = [];

        // Restore route/attack path lines (hidden during gameplay)
        if (ui.routeVisLayer) ui.routeVisLayer.classList.remove('game-running');

    }

    // Run only the current single level in the preview (used when switching tabs).
    // Does NOT combine all levels — what you see is exactly what you're editing.
    async function runCurrentLevelPreview() {
        const code = ui.editor?.value || '';
        if (!code.trim()) return;
        await _executeCode(code);
    }

    async function runInRunner() {
        // Use multi-level code when the levels system is initialised and not in multiplayer mode
        let code;
        if (typeof _generateAllLevelsCode === 'function' && !window.__mpInjectedCode) {
            code = _generateAllLevelsCode();
        } else {
            code = safeCodeToRun();
        }
        stagedCode = null; stagedStep = null;
        await _executeCode(code);
    }

    // Core runner: takes final code string, injects imports/coach, starts the game.
    // Shared by runInRunner (all levels) and runCurrentLevelPreview (single level).
    async function _executeCode(code) {
        renderOverlay();
        stopRunner();
        if (!code || !code.trim()) return;

        // Hide route/attack path lines while the game is running
        if (ui.routeVisLayer) ui.routeVisLayer.classList.add('game-running');


        const path = '{{ site.baseurl }}';
        const baseUrl = window.location.origin + path;

        // Inject Star.js import when stars have been placed in the builder
        const hasBuilderStars = ui.drawShapes && ui.drawShapes.some(s => s.type === 'star');
        if (hasBuilderStars || /\bclass\s+Star\b/.test(code)) {
            if (!/import\s+Star\s+from/.test(code)) {
                code = `import Star from '${baseUrl}/assets/js/GameEnginev1.2/Star.js';\n` + code;
            }
        }

        // Inject UESL Coach if enabled in settings
        if (typeof gbSettings !== 'undefined' && gbSettings.coach) {
            const coachImport = `import UESLCoach from '${baseUrl}/assets/js/GameEnginev1.2/UESLCoach.js';\n`;
            const chaseSpeed   = gbSettings.coachChaseSpeed  ?? 2.5;
            const patrolSpeed  = gbSettings.coachPatrolSpeed ?? 1.2;
            const maxHearts    = gbSettings.coachMaxHearts   ?? 3;
            const chaseRange   = gbSettings.coachChaseRange  ?? 300;
            // Per-character sprite sheet presets
            const coachCharPresets = {
                chillguy: `src: path + '/images/gamify/chillguy.png', SCALE_FACTOR:5, ANIMATION_RATE:50, pixels:{width:512,height:384}, orientation:{rows:3,columns:4}, down:{row:0,start:0,columns:3}, right:{row:1,start:0,columns:3}, left:{row:2,start:0,columns:3}, up:{row:0,start:0,columns:3}`,
                enderman: `src: path + '/images/gamify/enderman.png', SCALE_FACTOR:10, ANIMATION_RATE:80, pixels:{width:574,height:1504}, orientation:{rows:1,columns:1}, down:{row:0,start:0,columns:1}, right:{row:0,start:0,columns:1}, left:{row:0,start:0,columns:1}, up:{row:0,start:0,columns:1}`,
                creepa:   `src: path + '/images/gamify/creepa.png', SCALE_FACTOR:4, ANIMATION_RATE:40, pixels:{width:1600,height:1200}, orientation:{rows:1,columns:2}, down:{row:0,start:0,columns:2}, right:{row:0,start:0,columns:2}, left:{row:0,start:0,columns:2}, up:{row:0,start:0,columns:2}`,
                robot:    `src: path + '/images/gamify/robot.png', SCALE_FACTOR:10, ANIMATION_RATE:100, pixels:{width:627,height:316}, orientation:{rows:3,columns:6}, down:{row:1,start:0,columns:6}, right:{row:1,start:0,columns:6}, left:{row:1,start:0,columns:6}, up:{row:1,start:0,columns:6}`,
                mzombie:  `src: path + '/images/gamify/mzombie.png', SCALE_FACTOR:5, ANIMATION_RATE:60, pixels:{width:256,height:256}, orientation:{rows:1,columns:1}, down:{row:0,start:0,columns:1}, right:{row:0,start:0,columns:1}, left:{row:0,start:0,columns:1}, up:{row:0,start:0,columns:1}`,
            };
            const charKey     = gbSettings.coachChar ?? 'chillguy';
            const charSprite  = coachCharPresets[charKey] || coachCharPresets.chillguy;
            const coachEntry  = `{ class: UESLCoach, data: { id:'UESLCoach', ${charSprite}, INIT_POSITION:{ x: width * 0.8, y: height - (height / 5) }, hitbox:{widthPercentage:0.4,heightPercentage:0.4}, chaseRange:${chaseRange}, chaseSpeed:${chaseSpeed}, patrolSpeed:${patrolSpeed}, maxHearts:${maxHearts}, tauntInterval:4500, walkingArea:{ xMin: width * 0.3, xMax: width - 60 } } }`;
            code = coachImport + code;
            code = code.replace(/this\.classes\s*=\s*\[/, `this.classes = [\n      ${coachEntry},`);
        }

        // Inject route NPCs — inlined directly into this.classes so width/height are in scope
        const routeNpcShapes = (ui.drawShapes || []).filter(s => s.type === 'routeNpc' && s.waypoints && s.waypoints.length >= 2);
        if (routeNpcShapes.length > 0) {
            const overlayRect = ui.drawOverlay?.getBoundingClientRect() || {};
            const ow = Math.max(1, overlayRect.width  || 900);
            const oh = Math.max(1, overlayRect.height || 600);

            let routeEntries = '';
            routeNpcShapes.forEach((route, i) => {
                const npcId    = (route.id || `RouteNPC_${i + 1}`).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                const greeting = (route.greeting || 'Hello, traveler!').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                const speed    = parseFloat(route.speed) || 1.5;
                const scale    = parseInt(route.scale)   || 8;
                const spFile   = route.spriteFile || 'chillguy';
                const spW      = route.spriteW    || 512;
                const spH      = route.spriteH    || 384;
                const spRows   = route.spriteRows || 3;
                const spCols   = route.spriteCols || 4;
                const dirCols  = Math.max(1, spCols - 1); // animation columns per row
                const firstFx  = (route.waypoints[0].x / ow).toFixed(4);
                const firstFy  = (route.waypoints[0].y / oh).toFixed(4);
                const wpCode   = route.waypoints.map(pt =>
                    `{x:Math.round(width*${(pt.x/ow).toFixed(4)}),y:Math.round(height*${(pt.y/oh).toFixed(4)})}`
                ).join(',');
                routeEntries +=
`\n      { class: Npc, data: {
        id: '${npcId}', greeting: '${greeting}',
        src: path + '/images/gamify/${spFile}.png',
        SCALE_FACTOR: ${scale}, ANIMATION_RATE: 50,
        pixels: {width:${spW},height:${spH}},
        INIT_POSITION: {x:Math.round(width*${firstFx}),y:Math.round(height*${firstFy})},
        orientation: {rows:${spRows},columns:${spCols}},
        down:{row:0,start:0,columns:${dirCols}}, right:{row:Math.min(1,${spRows}-1),start:0,columns:${dirCols}},
        left:{row:Math.min(2,${spRows}-1),start:0,columns:${dirCols}}, up:{row:Math.min(3,${spRows}-1),start:0,columns:${dirCols}},
        hitbox:{widthPercentage:0.1,heightPercentage:0.2},
        waypoints:[${wpCode}], speed:${speed},
      }},`;
            });

            // Ensure Npc is imported (templates usually already have it)
            if (!/import\s+Npc\s+from/.test(code)) {
                code = `import Npc from '${baseUrl}/assets/js/GameEnginev1.2/essentials/Npc.js';\n` + code;
            }
            // Use a function replacement so any $ in routeEntries is never mis-read as a back-reference
            code = code.replace(/this\.classes\s*=\s*\[/, m => `this.classes = [${routeEntries}`);
        }

        // Inject attack NPCs — follow a drawn route and damage the player on contact
        const attackNpcShapes = (ui.drawShapes || []).filter(s => s.type === 'attackNpc' && s.waypoints && s.waypoints.length >= 2);
        if (attackNpcShapes.length > 0) {
            const overlayRect2 = ui.drawOverlay?.getBoundingClientRect() || {};
            const ow2 = Math.max(1, overlayRect2.width  || 900);
            const oh2 = Math.max(1, overlayRect2.height || 600);

            // maxHearts: global setting overrides per-NPC value (shared heart pool)
            const firstMaxHearts = parseInt(ui.globalMaxHeartsInput?.value) || parseInt(attackNpcShapes[0].maxHearts) || 3;

            let attackEntries = '';
            attackNpcShapes.forEach((route, i) => {
                const npcId   = (route.id || `AttackNPC_${i + 1}`).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                const speed   = parseFloat(route.speed) || 2.0;
                const scale   = parseInt(route.scale)   || 14;
                const hearts  = firstMaxHearts; // same pool for all attack NPCs
                const spFile  = route.spriteFile || 'sword';
                const spW     = route.spriteW    || 500;
                const spH     = route.spriteH    || 500;
                const spRows  = route.spriteRows || 1;
                const spCols  = route.spriteCols || 1;
                const dirCols = Math.max(1, spCols - 1);
                const firstFx = (route.waypoints[0].x / ow2).toFixed(4);
                const firstFy = (route.waypoints[0].y / oh2).toFixed(4);
                const wpCode  = route.waypoints.map(pt =>
                    `{x:Math.round(width*${(pt.x/ow2).toFixed(4)}),y:Math.round(height*${(pt.y/oh2).toFixed(4)})}`
                ).join(',');
                // For single-frame sprites (like sword) add a spin so they look dynamic
                const isSingleFrame = (spRows === 1 && spCols === 1);
                const spinProp = isSingleFrame ? `\n        down:{row:0,start:0,columns:1,spin:true}, right:{row:0,start:0,columns:1,spin:true},\n        left:{row:0,start:0,columns:1,spin:true}, up:{row:0,start:0,columns:1,spin:true},` : `\n        down:{row:0,start:0,columns:${dirCols}}, right:{row:Math.min(1,${spRows}-1),start:0,columns:${dirCols}},\n        left:{row:Math.min(2,${spRows}-1),start:0,columns:${dirCols}}, up:{row:Math.min(3,${spRows}-1),start:0,columns:${dirCols}},`;
                attackEntries +=
`\n      { class: AttackNpc, data: {
        id: '${npcId}',
        src: path + '/images/gamify/${spFile}.png',
        SCALE_FACTOR: ${scale}, ANIMATION_RATE: 50,
        pixels: {width:${spW},height:${spH}},
        INIT_POSITION: {x:Math.round(width*${firstFx}),y:Math.round(height*${firstFy})},
        orientation: {rows:${spRows},columns:${spCols}},${spinProp}
        hitbox:{widthPercentage:0.2,heightPercentage:0.2},
        waypoints:[${wpCode}], speed:${speed}, maxHearts:${hearts},
      }},`;
            });

            // Ensure AttackNpc is imported
            if (!/import\s+AttackNpc\s+from/.test(code)) {
                code = `import AttackNpc from '${baseUrl}/assets/js/GameEnginev1.2/AttackNpc.js';\n` + code;
            }
            code = code.replace(/this\.classes\s*=\s*\[/, m => `this.classes = [${attackEntries}`);
        }

        // Ensure absolute import URLs
        code = code.replace(/from\s+['"](\/?[^'\"]+)['"]/g, (match, importPath) => {
            if (importPath.startsWith('/')) return `from '${baseUrl}${importPath}'`;
            if (!importPath.startsWith('http://') && !importPath.startsWith('https://')) {
                return `from '${baseUrl}/${importPath}'`;
            }
            return match;
        });

        // Normalize element IDs for the engine
        if (ui.gameCanvas) {
            originalCanvasId = ui.gameCanvas.id;
            ui.gameCanvas.id = 'gameCanvas';
        }
        if (ui.gameContainer) {
            originalContainerId = ui.gameContainer.id;
            ui.gameContainer.id = 'gameContainer';
        }

        const GameModule = await import(baseUrl + '/assets/js/GameEnginev1.2/essentials/Game.js');
        const Game = GameModule.default || GameModule.Core || GameModule;

        // Update env dimensions based on container
        try {
            const gameFrame = document.querySelector('.game-frame');
            const containerWidth = gameFrame?.clientWidth || ui.gameContainer?.parentElement?.clientWidth || ui.gameContainer?.clientWidth || 800;
            const containerHeight = gameFrame?.clientHeight || ui.gameContainer?.parentElement?.clientHeight || 580;
            envWidth = containerWidth;
            envHeight = containerHeight;
            ui.gameCanvas.width = containerWidth;
            ui.gameCanvas.height = containerHeight;
        } catch (_) {}

        const blob = new Blob([code], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        try {
            const userModule = await import(blobUrl);
            let gameLevelClasses = null;
            if (Array.isArray(userModule.gameLevelClasses)) {
                gameLevelClasses = userModule.gameLevelClasses;
            } else if (userModule.default) {
                gameLevelClasses = [userModule.default];
            } else {
                throw new Error('Code must export gameLevelClasses');
            }

            const environment = {
                path: path,
                gameContainer: ui.gameContainer,
                gameCanvas: ui.gameCanvas,
                gameLevelClasses: gameLevelClasses,
                innerWidth: envWidth || ui.gameCanvas.width || 800,
                innerHeight: envHeight || ui.gameCanvas.height || 580,
                disablePauseMenu: true,
                pythonURI: baseUrl,
                javaURI: baseUrl,
                fetchOptions: { method: 'GET' }
            };

            runnerGameInstance = Game.main ? Game.main(environment) : Game(environment);
            runnerGameControl = runnerGameInstance?.gameControl || runnerGameInstance;
            // If in a multiplayer room, create the remote player overlay
            if (_mpRoom && _socket) {
                _createRemoteOverlay(true); // host sees guest
            }
        } catch (err) {
            console.error('[GameBuilder] Failed to load game module:', err);
            // Show error in the game viewer so guest/host knows what went wrong
            const canvas = ui.gameCanvas;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#0d1117';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 16px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚠ Game failed to load', canvas.width / 2, canvas.height / 2 - 20);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '13px monospace';
                    ctx.fillText(String(err).slice(0, 80), canvas.width / 2, canvas.height / 2 + 10);
                    if (_mpRoom) ctx.fillText('Ask the host to re-send the level via "Update Level"', canvas.width / 2, canvas.height / 2 + 36);
                }
            }
            if (_mpRoom) mpStatus('⚠ Game failed to load: ' + String(err).slice(0, 60), '#ef4444');
        } finally {
            URL.revokeObjectURL(blobUrl);
        }

        runnerEscapeKeyHandler = (e) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            if (!runnerGameControl) return;
            if (runnerGameControl.isPaused) runnerGameControl.resume?.();
            else runnerGameControl.pause?.();
        };
        document.addEventListener('keydown', runnerEscapeKeyHandler);

        try {
            if (ui.codePlayBtn) ui.codePlayBtn.classList.remove('staged');
            const topRun = document.getElementById('btn-run');
            if (topRun) topRun.classList.remove('staged');
        } catch (_) {}

        // Apply dpad position preference after the game has had time to create touch controls
        setTimeout(applyDpadPosition, 300);
    }

    // Expose runner globally so the multiplayer game_data handler can call it directly
    window.__runInRunner = runInRunner;
    window.__stopRunner  = stopRunner;

    if (ui.codePlayBtn) ui.codePlayBtn.addEventListener('click', runInRunner);
    if (ui.codeStopBtn) ui.codeStopBtn.addEventListener('click', stopRunner);
    if (ui.toggleWallsGameBtn) {
        const refreshToggleLabel = () => {
            ui.toggleWallsGameBtn.textContent = ui.gameWallsVisible ? 'Hide Walls (Game)' : 'Show Walls (Game)';
        };
        refreshToggleLabel();
        ui.toggleWallsGameBtn.addEventListener('click', () => {
            ui.gameWallsVisible = !ui.gameWallsVisible;
            refreshToggleLabel();
            updateOverlayVisibility();
            try {
                const show = ui.gameWallsVisible;
                const container = document.getElementById('gameContainer');
                const canvases = Array.from(container ? container.querySelectorAll('canvas') : []);
                canvases.forEach(c => {
                    const id = c.id || '';
                    if (/^(wall_\d|dbarrier_\d|mw-)/.test(id)) {
                        c.style.opacity = show ? '1' : '0';
                    }
                });
            } catch (_) {}
        });
    }

    /* export composed level code */
    function exportCode() {
        let code = stagedCode || safeCodeToRun();
        if (!/export\s+const\s+gameLevelClasses/.test(code)) {
            code = generateBaselineCode();
        }
        code = code.replace(/visible:\s*true\s*\/\*\s*BUILDER_DEFAULT\s*\*\//g, 'visible: false');
        // remove any builder-only diagnostics and comms blocks
        code = code.replace(/\/\*\s*BUILDER_ONLY_START\s*\*\/[\s\S]*?\/\*\s*BUILDER_ONLY_END\s*\*\//g, '');
        // fallback cleanup if markers are missing in the current editor content
        code = code.replace(/^.*window\.parent\.postMessage\([^\n]*\)\s*;?\s*$/gm, '');
        code = code.replace(/try\s*\{\s*window\.addEventListener\(\s*'message'[\s\S]*?\}\s*catch\s*\(_\)\s*\{\}\s*/g, '');
        code = code.replace(/\/\* BUILDER_HOOKS_START \*\/[\s\S]*?\/\* BUILDER_HOOKS_END \*\//g, '');
        code = code.replace(/import\s+GameControl\s+from\s+[^\n]+\n/g, '');
        code = code.replace(/export\s*\{\s*GameControl\s*\};?/g, '');
        // Prompt for level name and convert to PascalCase
        const rawName = (typeof window !== 'undefined' && window.prompt)
            ? (window.prompt('Name your game level (e.g., Shark):', ui.pName?.value || '') || '')
            : (ui.pName?.value || '');
        const pascal = (s) => {
            const parts = String(s || '').trim().split(/[^a-zA-Z0-9]+/).filter(Boolean);
            const capped = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
            const joined = capped.join('');
            return joined.length ? joined : 'Custom';
        };
        const levelSuffix = pascal(rawName);
        const newClassName = `GameLevel${levelSuffix}`;

        // Rename class and exports to the chosen name
        code = code.replace(/\bclass\s+GameLevelCustom\b/, `class ${newClassName}`);
        code = code.replace(/export\s+default\s+GameLevelCustom\b/g, `export default ${newClassName}`);
        code = code.replace(/export\s+const\s+gameLevelClasses\s*=\s*\[\s*GameLevelCustom\s*\];?/g, `export default ${newClassName};`);

        // Header with usage instructions reflecting chosen name
        const header = `// Adventure Game Custom Level\n// Exported from GameBuilder on ${(new Date()).toISOString()}\n// How to use this file:\n// 1) Save as assets/js/adventureGame/${newClassName}.js in your repo.\n// 2) Reference it in your runner or level selector. Examples:\n//    import GameLevelPlanets from '{{site.baseurl}}/assets/js/GameEnginev1.2/GameLevelPlanets.js';\n//    import ${newClassName} from '{{site.baseurl}}/assets/js/adventureGame/${newClassName}.js';\n//    export const gameLevelClasses = [GameLevelPlanets, ${newClassName}];\n//    // or pass it directly to your GameControl as the only level.\n// 3) Ensure images exist and paths resolve via 'path' provided by the engine.\n// 4) You can add more objects to this.classes inside the constructor.\n`;
        code = header + code;

        // Download using the chosen class name
        const blob = new Blob([code], { type: 'text/javascript;charset=utf-8' });
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `${newClassName}.js`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) exportBtn.addEventListener('click', exportCode);

    const refreshBtn = document.getElementById('btn-refresh-assets');
    if (refreshBtn) refreshBtn.addEventListener('click', () => { scanServerAssets(); });

    try { scanServerAssets(); } catch (_) {}


    ui.editor.value = generateBaselineCode();
    setIndicator();
    updateStepUI();
    renderOverlay();

    // Expose draw controls globally so onclick in HTML always works
    window._gbSetDrawMode = setDrawMode;
    window._gbClearWalls = () => { state.lastEdited = 'walls'; ui.drawShapes = []; ui.overlayConfirmed = false; renderDrawShapes(); syncFromControlsIfFreestyle(); };

    // ── Multi-Level System ────────────────────────────────────────────────────
    // Each level entry: { id, name, bg, pSprite, pX, pY, pName, pScale, pStep,
    //   pAnim, pRows, pCols, keys, dirDown, dirRight, dirLeft, dirUp, dirUpRight,
    //   dirDownRight, dirUpLeft, dirDownLeft, dirCols, hitboxW, hitboxH,
    //   npcs[], walls[], drawShapes[], overlayConfirmed, code }

    const LEVELS_STORAGE_KEY = 'gb_levels_v3';
    let _levels = [];
    let _activeLevel = 0;
    // Flag to suppress all reactive UI handlers while a level is being restored,
    // preventing mid-restore code generation with a mix of old+new values.
    let _restoringLevel = false;

    /** Capture current UI state into a plain object */
    /** Extract plain serialisable data from an NPC slot (no DOM refs) */
    function _serializeNpc(slot) {
        return {
            id:     slot.nId?.value     || '',
            msg:    slot.nMsg?.value    || '',
            sprite: slot.nSprite?.value || '',
            rows:   slot.nRows?.value   || '4',
            cols:   slot.nCols?.value   || '3',
            scale:  slot.nScale?.value  || '14',
            anim:   slot.nAnim?.value   || '50',
            x:      slot.nX?.value      || '500',
            y:      slot.nY?.value      || '300',
            fieldsOpen: slot.fieldsOpen || false,
            locked:      slot.locked      || false,
            displayName: slot.displayName || '',
        };
    }

    function _captureLevelState() {
        // Best-effort code capture: prefer staged code (unconfirmed user changes)
        // over the editor text, since syncFromControlsIfFreestyle only stages code
        // and doesn't write it to the editor until the user hits Confirm.
        // If neither exists, try generating fresh from the current UI state.
        let editorCode = ui.editor?.value || '';
        if (typeof stagedCode === 'string' && stagedCode.trim()) {
            editorCode = stagedCode;
        }
        if (!editorCode.trim()) {
            try { const fresh = step_generate(); if (fresh && fresh.trim()) editorCode = fresh; } catch(_) {}
        }
        return {
            bg: ui.bg?.value || '',
            pSprite: ui.pSprite?.value || '',
            pX: document.getElementById('player-x')?.value || '100',
            pY: document.getElementById('player-y')?.value || '300',
            pName: document.getElementById('player-name')?.value || '',
            pScale: document.getElementById('player-scale')?.value || '10',
            pStep: document.getElementById('player-step')?.value || '1000',
            pAnim: document.getElementById('player-anim')?.value || '50',
            pRows: document.getElementById('player-rows')?.value || '1',
            pCols: document.getElementById('player-cols')?.value || '1',
            keys: document.getElementById('movement-keys')?.value || '',
            dirDown: document.getElementById('player-dir-down-row')?.value || '0',
            dirRight: document.getElementById('player-dir-right-row')?.value || '1',
            dirLeft: document.getElementById('player-dir-left-row')?.value || '2',
            dirUp: document.getElementById('player-dir-up-row')?.value || '3',
            dirUpRight: document.getElementById('player-dir-upright-row')?.value || '3',
            dirDownRight: document.getElementById('player-dir-downright-row')?.value || '1',
            dirUpLeft: document.getElementById('player-dir-upleft-row')?.value || '2',
            dirDownLeft: document.getElementById('player-dir-downleft-row')?.value || '0',
            dirCols: document.getElementById('player-dir-columns')?.value || '3',
            hitboxW: document.getElementById('player-hitbox-width')?.value || '0',
            hitboxH: document.getElementById('player-hitbox-height')?.value || '0',
            // Serialize NPCs as plain data — no DOM references so levels don't share elements
            npcs: (ui.npcs || []).map(_serializeNpc),
            walls: (ui.walls || []).map(w => ({ ...w })),
            drawShapes: (ui.drawShapes || []).map(s => ({ ...s })),
            overlayConfirmed: ui.overlayConfirmed || false,
            code: editorCode,
        };
    }

    /** Restore UI from a saved level state */
    function _restoreLevelState(s) {
        if (!s) return;

        // Clear any staged code from the previous level so it can't bleed into this one
        stagedCode = null;
        stagedStep = null;

        // Block all reactive handlers while restoring so we don't get
        // code generated mid-restore with a mix of old+new values.
        _restoringLevel = true;
        try {
            // Set all UI values directly — no dispatchEvent during restore.
            // Setting .value on a <select> is enough to change its visual display.
            // All reactive listeners check _restoringLevel and bail, so no
            // code generation or cross-level contamination can happen here.
            if (ui.bg)      ui.bg.value      = s.bg      || '';
            if (ui.pSprite) ui.pSprite.value = s.pSprite || '';

            const _set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
            _set('player-x',              s.pX);
            _set('player-y',              s.pY);
            _set('player-name',           s.pName);
            _set('player-scale',          s.pScale);
            _set('player-step',           s.pStep);
            _set('player-anim',           s.pAnim);
            _set('player-rows',           s.pRows);
            _set('player-cols',           s.pCols);
            _set('movement-keys',         s.keys);
            _set('player-dir-down-row',      s.dirDown);
            _set('player-dir-right-row',     s.dirRight);
            _set('player-dir-left-row',      s.dirLeft);
            _set('player-dir-up-row',        s.dirUp);
            _set('player-dir-upright-row',   s.dirUpRight);
            _set('player-dir-downright-row', s.dirDownRight);
            _set('player-dir-upleft-row',    s.dirUpLeft);
            _set('player-dir-downleft-row',  s.dirDownLeft);
            _set('player-dir-columns',       s.dirCols);
            _set('player-hitbox-width',      s.hitboxW);
            _set('player-hitbox-height',     s.hitboxH);

            // Rebuild NPC DOM slots from serialized plain-data — no DOM refs shared.
            (ui.npcs || []).forEach(slot => { try { slot.container?.remove(); } catch(_) {} });
            ui.npcs = [];
            if (ui.npcsContainer) ui.npcsContainer.innerHTML = '';
            (s.npcs || []).forEach((nData, idx) => {
                const slot = makeNpcSlot(idx + 1);
                if (slot.nId)     slot.nId.value     = nData.id     || '';
                if (slot.nMsg)    slot.nMsg.value    = nData.msg    || '';
                if (slot.nSprite) slot.nSprite.value = nData.sprite || '';
                if (slot.nRows)   slot.nRows.value   = nData.rows   || '4';
                if (slot.nCols)   slot.nCols.value   = nData.cols   || '3';
                if (slot.nScale)  slot.nScale.value  = nData.scale  || '14';
                if (slot.nAnim)   slot.nAnim.value   = nData.anim   || '50';
                if (slot.nX)      slot.nX.value      = nData.x      || '500';
                if (slot.nY)      slot.nY.value      = nData.y      || '300';
                slot.locked      = nData.locked      || false;
                slot.displayName = nData.displayName || '';
                if (slot.fieldsContainer) slot.fieldsContainer.style.display = nData.fieldsOpen ? '' : 'none';
                slot.fieldsOpen  = nData.fieldsOpen  || false;
            });

            // Walls and drawn shapes — plain data only, no shared references
            ui.walls       = (s.walls      || []).map(w  => ({ ...w  }));
            ui.drawShapes  = (s.drawShapes || []).map(ds => ({ ...ds }));
            ui.overlayConfirmed = s.overlayConfirmed || false;

            // Redraw overlay shapes for this level
            try { renderDrawShapes?.(); } catch(_) {}

        } finally {
            _restoringLevel = false;
        }

        // Restore editor code for this level.
        // Use stored code if available; otherwise generate fresh from the just-restored UI values.
        try {
            let code = s.code || '';
            if (!code.trim()) {
                try { code = step_generate() || ''; } catch(_) {}
            }
            if (ui.editor) {
                state.programmaticEdit = true;
                ui.editor.value = code;
                state.programmaticEdit = false;
            }
        } catch(_) {}

        // Move to freestyle step so all asset changes (bg, player, NPCs, walls) are
        // accepted without the step-wizard blocking them.
        if (stepIndex < 2) {
            stepIndex = 2;
            try { updateStepUI?.(); } catch(_) {}
        }
        state.lastEdited = s.bg ? 'background' : null;
    }

    /** Persist levels to localStorage */
    function _saveLevels() {
        try { localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(_levels)); } catch(_) {}
    }

    /** Load levels from localStorage */
    function _loadLevels() {
        try {
            const raw = localStorage.getItem(LEVELS_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch(_) {}
        return null;
    }

    /** Render the tab strip */
    function _renderLevelTabs() {
        const bar = document.getElementById('level-tabs-bar');
        if (!bar) return;
        bar.innerHTML = '';
        _levels.forEach((lv, i) => {
            const tab = document.createElement('div');
            tab.className = 'level-tab' + (i === _activeLevel ? ' active' : '');
            tab.dataset.idx = i;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'level-tab-name';
            nameSpan.textContent = lv.name;
            nameSpan.title = 'Double-click to rename';
            nameSpan.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                nameSpan.contentEditable = 'true';
                nameSpan.focus();
                const range = document.createRange();
                range.selectNodeContents(nameSpan);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
            });
            nameSpan.addEventListener('blur', () => {
                nameSpan.contentEditable = 'false';
                const newName = nameSpan.textContent.trim() || lv.name;
                _levels[i].name = newName;
                nameSpan.textContent = newName;
                _saveLevels();
            });
            nameSpan.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); nameSpan.blur(); }
                if (e.key === 'Escape') { nameSpan.textContent = _levels[i].name; nameSpan.blur(); }
            });

            tab.appendChild(nameSpan);

            // Delete button (only show when more than 1 level)
            if (_levels.length > 1) {
                const del = document.createElement('button');
                del.className = 'level-tab-del';
                del.title = 'Delete level';
                del.textContent = '×';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (_levels.length <= 1) return;
                    if (!confirm(`Delete "${_levels[i].name}"?`)) return;
                    _levels.splice(i, 1);
                    if (_activeLevel >= _levels.length) _activeLevel = _levels.length - 1;
                    _restoreLevelState(_levels[_activeLevel]);
                    _saveLevels();
                    _renderLevelTabs();
                });
                tab.appendChild(del);
            }

            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('level-tab-del') ||
                    e.target.contentEditable === 'true') return;
                if (i === _activeLevel) return;
                // Save current level state before switching
                _levels[_activeLevel] = { ..._levels[_activeLevel], ..._captureLevelState() };
                _activeLevel = i;
                _restoreLevelState(_levels[_activeLevel]);
                _saveLevels();
                _renderLevelTabs();
                // Preview only this level — don't bundle all levels together,
                // otherwise Level 2's code always shows up when viewing Level 1.
                try { runCurrentLevelPreview(); } catch(_) {}
            });

            bar.appendChild(tab);
        });

        // Add new level button
        const addBtn = document.createElement('button');
        addBtn.className = 'level-tab-add';
        addBtn.textContent = '+ Level';
        addBtn.title = 'Add a new level';
        addBtn.addEventListener('click', () => {
            // Save current level state
            _levels[_activeLevel] = { ..._levels[_activeLevel], ..._captureLevelState() };
            // Create a fresh blank level
            const newIdx = _levels.length;
            _levels.push({ id: Date.now(), name: `Level ${newIdx + 1}`, bg: '', pSprite: '', pX: '100', pY: '300', pName: '', pScale: '10', pStep: '1000', pAnim: '50', pRows: '1', pCols: '1', keys: '', dirDown: '0', dirRight: '1', dirLeft: '2', dirUp: '3', dirUpRight: '3', dirDownRight: '1', dirUpLeft: '2', dirDownLeft: '0', dirCols: '3', hitboxW: '0', hitboxH: '0', npcs: [], walls: [], drawShapes: [], overlayConfirmed: false, code: '' });
            _activeLevel = newIdx;
            _restoreLevelState(_levels[_activeLevel]);
            _saveLevels();
            _renderLevelTabs();
        });
        bar.appendChild(addBtn);
    }

    /** Generate combined multi-level ES module code for all levels */
    function _generateAllLevelsCode() {
        // Save current level first
        _levels[_activeLevel] = { ..._levels[_activeLevel], ..._captureLevelState() };
        _saveLevels();

        if (_levels.length === 1) {
            // Single level — use existing code path
            return _levels[0].code || step_generate() || '';
        }

        // Multiple levels: rename GameLevelCustom → GameLevelN in each, then combine
        const importLines = new Set();
        const classBodies = [];
        const classNames = [];

        for (let i = 0; i < _levels.length; i++) {
            let code = _levels[i].code || '';
            if (!code.trim()) continue; // skip empty levels

            const className = `GameLevelCustom${i + 1}`;
            classNames.push(className);

            // Extract import lines
            const lines = code.split('\n');
            const nonImportLines = [];
            for (const line of lines) {
                if (/^\s*import\s+/.test(line)) {
                    importLines.add(line.trim());
                } else {
                    nonImportLines.push(line);
                }
            }

            // Rename class and export
            let body = nonImportLines.join('\n');
            body = body.replace(/\bclass\s+GameLevelCustom\b/g, `class ${className}`);
            body = body.replace(/export\s+const\s+gameLevelClasses\s*=\s*\[[^\]]*\];?\s*/g, '');
            classBodies.push(body.trim());
        }

        if (classNames.length === 0) return step_generate() || '';

        const combined = [...importLines].join('\n') + '\n\n'
            + classBodies.join('\n\n') + '\n\n'
            + `export const gameLevelClasses = [${classNames.join(', ')}];\n`;
        return combined;
    }

    // Expose multi-level code generator globally
    window.__generateAllLevelsCode = _generateAllLevelsCode;

    // Initialise levels: try loading from localStorage, else start with one blank level
    (function _initLevels() {
        const saved = _loadLevels();
        if (saved) {
            _levels = saved;
            _activeLevel = 0;
            _restoreLevelState(_levels[0]);
        } else {
            _levels = [{ id: Date.now(), name: 'Level 1', bg: '', pSprite: '', pX: '100', pY: '300', pName: '', pScale: '10', pStep: '1000', pAnim: '50', pRows: '1', pCols: '1', keys: '', dirDown: '0', dirRight: '1', dirLeft: '2', dirUp: '3', dirUpRight: '3', dirDownRight: '1', dirUpLeft: '2', dirDownLeft: '0', dirCols: '3', hitboxW: '0', hitboxH: '0', npcs: [], walls: [], drawShapes: [], overlayConfirmed: false, code: '' }];
            _activeLevel = 0;
        }
        _renderLevelTabs();
    })();

    // ── End Multi-Level System ────────────────────────────────────────────────

    // Expose code generator for multiplayer — generates fresh code from the current
    // builder state (background + player + NPCs + walls) rather than relying on whatever
    // is currently typed in the editor.
    window.__generateCurrentCode = function() {
        try {
            const fresh = step_generate();
            if (fresh && fresh.trim()) {
                ui.editor.value = fresh; // keep editor in sync
                return fresh;
            }
        } catch (_) {}
        return ui.editor.value || '';
    };

    // Expose level state for the save/load module
    window.__gb_getLevels  = () => _levels;
    window.__gb_loadLevels = function(data) {
        if (!Array.isArray(data) || data.length === 0) return;
        _levels = data;
        _activeLevel = 0;
        _restoreLevelState(_levels[0]);
        _saveLevels();
        _renderLevelTabs();
    };
});
</script>

<script>
window.addEventListener('keydown', function(e) {
    const keys = [32, 37, 38, 39, 40];
    if (!keys.includes(e.keyCode)) return;
    const tgt = e.target;
    const isForm = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable);
    if (!isForm) {
        e.preventDefault();
    }
}, { passive: false });

document.querySelector('.game-frame')?.addEventListener('click', () => {
    const canvas = document.getElementById('game-canvas-builder');
    try { canvas?.focus?.(); } catch (_) {}
});

// ── Settings state ──────────────────────────────────────────────────────────
const gbSettings = {
  slowMode: false, highContrast: false, largeSprites: false,
  voice: false, face: false, coach: false, coachChaseSpeed: 2.5, coachPatrolSpeed: 1.2,
};

document.getElementById('gb-slow-mode')?.addEventListener('change', e => { gbSettings.slowMode = e.target.checked; });
document.getElementById('gb-high-contrast')?.addEventListener('change', e => {
  gbSettings.highContrast = e.target.checked;
  document.body.style.filter = e.target.checked ? 'contrast(1.6) brightness(1.1)' : '';
});
document.getElementById('gb-large-sprites')?.addEventListener('change', e => { gbSettings.largeSprites = e.target.checked; });
document.getElementById('gb-dpad-right')?.addEventListener('change', e => { gbSettings.dpadRight = e.target.checked; applyDpadPosition(); });

document.getElementById('gb-voice')?.addEventListener('change', e => {
  gbSettings.voice = e.target.checked;
  if (e.target.checked) initVoice(); else stopVoice();
});
document.getElementById('gb-face')?.addEventListener('change', e => {
  gbSettings.face = e.target.checked;
  document.getElementById('gb-face-panel').style.display = e.target.checked ? 'block' : 'none';
  if (e.target.checked) initFaceTracking(); else stopFaceTracking();
});
document.getElementById('gb-coach')?.addEventListener('change', e => {
  gbSettings.coach = e.target.checked;
  document.getElementById('gb-coach-speed-panel').style.display = e.target.checked ? 'flex' : 'none';
});
document.getElementById('gb-coach-char')?.addEventListener('change', e => {
  gbSettings.coachChar = e.target.value;
});
document.getElementById('gb-coach-speed')?.addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  gbSettings.coachChaseSpeed  = v;
  gbSettings.coachPatrolSpeed = Math.max(0.3, v * 0.48);
  document.getElementById('gb-coach-speed-val').textContent = v.toFixed(1);
});
document.getElementById('gb-coach-hearts')?.addEventListener('input', e => {
  gbSettings.coachMaxHearts = parseInt(e.target.value, 10);
  document.getElementById('gb-coach-hearts-val').textContent = e.target.value;
});
document.getElementById('gb-coach-range')?.addEventListener('input', e => {
  gbSettings.coachChaseRange = parseInt(e.target.value, 10);
  document.getElementById('gb-coach-range-val').textContent = e.target.value;
});
document.getElementById('gb-recalibrate')?.addEventListener('click', () => window.FaceTracker?.recalibrate?.());

// ── Face Tracking ────────────────────────────────────────────────────────────
let _faceInterval = null;
function initFaceTracking() {
  if (!window.FaceTracker) { console.warn('FaceTracker not loaded'); return; }
  const video = document.getElementById('gb-face-video');
  const preview = document.getElementById('gb-face-preview');
  FaceTracker.start(video, preview).catch(console.error);
  _faceInterval = setInterval(() => {
    if (!gbSettings.face || !window.FaceTracker?.active) return;
    const c = FaceTracker.controls;
    // Fire both Arrow keys AND WASD keys so face tracking works regardless of player key setting
    const fire = (key, keyCode, on) => {
      const type = on ? 'keydown' : 'keyup';
      document.dispatchEvent(new KeyboardEvent(type, { key, code: key, keyCode, which: keyCode, bubbles: true, cancelable: true }));
    };
    fire('ArrowLeft',  37, !!c.left);
    fire('ArrowRight', 39, !!c.right);
    fire('ArrowUp',    38, !!c.up);
    fire('ArrowDown',  40, !!c.down);
    fire('a',          65, !!c.left);
    fire('d',          68, !!c.right);
    fire('w',          87, !!c.up);
    fire('s',          83, !!c.down);
  }, 80);
}
function stopFaceTracking() {
  clearInterval(_faceInterval); _faceInterval = null;
  window.FaceTracker?.stop?.();
}

// ── Voice Commands ───────────────────────────────────────────────────────────
let _voiceRecog = null;
let _voiceActive = false;
const WORD_NUMS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };

function parseVoiceCommand(text) {
  text = text.toLowerCase().trim();
  if (/\b(stop|halt|freeze|stay|wait)\b/.test(text)) return { dir: null, blocks: 0, stop: true };
  let dir = null;
  if (/\b(right|forward)\b/.test(text)) dir = 'ArrowRight';
  else if (/\b(left|back)\b/.test(text)) dir = 'ArrowLeft';
  else if (/\b(up|jump)\b/.test(text)) dir = 'ArrowUp';
  else if (/\b(down)\b/.test(text)) dir = 'ArrowDown';
  if (!dir) return null;
  let blocks = 1;
  const numMatch = text.match(/\b(\d+)\b/);
  if (numMatch) blocks = parseInt(numMatch[1]);
  else { for (const [w, n] of Object.entries(WORD_NUMS)) { if (text.includes(w)) { blocks = n; break; } } }
  return { dir, blocks: Math.min(blocks, 20) };
}

function showVoiceStatus(msg) {
  const el = document.getElementById('gb-voice-status');
  if (el) { el.style.display = 'block'; el.textContent = '🎤 ' + msg; }
}

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showVoiceStatus('Not supported in this browser'); return; }
  _voiceRecog = new SR();
  _voiceRecog.continuous = true;
  _voiceRecog.interimResults = false;
  _voiceRecog.lang = 'en-US';
  _voiceRecog.onstart = () => { _voiceActive = true; showVoiceStatus('Listening…'); };
  _voiceRecog.onend = () => { if (gbSettings.voice) _voiceRecog.start(); };
  _voiceRecog.onerror = e => showVoiceStatus('Error: ' + e.error);
  _voiceRecog.onresult = e => {
    const transcript = e.results[e.results.length - 1][0].transcript;
    showVoiceStatus('"' + transcript + '"');
    const cmd = parseVoiceCommand(transcript);
    if (!cmd) return;
    // Map arrow key names to both arrow keyCodes and WASD keyCodes
    const KEY_MAP = {
      ArrowLeft:  [{ key: 'ArrowLeft', keyCode: 37 }, { key: 'a', keyCode: 65 }],
      ArrowRight: [{ key: 'ArrowRight', keyCode: 39 }, { key: 'd', keyCode: 68 }],
      ArrowUp:    [{ key: 'ArrowUp', keyCode: 38 }, { key: 'w', keyCode: 87 }],
      ArrowDown:  [{ key: 'ArrowDown', keyCode: 40 }, { key: 's', keyCode: 83 }],
    };
    const fireKey = (type, keyInfo) => {
      document.dispatchEvent(new KeyboardEvent(type, { key: keyInfo.key, keyCode: keyInfo.keyCode, which: keyInfo.keyCode, bubbles: true, cancelable: true }));
    };
    if (cmd.stop) {
      Object.values(KEY_MAP).flat().forEach(k => fireKey('keyup', k));
      return;
    }
    // hold key for ~blocks * 180ms, firing both Arrow and WASD keyCodes
    const keys = KEY_MAP[cmd.dir] || [];
    keys.forEach(k => fireKey('keydown', k));
    setTimeout(() => keys.forEach(k => fireKey('keyup', k)), cmd.blocks * 180);
  };
  _voiceRecog.start();
}
function stopVoice() {
  _voiceActive = false;
  _voiceRecog?.stop(); _voiceRecog = null;
  showVoiceStatus('off');
}

// ── Multiplayer editing lock ─────────────────────────────────────────────────
function _enableMpMode() {
  document.getElementById('gb-mp-edit-banner').style.display = 'flex';
  const editor = document.getElementById('code-editor');
  if (editor) { editor.readOnly = true; editor.style.opacity = '0.45'; editor.style.pointerEvents = 'none'; }
  ['btn-code-apply', 'btn-export', 'btn-run'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = true; el.style.opacity = '0.35'; el.style.pointerEvents = 'none'; }
  });
}
function _disableMpMode() {
  document.getElementById('gb-mp-edit-banner').style.display = 'none';
  const editor = document.getElementById('code-editor');
  if (editor) { editor.readOnly = false; editor.style.opacity = ''; editor.style.pointerEvents = ''; }
  ['btn-code-apply', 'btn-export', 'btn-run'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = false; el.style.opacity = ''; el.style.pointerEvents = ''; }
  });
}

// ── Remote player overlay ────────────────────────────────────────────────────
function _createRemoteOverlay(isHost) {
  document.getElementById('gb-mp-remote-overlay')?.remove();
  // runInRunner renames the container from 'game-container-builder' to 'gameContainer'
  // before calling this function, so try both to be safe
  const gc = document.getElementById('gameContainer') || document.getElementById('game-container-builder');
  if (!gc) return;
  const overlay = document.createElement('canvas');
  overlay.id = 'gb-mp-remote-overlay';
  overlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:200;';
  overlay.width = gc.offsetWidth || 800;
  overlay.height = gc.offsetHeight || 580;
  if (getComputedStyle(gc).position === 'static') gc.style.position = 'relative';
  gc.appendChild(overlay);
  const ctx = overlay.getContext('2d');
  // Host sees the guest as "Player 2"; guest sees the host as "Host"
  const partnerLabel = isHost ? 'Player 2' : 'Host';
  function _renderLoop() {
    if (!document.getElementById('gb-mp-remote-overlay')) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const pos = window.__mpPartnerPos;
    if (pos) {
      const w = pos.width || 32, h = pos.height || 32;
      ctx.fillStyle = 'rgba(99,102,241,0.5)';
      ctx.fillRect(pos.x, pos.y, w, h);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x, pos.y, w, h);
      ctx.fillStyle = '#c4b5fd';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(partnerLabel, pos.x + w / 2, pos.y - 5);
    }
    requestAnimationFrame(_renderLoop);
  }
  _renderLoop();
}

// ── Shared backend URI (used by save/load and multiplayer) ───────────────────
const PYTHON_URI = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8424' : 'https://uesl.opencodingsociety.com';

// ── Save / Load games ────────────────────────────────────────────────────────
(function () {
  const API = PYTHON_URI + '/api/gamebuilder';

  async function apiGetUser() {
    try {
      const r = await fetch(PYTHON_URI + '/api/id', { credentials: 'include' });
      if (!r.ok) return null;
      const d = await r.json();
      return d && d.id ? d : null;
    } catch (_) { return null; }
  }

  async function apiList() {
    const r = await fetch(API, { credentials: 'include' });
    if (!r.ok) throw new Error(await apiErrorMsg(r));
    return r.json();
  }

  async function apiErrorMsg(r) {
    try { const d = await r.json(); return `HTTP ${r.status}: ${d.message || d.error || JSON.stringify(d)}`; }
    catch (_) { return `HTTP ${r.status}`; }
  }

  async function apiSave(name, data) {
    const r = await fetch(API, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data })
    });
    if (!r.ok) throw new Error(await apiErrorMsg(r));
    return r.json();
  }

  async function apiUpdate(id, name, data) {
    const r = await fetch(API + '/' + id, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data })
    });
    if (!r.ok) throw new Error(await apiErrorMsg(r));
    return r.json();
  }

  async function apiDelete(id) {
    const r = await fetch(API + '/' + id, { method: 'DELETE', credentials: 'include' });
    if (r.status !== 200 && r.status !== 204) throw new Error('Delete failed');
  }

  function saveStatus(msg, color) {
    const el = document.getElementById('gb-save-status');
    if (el) { el.textContent = msg; el.style.color = color || '#64748b'; }
  }

  function renderSavedGames(projects) {
    const list  = document.getElementById('gb-save-list');
    const empty = document.getElementById('gb-save-empty');
    if (!list) return;
    list.innerHTML = '';
    if (!projects || projects.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    projects.forEach(proj => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;background:#1a2035;border:1px solid #2d3a55;border-radius:9px;padding:9px 12px;';
      const nameEl = document.createElement('span');
      nameEl.textContent = proj.name;
      nameEl.style.cssText = 'flex:1;font-size:.88rem;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

      const dateEl = document.createElement('span');
      const d = proj.updated_at ? new Date(proj.updated_at) : null;
      dateEl.textContent = d ? d.toLocaleDateString() : '';
      dateEl.style.cssText = 'font-size:.72rem;color:#475569;white-space:nowrap;';

      const loadBtn = document.createElement('button');
      loadBtn.textContent = '↓ Load';
      loadBtn.style.cssText = 'padding:5px 10px;background:#0ea5e9;border:none;border-radius:7px;color:#fff;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;';
      loadBtn.onclick = () => loadProject(proj);

      const overBtn = document.createElement('button');
      overBtn.textContent = '⟳';
      overBtn.title = 'Overwrite with current game';
      overBtn.style.cssText = 'padding:5px 8px;background:#1e293b;border:1px solid #334155;border-radius:7px;color:#94a3b8;font-size:.78rem;cursor:pointer;';
      overBtn.onclick = () => overwriteProject(proj.id, proj.name);

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑';
      delBtn.title = 'Delete';
      delBtn.style.cssText = 'padding:5px 8px;background:none;border:1px solid #4c1d1d;border-radius:7px;color:#f87171;font-size:.78rem;cursor:pointer;';
      delBtn.onclick = () => deleteProject(proj.id);

      row.appendChild(nameEl);
      row.appendChild(dateEl);
      row.appendChild(loadBtn);
      row.appendChild(overBtn);
      row.appendChild(delBtn);
      list.appendChild(row);
    });
  }

  function getCurrentLevels() {
    return typeof window.__gb_getLevels === 'function' ? window.__gb_getLevels() : [];
  }

  function loadProject(proj) {
    if (!proj.data || !Array.isArray(proj.data) || proj.data.length === 0) {
      saveStatus('This project has no level data.', '#f87171');
      return;
    }
    if (typeof window.__gb_loadLevels === 'function') {
      window.__gb_loadLevels(proj.data);
    }
    document.getElementById('gb-save-overlay').style.display = 'none';
    saveStatus('');
  }

  async function overwriteProject(id, name) {
    try {
      await apiUpdate(id, name, getCurrentLevels());
      saveStatus('Overwritten ✓', '#4ade80');
      await refreshList();
    } catch (e) {
      saveStatus('Error: ' + e.message, '#f87171');
    }
  }

  async function deleteProject(id) {
    if (!confirm('Delete this saved game?')) return;
    try {
      await apiDelete(id);
      await refreshList();
    } catch (e) {
      saveStatus('Error: ' + e.message, '#f87171');
    }
  }

  async function refreshList() {
    const loading = document.getElementById('gb-save-loading');
    const wrap    = document.getElementById('gb-save-list-wrap');
    if (loading) loading.style.display = 'block';
    if (wrap)    wrap.style.display    = 'none';
    try {
      const projects = await apiList();
      renderSavedGames(projects);
      if (loading) loading.style.display = 'none';
      if (wrap)    wrap.style.display    = 'block';
    } catch (e) {
      if (loading) loading.style.display = 'none';
      saveStatus('Could not load saved games.', '#f87171');
    }
  }

  async function openModal() {
    const overlay   = document.getElementById('gb-save-overlay');
    const loginMsg  = document.getElementById('gb-save-login-msg');
    const saveForm  = document.getElementById('gb-save-form');
    const listWrap  = document.getElementById('gb-save-list-wrap');
    const loading   = document.getElementById('gb-save-loading');
    if (!overlay) return;

    overlay.style.display = 'flex';
    if (loginMsg)  loginMsg.style.display  = 'none';
    if (saveForm)  saveForm.style.display  = 'none';
    if (listWrap)  listWrap.style.display  = 'none';
    if (loading)   loading.style.display   = 'block';
    saveStatus('');

    const user = await apiGetUser();
    if (loading) loading.style.display = 'none';

    if (!user) {
      if (loginMsg) loginMsg.style.display = 'block';
      return;
    }

    if (saveForm) saveForm.style.display = 'block';
    await refreshList();
  }

  // Open button
  document.getElementById('gb-save-btn')?.addEventListener('click', openModal);

  // Close button
  document.getElementById('gb-save-close')?.addEventListener('click', () => {
    document.getElementById('gb-save-overlay').style.display = 'none';
  });
  document.getElementById('gb-save-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('gb-save-overlay'))
      document.getElementById('gb-save-overlay').style.display = 'none';
  });

  // Save new game
  document.getElementById('gb-save-confirm')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('gb-save-name');
    const name = (nameInput?.value || '').trim() || 'My Game';
    saveStatus('Saving…', '#64748b');
    try {
      await apiSave(name, getCurrentLevels());
      if (nameInput) nameInput.value = '';
      saveStatus('Saved ✓', '#4ade80');
      await refreshList();
    } catch (e) {
      saveStatus('Error: ' + e.message, '#f87171');
    }
  });

  // Allow Enter key in name input
  document.getElementById('gb-save-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('gb-save-confirm')?.click();
  });
})();

// ── Multiplayer ──────────────────────────────────────────────────────────────
let _socket = null;
let _mpRoom  = null;
let _mpPlayerCount = 1;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function mpStatus(msg, color) {
  const el = document.getElementById('gb-mp-status');
  if (el) { el.textContent = msg; if (color) el.style.color = color; }
}

function mpConnDot(msg, color) {
  const el = document.getElementById('gb-mp-conn-dot');
  if (el) { el.textContent = '● ' + msg; el.style.color = color || '#64748b'; }
}

function mpRenderPlayers(count) {
  _mpPlayerCount = count;
  const list = document.getElementById('gb-mp-player-list');
  if (!list) return;
  list.innerHTML = '';
  for (let i = 0; i < Math.max(2, count); i++) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:.82rem;';
    const dot = i < count ? '🟢' : '⭕';
    const label = i === 0 ? 'You (Host)' : (i < count ? 'Player ' + (i + 1) + ' — Connected!' : 'Waiting for player ' + (i + 1) + '…');
    const color = i < count ? '#a5f3fc' : '#475569';
    row.innerHTML = `<span>${dot}</span><span style="color:${color}">${label}</span>`;
    list.appendChild(row);
  }
}

function mpShowRoom(code) {
  document.getElementById('gb-mp-setup').style.display = 'none';
  document.getElementById('gb-mp-room-active').style.display = 'block';
  document.getElementById('gb-mp-room-code').textContent = code;
  // Update the toolbar button
  const btn = document.getElementById('gb-mp-btn');
  if (btn) { btn.style.borderColor = '#22c55e'; btn.style.color = '#4ade80'; btn.title = 'Multiplayer — In Room: ' + code; }
  mpRenderPlayers(1);
  _renderFriendsList();
}

function mpHideRoom() {
  document.getElementById('gb-mp-setup').style.display = 'block';
  document.getElementById('gb-mp-room-active').style.display = 'none';
  const btn = document.getElementById('gb-mp-btn');
  if (btn) { btn.style.borderColor = '#334155'; btn.style.color = '#94a3b8'; btn.title = 'Multiplayer'; }
}

// ── localStorage helpers (mirrors UESL hub) ─────────────────────────────────
function _chatKey(uid1, uid2) {
  return 'uesl_chat_v1__' + [String(uid1), String(uid2)].sort().join('__');
}
function _chatAppend(uid1, uid2, msg) {
  try {
    const key = _chatKey(uid1, uid2);
    const msgs = JSON.parse(localStorage.getItem(key) || '[]');
    msgs.push(msg);
    if (msgs.length > 500) msgs.splice(0, msgs.length - 500);
    localStorage.setItem(key, JSON.stringify(msgs));
  } catch (_) {}
}
function _friendsList(uid) {
  try { return JSON.parse(localStorage.getItem('uesl_friends_v1_' + uid) || '[]'); } catch(_) { return []; }
}

// ── Socket connection ────────────────────────────────────────────────────────
// isHost=true  → host path: emits create_room, waits for partner_joined
// isHost=false → guest path: emits join_room_event, receives game_data
function connectSocket(room, isHost, gameData, gameName) {
  if (_socket) { _socket.disconnect(); }
  mpConnDot('Connecting…', '#f59e0b');
  mpStatus('Connecting to server…');
  _socket = io(PYTHON_URI, { transports: ['websocket', 'polling'] });
  window.__mpSocket = _socket;
  window.__mpRoom = room;
  const myUid  = sessionStorage.getItem('uesl_my_uid')  || '';
  const myName = sessionStorage.getItem('uesl_my_name') || (isHost ? 'Host' : 'Player 2');

  // Real-time partner position for the overlay renderer
  _socket.on('partner_update', data => {
    window.__mpPartnerPos = data;
  });

  _socket.on('connect', () => {
    mpConnDot('In room ' + room, '#22c55e');
    if (isHost) {
      // HOST: create the room and attach current level code
      const code = gameData || document.getElementById('code-editor')?.value || '';
      _socket.emit('create_room', {
        room_id:   room,
        uid:       myUid,
        name:      myName,
        game_data: code,
        game_name: gameName || 'UESL Game Builder',
      });
    } else {
      // GUEST: join the existing room by code
      _socket.emit('join_room_event', { room_id: room, uid: myUid, name: myName });
    }
  });

  // HOST: room confirmed by server
  _socket.on('room_created', ({ room_id }) => {
    mpStatus('✅ Room ' + room_id + ' ready — share the code with a friend!', '#4ade80');
    mpRenderPlayers(1);
  });

  // HOST: a guest joined — (re)create the remote overlay so host can see guest
  _socket.on('partner_joined', ({ name }) => {
    mpStatus('🎮 ' + (name || 'A player') + ' joined the room!', '#4ade80');
    mpRenderPlayers(2);
    _createRemoteOverlay(true); // host sees guest as "Player 2"
  });

  // GUEST: receive host's game data and launch it
  _socket.on('game_data', ({ game_data, game_name, host_name }) => {
    if (game_data) {
      mpStatus('📥 Level received from ' + (host_name || 'host') + ' — launching…', '#a5f3fc');
      window.__mpInjectedCode = game_data;
      const editor = document.getElementById('code-editor');
      if (editor) editor.value = game_data;
      setTimeout(() => {
        if (typeof window.__runInRunner === 'function') {
          window.__runInRunner();
        } else {
          document.getElementById('btn-code-play')?.click();
        }
        // Guest also needs the remote overlay to see the host's player
        setTimeout(() => _createRemoteOverlay(false), 600); // guest sees host as "Host"
        mpStatus('🎮 Playing "' + (game_name || 'Game') + '" — have fun!', '#4ade80');
      }, 500);
    }
  });

  _socket.on('join_error', ({ msg }) => {
    mpStatus('⚠ ' + msg, '#ef4444');
    mpConnDot('Error', '#ef4444');
  });

  _socket.on('partner_left', () => {
    mpRenderPlayers(1);
    mpStatus('⚠ Your partner left the room.', '#f59e0b');
    mpConnDot('In room ' + room + ' (1 player)', '#22c55e');
  });

  _socket.on('disconnect', () => {
    mpConnDot('Disconnected', '#ef4444');
    mpStatus('Disconnected from server');
  });

  _socket.on('connect_error', () => {
    mpConnDot('Connection failed', '#ef4444');
    mpStatus('⚠ Could not reach server — is the socket server running on port 8424?');
  });
}

function disconnectSocket() {
  if (_socket) { _socket.disconnect(); _socket = null; }
  _mpRoom = null;
  window.__mpSocket = null;
  window.__mpRoom = null;
  window.__mpPartnerPos = null;
  (window.__mpPosIntervals || []).forEach(id => clearInterval(id));
  window.__mpPosIntervals = [];
  document.getElementById('gb-mp-remote-overlay')?.remove();
  mpHideRoom();
  mpConnDot('Not connected', '#64748b');
  mpStatus('');
  _disableMpMode();
}

// ── Create room & send invite via UESL localStorage chat ────────────────────
function _createRoomAndInviteFriend(friendUid, friendName) {
  const myUid  = sessionStorage.getItem('uesl_my_uid');
  const myName = sessionStorage.getItem('uesl_my_name') || 'A friend';
  if (!myUid) { mpStatus('⚠ Not logged in — log in on the UESL hub first'); return; }
  _mpRoom = generateRoomCode();
  // Generate fresh code from builder state so guest always gets the actual game,
  // not just whatever happened to be in the editor at invitation time.
  const code = (typeof window.__generateCurrentCode === 'function' ? window.__generateCurrentCode() : null)
    || document.getElementById('code-editor')?.value || '';
  connectSocket(_mpRoom, true, code, 'UESL Game Builder');
  mpShowRoom(_mpRoom);
  mpStatus('Room ' + _mpRoom + ' created — inviting ' + friendName + '…');
  const invite = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2),
    sender_uid:  String(myUid),
    sender_name: myName,
    type:        'game_invite',
    room_id:     _mpRoom,
    game_name:   'UESL Game Builder',
    created_at:  new Date().toISOString()
  };
  _chatAppend(myUid, friendUid, invite);
  mpStatus('✅ Invite sent to ' + friendName + ' — room: ' + _mpRoom);
}

// ── Populate friends list in modal ──────────────────────────────────────────
function _renderFriendsList() {
  const myUid = sessionStorage.getItem('uesl_my_uid');
  const loginNote = document.getElementById('gb-mp-login-note');
  const friendsSection = document.getElementById('gb-mp-friends-section');
  const listEl = document.getElementById('gb-mp-friends-list');
  const noFriendsEl = document.getElementById('gb-mp-no-friends');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (!myUid) {
    if (loginNote) loginNote.style.display = 'block';
    if (friendsSection) friendsSection.style.display = 'none';
    return;
  }
  if (loginNote) loginNote.style.display = 'none';
  if (friendsSection) friendsSection.style.display = 'block';
  const friends = _friendsList(myUid);
  if (!friends.length) {
    if (noFriendsEl) noFriendsEl.style.display = 'block';
    return;
  }
  if (noFriendsEl) noFriendsEl.style.display = 'none';
  friends.forEach(f => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#0f1729;border-radius:7px;font-size:.82rem;';
    row.innerHTML = `
      <span style="color:#e2e8f0;">${f.name || f.uid}</span>
      <button style="padding:3px 10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:6px;color:#fff;font-size:.75rem;font-weight:700;cursor:pointer;">🎮 Invite</button>
    `;
    row.querySelector('button').addEventListener('click', () => _createRoomAndInviteFriend(f.uid, f.name || f.uid));
    listEl.appendChild(row);
  });
}

// ── Button wiring ────────────────────────────────────────────────────────────
document.getElementById('gb-mp-btn')?.addEventListener('click', () => {
  document.getElementById('gb-mp-overlay').style.display = 'flex';
  if (!_mpRoom) _renderFriendsList();
  // Auto-join if ?room= in URL (guest path)
  const urlRoom = new URLSearchParams(location.search).get('room');
  if (urlRoom && !_mpRoom) {
    _mpRoom = urlRoom;
    connectSocket(urlRoom, false);
    mpShowRoom(urlRoom);
    mpStatus('Joining room ' + urlRoom + '…');
  }
});

document.getElementById('gb-mp-close')?.addEventListener('click', () => {
  document.getElementById('gb-mp-overlay').style.display = 'none';
});

document.getElementById('gb-mp-create')?.addEventListener('click', () => {
  _mpRoom = generateRoomCode();
  const code = (typeof window.__generateCurrentCode === 'function' ? window.__generateCurrentCode() : null)
    || document.getElementById('code-editor')?.value || '';
  connectSocket(_mpRoom, true, code, 'UESL Game Builder');
  mpShowRoom(_mpRoom);
  mpStatus('Room created — share the code with a friend!');
  _enableMpMode();
});

document.getElementById('gb-mp-join')?.addEventListener('click', () => {
  const code = document.getElementById('gb-mp-join-code')?.value.trim().toUpperCase();
  if (!code || code.length < 4) { mpStatus('⚠ Enter a valid room code'); return; }
  _mpRoom = code;
  connectSocket(code, false);
  mpShowRoom(code);
  mpStatus('Joining room ' + code + '…');
  _enableMpMode();
});

document.getElementById('gb-mp-copy-btn')?.addEventListener('click', () => {
  const code = document.getElementById('gb-mp-room-code')?.textContent;
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('gb-mp-copy-btn');
      if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => { btn.textContent = '📋 Copy'; }, 1800); }
    }).catch(() => {
      mpStatus('Code: ' + code + ' — copy it manually');
    });
  }
});

document.getElementById('gb-mp-send-level')?.addEventListener('click', () => {
  if (!_mpRoom) { mpStatus('⚠ Not connected to a room'); return; }
  // Re-create the room with updated code so the guest receives the latest level
  const code = (typeof window.__generateCurrentCode === 'function' ? window.__generateCurrentCode() : null)
    || document.getElementById('code-editor')?.value || '';
  connectSocket(_mpRoom, true, code, 'UESL Game Builder');
  mpStatus('📤 Updating level for partner…', '#4ade80');
});

document.getElementById('gb-mp-leave')?.addEventListener('click', () => {
  disconnectSocket();
  document.getElementById('gb-mp-overlay').style.display = 'none';
});

// "Exit multiplayer" link inside the editing-lock banner
document.getElementById('gb-mp-exit-edit')?.addEventListener('click', (e) => {
  e.preventDefault();
  disconnectSocket();
  document.getElementById('gb-mp-overlay').style.display = 'none';
});

// Auto-join room from URL on page load (guest path)
(function() {
  const urlRoom = new URLSearchParams(location.search).get('room');
  if (urlRoom) { _mpRoom = urlRoom; connectSocket(urlRoom, false); mpShowRoom(urlRoom); _enableMpMode(); }
})();

// ── Left panel horizontal resize ────────────────────────────────────────────
(function() {
    const handle   = document.getElementById('left-panel-resize');
    const colAsset = document.getElementById('col-asset');
    const layout   = colAsset?.closest('.creator-layout');
    if (!handle || !colAsset) return;

    const MIN_W      = 165;
    const MAX_W      = 520;
    const STORAGE_KEY = 'gb-left-panel-width';

    // Returns the maximum width the panel should occupy given current window size
    // (cap at 40% of the layout width so the right panel always has room)
    function maxAllowed() {
        const layoutW = layout ? layout.getBoundingClientRect().width : window.innerWidth;
        return Math.min(MAX_W, Math.floor(layoutW * 0.40));
    }

    // Apply a width, clamping it to the current window-based limit
    function applyWidth(w) {
        const clamped = Math.min(maxAllowed(), Math.max(MIN_W, w));
        colAsset.style.width = clamped + 'px';
        colAsset.style.flex  = 'none';
        return clamped;
    }

    // Restore saved width (clamped to current window)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const w = parseInt(saved, 10);
        if (w >= MIN_W) applyWidth(w);
    }

    // Re-clamp on window resize so the panel never overflows
    window.addEventListener('resize', () => {
        if (colAsset.style.width) applyWidth(parseInt(colAsset.style.width, 10));
    });

    let dragging = false, startX = 0, startW = 0;

    handle.addEventListener('mousedown', e => {
        dragging = true;
        startX   = e.clientX;
        startW   = colAsset.getBoundingClientRect().width;
        handle.classList.add('dragging');
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        applyWidth(startW + (e.clientX - startX));
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        handle.classList.remove('dragging');
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        localStorage.setItem(STORAGE_KEY, parseInt(colAsset.style.width, 10));
    });
})();
</script>