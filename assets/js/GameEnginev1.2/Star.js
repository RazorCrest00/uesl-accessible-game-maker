import Npc from './essentials/Npc.js';
import Player from './essentials/Player.js';

/**
 * Star — a collectible that permanently disappears on player contact.
 *
 * When all stars in the level are collected a "YOU WIN!" overlay is shown
 * and the level is restarted after a short delay.
 *
 * Config (beyond standard Character fields):
 *   INIT_POSITION  {x, y}  fractional coords (0-1) of canvas size
 *   SCALE_FACTOR   {number} controls rendered size (default: 16)
 *   color          {string} fill colour of the star (default: '#FFD700')
 *   zIndex         {number} CSS z-index (default: 50)
 */
class Star extends Npc {
    constructor(data = null, gameEnv = null) {
        const starData = {
            id: data?.id || 'star',
            greeting: false,
            INIT_POSITION: data?.INIT_POSITION || { x: 0.5, y: 0.5 },
            SCALE_FACTOR: data?.SCALE_FACTOR || 16,
            pixels: { width: 100, height: 100 },
            orientation: { rows: 1, columns: 1 },
            down: { row: 0, start: 0, columns: 1 },
            hitbox: data?.hitbox || { widthPercentage: 0.15, heightPercentage: 0.15 },
            ...data,
        };

        super(starData, gameEnv);

        this.color       = data?.color || '#FFD700';
        this._collected  = false;
        this._pulse      = 0;   // animation phase

        if (data?.zIndex !== undefined) {
            this.canvas.style.zIndex = String(data.zIndex);
        } else {
            this.canvas.style.zIndex = '50';
        }

        // Register this star in the level-wide star tracker
        if (this.gameEnv) {
            if (!this.gameEnv.stats) this.gameEnv.stats = {};
            this.gameEnv.stats.starsTotal      = (this.gameEnv.stats.starsTotal      || 0) + 1;
            this.gameEnv.stats.starsCollected  = (this.gameEnv.stats.starsCollected  || 0);
        }
    }

    // ─── game loop ────────────────────────────────────────────────────────────

    update() {
        if (this._collected) return;
        this._pulse = (this._pulse + 0.07) % (Math.PI * 2);
        this.draw();
        this._checkPlayerCollision();
    }

    draw() {
        if (!this.ctx || this._collected) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const outerR = Math.min(w, h) / 2.4 + Math.sin(this._pulse) * 1.5;
        const innerR = outerR * 0.42;
        const spikes  = 5;

        this.ctx.save();
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur  = 8 + Math.sin(this._pulse) * 4;

        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r     = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x     = cx + Math.cos(angle) * r;
            const y     = cy + Math.sin(angle) * r;
            i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();

        this.ctx.fillStyle   = this.color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#B8860B';
        this.ctx.lineWidth   = 1.5;
        this.ctx.stroke();

        this.ctx.restore();
        this.setupCanvas();
    }

    // ─── collection logic ─────────────────────────────────────────────────────

    _checkPlayerCollision() {
        for (const obj of this.gameEnv.gameObjects) {
            const id = String(obj?.id ?? obj?.spriteData?.id ?? '').toLowerCase();
            const isPlayer = obj instanceof Player
                || id.includes('player')
                || id.includes('chill guy')
                || id.includes('tux');
            if (!isPlayer) continue;

            this.isCollision(obj);
            if (this.collisionData.hit) {
                this._collect();
                return;
            }
        }
    }

    _collect() {
        this._collected = true;
        // Hide canvas immediately
        if (this.canvas) this.canvas.style.display = 'none';

        if (this.gameEnv) {
            if (!this.gameEnv.stats) this.gameEnv.stats = {};
            this.gameEnv.stats.starsCollected = (this.gameEnv.stats.starsCollected || 0) + 1;

            const collected = this.gameEnv.stats.starsCollected;
            const total     = this.gameEnv.stats.starsTotal || 1;

            this._showCollectParticle();

            if (collected >= total) {
                // All stars collected — show win overlay then restart
                setTimeout(() => this._showWinOverlay(), 200);
            }
        }
    }

    // ─── overlays ─────────────────────────────────────────────────────────────

    _showCollectParticle() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const div  = document.createElement('div');
        div.textContent = '⭐';
        Object.assign(div.style, {
            position: 'fixed',
            left:     `${rect.left + rect.width  / 2}px`,
            top:      `${rect.top  + rect.height / 2}px`,
            fontSize: '1.6rem',
            pointerEvents: 'none',
            zIndex: '9999',
            transform: 'translate(-50%, -50%)',
            animation: 'star-pop 0.6s ease-out forwards',
        });
        document.body.appendChild(div);

        // Inject animation keyframes once
        if (!document.getElementById('star-collect-styles')) {
            const s = document.createElement('style');
            s.id = 'star-collect-styles';
            s.textContent = `
                @keyframes star-pop {
                    0%   { opacity:1; transform:translate(-50%,-50%) scale(1);   }
                    100% { opacity:0; transform:translate(-50%,-200%) scale(1.8); }
                }
            `;
            document.head.appendChild(s);
        }

        setTimeout(() => div.remove(), 700);
    }

    _showWinOverlay() {
        document.getElementById('star-win-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'star-win-overlay';
        Object.assign(overlay.style, {
            position:    'fixed',
            top:         '50%',
            left:        '50%',
            transform:   'translate(-50%, -50%)',
            background:  'rgba(10, 5, 40, 0.97)',
            border:      '3px solid #facc15',
            borderRadius:'20px',
            padding:     '36px 48px',
            textAlign:   'center',
            zIndex:      '10001',
            fontFamily:  'Arial, sans-serif',
            color:       '#fef9c3',
            boxShadow:   '0 0 60px rgba(250,204,21,0.6)',
            minWidth:    '300px',
            animation:   'star-win-in 0.45s ease-out',
        });

        overlay.innerHTML = `
            <div style="font-size:3.5rem;margin-bottom:8px;">⭐</div>
            <div style="font-size:1.8rem;font-weight:bold;color:#facc15;margin-bottom:10px;">
                YOU WIN!
            </div>
            <div style="font-size:1.05rem;color:#fde68a;margin-bottom:14px;">
                All stars collected — great job!
            </div>
            <div style="font-size:0.85rem;color:#a16207;">Restarting level…</div>
        `;

        // Inject animation keyframes once
        if (!document.getElementById('star-win-styles')) {
            const s = document.createElement('style');
            s.id = 'star-win-styles';
            s.textContent = `
                @keyframes star-win-in {
                    from { opacity:0; transform:translate(-50%,-65%) scale(0.8); }
                    to   { opacity:1; transform:translate(-50%,-50%) scale(1);   }
                }
            `;
            document.head.appendChild(s);
        }

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
            try {
                const gc = this.gameEnv?.gameControl;
                if (gc && typeof gc.transitionToLevel === 'function') {
                    // Reset star stats before restarting so the new level counts fresh
                    if (this.gameEnv.stats) {
                        this.gameEnv.stats.starsTotal     = 0;
                        this.gameEnv.stats.starsCollected = 0;
                    }
                    gc.transitionToLevel();
                }
            } catch (_) {}
        }, 2800);
    }

    // ─── cleanup ──────────────────────────────────────────────────────────────

    destroy() {
        this._collected = true;
        super.destroy();
    }
}

export default Star;
export { Star };
