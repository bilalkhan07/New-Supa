import { createClient as createSupa } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createSupa(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const designerRow: any = {
    id: "9856745213",
    name: "Shisher Dubey",
    phone: "9856745213",
    email: "udceoy09552@smaau.com",
    identifier: "udceoy09552@smaau.com",
    portfolio: "",
    skills: ["Graphic Design"],
    specialization: "Graphic Design",
    exp: "Graphic Design",
    bio: "",
    status: "Pending",
    avatar: "",
    createdat: new Date().toISOString(),
    password: "test-password-here"
  };

  console.log('Upserting Shisher Dubey:', designerRow);
  const { data, error } = await supabase.from('designers').upsert(designerRow, { onConflict: 'id' }).select();
  if (error) {
    console.error('Upsert Error:', error);
  } else {
    console.log('Upsert Success:', data);
  }
}

run();
