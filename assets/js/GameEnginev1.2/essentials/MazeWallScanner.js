/**
 * MazeWallScanner — scans a background image for dark wall pixels and
 * injects invisible Barrier collision objects into the running game level.
 *
 * Usage (from a GameLevel constructor):
 *   import injectMazeBarriers from './essentials/MazeWallScanner.js';
 *   injectMazeBarriers(gameEnv, imageSrc);
 */

import Barrier from './Barrier.js';

/**
 * @param {object} gameEnv   - The live GameEnv instance (must have .gameObjects, .innerWidth, .innerHeight)
 * @param {string} imageSrc  - URL of the background image to scan
 * @param {object} opts      - Optional tuning parameters
 */
export default async function injectMazeBarriers(gameEnv, imageSrc, opts = {}) {
    const {
        darkThreshold  = 110,   // R channel below this → pixel is a "wall"
        bandThresh     = 0.018, // fraction of dark pixels to count a row/col as a wall band
        barrierHalf    = 10,    // half-thickness of each collision barrier (px at scan resolution)
        minRunPx       = 6,     // ignore wall runs shorter than this (eliminates noise)
        visible        = false, // set true to debug — makes barriers red and visible
    } = opts;

    const cW = gameEnv.innerWidth;
    const cH = gameEnv.innerHeight;

    try {
        const barriers = await _scanImage(imageSrc, cW, cH, darkThreshold, bandThresh, barrierHalf, minRunPx);

        for (const b of barriers) {
            const data = {
                id:      b.id,
                x:       b.x,       // already normalised 0-1 by the scanner
                y:       b.y,
                width:   b.width,
                height:  b.height,
                visible: visible,
                color:   'rgba(255,0,0,0.35)',
                hitbox:  { widthPercentage: 0.0, heightPercentage: 0.0 },
                zIndex:  '10',
            };
            const barrier = new Barrier(data, gameEnv);
            gameEnv.gameObjects.push(barrier);
        }

        console.log(`[MazeWallScanner] injected ${barriers.length} wall barriers`);
    } catch (err) {
        console.warn('[MazeWallScanner] failed:', err);
    }
}

// ─── Internal image scanner ───────────────────────────────────────────────────

function _scanImage(src, W, H, darkThresh, bandThresh, half, minRun) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const oc  = document.createElement('canvas');
                oc.width  = W;
                oc.height = H;
                const ctx = oc.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, W, H);

                const px  = ctx.getImageData(0, 0, W, H).data;
                // A pixel is "wall" when its luminance (approx R) is below threshold
                const isWall = (x, y) => px[(y * W + x) * 4] < darkThresh;

                // Per-row dark fraction
                const rowDark = new Float32Array(H);
                for (let y = 0; y < H; y++) {
                    let d = 0;
                    for (let x = 0; x < W; x++) if (isWall(x, y)) d++;
                    rowDark[y] = d / W;
                }

                // Per-column dark fraction
                const colDark = new Float32Array(W);
                for (let x = 0; x < W; x++) {
                    let d = 0;
                    for (let y = 0; y < H; y++) if (isWall(x, y)) d++;
                    colDark[x] = d / H;
                }

                // Find centre-line y of each horizontal wall band
                const hBands = _findBandCentres(rowDark, H, bandThresh);
                // Find centre-line x of each vertical wall band
                const vBands = _findBandCentres(colDark, W, bandThresh);

                const barriers = [];
                let idx = 0;

                const addBarrier = (x1, y1, x2, y2) => {
                    x1 = Math.max(0, x1);  y1 = Math.max(0, y1);
                    x2 = Math.min(W, x2);  y2 = Math.min(H, y2);
                    const pw = x2 - x1, ph = y2 - y1;
                    if (pw < minRun || ph < minRun) return;
                    barriers.push({
                        id:     `mwb-${idx++}`,
                        x:      x1 / W,
                        y:      y1 / H,
                        width:  pw / W,
                        height: ph / H,
                    });
                };

                // Horizontal wall bands: scan the centre row for dark runs
                for (const yCtr of hBands) {
                    let run = -1;
                    for (let x = 0; x <= W; x++) {
                        const d = x < W && isWall(x, yCtr);
                        if (d  && run < 0) { run = x; }
                        if (!d && run >= 0) { addBarrier(run, yCtr - half, x, yCtr + half); run = -1; }
                    }
                }

                // Vertical wall bands: scan the centre column for dark runs
                for (const xCtr of vBands) {
                    let run = -1;
                    for (let y = 0; y <= H; y++) {
                        const d = y < H && isWall(xCtr, y);
                        if (d  && run < 0) { run = y; }
                        if (!d && run >= 0) { addBarrier(xCtr - half, run, xCtr + half, y); run = -1; }
                    }
                }

                resolve(barriers);
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = () => reject(new Error(`Could not load image: ${src}`));
        img.src = src;
    });
}

function _findBandCentres(darkArr, len, thresh) {
    const centres = [];
    let inBand = false, bandStart = 0;
    for (let i = 0; i <= len; i++) {
        const isWallBand = i < len && darkArr[i] > thresh;
        if (isWallBand && !inBand)  { inBand = true; bandStart = i; }
        if (!isWallBand && inBand)  { centres.push(Math.round((bandStart + i - 1) / 2)); inBand = false; }
    }
    return centres;
}
