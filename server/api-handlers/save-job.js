import { getPgPool } from './_db.js';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BN3PRogrLXTWkDjdv9B0QdDEGuUH5-cNIewJ6KgJ2glQrLgtGng1WocCuqmzrL1-BIdSfNb6SX2Xz0HzsP8Yuhk';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'h4330lk5ygavsVd-_F4zWnzCgUWOKMe-JtYaQ60iqrI';
const VAPID_SUBJECT = 'mailto:alerts@designquixo.in';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {}

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
    const job = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!job || (!job.id && !job.jobId)) {
      return res.status(400).json({ success: false, message: 'Missing job object' });
    }

    const rawId = (job.id || job.jobId || '').toString().trim();
    const bareId = rawId.replace(/^(DQ[-_]?)+/i, '');
    const cleanId = bareId ? `DQ-${bareId}` : `DQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const service = job.service || 'Graphic Design';
    const project = job.project || job.projectName || job.title || 'Design Request';
    const price = Number(job.price) || 399;
    const brief = job.brief || '';
    const phone = job.phone || job.whatsapp || job.client_phone || '';
    const whatsapp = job.whatsapp || job.phone || job.client_phone || '';
    const ratio = job.ratio || 'Square (1:1)';
    const refImg = job.referenceImage || job.referenceimage || job.image || '';
    const status = job.status || 'Pending';
    const acceptedBy = Array.isArray(job.acceptedBy) ? job.acceptedBy : [];
    const completed = !!job.completed;
    const completedAt = job.completedAt || job.completedat || null;
    const createdAt = job.createdAt || job.createdat || new Date().toISOString();
    const time = job.time || 'Just now';

    const pool = getPgPool();
    const sql = `
      INSERT INTO jobs (
        id, service, project, price, brief, phone, whatsapp, ratio, referenceimage, status, acceptedby, completed, completedat, createdat, time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        service = EXCLUDED.service,
        project = EXCLUDED.project,
        price = EXCLUDED.price,
        brief = EXCLUDED.brief,
        phone = EXCLUDED.phone,
        whatsapp = EXCLUDED.whatsapp,
        ratio = EXCLUDED.ratio,
        referenceimage = EXCLUDED.referenceimage,
        status = EXCLUDED.status,
        acceptedby = EXCLUDED.acceptedby,
        completed = EXCLUDED.completed,
        completedat = EXCLUDED.completedat,
        time = EXCLUDED.time;
    `;

    await pool.query(sql, [
      cleanId, service, project, price, brief, phone, whatsapp, ratio, refImg, status,
      JSON.stringify(acceptedBy), completed, completedAt, createdAt, time
    ]);

    // Push notification trigger
    try {
      const pushSubRes = await pool.query(`SELECT * FROM push_subscriptions WHERE role = 'designer'`);
      const subs = pushSubRes.rows || [];
      const pushPayload = JSON.stringify({
        title: '🚨 NEW DESIGN ORDER ALERT',
        body: `₹${price} • ${project} | Tap to view job!`,
        jobId: cleanId,
        url: 'https://designquixo.com/dashboard.html'
      });
      subs.forEach(row => {
        try {
          const subObj = typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription;
          if (subObj && subObj.endpoint) {
            webpush.sendNotification(subObj, pushPayload).catch(() => {});
          }
        } catch(e) {}
      });
    } catch(pushErr) {}

    return res.status(200).json({ success: true, id: cleanId, message: 'Job saved to PostgreSQL successfully' });
  } catch (err) {
    console.error('[save-job PostgreSQL error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error saving job' });
  }
}
