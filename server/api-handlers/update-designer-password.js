import { getPgPool } from './_db.js';

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
    const { key, newPassword } = body;

    if (!key || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing key or newPassword' });
    }

    const cleanKey = key.toString().trim();
    const cleanPass = newPassword.toString().trim();
    const phone10 = cleanKey.replace(/\D/g, '').slice(-10);

    const pool = getPgPool();
    const sqlQuery = `
      UPDATE designers 
      SET password = $1, pin = $1 
      WHERE LOWER(email) = LOWER($2) 
         OR LOWER(identifier) = LOWER($2) 
         OR LOWER(id) = LOWER($2) 
         OR (phone IS NOT NULL AND RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 10) = $3);
    `;
    await pool.query(sqlQuery, [cleanPass, cleanKey, phone10 || 'NONE']);

    // Also log in login_history
    try {
      await pool.query(
        `INSERT INTO login_history (id, phone, name, role, status, timestamp) VALUES ($1, $2, $3, 'password_update', 'Success', CURRENT_TIMESTAMP)`,
        [`pwd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, phone10 || cleanKey, cleanKey]
      );
    } catch(e) {}

    return res.status(200).json({ success: true, message: 'Password updated successfully in PostgreSQL' });
  } catch (err) {
    console.error('[update-designer-password error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error updating password' });
  }
}
