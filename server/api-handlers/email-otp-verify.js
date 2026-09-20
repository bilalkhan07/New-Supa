import { getPgPool, inMemoryOtpStore } from './_db.js';

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
    let body = {};
    if (typeof req.body === 'string') {
      try { body = JSON.parse(req.body); } catch(pe) { body = {}; }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }
    const { email, code } = body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    if (!cleanEmail || !cleanCode || cleanCode.length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email and 6-digit OTP code.' });
    }

    // 1. Check in-memory zero-latency cache
    const memEntry = inMemoryOtpStore.get(cleanEmail);
    if (memEntry) {
      if (Date.now() > memEntry.expiresAt) {
        inMemoryOtpStore.delete(cleanEmail);
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
      }

      if (memEntry.code === cleanCode) {
        inMemoryOtpStore.delete(cleanEmail);
        return res.status(200).json({ success: true, message: 'Email OTP verified successfully!' });
      }
    }

    // 2. Query Database / Supabase REST
    const pool = getPgPool();
    const sqlRes = await pool.query(
      `SELECT * FROM login_history WHERE phone = $1 AND role = 'otp_verification' ORDER BY timestamp DESC LIMIT 1`,
      [cleanEmail]
    );

    if (sqlRes && sqlRes.rows && sqlRes.rows.length > 0) {
      const latest = sqlRes.rows[0];
      const expiresAt = new Date(latest.timestamp).getTime();
      if (!isNaN(expiresAt) && Date.now() > expiresAt) {
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
      }

      if (latest.status === cleanCode) {
        // Delete used OTP
        try {
          await pool.query(`DELETE FROM login_history WHERE id = $1`, [latest.id]);
        } catch (e) {}

        return res.status(200).json({ success: true, message: 'Email OTP verified successfully!' });
      }
    }

    return res.status(400).json({ success: false, message: 'Invalid or expired verification code. Please check your email.' });
  } catch (err) {
    console.error('[email-otp-verify error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal error' });
  }
}
