import 'dotenv/config';

async function testBrevoApi() {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'ar.claimscure@gmail.com';
  if (!apiKey) {
    console.log('Brevo API: SKIP (BREVO_API_KEY not set)');
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'ClaimsCure Test', email: fromEmail },
      to: [{ email: fromEmail }],
      subject: 'ClaimsCure Brevo API Test',
      htmlContent: '<p>Brevo HTTP API test successful at ' + new Date().toISOString() + '</p>',
    }),
  });
  const body = await res.text();
  console.log('Brevo API:', res.status, res.ok ? 'OK' : 'FAILED');
  if (!res.ok) console.log('  Error:', body.slice(0, 300));
  else console.log('  Response:', body.slice(0, 100));
}

async function testSmtp() {
  const nodemailer = await import('nodemailer');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;
  if (!user || !pass) {
    console.log('SMTP: SKIP (credentials not set)');
    return;
  }

  const t = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user, pass },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    await t.verify();
    console.log('SMTP verify: OK');
    const r = await t.sendMail({
      from: `"ClaimsCure Test" <${fromEmail}>`,
      to: fromEmail,
      subject: 'ClaimsCure SMTP Test',
      html: '<p>SMTP test successful</p>',
    });
    console.log('SMTP send: OK', r.messageId);
  } catch (e) {
    console.log('SMTP: FAILED —', e.message);
  }
}

console.log('Testing email delivery...\n');
await testBrevoApi();
await testSmtp();
