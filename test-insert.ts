import { createClient as createSupa } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createSupa(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const payload = {
    id: 'test-designer-id-123',
    name: 'Test Designer Name',
    phone: '1234567890',
    email: 'test@designer.com',
    identifier: 'test@designer.com',
    portfolio: 'https://portfolio.com',
    specialization: 'Graphic Design',
    skills: ['Graphic Design', 'Logo Design'],
    exp: 'Graphic Design',
    status: 'Approved',
    avatar: '',
    createdat: new Date().toISOString()
  };

  console.log('Inserting payload:', payload);
  const { data, error } = await supabase.from('designers').insert(payload).select();
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

run();
