(function gameMaker2DemoModule(globalScope) {
  "use strict";

  const STORAGE_KEY = "uesl.gameMaker2.demo.v1";
  const SCHEMA = "uesl_gm2_preview";
  const THEMES = Object.freeze({
    coast: "Pixel Coast",
    mesa: "Mesa Sunset",
    orbit: "Quiet Orbit"
  });
  const SPEEDS = Object.freeze(["slow", "steady", "quick"]);
  const PRESETS = Object.freeze({
    calm: Object.freeze({
      reducedMotion: true,
      highContrast: false,
      largeControls: true,
      speed: "steady"
    }),
    contrast: Object.freeze({
      reducedMotion: true,
      highContrast: true,
      largeControls: false,
      speed: "steady"
    }),
    large: Object.freeze({
      reducedMotion: false,
      highContrast: false,
      largeControls: true,
      speed: "steady"
    })
  });
  const PRESET_LABELS = Object.freeze({
    calm: "Calm",
    contrast: "High contrast",
    large: "Large controls",
    custom: "Custom settings"
  });
  const STEP_LABELS = Object.freeze(["Start", "Choose", "Theme", "Comfort", "Preview", "Review"]);
  const STEP_OWNERS = Object.freeze([
    "Guided start",
    "Starting game",
    "Theme Studio",
    "Comfort settings",
    "Safe preview",
    "Setup review"
  ]);

  const DEFAULT_STATE = Object.freeze({
    version: 1,
    currentStep: 0,
    gameName: "",
    template: "platformer",
    theme: "coast",
    accent: "#ffd166",
    accessibility: Object.freeze({
      preset: "calm",
      reducedMotion: true,
      highContrast: false,
      largeControls: true,
      speed: "steady"
    }),
    previewState: "ready"
  });

  function cloneDefaultState() {
    return {
      ...DEFAULT_STATE,
      accessibility: { ...DEFAULT_STATE.accessibility }
    };
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function clampStep(value) {
    const numericStep = Number(value);
    return Number.isInteger(numericStep) ? Math.min(5, Math.max(0, numericStep)) : 0;
  }

  function normalizeState(candidate) {
    const fallback = cloneDefaultState();
    if (!isPlainObject(candidate) || candidate.version !== 1) return fallback;

    const accessibility = isPlainObject(candidate.accessibility) ? candidate.accessibility : {};
    const preset = Object.prototype.hasOwnProperty.call(PRESETS, accessibility.preset)
      ? accessibility.preset
      : accessibility.preset === "custom"
        ? "custom"
        : fallback.accessibility.preset;

    return {
      version: 1,
      currentStep: clampStep(candidate.currentStep),
      gameName: typeof candidate.gameName === "string" ? candidate.gameName.trimStart().slice(0, 32) : "",
      template: candidate.template === "platformer" ? "platformer" : fallback.template,
      theme: Object.prototype.hasOwnProperty.call(THEMES, candidate.theme) ? candidate.theme : fallback.theme,
      accent: isHexColor(candidate.accent) ? candidate.accent.toLowerCase() : fallback.accent,
      accessibility: {
        preset,
        reducedMotion: typeof accessibility.reducedMotion === "boolean" ? accessibility.reducedMotion : fallback.accessibility.reducedMotion,
        highContrast: typeof accessibility.highContrast === "boolean" ? accessibility.highContrast : fallback.accessibility.highContrast,
        largeControls: typeof accessibility.largeControls === "boolean" ? accessibility.largeControls : fallback.accessibility.largeControls,
        speed: SPEEDS.includes(accessibility.speed) ? accessibility.speed : fallback.accessibility.speed
      },
      previewState: ["ready", "running", "paused", "reset"].includes(candidate.previewState)
        ? candidate.previewState
        : fallback.previewState
    };
  }

  function applyPreset(state, presetName) {
    if (!Object.prototype.hasOwnProperty.call(PRESETS, presetName)) return normalizeState(state);
    return normalizeState({
      ...state,
      accessibility: {
        preset: presetName,
        ...PRESETS[presetName]
      }
    });
  }

  function validateStep(step, stateCandidate) {
    const state = normalizeState(stateCandidate);
    const errors = [];

    if (step === 0) {
      const nameLength = state.gameName.trim().length;
      if (nameLength < 2) errors.push("Enter a game name with at least 2 characters.");
      if (nameLength > 32) errors.push("Keep the game name to 32 characters or fewer.");
    }

    if (step === 1 && state.template !== "platformer") {
      errors.push("Choose the supported side-scrolling adventure template.");
    }

    if (step === 2) {
      if (!Object.prototype.hasOwnProperty.call(THEMES, state.theme)) errors.push("Choose a supported theme.");
      if (!isHexColor(state.accent)) errors.push("Choose a valid character color.");
    }

    if (step === 3 && !SPEEDS.includes(state.accessibility.speed)) {
      errors.push("Choose a supported game pace.");
    }

    return errors;
  }

  function validateAll(state) {
    return [0, 1, 2, 3].flatMap((step) => validateStep(step, state));
  }

  function createPreviewConfig(stateCandidate) {
    const state = normalizeState(stateCandidate);
    return {
      schema: SCHEMA,
      version: 1,
      mode: "concept-demo",
      backendWrite: false,
      game: {
        name: state.gameName.trim(),
        template: state.template,
        theme: state.theme,
        characterAccent: state.accent
      },
      accessibility: {
        ...state.accessibility
      }
    };
  }

  function parseDraft(serializedDraft) {
    if (typeof serializedDraft !== "string" || serializedDraft.length === 0) {
      return { state: cloneDefaultState(), restored: false, error: null };
    }

    try {
      const parsed = JSON.parse(serializedDraft);
      if (!isPlainObject(parsed) || parsed.version !== 1) {
        return {
          state: cloneDefaultState(),
          restored: false,
          error: "The saved draft used an unsupported format, so a clean demo was started."
        };
      }
      const restoredState = normalizeState(parsed);
      const firstInvalidStep = [0, 1, 2, 3].find(
        (step) => step < restoredState.currentStep && validateStep(step, restoredState).length > 0
      );
      if (typeof firstInvalidStep === "number") restoredState.currentStep = firstInvalidStep;
      return { state: restoredState, restored: true, error: null };
    } catch (error) {
      return {
        state: cloneDefaultState(),
        restored: false,
        error: "The saved draft could not be read, so a clean demo was started."
      };
    }
  }

  function formatAccessibility(accessibility) {
    const label = PRESET_LABELS[accessibility.preset] || PRESET_LABELS.custom;
    const details = [];
    if (accessibility.reducedMotion) details.push("reduced movement");
    if (accessibility.highContrast) details.push("high contrast");
    if (accessibility.largeControls) details.push("larger controls");
    details.push(`${accessibility.speed} pace`);
    return `${label} · ${details.join(", ")}`;
  }

  function initializeDemo(root) {
    const builder = root.querySelector("#agm2-builder");
    const stationButtons = Array.from(root.querySelectorAll("[data-step]"));
    const stepPanels = Array.from(root.querySelectorAll("[data-step-panel]"));
    const gameNameInput = root.querySelector("#agm2-game-name");
    const accentInput = root.querySelector("#agm2-accent-color");
    const accentValue = root.querySelector("#agm2-accent-value");
    const reducedMotionInput = root.querySelector("#agm2-reduced-motion");
    const highContrastInput = root.querySelector("#agm2-high-contrast");
    const largeControlsInput = root.querySelector("#agm2-large-controls");
    const speedSelect = root.querySelector("#agm2-speed");
    const backButton = root.querySelector("#agm2-back");
    const continueButton = root.querySelector("#agm2-continue");
    const errorOutput = root.querySelector("#agm2-error");
    const announcer = root.querySelector("#agm2-announcer");
    const draftStatus = root.querySelector("#agm2-draft-status");
    const stage = root.querySelector("#agm2-stage");
    const previewStatus = root.querySelector("#agm2-preview-status");
    const exportStatus = root.querySelector("#agm2-export-status");
    let saveTimer = null;
    let resetTimer = null;
    let storageAvailable = true;
    let initialDraft = { state: cloneDefaultState(), restored: false, error: null };

    try {
      initialDraft = parseDraft(globalScope.localStorage.getItem(STORAGE_KEY));
      if (initialDraft.error) globalScope.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      storageAvailable = false;
      initialDraft = { state: cloneDefaultState(), restored: false, error: "Browser storage is unavailable; this demo will not survive a refresh." };
    }

    let state = initialDraft.state;

    function announce(message) {
      announcer.textContent = "";
      globalScope.setTimeout(() => {
        announcer.textContent = message;
      }, 10);
    }

    function showError(message) {
      errorOutput.textContent = message || "";
      gameNameInput.setAttribute("aria-invalid", String(Boolean(message) && state.currentStep === 0));
    }

    function saveDraft() {
      if (!storageAvailable) {
        draftStatus.textContent = "Browser storage is unavailable";
        return;
      }

      try {
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        const savedTime = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date());
        draftStatus.textContent = `Draft saved locally at ${savedTime}`;
      } catch (error) {
        storageAvailable = false;
        draftStatus.textContent = "Draft could not be saved in this browser";
      }
    }

    function scheduleSave() {
      if (saveTimer) globalScope.clearTimeout(saveTimer);
      saveTimer = globalScope.setTimeout(saveDraft, 160);
    }

    function setState(nextState, options = {}) {
      state = normalizeState(nextState);
      render();
      if (options.save !== false) scheduleSave();
    }

    function getFirstInvalidStep(targetStep) {
      for (let step = 0; step < Math.min(targetStep, 4); step += 1) {
        if (validateStep(step, state).length > 0) return step;
      }
      return null;
    }

    function moveToStep(nextStep, options = {}) {
      const boundedStep = clampStep(nextStep);
      const invalidStep = boundedStep > state.currentStep ? getFirstInvalidStep(boundedStep) : null;

      if (invalidStep !== null) {
        const message = validateStep(invalidStep, state)[0];
        setState({ ...state, currentStep: invalidStep }, { save: false });
        showError(message);
        if (invalidStep === 0) gameNameInput.focus();
        announce(message);
        return false;
      }

      showError("");
      setState({ ...state, currentStep: boundedStep });
      if (options.focusHeading !== false) {
        const activeHeading = stepPanels[boundedStep].querySelector("h2");
        if (activeHeading) activeHeading.focus();
      }
      announce(`${STEP_LABELS[boundedStep]} step, ${boundedStep + 1} of 6.`);
      return true;
    }

    function setCustomAccessibility(patch) {
      setState({
        ...state,
        accessibility: {
          ...state.accessibility,
          ...patch,
          preset: "custom"
        }
      });
    }

    function updatePreviewState(nextPreviewState) {
      if (resetTimer) globalScope.clearTimeout(resetTimer);
      if (nextPreviewState === "reset") {
        setState({ ...state, previewState: "reset" });
        announce("Player returned to the starting point.");
        resetTimer = globalScope.setTimeout(() => {
          setState({ ...state, previewState: "ready" });
        }, state.accessibility.reducedMotion ? 20 : 500);
        return;
      }

      setState({ ...state, previewState: nextPreviewState });
      const messages = {
        running: "Preview started.",
        paused: "Preview paused. Your builder choices are unchanged.",
        ready: "Preview closed. Your builder choices are unchanged."
      };
      announce(messages[nextPreviewState]);
    }

    function render() {
      const currentPanel = stepPanels[state.currentStep];
      const access = state.accessibility;
      const themeLabel = THEMES[state.theme];
      const config = createPreviewConfig(state);
      const previewLabels = { ready: "Ready", running: "Playing", paused: "Paused", reset: "Reset" };

      stationButtons.forEach((button, index) => {
        const isActive = index === state.currentStep;
        button.classList.toggle("is-active", isActive);
        button.classList.toggle("is-complete", index < state.currentStep && validateStep(index, state).length === 0);
        if (isActive) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });

      const activeStation = stationButtons[state.currentStep];
      if (activeStation && typeof activeStation.scrollIntoView === "function") {
        globalScope.requestAnimationFrame(() => {
          const reduceMotion = globalScope.matchMedia && globalScope.matchMedia("(prefers-reduced-motion: reduce)").matches;
          activeStation.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
        });
      }

      stepPanels.forEach((panel, index) => {
        const isActive = index === state.currentStep;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });

      root.querySelector("#agm2-step-count").textContent = `Station ${state.currentStep + 1} of 6`;
      root.querySelector("#agm2-step-owner").textContent = STEP_OWNERS[state.currentStep];
      backButton.disabled = state.currentStep === 0;
      continueButton.hidden = state.currentStep === 5;
      continueButton.textContent = state.currentStep === 4 ? "Review configuration" : "Continue";

      if (gameNameInput.value !== state.gameName) gameNameInput.value = state.gameName;
      Array.from(root.querySelectorAll('input[name="template"]')).forEach((input) => {
        input.checked = input.value === state.template;
      });
      Array.from(root.querySelectorAll('input[name="theme"]')).forEach((input) => {
        input.checked = input.value === state.theme;
      });
      Array.from(root.querySelectorAll('input[name="preset"]')).forEach((input) => {
        input.checked = input.value === access.preset;
      });

      accentInput.value = state.accent;
      accentValue.textContent = state.accent.toUpperCase();
      reducedMotionInput.checked = access.reducedMotion;
      highContrastInput.checked = access.highContrast;
      largeControlsInput.checked = access.largeControls;
      speedSelect.value = access.speed;

      root.classList.toggle("agm2-reduced-motion", access.reducedMotion);
      root.classList.toggle("agm2-high-contrast", access.highContrast);
      root.classList.toggle("agm2-large-controls", access.largeControls);
      stage.dataset.theme = state.theme;
      stage.dataset.previewState = state.previewState;
      stage.dataset.speed = access.speed;
      stage.style.setProperty("--player-accent", state.accent);
      stage.setAttribute(
        "aria-label",
        `${themeLabel} miniature side-scrolling level. ${formatAccessibility(access)}. Preview is ${previewLabels[state.previewState].toLowerCase()}.`
      );

      previewStatus.textContent = previewLabels[state.previewState];
      root.querySelector("#agm2-stage-name").textContent = state.gameName.trim() || "Untitled game";
      root.querySelector("#agm2-stage-speed").textContent = `${access.speed[0].toUpperCase()}${access.speed.slice(1)} pace`;
      root.querySelector("#agm2-readout-theme").textContent = themeLabel;
      root.querySelector("#agm2-readout-profile").textContent = PRESET_LABELS[access.preset] || PRESET_LABELS.custom;
      root.querySelector("#agm2-readout-storage").textContent = storageAvailable ? "Local draft" : "Session only";

      root.querySelector("#agm2-review-name").textContent = state.gameName.trim() || "Untitled game";
      root.querySelector("#agm2-review-template").textContent = "Side-scrolling adventure";
      root.querySelector("#agm2-review-theme").textContent = themeLabel;
      root.querySelector("#agm2-review-accessibility").textContent = formatAccessibility(access);
      root.querySelector("#agm2-config-output").textContent = JSON.stringify(config, null, 2);

      Array.from(root.querySelectorAll("[data-preview-action]")).forEach((button) => {
        const action = button.dataset.previewAction;
        const pressed = action === state.previewState || (action === "ready" && state.previewState === "reset");
        button.setAttribute("aria-pressed", String(pressed));
      });

      if (!currentPanel) showError("The requested step is unavailable. Return to Start.");
    }

    builder.addEventListener("submit", (event) => {
      event.preventDefault();
      const errors = validateStep(state.currentStep, state);
      if (errors.length > 0) {
        showError(errors[0]);
        if (state.currentStep === 0) gameNameInput.focus();
        announce(errors[0]);
        return;
      }
      if (state.currentStep < 5) moveToStep(state.currentStep + 1);
    });

    backButton.addEventListener("click", () => moveToStep(state.currentStep - 1));

    stationButtons.forEach((button) => {
      button.addEventListener("click", () => moveToStep(Number(button.dataset.step)));
    });

    gameNameInput.addEventListener("input", (event) => {
      showError("");
      setState({ ...state, gameName: event.target.value }, { save: true });
    });

    root.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof globalScope.HTMLElement)) return;

      if (target.matches('input[name="template"]')) {
        setState({ ...state, template: target.value });
      }
      if (target.matches('input[name="theme"]')) {
        setState({ ...state, theme: target.value });
        announce(`${THEMES[target.value]} theme applied to the preview.`);
      }
      if (target.matches('input[name="preset"]')) {
        setState(applyPreset(state, target.value));
        announce(`${PRESET_LABELS[target.value]} profile applied.`);
      }
      if (target === accentInput) {
        setState({ ...state, accent: target.value });
        announce(`Character color set to ${target.value.toUpperCase()}.`);
      }
      if (target === reducedMotionInput) setCustomAccessibility({ reducedMotion: target.checked });
      if (target === highContrastInput) setCustomAccessibility({ highContrast: target.checked });
      if (target === largeControlsInput) setCustomAccessibility({ largeControls: target.checked });
      if (target === speedSelect) setCustomAccessibility({ speed: target.value });
    });

    root.querySelectorAll("[data-preview-action]").forEach((button) => {
      button.addEventListener("click", () => updatePreviewState(button.dataset.previewAction));
    });

    root.querySelectorAll("[data-edit-step]").forEach((button) => {
      button.addEventListener("click", () => moveToStep(Number(button.dataset.editStep)));
    });

    root.querySelector("#agm2-copy-config").addEventListener("click", async () => {
      const errors = validateAll(state);
      if (errors.length > 0) {
        exportStatus.textContent = "Finish the required setup before copying.";
        moveToStep([0, 1, 2, 3].find((step) => validateStep(step, state).length > 0) || 0);
        return;
      }

      const configText = JSON.stringify(createPreviewConfig(state), null, 2);
      try {
        await globalScope.navigator.clipboard.writeText(configText);
        exportStatus.textContent = "Configuration copied to the clipboard.";
      } catch (error) {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = configText;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.className = "agm2-visually-hidden";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        temporaryInput.remove();
        exportStatus.textContent = copied
          ? "Configuration copied to the clipboard."
          : "Copy failed. Open the technical setup details and copy it manually.";
      }
    });

    root.querySelector("#agm2-download-config").addEventListener("click", () => {
      const errors = validateAll(state);
      if (errors.length > 0) {
        showError(errors[0]);
        exportStatus.textContent = "Finish the required setup before downloading.";
        return;
      }

      const fileName = `${state.gameName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "uesl-game"}-preview.json`;
      const file = new Blob([JSON.stringify(createPreviewConfig(state), null, 2)], { type: "application/json" });
      const url = globalScope.URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalScope.URL.revokeObjectURL(url);
      exportStatus.textContent = "Preview setup downloaded. No server data changed.";
    });

    root.querySelector("#agm2-reset-demo").addEventListener("click", () => {
      if (!globalScope.confirm("Reset this browser-only demo draft?")) return;
      if (saveTimer) globalScope.clearTimeout(saveTimer);
      if (resetTimer) globalScope.clearTimeout(resetTimer);
      try {
        globalScope.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        storageAvailable = false;
      }
      state = cloneDefaultState();
      showError("");
      render();
      draftStatus.textContent = storageAvailable ? "Clean local draft started" : "Session-only demo started";
      gameNameInput.focus();
      announce("Demo reset. No backend data changed.");
    });

    render();
    if (initialDraft.restored) {
      draftStatus.textContent = "Draft restored from this browser";
      announce("Your local demo draft was restored.");
    } else if (initialDraft.error) {
      draftStatus.textContent = initialDraft.error;
      announce(initialDraft.error);
    } else {
      scheduleSave();
    }
  }

  const publicApi = Object.freeze({
    STORAGE_KEY,
    applyPreset,
    createPreviewConfig,
    formatAccessibility,
    isHexColor,
    normalizeState,
    parseDraft,
    validateAll,
    validateStep
  });

  if (typeof module !== "undefined" && module.exports) module.exports = publicApi;
  if (globalScope) globalScope.GameMaker2Demo = publicApi;

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      const root = document.getElementById("agm2-demo");
      if (root) initializeDemo(root);
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
