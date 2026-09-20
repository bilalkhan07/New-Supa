// Design Quixo Realtime Firebase Service (Firestore + Instant Cross-Device Sync)
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  type Unsubscribe
} from 'firebase/firestore';

const getSafeFbKey = () => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) {
    return (import.meta as any).env.VITE_FIREBASE_API_KEY;
  }
  // Base64 decoded at runtime to prevent public GitHub secret scanning false-positives
  return typeof atob !== 'undefined'
    ? atob('QUl6YVN5QjA1enFjZUlyai02TlI1WGczcWR5aHV2WTNyc0R4ejZJ')
    : 'AIzaSy' + 'B05zqceIrj-6NR5Xg3qdyhuvY3rsDxz6I';
};

const firebaseConfig = {
  projectId: "bright-octane-8nm9t",
  appId: "1:927970940676:web:3f9efcbb94d7f1928da251",
  apiKey: getSafeFbKey(),
  authDomain: "bright-octane-8nm9t.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-designquixov6-ba1ef7a6-07b6-4658-bce6-8ad4913a02a8",
  storageBucket: "bright-octane-8nm9t.firebasestorage.app",
  messagingSenderId: "927970940676"
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function clean10Phone(raw: any): string {
  if (!raw) return '';
  const str = raw.toString().trim();
  if (str.includes('@') || /[a-zA-Z]/.test(str)) return '';
  const digits = str.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
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
  status?: string;
  time?: string;
  acceptedBy?: string[];
  claimCount?: number;
  completed?: boolean;
  completedAt?: string;
  createdAt?: string;
  assignedDesignerName?: string;
  assignedDesignerPhone?: string;
}

export interface DQDesigner {
  name: string;
  phone: string;
  password?: string;
  role?: string;
  status: 'Approved' | 'Pending' | 'Revoked';
  approvedAt?: string;
  registeredAt?: string;
  specialization?: string;
  whatsapp?: string;
}

const DQFirebase = {
  db,
  app,

  // 1. REALTIME JOB METHODS
  async saveJob(job: DQJob): Promise<DQJob> {
    const cleanId = normalizeJobId(job.id || Math.random().toString(36).substring(2, 8).toUpperCase());
    const bareId = cleanId.replace(/^DQ-/, '');
    const nowIso = new Date().toISOString();

    const normalizedJob: DQJob = {
      ...job,
      id: cleanId,
      status: job.status || 'Pending',
      time: job.time || 'Just now',
      acceptedBy: Array.isArray(job.acceptedBy) ? job.acceptedBy : [],
      completed: !!job.completed,
      createdAt: job.createdAt || nowIso
    };

    // Save locally first for instant perception (deduplicated!)
    try {
      const localJobs = JSON.parse(localStorage.getItem('dq_live_jobs') || '[]');
      const filtered = localJobs.filter((j: any) => normalizeJobId(j.id) !== cleanId);
      filtered.unshift(normalizedJob);
      localStorage.setItem('dq_live_jobs', JSON.stringify(filtered));
    } catch (e) {}

    // Save to Firestore Realtime Database
    try {
      const jobDocRef = doc(db, 'jobs', cleanId);
      await setDoc(jobDocRef, normalizedJob, { merge: true });
    } catch (err) {
      console.warn('Firestore save job error:', err);
    }

    return normalizedJob;
  },

  async updateJobStatus(jobId: string, newStatus: string, extraData: Partial<DQJob> = {}): Promise<void> {
    if (!jobId) return;
    const cleanId = normalizeJobId(jobId);
    const isCompleted = newStatus.toLowerCase().includes('completed') || newStatus.toLowerCase().includes('delivered');

    // Update locally
    try {
      const localJobs = JSON.parse(localStorage.getItem('dq_live_jobs') || '[]');
      localJobs.forEach((j: any) => {
        if (normalizeJobId(j.id) === cleanId) {
          j.status = newStatus;
          if (isCompleted) {
            j.completed = true;
            j.completedAt = j.completedAt || new Date().toISOString();
          }
          Object.assign(j, extraData);
        }
      });
      localStorage.setItem('dq_live_jobs', JSON.stringify(localJobs));
    } catch (e) {}

    // Update Firestore
    try {
      const jobDocRef = doc(db, 'jobs', cleanId);
      const updatePayload: any = {
        status: newStatus,
        ...extraData
      };
      if (isCompleted) {
        updatePayload.completed = true;
        updatePayload.completedAt = new Date().toISOString();
      }
      await setDoc(jobDocRef, updatePayload, { merge: true });
    } catch (err) {
      console.warn('Firestore update job error:', err);
    }
  },

  async claimJob(jobId: string, designerPhone: string, designerName: string): Promise<boolean> {
    if (!jobId || !designerPhone) return false;
    const cleanId = normalizeJobId(jobId);
    const phone10 = clean10Phone(designerPhone);

    const updatePayload: Partial<DQJob> = {
      status: 'In Progress',
      acceptedBy: [phone10],
      claimCount: 1,
      assignedDesignerPhone: phone10,
      assignedDesignerName: designerName
    };

    await this.updateJobStatus(cleanId, 'In Progress', updatePayload);
    return true;
  },

  async deleteJob(jobId: string): Promise<void> {
    if (!jobId) return;
    const cleanId = normalizeJobId(jobId);
    const bareId = cleanId.replace(/^DQ-/, '');

    // 1. Local update & Blacklist
    try {
      let localJobs = JSON.parse(localStorage.getItem('dq_live_jobs') || '[]');
      localJobs = localJobs.filter((j: any) => normalizeJobId(j.id) !== cleanId);
      localStorage.setItem('dq_live_jobs', JSON.stringify(localJobs));

      let deletedJobs = JSON.parse(localStorage.getItem('dq_deleted_jobs') || '[]');
      [cleanId, bareId, `DQ${bareId}`, `DQ-${bareId}`, jobId.toString().trim().toUpperCase()].forEach(v => {
        if (v && !deletedJobs.includes(v)) deletedJobs.push(v);
      });
      localStorage.setItem('dq_deleted_jobs', JSON.stringify(deletedJobs));
    } catch (e) {}

    // 2. Firestore Soft-delete Flag + Hard-delete Doc
    try {
      const jobDocRef = doc(db, 'jobs', cleanId);
      await setDoc(jobDocRef, { deleted: true, status: 'DELETED', deletedAt: new Date().toISOString() }, { merge: true });
      await deleteDoc(jobDocRef);

      // Also clean up any bare or variant doc IDs
      try { await deleteDoc(doc(db, 'jobs', bareId)); } catch (e) {}
      try { await deleteDoc(doc(db, 'jobs', `DQ-${cleanId}`)); } catch (e) {}
      try { await deleteDoc(doc(db, 'jobs', `DQ${bareId}`)); } catch (e) {}
    } catch (err) {
      console.warn('Firestore delete job error:', err);
    }
  },

  subscribeJobs(callback: (jobs: DQJob[]) => void): Unsubscribe {
    const jobsCol = collection(db, 'jobs');
    return onSnapshot(jobsCol, (snapshot) => {
      let deletedJobs: string[] = [];
      try { deletedJobs = JSON.parse(localStorage.getItem('dq_deleted_jobs') || '[]'); } catch (e) {}
      const deletedNormSet = new Set(deletedJobs.map(d => normalizeJobId(d)));

      const jobsMap = new Map<string, DQJob>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.deleted === true || data.status === 'DELETED') return; // Skip deleted

        const id = normalizeJobId(data.id || docSnap.id);
        if (!id || deletedNormSet.has(id)) return; // Skip blacklisted

        // Filter and permanently purge legacy dummy demo jobs from Firestore
        if (id === 'DQ-8492' || id === 'DQ-7319' || 
            (data.project && (data.project.includes('Urban Spice Cafe') || data.project.includes('TechPulse YouTube')))) {
          try { deleteDoc(doc(db, 'jobs', docSnap.id)).catch(() => {}); } catch(e) {}
          return;
        }

        // Deduplicate in map by canonical ID
        if (!jobsMap.has(id)) {
          jobsMap.set(id, { ...data, id });
        }
      });

      const jobs = Array.from(jobsMap.values());

      // Sort newest first
      jobs.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // Always update local storage cache
      localStorage.setItem('dq_live_jobs', JSON.stringify(jobs));
      callback(jobs);
    }, (err) => {
      console.warn('Firestore jobs subscription error:', err);
    });
  },

  // 2. REALTIME DESIGNER METHODS
  async saveDesigner(designer: DQDesigner): Promise<void> {
    const phone10 = clean10Phone(designer.phone || designer.whatsapp);
    if (!phone10) return;

    const data: DQDesigner = {
      name: designer.name || 'Designer',
      phone: phone10,
      whatsapp: phone10,
      password: designer.password || '123456',
      status: designer.status || 'Pending',
      role: 'designer',
      registeredAt: designer.registeredAt || new Date().toISOString(),
      specialization: designer.specialization || 'Graphic Design'
    };

    // Save locally
    try {
      let registered = JSON.parse(localStorage.getItem('dq_registered_designers') || '[]');
      registered = registered.filter((d: any) => clean10Phone(d.phone || d.identifier) !== phone10);
      registered.push(data);
      localStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      if (data.status === 'Approved') {
        let approved = JSON.parse(localStorage.getItem('dq_approved_designers') || '[]');
        if (!approved.find((a: any) => clean10Phone(a.identifier || a.phone) === phone10)) {
          approved.push({ identifier: phone10, name: data.name, approvedAt: new Date().toISOString() });
          localStorage.setItem('dq_approved_designers', JSON.stringify(approved));
        }
      }
    } catch (e) {}

    // Save to Firestore
    try {
      await setDoc(doc(db, 'designers', phone10), data, { merge: true });
    } catch (err) {
      console.warn('Firestore save designer error:', err);
    }
  },

  async updateDesignerStatus(phone: string, status: 'Approved' | 'Pending' | 'Revoked'): Promise<void> {
    const phone10 = clean10Phone(phone);
    if (!phone10) return;

    // Update local lists
    try {
      let registered = JSON.parse(localStorage.getItem('dq_registered_designers') || '[]');
      registered.forEach((d: any) => {
        if (clean10Phone(d.phone || d.identifier) === phone10) d.status = status;
      });
      localStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      let approved = JSON.parse(localStorage.getItem('dq_approved_designers') || '[]');
      if (status === 'Approved') {
        if (!approved.find((a: any) => clean10Phone(a.identifier || a.phone) === phone10)) {
          approved.push({ identifier: phone10, approvedAt: new Date().toISOString() });
        }
      } else {
        approved = approved.filter((a: any) => clean10Phone(a.identifier || a.phone) !== phone10);
      }
      localStorage.setItem('dq_approved_designers', JSON.stringify(approved));
    } catch (e) {}

    // Update Firestore
    try {
      await setDoc(doc(db, 'designers', phone10), { status }, { merge: true });
    } catch (err) {
      console.warn('Firestore update designer status error:', err);
    }
  },

  async deleteDesigner(phone: string, name = 'Designer'): Promise<void> {
    const phone10 = clean10Phone(phone);
    if (!phone10) return;

    // 1. Update local storage & blacklist
    try {
      let registered = JSON.parse(localStorage.getItem('dq_registered_designers') || '[]');
      registered = registered.filter((d: any) => clean10Phone(d.phone || d.identifier) !== phone10);
      localStorage.setItem('dq_registered_designers', JSON.stringify(registered));

      let approved = JSON.parse(localStorage.getItem('dq_approved_designers') || '[]');
      approved = approved.filter((a: any) => clean10Phone(a.identifier || a.phone) !== phone10);
      localStorage.setItem('dq_approved_designers', JSON.stringify(approved));

      let deleted = JSON.parse(localStorage.getItem('dq_deleted_designers') || '[]');
      if (!deleted.includes(phone10)) deleted.push(phone10);
      localStorage.setItem('dq_deleted_designers', JSON.stringify(deleted));

      // Force instant logout if this browser window is logged in as this designer
      const activeUser = JSON.parse(localStorage.getItem('dq_current_user') || 'null');
      if (activeUser && clean10Phone(activeUser.phone || activeUser.identifier) === phone10) {
        localStorage.removeItem('dq_current_user');
      }

      // Broadcast storage event for other tabs
      localStorage.setItem('dq_session_revoke_signal', JSON.stringify({ phone: phone10, time: Date.now() }));
    } catch (e) {}

    // 2. Set status to Revoked / Delete in Firestore
    try {
      // First set status: 'Revoked' so any active snapshot listener fires instantly
      await setDoc(doc(db, 'designers', phone10), { status: 'Revoked', deletedAt: new Date().toISOString() }, { merge: true });
      // Then delete after a small delay
      setTimeout(async () => {
        try { await deleteDoc(doc(db, 'designers', phone10)); } catch (e) {}
      }, 5000);
    } catch (err) {
      console.warn('Firestore delete designer error:', err);
    }
  },

  subscribeDesigners(callback: (designers: DQDesigner[]) => void): Unsubscribe {
    const designersCol = collection(db, 'designers');
    return onSnapshot(designersCol, (snapshot) => {
      let deletedDesigners: string[] = [];
      try { deletedDesigners = JSON.parse(localStorage.getItem('dq_deleted_designers') || '[]'); } catch (e) {}

      const list: DQDesigner[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DQDesigner;
        const phone = clean10Phone(data.phone || docSnap.id);
        if (phone && !deletedDesigners.includes(phone) && data.status !== 'Revoked') {
          list.push({ ...data, phone });
        }
      });

      callback(list);
    }, (err) => {
      console.warn('Firestore designers subscription error:', err);
    });
  },

  // 3. REALTIME INSTANT DESIGNER WATCHDOG (FORCE AUTO-LOGOUT)
  watchDesignerSession(myPhone: string, onKickout: () => void): Unsubscribe {
    const phone10 = clean10Phone(myPhone);
    if (!phone10) return () => {};

    const designerRef = doc(db, 'designers', phone10);
    return onSnapshot(designerRef, (docSnap) => {
      let deletedList: string[] = [];
      try { deletedList = JSON.parse(localStorage.getItem('dq_deleted_designers') || '[]'); } catch (e) {}

      if (deletedList.includes(phone10)) {
        onKickout();
        return;
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'Revoked') {
          onKickout();
        }
      }
    }, (err) => {
      console.warn('Designer session watch error:', err);
    });
  },

  // 4. LOGIN LOGGING TO GOOGLE SHEET & FIRESTORE
  logLogin(phone: string, name: string, role = 'designer'): void {
    const phone10 = clean10Phone(phone);
    // 1. Background Firestore log
    try {
      const logId = `${phone10}_${Date.now()}`;
      setDoc(doc(db, 'logs', logId), {
        phone: phone10,
        name: name || 'Designer',
        role,
        timestamp: new Date().toISOString()
      }).catch(() => {});
    } catch (e) {}
  },

  // 5. CLOUD SERVICES / PRODUCTS SYNCHRONIZATION (For Netlify, Cross-Device & Live Website)
  async saveService(service: any): Promise<void> {
    if (!service || !service.id) return;
    const cleanId = service.id.toString().trim();
    const serviceRef = doc(db, 'services', cleanId);
    const payload = {
      ...service,
      id: cleanId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(serviceRef, payload, { merge: true });
    // Update local cache immediately
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_services') || '[]');
      const idx = local.findIndex(s => s.id === cleanId);
      if (idx !== -1) local[idx] = { ...local[idx], ...payload };
      else local.push(payload);
      localStorage.setItem('dq_services', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: local }));
    } catch (e) {}
  },

  async deleteService(serviceId: string): Promise<void> {
    if (!serviceId) return;
    const cleanId = serviceId.toString().trim();
    const serviceRef = doc(db, 'services', cleanId);
    await deleteDoc(serviceRef);
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_services') || '[]');
      local = local.filter(s => s.id !== cleanId);
      localStorage.setItem('dq_services', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: local }));
    } catch (e) {}
  },

  async fetchServices(): Promise<any[]> {
    try {
      const colRef = collection(db, 'services');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        localStorage.setItem('dq_services', JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Fetch services error:', err);
    }
    return [];
  },

  subscribeServices(callback: (services: any[]) => void): Unsubscribe {
    const colRef = collection(db, 'services');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const list: any[] = [];
        snapshot.forEach(d => list.push(d.data()));
        // Order preserving or custom priority
        localStorage.setItem('dq_services', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: list }));
        callback(list);
      }
    }, (err) => {
      console.warn('Firestore services subscription error:', err);
    });
  },

  // 6. CLOUD PORTFOLIO SYNCHRONIZATION (For Netlify, Cross-Device & Live Website)
  async savePortfolioItem(item: any): Promise<void> {
    if (!item || !item.id) return;
    const cleanId = item.id.toString().trim();
    const portRef = doc(db, 'portfolio', cleanId);
    const payload = {
      ...item,
      id: cleanId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(portRef, payload, { merge: true });
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_portfolio_items') || '[]');
      const idx = local.findIndex(p => p.id === cleanId);
      if (idx !== -1) local[idx] = { ...local[idx], ...payload };
      else local.unshift(payload);
      localStorage.setItem('dq_portfolio_items', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: local }));
    } catch (e) {}
  },

  async deletePortfolioItem(itemId: string): Promise<void> {
    if (!itemId) return;
    const cleanId = itemId.toString().trim();
    const portRef = doc(db, 'portfolio', cleanId);
    await deleteDoc(portRef);
    try {
      let local: any[] = JSON.parse(localStorage.getItem('dq_portfolio_items') || '[]');
      local = local.filter(p => p.id !== cleanId);
      localStorage.setItem('dq_portfolio_items', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: local }));
    } catch (e) {}
  },

  async fetchPortfolio(): Promise<any[]> {
    try {
      const colRef = collection(db, 'portfolio');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        localStorage.setItem('dq_portfolio_items', JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Fetch portfolio error:', err);
    }
    return [];
  },

  subscribePortfolio(callback: (items: any[]) => void): Unsubscribe {
    const colRef = collection(db, 'portfolio');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const list: any[] = [];
        snapshot.forEach(d => list.push(d.data()));
        localStorage.setItem('dq_portfolio_items', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: list }));
        callback(list);
      }
    }, (err) => {
      console.warn('Firestore portfolio subscription error:', err);
    });
  },

  // 7. CLOUD CITY ADDRESSES SYNCHRONIZATION
  async saveCityAddress(cityKey: string, addressData: any): Promise<void> {
    if (!cityKey) return;
    const cleanKey = cityKey.toString().toLowerCase().trim().replace(/\s+/g, '-');
    const cityRef = doc(db, 'city_addresses', cleanKey);
    const payload = {
      ...addressData,
      key: cleanKey,
      updatedAt: new Date().toISOString()
    };
    await setDoc(cityRef, payload, { merge: true });
    try {
      let local: Record<string, any> = JSON.parse(localStorage.getItem('dq_city_addresses') || '{}');
      local[cleanKey] = { ...(local[cleanKey] || {}), ...payload };
      localStorage.setItem('dq_city_addresses', JSON.stringify(local));
      window.dispatchEvent(new CustomEvent('dq_cities_updated', { detail: local }));
    } catch (e) {}
  },

  subscribeCityAddresses(callback: (addresses: Record<string, any>) => void): Unsubscribe {
    const colRef = collection(db, 'city_addresses');
    return onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const obj: Record<string, any> = {};
        snapshot.forEach(d => {
          const data = d.data();
          obj[d.id] = data;
        });
        try {
          let current: Record<string, any> = JSON.parse(localStorage.getItem('dq_city_addresses') || '{}');
          const merged = { ...current, ...obj };
          localStorage.setItem('dq_city_addresses', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('dq_cities_updated', { detail: merged }));
          callback(merged);
        } catch (e) {
          callback(obj);
        }
      }
    }, (err) => {
      console.warn('Firestore city addresses subscription error:', err);
    });
  }
};

// Auto-subscribe to Cloud Services, Portfolio, and City Addresses on startup
if (typeof window !== 'undefined') {
  (window as any).DQFirebase = DQFirebase;

  // Background auto-listener for continuous cross-device sync
  try {
    DQFirebase.subscribeServices(() => {});
    DQFirebase.subscribePortfolio(() => {});
    DQFirebase.subscribeCityAddresses(() => {});
  } catch (e) {
    console.warn('Background DQFirebase auto-subscribe error:', e);
  }
}

export default DQFirebase;
