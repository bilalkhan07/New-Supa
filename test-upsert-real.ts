import { createClient as createSupa } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createSupa(SUPABASE_URL, SUPABASE_ANON_KEY);

const list = [
  { id: "9856745213", name: "Shisher Dubey", phone: "9856745213", email: "udceoy09552@smaau.com" },
  { id: "8629927995", name: "Bilal khan", phone: "8629927995", email: "bilal8888832@gmail.com" },
  { id: "7869396857", name: "Farzana Perveen", phone: "7869396857", email: "fperveen522@gmail.com" },
  { id: "9856745217", name: "Indore Interiors", phone: "9856745217", email: "indoreinteriors@gmail.com" },
  { id: "9876543210", name: "Indore Interiors", phone: "9876543210", email: "indoreinteriors@gmail.com" },
  { id: "9876543215", name: "Indore Interiors", phone: "9876543215", email: "koxel42602@jobscai.com" }
];

async function run() {
  for (const item of list) {
    const row = {
      id: item.id,
      name: item.name,
      phone: item.phone,
      email: item.email,
      identifier: item.email || item.phone,
      portfolio: "https://behance.net",
      skills: ["Graphic Design"],
      specialization: "Graphic Design",
      exp: "Graphic Design",
      bio: "Creator registration recovery",
      status: "Pending",
      avatar: "",
      createdat: new Date().toISOString(),
      password: "Designer@123"
    };
    
    console.log(`Upserting ${item.name} (${item.id})...`);
    const { error } = await supabase.from('designers').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`Error for ${item.name}:`, error);
    } else {
      console.log(`Successfully upserted ${item.name}`);
    }
  }
}

run();
