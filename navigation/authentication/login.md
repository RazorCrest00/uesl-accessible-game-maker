---
layout: page
title: Login
permalink: /login
search_exclude: true
show_reading_time: false
---
<br>

<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- Global stub so GSI library always finds handleGoogleDispatch even before the module loads -->
<script>
function handleGoogleDispatch(response) {
    if (typeof window._googleDispatchImpl === 'function') {
        window._googleDispatchImpl(response);
    } else {
        window._pendingGoogleResponse = response;
    }
}
</script>

<style>
.auth-wrapper {
    display: flex;
    gap: 2rem;
    max-width: 900px;
    margin: 0 auto;
    flex-wrap: wrap;
}
.auth-card {
    flex: 1;
    min-width: 280px;
    background: #1e1e2e;
    border: 1px solid #3b3b5c;
    border-radius: 12px;
    padding: 2rem;
}
.auth-card h2 { margin: 0 0 1.5rem; font-size: 1.4rem; color: #e2e8f0; }
.auth-card hr { border-color: #3b3b5c; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-group input, .form-group select {
    width: 100%;
    padding: 0.65rem 0.9rem;
    background: #12121f;
    border: 1px solid #3b3b5c;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.95rem;
    box-sizing: border-box;
}
.form-group input:focus, .form-group select:focus {
    outline: none; border-color: #6366f1;
}
.btn-primary {
    width: 100%; padding: 0.7rem;
    background: #6366f1; color: white;
    border: none; border-radius: 8px;
    font-size: 1rem; cursor: pointer; margin-top: 0.25rem;
}
.btn-primary:hover { background: #4f46e5; }
.btn-primary:disabled { background: #4b4b6b; cursor: not-allowed; }
.btn-secondary {
    width: 100%; padding: 0.7rem;
    background: transparent; color: #a0aec0;
    border: 1px solid #3b3b5c; border-radius: 8px;
    font-size: 0.9rem; cursor: pointer; margin-top: 0.5rem;
}
.btn-secondary:hover { border-color: #6366f1; color: #e2e8f0; }
.divider {
    display: flex; align-items: center;
    gap: 0.75rem; margin: 1.25rem 0;
    color: #6b7280; font-size: 0.85rem;
}
.divider::before, .divider::after {
    content: ''; flex: 1; height: 1px; background: #3b3b5c;
}
.status-msg {
    margin-top: 0.75rem; padding: 0.6rem 0.9rem;
    border-radius: 8px; font-size: 0.9rem; display: none;
}
.status-msg.show { display: block; }
.status-msg.success { background: #14532d; color: #86efac; }
.status-msg.error { background: #450a0a; color: #fca5a5; }
.status-msg.info { background: #1e3a5f; color: #93c5fd; }
.otp-step { display: none; margin-top: 0.5rem; }
.otp-step.show { display: block; }
.otp-input { letter-spacing: 0.4rem; text-align: center; font-size: 1.4rem; }
.validation-message { font-size: 0.8rem; margin-top: 0.3rem; }
.validation-message.success { color: #86efac; }
.validation-message.error { color: #fca5a5; }
.overall-status {
    margin-top: 1rem; padding: 0.6rem 0.9rem;
    border-radius: 8px; font-size: 0.9rem;
}
.overall-status.hidden { display: none; }
.overall-status.success { background: #14532d; color: #86efac; }
.overall-status.error { background: #450a0a; color: #fca5a5; }
.signup-toggle {
    text-align: center; margin-top: 1rem;
    color: #9ca3af; font-size: 0.9rem;
}
.signup-toggle a { color: #818cf8; cursor: pointer; text-decoration: underline; }
.signup-section { display: none; }
.signup-section.show { display: block; }
.oauth-box { display: none; text-align: center; }
.oauth-box.show { display: block; }
.oauth-status { margin-top: 0.75rem; font-size: 0.9rem; }
.backend-status { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
.status-item { font-size: 0.85rem; color: #9ca3af; }
</style>

<div class="auth-wrapper">

    <!-- LOGIN CARD -->
    <div class="auth-card">
        <h2>Login</h2>
        <hr>

        <!-- Step 1: credentials -->
        <div id="loginStep1">
            <div class="form-group">
                <input type="text" id="loginUid" placeholder="User ID" autocomplete="username">
            </div>
            <div class="form-group">
                <input type="password" id="loginPassword" placeholder="Password" autocomplete="current-password">
            </div>
            <button class="btn-primary" id="sendOtpBtn" onclick="sendOtp()">Sign In</button>
            <div id="loginMsg" class="status-msg"></div>

            <div class="divider">or</div>

            <div id="g_id_onload"
                 data-client_id="714327350398-q7jtd45cknoa0ijsgsg0d0iedk7epqdo.apps.googleusercontent.com"
                 data-callback="handleGoogleDispatch"
                 data-auto_prompt="false">
            </div>
            <div class="g_id_signin"
                 data-type="standard"
                 data-size="large"
                 data-theme="filled_blue"
                 data-text="signin_with"
                 data-shape="rectangular"
                 data-logo_alignment="left"
                 data-context="signin">
            </div>
        </div>

        <!-- Step 2: OTP entry -->
        <div id="loginStep2" class="otp-step">
            <p style="color:#9ca3af; font-size:0.9rem; margin-bottom:1rem;">
                Enter the 6-digit code sent to
                <strong id="otpEmailLabel" style="color:#e2e8f0;"></strong>
            </p>
            <div id="loginDevOtpBox" style="display:none; background:#1e3a5f; border:1px solid #3b6cb7; border-radius:8px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.9rem; color:#93c5fd;">
                <strong>Dev mode</strong> — no SMTP configured. Your code is: <strong id="loginDevOtpCode" style="letter-spacing:0.15rem;"></strong>
            </div>
<div class="form-group">
                <input type="text" id="otpCode" class="otp-input"
                       placeholder="000000" maxlength="6"
                       inputmode="numeric" autocomplete="one-time-code">
            </div>
            <button class="btn-primary" onclick="verifyOtp()">Verify &amp; Login</button>
            <button class="btn-secondary" onclick="backToLoginStep1()">Back</button>
            <div id="otpMsg" class="status-msg"></div>
        </div>

        <div class="signup-toggle">
            Don't have an account? <a onclick="toggleSignup()">Sign up</a>
        </div>
    </div>

    <!-- SIGNUP CARD -->
    <div class="auth-card signup-section" id="signupCard">
        <h2>Sign Up</h2>
        <hr>

        <!-- Step 1: Choose verification method -->
        <div id="su1">
            <div class="form-group">
                <input type="email" id="suEmail" placeholder="Email address" autocomplete="email">
            </div>
            <button class="btn-primary" id="suSendBtn" onclick="suSendOtp()">Send Verification Code</button>
            <div id="suEmailMsg" class="status-msg"></div>
            <div class="divider">or</div>
            <div class="g_id_signin"
                 data-type="standard"
                 data-size="large"
                 data-theme="filled_blue"
                 data-text="signup_with"
                 data-shape="rectangular"
                 data-logo_alignment="left">
            </div>
        </div>

        <!-- Step 2: OTP code (email path only) -->
        <div id="su2" style="display:none;">
            <p style="color:#9ca3af; font-size:0.9rem; margin-bottom:1rem;">
                Enter the 6-digit code sent to
                <strong id="suOtpTarget" style="color:#e2e8f0;"></strong>
            </p>
            <div id="suDevOtpBox" style="display:none; background:#1e3a5f; border:1px solid #3b6cb7; border-radius:8px; padding:0.75rem 1rem; margin-bottom:1rem; font-size:0.9rem; color:#93c5fd;">
                <strong>Dev mode</strong> — no SMTP configured. Your code is: <strong id="suDevOtpCode" style="letter-spacing:0.15rem;"></strong>
            </div>
<div class="form-group">
                <input type="text" id="suOtpCode" class="otp-input"
                       placeholder="000000" maxlength="6"
                       inputmode="numeric" autocomplete="one-time-code">
            </div>
            <button class="btn-primary" onclick="suVerifyOtp()">Verify Code</button>
            <button class="btn-secondary" onclick="suBackTo1()">Back</button>
            <div id="suOtpMsg" class="status-msg"></div>
        </div>

        <!-- Step 3: Account details -->
        <div id="su3" style="display:none;">
            <p style="font-size:0.85rem; margin-bottom:1rem;">
                Verified: <span id="suVerifiedEmail" style="color:#86efac;"></span>
            </p>
            <div class="form-group">
                <input type="text" id="suName" placeholder="Full Name">
            </div>
            <div class="form-group">
                <input type="text" id="suUid" placeholder="User ID">
            </div>
            <div class="form-group">
                <input type="date" id="suBirthdate" placeholder="Birthdate" onchange="checkMinor()">
            </div>
            <div id="suParentEmailGroup" style="display:none;">
                <div class="form-group">
                    <input type="email" id="suParentEmail" placeholder="Parent/Guardian Email (required for minors)">
                </div>
                <p style="font-size:0.8rem; color:#f59e0b; margin: -0.5rem 0 0.75rem;">
                    You are under 18. A parent or guardian email is required to link their account.
                </p>
            </div>
            <div class="form-group">
                <input type="text" id="suLocation" placeholder="Location (City, State or Country)">
            </div>
            <div id="suPasswordGroup">
                <div class="form-group">
                    <input type="password" id="suPassword" placeholder="Password (min 8 chars)">
                </div>
                <div class="form-group">
                    <input type="password" id="suConfirmPassword" placeholder="Confirm Password">
                    <div id="suPwMsg" class="validation-message"></div>
                </div>
            </div>
            <label style="display:flex; align-items:center; gap:0.5rem; color:#9ca3af; font-size:0.85rem; margin-bottom:1rem; cursor:pointer;">
                <input type="checkbox" id="suKasm"> Kasm Server Needed
            </label>
            <button class="btn-primary" id="suCreateBtn" onclick="suCreate()">Create Account</button>
            <div id="suCreateMsg" class="overall-status hidden"></div>
        </div>

        <div class="signup-toggle">
            Already have an account? <a onclick="toggleSignup()">Log in</a>
        </div>
    </div>

</div>

<p id="message" style="display:none;"></p>

<!-- Admin-only dev mode toggle (hidden until admin role confirmed) -->
<div id="devModeBar" style="display:none; margin-top:1.5rem; text-align:center;">
    <button id="devModeBtn" onclick="toggleDevMode()"
        style="background:transparent; border:1px dashed #4b5563; border-radius:6px; color:#6b7280; font-size:0.8rem; padding:0.35rem 0.9rem; cursor:pointer;">
        Dev Mode: <span id="devModeLabel">OFF</span>
    </button>
</div>

<script type="module">
    import { pythonURI, getDevMode, setDevMode } from '{{site.baseurl}}/assets/js/api/config.js';

    const GOOGLE_CLIENT_ID = "714327350398-q7jtd45cknoa0ijsgsg0d0iedk7epqdo.apps.googleusercontent.com";

    // ── Utilities ──────────────────────────────────────────────────────────────

    function showMsg(id, text, type) {
        const el = document.getElementById(id);
        el.textContent = text;
        el.className = `status-msg show ${type}`;
    }

    function redirect() {
        setTimeout(() => { window.location.href = '{{site.baseurl}}/profile'; }, 800);
    }

    // ── OTP Login ──────────────────────────────────────────────────────────────

    window.sendOtp = async function() {
        const uid      = document.getElementById('loginUid').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!uid || !password) {
            showMsg('loginMsg', 'Please enter your User ID and password.', 'error');
            return;
        }
        const btn = document.getElementById('sendOtpBtn');
        btn.disabled = true;
        btn.textContent = 'Signing in...';

        // Dev mode: skip OTP, authenticate directly
        if (getDevMode()) {
            try {
                const res  = await fetch(`${pythonURI}/api/authenticate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ uid, password })
                });
                const data = await res.json();
                if (res.ok) {
                    showMsg('loginMsg', '[Dev] Signed in — 2FA bypassed. Redirecting...', 'success');
                    redirect();
                } else {
                    showMsg('loginMsg', data.message || 'Login failed.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Sign In';
                }
            } catch (e) {
                showMsg('loginMsg', 'Network error.', 'error');
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
            return;
        }

        try {
            const res  = await fetch(`${pythonURI}/api/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ uid, password })
            });
            const data = await res.json();
            if (res.ok) {
                if (data.user) {
                    // 2FA disabled — backend issued JWT directly
                    showMsg('loginMsg', 'Signed in! Redirecting...', 'success');
                    redirect();
                } else {
                    // 2FA enabled — show OTP step
                    document.getElementById('loginStep1').style.display = 'none';
                    document.getElementById('loginStep2').classList.add('show');
                    document.getElementById('otpEmailLabel').textContent = 'your registered email';
                    if (getDevMode() && data.dev_otp) {
                        document.getElementById('loginDevOtpCode').textContent = data.dev_otp;
                        document.getElementById('loginDevOtpBox').style.display = '';
                    } else {
                        document.getElementById('loginDevOtpBox').style.display = 'none';
                    }
                    showMsg('otpMsg', data.message, 'info');
                }
            } else {
                showMsg('loginMsg', data.message || 'Failed to send code.', 'error');
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        } catch (e) {
            showMsg('loginMsg', 'Network error. Is the backend running?', 'error');
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    };

    window.verifyOtp = async function() {
        const uid = document.getElementById('loginUid').value.trim();
        const otp = document.getElementById('otpCode').value.trim();
        if (!otp) { showMsg('otpMsg', 'Enter the verification code.', 'error'); return; }
        showMsg('otpMsg', 'Verifying...', 'info');
        try {
            const res  = await fetch(`${pythonURI}/api/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ uid, otp })
            });
            const data = await res.json();
            if (res.ok) {
                showMsg('otpMsg', 'Verified! Redirecting...', 'success');
                redirect();
            } else {
                showMsg('otpMsg', data.message || 'Invalid code.', 'error');
            }
        } catch (e) {
            showMsg('otpMsg', 'Network error.', 'error');
        }
    };

    window.backToLoginStep1 = function() {
        document.getElementById('loginStep2').classList.remove('show');
        document.getElementById('loginStep1').style.display = '';
        const btn = document.getElementById('sendOtpBtn');
        btn.disabled = false;
        btn.textContent = 'Sign In';
        document.getElementById('otpCode').value = '';
        document.getElementById('loginDevOtpBox').style.display = 'none';
    };

    // ── Google Dispatch ────────────────────────────────────────────────────────

    function googleDispatch(response) {
        const signupCard = document.getElementById('signupCard');
        if (signupCard && signupCard.classList.contains('show')) {
            handleGoogleSignIn(response);
        } else {
            window.handleGoogleLogin(response);
        }
    }

    // Register the real implementation and flush any call that arrived before the module loaded
    window._googleDispatchImpl = googleDispatch;
    if (window._pendingGoogleResponse) {
        googleDispatch(window._pendingGoogleResponse);
        window._pendingGoogleResponse = null;
    }

    // ── Google Login ───────────────────────────────────────────────────────────

    window.handleGoogleLogin = async function(response) {
        showMsg('loginMsg', 'Signing in with Google...', 'info');
        try {
            const res  = await fetch(`${pythonURI}/api/google/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ credential: response.credential })
            });
            const data = await res.json();
            if (res.ok) {
                showMsg('loginMsg', 'Signed in! Redirecting...', 'success');
                redirect();
            } else if (res.status === 404) {
                showMsg('loginMsg', 'No account found. Taking you to sign up...', 'info');
                setTimeout(() => {
                    document.getElementById('signupCard').classList.add('show');
                    handleGoogleSignIn(response);
                }, 800);
            } else {
                showMsg('loginMsg', data.message || 'Google login failed.', 'error');
            }
        } catch (e) {
            showMsg('loginMsg', 'Network error.', 'error');
        }
    };

    // ── Signup toggle ──────────────────────────────────────────────────────────

    window.toggleSignup = function() {
        document.getElementById('signupCard').classList.toggle('show');
    };

    // ── Signup state ───────────────────────────────────────────────────────────

    let suEmail = '';
    let suGoogleName = '';
    let suIsGoogle = false;
    let suGoogleResponse = null;

    function suShowStep(n) {
        ['su1','su2','su3'].forEach((id, i) => {
            document.getElementById(id).style.display = (i + 1 === n) ? '' : 'none';
        });
    }

    function suGoToDetails(email, googleName) {
        suEmail      = email;
        suGoogleName = googleName || '';
        suIsGoogle   = !!googleName;
        document.getElementById('suVerifiedEmail').textContent = email;
        document.getElementById('suName').value = suGoogleName;
        document.getElementById('suPasswordGroup').style.display = suIsGoogle ? 'none' : '';
        document.getElementById('suUid').value = '';
        document.getElementById('suBirthdate').value = '';
        document.getElementById('suLocation').value = '';
        document.getElementById('suParentEmail').value = '';
        document.getElementById('suParentEmailGroup').style.display = 'none';
        document.getElementById('suCreateMsg').className = 'overall-status hidden';
        suShowStep(3);
    }

    // ── Signup: Step 1 → OTP ───────────────────────────────────────────────────

    window.suSendOtp = async function() {
        const email = document.getElementById('suEmail').value.trim();
        if (!email) { showMsg('suEmailMsg', 'Enter your email address.', 'error'); return; }

        // Dev mode: skip OTP, go straight to account details
        if (getDevMode()) {
            suEmail = email;
            showMsg('suEmailMsg', '[Dev] OTP skipped. Fill in your account details.', 'info');
            setTimeout(() => suGoToDetails(email, ''), 600);
            return;
        }

        const btn = document.getElementById('suSendBtn');
        btn.disabled = true; btn.textContent = 'Sending...';
        try {
            const res  = await fetch(`${pythonURI}/api/otp/signup/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                document.getElementById('suOtpTarget').textContent = email;
                suEmail = email;
                // Show OTP in UI only when running locally (dev mode)
                if (getDevMode() && data.dev_otp) {
                    document.getElementById('suDevOtpCode').textContent = data.dev_otp;
                    document.getElementById('suDevOtpBox').style.display = '';
                } else {
                    document.getElementById('suDevOtpBox').style.display = 'none';
                }
                suShowStep(2);
            } else {
                showMsg('suEmailMsg', data.message || 'Failed to send code.', 'error');
                btn.disabled = false; btn.textContent = 'Send Verification Code';
            }
        } catch (e) {
            showMsg('suEmailMsg', 'Network error. Is the backend running?', 'error');
            btn.disabled = false; btn.textContent = 'Send Verification Code';
        }
    };

    // ── Signup: Step 2 → verify OTP ───────────────────────────────────────────

    window.suVerifyOtp = async function() {
        const otp = document.getElementById('suOtpCode').value.trim();
        if (!otp) { showMsg('suOtpMsg', 'Enter the verification code.', 'error'); return; }
        showMsg('suOtpMsg', 'Verifying...', 'info');
        try {
            const res  = await fetch(`${pythonURI}/api/otp/signup/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: suEmail, otp })
            });
            const data = await res.json();
            if (res.ok) {
                suGoToDetails(suEmail, '');
            } else {
                showMsg('suOtpMsg', data.message || 'Invalid code.', 'error');
            }
        } catch (e) {
            showMsg('suOtpMsg', 'Network error.', 'error');
        }
    };

    window.suBackTo1 = function() {
        document.getElementById('suOtpCode').value = '';
        document.getElementById('suSendBtn').disabled = false;
        document.getElementById('suSendBtn').textContent = 'Send Verification Code';
        suShowStep(1);
    };

    // ── Signup: Google path ────────────────────────────────────────────────────

    function handleGoogleSignIn(response) {
        try {
            const b64  = response.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
            const pad  = b64 + '='.repeat((4 - b64.length % 4) % 4);
            const info = JSON.parse(atob(pad));
            suGoogleResponse = response;
            suGoToDetails(info.email, info.name || info.given_name || '');
        } catch (e) {
            showMsg('suEmailMsg', 'Error processing Google Sign-In. Try again.', 'error');
        }
    }

    // ── Signup: Step 3 → create account ───────────────────────────────────────

    window.checkMinor = function() {
        const birthdateVal = document.getElementById('suBirthdate').value;
        if (!birthdateVal) return;
        const bdate = new Date(birthdateVal);
        const today = new Date();
        let age = today.getFullYear() - bdate.getFullYear();
        const m = today.getMonth() - bdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bdate.getDate())) age--;
        document.getElementById('suParentEmailGroup').style.display = age < 18 ? '' : 'none';
    };

    window.suCreate = async function() {
        const name      = document.getElementById('suName').value.trim();
        const uid       = document.getElementById('suUid').value.trim();
        const birthdate = document.getElementById('suBirthdate').value;
        const location  = document.getElementById('suLocation').value.trim();
        const kasm      = document.getElementById('suKasm').checked;

        if (!name || !uid || !birthdate || !location) {
            const el = document.getElementById('suCreateMsg');
            el.className = 'overall-status error';
            el.textContent = 'Please fill in all fields.';
            return;
        }

        // Check if minor and require parent email
        const bdate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - bdate.getFullYear();
        const m = today.getMonth() - bdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bdate.getDate())) age--;
        const parentEmail = document.getElementById('suParentEmail').value.trim();
        if (age < 18 && !parentEmail) {
            const el = document.getElementById('suCreateMsg');
            el.className = 'overall-status error';
            el.textContent = 'Parent/guardian email is required for users under 18.';
            return;
        }

        let password;
        if (suIsGoogle) {
            password = crypto.randomUUID();
        } else {
            password = document.getElementById('suPassword').value;
            const cpw = document.getElementById('suConfirmPassword').value;
            if (password.length < 8) {
                const el = document.getElementById('suCreateMsg');
                el.className = 'overall-status error';
                el.textContent = 'Password must be at least 8 characters.';
                return;
            }
            if (password !== cpw) {
                const el = document.getElementById('suCreateMsg');
                el.className = 'overall-status error';
                el.textContent = 'Passwords do not match.';
                return;
            }
        }

        const btn = document.getElementById('suCreateBtn');
        btn.disabled = true;
        const msgEl = document.getElementById('suCreateMsg');
        msgEl.className = 'overall-status info';
        msgEl.textContent = 'Creating account...';

        try {
            const res = await fetch(`${pythonURI}/api/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, uid, birthdate, location, parent_email: age < 18 ? parentEmail : undefined, email: suEmail, password, kasm_server_needed: kasm, auth_type: suIsGoogle ? 'google' : 'otp' })
            });
            if (res.ok) {
                msgEl.className = 'overall-status success';
                msgEl.textContent = 'Account created! Signing you in...';
                if (suIsGoogle && suGoogleResponse) {
                    setTimeout(() => window.handleGoogleLogin(suGoogleResponse), 800);
                } else {
                    // Pre-fill login form and redirect after a brief delay
                    setTimeout(() => {
                        document.getElementById('signupCard').classList.remove('show');
                        suShowStep(1);
                        showMsg('loginMsg', 'Account created! Enter your User ID and password to sign in.', 'success');
                    }, 1500);
                }
            } else {
                const data = await res.json();
                msgEl.className = 'overall-status error';
                msgEl.textContent = data.message || 'Account creation failed.';
                btn.disabled = false;
            }
        } catch (e) {
            msgEl.className = 'overall-status error';
            msgEl.textContent = 'Network error.';
            btn.disabled = false;
        }
    };

    // ── Dev Mode Toggle (admin only) ───────────────────────────────────────────

    async function initDevModeBar() {
        try {
            const res = await fetch(`${pythonURI}/api/id`, { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            const isAdmin = data.role === 'Admin' ||
                (Array.isArray(data.roles) && data.roles.some(r => r.name === 'Admin'));
            if (!isAdmin) return;
            const bar = document.getElementById('devModeBar');
            bar.style.display = '';
            document.getElementById('devModeLabel').textContent = getDevMode() ? 'ON' : 'OFF';
        } catch (_) {}
    }

    window.toggleDevMode = async function() {
        try {
            const next = !getDevMode();
            await setDevMode(next, pythonURI);
            document.getElementById('devModeLabel').textContent = next ? 'ON' : 'OFF';
        } catch (e) {
            alert(e.message);
        }
    };

    // ── Init ───────────────────────────────────────────────────────────────────

    window.addEventListener('load', function() {
        initDevModeBar();
    });
</script>
