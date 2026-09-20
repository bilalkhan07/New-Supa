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
    const { id, email, phone } = body;
    const cleanEmail = (email || '').toString().trim().toLowerCase();
    const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);
    const rawId = (id || '').toString().trim();

    const orDesignerFilters = [];
    if (rawId) orDesignerFilters.push(`id.eq.${rawId}`);
    if (cleanEmail) orDesignerFilters.push(`email.ilike.${cleanEmail}`, `id.eq.${cleanEmail}`);
    if (cleanPhone) orDesignerFilters.push(`phone.eq.${cleanPhone}`, `id.eq.${cleanPhone}`);

    if (orDesignerFilters.length > 0) {
      await supabase.from('designers').delete().or(orDesignerFilters.join(','));
    }

    const orLogFilters = [];
    if (rawId) orLogFilters.push(`id.eq.${rawId}`, `phone.eq.${rawId}`);
    if (cleanEmail) orLogFilters.push(`phone.eq.${cleanEmail}`);
    if (cleanPhone) orLogFilters.push(`phone.eq.${cleanPhone}`);

    if (orLogFilters.length > 0) {
      await supabase.from('login_history').delete().or(orLogFilters.join(','));
    }

    return res.status(200).json({
      success: true,
      message: `Designer permanently removed from all database tables and blacklist registered.`
    });
  } catch (err) {
    console.error('Error in delete-designer handler:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Error deleting designer' });
  }
}
