import { createClient as createSupa } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createSupa(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching last 5 jobs from Supabase...');
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error('Fetch Jobs Error:', error);
  } else {
    console.log(`Successfully fetched ${data?.length || 0} jobs.`);
    if (data && data.length > 0) {
      console.log('Sample Job Columns & Values:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  }
}

run();
