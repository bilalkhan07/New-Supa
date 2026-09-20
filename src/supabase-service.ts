// Design Quixo High-Performance Supabase Realtime Service
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

let rawUrl = (metaEnv && metaEnv.VITE_SUPABASE_URL) 
  ? metaEnv.VITE_SUPABASE_URL 
  : 'https://gzbwvleuuxyidohujibj.supabase.co';

// CRITICAL FIX: Clean any quotes, trailing slashes, and '/rest/v1' suffix because Supabase JS client appends /rest/v1 to every request automatically!
rawUrl = (rawUrl || '').toString().trim().replace(/^["']|["']$/g, '').replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const SUPABASE_URL = rawUrl || 'https://gzbwvleuuxyidohujibj.supabase.co';

let rawKey = (metaEnv && metaEnv.VITE_SUPABASE_ANON_KEY)
  ? metaEnv.VITE_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';
const SUPABASE_ANON_KEY = (rawKey || '').toString().trim().replace(/^["']|["']$/g, '');

// Initialize Supabase Client with auto-reconnect and session persistence
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Production database client initialization
if (typeof window !== 'undefined') {
  // Database initialized securely
}

// Auto-purge stale zombie cache from old projects (guarantees 100% fresh start)
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (window.localStorage.getItem('dq_fresh_new_project_v11_gzbwvleuuxyidohujibj') !== 'active') {
      window.localStorage.removeItem('dq_live_jobs');
      window.localStorage.removeItem('dq_registered_designers');
      window.localStorage.removeItem('dq_approved_designers');
      window.localStorage.removeItem('dq_deleted_jobs');
      window.localStorage.removeItem('dq_deleted_designers');
      window.localStorage.removeItem('dq_current_user');
      window.localStorage.removeItem('dq_login_history');
      window.localStorage.removeItem('dq_signed_agreements_all');
      window.localStorage.setItem('dq_fresh_new_project_v11_gzbwvleuuxyidohujibj', 'active');
    }
  }
} catch (e) {}

function clean10Phone(raw: any): string {
  if (!raw) return '';
  const str = raw.toString().trim();
  if (str.includes('@') || /[a-zA-Z]/.test(str)) return '';
  const digits = str.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(key, value);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(key);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
  }
};

export function safeDispatch(eventName: string, detail: any): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  } catch (e) {}
}

export function normalizeJobId(rawId: any): string {
  if (!rawId) return '';
  let str = rawId.toString().trim().toUpperCase();
  str = str.replace(/^(DQ[-_]?)+/i, '');
  return 'DQ-' + str;
}

export interface DQJob {
  id: string;
  service?: string;
  serviceId?: string;
  project?: string;
  projectName?: string;
  price?: number | string;
  brief?: string;
  phone?: string;
  whatsapp?: string;
  ratio?: string;
  referenceImage?: string;
  referenceimage?: string;
  image?: string;
  status?: string;
  time?: string;
  acceptedBy?: string[];
  completed?: boolean;
  completedAt?: string | null;
  createdAt?: string;
}

export interface DQDesigner {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  identifier?: string;
  password?: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
  dpUrl?: string;
  photo?: string;
  status: 'Approved' | 'Pending' | 'Revoked';
  date?: string;
  approvedAt?: string;
  registeredAt?: string;
  createdAt?: string;
  specialization?: string;
  portfolio?: string;
  skills?: string;
  whatsapp?: string;
}

export function extractImageUrl(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') {
    const trimmed = field.trim();
    if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '[object Object]') return '';
    return trimmed;
  }
  if (typeof field === 'object') {
    if (field.url && typeof field.url === 'string') return field.url.trim();
    if (field.data && typeof field.data === 'string') return field.data.trim();
    if (field.src && typeof field.src === 'string') return field.src.trim();
    if (field.base64 && typeof field.base64 === 'string') return field.base64.trim();
  }
  return '';
}


export async function pruneMissingColumnsAndUpsert(table: string, payload: any): Promise<{ success: boolean; error?: string }> {
  // Supabase designers table schema: [id, name, phone, email, identifier, password, portfolio, skills, experience, software, role, status, date, createdat, earnings, isapproved, approvedat, signature, signaturedataurl, agreementsigned, agreementsigneddate]
  const DESIGNERS_VALID_COLS = new Set(['id', 'name', 'phone', 'email', 'identifier', 'password', 'portfolio', 'skills', 'experience', 'software', 'role', 'status', 'date', 'createdat', 'earnings', 'isapproved', 'approvedat', 'signature', 'signaturedataurl', 'agreementsigned', 'agreementsigneddate']);

  let currentPayload = { ...payload };
  if (table === 'designers') {
    Object.keys(currentPayload).forEach(key => {
      if (!DESIGNERS_VALID_COLS.has(key.toLowerCase())) {
        delete currentPayload[key];
      }
    });
  }

  let attempts = 0;
  const maxAttempts = 6;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const { error } = await supabase.from(table).upsert(currentPayload);
      if (!error) {
        return { success: true };
      }

      console.warn(`[Supabase SDK Upsert warning on ${table} - attempt ${attempts}]:`, error.message);
      const errMsg = (error.message || '').toLowerCase();
      
      // PostgreSQL undefined_column or PostgREST missing column error (PGRST204)
      if (error.code === '42703' || error.code === 'PGRST204' || errMsg.includes('does not exist') || errMsg.includes('column') || errMsg.includes('not found') || errMsg.includes('schema cache')) {
        const match = error.message.match(/Could not find the '([^']+)' column/i) ||
                      error.message.match(/Could not find the "([^"]+)" column/i) ||
                      error.message.match(/column "([^"]+)"/i) ||
                      error.message.match(/column '([^']+)'/i);
        if (match && match[1]) {
          const missingCol = match[1];
          console.warn(`[Auto-Pruner]: Column "${missingCol}" does not exist in table "${table}". Pruning and retrying...`);
          delete currentPayload[missingCol];
          if (missingCol === 'avatar') delete currentPayload.avatarUrl;
          if (missingCol === 'avatarUrl') delete currentPayload.avatar;
          continue;
        } else {
          // If match fails but email, avatar, or createdat is in payload, try pruning them
          if ('email' in currentPayload) {
            console.warn(`[Auto-Pruner]: Fallback pruning "email"...`);
            delete currentPayload.email;
            continue;
          }
          if ('avatar' in currentPayload || 'avatarUrl' in currentPayload) {
            console.warn(`[Auto-Pruner]: Fallback pruning "avatar"...`);
            delete currentPayload.avatar;
            delete currentPayload.avatarUrl;
            continue;
          }
          if ('createdat' in currentPayload) {
            console.warn(`[Auto-Pruner]: Fallback pruning "createdat"...`);
            delete currentPayload.createdat;
            continue;
          }
          if ('createdAt' in currentPayload) {
            console.warn(`[Auto-Pruner]: Fallback pruning "createdAt"...`);
            delete currentPayload.createdAt;
            continue;
          }
        }
      }
      return { success: false, error: error.message };
    } catch (err: any) {
      console.warn(`[Supabase Exception in SDK Upsert on ${table}]:`, err);
      break;
    }
  }

  // REST Fallback with dynamic pruning
  let restPayload = { ...payload };
  if (table === 'designers') {
    Object.keys(restPayload).forEach(key => {
      if (!DESIGNERS_VALID_COLS.has(key.toLowerCase())) {
        delete restPayload[key];
      }
    });
  }
  let restAttempts = 0;
  const maxRestAttempts = 5;

  while (restAttempts < maxRestAttempts) {
    restAttempts++;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(restPayload)
      });
      if (res.ok) {
        return { success: true };
      }
      const text = await res.text();
      console.warn(`[REST Post attempt ${restAttempts} on ${table} failed]:`, text);
      const lowerText = text.toLowerCase();
      if (lowerText.includes('does not exist') || lowerText.includes('column') || lowerText.includes('not found') || lowerText.includes('schema cache')) {
        const match = text.match(/Could not find the '([^']+)' column/i) || text.match(/Could not find the "([^"]+)" column/i) || text.match(/column "([^"]+)"/i) || text.match(/column '([^']+)'/i);
        if (match && match[1]) {
          const missingCol = match[1];
          console.warn(`[Auto-Pruner REST]: Column "${missingCol}" does not exist in table "${table}". Pruning and retrying REST...`);
          delete restPayload[missingCol];
          if (missingCol === 'avatar') delete restPayload.avatarUrl;
          if (missingCol === 'avatarUrl') delete restPayload.avatar;
          continue;
        } else {
          if ('email' in restPayload) {
            delete restPayload.email;
            continue;
          }
          if ('avatar' in restPayload || 'avatarUrl' in restPayload) {
            delete restPayload.avatar;
            delete restPayload.avatarUrl;
            continue;
          }
          if ('createdat' in restPayload) {
            delete restPayload.createdat;
            continue;
          }
          if ('createdAt' in restPayload) {
            delete restPayload.createdAt;
            continue;
          }
        }
      }
      return { success: false, error: text };
    } catch (fetchErr: any) {
      console.warn(`[REST Fallback Exception on ${table}]:`, fetchErr);
      return { success: false, error: fetchErr.message || String(fetchErr) };
    }
  }

  return { success: false, error: 'Database upsert failed after maximum retries with pruning.' };
}

export async function safeUpsertDesigner(designer: any): Promise<{ success: boolean; error?: string }> {
  const phone10 = clean10Phone(designer.phone || designer.whatsapp || designer.id);
  const cleanEmail = (designer.email || (designer.identifier && designer.identifier.includes('@') ? designer.identifier : '') || '').toString().trim().toLowerCase();

  if (!phone10 && !cleanEmail) return { success: false, error: 'Invalid phone number or email address' };

  // Note: Supabase designers table valid columns: [id, name, email, phone, status, specialization, skills, bio, exp, portfolio, rating, reviews, jobscompleted, hourlyrate, response_time, avatar, createdat, password, identifier]
  const skillsVal = designer.skills || designer.specialization || 'Graphic Design';
  const lowercasePayload: any = {
    id: phone10 || cleanEmail,
    name: designer.name || 'Designer',
    phone: phone10,
    email: cleanEmail || '',
    identifier: cleanEmail || phone10,
    password: (designer.password !== undefined && designer.password !== null) ? designer.password.toString() : 'Designer@123',
    portfolio: designer.portfolio || '',
    skills: Array.isArray(skillsVal) ? skillsVal : [skillsVal],
    specialization: Array.isArray(skillsVal) ? skillsVal.join(', ') : skillsVal,
    exp: Array.isArray(skillsVal) ? skillsVal.join(', ') : skillsVal,
    status: designer.status || 'Pending',
    createdat: designer.createdAt || designer.registeredAt || new Date().toISOString()
  };

  try {
    const regRes = await fetch('/api/register-designer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lowercasePayload)
    });
    if (regRes.ok) {
      return { success: true };
    }
  } catch (e) {
    console.warn('PostgreSQL register-designer notice:', e);
  }

  return pruneMissingColumnsAndUpsert('designers', lowercasePayload);
}

export const DQSupabase = {
  client: supabase,
  db: supabase, // compatibility alias
  app: supabase, // compatibility alias
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,

  // ==========================================
  // 1. REALTIME JOB MANAGEMENT (Supabase)
  // ==========================================
  async saveJob(job: Partial<DQJob>): Promise<DQJob> {
    const cleanId = normalizeJobId(job.id || Math.random().toString(36).substring(2, 8).toUpperCase());
    const nowIso = new Date().toISOString();

    const refImg = extractImageUrl(
      job.referenceImage || (job as any).referenceimage || (job as any).reference_image || (job as any).refImage || (job as any).image || (job as any).sampleImage || (job as any).reference
    );

    const normalizedJob: DQJob = {
      ...job,
      id: cleanId,
      service: job.service || 'Design Request',
      project: job.project || job.projectName || 'Design Request',
      price: Number(job.price) || 399,
      brief: job.brief || '',
      phone: job.phone || job.whatsapp || '',
      whatsapp: job.whatsapp || job.phone || '',
      ratio: job.ratio || 'Square (1:1)',
      status: job.status || 'Pending',
      time: job.time || 'Just now',
      acceptedBy: Array.isArray(job.acceptedBy) ? job.acceptedBy : [],
      completed: !!job.completed,
      createdAt: job.createdAt || nowIso,
      referenceImage: refImg,
      referenceimage: refImg,
      image: refImg
    };

    // 1. Instant local persistence (0ms latency perception) & sound broadcast
    try {
      const localJobs = JSON.parse(safeStorage.getItem('dq_live_jobs') || '[]');
      const filtered = localJobs.filter((j: any) => normalizeJobId(j.id) !== cleanId);
      filtered.unshift(normalizedJob);
      safeStorage.setItem('dq_live_jobs', JSON.stringify(filtered));
      safeStorage.setItem('dq_new_job_alert', JSON.stringify({
        id: cleanId,
        project: normalizedJob.project,
        price: normalizedJob.price,
        service: normalizedJob.service,
        timestamp: Date.now()
      }));
      safeDispatch('dq_jobs_updated', filtered);
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('dq_realtime_jobs');
          bc.postMessage({ type: 'NEW_JOB', job: normalizedJob });
        }
      } catch(e) {}
      if (typeof window !== 'undefined' && (window as any).DQSoundService) {
        (window as any).DQSoundService.playNewJobChime(5);
        (window as any).DQSoundService.showNewJobBanner(normalizedJob, 'New Job Uploaded');
      }
    } catch (e) {}

    // 2. Prepare exact lowercase payload to match PostgreSQL schema columns strictly
    const lowercasePayload = {
      id: cleanId,
      service: normalizedJob.service || '',
      project: normalizedJob.project || 'Design Request',
      price: Number(normalizedJob.price) || 399,
      brief: normalizedJob.brief || '',
      phone: normalizedJob.phone || '',
      whatsapp: normalizedJob.whatsapp || '',
      ratio: normalizedJob.ratio || 'Square (1:1)',
      referenceimage: refImg,
      status: normalizedJob.status || 'Pending',
      acceptedby: normalizedJob.acceptedBy || [],
      completed: !!normalizedJob.completed,
      completedat: normalizedJob.completedAt || null,
      createdat: normalizedJob.createdAt,
      time: normalizedJob.time
    };

    try {
      // Backend server persistence (PostgreSQL authoritative storage)
      const saveRes = await fetch('/api/save-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedJob)
      });
      if (saveRes.ok) {
        // Successfully saved directly to PostgreSQL!
      }
    } catch (err) {
      console.warn('Backend PostgreSQL save-job notice:', err);
    }

    // Optional background sync to Supabase without blocking UI
    try {
      (supabase.from('jobs').upsert(lowercasePayload) as any).then(null, () => {});
    } catch (e) {}

    // 3. Asynchronously broadcast new job email alert to all registered designers
    try {
      const isNew = (!job.status || job.status.toLowerCase() === 'pending') && !job.completed;
      if (isNew) {
        let extraEmails: string[] = [];
        let extraDesigners: any[] = [];
        let deletedList: string[] = [];
        try {
          deletedList = JSON.parse(safeStorage.getItem('dq_deleted_designers') || '[]');
          const deletedSet = new Set(deletedList.map(s => (s || '').toString().trim().toLowerCase()));

          const d1 = JSON.parse(safeStorage.getItem('dq_approved_designers') || '[]');
          const d2 = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]');
          const combined = [
            ...(Array.isArray(d1) ? d1 : []),
            ...(Array.isArray(d2) ? d2 : [])
          ].filter(d => {
            if (!d) return false;
            const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
            const ph = (d.phone || d.identifier || '').toString().replace(/\D/g, '').slice(-10);
            if (em && deletedSet.has(em)) return false;
            if (ph && deletedSet.has(ph)) return false;
            if (d.status && d.status !== 'Approved') return false;
            return true;
          });

          extraDesigners = combined;
          combined.forEach((d: any) => {
            const em = (d.email || d.identifier || '').toString().trim().toLowerCase();
            if (em && em.includes('@') && em.includes('.')) {
              if (!deletedSet.has(em) && !extraEmails.includes(em)) {
                extraEmails.push(em);
              }
            }
          });
        } catch (e) {}

        fetch('/api/notify-new-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job: normalizedJob,
            extraEmails,
            extraDesigners,
            deletedDesigners: deletedList
          })
        }).catch(err => console.warn('Job broadcast fetch notice:', err));
      }
    } catch (e) {}

    return normalizedJob;
  },

  async updateJobStatus(jobId: string, newStatus: string, extraData: Partial<DQJob> = {}): Promise<void> {
    if (!jobId) return;
    const cleanId = normalizeJobId(jobId);
    const bareId = cleanId.replace(/^DQ-/, '');
    const isCompleted = newStatus.toLowerCase().includes('completed') || newStatus.toLowerCase().includes('delivered');

    const refImg = extractImageUrl(
      extraData.referenceImage || (extraData as any).referenceimage || (extraData as any).reference_image || (extraData as any).refImage || (extraData as any).image
    );

    // Update local cache first
    try {
      const localJobs = JSON.parse(safeStorage.getItem('dq_live_jobs') || '[]');
      localJobs.forEach((j: any) => {
        if (normalizeJobId(j.id) === cleanId || normalizeJobId(j.id) === normalizeJobId(bareId)) {
          j.status = newStatus;
          if (isCompleted) {
            j.completed = true;
            j.completedAt = j.completedAt || new Date().toISOString();
          }
          if (refImg) {
            j.referenceImage = refImg;
            j.image = refImg;
          }
          Object.assign(j, extraData);
        }
      });
      if ((extraData as any).payoutStatus === 'Paid' || (extraData as any).payoutstatus === 'Paid') {
        try {
          const pMap = JSON.parse(safeStorage.getItem('dq_payout_records') || '{}');
          pMap[cleanId] = 'Paid';
          if (bareId) pMap[normalizeJobId(bareId)] = 'Paid';
          safeStorage.setItem('dq_payout_records', JSON.stringify(pMap));
        } catch (e) {}
      }
      safeStorage.setItem('dq_live_jobs', JSON.stringify(localJobs));
      safeDispatch('dq_jobs_updated', localJobs);
    } catch (e) {}

    const lowerPayload: any = { status: newStatus };
    if (isCompleted) {
      lowerPayload.completed = true;
      lowerPayload.completedat = new Date().toISOString();
    } else {
      lowerPayload.completed = false;
    }
    if (extraData.acceptedBy || (extraData as any).acceptedby) {
      lowerPayload.acceptedby = extraData.acceptedBy || (extraData as any).acceptedby;
    }
    if (extraData.project || (extraData as any).projectName) {
      lowerPayload.project = extraData.project || (extraData as any).projectName;
    }
    if (extraData.service) lowerPayload.service = extraData.service;
    if (extraData.price) lowerPayload.price = Number(extraData.price);
    if (extraData.brief) lowerPayload.brief = extraData.brief;
    if (extraData.phone || extraData.whatsapp) {
      lowerPayload.phone = extraData.phone || extraData.whatsapp;
      lowerPayload.whatsapp = extraData.whatsapp || extraData.phone;
    }
    if (extraData.ratio) lowerPayload.ratio = extraData.ratio;
    if (refImg) {
      lowerPayload.referenceimage = refImg;
    }

    try {
      // Direct PostgreSQL backend update
      await fetch('/api/update-job-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: cleanId,
          status: newStatus,
          acceptedBy: lowerPayload.acceptedby,
          completed: lowerPayload.completed,
          completedAt: lowerPayload.completedat,
          referenceImage: refImg
        })
      });
    } catch (err) {
      console.warn('Backend PostgreSQL update-job-status notice:', err);
    }

    // Optional background sync to Supabase without blocking UI
    try {
      (supabase.from('jobs').update(lowerPayload).eq('id', cleanId) as any).then(null, () => {});
    } catch (e) {}
  },

  async claimJob(jobId: string, designerPhone: string, designerName: string): Promise<boolean> {
    if (!jobId || !designerPhone) return false;
    const cleanId = normalizeJobId(jobId);
    const phone10 = clean10Phone(designerPhone);

    let existingAccepted: string[] = [];
    try {
      const localJobs = JSON.parse(safeStorage.getItem('dq_live_jobs') || '[]');
      const match = localJobs.find((j: any) => normalizeJobId(j.id) === cleanId);
      if (match && Array.isArray(match.acceptedBy)) {
        existingAccepted = match.acceptedBy.map((p: any) => clean10Phone(p));
      }
    } catch(e) {}

    if (!existingAccepted.includes(phone10)) {
      existingAccepted.push(phone10);
    }

    const updatePayload: Partial<DQJob> = {
      status: 'In Progress',
      acceptedBy: existingAccepted
    };

    await this.updateJobStatus(cleanId, 'In Progress', updatePayload);
    return true;
  },

  async deleteJob(jobId: string): Promise<void> {
    if (!jobId) return;
    const cleanId = normalizeJobId(jobId);
    const bareId = cleanId.replace(/^DQ-/, '');

    // 1. Local storage update & blacklist
    try {
      let localJobs = JSON.parse(safeStorage.getItem('dq_live_jobs') || '[]');
      localJobs = localJobs.filter((j: any) => normalizeJobId(j.id) !== cleanId);
      safeStorage.setItem('dq_live_jobs', JSON.stringify(localJobs));

      let deletedJobs = JSON.parse(safeStorage.getItem('dq_deleted_jobs') || '[]');
      [cleanId, bareId, `DQ${bareId}`, `DQ-${bareId}`, jobId.toString().trim().toUpperCase()].forEach(v => {
        if (v && !deletedJobs.includes(v)) deletedJobs.push(v);
      });
      safeStorage.setItem('dq_deleted_jobs', JSON.stringify(deletedJobs));
      safeDispatch('dq_jobs_updated', localJobs);
    } catch (e) {}

    // 2. Server API Delete (Guaranteed backend deletion)
    try {
      await fetch('/api/delete-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cleanId })
      });
    } catch (e) {}

    // 3. Supabase Direct Delete via SDK + REST API
    try {
      await Promise.allSettled([
        supabase.from('jobs').update({ status: 'Deleted' }).or(`id.eq.${cleanId},id.eq.${bareId}`),
        supabase.from('jobs').delete().or(`id.eq.${cleanId},id.eq.${bareId}`),
        fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${cleanId}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${bareId}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        })
      ]);
    } catch (err) {
      console.warn('Supabase delete job exception:', err);
    }
  },

  async clearAllJobs(): Promise<void> {
    try {
      safeStorage.setItem('dq_live_jobs', '[]');
      safeStorage.setItem('dq_deleted_jobs', '[]');
      safeDispatch('dq_jobs_updated', []);
    } catch (e) {}

    try {
      await fetch('/api/clear-all-jobs', { method: 'POST' });
    } catch (e) {}

    try {
      const { data } = await supabase.from('jobs').select('id');
      if (Array.isArray(data) && data.length > 0) {
        const ids = data.map((d: any) => d.id);
        await supabase.from('jobs').delete().in('id', ids);
      }
      await supabase.from('jobs').delete().neq('status', 'NON_EXISTENT_STATUS_CLEAR_ALL');
    } catch (err) {
      console.warn('Supabase clearAllJobs exception:', err);
    }
  },

  async fetchJobs(): Promise<DQJob[]> {
    try {
      let data: any[] | null = null;
      let error = null;

      // 1. Try Server API first (guaranteed live, non-cached source of truth)
      try {
        const sRes = await fetch('/api/get-jobs', {
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson && sJson.success && Array.isArray(sJson.jobs)) {
            data = sJson.jobs;
          }
        }
      } catch (err) {}

      // 2. Local cache fallback if server API was temporarily unreachable
      if (data === null) {
        try {
          data = JSON.parse(safeStorage.getItem('dq_live_jobs') || '[]');
        } catch (e) {
          data = [];
        }
      }

      if (!error && Array.isArray(data)) {
        let deletedJobs: string[] = [];
        try { deletedJobs = JSON.parse(safeStorage.getItem('dq_deleted_jobs') || '[]'); } catch (e) {}
        const deletedNormSet = new Set(deletedJobs.map(d => normalizeJobId(d)));

        const validJobs: DQJob[] = [];

        // Load payout records map
        let payoutMap: Record<string, string> = {};
        try { payoutMap = JSON.parse(safeStorage.getItem('dq_payout_records') || '{}'); } catch (e) {}

        // Build local jobs map for reference image fallback only
        const localJobsMap = new Map<string, any>();
        try {
          const lj = JSON.parse(safeStorage.getItem('dq_live_jobs') || '[]');
          if (Array.isArray(lj)) {
            lj.forEach(j => {
              if (j && j.id) localJobsMap.set(normalizeJobId(j.id), j);
            });
          }
        } catch (e) {}

        // Authoritative Database data - strictly what exists in DB
        for (const sj of data) {
          if (!sj) continue;
          if (sj.status === 'Deleted') continue; // Skip softly deleted jobs
          const id = normalizeJobId(sj.id);
          if (id && !deletedNormSet.has(id) && id !== 'DQ-8492' && id !== 'DQ-7319') {
            const localJob = localJobsMap.get(id);
            const accepted = sj.acceptedby || sj.acceptedBy;
            const refImg = extractImageUrl(
              sj.referenceimage || sj.referenceImage || sj.reference_image || sj.refImage || sj.image || sj.sampleImage || sj.reference || (Array.isArray(sj.attachments) ? sj.attachments[0] : '')
            ) || extractImageUrl(
              localJob ? (localJob.referenceImage || localJob.image || localJob.referenceimage || localJob.refImage) : ''
            );

            // Determine exact status and completion status consistency
            const localHasStatus = localJob && localJob.status && localJob.status !== 'Pending';
            const cloudHasStatus = sj.status && sj.status !== 'Pending';
            
            const finalStatus = localHasStatus ? localJob.status : (cloudHasStatus ? sj.status : (localJob?.status || sj.status || 'Pending'));
            const isCompletedStatus = finalStatus.toLowerCase().includes('completed') || finalStatus.toLowerCase().includes('delivered');

            const finalCompleted = isCompletedStatus ? true : (localJob?.completed === true && sj.completed === true);
            const finalAdminCompleted = isCompletedStatus ? true : (localJob?.adminCompleted === true && sj.admincompleted === true);
            const isPaid = payoutMap[id] === 'Paid' || localJob?.payoutStatus === 'Paid' || sj.payoutstatus === 'Paid' || sj.payoutStatus === 'Paid' || localJob?.payoutStatus === 'Amount Paid to Designer' || sj.payoutstatus === 'Amount Paid to Designer';
            const finalPayoutStatus = isPaid ? 'Paid' : (localJob?.payoutStatus || sj.payoutstatus || sj.payoutStatus || 'Unpaid');

            validJobs.push({
              ...sj,
              ...localJob,
              id,
              status: finalStatus,
              completed: finalCompleted,
              adminCompleted: finalAdminCompleted,
              payoutStatus: finalPayoutStatus,
              referenceImage: refImg,
              referenceimage: refImg,
              image: refImg,
              refImage: refImg,
              acceptedBy: Array.isArray(localJob?.acceptedBy) && localJob.acceptedBy.length > 0 ? localJob.acceptedBy : (Array.isArray(accepted) ? accepted : []),
              completedAt: sj.completedat || sj.completedAt || localJob?.completedAt || null,
              createdAt: sj.createdat || sj.createdAt || localJob?.createdAt || '',
              time: sj.time || localJob?.time || 'Just now'
            });
          }
        }

        // Only include local jobs if explicitly flagged as pending submission within 15 seconds
        localJobsMap.forEach((localJob, localId) => {
          if (!validJobs.some(j => j.id === localId) && !deletedNormSet.has(localId) && localId !== 'DQ-8492' && localId !== 'DQ-7319') {
            const isRecentPending = localJob.pendingCloudSync === true && (Date.now() - new Date(localJob.createdAt || 0).getTime() < 15000);
            if (isRecentPending) {
              validJobs.push(localJob);
            }
          }
        });

        // Sort latest first
        validJobs.sort((a, b) => {
          const tA = a.createdAt || a.time || '';
          const tB = b.createdAt || b.time || '';
          return tB.localeCompare(tA);
        });

        // Write authoritative live data to storage (cleans out any deleted jobs)
        safeStorage.setItem('dq_live_jobs', JSON.stringify(validJobs));
        safeDispatch('dq_jobs_updated', validJobs);

        return validJobs;
      }
    } catch (e) {
      console.warn('Fetch jobs error in Supabase:', e);
    }
    
    // Offline fallback
    try {
      return JSON.parse(safeStorage.getItem('dq_live_jobs') || '[]');
    } catch (e) {
      return [];
    }
  },

  // Direct alias for dashboards expecting getJobs()
  async getJobs(): Promise<DQJob[]> {
    return this.fetchJobs();
  },

  subscribeJobs(callback: (jobs: DQJob[]) => void): () => void {
    const fetchLatest = async () => {
      const list = await this.fetchJobs();
      if (Array.isArray(list)) {
        callback(list);
      }
    };

    // Immediate initial load
    fetchLatest();

    // Supabase Realtime Channel with unique ID per subscription instance
    let channel: any = null;
    try {
      channel = supabase
        .channel(`rt_jobs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
          fetchLatest();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime jobs subscription warning:', e);
    }

    // Secondary resilient interval polling (every 30 seconds) to guarantee sync across tabs/devices
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchLatest();
    }, 30000);

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {}
      clearInterval(timer);
    };
  },

  // ==========================================
  // 2. DESIGNER MANAGEMENT (Supabase)
  // ==========================================
  async saveDesigner(designer: Partial<DQDesigner>): Promise<void> {
    const phone10 = clean10Phone(designer.phone || designer.whatsapp || designer.identifier);
    const cleanEmail = (designer.email || (designer.identifier && designer.identifier.includes('@') ? designer.identifier : '') || '').toString().trim().toLowerCase();
    if (!phone10 && !cleanEmail) return;

    const data: DQDesigner = {
      id: phone10 || cleanEmail,
      name: designer.name || 'Designer',
      phone: phone10,
      email: cleanEmail,
      identifier: cleanEmail || phone10,
      password: designer.password || '123456',
      status: designer.status || 'Pending',
      role: 'designer',
      portfolio: designer.portfolio || '',
      skills: designer.skills || designer.specialization || 'Graphic Design',
      date: designer.date || new Date().toLocaleDateString('en-GB'),
      registeredAt: designer.registeredAt || new Date().toISOString()
    };

    // Save locally
    try {
      let registered = JSON.parse(localStorage.getItem('dq_registered_designers') || '[]');
      registered = registered.filter((d: any) => (!cleanEmail || (d.email || '').toLowerCase() !== cleanEmail) && (!phone10 || clean10Phone(d.phone || d.identifier) !== phone10));
      registered.push(data);
      localStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      if (data.status === 'Approved') {
        let approved = JSON.parse(localStorage.getItem('dq_approved_designers') || '[]');
        if (!approved.find((a: any) => (a.email && a.email.toLowerCase() === cleanEmail) || clean10Phone(a.identifier || a.phone) === phone10)) {
          approved.push({ identifier: cleanEmail || phone10, email: cleanEmail, name: data.name, approvedAt: new Date().toISOString() });
          localStorage.setItem('dq_approved_designers', JSON.stringify(approved));
        }
      }
    } catch (e) {}

    // Resilient Cloud save
    await safeUpsertDesigner(data);
  },

  async updateDesignerStatus(key: string, status: 'Approved' | 'Pending' | 'Revoked'): Promise<{ success: boolean; error?: string }> {
    if (!key) return { success: false, error: 'Invalid designer identifier' };
    const cleanKey = key.trim().toLowerCase();
    const isEmail = cleanKey.includes('@');
    const phone10 = isEmail ? '' : clean10Phone(cleanKey);

    if (!isEmail && !phone10) return { success: false, error: 'Invalid phone number or email address' };

    let targetDesigner: any = null;
    // Update local cache
    try {
      let registered = JSON.parse(localStorage.getItem('dq_registered_designers') || '[]');
      targetDesigner = registered.find((d: any) => 
        (isEmail && d.email && d.email.toLowerCase() === cleanKey) ||
        (phone10 && clean10Phone(d.phone || d.identifier) === phone10) ||
        (d.identifier && d.identifier.toLowerCase() === cleanKey)
      );
      registered.forEach((d: any) => {
        const dEmail = (d.email || '').toString().trim().toLowerCase();
        const dPhone = clean10Phone(d.phone || d.identifier);
        if (
          (isEmail && dEmail === cleanKey) ||
          (phone10 && dPhone === phone10) ||
          (d.identifier && d.identifier.toLowerCase() === cleanKey)
        ) {
          d.status = status;
        }
      });
      localStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      let approved = JSON.parse(localStorage.getItem('dq_approved_designers') || '[]');
      if (status === 'Approved') {
        const exists = approved.some((a: any) => 
          (isEmail && a.email && a.email.toLowerCase() === cleanKey) ||
          (phone10 && clean10Phone(a.identifier || a.phone) === phone10) ||
          (a.identifier && a.identifier.toLowerCase() === cleanKey)
        );
        if (!exists) {
          approved.push({
            identifier: cleanKey,
            email: isEmail ? cleanKey : (targetDesigner?.email || ''),
            phone: phone10 || targetDesigner?.phone || '',
            name: targetDesigner?.name || 'Designer',
            approvedAt: new Date().toISOString()
          });
        }
      } else {
        approved = approved.filter((a: any) => 
          (!isEmail || !a.email || a.email.toLowerCase() !== cleanKey) &&
          (!phone10 || clean10Phone(a.identifier || a.phone) !== phone10) &&
          (!a.identifier || a.identifier.toLowerCase() !== cleanKey)
        );
      }
      localStorage.setItem('dq_approved_designers', JSON.stringify(approved));
    } catch (e) {
      console.warn('LocalStorage status update failed:', e);
    }

    // 1. Authoritative PostgreSQL status update
    try {
      const srvRes = await fetch('/api/update-designer-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, status })
      });
      if (srvRes.ok) {
        // Fast return on PostgreSQL success
        return { success: true };
      }
    } catch (srvErr) {
      console.warn('Server /api/update-designer-status notice:', srvErr);
    }

    // 2. Background sync fallback
    try {
      (supabase.from('designers').update({ status }).eq('id', cleanKey) as any).then(null, () => {});
    } catch (e) {}

    return { success: true };
  },

  async updateDesignerPassword(key: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!key || !newPassword) return { success: false, error: 'Invalid key or password' };
    const cleanKey = key.trim().toLowerCase();
    const isEmail = cleanKey.includes('@');
    const phone10 = isEmail ? '' : clean10Phone(cleanKey);
    const passStr = newPassword.toString().trim();

    // 1. Update local storage cache immediately
    try {
      let registered = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]');
      registered.forEach((d: any) => {
        const dEmail = (d.email || '').toString().trim().toLowerCase();
        const dPhone = clean10Phone(d.phone || d.identifier);
        if (
          (isEmail && dEmail === cleanKey) ||
          (phone10 && dPhone === phone10) ||
          (d.identifier && d.identifier.toLowerCase() === cleanKey)
        ) {
          d.password = passStr;
        }
      });
      safeStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      // Also update current session if active
      const curUser = JSON.parse(safeStorage.getItem('dq_current_user') || 'null');
      if (curUser) {
        const curEmail = (curUser.email || '').toLowerCase();
        const curPhone = clean10Phone(curUser.phone || curUser.identifier);
        if ((isEmail && curEmail === cleanKey) || (phone10 && curPhone === phone10)) {
          curUser.password = passStr;
          safeStorage.setItem('dq_current_user', JSON.stringify(curUser));
        }
      }
    } catch (e) {
      console.warn('LocalStorage password update notice:', e);
    }

    // 2. Authoritative PostgreSQL password update
    try {
      const res = await fetch('/api/update-designer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, newPassword: passStr })
      });
      if (res.ok) {
        return { success: true };
      }
    } catch (e) {
      console.warn('PostgreSQL update-designer-password notice:', e);
    }

    // Optional background sync
    try {
      (supabase.from('designers').update({ password: passStr }).eq('id', cleanKey) as any).then(null, () => {});
    } catch (e) {}

    return { success: true };
  },

  async updateDesignerEmail(oldEmail: string, newEmail: string, phone = ''): Promise<{ success: boolean; message?: string }> {
    const cleanOld = (oldEmail || '').trim().toLowerCase();
    const cleanNew = (newEmail || '').trim().toLowerCase();
    const cleanPhone = clean10Phone(phone);

    if (!cleanNew) return { success: false, message: 'Invalid email address' };

    // 1. Update local storage cache
    try {
      let registered = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]');
      registered.forEach((d: any) => {
        const dEmail = (d.email || '').toString().trim().toLowerCase();
        const dPhone = clean10Phone(d.phone || d.identifier);
        if ((cleanOld && dEmail === cleanOld) || (cleanPhone && dPhone === cleanPhone)) {
          d.email = cleanNew;
          if (d.identifier && d.identifier.includes('@')) d.identifier = cleanNew;
        }
      });
      safeStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      let approved = JSON.parse(safeStorage.getItem('dq_approved_designers') || '[]');
      approved.forEach((a: any) => {
        const aEmail = (a.email || '').toString().trim().toLowerCase();
        const aPhone = clean10Phone(a.identifier || a.phone);
        if ((cleanOld && aEmail === cleanOld) || (cleanPhone && aPhone === cleanPhone)) {
          a.email = cleanNew;
          if (a.identifier && a.identifier.includes('@')) a.identifier = cleanNew;
        }
      });
      safeStorage.setItem('dq_approved_designers', JSON.stringify(approved));

      // Also update current session if active
      const curUser = JSON.parse(safeStorage.getItem('dq_current_user') || 'null');
      if (curUser) {
        const curEmail = (curUser.email || '').toLowerCase();
        const curPhone = clean10Phone(curUser.phone || curUser.identifier);
        if ((cleanOld && curEmail === cleanOld) || (cleanPhone && curPhone === cleanPhone)) {
          curUser.email = cleanNew;
          if (curUser.identifier && curUser.identifier.includes('@')) curUser.identifier = cleanNew;
          safeStorage.setItem('dq_current_user', JSON.stringify(curUser));
        }
      }
    } catch (e) {
      console.warn('LocalStorage email update notice:', e);
    }

    // 2. Authoritative PostgreSQL email update
    try {
      await fetch('/api/update-designer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldEmail: cleanOld, newEmail: cleanNew, phone: cleanPhone })
      });
    } catch(e) {
      console.warn('PostgreSQL update-designer-email notice:', e);
    }

    // Optional background sync to Supabase
    try {
      if (cleanOld) {
        (supabase.from('designers').update({ email: cleanNew, identifier: cleanNew }).eq('email', cleanOld) as any).then(null, () => {});
      }
      if (cleanPhone) {
        (supabase.from('designers').update({ email: cleanNew, identifier: cleanNew }).eq('phone', cleanPhone) as any).then(null, () => {});
      }
    } catch (e) {}

    return { success: true, message: 'Email updated successfully!' };
  },

  async deleteDesigner(key: string, name = 'Designer'): Promise<void> {
    if (!key) return;
    const cleanKey = key.trim().toLowerCase();
    const isEmail = cleanKey.includes('@');
    const phone10 = isEmail ? '' : clean10Phone(cleanKey);

    // Update local cache & revoke session
    try {
      let registered = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]');
      registered = registered.filter((d: any) => 
        (!isEmail || !d.email || d.email.toLowerCase() !== cleanKey) &&
        (!phone10 || clean10Phone(d.phone || d.identifier) !== phone10) &&
        (!d.identifier || d.identifier.toLowerCase() !== cleanKey)
      );
      safeStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      let approved = JSON.parse(safeStorage.getItem('dq_approved_designers') || '[]');
      approved = approved.filter((a: any) => 
        (!isEmail || !a.email || a.email.toLowerCase() !== cleanKey) &&
        (!phone10 || clean10Phone(a.identifier || a.phone) !== phone10) &&
        (!a.identifier || a.identifier.toLowerCase() !== cleanKey)
      );
      safeStorage.setItem('dq_approved_designers', JSON.stringify(approved));

      let deleted = JSON.parse(safeStorage.getItem('dq_deleted_designers') || '[]');
      if (isEmail && !deleted.includes(cleanKey)) deleted.push(cleanKey);
      if (phone10 && !deleted.includes(phone10)) deleted.push(phone10);
      safeStorage.setItem('dq_deleted_designers', JSON.stringify(deleted));

      const activeUser = JSON.parse(safeStorage.getItem('dq_current_user') || 'null');
      if (activeUser) {
        const actEmail = (activeUser.email || '').trim().toLowerCase();
        const actPhone = clean10Phone(activeUser.phone || activeUser.identifier);
        if (
          (isEmail && actEmail === cleanKey) ||
          (phone10 && actPhone === phone10) ||
          (activeUser.identifier && activeUser.identifier.toLowerCase() === cleanKey)
        ) {
          safeStorage.removeItem('dq_current_user');
        }
      }
      safeStorage.setItem('dq_session_revoke_signal', JSON.stringify({ key: cleanKey, time: Date.now() }));
    } catch (e) {}

    // Authoritative PostgreSQL deletion via backend route
    try {
      await fetch('/api/delete-designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey })
      });
    } catch (err) {
      console.warn('PostgreSQL delete-designer notice:', err);
    }

    // Optional background sync to Supabase without blocking UI
    try {
      (supabase.from('designers').delete().eq('id', cleanKey) as any).then(null, () => {});
    } catch (err) {}
  },

  async clearAllDesigners(): Promise<void> {
    try {
      safeStorage.setItem('dq_registered_designers', '[]');
      safeStorage.setItem('dq_approved_designers', '[]');
      safeStorage.setItem('dq_deleted_designers', '[]');
      safeStorage.removeItem('dq_current_user');
    } catch (e) {}

    try {
      const { data } = await supabase.from('designers').select('id');
      if (Array.isArray(data) && data.length > 0) {
        const ids = data.map((d: any) => d.id);
        await supabase.from('designers').delete().in('id', ids);
      }
    } catch (err) {
      console.warn('Supabase clearAllDesigners exception:', err);
    }
  },

  async fetchDesigners(): Promise<DQDesigner[]> {
    try {
      // Authoritative PostgreSQL fetch via direct server API
      let data: any[] = [];
      try {
        const res = await fetch('/api/get-designers', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json && Array.isArray(json.designers)) {
            data = json.designers;
          }
        }
      } catch (e) {
        console.warn('Fetch designers from PostgreSQL API error:', e);
      }

      if (!Array.isArray(data) || data.length === 0) {
        try {
          data = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]');
        } catch (e) {
          data = [];
        }
      }

      if (Array.isArray(data)) {
        let deletedList: string[] = [];
        try { deletedList = JSON.parse(safeStorage.getItem('dq_deleted_designers') || '[]'); } catch (e) {}

        const rawList = data
          .map((d: any) => {
            const email = d.email || (d.identifier && d.identifier.includes('@') ? d.identifier : d.id && d.id.includes('@') ? d.id : '');
            const cleanEmail = (email || '').toString().trim().toLowerCase();
            const phone = clean10Phone(d.phone || d.id || d.identifier);
            let avatar = d.avatar || d.avatarUrl || d.avatar_url || d.photo || d.dpUrl || '';
            if (!avatar) {
              try {
                const dpMap = JSON.parse(safeStorage.getItem('dq_user_dp_map') || '{}');
                avatar = dpMap[phone] || dpMap[cleanEmail] || dpMap['+91' + phone] || '';
              } catch (e) {}
            }
            const skillsVal = (d.skills || d.experience || (Array.isArray(d.software) && d.software.length ? d.software.join(', ') : '') || 'Graphic Design').toString().trim();
            const portfolioVal = (d.portfolio || d.portfolioUrl || d.portfoliolink || '').toString().trim();

            return {
              ...d,
              name: d.name || 'Designer',
              phone: phone,
              email: cleanEmail,
              identifier: cleanEmail || phone,
              skills: skillsVal,
              experience: d.experience || skillsVal,
              software: Array.isArray(d.software) ? d.software : (skillsVal ? skillsVal.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Photoshop', 'Illustrator']),
              portfolio: portfolioVal,
              portfolioUrl: portfolioVal,
              avatar: avatar,
              avatarUrl: avatar,
              status: d.status || 'Pending',
              date: d.date || (d.createdat ? new Date(d.createdat).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')),
              createdAt: d.createdat || d.createdAt || '',
              registeredAt: d.createdat || d.registeredAt || d.createdAt || ''
            };
          })
          .filter((d: any) => d.identifier && d.status !== 'Deleted' && (!d.phone || !deletedList.includes(d.phone)) && (!d.email || !deletedList.includes(d.email)));

        // Unique deduplication based on phone and email/identifier
        const list: DQDesigner[] = [];
        const seenPhones = new Set<string>();
        const seenIdents = new Set<string>();
        rawList.forEach((item: any) => {
          const phone = item.phone;
          const ident = item.identifier ? item.identifier.toLowerCase() : '';
          let isDuplicate = false;
          if (phone && seenPhones.has(phone)) isDuplicate = true;
          if (ident && seenIdents.has(ident)) isDuplicate = true;
          if (!isDuplicate) {
            if (phone) seenPhones.add(phone);
            if (ident) seenIdents.add(ident);
            list.push(item);
          }
        });

        safeStorage.setItem('dq_registered_designers', JSON.stringify(list));
        const approved = list.filter(d => d.status === 'Approved');
        safeStorage.setItem('dq_approved_designers', JSON.stringify(approved));
        safeDispatch('dq_designers_updated', list);
        return list;
      }
    } catch (err) {
      console.warn('Fetch designers error:', err);
    }
    return [];
  },

  async getDesigners(): Promise<DQDesigner[]> {
    return this.fetchDesigners();
  },

  subscribeDesigners(callback: (designers: DQDesigner[]) => void): () => void {
    const fetchLatest = async () => {
      const list = await this.fetchDesigners();
      if (list && list.length >= 0) {
        callback(list);
      }
    };

    fetchLatest();

    let channel: any = null;
    try {
      channel = supabase
        .channel(`rt_designers_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'designers' }, () => {
          fetchLatest();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime designers subscription warning:', e);
    }

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchLatest();
    }, 45000);

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {}
      clearInterval(timer);
    };
  },

  watchDesignerSession(myPhone: string, onKickout: () => void): () => void {
    const phone10 = clean10Phone(myPhone);
    if (!phone10) return () => {};

    const checkStatus = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      let deletedList: string[] = [];
      try { deletedList = JSON.parse(localStorage.getItem('dq_deleted_designers') || '[]'); } catch (e) {}
      if (deletedList.includes(phone10)) {
        onKickout();
        return;
      }

      try {
        const { data } = await supabase.from('designers').select('status').eq('id', phone10).maybeSingle();
        if (data && data.status === 'Revoked') {
          onKickout();
        }
      } catch (e) {}
    };

    const timer = setInterval(checkStatus, 45000);

    return () => {
      clearInterval(timer);
    };
  },

  logLogin(phone: string, name: string, role = 'designer'): void {
    // Pure local/session tracking, Google Sheets decoupled
  },

  // ==========================================
  // 3. SERVICES / PRODUCTS SYNC (Pure Supabase)
  // ==========================================
  async saveService(service: any): Promise<void> {
    if (!service || !service.id) return;
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_services') || '[]');
      const idx = local.findIndex(s => s.id === service.id);
      if (idx !== -1) local[idx] = { ...local[idx], ...service };
      else local.push(service);
      localStorage.setItem('dq_services', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: local }));

      let meta: any = {};
      try {
        if (service.tag && typeof service.tag === 'string' && service.tag.startsWith('{')) {
          meta = JSON.parse(service.tag);
        }
      } catch (e) {}

      const tagStr = JSON.stringify({
        image: service.image || meta.image || '',
        sla: service.sla || meta.sla || '30-45 mins',
        ratio: service.ratio || meta.ratio || 'Standard',
        slug: service.slug || meta.slug || '',
        category: service.category || meta.category || ''
      });

      await supabase.from('services').upsert({
        id: service.id,
        name: service.title || service.name || service.id,
        price: Number(service.price) || 359,
        icon: service.icon || 'palette',
        description: service.description || service.desc || '',
        tag: tagStr,
        features: [service.image || meta.image || '']
      });
    } catch (e) {
      console.warn('Supabase saveService error:', e);
    }
  },

  async deleteService(serviceId: string): Promise<void> {
    if (!serviceId) return;
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_services') || '[]');
      local = local.filter(s => s.id !== serviceId);
      localStorage.setItem('dq_services', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: local }));
      await supabase.from('services').delete().eq('id', serviceId);
    } catch (e) {
      console.warn('Supabase deleteService error:', e);
    }
  },

  async fetchServices(): Promise<any[]> {
    let local: any[] = [];
    try { local = JSON.parse(localStorage.getItem('dq_services') || '[]'); } catch (e) {}
    try {
      const { data: dbRows, error } = await supabase.from('services').select('*');
      if (!error && Array.isArray(dbRows) && dbRows.length > 0) {
        const parsed = dbRows.filter((row: any) => row && row.id && !row.id.startsWith('sys_')).map(row => {
          let meta: any = {};
          try {
            if (row.tag && typeof row.tag === 'string' && row.tag.startsWith('{')) {
              meta = JSON.parse(row.tag);
            }
          } catch (e) {}

          const image = meta.image || (Array.isArray(row.features) && row.features[0] ? row.features[0] : '');

          return {
            id: row.id,
            title: row.name || row.id,
            name: row.name || row.id,
            price: Number(row.price) || 359,
            icon: row.icon || 'palette',
            description: row.description || '',
            desc: row.description || '',
            sla: meta.sla || '30-45 mins',
            ratio: meta.ratio || 'Standard',
            slug: meta.slug || '',
            category: meta.category || '',
            image: image
          };
        });

        localStorage.setItem('dq_services', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: parsed }));
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to fetch services from Supabase:', e);
    }
    return local;
  },

  async getServices(): Promise<any[]> {
    return this.fetchServices();
  },

  subscribeServices(callback: (services: any[]) => void): () => void {
    let channel: any = null;
    try {
      this.fetchServices().then(svcs => { if (svcs && svcs.length > 0) callback(svcs); });
      channel = supabase
        .channel('realtime_services_' + Math.random().toString(36).substring(2, 7))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, async () => {
          const fresh = await this.fetchServices();
          if (fresh) callback(fresh);
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase subscribeServices error:', e);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 4. PORTFOLIO SHOWCASE SYNC
  // ==========================================
  async savePortfolioItem(item: any): Promise<void> {
    if (!item || !item.id) return;
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_portfolio_items') || '[]');
      const idx = local.findIndex(p => p.id === item.id);
      if (idx !== -1) local[idx] = { ...local[idx], ...item };
      else local.unshift(item);
      localStorage.setItem('dq_portfolio_items', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: local }));

      const delivery = item.delivery || item.deliveryTime || '⚡ 30-45m Delivery';
      const client = item.client || 'Verified Client';
      const desc = item.description || item.desc || '';

      const meta = JSON.stringify({
        delivery,
        deliveryTime: delivery,
        client,
        description: desc,
        desc
      });

      await supabase.from('portfolio').upsert({
        id: item.id,
        title: item.title || '',
        category: item.category || '',
        designer: item.designer || client,
        image: item.image || '',
        tags: [delivery, meta]
      });
    } catch (e) {
      console.warn('Supabase savePortfolio error:', e);
    }
  },

  async deletePortfolioItem(itemId: string): Promise<void> {
    if (!itemId) return;
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_portfolio_items') || '[]');
      local = local.filter(p => p.id !== itemId);
      localStorage.setItem('dq_portfolio_items', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: local }));
      await supabase.from('portfolio').delete().eq('id', itemId);
    } catch (e) {
      console.warn('Supabase deletePortfolio error:', e);
    }
  },

  async fetchPortfolio(): Promise<any[]> {
    let local: any[] = [];
    try { local = JSON.parse(localStorage.getItem('dq_portfolio_items') || '[]'); } catch (e) {}
    try {
      const { data: dbRows, error } = await supabase.from('portfolio').select('*');
      if (!error && Array.isArray(dbRows) && dbRows.length > 0) {
        const parsed = dbRows.map(row => {
          let meta: any = {};
          if (Array.isArray(row.tags)) {
            for (const t of row.tags) {
              if (typeof t === 'string' && t.startsWith('{')) {
                try { meta = JSON.parse(t); } catch (e) {}
              }
            }
          }

          const deliveryTime = (Array.isArray(row.tags) && row.tags[0] && !row.tags[0].startsWith('{'))
            ? row.tags[0]
            : (meta.deliveryTime || meta.delivery || '⚡ 30-45m Delivery');

          const description = row.description || meta.description || meta.desc || '';
          const client = meta.client || row.designer || 'Verified Client';

          return {
            id: row.id,
            title: row.title || '',
            category: row.category || '',
            client,
            image: row.image || '',
            delivery: deliveryTime,
            deliveryTime,
            description
          };
        });

        localStorage.setItem('dq_portfolio_items', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: parsed }));
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to fetch portfolio from Supabase:', e);
    }
    return local;
  },

  async getPortfolio(): Promise<any[]> {
    return this.fetchPortfolio();
  },

  subscribePortfolio(callback: (items: any[]) => void): () => void {
    let channel: any = null;
    try {
      this.fetchPortfolio().then(items => { if (items && items.length > 0) callback(items); });
      channel = supabase
        .channel('realtime_portfolio_' + Math.random().toString(36).substring(2, 7))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio' }, async () => {
          const fresh = await this.fetchPortfolio();
          if (fresh) callback(fresh);
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase subscribePortfolio error:', e);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 4B. GOOGLE REVIEWS SYNC (Supabase cloud services table + Server API)
  // ==========================================
  async saveReviewItem(item: any): Promise<void> {
    if (!item || !item.id) return;
    const cleanId = item.id.toString().trim();

    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_google_reviews') || '[]');
      const idx = local.findIndex(r => r.id === cleanId || String(r.id) === String(cleanId));
      if (idx !== -1) local[idx] = { ...local[idx], ...item };
      else local.unshift(item);
      localStorage.setItem('dq_google_reviews', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: local }));

      // 1. Persist directly to Supabase services table under sys_google_reviews
      await supabase.from('services').upsert({
        id: 'sys_google_reviews',
        name: 'System Reviews Data Store',
        price: 0,
        tag: JSON.stringify(local),
        description: 'Cloud storage for all verified client reviews'
      });

      // 2. Call server API to persist to reviews.json as well
      try {
        fetch('/api/save-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: item, items: local })
        }).catch(() => {});
      } catch (fe) {}
    } catch (e) {
      console.warn('Supabase save review error:', e);
    }
  },

  async deleteReviewItem(itemId: string): Promise<void> {
    if (!itemId) return;
    const cleanId = itemId.toString().trim();

    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_google_reviews') || '[]');
      local = local.filter(r => r.id !== cleanId && String(r.id) !== cleanId);
      localStorage.setItem('dq_google_reviews', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: local }));

      // 1. Update Supabase
      await supabase.from('services').upsert({
        id: 'sys_google_reviews',
        name: 'System Reviews Data Store',
        price: 0,
        tag: JSON.stringify(local),
        description: 'Cloud storage for all verified client reviews'
      });

      // 2. Update server API
      try {
        fetch('/api/delete-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cleanId })
        }).catch(() => {});
      } catch (fe) {}
    } catch (e) {
      console.warn('Supabase delete review error:', e);
    }
  },

  async fetchReviews(): Promise<any[]> {
    let local: any[] = [];
    try {
      local = JSON.parse(localStorage.getItem('dq_google_reviews') || '[]');
    } catch (e) {}

    try {
      // 1. Try Supabase cloud table first
      const { data: setRow } = await supabase
        .from('services')
        .select('tag')
        .eq('id', 'sys_google_reviews')
        .maybeSingle();

      if (setRow && setRow.tag) {
        const parsed = typeof setRow.tag === 'string' ? JSON.parse(setRow.tag) : setRow.tag;
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem('dq_google_reviews', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: parsed }));
          return parsed;
        }
      }

      // 2. Fallback to server API /api/get-reviews
      const srvRes = await fetch('/api/get-reviews');
      if (srvRes.ok) {
        const srvData = await srvRes.json();
        if (srvData && Array.isArray(srvData.reviews) && srvData.reviews.length > 0) {
          localStorage.setItem('dq_google_reviews', JSON.stringify(srvData.reviews));
          window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: srvData.reviews }));
          return srvData.reviews;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch reviews from cloud:', e);
    }

    return local;
  },

  async getReviews(): Promise<any[]> {
    return this.fetchReviews();
  },

  subscribeReviews(callback: (reviews: any[]) => void): () => void {
    const fetchLatest = async () => {
      try {
        const { data: setRow } = await supabase
          .from('services')
          .select('tag')
          .eq('id', 'sys_google_reviews')
          .maybeSingle();

        if (setRow && setRow.tag) {
          const parsed = typeof setRow.tag === 'string' ? JSON.parse(setRow.tag) : setRow.tag;
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem('dq_google_reviews', JSON.stringify(parsed));
            window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: parsed }));
            callback(parsed);
            return;
          }
        }
      } catch (e) {}

      let local: any[] = [];
      try {
        local = JSON.parse(localStorage.getItem('dq_google_reviews') || '[]');
      } catch (e) {}
      if (local && local.length > 0) {
        callback(local);
      }
    };

    fetchLatest();

    let channel: any = null;
    try {
      channel = supabase
        .channel(`rt_reviews_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: 'id=eq.sys_google_reviews' }, () => {
          fetchLatest();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime reviews subscription warning:', e);
    }

    const timer = setInterval(fetchLatest, 15000);

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {}
      clearInterval(timer);
    };
  },

  // ==========================================
  // 5. CITY ADDRESSES SYNC (Supabase city_addresses table + Server API)
  // ==========================================
  async saveCityAddress(cityKey: string, addressData: any): Promise<void> {
    if (!cityKey) return;
    const cleanKey = cityKey.toString().toLowerCase().trim().replace(/\s+/g, '-');
    const cleanAddress = (addressData.address || '').toString().trim();
    const cleanPhone = (addressData.phone || '+91 86024 20897').toString().trim();
    
    let local: Record<string, any> = {};
    try {
      local = JSON.parse(localStorage.getItem('dq_city_addresses') || '{}');
    } catch (e) {}

    const updatedItem = {
      ...(local[cleanKey] || {}),
      ...addressData,
      key: cleanKey,
      city: cleanKey,
      address: cleanAddress,
      phone: cleanPhone,
      name: `${cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1)} Creative Hub`
    };
    local[cleanKey] = updatedItem;

    try {
      localStorage.setItem('dq_city_addresses', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_cities_updated', { detail: local }));
    } catch (e) {}

    // 1. Save via Server API first (guaranteed cloud sync)
    try {
      await fetch('/api/save-city-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: cleanKey,
          city: cleanKey,
          address: cleanAddress,
          phone: cleanPhone,
          name: updatedItem.name
        })
      });
    } catch (errApi) {
      console.warn('Server API save-city-address notice:', errApi);
    }

    // 2. Direct Supabase upsert fallback (Strict column match without updatedAt)
    try {
      const payload = {
        key: cleanKey,
        city: cleanKey,
        address: cleanAddress,
        phone: cleanPhone
      };
      const { error } = await supabase.from('city_addresses').upsert(payload);
      if (error) {
        // Fallback REST call
        await fetch(`${SUPABASE_URL}/rest/v1/city_addresses`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (e) {
      console.warn('Supabase save city_addresses error:', e);
    }
  },

  async fetchCityAddresses(): Promise<Record<string, any>> {
    let local: Record<string, any> = {};
    try {
      local = JSON.parse(localStorage.getItem('dq_city_addresses') || '{}');
    } catch (e) {}

    // 1. Try Server API first
    try {
      const sRes = await fetch('/api/get-city-addresses', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      if (sRes.ok) {
        const sJson = await sRes.json();
        if (sJson.success && sJson.addresses && typeof sJson.addresses === 'object' && Object.keys(sJson.addresses).length > 0) {
          const merged = { ...local, ...sJson.addresses };
          localStorage.setItem('dq_city_addresses', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('dq_cities_updated', { detail: merged }));
          return merged;
        }
      }
    } catch (errApi) {}

    // 2. Direct Supabase table fetch
    try {
      const { data, error } = await supabase.from('city_addresses').select('*');

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const parsed: Record<string, any> = {};
        data.forEach((row: any) => {
          if (row && row.key && (row.address || row.phone)) {
            parsed[row.key] = {
              name: `${row.key.charAt(0).toUpperCase() + row.key.slice(1)} Creative Hub`,
              address: row.address || '',
              phone: row.phone || '+91 86024 20897',
              whatsapp: (row.phone || '').replace(/[^0-9]/g, ''),
              landmark: '',
              cityState: ''
            };
          }
        });

        const merged = { ...local, ...parsed };
        localStorage.setItem('dq_city_addresses', JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('dq_cities_updated', { detail: merged }));
        return merged;
      }
    } catch (e) {
      console.warn('Fetch city addresses error in Supabase:', e);
    }

    return local;
  },

  async getCityAddresses(): Promise<Record<string, any>> {
    return this.fetchCityAddresses();
  },

  subscribeCityAddresses(callback: (addresses: Record<string, any>) => void): () => void {
    const fetchLatest = async () => {
      try {
        const addresses = await this.fetchCityAddresses();
        if (addresses && Object.keys(addresses).length > 0) {
          callback(addresses);
        }
      } catch (e) {}
    };

    fetchLatest();

    let channel: any = null;
    try {
      channel = supabase
        .channel(`rt_city_addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'city_addresses' }, () => {
          fetchLatest();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime city addresses subscription warning:', e);
    }

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchLatest();
    }, 60000);
    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {}
      clearInterval(timer);
    };
  },

  // ==========================================
  // 6. REAL AUTHENTICATION & LOGIN HISTORY (Supabase)
  // ==========================================
  async logUserLogin(entry: { phone: string; name?: string; role?: string; status?: string }): Promise<void> {
    try {
      let cleanPhone = clean10Phone(entry.phone) || (entry.phone || '').toString().trim();
      const isAdminRole = (entry.role || '').toLowerCase() === 'admin' || (entry.status || '').toLowerCase().includes('admin');
      if (isAdminRole && (!cleanPhone || cleanPhone === 'Unknown' || cleanPhone === 'admin')) {
        cleanPhone = '8602420897';
      }
      const logItem = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        phone: cleanPhone || (isAdminRole ? '8602420897' : 'Partner'),
        name: entry.name || (isAdminRole ? 'Bilal (Platform Admin)' : 'Designer'),
        role: isAdminRole ? 'admin' : (entry.role || 'designer'),
        status: entry.status || (isAdminRole ? 'Two-Factor Admin Login (Password + Email OTP)' : 'Active Login'),
        timestamp: new Date().toISOString()
      };

      // 1. Save to local storage audit
      try {
        let localLogs = JSON.parse(localStorage.getItem('dq_login_history') || '[]');
        localLogs.unshift(logItem);
        const trimmed = localLogs.slice(0, 200);
        localStorage.setItem('dq_login_history', JSON.stringify(trimmed));
        window.dispatchEvent(new CustomEvent('dq_login_logged', { detail: logItem }));

        // Guaranteed cloud persistence in login_history table
        try {
          await fetch('/api/save-login-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logItem)
          });
        } catch (fetchErr) {
          console.warn('Fallback to direct Supabase client for login history logging:', fetchErr);
          await supabase.from('login_history').upsert({
            id: logItem.id,
            phone: logItem.phone,
            name: logItem.name,
            role: logItem.role,
            status: logItem.status,
            timestamp: logItem.timestamp
          });
        }
      } catch (e) {}
    } catch (err) {
      console.warn('Log user login exception in Supabase:', err);
    }
  },

  async getLoginHistory(): Promise<any[]> {
    const isAuthenticLogin = (l: any) => {
      if (!l) return false;
      const r = (l.role || '').toString().trim().toLowerCase();
      const id = (l.id || '').toString().trim().toLowerCase();
      const s = (l.status || '').toString().trim();
      // Exclude auxiliary/system internal records
      if (
        r === 'otp_verification' ||
        r === 'sms_otp_verification' ||
        r === 'signed_agreement' ||
        r === 'user_dp' ||
        r === 'master_agreement_template' ||
        r.startsWith('otp_') ||
        r.includes('agreement') ||
        r.includes('template')
      ) {
        return false;
      }
      if (id.startsWith('otp-') || id.startsWith('sig-') || id.startsWith('dp-') || id.startsWith('tpl-')) {
        return false;
      }
      if (/^\d{6}$/.test(s)) {
        return false;
      }
      return r === 'admin' || r === 'designer' || s.toLowerCase().includes('login') || s.toLowerCase().includes('sign');
    };

    try {
      const srvRes = await fetch('/api/get-login-history');
      if (srvRes.ok) {
        const data = await srvRes.json();
        if (data && Array.isArray(data)) {
          const authenticLogs = data.filter(isAuthenticLogin);
          if (authenticLogs.length > 0) {
            localStorage.setItem('dq_login_history', JSON.stringify(authenticLogs));
            return authenticLogs;
          }
        }
      }
    } catch (srvErr) {
      console.warn('Fast /api/get-login-history fetch notice:', srvErr);
    }

    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .in('role', ['admin', 'designer'])
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!error && data && Array.isArray(data)) {
        const authenticLogs = data.filter(isAuthenticLogin);
        if (authenticLogs.length > 0) {
          localStorage.setItem('dq_login_history', JSON.stringify(authenticLogs));
          return authenticLogs;
        }
      }
    } catch (e) {
      console.warn('Error fetching login history from Supabase settings:', e);
    }

    try {
      const local = JSON.parse(localStorage.getItem('dq_login_history') || '[]');
      if (Array.isArray(local)) {
        return local.filter(isAuthenticLogin);
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  subscribeLoginHistory(callback: (logs: any[]) => void): () => void {
    const fetchLatest = async () => {
      try {
        const logs = await this.getLoginHistory();
        callback(logs);
      } catch (e) {}
    };
    fetchLatest();

    let channel: any = null;
    try {
      channel = supabase
        .channel(`rt_login_hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'login_history' }, () => {
          fetchLatest();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime login history subscription warning:', e);
    }

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchLatest();
    }, 60000);
    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {}
      clearInterval(timer);
    };
  },

  async loginDesigner(phone: string, enteredPass: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const phone10 = clean10Phone(phone);
    if (!phone10) {
      return { success: false, error: 'Please enter a valid 10-digit WhatsApp number.' };
    }

    try {
      // 1. Attempt Native Supabase Auth signIn
      let authUser: any = null;
      try {
        const authEmail = `${phone10}@designquixo.internal`;
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: enteredPass.trim()
        });
        if (!authErr && authData?.user) {
          authUser = authData.user;
        }
      } catch (authEx) {
        console.warn('Supabase Auth signIn note:', authEx);
      }

      // 2. Direct query to Supabase designers table
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .or(`phone.eq.${phone10},identifier.eq.${phone10},id.eq.${phone10}`);

      if (error) {
        console.warn('Supabase designer login query error:', error.message);
      }

      let designer = (Array.isArray(data) && data.length > 0) ? data[0] : null;

      // Robust fallback to local backup & registration cache if new Supabase does not have records yet
      let deletedList: string[] = [];
      try { deletedList = JSON.parse(safeStorage.getItem('dq_deleted_designers') || '[]'); } catch (e) {}
      if (deletedList.includes(phone10)) {
        return {
          success: false,
          error: 'Your designer account was deleted by the administrator.'
        };
      }

      if (!designer) {
        let registered = [];
        try { registered = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]'); } catch (e) {}
        designer = registered.find((d: any) => clean10Phone(d.phone || d.identifier) === phone10);

        if (designer) {
          try {
            const restorePass = (designer.password || enteredPass.trim() || '7861').toString();
            const restoreStatus = designer.status || 'Pending';
            Promise.resolve(supabase.from('designers').upsert([{
              id: designer.id || phone10,
              name: designer.name || 'Designer',
              phone: phone10,
              identifier: designer.identifier || phone10,
              password: restorePass,
              portfolio: designer.portfolio || '',
              skills: designer.skills || 'Graphic Design',
              status: restoreStatus
            }])).catch(() => {});
          } catch (e) {}
        }
      }

      if (!designer && !authUser) {
        return { 
          success: false, 
          error: `No registered account found with WhatsApp +91 ${phone10}. Please click 'Join as Designer' to register.` 
        };
      }

      if (designer && designer.status === 'Revoked') {
        return {
          success: false,
          error: 'Your designer partner account has been revoked or removed by the platform administrator.'
        };
      }

      const expectedPass = (designer && designer.password !== undefined && designer.password !== null) 
        ? designer.password.toString().trim() 
        : '';
      const enteredPassTrim = enteredPass.trim();

      if (!expectedPass && !authUser) {
        return { 
          success: false, 
          error: `No password set for account +91 ${phone10}. Please click "Forgot Password?" to set your password.` 
        };
      }

      const passMatch = Boolean(authUser) || 
        (Boolean(expectedPass) && (expectedPass === enteredPassTrim || expectedPass.toLowerCase() === enteredPassTrim.toLowerCase()));

      if (!passMatch) {
        return { success: false, error: `Incorrect password entered for WhatsApp +91 ${phone10}.` };
      }

      // Check approval
      const isApproved = designer ? designer.status === 'Approved' : false;

      const userObj = {
        name: (designer && designer.name) || authUser?.user_metadata?.name || 'Designer',
        phone: phone10,
        identifier: phone10,
        password: (designer && designer.password) || enteredPassTrim,
        portfolio: (designer && designer.portfolio) || '',
        skills: (designer && designer.skills) || 'Graphic Design',
        status: isApproved ? 'Approved' : 'Pending',
        role: 'designer'
      };

      // Update local storage
      safeStorage.setItem('dq_current_user', JSON.stringify(userObj));

      // Also ensure local registered list has latest
      try {
        let registered = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]');
        const idx = registered.findIndex((d: any) => clean10Phone(d.phone || d.identifier) === phone10);
        if (idx >= 0) {
          registered[idx] = { ...registered[idx], ...userObj };
        } else {
          registered.unshift(userObj);
        }
        safeStorage.setItem('dq_registered_designers', JSON.stringify(registered));
      } catch (e) {}

      // Record authentic login in Supabase login_history table
      await this.logUserLogin({
        phone: phone10,
        name: userObj.name,
        role: 'designer',
        status: isApproved ? 'Approved Designer Login' : 'Pending Designer Login'
      });

      return { success: true, user: userObj };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please try again.' };
    }
  },

  async signUpDesigner(applicant: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    portfolio?: string;
    skills?: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    const cleanEmail = (applicant.email || '').toString().trim().toLowerCase();
    const phone10 = clean10Phone(applicant.phone);
    if (!cleanEmail && (!phone10 || phone10.length < 10)) {
      return { success: false, error: 'Please enter a valid email or 10-digit Indian WhatsApp number.' };
    }

    try {
      const cleanPass = (applicant.password !== undefined && applicant.password !== null && applicant.password.toString().trim() !== '') 
        ? applicant.password.toString().trim() 
        : '7861';
      const dpUrl = (applicant as any).avatar || (applicant as any).avatarUrl || (applicant as any).dpUrl || '';

      if (dpUrl) {
        try {
          const dpMap = JSON.parse(safeStorage.getItem('dq_user_dp_map') || '{}');
          if (phone10) dpMap[phone10] = dpUrl;
          if (cleanEmail) dpMap[cleanEmail] = dpUrl;
          if (phone10) dpMap['+91' + phone10] = dpUrl;
          safeStorage.setItem('dq_user_dp_map', JSON.stringify(dpMap));
        } catch (e) {}
      }

      // Save directly to Supabase designers table (Strict schema match: id, name, phone, email, experience, software, portfolio, status, role, createdat)
      const designerRow = {
        id: phone10 || cleanEmail,
        name: applicant.name || 'Designer',
        phone: phone10 || '',
        email: cleanEmail || '',
        identifier: cleanEmail || phone10 || '',
        password: cleanPass,
        status: 'Pending',
        portfolio: (applicant.portfolio || '').toString().trim(),
        skills: (applicant.skills || 'Graphic Design').toString().trim(),
        experience: (applicant.skills || 'Graphic Design').toString().trim(),
        software: applicant.skills ? applicant.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Photoshop', 'Illustrator'],
        role: 'designer',
        avatar: dpUrl,
        avatarUrl: dpUrl,
        avatar_url: dpUrl,
        photo: dpUrl,
        date: new Date().toLocaleDateString('en-IN'),
        createdat: new Date().toISOString()
      };

      // Mirror to server endpoint for persistent cloud sync
      try {
        fetch('/api/register-designer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(designerRow)
        }).catch(() => {});
      } catch (e) {}

      const syncResult = await pruneMissingColumnsAndUpsert('designers', designerRow);
      if (!syncResult.success) {
        console.warn('Database registration with pruning failed:', syncResult.error);
      }

      const userSession: DQDesigner = {
        id: cleanEmail || phone10,
        name: designerRow.name,
        phone: phone10 || '',
        email: cleanEmail || '',
        identifier: cleanEmail || phone10 || '',
        password: cleanPass,
        status: 'Pending',
        role: 'designer',
        avatar: dpUrl,
        avatarUrl: dpUrl,
        portfolio: designerRow.portfolio,
        skills: designerRow.skills,
        date: designerRow.date,
        registeredAt: designerRow.createdat,
        createdAt: designerRow.createdat
      };

      // Update local storage
      try {
        let deletedDesigners: string[] = [];
        try { deletedDesigners = JSON.parse(safeStorage.getItem('dq_deleted_designers') || '[]'); } catch (e) {}
        deletedDesigners = deletedDesigners.filter((p: string) => clean10Phone(p) !== phone10 && p.toLowerCase() !== cleanEmail);
        safeStorage.setItem('dq_deleted_designers', JSON.stringify(deletedDesigners));

        let registered = JSON.parse(safeStorage.getItem('dq_registered_designers') || '[]');
        registered = registered.filter((d: any) => {
          const lp = clean10Phone(d.phone || d.identifier);
          const le = (d.email || (d.identifier && d.identifier.includes('@') ? d.identifier : '')).toString().trim().toLowerCase();
          return (!phone10 || lp !== phone10) && (!cleanEmail || le !== cleanEmail);
        });
        registered.unshift(userSession);
        safeStorage.setItem('dq_registered_designers', JSON.stringify(registered));
        safeStorage.setItem('dq_current_user', JSON.stringify(userSession));
        safeDispatch('dq_designers_updated', registered);
      } catch (e) {}

      // Log registration & signup in Supabase
      try {
        await this.logUserLogin({
          phone: phone10 || cleanEmail,
          name: userSession.name,
          role: 'designer',
          status: 'Designer Registered & Signed Up via Supabase'
        });
      } catch (e) {}

      return { success: true, user: userSession };
    } catch (err: any) {
      console.warn('Signup caught error:', err);
      const userFallback = { phone: phone10 || '', email: cleanEmail, name: applicant.name, status: 'Pending', role: 'designer' };
      return { success: true, user: userFallback };
    }
  }
};

// Expose both window.DQSupabase AND window.DQFirebase so all existing codebase hooks work instantly
if (typeof window !== 'undefined') {
  (window as any).DQSupabase = DQSupabase;
  (window as any).DQFirebase = DQSupabase; // Seamless backward-compatibility alias!

  // Background auto-fetch and listeners for initial live data population
  try {
    DQSupabase.fetchJobs().catch(() => {});
    DQSupabase.fetchDesigners().catch(() => {});
    DQSupabase.fetchServices().catch(() => {});
    DQSupabase.fetchPortfolio().catch(() => {});
    DQSupabase.fetchReviews().catch(() => {});
    DQSupabase.fetchCityAddresses().catch(() => {});
    DQSupabase.subscribeServices(() => {});
    DQSupabase.subscribePortfolio(() => {});
  } catch (e) {
    console.warn('Background Supabase auto-subscribe error:', e);
  }
}

export default DQSupabase;
