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
    const designer = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const rawPhone = (designer.phone || designer.whatsapp || '').toString();
    const clean10 = rawPhone.replace(/\D/g, '').slice(-10);
    const cleanEmail = (designer.email || (designer.identifier && designer.identifier.includes('@') ? designer.identifier : '') || '').toString().trim().toLowerCase();
    const id = clean10 || cleanEmail || designer.id || 'DES-' + Date.now();
    const name = designer.name || 'Designer';
    const phone = clean10 || designer.phone || '';
    const email = cleanEmail;
    const identifier = cleanEmail || clean10 || id;
    const password = (designer.password || designer.pin || '7861').toString().trim();
    const portfolio = (designer.portfolio || '').toString().trim();
    const skills = (designer.skills || designer.experience || 'Graphic Design').toString().trim();
    const status = designer.status || 'Pending';
    const role = designer.role || 'designer';
    const avatar = designer.avatar || designer.avatarUrl || '';
    const sigDataUrl = (designer.signature || designer.signatureDataUrl || '').toString();
    const dateStr = designer.date || new Date().toLocaleDateString('en-IN');

    const pool = getPgPool();
    const sqlQuery = `
      INSERT INTO designers (
        id, name, phone, email, identifier, password, pin, portfolio, skills, status, role, avatar, avatar_url, date, signature, signaturedataurl, agreementsigned, agreementsigneddate, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17, CURRENT_TIMESTAMP
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        identifier = EXCLUDED.identifier,
        password = COALESCE(EXCLUDED.password, designers.password),
        pin = COALESCE(EXCLUDED.pin, designers.pin),
        portfolio = EXCLUDED.portfolio,
        skills = EXCLUDED.skills,
        status = COALESCE(designers.status, EXCLUDED.status),
        signature = EXCLUDED.signature,
        signaturedataurl = EXCLUDED.signaturedataurl;
    `;

    await pool.query(sqlQuery, [
      id, name, phone, email, identifier, password, password,
      portfolio, skills, status, role, avatar, avatar, dateStr,
      sigDataUrl, sigDataUrl, dateStr
    ]);

    // Save registration log in login_history
    try {
      await pool.query(
        `INSERT INTO login_history (id, phone, name, role, status, timestamp) VALUES ($1, $2, $3, 'designer', $4, CURRENT_TIMESTAMP)`,
        [`reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, clean10 || cleanEmail, name, `Designer Registered (${status}) - Email: ${cleanEmail || 'None'} - Phone: +91 ${clean10}`]
      );
    } catch(logErr) {}

    return res.status(200).json({
      success: true,
      designer: { id, name, phone, email, status, role },
      message: 'Designer registered in PostgreSQL successfully'
    });
  } catch (err) {
    console.error('[register-designer PostgreSQL error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error registering designer' });
  }
}
