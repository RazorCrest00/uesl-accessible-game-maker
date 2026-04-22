/**
 * TutorialOverlay — floating step-by-step panel that walks the player through
 * placing walls with WallPlacer and adding NPCs to the level.
 *
 * Usage:
 *   const overlay = new TutorialOverlay(backgroundObj);
 *   overlay.mount();   // adds panel to DOM
 *   overlay.destroy(); // removes it
 */
export default class TutorialOverlay {
    constructor(tutorialBg = null) {
        this.bg       = tutorialBg; // TutorialBackground instance to sync step highlights
        this.step     = 0;
        this._panel   = null;
        this._content = null;

        this.steps = [
            {
                icon:  '🧱',
                title: 'Step 1 — Place a Horizontal Wall',
                body:  'Click <strong>🖊 Place Wall</strong> in the top-right panel, then click and drag along the <span style="color:#fbbf24">gold dashed line</span> near the top of the screen.',
                hint:  'Tip: drag left-to-right for the smoothest result.',
            },
            {
                icon:  '🧱',
                title: 'Step 2 — Second Horizontal Wall',
                body:  'Place another wall along the <span style="color:#fbbf24">gold dashed line</span> in the lower-right area.',
                hint:  'Use ↩ Undo if you place it in the wrong spot.',
            },
            {
                icon:  '🚧',
                title: 'Step 3 — Place a Vertical Wall',
                body:  'Drag <strong>top-to-bottom</strong> along the <span style="color:#fbbf24">left vertical guide</span> to create a dividing wall.',
                hint:  'Vertical walls split corridors left and right.',
            },
            {
                icon:  '🚧',
                title: 'Step 4 — Second Vertical Wall',
                body:  'Drag along the <span style="color:#fbbf24">right vertical guide</span> to complete the corridor network.',
                hint:  'The dashed circles show safe NPC zones — leave those open!',
            },
            {
                icon:  '👾',
                title: 'Step 5 — NPC Zones',
                body:  'The <span style="color:#c4b5fd">purple circles</span> mark safe NPC areas. In the GameBuilder you can drag an NPC sprite into these zones.',
                hint:  'NPCs inside corridors will patrol and interact with players.',
            },
            {
                icon:  '🎉',
                title: 'Tutorial Complete!',
                body:  'You\'ve learned how to place walls and mark NPC zones. Use <strong>🗑 Clear All</strong> to reset, then design your own layout!',
                hint:  'Your walls are saved automatically — they reload next visit.',
            },
        ];
    }

    mount() {
        this._injectStyles();
        this._buildPanel();
        this._render();
    }

    _injectStyles() {
        if (document.getElementById('tut-styles')) return;
        const s = document.createElement('style');
        s.id = 'tut-styles';
        s.textContent = `
            #tut-panel {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 99997;
                width: min(480px, 92vw);
                background: rgba(10,14,26,0.96);
                border: 1px solid rgba(96,165,250,0.4);
                border-radius: 14px;
                padding: 18px 20px 14px;
                font-family: 'Segoe UI', system-ui, sans-serif;
                color: #e2e8f0;
                backdrop-filter: blur(12px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            }
            #tut-panel .tut-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }
            #tut-panel .tut-icon  { font-size: 1.6rem; line-height: 1; }
            #tut-panel .tut-title {
                font-size: 1rem;
                font-weight: 700;
                color: #60a5fa;
                margin: 0;
            }
            #tut-panel .tut-body {
                font-size: 0.88rem;
                line-height: 1.55;
                color: #cbd5e1;
                margin-bottom: 6px;
            }
            #tut-panel .tut-hint {
                font-size: 0.76rem;
                color: #64748b;
                font-style: italic;
                margin-bottom: 12px;
            }
            #tut-panel .tut-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            #tut-panel .tut-dots {
                display: flex;
                gap: 5px;
            }
            #tut-panel .tut-dot {
                width: 7px; height: 7px;
                border-radius: 50%;
                background: rgba(255,255,255,0.15);
                transition: background 0.2s;
            }
            #tut-panel .tut-dot.active { background: #60a5fa; }
            #tut-panel .tut-dot.done   { background: #4ade80; }
            #tut-panel .tut-btns { display: flex; gap: 8px; }
            #tut-panel button {
                padding: 6px 16px;
                border-radius: 8px;
                border: none;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            }
            #tut-next {
                background: #3b82f6;
                color: #fff;
            }
            #tut-next:hover { background: #2563eb; }
            #tut-skip {
                background: rgba(255,255,255,0.08);
                color: #94a3b8;
            }
            #tut-skip:hover { background: rgba(255,255,255,0.14); }
        `;
        document.head.appendChild(s);
    }

    _buildPanel() {
        this._panel = document.createElement('div');
        this._panel.id = 'tut-panel';
        document.body.appendChild(this._panel);
    }

    _render() {
        const s = this.steps[this.step] || this.steps[this.steps.length - 1];
        const isLast = this.step >= this.steps.length - 1;

        const dots = this.steps.map((_, i) => {
            const cls = i < this.step ? 'tut-dot done'
                      : i === this.step ? 'tut-dot active'
                      : 'tut-dot';
            return `<div class="${cls}"></div>`;
        }).join('');

        this._panel.innerHTML = `
            <div class="tut-header">
                <span class="tut-icon">${s.icon}</span>
                <p class="tut-title">${s.title}</p>
            </div>
            <p class="tut-body">${s.body}</p>
            <p class="tut-hint">${s.hint}</p>
            <div class="tut-footer">
                <div class="tut-dots">${dots}</div>
                <div class="tut-btns">
                    ${!isLast ? `<button id="tut-skip">Skip</button>` : ''}
                    <button id="tut-next">${isLast ? 'Done ✓' : 'Next →'}</button>
                </div>
            </div>
        `;

        document.getElementById('tut-next')?.addEventListener('click', () => {
            if (isLast) { this.destroy(); return; }
            this._advance();
        });
        document.getElementById('tut-skip')?.addEventListener('click', () => this.destroy());

        // Sync guide-line highlight on the background canvas
        if (this.bg) this.bg.setStep(this.step);
    }

    _advance() {
        this.step = Math.min(this.step + 1, this.steps.length - 1);
        this._render();
    }

    destroy() {
        this._panel?.remove();
        document.getElementById('tut-styles')?.remove();
    }
}
