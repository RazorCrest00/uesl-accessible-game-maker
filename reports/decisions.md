# Decisions

## 2026-09-04 — Preserve the fork relationship

The sprint uses a GitHub fork instead of a detached file copy so inherited history and attribution remain visible and upstream changes can be compared.

## 2026-09-04 — Prototype outside production navigation

The miniature demo lives on `feat/accessible-game-maker-2-demo` at `/game-maker-2-demo/`. It is not linked from production navigation and makes no backend writes. The team can evaluate the frontend direction before choosing an integration boundary.

## 2026-09-04 — Use one shared, versioned state contract

All theme, accessibility, navigation, preview, draft, and review output derives from one normalized object. The exported `uesl_gm2_preview` contract is deliberately labeled as a concept boundary, not a production save or publish format.

## 2026-09-04 — Divide six additions evenly by role

Rohan owns guided flow and themes, Ishan owns accessibility and preview plus Scrum Master facilitation, and Adhvay owns validation/draft logic and review/export. Each person owns two visible additions and their evidence.
