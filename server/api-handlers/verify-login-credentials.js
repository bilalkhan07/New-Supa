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
    const { identifier, password, localBackup } = body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Missing identifier or password' });
    }

    const cleanIdent = identifier.toString().trim().toLowerCase();
    const cleanPass = password.toString().trim();
    const cleanPhoneDigits = cleanIdent.replace(/\D/g, '').slice(-10);

    // 1. Check Admin Account explicitly
    const isAdminIdentifier = (
      cleanIdent === 'admin@designquixobilal' ||
      cleanIdent === 'admin@designquixo.com' ||
      cleanIdent === 'admin' ||
      cleanIdent === 'superadmin' ||
      cleanIdent === 'alerts@designquixo.in' ||
      cleanIdent === 'mustafazthings@gmail.com'
    );

    if (isAdminIdentifier) {
      const isPassCorrect = (cleanPass === '@Bilal@786' || cleanPass === 'Bilal#0897' || cleanPass === '@Bilal@777');
      if (!isPassCorrect) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect admin password entered.'
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: 'admin',
          name: 'Bilal Khan (Admin)',
          email: 'mustafazthings@gmail.com',
          phone: '8602420897',
          role: 'admin',
          status: 'Approved'
        },
        message: 'Admin authentication successful'
      });
    }

    // 2. Query PostgreSQL designers table directly
    const pool = getPgPool();
    let designer = null;

    try {
      const sqlRes = await pool.query(`
        SELECT * FROM designers 
        WHERE LOWER(email) = $1 
           OR LOWER(identifier) = $1 
           OR LOWER(id) = $1 
           OR (phone IS NOT NULL AND RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 10) = $2)
        LIMIT 1
      `, [cleanIdent, cleanPhoneDigits || 'NONE']);

      if (sqlRes && sqlRes.rows && sqlRes.rows.length > 0) {
        designer = sqlRes.rows[0];
      }
    } catch (sqlErr) {
      console.warn('[verify-login-credentials PostgreSQL notice]:', sqlErr?.message);
    }

    if (!designer && localBackup) {
      designer = localBackup;
    }

    if (!designer) {
      return res.status(401).json({
        success: false,
        message: 'No designer account found for this mobile/email. Please check your credentials or register.'
      });
    }

    if (designer.status === 'Revoked') {
      return res.status(401).json({
        success: false,
        message: 'Account has been revoked by the platform administrator.'
      });
    }

    const storedPass = (designer.password || designer.pin || '').toString().trim();
    const isPassValid = storedPass ? (storedPass === cleanPass || storedPass.toLowerCase() === cleanPass.toLowerCase()) : false;

    if (!isPassValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password entered. Please enter the password you set during registration.'
      });
    }

    // Log successful login into login_history
    try {
      await pool.query(
        `INSERT INTO login_history (id, phone, name, role, status, timestamp) VALUES ($1, $2, $3, 'designer', 'Success', CURRENT_TIMESTAMP)`,
        [`log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, designer.phone || designer.email || cleanIdent, designer.name || 'Designer']
      );
    } catch(logErr) {}

    return res.status(200).json({
      success: true,
      user: {
        id: designer.id,
        name: designer.name,
        email: designer.email,
        phone: designer.phone,
        identifier: designer.email || designer.phone || designer.id,
        role: designer.role || 'designer',
        status: designer.status || 'Pending',
        portfolio: designer.portfolio || '',
        skills: designer.skills || ''
      },
      message: 'Designer authenticated successfully via PostgreSQL'
    });
  } catch (err) {
    console.error('[verify-login-credentials error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}
