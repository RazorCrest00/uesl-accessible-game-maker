// Keyboard shortcuts (Alt+Shift+key)
// Uses e.code so shortcuts are stable regardless of OS char remapping from Alt+Shift.

(function() {
    // Map KeyboardEvent.code → destination path
    const shortcuts = {
        'KeyH': '/',                          // Home
        'KeyP': '/profile',                   // Profile
        'KeyD': '/dashboard',                 // Dashboard
        'KeyL': '/login',                     // Login
        'KeyG': '/play/',                     // Play / Game
        'KeyC': '/gamify/character-select',   // Character Select
        'KeyS': '/stats',                     // Stats
        'KeyA': '/about/',                    // About
    };

    // Help trigger codes
    const helpCodes = new Set(['Slash', 'Period']);

    // Help overlay element (created on first use)
    let overlay = null;

    function createHelpOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'keyboard-shortcuts-overlay';
        overlay.innerHTML = `
            <div class="ks-backdrop"></div>
            <div class="ks-modal">
                <h3>Keyboard Shortcuts</h3>
                <p class="ks-hint">Press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>key</kbd></p>
                <table>
                    <tr><td><kbd>H</kbd></td><td>Home</td></tr>
                    <tr><td><kbd>P</kbd></td><td>Profile</td></tr>
                    <tr><td><kbd>D</kbd></td><td>Dashboard</td></tr>
                    <tr><td><kbd>L</kbd></td><td>Login</td></tr>
                    <tr><td><kbd>G</kbd></td><td>Play</td></tr>
                    <tr><td><kbd>C</kbd></td><td>Character Select</td></tr>
                    <tr><td><kbd>S</kbd></td><td>Stats</td></tr>
                    <tr><td><kbd>A</kbd></td><td>About</td></tr>
                    <tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
                </table>
                <p class="ks-close-hint">Press <kbd>Esc</kbd> or click outside to close</p>
            </div>
        `;
        const style = document.createElement('style');
        style.textContent = `
            #keyboard-shortcuts-overlay { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; }
            #keyboard-shortcuts-overlay .ks-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.6); }
            #keyboard-shortcuts-overlay .ks-modal { position:relative; background:#1e1e2e; color:#cdd6f4; border:1px solid #45475a; border-radius:12px; padding:24px 32px; max-width:400px; width:90%; font-family:system-ui,sans-serif; box-shadow:0 8px 32px rgba(0,0,0,0.4); }
            #keyboard-shortcuts-overlay .ks-modal h3 { margin:0 0 4px; font-size:1.2em; color:#f5f5f5; }
            #keyboard-shortcuts-overlay .ks-hint { margin:0 0 16px; font-size:0.85em; color:#a6adc8; }
            #keyboard-shortcuts-overlay table { width:100%; border-collapse:collapse; }
            #keyboard-shortcuts-overlay td { padding:6px 8px; border-bottom:1px solid #313244; }
            #keyboard-shortcuts-overlay td:first-child { width:40px; text-align:center; }
            #keyboard-shortcuts-overlay kbd { display:inline-block; background:#313244; border:1px solid #45475a; border-radius:4px; padding:2px 7px; font-size:0.85em; font-family:inherit; color:#cdd6f4; }
            #keyboard-shortcuts-overlay .ks-close-hint { margin:14px 0 0; font-size:0.8em; color:#6c7086; text-align:center; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);

        // Close on backdrop click
        overlay.querySelector('.ks-backdrop').addEventListener('click', hideHelp);
    }

    function showHelp() {
        if (!overlay) createHelpOverlay();
        overlay.style.display = 'flex';
    }

    function hideHelp() {
        if (overlay) overlay.style.display = 'none';
    }

    function navigate(dest) {
        const baseurl = window.baseurl || '';
        let url = dest;
        if (baseurl && !url.startsWith(baseurl)) {
            url = baseurl + url;
        }
        window.location.href = url;
    }

    // Expose globally so the toolkit button can call it directly
    window.showKeyboardHelp = showHelp;

    document.addEventListener('keydown', function(e) {
        // Close help overlay on Escape
        if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') {
            hideHelp();
            e.preventDefault();
            return;
        }

        // Require Alt+Shift (no conflict with browser shortcuts)
        if (!e.altKey || !e.shiftKey) return;
        // Ignore Ctrl/Meta combos to stay out of browser shortcut space
        if (e.metaKey || e.ctrlKey) return;

        // Don't fire when typing in inputs, textareas, or code editors
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return;
        if (document.activeElement?.closest('.CodeMirror')) return;

        const code = e.code; // physical key — stable regardless of Alt+Shift char remapping

        // Help overlay (Shift+/ = ? on US keyboards)
        if (helpCodes.has(code)) {
            e.preventDefault();
            showHelp();
            return;
        }

        if (shortcuts[code]) {
            e.preventDefault();
            navigate(shortcuts[code]);
        }
    });
})();
