# UESL — Unified Esports League · Frontend

This is the public-facing website for the **Unified Esports League (UESL)**, a San Diego-based nonprofit that uses gaming and technology to help people with intellectual and developmental disabilities build confidence, friendships, and real-world skills.

Built with **Jekyll** and hosted on **GitHub Pages**. Designed and developed by students in the Del Norte High School AP CSP program as a community service project.

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

Sitewide accessibility panel including:
- Font size scaling
- Keyboard shortcuts (`Alt+Shift+*`)
- Active-friends sidebar (powered by backend presence API)
- Revert-to-defaults

### Layout System

Four custom Jekyll layouts built specifically for UESL:

- `uesl.html` — main site layout with nav and footer
- `uesl-app.html` — full-viewport app shell for the game builder
- `uesl-accessibility-game.html` — accessibility-first game layout
- `uesl-infograph.html` — infographic/data layout

---

## Existing Bugs

- **Face tracking calibration drift** — head-movement baseline can drift during long sessions, causing unintended inputs; requires manual page reload to reset
- **Game Builder mobile scroll** — drag-and-drop level editor does not correctly handle touch-scroll vs. tile-place disambiguation on small screens
- **Voice command false positives** — ambient noise can occasionally trigger jump/move commands when the microphone is open
- **Hero counter animation** — counters sometimes skip to their final value on slow connections instead of animating up
- **Iframe embed height** — the Game Builder iframe in the Play page clips on certain viewport sizes between 768–900px wide
- **Language selector always default to translate in Hindi despite picking a different language** — the Google Translate widget does not persist user selection and defaults back to Hindi on every page load
- **Gamebuilder Splines are glitchy** — the spline-based enemy paths can sometimes behave erratically when edited, especially with tight curves or many control points
- **Charecter isn't changinable** — the player character is currently locked to a single sprite and cannot be customized by users in the level editor despite the code supporting multiple character options
---

## Next Goals

- **Leaderboard integration** — connect game scores to the backend `/api/game/score` endpoint and display a live top-10 board on the Play page
- **User accounts in game builder** — allow logged-in UESL participants to save games to the server (not just localStorage) so progress persists across devices
- **More accessibility input modes** — eye-tracking support via WebGazer.js, single-switch scanning for participants who cannot use standard controls
- **Tournament bracket page** — dedicated page for UESL esports tournaments with live bracket UI
- **Spanish localization** — full i18n for the site; Wendy Muñoz and the client services team serve many Spanish-speaking families
- **Coach dashboard** — internal view for coaches to track participant progress tied to the game API
- **PWA / offline mode** — service worker caching so the game builder works without internet at low-connectivity school sites

---

## Setup

### Prerequisites

- Ruby (for Jekyll)
- Node.js (for any JS build steps)
- Python 3 (for Jupyter notebook conversion, optional)

### Run locally

```bash
git clone <this-repo>
cd <repo>
bundle install
make
```

The site is served at `http://0.0.0.0:4500/`.

### Deploy

Push to `main`. GitHub Actions rebuilds and publishes automatically via the Jekyll workflow.

---

## Project Structure

```
pages/
  uesl-home.html        # Home page content
  uesl-about.html       # About page content
  uesl-locations.html   # Locations page content
  uesl-play.html        # Play page + game builder embed
  uesl-contact.html     # Contact form and info
  game-maker.html       # Standalone game builder app
  assets/js/            # Game engine JavaScript
_layouts/
  uesl.html             # Main UESL site layout
  uesl-app.html         # Full-viewport app layout
  uesl-accessibility-game.html
  uesl-infograph.html
_includes/              # Shared partials (nav, footer, accessibility panel)
images/                 # UESL team and org photos
_config.yml             # Jekyll site config
```

---

## License

See [LICENSE](LICENSE). This project is a derivative work built on top of the Open Coding Society `pages` template (Apache 2.0). The UESL-specific content — layouts, game builder, and site pages — is copyright 2025–2026 Unified Esports League and the contributing student developers.
