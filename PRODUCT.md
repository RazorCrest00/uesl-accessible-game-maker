# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are UESL participants, including people with intellectual and developmental disabilities, who want to create and play a browser game without navigating a dense professional-style editor. Coaches and facilitators may help participants choose settings, but the guided path should remain usable without continuous assistance.

## Product Purpose

Accessible Game Maker 2.0 extends the inherited UESL Game Maker with a calm, guided frontend journey from an idea to a configured, playable, saved game. Success means a first-time user can make choices, understand their progress, apply accessibility preferences, test the result, correct an error, and recover a browser draft.

## Positioning

The project does not replace the working editor or game engine. It adds a one-decision-at-a-time layer that translates simple user choices into the inherited Game Maker configuration and preview contracts.

## Operating Context

This is a two-week AP CSP frontend sprint completed by Ishan, Rohan, and Adhvay. Development uses GitHub Issues, short feature branches, teammate pull-request reviews, repeatable testing, and portfolio evidence linked from each work item.

## Capabilities and Constraints

- Reuse `pages/game-maker.html`, `_layouts/uesl-app.html`, `assets/js/GameEnginev1.2/`, and the existing local/account save behavior.
- Keep the advanced editor available; do not rewrite the inherited engine or backend.
- The first sprint supports one proven template and a small set of themes and accessibility settings.
- Multiplayer, AI generation, uploads, accounts, public publishing, and new backend endpoints are out of scope.
- The initial design artifact is a branch-only concept demo with no production navigation link and no backend writes.

## Brand Commitments

Preserve the UESL name, mission, existing logo assets, direct language, and the inherited navy/cyan/purple interface family. The experience should feel like an approachable game-building tool rather than a marketing page.

## Evidence on Hand

- `README.md` documents the inherited platform, active engine, Game Maker, accessibility toolkit, local storage, and known limitations.
- `pages/game-maker.html` contains the current editor, preview, theme, and save/load behavior.
- `_layouts/uesl-app.html` contains the application shell and core design tokens.
- GitHub Issues #1–#4 define the Big Issue and role-aligned responsibilities.

## Product Principles

- Show one clear decision at a time.
- Preserve user choices across navigation and refresh.
- Reuse inherited working systems through documented contracts.
- Make accessibility settings visible, understandable, and immediately testable.
- Leave verifiable evidence for every implementation and revision.

## Accessibility & Inclusion

The guided path must support keyboard-only use, visible focus, reduced motion, high contrast, large controls, plain-language feedback, 200% zoom, and phone layouts without horizontal page scrolling.
