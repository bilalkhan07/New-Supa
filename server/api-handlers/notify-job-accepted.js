import nodemailer from 'nodemailer';

const RESEND_KEY = (process.env.RESEND_API_KEY || '').trim() || 
  (typeof Buffer !== 'undefined' ? Buffer.from('cmVfNVFRaU1uZTdfOGsyYmNLQkhxcEtYb1hnOEJReHBmRTd4', 'base64').toString('utf-8') : '');

async function sendSingleEmail({ to, subject, html, text, fromName = 'Design Quixo Operations' }) {
  const cleanTo = (to || '').toString().trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@') || !cleanTo.includes('.')) {
    return { success: false, error: 'Invalid email' };
  }

  // 1. Try Resend API
  try {
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName} <alerts@designquixo.in>`,
        to: [cleanTo],
        subject,
        html,
        text
      })
    });

    if (resendResp.ok) {
      return { success: true, via: 'resend' };
    }
  } catch (err) {
    console.warn('[Resend notify-job-accepted notice]:', err?.message);
  }

  // 2. Fallback SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: 'alerts@designquixo.in',
        pass: '@Bilal@777'
      },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"${fromName}" <alerts@designquixo.in>`,
      to: cleanTo,
      subject,
      html,
      text
    });
    return { success: true, via: 'godaddy_smtp' };
  } catch (smtpErr) {
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
    const { designerName, clientName, jobId, jobDetails } = body;

    if (!jobId || !designerName) {
      return res.status(400).json({ success: false, message: 'Missing designerName or jobId' });
    }

    const cleanId = (jobId || 'DQ-JOB').toString().replace(/^(DQ[-_]?)+/i, '');
    const cleanClient = (clientName || 'Direct Client').trim();
    const cleanDesigner = (designerName || 'Designer').trim();
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const subject = `Job Claimed: #${cleanId} by ${cleanDesigner} (Client: ${cleanClient})`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1e293b;background:#f8fafc;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 12px 0;">Job Claim Notification</p>
    <p style="font-size:14px;color:#334155;margin:0 0 16px 0;">A designer has claimed an active job brief:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0;">
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Job ID:</strong> #${cleanId}</p>
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Designer Name:</strong> ${cleanDesigner}</p>
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Client Name:</strong> ${cleanClient}</p>
      ${jobDetails?.service ? `<p style="margin:0 0 8px 0;font-size:14px;"><strong>Service:</strong> ${jobDetails.service}</p>` : ''}
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Claim Timestamp:</strong> ${formattedTime} IST</p>
      <p style="margin:0;font-size:14px;color:#2563eb;"><strong>Status:</strong> In Progress</p>
    </div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 14px 0;" />
    <p style="font-size:11px;color:#94a3b8;margin:0;">Design Quixo Operations Alert • ${formattedTime} IST</p>
  </div>
</body>
</html>`;

    const textContent = `Job Claim Alert:\n\nJob ID: #${cleanId}\nDesigner: ${cleanDesigner}\nClient: ${cleanClient}\nClaimed at: ${formattedTime} IST\n\nDesign Quixo Operations`;

    // Send ONLY to designquixo@gmail.com
    await sendSingleEmail({
      to: 'designquixo@gmail.com',
      subject,
      html,
      text: textContent
    });

    return res.status(200).json({ success: true, message: 'Alert email dispatched to operations desk.' });
  } catch (err) {
    console.error('[notify-job-accepted error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Error' });
  }
}
