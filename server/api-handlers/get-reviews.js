import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', 'sys_google_reviews')
      .maybeSingle();

    let reviewsList = [];
    if (data && data.tag) {
      try {
        reviewsList = JSON.parse(data.tag);
      } catch (pe) {}
    }

    if (!reviewsList || reviewsList.length === 0) {
      const localRevPath = path.join(process.cwd(), 'reviews.json');
      if (fs.existsSync(localRevPath)) {
        try {
          reviewsList = JSON.parse(fs.readFileSync(localRevPath, 'utf-8'));
        } catch (fe) {}
      }
    }

    return res.status(200).json({
      success: true,
      reviews: reviewsList || []
    });
  } catch (err) {
    console.error('Error in get-reviews handler:', err);
    return res.status(500).json({ success: false, reviews: [], message: err?.message || 'Error fetching reviews' });
  }
}
