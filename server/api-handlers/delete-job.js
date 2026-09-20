import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const targetId = body.id || body.jobId;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Missing job id' });
    }

    const rawId = targetId.toString().trim();
    const bareId = rawId.replace(/^(DQ[-_]?)+/i, '');
    const cleanId = `DQ-${bareId}`;

    await supabase.from('jobs').delete().or(`id.eq.${cleanId},id.eq.${bareId},id.eq.${rawId}`);

    return res.status(200).json({
      success: true,
      deletedId: cleanId,
      message: `Job #${cleanId} deleted permanently from cloud storage.`
    });
  } catch (err) {
    console.error('Error in delete-job handler:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Error deleting job' });
  }
}
