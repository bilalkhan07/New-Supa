import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BN3PRogrLXTWkDjdv9B0QdDEGuUH5-cNIewJ6KgJ2glQrLgtGng1WocCuqmzrL1-BIdSfNb6SX2Xz0HzsP8Yuhk';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'h4330lk5ygavsVd-_F4zWnzCgUWOKMe-JtYaQ60iqrI';
const VAPID_SUBJECT = 'mailto:alerts@designquixo.in';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('[trigger-push-notification] VAPID setup note:', e);
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
    const reqBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { title, body, jobId, price, service, autoPlay } = reqBody;

    const pushPayload = {
      title: title || '🚨 NEW DESIGN ORDER ALERT',
      body: body || (jobId ? `₹${price || 399} • ${service || 'Graphic Design'} | Tap to claim job!` : 'New client design order received!'),
      jobId: jobId || '',
      price: price || 399,
      url: jobId ? `/designer-dashboard.html?alertJob=${jobId}&autoPlay=${autoPlay || 5}` : `/designer-dashboard.html?autoPlay=${autoPlay || 5}`,
      autoPlay: autoPlay || 5,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [300, 150, 300, 150, 300, 150, 300, 150, 300],
      tag: jobId ? `job-${jobId}` : 'dq-new-job',
      renotify: true,
      timestamp: Date.now()
    };

    const jsonPayload = JSON.stringify(pushPayload);

    // Fetch active subscriptions from Supabase
    let subscriptions = [];
    try {
      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (Array.isArray(rows)) {
          subscriptions = rows;
        }
      }
    } catch (sbErr) {
      console.warn('[trigger-push] Supabase fetch error:', sbErr);
    }

    let successCount = 0;
    let failCount = 0;

    for (const subRecord of subscriptions) {
      const subObj = subRecord.subscription || subRecord;
      if (!subObj || !subObj.endpoint) continue;

      try {
        await webpush.sendNotification(subObj, jsonPayload, {
          TTL: 86400,
          urgency: 'high'
        });
        successCount++;
      } catch (pushErr) {
        failCount++;
        // If expired / unregistered (410, 404), remove from Supabase
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(subObj.endpoint)}`, {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            });
          } catch(e) {}
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Broadcast complete: ${successCount} sent, ${failCount} failed.`,
      sent: successCount,
      total: subscriptions.length
    });
  } catch (err) {
    console.error('[trigger-push error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Error' });
  }
}
