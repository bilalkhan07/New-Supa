// Design Quixo - Chrome Web Push & System Notification Client Engine
(function() {
  const DQPush = {
    swRegistration: null,
    isSubscribed: false,
    vapidPublicKey: null,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',

    urlBase64ToUint8Array: function(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },

    init: async function() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[DQPush] Push notifications are not supported in this browser environment.');
        return false;
      }

      try {
        // Register Service Worker
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[DQPush] Service Worker registered successfully:', this.swRegistration.scope);

        // Listen for messages from Service Worker (e.g. play sound on notification click)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'PLAY_JOB_CHIME') {
            console.log('[DQPush] Received PLAY_JOB_CHIME message from SW');
            if (window.DQSoundService) {
              window.DQSoundService.unlockAudio();
              window.DQSoundService.playNewJobChime(event.data.count || 5);
            }
          }
        });

        // Check current subscription
        const existingSub = await this.swRegistration.pushManager.getSubscription();
        this.isSubscribed = !(existingSub === null);

        if (this.isSubscribed) {
          console.log('[DQPush] Existing push subscription active.');
          // Sync with server in background
          this.syncSubscriptionToServer(existingSub);
        }

        // Auto-check if URL requests auto-play alert (e.g. user clicked notification)
        this.checkUrlAutoPlayTrigger();

        // Update UI pills
        this.updateNotificationUiBadges();

        return true;
      } catch (err) {
        console.warn('[DQPush] SW registration / init error:', err);
        return false;
      }
    },

    fetchVapidKey: async function() {
      if (this.vapidPublicKey) return this.vapidPublicKey;
      try {
        const res = await fetch('/api/push-vapid-public-key');
        const data = await res.json();
        if (data.success && data.publicKey) {
          this.vapidPublicKey = data.publicKey;
          return this.vapidPublicKey;
        }
      } catch (e) {
        console.warn('[DQPush] Failed to fetch VAPID key:', e);
      }
      // Fallback default key
      this.vapidPublicKey = 'BN3PRogrLXTWkDjdv9B0QdDEGuUH5-cNIewJ6KgJ2glQrLgtGng1WocCuqmzrL1-BIdSfNb6SX2Xz0HzsP8Yuhk';
      return this.vapidPublicKey;
    },

    requestPermissionAndSubscribe: async function() {
      if (!('Notification' in window)) {
        if (typeof showToast === 'function') showToast('⚠️ Browser does not support desktop notifications.', 'warning');
        return false;
      }

      try {
        if (window.DQSoundService) {
          window.DQSoundService.unlockAudio();
        }

        const permission = await Notification.requestPermission();
        this.permission = permission;

        if (permission !== 'granted') {
          console.warn('[DQPush] Notification permission was denied / dismissed.');
          if (typeof showToast === 'function') {
            showToast('⚠️ Chrome Notifications blocked. Please allow notifications in Chrome site settings.', 'warning');
          }
          this.updateNotificationUiBadges();
          return false;
        }

        if (!this.swRegistration) {
          await this.init();
        }

        const vapidKey = await this.fetchVapidKey();
        const convertedKey = this.urlBase64ToUint8Array(vapidKey);

        let subscription = await this.swRegistration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await this.swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
          });
        }

        this.isSubscribed = true;
        await this.syncSubscriptionToServer(subscription);

        console.log('[DQPush] Subscribed to Chrome Push Notifications successfully!');
        if (typeof showToast === 'function') {
          showToast('✓ Chrome Push Notifications Enabled! You will receive 5x alert sounds even when tab is closed.', 'success');
        }

        this.updateNotificationUiBadges();
        return true;
      } catch (err) {
        console.error('[DQPush] Error subscribing to push notifications:', err);
        if (typeof showToast === 'function') {
          showToast('⚠️ Could not complete push subscription: ' + (err.message || 'Unknown error'), 'error');
        }
        return false;
      }
    },

    syncSubscriptionToServer: async function(subscription) {
      if (!subscription) return;
      try {
        let currentUser = null;
        try {
          currentUser = JSON.parse(localStorage.getItem('dq_current_user') || 'null');
        } catch(e) {}

        const payload = {
          subscription: subscription,
          role: (currentUser && currentUser.role) || (localStorage.getItem('dq_admin_logged_in') === 'true' ? 'admin' : 'designer'),
          identifier: (currentUser && (currentUser.identifier || currentUser.phone || currentUser.email)) || 'designer',
          name: (currentUser && currentUser.name) || 'User',
          timestamp: Date.now()
        };

        // 1. Save to Vercel Serverless Function
        fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});

        // 2. Direct Supabase push_subscriptions table upsert
        try {
          const db = window.DQSupabase || window.DQFirebase;
          const SUPABASE_URL = (db && db.url) ? db.url : 'https://gzbwvleuuxyidohujibj.supabase.co';
          const SUPABASE_ANON_KEY = (db && db.key) ? db.key : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

          const endpointHash = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-40);
          const subRecord = {
            id: endpointHash,
            endpoint: subscription.endpoint,
            subscription: subscription,
            role: payload.role,
            identifier: payload.identifier,
            name: payload.name,
            updated_at: new Date().toISOString()
          };

          fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(subRecord)
          }).catch(() => {});
        } catch(sbErr) {}
      } catch (e) {
        console.warn('[DQPush] Sync subscription error:', e);
      }
    },

    showLocalSystemNotification: function(title, body, jobId, price) {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
      }

      const options = {
        body: body || 'New client order received! Tap to open workstation & claim.',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: jobId ? `job-${jobId}` : 'dq-new-job',
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 150, 300, 150, 300, 150, 300, 150, 300],
        data: {
          url: jobId ? `/designer-dashboard.html?alertJob=${jobId}&autoPlay=5` : '/designer-dashboard.html?autoPlay=5',
          jobId: jobId
        }
      };

      if (this.swRegistration && typeof this.swRegistration.showNotification === 'function') {
        this.swRegistration.showNotification(title, options);
      } else {
        try {
          const n = new Notification(title, options);
          n.onclick = function() {
            window.focus();
            if (window.DQSoundService) {
              window.DQSoundService.unlockAudio();
              window.DQSoundService.playNewJobChime(5);
            }
            this.close();
          };
        } catch(e) {}
      }
    },

    testNotificationWithChime: async function() {
      if (window.DQSoundService) {
        window.DQSoundService.unlockAudio();
        window.DQSoundService.playNewJobChime(5);
      }

      if (typeof Notification === 'undefined') {
        if (typeof showToast === 'function') showToast('🔊 Playing 5x alert chime! (Desktop notifications not supported in this browser)', 'info');
        return;
      }

      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermissionAndSubscribe();
        if (!granted) return;
      }

      // Show instant desktop notification test
      this.showLocalSystemNotification(
        '🚨 TEST: Chrome Job Notification (5x Alert)',
        '₹799 • Logo & Banner Design | Client: Rahul Sharma. Notifications are 100% active & working!',
        'TEST-001',
        799
      );

      // Also trigger server-side test push
      try {
        fetch('/api/trigger-push-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🚨 TEST CHROME PUSH NOTIFICATION',
            body: '₹799 • New Design Work Ready | Tap to claim work!',
            jobId: 'TEST-001',
            price: 799,
            service: 'Logo & Branding',
            autoPlay: 5
          })
        }).catch(() => {});
      } catch(e) {}

      if (typeof showToast === 'function') {
        showToast('🔔 Sent test Chrome notification with 5x audio chime & vibration!', 'success');
      }
    },

    checkUrlAutoPlayTrigger: function() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('autoPlay') || urlParams.has('alertJob')) {
          const repeat = parseInt(urlParams.get('autoPlay') || '5', 10);
          console.log('[DQPush] AutoPlay parameter detected in URL. Playing 5x chime...');
          setTimeout(() => {
            if (window.DQSoundService) {
              window.DQSoundService.unlockAudio();
              window.DQSoundService.playNewJobChime(repeat);
            }
          }, 600);
        }
      } catch(e) {}
    },

    updateNotificationUiBadges: function() {
      const statusPill = document.getElementById('dq-push-status-pill');
      const isGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';

      if (statusPill) {
        if (isGranted) {
          statusPill.className = 'flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs';
          statusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>🔔 Push Alerts: Active</span>`;
          statusPill.title = 'Chrome System Notifications are Enabled & Active (5x sound will alert for new jobs)';
        } else {
          statusPill.className = 'flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all shadow-2xs animate-bounce';
          statusPill.innerHTML = `<i data-lucide="bell-ring" class="w-3.5 h-3.5 text-amber-600"></i><span>🔔 Enable Chrome Notifications</span>`;
          statusPill.title = 'Click to enable Chrome system push notifications when jobs arrive';
          statusPill.onclick = () => this.requestPermissionAndSubscribe();
          if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }
      }
    }
  };

  window.DQPush = DQPush;

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DQPush.init());
  } else {
    DQPush.init();
  }
})();
