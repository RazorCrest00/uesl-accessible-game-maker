---
layout: uesl
title: Login
permalink: /login
search_exclude: true
show_reading_time: false
---

<style>
:root {
  --bg:        #0d1117;
  --surface:   #161b27;
  --surface2:  #1e2535;
  --surface3:  #252d40;
  --cyan:      #00d4ff;
  --cyan-dim:  rgba(0,212,255,.12);
  --purple:    #7c3aed;
  --text:      #e6edf3;
  --muted:     #8b949e;
  --border:    rgba(255,255,255,.07);
  --r:         12px;
  --r-lg:      20px;
  --font-h:    'Oswald', sans-serif;
  --font-b:    'Inter', sans-serif;
}

body { background: var(--bg); color: var(--text); font-family: var(--font-b); }

#login-page-wrap {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.slm-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: clamp(28px,4vw,48px);
  width: min(460px, 92vw);
  box-shadow: 0 24px 80px rgba(0,0,0,.7);
}
.slm-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--border);
}
.slm-tab {
  padding: 10px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  font-size: .95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color .2s, border-color .2s;
  margin-bottom: -1px;
}
.slm-tab.active { color: var(--cyan); border-color: var(--cyan); }
.slm-field { margin-bottom: 16px; }
.slm-label { display: block; font-size: .82rem; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
.slm-input {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 11px 14px;
  color: var(--text);
  font-size: .95rem;
  font-family: var(--font-b);
  outline: none;
  transition: border-color .2s;
  box-sizing: border-box;
}
.slm-input:focus { border-color: rgba(0,212,255,.5); }
.slm-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 30px;
  margin-top: 8px;
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .2s, transform .15s;
}
.slm-btn:hover { opacity: .9; transform: scale(1.01); }
.slm-err { font-size: .82rem; margin-top: -8px; margin-bottom: 8px; display: none; }
</style>

<div id="login-page-wrap">
  <div class="slm-card">
    <!-- header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--purple));display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <span style="font-family:var(--font-h);font-size:1.4rem;color:var(--cyan);font-weight:700;">UESL Social</span>
    </div>

    <!-- tabs -->
    <div class="slm-tabs" id="slm-tabs">
      <button class="slm-tab active" id="slm-tab-login" onclick="slmSwitchTab('login')">Sign In</button>
      <button class="slm-tab" id="slm-tab-register" onclick="slmSwitchTab('register')">Create Account</button>
    </div>

    <!-- LOGIN FLOW -->
    <div id="slm-login-flow">
      <div id="slm-l1">
        <div class="slm-field"><label class="slm-label">User ID</label><input class="slm-input" id="slm-uid" type="text" placeholder="your_user_id" autocomplete="username"/></div>
        <div class="slm-field"><label class="slm-label">Password</label><input class="slm-input" id="slm-pw" type="password" placeholder="••••••••" autocomplete="current-password"/></div>
        <div class="slm-err" id="slm-l1-msg" style="display:none;"></div>
        <button class="slm-btn" id="slm-send-otp-btn" onclick="slmSendOtp()">Sign In</button>
      </div>
      <div id="slm-l2" style="display:none;">
        <p style="color:var(--muted);font-size:.88rem;margin-bottom:16px;">Enter the 6-digit code sent to your registered email.</p>
        <div id="slm-dev-otp-box" style="display:none;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.3);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:.85rem;color:var(--cyan);">Dev mode — code: <strong id="slm-dev-otp-code" style="letter-spacing:.12rem;"></strong></div>
        <div class="slm-field"><input class="slm-input" id="slm-otp" type="text" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="one-time-code" style="text-align:center;letter-spacing:.4rem;font-size:1.4rem;"/></div>
        <div class="slm-err" id="slm-l2-msg" style="display:none;"></div>
        <button class="slm-btn" onclick="slmVerifyOtp()">Verify &amp; Sign In</button>
        <button class="slm-btn" onclick="slmBackToL1()" style="margin-top:8px;background:none;border:1px solid var(--border);color:var(--muted);">Back</button>
      </div>
    </div>

    <!-- REGISTER FLOW -->
    <div id="slm-register-flow" style="display:none;">
      <div id="slm-r1">
        <div class="slm-field"><label class="slm-label">Email Address</label><input class="slm-input" id="slm-r-email" type="email" placeholder="you@email.com" autocomplete="email"/></div>
        <div class="slm-err" id="slm-r1-msg" style="display:none;"></div>
        <button class="slm-btn" id="slm-r-send-btn" onclick="slmSuSendOtp()">Send Verification Code</button>
      </div>
      <div id="slm-r2" style="display:none;">
        <p style="color:var(--muted);font-size:.88rem;margin-bottom:16px;">Enter the 6-digit code sent to <strong id="slm-r-otp-target" style="color:var(--text);"></strong>.</p>
        <div id="slm-r-dev-otp-box" style="display:none;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.3);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:.85rem;color:var(--cyan);">Dev mode — code: <strong id="slm-r-dev-otp-code" style="letter-spacing:.12rem;"></strong></div>
        <div class="slm-field"><input class="slm-input" id="slm-r-otp" type="text" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="one-time-code" style="text-align:center;letter-spacing:.4rem;font-size:1.4rem;"/></div>
        <div class="slm-err" id="slm-r2-msg" style="display:none;"></div>
        <button class="slm-btn" onclick="slmSuVerifyOtp()">Verify Code</button>
        <button class="slm-btn" onclick="slmSuBackTo1()" style="margin-top:8px;background:none;border:1px solid var(--border);color:var(--muted);">Back</button>
      </div>
      <div id="slm-r3" style="display:none;">
        <p style="color:var(--muted);font-size:.82rem;margin-bottom:14px;">Verified: <span id="slm-r-verified-email" style="color:#00ff88;"></span></p>
        <div class="slm-field"><label class="slm-label">Full Name</label><input class="slm-input" id="slm-r-name" type="text" placeholder="Your Name"/></div>
        <div class="slm-field"><label class="slm-label">User ID</label><input class="slm-input" id="slm-r-uid" type="text" placeholder="choose_a_username"/></div>
        <div class="slm-field"><label class="slm-label">Age</label><input class="slm-input" id="slm-r-age" type="number" min="1" max="120" placeholder="Your age"/></div>
        <div class="slm-field" id="slm-r-parent-field" style="display:none;"><label class="slm-label">Parent / Guardian Name</label><input class="slm-input" id="slm-r-parent" type="text" placeholder="Parent or guardian name"/></div>
        <div class="slm-field"><label class="slm-label">Password (min 8 chars)</label><input class="slm-input" id="slm-r-pass" type="password" placeholder="••••••••" autocomplete="new-password"/></div>
        <div class="slm-field"><label class="slm-label">Confirm Password</label><input class="slm-input" id="slm-r-pass2" type="password" placeholder="••••••••"/></div>
        <button class="slm-btn" id="slm-r-create-btn" onclick="slmSuCreate()">Create Account</button>
        <div id="slm-r3-msg" style="display:none;"></div>
      </div>
    </div>

  </div>
</div>

<script>
const _AUTH = {
  PYTHON_URI: (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8424' : 'https://uesl.opencodingsociety.com',
  suEmail: '',
};

function _devMode() { return sessionStorage.getItem('devMode') === 'true'; }

function _authMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.cssText = 'display:block;padding:8px 12px;border-radius:8px;font-size:.85rem;margin-top:8px;' +
    (type === 'error'   ? 'background:rgba(255,107,107,.15);color:#ff6b6b;border:1px solid rgba(255,107,107,.3);' :
     type === 'success' ? 'background:rgba(0,255,136,.1);color:#00ff88;border:1px solid rgba(0,255,136,.25);' :
                          'background:rgba(0,212,255,.1);color:#00d4ff;border:1px solid rgba(0,212,255,.25);');
}
function _authClear(id) { const el=document.getElementById(id); if(el){el.style.display='none';el.textContent='';} }

function slmSwitchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('slm-tab-login').classList.toggle('active', isLogin);
  document.getElementById('slm-tab-register').classList.toggle('active', !isLogin);
  document.getElementById('slm-login-flow').style.display    = isLogin ? '' : 'none';
  document.getElementById('slm-register-flow').style.display = isLogin ? 'none' : '';
}

async function slmSendOtp() {
  const uid = document.getElementById('slm-uid').value.trim();
  const pw  = document.getElementById('slm-pw').value;
  if (!uid || !pw) { _authMsg('slm-l1-msg','Enter your User ID and password.','error'); return; }
  const btn = document.getElementById('slm-send-otp-btn');
  btn.disabled = true; btn.textContent = 'Signing in…';
  _authClear('slm-l1-msg');
  try {
    if (_devMode()) {
      const r = await fetch(`${_AUTH.PYTHON_URI}/api/authenticate`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({uid,password:pw}) });
      if (r.ok) { _authMsg('slm-l1-msg','Signed in!','success'); setTimeout(() => { window.location.href = '/'; }, 800); return; }
      const d = await r.json(); _authMsg('slm-l1-msg',d.message||'Login failed.','error'); btn.disabled=false; btn.textContent='Sign In'; return;
    }
    const r = await fetch(`${_AUTH.PYTHON_URI}/api/otp/send`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({uid,password:pw}) });
    const d = await r.json();
    if (r.ok) {
      if (d.user) { _authMsg('slm-l1-msg','Signed in!','success'); setTimeout(() => { window.location.href = '/'; }, 800); }
      else {
        document.getElementById('slm-l1').style.display = 'none';
        document.getElementById('slm-l2').style.display = '';
        if (d.dev_otp) { document.getElementById('slm-dev-otp-code').textContent=d.dev_otp; document.getElementById('slm-dev-otp-box').style.display=''; }
        _authMsg('slm-l2-msg', d.message||'Code sent to your email.','info');
      }
    } else { _authMsg('slm-l1-msg',d.message||'Failed.','error'); btn.disabled=false; btn.textContent='Sign In'; }
  } catch(e) { _authMsg('slm-l1-msg','Network error — check your connection.','error'); btn.disabled=false; btn.textContent='Sign In'; }
}

async function slmVerifyOtp() {
  const uid = document.getElementById('slm-uid').value.trim();
  const otp = document.getElementById('slm-otp').value.trim();
  if (!otp) { _authMsg('slm-l2-msg','Enter the 6-digit code.','error'); return; }
  _authMsg('slm-l2-msg','Verifying…','info');
  try {
    const r = await fetch(`${_AUTH.PYTHON_URI}/api/otp/verify`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({uid,otp}) });
    const d = await r.json();
    if (r.ok) { _authMsg('slm-l2-msg','Verified!','success'); setTimeout(() => { window.location.href = '/'; }, 800); }
    else _authMsg('slm-l2-msg',d.message||'Invalid code.','error');
  } catch(e) { _authMsg('slm-l2-msg','Network error.','error'); }
}

function slmBackToL1() {
  document.getElementById('slm-l2').style.display='none';
  document.getElementById('slm-l1').style.display='';
  document.getElementById('slm-otp').value='';
  document.getElementById('slm-dev-otp-box').style.display='none';
  const btn=document.getElementById('slm-send-otp-btn'); btn.disabled=false; btn.textContent='Sign In';
  _authClear('slm-l1-msg');
}

async function slmSuSendOtp() {
  const email = document.getElementById('slm-r-email').value.trim();
  if (!email || !email.includes('@')) { _authMsg('slm-r1-msg','Enter a valid email address.','error'); return; }
  if (_devMode()) {
    _AUTH.suEmail = email;
    _authMsg('slm-r1-msg','[Dev] OTP skipped — fill in your details.','info');
    setTimeout(() => _slmSuGoToDetails(email), 600);
    return;
  }
  const btn = document.getElementById('slm-r-send-btn');
  btn.disabled = true; btn.textContent = 'Sending…';
  _authClear('slm-r1-msg');
  try {
    const r = await fetch(`${_AUTH.PYTHON_URI}/api/otp/signup/send`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) });
    const d = await r.json();
    if (r.ok) {
      _AUTH.suEmail = email;
      document.getElementById('slm-r-otp-target').textContent = email;
      if (d.dev_otp) { document.getElementById('slm-r-dev-otp-code').textContent=d.dev_otp; document.getElementById('slm-r-dev-otp-box').style.display=''; }
      document.getElementById('slm-r1').style.display = 'none';
      document.getElementById('slm-r2').style.display = '';
    } else { _authMsg('slm-r1-msg', d.message||'Failed to send code.','error'); btn.disabled=false; btn.textContent='Send Verification Code'; }
  } catch(e) { _authMsg('slm-r1-msg','Network error — check your connection.','error'); btn.disabled=false; btn.textContent='Send Verification Code'; }
}

async function slmSuVerifyOtp() {
  const otp = document.getElementById('slm-r-otp').value.trim();
  if (!otp) { _authMsg('slm-r2-msg','Enter the 6-digit code.','error'); return; }
  _authMsg('slm-r2-msg','Verifying…','info');
  try {
    const r = await fetch(`${_AUTH.PYTHON_URI}/api/otp/signup/verify`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:_AUTH.suEmail, otp}) });
    const d = await r.json();
    if (r.ok) _slmSuGoToDetails(_AUTH.suEmail);
    else _authMsg('slm-r2-msg', d.message||'Invalid code.','error');
  } catch(e) { _authMsg('slm-r2-msg','Network error.','error'); }
}

function slmSuBackTo1() {
  document.getElementById('slm-r2').style.display='none';
  document.getElementById('slm-r1').style.display='';
  document.getElementById('slm-r-otp').value='';
  document.getElementById('slm-r-dev-otp-box').style.display='none';
  const btn=document.getElementById('slm-r-send-btn'); btn.disabled=false; btn.textContent='Send Verification Code';
  _authClear('slm-r1-msg');
}

function _slmSuGoToDetails(email) {
  document.getElementById('slm-r-verified-email').textContent = email;
  document.getElementById('slm-r2').style.display = 'none';
  document.getElementById('slm-r3').style.display = '';
}

document.addEventListener('DOMContentLoaded', function() {
  const ageInput = document.getElementById('slm-r-age');
  if (ageInput) ageInput.addEventListener('input', slmToggleParent);
  if (new URLSearchParams(location.search).get('tab') === 'register') slmSwitchTab('register');
});

function slmToggleParent() {
  const age = parseInt(document.getElementById('slm-r-age').value, 10);
  document.getElementById('slm-r-parent-field').style.display = (!isNaN(age) && age < 18) ? '' : 'none';
}

async function slmSuCreate() {
  const name   = document.getElementById('slm-r-name').value.trim();
  const uid    = document.getElementById('slm-r-uid').value.trim();
  const age    = parseInt(document.getElementById('slm-r-age').value, 10);
  const parentEl = document.getElementById('slm-r-parent');
  const parent = parentEl ? parentEl.value.trim() : '';
  const pw     = document.getElementById('slm-r-pass').value;
  const pw2    = document.getElementById('slm-r-pass2').value;

  if (!name) { _authMsg('slm-r3-msg','Full name is required.','error'); return; }
  if (!uid)  { _authMsg('slm-r3-msg','User ID is required.','error'); return; }
  if (isNaN(age) || age < 1) { _authMsg('slm-r3-msg','Enter a valid age.','error'); return; }
  if (age < 18 && !parent) { _authMsg('slm-r3-msg','Parent/guardian name is required for users under 18.','error'); return; }
  if (!pw || pw.length < 8) { _authMsg('slm-r3-msg','Password must be at least 8 characters.','error'); return; }
  if (pw !== pw2) { _authMsg('slm-r3-msg','Passwords do not match.','error'); return; }

  const btn = document.getElementById('slm-r-create-btn');
  btn.disabled = true; btn.textContent = 'Creating account…';
  _authMsg('slm-r3-msg','Creating account…','info');

  try {
    const body = { name, uid, password: pw, email: _AUTH.suEmail, age };
    if (age < 18 && parent) body.parent = parent;
    const r = await fetch(`${_AUTH.PYTHON_URI}/api/user`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await r.json();
    if (r.ok) {
      _authMsg('slm-r3-msg','Account created! Signing you in…','success');
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } else { _authMsg('slm-r3-msg', d.message||'Failed to create account.','error'); btn.disabled=false; btn.textContent='Create Account'; }
  } catch(e) { _authMsg('slm-r3-msg','Network error — check your connection.','error'); btn.disabled=false; btn.textContent='Create Account'; }
}
</script>
