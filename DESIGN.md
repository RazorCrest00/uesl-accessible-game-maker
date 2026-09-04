---
name: UESL Playtest Workbench
description: Guided game-building where each decision stays beside an immediate, accessible preview.
colors:
  night-canvas: "#0d1117"
  panel: "#161b27"
  panel-raised: "#1e2535"
  panel-soft: "#111722"
  text-primary: "#e6edf3"
  text-muted: "#aebdcb"
  border-subtle: "rgba(230, 237, 243, 0.16)"
  border-strong: "rgba(230, 237, 243, 0.3)"
  signal-cyan: "#00d4ff"
  signal-cyan-hover: "#5ee4ff"
  cyan-ink: "#001a20"
  marker-purple: "#9b7cff"
  shell-purple-deep: "#7c3aed"
  focus-gold: "#ffd166"
  success-mint: "#78e3a0"
  danger-coral: "#ff8b8b"
  contrast-canvas: "#000000"
  contrast-text: "#ffffff"
  contrast-signal: "#ffeb3b"
  contrast-secondary: "#7ee8ff"
typography:
  display: { fontFamily: "'Oswald', sans-serif", fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 650, lineHeight: 1.05, letterSpacing: "-0.02em" }
  headline: { fontFamily: "'Oswald', sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 650, lineHeight: 1.05, letterSpacing: "-0.02em" }
  title: { fontFamily: "'Oswald', sans-serif", fontSize: "1.35rem", fontWeight: 650, letterSpacing: "-0.02em" }
  body: { fontFamily: "'Inter', sans-serif", fontSize: "0.92rem", fontWeight: 400, lineHeight: 1.65 }
  label: { fontFamily: "'Inter', sans-serif", fontSize: "0.79rem", fontWeight: 700, lineHeight: 1.4 }
rounded:
  none: "0"
  sm: "8px"
  md: "10px"
  pill: "999px"
  circle: "50%"
spacing:
  micro: "4px"
  tight: "8px"
  control: "10px"
  cluster: "14px"
  panel: "clamp(18px, 2.5vw, 30px)"
  section: "clamp(26px, 4vw, 46px)"
components:
  button-primary: { backgroundColor: "{colors.signal-cyan}", textColor: "{colors.cyan-ink}", typography: "{typography.label}", rounded: "{rounded.sm}", padding: "10px 16px", height: "46px" }
  button-primary-hover: { backgroundColor: "{colors.signal-cyan-hover}", textColor: "{colors.cyan-ink}", rounded: "{rounded.sm}", padding: "10px 16px", height: "46px" }
  button-secondary: { backgroundColor: "{colors.panel-raised}", textColor: "{colors.text-primary}", typography: "{typography.label}", rounded: "{rounded.sm}", padding: "10px 16px", height: "46px" }
  button-quiet: { backgroundColor: "transparent", textColor: "{colors.text-primary}", typography: "{typography.label}", rounded: "{rounded.sm}", padding: "10px 16px", height: "46px" }
  text-field: { backgroundColor: "{colors.panel-soft}", textColor: "{colors.text-primary}", typography: "{typography.body}", rounded: "{rounded.sm}", padding: "11px 14px", height: "48px" }
  choice-card: { backgroundColor: "{colors.panel-soft}", textColor: "{colors.text-primary}", typography: "{typography.body}", rounded: "{rounded.md}", padding: "14px 16px", height: "72px" }
  station-active: { backgroundColor: "{colors.signal-cyan}", textColor: "{colors.cyan-ink}", typography: "{typography.label}", rounded: "{rounded.none}", padding: "10px 14px", height: "58px" }
  status-chip: { backgroundColor: "transparent", textColor: "{colors.success-mint}", typography: "{typography.label}", rounded: "{rounded.pill}", padding: "5px 11px", height: "32px" }
  preview-stage: { rounded: "{rounded.none}", height: "430px", width: "100%" }
---

# Design System: UESL Playtest Workbench

## Overview

**Creative North Star: "Playtest Workbench"**

UESL is expressed as a calm night workbench where the interface stays legible, the live artifact remains visible, and progress feels coached rather than controlled. Density is purposeful: status, decision, and response share one frame, while advanced mechanics recede until the participant asks for them.

The system is direct, tool-like, and game-aware. It rejects both marketing-page spectacle and the wall of controls associated with professional editors. The workbench chrome stays stable while the miniature game world supplies the color, movement, and delight, so users can always distinguish the tool from the thing they are making.

**Key Characteristics:**

- A four-layer navy surface stack with crisp one-pixel dividers.
- Cyan active states, purple secondary markers, and gold focus cues.
- Condensed Oswald headings paired with highly readable Inter body text.
- One persistent preview that changes in place with every meaningful choice.
- Square outer frames, gently rounded controls, and circular progress markers.
- Accessibility states that visibly change motion, contrast, and control size.

## Colors

The palette is a quiet UESL night environment punctuated by precise cyan, purple, and gold signals.

### Primary

- **Signal Cyan / Hover / Ink:** Current progress, selection, primary action, links, and their readable filled-control contrast.

### Secondary

- **Workbench Purple / Deep Shell Purple:** Secondary brand markers in the workbench and inherited shell.
- **High-Contrast Secondary:** Cool differentiation when the contrast preference is active.

### Tertiary

- **Focus Gold:** Keyboard focus and bright stage landmarks.
- **Success Mint / Danger Coral:** Completion and validation feedback.
- **High-Contrast Signal:** Active-state replacement for cyan in high-contrast mode.

### Neutral

- **Night Canvas / Workbench Panel / Raised Panel / Soft Inset Panel:** The four-layer structural stack.
- **Primary Text / Muted Text:** Essential content and supporting guidance.
- **Subtle Divider / Strong Divider:** Default structure and interactive emphasis.
- **High-Contrast Canvas / Text:** Black-and-white accessible overrides.

### Named Rules

**The Cyan Means Action Rule.** Cyan is reserved for current progress, selected configuration, primary actions, and navigable links; it should not wash large passive surfaces.

**The Gold Stays Legible Rule.** Gold belongs to keyboard focus and in-game landmarks, never paragraph copy.

**The Stage Palette Is Contained Rule.** Theme colors repaint the preview only; workbench chrome retains the UESL system colors.

## Typography

**Display Font:** Oswald (sans-serif fallback)

**Body Font:** Inter (sans-serif fallback)
**Label/Mono Font:** Inter; ui-monospace, SFMono-Regular, Menlo only for configuration values

Oswald gives short headings a purposeful game-tool voice; Inter keeps instructions, controls, and state feedback easy to scan.

### Hierarchy

- **Display:** Active decision headings, fluid 1.9–3rem, about 18ch maximum.
- **Headline / Title:** Compact project and preview titles, 1.5–2.25rem and 1.35rem.
- **Body:** Instructions and explanations at 0.92rem/1.65, generally near 62ch maximum.
- **Label:** Fields, actions, stations, and status at 0.79rem/1.4; metadata may step down to 0.73–0.76rem.

### Named Rules

**The Two-Voice Rule.** Oswald leads page, station, and preview headings; Inter handles every instruction, status, label, and control, while monospace is reserved for literal configuration data.

## Layout

Use one continuous workbench inside a centered 1320px container. At wide widths, decision and preview form a 0.9/1.1 split with 360px/440px minimums; spacing follows the extracted 4/8/10/14/18/28px rhythm. Keep each decision in the same visible frame as its immediate result.

At 980px, stack preview before decision. At 640px, hold the preview to 190px, keep 112px stations in a contained horizontal rail, and stack actions without page-level horizontal scrolling. Draft or resume state stays visible in the compact header.

## Elevation & Depth

Depth comes from the four navy tones and one-pixel dividers. Only the complete workbench uses a shadow; nested cards remain flat and focus uses an outline.

### Shadow Vocabulary

- **Structural Workbench** (`0 22px 56px rgba(0, 0, 0, 0.28)`): Grounds the complete decision-and-preview frame.

### Named Rules

**The One-Shadow Rule.** Tonal layering and one-pixel dividers do the everyday structural work; reserve the structural shadow for the complete workbench frame.

## Shapes

Keep rails and the outer workbench square. Use 8px corners for fields, buttons, and details; 10px for choice cards; pills for compact status; circles for station markers and game objects. Stage geometry may be playful, but it does not reshape the workbench chrome.

## Components

### Buttons

- **Primary:** Cyan fill and dark ink; hover brightens. **Secondary:** Raised navy with a strong border. **Quiet:** Transparent.
- All variants use a 46px minimum height, 8px radius, 10px/16px padding, bold Inter, and a 3px gold focus outline offset by 3px. Disabled opacity is 45%.

### Chips

- Transparent pill, strong border, and mint text for live preview status; state changes use text and a live region.

### Cards / Containers

- Soft inset background, subtle one-pixel border, 8–10px corners, and no nested shadow. Selection adds a cyan border and low-opacity cyan tint.

### Inputs / Fields

- Soft inset fill, strong border, 8px corners, 48px minimum height, and 11px/14px padding. Focus is gold; errors pair a coral edge with direct text.

### Navigation

- Equal station cells share one rail. Resting labels are muted, the active cell fills cyan, and completed markers turn mint. On phones, keep one scrollable row and center the active station only when motion preferences allow.

### Persistent Preview

The signature component combines a compact heading/status bar, uninterrupted stage, three-cell readout, and boundary note. It repaints in place for theme and comfort choices; reduced motion replaces travel with an immediate settled player position.

## Do's and Don'ts

### Do:

- **Do** use cyan to identify the current station, selected option, primary action, and interactive link.
- **Do** keep the active decision and its visible outcome in the same frame.
- **Do** preserve the 3px gold focus outline with 3px offset, direct error language, reduced-motion response, and at least 44px control targets.
- **Do** keep the phone preview compact at 190px and above the active decision while the station rail scrolls inside its own bounds.
- **Do** use one-pixel dividers and tonal surfaces before introducing a new shadow.

### Don't:

- **Don't** spread stage-theme colors into builder chrome.
- **Don't** hide draft, restored, or session-only state behind an icon or tooltip.
- **Don't** round the entire application into floating cards; the outer workbench remains a square, continuous frame.
- **Don't** use Oswald for paragraphs, help text, form values, or status messages.
- **Don't** imply server saving, publishing, or completed integration through color or copy.
