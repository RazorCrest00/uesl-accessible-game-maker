# UESL — Unified Esports League · Frontend

This is the public-facing website for the **Unified Esports League (UESL)**, a San Diego-based nonprofit that uses gaming and technology to help people with intellectual and developmental disabilities build confidence, friendships, and real-world skills.

Built with **Jekyll** and hosted on **GitHub Pages**. Designed and developed by students in the Del Norte High School AP CSP program as a community service project.

Live site: **[uesl.io](https://uesl.io)** · Backend: **[uesl.opencodingsociety.com](https://uesl.opencodingsociety.com)**

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [What We Built](#what-we-built)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Pages & Routes](#pages--routes)
- [Layouts](#layouts)
- [Accessibility Features](#accessibility-features)
- [Floating Accessibility Toolkit](#floating-accessibility-toolkit)
- [Game Engine](#game-engine)
- [Game Builder](#game-builder)
- [Social & Real-Time Features](#social--real-time-features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Backend API Configuration](#backend-api-configuration)
- [Theme System](#theme-system)
- [Notebook & DOCX Pipeline](#notebook--docx-pipeline)
- [Existing Bugs](#existing-bugs)
- [Next Goals](#next-goals)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Static site generator | [Jekyll](https://jekyllrb.com/) |
| Templating | Liquid + HTML |
| Styling | SASS / CSS custom properties |
| JavaScript | Vanilla ES6+ (no framework) |
| AI Chat | Groq LLaMA 3.3 70B via `/api/uesl-chat` |
| TTS | Web Speech API (`window.SpeechSynthesis`) |
| Game Audio | Web Audio API (`AudioContext`) |
| Real-time presence | Flask-SocketIO (port 8501) |
| Face tracking | Custom `face-tracker.js` |
| Voice commands | Web Speech API (`webkitSpeechRecognition`) |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Handoff — Read This First

**Live site**: https://ueslhub.opencodingsociety.com  
**Backend repo**: [MalwareMadness-backend](https://github.com/unified-esports-league/MalwareMadness-backend) — Flask API on port 8424, Socket.IO on port 8501  
**Backend API base**: `https://uesl.opencodingsociety.com`

### What's Built and Working

| Feature | Status | Where |
|---|---|---|
| Game engine (Canvas + ES modules) | ✅ Working | `assets/js/GameEnginev1.2/` |
| Drag-and-drop Game Maker | ✅ Working | `pages/game-maker.html` |
| Community game gallery | ✅ Working | `GET /api/game/shared` (no auth) |
| UESLCoach — AI enemy (Gemini 2.5 Flash) | ✅ Working | `assets/js/GameEnginev1.2/characters/UESLCoach.js` |
| AI NPCs — conversational (Gemini 2.5 Flash) | ✅ Working | `assets/js/GameEnginev1.2/characters/AiNpc.js` |
| General AI chat (Groq LLaMA 3.3-70b) | ✅ Working | `POST /api/groq/chat` |
| Voice command controls (Web Speech API) | ✅ Working | `GameControl.js` |
| Face tracking controls (MediaDevices) | ✅ Working (drifts — see bugs) | `GameControl.js` |
| Touch D-pad controls | ✅ Working | `TouchControls.js` |
| Per-game leaderboard | ✅ Working | `Leaderboard.js` → `GET /api/game/leaderboard/<id>` |
| Live session scoreboard | ✅ Working | `Scoreboard.js` → Socket.IO port 8501 |
| 2-player co-op multiplayer | ✅ Working | WebSocket rooms via `POST multiplayer.py` |
| Auth (OTP + Google OAuth + JWT) | ✅ Working | `POST /api/otp/*`, `POST /api/google/auth` |
| Friends + DMs + presence | ✅ Working | `POST /api/friends/*`, `GET /api/messages/<uid>` |
| Character select screen | ✅ Exists | `CharacterSelect.js` — **character change not wired into editor** (bug) |
| 8 IDD accessibility modes | ✅ Working | Configured per-level in game data |

### Known Bugs to Fix

See the [Existing Bugs](#existing-bugs) section below — 8 open issues, all frontend.  
**Highest priority**: face tracking drift, character not changeable, Game Builder mobile scroll.

### Where to Take Off From

These are the next logical features in priority order:

1. **Fix character selection in Game Maker** — `CharacterSelect.js` exists and works in-game; it just isn't connected to the editor's save flow. Wire it into `POST /api/game/save` payload.
2. **Fix face tracking drift** — add a recalibrate button or auto-reset baseline on idle. Look at how the landmark model sets the neutral pose in `GameControl.js`.
3. **Spanish localization** — replace the Google Translate widget with a proper i18n pass. Wendy Muñoz on the UESL client services team serves many Spanish-speaking families and this is a client ask.
4. **Eye-tracking input** — WebGazer.js integration as a 5th input mode. Same pattern as face tracking in `GameControl.js`.
5. **Tournament bracket page** — UESL runs in-person bracket tournaments. A dedicated page with live bracket UI tied to the leaderboard API would close the loop between online and in-person competition.
6. **Coach dashboard** — an admin view for UESL coaches to track per-participant game scores and session history. Backend already has the data (`/api/game/leaderboard`, `/api/analytics`); it just needs a frontend.
7. **PWA / offline mode** — service worker so the game builder works at low-connectivity school sites.

### Running Locally

```bash
bundle install
make          # serves at http://localhost:4500
```

The site talks to the backend at `http://localhost:8424` in dev. Make sure the backend is running too, or set `javaURI` / `pythonURI` in `assets/js/api/config.js`.

---

## What We Built

### Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Hero section with animated counters, mission value cards, and call-to-action |
| About | `/about/` | Full org story, team profiles (management, marketing, advisory board), and partner logos |
| Locations | `/locations/` | Cards for all 7 UESL tech centers across San Diego and Imperial Valley |
| Play | `/play/` | Embedded UESL Game Builder v1.2 with feature overview |
| Contact | `/contact/` | Formspree-powered intake form + phone/email directory + social links + donate button |

### Game Builder (v1.2)

An accessible browser-based platformer editor embedded in the Play page. Key features:

- **Level Designer** — place platforms, enemies, coins, and goals with a drag-and-drop editor
- **Play Mode** — keyboard, D-pad, or on-screen touch controls
- **Face Tracking** — head-movement control via webcam (no hands required)
- **Voice Commands** — say "jump", "left", "right" for fully voice-navigable gameplay
- **Save & Share** — save up to 20 games to localStorage, export/import as JSON
- **AI Car Racer** — race mode with an AI opponent

### Accessibility Toolkit

Sitewide floating accessibility panel (🛠️ button, bottom-right) including:

- High contrast mode, OpenDyslexia font, large text, slow animations
- Reading ruler, focus mode, text-to-speech, summarize page
- Keyboard shortcuts, language selector (20+ languages), color theme picker
- Active-friends sidebar (powered by backend presence API)
- Built-in AI chatbot (UESL Assistant powered by Groq)

### Layout System

Custom Jekyll layouts built specifically for UESL:

- `uesl.html` — main site layout with nav, footer, and full accessibility toolkit
- `uesl-app.html` — full-viewport app shell for the game builder
- `ecentricolor.html` — secondary dark layout
- `gamebuilder.html` — game builder page layout
- `student_toolkit.html` — auth-gated student tools dashboard

---

## Project Structure

```
MalwareMadness/
├── _config.yml              # Jekyll config (title: UESL, port 4700)
├── Makefile                 # All dev commands (make, make dev, make stop, etc.)
├── _layouts/                # Page layouts
│   ├── uesl.html            # Master UESL layout (3600+ lines, accessibility toolkit built-in)
│   ├── uesl-app.html        # Full-viewport app shell
│   ├── ecentricolor.html    # Secondary dark layout
│   ├── gamebuilder.html     # Game builder page layout
│   ├── student_toolkit.html # Student tools dashboard
│   └── ...                  # 30+ other layouts (posts, lessons, etc.)
├── _includes/               # Reusable HTML components
│   ├── uesl-accessibility-game.html  # IDD-friendly arena game (canvas)
│   └── ...                  # 40+ other includes
├── pages/                   # UESL site pages
│   ├── uesl-home.html       # Home (/)
│   ├── uesl-about.html      # About (/about/)
│   ├── uesl-contact.html    # Contact (/contact/)
│   ├── uesl-locations.html  # Locations (/locations/)
│   └── uesl-play.html       # Play / Game Maker (/play/)
├── assets/
│   └── js/
│       ├── GameEnginev1/         # Game engine v1 (base platformer)
│       ├── GameEnginev1.1/       # Game engine v1.1 (+ leaderboard, coins, mini platformer)
│       ├── GameEnginev1.2/       # Game engine v1.2 (+ attack NPCs, UESL coach, game builder)
│       ├── user-preferences.js   # Site-wide theme/TTS/language preferences
│       └── keyboard-shortcuts.js # Alt+Shift keyboard navigation
├── _data/
│   └── toolkit.yml          # Student toolkit links/cards data
├── images/                  # UESL team and org photos
└── _notebooks/ / _posts/    # Blog posts and Jupyter notebook lessons
```

---

## Local Development

### Prerequisites

- **Ruby** (3.x recommended) + **Bundler**
- **Python** 3.9+ (for notebook conversion)
- **Node.js** (for `tslab` Jupyter kernel, optional)

### First-time setup

```bash
# Clone and enter the repo
git clone https://github.com/unified-esports-league/MalwareMadness.git
cd MalwareMadness

# macOS
./scripts/activate_macos.sh

# Ubuntu/WSL
./scripts/activate_ubuntu.sh

# Install Ruby gems
bundle install
```

### Running the dev server

```bash
make          # Full build + watch (port 4700)
make dev      # Fast dev mode (skips some processing)
```

Open **http://localhost:4700** in your browser. Jekyll will auto-regenerate on file save.

### Other useful commands

| Command | Description |
|---|---|
| `make stop` | Kill the server running on port 4700 |
| `make clean` | Stop server and remove all built files |
| `make convert` | Convert `.ipynb` notebooks and `.docx` files to Markdown |
| `make touch` | Bust incremental cache (forces rebuild of `uesl.html` pages) |
| `make build-current` | One-time build without watching |

### Theme switching (development only)

```bash
make use-minima      # Default theme
make use-cayman      # Cayman theme
make use-hydejack    # Hydejack theme
make use-so-simple   # So Simple theme
make use-yat         # Yet Another Theme
```

---

## Pages & Routes

| Route | Page | Layout |
|---|---|---|
| `/` | Home | `uesl` |
| `/about/` | About UESL | `uesl` |
| `/contact/` | Contact | `uesl` |
| `/locations/` | Locations | `uesl` |
| `/play/` | Build & Play Game | `uesl` |
| `/gamebuilder` | Game Builder | `gamebuilder` |
| `/gamebuilderv1-1` | Game Builder v1.1 | `gamebuilder` |
| `/gamebuilderv1-2` | Game Builder v1.2 (embedded in `/play/`) | `gamebuilder` |
| `/dashboard` | Student Dashboard | various |
| `/profile` | User Profile | various |
| `/stats` | Game Stats / Leaderboard | various |
| `/gamify/character-select` | Character Select | various |
| `/login` | Login (served by backend) | — |

---

## Layouts

### `uesl.html` — Master Layout

The primary layout for all UESL pages. Contains:

- **Navigation** with skip-to-content link (`<a href="#main" class="skip-link">`)
- Full **CSS design system** with custom properties (`--bg`, `--surface`, `--cyan`, `--purple`, `--gold`, `--green`)
- **Floating accessibility toolkit** (🛠️ FAB button, bottom-right)
- **Active friends** sidebar (fetches `/api/active-users`, heartbeat every 120s)
- **Keyboard shortcuts** integration
- **ARIA landmarks** throughout (`role="dialog"`, `role="menu"`, `role="region"`)
- `:focus-visible` outline: `2px solid var(--cyan)` on all interactive elements

### `uesl-app.html` — Full-Viewport App Shell

Full-screen layout for the game builder — no nav/footer chrome.

### `ecentricolor.html` — Secondary Dark Layout

Clean dark-theme layout used for additional pages.

### `gamebuilder.html` — Game Builder Layout

Hosts the drag-and-drop level designer and play mode.

### `student_toolkit.html` — Student Tools Dashboard

Auth-gated page (redirects to `/login` after 2s if not authenticated). Renders tool cards from `_data/toolkit.yml`:
- Calendar, Submission Page, Grade Assignment, Bathroom System, Group Page, Screen Queue, Grade Viewer, Team Teach Signup

---

## Accessibility Features

UESL is built **accessibility-first** for IDD users. Features span the entire platform:

### IDD-Friendly Arena Game (`_includes/uesl-accessibility-game.html`)

A fully self-contained canvas-based maze game designed specifically for IDD students:

- **Maze generation**: Recursive backtracker algorithm with `xorshift32` seeded RNG (deterministic, reproducible mazes)
- **Corridor splines**: Catmull-Rom splines (`crPt()`, `crTan()`) guide player movement through corridors
- **Three difficulty levels**:
  - Easy: 6×4 maze, 1 NPC at 0.9 speed
  - Medium: 9×7 maze, 2 NPCs
  - Hard: 9×7 maze, 3 NPCs at 2.2/1.9/1.7 speed
- **Slow Mode**: `speedScale = 0.45` (all movement at 45% speed)
- **High Contrast**: Black background, white walls, yellow ★ symbols on circles
- **Single-Button Mode**: SPACE cycles direction (R→D→L→U), ENTER moves — playable with one key
- **Guided Mode**: Visual path hints for players who need navigation support
- **Procedural audio** via Web Audio API:
  - Collect: 660→880→1100 Hz sine arpeggio
  - Hit: 180 Hz sawtooth
  - Win: [523, 659, 784, 1047] Hz arpeggio
- Canvas ARIA: `role="img"` with descriptive `aria-label`
- Badge: `♿ IDD-Friendly`

### Reading Ruler

A translucent horizontal band that follows the mouse, helping users track their position on the page:

```css
#reading-ruler {
  position: fixed;
  height: 30px;
  background: rgba(0, 212, 255, 0.09);
  border-top/bottom: 2px solid rgba(0, 212, 255, 0.35);
}
```

### High Contrast Mode

Applied as a class on `<html>`:

```css
html.tk-high-contrast {
  --bg: #000; --surface: #0d0d0d; --text: #fff; --cyan: #ff0;
}
html.tk-high-contrast a { color: #ff0 !important; }
```

### OpenDyslexia Font

Loaded on-demand from CDN (`cdn.jsdelivr.net/npm/opendyslexic`):

```css
html.tk-dyslexia {
  font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important;
  letter-spacing: .04em;
  word-spacing: .1em;
  line-height: 1.7 !important;
}
```

### Focus Mode

Dims navigation and footer so users can concentrate on content:

```css
html.tk-focus #nav   { opacity: .15; }
html.tk-focus footer { opacity: .08; pointer-events: none; }
```

### Text-to-Speech (TTS)

- Provided by `user-preferences.js` via Web Speech API
- `speakSelection()`: reads highlighted text (`window.getSelection().toString()`)
- Configurable voice, rate, pitch, and volume — persisted to `localStorage`

---

## Floating Accessibility Toolkit

A 🛠️ FAB button (fixed, bottom-right) opens a 272px-wide toolkit panel with 12 accessibility controls:

| Button | Function |
|---|---|
| High Contrast | Toggles `tk-high-contrast` class on `<html>` |
| OpenDyslexia Font | Loads and applies OpenDyslexia via CDN |
| Large Text | Scales `font-size` up |
| Slow Animations | Adds `reduce-motion` preference |
| Reading Ruler | Shows/hides the horizontal tracking ruler |
| Focus Mode | Dims nav and footer |
| Text-to-Speech | Reads selected text aloud |
| Summarize Page | Extracts `#main` text (up to 1800 chars), sends to AI chatbot |
| Keyboard Shortcuts | Opens the shortcuts help overlay |
| Language | Applies Google Translate for 20+ languages |
| Color Theme | Opens theme picker (6 presets) |
| Chat / Ask UESL | Opens the AI chatbot window |

**State persistence**: All toggle states are saved to `localStorage` under the key `uesl_toolkit` and restored on every page load.

### AI Chatbot (UESL Assistant)

- Embedded in the toolkit panel as a chat window
- Calls `POST /api/uesl-chat` on the Flask backend (Groq LLaMA 3.3 70B)
- Maintains a sliding window of the last 10 user messages
- Knows UESL mission, locations, contact info, and game features
- "Summarize" button auto-fills the input with page content and sends immediately
- Endpoint switches automatically: `http://localhost:8424` (local) or `https://uesl.opencodingsociety.com` (production)

---

## Game Engine

Three versions of the UESL platformer game engine live in `assets/js/`:

### v1 — Base Platformer (`GameEnginev1/`)

Core platformer framework:

- `GameLevelBasic.js`, `GameLevelWater.js`, `GameLevelDesert.js`, `GameLevelOverworld.js` — level configs
- `SoundManager.js` — audio management
- `DialogueSystem.js` / `DialogBox.js` — in-game dialogue
- `Market.js` / `Inventory.js` / `FinTech.js` — in-game economy (FortuneFinders)
- `Meteor.js`, `Projectile.js`, `Shark.js`, `Goldfish.js`, `Pufferfish.js` — game entities
- `Quiz.js` — embedded quiz system
- `NpcProgressSystem.js` — NPC waypoint tracking

### v1.1 — Extended (`GameEnginev1.1/`)

Adds on top of v1:

- `Coin.js` — collectible coins
- `Leaderboard.js` — in-game score leaderboard
- `PlatformerMini.js` — mini platformer embed
- `scorefeature.js` / `scoreSettings.js` — scoring system
- `levelskipfeature.js` — level skip for testing

### v1.2 — Full Featured (`GameEnginev1.2/`)

Adds on top of v1.1:

- `AttackNpc.js` — combat NPCs
- `Star.js` — collectible stars
- `UESLCoach.js` — in-game UESL coach character
- Game builder support (in `builder/` subdirectory)

---

## Game Builder

The drag-and-drop level designer (`/gamebuilderv1-2`) allows students to:

- Place platforms, enemies, coins, and goals
- Choose character skins
- Play their custom level immediately
- Save up to 20 levels to browser localStorage
- Export/import levels as JSON
- Race against an AI opponent (AI Car Racer mode)

The Play page (`/play/`) embeds the game builder in a full-screen `<iframe>`:

```html
<iframe
  src="{{ site.baseurl }}/gamebuilderv1-2?embed=1"
  allow="camera; microphone"
  loading="lazy"
></iframe>
```

`allow="camera; microphone"` enables face tracking and voice command controls.

---

## Social & Real-Time Features

Social features render via the toolkit and dedicated pages, all backed by the Flask API:

- **Friends**: `/api/friendship/*` — send, accept, decline friend requests
- **Active users**: `GET /api/active-users` — shows who's online (5-minute presence window)
- **Heartbeat**: `POST /api/heartbeat` — called on load and every 120 seconds
- **Microblog**: `/api/microblog/*` — posts, replies, reactions
- **Social posts**: `/api/post/*` — social media-style feed
- **Multiplayer**: Socket.IO on port 8501 (separate service)

---

## Keyboard Shortcuts

All shortcuts use **`Alt + Shift + key`** — a combination that doesn't conflict with browser defaults.

| Shortcut | Destination |
|---|---|
| `Alt+Shift+H` | Home (`/`) |
| `Alt+Shift+P` | Profile (`/profile`) |
| `Alt+Shift+D` | Dashboard (`/dashboard`) |
| `Alt+Shift+L` | Login (`/login`) |
| `Alt+Shift+G` | Play/Game (`/play/`) |
| `Alt+Shift+C` | Character Select (`/gamify/character-select`) |
| `Alt+Shift+S` | Stats (`/stats`) |
| `Alt+Shift+A` | About (`/about/`) |
| `Alt+Shift+?` | Show keyboard shortcuts help overlay |

Shortcuts are disabled when focus is inside `<input>`, `<textarea>`, `contentEditable`, or `.CodeMirror`. The help overlay is also accessible via `window.showKeyboardHelp()` (called by the toolkit button).

---

## Backend API Configuration

The frontend auto-detects local vs. production:

```js
const BACKEND = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8424'
  : 'https://uesl.opencodingsociety.com';
```

**No `.env` file is needed for the frontend** — all backend URLs switch automatically based on hostname.

---

## Theme System

`user-preferences.js` manages a 30+ CSS custom property theme system. Six presets are available:

| Preset | Description |
|---|---|
| Site Default | UESL dark theme (default) |
| Midnight | Deep dark blue |
| Light | Clean light mode |
| Green | Matrix-style green |
| Sepia | Warm reading mode |
| Cyberpunk | High-energy neon |
| Ocean | Calm blue tones |

Preferences sync to the backend via `GET /api/user/preferences` (when logged in) or fall back to `localStorage` under the key `sitePreferences`.

---

## Notebook & DOCX Pipeline

UESL supports Jupyter notebooks and Word documents as blog posts:

```bash
make convert    # Converts .ipynb → .md and .docx → .md
```

Supported Jupyter kernels:
- **Python3** (`ipykernel`)
- **Java** (`IJava` or `jbang-ijava`)
- **JavaScript** (`tslab`)

Install `tslab`:
```bash
npm install -g tslab
tslab install
```

---

## Existing Bugs

- **Face tracking calibration drift** — head-movement baseline can drift during long sessions, causing unintended inputs; requires manual page reload to reset
- **Game Builder mobile scroll** — drag-and-drop level editor does not correctly handle touch-scroll vs. tile-place disambiguation on small screens
- **Voice command false positives** — ambient noise can occasionally trigger jump/move commands when the microphone is open
- **Hero counter animation** — counters sometimes skip to their final value on slow connections instead of animating up
- **Iframe embed height** — the Game Builder iframe in the Play page clips on certain viewport sizes between 768–900px wide
- **Language selector defaults to Hindi** — the Google Translate widget does not persist user selection and resets to Hindi on every page load
- **Gamebuilder splines are glitchy** — spline-based enemy paths can behave erratically when edited, especially with tight curves or many control points
- **Character isn't changeable** — the player character is locked to a single sprite and cannot be customized in the level editor, despite the code supporting multiple character options

---

## Next Goals

- **Leaderboard integration** — connect game scores to `/api/game/score` and display a live top-10 board on the Play page
- **User accounts in game builder** — allow logged-in participants to save games to the server (not just localStorage) so progress persists across devices
- **More accessibility input modes** — eye-tracking via WebGazer.js, single-switch scanning for participants who cannot use standard controls
- **Tournament bracket page** — dedicated page for UESL esports tournaments with live bracket UI
- **Spanish localization** — full i18n for the site; Wendy Muñoz and the client services team serve many Spanish-speaking families
- **Coach dashboard** — internal view for coaches to track participant progress tied to the game API
- **PWA / offline mode** — service worker caching so the game builder works without internet at low-connectivity school sites

---

## Deployment

This site deploys automatically to **GitHub Pages** via GitHub Actions on every push to `main`.

**Setup** (one-time):
1. Go to repository **Settings → Pages → Build and deployment**
2. Set source to **GitHub Actions**
3. Ensure `_config.yml` has:
   ```yaml
   baseurl: ""
   github_username: unified-esports-league
   ```

GitHub Actions runs `bundle exec jekyll build` and publishes `_site/`.

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Test locally with `make`
4. Run `make convert` if you added any notebooks
5. Submit a Pull Request to `main`

### File naming for blog posts

```
_posts/YYYY-MM-DD-your-title.md
_notebooks/YYYY-MM-DD-your-title.ipynb
```

Dates must be `YYYY-MM-DD` with zero-padded month/day. Future-dated posts require `future: true` in `_config.yml` (already set).

---

## Team

Built by the **UESL / MalwareMadness** team for AP CSP 2025–2026.

- Accessibility toolkit, IDD arena game, Groq AI integration, summarize feature — **Sathwik Kintada** (Wick2009)
- Social hub, friend system, DM system — teammate contributions
- Login/OTP, profile picture upload — teammate contributions
- Game engine, game loop, game characters, game builder, multiplayer — teammate contributions
- Leaderboard, Socket.IO multiplayer system — teammate contributions

---

## License

This project is a derivative work built on top of the Open Coding Society `pages` template (Apache 2.0). The UESL-specific content — layouts, game builder, and site pages — is copyright 2025–2026 Unified Esports League and the contributing student developers.
