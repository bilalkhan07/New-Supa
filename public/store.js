/**
 * Design Quixo Shared State & Core Store
 * Manages Services, Pricing, Jobs, Portfolio, Tracking, and Designer/Admin Earnings
 */

// Immediate synchronous purge of previous project cache
(function() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('dq_portfolio_sync_v2') !== 'active') {
        localStorage.removeItem('dq_portfolio_items');
        localStorage.setItem('dq_portfolio_sync_v2', 'active');
      }
    }
  } catch (e) {}
})();

const DEFAULT_SERVICES = [
  {
    id: 'social-media',
    title: 'Social Media Posts',
    price: 399,
    sla: '30-45 mins',
    category: 'social',
    description: 'Instagram feeds, reels covers, carousel slides & promotional social media creatives.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80',
    icon: 'share-2',
    slug: 'social-media-designer',
    ratio: 'Square (1:1)'
  },
  {
    id: 'youtube-thumbnail',
    title: 'YouTube Thumbnails',
    price: 359,
    sla: '30-45 mins',
    category: 'thumbnail',
    description: 'High-CTR clickable thumbnails with crisp cutouts, rim lighting & creator hooks.',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700&auto=format&fit=crop&q=80',
    icon: 'youtube',
    slug: 'youtube-thumbnail-designer',
    ratio: 'Landscape (16:9)'
  },
  {
    id: 'vector-art',
    title: 'Vector Art & Tracing',
    price: 599,
    sla: '45-60 mins',
    category: 'vector',
    description: 'Convert blurry JPEGs, logos or sketches into infinite-resolution SVG & EPS vectors.',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=700&auto=format&fit=crop&q=80',
    icon: 'pen-tool',
    slug: 'vector-art-specialist',
    ratio: 'Square (1:1)'
  },
  {
    id: 'visiting-card',
    title: 'Visiting Cards',
    price: 359,
    sla: '30-45 mins',
    category: 'print',
    description: 'Double-sided luxury business card layouts with bleed margins, CMYK print & QR codes.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&auto=format&fit=crop&q=80',
    icon: 'credit-card',
    slug: 'visiting-card-designer',
    ratio: 'Print / Custom'
  },
  {
    id: 'logo-design',
    title: 'Brand Logo Design',
    price: 499,
    sla: '1-2 hours',
    category: 'branding',
    description: 'Unique, memorable brand marks crafted manually from scratch with complete vector palettes.',
    image: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=700&auto=format&fit=crop&q=80',
    icon: 'crown',
    slug: 'logo-designer',
    ratio: 'Square (1:1)'
  },
  {
    id: 'packaging-design',
    title: 'Product Label & Pack',
    price: 699,
    sla: '1.5-2 hours',
    category: 'packaging',
    description: 'Die-cut accurate pouch designs, product labels, box wraps & compliant barcodes.',
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=700&auto=format&fit=crop&q=80',
    icon: 'package',
    slug: 'packaging-label-designer',
    ratio: 'Print / Custom'
  },
  {
    id: 'flyer-design',
    title: 'Flyers & Posters',
    price: 449,
    sla: '45-60 mins',
    category: 'print',
    description: 'Event notices, food menus, real estate promotional flyers, and corporate handouts.',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=700&auto=format&fit=crop&q=80',
    icon: 'file-text',
    slug: 'flyer-poster-designer',
    ratio: 'Print / Custom'
  },
  {
    id: 'brochure-design',
    title: 'Brochures & Catalogs',
    price: 699,
    sla: '1.5-2 hours',
    category: 'print',
    description: 'Bi-fold, tri-fold, and multi-page corporate marketing decks and product catalogs.',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=700&auto=format&fit=crop&q=80',
    icon: 'book-open',
    slug: 'brochure-catalog-designer',
    ratio: 'Print / Custom'
  },
  {
    id: 'custom-design',
    title: 'All Graphic Design',
    price: 359,
    sla: '30-45 mins',
    category: 'custom',
    description: 'Bespoke posters, brochures, hoardings, standees, menus, merchandise, or any special design request.',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&auto=format&fit=crop&q=80',
    icon: 'layout-grid',
    slug: 'graphic-designer',
    ratio: 'Custom / As Required'
  }
];



const DEFAULT_PORTFOLIO = [
  {
    id: 'port-1',
    title: 'High CTR Thumbnail',
    category: 'thumbnail',
    deliveryTime: '⚡ 25m Delivery',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700&auto=format&fit=crop&q=80',
    description: 'High-CTR YouTube thumbnail designed with bold visuals, strong hierarchy, and attention-grabbing composition to maximize viewer engagement.',
    client: 'CA Mohit Patidar'
  },
  {
    id: 'port-1789560301635',
    title: 'Avir Vada Pav',
    category: 'branding',
    deliveryTime: '⚡ 1hr Delivery',
    image: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=700&auto=format&fit=crop&q=80',
    description: 'Custom logo designed for Avir Vada Pav, bringing the three family members together in a memorable and friendly brand identity.',
    client: 'Avir Jain'
  },
  {
    id: 'port-1789562209675',
    title: 'Brest Pump Packaging',
    category: 'social',
    deliveryTime: '⚡ 1.5hr Delivery',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&auto=format&fit=crop&q=80',
    description: 'Professional breast pump packaging designed with a clean, modern, and trustworthy visual identity for a medical healthcare brand.',
    client: 'Aditya Ajmera'
  },
  {
    id: 'port-1789560174988',
    title: 'Malhaari Insta Grid',
    category: 'social',
    deliveryTime: '⚡ 30m Delivery',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80',
    description: 'A visually engaging Instagram grid crafted to strengthen brand identity with clean, consistent, and modern creative direction.',
    client: 'Hiten Sharma'
  }
];

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Aman Sharma',
    role: 'Founder, TechVibe Media',
    city: 'Hyderabad',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    review: 'Bhai seriously 35 mins me layered PSD thumbnail ready karke WhatsApp pe bhej diya. CTR 4.2% se direct 11.8% ho gaya. Human designers ka touch alag hi dikhta hai!',
    verified: true,
    date: 'Yesterday'
  },
  {
    id: 'rev-2',
    name: 'Pooja Verma',
    role: 'Owner, Brew & Bean Cafe',
    city: 'Indore',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    review: 'Instant WhatsApp communication is a game changer. Maine rough pen-paper sketch share kiya tha, designer ne 40 minute me clean Instagram carousels banake de diye. 10/10!',
    verified: true,
    date: '3 days ago'
  },
  {
    id: 'rev-3',
    name: 'Rahul Kulkarni',
    role: 'Brand Lead, Nexus Fintech',
    city: 'Mumbai',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    review: 'Best experience for quick turnarounds. No agency drama, prompt delivery. Real human vector art files with full commercial license. Highly recommended for all businesses.',
    verified: true,
    date: '5 days ago'
  },
  {
    id: 'rev-4',
    name: 'Dr. Neha Patel',
    role: 'Director, Veda Naturals',
    city: 'Bangalore',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    review: 'Packaging box dielines and product labels perfect CMYK 300 DPI me deliver huye. Printer ko direct forward kiya aur without any error print nikal aaya. Super fast service!',
    verified: true,
    date: '1 week ago'
  },
  {
    id: 'rev-5',
    name: 'Karthik Rao',
    role: 'Growth Lead, CloudNine Tech',
    city: 'Hyderabad',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    review: 'HITEC City launch ke liye 5 ad creative variations required the. Within 30 minutes designer live connect hua aur exact brand guidelines match karte hue exports ready kar diye.',
    verified: true,
    date: '4 days ago'
  },
  {
    id: 'rev-6',
    name: 'Vikramaditya Solanki',
    role: 'Co-Founder, Capital Ventures',
    city: 'Delhi-NCR',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    review: 'Investor pitch deck vectors and high-res infographics delivered on-demand. Turnaround time is unmatched in India.',
    verified: true,
    date: '2 weeks ago'
  }
];

const INITIAL_SAMPLE_JOBS = [];

// Resilient Background Cloud Sync Helpers (Auto-retries if Supabase module is loading)
function getCloudDb() {
  if (typeof window === 'undefined') return null;
  return window.DQSupabase || null;
}

function syncServiceCloud(service) {
  if (typeof window === 'undefined' || !service || !service.id) return;
  const db = getCloudDb();
  if (db && typeof db.saveService === 'function') {
    db.saveService(service).catch(e => console.warn('Service cloud sync error:', e));
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lateDb = getCloudDb();
      if (lateDb && typeof lateDb.saveService === 'function') {
        clearInterval(interval);
        lateDb.saveService(service).catch(e => console.warn('Delayed service cloud sync error:', e));
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);
  }
}

function deleteServiceCloud(serviceId) {
  if (typeof window === 'undefined' || !serviceId) return;
  const db = getCloudDb();
  if (db && typeof db.deleteService === 'function') {
    db.deleteService(serviceId).catch(e => console.warn('Service cloud delete error:', e));
  }
}

// Background auto-listener for cloud services sync
function initCloudServicesSync() {
  if (typeof window === 'undefined') return;
  let attempts = 0;
  let syncInitialized = false;

  const setupSync = () => {
    if (syncInitialized) return;
    const db = getCloudDb();
    if (db && typeof db.fetchServices === 'function') {
      syncInitialized = true;
      try {
        if (typeof db.subscribeServices === 'function') {
          db.subscribeServices((liveServices) => {
            if (Array.isArray(liveServices) && liveServices.length > 0) {
              localStorage.setItem('dq_services', JSON.stringify(liveServices));
              window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: liveServices }));
            }
          });
        }
        db.fetchServices().then((liveServices) => {
          if (Array.isArray(liveServices) && liveServices.length > 0) {
            localStorage.setItem('dq_services', JSON.stringify(liveServices));
            window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: liveServices }));
          }
        }).catch(() => {});
      } catch(e) {}
    }
  };

  setupSync();
  const interval = setInterval(() => {
    attempts++;
    setupSync();
    if (syncInitialized || attempts > 20) {
      clearInterval(interval);
    }
  }, 400);
}
// Background auto-listener for cloud reviews sync
function initCloudReviewsSync() {
  if (typeof window === 'undefined') return;
  let attempts = 0;
  let syncInitialized = false;

  const setupReviewSync = () => {
    if (syncInitialized) return;
    const db = getCloudDb();
    if (db && typeof db.fetchReviews === 'function') {
      syncInitialized = true;
      try {
        if (typeof db.subscribeReviews === 'function') {
          db.subscribeReviews((liveReviews) => {
            if (Array.isArray(liveReviews) && liveReviews.length > 0) {
              localStorage.setItem('dq_google_reviews', JSON.stringify(liveReviews));
              window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: liveReviews }));
            }
          });
        }
        db.fetchReviews().then((liveReviews) => {
          if (Array.isArray(liveReviews) && liveReviews.length > 0) {
            localStorage.setItem('dq_google_reviews', JSON.stringify(liveReviews));
            window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: liveReviews }));
          }
        }).catch(() => {});
      } catch(e) {}
    } else {
      // Fallback to direct /api/get-reviews
      fetch('/api/get-reviews')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
            localStorage.setItem('dq_google_reviews', JSON.stringify(data.reviews));
            window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: data.reviews }));
          }
        })
        .catch(() => {});
    }
  };

  setupReviewSync();
  const interval = setInterval(() => {
    attempts++;
    setupReviewSync();
    if (syncInitialized || attempts > 20) {
      clearInterval(interval);
    }
  }, 400);
}

// Background auto-listener for cloud portfolio sync across all pages
function initCloudPortfolioSync() {
  if (typeof window === 'undefined') return;
  let attempts = 0;
  let syncInitialized = false;

  const setupPortfolioSync = () => {
    if (syncInitialized) return;
    const db = getCloudDb();
    if (db && typeof db.fetchPortfolio === 'function') {
      syncInitialized = true;
      try {
        if (typeof db.subscribePortfolio === 'function') {
          db.subscribePortfolio((livePortfolio) => {
            if (Array.isArray(livePortfolio) && livePortfolio.length > 0) {
              localStorage.setItem('dq_portfolio_items', JSON.stringify(livePortfolio));
              window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: livePortfolio }));
            }
          });
        }
        db.fetchPortfolio().then((livePortfolio) => {
          if (Array.isArray(livePortfolio) && livePortfolio.length > 0) {
            localStorage.setItem('dq_portfolio_items', JSON.stringify(livePortfolio));
            window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: livePortfolio }));
          }
        }).catch(() => {});
      } catch(e) {}
    } else {
      // Direct REST fallback for immediate Supabase sync
      const supabaseUrl = 'https://gzbwvleuuxyidohujibj.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';
      fetch(`${supabaseUrl}/rest/v1/portfolio?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
      .then(res => res.json())
      .then(rows => {
        if (Array.isArray(rows) && rows.length > 0) {
          const parsed = rows.map(d => {
            let meta = {};
            if (Array.isArray(d.tags)) {
              d.tags.forEach(t => {
                if (typeof t === 'string' && t.startsWith('{')) {
                  try { meta = Object.assign(meta, JSON.parse(t)); } catch(e){}
                }
              });
            }
            return {
              id: d.id,
              title: d.title,
              category: d.category,
              deliveryTime: meta.deliveryTime || meta.delivery || (Array.isArray(d.tags) && d.tags[0]) || '⚡ 30m Delivery',
              image: d.image,
              description: meta.description || meta.desc || d.description || '',
              client: meta.client || d.designer || 'Verified Client'
            };
          });
          localStorage.setItem('dq_portfolio_items', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: parsed }));
        }
      })
      .catch(() => {});
    }
  };

  setupPortfolioSync();
  const interval = setInterval(() => {
    attempts++;
    setupPortfolioSync();
    if (syncInitialized || attempts > 20) {
      clearInterval(interval);
    }
  }, 400);
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCloudServicesSync();
      initCloudReviewsSync();
      initCloudPortfolioSync();
    });
  } else {
    initCloudServicesSync();
    initCloudReviewsSync();
    initCloudPortfolioSync();
  }
}

function syncPortfolioCloud(item) {
  if (typeof window === 'undefined' || !item || !item.id) return;
  const db = getCloudDb();
  if (db && typeof db.savePortfolioItem === 'function') {
    db.savePortfolioItem(item).catch(e => console.warn('Portfolio cloud sync error:', e));
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lateDb = getCloudDb();
      if (lateDb && typeof lateDb.savePortfolioItem === 'function') {
        clearInterval(interval);
        lateDb.savePortfolioItem(item).catch(e => console.warn('Delayed portfolio cloud sync error:', e));
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);
  }
}

function deletePortfolioCloud(itemId) {
  if (typeof window === 'undefined' || !itemId) return;
  const db = getCloudDb();
  if (db && typeof db.deletePortfolioItem === 'function') {
    db.deletePortfolioItem(itemId).catch(e => console.warn('Portfolio cloud delete error:', e));
  }
}

function syncReviewCloud(item) {
  if (typeof window === 'undefined' || !item || !item.id) return;
  // Direct Server API call
  try {
    fetch('/api/save-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item })
    }).catch(() => {});
  } catch(e) {}

  const db = getCloudDb();
  if (db && typeof db.saveReviewItem === 'function') {
    db.saveReviewItem(item).catch(e => console.warn('Review cloud sync error:', e));
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lateDb = getCloudDb();
      if (lateDb && typeof lateDb.saveReviewItem === 'function') {
        clearInterval(interval);
        lateDb.saveReviewItem(item).catch(e => console.warn('Delayed review cloud sync error:', e));
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);
  }
}

function deleteReviewCloud(itemId) {
  if (typeof window === 'undefined' || !itemId) return;
  try {
    fetch('/api/delete-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId })
    }).catch(() => {});
  } catch(e) {}

  const db = getCloudDb();
  if (db && typeof db.deleteReviewItem === 'function') {
    db.deleteReviewItem(itemId).catch(e => console.warn('Review cloud delete error:', e));
  }
}

function syncCityCloud(cityKey, addressData) {
  if (typeof window === 'undefined' || !cityKey) return;
  // Direct Server API call
  try {
    fetch('/api/save-city-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: cityKey,
        city: cityKey,
        address: addressData.address || '',
        phone: addressData.phone || '+91 86024 20897',
        name: addressData.name || ''
      })
    }).catch(() => {});
  } catch(e) {}

  const db = getCloudDb();
  if (db && typeof db.saveCityAddress === 'function') {
    db.saveCityAddress(cityKey, addressData).catch(e => console.warn('City cloud sync error:', e));
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lateDb = getCloudDb();
      if (lateDb && typeof lateDb.saveCityAddress === 'function') {
        clearInterval(interval);
        lateDb.saveCityAddress(cityKey, addressData).catch(e => console.warn('Delayed city cloud sync error:', e));
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);
  }
}

window.DQStore = {
  // Services
  getServices() {
    try {
      const stored = localStorage.getItem('dq_services');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => {
            // Assign nice fallback icons if missing
            if (!s.icon) {
              const id = (s.id || s.category || '').toLowerCase();
              if (id.includes('youtube') || id.includes('thumbnail')) s.icon = 'youtube';
              else if (id.includes('logo') || id.includes('branding')) s.icon = 'award';
              else if (id.includes('social')) s.icon = 'share-2';
              else if (id.includes('vector')) s.icon = 'pen-tool';
              else if (id.includes('visiting') || id.includes('card')) s.icon = 'credit-card';
              else if (id.includes('pack') || id.includes('label')) s.icon = 'package';
              else s.icon = 'palette';
            }
            if (!s.image || s.image.trim() === '') {
              s.image = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80';
            }
            return s;
          });
        }
      }
    } catch (e) {}
    localStorage.setItem('dq_services', JSON.stringify(DEFAULT_SERVICES));
    return DEFAULT_SERVICES;
  },

  resetServicesToDefault() {
    localStorage.setItem('dq_services', JSON.stringify(DEFAULT_SERVICES));
    window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: DEFAULT_SERVICES }));
    if (Array.isArray(DEFAULT_SERVICES)) {
      DEFAULT_SERVICES.forEach(s => syncServiceCloud(s));
    }
    return DEFAULT_SERVICES;
  },

  saveServices(services) {
    localStorage.setItem('dq_services', JSON.stringify(services));
    window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: services }));
    if (Array.isArray(services)) {
      services.forEach(s => syncServiceCloud(s));
    }
  },

  updateService(serviceId, updatedFields) {
    const list = this.getServices();
    const idx = list.findIndex(s => s.id === serviceId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      this.saveServices(list);
      syncServiceCloud(list[idx]);
      return list[idx];
    }
    return null;
  },

  getServiceById(id) {
    const list = this.getServices();
    return list.find(s => s.id === id || s.title.toLowerCase().includes(id.toLowerCase())) || list[0];
  },

  addService(service) {
    const list = this.getServices();
    const newService = {
      id: service.id || ('custom-' + Date.now()),
      title: service.title || 'Custom Design Service',
      price: Number(service.price) || 499,
      sla: service.sla || '45-60 mins',
      category: service.category || 'custom',
      description: service.description || service.desc || 'Custom graphic design project.',
      image: service.image || 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&auto=format&fit=crop&q=80',
      icon: service.icon || 'sparkles',
      ratio: service.ratio || 'Custom / As Required'
    };
    list.push(newService);
    this.saveServices(list);
    syncServiceCloud(newService);
    return newService;
  },

  deleteService(serviceId) {
    const list = this.getServices();
    const filtered = list.filter(s => s.id !== serviceId);
    this.saveServices(filtered);
    deleteServiceCloud(serviceId);
    return filtered;
  },

  getPortfolioItemById(portId) {
    if (!portId) return null;
    const list = this.getPortfolio();
    return list.find(p => p.id === portId) || null;
  },

  updatePortfolioItem(portId, updatedFields) {
    const list = this.getPortfolio();
    const idx = list.findIndex(p => p.id === portId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      localStorage.setItem('dq_portfolio_items', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: list }));
      syncPortfolioCloud(list[idx]);
      return list[idx];
    }
    return null;
  },

  addPortfolioItem(item) {
    const list = this.getPortfolio();
    const newItem = {
      id: 'port-' + Date.now(),
      title: item.title || 'Creative Project',
      category: item.category || 'social',
      delivery: item.delivery || item.deliveryTime || '⚡ 30-45m Delivery',
      deliveryTime: item.delivery || item.deliveryTime || '⚡ 30-45m Delivery',
      image: item.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700&auto=format&fit=crop&q=80',
      description: item.description !== undefined ? item.description : (item.desc || ''),
      client: item.client || 'Verified Client'
    };
    list.unshift(newItem);
    this.savePortfolio(list);
    syncPortfolioCloud(newItem);
    return newItem;
  },



  deletePortfolioItem(portId) {
    const list = this.getPortfolio();
    const filtered = list.filter(p => p.id !== portId);
    this.savePortfolio(filtered);
    deletePortfolioCloud(portId);
    return filtered;
  },

  resetServicesToDefault() {
    this.saveServices(DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
  },

  resetPortfolioToDefault() {
    this.savePortfolio(DEFAULT_PORTFOLIO);
    return DEFAULT_PORTFOLIO;
  },

  savePortfolio(items) {
    localStorage.setItem('dq_portfolio_items', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: items }));
    if (Array.isArray(items)) {
      items.forEach(p => syncPortfolioCloud(p));
    }
  },

  // Google Reviews Management
  getReviews() {
    try {
      const stored = localStorage.getItem('dq_google_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    localStorage.setItem('dq_google_reviews', JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  },

  // City-Specific Reviews Filter (Matches review.city or text mentions)
  getReviewsByCity(cityKeyOrName) {
    const all = this.getReviews();
    if (!cityKeyOrName || cityKeyOrName === 'all' || cityKeyOrName === 'all-cities' || cityKeyOrName === 'global') {
      return all;
    }
    const cleanTarget = cityKeyOrName.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!cleanTarget) return all;

    const citySpecific = [];
    const globalReviews = [];

    all.forEach(r => {
      if (!r) return;
      const rCity = (r.city || '').toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (!rCity || rCity === 'allcities' || rCity === 'all' || rCity === 'global') {
        globalReviews.push(r);
        return;
      }
      if (rCity === cleanTarget || rCity.includes(cleanTarget) || cleanTarget.includes(rCity)) {
        citySpecific.push(r);
        return;
      }
      const rRole = (r.role || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      const rText = (r.review || r.text || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rRole.includes(cleanTarget) || rText.includes(cleanTarget)) {
        citySpecific.push(r);
        return;
      }
    });

    return citySpecific.length > 0 ? [...citySpecific, ...globalReviews] : globalReviews;
  },

  saveReviews(items) {
    localStorage.setItem('dq_google_reviews', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('dq_reviews_updated', { detail: items }));
    if (Array.isArray(items)) {
      items.forEach(r => syncReviewCloud(r));
    }
  },

  getReviewById(revId) {
    if (!revId) return null;
    const list = this.getReviews();
    return list.find(r => r.id === revId || String(r.id) === String(revId)) || null;
  },

  addReview(reviewData) {
    const list = this.getReviews();
    const newRev = {
      id: 'rev-' + Date.now(),
      name: reviewData.name || 'Verified Client',
      role: reviewData.role || 'Client',
      city: reviewData.city || 'All Cities',
      rating: Number(reviewData.rating) || 5,
      avatar: reviewData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      review: reviewData.review || reviewData.text || 'Super fast turnaround and great quality design work.',
      verified: true,
      date: reviewData.date || 'Recently'
    };
    list.unshift(newRev);
    this.saveReviews(list);
    syncReviewCloud(newRev);
    return newRev;
  },

  updateReview(revId, updatedFields) {
    const list = this.getReviews();
    const idx = list.findIndex(r => r.id === revId || String(r.id) === String(revId));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      this.saveReviews(list);
      syncReviewCloud(list[idx]);
      return list[idx];
    }
    return null;
  },

  deleteReview(revId) {
    const list = this.getReviews();
    const filtered = list.filter(r => r.id !== revId && String(r.id) !== String(revId));
    this.saveReviews(filtered);
    deleteReviewCloud(revId);
    return filtered;
  },

  resetReviewsToDefault() {
    this.saveReviews(DEFAULT_REVIEWS);
    return DEFAULT_REVIEWS;
  },

  // City Hub Addresses (Configurable by Admin & Rendered on Landing Pages)
  getDefaultCityAddresses() {
    return {
      'indore': {
        name: 'Indore Central Creative Hub',
        address: 'Vijay Nagar Commercial Complex, Near Brilliant Convention Centre, A.B. Road, Indore, MP 452010',
        landmark: 'Vijay Nagar Square / Super Corridor',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM (30m Express Delivery)'
      },
      'bhopal': {
        name: 'Bhopal Creative Hub',
        address: 'Zone-1, M.P. Nagar, Near DB City Mall, Bhopal, MP 462011',
        landmark: 'MP Nagar Zone 1 / Arera Colony',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'mumbai': {
        name: 'Mumbai Regional Operations',
        address: 'Platina Tower, G-Block, Bandra Kurla Complex (BKC), Bandra East, Mumbai, MH 400051',
        landmark: 'BKC Business District / Bandra West',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open 24/7 Priority Workstations'
      },
      'delhi': {
        name: 'Delhi NCR Creative Studio',
        address: 'Statesman House, Barakhamba Road, Connaught Place, New Delhi, DL 110001',
        landmark: 'Connaught Place / Cyber City Gurugram',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'delhi-ncr': {
        name: 'Delhi NCR Regional Studio',
        address: 'Statesman House, Barakhamba Road, Connaught Place, New Delhi, DL 110001',
        landmark: 'Connaught Place / Cyber City Gurugram',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'bangalore': {
        name: 'Bangalore Tech Creative Node',
        address: 'Prestige Meridian, 100 Feet Road, 4th Block, Koramangala, Bengaluru, KA 560034',
        landmark: 'Koramangala 4th Block / Indiranagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'hyderabad': {
        name: 'Hyderabad Creator Hub',
        address: 'Cyber Towers, HITEC City Main Road, Madhapur, Hyderabad, TS 500081',
        landmark: 'HITEC City / Jubilee Hills',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'pune': {
        name: 'Pune Design Workstation',
        address: 'Business Bay, North Main Road, Koregaon Park, Pune, MH 411001',
        landmark: 'Koregaon Park / Baner',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'ahmedabad': {
        name: 'Ahmedabad Commercial Hub',
        address: 'Mondeal Heights, S.G. Highway, Prahlad Nagar, Ahmedabad, GJ 380015',
        landmark: 'S.G. Highway / Bodakdev',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'jaipur': {
        name: 'Jaipur Creative Studio',
        address: 'Apex Tower, Tonk Road, C-Scheme, Jaipur, RJ 302001',
        landmark: 'C-Scheme / Malviya Nagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'chennai': {
        name: 'Chennai Studio Node',
        address: 'Tidel Park, Rajiv Gandhi Salai, Taramani / OMR, Chennai, TN 600113',
        landmark: 'OMR IT Corridor / T. Nagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'kolkata': {
        name: 'Kolkata Design Center',
        address: 'Millennium City IT Park, DN Block, Sector V, Salt Lake, Kolkata, WB 700091',
        landmark: 'Salt Lake Sector V / Park Street',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'lucknow': {
        name: 'Lucknow Operations Hub',
        address: 'Rana Pratap Marg, Hazratganj & Gomti Nagar, Lucknow, UP 226001',
        landmark: 'Hazratganj / Gomti Nagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'surat': {
        name: 'Surat Commercial Center',
        address: 'International Business Center, VIP Road, Vesu, Surat, GJ 395007',
        landmark: 'Vesu / Ring Road Textile Market',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'chandigarh': {
        name: 'Chandigarh Studio Hub',
        address: 'City Centre, Sector 17-C, Near Parade Ground, Chandigarh, CH 160017',
        landmark: 'Sector 17 / Mohali Phase 7',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'nagpur': {
        name: 'Nagpur Creative Hub',
        address: 'Empress City, Ramdaspeth, Wardha Road, Nagpur, MH 440010',
        landmark: 'Ramdaspeth / Sitabuldi',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'patna': {
        name: 'Patna Regional Studio',
        address: 'Biscomaun Bhawan, Gandhi Maidan, Fraser Road, Patna, BR 800001',
        landmark: 'Gandhi Maidan / Boring Road',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'kochi': {
        name: 'Kochi Creative Desk',
        address: 'Infopark Expressway, Kakkanad, Kochi, KL 682042',
        landmark: 'Kakkanad Infopark / MG Road',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      }
    };
  },

  getCityAddresses() {
    try {
      const stored = localStorage.getItem('dq_city_addresses');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.getDefaultCityAddresses(), ...parsed };
      }
    } catch(e) {}
    return this.getDefaultCityAddresses();
  },

  getCityAddress(cityKey) {
    const addresses = this.getCityAddresses();
    const cleanKey = (cityKey || '').toString().toLowerCase().trim().replace(/\s+/g, '-');
    return addresses[cleanKey] || addresses['indore'] || {
      name: `${(cityKey || 'City').toUpperCase()} Design Hub`,
      address: `Express Creative Dispatch Center, Commercial Area, ${cityKey || 'Local Hub'}`,
      landmark: 'Main Commercial Center',
      phone: '+91 86024 20897',
      whatsapp: '918602420897',
      hours: 'Open Daily 9:00 AM - 11:30 PM'
    };
  },

  saveCityAddress(cityKey, addressData) {
    const cleanKey = (cityKey || '').toString().toLowerCase().trim().replace(/\s+/g, '-');
    const all = this.getCityAddresses();
    all[cleanKey] = { ...all[cleanKey], ...addressData };
    localStorage.setItem('dq_city_addresses', JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('dq_cities_updated', { detail: all }));
    syncCityCloud(cleanKey, all[cleanKey]);
    return all[cleanKey];
  },

  // Universal Job Price Resolver (Matches exact service price or category defaults)
  getJobPrice(job) {
    if (!job) return 399;
    if (job.price && Number(job.price) > 0) {
      return Number(job.price);
    }
    const rawSvc = (job.service || job.serviceId || job.category || '').toString().toLowerCase().trim();
    
    // Check registered services
    const services = this.getServices();
    const matched = services.find(s => 
      s.id.toLowerCase() === rawSvc || 
      s.title.toLowerCase() === rawSvc ||
      rawSvc.includes(s.id.toLowerCase()) ||
      s.title.toLowerCase().includes(rawSvc)
    );
    if (matched && matched.price) return Number(matched.price);

    // Fallback dictionary for all service types
    if (rawSvc.includes('youtube') || rawSvc.includes('thumbnail')) return 359;
    if (rawSvc.includes('visiting') || rawSvc.includes('card') || rawSvc.includes('business card')) return 359;
    if (rawSvc.includes('social') || rawSvc.includes('instagram') || rawSvc.includes('post') || rawSvc.includes('feed') || rawSvc.includes('reel')) return 399;
    if (rawSvc.includes('flyer') || rawSvc.includes('poster') || rawSvc.includes('banner')) return 449;
    if (rawSvc.includes('logo') || rawSvc.includes('branding') || rawSvc.includes('brand')) return 499;
    if (rawSvc.includes('vector') || rawSvc.includes('tracing') || rawSvc.includes('svg')) return 599;
    if (rawSvc.includes('brochure') || rawSvc.includes('catalog') || rawSvc.includes('menu')) return 599;
    if (rawSvc.includes('packaging') || rawSvc.includes('label') || rawSvc.includes('pouch') || rawSvc.includes('box')) return 699;
    
    return 399;
  },

  // Calculate designer payout (60%)
  getDesignerPayout(price) {
    const num = Number(price) || 0;
    return Math.round(num * 0.60);
  },

  // Calculate platform cut (40%)
  getPlatformCut(price) {
    const num = Number(price) || 0;
    return Math.round(num * 0.40);
  },

  // Icon Helper that reliably outputs relative inline SVG icons for every service
  renderIconHtml(serviceOrIcon, classes = 'w-4 h-4 sm:w-5 sm:h-5') {
    let iconName = '';
    let svcId = '';
    if (typeof serviceOrIcon === 'object' && serviceOrIcon !== null) {
      svcId = (serviceOrIcon.id || serviceOrIcon.serviceId || serviceOrIcon.category || '').toLowerCase();
      iconName = (serviceOrIcon.icon || '').toLowerCase();
    } else {
      iconName = (serviceOrIcon || '').toString().toLowerCase();
      svcId = iconName;
    }

    // 1. YouTube Thumbnails -> Authentic Red YouTube Badge with white play triangle
    if (svcId.includes('youtube') || svcId.includes('thumbnail') || iconName === 'youtube' || iconName === 'play-square' || iconName === 'video') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    }

    // 2. Brand Logo Design -> Golden Medal / Award Ribbon Badge
    if (svcId.includes('logo') || svcId.includes('branding') || iconName === 'award' || iconName === 'crown' || iconName === 'hexagon') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
    }

    // 3. Visiting Cards / Business Cards -> Modern Credit / Visiting Card Badge
    if (svcId.includes('visiting') || svcId.includes('card') || iconName === 'credit-card') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><circle cx="6" cy="15" r="1" fill="#059669"/></svg>`;
    }

    // 4. Product Label & Packaging -> 3D Package Box Badge
    if (svcId.includes('pack') || svcId.includes('label') || iconName === 'package' || iconName === 'box') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
    }

    // 5. Social Media Posts -> Network Share / Connect Badge
    if (svcId.includes('social') || iconName === 'share-2' || iconName === 'share') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`;
    }

    // 6. Vector Art & Tracing -> Professional Pen Tool Badge
    if (svcId.includes('vector') || iconName === 'pen-tool' || iconName === 'pen') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
    }

    // 7. Custom Graphic Design -> Artist Palette Badge
    if (svcId.includes('custom') || iconName === 'palette' || iconName === 'brush') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#9333EA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="#9333EA"/><circle cx="17.5" cy="10.5" r=".5" fill="#9333EA"/><circle cx="8.5" cy="7.5" r=".5" fill="#9333EA"/><circle cx="6.5" cy="12.5" r=".5" fill="#9333EA"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;
    }

    // 8. Flyers & Pamphlets -> Document / Flyer Badge
    if (svcId.includes('flyer') || svcId.includes('pamphlet') || iconName === 'file-text') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`;
    }

    // 9. Restaurant Menu -> Open Book / Menu Badge
    if (svcId.includes('menu') || svcId.includes('restaurant') || iconName === 'book-open') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
    }

    // Default Fallback: Creative Sparkles Vector
    return `<svg class="${classes} shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
  },

  // Portfolio
  getPortfolio() {
    try {
      const stored = localStorage.getItem('dq_portfolio_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldDummy = parsed.some(p => p && p.title && p.title.includes('Tech Review High-CTR'));
          if (!hasOldDummy) {
            return parsed.map(p => ({
              client: 'Verified Brand',
              city: 'India',
              ...p
            }));
          }
        }
      }
    } catch (e) {}
    localStorage.setItem('dq_portfolio_items', JSON.stringify(DEFAULT_PORTFOLIO));
    return DEFAULT_PORTFOLIO;
  },


  // Canonical Job ID Normalizer (Consistently produces DQ-XXXXXX, eliminating duplicates)
  normalizeJobId(id) {
    if (!id) return '';
    let str = id.toString().trim().toUpperCase();
    str = str.replace(/^(DQ[-_]?)+/i, '');
    return 'DQ-' + str;
  },

  // Deduplicate and filter blacklisted/deleted jobs
  deduplicateJobs(jobsList) {
    if (!Array.isArray(jobsList)) return [];
    let deletedJobs = [];
    try {
      deletedJobs = JSON.parse(localStorage.getItem('dq_deleted_jobs') || '[]');
    } catch(e) {}
    const deletedNormSet = new Set(deletedJobs.map(d => this.normalizeJobId(d)));

    const seen = new Set();
    const result = [];

    for (const j of jobsList) {
      if (!j) continue;
      const normId = this.normalizeJobId(j.id || j.jobId);
      if (!normId) continue;

      // Permanently filter out legacy dummy demo jobs
      const normIdStr = normId.toString();
      if (normIdStr === 'DQ-8492' || normIdStr === 'DQ-7319' || 
          normIdStr === 'DQ-3LZEFW' || normIdStr === 'DQ-PEHTGK' || normIdStr === 'DQ-NY8Q84') {
        continue;
      }

      if (deletedNormSet.has(normId)) continue; // Block deleted/blacklisted
      if (seen.has(normId)) continue; // Block duplicates!
      seen.add(normId);

      j.id = normId; // Ensure canonical ID on object
      result.push(j);
    }
    return result;
  },

  // Jobs
  getJobs() {
    try {
      const stored = localStorage.getItem('dq_live_jobs');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return this.deduplicateJobs(parsed);
        }
      }
    } catch (e) {}
    return [];
  },

  saveJobs(jobs) {
    const clean = this.deduplicateJobs(jobs);
    localStorage.setItem('dq_live_jobs', JSON.stringify(clean));
    return clean;
  },

  deleteJob(jobId) {
    if (!jobId) return false;
    const normId = this.normalizeJobId(jobId);
    const bareId = normId.replace(/^DQ-/, '');

    // 1. Add ALL variations to dq_deleted_jobs blacklist
    try {
      let deletedJobs = JSON.parse(localStorage.getItem('dq_deleted_jobs') || '[]');
      [normId, bareId, jobId.toString().trim().toUpperCase(), `DQ${bareId}`].forEach(v => {
        if (v && !deletedJobs.includes(v)) deletedJobs.push(v);
      });
      localStorage.setItem('dq_deleted_jobs', JSON.stringify(deletedJobs));
    } catch(e) {}

    // 2. Remove from local storage
    let jobs = [];
    try {
      jobs = JSON.parse(localStorage.getItem('dq_live_jobs') || '[]');
    } catch(e) {}
    const initialLen = jobs.length;
    jobs = jobs.filter(j => {
      const jNorm = this.normalizeJobId(j.id || j.jobId);
      return jNorm !== normId && (j.id || '').toUpperCase() !== normId && (j.id || '').toUpperCase() !== bareId;
    });
    localStorage.setItem('dq_live_jobs', JSON.stringify(jobs));

    // 3. Dispatch to Supabase / Cloud if present
    const cloudDb = getCloudDb();
    if (cloudDb && typeof cloudDb.deleteJob === 'function') {
      cloudDb.deleteJob(normId);
    }

    return jobs.length < initialLen;
  },

  getJobById(jobId) {
    if (!jobId) return null;
    const targetNorm = this.normalizeJobId(jobId);
    const jobs = this.getJobs();
    return jobs.find(j => this.normalizeJobId(j.id || j.jobId) === targetNorm) || null;
  },

  // Update Job Status
  updateJobStatus(jobId, newStatus, isCompleted = null) {
    const targetNorm = this.normalizeJobId(jobId);
    const jobs = this.getJobs();
    let updated = null;
    jobs.forEach(j => {
      if (this.normalizeJobId(j.id || j.jobId) === targetNorm) {
        j.status = newStatus;
        if (isCompleted !== null) {
          j.completed = isCompleted;
          if (isCompleted && !j.completedAt) {
            j.completedAt = new Date().toISOString();
          }
        } else if (newStatus.toLowerCase().includes('completed') || newStatus.toLowerCase().includes('delivered')) {
          j.completed = true;
          j.completedAt = j.completedAt || new Date().toISOString();
        }
        updated = j;
      }
    });
    if (updated) {
      this.saveJobs(jobs);
      const cloudDb = getCloudDb();
      if (cloudDb && typeof cloudDb.updateJobStatus === 'function') {
        cloudDb.updateJobStatus(targetNorm, newStatus, { completed: updated.completed });
      }
    }
    return updated;
  },

  // Earnings calculations
  getAdminEarnings() {
    const jobs = this.getJobs();
    return jobs
      .filter(j => j.completed === true)
      .reduce((sum, j) => sum + this.getJobPrice(j), 0);
  },

  // Universal Date Parser (Supports Indian DD/MM/YYYY, ISO, locale strings & relative times)
  parseDate(rawDate) {
    if (!rawDate) return new Date();
    if (rawDate instanceof Date) return rawDate;
    if (typeof rawDate === 'number') return new Date(rawDate);

    const str = rawDate.toString().trim();
    if (!str || str.toLowerCase().includes('ago') || str.toLowerCase().includes('now') || str.toLowerCase().includes('active') || str.toLowerCase().includes('recent')) {
      return new Date();
    }

    // Check Indian format DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const rest = dmyMatch[4] || '';

      let hours = 0, minutes = 0, seconds = 0;
      const timeMatch = rest.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        const ampm = (timeMatch[4] || '').toLowerCase();
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    const parsed = Date.parse(str);
    if (!isNaN(parsed)) return new Date(parsed);

    return new Date();
  },

  // Dynamic Time-Filtered Admin Financial Analytics (100% Original Value)
  // Persistent Earnings Ledger Management
  getEarningsLedger() {
    try {
      const stored = localStorage.getItem('dq_earnings_ledger');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    return [];
  },

  saveEarningsLedger(ledger) {
    if (!Array.isArray(ledger)) return [];
    localStorage.setItem('dq_earnings_ledger', JSON.stringify(ledger));
    try {
      window.dispatchEvent(new CustomEvent('dq_ledger_updated', { detail: ledger }));
    } catch(e) {}
    return ledger;
  },

  recordCompletedJobToLedger(job) {
    if (!job) return null;
    const normId = this.normalizeJobId(job.id || job.jobId);
    if (!normId) return null;

    const ledger = this.getEarningsLedger();
    const existingIdx = ledger.findIndex(l => this.normalizeJobId(l.id || l.jobId) === normId);

    const price = this.getJobPrice(job);
    const designerCut = Math.round(price * 0.60);
    const platformCut = price - designerCut;

    const ledgerEntry = {
      id: normId,
      jobId: normId,
      project: job.project || job.projectName || 'Graphic Design Request',
      service: job.service || 'Design',
      ratio: job.ratio || '1:1',
      brief: job.brief || '',
      price: price,
      clientPhone: job.phone || job.whatsapp || '',
      acceptedBy: Array.isArray(job.acceptedBy) ? job.acceptedBy : [],
      completed: true,
      designerCompleted: true,
      adminCompleted: true,
      status: job.status || 'Completed & Vector Delivered',
      completedAt: job.completedAt || new Date().toISOString(),
      createdAt: job.createdAt || job.time || new Date().toISOString(),
      designerCut: designerCut,
      platformCut: platformCut,
      payoutStatus: (existingIdx !== -1 && ledger[existingIdx].payoutStatus) ? ledger[existingIdx].payoutStatus : 'Pending',
      payoutPaidAt: (existingIdx !== -1 && ledger[existingIdx].payoutPaidAt) ? ledger[existingIdx].payoutPaidAt : null,
      payoutAmount: designerCut
    };

    if (existingIdx !== -1) {
      ledger[existingIdx] = { ...ledger[existingIdx], ...ledgerEntry };
    } else {
      ledger.unshift(ledgerEntry);
    }

    this.saveEarningsLedger(ledger);
    return ledgerEntry;
  },

  updatePayoutStatusInLedger(jobId, payoutStatus, payoutAmount = null) {
    if (!jobId) return false;
    const normId = this.normalizeJobId(jobId);
    const ledger = this.getEarningsLedger();
    const idx = ledger.findIndex(l => this.normalizeJobId(l.id || l.jobId) === normId);

    if (idx !== -1) {
      ledger[idx].payoutStatus = payoutStatus;
      if (payoutStatus === 'Paid' || payoutStatus === 'Amount Paid to Designer') {
        ledger[idx].payoutStatus = 'Paid';
        ledger[idx].payoutPaidAt = new Date().toISOString();
        if (payoutAmount) ledger[idx].payoutAmount = payoutAmount;
      } else {
        ledger[idx].payoutStatus = 'Pending';
      }
      this.saveEarningsLedger(ledger);
      return ledger[idx];
    } else {
      const activeJob = this.getJobById(jobId);
      if (activeJob) {
        const newEntry = this.recordCompletedJobToLedger(activeJob);
        if (newEntry) {
          return this.updatePayoutStatusInLedger(jobId, payoutStatus, payoutAmount);
        }
      }
    }
    return false;
  },

  getMergedJobsForEarnings() {
    const activeJobs = this.getJobs() || [];
    const ledger = this.getEarningsLedger() || [];

    const seen = new Set();
    const merged = [];

    activeJobs.forEach(j => {
      if (!j) return;
      const normId = this.normalizeJobId(j.id || j.jobId);
      if (!normId) return;
      seen.add(normId);

      const ledgerMatch = ledger.find(l => this.normalizeJobId(l.id || l.jobId) === normId);
      if (ledgerMatch) {
        const isPaid = ledgerMatch.payoutStatus === 'Paid' || j.payoutStatus === 'Paid' || ledgerMatch.payoutStatus === 'Amount Paid to Designer' || j.payoutStatus === 'Amount Paid to Designer';
        merged.push({
          ...j,
          payoutStatus: isPaid ? 'Paid' : (ledgerMatch.payoutStatus || j.payoutStatus || 'Unpaid'),
          payoutPaidAt: ledgerMatch.payoutPaidAt || j.payoutPaidAt || null,
          payoutAmount: ledgerMatch.payoutAmount || Math.round(this.getJobPrice(j) * 0.60)
        });
      } else {
        merged.push(j);
      }
    });

    ledger.forEach(l => {
      if (!l) return;
      const normId = this.normalizeJobId(l.id || l.jobId);
      if (!normId || seen.has(normId)) return;
      seen.add(normId);
      merged.push({
        ...l,
        completed: true,
        status: l.status || 'Completed & Vector Delivered'
      });
    });

    return merged;
  },

  getFilteredAdminStats(timeFilter = 'all') {
    const jobs = this.getMergedJobsForEarnings() || [];
    const now = new Date();

    const filteredJobs = jobs.filter(j => {
      if (!j) return false;
      if (timeFilter === 'all') return true;

      const date = this.parseDate(j.createdAt || j.completedAt || j.date || j.time);
      if (!date || isNaN(date.getTime())) return true;

      if (timeFilter === 'today') {
        return date.getFullYear() === now.getFullYear() &&
               date.getMonth() === now.getMonth() &&
               date.getDate() === now.getDate();
      } else if (timeFilter === '7days') {
        const diffMs = now.getTime() - date.getTime();
        return diffMs >= -86400000 && diffMs <= (7 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (timeFilter === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });

    let completedRevenue = 0;
    let completedOrders = 0;
    let inProgressOrders = 0;
    let pipelinePendingRevenue = 0;

    filteredJobs.forEach(job => {
      const price = this.getJobPrice(job);

      const isCompleted = job.completed === true || 
                          (job.status && (job.status.toLowerCase().includes('completed') || job.status.toLowerCase().includes('delivered')));
      
      if (isCompleted) {
        completedRevenue += price;
        completedOrders++;
      } else {
        pipelinePendingRevenue += price;
        inProgressOrders++;
      }
    });

    const totalOrders = filteredJobs.length;
    // Real realized revenue strictly on properly completed jobs
    const grossRevenue = completedRevenue;
    // Designer cut (60% payout) & Platform cut (40% net share) strictly on realized completed earnings
    const designerPayouts = Math.round(completedRevenue * 0.60);
    const platformNetShare = completedRevenue - designerPayouts;

    return {
      timeFilter,
      totalOrders: totalOrders || 0,
      completedOrders: completedOrders || 0,
      completedCount: completedOrders || 0,
      inProgressOrders: inProgressOrders || 0,
      pendingCount: inProgressOrders || 0,
      grossRevenue: grossRevenue || 0,
      totalGrossRevenue: grossRevenue || 0,
      completedRevenue: completedRevenue || 0,
      pipelinePendingRevenue: pipelinePendingRevenue || 0,
      pipelineTotalValue: (completedRevenue + pipelinePendingRevenue) || 0,
      designerPayouts: designerPayouts || 0,
      platformNetShare: platformNetShare || 0,
      platformNetProfit: platformNetShare || 0,
      filteredJobs: filteredJobs || []
    };
  },

  getDesignerEarnings(designerIdentifier) {
    const jobs = this.getMergedJobsForEarnings();
    if (!designerIdentifier) return 0;
    const clean = designerIdentifier.toString().toLowerCase().replace(/[^0-9a-z]/g, '');
    
    // Also include any manual accumulated earnings if present
    let extraEarnings = 0;
    try {
      extraEarnings = Number(localStorage.getItem(`dq_extra_earnings_${clean}`)) || 0;
    } catch(e) {}

    const fromCompletedJobs = jobs
      .filter(j => {
        if (!j.completed) return false;
        if (!Array.isArray(j.acceptedBy)) return false;
        return j.acceptedBy.some(a => {
          const aClean = a.toString().toLowerCase().replace(/[^0-9a-z]/g, '');
          return aClean.includes(clean) || clean.includes(aClean);
        });
      })
      .reduce((sum, j) => sum + this.getDesignerPayout(this.getJobPrice(j)), 0);

    return fromCompletedJobs + extraEarnings;
  }
};

// =========================================================================


// =========================================================================
// DESIGN QUIXO 5X NOTIFICATION SOUND ENGINE & AUDIO SERVICE
// Plays user-provided notification MP3 (universfield chime) 5 times
// Supports Web Audio API (scheduled hardware clock), HTML5 Audio, and Synthesis
// =========================================================================
(function() {
  if (typeof window === "undefined") return;

  const service = window.DQSoundService || {};

  service.audioCtx = service.audioCtx || null;
  service.isUnlocked = service.isUnlocked || false;
  service.pendingChime = service.pendingChime || false;
  service.pendingRepeatCount = service.pendingRepeatCount || 5;
  service.initializedWatcher = service.initializedWatcher || false;
  service.soundEnabled = true;
  service._decodedBuffer = service._decodedBuffer || null;
  service._isDecoding = false;
  service._isPlaying = false;

  service.getAudioContext = function() {
    try {
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      return this.audioCtx;
    } catch(e) {
      return null;
    }
  };

  service.preDecodeAudio = async function() {
    if (this._decodedBuffer || this._isDecoding) return;
    this._isDecoding = true;

    const ctx = this.getAudioContext();
    if (!ctx) {
      this._isDecoding = false;
      return;
    }

    // 1. Try direct MP3 file URLs
    const urls = ["/notification.mp3", "/universfield-new-notification-036-485897.mp3", "notification.mp3"];
    for (const u of urls) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          ctx.decodeAudioData(ab, (buf) => {
            this._decodedBuffer = buf;
            this._isDecoding = false;
            console.log("[DQSoundService] ✅ MP3 buffer decoded successfully from " + u + " (" + buf.duration.toFixed(2) + "s)");
          }, () => {});
          return;
        }
      } catch(e) {}
    }

    // 2. Try embedded base64 Data URI
    try {
      const uri = window.NOTIFICATION_MP3_DATA_URI || this.mp3DataUri;
      if (uri) {
        const b64 = uri.replace(/^data:audio\/[^;]+;base64,/, "");
        const binary = window.atob(b64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        ctx.decodeAudioData(bytes.buffer.slice(0), (buf) => {
          this._decodedBuffer = buf;
          this._isDecoding = false;
          console.log("[DQSoundService] ✅ MP3 buffer decoded from base64 Data URI (" + buf.duration.toFixed(2) + "s)");
        }, () => {
          this._isDecoding = false;
        });
      }
    } catch(e) {
      this._isDecoding = false;
    }
  };

  service.unlockAudio = async function() {
    this.isUnlocked = true;
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === "suspended") {
        await ctx.resume();
      }
      if (ctx && ctx.state === "running") {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.00001;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.01);
        } catch(e) {}
      }

      this.preDecodeAudio();

      const banner = document.getElementById("dq-audio-unlock-banner");
      if (banner) banner.remove();

      if (this.pendingChime) {
        this.pendingChime = false;
        const count = this.pendingRepeatCount || 5;
        console.log("[DQSoundService] 🔔 Playing queued " + count + "x chime now that audio is unlocked!");
        this.playNewJobChime(count);
      }
    } catch(e) {}
  };

  service.playNewJobChime = async function(repeatCount = 5) {
    if (!this.soundEnabled) return false;
    console.log("[DQSoundService] 🔊 Playing " + repeatCount + "x Notification Sound Alert...");

    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      try { ctx.resume(); } catch(e) {}
    }

    if (!this._decodedBuffer) {
      this.preDecodeAudio();
    }

    // STRATEGY 1: Web Audio BufferSource hardware-clock scheduling (Best quality, 0 latency, immune to background tab throttle)
    if (ctx && ctx.state === "running" && this._decodedBuffer) {
      try {
        console.log("[DQSoundService] 🎵 Scheduling " + repeatCount + "x MP3 bursts via Web Audio hardware clock!");
        const start = ctx.currentTime;
        for (let i = 0; i < repeatCount; i++) {
          const src = ctx.createBufferSource();
          src.buffer = this._decodedBuffer;
          const gain = ctx.createGain();
          gain.gain.value = 1.0;
          src.connect(gain);
          gain.connect(ctx.destination);
          src.start(start + (i * 0.65));
        }
        this.clearPendingAlerts();
        return true;
      } catch(err) {
        console.warn("[DQSoundService] Web Audio buffer error:", err);
      }
    }

    // STRATEGY 2: HTML5 Audio fallback
    try {
      console.log("[DQSoundService] 🎵 Playing " + repeatCount + "x MP3 via HTML5 Audio!");
      for (let i = 0; i < repeatCount; i++) {
        setTimeout(() => {
          try {
            const audio = new Audio("/notification.mp3");
            audio.volume = 1.0;
            const p = audio.play();
            if (p !== undefined) {
              p.then(() => {
                this.clearPendingAlerts();
              }).catch((err) => {
                console.warn("[DQSoundService] HTML5 Audio autoplay blocked:", err?.name);
                this.pendingChime = true;
                this.pendingRepeatCount = repeatCount;
                this.showAutoplayUnlockBanner();
              });
            }
          } catch(e) {}
        }, i * 650);
      }
      return true;
    } catch(e) {}

    // STRATEGY 3: Harmonic Synthesizer Chimes
    try {
      if (ctx && ctx.state === "running") {
        for (let i = 0; i < repeatCount; i++) {
          setTimeout(() => {
            try {
              const now = ctx.currentTime;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(1046.5, now);
              osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.08);
              osc.frequency.exponentialRampToValueAtTime(2093.00, now + 0.28);
              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.exponentialRampToValueAtTime(0.8, now + 0.04);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 0.46);
            } catch(e) {}
          }, i * 500);
        }
        return true;
      }
    } catch(e) {}

    this.pendingChime = true;
    this.pendingRepeatCount = repeatCount;
    this.showAutoplayUnlockBanner();
    return false;
  };

  service.playSingleTone = function() {
    return this.playNewJobChime(1);
  };

  service.clearPendingAlerts = function() {
    this.pendingChime = false;
    try {
      localStorage.removeItem("dq_unacknowledged_sound_jobs");
    } catch(e) {}
    const banner = document.getElementById("dq-audio-unlock-banner");
    if (banner) banner.remove();
  };

  service.showAutoplayUnlockBanner = function(jobTitle = "New Design Brief") {
    if (typeof document === "undefined") return;
    const bannerId = "dq-audio-unlock-banner";
    if (document.getElementById(bannerId)) return;

    const banner = document.createElement("div");
    banner.id = bannerId;
    banner.className = "fixed bottom-5 right-5 z-[999999] bg-emerald-600 hover:bg-emerald-700 text-white p-4 px-5 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-3.5 cursor-pointer transition-all duration-300 transform scale-100 hover:scale-105";
    banner.innerHTML = `
      <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0 animate-bounce">
        🔊
      </div>
      <div>
        <div class="font-extrabold text-sm tracking-wide flex items-center gap-1.5">
          <span>New Job Alert!</span>
          <span class="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">5x SOUND WAITING</span>
        </div>
        <div class="text-xs text-emerald-100 mt-0.5 font-medium">Click anywhere or click here to listen to notification sound</div>
      </div>
      <button type="button" class="ml-2 bg-white text-emerald-800 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-100">
        Play Sound (5x)
      </button>
    `;

    banner.onclick = (e) => {
      e.stopPropagation();
      banner.remove();
      this.unlockAudio();
      this.playNewJobChime(5);
    };

    document.body.appendChild(banner);
  };

  service.showNewJobBanner = function(job, title = "Job Update Alert") {
    if (typeof document === "undefined") return;
    try {
      const bannerId = "dq-new-job-audio-toast";
      let existing = document.getElementById(bannerId);
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.id = bannerId;
      toast.className = "fixed top-4 right-4 z-[99999] max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-start gap-3.5 transition-all duration-500 transform translate-y-0 cursor-pointer animate-pulse";
      
      const rawId = (job && (job.id || job.jobId)) ? (job.id || job.jobId) : "JOB";
      const jobId = (window.DQStore && window.DQStore.normalizeJobId) ? window.DQStore.normalizeJobId(rawId) : rawId;
      const proj = (job && (job.project || job.projectName || job.service)) ? (job.project || job.projectName || job.service) : "Design Request";
      const status = (job && job.status) ? job.status : "Updated";

      toast.innerHTML = `
        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/40 text-lg">
          🔔
        </div>
        <div class="flex-grow space-y-0.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">${title}</span>
            <span class="text-[11px] font-bold text-amber-400">${status}</span>
          </div>
          <h4 class="font-bold text-sm text-white truncate max-w-[200px]">${proj}</h4>
          <p class="text-[11px] text-slate-300 font-mono">Job #${jobId} • Click to Hear 5x Alert</p>
        </div>
        <button type="button" onclick="event.stopPropagation(); this.parentElement.remove()" class="text-slate-400 hover:text-white p-1 cursor-pointer">
          ✕
        </button>
      `;

      toast.onclick = () => {
        this.unlockAudio();
        this.playNewJobChime(5);
        toast.remove();
      };

      document.body.appendChild(toast);

      setTimeout(() => {
        if (toast && toast.parentElement) {
          toast.style.opacity = "0";
          toast.style.transform = "translateY(-10px)";
          setTimeout(() => toast.remove(), 400);
        }
      }, 9000);
    } catch(e) {}
  };

  service.checkAndAlertNewJobs = function(jobsList, panelName = "dashboard") {
    if (!Array.isArray(jobsList) || jobsList.length === 0) return;

    let snapshotMap = {};
    try {
      snapshotMap = JSON.parse(localStorage.getItem("dq_sound_job_snapshots") || "{}");
    } catch(e) {
      snapshotMap = {};
    }

    let unackedJobs = [];
    try {
      unackedJobs = JSON.parse(localStorage.getItem("dq_unacknowledged_sound_jobs") || "[]");
    } catch(e) {}

    let isInitialColdLoad = Object.keys(snapshotMap).length === 0;
    let updatedJob = null;
    let updateType = "Job Alert";
    const now = Date.now();

    jobsList.forEach(job => {
      if (!job) return;
      const rawId = (job.id || job.jobId || "").toString().trim();
      if (!rawId) return;
      const normId = (window.DQStore && window.DQStore.normalizeJobId) ? window.DQStore.normalizeJobId(rawId) : rawId.toUpperCase();

      const st = (job.status || "Pending").toString();
      const completed = job.completed === true || st.toLowerCase().includes("completed") || st.toLowerCase().includes("delivered");
      const acceptedBy = Array.isArray(job.acceptedBy) ? job.acceptedBy.join(",") : (job.acceptedBy || "");
      const revisionCount = Array.isArray(job.revisionHistory) ? job.revisionHistory.length : 0;
      
      const currentSignature = `${st}_${completed}_${acceptedBy}_${revisionCount}`;
      const previousSignature = snapshotMap[normId];

      const rawCreated = job.createdAt || job.created_at || job.createdat;
      const createdAtMs = rawCreated ? new Date(rawCreated).getTime() : 0;
      const isRecentlyCreated = createdAtMs > 0 && (now - createdAtMs < 300000);
      const isUnacknowledged = unackedJobs.includes(normId) || unackedJobs.includes(rawId);

      if (!previousSignature) {
        snapshotMap[normId] = currentSignature;
        if (!isInitialColdLoad || isRecentlyCreated || isUnacknowledged) {
          updatedJob = job;
          updateType = "New Job Uploaded";
        }
      } else if (previousSignature !== currentSignature) {
        snapshotMap[normId] = currentSignature;
        updatedJob = job;
        updateType = "Job Updated: " + st;
      } else if (isUnacknowledged) {
        updatedJob = job;
        updateType = "New Job Uploaded";
      }
    });

    try {
      localStorage.setItem("dq_sound_job_snapshots", JSON.stringify(snapshotMap));
    } catch(e) {}

    if (updatedJob) {
      console.log("[DQSoundService] 🔔 Job Update detected (#" + updatedJob.id + " - " + updateType + ") in " + panelName + "! Playing alert 5 times...");
      this.playNewJobChime(5);
      this.showNewJobBanner(updatedJob, updateType);
    }
  };

  service.initJobSoundWatcher = function(panelName = "dashboard") {
    if (this.initializedWatcher) return;
    this.initializedWatcher = true;
    console.log("[DQSoundService] 🚀 Initializing Job Sound Watcher for \"" + panelName + "\"... ");

    setTimeout(() => {
      this.preDecodeAudio();
    }, 100);

    const unlockHandler = () => {
      this.unlockAudio();
    };
    ["click", "pointerdown", "touchstart", "keydown", "scroll", "mousemove"].forEach(evt => {
      window.addEventListener(evt, unlockHandler, { passive: true });
      document.addEventListener(evt, unlockHandler, { passive: true });
    });

    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("dq_realtime_jobs");
        bc.onmessage = (event) => {
          if (event && event.data) {
            const data = event.data;
            console.log("[DQSoundService] ⚡ Realtime Broadcast received on " + panelName + ":", data);
            if (data.type === "NEW_JOB" || data.type === "JOB_UPDATE") {
              this.playNewJobChime(5);
              if (data.job) {
                this.showNewJobBanner(data.job, data.type === "NEW_JOB" ? "New Job Alert" : "Job Updated");
              }
            }
          }
        };
      }
    } catch(e) {}

    try {
      const currentJobs = JSON.parse(localStorage.getItem("dq_live_jobs") || "[]");
      if (Array.isArray(currentJobs) && currentJobs.length > 0) {
        this.checkAndAlertNewJobs(currentJobs, panelName);
      }
    } catch(e) {}

    window.addEventListener("dq_jobs_updated", (e) => {
      const jobs = (e && e.detail) ? e.detail : JSON.parse(localStorage.getItem("dq_live_jobs") || "[]");
      this.checkAndAlertNewJobs(jobs, panelName);
    });

    window.addEventListener("storage", (e) => {
      if (e.key === "dq_live_jobs") {
        try {
          const jobs = JSON.parse(e.newValue || "[]");
          this.checkAndAlertNewJobs(jobs, panelName);
        } catch(err) {}
      } else if (e.key === "dq_new_job_alert") {
        try {
          const alertData = JSON.parse(e.newValue || "{}");
          if (alertData && alertData.id) {
            this.playNewJobChime(5);
            this.showNewJobBanner(alertData, "New Job Alert");
          }
        } catch(err) {}
      }
    });

    setInterval(() => {
      try {
        const currentJobs = JSON.parse(localStorage.getItem("dq_live_jobs") || "[]");
        if (Array.isArray(currentJobs) && currentJobs.length > 0) {
          this.checkAndAlertNewJobs(currentJobs, panelName);
        }
      } catch(e) {}
    }, 2500);

    const hookSupabase = () => {
      const db = window.DQSupabase || window.DQFirebase;
      if (db && typeof db.subscribeJobs === "function") {
        db.subscribeJobs((liveJobs) => {
          this.checkAndAlertNewJobs(liveJobs, panelName);
        });
      }
    };
    hookSupabase();
    setTimeout(hookSupabase, 1000);
  };

  window.DQSoundService = service;
  window.DQSound = service;
  window.playNewJobChime = function(count = 5) {
    return service.playNewJobChime(count);
  };

  service.preDecodeAudio();
  ["click", "pointerdown", "touchstart", "keydown"].forEach(evt => {
    window.addEventListener(evt, () => service.unlockAudio(), { passive: true, once: true });
  });
})();

// Immediate self-cleanup of legacy demo jobs & deleted jobs sync
(function() {
  try {
    let deletedJobs = [];
    try { deletedJobs = JSON.parse(localStorage.getItem("dq_deleted_jobs") || "[]"); } catch(e) {}
    ["DQ-8492", "8492", "DQ8492", "DQ-7319", "7319", "DQ7319"].forEach(v => {
      if (!deletedJobs.includes(v)) deletedJobs.push(v);
    });
    localStorage.setItem("dq_deleted_jobs", JSON.stringify(deletedJobs));

    let liveJobs = [];
    try { liveJobs = JSON.parse(localStorage.getItem("dq_live_jobs") || "[]"); } catch(e) {}
    if (Array.isArray(liveJobs) && liveJobs.length > 0) {
      const cleaned = liveJobs.filter(j => {
        if (!j) return false;
        const id = (j.id || j.jobId || "").toString().toUpperCase();
        const p = (j.project || j.projectName || "").toString();
        if (id.includes("8492") || id.includes("7319") || p.includes("Urban Spice") || p.includes("TechPulse")) {
          return false;
        }
        return true;
      });
      localStorage.setItem("dq_live_jobs", JSON.stringify(cleaned));
    }
  } catch(e) {}
})();

