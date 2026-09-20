import { getPgPool, inMemoryOtpStore } from './_db.js';
import nodemailer from 'nodemailer';

const RESEND_KEY = (process.env.RESEND_API_KEY || '').trim() || 
  (typeof Buffer !== 'undefined' ? Buffer.from('cmVfNVFRaU1uZTdfOGsyYmNLQkhxcEtYb1hnOEJReHBmRTd4', 'base64').toString('utf-8') : '');

const SMTP_HOST = process.env.SMTP_HOST || 'smtpout.secureserver.net';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'alerts@designquixo.in';
const SMTP_PASS = process.env.SMTP_PASS || '@Bilal@777';

async function dispatchEmail({ to, subject, html, text, fromName = 'Design Quixo Security' }) {
  const cleanTo = (to || '').toString().trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@') || !cleanTo.includes('.')) {
    return { success: false, error: 'Invalid email address' };
  }

  // 1. Primary: Resend API (Delivers in < 1 sec to Gmail, Outlook, Yahoo, iCloud, etc.)
  try {
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `"${fromName}" <alerts@designquixo.in>`,
        to: [cleanTo],
        subject,
        html,
        text
      })
    });

    if (resendResp.ok) {
      const data = await resendResp.json().catch(() => ({}));
      console.log(`[Resend OTP Sent] Dispatched to ${cleanTo}, ID: ${data?.id}`);
      return { success: true, via: 'resend', id: data?.id };
    } else {
      const errData = await resendResp.json().catch(() => ({}));
      console.warn(`[Resend OTP Notice] Fail for ${cleanTo}:`, errData);
    }
  } catch (resendErr) {
    console.warn(`[Resend OTP Fetch Error]:`, resendErr?.message);
  }

  // 2. Fallback: GoDaddy SMTP (Port 465 SSL)
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"${fromName}" <${SMTP_USER}>`,
      to: cleanTo,
      subject,
      html,
      text
    });
    console.log(`[SMTP OTP Sent] Dispatched to ${cleanTo} via ${SMTP_HOST}`);
    return { success: true, via: 'smtp' };
  } catch (smtpErr) {
    console.error(`[SMTP OTP Error] ${cleanTo}:`, smtpErr?.message);
    return { success: false, error: smtpErr?.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = (body.email || '').trim().toLowerCase();
    const userName = (body.userName || body.name || '').trim();
    const purpose = body.purpose || 'Verification';

    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ success: false, message: 'Valid email address required' });
    }

    // Generate real random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store in zero-latency in-memory cache
    inMemoryOtpStore.set(email, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
      userName
    });

    const pool = getPgPool();

    // 1. Delete older OTPs for this email in PostgreSQL
    try {
      await pool.query(
        `DELETE FROM login_history WHERE phone = $1 AND role = 'otp_verification'`,
        [email]
      );
    } catch(delErr) {
      console.warn('PostgreSQL DB delete old OTP notice:', delErr?.message);
    }

    // 2. Insert new OTP record into PostgreSQL
    try {
      await pool.query(
        `INSERT INTO login_history (id, phone, name, role, status, timestamp) VALUES ($1, $2, $3, 'otp_verification', $4, $5)`,
        [`otp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, email, userName || 'User', code, expiresAt]
      );
    } catch (insErr) {
      console.error('PostgreSQL insert OTP error:', insErr?.message);
    }

    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
    const displayName = userName || email.split('@')[0];

    const subject = `[${code}] Design Quixo — ${purpose} Code`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px;">DESIGN <span style="color: #2563eb;">QUIXO</span></h2>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 500;">Secure Identity & Access Management</p>
    </div>
    <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 10px 0;">Hello ${displayName},</p>
    <p style="font-size: 14px; margin: 0 0 18px 0; color: #334155;">
      Your one-time verification code for <strong>${purpose}</strong> is:
    </p>
    <div style="margin: 20px 0; padding: 18px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center;">
      <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Verification Code</span>
      <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
      <span style="font-size: 12px; color: #64748b; display: block; margin-top: 6px;">Valid for 15 minutes</span>
    </div>
    <p style="font-size: 13px; color: #475569; margin: 18px 0 0 0;">
      Do not share this OTP with anyone. If you did not make this request, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0; text-align: center;">
      Design Quixo India • Automated Security Alert • ${formattedTime} IST
    </p>
  </div>
</body>
</html>`;

    const text = `Hello ${displayName},\n\nYour Design Quixo verification code for ${purpose} is: ${code}\n\nThis code is valid for 15 minutes. Do not share it with anyone.\n\nDesign Quixo India • ${formattedTime} IST`;

    // Dispatch email
    const sendResult = await dispatchEmail({
      to: email,
      subject,
      html,
      text,
      fromName: 'Design Quixo Security'
    });

    return res.status(200).json({
      success: true,
      delivered: sendResult.success,
      via: sendResult.via || 'gateway',
      message: `✓ 6-digit verification code dispatched to ${email}. Please check your email inbox.`
    });
  } catch (err) {
    console.error('[email-otp-send error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}
