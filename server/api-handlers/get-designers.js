import { getPgPool } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pool = getPgPool();
    const sqlRes = await pool.query('SELECT * FROM designers ORDER BY created_at DESC');
    const designers = sqlRes.rows || [];

    return res.status(200).json({ success: true, designers });
  } catch (err) {
    console.error('[get-designers PostgreSQL error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error fetching designers' });
  }
}
