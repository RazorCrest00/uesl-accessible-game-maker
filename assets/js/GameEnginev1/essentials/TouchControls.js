/**
 * TouchControls - Virtual D-pad for mobile WASD simulation
 * Creates on-screen buttons that simulate keyboard WASD input
 */
class TouchControls {
    /**
     * @param {object} gameEnv - Game environment
     * @param {object} options - { keyMap, interactLabel, position, id }
     *   keyMap: {up, left, down, right, interact} (keyCodes)
     *   interactLabel: string (e.g. 'e' or 'u')
     *   position: 'left' | 'right' (default: 'left')
     *   id: string (for unique DOM id)
     */
    constructor(gameEnv, options = {}) {
        this.gameEnv = gameEnv;
        this.isVisible = false;
        this.controlsContainer = null;
        this.activeButtons = new Set();
        this.buttonMap = options.mapping;
        this.interactLabel = options.interactLabel;
        this.position = options.position;
        this.domId = options.id || 'touch-controls';
        this.init();
        this.detectMobile();
    }

    /**
     * Detect if device supports touch and show/hide controls accordingly
     */
    detectMobile() {
        const hasTouchscreen = ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0) || 
                              (navigator.msMaxTouchPoints > 0);
        
        // Also check for mobile user agents as backup
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Show controls if device has touch capabilities OR is mobile
        if (hasTouchscreen || isMobileUserAgent) {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Initialize the touch controls UI
     */
    init() {
        this._injectDpadStyles();

        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = this.domId;

        // Inline styles for the outer wrapper — immune to CSS specificity and
        // ancestor-transform bugs that break position:fixed in some layouts.
        Object.assign(this.controlsContainer.style, {
            position:       'fixed',
            bottom:         '20px',
            left:           this.position === 'right' ? 'auto' : '20px',
            right:          this.position === 'right' ? '20px' : 'auto',
            zIndex:         '10000',
            display:        'none',
            userSelect:     'none',
            WebkitUserSelect: 'none',
            pointerEvents:  'auto',
        });

        this.controlsContainer.innerHTML = `
            <div class="dpad-container">
                <div class="dpad-button dpad-up"    data-direction="up">↑</div>
                <div class="dpad-button dpad-left"  data-direction="left">←</div>
                <div class="dpad-button dpad-right" data-direction="right">→</div>
                <div class="dpad-button dpad-down"  data-direction="down">↓</div>
                <div class="interact-button"        data-direction="interact">${this.interactLabel}</div>
            </div>
        `;

        document.body.appendChild(this.controlsContainer);

        // Re-anchor to the game container on every resize so it stays inside the canvas
        this._resizeHandler = () => this._reposition();
        window.addEventListener('resize', this._resizeHandler);

        this.bindEvents();
    }

    /** Inject shared D-pad CSS once per page */
    _injectDpadStyles() {
        if (document.getElementById('dpad-shared-styles')) return;
        const s = document.createElement('style');
        s.id = 'dpad-shared-styles';
        s.textContent = `
            .dpad-container {
                position: relative;
                width: 150px;
                height: 150px;
            }
            .dpad-button {
                position: absolute;
                width: 45px;
                height: 45px;
                background: rgba(255,255,255,0.85);
                border: 2px solid rgba(0,0,0,0.25);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                color: #333;
                cursor: pointer;
                touch-action: none;
                transition: background 0.1s, transform 0.1s;
            }
            .interact-button {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 45px;
                height: 45px;
                background: rgba(100,255,100,0.85);
                border: 2px solid rgba(0,100,0,0.4);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                color: #004d00;
                cursor: pointer;
                touch-action: none;
                transition: background 0.1s, transform 0.1s;
            }
            @keyframes dpad-pulse {
                0%   { box-shadow: 0 0 0 0   rgba(100,255,100,0.7); }
                70%  { box-shadow: 0 0 0 10px rgba(100,255,100,0);   }
                100% { box-shadow: 0 0 0 0   rgba(100,255,100,0);   }
            }
            .interact-button.pulse { animation: dpad-pulse 2s infinite; }
            .dpad-button:active, .dpad-button.pressed {
                background: rgba(100,150,255,0.9);
                color: white;
                transform: scale(0.92);
            }
            .interact-button:active, .interact-button.pressed {
                background: rgba(50,200,50,0.9);
                color: white;
                transform: translate(-50%,-50%) scale(0.92);
            }
            .dpad-up   { top: 0;      left: 52px; }
            .dpad-left { top: 52px;   left: 0;    }
            .dpad-right{ top: 52px;   right: 0;   }
            .dpad-down { bottom: 0;   left: 52px; }
            @media (max-width: 480px) {
                .dpad-container  { width: 120px; height: 120px; }
                .dpad-button     { width: 36px;  height: 36px; font-size: 14px; }
                .interact-button { width: 40px;  height: 40px; font-size: 14px; }
                .dpad-up, .dpad-down  { left: 42px; }
                .dpad-left, .dpad-right { top: 42px; }
            }
        `;
        document.head.appendChild(s);
    }

    /**
     * Snap the D-pad to sit inside the game container's visible area.
     * Falls back to viewport bottom-left/right if the container isn't found yet.
     */
    _reposition() {
        const gc = this.gameEnv?.container
               || document.getElementById('gameContainer');
        if (!gc) return;

        const r      = gc.getBoundingClientRect();
        const pad    = 16;
        const bottom = window.innerHeight - r.bottom + pad;
        const left   = this.position === 'right'
                        ? 'auto'
                        : (r.left + pad) + 'px';
        const right  = this.position === 'right'
                        ? (window.innerWidth - r.right + pad) + 'px'
                        : 'auto';

        Object.assign(this.controlsContainer.style, {
            bottom: Math.max(pad, bottom) + 'px',
            left,
            right,
        });
    }

    /**
     * Bind touch events to the virtual buttons
     */
    bindEvents() {
        const buttons = this.controlsContainer.querySelectorAll('[data-direction]');
        
        buttons.forEach(button => {
            const direction = button.dataset.direction;
            
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonPress(direction, true);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleButtonPress(direction, false);
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.handleButtonPress(direction, false);
            });
            
            // Mouse events for desktop testing
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleButtonPress(direction, true);
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleButtonPress(direction, false);
            });
            
            button.addEventListener('mouseleave', (e) => {
                this.handleButtonPress(direction, false);
            });
        });
    }

    /**
     * Handle virtual button press/release
     * @param {string} direction - The direction button pressed
     * @param {boolean} isPressed - Whether button is pressed or released
     */
    handleButtonPress(direction, isPressed) {
        const keyCode = this.buttonMap[direction];
        const button = this.controlsContainer.querySelector(`[data-direction="${direction}"]`);
        
        if (isPressed) {
            this.activeButtons.add(direction);
            button.classList.add('pressed');
            
            // Simulate keydown event
            this.dispatchKeyEvent('keydown', keyCode);
        } else {
            this.activeButtons.delete(direction);
            button.classList.remove('pressed');
            
            // Simulate keyup event
            this.dispatchKeyEvent('keyup', keyCode);
        }
    }

    /**
     * Dispatch synthetic keyboard events
     * @param {string} type - Event type ('keydown' or 'keyup')
     * @param {number} keyCode - The key code to simulate
     */
    dispatchKeyEvent(type, keyCode) {
        // Map keyCode to key string for WASD/E or IJKL/U
        let key = undefined;
        switch (keyCode) {
            case 87: key = 'w'; break;
            case 65: key = 'a'; break;
            case 83: key = 's'; break;
            case 68: key = 'd'; break;
            case 69: key = 'e'; break;
            case 73: key = 'i'; break;
            case 74: key = 'j'; break;
            case 75: key = 'k'; break;
            case 76: key = 'l'; break;
            case 85: key = 'u'; break;
            default: key = undefined;
        }
        // Special handling: if this is the interact button, set key to match interactLabel if possible
        if (this.buttonMap && this.buttonMap.interact === keyCode && this.interactLabel) {
            key = this.interactLabel;
        }
        const event = new KeyboardEvent(type, {
            keyCode: keyCode,
            which: keyCode,
            key: key,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Visually highlight the interact button (when near an NPC)
     */
    showInteractButton() {
        const interactButton = this.controlsContainer?.querySelector('.interact-button');
        if (interactButton) {
            interactButton.classList.add('pulse');
        }
    }

    /**
     * Remove highlight from the interact button (when not near an NPC)
     */
    hideInteractButton() {
        const interactButton = this.controlsContainer?.querySelector('.interact-button');
        if (interactButton) {
            interactButton.classList.remove('pulse');
        }
    }

    /**
     * Check if interact button is currently highlighted
     */
    isInteractButtonVisible() {
        const interactButton = this.controlsContainer?.querySelector('.interact-button');
        return interactButton?.classList.contains('pulse') || false;
    }

    /**
     * Show the touch controls
     */
    show() {
        if (this.controlsContainer) {
            this._reposition();
            this.controlsContainer.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * Hide the touch controls
     */
    hide() {
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Toggle visibility of touch controls
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Clean up the touch controls
     */
    destroy() {
        if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
        if (this.controlsContainer && this.controlsContainer.parentNode) {
            this.controlsContainer.parentNode.removeChild(this.controlsContainer);
        }
    }
}

export default TouchControls;