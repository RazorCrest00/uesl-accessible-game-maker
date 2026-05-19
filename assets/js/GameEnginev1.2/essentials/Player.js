import Character from './Character.js';

// Define non-mutable constants as defaults
const SCALE_FACTOR = 25; // 1/nth of the height of the canvas
const STEP_FACTOR = 100; // 1/nth, or N steps up and across the canvas
const ANIMATION_RATE = 1; // 1/nth of the frame rate
const INIT_POSITION = { x: 0, y: 0 };


class Player extends Character {
    // Static counter for unique player IDs (uninitialized)
    static playerCount;
    /**
     * The constructor method is called when a new Player object is created.
     * 
     * @param {Object|null} data - The sprite data for the object. If null, a default red square is used.
     */
    constructor(data = null, gameEnv = null) {
        super(data, gameEnv);
        // Increment static player counter and assign unique id
        Player.playerCount = (Player.playerCount || 0) + 1;
        this.id = data?.id ? data.id.toLowerCase() : `player${Player.playerCount}`;
        this.keypress = data?.keypress || {up: 87, left: 65, down: 83, right: 68};
        this.pressedKeys = {}; // active keys array
        this.bindMovementKeyListners();
        this.gravity = data.GRAVITY || false;
        this.acceleration = 0.001;
        this.time = 0;
        this.moved = false;
    }

    /**
     * Binds key event listeners to handle object movement.
     * 
     * This method binds keydown and keyup event listeners to handle object movement.
     * The .bind(this) method ensures that 'this' refers to the object object.
     */
    bindMovementKeyListners() {
        addEventListener('keydown', this.handleKeyDown.bind(this));
        addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown({ keyCode }) {
        // capture the pressed key in the active keys array
        this.pressedKeys[keyCode] = true;
        // set the velocity and direction based on the newly pressed key
        this.updateVelocity();
        this.updateDirection();
    }

    /**
     * Handles key up events to stop the player's velocity.
     * 
     * This method stops the player's velocity based on the key released.
     * 
     * @param {Object} event - The keyup event object.
     */
    handleKeyUp({ keyCode }) {
        // remove the lifted key from the active keys array
        if (keyCode in this.pressedKeys) {
            delete this.pressedKeys[keyCode];
        }
        // adjust the velocity and direction based on the remaining keys
        this.updateVelocity();
        this.updateDirection();
    }

    /**
     * Update the player's velocity and direction based on the pressed keys.
     */

    updateVelocity() {
        this.velocity.x = 0;
        this.velocity.y = 0;

        this.moved = false;

        if (this.pressedKeys[this.keypress.right] || this.pressedKeys[this.keypress.left]) {
            this.moved = true;

            if (this.pressedKeys[this.keypress.right]) {
                this.velocity.x += this.xVelocity;
            }

            else if (this.pressedKeys[this.keypress.left]) {
                this.velocity.x -= this.xVelocity;
            }
        }

        if (this.pressedKeys[this.keypress.up] || this.pressedKeys[this.keypress.down]) {
            this.moved = true;

            if (this.pressedKeys[this.keypress.up]) {
                this.velocity.y -= this.yVelocity;
            }

            else if (this.pressedKeys[this.keypress.down]) {
                this.velocity.y += this.yVelocity;
            }
        }
    }

    updateDirection() {       
        // Single-key movement
        if (this.pressedKeys[this.keypress.up]) {
            this.direction = "up";
        } else if (this.pressedKeys[this.keypress.down]) {
            this.direction = "down";
        } else if (this.pressedKeys[this.keypress.right]) {
            this.direction = "right";
        } else if (this.pressedKeys[this.keypress.left]) {
            this.direction = "left";
        }

        // Multi-key movement
        if (this.pressedKeys[this.keypress.left] && this.pressedKeys[this.keypress.up]) {
            this.direction = "upLeft";
        } else if (this.pressedKeys[this.keypress.left] && this.pressedKeys[this.keypress.down]) {
            this.direction = "downLeft";
        } else if (this.pressedKeys[this.keypress.right] && this.pressedKeys[this.keypress.up]) {
            this.direction = "upRight";
        } else if (this.pressedKeys[this.keypress.right] && this.pressedKeys[this.keypress.down]) {
            this.direction = "downRight";
        }
    }

    update() {
        // Re-apply velocity from currently held keys every frame.
        // Without this, collisionChecks() zeros velocity once and it stays 0
        // for all subsequent frames while the key is held (no new keydown fires).
        // With this, velocity is restored each frame so the player can slide
        // along walls and escape collisions in valid directions.
        this.updateVelocity();
        this.updateDirection();
        super.update();
        if(!this.moved){
            if (this.gravity) {
                    this.time += 1;
                    this.velocity.y += 0.5 + this.acceleration * this.time;
                }
            }
        else{
            this.time = 0;
        }
        }
        
    /**
     * Overrides the reaction to the collision to handle
     *  - clearing the pressed keys array
     *  - stopping the player's velocity
     *  - updating the player's direction   
     * @param {*} other - The object that the player is colliding with
     */
    /**
     * Override move() to add AABB depenetration after super.move().
     *
     * WHY THIS IS NEEDED:
     * The engine's touch-point detection (in isCollision/handleCollisionState) only
     * fires when the player STRADDLES a barrier edge — one side in, one side out.
     * With xVelocity = (canvasW/STEP_FACTOR)*3 = 27px/frame, a player 1px from a
     * barrier can leap 26px past the edge in a single frame.  At that point the
     * player is fully inside the barrier: no touch points fire, velocity is never
     * zeroed, and the player tunnels through on subsequent frames.
     *
     * This override catches any remaining penetration AFTER super.move() and pushes
     * the player back using minimum-overlap axis resolution (standard AABB SAT).
     * It works in game-space coordinates (no getBoundingClientRect, no DOM reflow):
     *   - Barriers track position via this.x / this.y  (set in Barrier constructor)
     *   - Player  tracks position via this.position.x/y (set in Character)
     * Both are in the same game-pixel coordinate space (container-relative, no top offset).
     *
     * Objects with a 'spriteData' property are Characters/NPCs (position tracked
     * differently) and are intentionally skipped to avoid displacing NPC actors.
     */
    move() {
        super.move(); // applies velocity + boundary clamping

        // AABB depenetration pass: push player out of any Barrier they penetrated.
        //
        // WHY the outer-border barrier bug happened:
        // The maze generated 4 outer-border barriers starting at x=0 / y=0.
        // super.move() clamps position to [0, innerWidth-w] / [0, innerHeight-h].
        // So the player at (0,0) was simultaneously overlapping the top border (y=0..32)
        // AND left border (x=0..32). SAT chose the minimum-overlap axis and pushed
        // the player to (-23, 0) — overriding super.move()'s clamping and putting the
        // player at an invalid negative coordinate. Every subsequent AABB pass then saw
        // wrong coordinates and cascaded into "invisible walls" all over the maze.
        //
        // The outer-border barriers are now REMOVED from maze generation (boundary
        // clamping in super.move() handles screen edges). This pass only touches
        // interior Barrier objects, which are never at x=0 or y=0, so SAT resolution
        // always pushes toward the interior of the game area.
        //
        // After all AABB corrections, boundary clamping is reapplied so no single
        // barrier resolution can push the player off-screen.

        try {
            let px = this.position.x;
            let py = this.position.y;
            const pw = this.width;
            const ph = this.height;

            for (const obj of this.gameEnv.gameObjects) {
                if (obj === this || !obj.canvas) continue;
                // Ensure we skip other characters but ALWAYS process objects without velocity (Barriers)
                if (obj.velocity && (obj.id !== this.id)) continue; 

                const ox = obj.x;
                const oy = obj.y;
                const ow = obj.width;
                const oh = obj.height;
                if (!ow || !oh) continue;

                // Broad-phase AABB skip
                if (px + pw <= ox || px >= ox + ow || py + ph <= oy || py >= oy + oh) continue;

                // Penetration depths (all four sides)
                const dxL = (px + pw) - ox;   // overlap entering from left
                const dxR = (ox + ow) - px;   // overlap entering from right
                const dyT = (py + ph) - oy;   // overlap entering from top
                const dyB = (oy + oh) - py;   // overlap entering from bottom

                // Minimum-overlap axis resolution (SAT)
                if (Math.min(dxL, dxR) <= Math.min(dyT, dyB)) {
                    if (dxL <= dxR) { px -= dxL; this.velocity.x = 0; }
                    else            { px += dxR; this.velocity.x = 0; }
                } else {
                    if (dyT <= dyB) { py -= dyT; this.velocity.y = 0; }
                    else            { py += dyB; this.velocity.y = 0; }
                }
            }

            // Re-apply boundary clamping AFTER AABB so no resolution can push
            // the player outside the game area.
            if (px < 0) { px = 0; this.velocity.x = 0; }
            if (py < 0) { py = 0; this.velocity.y = 0; }
            if (px + pw > this.gameEnv.innerWidth)  { px = this.gameEnv.innerWidth  - pw; this.velocity.x = 0; }
            if (py + ph > this.gameEnv.innerHeight) { py = this.gameEnv.innerHeight - ph; this.velocity.y = 0; }

            this.position.x = px;
            this.position.y = py;
        } catch (_) {}
    }

    handleCollisionReaction(other) {
        // Do NOT clear pressed keys; keep walking animation active
        // Halt movement by zeroing velocity along the touched axes
        try {
            const touchPoints = this.collisionData?.touchPoints?.this;
            if (touchPoints) {
                if (touchPoints.left || touchPoints.right) {
                    this.velocity.x = 0;
                }
                if (touchPoints.top || touchPoints.bottom) {
                    this.velocity.y = 0;
                }
            }
        } catch (_) {}

        super.handleCollisionReaction(other);
    }

    showInteractButton() {}
    hideInteractButton() {}
    isInteractButtonVisible() { return false; }

    destroy() {
        super.destroy?.();
    }


}

export default Player;