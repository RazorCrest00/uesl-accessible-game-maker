"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyPreset,
  createPreviewConfig,
  isHexColor,
  normalizeState,
  parseDraft,
  validateAll,
  validateStep
} = require("../assets/js/game-maker-2-demo.js");

function validState() {
  return normalizeState({
    version: 1,
    currentStep: 5,
    gameName: "Skyway Quest",
    template: "platformer",
    theme: "mesa",
    accent: "#35d0ba",
    accessibility: {
      preset: "custom",
      reducedMotion: true,
      highContrast: true,
      largeControls: false,
      speed: "slow"
    },
    previewState: "paused"
  });
}

test("normalization keeps supported choices and rejects unsafe values", () => {
  const state = normalizeState({
    version: 1,
    currentStep: 99,
    gameName: "  Orbit Builder",
    template: "unknown",
    theme: "unknown",
    accent: "javascript:alert(1)",
    accessibility: {
      preset: "unknown",
      reducedMotion: "yes",
      highContrast: true,
      largeControls: false,
      speed: "warp"
    },
    previewState: "crashed"
  });

  assert.equal(state.currentStep, 5);
  assert.equal(state.gameName, "Orbit Builder");
  assert.equal(state.template, "platformer");
  assert.equal(state.theme, "coast");
  assert.equal(state.accent, "#ffd166");
  assert.equal(state.accessibility.reducedMotion, true);
  assert.equal(state.accessibility.highContrast, true);
  assert.equal(state.accessibility.speed, "steady");
  assert.equal(state.previewState, "ready");
});

test("the start step requires a useful game name", () => {
  const emptyState = normalizeState({ version: 1, gameName: "A" });
  assert.deepEqual(validateStep(0, emptyState), ["Enter a game name with at least 2 characters."]);
  assert.deepEqual(validateStep(0, validState()), []);
});

test("accessibility presets replace the complete preference group", () => {
  const contrastState = applyPreset(validState(), "contrast");
  assert.deepEqual(contrastState.accessibility, {
    preset: "contrast",
    reducedMotion: true,
    highContrast: true,
    largeControls: false,
    speed: "steady"
  });
});

test("draft parsing restores valid state and rejects corrupted data safely", () => {
  const original = validState();
  const restored = parseDraft(JSON.stringify(original));
  const corrupted = parseDraft("{not-json");
  const incompatible = parseDraft(JSON.stringify({ version: 8, gameName: "Old format" }));

  assert.equal(restored.restored, true);
  assert.deepEqual(restored.state, original);
  assert.equal(corrupted.restored, false);
  assert.match(corrupted.error, /could not be read/i);
  assert.equal(incompatible.restored, false);
  assert.match(incompatible.error, /unsupported format/i);
});

test("draft parsing rewinds incomplete review drafts to the first invalid step", () => {
  const incompleteReview = parseDraft(JSON.stringify({
    ...validState(),
    currentStep: 5,
    gameName: ""
  }));

  assert.equal(incompleteReview.restored, true);
  assert.equal(incompleteReview.state.currentStep, 0);
  assert.deepEqual(validateStep(0, incompleteReview.state), ["Enter a game name with at least 2 characters."]);
});

test("the preview handoff is versioned and explicitly prevents backend writes", () => {
  const config = createPreviewConfig(validState());
  assert.equal(config.schema, "uesl_gm2_preview");
  assert.equal(config.version, 1);
  assert.equal(config.mode, "concept-demo");
  assert.equal(config.backendWrite, false);
  assert.equal(config.game.name, "Skyway Quest");
  assert.equal(config.game.theme, "mesa");
  assert.equal(config.accessibility.speed, "slow");
});

test("valid state clears the complete validation gate", () => {
  assert.deepEqual(validateAll(validState()), []);
  assert.equal(isHexColor("#35d0ba"), true);
  assert.equal(isHexColor("#123"), false);
});
