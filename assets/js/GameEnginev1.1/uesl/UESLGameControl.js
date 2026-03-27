import GameControl from '../essentials/GameControl.js';

/**
 * UESLGameControl — extends OCS GameControl with UESL-specific hooks.
 * Overrides handleLevelEnd() to remove alert(), adds stop/pause/resume
 * integration with UESLGame's internal state, and wires UESL overlay callbacks.
 */
export default class UESLGameControl extends GameControl {
    constructor(game, levelClasses, options = {}) {
        super(game, levelClasses, options);
        this._stopped = false;
    }

    /**
     * Override gameLoop to respect the _stopped flag so stopGame() works cleanly.
     */
    gameLoop() {
        if (this._stopped) {
            this._loopRunning = false;
            return;
        }
        this._loopRunning = true;

        if (!this.currentLevel || !this.currentLevel.continue) {
            this.handleLevelEnd();
            return;
        }

        if (!this.isPaused) {
            this.currentLevel.update();
            this.handleInLevelLogic();
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Override handleLevelEnd to remove OCS's alert() calls.
     * Advances to the next level or calls the UESL win callbacks instead.
     */
    handleLevelEnd() {
        this._loopRunning = false;
        this.cleanupInteractionHandlers();

        if (this.currentLevel) {
            try { this.currentLevel.destroy(); } catch (e) {}
            this.currentLevel = null;
        }

        // Unset active control on game host
        try {
            if (this.game && this.game.activeGameControl === this) {
                this.game.activeGameControl = null;
            }
        } catch (e) {}

        // Nested game-in-game restore (same as OCS base)
        if (this.isNested && this.parentControl) {
            try {
                if (this.parentControl._savedLevelClasses) {
                    this.parentControl.levelClasses = Array.isArray(this.parentControl._savedLevelClasses)
                        ? [...this.parentControl._savedLevelClasses]
                        : this.parentControl._savedLevelClasses;
                }
                this.parentControl.currentLevelIndex =
                    typeof this.parentControl._savedCurrentLevelIndex !== 'undefined'
                        ? this.parentControl._savedCurrentLevelIndex
                        : 0;
                if (this.game) this.game.activeGameControl = this.parentControl;
                this.parentControl.isPaused = false;
                if (typeof this.parentControl.transitionToLevel === 'function') {
                    this.parentControl.transitionToLevel();
                }
                if (typeof this.parentControl.restoreInteractionHandlers === 'function') {
                    this.parentControl.restoreInteractionHandlers();
                }
            } catch (e) {
                console.warn('Failed to restore parent control after nested game ended:', e);
            }
            return;
        }

        if (this.gameOver) {
            this.gameOver();
            return;
        }

        // Advance to next level or trigger final win — no alert()
        if (this.currentLevelIndex < this.levelClasses.length - 1) {
            this.currentLevelIndex++;
            this.transitionToLevel();
        } else {
            // All levels done — fire UESL win callback
            const U = window.UESL || {};
            if (typeof U.onFinalWin === 'function') {
                U.onFinalWin();
            }
        }
    }

    /**
     * Called when Escape is pressed (OCS base calls pauseMenu() when not paused).
     * Show UESL pause overlay and pause UESLGame state.
     */
    pauseMenu() {
        this.pause();
        // Set paused flag on the active UESLGame instance so it renders the overlay
        if (window._activeUESLGame && window._activeUESLGame.state) {
            window._activeUESLGame.state.paused = true;
        }
        // Notify UESL host (e.g. to show HTML pause overlay)
        const U = window.UESL || {};
        if (typeof U.onPause === 'function') {
            U.onPause();
        }
    }

    /**
     * Override resume() to also clear UESLGame's paused flag.
     */
    resume() {
        super.resume();
        if (window._activeUESLGame && window._activeUESLGame.state) {
            window._activeUESLGame.state.paused = false;
        }
        const U = window.UESL || {};
        if (typeof U.onResume === 'function') {
            U.onResume();
        }
    }

    /**
     * Hard-stop the game loop and destroy the current level.
     * Called by game-maker.html's stopGame() / goBackToDesign().
     */
    stopGame() {
        this._stopped = true;
        this.cleanupInteractionHandlers();
        this.removeExitKeyListener();
        if (this.currentLevel) {
            try { this.currentLevel.destroy(); } catch (e) {}
            this.currentLevel = null;
        }
        this.isPaused = false;
    }

    /**
     * Restart the current level from scratch.
     */
    restartLevel() {
        this._stopped = false;
        this.transitionToLevel();
    }

    /**
     * Jump to an arbitrary level by index.
     * @param {number} idx
     */
    goToLevel(idx) {
        if (idx >= 0 && idx < this.levelClasses.length) {
            this._stopped = false;
            this.currentLevelIndex = idx;
            this.transitionToLevel();
        }
    }
}
