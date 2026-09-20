import { createClient as createSupa } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createSupa(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const row = {
    id: 'DQ-TEST-JOB-999',
    title: 'Test Flyer Design',
    client: 'John Doe (9999999999)',
    budget: 499,
    deadline: 'ASAP',
    category: 'Flyer Design',
    status: 'Pending',
    description: 'Flyer for opening | Ref Image: data:image/png;base64,iVBORw0KGgoAAAANS... | Ratio: A4',
    assigned_to: '',
    designer: '',
    created_at: new Date().toISOString()
  };

  console.log('Inserting row...');
  const { data, error } = await supabase.from('jobs').upsert(row, { onConflict: 'id' }).select();
  if (error) {
    console.error('Upsert Error:', error);
  } else {
    console.log('Upsert Success:', data);
  }
}

run();
