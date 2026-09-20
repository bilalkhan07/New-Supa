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
    const sqlRes = await pool.query(
      `SELECT * FROM jobs WHERE status IS NULL OR status != 'Deleted' ORDER BY createdat DESC, created_at DESC`
    );

    const jobs = (sqlRes.rows || []).map(j => ({
      id: j.id,
      service: j.service || j.title || 'Design Request',
      project: j.project || j.title || 'Design Request',
      price: Number(j.price) || 399,
      brief: j.brief || (j.details && j.details.brief) || '',
      phone: j.phone || j.client_phone || '',
      whatsapp: j.whatsapp || j.phone || j.client_phone || '',
      ratio: j.ratio || 'Square (1:1)',
      referenceImage: j.referenceimage || '',
      referenceimage: j.referenceimage || '',
      status: j.status || 'Pending',
      acceptedBy: Array.isArray(j.acceptedby) ? j.acceptedby : [],
      completed: !!j.completed,
      completedAt: j.completedat || j.completed_at || null,
      createdAt: j.createdat || j.created_at || new Date().toISOString(),
      time: j.time || 'Just now'
    }));

    return res.status(200).json({
      success: true,
      jobs,
      count: jobs.length
    });
  } catch (err) {
    console.error('[get-jobs PostgreSQL error]:', err);
    return res.status(200).json([]);
  }
}
