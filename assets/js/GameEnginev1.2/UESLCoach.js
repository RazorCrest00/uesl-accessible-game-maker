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
 *  - On contact: delivers an AI "caught you" taunt, then restarts the level.
 *
 * Sprite data config (beyond standard Character fields):
 *   chaseRange   {number}  px radius at which coach starts chasing  (default: 300)
 *   chaseSpeed   {number}  px/frame in chase mode                   (default: 2.5)
 *   patrolSpeed  {number}  px/frame while patrolling                (default: 1.2)
 *   walkingArea  {object}  { xMin, xMax, yMin, yMax } patrol zone
 *   tauntInterval{number}  ms between AI taunts while chasing       (default: 4500)
 */
class UESLCoach extends Enemy {
    constructor(data = null, gameEnv = null) {
        super(data, gameEnv);

        this.chaseRange    = data?.chaseRange    ?? 300;
        this.chaseSpeed    = data?.chaseSpeed    ?? 2.5;
        this.patrolSpeed   = data?.patrolSpeed   ?? 1.2;
        this.walkingArea   = data?.walkingArea   ?? null;
        this.tauntInterval = data?.tauntInterval ?? 4500;

        this._patrolDir      = 1;
        this._caughtHandled  = false;
        this._isChasing      = false;
        this._tauntTimer     = null;
        this._bubble         = null;
        this._bubbleTimeout  = null;
        this._fetchingTaunt  = false;

        this._injectStyles();
    }

    // ─── game loop ─────────────────────────────────────────────────────────────

    update() {
        this._updateAI();
        this.draw();

        if (!this._caughtHandled && this.collisionChecks()) {
            this.handleCollisionEvent();
        }

        this.stayWithinCanvas();
        this._updateBubblePosition();
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
            // Entered chase range
            if (!this._isChasing) {
                this._isChasing = true;
                this._startTaunting();
                this._triggerTaunt('nearby');   // immediate "I see you" taunt
            }
            this._chase(dx, dy, dist);
        } else {
            // Left chase range
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

    // ─── collision ─────────────────────────────────────────────────────────────

    handleCollisionEvent() {
        if (this._caughtHandled) return;
        this._caughtHandled = true;

        this.velocity.x = 0;
        this.velocity.y = 0;
        this._stopTaunting();
        this._clearBubble();

        // Fetch a "caught" AI taunt, then show the overlay
        this._fetchTaunt('caught').then(taunt => {
            this._showCaughtOverlay(taunt, () => {
                this.gameEnv.gameControl.currentLevel.restart = true;
            });
        });
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
            const res = await fetch(`${pythonURI}/api/ainpc/coach-taunt`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ context }),
            });
            const data = await res.json();
            return data.taunt || this._fallbackTaunt(context);
        } catch {
            return this._fallbackTaunt(context);
        }
    }

    _fallbackTaunt(context) {
        const bank = {
            chasing: [
                "You can't outrun me!",
                "This level ends NOW!",
                "Speed won't save you!",
                "I ALWAYS catch my players!",
                "Nowhere left to run!",
            ],
            caught: [
                "Got you. Game over.",
                "Did you really think you'd win?",
                "Back to the start!",
            ],
            nearby: [
                "I see you…",
                "Oh, you're close.",
                "Found you.",
            ],
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

        // Auto-dismiss after 3.5 s
        this._bubbleTimeout = setTimeout(() => this._clearBubble(), 3500);
    }

    _updateBubblePosition() {
        if (!this._bubble || !this.canvas) return;

        const rect   = this.canvas.getBoundingClientRect();
        // Scale coach position to screen coords
        const scaleX = rect.width  / (this.gameEnv.innerWidth  || 1);
        const scaleY = rect.height / (this.gameEnv.innerHeight || 1);

        const screenX = rect.left + this.position.x * scaleX + (this.width  * scaleX) / 2;
        const screenY = rect.top  + this.position.y * scaleY - 14;   // 14px above sprite

        this._bubble.style.left = `${screenX}px`;
        this._bubble.style.top  = `${screenY}px`;
    }

    _clearBubble() {
        if (this._bubbleTimeout) {
            clearTimeout(this._bubbleTimeout);
            this._bubbleTimeout = null;
        }
        if (this._bubble) {
            this._bubble.remove();
            this._bubble = null;
        }
    }

    // ─── caught overlay ────────────────────────────────────────────────────────

    _showCaughtOverlay(taunt, onDone) {
        document.getElementById('uesl-coach-caught')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'uesl-coach-caught';
        Object.assign(overlay.style, {
            position:     'fixed',
            top:          '50%',
            left:         '50%',
            transform:    'translate(-50%, -50%)',
            background:   'rgba(20, 10, 60, 0.96)',
            border:       '3px solid #6366f1',
            borderRadius: '16px',
            padding:      '28px 36px',
            textAlign:    'center',
            zIndex:       '10000',
            fontFamily:   'Arial, sans-serif',
            color:        '#e2e8f0',
            boxShadow:    '0 0 48px rgba(99,102,241,0.7)',
            minWidth:     '320px',
            animation:    'coachSlideIn 0.4s ease-out',
        });

        overlay.innerHTML = `
            <div style="font-size:3rem; margin-bottom:6px;">🎮</div>
            <div style="font-size:1.4rem; font-weight:bold; color:#a78bfa; margin-bottom:10px;">
                UESL Coach caught you!
            </div>
            <div style="font-size:1.1rem; color:#c4b5fd; font-style:italic; margin-bottom:12px;">
                "${taunt}"
            </div>
            <div style="font-size:0.82rem; color:#7c3aed;">Restarting level…</div>
        `;

        document.body.appendChild(overlay);
        setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 2400);
    }

    // ─── CSS injection ─────────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('uesl-coach-styles')) return;

        const style = document.createElement('style');
        style.id    = 'uesl-coach-styles';
        style.textContent = `
            .uesl-coach-bubble {
                position: fixed;
                transform: translateX(-50%);
                background: rgba(20, 10, 60, 0.92);
                border: 2px solid #6366f1;
                border-radius: 12px;
                padding: 6px 14px;
                font-family: Arial, sans-serif;
                font-size: 0.82rem;
                font-weight: bold;
                color: #c4b5fd;
                white-space: nowrap;
                pointer-events: none;
                z-index: 9998;
                box-shadow: 0 0 12px rgba(99,102,241,0.5);
                animation: bubblePop 0.25s ease-out;
            }
            .uesl-coach-bubble::after {
                content: '';
                position: absolute;
                bottom: -9px;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: #6366f1;
            }
            @keyframes bubblePop {
                from { opacity: 0; transform: translateX(-50%) scale(0.7); }
                to   { opacity: 1; transform: translateX(-50%) scale(1); }
            }
            @keyframes coachSlideIn {
                from { opacity: 0; transform: translate(-50%, -60%) scale(0.85); }
                to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // ─── required by Enemy base ─────────────────────────────────────────────────

    jump() { /* Coach doesn't jump — he walks toward you */ }

    // ─── cleanup ───────────────────────────────────────────────────────────────

    destroy() {
        this._stopTaunting();
        this._clearBubble();
        super.destroy();
    }

    // ─── helper ────────────────────────────────────────────────────────────────

    _findPlayer() {
        return this.gameEnv.gameObjects.find(obj => obj instanceof Player) ?? null;
    }
}

export default UESLCoach;
