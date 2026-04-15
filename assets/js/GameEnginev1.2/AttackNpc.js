// AttackNpc.js — Route-following NPC that damages the player on contact.
// Follows user-drawn waypoints; removes a heart each time it touches the player.
// Multiple AttackNpcs in the same level share one heart HUD and one invincibility window.
import Npc from './essentials/Npc.js';

// ─── module-level shared state ────────────────────────────────────────────────
// These live on the module (not window) so they reset cleanly when the module
// reloads (i.e. on level transition) without polluting the global namespace.
let _sharedHearts     = null;   // null = "not yet initialised this level"
let _sharedInvincible = false;
let _sharedInvMs      = 2000;
let _flashInterval    = null;
let _invincibleTimer  = null;
let _caughtHandled    = false;

function _resetSharedState(maxHearts, invincibleMs) {
    _sharedHearts     = maxHearts;
    _sharedInvincible = false;
    _sharedInvMs      = invincibleMs;
    _flashInterval    = null;
    _invincibleTimer  = null;
    _caughtHandled    = false;
}

// ─── class ────────────────────────────────────────────────────────────────────

class AttackNpc extends Npc {
    /**
     * data fields (beyond standard Npc / Character fields):
     *   maxHearts    {number}  shared heart pool (default 3) — only first
     *                          AttackNpc in a level sets this
     *   invincibleMs {number}  ms of player invincibility after a hit (default 2000)
     *   speed        {number}  waypoint patrol speed in px/frame (default 1.5)
     *   waypoints    {Array}   [{x,y}] game-space waypoints to patrol
     */
    constructor(data = null, gameEnv = null) {
        super(data, gameEnv);

        const maxHearts   = data?.maxHearts    ?? 3;
        const invincibleMs = data?.invincibleMs ?? 2000;

        // First AttackNpc to construct this level initialises the shared pool
        if (_sharedHearts === null) {
            _resetSharedState(maxHearts, invincibleMs);
        }

        this._maxHearts = maxHearts;
        this._injectStyles();
        this._initHeartHUD();
        this._renderHearts();
    }

    // ─── styles ──────────────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('attack-npc-styles')) return;
        const style = document.createElement('style');
        style.id = 'attack-npc-styles';
        style.textContent = `
            #uesl-heart-hud {
                position: fixed;
                top: 16px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.8rem;
                z-index: 9999;
                pointer-events: none;
                text-shadow: 0 2px 6px rgba(0,0,0,.6);
                letter-spacing: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    // ─── heart HUD ───────────────────────────────────────────────────────────

    _initHeartHUD() {
        // Reuse an existing HUD (UESLCoach or prior AttackNpc may have created it)
        let hud = document.getElementById('uesl-heart-hud');
        if (!hud) {
            hud = document.createElement('div');
            hud.id = 'uesl-heart-hud';
            document.body.appendChild(hud);
        }
        this._heartHUD = hud;
    }

    _renderHearts() {
        if (!this._heartHUD) return;
        const hearts = [];
        for (let i = 0; i < this._maxHearts; i++) {
            hearts.push(i < _sharedHearts ? '❤️' : '🖤');
        }
        this._heartHUD.textContent = hearts.join(' ');
    }

    // ─── game loop ───────────────────────────────────────────────────────────

    update() {
        super.update(); // waypointPatrol / patrol + draw (from Npc)

        if (!_caughtHandled && !_sharedInvincible) {
            if (this._isTouchingPlayer()) {
                this._handleHit();
            }
        }
    }

    // ─── collision ───────────────────────────────────────────────────────────

    _isTouchingPlayer() {
        const player = this._findPlayer();
        if (!player) return false;

        const shrink = 0.25;
        const cL = this.position.x + this.width  * shrink;
        const cR = this.position.x + this.width  * (1 - shrink);
        const cT = this.position.y + this.height * shrink;
        const cB = this.position.y + this.height;

        const pL = player.position.x + player.width  * shrink;
        const pR = player.position.x + player.width  * (1 - shrink);
        const pT = player.position.y + player.height * shrink;
        const pB = player.position.y + player.height;

        return cL < pR && cR > pL && cT < pB && cB > pT;
    }

    _findPlayer() {
        return (this.gameEnv?.gameObjects || []).find(
            obj => obj && obj.constructor && (
                obj.constructor.name === 'Player' ||
                obj.isPlayer === true
            )
        ) || null;
    }

    // ─── damage ──────────────────────────────────────────────────────────────

    _handleHit() {
        _sharedHearts = Math.max(0, _sharedHearts - 1);
        this._renderHearts();
        this._startInvincibility();

        if (_sharedHearts <= 0) {
            _caughtHandled = true;
            this._onGameOver();
        }
    }

    _startInvincibility() {
        _sharedInvincible = true;

        // Flash the player canvas to signal damage
        const player = this._findPlayer();
        if (player?.canvas) {
            let visible = true;
            _flashInterval = setInterval(() => {
                if (player.canvas) player.canvas.style.opacity = visible ? '1' : '0.2';
                visible = !visible;
            }, 120);
        }

        _invincibleTimer = setTimeout(() => {
            _sharedInvincible = false;
            this._stopFlash();
        }, _sharedInvMs);
    }

    _stopFlash() {
        if (_flashInterval) { clearInterval(_flashInterval); _flashInterval = null; }
        const player = this._findPlayer();
        if (player?.canvas) player.canvas.style.opacity = '1';
    }

    // ─── game over ───────────────────────────────────────────────────────────

    _onGameOver() {
        this._stopFlash();

        // Remove HUD immediately so it doesn't flash the wrong state
        this._heartHUD?.remove();
        this._heartHUD = null;

        // Reset shared state so next level run starts fresh
        _sharedHearts = null;

        const gameControl = this.gameEnv?.gameControl;
        if (gameControl) {
            // Defer the transition so we don't restart the level from inside
            // update() / gameLoop() — calling transitionToLevel() synchronously
            // mid-frame leaves stale game-object references on the call stack.
            setTimeout(() => gameControl.transitionToLevel(), 0);
        }
    }

    // ─── cleanup ─────────────────────────────────────────────────────────────

    destroy() {
        if (_invincibleTimer) { clearTimeout(_invincibleTimer); _invincibleTimer = null; }
        this._stopFlash();

        // Always reset shared state on destroy so the next game run starts clean.
        // Without this: stopping mid-game leaves _sharedInvincible=true (player
        // permanently unhittable on restart) or _sharedHearts too low.
        _sharedHearts     = null;   // triggers _resetSharedState on next constructor call
        _sharedInvincible = false;
        _caughtHandled    = false;
        if (_flashInterval) { clearInterval(_flashInterval); _flashInterval = null; }

        // Remove the HUD so it doesn't linger after the game stops
        this._heartHUD?.remove();
        this._heartHUD = null;

        super.destroy();
    }
}

export default AttackNpc;
