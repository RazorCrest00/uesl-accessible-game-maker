import Enemy from './essentials/Enemy.js';
import Player from './essentials/Player.js';
import { pythonURI, fetchOptions } from '../api/config.js';

/**
 * UESLCoach — hostile AI-powered enemy NPC.
 *
 * Behaviour:
 *  - Patrols left/right while the player is outside chaseRange.
 *  - Switches to active chase when the player enters chaseRange.
 *  - Taunts the player with live AI-generated trash-talk (speech bubbles).
 *  - On contact: removes one heart from the player's health bar.
 *    A 2-second invincibility window prevents instant multi-hit.
 *    When all hearts are gone the level restarts.
 *
 * Sprite data config (beyond standard Character fields):
 *   chaseRange    {number}  px radius at which coach starts chasing  (default: 300)
 *   chaseSpeed    {number}  px/frame in chase mode                   (default: 1.0)
 *   patrolSpeed   {number}  px/frame while patrolling                (default: 0.8)
 *   walkingArea   {object}  { xMin, xMax, yMin, yMax } patrol zone
 *   tauntInterval {number}  ms between AI taunts while chasing       (default: 4500)
 *   maxHearts     {number}  starting hearts                          (default: 3)
 *   invincibleMs  {number}  ms of invincibility after a hit          (default: 2000)
 */
class UESLCoach extends Enemy {
    constructor(data = null, gameEnv = null) {
        super(data, gameEnv);

        this.chaseRange    = data?.chaseRange    ?? 300;
        this.chaseSpeed    = data?.chaseSpeed    ?? 1.0;
        this.patrolSpeed   = data?.patrolSpeed   ?? 0.8;
        this.walkingArea   = data?.walkingArea   ?? null;
        this.tauntInterval = data?.tauntInterval ?? 4500;

        // ── health ────────────────────────────────────────────────────────────
        this._maxHearts      = data?.maxHearts    ?? 3;
        this._currentHearts  = this._maxHearts;
        this._invincibleMs   = data?.invincibleMs ?? 2000;
        this._isInvincible   = false;
        this._invincibleTimer = null;
        this._flashInterval  = null;

        // ── AI state ──────────────────────────────────────────────────────────
        this._patrolDir      = 1;
        this.direction       = 'right'; // match initial patrol direction so sprite renders immediately
        this._caughtHandled  = false;
        this._isChasing      = false;
        this._tauntTimer     = null;
        this._bubble         = null;
        this._bubbleTimeout  = null;
        this._fetchingTaunt  = false;

        // ── HUD ───────────────────────────────────────────────────────────────
        this._heartHUD = null;

        this._injectStyles();
        this._createHeartHUD();
    }

    // ─── game loop ─────────────────────────────────────────────────────────────

    update() {
        const prevX = this.position.x;
        const prevY = this.position.y;

        this._updateAI();
        const newX = this.position.x;
        const newY = this.position.y;

        // Barrier collision — test new position, then try axis-by-axis sliding
        this._syncPos();
        if (this._isBlockedByBarrier()) {
            this.position.x = newX;
            this.position.y = prevY;
            this._syncPos();
            if (this._isBlockedByBarrier()) {
                this.position.x = prevX;
                this.position.y = newY;
                this._syncPos();
                if (this._isBlockedByBarrier()) {
                    this.position.x = prevX;
                    this.position.y = prevY;
                    this._patrolDir *= -1;
                }
            }
        }

        this.draw();

        if (!this._caughtHandled && !this._isInvincible && this._isTouchingPlayer()) {
            this.handleCollisionEvent();
        }

        this.stayWithinCanvas();
        this._updateBubblePosition();
    }

    /** Lightweight canvas position sync used during barrier probing. */
    _syncPos() {
        if (this.canvas) {
            this.canvas.style.left = `${this.position.x}px`;
            this.canvas.style.top  = `${(this.gameEnv?.top || 0) + this.position.y}px`;
        }
    }

    /**
     * Game-space AABB overlap check against the player.
     * Uses position + size directly — no getBoundingClientRect, no DOM lag.
     */
    _isTouchingPlayer() {
        const player = this._findPlayer();
        if (!player) return false;

        // Shrink both hitboxes slightly so the coach has to actually walk INTO the player
        const shrink = 0.25;
        const cL = this.position.x   + this.width   * shrink;
        const cR = this.position.x   + this.width   * (1 - shrink);
        const cT = this.position.y   + this.height  * shrink;
        const cB = this.position.y   + this.height;

        const pL = player.position.x + player.width  * shrink;
        const pR = player.position.x + player.width  * (1 - shrink);
        const pT = player.position.y + player.height * shrink;
        const pB = player.position.y + player.height;

        return cL < pR && cR > pL && cT < pB && cB > pT;
    }

    /** Returns true if the coach's canvas rect overlaps any Barrier object. */
    _isBlockedByBarrier() {
        for (const obj of (this.gameEnv?.gameObjects ?? [])) {
            if (obj === this || !obj.canvas) continue;
            if (obj.constructor?.name === 'Barrier') {
                this.isCollision(obj);
                if (this.collisionData.hit) return true;
            }
        }
        return false;
    }

    // ─── AI movement ───────────────────────────────────────────────────────────

    _updateAI() {
        if (this._caughtHandled) return;

        const player = this._findPlayer();
        if (!player) return;

        const dx   = player.position.x - this.position.x;
        const dy   = player.position.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.chaseRange) {
            if (!this._isChasing) {
                this._isChasing = true;
                this._startTaunting();
                this._triggerTaunt('nearby');
            }
            this._chase(dx, dy, dist);
        } else {
            if (this._isChasing) {
                this._isChasing = false;
                this._stopTaunting();
                this._clearBubble();
            }
            this._patrol();
        }
    }

    _chase(dx, dy, dist) {
        if (dist === 0) return;
        const norm = this.chaseSpeed / dist;
        this.position.x += dx * norm;
        this.position.y += dy * norm;
        this.direction = dx >= 0 ? 'right' : 'left';
    }

    _patrol() {
        const xMin = this.walkingArea?.xMin ?? 0;
        const xMax = this.walkingArea?.xMax ?? (this.gameEnv.innerWidth - this.width);

        this.position.x += this._patrolDir * this.patrolSpeed;

        if (this.position.x <= xMin) {
            this.position.x = xMin;
            this._patrolDir  = 1;
            this.direction   = 'right';
        }
        if (this.position.x + this.width >= xMax) {
            this.position.x = xMax - this.width;
            this._patrolDir  = -1;
            this.direction   = 'left';
        }
    }

    // ─── collision / health ────────────────────────────────────────────────────

    handleCollisionEvent() {
        if (this._caughtHandled || this._isInvincible) return;

        this._currentHearts -= 1;
        this._renderHearts();
        this._startInvincibility();
        this._triggerTaunt('hit');

        if (this._currentHearts <= 0) {
            // All hearts gone — game over
            this._caughtHandled = true;
            this._stopTaunting();
            this._clearBubble();
            this._stopFlash();

            // Capture reference before the level tears down
            const gameControl = this.gameEnv.gameControl;
            this._fetchTaunt('caught').then(taunt => {
                this._showCaughtOverlay(taunt, () => {
                    // transitionToLevel() re-creates the current level in-place — a true restart
                    gameControl.transitionToLevel();
                });
            });
        }
    }

    /** Grant brief invincibility and make the player flash to signal a hit. */
    _startInvincibility() {
        this._isInvincible = true;

        // Flash the player sprite on/off to show damage
        const player = this._findPlayer();
        if (player?.canvas) {
            let visible = true;
            this._flashInterval = setInterval(() => {
                visible = !visible;
                player.canvas.style.opacity = visible ? '1' : '0.2';
            }, 120);
        }

        this._invincibleTimer = setTimeout(() => {
            this._isInvincible = false;
            this._stopFlash();
        }, this._invincibleMs);
    }

    _stopFlash() {
        if (this._flashInterval) {
            clearInterval(this._flashInterval);
            this._flashInterval = null;
        }
        // Restore player opacity
        const player = this._findPlayer();
        if (player?.canvas) player.canvas.style.opacity = '1';
    }

    // ─── hearts HUD ────────────────────────────────────────────────────────────

    _createHeartHUD() {
        // Remove any stale HUD from a previous level run
        document.getElementById('uesl-heart-hud')?.remove();

        const hud = document.createElement('div');
        hud.id = 'uesl-heart-hud';
        document.body.appendChild(hud);
        this._heartHUD = hud;

        this._renderHearts();
    }

    _renderHearts() {
        if (!this._heartHUD) return;
        const hearts = [];
        for (let i = 0; i < this._maxHearts; i++) {
            hearts.push(i < this._currentHearts ? '❤️' : '🖤');
        }
        this._heartHUD.textContent = hearts.join(' ');
    }

    _destroyHeartHUD() {
        if (this._heartHUD) {
            this._heartHUD.remove();
            this._heartHUD = null;
        }
    }

    // ─── taunt system ──────────────────────────────────────────────────────────

    _startTaunting() {
        this._tauntTimer = setInterval(() => {
            this._triggerTaunt('chasing');
        }, this.tauntInterval);
    }

    _stopTaunting() {
        if (this._tauntTimer) {
            clearInterval(this._tauntTimer);
            this._tauntTimer = null;
        }
    }

    _triggerTaunt(context) {
        if (this._fetchingTaunt) return;
        this._fetchingTaunt = true;

        this._fetchTaunt(context).then(taunt => {
            this._showBubble(taunt);
            this._fetchingTaunt = false;
        }).catch(() => {
            this._fetchingTaunt = false;
        });
    }

    async _fetchTaunt(context = 'chasing') {
        try {
            const payload = { context, heartsLeft: this._currentHearts, ...this._getGameState() };
            const res = await fetch(`${pythonURI}/api/ainpc/coach-taunt`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            return data.taunt || this._fallbackTaunt(context);
        } catch {
            return this._fallbackTaunt(context);
        }
    }

    _getGameState() {
        const state = {};
        const objects = this.gameEnv?.gameObjects ?? [];

        const stars = objects.filter(o => o.constructor?.name === 'Star');
        if (stars.length > 0) {
            const collected = stars.filter(s => s.collected || s._collected || !s.canvas).length;
            state.totalStars = stars.length;
            state.starsLeft  = stars.length - collected;
        }

        const levelName =
            this.gameEnv?.gameControl?.currentLevel?.name ??
            this.gameEnv?.gameControl?.currentLevel?.constructor?.name ??
            null;
        if (levelName) state.levelName = levelName;

        return state;
    }

    _fallbackTaunt(context) {
        const bank = {
            chasing: [
                "You can't outrun me!",
                "This level ends NOW!",
                "Nowhere left to run!",
                "Speed won't save you!",
                "I ALWAYS catch my players!",
            ],
            hit: [
                "That's one heart gone!",
                "You're slowing down!",
                "I felt that — did you?",
                "Hearts don't last forever!",
                "Tick tock, running out of time!",
            ],
            caught:  ["Got you. Game over.", "Did you really think you'd win?", "Back to the start!"],
            nearby:  ["I see you…", "Oh, you're close.", "Found you."],
        };
        const opts = bank[context] || bank.chasing;
        return opts[Math.floor(Math.random() * opts.length)];
    }

    // ─── speech bubble ─────────────────────────────────────────────────────────

    _showBubble(text) {
        this._clearBubble();

        const bubble = document.createElement('div');
        bubble.className = 'uesl-coach-bubble';
        bubble.textContent = text;
        document.body.appendChild(bubble);
        this._bubble = bubble;

        this._updateBubblePosition();
        this._bubbleTimeout = setTimeout(() => this._clearBubble(), 3500);
    }

    _updateBubblePosition() {
        if (!this._bubble || !this.canvas) return;

        // rect is already the on-screen position of the coach canvas — use it directly.
        const rect    = this.canvas.getBoundingClientRect();
        const screenX = rect.left + rect.width / 2;   // center of the coach sprite
        const screenY = rect.top  - 14;               // just above the sprite

        this._bubble.style.left = `${screenX}px`;
        this._bubble.style.top  = `${screenY}px`;
    }

    _clearBubble() {
        if (this._bubbleTimeout) { clearTimeout(this._bubbleTimeout); this._bubbleTimeout = null; }
        if (this._bubble)        { this._bubble.remove(); this._bubble = null; }
    }

    // ─── caught overlay ────────────────────────────────────────────────────────

    _showCaughtOverlay(taunt, onDone) {
        document.getElementById('uesl-coach-caught')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'uesl-coach-caught';
        Object.assign(overlay.style, {
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 10, 60, 0.96)',
            border: '3px solid #6366f1', borderRadius: '16px',
            padding: '28px 36px', textAlign: 'center',
            zIndex: '10000', fontFamily: 'Arial, sans-serif',
            color: '#e2e8f0', boxShadow: '0 0 48px rgba(99,102,241,0.7)',
            minWidth: '320px', animation: 'coachSlideIn 0.4s ease-out',
        });

        // Show final hearts state (all empty)
        const emptyHearts = Array(this._maxHearts).fill('🖤').join(' ');

        overlay.innerHTML = `
            <div style="font-size:2rem;margin-bottom:4px;">${emptyHearts}</div>
            <div style="font-size:1.4rem;font-weight:bold;color:#a78bfa;margin-bottom:10px;">
                UESL Coach caught you!
            </div>
            <div style="font-size:1.1rem;color:#c4b5fd;font-style:italic;margin-bottom:12px;">
                "${taunt}"
            </div>
            <div style="font-size:0.82rem;color:#7c3aed;">Restarting level…</div>
        `;

        document.body.appendChild(overlay);
        setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 2400);
    }

    // ─── CSS injection ─────────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('uesl-coach-styles')) return;
        const style = document.createElement('style');
        style.id = 'uesl-coach-styles';
        style.textContent = `
            #uesl-heart-hud {
                position: fixed;
                top: 16px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.8rem;
                line-height: 1;
                z-index: 9999;
                pointer-events: none;
                text-shadow: 0 2px 6px rgba(0,0,0,0.7);
                animation: hudFadeIn 0.4s ease-out;
            }
            @keyframes hudFadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            .uesl-coach-bubble {
                position: fixed; transform: translateX(-50%);
                background: rgba(20,10,60,0.92); border: 2px solid #6366f1;
                border-radius: 12px; padding: 6px 14px;
                font-family: Arial, sans-serif; font-size: 0.82rem;
                font-weight: bold; color: #c4b5fd; white-space: nowrap;
                pointer-events: none; z-index: 9998;
                box-shadow: 0 0 12px rgba(99,102,241,0.5);
                animation: bubblePop 0.25s ease-out;
            }
            .uesl-coach-bubble::after {
                content: ''; position: absolute; bottom: -9px; left: 50%;
                transform: translateX(-50%); border: 5px solid transparent;
                border-top-color: #6366f1;
            }
            @keyframes bubblePop {
                from { opacity:0; transform:translateX(-50%) scale(0.7); }
                to   { opacity:1; transform:translateX(-50%) scale(1); }
            }
            @keyframes coachSlideIn {
                from { opacity:0; transform:translate(-50%,-60%) scale(0.85); }
                to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // ─── required by Enemy base ─────────────────────────────────────────────────

    jump() { /* Coach doesn't jump */ }

    // ─── cleanup ───────────────────────────────────────────────────────────────

    destroy() {
        this._stopTaunting();
        this._clearBubble();
        this._stopFlash();
        if (this._invincibleTimer) { clearTimeout(this._invincibleTimer); this._invincibleTimer = null; }
        this._destroyHeartHUD();
        super.destroy();
    }

    _findPlayer() {
        return this.gameEnv.gameObjects.find(obj => obj instanceof Player) ?? null;
    }
}

export default UESLCoach;
