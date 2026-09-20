// Design Quixo Transactional Email Notification Service
// Handles Designer Registration, Admin Alerts, and Onboarding Welcome Emails

export interface EmailLogEntry {
  id: string;
  type: 'designer_registration' | 'admin_alert' | 'designer_approval';
  to: string;
  subject: string;
  sentAt: string;
  data: any;
}

const STORAGE_KEY_EMAIL_LOGS = 'dq_email_notifications_log';

export const EmailService = {
  // Save log entry to local storage for Admin inspection
  logEmail(entry: Omit<EmailLogEntry, 'id' | 'sentAt'>): void {
    try {
      const fullEntry: EmailLogEntry = {
        ...entry,
        id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sentAt: new Date().toISOString()
      };

      let logs: EmailLogEntry[] = [];
      const stored = localStorage.getItem(STORAGE_KEY_EMAIL_LOGS);
      if (stored) {
        logs = JSON.parse(stored);
      }
      logs.unshift(fullEntry);
      // Keep last 100 logs
      if (logs.length > 100) logs = logs.slice(0, 100);

      localStorage.setItem(STORAGE_KEY_EMAIL_LOGS, JSON.stringify(logs));

      // Dispatch event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dq_email_sent', { detail: fullEntry }));
      }
    } catch (e) {
      console.warn('Error saving email log entry:', e);
    }
  },

  // Get all email logs for Admin Panel
  getEmailLogs(): EmailLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMAIL_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  // Helper to trigger interactive visual notification banner in app
  showNotificationToast(title: string, message: string, type: 'info' | 'success' | 'alert' = 'info'): void {
    if (typeof document === 'undefined') return;

    let toastContainer = document.getElementById('dq-email-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'dq-email-toast-container';
      toastContainer.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-x-10 opacity-0 flex items-start gap-3 ${
      type === 'success' 
        ? 'bg-slate-900/95 text-white border-emerald-500/50' 
        : type === 'alert'
        ? 'bg-slate-900/95 text-white border-amber-500/50'
        : 'bg-slate-900/95 text-white border-indigo-500/50'
    }`;

    const icon = type === 'success' ? '✉️' : type === 'alert' ? '🔔' : '📧';

    toast.innerHTML = `
      <div class="text-2xl select-none pt-0.5">${icon}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-400">System Email Dispatched</h4>
          <span class="text-[10px] text-slate-400">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p class="text-sm font-semibold text-white mt-0.5">${title}</p>
        <p class="text-xs text-slate-300 mt-1 line-clamp-2">${message}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-lg font-bold leading-none">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-10', 'opacity-0');
    });

    // Auto remove after 6 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('opacity-0', 'translate-x-10');
        setTimeout(() => toast.remove(), 300);
      }
    }, 6000);
  },

  // 1. Designer registration received email disabled as per policy (saves email count)
  async sendRegistrationEmailToDesigner(designer: { name: string; email: string; phone: string }): Promise<boolean> {
    // Designer gets no email on registration submit. They only receive email on Account Approval, Login OTP, and Job Updates.
    console.log('[Email Policy] Skipped registration-received email for designer to optimize email quota:', designer.email);
    return true;
  },

  // 2. Send Admin Notification Email for New Designer Application (Sent ONLY to designquixo@gmail.com)
  async sendNewRegistrationAlertToAdmin(designer: { name: string; email: string; phone: string; portfolio?: string; skills?: string }): Promise<boolean> {
    const adminEmail = 'designquixo@gmail.com';
    const cleanPhone = designer.phone.replace(/[^0-9]/g, '').slice(-10);
    const subject = `New Creator Application: ${designer.name} (+91 ${cleanPhone})`;

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0;">New Creator Application Submitted</p>
    <p style="font-size: 14px; color: #334155; margin: 0 0 14px 0;">
      A new designer has registered and signed the Creator Agreement:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; font-size: 13px;">
      <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${designer.name}</p>
      <p style="margin: 0 0 6px 0;"><strong>Email:</strong> ${designer.email}</p>
      <p style="margin: 0 0 6px 0;"><strong>Mobile / WhatsApp:</strong> +91 ${cleanPhone}</p>
      <p style="margin: 0 0 6px 0;"><strong>Portfolio:</strong> ${designer.portfolio || 'N/A'}</p>
      <p style="margin: 0 0 6px 0;"><strong>Skills:</strong> ${designer.skills || 'Design'}</p>
      <p style="margin: 0; color: #16a34a;"><strong>Agreement:</strong> Digitally Signed & Stamped ✓</p>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo Operations Alert
    </p>
  </div>
</body>
</html>`;

    // Dispatch real email ONLY to designquixo@gmail.com
    try {
      const textMsg = `New Creator Application:\n\nName: ${designer.name}\nEmail: ${designer.email}\nPhone: +91 ${cleanPhone}\nPortfolio: ${designer.portfolio || 'N/A'}\nSkills: ${designer.skills || 'Design'}\n\nDesign Quixo Operations Alert`;
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'designquixo@gmail.com',
          subject,
          html: htmlBody,
          text: textMsg
        })
      });
    } catch (err) {
      console.warn('Admin registration alert dispatch notice:', err);
    }

    this.logEmail({
      type: 'admin_alert',
      to: 'designquixo@gmail.com',
      subject,
      data: designer
    });

    return true;
  },

  // 3. Send Official Approval & Feature Welcome Email when Designer is Approved
  async sendApprovalWelcomeEmailToDesigner(designer: { name: string; email: string; phone: string }): Promise<boolean> {
    const cleanEmail = (designer.email || '').toString().trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.endsWith('@example.com') || cleanEmail.includes('undefined') || cleanEmail === 'test@test.com') {
      console.warn('Skipping approval email dispatch: invalid email', designer.email);
      return false;
    }

    const cleanPhone = designer.phone.replace(/[^0-9]/g, '').slice(-10);
    const subject = `Design Quixo — Account Approved`;

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 10px 0;">Hello ${designer.name},</p>
    <p style="font-size: 14px; color: #334155; margin: 0 0 14px 0;">
      Your Creator application and portfolio have been verified and approved by the Design Quixo Review Team. Your platform access is now active.
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; font-size: 13px;">
      <p style="margin: 0 0 6px 0;"><strong>Account Status:</strong> Verified & Active ✓</p>
      <p style="margin: 0 0 6px 0;"><strong>Registered Email:</strong> ${designer.email}</p>
      <p style="margin: 0;"><strong>Payout Rate:</strong> 60% of job price for approved designs</p>
    </div>
    <p style="font-size: 13px; color: #475569; margin: 16px 0 0 0;">
      You can now log in to your Designer Dashboard to view and claim available jobs.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo India • Plot 12, Dwarka, New Delhi • &copy; ${new Date().getFullYear()}
    </p>
  </div>
</body>
</html>`;

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: designer.email,
          subject,
          html: htmlBody,
          text: `Hello ${designer.name},\n\nYour Creator account on Design Quixo has been approved. You can now log in to your Designer Dashboard to claim available jobs.\n\nDesign Quixo India`
        })
      });
    } catch (e) {}

    this.logEmail({
      type: 'designer_approval',
      to: designer.email,
      subject,
      data: designer
    });

    this.showNotificationToast(
      `Welcome Email Sent to ${designer.name}`,
      `Account approval notification dispatched.`,
      'success'
    );

    return true;
  }
};

if (typeof window !== 'undefined') {
  (window as any).DQEmailService = EmailService;
}

export default EmailService;
