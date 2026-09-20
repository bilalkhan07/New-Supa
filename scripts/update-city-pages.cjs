const fs = require('fs');
const path = require('path');

const cityDisplayMap = {
  'indore': 'Indore',
  'bhopal': 'Bhopal',
  'mumbai': 'Mumbai',
  'delhi': 'Delhi',
  'delhi-ncr': 'Delhi NCR',
  'bangalore': 'Bangalore',
  'pune': 'Pune',
  'hyderabad': 'Hyderabad',
  'chennai': 'Chennai',
  'ahmedabad': 'Ahmedabad',
  'kolkata': 'Kolkata',
  'jaipur': 'Jaipur',
  'chandigarh': 'Chandigarh',
  'lucknow': 'Lucknow',
  'surat': 'Surat',
  'kochi': 'Kochi',
  'patna': 'Patna',
  'nagpur': 'Nagpur'
};

const defaultCityAddresses = {
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

const serviceDataMap = {
  'graphic-designer': {
    title: 'Graphic Designer',
    bestTitle: 'Best Graphic Designer',
    key: 'graphic-design',
    badge: 'Verified Human Graphic Designers',
    desc: 'Get professional, print-ready, and digital graphics crafted manually from scratch by top verified graphic designers. High-converting visuals with full master AI, PSD, SVG source files.'
  },
  'logo-designer': {
    title: 'Logo Designer',
    bestTitle: 'Best Logo Designer',
    key: 'logo-design',
    badge: 'Bespoke Logo & Brand Specialists',
    desc: 'Unique trademark-ready brand identities, vector icons, custom typography, and complete social kits delivered by specialized logo artists.'
  },
  'youtube-thumbnail-designer': {
    title: 'YouTube Thumbnail Artist',
    bestTitle: 'Best YouTube Thumbnail Artist',
    key: 'youtube-thumbnail',
    badge: 'High-CTR YouTube Creative Artists',
    desc: 'Click-maximizing YouTube thumbnails with sharp subject cutouts, rim-lighting, expressive text, and layered Photoshop source files.'
  },
  'social-media-designer': {
    title: 'Social Media Creative Designer',
    bestTitle: 'Best Social Media Creative Designer',
    key: 'social-media',
    badge: 'Viral Social Media & Ad Designers',
    desc: 'High-converting Instagram carousels, reels covers, Facebook feed ads, promotional banners, and festival posts in 30-45 minutes.'
  },
  'visiting-card-designer': {
    title: 'Visiting Card Designer',
    bestTitle: 'Best Visiting Card Designer',
    key: 'visiting-card',
    badge: 'Corporate Print & Card Designers',
    desc: 'Executive double-sided business cards, gold foil mockups, QR codes, 3mm bleed margin, and CMYK vector print files.'
  },
  'flyer-poster-designer': {
    title: 'Flyer & Event Poster Designer',
    bestTitle: 'Best Flyer & Event Poster Designer',
    key: 'flyer-design',
    badge: 'Print & Event Promotion Specialists',
    desc: 'High-impact promotional flyers, event notices, product pamphlets, and digital food menus formatted for printing and online circulation.'
  },
  'vector-art-specialist': {
    title: 'Vector Art & Tracing Artist',
    bestTitle: 'Best Vector Art & Tracing Artist',
    key: 'vector-art',
    badge: 'Precision Vector Line Art Artists',
    desc: 'Redraw blurry logos, raster bitmaps, product sketches, and hand drawings into infinite-resolution scalable AI, EPS, and SVG vector files.'
  },
  'brochure-catalog-designer': {
    title: 'Brochure & Catalog Designer',
    bestTitle: 'Best Brochure & Catalog Designer',
    key: 'brochure-design',
    badge: 'Corporate Brochure & Deck Designers',
    desc: 'Multi-page bi-fold, tri-fold brochures, product catalogs, corporate decks, and annual report layouts with pristine grid alignment.'
  },
  'packaging-label-designer': {
    title: 'Packaging & Label Designer',
    bestTitle: 'Best Packaging & Label Designer',
    key: 'packaging-design',
    badge: 'Dieline Packaging & Label Specialists',
    desc: 'Precision packaging dielines, bottle sticker labels, box wraps, pouch art, and barcode-ready retail packaging files.'
  }
};

// Default Services mirroring Home Page and store.js
const defaultServices = [
  {
    id: 'social-media',
    title: 'Social Media Posts',
    price: 399,
    sla: '30-45 mins',
    category: 'social',
    description: 'Instagram feeds, reels covers, carousel slides & promotional social media creatives.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80',
    icon: 'share-2',
    slug: 'social-media-designer'
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
    slug: 'youtube-thumbnail-designer'
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
    slug: 'vector-art-specialist'
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
    slug: 'visiting-card-designer'
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
    slug: 'logo-designer'
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
    slug: 'packaging-label-designer'
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
    slug: 'flyer-poster-designer'
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
    slug: 'brochure-catalog-designer'
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
    slug: 'graphic-designer'
  }
];

function getServiceBadgeIcon(s, classes = 'w-4 h-4 sm:w-5 sm:h-5') {
  const svcId = (s.id || s.category || '').toLowerCase();
  const iconName = (s.icon || '').toLowerCase();

  if (svcId.includes('youtube') || iconName === 'youtube' || iconName === 'video') {
    return `<svg class="${classes} fill-red-600 shrink-0" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
  }
  if (svcId.includes('logo') || iconName === 'crown' || iconName === 'award') {
    return `<svg class="${classes} text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
  }
  if (svcId.includes('visiting') || svcId.includes('card') || iconName === 'credit-card') {
    return `<svg class="${classes} text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
  }
  if (svcId.includes('packaging') || svcId.includes('label') || iconName === 'package') {
    return `<svg class="${classes} text-orange-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
  }
  if (svcId.includes('social') || iconName === 'share-2' || iconName === 'share') {
    return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`;
  }
  if (svcId.includes('vector') || iconName === 'pen-tool') {
    return `<svg class="${classes} text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
  }
  if (svcId.includes('flyer') || iconName === 'file-text') {
    return `<svg class="${classes} text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`;
  }
  if (svcId.includes('brochure') || iconName === 'book-open') {
    return `<svg class="${classes} text-cyan-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  }
  return `<svg class="${classes} text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
}

function getPillIcon(iconName) {
  if (iconName === 'video') return `<svg class="w-3.5 h-3.5 fill-red-600 shrink-0" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
  if (iconName === 'crown') return `<svg class="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`;
  if (iconName === 'share-2') return `<svg class="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`;
  if (iconName === 'file-text') return `<svg class="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/></svg>`;
  if (iconName === 'credit-card') return `<svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
  if (iconName === 'pen-tool') return `<svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>`;
  if (iconName === 'book-open') return `<svg class="w-3.5 h-3.5 text-cyan-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  if (iconName === 'package') return `<svg class="w-3.5 h-3.5 text-orange-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>`;
  return `<svg class="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
}

// Default Portfolio items mirroring Supabase & store.js
const defaultPortfolio = [
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

async function fetchLivePortfolioFromSupabase() {
  try {
    const res = await fetch('https://gzbwvleuuxyidohujibj.supabase.co/rest/v1/portfolio?select=*', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk'
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(d => {
          let meta = {};
          if (Array.isArray(d.tags)) {
            d.tags.forEach(t => {
              if (t && t.startsWith('{')) { try { meta = JSON.parse(t); } catch(e){} }
            });
          }
          return {
            id: d.id,
            title: d.title,
            category: d.category,
            deliveryTime: meta.deliveryTime || meta.delivery || (Array.isArray(d.tags) && d.tags[0]) || '⚡ 30m Delivery',
            image: d.image,
            description: meta.description || meta.desc || d.description || '',
            client: meta.client || 'Verified Client'
          };
        });
      }
    }
  } catch (err) {
    console.warn('Could not fetch live Supabase portfolio for static files, using fallback:', err.message);
  }
  return defaultPortfolio;
}

// Pills list for targeted service switching
const serviceSlugList = [
  { slug: 'graphic-designer', key: 'graphic-design', label: 'All Graphic Design', icon: 'layout-grid' },
  { slug: 'logo-designer', key: 'logo-design', label: 'Logo Design', icon: 'crown' },
  { slug: 'youtube-thumbnail-designer', key: 'youtube-thumbnail', label: 'YouTube Thumbnails', icon: 'video' },
  { slug: 'social-media-designer', key: 'social-media', label: 'Social Media Creatives', icon: 'share-2' },
  { slug: 'flyer-poster-designer', key: 'flyer-design', label: 'Flyers & Posters', icon: 'file-text' },
  { slug: 'visiting-card-designer', key: 'visiting-card', label: 'Visiting Cards', icon: 'credit-card' },
  { slug: 'vector-art-specialist', key: 'vector-art', label: 'Vector Art & Tracing', icon: 'pen-tool' },
  { slug: 'brochure-catalog-designer', key: 'brochure-design', label: 'Brochures & Catalogs', icon: 'book-open' },
  { slug: 'packaging-label-designer', key: 'packaging-design', label: 'Packaging & Labels', icon: 'package' }
];

function generateCityHtml(serviceSlug, cityKey, activePortfolio) {
  const cityName = cityDisplayMap[cityKey] || (cityKey.charAt(0).toUpperCase() + cityKey.slice(1));
  const serviceInfo = serviceDataMap[serviceSlug] || serviceDataMap['graphic-designer'];
  const fileName = `${serviceSlug}-in-${cityKey}.html`;
  const canonicalUrl = `https://designquixo.in/${fileName}`;
  const officeInfo = defaultCityAddresses[cityKey] || {
    name: `${cityName} Creative Hub`,
    address: `Central Commercial Hub, Near Metro / Transit Station, ${cityName}`,
    landmark: `${cityName} Central Commercial Area`,
    phone: '+91 86024 20897',
    whatsapp: '918602420897',
    hours: 'Open Daily 9:00 AM - 11:30 PM (30m Express Delivery)'
  };

  // Pills markup
  const pillsHtml = serviceSlugList.map(s => {
    const isCurrent = s.slug === serviceSlug;
    const targetFile = `${s.slug}-in-${cityKey}.html`;
    const iconHtml = getPillIcon(s.icon);

    if (isCurrent) {
      return `          <a href="${targetFile}" data-service-key="${s.key}" class="service-pill px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 bg-blue-600 text-white border-blue-600 shadow-xs shrink-0">
            ${iconHtml}
            <span>${s.label}</span>
          </a>`;
    } else {
      return `          <a href="${targetFile}" data-service-key="${s.key}" class="service-pill px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-1.5 shrink-0">
            ${iconHtml}
            <span>${s.label}</span>
          </a>`;
    }
  }).join('\n');

  // Services Grid Cards HTML (With exact home page images)
  const servicesCardsHtml = defaultServices.map(s => {
    const targetServiceFile = s.slug ? `${s.slug}-in-${cityKey}.html` : `request.html?city=${encodeURIComponent(cityName)}&service=${encodeURIComponent(s.id)}`;
    const iconElement = getServiceBadgeIcon(s, 'w-4 h-4 sm:w-5 sm:h-5');

    return `          <div class="group rounded-2xl sm:rounded-3xl bg-white border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
            <div>
              <div class="relative h-28 sm:h-48 bg-slate-100 overflow-hidden">
                <img src="${s.image}" alt="${s.title} in ${cityName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80';" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                
                <div class="absolute top-2 left-2 sm:top-3 sm:left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/95 backdrop-blur-xs border border-white/60 flex items-center justify-center shadow-sm">
                  ${iconElement}
                </div>
                
                <span class="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-[9px] sm:text-xs uppercase font-extrabold text-emerald-800 bg-white/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs tracking-wider">
                  ⚡ ${s.sla}
                </span>
              </div>

              <div class="p-3.5 sm:p-6 space-y-1.5 sm:space-y-2">
                <h3 class="text-sm sm:text-xl font-extrabold text-slate-950 font-['Space_Grotesk'] leading-snug tracking-tight">${s.title}</h3>
                <p class="text-xs sm:text-sm font-semibold text-slate-700 leading-snug line-clamp-2">${s.description}</p>
              </div>
            </div>

            <div class="p-3.5 sm:p-6 pt-0">
              <a href="${targetServiceFile}" class="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2">
                <span>Get in ₹${s.price} &rarr;</span>
              </a>
            </div>
          </div>`;
  }).join('\n\n');

  // Portfolio HTML (Exact match to Home Page & store.js)
  const catDisplayMap = {
    'thumbnail': 'YouTube Thumbnail',
    'social': 'Social Media Creative',
    'branding': 'Brand Logo Design',
    'print': 'Print & Packaging',
    'vector': 'Vector Art & Tracing',
    'packaging': 'Packaging & Labels',
    'flyer': 'Flyers & Posters'
  };
  const catServiceMap = {
    'thumbnail': 'youtube-thumbnail',
    'social': 'social-media',
    'branding': 'logo-design',
    'print': 'visiting-card',
    'vector': 'vector-art',
    'packaging': 'packaging-design',
    'flyer': 'flyer-design'
  };

  const portfolioItemsToRender = (Array.isArray(activePortfolio) && activePortfolio.length > 0) ? activePortfolio : defaultPortfolio;
  const portfolioCardsHtml = portfolioItemsToRender.map(p => {
    const rawCat = (p.category || 'design').toLowerCase();
    const catDisplayName = catDisplayMap[rawCat] || p.category || 'Graphic Design';
    const serviceTarget = catServiceMap[rawCat] || serviceInfo.key || 'graphic-design';
    return `            <div class="group rounded-2xl sm:rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div class="relative h-28 sm:h-48 bg-slate-100 overflow-hidden">
                  <img src="${p.image}" alt="${p.title} in ${cityName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="window.handlePortImgFallback && window.handlePortImgFallback(this);" />
                  <span class="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white/95 text-emerald-800 text-[9px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full shadow-xs">${p.deliveryTime || '⚡ 30-45m'}</span>
                </div>
                <div class="p-3.5 sm:p-5 space-y-1">
                  <span class="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">${catDisplayName}</span>
                  <h3 class="font-extrabold text-slate-950 text-sm sm:text-base font-['Space_Grotesk'] leading-snug tracking-tight">${p.title}</h3>
                  <p class="text-xs font-semibold text-slate-600 line-clamp-2 leading-snug">${p.description}</p>
                </div>
              </div>
              <div class="p-3.5 sm:p-5 pt-0">
                <a href="request.html?city=${encodeURIComponent(cityName)}&service=${encodeURIComponent(serviceTarget)}" class="w-full text-center py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-900 text-xs font-extrabold transition-all block">
                  Order Similar in ${cityName} &rarr;
                </a>
              </div>
            </div>`;
  }).join('\n\n');

  // City dropdown options
  const cityOptionsHtml = Object.keys(cityDisplayMap).map(cKey => {
    const isSel = cKey === cityKey ? ' selected' : '';
    return `              <option value="${cKey}"${isSel}>${cityDisplayMap[cKey]}</option>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title id="page-title">Best ${serviceInfo.title} in ${cityName} - 30-Min Fast Human Design | Design Quixo</title>
    <meta name="keywords" content="best ${serviceInfo.title.toLowerCase()} in ${cityName.toLowerCase()}, ${serviceInfo.title.toLowerCase()} in ${cityName.toLowerCase()}, freelance ${serviceInfo.title.toLowerCase()} in ${cityName.toLowerCase()}, ${serviceInfo.title.toLowerCase()} services in ${cityName.toLowerCase()}, fast ${serviceInfo.title.toLowerCase()} ${cityName.toLowerCase()}, ${cityName} graphic design, Design Quixo ${cityName}" />
    <meta name="geo.region" content="IN" />
    <meta name="geo.placename" content="${cityName}" />
    <meta id="page-desc" name="description" content="Looking for the Best ${serviceInfo.title} in ${cityName}? Hire verified human creators in ${cityName} with 30-60 minute WhatsApp delivery. Layered editable source files and zero AI distortion." />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="canonical" id="canonical-tag" href="${canonicalUrl}" />
    <meta property="og:title" id="og-title" content="Best ${serviceInfo.title} in ${cityName} - 30-Min Fast Human Design | Design Quixo" />
    <meta property="og:description" id="og-desc" content="Looking for the Best ${serviceInfo.title} in ${cityName}? Hire verified human creators in ${cityName} with 30-60 minute WhatsApp delivery." />
    <meta property="og:type" content="website" />
    <meta property="og:url" id="og-url" content="${canonicalUrl}" />
    <meta property="og:image" content="https://designquixo.in/favicon.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/png" href="favicon.png" />
    <link rel="shortcut icon" type="image/png" href="favicon.png" />
    <link rel="apple-touch-icon" href="favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="store.js"></script>
    <script type="module" src="/src/supabase-service.ts"></script>
    <script src="security.js"></script>
    <!-- Design Quixo Source & UI Security -->
    <script>
      (function(){
        const blockEvent = function(e){ e.preventDefault(); e.stopPropagation(); return false; };
        window.addEventListener('contextmenu', blockEvent, true);
        document.addEventListener('contextmenu', blockEvent, true);
        window.oncontextmenu = function(){ return false; };
        document.oncontextmenu = function(){ return false; };
        const blockKeys = function(e){
          if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); e.stopPropagation(); return false; }
          const ctrl = e.ctrlKey || e.metaKey;
          if (ctrl && (e.shiftKey || e.altKey)) {
            const k = (e.key || '').toUpperCase();
            if (k === 'I' || k === 'J' || k === 'C' || k === 'K' || k === 'S' || k === 'E') {
              e.preventDefault(); e.stopPropagation(); return false;
            }
          }
          if (ctrl) {
            const k = (e.key || '').toUpperCase();
            if (k === 'U' || k === 'S' || k === 'P') { e.preventDefault(); e.stopPropagation(); return false; }
          }
        };
        window.addEventListener('keydown', blockKeys, true);
        document.addEventListener('keydown', blockKeys, true);
        document.addEventListener('selectstart', function(e){
          const t = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
          if (t !== 'INPUT' && t !== 'TEXTAREA') { e.preventDefault(); return false; }
        }, true);
        document.addEventListener('copy', function(e){
          const t = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
          if (t !== 'INPUT' && t !== 'TEXTAREA') { e.preventDefault(); return false; }
        }, true);
      })();
    </script>
    <link rel="stylesheet" href="src/index.css" />
    <!-- Structured Data Schema for Local SEO -->
    <script id="seo-schema" type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Design Quixo - Best ${serviceInfo.title} in ${cityName}",
      "image": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80",
      "telephone": "${(officeInfo.phone || '+918602420897').replace(/\\s+/g, '')}",
      "priceRange": "₹359",
      "url": "${canonicalUrl}",
      "description": "${serviceInfo.desc}",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${(officeInfo.address || cityName).replace(/"/g, '\\"')}",
        "addressLocality": "${cityName}",
        "addressCountry": "IN"
      },
      "areaServed": [
        "${cityName}"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "165"
      }
    }
    </script>
  </head>
  <body class="bg-white text-slate-800 antialiased min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
    
    <!-- Navigation Header -->
    <header class="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200 transition-all shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a href="index.html" class="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <img src="favicon.png" alt="Design Quixo Logo" class="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl group-hover:scale-105 transition-transform shrink-0" onerror="this.onerror=null; this.src='favicon.png';" />
          <span class="font-extrabold text-lg sm:text-xl tracking-tight font-['Space_Grotesk'] text-slate-900">DESIGN <span class="text-blue-600">QUIXO</span></span>
        </a>

        <!-- Desktop Navigation (lg+) -->
        <nav class="hidden lg:flex items-center gap-6 xl:gap-7 text-xs xl:text-sm font-semibold text-slate-600">
          <a href="index.html" class="hover:text-blue-600 transition-colors">Home</a>
          <a href="services.html" class="hover:text-blue-600 transition-colors">Services</a>
          <a href="latest-works.html" class="hover:text-blue-600 transition-colors">Portfolio</a>
          <a href="about.html" class="hover:text-blue-600 transition-colors">About Us</a>
          <a href="cities.html" class="text-blue-600 font-bold flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            Cities
          </a>
          <a href="contact.html" class="hover:text-blue-600 transition-colors">Contact</a>
        </nav>

        <!-- Right Action CTAs -->
        <div class="flex items-center gap-2 sm:gap-3">
          <a href="login.html?mode=signup" class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-xs transition-colors shrink-0" title="New Designer Application">
            <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            <span>Join as Designer</span>
          </a>
          <a href="login.html?mode=login" class="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm shadow-sm transition-all shrink-0" title="Designer & Admin Login">
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
            <span>Login</span>
          </a>
          <!-- Mobile & Tablet Menu Toggle Button -->
          <button id="mobile-menu-toggle" class="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200" aria-label="Toggle Menu">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      <div id="mobile-menu" class="hidden lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
        <a href="index.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Home</a>
        <a href="services.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Services</a>
        <a href="latest-works.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Portfolio</a>
        <a href="about.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">About Us</a>
        <a href="cities.html" class="block px-3 py-2 rounded-lg text-sm font-bold text-blue-600 bg-blue-50">Cities Directory</a>
        <a href="contact.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Contact Support</a>
        <div class="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <a href="login.html?mode=signup" class="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs">
            <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            <span>Join as Designer (Apply)</span>
          </a>
          <a href="login.html?mode=login" class="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
            <span>Login (Designers & Admins)</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow">
      
      <!-- Breadcrumbs & Quick City/Service Switcher Bar -->
      <div class="bg-slate-50 border-b border-slate-200 py-3">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div class="text-slate-500 flex items-center gap-2 flex-wrap">
            <a href="index.html" class="hover:text-blue-600">Home</a>
            <span>/</span>
            <a href="cities.html" class="hover:text-blue-600">Cities Directory</a>
            <span>/</span>
            <span id="crumb-city" class="text-blue-600 font-bold">${cityName}</span>
            <span>/</span>
            <span id="crumb-service" class="text-slate-900 font-bold">Best ${serviceInfo.title}</span>
          </div>

          <!-- Quick City Dropdown Selector -->
          <div class="flex items-center gap-2">
            <span class="text-slate-500 font-medium shrink-0">Switch City:</span>
            <select id="quick-city-select" class="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500">
${cityOptionsHtml}
            </select>
          </div>
        </div>
      </div>

      <!-- Service Navigation Bar (Pill Tabs for SEO Targeted Services) -->
      <div class="bg-white border-b border-slate-200 overflow-x-auto scrollbar-none py-2.5 shadow-2xs sticky top-16 sm:top-20 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 min-w-max" id="service-pill-bar">
${pillsHtml}
        </div>
      </div>

      <!-- SEO Targeted Hero Section (Clean brand theme, NO artificial gradients) -->
      <section class="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-200 relative overflow-hidden">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span id="badge-city-text">500+ Verified Human Creators / 24x7 in ${cityName}</span>
          </div>

          <!-- Main Title with 'Best' prepended -->
          <h1 id="hero-main-title" class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 font-['Space_Grotesk'] tracking-tight mb-6 leading-tight">
            <span>Looking for the <span class="text-blue-600 underline decoration-blue-400 decoration-wavy underline-offset-8">Best ${serviceInfo.title}</span></span><br/>
            <span>in <span class="text-slate-900">${cityName}</span>?</span>
          </h1>

          <p class="text-slate-600 text-sm sm:text-lg max-w-3xl mx-auto mb-8 leading-relaxed px-2" id="hero-subtext">
            Skip slow digital agencies and distorted AI templates. Connect with the best verified professional designers in <span class="font-bold text-slate-900">${cityName}</span> delivering high-impact human graphics in 30 to 45 minutes directly on WhatsApp.
          </p>

          <!-- Highlight Key Stats Pill -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10 text-left">
            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Fulfillment SLA</span>
              <span class="text-xl sm:text-2xl font-black text-blue-600 font-['Space_Grotesk']">30–60 Mins</span>
            </div>
            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Format Guarantee</span>
              <span class="text-xl sm:text-2xl font-black text-slate-900 font-['Space_Grotesk']">100% Vector</span>
            </div>
            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Creator Availability</span>
              <span class="text-xl sm:text-2xl font-black text-emerald-600 font-['Space_Grotesk']">500+ Active</span>
            </div>
            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">AI Policy</span>
              <span class="text-xl sm:text-2xl font-black text-slate-900 font-['Space_Grotesk']">0% (Strict)</span>
            </div>
          </div>

          <!-- Dual Order CTA Buttons -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <a href="request.html?city=${encodeURIComponent(cityName)}&service=${encodeURIComponent(serviceInfo.key)}" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 hover:scale-102">
              <svg class="w-5 h-5 text-white fill-white shrink-0" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Get a design now</span>
            </a>
            <a href="https://wa.me/918602420897?text=Hello%20Design%20Quixo,%20I%20need%20the%20Best%20${encodeURIComponent(serviceInfo.title)}%20in%20${encodeURIComponent(cityName)}" target="_blank" class="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-2.5">
              <svg class="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.17 22L7.42 20.62C8.87 21.41 10.5 21.83 12.16 21.83C17.62 21.83 22.07 17.38 22.07 11.92C22.07 9.27 21.04 6.78 19.17 4.91C17.3 3.04 14.7 2 12.04 2ZM17.52 14.33C17.3 14.22 16.22 13.69 16.02 13.61C15.82 13.54 15.67 13.5 15.53 13.72C15.38 13.94 14.96 14.44 14.83 14.59C14.7 14.74 14.57 14.75 14.35 14.64C14.13 14.53 13.42 14.3 12.58 13.55C11.93 12.97 11.49 12.25 11.36 12.03C11.23 11.81 11.35 11.69 11.46 11.58C11.56 11.48 11.68 11.32 11.79 11.19C11.9 11.06 11.94 10.97 12.01 10.82C12.08 10.67 12.05 10.54 11.99 10.43C11.93 10.32 11.48 9.25 11.3 8.81C11.12 8.38 10.94 8.44 10.81 8.43C10.68 8.42 10.53 8.42 10.39 8.42C10.24 8.42 10 8.48 9.8 8.7C9.6 8.92 9.02 9.46 9.02 10.56C9.02 11.66 9.82 12.72 9.93 12.87C10.04 13.02 11.5 15.29 13.74 16.26C14.27 16.49 14.69 16.63 15.01 16.73C15.54 16.9 16.03 16.88 16.42 16.82C16.85 16.76 17.72 16.29 17.9 15.78C18.08 15.27 18.08 14.83 18.03 14.74C17.97 14.65 17.83 14.59 17.52 14.33Z"/>
              </svg>
              <span>Instant WhatsApp Brief</span>
            </a>
          </div>

        </div>
      </section>

      <!-- Targeted Service Feature Spotlight Card (Brand Theme Aligned - No Harsh Blue Strip) -->
      <section id="service-spotlight-section" class="py-10 bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div class="space-y-2 text-center md:text-left">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>Specialized Service Spotlight</span>
              </div>
              <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">Best ${serviceInfo.title} in ${cityName}</h3>
              <p class="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                ${serviceInfo.desc} Includes layered source files (AI/PSD/SVG), print bleed marks, RGB/CMYK versions, and 30-minute turnarounds.
              </p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <a href="request.html?city=${encodeURIComponent(cityName)}&service=${encodeURIComponent(serviceInfo.key)}" class="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2">
                <span>Get it now &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- All Services Available in this City (Matching Home Page & store.js) -->
      <section class="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
            <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Full Service Catalog
          </span>
          <h2 class="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">
            All Creative Design Services in <span class="text-blue-600">${cityName}</span>
          </h2>
          <p class="text-slate-600 text-sm mt-2">Every service is crafted by verified human graphic designers with layered vector source files and zero AI distortion.</p>
        </div>

        <!-- Service Cards Grid dynamically synced with Home Page -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6" id="city-services-grid">
${servicesCardsHtml}
        </div>
      </section>

      <!-- Recent Works Visual Showcase Grid (Matching Home Page & store.js) -->
      <section class="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12">
            <div>
              <span class="text-blue-600 text-xs font-extrabold uppercase tracking-widest block mb-1 sm:mb-2">Real Human Artwork</span>
              <h2 class="text-2xl sm:text-4xl font-bold font-['Space_Grotesk'] text-slate-900">Recent Works & Deliveries in ${cityName}</h2>
            </div>
            <a href="latest-works.html" class="mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700">
              <span>Explore Complete Portfolio</span>
              <svg class="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" id="city-portfolio-grid">
${portfolioCardsHtml}
          </div>
        </div>
      </section>

      <!-- Why Local Businesses Choose Us -->
      <section class="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <h2 class="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk']">Why Businesses in <span class="text-blue-600">${cityName}</span> Choose Design Quixo</h2>
            <p class="text-slate-600 text-sm mt-2">Engineered for fast-growing local commerce, manufacturers, restaurants, and startups.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div class="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-['Space_Grotesk']">Under 60-Minute Turnaround</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                No waiting days or dealing with sluggish agency tickets. Submit a brief and receive editable source files in under an hour.
              </p>
            </div>

            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-['Space_Grotesk']">100% Human Craftsmanship</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Zero generative AI distortions, zero hallucinated text, and zero cookie-cutter Canva stock templates.
              </p>
            </div>

            <div class="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-['Space_Grotesk']">Direct WhatsApp Collaboration</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Review draft revisions directly over WhatsApp chat with your assigned designer in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Localized Google Reviews Section -->
      <section class="py-16 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <svg class="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                <span>Google Verified Reviews</span>
                <span class="text-amber-400">•</span>
                <span>${cityName}</span>
              </div>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-['Space_Grotesk'] tracking-tight">
                What <span class="text-blue-600">${cityName}</span> Founders & Brands Say
              </h2>
              <p class="text-slate-600 text-sm sm:text-base max-w-2xl">
                Real feedback from businesses, agencies, and creators in <span class="font-semibold text-slate-800">${cityName}</span> who rely on our 30-minute human graphic design delivery.
              </p>
            </div>

            <div class="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs shrink-0">
              <div class="text-center pr-4 border-r border-slate-200">
                <span class="text-3xl font-extrabold font-['Space_Grotesk'] text-slate-900 leading-none">5.0</span>
                <div class="flex items-center gap-0.5 text-amber-400 mt-1">
                  <svg class="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg class="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg class="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg class="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg class="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
              </div>
              <div>
                <div class="flex items-center gap-1 text-xs font-bold text-slate-900">
                  <span>5-STAR EXCELLENT</span>
                  <span class="text-emerald-600 font-extrabold">★ 100%</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">Based on 150+ verified 5-star reviews</div>
              </div>
            </div>
          </div>

          <!-- Dynamic City Reviews Grid (Auto Hydrated with 5-Star Reviews) -->
          <div id="city-reviews-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </div>
      </section>

      <!-- Local City Physical Hub Address & Direct Support Desk (Dynamic Admin Synced) -->
      <section id="city-local-office" class="py-12 bg-white border-t border-slate-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-slate-50 rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div class="space-y-2 flex-1">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span id="city-office-title">${officeInfo.name || cityName + ' Creative Hub'}</span>
              </div>
              <h3 class="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
                Address & Contact for <span id="city-office-name-heading" class="text-blue-600">${cityName}</span>
              </h3>
              <p id="city-office-address" class="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
                ${officeInfo.address}
              </p>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
              <a id="city-office-phone-link" href="tel:${(officeInfo.phone || '+91 86024 20897').replace(/\\s+/g, '')}" class="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 shadow-xs transition-all">
                <svg class="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span id="city-office-phone">${officeInfo.phone || '+91 86024 20897'}</span>
              </a>
              <a id="city-office-wa-link" href="https://wa.me/${(officeInfo.whatsapp || '918602420897').replace(/\\D/g, '')}?text=Hello%20Design%20Quixo,%20I%20need%20design%20assistance%20in%20${encodeURIComponent(cityName)}" target="_blank" class="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all">
                <svg class="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.17 22L7.42 20.62C8.87 21.41 10.5 21.83 12.16 21.83C17.62 21.83 22.07 17.38 22.07 11.92C22.07 9.27 21.04 6.78 19.17 4.91C17.3 3.04 14.7 2 12.04 2ZM17.52 14.33C17.3 14.22 16.22 13.69 16.02 13.61C15.82 13.54 15.67 13.5 15.53 13.72C15.38 13.94 14.96 14.44 14.83 14.59C14.7 14.74 14.57 14.75 14.35 14.64C14.13 14.53 13.42 14.3 12.58 13.55C11.93 12.97 11.49 12.25 11.36 12.03C11.23 11.81 11.35 11.69 11.46 11.58C11.56 11.48 11.68 11.32 11.79 11.19C11.9 11.06 11.94 10.97 12.01 10.82C12.08 10.67 12.05 10.54 11.99 10.43C11.93 10.32 11.48 9.25 11.3 8.81C11.12 8.38 10.94 8.44 10.81 8.43C10.68 8.42 10.53 8.42 10.39 8.42C10.24 8.42 10 8.48 9.8 8.7C9.6 8.92 9.02 9.46 9.02 10.56C9.02 11.66 9.82 12.72 9.93 12.87C10.04 13.02 11.5 15.29 13.74 16.26C14.27 16.49 14.69 16.63 15.01 16.73C15.54 16.9 16.03 16.88 16.42 16.82C16.85 16.76 17.72 16.29 17.9 15.78C18.08 15.27 18.08 14.83 18.03 14.74C17.97 14.65 17.83 14.59 17.52 14.33Z"/></svg>
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom Conversion CTA (Brand Aligned Theme, NO Gradients) -->
      <section class="py-16 sm:py-20 bg-slate-50 border-t border-slate-200 text-center relative">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            Verified Human Creators
          </div>
          <h2 class="text-3xl sm:text-5xl font-extrabold text-slate-900 font-['Space_Grotesk'] tracking-tight">
            Ready to hire the Best ${serviceInfo.title} in ${cityName}?
          </h2>
          <p class="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto">
            Get your first draft delivered to WhatsApp in 30-60 minutes with full master files starting from just ₹359.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <a href="request.html?city=${encodeURIComponent(cityName)}&service=${encodeURIComponent(serviceInfo.key)}" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2">
              <span>Order Design Brief &rarr;</span>
            </a>
            <a href="https://wa.me/918602420897?text=Hello%20Design%20Quixo,%20I%20need%20the%20Best%20${encodeURIComponent(serviceInfo.title)}%20in%20${encodeURIComponent(cityName)}" target="_blank" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2">
              <svg class="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.17 22L7.42 20.62C8.87 21.41 10.5 21.83 12.16 21.83C17.62 21.83 22.07 17.38 22.07 11.92C22.07 9.27 21.04 6.78 19.17 4.91C17.3 3.04 14.7 2 12.04 2ZM17.52 14.33C17.3 14.22 16.22 13.69 16.02 13.61C15.82 13.54 15.67 13.5 15.53 13.72C15.38 13.94 14.96 14.44 14.83 14.59C14.7 14.74 14.57 14.75 14.35 14.64C14.13 14.53 13.42 14.3 12.58 13.55C11.93 12.97 11.49 12.25 11.36 12.03C11.23 11.81 11.35 11.69 11.46 11.58C11.56 11.48 11.68 11.32 11.79 11.19C11.9 11.06 11.94 10.97 12.01 10.82C12.08 10.67 12.05 10.54 11.99 10.43C11.93 10.32 11.48 9.25 11.3 8.81C11.12 8.38 10.94 8.44 10.81 8.43C10.68 8.42 10.53 8.42 10.39 8.42C10.24 8.42 10 8.48 9.8 8.7C9.6 8.92 9.02 9.46 9.02 10.56C9.02 11.66 9.82 12.72 9.93 12.87C10.04 13.02 11.5 15.29 13.74 16.26C14.27 16.49 14.69 16.63 15.01 16.73C15.54 16.9 16.03 16.88 16.42 16.82C16.85 16.76 17.72 16.29 17.9 15.78C18.08 15.27 18.08 14.83 18.03 14.74C17.97 14.65 17.83 14.59 17.52 14.33Z"/></svg>
              <span>Instant WhatsApp Brief</span>
            </a>
          </div>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <img src="favicon.png" alt="Logo" class="w-6 h-6 object-contain" />
            <span class="text-white font-bold text-sm font-['Space_Grotesk']">DESIGN QUIXO</span>
          </div>
          <p class="text-slate-400 leading-relaxed">India's fastest on-demand 100% human graphic design platform. Delivering print & digital graphics in 30-60 minutes on WhatsApp.</p>
        </div>
        <div>
          <h4 class="text-white font-bold mb-3 font-['Space_Grotesk']">Popular Services</h4>
          <ul class="space-y-2">
            <li><a href="logo-designer-in-${cityKey}.html" class="hover:text-white">Logo Design</a></li>
            <li><a href="youtube-thumbnail-designer-in-${cityKey}.html" class="hover:text-white">YouTube Thumbnails</a></li>
            <li><a href="social-media-designer-in-${cityKey}.html" class="hover:text-white">Social Media Posts</a></li>
            <li><a href="flyer-poster-designer-in-${cityKey}.html" class="hover:text-white">Flyers & Posters</a></li>
            <li><a href="visiting-card-designer-in-${cityKey}.html" class="hover:text-white">Visiting Cards</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-bold mb-3 font-['Space_Grotesk']">Top Indian Cities</h4>
          <ul class="space-y-2">
            <li><a href="graphic-designer-in-indore.html" class="hover:text-white">Indore Graphic Designer</a></li>
            <li><a href="graphic-designer-in-bhopal.html" class="hover:text-white">Bhopal Graphic Designer</a></li>
            <li><a href="graphic-designer-in-mumbai.html" class="hover:text-white">Mumbai Graphic Designer</a></li>
            <li><a href="graphic-designer-in-delhi-ncr.html" class="hover:text-white">Delhi NCR Designer</a></li>
            <li><a href="graphic-designer-in-bangalore.html" class="hover:text-white">Bangalore Graphic Designer</a></li>
            <li><a href="cities.html" class="text-blue-400 font-bold hover:underline">View All 18+ Cities &rarr;</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-bold mb-3 font-['Space_Grotesk']">Support & Contact</h4>
          <p class="leading-relaxed mb-2">WhatsApp: +91 8602420897</p>
          <p class="leading-relaxed mb-4">Email: designquixo@gmail.com</p>
          <div class="flex gap-2">
            <a href="privacy.html" class="hover:text-white underline">Privacy</a>
            <span>•</span>
            <a href="terms.html" class="hover:text-white underline">Terms</a>
          </div>
        </div>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 text-center text-slate-500">
        &copy; ${new Date().getFullYear()} Design Quixo. All rights reserved. 100% Human Crafted. Zero AI Distortion.
      </div>
    </footer>

    <!-- Interactive Script & Dynamic Real-Time Home Data Synchronization -->
    <script>
      const currentServiceSlug = '${serviceSlug}';
      const currentCityKey = '${cityKey}';
      const currentCityName = '${cityName}';

      // Mobile Menu Toggle
      const mobileToggleBtn = document.getElementById('mobile-menu-toggle');
      const mobileDropdown = document.getElementById('mobile-menu');
      if (mobileToggleBtn && mobileDropdown) {
        mobileToggleBtn.addEventListener('click', () => {
          mobileDropdown.classList.toggle('hidden');
        });
      }

      // Quick City Switcher Dropdown
      const citySelector = document.getElementById('quick-city-select');
      if (citySelector) {
        citySelector.value = currentCityKey;
        citySelector.addEventListener('change', (e) => {
          const selectedCity = e.target.value;
          window.location.href = currentServiceSlug + '-in-' + selectedCity + '.html';
        });
      }

      // Dynamic sync with DQStore & Admin Updates for Services & Portfolio
      function getCityClientBadgeIcon(s) {
        if (window.DQStore && typeof window.DQStore.renderIconHtml === 'function') {
          return window.DQStore.renderIconHtml(s, 'w-4 h-4 sm:w-5 sm:h-5');
        }
        const sid = (s.id || s.category || '').toLowerCase();
        if (sid.includes('youtube') || sid.includes('video') || s.icon === 'youtube') {
          return '<svg class="w-4 h-4 sm:w-5 sm:h-5 fill-red-600 shrink-0" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
        }
        if (sid.includes('logo') || s.icon === 'award') {
          return '<svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>';
        }
        if (sid.includes('social') || s.icon === 'share-2') {
          return '<svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>';
        }
        if (sid.includes('vector') || s.icon === 'pen-tool') {
          return '<svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>';
        }
        if (sid.includes('card') || s.icon === 'credit-card') {
          return '<svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>';
        }
        if (sid.includes('pack') || s.icon === 'package') {
          return '<svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>';
        }
        if (sid.includes('brochure') || sid.includes('catalog') || s.icon === 'book-open') {
          return '<svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
        }
        return '<svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>';
      }

      window.handleCityImgFallback = function(img) {
        if (!img) return;
        img.onerror = null;
        img.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80';
      };

      window.handlePortImgFallback = function(img) {
        if (!img) return;
        img.onerror = null;
        img.src = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700&auto=format&fit=crop&q=80';
      };

      window.handleAvatarFallback = function(img) {
        if (!img) return;
        img.onerror = null;
        img.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      };

                        function renderCityDynamicContent() {
        try {
          let services = [];
          if (window.DQStore && typeof window.DQStore.getServices === 'function') {
            services = window.DQStore.getServices();
          } else {
            try { services = JSON.parse(localStorage.getItem('dq_services') || '[]'); } catch(e) {}
          }
          const srvContainer = document.getElementById('city-services-grid');
          if (srvContainer && Array.isArray(services) && services.length > 0) {
            const slugMap = {
              'social-media': 'social-media-designer',
              'youtube-thumbnail': 'youtube-thumbnail-designer',
              'vector-art': 'vector-art-specialist',
              'visiting-card': 'visiting-card-designer',
              'logo-design': 'logo-designer',
              'packaging-design': 'packaging-label-designer',
              'flyer-design': 'flyer-poster-designer',
              'brochure-design': 'brochure-catalog-designer',
              'graphic-design': 'graphic-designer',
              'custom-design': 'graphic-designer'
            };
            
            srvContainer.innerHTML = services.map(s => {
              const price = s.price || 359;
              const sla = s.sla || '30-45 mins';
              const img = (s.image && s.image.trim() !== '') ? s.image : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80';
              const targetSlug = s.slug || slugMap[s.id] || slugMap[s.category];
              const linkUrl = targetSlug ? (targetSlug + '-in-' + currentCityKey + '.html') : ('request.html?city=' + encodeURIComponent(currentCityName) + '&service=' + encodeURIComponent(s.id || s.title));
              const iconSvg = getCityClientBadgeIcon(s);
              return '<div class="group rounded-2xl sm:rounded-3xl bg-white border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">' +
                '<div>' +
                  '<div class="relative h-28 sm:h-48 bg-slate-100 overflow-hidden">' +
                    '<img src="' + img + '" alt="' + (s.title || 'Graphic Design') + ' in ' + currentCityName + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="window.handleCityImgFallback && window.handleCityImgFallback(this);" />' +
                    '<div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>' +
                    '<div class="absolute top-2 left-2 sm:top-3 sm:left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/95 backdrop-blur-xs border border-white/60 flex items-center justify-center shadow-sm">' +
                      iconSvg +
                    '</div>' +
                    '<span class="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-[9px] sm:text-xs uppercase font-extrabold text-emerald-800 bg-white/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs tracking-wider">' +
                      '⚡ ' + sla +
                    '</span>' +
                  '</div>' +
                  '<div class="p-3.5 sm:p-6 space-y-1.5 sm:space-y-2">' +
                    '<h3 class="text-sm sm:text-xl font-extrabold text-slate-950 leading-snug tracking-tight">' + (s.title || 'Custom Design') + '</h3>' +
                    '<p class="text-xs sm:text-sm font-semibold text-slate-700 leading-snug line-clamp-2">' + (s.description || '') + '</p>' +
                  '</div>' +
                '</div>' +
                '<div class="p-3.5 sm:p-6 pt-0">' +
                  '<a href="' + linkUrl + '" class="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2">' +
                    '<span>Get in ₹' + price + ' &rarr;</span>' +
                  '</a>' +
                '</div>' +
              '</div>';
            }).join('');
          }
        } catch(e) { console.error('City services render error:', e); }

        // 2. Render Portfolio dynamically synchronized with Home Page & Store
        renderCityPortfolio();
      }

      function renderCityPortfolio(customList) {
        try {
          let portfolio = customList;
          if (!Array.isArray(portfolio) || portfolio.length === 0) {
            if (window.DQStore && typeof window.DQStore.getPortfolio === 'function') {
              portfolio = window.DQStore.getPortfolio();
            } else {
              try { portfolio = JSON.parse(localStorage.getItem('dq_portfolio_items') || '[]'); } catch(e) {}
            }
          }
          const portContainer = document.getElementById('city-portfolio-grid');
          if (portContainer && Array.isArray(portfolio) && portfolio.length > 0) {
            const catDisplayMap = {
              'thumbnail': 'YouTube Thumbnail',
              'social': 'Social Media Creative',
              'branding': 'Brand Logo Design',
              'print': 'Print & Packaging',
              'vector': 'Vector Art & Tracing',
              'packaging': 'Packaging & Labels',
              'flyer': 'Flyers & Posters',
              'youtube thumbnail': 'YouTube Thumbnail',
              'social media creative': 'Social Media Creative',
              'logo design': 'Brand Logo Design',
              'packaging & labels': 'Packaging & Labels',
              'flyers & posters': 'Flyers & Posters'
            };
            const catServiceMap = {
              'thumbnail': 'youtube-thumbnail',
              'social': 'social-media',
              'branding': 'logo-design',
              'print': 'visiting-card',
              'vector': 'vector-art',
              'packaging': 'packaging-design',
              'flyer': 'flyer-design',
              'youtube thumbnail': 'youtube-thumbnail',
              'social media creative': 'social-media',
              'logo design': 'logo-design',
              'packaging & labels': 'packaging-design',
              'flyers & posters': 'flyer-design'
            };

            portContainer.innerHTML = portfolio.map(p => {
              const delivery = p.deliveryTime || p.delivery || '⚡ 30-45m Delivery';
              const pImg = (p.image && p.image.trim() !== '') ? p.image : 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700&auto=format&fit=crop&q=80';
              const rawCat = (p.category || 'design').toLowerCase();
              const catDisplayName = catDisplayMap[rawCat] || p.category || 'Graphic Design';
              const targetService = catServiceMap[rawCat] || 'graphic-design';
              const pTitle = p.title || 'Creative Design';
              const pDesc = p.description || p.desc || 'Delivered layered source files with full master copyright.';
              const orderUrl = 'request.html?city=' + encodeURIComponent(currentCityName) + '&service=' + encodeURIComponent(targetService);

              return '<div class="group rounded-2xl sm:rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">' +
                '<div>' +
                  '<div class="relative h-28 sm:h-48 bg-slate-100 overflow-hidden">' +
                    '<img src="' + pImg + '" alt="' + pTitle + ' in ' + currentCityName + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null; this.src=\\'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700&auto=format&fit=crop&q=80\\';" />' +
                    '<span class="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white/95 text-emerald-800 text-[9px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full shadow-xs">' + delivery + '</span>' +
                  '</div>' +
                  '<div class="p-3.5 sm:p-5 space-y-1">' +
                    '<span class="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">' + catDisplayName + '</span>' +
                    '<h3 class="font-extrabold text-slate-950 text-sm sm:text-base font-[\\'Space_Grotesk\\'] leading-snug tracking-tight">' + pTitle + '</h3>' +
                    '<p class="text-xs font-semibold text-slate-600 line-clamp-2 leading-snug">' + pDesc + '</p>' +
                  '</div>' +
                '</div>' +
                '<div class="p-3.5 sm:p-5 pt-0">' +
                  '<a href="' + orderUrl + '" class="w-full text-center py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-900 text-xs font-extrabold transition-all block">' +
                    'Order Similar in ' + currentCityName + ' &rarr;' +
                  '</a>' +
                '</div>' +
              '</div>';
            }).join('');
          }
        } catch(e) { console.error('City portfolio render error:', e); }
      }

      function populateCityOfficeInfo() {
        let officeData = null;
        if (window.DQStore && typeof window.DQStore.getCityAddress === 'function') {
          officeData = window.DQStore.getCityAddress(currentCityKey);
        } else {
          try {
            const stored = JSON.parse(localStorage.getItem('dq_city_addresses') || '{}');
            officeData = stored[currentCityKey];
          } catch(e) {}
        }
        if (!officeData) return;

        const headingEl = document.getElementById('city-office-name-heading');
        if (headingEl) headingEl.textContent = currentCityName;

        const titleEl = document.getElementById('city-office-title');
        if (titleEl) titleEl.textContent = officeData.name || officeData.title || (currentCityName + ' Creative Hub');

        const addrEl = document.getElementById('city-office-address');
        if (addrEl && officeData.address) addrEl.textContent = officeData.address;

        const phoneVal = officeData.phone || '+91 86024 20897';
        const phoneEl = document.getElementById('city-office-phone');
        if (phoneEl) phoneEl.textContent = phoneVal;

        const phoneLinkEl = document.getElementById('city-office-phone-link');
        if (phoneLinkEl) phoneLinkEl.href = 'tel:' + phoneVal.replace(/\\s+/g, '');

        const waLinkEl = document.getElementById('city-office-wa-link');
        if (waLinkEl) {
          const waDigits = (officeData.whatsapp || phoneVal || '918602420897').replace(/\\D/g, '');
          waLinkEl.href = 'https://wa.me/' + (waDigits.length === 10 ? '91' + waDigits : waDigits) + '?text=Hello%20Design%20Quixo,%20I%20need%20design%20assistance%20in%20' + encodeURIComponent(currentCityName);
        }
      }

      // Populate City-Specific Customer Reviews with Guaranteed 5-Star Ratings
      function renderCityReviews() {
        const grid = document.getElementById('city-reviews-grid');
        if (!grid) return;

        let allReviews = [];
        if (window.DQStore && typeof window.DQStore.getReviews === 'function') {
          allReviews = window.DQStore.getReviews();
        } else {
          try {
            allReviews = JSON.parse(localStorage.getItem('dq_google_reviews') || '[]');
          } catch(e) {}
        }

        if (!allReviews || allReviews.length === 0) return;

        const cleanCityKey = (currentCityKey || '').toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        const cleanCityName = (currentCityName || '').toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');

        const matchedCityReviews = allReviews.filter(r => {
          if (!r) return false;
          const rCity = (r.city || '').toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          if (rCity && rCity !== 'allcities' && rCity !== 'all' && rCity !== 'global') {
            if ((cleanCityKey && (rCity === cleanCityKey || rCity.includes(cleanCityKey) || cleanCityKey.includes(rCity))) ||
                (cleanCityName && (rCity === cleanCityName || rCity.includes(cleanCityName) || cleanCityName.includes(rCity)))) {
              return true;
            }
          }
          const rRole = (r.role || '').toString().toLowerCase();
          const rText = (r.review || r.text || '').toString().toLowerCase();
          if ((cleanCityName && (rRole.includes(cleanCityName) || rText.includes(cleanCityName))) ||
              (cleanCityKey && (rRole.includes(cleanCityKey) || rText.includes(cleanCityKey)))) {
            return true;
          }
          return false;
        });

        const globalReviews = allReviews.filter(r => {
          const rCity = (r.city || '').toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          return !rCity || rCity === 'allcities' || rCity === 'all' || rCity === 'global';
        });

        const combinedMap = new Map();
        matchedCityReviews.forEach(r => combinedMap.set(r.id, r));
        globalReviews.forEach(r => {
          if (!combinedMap.has(r.id)) combinedMap.set(r.id, r);
        });

        const displayReviews = Array.from(combinedMap.values()).slice(0, 6);

        // Always render 5 solid gold/amber stars as mandated
        grid.innerHTML = displayReviews.map(r => {
          const starsHtml = Array.from({ length: 5 }).map(() => {
            return '<svg class="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
          }).join('');

          const avatar = r.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
          const name = r.name || 'Verified Client';
          const role = r.role || 'Business Leader';
          const rCityTag = (r.city && r.city !== 'All Cities') ? r.city : currentCityName;
          const text = r.review || r.text || 'Exceptional speed and quality, received editable vector source files on WhatsApp in under 30 minutes.';
          const date = r.date || 'Recently';

          return '<div class="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col justify-between">' +
            '<div>' +
              '<div class="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">' +
                '<div class="flex items-center gap-1">' + starsHtml + '</div>' +
                '<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">' +
                  '<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>' +
                  '<span class="text-[10px] font-bold text-slate-700">Google 5.0</span>' +
                '</div>' +
              '</div>' +
              '<p class="text-sm text-slate-700 leading-relaxed font-medium mb-6 italic">“' + text + '”</p>' +
            '</div>' +
            '<div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">' +
              '<div class="flex items-center gap-3 overflow-hidden">' +
                '<img src="' + avatar + '" alt="' + name + '" class="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0 shadow-2xs" onerror="window.handleAvatarFallback && window.handleAvatarFallback(this);" />' +
                '<div class="truncate">' +
                  '<h4 class="font-bold text-sm text-slate-900 truncate leading-tight">' + name + '</h4>' +
                  '<p class="text-xs text-slate-500 truncate mt-0.5">' + role + '</p>' +
                  '<span class="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-1">' +
                    '<svg class="w-2.5 h-2.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="9" r="3"/></svg>' +
                    rCityTag +
                  '</span>' +
                '</div>' +
              '</div>' +
              '<div class="text-right shrink-0">' +
                '<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">' +
                  '<svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' +
                  'Verified' +
                '</span>' +
                '<p class="text-[10px] text-slate-400 font-medium mt-1">' + date + '</p>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      function initCityPage() {
        renderCityDynamicContent();
        populateCityOfficeInfo();
        renderCityReviews();
      }

      // Initial execution
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCityPage);
      } else {
        initCityPage();
      }

      // Live updates from Admin updates or storage sync
      window.addEventListener('dq_services_updated', renderCityDynamicContent);
      window.addEventListener('dq_portfolio_updated', (e) => {
        renderCityPortfolio(e && e.detail);
      });
      window.addEventListener('dq_cities_updated', populateCityOfficeInfo);
      window.addEventListener('dq_reviews_updated', renderCityReviews);
      window.addEventListener('storage', (e) => {
        if (e.key === 'dq_services') {
          renderCityDynamicContent();
        }
        if (e.key === 'dq_portfolio_items') {
          try {
            const fresh = JSON.parse(e.newValue || '[]');
            if (Array.isArray(fresh) && fresh.length > 0) renderCityPortfolio(fresh);
          } catch(err) {}
        }
        if (e.key === 'dq_city_addresses') {
          populateCityOfficeInfo();
        }
        if (e.key === 'dq_google_reviews') {
          renderCityReviews();
        }
      });

      // Real-time backend sync from Supabase if active
      async function syncCityData() {
        const db = window.DQSupabase;
        if (db) {
          if (typeof db.fetchServices === 'function') {
            try {
              await db.fetchServices();
              renderCityDynamicContent();
            } catch(e) {}
          }
          if (typeof db.subscribeServices === 'function') {
            try {
              db.subscribeServices(function() {
                renderCityDynamicContent();
              });
            } catch(e) {}
          }
          if (typeof db.fetchPortfolio === 'function') {
            try {
              const livePort = await db.fetchPortfolio();
              if (Array.isArray(livePort) && livePort.length > 0) renderCityPortfolio(livePort);
            } catch(e) {}
          }
          if (typeof db.subscribePortfolio === 'function') {
            try {
              db.subscribePortfolio(function(livePort) {
                if (Array.isArray(livePort) && livePort.length > 0) renderCityPortfolio(livePort);
              });
            } catch(e) {}
          }
          if (typeof db.fetchCityAddresses === 'function') {
            try {
              await db.fetchCityAddresses();
              populateCityOfficeInfo();
            } catch(e) {}
          }
          if (typeof db.subscribeReviews === 'function') {
            try {
              db.subscribeReviews(renderCityReviews);
            } catch(e) {}
          }
        }
        // Direct REST fetch to guarantee instant sync without waiting for modules
        try {
          fetch('https://gzbwvleuuxyidohujibj.supabase.co/rest/v1/portfolio?select=*', {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk'
            }
          }).then(function(r) { return r.json(); }).then(function(rows) {
            if (Array.isArray(rows) && rows.length > 0) {
              var parsed = rows.map(function(d) {
                var meta = {};
                if (Array.isArray(d.tags)) {
                  d.tags.forEach(function(t) {
                    if (t && t.startsWith('{')) { try { meta = JSON.parse(t); } catch(e){} }
                  });
                }
                return {
                  id: d.id,
                  title: d.title,
                  category: d.category,
                  deliveryTime: meta.deliveryTime || meta.delivery || (Array.isArray(d.tags) && d.tags[0]) || '⚡ 30m Delivery',
                  image: d.image,
                  description: meta.description || meta.desc || d.description || '',
                  client: meta.client || 'Verified Client'
                };
              });
              localStorage.setItem('dq_portfolio_items', JSON.stringify(parsed));
              renderCityPortfolio(parsed);
            }
          }).catch(function(){});
        } catch(e) {}
      }
      setTimeout(syncCityData, 200);
      setTimeout(syncCityData, 1000);
      setTimeout(syncCityData, 3000);

      // Initialize Lucide Icons safely
      try {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          lucide.createIcons();
        }
      } catch(e) {}
    </script>
  </body>
</html>`;
}

// Run through all cities and services with live Supabase portfolio
async function runAllCityGenerations() {
  let livePortfolio = defaultPortfolio;
  try {
    livePortfolio = await fetchLivePortfolioFromSupabase();
    console.log(`Loaded ${livePortfolio.length} active portfolio items for static page rendering.`);
  } catch(e) {
    console.warn('Using default portfolio for static render:', e);
  }

  let generatedCount = 0;
  const cities = Object.keys(cityDisplayMap);
  const serviceSlugs = Object.keys(serviceDataMap);

  for (const city of cities) {
    for (const slug of serviceSlugs) {
      const htmlContent = generateCityHtml(slug, city, livePortfolio);
      const filePath = path.join(process.cwd(), `${slug}-in-${city}.html`);
      fs.writeFileSync(filePath, htmlContent, 'utf8');
      generatedCount++;
    }
  }

  console.log(`Successfully generated ${generatedCount} SEO City & Service pages with live portfolio!`);

  // Generate ultra-clean, perfectly formatted sitemap.xml for Google Search Console
  try {
    const today = new Date().toISOString().split('T')[0];
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Authority Pages -->
  <url>
    <loc>https://designquixo.in/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://designquixo.in/services.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://designquixo.in/cities.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://designquixo.in/latest-works.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://designquixo.in/request.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://designquixo.in/about.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://designquixo.in/contact.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://designquixo.in/terms.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://designquixo.in/privacy.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://designquixo.in/login.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://designquixo.in/track.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- 16 Indian Cities & Targeted Design Hub Pages (162 Hubs) -->
`;

    for (const city of cities) {
      for (const slug of serviceSlugs) {
        const isGraphic = slug === 'graphic-designer';
        const priority = isGraphic ? '0.85' : '0.75';
        sitemapXml += `  <url>
    <loc>https://designquixo.in/${slug}-in-${city}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
      }
    }

    sitemapXml += `</urlset>\n`;
    fs.writeFileSync(path.join(process.cwd(), 'sitemap.xml'), sitemapXml, 'utf8');
    fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemapXml, 'utf8');
    console.log('Successfully regenerated sitemap.xml with updated timestamp & clean URLs!');
  } catch(sErr) {
    console.error('Error generating sitemap.xml:', sErr);
  }

  return generatedCount;
}

if (require.main === module) {
  runAllCityGenerations().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Fatal error during city generation:', err);
    process.exit(1);
  });
}

module.exports = {
  runAllCityGenerations,
  fetchLivePortfolioFromSupabase
};
