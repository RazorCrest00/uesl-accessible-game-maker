/**
 * CharacterSelect.js  –  self-contained character selection screen.
 *
 * Usage:
 *   new CharacterSelect(containerElement, { path: '{{site.baseurl}}', onSelect: fn });
 *
 * The component injects its own <style> block so it works even if the external
 * character-select.css fails to load.  The accordion uses scrollHeight so the
 * open/close animation is always correct regardless of content size.
 */
class CharacterSelect {

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(container, options = {}) {
        this.container = container;
        this.path      = options.path || '';
        this.onSelect  = options.onSelect || null;
        this.selected  = null;

        try {
            const saved = localStorage.getItem('selectedCharacter');
            if (saved) this.selected = JSON.parse(saved);
        } catch (_) {}

        this._injectStyles();
        this.categories = this._buildCategories();
        this._render();
    }

    // ─── Inline styles (self-contained, no external CSS required) ─────────────

    _injectStyles() {
        if (document.getElementById('cs-injected-styles')) return;
        const style = document.createElement('style');
        style.id = 'cs-injected-styles';
        style.textContent = `
            .cs-screen {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
                padding: 2rem 1rem 4rem;
                background: linear-gradient(160deg, #0d0d1a 0%, #0a1628 60%, #0d0d1a 100%);
                font-family: 'Segoe UI', system-ui, sans-serif;
                color: #e8e8f0;
                box-sizing: border-box;
            }
            .cs-header { text-align: center; margin-bottom: 2.5rem; }
            .cs-title {
                font-size: clamp(1.8rem, 5vw, 3rem);
                font-weight: 800;
                margin: 0 0 0.4rem;
                background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .cs-subtitle { margin: 0; font-size: 1rem; color: #94a3b8; }

            /* Categories list */
            .cs-categories {
                width: 100%;
                max-width: 900px;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            /* Single accordion panel */
            .cs-category {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                overflow: hidden;
                transition: border-color 0.2s;
            }
            .cs-category.cs-open { border-color: rgba(167,139,250,0.5); }

            /* Header button */
            .cs-category-header {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.25rem;
                background: transparent;
                border: none;
                cursor: pointer;
                color: #e8e8f0;
                text-align: left;
                transition: background 0.2s;
                user-select: none;
            }
            .cs-category-header:hover { background: rgba(255,255,255,0.07); }
            .cs-category-icon { font-size: 1.4rem; flex-shrink: 0; }
            .cs-category-label { flex: 1; font-size: 1.1rem; font-weight: 700; }
            .cs-category-count {
                font-size: 0.78rem;
                background: rgba(167,139,250,0.2);
                color: #a78bfa;
                border-radius: 999px;
                padding: 0.15em 0.6em;
                font-weight: 600;
            }
            .cs-chevron {
                font-size: 0.8rem;
                color: #64748b;
                transition: transform 0.3s ease;
                display: inline-block;
            }
            .cs-open .cs-chevron { transform: rotate(90deg); }

            /* Collapsible body — height driven by JS scrollHeight */
            .cs-category-body {
                overflow: hidden;
                max-height: 0;
                transition: max-height 0.35s ease;
            }

            /* Card grid */
            .cs-card-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                gap: 0.75rem;
                padding: 0.5rem 1rem 1rem;
            }

            /* Character card */
            .cs-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.4rem;
                padding: 0.75rem 0.5rem;
                background: rgba(255,255,255,0.04);
                border: 2px solid rgba(255,255,255,0.08);
                border-radius: 10px;
                cursor: pointer;
                transition: transform 0.15s, border-color 0.15s, background 0.15s, box-shadow 0.15s;
                user-select: none;
            }
            .cs-card:hover {
                transform: translateY(-3px);
                border-color: rgba(96,165,250,0.5);
                background: rgba(96,165,250,0.08);
                box-shadow: 0 4px 16px rgba(96,165,250,0.15);
            }
            .cs-card.cs-selected {
                border-color: #a78bfa;
                background: rgba(167,139,250,0.15);
                box-shadow: 0 0 0 3px rgba(167,139,250,0.3), 0 4px 20px rgba(167,139,250,0.2);
            }

            /* Card image */
            .cs-card-img {
                width: 72px;
                height: 72px;
                object-fit: contain;
                image-rendering: pixelated;
                image-rendering: crisp-edges;
                filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
                transition: transform 0.15s;
            }
            .cs-card:hover .cs-card-img { transform: scale(1.1); }
            .cs-card.cs-selected .cs-card-img { filter: drop-shadow(0 0 8px rgba(167,139,250,0.7)); }

            /* Card label */
            .cs-card-label {
                font-size: 0.7rem;
                font-weight: 600;
                color: #cbd5e1;
                text-align: center;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .cs-card.cs-selected .cs-card-label { color: #c4b5fd; }

            /* Play button */
            .cs-play-btn {
                margin-top: 2.5rem;
                padding: 0.85rem 3.5rem;
                font-size: 1.2rem;
                font-weight: 800;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: #fff;
                background: linear-gradient(135deg, #7c3aed, #4f46e5);
                border: none;
                border-radius: 50px;
                cursor: pointer;
                box-shadow: 0 4px 24px rgba(124,58,237,0.5);
                transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
            }
            .cs-play-btn:hover {
                transform: translateY(-2px) scale(1.03);
                box-shadow: 0 8px 32px rgba(124,58,237,0.65);
                filter: brightness(1.1);
            }
            @media (max-width: 500px) {
                .cs-card-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); }
                .cs-card-img  { width: 56px; height: 56px; }
            }
        `;
        document.head.appendChild(style);
    }

    // ─── Character definitions ────────────────────────────────────────────────

    _buildCategories() {
        const p = this.path;

        const _hero = (id, name, file, greeting) => ({
            id, name, greeting,
            src: `${p}/images/gamify/${file}`,
            SCALE_FACTOR: 6, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
            pixels: { height: 132, width: 96 },
            orientation: { rows: 1, columns: 1 },
            down: { row: 0, start: 0, columns: 1 },
            left: { row: 0, start: 0, columns: 1 },
            right: { row: 0, start: 0, columns: 1 },
            up:   { row: 0, start: 0, columns: 1 },
            hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
            keypress: { up: 87, left: 65, down: 83, right: 68 },
            INIT_POSITION: { x: 0.0, y: 0.9 },
        });

        const _poke = (id, name, file, greeting, scale = 5) => ({
            id, name, greeting,
            src: `${p}/images/gamify/pokemon/${file}`,
            SCALE_FACTOR: scale, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
            pixels: { height: 475, width: 475 },
            orientation: { rows: 1, columns: 1 },
            down: { row: 0, start: 0, columns: 1 },
            left: { row: 0, start: 0, columns: 1 },
            right: { row: 0, start: 0, columns: 1 },
            up:   { row: 0, start: 0, columns: 1 },
            hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
            keypress: { up: 87, left: 65, down: 83, right: 68 },
            INIT_POSITION: { x: 0.0, y: 0.9 },
        });

        return [
            {
                id: 'superheroes', label: 'Superheroes', icon: '🦸',
                characters: [
                    _hero('Batman',          'Batman',          'batman.png',          'I am Batman. I operate in the shadows to fight crime.'),
                    _hero('Superman',        'Superman',        'superman.png',        'Faster than a speeding bullet! I am Superman.'),
                    _hero('Spider-Man',      'Spider-Man',      'spiderman.png',       'With great power comes great responsibility!'),
                    _hero('Iron Man',        'Iron Man',        'ironman.png',         'I am Iron Man. The suit makes the hero.'),
                    _hero('Thor',            'Thor',            'thor.png',            'I am Thor, Son of Odin, God of Thunder!'),
                    _hero('Wonder Woman',    'Wonder Woman',    'wonder_woman.png',    'I am Wonder Woman, protector of truth and justice.'),
                    _hero('Captain America', 'Captain America', 'captain_america.png', 'I can do this all day. I am Captain America.'),
                ],
            },
            {
                id: 'pokemon', label: 'Pokémon', icon: '⚡',
                characters: [
                    _poke('Pikachu',  'Pikachu',  'pikachu.png',  'Pika pika! I am Pikachu, the Electric Mouse Pokémon!', 5),
                    _poke('Charizard','Charizard','charizard.png','ROAR! I am Charizard, the Flame Pokémon!',             4),
                    _poke('Mewtwo',   'Mewtwo',   'mewtwo.png',   'I am Mewtwo. I was created by science, but I am more than that.', 4),
                    _poke('Eevee',    'Eevee',    'eevee.png',    'Vui! I am Eevee, full of potential and ready to evolve!', 5),
                    _poke('Gengar',   'Gengar',   'gengar.png',   'Heheheh... I am Gengar, lurking in the shadows!',      5),
                    _poke('Lucario',  'Lucario',  'lucario.png',  'I sense your aura. I am Lucario, the Aura Pokémon!',  4),
                ],
            },
            {
                id: 'adventure', label: 'Adventure', icon: '🏜️',
                characters: [
                    {
                        id: 'Chill Guy', name: 'Chill Guy',
                        src: `${p}/images/gamify/chillguy.png`,
                        greeting: 'Hi I am Chill Guy, the desert wanderer!',
                        SCALE_FACTOR: 5, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
                        pixels: { height: 384, width: 512 },
                        orientation: { rows: 3, columns: 4 },
                        down:      { row: 0, start: 0, columns: 3 },
                        downRight: { row: 1, start: 0, columns: 3, rotate: Math.PI / 16 },
                        downLeft:  { row: 2, start: 0, columns: 3, rotate: -Math.PI / 16 },
                        left:      { row: 2, start: 0, columns: 3 },
                        right:     { row: 1, start: 0, columns: 3 },
                        up:        { row: 3, start: 0, columns: 3 },
                        upLeft:    { row: 2, start: 0, columns: 3, rotate: Math.PI / 16 },
                        upRight:   { row: 1, start: 0, columns: 3, rotate: -Math.PI / 16 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.4 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Octopus', name: 'Octopus',
                        src: `${p}/images/gamify/octopus.png`,
                        greeting: 'I am the Octopus, master of the seas!',
                        SCALE_FACTOR: 7, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 250, width: 167 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Snowspeeder', name: 'Snowspeeder',
                        src: `${p}/images/gamify/snowspeeder_sprite.png`,
                        greeting: 'Snowspeeder pilot ready for adventure!',
                        SCALE_FACTOR: 5, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
                        pixels: { height: 433, width: 577 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                ],
            },
            {
                id: 'minecraft', label: 'Minecraft', icon: '⛏️',
                characters: [
                    {
                        id: 'Steve', name: 'Steve',
                        src: `${p}/images/gamify/stevelol.png`,
                        greeting: 'I am Steve, miner and crafter extraordinaire!',
                        SCALE_FACTOR: 5, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
                        pixels: { height: 400, width: 317 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Alex', name: 'Alex',
                        src: `${p}/images/gamify/Alex.png`,
                        greeting: 'I am Alex, ready to explore and build!',
                        SCALE_FACTOR: 6, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
                        pixels: { height: 256, width: 128 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                ],
            },
            {
                id: 'anime', label: 'Anime & Fantasy', icon: '✨',
                characters: [
                    {
                        id: 'Nezuko', name: 'Nezuko',
                        src: `${p}/images/gamify/nezuko.png`,
                        greeting: 'Nezuko is ready for battle!',
                        SCALE_FACTOR: 6, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 316, width: 189 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Miku', name: 'Miku',
                        src: `${p}/images/gamify/miku.png`,
                        greeting: 'Hatsune Miku here, let the music play!',
                        SCALE_FACTOR: 6, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 316, width: 189 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'AnimWizard', name: 'Animated Wizard',
                        src: `${p}/images/gamify/animwizard.png`,
                        greeting: 'I am the Animated Wizard, master of spells!',
                        SCALE_FACTOR: 5, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 307, width: 813 },
                        orientation: { rows: 1, columns: 3 },
                        down: { row: 0, start: 0, columns: 3 }, left: { row: 0, start: 0, columns: 3 },
                        right: { row: 0, start: 0, columns: 3 }, up: { row: 0, start: 0, columns: 3 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Wizard', name: 'Wizard',
                        src: `${p}/images/gamify/wizard.png`,
                        greeting: 'I am the Wizard, seeker of ancient knowledge!',
                        SCALE_FACTOR: 6, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 185, width: 163 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                ],
            },
            {
                id: 'tech', label: 'Tech Mascots', icon: '💻',
                characters: [
                    {
                        id: 'Tux', name: 'Tux (Linux)',
                        src: `${p}/images/gamify/tux.png`,
                        greeting: 'Hi I am Tux, the Linux mascot!',
                        SCALE_FACTOR: 8, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
                        pixels: { height: 256, width: 352 },
                        orientation: { rows: 8, columns: 11 },
                        down: { row: 5, start: 0, columns: 3 }, left: { row: 5, start: 0, columns: 3 },
                        right: { row: 5, start: 0, columns: 3 }, up: { row: 5, start: 0, columns: 3 },
                        hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Octocat', name: 'Octocat (GitHub)',
                        src: `${p}/images/gamify/octocat.png`,
                        greeting: 'Hi I am Octocat, the GitHub mascot!',
                        SCALE_FACTOR: 8, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
                        pixels: { height: 301, width: 801 },
                        orientation: { rows: 1, columns: 9 },
                        down: { row: 0, start: 0, columns: 9 }, left: { row: 0, start: 0, columns: 9 },
                        right: { row: 0, start: 0, columns: 9 }, up: { row: 0, start: 0, columns: 9 },
                        hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Robot', name: 'Robot',
                        src: `${p}/images/gamify/robot.png`,
                        greeting: 'BEEP BOOP. I am Robot, your tech companion!',
                        SCALE_FACTOR: 8, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 316, width: 627 },
                        orientation: { rows: 3, columns: 6 },
                        down: { row: 1, start: 0, columns: 6 }, left: { row: 1, start: 0, columns: 6 },
                        right: { row: 1, start: 0, columns: 6 }, up: { row: 1, start: 0, columns: 6 },
                        hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'StarWarsR2D2', name: 'R2-D2',
                        src: `${p}/images/gamify/r2_idle.png`,
                        greeting: 'Beep boop! I have important data about the Death Star plans.',
                        SCALE_FACTOR: 8, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 223, width: 505 },
                        orientation: { rows: 1, columns: 3 },
                        down: { row: 0, start: 0, columns: 3 }, left: { row: 0, start: 0, columns: 3 },
                        right: { row: 0, start: 0, columns: 3 }, up: { row: 0, start: 0, columns: 3 },
                        hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                ],
            },
            {
                id: 'villains', label: 'Villains', icon: '😈',
                characters: [
                    {
                        id: 'Vader', name: 'Darth Vader',
                        src: `${p}/images/gamify/vader.png`,
                        greeting: 'I find your lack of faith disturbing.',
                        SCALE_FACTOR: 6, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 144, width: 128 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                    {
                        id: 'Creeper', name: 'Creeper',
                        src: `${p}/images/gamify/creepa.png`,
                        greeting: 'Ssssss... I am the Creeper. Watch out!',
                        SCALE_FACTOR: 6, STEP_FACTOR: 1000, ANIMATION_RATE: 100,
                        pixels: { height: 200, width: 200 },
                        orientation: { rows: 1, columns: 1 },
                        down: { row: 0, start: 0, columns: 1 }, left: { row: 0, start: 0, columns: 1 },
                        right: { row: 0, start: 0, columns: 1 }, up: { row: 0, start: 0, columns: 1 },
                        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
                        keypress: { up: 87, left: 65, down: 83, right: 68 },
                        INIT_POSITION: { x: 0.0, y: 0.9 },
                    },
                ],
            },
        ];
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    _render() {
        this.container.innerHTML = '';
        this.container.className = 'cs-screen';

        // Title
        const hdr = document.createElement('div');
        hdr.className = 'cs-header';
        hdr.innerHTML = `
            <h1 class="cs-title">Choose Your Character</h1>
            <p class="cs-subtitle">Click a category to expand it, then pick your hero</p>
        `;
        this.container.appendChild(hdr);

        // Category list
        const list = document.createElement('div');
        list.className = 'cs-categories';
        this.categories.forEach(cat => list.appendChild(this._buildCategory(cat)));
        this.container.appendChild(list);

        // Play button
        this.playBtn = document.createElement('button');
        this.playBtn.className = 'cs-play-btn';
        this.playBtn.textContent = 'Play';
        this.playBtn.style.display = 'none';
        this.playBtn.addEventListener('click', () => this._confirm());
        this.container.appendChild(this.playBtn);

        if (this.selected) this._restoreHighlight();
    }

    _buildCategory(cat) {
        const section = document.createElement('div');
        section.className = 'cs-category';
        section.dataset.id = cat.id;

        // ── Header button ──
        const hdr = document.createElement('button');
        hdr.className = 'cs-category-header';
        hdr.type = 'button';
        hdr.innerHTML = `
            <span class="cs-category-icon">${cat.icon}</span>
            <span class="cs-category-label">${cat.label}</span>
            <span class="cs-category-count">${cat.characters.length}</span>
            <span class="cs-chevron">▶</span>
        `;

        // ── Body panel ──
        const body = document.createElement('div');
        body.className = 'cs-category-body';
        body.style.maxHeight = '0';

        const grid = document.createElement('div');
        grid.className = 'cs-card-grid';
        cat.characters.forEach(char => grid.appendChild(this._buildCard(char)));
        body.appendChild(grid);

        // ── Toggle logic (scrollHeight-based — always correct) ──
        hdr.addEventListener('click', () => {
            const isOpen = section.classList.contains('cs-open');

            if (isOpen) {
                // Collapse: animate from current height → 0
                body.style.maxHeight = body.scrollHeight + 'px';
                requestAnimationFrame(() => {
                    body.style.maxHeight = '0';
                });
                section.classList.remove('cs-open');
            } else {
                // Expand: animate 0 → full height
                body.style.maxHeight = body.scrollHeight + 'px';
                // After transition ends, set to 'none' so content can reflow freely
                body.addEventListener('transitionend', () => {
                    if (section.classList.contains('cs-open')) {
                        body.style.maxHeight = 'none';
                    }
                }, { once: true });
                section.classList.add('cs-open');
            }
        });

        section.appendChild(hdr);
        section.appendChild(body);
        return section;
    }

    _buildCard(char) {
        const card = document.createElement('div');
        card.className = 'cs-card';
        card.dataset.charId = char.id;

        const img = document.createElement('img');
        img.src = char.src;
        img.alt = char.name;
        img.className = 'cs-card-img';
        img.draggable = false;

        const lbl = document.createElement('span');
        lbl.className = 'cs-card-label';
        lbl.textContent = char.name;

        card.appendChild(img);
        card.appendChild(lbl);
        card.addEventListener('click', () => this._pick(char, card));
        return card;
    }

    // ─── Selection ────────────────────────────────────────────────────────────

    _pick(char, cardEl) {
        this.container.querySelectorAll('.cs-card.cs-selected').forEach(el => el.classList.remove('cs-selected'));
        cardEl.classList.add('cs-selected');
        this.selected = char;
        this.playBtn.textContent = `Play as ${char.name}`;
        this.playBtn.style.display = 'block';
        try { localStorage.setItem('selectedCharacter', JSON.stringify(this._strip(char))); } catch (_) {}
    }

    _restoreHighlight() {
        if (!this.selected) return;
        const card = this.container.querySelector(`[data-char-id="${CSS.escape(this.selected.id)}"]`);
        if (!card) return;
        card.classList.add('cs-selected');
        this.playBtn.textContent = `Play as ${this.selected.name}`;
        this.playBtn.style.display = 'block';
    }

    _confirm() {
        if (!this.selected) return;
        if (typeof this.onSelect === 'function') this.onSelect(this._strip(this.selected));
    }

    _strip(char) {
        const out = {};
        for (const [k, v] of Object.entries(char)) {
            if (typeof v !== 'function') out[k] = v;
        }
        return out;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    static getSavedCharacter() {
        try { return JSON.parse(localStorage.getItem('selectedCharacter')); } catch (_) { return null; }
    }

    static clearSavedCharacter() {
        localStorage.removeItem('selectedCharacter');
    }
}

export default CharacterSelect;
