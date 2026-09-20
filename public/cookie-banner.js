/**
 * Design Quixo — Global Cookie Consent & Privacy Compliance
 * Compliant with DPDPA 2023 & IT Act 2000
 * Strictly Cache-Free & Real-Time
 */
(function() {
  'use strict';

  // Suppress benign preview-only Vite websocket disconnect warning
  if (typeof window !== 'undefined' && window.console) {
    const origError = console.error;
    const origWarn = console.warn;
    console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[vite] failed to connect to websocket')) {
        return;
      }
      return origError.apply(console, args);
    };
    console.warn = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[vite] failed to connect to websocket')) {
        return;
      }
      return origWarn.apply(console, args);
    };
  }

  function createFloatingCookieButton() {
    if (document.getElementById('dq-cookie-settings-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'dq-cookie-settings-btn';
    btn.type = 'button';
    btn.title = 'Cookie Preferences';
    btn.className = 'fixed bottom-4 left-4 z-[99990] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-slate-900 hover:text-white text-slate-700 text-[11px] font-bold border border-slate-200/90 shadow-md backdrop-blur-xs transition-all duration-200 cursor-pointer group';
    btn.innerHTML = `
      <span class="text-sm">🍪</span>
      <span class="hidden sm:inline-block font-semibold">Cookie Settings</span>
    `;
    btn.onclick = () => {
      openCookieBanner(true);
    };
    document.body.appendChild(btn);
  }

  function openCookieBanner(forceOpen) {
    let banner = document.getElementById('dq-cookie-consent-banner');
    if (banner) {
      banner.classList.remove('hidden', 'opacity-0', 'translate-y-4');
      return;
    }

    banner = document.createElement('div');
    banner.id = 'dq-cookie-consent-banner';
    banner.className = 'fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-auto sm:right-6 sm:max-w-md z-[99999] transition-all duration-300 transform translate-y-0';
    banner.innerHTML = `
      <div class="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
        <div class="flex items-center gap-2.5">
          <span class="text-base sm:text-lg shrink-0">🍪</span>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] sm:text-xs text-slate-600 leading-snug font-medium line-clamp-2 sm:line-clamp-none">
              We use necessary cookies for live designer routing & WhatsApp delivery. No ads, never sold.
            </p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <a href="privacy.html#cookies" class="hidden sm:inline-block text-[11px] text-slate-400 hover:text-slate-600 underline mr-1">Policy</a>
            <button type="button" id="dq-cookie-essential-btn" class="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-[10px] sm:text-[11px] cursor-pointer">
              Essential
            </button>
            <button type="button" id="dq-cookie-accept-btn" class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] sm:text-[11px] shadow-xs cursor-pointer">
              Accept
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    const dismiss = (choice) => {
      try {
        localStorage.setItem('dq_cookie_consent', choice);
        document.cookie = `dq_cookie_consent=${choice}; path=/; max-age=31536000; SameSite=Lax`;
      } catch(e) {}
      banner.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 300);
    };

    document.getElementById('dq-cookie-accept-btn')?.addEventListener('click', () => dismiss('accepted'));
    document.getElementById('dq-cookie-essential-btn')?.addEventListener('click', () => dismiss('essential'));
  }

  function initCookieConsent() {
    try {
      createFloatingCookieButton();
      const consent = localStorage.getItem('dq_cookie_consent');
      if (!consent) {
        openCookieBanner(false);
      }
    } catch (e) {
      console.warn('Cookie consent notice error:', e);
    }
  }

  window.reopenCookieNotice = function() {
    openCookieBanner(true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
