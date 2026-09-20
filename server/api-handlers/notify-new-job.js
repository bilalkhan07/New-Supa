import nodemailer from 'nodemailer';

const RESEND_KEY = (process.env.RESEND_API_KEY || '').trim() || 
  (typeof Buffer !== 'undefined' ? Buffer.from('cmVfNVFRaU1uZTdfOGsyYmNLQkhxcEtYb1hnOEJReHBmRTd4', 'base64').toString('utf-8') : '');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xdfzbfdfbdrhftfjhvbc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZnpiZmRmYmRyaGZ0ZmpodmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDcyNTUsImV4cCI6MjA1NzYyMzI1NX0.xZ5yC_T9rU_M4zF8lP-Nq3_aF1Q3K5q2r_s1t7u_w6x';

async function sendSingleEmail({ to, subject, html, text, fromName = 'Design Quixo' }) {
  const cleanTo = (to || '').toString().trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes('@') || !cleanTo.includes('.') || cleanTo.endsWith('@example.com')) {
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
    console.warn('[Resend notify-new-job notice]:', err?.message);
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
    const { job, designers, extraEmails, extraDesigners, deletedDesigners } = body;

    if (!job) {
      return res.status(400).json({ success: false, message: 'Missing job payload' });
    }

    const cleanId = (job.id || 'DQ-NEW').toString().replace(/^(DQ[-_]?)+/i, '');
    const serviceName = job.service || job.project || 'Graphic Design Request';
    const clientName = job.clientName || job.name || 'Direct Client';
    const clientPhone = job.whatsapp || job.phone || 'N/A';
    const rawPrice = Number(job.price) || 399;
    const designerPayout = Math.round(rawPrice * 0.60);
    const ratio = job.ratio || 'Square (1:1)';
    const brief = job.brief || job.description || 'Custom design requirement';
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    // Set of deleted designer emails & phones
    const deletedSet = new Set();
    if (Array.isArray(deletedDesigners)) {
      deletedDesigners.forEach(d => {
        const cd = (d || '').toString().trim().toLowerCase();
        if (cd) deletedSet.add(cd);
        const cp = cd.replace(/\D/g, '').slice(-10);
        if (cp && cp.length === 10) deletedSet.add(cp);
      });
    }

    // Build recipient list
    const recipientMap = new Map();

    // 1. Designers from payload (only Approved, non-deleted)
    const rawList = [
      ...(Array.isArray(designers) ? designers : []),
      ...(Array.isArray(extraDesigners) ? extraDesigners : [])
    ];
    rawList.forEach(d => {
      if (!d) return;
      const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
      const ph = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
      const status = (d.status || '').toString().trim();
      if (status && status !== 'Approved') return;
      if (em && deletedSet.has(em)) return;
      if (ph && deletedSet.has(ph)) return;
      if (em && em.includes('@') && em.includes('.')) {
        recipientMap.set(em, d.name || 'Designer');
      }
    });

    // 2. Extra emails
    if (Array.isArray(extraEmails)) {
      extraEmails.forEach(em => {
        const clean = (em || '').toString().trim().toLowerCase();
        if (clean && clean.includes('@') && clean.includes('.')) {
          if (!deletedSet.has(clean) && !recipientMap.has(clean)) {
            recipientMap.set(clean, 'Designer');
          }
        }
      });
    }

    // 3. Fetch ONLY active Approved designers from Supabase
    try {
      const sbResp = await fetch(`${SUPABASE_URL}/rest/v1/designers?status=eq.Approved&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (sbResp.ok) {
        const dbDesigners = await sbResp.json();
        if (Array.isArray(dbDesigners)) {
          dbDesigners.forEach(d => {
            const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
            const ph = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
            if (em && deletedSet.has(em)) return;
            if (ph && deletedSet.has(ph)) return;
            if (em && em.includes('@') && em.includes('.')) {
              if (!recipientMap.has(em)) {
                recipientMap.set(em, d.name || 'Designer');
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('[notify-new-job] Supabase designers fetch note:', e?.message);
    }

    // 4. ADMIN EMAILS - Always send dedicated Admin Alert (Sent ONLY to designquixo@gmail.com)
    const adminEmails = ['designquixo@gmail.com'];
    const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Design Order Received: #${cleanId}</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1e293b;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0;">DESIGN QUIXO</h2>
      <span style="background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;text-transform:uppercase;">New Design Order</span>
    </div>
    <p style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">New Design Brief Submitted by Client</p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px 0;">A client has just posted a new design brief on Design Quixo:</p>
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin:16px 0;font-size:13px;line-height:1.7;">
      <p style="margin:0 0 6px 0;"><strong>Job ID:</strong> #${cleanId}</p>
      <p style="margin:0 0 6px 0;"><strong>Service:</strong> ${serviceName}</p>
      <p style="margin:0 0 6px 0;"><strong>Client Name:</strong> ${clientName}</p>
      <p style="margin:0 0 6px 0;"><strong>Client WhatsApp:</strong> +91 ${clientPhone}</p>
      <p style="margin:0 0 6px 0;"><strong>Aspect Ratio:</strong> ${ratio}</p>
      <p style="margin:0 0 6px 0;"><strong>Total Price:</strong> ₹${rawPrice} (Designer Cut: ₹${designerPayout})</p>
      <div style="margin-top:10px;padding:12px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
        <strong style="color:#334155;display:block;margin-bottom:4px;">Client Brief & Requirements:</strong>
        <span style="color:#0f172a;">${brief}</span>
      </div>
    </div>
    <p style="font-size:12px;color:#64748b;margin:16px 0 0 0;">Broadcasting to verified designers network. View and manage in Admin Dashboard.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0 12px 0;" />
    <p style="font-size:11px;color:#94a3b8;margin:0;">Design Quixo Operations Alert • ${formattedTime} IST</p>
  </div>
</body>
</html>`;

    // Dispatch Admin emails
    for (const adminEm of adminEmails) {
      await sendSingleEmail({
        to: adminEm,
        subject: `New Design Brief: #${cleanId} — ${serviceName} (Client: ${clientName})`,
        html: adminHtml,
        text: `New Design Brief #${cleanId} for ${serviceName}. Client: ${clientName} (+91 ${clientPhone}). Payout: ₹${designerPayout}. Details: ${brief}`,
        fromName: 'Design Quixo Operations'
      });
    }

    // 5. DESIGNER BROADCAST EMAILS
    const designerSubject = `New Job Brief: DQ-${cleanId} — ${serviceName} (Payout: ₹${designerPayout})`;
    const designerHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${designerSubject}</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1e293b;background:#f8fafc;">
  <div style="max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin:0 0 8px 0;">Hello Creator,</p>
    <p style="font-size:14px;color:#334155;margin:0 0 16px 0;">A new design job has been posted and is available to claim on your Creator Dashboard:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0;">
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Job ID:</strong> DQ-${cleanId}</p>
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Service:</strong> ${serviceName}</p>
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Ratio:</strong> ${ratio}</p>
      <p style="margin:0 0 8px 0;font-size:14px;color:#059669;"><strong>Designer Payout (60%):</strong> ₹${designerPayout} (Order Value: ₹${rawPrice})</p>
      <div style="margin-top:12px;padding:12px;background:#ffffff;border:1px solid #cbd5e1;border-radius:6px;">
        <strong style="font-size:12px;color:#475569;display:block;margin-bottom:4px;">Client Brief:</strong>
        <span style="font-size:13px;color:#0f172a;">${brief}</span>
      </div>
    </div>
    <p style="font-size:13px;color:#475569;margin:16px 0 0 0;">Log in to your Designer Dashboard to claim this job brief before another creator claims it!</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 14px 0;" />
    <p style="font-size:11px;color:#94a3b8;margin:0;">Design Quixo India • ${formattedTime} IST</p>
  </div>
</body>
</html>`;

    let designerSentCount = 0;
    const designerList = Array.from(recipientMap.entries()).filter(([em]) => !adminEmails.includes(em));

    for (const [dEmail, dName] of designerList) {
      const res = await sendSingleEmail({
        to: dEmail,
        subject: designerSubject,
        html: designerHtml,
        text: `New job DQ-${cleanId} (${serviceName}) available. Payout: ₹${designerPayout}. Log in to Designer Dashboard to claim.`,
        fromName: 'Design Quixo'
      });
      if (res.success) designerSentCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Alerts dispatched: Admin notified + ${designerSentCount} designer(s) broadcasted.`,
      adminNotified: true,
      designerSentCount,
      totalDesigners: designerList.length
    });
  } catch (err) {
    console.error('[notify-new-job error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Error' });
  }
}
