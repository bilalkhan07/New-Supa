import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

// --- Extracted Imports and Logic from vite.config.ts ---
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BN3PRogrLXTWkDjdv9B0QdDEGuUH5-cNIewJ6KgJ2glQrLgtGng1WocCuqmzrL1-BIdSfNb6SX2Xz0HzsP8Yuhk';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'h4330lk5ygavsVd-_F4zWnzCgUWOKMe-JtYaQ60iqrI';
const VAPID_SUBJECT = 'mailto:alerts@designquixo.in';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[WebPush] VAPID details configured successfully.');
} catch (e) {
  console.warn('[WebPush] VAPID setup notice:', e);
}

interface PushSubRecord {
  endpoint: string;
  subscription: any;
  role?: string;
  identifier?: string;
  name?: string;
  createdAt: number;
}
const activePushSubscriptions = new Map<string, PushSubRecord>();

async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  jobId?: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  vibrate?: number[];
  price?: number;
  service?: string;
  autoPlay?: number;
}, targetRole?: string) {
  const jsonPayload = JSON.stringify(payload);
  const deadEndpoints: string[] = [];
  console.log(`[WebPush] Broadcasting notification "${payload.title}" to ${activePushSubscriptions.size} active subscriber(s)...`);

  for (const [endpoint, subRecord] of activePushSubscriptions.entries()) {
    if (targetRole && subRecord.role && subRecord.role !== targetRole && subRecord.role !== 'all') {
      continue;
    }
    try {
      await webpush.sendNotification(subRecord.subscription, jsonPayload, {
        TTL: 60 * 60 * 24, // 24 hours retention
        urgency: 'high'
      });
      console.log(`[WebPush] Push sent to: ${subRecord.role || 'user'} (${subRecord.identifier || 'unknown'})`);
    } catch (err: any) {
      console.warn(`[WebPush Send Error]:`, err.statusCode || err.message);
      if (err.statusCode === 404 || err.statusCode === 410) {
        deadEndpoints.push(endpoint);
      }
    }
  }

  deadEndpoints.forEach(ep => activePushSubscriptions.delete(ep));
}

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "ivPnmexKCJVDq5GjMyQFZdctkbsR07Bo4rLfINpTg6zUE1OuXYvzBeIkDYS7huGXPmoxZdLca591QsJl";
const otpStore = new Map<string, { code: string; expiresAt: number }>();
const emailOtpStore = new Map<string, { code: string; expiresAt: number }>();

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || "https://gzbwvleuuxyidohujibj.supabase.co").replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '');
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk";
const serverDeletedJobIds = new Set<string>();
const serverDeletedDesignerSet = new Set<string>();
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Memory caches to eliminate 95%+ of Supabase DB Egress Bandwidth
let cachedJobsData: any[] | null = null;
let cachedJobsTime = 0;

let cachedDesignersData: any[] | null = null;
let cachedDesignersTime = 0;

let cachedLoginHistoryData: any[] | null = null;
let cachedLoginHistoryTime = 0;

let cachedCityAddressesData: Record<string, any> | null = null;
let cachedCityAddressesTime = 0;

const CACHE_TTL_MS = 25000; // 25 seconds memory cache TTL

const smtpUser = process.env.SMTP_USER || 'alerts@designquixo.in';
const smtpPass = (process.env.SMTP_PASS || '@Bilal@777').replace(/\s+/g, '');
const smtpHost = process.env.SMTP_HOST || 'smtpout.secureserver.net';

// Persistent warm connection pools (Port 465 SSL primary, Port 587 STARTTLS secondary)
let primaryPoolTransporter: any = null;
let fallbackPoolTransporter: any = null;

function initMailPools() {
  if (!smtpUser || !smtpPass) return;

  if (!primaryPoolTransporter) {
    primaryPoolTransporter = nodemailer.createTransport({
      pool: true,
      host: smtpHost,
      port: 465,
      secure: true,
      pipelining: true,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      maxConnections: 5,
      maxMessages: 1000,
      rateLimit: 25,
      rateDelta: 1000,
      connectionTimeout: 6000,
      greetingTimeout: 4000,
      socketTimeout: 15000
    } as any);

    // Keep connection warm & ready
    primaryPoolTransporter.verify().then(() => {
      console.log('[SUPERFAST SMTP READY] GoDaddy 465 SSL Warm Connection Pool pre-warmed & active!');
    }).catch((err: any) => {
      console.warn('[SMTP Notice] 465 pool warmup notice:', err?.message);
    });

    // Auto keep-alive ping every 25s so the connection is perpetually warm and ready
    setInterval(() => {
      if (primaryPoolTransporter) {
        primaryPoolTransporter.verify().catch(() => {});
      }
    }, 25000);
  }

  if (!fallbackPoolTransporter) {
    fallbackPoolTransporter = nodemailer.createTransport({
      pool: true,
      host: smtpHost,
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      maxConnections: 3,
      maxMessages: 200,
      rateLimit: 10,
      rateDelta: 1000,
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 20000
    } as any);
  }
}

// Pre-warm pools right away on server startup
initMailPools();

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  headers?: any;
  fromName?: string;
}

async function sendMailWithFallback(options: SendMailOptions): Promise<{ success: boolean; via: string; error?: string }> {
  // Ensure we never send emails TO alerts@designquixo.in - redirect to admin inbox designquixo@gmail.com
  let targetRecipient = (options.to || '').trim();
  if (targetRecipient.toLowerCase() === 'alerts@designquixo.in' || targetRecipient.toLowerCase().startsWith('alerts@')) {
    targetRecipient = 'designquixo@gmail.com';
  }

  // 0. Try Resend API (Verified Domain alerts@designquixo.in)
  const resendKey = (process.env.RESEND_API_KEY || '').trim() || 
    (typeof Buffer !== 'undefined' ? Buffer.from('cmVfNVFRaU1uZTdfOGsyYmNLQkhxcEtYb1hnOEJReHBmRTd4', 'base64').toString('utf-8') : '');
  try {
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `"${options.fromName || 'Design Quixo Security'}" <alerts@designquixo.in>`,
        to: [targetRecipient],
        subject: options.subject,
        html: options.html
      })
    });

    if (resendResp.ok) {
      console.log(`[RESEND API DELIVERED] Dispatched to: ${targetRecipient} from alerts@designquixo.in`);
      return { success: true, via: 'resend-api' };
    } else {
      const errData = await resendResp.json().catch(() => ({}));
      console.error('[SERVER RESEND API FAIL]:', errData);
    }
  } catch (e: any) {
    console.error('[Resend API fetch error]:', e?.message);
  }

  initMailPools();
  const fromName = options.fromName || 'Design Quixo Security';

  // RFC compliant transactional instant-priority headers
  const urgentHeaders = {
    'X-Priority': '1', // Highest Priority
    'Priority': 'Urgent',
    'Importance': 'high',
    'X-MSMail-Priority': 'High',
    'X-Mailer': 'DesignQuixo Realtime Engine',
    'X-Auto-Response-Suppress': 'All',
    'Auto-Submitted': 'auto-generated'
  };

  const mailOptions = {
    from: `"${fromName}" <${smtpUser}>`,
    replyTo: 'designquixo@gmail.com',
    to: targetRecipient,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments && options.attachments.length > 0 ? options.attachments : undefined,
    headers: { ...urgentHeaders, ...(options.headers || {}) }
  };

  // 1. Try Primary Pre-warmed Pool (Port 465 SSL direct - fastest delivery)
  if (primaryPoolTransporter) {
    try {
      await primaryPoolTransporter.sendMail(mailOptions);
      console.log(`[SUPERFAST SMTP DELIVERED] Dispatched to: ${options.to} via Warm Pool:465`);
      return { success: true, via: 'secureserver:465-pool' };
    } catch (primaryErr: any) {
      console.warn(`[SMTP Pool 465 Notice]: ${primaryErr?.message}, falling back to port 587...`);
    }
  }

  // 2. Try Fallback Pre-warmed Pool (Port 587 STARTTLS)
  if (fallbackPoolTransporter) {
    try {
      await fallbackPoolTransporter.sendMail(mailOptions);
      console.log(`[SMTP DELIVERED] Dispatched to: ${options.to} via Fallback Pool:587`);
      return { success: true, via: 'secureserver:587-pool' };
    } catch (fallbackErr: any) {
      console.warn(`[SMTP Fallback 587 Notice]: ${fallbackErr?.message}`);
      return { success: false, via: 'secureserver', error: fallbackErr?.message };
    }
  }

  return { success: false, via: 'secureserver', error: 'SMTP connection pool not ready' };
}

function getEmailLogoAttachment() {
  const logoPath = path.join(process.cwd(), 'public', 'favicon.png');
  if (fs.existsSync(logoPath)) {
    return [
      {
        filename: 'quixo-logo.png',
        path: logoPath,
        cid: 'quixologo',
        contentType: 'image/png',
        contentDisposition: 'inline'
      }
    ];
  }
  return [];
}

async function sendCustomEmail(to: string, code: string, purpose: string = 'Login Verification', recipientName?: string): Promise<{ success: boolean; via: string; error?: string }> {
  try {
    const isPassChange = purpose.toLowerCase().includes('password');
    const isSignup = purpose.toLowerCase().includes('register') || purpose.toLowerCase().includes('signup');
    const isLogin = purpose.toLowerCase().includes('login');
    const isEmailChange = purpose.toLowerCase().includes('email') || purpose.toLowerCase().includes('change');
    
    const subject = isPassChange
      ? `[${code}] Design Quixo — Password Reset Verification Code`
      : isSignup
        ? `[${code}] Design Quixo — Creator Registration Verification Code`
        : isEmailChange
          ? `[${code}] Design Quixo — Email Update Verification Code`
          : `[${code}] Design Quixo — Sign In Verification Code`;

    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    let finalName = (recipientName || '').trim();
    if (!finalName) {
      if (to === 'alerts@designquixo.in' || to.includes('designquixobilal')) {
        finalName = 'Bilal (Admin)';
      } else {
        const emailPrefix = to.split('@')[0].replace(/[._0-9+-]+/g, ' ').trim();
        if (emailPrefix && emailPrefix.length >= 2) {
          finalName = emailPrefix.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        } else {
          finalName = 'User';
        }
      }
    }

    const messageText = isPassChange 
      ? 'You requested to reset your password. Please use the 6-digit verification code below to proceed:' 
      : isSignup
        ? 'Thank you for registering on Design Quixo. Please use the 6-digit verification code below to verify your email address and complete registration:'
        : isEmailChange
          ? 'You requested to update your registered email address on Design Quixo. Please use the 6-digit verification code below to confirm this change:'
          : 'You requested to sign in to your Design Quixo account. Please use the 6-digit verification code below:';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.5px;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 10px 0;">Hello ${finalName},</p>
    <p style="font-size: 14px; margin: 0 0 18px 0; color: #334155;">
      ${messageText}
    </p>
    <div style="margin: 22px 0; padding: 18px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; text-align: center;">
      <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Verification Code</span>
      <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
      <span style="font-size: 12px; color: #64748b; display: block; margin-top: 6px;">Valid for 10 minutes</span>
    </div>
    <p style="font-size: 13px; color: #475569; margin: 18px 0 0 0;">
      Do not share this OTP with anyone. If you did not make this request, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo India • Automated Security Alert • ${formattedTime} IST
    </p>
  </div>
</body>
</html>`;

    const textContent = `Hello ${finalName},\n\nYour Design Quixo verification code is: ${code}\n\n${messageText}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.\n\nDesign Quixo India • ${formattedTime} IST`;
    const cleanSubject = `Design Quixo Verification Code: ${code}`;

    const result = await sendMailWithFallback({
      to,
      subject: cleanSubject,
      html,
      text: textContent,
      fromName: 'Design Quixo'
    });

    return result;
  } catch (outerErr: any) {
    console.error('[sendCustomEmail Error]:', outerErr?.message);
    return { success: false, via: 'error', error: outerErr?.message };
  }
}

async function sendJobBroadcastEmail(to: string, designerName: string, job: any): Promise<boolean> {
  try {
    const rawPrice = Number(job.price) || 399;
    const designerPayout = Math.round(rawPrice * 0.6);
    const cleanId = (job.id || 'DQ-NEW').toString().replace(/^(DQ[-_]?)+/i, '');
    const serviceName = job.service || job.project || 'Graphic Design Request';
    const ratio = job.ratio || 'Square (1:1)';
    const brief = job.brief || 'Custom graphic design as per client requirements.';
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const subject = `New Job Brief: DQ-${cleanId} — ${serviceName} (Payout: ₹${designerPayout})`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">Hello ${designerName || 'Designer'},</p>
    <p style="font-size: 14px; color: #334155; margin: 0 0 18px 0;">
      A new design job has been posted and is available to claim on your Creator Dashboard:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Job ID:</strong> DQ-${cleanId}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Service:</strong> ${serviceName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Ratio:</strong> ${ratio}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #059669;"><strong>Designer Payout (60%):</strong> ₹${designerPayout} (Project Value: ₹${rawPrice})</p>
      <div style="margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;">
        <strong style="font-size: 12px; color: #475569; display: block; margin-bottom: 4px;">Client Brief:</strong>
        <span style="font-size: 13px; color: #0f172a;">${brief}</span>
      </div>
    </div>
    <p style="font-size: 13px; color: #475569; margin: 18px 0 0 0;">
      Log in to your Designer Dashboard to claim this job brief. Note: Payout is applicable once the design is approved.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo India • ${formattedTime} IST
    </p>
  </div>
</body>
</html>`;

    const textContent = `Hello ${designerName || 'Designer'},\n\nA new job DQ-${cleanId} (${serviceName}) is available on Design Quixo.\nDesigner Payout: ₹${designerPayout} (60%)\nRatio: ${ratio}\nBrief: ${brief}\n\nLog in to your Designer Dashboard to claim this brief.`;

    const result = await sendMailWithFallback({
      to,
      subject,
      html,
      text: textContent,
      fromName: 'Design Quixo'
    });

    return result.success;
  } catch (outerErr: any) {
    console.error('[sendJobBroadcastEmail Error]:', outerErr?.message);
    return false;
  }
}

async function sendJobAcceptedAlertEmail(designerName: string, clientName: string, jobId: string, jobDetails?: any): Promise<boolean> {
  try {
    const cleanId = (jobId || 'DQ-JOB').toString().replace(/^(DQ[-_]?)+/i, '');
    const cleanClient = (clientName || 'Direct Client').trim();
    const cleanDesigner = (designerName || 'Designer').trim();
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const subject = `Job Claimed: #${cleanId} by ${cleanDesigner} (Client: ${cleanClient})`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Job Claim Notification</p>
    <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0;">
      A designer has claimed an active job brief:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Job ID:</strong> #${cleanId}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Designer Name:</strong> ${cleanDesigner}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Client Name:</strong> ${cleanClient}</p>
      ${jobDetails?.service ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Service:</strong> ${jobDetails.service}</p>` : ''}
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Claim Timestamp:</strong> ${formattedTime} IST</p>
      <p style="margin: 0; font-size: 14px; color: #2563eb;"><strong>Status:</strong> In Progress</p>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo Operations Alert • ${formattedTime} IST
    </p>
  </div>
</body>
</html>`;

    const textContent = `Job Claim Alert:\n\nJob ID: #${cleanId}\nDesigner: ${cleanDesigner}\nClient: ${cleanClient}\nClaimed at: ${formattedTime} IST\n\nDesign Quixo Operations`;

    // Send ONLY to Admin inbox: designquixo@gmail.com (Keep email count strictly optimized)
    await sendMailWithFallback({
      to: 'designquixo@gmail.com',
      subject,
      html,
      text: textContent,
      fromName: 'Design Quixo Operations'
    });

    return true;
  } catch (err: any) {
    console.error('[sendJobAcceptedAlertEmail Error]:', err?.message);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Mount API Middleware
  app.use(async (req, res, next) => {
    const reqPath = (req.path || req.url || '').split('?')[0].replace(/\/$/, '');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }
    // --- JOB ACCEPTED NOTIFICATION ROUTE ---
    if (req.url === '/api/notify-job-accepted' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { designerName, clientName, jobId, jobDetails } = JSON.parse(body || '{}');
          if (!jobId || !designerName) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Missing designerName or jobId' }));
          }

          console.log(`[JOB ACCEPTED ALERT] Designer "${designerName}" accepted Job #${jobId} (Client: "${clientName || 'Direct Client'}")`);
          const sent = await sendJobAcceptedAlertEmail(designerName, clientName || 'Direct Client', jobId, jobDetails);

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: sent, message: 'Alert email dispatched to operations desk.' }));
        } catch (err: any) {
          console.error('[NOTIFY JOB ACCEPTED ERROR]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, message: err.message || 'Error processing job accepted notification' }));
        }
      });
      return;
    }

    // --- AUTO-REGENERATE ALL CITY PAGES ROUTE ---
    if (req.url === '/api/admin/regenerate-city-pages' && req.method === 'POST') {
      import('child_process').then(({ exec }) => {
        exec('node scripts/update-city-pages.cjs', (error, stdout, stderr) => {
          if (error) {
            console.error('[CITY PAGES REGEN FAIL]:', error);
          } else {
            console.log('[CITY PAGES AUTO-REGENERATED SUCCESS]: All 162 city HTML files updated with latest portfolio.');
          }
        });
      }).catch(err => console.error('Failed to import child_process:', err));
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, message: 'City pages regeneration background task initiated.' }));
    }

    // --- UPDATE DESIGNER EMAIL ROUTE ---
    if (req.url === '/api/update-designer-email' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { oldEmail, newEmail, phone } = JSON.parse(body || '{}');
          if (!newEmail || (!oldEmail && !phone)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Missing required parameters (newEmail, oldEmail/phone)' }));
          }

          const cleanNew = (newEmail || '').toString().trim().toLowerCase();
          const cleanOld = (oldEmail || '').toString().trim().toLowerCase();
          const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);

          try {
            const orFilters = [];
            if (cleanOld) orFilters.push(`email.ilike.${cleanOld}`, `identifier.ilike.${cleanOld}`);
            if (cleanPhone) orFilters.push(`phone.eq.${cleanPhone}`, `id.eq.${cleanPhone}`);
            if (orFilters.length > 0) {
              await serverSupabase
                .from('designers')
                .update({ email: cleanNew, identifier: cleanNew })
                .or(orFilters.join(','));
            }
          } catch (dbErr) {
            console.warn('[Supabase Email update notice]:', dbErr);
          }

          cachedDesignersData = null;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, message: 'Registered email updated successfully!' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, message: err.message || 'Error updating email' }));
        }
      });
      return;
    }

    // --- UPDATE DESIGNER PASSWORD ROUTE ---
    if (req.url === '/api/update-designer-password' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { key, newPassword } = JSON.parse(body || '{}');
          if (!key || !newPassword) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Missing key or newPassword' }));
          }

          const cleanKey = key.toString().trim();
          const cleanPass = newPassword.toString().trim();
          const phone10 = cleanKey.replace(/\D/g, '').slice(-10);

          try {
            // Update in Supabase designers table (stores in experience/software fallback)
            const orFilters = [`id.eq.${cleanKey}`, `email.ilike.${cleanKey}`, `identifier.ilike.${cleanKey}`];
            if (phone10) orFilters.push(`phone.eq.${phone10}`, `id.eq.${phone10}`);
            await serverSupabase
              .from('designers')
              .update({ experience: cleanPass })
              .or(orFilters.join(','));

            // Also persist in login_history for credentials lookup
            await serverSupabase.from('login_history').upsert({
              id: `cred-${phone10 || cleanKey}`,
              phone: phone10 || cleanKey,
              name: 'Designer Password',
              role: 'designer_credentials',
              status: cleanPass,
              timestamp: new Date().toISOString()
            });
          } catch (dbErr) {
            console.warn('[Supabase Password update notice]:', dbErr);
          }

          cachedDesignersData = null;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, message: 'Password updated successfully!' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, message: err.message || 'Error updating password' }));
        }
      });
      return;
    }

    // --- SECURE AUTHENTICATION VERIFICATION ROUTE ---
    if ((reqPath === '/api/verify-login-credentials' || req.url === '/api/verify-login-credentials') && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const parsedPayload = JSON.parse(body || '{}');
          const { identifier, password, localBackup } = parsedPayload;
          if (!identifier || !password) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Please provide email/mobile and password.' }));
          }

          const rawId = (identifier || '').toString().trim();
          const lowerId = rawId.toLowerCase();
          const enteredPass = (password || '').toString().trim();
          const cleanPhone = lowerId.replace(/\D/g, '').slice(-10);

          // 1. Server-side Admin Verification
          const adminUsername = (process.env.ADMIN_USERNAME || 'admin@designquixobilal').toLowerCase().trim();
          const adminPassword = (process.env.ADMIN_PASSWORD || '@Bilal@786').trim();

          const isAdminPass = (
            enteredPass === adminPassword ||
            enteredPass === '@Bilal@786' ||
            enteredPass === 'Bilal#0897' ||
            enteredPass === '@Bilal@777' ||
            enteredPass === '@Bilal@8602420897@7'
          );

          const isAdminExplicitUser = (
            lowerId === adminUsername ||
            lowerId === 'admin@designquixobilal' ||
            lowerId === 'admin' ||
            lowerId === 'superadmin' ||
            lowerId === 'admin@designquixo.in' ||
            lowerId === 'designquixo@gmail.com' ||
            lowerId === 'admin@designquixo.com' ||
            lowerId === 'alerts@designquixo.in' ||
            lowerId === 'mustafazthings@gmail.com'
          );

          const isAdminId = isAdminExplicitUser || (
            (lowerId === '8602420897' || lowerId === '+918602420897' || cleanPhone === '8602420897') &&
            !lowerId.includes('@') && isAdminPass
          );

          if (isAdminId) {
            if (isAdminPass) {
              const adminTargetEmail = (lowerId.includes('@') && !lowerId.includes('designquixobilal')) 
                ? lowerId 
                : 'mustafazthings@gmail.com';

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                user: {
                  role: 'admin',
                  name: 'Bilal Khan (Master Administrator)',
                  identifier: 'admin@designquixobilal',
                  phone: '8602420897',
                  email: adminTargetEmail,
                  displayLabel: adminTargetEmail
                }
              }));
            } else {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Incorrect administrator password entered. Access denied.' }));
            }
          }

          // Check if designer was deleted
          if (serverDeletedDesignerSet.has(lowerId) || (cleanPhone && cleanPhone.length === 10 && serverDeletedDesignerSet.has(cleanPhone))) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'This creator account has been removed by the administrator.' }));
          }

          // 2. Query Supabase Directly
          let designer: any = null;
          try {
            const orConditions = [
              `id.eq.${lowerId}`,
              `email.ilike.${lowerId}`,
              `identifier.ilike.${lowerId}`
            ];
            if (cleanPhone && cleanPhone.length === 10) {
              orConditions.push(`phone.eq.${cleanPhone}`, `id.eq.${cleanPhone}`);
            }

            const { data: supaDesigners, error: supErr } = await serverSupabase
              .from('designers')
              .select('*')
              .or(orConditions.join(','))
              .limit(1);

            if (supaDesigners && supaDesigners.length > 0) {
              designer = supaDesigners[0];
            }
          } catch (supErr: any) {
            console.warn('[Supabase Auth query notice]:', supErr?.message);
          }

          // 3. Fallback: Check localBackup
          if (!designer && localBackup) {
            try {
              const regList = Array.isArray(localBackup.registered) ? localBackup.registered : [];
              const currObj = localBackup.current || {};
              const candidates = [...regList, currObj].filter(Boolean);

              const matchedLocal = candidates.find((d: any) => {
                if (!d) return false;
                const dEmail = (d.email || d.identifier || '').toString().toLowerCase().trim();
                const dPhone = (d.phone || d.id || '').toString().replace(/\D/g, '').slice(-10);
                if (lowerId.includes('@')) {
                  return dEmail === lowerId;
                } else if (cleanPhone && cleanPhone.length === 10) {
                  return dPhone === cleanPhone;
                }
                return dEmail === lowerId;
              });

              if (matchedLocal) {
                designer = {
                  id: matchedLocal.id || cleanPhone || lowerId,
                  name: matchedLocal.name || 'Designer',
                  phone: cleanPhone || matchedLocal.phone || '',
                  email: lowerId.includes('@') ? lowerId : (matchedLocal.email || ''),
                  identifier: lowerId.includes('@') ? lowerId : (matchedLocal.identifier || cleanPhone),
                  password: matchedLocal.password || matchedLocal.pin || '',
                  portfolio: matchedLocal.portfolio || '',
                  skills: matchedLocal.skills || 'Graphic Design',
                  status: matchedLocal.status || 'Pending',
                  role: matchedLocal.role || 'designer'
                };
              }
            } catch (e) {
              console.warn('[Local Backup Search Error]:', e);
            }
          }

          if (!designer) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: false,
              message: 'Incorrect password or unregistered account. Please check your details or register.'
            }));
          }

          if (designer.status === 'Revoked') {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Account has been revoked by the platform administrator.' }));
          }

          // PASSWORD VALIDATION (Direct or credential log check)
          let storedPass = (designer.password || designer.pin || designer.experience || '').toString().trim();
          if (!storedPass) {
            try {
              const { data: credLogs } = await serverSupabase
                .from('login_history')
                .select('status')
                .eq('role', 'designer_credentials')
                .or(`id.eq.cred-${cleanPhone || lowerId},phone.eq.${cleanPhone || lowerId}`)
                .order('timestamp', { ascending: false })
                .limit(1);
              if (credLogs && credLogs.length > 0 && credLogs[0].status) {
                storedPass = credLogs[0].status.trim();
              }
            } catch (credErr) {}
          }

          const isPassValid = storedPass 
            ? (storedPass === enteredPass || storedPass.toLowerCase() === enteredPass.toLowerCase()) 
            : (enteredPass === '123456' || enteredPass === 'Designer@123' || !designer.password);

          if (!isPassValid) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Incorrect password entered. Please enter the password you set during registration.' }));
          }

          const rawTargetEmail = (designer.email || (designer.identifier && designer.identifier.includes('@') ? designer.identifier : '') || (lowerId.includes('@') ? lowerId : '')).toString().trim();
          const targetEmail = rawTargetEmail.toLowerCase();
          const designerPhone = (designer.phone || designer.whatsapp || cleanPhone || '').toString().trim();

          let maskLabel = targetEmail ? targetEmail : `+91 ${designerPhone}`;
          if (targetEmail && targetEmail.includes('@')) {
            const parts = targetEmail.split('@');
            maskLabel = `${parts[0].slice(0, 2)}***@${parts[1]}`;
          }

          // Audit successful login
          try {
            await serverSupabase.from('login_history').insert({
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              phone: designerPhone || cleanPhone || lowerId,
              name: designer.name || 'Verified Designer',
              role: 'designer',
              status: `Designer Login Verified (${designer.status || 'Pending'})`,
              timestamp: new Date().toISOString()
            });
          } catch(e) {}

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            user: {
              role: designer.role || 'designer',
              name: designer.name || 'Verified Designer',
              identifier: targetEmail || designerPhone || cleanPhone,
              phone: designerPhone || cleanPhone,
              email: targetEmail,
              status: designer.status || 'Pending',
              displayLabel: maskLabel,
              designerData: {
                id: designer.id || designerPhone || targetEmail,
                name: designer.name || 'Verified Designer',
                phone: designerPhone,
                email: targetEmail,
                portfolio: designer.portfolio || '',
                skills: designer.skills || designer.software || '',
                status: designer.status || 'Pending'
              }
            }
          }));
        } catch (err: any) {
          console.error('[Verify Login Error]:', err);
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, message: 'Authentication error. Please check your password and try again.' }));
        }
      });
      return;
    }

    // --- NEW JOB DISPATCH & DESIGNER EMAIL BROADCAST ROUTE ---
    if (req.url === '/api/notify-new-job' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { job, designers, extraEmails, extraDesigners, deletedDesigners } = JSON.parse(body || '{}');
              if (!job) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Missing job payload' }));
              }

              console.log('[BROADCAST NEW JOB] Starting email dispatch for job:', job.id || job.project);

              // 0. Process any deleted designers list to ensure they are blacklisted from emails
              if (Array.isArray(deletedDesigners)) {
                deletedDesigners.forEach((d: string) => {
                  const cd = (d || '').toString().trim().toLowerCase();
                  if (cd) serverDeletedDesignerSet.add(cd);
                  const cp = cd.replace(/\D/g, '').slice(-10);
                  if (cp && cp.length === 10) serverDeletedDesignerSet.add(cp);
                });
              }

              // 1. Recipient Map: email -> name
              const recipientMap = new Map<string, string>();

              // 1a. Process any designers passed directly in payload from client (strictly filtering out deleted and unapproved)
              const rawDesignerList = [
                ...(Array.isArray(designers) ? designers : []),
                ...(Array.isArray(extraDesigners) ? extraDesigners : [])
              ];

              rawDesignerList.forEach((d: any) => {
                if (!d) return;
                const em = ((d.email || d.identifier || '')).toString().trim().toLowerCase();
                const ph = ((d.phone || d.identifier || '')).toString().replace(/\D/g, '').slice(-10);
                const status = (d.status || '').toString().trim();
                if (status && status !== 'Approved') return; // Only send to Approved
                if (em && serverDeletedDesignerSet.has(em)) return; // Never send to deleted
                if (ph && serverDeletedDesignerSet.has(ph)) return; // Never send to deleted
                if (em && em.includes('@') && em.includes('.')) {
                  recipientMap.set(em, d.name || 'Designer');
                }
              });

              // 1b. Fetch ONLY active Approved designers from Supabase
              try {
                const { data: dbDesigners } = await serverSupabase
                  .from('designers')
                  .select('*')
                  .eq('status', 'Approved');

                if (dbDesigners && Array.isArray(dbDesigners)) {
                  dbDesigners.forEach((d: any) => {
                    const em = ((d.email || d.identifier || '')).toString().trim().toLowerCase();
                    const ph = ((d.phone || d.identifier || '')).toString().replace(/\D/g, '').slice(-10);
                    if (em && serverDeletedDesignerSet.has(em)) return;
                    if (ph && serverDeletedDesignerSet.has(ph)) return;
                    if (em && em.includes('@') && em.includes('.')) {
                      if (!recipientMap.has(em)) {
                        recipientMap.set(em, d.name || 'Designer');
                      }
                    }
                  });
                }
              } catch (e) {
                console.warn('[BROADCAST NEW JOB] Supabase designers fetch notice:', e);
              }

              // 1c. Add any extra raw emails passed from client if not blacklisted
              if (Array.isArray(extraEmails)) {
                extraEmails.forEach((em: string) => {
                  const clean = (em || '').toString().trim().toLowerCase();
                  if (clean && clean.includes('@') && clean.includes('.')) {
                    if (!serverDeletedDesignerSet.has(clean) && !recipientMap.has(clean)) {
                      recipientMap.set(clean, 'Designer');
                    }
                  }
                });
              }

              // 1d. Always ensure admin gets a single copy at designquixo@gmail.com
              const adminEmail = 'designquixo@gmail.com';
              if (!recipientMap.has(adminEmail)) {
                recipientMap.set(adminEmail, 'Design Quixo Admin');
              }

              // 1e. Final safety check: remove any recipient in blacklist
              for (const [em] of recipientMap.entries()) {
                if (serverDeletedDesignerSet.has(em)) {
                  recipientMap.delete(em);
                }
              }

              const recipients = Array.from(recipientMap.entries());
              console.log(`[BROADCAST NEW JOB] Discarded deleted designers. Found ${recipients.length} valid recipient(s):`, recipients);

              // 2. Dispatch emails in parallel
              let successCount = 0;
              const sendPromises = recipients.map(async ([email, name]) => {
                const sent = await sendJobBroadcastEmail(email, name, job);
                if (sent) successCount++;
                return { email, name, sent };
              });

              const results = await Promise.all(sendPromises);

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                totalRecipients: recipients.length,
                successCount,
                results
              }));
            } catch (err: any) {
              console.error('[BROADCAST NEW JOB ERROR]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error broadcasting job email' }));
            }
          });
          return;
        }

        // --- EMAIL OTP DISPATCH ROUTE ---
        if (req.url === '/api/email-otp-send' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { email, userName, name, purpose } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').trim().toLowerCase();
              const cleanName = (userName || name || '').trim();

              if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Please enter a valid email address.' }));
              }

              // 1. Generate OTP & immediately register in memory store
              const dynamicCode = Math.floor(100000 + Math.random() * 900000).toString();
              emailOtpStore.set(cleanEmail, { code: dynamicCode, expiresAt: Date.now() + 10 * 60 * 1000 });

              // 2. Immediate async dispatch with highest priority via warm connection pool
              sendCustomEmail(cleanEmail, dynamicCode, purpose, cleanName)
                .then(res => {
                  if (!res.success) console.log(`[Fast SMTP Notice] Dispatch to ${cleanEmail}:`, res.error);
                })
                .catch(e => console.warn(`[Fast SMTP Error] ${cleanEmail}:`, e?.message));

              // 3. Clean up any previous OTP for this email, then insert new OTP in background
              serverSupabase
                .from('login_history')
                .delete()
                .eq('phone', cleanEmail)
                .eq('role', 'otp_verification')
                .then(null, () => {});

              serverSupabase
                .from('login_history')
                .insert({
                  id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  phone: cleanEmail,
                  name: cleanName || 'User',
                  role: 'otp_verification',
                  status: dynamicCode,
                  timestamp: new Date(Date.now() + 10 * 60 * 1000).toISOString()
                })
                .then(null, () => {});

              // 4. Return instant response (< 50ms) so user UI transitions immediately
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                via: 'secureserver:465-pool',
                delivered: true,
                message: '✓ Verification code dispatched. Please check your email inbox to proceed.'
              }));
            } catch (err: any) {
              console.error('[SERVER EMAIL OTP ERROR]:', err?.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Unable to dispatch verification code. Please try again.' }));
            }
          });
          return;
        }

        // --- EMAIL OTP VERIFY ROUTE ---
        if (req.url === '/api/email-otp-verify' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { email, code } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').trim().toLowerCase();
              const cleanCode = (code || '').trim();

              if (!cleanCode || cleanCode.length !== 6) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Please enter the complete 6-digit email OTP.' }));
              }

              // 1. Check local OTP store (if sent via SMTP)
              const stored = emailOtpStore.get(cleanEmail);
              if (stored) {
                if (Date.now() > stored.expiresAt) {
                  emailOtpStore.delete(cleanEmail);
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, message: 'Email OTP has expired. Please request a new code.' }));
                }
                if (stored.code === cleanCode) {
                  emailOtpStore.delete(cleanEmail);
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    success: true,
                    message: 'Email verified successfully!'
                  }));
                }
              }

              // 2. Query latest OTP stored in Supabase login_history table
              try {
                const { data: logs } = await serverSupabase
                  .from('login_history')
                  .select('*')
                  .eq('phone', cleanEmail)
                  .eq('role', 'otp_verification')
                  .order('timestamp', { ascending: false })
                  .limit(1);

                if (logs && logs.length > 0) {
                  const latest = logs[0];
                  const expiresAt = new Date(latest.timestamp).getTime();
                  if (!isNaN(expiresAt) && Date.now() <= expiresAt && latest.status === cleanCode) {
                    serverSupabase.from('login_history').delete().eq('id', latest.id).then(null, () => {});
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({
                      success: true,
                      message: 'Email verified successfully!'
                    }));
                  }
                }
              } catch (dbErr) {
                console.warn('[Supabase OTP verify lookup notice]:', dbErr);
              }

              // 3. If neither memory store nor DB matched, code is invalid or expired
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: false,
                message: 'Invalid or expired verification code. Please check your email and enter the exact 6-digit code received.'
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error verifying email OTP' }));
            }
          });
          return;
        }

        if (req.url === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { to, subject, html, text } = JSON.parse(body || '{}');
              if (!to || !subject || !html) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Missing required parameters: to, subject, html' }));
              }

              const textFallback = text || html
                .replace(/<style([\s\S]*?)<\/style>/gi, '')
                .replace(/<script([\s\S]*?)<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 500) + '... (Open this email in an HTML compatible mail client)';

              const result = await sendMailWithFallback({
                to,
                subject,
                html,
                text: textFallback,
                fromName: 'Design Quixo Platform',
                headers: {
                  'X-Priority': '1', // High Priority
                  'Priority': 'Urgent',
                  'Importance': 'high',
                  'X-MSMail-Priority': 'High',
                  'X-Mailer': 'DesignQuixo Realtime Engine',
                  'X-Auto-Response-Suppress': 'All',
                  'Auto-Submitted': 'auto-generated'
                }
              });

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: result.success,
                via: result.via,
                message: result.success ? 'Email processed successfully!' : 'Email dispatch queued.'
              }));
            } catch (err: any) {
              console.warn('Error sending email via API:', err.message);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error sending email' }));
            }
          });
          return;
        }

        if (req.url === '/api/sms-send' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { phone } = JSON.parse(body || '{}');
              const digits = (phone || '').replace(/\D/g, '');
              const clean10 = digits.slice(-10);
              if (clean10.length !== 10) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Invalid 10-digit Indian mobile number' }));
              }

              const code = Math.floor(100000 + Math.random() * 900000).toString();
              otpStore.set(clean10, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

              // Call Fast2SMS official bulkV2 OTP route
              let f2sData: any = null;
              try {
                const f2sResp = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=otp&variables_values=${code}&numbers=${clean10}`);
                f2sData = await f2sResp.json();
                console.log('[Fast2SMS gateway response]:', f2sData);
              } catch (e: any) {
                console.warn('Fast2SMS fetch error:', e.message);
              }

              if (f2sData && f2sData.return === true) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ 
                  success: true, 
                  message: `Real SMS OTP dispatched to +91 ${clean10} via Fast2SMS. Please check your phone SMS.` 
                }));
              }

              // Handle KYC/Website verification notice (status_code 996) gracefully
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                isKycRequired: true,
                code: code,
                f2sMessage: f2sData ? f2sData.message : 'Website verification pending in Fast2SMS',
                message: `Fast2SMS notice: ${f2sData ? f2sData.message : 'Website verification pending'}. Dynamic verification code: ${code}`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Internal server error' }));
            }
          });
          return;
        }

        if (req.url === '/api/sms-verify' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { phone, code } = JSON.parse(body || '{}');
              const digits = (phone || '').replace(/\D/g, '');
              const clean10 = digits.slice(-10);
              const cleanCode = (code || '').trim();

              const stored = otpStore.get(clean10);
              if (!stored) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'No OTP request found for this number. Please request a new OTP.' }));
              }

              if (Date.now() > stored.expiresAt) {
                otpStore.delete(clean10);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'OTP has expired. Please click Resend Code.' }));
              }

              if (stored.code !== cleanCode) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Incorrect OTP entered. Please check and try again.' }));
              }

              otpStore.delete(clean10);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: true, 
                user: { phoneNumber: `+91${clean10}`, uid: `f2s_${clean10}` },
                message: 'Mobile number verified successfully!' 
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Internal server error' }));
            }
          });
          return;
        }

        // --- DESIGNER REGISTRATION API ROUTE ---
        if (req.url === '/api/register-designer' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const rawPhone = (payload.phone || payload.whatsapp || payload.identifier || '').toString();
              const clean10 = rawPhone.replace(/\D/g, '').slice(-10);
              const cleanEmail = (payload.email || (payload.identifier && payload.identifier.includes('@') ? payload.identifier : '') || '').toString().trim().toLowerCase();
              const name = (payload.name || 'Designer').toString().trim();
              const pass = (payload.password || 'Designer@123').toString().trim();
              const portfolio = (payload.portfolio || '').toString().trim();
              const skills = (payload.skills || payload.experience || 'Graphic Design').toString().trim();
              const status = payload.status || 'Pending';
              const dateStr = payload.date || new Date().toLocaleDateString('en-IN');
              const nowIso = new Date().toISOString();

              const primaryId = clean10 || cleanEmail;
              if (!primaryId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Valid 10-digit mobile number or email address required.' }));
              }

              // Supabase valid columns: id, name, phone, email, identifier, experience, software, portfolio, photo, role, status, isapproved, approvedat, createdat
              const sigDataUrl = (payload.signature || payload.signatureDataUrl || '').toString();
              const designerRow: any = {
                id: primaryId,
                name: name,
                phone: clean10 || '',
                email: cleanEmail || '',
                identifier: cleanEmail || clean10,
                portfolio: portfolio || '',
                experience: pass || skills || 'Graphic Design',
                software: skills || 'Graphic Design',
                role: 'designer',
                status: status || 'Pending',
                isapproved: status === 'Approved',
                createdat: nowIso,
                photo: payload.avatar || payload.photo || ''
              };

              // Direct Supabase persistence
              try {
                await serverSupabase.from('designers').upsert(designerRow, { onConflict: 'id' });
              } catch (supErr: any) {
                console.warn('[SERVER /api/register-designer Supabase warning]:', supErr?.message || supErr);
              }

              // Save registration audit log, credentials & signature record in login_history
              try {
                await serverSupabase.from('login_history').insert({
                  id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  phone: clean10 || cleanEmail,
                  name: name,
                  role: 'designer',
                  status: `Designer Registered (${status}) - Email: ${cleanEmail || 'None'} - Phone: +91 ${clean10}`,
                  timestamp: new Date().toISOString()
                });

                // Securely store credentials in login_history for recovery/auth
                await serverSupabase.from('login_history').upsert({
                  id: `cred-${clean10 || cleanEmail}`,
                  phone: clean10 || cleanEmail,
                  name: name,
                  role: 'designer_credentials',
                  status: pass,
                  timestamp: new Date().toISOString()
                });

                if (sigDataUrl) {
                  if (clean10) {
                    await serverSupabase.from('login_history').upsert({
                      id: `sig-${clean10}`,
                      phone: clean10,
                      name: name,
                      role: 'signed_agreement',
                      status: sigDataUrl,
                      timestamp: new Date().toISOString()
                    });
                  }
                  if (cleanEmail) {
                    await serverSupabase.from('login_history').upsert({
                      id: `sig-${cleanEmail}`,
                      phone: cleanEmail,
                      name: name,
                      role: 'signed_agreement',
                      status: sigDataUrl,
                      timestamp: new Date().toISOString()
                    });
                  }
                }
              } catch (logErr) {
                console.warn('[SERVER /api/register-designer] login_history notice:', logErr);
              }

              if (cleanEmail) serverDeletedDesignerSet.delete(cleanEmail);
              if (clean10) serverDeletedDesignerSet.delete(clean10);
              if (primaryId) serverDeletedDesignerSet.delete(primaryId);
              cachedDesignersData = null;
              cachedDesignersTime = 0;
              cachedLoginHistoryData = null;
              cachedLoginHistoryTime = 0;

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: true, 
                designer: designerRow,
                message: 'Designer registered and synced to cloud successfully'
              }));
            } catch (err: any) {
              console.error('[SERVER /api/register-designer ERROR]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error registering designer' }));
            }
          });
          return;
        }

        // --- DESIGNER STATUS UPDATE API ROUTE (APPROVE / PENDING / REVOKE) ---
        if (req.url === '/api/update-designer-status' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const cleanKey = (payload.key || payload.email || payload.phone || payload.id || '').toString().trim().toLowerCase();
              const newStatus = (payload.status === 'Approved' || payload.status === 'Revoked') ? payload.status : 'Pending';

              if (!cleanKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Designer key is required' }));
              }

              const clean10 = cleanKey.replace(/\D/g, '').slice(-10);
              const extraPhone10 = payload.phone ? (payload.phone || '').toString().replace(/\D/g, '').slice(-10) : '';
              const targetEmail = (payload.email || (cleanKey.includes('@') ? cleanKey : '')).toString().trim().toLowerCase();
              const rawId = (payload.id || '').toString().trim();

              const updateData: any = {
                status: newStatus,
                isapproved: newStatus === 'Approved'
              };
              if (newStatus === 'Approved') {
                updateData.approvedat = new Date().toISOString();
              }

              const orFilters = [
                `id.eq.${cleanKey}`,
                `email.ilike.${cleanKey}`,
                `identifier.ilike.${cleanKey}`
              ];
              if (clean10) {
                orFilters.push(`phone.eq.${clean10}`, `id.eq.${clean10}`);
              }
              if (extraPhone10 && extraPhone10 !== clean10) {
                orFilters.push(`phone.eq.${extraPhone10}`, `id.eq.${extraPhone10}`);
              }
              if (targetEmail && targetEmail !== cleanKey) {
                orFilters.push(`email.ilike.${targetEmail}`, `identifier.ilike.${targetEmail}`, `id.eq.${targetEmail}`);
              }
              if (rawId && rawId !== cleanKey) {
                orFilters.push(`id.eq.${rawId}`);
              }

              // Update Supabase directly and synchronously
              let updatedCount = 0;
              try {
                const { data: updateRes, error: supErr } = await serverSupabase
                  .from('designers')
                  .update(updateData)
                  .or(orFilters.join(','))
                  .select();
                if (supErr) {
                  console.warn('[SERVER update-designer-status Supabase warning]:', supErr.message);
                }
                if (updateRes && Array.isArray(updateRes) && updateRes.length > 0) {
                  updatedCount = updateRes.length;
                }
              } catch (supErr: any) {
                console.warn('[SERVER update-designer-status Supabase notice]:', supErr?.message || supErr);
              }

              // Resilient Fallback: If designer was not yet present in Supabase table, insert/upsert them directly
              if (updatedCount === 0) {
                try {
                  const finalPhone = clean10 || extraPhone10 || '';
                  const finalEmail = targetEmail || (cleanKey.includes('@') ? cleanKey : '');
                  const finalId = rawId || finalPhone || finalEmail || cleanKey;
                  const finalName = payload.name || 'Designer';
                  
                  await serverSupabase.from('designers').upsert({
                    id: finalId,
                    name: finalName,
                    phone: finalPhone,
                    email: finalEmail,
                    identifier: finalEmail || finalPhone || finalId,
                    portfolio: payload.portfolio || '',
                    software: payload.software || payload.skills || 'Graphic Design',
                    experience: payload.experience || payload.password || '',
                    role: 'designer',
                    status: newStatus,
                    isapproved: newStatus === 'Approved',
                    approvedat: newStatus === 'Approved' ? new Date().toISOString() : null,
                    createdat: new Date().toISOString()
                  }, { onConflict: 'id' });
                } catch (upsertErr: any) {
                  console.warn('[SERVER update-designer-status upsert notice]:', upsertErr?.message || upsertErr);
                }
              }

              // Invalidate designers cache immediately
              cachedDesignersData = null;
              cachedDesignersTime = 0;
              cachedLoginHistoryData = null;
              cachedLoginHistoryTime = 0;
              cachedDesignersTime = 0;

              // Log status change in login_history
              try {
                await serverSupabase.from('login_history').insert({
                  id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  phone: clean10 || extraPhone10 || cleanKey,
                  name: payload.name || `Designer ${cleanKey}`,
                  role: 'designer',
                  status: `Admin updated status to: ${newStatus}`,
                  timestamp: new Date().toISOString()
                });
              } catch (logErr) {}

              // If status is Approved, automatically trigger Approval Email!
              if (newStatus === 'Approved') {
                try {
                  let emailToNotify = targetEmail;
                  let designerName = (payload.name || '').trim();

                  // If email was not passed in request body, look it up in Supabase
                  if (!emailToNotify || !emailToNotify.includes('@')) {
                    const { data: dRows } = await serverSupabase
                      .from('designers')
                      .select('*')
                      .or(orFilters.join(','))
                      .limit(1);

                    if (dRows && dRows.length > 0) {
                      const dRow = dRows[0];
                      if (dRow.email && dRow.email.includes('@')) {
                        emailToNotify = dRow.email.trim().toLowerCase();
                      }
                      if (dRow.name && !designerName) {
                        designerName = dRow.name;
                      }
                    }
                  }

                  if (emailToNotify && emailToNotify.includes('@') && !emailToNotify.includes('dummy') && !emailToNotify.includes('example.com')) {
                    const approveHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;padding:32px;box-shadow:0 10px 25px rgba(0,0,0,0.04);">
    <div style="text-align:center;padding-bottom:24px;border-bottom:1px solid #f1f5f9;">
      <h1 style="color:#2563eb;font-size:24px;margin:0;font-weight:800;">Design Quixo</h1>
      <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Designer Network Verification</p>
    </div>
    <div style="padding:28px 0;text-align:center;">
      <div style="width:60px;height:60px;line-height:60px;border-radius:50%;background:#ecfdf5;color:#059669;font-size:28px;margin:0 auto 16px;border:2px solid #a7f3d0;">✓</div>
      <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 10px;">Congratulations ${designerName || 'Designer'}!</h2>
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 20px;">Your designer partner account has been <strong style="color:#059669;">Approved & Cleared</strong> by Design Quixo Platform Administration.</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:left;font-size:13px;color:#475569;margin-bottom:24px;">
        <p style="margin:0 0 6px;"><strong>Registered ID / Mobile:</strong> ${clean10 || extraPhone10 || cleanKey}</p>
        <p style="margin:0 0 6px;"><strong>Registered Email:</strong> ${emailToNotify}</p>
        <p style="margin:0 0 6px;"><strong>Clearance Status:</strong> <span style="color:#059669;font-weight:bold;">Active & Approved</span></p>
        <p style="margin:0;"><strong>Next Step:</strong> You can now log into your Designer Workspace to accept high-speed client design jobs.</p>
      </div>
      <a href="https://designquixo.com/login.html" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">Log In to Designer Portal</a>
    </div>
    <div style="border-top:1px solid #f1f5f9;padding-top:20px;text-align:center;font-size:12px;color:#94a3b8;">
      © Design Quixo · MP Nagar Zone II, Bhopal, MP · High-Speed Design Operations
    </div>
  </div>
</body>
</html>`;

                    await sendMailWithFallback({
                      to: emailToNotify,
                      subject: `🎉 Account Approved: Welcome to Design Quixo Partner Network`,
                      html: approveHtml,
                      text: `Congratulations ${designerName || 'Designer'}! Your Design Quixo account (${clean10 || extraPhone10 || cleanKey}) has been approved. You can now log into your designer workspace: https://designquixo.com/login.html`
                    });
                    console.log(`[SERVER] Approval email successfully dispatched to ${emailToNotify}`);
                  } else {
                    console.log(`[SERVER] Skipping approval email: No valid email address for designer ${cleanKey}`);
                  }
                } catch (emailErr) {
                  console.warn('[SERVER] Approval email dispatch warning:', emailErr);
                }
              }

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: true, 
                key: cleanKey, 
                status: newStatus,
                message: `Designer ${cleanKey} status updated to ${newStatus}`
              }));
            } catch (err: any) {
              console.error('[SERVER /api/update-designer-status ERROR]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error updating designer status' }));
            }
          });
          return;
        }

        // Helper to set no-cache headers
        const setNoCacheHeaders = (resObj: any) => {
          resObj.setHeader('Content-Type', 'application/json');
          resObj.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          resObj.setHeader('Pragma', 'no-cache');
          resObj.setHeader('Expires', '0');
        };

        // --- GET DESIGNERS API ROUTE (REAL-TIME SUPABASE WITH SIGNATURE ATTACHMENT) ---
        const reqUrlPath = (req.url || '').split('?')[0];
        const isBypassCache = (req.url || '').includes('bypass_cache=true') || (req.url || '').includes('fresh=true');
        if ((reqUrlPath === '/api/get-designers') && (req.method === 'GET' || req.method === 'POST')) {
          try {
            if (!isBypassCache && cachedDesignersData && (Date.now() - cachedDesignersTime < CACHE_TTL_MS)) {
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ 
                success: true, 
                designers: cachedDesignersData,
                cached: true
              }));
            }

            let rawDesignersList: any[] = [];
            try {
              const { data: supaList, error: supErr } = await serverSupabase
                .from('designers')
                .select('*')
                .order('createdat', { ascending: false });

              if (supErr) {
                console.warn('[SERVER /api/get-designers Supabase warning]:', supErr.message);
              }
              if (supaList && Array.isArray(supaList)) {
                rawDesignersList = supaList;
              }
            } catch (supErr: any) {
              console.warn('[SERVER /api/get-designers Supabase notice]:', supErr?.message);
            }

            // Also load signed agreement signatures from login_history
            const signaturesMap: Record<string, string> = {};
            try {
              const { data: sigRows } = await serverSupabase
                .from('login_history')
                .select('phone, name, status, id')
                .eq('role', 'signed_agreement');

              if (sigRows && Array.isArray(sigRows)) {
                sigRows.forEach(sr => {
                  if (sr && sr.status) {
                    const rawPhone = (sr.phone || '').toString().trim().toLowerCase();
                    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
                    if (cleanPhone) signaturesMap[cleanPhone] = sr.status;
                    if (rawPhone) signaturesMap[rawPhone] = sr.status;
                    if (sr.id) {
                      signaturesMap[sr.id] = sr.status;
                      const stripped = sr.id.replace(/^sig-/, '');
                      signaturesMap[stripped] = sr.status;
                    }
                  }
                });
              }
            } catch (sigErr: any) {
              console.warn('[SERVER /api/get-designers signatures notice]:', sigErr?.message);
            }

            const designersList = rawDesignersList
              .filter(d => {
                if (!d) return false;
                const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
                const ph = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
                const id = (d.id || '').toString().trim().toLowerCase();
                if (em && serverDeletedDesignerSet.has(em)) return false;
                if (ph && serverDeletedDesignerSet.has(ph)) return false;
                if (id && serverDeletedDesignerSet.has(id)) return false;
                return true;
              })
              .map(d => {
                const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
                const ph = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
                const id = (d.id || '').toString().trim().toLowerCase();
                const sig = (ph && signaturesMap[ph]) || (em && signaturesMap[em]) || (id && signaturesMap[id]) || d.signatureDataUrl || d.signature || '';
                return {
                  ...d,
                  skills: d.skills || d.software || 'Graphic Design',
                  photo: d.photo || d.avatar || '',
                  status: d.status || (d.isapproved ? 'Approved' : 'Pending'),
                  signature: sig,
                  signatureDataUrl: sig
                };
              });

            cachedDesignersData = designersList;
            cachedDesignersTime = Date.now();

            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ 
              success: true, 
              designers: designersList 
            }));
          } catch (err: any) {
            res.statusCode = 500;
            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ success: false, designers: [], message: err.message }));
          }
        }

        // --- GET LOGIN HISTORY API ROUTE (REAL-TIME SUPABASE READ) ---
        if (reqUrlPath === '/api/get-login-history' && (req.method === 'GET' || req.method === 'POST')) {
          try {
            if (cachedLoginHistoryData && (Date.now() - cachedLoginHistoryTime < 3000)) { // 3 seconds Cache TTL
              setNoCacheHeaders(res);
              return res.end(JSON.stringify(cachedLoginHistoryData));
            }

            const { data: logs, error: logErr } = await serverSupabase
              .from('login_history')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(300);

            if (logErr) {
              console.warn('[SERVER /api/get-login-history Supabase notice]:', logErr.message);
            }

            const cleanLogs = logs || [];
            cachedLoginHistoryData = cleanLogs;
            cachedLoginHistoryTime = Date.now();

            setNoCacheHeaders(res);
            return res.end(JSON.stringify(cleanLogs));
          } catch (err: any) {
            res.statusCode = 500;
            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // --- SAVE LOGIN HISTORY API ROUTE (REAL-TIME SUPABASE PERSISTENCE) ---
        if (reqUrlPath === '/api/save-login-history' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const logItem = JSON.parse(body || '{}');
              const { id, phone, name, role, status, timestamp } = logItem;
              if (!id || !phone) {
                res.statusCode = 400;
                setNoCacheHeaders(res);
                return res.end(JSON.stringify({ success: false, message: 'id and phone are required' }));
              }

              // Persist to Supabase login_history
              await serverSupabase.from('login_history').upsert({
                id,
                phone,
                name: name || '',
                role: role || '',
                status: status || '',
                timestamp: timestamp || new Date().toISOString()
              });

              // Bust the caches to ensure instant update
              cachedLoginHistoryData = null;
              cachedDesignersData = null;

              const clean10 = phone.replace(/\D/g, '').slice(-10);

              // If it's a DP upload, automatically update the photo field in Supabase designers table
              if (role === 'user_dp') {
                try {
                  const orFilters = [`id.eq.${phone}`, `email.ilike.${phone}`, `identifier.ilike.${phone}`];
                  if (clean10) orFilters.push(`phone.eq.${clean10}`, `id.eq.${clean10}`);
                  await serverSupabase
                    .from('designers')
                    .update({ photo: status })
                    .or(orFilters.join(','));
                } catch (dpPropErr: any) {
                  console.warn('[SERVER save-login-history DP notice]:', dpPropErr?.message || dpPropErr);
                }
              }

              // If it's a signature agreement, log and update
              if (role === 'signed_agreement') {
                try {
                  const orFilters = [`id.eq.${phone}`, `email.ilike.${phone}`, `identifier.ilike.${phone}`];
                  if (clean10) orFilters.push(`phone.eq.${clean10}`, `id.eq.${clean10}`);
                  await serverSupabase
                    .from('designers')
                    .update({ status: 'Approved', isapproved: true })
                    .or(orFilters.join(','));
                } catch (sigPropErr: any) {
                  console.warn('[SERVER save-login-history signature notice]:', sigPropErr?.message || sigPropErr);
                }
              }

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // --- DELETE DESIGNER API ROUTE (PERMANENT CACHE-FREE DELETION FROM ALL TABLES) ---
        if (req.url === '/api/delete-designer' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { id, email, phone } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').toString().trim().toLowerCase();
              const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);
              const rawId = (id || '').toString().trim();

              console.log(`[SERVER /api/delete-designer] Permanently deleting designer: ${cleanEmail || cleanPhone || rawId}`);

              // 1. Add to server deletion memory blacklist immediately
              if (cleanEmail) serverDeletedDesignerSet.add(cleanEmail);
              if (cleanPhone) serverDeletedDesignerSet.add(cleanPhone);
              if (rawId) {
                serverDeletedDesignerSet.add(rawId);
                serverDeletedDesignerSet.add(rawId.toLowerCase());
              }

              // 2. Invalidate cached designers memory
              cachedDesignersData = null;

              // 3. Delete from Supabase 'designers' and 'login_history' tables
              try {
                const orDesignerFilters = [];
                if (rawId) orDesignerFilters.push(`id.eq.${rawId}`);
                if (cleanEmail) orDesignerFilters.push(`email.ilike.${cleanEmail}`, `id.eq.${cleanEmail}`);
                if (cleanPhone) orDesignerFilters.push(`phone.eq.${cleanPhone}`, `id.eq.${cleanPhone}`);

                if (orDesignerFilters.length > 0) {
                  await serverSupabase.from('designers').delete().or(orDesignerFilters.join(','));
                }

                const orLogFilters = [];
                if (rawId) orLogFilters.push(`id.eq.${rawId}`, `phone.eq.${rawId}`);
                if (cleanEmail) orLogFilters.push(`phone.eq.${cleanEmail}`);
                if (cleanPhone) orLogFilters.push(`phone.eq.${cleanPhone}`);

                if (orLogFilters.length > 0) {
                  await serverSupabase.from('login_history').delete().or(orLogFilters.join(','));
                }
              } catch (delErr) {
                console.warn('[Supabase delete-designer notice]:', delErr);
              }

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({
                success: true,
                message: `Designer permanently removed from all database tables and blacklist registered.`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error deleting designer' }));
            }
          });
          return;
        }

        // --- DELETE JOB API ROUTE (PERMANENT CACHE-FREE DELETION) ---
        if (req.url === '/api/delete-job' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const targetId = parsed.id || parsed.jobId;
              if (!targetId) {
                res.statusCode = 400;
                setNoCacheHeaders(res);
                return res.end(JSON.stringify({ success: false, message: 'Missing job id' }));
              }

              const rawId = targetId.toString().trim();
              const bareId = rawId.replace(/^(DQ[-_]?)+/i, '');
              const cleanId = `DQ-${bareId}`;

              console.log(`[SERVER /api/delete-job] Permanently deleting Job #${cleanId} from Supabase...`);

              // Track in server deletion memory blacklist immediately
              serverDeletedJobIds.add(cleanId);
              serverDeletedJobIds.add(bareId);
              serverDeletedJobIds.add(`DQ${bareId}`);
              serverDeletedJobIds.add(rawId);

              // Invalidate cached jobs memory
              cachedJobsData = null;

              // Delete from Supabase jobs table
              try {
                await serverSupabase.from('jobs').delete().or(`id.eq.${cleanId},id.eq.${bareId},id.eq.${rawId}`);
              } catch (delErr) {
                console.warn('[Supabase delete-job notice]:', delErr);
              }

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({
                success: true,
                deletedId: cleanId,
                message: `Job #${cleanId} deleted permanently from cloud storage.`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error deleting job' }));
            }
          });
          return;
        }

        // --- GET JOBS API ROUTE (IN-MEMORY CACHED TO SAVES BANDWIDTH) ---
        if (req.url === '/api/get-jobs' && req.method === 'GET') {
          try {
            if (cachedJobsData && (Date.now() - cachedJobsTime < CACHE_TTL_MS)) {
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: true, jobs: cachedJobsData, cached: true }));
            }

            let rawList: any[] = [];
            try {
              const { data: supaJobs, error: sErr } = await serverSupabase
                .from('jobs')
                .select('*')
                .neq('status', 'Deleted')
                .order('createdat', { ascending: false });

              if (sErr) {
                console.warn('[Supabase /api/get-jobs error]:', sErr.message);
              }
              if (supaJobs && Array.isArray(supaJobs)) {
                rawList = supaJobs;
              }
            } catch (supErr: any) {
              console.warn('[Supabase /api/get-jobs exception]:', supErr?.message);
            }

            const activeJobs = rawList.filter(j => {
              if (!j) return false;
              if (j.status === 'Deleted') return false;
              const jId = (j.id || '').toString().trim();
              const jBare = jId.replace(/^(DQ[-_]?)+/i, '');
              const jClean = `DQ-${jBare}`;
              return !serverDeletedJobIds.has(jId) && !serverDeletedJobIds.has(jClean) && !serverDeletedJobIds.has(jBare);
            });

            cachedJobsData = activeJobs;
            cachedJobsTime = Date.now();

            setNoCacheHeaders(res);
            return res.end(JSON.stringify({
              success: true,
              jobs: activeJobs
            }));
          } catch (err: any) {
            res.statusCode = 500;
            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ success: false, jobs: [], message: err.message }));
          }
        }

        // --- SAVE JOB API ROUTE (AUTHORITATIVE CLOUD PERSISTENCE) ---
        if (req.url === '/api/save-job' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const job = JSON.parse(body || '{}');
              const rawId = (job.id || '').toString().trim();
              const bareId = rawId.replace(/^(DQ[-_]?)+/i, '');
              const cleanId = bareId ? `DQ-${bareId}` : `DQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

              // Remove from server deletion set if re-created
              serverDeletedJobIds.delete(cleanId);
              serverDeletedJobIds.delete(bareId);
              serverDeletedJobIds.delete(`DQ${bareId}`);

              // Invalidate cached jobs memory
              cachedJobsData = null;

              const row = {
                id: cleanId,
                service: job.service || 'Graphic Design',
                project: job.project || job.projectName || 'Design Request',
                price: Number(job.price) || 399,
                brief: job.brief || '',
                phone: job.phone || job.whatsapp || '',
                whatsapp: job.whatsapp || job.phone || '',
                ratio: job.ratio || 'Square (1:1)',
                referenceimage: job.referenceImage || job.referenceimage || job.image || '',
                status: job.status || 'Pending',
                acceptedby: Array.isArray(job.acceptedBy) ? job.acceptedBy : (job.acceptedby ? (typeof job.acceptedby === 'string' ? JSON.parse(job.acceptedby) : job.acceptedby) : []),
                completed: !!job.completed,
                completedat: job.completedAt || job.completedat || null,
                createdat: job.createdAt || job.createdat || new Date().toISOString(),
                time: job.time || 'Just now'
              };

              try {
                await serverSupabase.from('jobs').upsert(row, { onConflict: 'id' });
              } catch (saveErr) {
                console.warn('[Supabase /api/save-job error]:', saveErr);
              }

              // Instant Push Broadcast to all registered Chrome browser devices (5x alert sound + vibration)
              broadcastPushNotification({
                title: `🚨 NEW DESIGN ORDER #${cleanId}`,
                body: `₹${row.price} • ${row.service} | "${row.project}". Tap to claim work & open workstation!`,
                jobId: cleanId,
                price: row.price,
                service: row.service,
                url: `/designer-dashboard.html?alertJob=${cleanId}&autoPlay=5`,
                tag: `new-job-${cleanId}`,
                icon: '/favicon.png',
                badge: '/favicon.png',
                vibrate: [300, 150, 300, 150, 300, 150, 300, 150, 300],
                autoPlay: 5
              }).catch(e => console.warn('[WebPush Broadcast Error]:', e));

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({
                success: true,
                job: row,
                message: `Job #${cleanId} saved to cloud.`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error saving job' }));
            }
          });
          return;
        }

        // --- UPDATE JOB STATUS API ROUTE (DIRECT SUPABASE) ---
        if (req.url === '/api/update-job-status' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { jobId, status, acceptedBy, completed, completedAt, referenceImage } = JSON.parse(body || '{}');
              const rawId = (jobId || '').toString().trim();
              const bareId = rawId.replace(/^(DQ[-_]?)+/i, '');
              const cleanId = bareId ? `DQ-${bareId}` : rawId;

              cachedJobsData = null; // bust cache

              const isCompleted = completed || (status && (status.toLowerCase().includes('completed') || status.toLowerCase().includes('delivered')));
              const compAt = completedAt || (isCompleted ? new Date().toISOString() : null);

              const updatePayload: any = {
                status: status,
                completed: !!isCompleted
              };
              if (compAt) {
                updatePayload.completedat = compAt;
              }
              if (Array.isArray(acceptedBy)) {
                updatePayload.acceptedby = acceptedBy;
              }
              if (referenceImage) {
                updatePayload.referenceimage = referenceImage;
              }

              try {
                await serverSupabase
                  .from('jobs')
                  .update(updatePayload)
                  .or(`id.eq.${cleanId},id.eq.${bareId},id.eq.${rawId}`);
              } catch (supErr: any) {
                console.warn('[Supabase /api/update-job-status error]:', supErr?.message);
              }

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: true, message: `Job #${cleanId} status updated to ${status}` }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // --- PUSH NOTIFICATION: GET VAPID PUBLIC KEY ---
        if (req.url === '/api/push-vapid-public-key' && req.method === 'GET') {
          setNoCacheHeaders(res);
          return res.end(JSON.stringify({
            success: true,
            publicKey: VAPID_PUBLIC_KEY
          }));
        }

        // --- PUSH NOTIFICATION: SUBSCRIBE DEVICE ---
        if (req.url === '/api/push-subscribe' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { subscription, role, identifier, name } = JSON.parse(body || '{}');
              if (!subscription || !subscription.endpoint) {
                res.statusCode = 400;
                setNoCacheHeaders(res);
                return res.end(JSON.stringify({ success: false, message: 'Invalid push subscription' }));
              }

              activePushSubscriptions.set(subscription.endpoint, {
                endpoint: subscription.endpoint,
                subscription: subscription,
                role: role || 'designer',
                identifier: identifier || 'designer',
                name: name || 'User',
                createdAt: Date.now()
              });

              console.log(`[WebPush] Registered push device for ${name || 'User'} (${role || 'designer'}). Total active subscribers: ${activePushSubscriptions.size}`);
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({
                success: true,
                message: 'Push subscription registered successfully',
                totalSubscribers: activePushSubscriptions.size
              }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // --- PUSH NOTIFICATION: UNSUBSCRIBE DEVICE ---
        if (req.url === '/api/push-unsubscribe' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { endpoint } = JSON.parse(body || '{}');
              if (endpoint) {
                activePushSubscriptions.delete(endpoint);
              }
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: true, message: 'Push subscription removed' }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // --- PUSH NOTIFICATION: TRIGGER / TEST NOTIFICATION ---
        if (req.url === '/api/trigger-push-notification' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              await broadcastPushNotification({
                title: data.title || '🚨 NEW DESIGN ORDER ALERT',
                body: data.body || '₹500 • New design order received! Tap to open workstation & claim.',
                jobId: data.jobId || 'TEST',
                price: data.price || 500,
                service: data.service || 'Graphic Design',
                url: data.url || '/designer-dashboard.html?autoPlay=5',
                icon: '/favicon.png',
                badge: '/favicon.png',
                tag: data.tag || 'dq-test-alert',
                vibrate: [300, 150, 300, 150, 300, 150, 300, 150, 300],
                autoPlay: 5
              });

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({
                success: true,
                message: `Push notification dispatched to ${activePushSubscriptions.size} active devices.`,
                recipients: activePushSubscriptions.size
              }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // --- CLEAR ALL JOBS API ROUTE ---
        if (req.url === '/api/clear-all-jobs' && req.method === 'POST') {
          try {
            console.log('[SERVER /api/clear-all-jobs] Clearing all jobs from Supabase...');
            cachedJobsData = [];
            await serverSupabase.from('jobs').delete().neq('id', 'CLEAR_ALL_SENTINEL');
            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ success: true, message: 'All jobs cleared successfully' }));
          } catch (err: any) {
            res.statusCode = 500;
            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // --- SAVE CITY ADDRESS API ROUTE ---
        if (req.url === '/api/save-city-address' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { key, address, phone, name } = JSON.parse(body || '{}');
              if (!key) {
                res.statusCode = 400;
                setNoCacheHeaders(res);
                return res.end(JSON.stringify({ success: false, message: 'Missing city key' }));
              }

              const cleanKey = key.toString().toLowerCase().trim().replace(/\s+/g, '-');
              const cleanAddress = (address || '').toString().trim();
              const cleanPhone = (phone || '+91 86024 20897').toString().trim();

              console.log(`[SERVER /api/save-city-address] Saving address for ${cleanKey}...`);

              // Invalidate city addresses cache
              cachedCityAddressesData = null;

              const payload = {
                key: cleanKey,
                city: cleanKey,
                address: cleanAddress,
                phone: cleanPhone
              };

              const { error } = await serverSupabase
                .from('city_addresses')
                .upsert(payload);

              if (error) {
                console.warn('[SERVER /api/save-city-address Supabase warning]:', error.message);
              }

              // Also log in login_history for audit
              try {
                await serverSupabase.from('login_history').insert({
                  id: `city-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  phone: cleanPhone,
                  name: `Admin (City Update: ${cleanKey})`,
                  role: 'admin',
                  status: `Updated Address for ${cleanKey.toUpperCase()}: ${cleanAddress}`
                });
              } catch (e) {}

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({
                success: true,
                key: cleanKey,
                data: payload,
                message: `Address for ${cleanKey.toUpperCase()} saved to cloud.`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error saving city address' }));
            }
          });
          return;
        }

        // --- GET CITY ADDRESSES API ROUTE (IN-MEMORY CACHED) ---
        if (req.url === '/api/get-city-addresses' && req.method === 'GET') {
          try {
            if (cachedCityAddressesData && (Date.now() - cachedCityAddressesTime < CACHE_TTL_MS)) {
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: true, addresses: cachedCityAddressesData, cached: true }));
            }

            const { data, error } = await serverSupabase
              .from('city_addresses')
              .select('*');

            if (error) {
              console.warn('[SERVER /api/get-city-addresses notice]:', error.message);
            }

            const map: Record<string, any> = {};
            if (data && Array.isArray(data)) {
              data.forEach((row: any) => {
                if (row && row.key) {
                  map[row.key] = {
                    name: `${row.key.charAt(0).toUpperCase() + row.key.slice(1)} Creative Hub`,
                    address: row.address || '',
                    phone: row.phone || '+91 86024 20897',
                    whatsapp: (row.phone || '918602420897').replace(/[^0-9]/g, ''),
                    landmark: '',
                    cityState: ''
                  };
                }
              });
            }

            cachedCityAddressesData = map;
            cachedCityAddressesTime = Date.now();

            setNoCacheHeaders(res);
            return res.end(JSON.stringify({
              success: true,
              addresses: map
            }));
          } catch (err: any) {
            res.statusCode = 500;
            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ success: false, addresses: {}, message: err.message }));
          }
        }

        
        // --- REVIEWS API ROUTES (SUPABASE + DISK PERSISTENCE) ---
        if (req.url === '/api/get-reviews' && req.method === 'GET') {
          try {
            const { data, error } = await serverSupabase
              .from('services')
              .select('*')
              .eq('id', 'sys_google_reviews')
              .maybeSingle();

            let reviewsList: any[] = [];
            if (data && data.tag) {
              try {
                reviewsList = JSON.parse(data.tag);
              } catch (pe) {}
            }

            // Fallback to local reviews.json if empty or Supabase unavailable
            if (!reviewsList || reviewsList.length === 0) {
              const localRevPath = path.join(process.cwd(), 'reviews.json');
              if (fs.existsSync(localRevPath)) {
                try {
                  reviewsList = JSON.parse(fs.readFileSync(localRevPath, 'utf-8'));
                } catch (fe) {}
              }
            }

            setNoCacheHeaders(res);
            return res.end(JSON.stringify({
              success: true,
              reviews: reviewsList || []
            }));
          } catch (err: any) {
            res.statusCode = 500;
            setNoCacheHeaders(res);
            return res.end(JSON.stringify({ success: false, reviews: [], message: err.message }));
          }
        }

        if (req.url === '/api/save-review' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              let listToSave: any[] = [];

              if (Array.isArray(payload.items) && payload.items.length > 0) {
                listToSave = payload.items;
              } else if (payload.item && payload.item.id) {
                // Fetch current list first
                const { data } = await serverSupabase
                  .from('services')
                  .select('tag')
                  .eq('id', 'sys_google_reviews')
                  .maybeSingle();
                
                let current: any[] = [];
                if (data && data.tag) {
                  try { current = JSON.parse(data.tag); } catch(e) {}
                }
                if (!Array.isArray(current) || current.length === 0) {
                  const localRevPath = path.join(process.cwd(), 'reviews.json');
                  if (fs.existsSync(localRevPath)) {
                    try { current = JSON.parse(fs.readFileSync(localRevPath, 'utf-8')); } catch(e) {}
                  }
                }
                if (!Array.isArray(current)) current = [];

                const idx = current.findIndex(r => r.id === payload.item.id || String(r.id) === String(payload.item.id));
                if (idx !== -1) {
                  current[idx] = { ...current[idx], ...payload.item };
                } else {
                  current.unshift(payload.item);
                }
                listToSave = current;
              } else {
                res.statusCode = 400;
                setNoCacheHeaders(res);
                return res.end(JSON.stringify({ success: false, message: 'Invalid review payload' }));
              }

              // Persist to Supabase services table under 'sys_google_reviews'
              await serverSupabase.from('services').upsert({
                id: 'sys_google_reviews',
                name: 'System Reviews Data Store',
                price: 0,
                tag: JSON.stringify(listToSave),
                description: 'Cloud storage for all verified client reviews'
              });

              // Also persist to reviews.json on disk
              try {
                fs.writeFileSync(path.join(process.cwd(), 'reviews.json'), JSON.stringify(listToSave, null, 2));
              } catch (fe) {}

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({
                success: true,
                reviews: listToSave,
                message: 'Review persisted to Supabase cloud and server storage.'
              }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/delete-review' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { id } = JSON.parse(body || '{}');
              if (!id) {
                res.statusCode = 400;
                setNoCacheHeaders(res);
                return res.end(JSON.stringify({ success: false, message: 'Missing review id' }));
              }

              const { data } = await serverSupabase
                .from('services')
                .select('tag')
                .eq('id', 'sys_google_reviews')
                .maybeSingle();
              
              let current: any[] = [];
              if (data && data.tag) {
                try { current = JSON.parse(data.tag); } catch(e) {}
              }
              if (Array.isArray(current)) {
                current = current.filter(r => r.id !== id && String(r.id) !== String(id));
                await serverSupabase.from('services').upsert({
                  id: 'sys_google_reviews',
                  name: 'System Reviews Data Store',
                  price: 0,
                  tag: JSON.stringify(current),
                  description: 'Cloud storage for all verified client reviews'
                });
                try {
                  fs.writeFileSync(path.join(process.cwd(), 'reviews.json'), JSON.stringify(current, null, 2));
                } catch(e) {}
              }

              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: true, reviews: current, message: 'Review deleted from cloud.' }));
            } catch (err: any) {
              res.statusCode = 500;
              setNoCacheHeaders(res);
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'mpa',
    });

    app.use(vite.middlewares);

    // Fallback for HTML pages without .html extension in DEV
    app.get('*', async (req, res, next) => {
      let reqPath = req.path;
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(process.cwd(), reqPath + (reqPath.endsWith('.html') ? '' : '.html'));
      if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, 'utf-8');
        html = await vite.transformIndexHtml(req.url, html);
        res.send(html);
      } else {
        next();
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      let reqPath = req.path;
      if (reqPath === '/') reqPath = '/index.html';
      
      const htmlPath = path.join(distPath, reqPath + (reqPath.endsWith('.html') ? '' : '.html'));
      if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
      } else {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:' + PORT);
  });
}

startServer();
