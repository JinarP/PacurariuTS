const express = require('express');
const app = express();
const path = require('path');
const https = require('https');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.set('view engine', 'jade');
const filePath = path.join(__dirname, 'views');
require("dotenv").config();

const key = process.env.KEY;
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET;
const HCAPTCHA_SITE_KEY = process.env.HCAPTCHA_SITE_KEY;

// ── Utilities ──────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function logRejected(reason, ip, endpoint) {
  const ts = new Date().toISOString();
  console.warn(`[REJECTED] ${ts} | IP: ${ip} | Endpoint: ${endpoint} | Reason: ${reason}`);
}

async function verifyHcaptcha(token) {
  if (!token) return false;
  return new Promise((resolve) => {
    const postData = new URLSearchParams({
      secret: HCAPTCHA_SECRET,
      response: token
    }).toString();

    const options = {
      hostname: 'hcaptcha.com',
      path: '/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).success === true);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
}

// ── Rate Limiter (10 cereri / 15 minute per IP, aplicat pe ambele endpoint-uri) ──

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRejected('Rate limit exceeded', req.ip, req.path);
    res.status(429).send('Prea multe cereri. Încearcă din nou după 15 minute.');
  }
});

// ── GET routes ──────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.render('contact', { hcaptchaSiteKey: HCAPTCHA_SITE_KEY });
});

app.get('/home', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/culture', (req, res) => {
  res.render('culture');
});

app.get('/team', (req, res) => {
  res.render('team');
});

app.get('/cariera', (req, res) => {
  res.render('cariera', { hcaptchaSiteKey: HCAPTCHA_SITE_KEY });
});

app.get('/services', (req, res) => {
  res.render('services');
});

// ── Email ───────────────────────────────────────────────────────────────────

var postmark = require("postmark");
var client = new postmark.ServerClient(key);

const message = (subject, name, email, msg) => {
  return client.sendEmail({
    "From": "office@pacurariu.com",
    "To": "office@pacurariu.com",
    "Subject": escapeHtml(subject),
    "HtmlBody": `<strong>Adresa de email: ${escapeHtml(email)}, nume: ${escapeHtml(name)}</strong><br>`,
    "TextBody": msg
  });
};

const send = (date) => {
  return client.sendEmail({
    "From": "office@pacurariu.com",
    "To": "office@pacurariu.com",
    "Subject": `Aplicatie pentru ${escapeHtml(date.post)}`,
    "HtmlBody": `
    <strong>Contact:</strong><br>
    <strong>Email: ${escapeHtml(date.email)}</strong><br>
    <strong>Nume: ${escapeHtml(date.fullname)}</strong><br>
    <strong>Telefon: ${escapeHtml(date.tel)}</strong><br>
    <strong>Adresa: ${escapeHtml(date.adress)} ${escapeHtml(date.city)}</strong><br>
    <strong>Poate incepe: ${escapeHtml(date.date)}</strong><br>`,
    "TextBody": date.despre
  });
};

// ── POST /send-apply ────────────────────────────────────────────────────────

app.post('/send-apply', emailLimiter, async (req, res) => {
  const ip = req.ip;
  const body = req.body;

  // 1. Honeypot – câmp ascuns completat = bot
  if (body.website && body.website.trim() !== '') {
    logRejected('Honeypot triggered', ip, '/send-apply');
    return res.status(400).send('Cerere invalidă.');
  }

  // 2. Validare hCaptcha server-side
  const captchaOk = await verifyHcaptcha(body['h-captcha-response']);
  if (!captchaOk) {
    logRejected('CAPTCHA failed', ip, '/send-apply');
    return res.status(400).send('Verificare CAPTCHA eșuată. Reîncarcă pagina și încearcă din nou.');
  }

  // 3. Validare câmpuri
  if (!body.fullname || body.fullname.trim().length < 2 || body.fullname.length > 100) {
    logRejected('Invalid fullname', ip, '/send-apply');
    return res.status(400).send('Numele complet este obligatoriu (minim 2 caractere).');
  }
  if (!body.email || !validator.isEmail(body.email)) {
    logRejected('Invalid email', ip, '/send-apply');
    return res.status(400).send('Adresă de email invalidă.');
  }
  const allowedPosts = ['sofer', 'contabil', 'Dispecer', 'Altceva'];
  if (!body.post || !allowedPosts.includes(body.post)) {
    logRejected('Invalid post value', ip, '/send-apply');
    return res.status(400).send('Selectează o poziție validă.');
  }

  // 4. Trimite email (input-ul este deja escape-uit în funcția send())
  try {
    await send(body);
    res.render('cariera', { hcaptchaSiteKey: HCAPTCHA_SITE_KEY });
  } catch (err) {
    console.error('[EMAIL ERROR] /send-apply:', err);
    res.status(500).send('A apărut o eroare la trimiterea aplicației. Încearcă din nou.');
  }
});

// ── POST /sent-message ──────────────────────────────────────────────────────

app.post('/sent-message', emailLimiter, async (req, res) => {
  const ip = req.ip;
  const body = req.body;
  const { name, emailadress, subject, message: msg } = body;

  // 1. Honeypot
  if (body.website && body.website.trim() !== '') {
    logRejected('Honeypot triggered', ip, '/sent-message');
    return res.status(400).send('Cerere invalidă.');
  }

  // 2. Validare hCaptcha server-side
  const captchaOk = await verifyHcaptcha(body['h-captcha-response']);
  if (!captchaOk) {
    logRejected('CAPTCHA failed', ip, '/sent-message');
    return res.status(400).send('Verificare CAPTCHA eșuată. Reîncarcă pagina și încearcă din nou.');
  }

  // 3. Validare câmpuri
  if (!name || name.trim().length < 2 || name.length > 100) {
    logRejected('Invalid name', ip, '/sent-message');
    return res.status(400).send('Numele este obligatoriu (minim 2 caractere).');
  }
  if (!emailadress || !validator.isEmail(emailadress)) {
    logRejected('Invalid email', ip, '/sent-message');
    return res.status(400).send('Adresă de email invalidă.');
  }
  if (!subject || subject.trim().length < 2 || subject.length > 200) {
    logRejected('Invalid subject', ip, '/sent-message');
    return res.status(400).send('Subiectul este obligatoriu (minim 2 caractere, maxim 200).');
  }
  if (!msg || msg.trim().length < 10 || msg.length > 5000) {
    logRejected('Invalid message', ip, '/sent-message');
    return res.status(400).send('Mesajul trebuie să aibă minim 10 caractere și maxim 5000.');
  }

  // 4. Trimite email (input-ul este deja escape-uit în funcția message())
  try {
    await message(subject, name, emailadress, msg);
    res.render('contact', { hcaptchaSiteKey: HCAPTCHA_SITE_KEY });
  } catch (err) {
    console.error('[EMAIL ERROR] /sent-message:', err);
    res.status(500).send('A apărut o eroare la trimiterea mesajului. Încearcă din nou.');
  }
});

// ── Start server ────────────────────────────────────────────────────────────

const port = 10000;
app.listen(port, () => {
  console.log(`Serverul rulează la adresa http://localhost:${port}`);
});

module.exports = app;
