import { createClient as createSupa } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

const supabase = createSupa(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    const { data: supaList, error: supErr } = await supabase
      .from('designers')
      .select('*');

    let rawDesignersList = supaList || [];
    console.log('Designers directly from table count:', rawDesignersList.length);

    const { data: regLogs, error: rErr } = await supabase
      .from('login_history')
      .select('*')
      .or('role.eq.designer,id.like.reg-%')
      .order('timestamp', { ascending: false });

    if (rErr) {
      console.error('regLogs error:', rErr);
    }
    console.log('Found log rows:', regLogs?.length);

    if (regLogs && Array.isArray(regLogs)) {
      regLogs.forEach(r => {
        let parsedEmail = '';
        if (r.status && r.status.includes('Email: ')) {
          const parts = r.status.split('Email: ')[1].split(' - ');
          parsedEmail = parts[0].trim();
          if (parsedEmail === 'None') parsedEmail = '';
        }
        const rawP = (r.phone || '').toString();
        const p10 = rawP.replace(/\D/g, '').slice(-10);
        const eMail = (parsedEmail || (rawP.includes('@') ? rawP : '')).toLowerCase();
        const matchId = p10 || eMail || r.id;

        const exists = rawDesignersList.some(d => {
          const dPhone = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
          const dEmail = (d.email || d.identifier || '').toString().toLowerCase();
          const dId = (d.id || '').toString();
          return (p10 && dPhone === p10) || (eMail && dEmail === eMail) || (matchId && dId === matchId);
        });

        if (!exists) {
          rawDesignersList.push({
            id: matchId,
            name: r.name || 'Designer',
            phone: p10,
            email: eMail,
            identifier: eMail || p10,
            status: 'Pending',
            skills: ['Graphic Design'],
            specialization: 'Graphic Design',
            exp: 'Graphic Design',
            createdat: r.timestamp || new Date().toISOString()
          });
        }
      });
    }

    console.log('Before delete filter count:', rawDesignersList.length);

    const designersList = rawDesignersList
      .filter(d => {
        if (!d) return false;
        const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
        const ph = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
        const id = (d.id || '').toString().trim().toLowerCase();
        return true;
      })
      .map(d => {
        const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
        const ph = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
        const id = (d.id || '').toString().trim().toLowerCase();
        const sig = d.signatureDataUrl || d.signature || '';
        
        const skillsVal = (Array.isArray(d.skills) && d.skills.length > 0) 
          ? d.skills.join(', ') 
          : (d.skills || d.specialization || d.exp || (Array.isArray(d.software) && d.software.length > 0 ? d.software.join(', ') : d.software) || 'Graphic Design').toString().trim();
        
        const portfolioVal = (d.portfolio || d.portfolioUrl || d.portfoliolink || '').toString().trim();
        const avatarVal = (d.avatar || d.photo || d.avatarUrl || '').toString().trim();

        return {
          ...d,
          skills: skillsVal,
          specialization: d.specialization || skillsVal,
          exp: d.exp || skillsVal,
          software: Array.isArray(d.software) ? d.software : (skillsVal ? skillsVal.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          portfolio: portfolioVal,
          portfolioUrl: portfolioVal,
          avatar: avatarVal,
          photo: avatarVal,
          status: d.status || (d.isapproved ? 'Approved' : 'Pending'),
          signature: sig,
          signatureDataUrl: sig
        };
      });

    console.log('Final designers parsed count:', designersList.length);
    console.log('Designers parsed:', JSON.stringify(designersList, null, 2));

  } catch (err: any) {
    console.error('Run failed:', err);
  }
}

run();
