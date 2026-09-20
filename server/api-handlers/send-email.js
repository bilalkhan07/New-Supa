import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, message: 'Valid recipient, subject and html required' });
    }

    let emailSent = false;
    let resendErrorDetails = '';
    let smtpErrorDetails = '';
    const RESEND_KEY = (process.env.RESEND_API_KEY || '').trim() || 
      (typeof Buffer !== 'undefined' ? Buffer.from('cmVfNVFRaU1uZTdfOGsyYmNLQkhxcEtYb1hnOEJReHBmRTd4', 'base64').toString('utf-8') : '');

    // 1. Try Resend API (Primary)
    try {
      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Design Quixo <alerts@designquixo.in>",
          to: [to],
          subject: subject,
          html: html,
          text: text
        })
      });

      if (resendResp.ok) {
        emailSent = true;
        console.log('[Resend Serverless Success]: Dispatched via Resend API');
      } else {
        const errData = await resendResp.json().catch(() => ({}));
        resendErrorDetails = errData.message || JSON.stringify(errData);
        console.warn('[Resend Serverless Warn]:', errData);
      }
    } catch (resendErr) {
      resendErrorDetails = resendErr.message;
      console.warn('[Resend Serverless Catch]:', resendErr);
    }

    // 2. Try Fallback GoDaddy SMTP
    if (!emailSent) {
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
          from: '"Design Quixo" <alerts@designquixo.in>',
          to: to,
          subject: subject,
          html: html,
          text: text
        });
        emailSent = true;
        console.log('[GoDaddy SMTP Success]: Dispatched via secureserver.net');
      } catch (smtpErr) {
        smtpErrorDetails = smtpErr.message;
        console.error('[GoDaddy SMTP Fail]:', smtpErr);
      }
    }

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: 'Email dispatched successfully!'
      });
    }

    throw new Error(`All email dispatch paths failed. Resend Error: ${resendErrorDetails || 'None'}. SMTP Error: ${smtpErrorDetails || 'None'}`);

  } catch (error) {
    console.error('[Vercel send-email.js Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch email'
    });
  }
}
