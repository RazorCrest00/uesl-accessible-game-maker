/**
 * WallPlacer — in-game collision wall placement tool.
 *
 * Usage:
 *   import WallPlacer from '.../WallPlacer.js';
 *   const wp = new WallPlacer(gameContainer, path, barrierImportPath);
 *   wp.watchGame(gameInstance);   // polls until gameEnv is ready
 */

const STORAGE_KEY = 'datastream_placed_walls';

class WallPlacer {

    constructor(gameContainer, path = '', barrierPath = '') {
        this.gameContainer = gameContainer;
        this.path          = path;
        this.barrierPath   = barrierPath;
        this.Barrier       = null;
        this.gameEnv       = null;
        this._gameInstance = null;
        this._pollTimer    = null;
        this._lastEnvId    = null;

        this.walls         = [];
        this.isPlacing     = false;
        this.isDrawing     = false;
        this.wallsVisible  = true;
        this._startX = 0;
        this._startY = 0;

        this._injectStyles();
        this._buildPanel();
        this._buildOverlay();   // fixed-pos overlay on <body>
        this._bindDrawEvents();
    }

    // ─── Public ────────────────────────────────────────────────────────────────

    watchGame(gameInstance) {
        this._gameInstance = gameInstance;
        this._startPolling();
    }

    destroy() {
        this._stopPolling();
        this._panel?.remove();
        this._overlay?.remove();
    }

    // ─── Polling ───────────────────────────────────────────────────────────────

    _startPolling() {
        this._stopPolling();
        this._pollTimer = setInterval(() => this._poll(), 300);
    }

    _stopPolling() {
        if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    }

    _poll() {
        if (!this._gameInstance) return;

        const ctrl = this._gameInstance.gameControl
                  || this._gameInstance.activeGameControl;
        if (!ctrl) return;

        const env = ctrl.currentLevel?.gameEnv
                 || ctrl.gameEnv;
        if (!env) return;

        // Unique fingerprint for this level's canvas
        const envId = env.canvasId || env.canvas?.id || env.innerWidth + 'x' + env.innerHeight;
        if (envId === this._lastEnvId) return;

        this._lastEnvId = envId;
        this.gameEnv    = env;
        this.walls      = [];
        this._loadSaved();
        this._updateStatus('ready');
    }

    // ─── Styles ────────────────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('wp-styles')) return;
        const s = document.createElement('style');
        s.id = 'wp-styles';
        s.textContent = `
            #wp-panel {
                position: fixed;
                top: 70px;
                right: 14px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 5px;
                background: rgba(10,10,22,0.95);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 10px;
                padding: 10px 8px 8px;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', system-ui, sans-serif;
                user-select: none;
                min-width: 130px;
            }
            #wp-panel .wp-title {
                color: #a78bfa;
                font-weight: 700;
                font-size: 0.78rem;
                text-align: center;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                margin-bottom: 2px;
            }
            #wp-panel .wp-status {
                font-size: 0.65rem;
                text-align: center;
                color: #64748b;
                padding: 0 2px 3px;
            }
            #wp-panel .wp-status.ready  { color: #4ade80; }
            #wp-panel .wp-status.active { color: #fbbf24; }
            #wp-panel button {
                background: rgba(255,255,255,0.07);
                color: #dde;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px;
                padding: 5px 9px;
                cursor: pointer;
                font-size: 0.73rem;
                white-space: nowrap;
                text-align: left;
                transition: background 0.15s, border-color 0.15s;
            }
            #wp-panel button:hover  { background: rgba(167,139,250,0.18); border-color: rgba(167,139,250,0.4); }
            #wp-panel button.active { background: rgba(167,139,250,0.28); border-color: #a78bfa; color: #fff; }

            #wp-overlay {
                position: fixed;
                z-index: 99998;
                display: none;
                cursor: crosshair;
                /* background intentionally transparent */
            }
            #wp-preview {
                position: absolute;
                border: 2px dashed #a78bfa;
                background: rgba(167,139,250,0.1);
                box-sizing: border-box;
                pointer-events: none;
                display: none;
            }
        `;
        document.head.appendChild(s);
    }

    // ─── Panel ─────────────────────────────────────────────────────────────────

    _buildPanel() {
        const p = document.createElement('div');
        p.id = 'wp-panel';

        const title = document.createElement('div');
        title.className = 'wp-title';
        title.textContent = '🧱 Walls';
        p.appendChild(title);

        this._statusEl = document.createElement('div');
        this._statusEl.className = 'wp-status';
        this._statusEl.textContent = 'loading…';
        p.appendChild(this._statusEl);

        this._placeBtn = this._mkBtn('🖊 Place Wall',  () => this._togglePlacing());
        this._visBtn   = this._mkBtn('👁 Hide Walls',  () => this._toggleVisibility());
        this._undoBtn  = this._mkBtn('↩ Undo Last',   () => this._undo());
        this._clearBtn = this._mkBtn('🗑 Clear All',   () => this._clearAll());

        [this._placeBtn, this._visBtn, this._undoBtn, this._clearBtn].forEach(b => p.appendChild(b));
        document.body.appendChild(p);
        this._panel = p;
    }

    _mkBtn(text, fn) {
        const b = document.createElement('button');
        b.textContent = text;
        b.addEventListener('click', fn);
        return b;
    }

    _updateStatus(state) {
        const map = { loading: ['loading…', ''], ready: ['✓ game ready', 'ready'], active: ['✏ drawing…', 'active'] };
        const [txt, cls] = map[state] || ['', ''];
        this._statusEl.textContent  = txt;
        this._statusEl.className    = 'wp-status' + (cls ? ' ' + cls : '');
    }

    // ─── Overlay (fixed, body-level) ────────────────────────────────────────────

    _buildOverlay() {
        this._overlay = document.createElement('div');
        this._overlay.id = 'wp-overlay';

        this._preview = document.createElement('div');
        this._preview.id = 'wp-preview';
        this._overlay.appendChild(this._preview);

        document.body.appendChild(this._overlay);
    }

    /** Resize the fixed overlay to sit exactly over the game container */
    _fitOverlay() {
        const r = this.gameContainer.getBoundingClientRect();
        Object.assign(this._overlay.style, {
            left:   r.left   + 'px',
            top:    r.top    + 'px',
            width:  r.width  + 'px',
            height: r.height + 'px',
        });
    }

    // ─── Draw Events ────────────────────────────────────────────────────────────

    _bindDrawEvents() {
        // mousedown on the overlay itself
        this._overlay.addEventListener('mousedown', (e) => {
            if (!this.isPlacing) return;
            e.preventDefault();
            e.stopPropagation();
            this._startX = e.clientX - this._overlay.getBoundingClientRect().left;
            this._startY = e.clientY - this._overlay.getBoundingClientRect().top;
            this.isDrawing = true;
            Object.assign(this._preview.style, {
                left: this._startX + 'px', top: this._startY + 'px',
                width: '0', height: '0', display: 'block',
            });
            this._updateStatus('active');
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const or = this._overlay.getBoundingClientRect();
            const cx = e.clientX - or.left;
            const cy = e.clientY - or.top;
            Object.assign(this._preview.style, {
                left:   Math.min(this._startX, cx) + 'px',
                top:    Math.min(this._startY, cy) + 'px',
                width:  Math.abs(cx - this._startX) + 'px',
                height: Math.abs(cy - this._startY) + 'px',
            });
        });

        window.addEventListener('mouseup', (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this._preview.style.display = 'none';
            this._updateStatus('active');

            const or = this._overlay.getBoundingClientRect();
            const cx = e.clientX - or.left;
            const cy = e.clientY - or.top;
            const x  = Math.min(this._startX, cx);
            const y  = Math.min(this._startY, cy);
            const w  = Math.abs(cx - this._startX);
            const h  = Math.abs(cy - this._startY);

            if (w >= 6 && h >= 6) {
                this._placeWall(x, y, w, h);
            } else {
                this._updateStatus('ready');
            }
        });
    }

    // ─── Toggle Actions ────────────────────────────────────────────────────────

    _togglePlacing() {
        this.isPlacing = !this.isPlacing;

        if (this.isPlacing) {
            this._fitOverlay();   // snap overlay to current game area
            this._overlay.style.display = 'block';
            this._placeBtn.textContent  = '✅ Stop Placing';
            this._placeBtn.classList.add('active');
            this._updateStatus('active');
        } else {
            this._overlay.style.display = 'none';
            this._placeBtn.textContent  = '🖊 Place Wall';
            this._placeBtn.classList.remove('active');
            this.isDrawing = false;
            this._preview.style.display = 'none';
            this._updateStatus('ready');
        }
    }

    _toggleVisibility() {
        this.wallsVisible = !this.wallsVisible;
        this._visBtn.textContent = this.wallsVisible ? '👁 Hide Walls' : '👁 Show Walls';
        this.walls.forEach(({ barrier }) => {
            barrier.visible = this.wallsVisible;
            barrier.draw();
        });
    }

    _undo() {
        if (!this.walls.length) return;
        const { barrier } = this.walls.pop();
        barrier.destroy();
        this._save();
    }

    _clearAll() {
        if (!this.walls.length) return;
        this.walls.forEach(({ barrier }) => barrier.destroy());
        this.walls = [];
        this._save();
    }

    // ─── Wall Creation ─────────────────────────────────────────────────────────

    async _placeWall(x, y, w, h) {
        if (!this.gameEnv) {
            this._updateStatus('ready');
            return;
        }

        if (!this.Barrier) {
            try {
                const mod = await import(this.barrierPath);
                this.Barrier = mod.default;
            } catch (err) {
                console.warn('[WallPlacer] Barrier import failed:', err);
                this._updateStatus('ready');
                return;
            }
        }

        const topOffset = this.gameEnv.top || 0;
        const data = {
            id:     `wp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            x:      Math.round(x),
            y:      Math.round(y - topOffset),
            width:  Math.round(w),
            height: Math.round(h),
            color:  'rgba(255, 80, 80, 0.3)',
            visible: this.wallsVisible,
            hitbox:  { widthPercentage: 0.0, heightPercentage: 0.0 },
            zIndex: '11',
        };

        const barrier = new this.Barrier(data, this.gameEnv);
        this.gameEnv.gameObjects.push(barrier);
        this.walls.push({ barrier, data });
        this._save();
        this._updateStatus('ready');
    }

    // ─── Persistence ───────────────────────────────────────────────────────────

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.walls.map(e => e.data)));
        } catch (_) {}
    }

    async _loadSaved() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!Array.isArray(saved) || !saved.length) return;

            if (!this.Barrier) {
                const mod = await import(this.barrierPath);
                this.Barrier = mod.default;
            }

            for (const data of saved) {
                if (!data.id || data.width < 1 || data.height < 1) continue;
                const d = { ...data, visible: this.wallsVisible };
                const barrier = new this.Barrier(d, this.gameEnv);
                this.gameEnv.gameObjects.push(barrier);
                this.walls.push({ barrier, data: d });
            }
        } catch (_) {}
    }
}

export default WallPlacer;
