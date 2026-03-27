/**
 * UESLGame.js — UESL custom GameObject for the OCS GameEnginev1.1
 *
 * Extends OCS's GameObject base class and implements the full UESL game:
 *   • Emoji player with keyboard, face-tracking, and voice-command input
 *   • Barrier walls with AABB collision
 *   • Star collectibles (win condition)
 *   • Patrol NPCs with damage and invincibility frames
 *   • Heart pickups and lives system
 *   • Procedural / image backgrounds (splines, gradients, images)
 *   • Multiplayer position broadcasting (Socket.IO + BroadcastChannel)
 *   • Full HUD: hearts row, score counter, accessibility badges, score pops
 *   • High-contrast, large-sprite, slow-mode, guided-mode, single-button a11y
 *
 * Globals read from window.UESL (set by game-maker.html before GameCore.main()):
 *   a11y, gameConfig, BACKGROUNDS, bgImages, drawFunctions,
 *   MAZE_CX, MAZE_RY, ROAD_WAYPOINTS, ROAD_OBSTACLES,
 *   resolveMaze, resolveRoad,
 *   sfxCollect, sfxHit, sfxLevelComplete, sfxWin,
 *   onLevelComplete(idx, isEmpty), onFinalWin(), onPause(), onResume(), onRestart()
 */

import GameObject from '../essentials/GameObject.js';

export default class UESLGame extends GameObject {

  /* ── Constructor ─────────────────────────────────────────────────────── */
  constructor(data, gameEnv) {
    super(gameEnv);

    // Share the GameEnv's canvas — all UESL drawing goes here
    this.canvas = gameEnv.canvas;
    this.ctx    = gameEnv.ctx;

    // Pull UESL globals
    const U          = window.UESL || {};
    this.a11y        = U.a11y        || {};
    this.gameConfig  = U.gameConfig  || { playerSpeed: 3.2, npcSpeed: 1.2, playerSize: 40, starRadius: 14 };
    this.bgImages    = U.bgImages    || {};
    this.drawFns     = U.drawFunctions || {};

    // Canvas dimensions from GameEnv (set via environment.innerWidth/Height)
    this.W      = gameEnv.innerWidth  || 800;
    this.H      = gameEnv.innerHeight || 520;
    this.BORDER = 22;
    this._updateBorderWalls();

    // Build initial play state from level data
    this._st = this._buildState(data);

    // Key tracking
    this._keys        = {};
    this._onKeyDown   = (e) => { this._keys[e.key] = true;  this._handleSpecialKeys(e); };
    this._onKeyUp     = (e) => { delete this._keys[e.key];  this._handleKeyUp(e); };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup',   this._onKeyUp);

    // Multiplayer throttle
    this._lastMpEmit = 0;

    // Expose for voice command handler in game-maker.html
    window._activeUESLGame = this;
  }

  /* ── State builder (mirrors buildPlayState from game-maker.html) ──────── */
  _buildState(data) {
    const U      = window.UESL || {};
    const bgId   = data.background ? data.background.id : 'dark';
    const isMaze = bgId === 'maze';
    const isRoad = bgId === 'road';
    const MCX    = (U.MAZE_CX       || []);
    const MRY    = (U.MAZE_RY       || []);
    const RWP    = (U.ROAD_WAYPOINTS || []);

    const spawnX = isMaze && MCX.length ? MCX[0] - 20
                 : isRoad && RWP.length ? RWP[0][0] - 20
                 : (data.playerStart ? data.playerStart.x : 60) - 20;
    const spawnY = isMaze && MRY.length ? MRY[0] - 20
                 : isRoad && RWP.length ? RWP[0][1] - 20
                 : (data.playerStart ? data.playerStart.y : 60) - 20;

    const clone = JSON.parse(JSON.stringify(data));   // deep-clone level data

    return {
      player: {
        x: spawnX, y: spawnY,
        size: this.a11y.largeSprites ? 52 : this.gameConfig.playerSize,
        spd:  this.gameConfig.playerSpeed,
        vx: 0, vy: 0, carAngle: undefined,
      },
      barriers:     clone.barriers  || [],
      stars:        (clone.stars  || []).map(s => ({ ...s, collected: false })),
      heartPickups: (clone.hearts || []).map(h => ({ ...h, collected: false })),
      npcs:         (clone.npcs   || []).map(n => ({
        ...n, cx: n.x, cy: n.y, size: 36,
        path: [{ x: n.x, y: n.y }, { x: n.ex, y: n.ey }], pathIdx: 0,
      })),
      startHearts:   Math.min(5, Math.max(1, clone.startHearts ?? 3)),
      currentHearts: Math.min(5, Math.max(1, clone.startHearts ?? 3)),
      totalStars:    (clone.stars || []).length,
      score:         0,
      won:           false,
      wonHandled:    false,
      hitFlash:      0,
      invincible:    0,
      particles:     [],
      scorePops:     (isRoad ? [{ x: this.W/2, y: this.H/2-40, alpha: 1, dy: -0.5, text: '🚗 You\'re now driving!' }] : []),
      voiceMove:     null,
      sbDir:         0,
      sbMoving:      false,
      paused:        false,
      isEmpty:       (clone.stars || []).length === 0,
      _emptyTriggered: false,
      winBannerAlpha: 0,
      background:    data.background || { id: 'dark', type: 'color', color: '#0d0d1a' },
      playerEmoji:   data.playerEmoji || '🦸',
      playerName:    data.playerName  || 'Hero',
      levelIdx:      data.levelIdx    || 0,
      totalLevels:   data.totalLevels || 1,
      goal:          data.goal        || 'collect_stars',
      spawnX, spawnY,
    };
  }

  _updateBorderWalls() {
    this.BORDER_WALLS = [
      { x: 0,             y: 0,              w: this.W, h: this.BORDER },
      { x: 0,             y: this.H-this.BORDER, w: this.W, h: this.BORDER },
      { x: 0,             y: 0,              w: this.BORDER, h: this.H },
      { x: this.W-this.BORDER, y: 0,         w: this.BORDER, h: this.H },
    ];
  }

  /* ── OCS GameObject interface ─────────────────────────────────────────── */

  /**
   * update() — called every frame by OCS GameLevel.update()
   * Draws background, runs physics, draws all entities + HUD.
   */
  update() {
    const st  = this._st;
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // 1. Background (GameEnv.clear() already cleared the canvas before this runs)
    this._drawBackground(ctx, W, H, st.background);

    // 2. Border walls
    const HC = this.a11y.highContrast;
    ctx.fillStyle = HC ? '#FFF' : '#1a2244';
    ctx.fillRect(0, 0, W, this.BORDER);
    ctx.fillRect(0, H - this.BORDER, W, this.BORDER);
    ctx.fillRect(0, 0, this.BORDER, H);
    ctx.fillRect(W - this.BORDER, 0, this.BORDER, H);

    // 3. Physics (skip when won or paused)
    if (!st.won && !st.paused) {
      this._updatePhysics(st, W, H);
    }

    // 4. Render entities + HUD
    this._drawEntities(ctx, st, W, H);
    this._drawHUD(ctx, st, W, H);

    // 5. Multiplayer position emit
    this._emitMultiplayerPos(st);

    // 6. Trigger empty-level transition on first frame
    if (st.isEmpty && !st._emptyTriggered) {
      st._emptyTriggered = true;
      setTimeout(() => {
        const U = window.UESL || {};
        if (typeof U.onLevelComplete === 'function') U.onLevelComplete(st.levelIdx, true);
      }, 600);
    }
  }

  draw()    { /* drawing is done inside update() */ }
  resize()  {
    this.W = this.gameEnv.innerWidth  || 800;
    this.H = this.gameEnv.innerHeight || 520;
    this._updateBorderWalls();
  }
  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup',   this._onKeyUp);
    if (window._activeUESLGame === this) window._activeUESLGame = null;
  }

  /* ── Accessors (used by voice/face command code in game-maker.html) ────── */
  get state() { return this._st; }

  /* ── Background rendering ─────────────────────────────────────────────── */
  _drawBackground(ctx, W, H, bg) {
    if (this.a11y.highContrast) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      return;
    }
    if (bg.type === 'image') {
      const img = this.bgImages[bg.id];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H);
      }
    } else if (bg.type === 'drawn' && typeof this.drawFns[bg.id] === 'function') {
      this.drawFns[bg.id](ctx);
    } else {
      ctx.fillStyle = bg.color || '#0d0d1a'; ctx.fillRect(0, 0, W, H);
    }
  }

  /* ── Physics update ───────────────────────────────────────────────────── */
  _updatePhysics(st, W, H) {
    const ps    = st.player;
    const scale = this.a11y.slowMode ? 0.45 : 1;
    const spd   = ps.spd * scale;
    const keys  = this._keys;
    const U     = window.UESL || {};

    ps.vx = 0; ps.vy = 0;

    if (this.a11y.singleButton) {
      if (st.sbMoving) {
        if (st.sbDir === 0) ps.vx =  spd;
        if (st.sbDir === 1) ps.vy =  spd;
        if (st.sbDir === 2) ps.vx = -spd;
        if (st.sbDir === 3) ps.vy = -spd;
      }
    } else {
      // Keyboard + face tracking (both work simultaneously)
      const fc = (window.FaceTracker && window.FaceTracker.active) ? window.FaceTracker.controls : {};
      if (keys['ArrowLeft']  || keys['a'] || keys['A'] || fc.left)  ps.vx -= spd;
      if (keys['ArrowRight'] || keys['d'] || keys['D'] || fc.right) ps.vx += spd;
      if (keys['ArrowUp']    || keys['w'] || keys['W'] || fc.up)    ps.vy -= spd;
      if (keys['ArrowDown']  || keys['s'] || keys['S'] || fc.down)  ps.vy += spd;
    }

    // Voice command override
    if (st.voiceMove && st.voiceMove.remainingPx > 0) {
      const vmSpd = ps.spd * scale;
      const step  = Math.min(st.voiceMove.remainingPx, vmSpd);
      ps.vx = st.voiceMove.vx * step;
      ps.vy = st.voiceMove.vy * step;
      st.voiceMove.remainingPx -= step;
      if (st.voiceMove.remainingPx <= 0) { st.voiceMove = null; ps.vx = 0; ps.vy = 0; }
    }

    // Move + barrier resolution
    const _px = ps.x, _py = ps.y;
    ps.x += ps.vx;
    ps.y += ps.vy;
    this._resolveBarriers(ps, [...st.barriers, ...this.BORDER_WALLS]);

    // Background-specific collision (maze walls, road waypoint snapping)
    const bgId = st.background.id;
    if (bgId === 'maze'  && typeof U.resolveMaze === 'function')  U.resolveMaze(ps, _px, _py);
    if (bgId === 'road'  && typeof U.resolveRoad === 'function')  U.resolveRoad(ps, _px, _py);

    // Road obstacle collisions
    if (bgId === 'road' && st.invincible <= 0 && !this.a11y.guidedMode) {
      const obs = U.ROAD_OBSTACLES || [];
      const rpcx = ps.x + ps.size / 2, rpcy = ps.y + ps.size / 2;
      for (const ob of obs) {
        if (Math.hypot(ob.x - rpcx, ob.y - rpcy) < ps.size / 2 + ob.r) {
          this._takeDamage(st, '💥 Crashed! Respawning…', '-1 ❤️ Crash!');
          break;
        }
      }
    }

    // Car rotation for road mode
    if (bgId === 'road' && (ps.vx !== 0 || ps.vy !== 0)) {
      ps.carAngle = Math.atan2(ps.vy, ps.vx) + Math.PI / 2;
    }

    // NPC movement + damage
    for (const n of st.npcs) {
      const tgt = n.path[n.pathIdx], dx = tgt.x - n.cx, dy = tgt.y - n.cy;
      const dist = Math.hypot(dx, dy), ns = (n.speed || 1.2) * scale;
      if (dist < 3) { n.pathIdx = (n.pathIdx + 1) % n.path.length; }
      else          { n.cx += (dx / dist) * ns; n.cy += (dy / dist) * ns; }

      if (!this.a11y.guidedMode && st.invincible <= 0) {
        const pcx = ps.x + ps.size / 2, pcy = ps.y + ps.size / 2;
        const ncx = n.cx + n.size / 2, ncy = n.cy + n.size / 2;
        if (Math.abs(pcx - ncx) < (ps.size + n.size) / 2 &&
            Math.abs(pcy - ncy) < (ps.size + n.size) / 2) {
          this._takeDamage(st, '💔 No hearts left! Respawning…', `-1 ❤️`);
        }
      }
    }

    // Star collection
    const pcx = ps.x + ps.size / 2, pcy = ps.y + ps.size / 2;
    st.stars.forEach((s, starIdx) => {
      if (s.collected) return;
      if (Math.hypot(s.x - pcx, s.y - pcy) < ps.size * 0.7) {
        s.collected = true; st.score++;
        if (typeof U.sfxCollect === 'function') U.sfxCollect();
        this._spawnParticles(st, s.x, s.y);
        st.scorePops.push({ x: s.x, y: s.y - 10, alpha: 1, dy: -1.2, text: '+1 ⭐' });
        window._mpEmitCoopEvent && window._mpEmitCoopEvent({ type: 'star', idx: starIdx, level: st.levelIdx });
        this._checkWin(st, pcx, pcy);
      }
    });

    // Heart pickup collection
    for (const h of st.heartPickups) {
      if (h.collected) continue;
      if (Math.hypot(h.x - pcx, h.y - pcy) < ps.size * 0.75) {
        h.collected = true;
        if (st.currentHearts < 5) {
          st.currentHearts = Math.min(5, st.currentHearts + 1);
          if (typeof U.sfxCollect === 'function') U.sfxCollect();
          this._spawnParticles(st, h.x, h.y);
          st.scorePops.push({ x: h.x, y: h.y - 10, alpha: 1, dy: -1.2, text: '+1 ❤️' });
        } else {
          st.scorePops.push({ x: h.x, y: h.y - 10, alpha: 1, dy: -1.2, text: '❤️ Full!' });
        }
      }
    }

    // Particles & pops tick
    for (let i = st.particles.length - 1; i >= 0; i--) {
      const p = st.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.decay;
      if (p.life <= 0) st.particles.splice(i, 1);
    }
    for (let i = st.scorePops.length - 1; i >= 0; i--) {
      const sp = st.scorePops[i];
      sp.y += sp.dy; sp.alpha -= 0.025;
      if (sp.alpha <= 0) st.scorePops.splice(i, 1);
    }
    if (st.hitFlash  > 0) st.hitFlash--;
    if (st.invincible > 0) st.invincible--;
  }

  _takeDamage(st, msgFull, msgPartial) {
    const U = window.UESL || {};
    const ps = st.player;
    if (typeof U.sfxHit === 'function') U.sfxHit();
    st.currentHearts = Math.max(0, st.currentHearts - 1);
    st.hitFlash   = this.a11y.reduceMotion ? 1 : 36;
    st.invincible = 90;
    ps.x = st.spawnX; ps.y = st.spawnY;
    if (st.currentHearts <= 0) {
      st.currentHearts = st.startHearts;
      st.scorePops.push({ x: this.W / 2, y: this.H / 2 - 30, alpha: 1, dy: -0.8, text: msgFull });
    } else {
      st.scorePops.push({ x: ps.x + ps.size / 2, y: ps.y - 10, alpha: 1, dy: -1.2, text: msgPartial });
    }
  }

  _resolveBarriers(ps, barriers) {
    const sz = ps.size;
    for (const b of barriers) {
      const bx = Math.min(b.x, b.x + b.w), by = Math.min(b.y, b.y + b.h);
      const bw = Math.abs(b.w), bh = Math.abs(b.h);
      if (!(ps.x < bx + bw && ps.x + sz > bx && ps.y < by + bh && ps.y + sz > by)) continue;
      const oL = ps.x + sz - bx, oR = bx + bw - ps.x, oT = ps.y + sz - by, oB = by + bh - ps.y;
      const m = Math.min(oL, oR, oT, oB);
      if (m === oL) ps.x = bx - sz;
      else if (m === oR) ps.x = bx + bw;
      else if (m === oT) ps.y = by - sz;
      else               ps.y = by + bh;
    }
    ps.x = Math.max(this.BORDER, Math.min(this.W - this.BORDER - ps.size, ps.x));
    ps.y = Math.max(this.BORDER, Math.min(this.H - this.BORDER - ps.size, ps.y));
  }

  _spawnParticles(st, cx, cy) {
    if (!this.a11y.celebrations || this.a11y.reduceMotion) return;
    const cols = ['#FFD700', '#FF6B6B', '#00FF88', '#00BFFF', '#FF69B4'];
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      st.particles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 1, decay: 0.025 + Math.random() * 0.02,
        r: 4 + Math.random() * 5,
        col: cols[Math.floor(Math.random() * cols.length)],
      });
    }
  }

  _nearestStar(st) {
    const ps = st.player, pcx = ps.x + ps.size / 2, pcy = ps.y + ps.size / 2;
    let best = null, bestD = Infinity;
    for (const s of st.stars) {
      if (s.collected) continue;
      const d = Math.hypot(s.x - pcx, s.y - pcy);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  _checkWin(st, pcx, pcy) {
    if (st.totalStars > 0 && st.score >= st.totalStars) {
      st.won = true;
      this._spawnParticles(st, pcx, pcy);
      this._spawnParticles(st, this.W / 2, this.H / 2);
      if (!st.wonHandled) {
        st.wonHandled = true;
        const U = window.UESL || {};
        const hasNext = st.levelIdx + 1 < st.totalLevels;
        window._mpEmitCoopEvent && window._mpEmitCoopEvent({
          type: 'level_done', level: st.levelIdx, next: hasNext ? st.levelIdx + 1 : -1,
        });
        if (hasNext) {
          setTimeout(() => {
            if (typeof U.sfxLevelComplete === 'function') U.sfxLevelComplete();
            if (typeof U.onLevelComplete   === 'function') U.onLevelComplete(st.levelIdx, false);
          }, 1200);
        } else {
          setTimeout(() => {
            if (typeof U.sfxWin        === 'function') U.sfxWin();
            if (typeof U.onFinalWin    === 'function') U.onFinalWin();
          }, 1400);
        }
      }
    }
  }

  /* ── Entity rendering ─────────────────────────────────────────────────── */
  _drawEntities(ctx, st, W, H) {
    const HC = this.a11y.highContrast, LG = this.a11y.largeSprites, ps = st.player;

    // Barriers
    for (const b of st.barriers) {
      const bx = Math.min(b.x, b.x+b.w), by = Math.min(b.y, b.y+b.h);
      const bw = Math.abs(b.w), bh = Math.abs(b.h);
      ctx.fillStyle = HC ? '#FFF' : (b.col || '#223366');
      ctx.fillRect(bx, by, bw, bh);
      if (b.label) {
        ctx.strokeStyle = HC ? '#FFFF00' : '#FF9900'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        if (bw > 30 && bh > 14) {
          ctx.fillStyle = HC ? '#000' : '#FFF';
          ctx.font = `bold ${LG ? 16 : 13}px Arial`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(b.label, bx + bw/2, by + bh/2);
        }
      }
    }

    // Stars
    const near = this.a11y.guidedMode ? this._nearestStar(st) : null;
    for (const s of st.stars) {
      if (s.collected) continue;
      const sz = LG ? 30 : 22;
      if (HC) {
        ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(s.x, s.y, sz/2+2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = `${sz}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', s.x, s.y+1);
      } else {
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = this.a11y.reduceMotion ? 0 : 10;
        ctx.font = `${sz}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⭐', s.x, s.y); ctx.shadowBlur = 0;
      }
      if (near === s) this._drawGuide(ctx, ps, s);
    }
    ctx.shadowBlur = 0;

    // Particles
    for (const p of st.particles) {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // NPCs
    const npcSz = LG ? 48 : 36;
    for (const n of st.npcs) {
      const cx = n.cx + n.size/2, cy = n.cy + n.size/2;
      if (HC) {
        ctx.fillStyle = this.a11y.guidedMode ? '#00AAFF' : '#FF0000';
        ctx.beginPath(); ctx.arc(cx, cy, npcSz/2, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3; ctx.stroke();
      } else {
        ctx.shadowColor = this.a11y.guidedMode ? '#00AAFF' : n.color;
        ctx.shadowBlur  = this.a11y.reduceMotion ? 0 : 14;
        ctx.fillStyle   = this.a11y.guidedMode ? '#0077cc' : n.color;
        ctx.beginPath(); ctx.arc(cx, cy, npcSz/2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.font = `${Math.floor(npcSz * 0.55)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.a11y.guidedMode ? '😊' : n.emoji, cx, cy+1);
    }

    // Player
    const pcx = ps.x + ps.size/2, pcy = ps.y + ps.size/2;
    const isRoad = st.background.id === 'road';
    if (HC) {
      ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(pcx, pcy, ps.size/2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3; ctx.stroke();
    } else {
      ctx.shadowColor = isRoad ? '#FF8800' : '#00FF88';
      ctx.shadowBlur  = this.a11y.reduceMotion ? 0 : 18;
      ctx.fillStyle   = isRoad ? '#FF8800' : '#00FF88';
      ctx.beginPath(); ctx.arc(pcx, pcy, ps.size/2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.save();
    if (isRoad && ps.carAngle !== undefined) {
      ctx.translate(pcx, pcy); ctx.rotate(ps.carAngle); ctx.translate(-pcx, -pcy);
    }
    ctx.font = `${Math.floor(ps.size * 0.55)}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(isRoad ? '🚗' : st.playerEmoji, pcx, pcy+1);
    ctx.restore();

    // Player name
    const nameY = ps.y - 4;
    if (st.playerName) {
      ctx.fillStyle = HC ? '#FFFF00' : 'rgba(255,255,255,0.8)';
      ctx.font = `bold ${LG ? 13 : 11}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(st.playerName, pcx, nameY);
    }

    // Voice move indicator
    if (st.voiceMove && st.voiceMove.remainingPx > 0) {
      const label   = st.voiceMove.label || '🎤';
      const bubbleY = (st.playerName ? nameY : ps.y) - (LG ? 20 : 16);
      ctx.font = `bold ${LG ? 13 : 11}px Arial`;
      const tw = ctx.measureText(label).width;
      const bx = pcx - tw/2 - 8, by = bubbleY - 16, bw = tw + 16, bh = 18;
      ctx.fillStyle = 'rgba(0,180,255,0.9)';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, pcx, by + bh/2);
      const pct = 1 - st.voiceMove.remainingPx / st.voiceMove.totalPx;
      ctx.fillStyle = 'rgba(0,100,180,0.5)';
      ctx.beginPath(); ctx.roundRect(bx, by+bh+2, bw, 3, 2); ctx.fill();
      ctx.fillStyle = '#00BFFF';
      ctx.beginPath(); ctx.roundRect(bx, by+bh+2, bw*pct, 3, 2); ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Multiplayer partner
    if (window._mp && window._mp.partnerPos) {
      const p2 = window._mp.partnerPos, p2sz = ps.size;
      ctx.save();
      ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 20;
      ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p2.x, p2.y, p2sz/2 + 4, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,180,255,0.25)';
      ctx.beginPath(); ctx.arc(p2.x, p2.y, p2sz/2, 0, Math.PI*2); ctx.fill();
      ctx.font = `${Math.floor(p2sz * 0.72)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p2.emoji || '🟦', p2.x, p2.y + 1);
      const lbl = p2.name || 'P2', tw = ctx.measureText(lbl).width;
      const tagX = p2.x - tw/2 - 6, tagY = p2.y - p2sz/2 - 20;
      ctx.fillStyle = 'rgba(0,30,60,0.82)';
      ctx.beginPath(); ctx.roundRect(tagX, tagY, tw+12, 18, 6); ctx.fill();
      ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(tagX, tagY, tw+12, 18, 6); ctx.stroke();
      ctx.fillStyle = '#00d4ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, p2.x, tagY + 9);
      ctx.restore();
    }

    // Heart pickups
    const hpSz = LG ? 28 : 22;
    for (const h of st.heartPickups) {
      if (h.collected) continue;
      ctx.save();
      ctx.shadowColor = '#ff2244'; ctx.shadowBlur = this.a11y.reduceMotion ? 0 : 12;
      ctx.font = `${hpSz}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('❤️', h.x, h.y);
      ctx.restore();
    }
  }

  /* ── HUD rendering ────────────────────────────────────────────────────── */
  _drawHUD(ctx, st, W, H) {
    const HC = this.a11y.highContrast, LG = this.a11y.largeSprites;

    // Hearts (top-right)
    const hMax = st.startHearts ?? 3, hCur = st.currentHearts ?? hMax;
    const heartStr = '❤️'.repeat(hCur) + '🖤'.repeat(Math.max(0, hMax - hCur));
    const heartSz = LG ? 24 : 20;
    ctx.font = `${heartSz}px Arial`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    if (st.invincible <= 0 || Math.floor(Date.now() / 120) % 2 === 0) {
      ctx.fillText(heartStr, W - 32, 28);
    }

    // Score (top-left)
    ctx.fillStyle = HC ? '#FFF' : '#DDD';
    ctx.font = `bold ${LG ? 22 : 18}px Arial`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(
      st.totalStars > 0 ? `⭐ ${st.score} / ${st.totalStars}` : `Level ${st.levelIdx + 1}`,
      32, 30
    );

    // Accessibility badges
    let by2 = 56;
    const bf = `${LG ? 14 : 11}px Arial`;
    if (this.a11y.slowMode)     { this._badge(ctx, '🐌 SLOW',         32, by2, '#006666', bf); by2 += 22; }
    if (this.a11y.guidedMode)   { this._badge(ctx, '🧭 GUIDED',       32, by2, '#005500', bf); by2 += 22; }
    if (this.a11y.singleButton) {
      const d = ['→','↓','←','↑'][st.sbDir];
      this._badge(ctx, `🕹️ ${d}`, 32, by2, '#330066', bf); by2 += 22;
    }
    if (st.background.id === 'road') { this._badge(ctx, '🚗 ROAD', 32, by2, '#5c3300', bf); }

    // Score pops
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const sp of st.scorePops) {
      ctx.globalAlpha = sp.alpha;
      ctx.font = `bold ${LG ? 20 : 15}px Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(sp.text, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;

    // Hit flash
    if (st.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${st.hitFlash / 35 * 0.55})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Empty level banner
    if (st.isEmpty) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${LG ? 36 : 30}px Arial`; ctx.fillStyle = '#FFD700';
      ctx.fillText('⚠️ This level has no stars!', W/2, H/2 - 28);
      ctx.font = `${LG ? 20 : 16}px Arial`; ctx.fillStyle = '#aaa';
      ctx.fillText('Go back to the Editor and add some ⭐ stars.', W/2, H/2 + 16);
    }

    // Win banner (fades in alongside the HTML overlay)
    if (st.won && st.wonHandled) {
      st.winBannerAlpha = Math.min(1, (st.winBannerAlpha || 0) + 0.04);
      ctx.fillStyle = `rgba(0,0,0,${st.winBannerAlpha * 0.45})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = st.winBannerAlpha;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${LG ? 52 : 42}px Arial`;
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = this.a11y.reduceMotion ? 0 : 28;
      ctx.fillStyle = '#FFD700';
      const hasNext = st.levelIdx + 1 < st.totalLevels;
      ctx.fillText(hasNext ? '⭐  Level Complete!  ⭐' : '🏆  You Won!  🏆', W/2, H/2 - 20);
      ctx.shadowBlur = 0;
      ctx.font = `${LG ? 22 : 18}px Arial`; ctx.fillStyle = '#fff';
      ctx.fillText('(A popup will appear in a moment…)', W/2, H/2 + 36);
      ctx.globalAlpha = 1;
    }

    // Paused overlay
    if (st.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.58)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#aabbff'; ctx.shadowBlur = 30;
      ctx.font = `bold ${LG ? 52 : 42}px Arial`; ctx.fillStyle = '#fff';
      ctx.fillText('⏸  PAUSED', W/2, H/2 - 18);
      ctx.shadowBlur = 0;
      ctx.font = `${LG ? 20 : 16}px Arial`; ctx.fillStyle = 'rgba(180,190,255,0.75)';
      ctx.fillText('press  ▶  to resume', W/2, H/2 + 30);
    }
  }

  _badge(ctx, text, x, y, bg, font) {
    ctx.font = font; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(x-4, y-2, tw+12, 18, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, x, y);
  }

  _drawGuide(ctx, ps, star) {
    const pcx = ps.x+ps.size/2, pcy = ps.y+ps.size/2;
    const ang = Math.atan2(star.y - pcy, star.x - pcx), sd = ps.size * 0.65;
    const len = Math.max(0, Math.hypot(star.x - pcx, star.y - pcy) - ps.size - 10);
    if (len < 12) return;
    const al = Math.min(len, 55), sx = pcx + Math.cos(ang)*sd, sy = pcy + Math.sin(ang)*sd;
    const ex = sx + Math.cos(ang)*al, ey = sy + Math.sin(ang)*al;
    ctx.save();
    ctx.strokeStyle = this.a11y.highContrast ? '#FFF' : '#88FF88';
    ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = this.a11y.highContrast ? '#FFF' : '#88FF88';
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 10*Math.cos(ang-0.45), ey - 10*Math.sin(ang-0.45));
    ctx.lineTo(ex - 10*Math.cos(ang+0.45), ey - 10*Math.sin(ang+0.45));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ── Multiplayer position broadcast ──────────────────────────────────── */
  _emitMultiplayerPos(st) {
    if (!window._mp || !window._mp.roomId) return;
    const now = Date.now();
    if (now - this._lastMpEmit < 50) return;
    this._lastMpEmit = now;
    const ps = st.player;
    const pos = {
      type: '_pos', room_id: window._mp.roomId,
      x: ps.x + ps.size/2, y: ps.y + ps.size/2,
      emoji: st.playerEmoji || '🙂',
      name:  st.playerName  || 'P1',
    };
    if (window._mp.bc)                              window._mp.bc.postMessage(pos);
    if (window._mp.socket && window._mp.socket.connected) window._mp.socket.emit('player_update', pos);
  }

  /* ── Special key handlers ─────────────────────────────────────────────── */
  _handleSpecialKeys(e) {
    const st = this._st;
    // R = restart current level
    if ((e.key === 'r' || e.key === 'R')) {
      const U = window.UESL || {};
      if (typeof U.onRestart === 'function') U.onRestart();
    }
    // Single-button mode
    if (this.a11y.singleButton) {
      if (e.key === ' ')     { st.sbDir = (st.sbDir + 1) % 4; e.preventDefault(); }
      if (e.key === 'Enter') { st.sbMoving = true;             e.preventDefault(); }
    }
  }

  _handleKeyUp(e) {
    if (this.a11y.singleButton && e.key === 'Enter') {
      this._st.sbMoving = false;
    }
  }
}
