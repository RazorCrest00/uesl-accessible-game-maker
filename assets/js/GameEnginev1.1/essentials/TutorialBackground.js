import GameObject from './GameObject.js';

/**
 * TutorialBackground — draws a wall-and-NPC placement guide on its own canvas
 * (same pattern as Background.js).  Guide lines show exactly where to drag with
 * the WallPlacer tool.  Call setStep(n) to highlight the active guide.
 */
export default class TutorialBackground extends GameObject {

    constructor(data = null, gameEnv = null) {
        super(gameEnv);
        this.step = 0;

        // Own canvas, layered like Background
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'tutorial-background';
        this.canvas.style.position = 'absolute';
        this.canvas.style.zIndex   = '1';
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this._alignCanvas();
        this.gameEnv.container.appendChild(this.canvas);
        this.draw();
    }

    setStep(step) {
        this.step = step;
        this.draw();
    }

    _alignCanvas() {
        const gc = this.gameEnv.canvas;
        if (!gc) return;
        this.canvas.width  = gc.width;
        this.canvas.height = gc.height;
        this.canvas.style.left = gc.style.left || '0px';
        this.canvas.style.top  = gc.style.top  || '0px';
    }

    update() { this.draw(); }
    resize() { this._alignCanvas(); this.draw(); }

    draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        const W = this.canvas.width  || this.gameEnv.innerWidth;
        const H = this.canvas.height || this.gameEnv.innerHeight;

        ctx.clearRect(0, 0, W, H);

        // ── Background ────────────────────────────────────────────────────────
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, W, H);

        // Subtle dot grid
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        const gs = Math.round(W / 28);
        for (let x = gs; x < W; x += gs)
            for (let y = gs; y < H; y += gs)
                { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }

        // Outer border
        ctx.strokeStyle = 'rgba(96,165,250,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, W - 36, H - 36);

        // ── Guide lines ───────────────────────────────────────────────────────
        // { x1,y1,x2,y2 as 0-1 fractions, label, align, step }
        const guides = [
            { x1:.08, y1:.28, x2:.60, y2:.28, label:'← Drag wall here →', align:'above', step:0 },
            { x1:.42, y1:.62, x2:.92, y2:.62, label:'← Drag wall here →', align:'below', step:1 },
            { x1:.32, y1:.06, x2:.32, y2:.58, label:'Drag wall here ↓',   align:'right',  step:2 },
            { x1:.68, y1:.42, x2:.68, y2:.94, label:'Drag wall here ↓',   align:'left',   step:3 },
        ];

        guides.forEach(g => {
            const x1 = g.x1 * W, y1 = g.y1 * H;
            const x2 = g.x2 * W, y2 = g.y2 * H;
            const active = this.step === g.step;
            const done   = this.step >  g.step;

            const color = done   ? '#4ade80'
                        : active ? '#fbbf24'
                        :          'rgba(99,179,237,0.35)';

            // Dashed line
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth   = active ? 3 : 2;
            ctx.setLineDash(active ? [14,6] : [8,8]);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.setLineDash([]);

            // End-cap circles
            [[x1,y1],[x2,y2]].forEach(([px,py]) => {
                ctx.beginPath(); ctx.arc(px, py, active ? 5 : 3, 0, Math.PI*2);
                ctx.fillStyle = color; ctx.fill();
            });

            // Label
            const lx = (x1+x2)/2, ly = (y1+y2)/2;
            ctx.font = `${active ? 'bold ' : ''}${active ? 13 : 11}px 'Segoe UI',system-ui`;
            ctx.fillStyle = done ? '#4ade80' : active ? '#fbbf24' : 'rgba(148,163,184,0.6)';
            ctx.textAlign  = 'center';
            ctx.textBaseline = 'middle';

            let tx = lx, ty = ly;
            if (g.align === 'above') ty = ly - 16;
            if (g.align === 'below') ty = ly + 16;
            if (g.align === 'right') tx = lx + 20;
            if (g.align === 'left')  tx = lx - 20;

            ctx.fillText(done ? '✓ Done' : g.label, tx, ty);
            ctx.restore();
        });

        // ── NPC zones (visible from step 4 onward) ────────────────────────────
        if (this.step >= 4) {
            const zones = [
                { cx:.14, cy:.14, label:'NPC Zone A' },
                { cx:.82, cy:.18, label:'NPC Zone B' },
                { cx:.54, cy:.82, label:'NPC Zone C' },
            ];
            zones.forEach(z => {
                const cx = z.cx * W, cy = z.cy * H;
                const r  = Math.min(W, H) * 0.065;
                ctx.save();
                ctx.strokeStyle = 'rgba(167,139,250,0.7)';
                ctx.lineWidth = 2;
                ctx.setLineDash([6,5]);
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.font = 'bold 12px system-ui';
                ctx.fillStyle = '#c4b5fd';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(z.label, cx, cy - r - 10);
                ctx.fillText('👾 Place NPC', cx, cy);
                ctx.restore();
            });
        }

        // ── Start label ───────────────────────────────────────────────────────
        ctx.font = '12px system-ui';
        ctx.fillStyle = 'rgba(74,222,128,0.55)';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('▶ START', 26, H - 22);
    }

    destroy() {
        if (this.canvas?.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        const idx = this.gameEnv?.gameObjects?.indexOf(this);
        if (idx > -1) this.gameEnv.gameObjects.splice(idx, 1);
    }
}
