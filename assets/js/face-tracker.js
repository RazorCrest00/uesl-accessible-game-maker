/**
 * FaceTracker — MediaPipe FaceMesh face tracking module
 *
 * Usage:
 *   await FaceTracker.start()     — request webcam + begin tracking
 *   FaceTracker.stop()            — stop webcam + tracking
 *   FaceTracker.controls          — { left, right, up, down } booleans
 *   FaceTracker.faceData          — { x, y, tilt, mouthOpen, detected }
 *   FaceTracker.sensitivity       — number 0.05–0.25 (default 0.12), set anytime
 *   FaceTracker.onStatusChange    — assign a callback(msg) to receive status strings
 *
 * Dead-zone: head must move >sensitivity away from its calibrated center to
 * trigger a direction. This prevents drift from micro-movements.
 *
 * Calibration: The first frame a face is detected sets the neutral center.
 * Call FaceTracker.recalibrate() to reset the center to the current position.
 */

window.FaceTracker = (() => {
  // ── Public state ────────────────────────────────────────────────────────
  const controls  = { left: false, right: false, up: false, down: false };
  const faceData  = { x: 0.5, y: 0.5, tilt: 0, mouthOpen: false, detected: false };

  let sensitivity    = 0.08;   // dead-zone half-width — Y uses 60% of this so vertical triggers more easily
  let onStatusChange = null;   // callback(message: string)

  // ── Private state ────────────────────────────────────────────────────────
  let _active       = false;
  let _faceMesh     = null;
  let _camera       = null;
  let _stream       = null;
  let _centerX      = 0.5;    // calibrated neutral X
  let _centerY      = 0.5;    // calibrated neutral Y
  let _calibrated   = false;
  let _previewCanvas = null;  // optional canvas for live video preview
  let _previewCtx    = null;

  // MediaPipe landmark indices
  const IDX_NOSE_TIP    = 1;    // nose tip — best for X/Y head position
  const IDX_LEFT_EAR    = 234;  // left ear
  const IDX_RIGHT_EAR  = 454;  // right ear
  const IDX_UPPER_LIP  = 13;   // upper lip inner
  const IDX_LOWER_LIP  = 14;   // lower lip inner

  // ── Status helper ────────────────────────────────────────────────────────
  function _setStatus(msg) {
    if (typeof onStatusChange === 'function') onStatusChange(msg);
  }

  // ── Calibration ──────────────────────────────────────────────────────────
  function recalibrate() {
    _centerX    = faceData.x;
    _centerY    = faceData.y;
    _calibrated = true;
    _setStatus('Calibrated — center locked');
  }

  // ── Results handler (called every frame by MediaPipe) ────────────────────
  function _onResults(results) {
    if (!_active) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      faceData.detected = false;
      controls.left = controls.right = controls.up = controls.down = false;
      _setStatus('No face detected — please look at camera');
      return;
    }

    faceData.detected = true;
    const lm = results.multiFaceLandmarks[0];

    // ── 1. Head position (nose tip, x/y normalized 0–1) ───────────────────
    const nose = lm[IDX_NOSE_TIP];
    // MediaPipe mirrors the image so x=0 is right side of *image* = player's left
    // We flip x so "lean left" maps to move_left intuitively
    faceData.x = 1 - nose.x;
    faceData.y = nose.y;

    // ── 2. Head tilt (roll) — angle between ears ──────────────────────────
    const lEar = lm[IDX_LEFT_EAR];
    const rEar = lm[IDX_RIGHT_EAR];
    faceData.tilt = Math.atan2(lEar.y - rEar.y, lEar.x - rEar.x) * (180 / Math.PI);

    // ── 3. Mouth open detection ───────────────────────────────────────────
    const lipGap = Math.abs(lm[IDX_LOWER_LIP].y - lm[IDX_UPPER_LIP].y);
    faceData.mouthOpen = lipGap > 0.04;

    // ── 4. Auto-calibrate on first detection ─────────────────────────────
    if (!_calibrated) {
      _centerX    = faceData.x;
      _centerY    = faceData.y;
      _calibrated = true;
      _setStatus('Ready — move your head to control the player');
    }

    // ── 5. Map position to directional controls ───────────────────────────
    const dx = faceData.x - _centerX;
    const dy = faceData.y - _centerY;

    // Y uses 60% of the dead zone — vertical head movement has a smaller range
    // than horizontal, so it needs a lower threshold to trigger reliably
    const deadX = sensitivity;
    const deadY = sensitivity * 0.6;

    controls.left  = dx < -deadX;
    controls.right = dx >  deadX;
    controls.up    = dy < -deadY;
    controls.down  = dy >  deadY;
  }

  // ── start() — request webcam + boot MediaPipe ────────────────────────────
  async function start(videoElement, canvasElement) {
    if (_active) return;

    if (canvasElement) {
      _previewCanvas = canvasElement;
      _previewCtx    = canvasElement.getContext('2d');
    }

    _setStatus('Requesting webcam...');

    try {
      _stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
    } catch (err) {
      _setStatus('Camera denied — ' + err.message);
      throw err;
    }

    videoElement.srcObject = _stream;
    await videoElement.play().catch(() => {});

    // Guard: MediaPipe must be loaded via CDN before calling start()
    if (typeof FaceMesh === 'undefined' || typeof Camera === 'undefined') {
      _setStatus('MediaPipe scripts not loaded yet — retrying...');
      await _waitForMediaPipe();
    }

    _faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
    });

    _faceMesh.setOptions({
      maxNumFaces:            1,
      refineLandmarks:        false,   // false = faster + more reliable detection
      minDetectionConfidence: 0.4,     // lowered from 0.6 — detects face in more lighting conditions
      minTrackingConfidence:  0.35     // lowered from 0.5 — keeps tracking through slight blurs
    });

    _faceMesh.onResults(_onResults);

    _camera = new Camera(videoElement, {
      onFrame: async () => {
        if (!_active) return;
        await _faceMesh.send({ image: videoElement });
        if (_previewCtx && _previewCanvas) {
          _previewCtx.drawImage(videoElement, 0, 0, _previewCanvas.width, _previewCanvas.height);
        }
      },
      width: 320,
      height: 240
    });

    _active = true;
    _camera.start();
    _setStatus('Face tracking active');
  }

  // ── stop() ───────────────────────────────────────────────────────────────
  function stop() {
    _active = false;
    if (_camera)  { try { _camera.stop(); } catch(_) {} _camera = null; }
    if (_stream)  { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
    if (_faceMesh){ try { _faceMesh.close(); } catch(_) {} _faceMesh = null; }
    if (_previewCtx && _previewCanvas) {
      _previewCtx.clearRect(0, 0, _previewCanvas.width, _previewCanvas.height);
    }
    _previewCanvas = null;
    _previewCtx    = null;

    controls.left = controls.right = controls.up = controls.down = false;
    faceData.detected   = false;
    _calibrated         = false;
    _setStatus('Face tracking stopped');
  }

  // ── Helper: wait up to 5s for MediaPipe CDN scripts to finish loading ────
  function _waitForMediaPipe(maxWaitMs = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (typeof FaceMesh !== 'undefined' && typeof Camera !== 'undefined') {
          resolve();
        } else if (Date.now() - start > maxWaitMs) {
          reject(new Error('MediaPipe did not load within 5 seconds'));
        } else {
          setTimeout(check, 200);
        }
      };
      check();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    get active()      { return _active; },
    get controls()    { return controls; },
    get faceData()    { return faceData; },
    get sensitivity() { return sensitivity; },
    set sensitivity(v){ sensitivity = Math.max(0.02, Math.min(0.45, v)); },
    get onStatusChange()    { return onStatusChange; },
    set onStatusChange(fn)  { onStatusChange = fn; },
    start,
    stop,
    recalibrate
  };
})();
