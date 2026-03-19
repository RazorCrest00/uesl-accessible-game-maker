require('dotenv').config();
const express    = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Email transporter (configure via .env) ────────────────────────────────
// Required env vars: SMTP_USER, SMTP_PASS
// Optional:          SMTP_HOST (default: smtp.gmail.com)
//                    SMTP_PORT (default: 587)
//                    SMTP_FROM (default: SMTP_USER)
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(toEmail, otp) {
  await transporter.sendMail({
    from:    process.env.SMTP_FROM || `"Datastream" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'Your Datastream Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;
                  background:#1e1e2e;color:#e2e8f0;padding:32px;border-radius:12px;">
        <h2 style="color:#6366f1;margin-top:0;">Verification Code</h2>
        <p>Use the code below to verify your email. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#12121f;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:2.5rem;font-weight:bold;letter-spacing:0.4rem;color:#a5b4fc;">
            ${otp}
          </span>
        </div>
        <p style="color:#9ca3af;font-size:0.85rem;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>`,
  });
}

const smtpReady = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

// ── Signup OTP store: email → { code, expires } ───────────────────────────
const signupOtpStore = new Map();

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/otp/signup/send  — generate OTP and email it
app.post('/api/otp/signup/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const otp = makeOtp();
  signupOtpStore.set(email.toLowerCase(), {
    code:    otp,
    expires: Date.now() + 10 * 60 * 1000,
  });

  if (smtpReady()) {
    try {
      await sendEmail(email, otp);
      return res.json({ message: `Verification code sent to ${email}.` });
    } catch (err) {
      console.error('SMTP error:', err.message);
      return res.status(500).json({ message: 'Failed to send email: ' + err.message });
    }
  }

  // No SMTP configured — surface the code so the UI can show it
  return res.json({ message: 'Dev mode (SMTP not configured).', dev_otp: otp });
});

// POST /api/otp/signup/verify  — verify signup OTP
app.post('/api/otp/signup/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and code are required.' });

  const key    = email.toLowerCase();
  const record = signupOtpStore.get(key);
  if (!record)                    return res.status(400).json({ message: 'No code was sent to this email. Please request one first.' });
  if (Date.now() > record.expires) {
    signupOtpStore.delete(key);
    return res.status(400).json({ message: 'Code has expired. Request a new one.' });
  }
  if (record.code !== String(otp).trim()) return res.status(400).json({ message: 'Incorrect code.' });

  signupOtpStore.delete(key);
  return res.json({ message: 'Email verified.', verified: true });
});

// POST /api/otp/relay  — send a caller-supplied OTP via email (used when
//                         Flask generates the OTP but has no SMTP configured)
app.post('/api/otp/relay', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'email and otp are required.' });

  if (!smtpReady()) {
    // Nothing we can do either — just acknowledge silently so the
    // frontend can still show the dev-mode code in the UI.
    return res.json({ message: 'SMTP not configured on relay server either.', relayed: false });
  }
  try {
    await sendEmail(email, otp);
    return res.json({ message: 'Code emailed.', relayed: true });
  } catch (err) {
    console.error('Relay SMTP error:', err.message);
    return res.status(500).json({ message: 'Failed to relay email: ' + err.message, relayed: false });
  }
});

// ── Socket.io (unchanged) ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  const id = uuidv4();
  socket.emit('id', id);
  socket.on('update', (data) => {
    console.log(data);
    io.emit('stateUpdate', data);
  });
  socket.on('disconnect', () => {
    io.emit('disconnection', id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () =>
  console.log(`Server running on port ${PORT} | SMTP: ${smtpReady() ? 'configured ✓' : 'NOT configured (dev mode)'}`)
);
