// Global site-wide theme preferences
// Applies user-selected colors, fonts, sizing, and language translation across all pages.
(function () {
  // Supported languages for translation
  const LANGUAGES = {
    '': { name: 'Default (No Translation)', code: '' },
    'es': { name: 'Spanish', code: 'es' },
    'fr': { name: 'French', code: 'fr' },
    'de': { name: 'German', code: 'de' },
    'it': { name: 'Italian', code: 'it' },
    'pt': { name: 'Portuguese', code: 'pt' },
    'ru': { name: 'Russian', code: 'ru' },
    'zh-CN': { name: 'Chinese (Simplified)', code: 'zh-CN' },
    'zh-TW': { name: 'Chinese (Traditional)', code: 'zh-TW' },
    'ja': { name: 'Japanese', code: 'ja' },
    'ko': { name: 'Korean', code: 'ko' },
    'ar': { name: 'Arabic', code: 'ar' },
    'hi': { name: 'Hindi', code: 'hi' },
    'vi': { name: 'Vietnamese', code: 'vi' },
    'th': { name: 'Thai', code: 'th' },
    'nl': { name: 'Dutch', code: 'nl' },
    'pl': { name: 'Polish', code: 'pl' },
    'tr': { name: 'Turkish', code: 'tr' },
    'uk': { name: 'Ukrainian', code: 'uk' },
    'he': { name: 'Hebrew', code: 'he' },
    'fa': { name: 'Persian (Farsi)', code: 'fa' },
  };

  // Site Default matches UESL theme tokens (from uesl.html :root)
  const SITE_DEFAULT = {
    bg: '#0d1117',
    text: '#e6edf3',
    font: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    size: 14,
    accent: '#00d4ff',
  };

  const PRESETS = {
    'Site Default': SITE_DEFAULT,
    Midnight: {
      bg: '#0b1220',
      text: '#e6eef8',
      font: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      size: 14,
      accent: '#3b82f6',
    },
    Light: {
      bg: '#ffffff',
      text: '#FF80AA',
      font: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      size: 14,
      accent: '#2563eb',
    },
    Green: {
      bg: '#154734',
      text: '#e6f6ef',
      font: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      size: 14,
      accent: '#10b981',
    },
    Sepia: {
      bg: '#f4ecd8',
      text: '#A52A2A',
      font: "Georgia, 'Times New Roman', Times, serif",
      size: 14,
      accent: '#b45309',
    },
    Cyberpunk: {
      bg: '#0a0a0f',
      text: '#f0f0f0',
      font: "'Source Code Pro', monospace",
      size: 14,
      accent: '#f72585',
    },
    Ocean: {
      bg: '#0c1929',
      text: '#e0f2fe',
      font: "'Open Sans', Arial, sans-serif",
      size: 15,
      accent: '#06b6d4',
    },
  };

  const storageKey = 'sitePreferences';

  function hexToRgb(hex) {
    if (!hex) return { r: 0, g: 0, b: 0 };
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  }

  function getLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function isLightColor(hex) {
    return getLuminance(hex) > 0.5;
  }

  function adjustColor(hex, amt) {
    const { r, g, b } = hexToRgb(hex);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const nr = clamp(r + amt);
    const ng = clamp(g + amt);
    const nb = clamp(b + amt);
    return (
      '#' +
      [nr, ng, nb]
        .map((v) => {
          const h = v.toString(16);
          return h.length === 1 ? '0' + h : h;
        })
        .join('')
    );
  }

  function loadWebFont(url, id) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  function applyPreferences(prefs) {
    const base = SITE_DEFAULT;
    const bg       = prefs?.bg       || base.bg;
    const text     = prefs?.text     || base.text;
    const font     = prefs?.font     || base.font;
    const size     = prefs?.size     || base.size;
    const accent   = prefs?.accent   || base.accent;
    const navColor       = prefs?.navColor       || bg;
    const selectionColor = prefs?.selectionColor || accent;
    const buttonStyle    = prefs?.buttonStyle    || 'rounded';

    const root     = document.documentElement;
    const set      = (name, val) => root.style.setProperty(name, val);
    const lightBg  = isLightColor(bg);
    const dir      = lightBg ? -1 : 1;

    // Surface scale — mirrors the UESL token hierarchy
    const surface  = adjustColor(bg, 12 * dir);
    const surface2 = adjustColor(bg, 22 * dir);
    const surface3 = adjustColor(bg, 32 * dir);
    const border   = lightBg ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)';
    const textMuted = lightBg ? '#6b7280' : adjustColor(text, -55);
    const { r: ar, g: ag, b: ab } = hexToRgb(accent);
    const accentDim = `rgba(${ar},${ag},${ab},0.14)`;

    // ── UESL design tokens — lets uesl.html's own CSS respond via var() ──
    set('--nav-color', navColor);
    set('--bg',        bg);
    set('--surface',   surface);
    set('--surface2',  surface2);
    set('--surface3',  surface3);
    set('--text',      text);
    set('--muted',     textMuted);
    set('--cyan',      accent);
    set('--cyan-dim',  accentDim);
    set('--border',    border);

    // ── Pref-specific vars (used by some components) ──
    set('--pref-bg-color',        bg);
    set('--pref-text-color',      text);
    set('--pref-font-family',     font);
    set('--pref-font-size',       size + 'px');
    set('--pref-accent-color',    accent);
    set('--pref-selection-color', selectionColor);

    // ── Legacy aliases ──
    set('--background',  bg);
    set('--bg-0',        bg);
    set('--bg-1',        surface);
    set('--bg-2',        surface2);
    set('--bg-3',        surface3);
    set('--panel',       surface);
    set('--panel-mid',   surface2);
    set('--ui-bg',       surface);
    set('--ui-border',   border);
    set('--text-strong', adjustColor(text, lightBg ? -20 : 20));
    set('--text-muted',  textMuted);
    set('--white1',      text);
    set('--theme',       lightBg ? 'base' : 'dark');

    // Priority hues
    if (lightBg) {
      set('--priority-p0', '#b91c1c');
      set('--priority-p1', '#c2410c');
      set('--priority-p2', '#a16207');
      set('--priority-p3', '#15803d');
    } else {
      set('--priority-p0', '#dc2626');
      set('--priority-p1', '#ea580c');
      set('--priority-p2', '#eab308');
      set('--priority-p3', '#22c55e');
    }

    // Load external web fonts on demand
    if (font.includes('SimBraille') || font.includes('Swell Braille')) {
      // SimBraille ships with Windows 10/11 — no CDN needed.
      // Inject a @font-face alias so browsers that have the system font pick it up correctly.
      if (!document.getElementById('font-braille')) {
        const s = document.createElement('style');
        s.id = 'font-braille';
        s.textContent = `@font-face { font-family: 'Swell Braille'; src: local('SimBraille'), local('Braille'); }`;
        document.head.appendChild(s);
      }
    }

    document.documentElement.classList.add('user-theme-active');

    injectThemeOverrideCSS({
      bg, text, font, size, accent, accentDim,
      surface, surface2, surface3,
      border, textMuted, selectionColor, navColor, buttonStyle, lightBg,
    });

    applyLanguage(prefs?.language || '');
  }

  function injectThemeOverrideCSS(opts) {
    const { bg, text, font, size, accent, accentDim,
            surface, surface2, surface3,
            border, textMuted, selectionColor, navColor, buttonStyle, lightBg } = opts;

    const styleId = 'user-theme-override-css';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    let btnRadius = '0.375rem';
    if (buttonStyle === 'square') btnRadius = '0';
    else if (buttonStyle === 'pill') btnRadius = '9999px';

    style.textContent = `
      /* ── Navbar ── */
      html.user-theme-active #nav {
        background: ${navColor} !important;
        border-bottom-color: ${border} !important;
      }

      /* ── Base ── */
      html.user-theme-active body {
        background-color: ${bg} !important;
        color: ${text} !important;
        font-family: ${font} !important;
        font-size: ${size}px !important;
      }

      /* ── Selection ── */
      html.user-theme-active ::selection      { background-color: ${selectionColor}; color: #fff; }
      html.user-theme-active ::-moz-selection { background-color: ${selectionColor}; color: #fff; }

      /* ── Button shape ── */
      html.user-theme-active button,
      html.user-theme-active .btn,
      html.user-theme-active input[type="submit"],
      html.user-theme-active input[type="button"] { border-radius: ${btnRadius} !important; }

      /* ── Tailwind backgrounds — mapped to the correct surface level ── */
      html.user-theme-active .bg-neutral-950,
      html.user-theme-active .bg-neutral-900,
      html.user-theme-active .bg-gray-900     { background-color: ${bg}       !important; }
      html.user-theme-active .bg-neutral-800,
      html.user-theme-active .bg-gray-800     { background-color: ${surface}  !important; }
      html.user-theme-active .bg-neutral-700,
      html.user-theme-active .bg-gray-700     { background-color: ${surface2} !important; }
      html.user-theme-active .bg-neutral-600,
      html.user-theme-active .bg-gray-600     { background-color: ${surface3} !important; }

      /* ── Tailwind text ── */
      html.user-theme-active .text-white,
      html.user-theme-active .text-neutral-50,
      html.user-theme-active .text-neutral-100,
      html.user-theme-active .text-neutral-200,
      html.user-theme-active .text-neutral-300 { color: ${text}      !important; }
      html.user-theme-active .text-neutral-400,
      html.user-theme-active .text-neutral-500,
      html.user-theme-active .text-gray-400,
      html.user-theme-active .text-gray-500    { color: ${textMuted} !important; }
      html.user-theme-active .text-blue-400,
      html.user-theme-active .text-blue-500,
      html.user-theme-active .text-cyan-400,
      html.user-theme-active .text-cyan-500    { color: ${accent}    !important; }

      /* ── Tailwind borders ── */
      html.user-theme-active .border-neutral-800,
      html.user-theme-active .border-neutral-700,
      html.user-theme-active .border-neutral-600 { border-color: ${border} !important; }
      html.user-theme-active .border-blue-500,
      html.user-theme-active .border-cyan-500    { border-color: ${accent} !important; }

      /* ── Form controls (exclude color/range/checkbox/radio inputs) ── */
      html.user-theme-active input:not([type="color"]):not([type="range"]):not([type="checkbox"]):not([type="radio"]),
      html.user-theme-active select,
      html.user-theme-active textarea {
        background-color: ${surface2} !important;
        color: ${text}               !important;
        border-color: ${border}      !important;
      }

      /* ── Ecentricolor layout ── */
      html.user-theme-active .lesson-main    { background-color: ${bg}      !important; color: ${text} !important; }
      html.user-theme-active .lesson-sidebar { background-color: ${surface} !important; border-color: ${border} !important; }

      /* ── Lesson / lesson player ── */
      html.user-theme-active .lesson-player,
      html.user-theme-active .main-content,
      html.user-theme-active .lesson-content  { background-color: ${bg}      !important; color: ${text} !important; }
      html.user-theme-active .sidebar-header,
      html.user-theme-active .sprint-nav,
      html.user-theme-active .sprint-section,
      html.user-theme-active .lesson-item     { background-color: ${surface} !important; color: ${text} !important; }
      html.user-theme-active .progress-bar-sidebar { background-color: ${surface2} !important; }

      /* ── Links ── */
      html.user-theme-active a:not([class*="bg-"]):not(.btn) { color: ${accent}; }
      html.user-theme-active a:not([class*="bg-"]):not(.btn):hover { opacity: 0.8; }

      /* ── Accent hover backgrounds ── */
      html.user-theme-active .hover\\:bg-neutral-700:hover { background-color: ${surface2} !important; }
      html.user-theme-active .hover\\:bg-neutral-800:hover { background-color: ${surface}  !important; }

      /* ── Jekyll / Minima prose ── */
      html.user-theme-active .post-meta,
      html.user-theme-active .post-meta-description { color: ${textMuted} !important; }
    `;
  }

  // Google Translate integration
  function applyLanguage(langCode) {
    // Store the selected language
    document.documentElement.setAttribute('data-translate-lang', langCode);
    
    // Add CSS to hide Google Translate bar (injected once)
    if (!document.getElementById('google-translate-hide-css')) {
      const style = document.createElement('style');
      style.id = 'google-translate-hide-css';
      style.textContent = `
        .goog-te-banner-frame, .goog-te-balloon-frame { display: none !important; }
        body { top: 0 !important; position: static !important; }
        .skiptranslate { display: none !important; }
        .goog-te-gadget { display: none !important; }
        #google_translate_element { display: none !important; }
      `;
      document.head.appendChild(style);
    }
    
    // Clear any existing Google Translate cookies first
    clearGoogleTranslateCookies();
    
    if (!langCode) {
      // Remove translation - reset to original
      removeGoogleTranslate();
      return;
    }

    // Set the Google Translate cookie to the desired language
    const domain = window.location.hostname;
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${domain}`;

    // Initialize Google Translate if not already loaded
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: Object.keys(LANGUAGES).filter(k => k).join(','),
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element');
      };
    }

    // Create hidden container for Google Translate widget
    if (!document.getElementById('google_translate_element')) {
      const container = document.createElement('div');
      container.id = 'google_translate_element';
      container.style.cssText = 'position: fixed; top: -9999px; left: -9999px; visibility: hidden;';
      document.body.appendChild(container);
    }

    // Load Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }

    // Wait for Google Translate to be ready, then trigger translation
    const attemptTranslation = (attempts = 0) => {
      if (attempts > 100) return; // Give up after 5 seconds (100 attempts * 50ms)
      
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
      } else {
        setTimeout(() => attemptTranslation(attempts + 1), 50); // Faster polling (50ms instead of 100ms)
      }
    };
    
    // Start attempting immediately, then poll quickly
    attemptTranslation();
  }

  function clearGoogleTranslateCookies() {
    const domain = window.location.hostname;
    // Clear all possible googtrans cookie variations
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost';
  }

  function removeGoogleTranslate() {
    clearGoogleTranslateCookies();
    
    // Try to reset Google Translate to show original via the select dropdown
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = '';
      select.dispatchEvent(new Event('change'));
    }
    
    // Try clicking the "Show original" button in the banner frame
    try {
      const frame = document.querySelector('.goog-te-banner-frame');
      if (frame && frame.contentDocument) {
        const restoreBtn = frame.contentDocument.querySelector('.goog-te-button button');
        if (restoreBtn) restoreBtn.click();
      }
    } catch (e) {
      // Cross-origin frame access may fail, that's okay
    }
    
    // If translation is still stuck, we need to reload the page
    // Check if page is currently translated
    const isTranslated = document.documentElement.classList.contains('translated-ltr') || 
                         document.documentElement.classList.contains('translated-rtl') ||
                         document.querySelector('html.translated-ltr, html.translated-rtl');
    
    if (isTranslated) {
      // Force reload to clear translation
      window.location.reload();
    }
  }

  // Text-to-Speech functionality
  function getTTSSettings() {
    const prefs = loadStoredPreferences() || {};
    return {
      voice: prefs.ttsVoice || '',
      rate: parseFloat(prefs.ttsRate) || 1,
      pitch: parseFloat(prefs.ttsPitch) || 1,
      volume: parseFloat(prefs.ttsVolume) || 1
    };
  }

  function speak(text, options = {}) {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported in this browser');
      return null;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const settings = getTTSSettings();
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply saved voice
    const voiceName = options.voice || settings.voice;
    if (voiceName) {
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === voiceName);
      if (voice) utterance.voice = voice;
    }

    // Apply settings (options override saved settings)
    utterance.rate = options.rate !== undefined ? options.rate : settings.rate;
    utterance.pitch = options.pitch !== undefined ? options.pitch : settings.pitch;
    utterance.volume = options.volume !== undefined ? options.volume : settings.volume;

    speechSynthesis.speak(utterance);
    return utterance;
  }

  function speakSelection() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text) {
      speak(text);
      return true;
    }
    return false;
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  function isSpeaking() {
    return 'speechSynthesis' in window && speechSynthesis.speaking;
  }

  function resetPreferences() {
    const root = document.documentElement;
    root.classList.remove('user-theme-active');

    // Remove injected CSS
    const overrideStyle = document.getElementById('user-theme-override-css');
    if (overrideStyle) {
      overrideStyle.remove();
    }

    const props = [
      // UESL tokens
      '--bg', '--surface', '--surface2', '--surface3',
      '--text', '--muted', '--cyan', '--cyan-dim', '--border', '--nav-color',
      // Pref vars
      '--pref-bg-color', '--pref-text-color', '--pref-font-family',
      '--pref-font-size', '--pref-accent-color', '--pref-selection-color', '--pref-cursor-style',
      // Legacy aliases
      '--background', '--bg-0', '--bg-1', '--bg-2', '--bg-3',
      '--text-strong', '--text-muted', '--white1',
      '--panel', '--panel-mid', '--ui-bg', '--ui-border',
      // Priority
      '--priority-p0', '--priority-p1', '--priority-p2', '--priority-p3',
    ];

    props.forEach((name) => root.style.removeProperty(name));
  }

  function loadStoredPreferences() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading stored preferences', e);
      return null;
    }
  }

  async function syncFromBackend() {
    try {
      const uri = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? 'http://localhost:8424'
        : 'https://uesl.opencodingsociety.com';
      const res = await fetch(`${uri}/api/user/preferences`, {
        method: 'GET', mode: 'cors', cache: 'default', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-Origin': 'client' }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.id) return null;
      if (!data.backgroundColor && !data.textColor) return null;
      const prefs = {
        bg: data.backgroundColor || SITE_DEFAULT.bg,
        text: data.textColor || SITE_DEFAULT.text,
        font: data.fontFamily || SITE_DEFAULT.font,
        size: data.fontSize || SITE_DEFAULT.size,
        accent: data.accentColor || SITE_DEFAULT.accent,
        selectionColor: data.selectionColor || data.accentColor || SITE_DEFAULT.accent,
        buttonStyle: data.buttonStyle || 'rounded',
        language: data.language || '',
        ttsVoice: data.ttsVoice || '',
        ttsRate: data.ttsRate || 1.0,
        ttsPitch: data.ttsPitch || 1.0,
        ttsVolume: data.ttsVolume || 1.0,
      };
      localStorage.setItem(storageKey, JSON.stringify(prefs));
      return prefs;
    } catch (e) {
      return null;
    }
  }

  async function init() {
    if (typeof window === 'undefined') return;

    // Check if user explicitly reset preferences - if so, don't load anything
    const wasReset = window.localStorage.getItem('preferencesReset');
    if (wasReset === 'true') {
      // Don't clear the flag here - let the dashboard page handle that
      // Just don't apply any preferences
      return;
    }

    const prefs = loadStoredPreferences();
    if (prefs) {
      applyPreferences(prefs);
    } else {
      // No local prefs — try backend for logged-in users (cross-device sync)
      const backendPrefs = await syncFromBackend();
      if (backendPrefs) {
        applyPreferences(backendPrefs);
      }
    }
  }

  // Expose helpers for dashboard.html to reuse
  window.SitePreferences = {
    applyPreferences,
    resetPreferences,
    applyLanguage,
    PRESETS,
    LANGUAGES,
    // TTS functions
    speak,
    speakSelection,
    stopSpeaking,
    isSpeaking,
    getTTSSettings,
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();