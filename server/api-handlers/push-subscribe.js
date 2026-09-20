const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

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
    const { subscription, role, identifier, name } = body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Missing push subscription object' });
    }

    const endpointHash = Buffer.from(subscription.endpoint).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-40);
    const subRecord = {
      id: endpointHash,
      endpoint: subscription.endpoint,
      subscription: subscription,
      role: role || 'designer',
      identifier: identifier || 'designer',
      name: name || 'User',
      updated_at: new Date().toISOString()
    };

    // Save/Upsert to Supabase push_subscriptions
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(subRecord)
      });
    } catch (sbErr) {
      console.warn('[push-subscribe] Supabase upsert note:', sbErr?.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Push subscription registered successfully'
    });
  } catch (err) {
    console.error('[push-subscribe error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Error' });
  }
}
