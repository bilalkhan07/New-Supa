// Design Quixo Creator Agreement & E-Signature Engine (powered by pdf-lib)
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface AgreementData {
  creatorName: string;
  whatsapp: string;
  date: string;
  signatureDataUrl: string;
  designerId?: string;
  designerEmail?: string;
  signedAt?: string;
  pdfDataUrl?: string;
}

export interface AdminAgreementTemplateMetadata {
  fileName: string;
  uploadedAt: number;
  isCustom: boolean;
  version?: string;
}

const STORAGE_KEY_CUSTOM_PDF = 'dq_custom_agreement_pdf_base64';
const STORAGE_KEY_METADATA = 'dq_agreement_pdf_metadata';
const STORAGE_KEY_SIGNED_PREFIX = 'dq_signed_agreement_';
const STORAGE_KEY_ALL_SIGNED = 'dq_all_signed_agreements';

function cleanPdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2022\u00B7]/g, '-')
    .replace(/\u2713|\u2714/g, '[OK]')
    .replace(/\u25B2|\u25BC|\u25BA|\u25C4/g, '!')
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[^\x20-\x7E\r\n\t]/g, '');
}

export const AgreementService = {
  // Check if a custom PDF template is active
  getTemplateMetadata(): AdminAgreementTemplateMetadata {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_METADATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    return {
      fileName: 'Creator_Code_of_Conduct_and_Payout_Agreement.pdf',
      uploadedAt: Date.now(),
      isCustom: false,
      version: '1.0'
    };
  },

  getCustomPdfBase64(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_CUSTOM_PDF);
    } catch (e) {
      return null;
    }
  },

  // Sync uploaded master PDF template from Supabase so designers always see the admin-uploaded original PDF
  async syncTemplateFromSupabase(): Promise<boolean> {
    try {
      const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/login_history?role=eq.master_agreement_template&order=timestamp.desc&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        cache: 'no-store'
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].status && rows[0].status.startsWith('data:application/pdf')) {
          const row = rows[0];
          localStorage.setItem(STORAGE_KEY_CUSTOM_PDF, row.status);
          const meta: AdminAgreementTemplateMetadata = {
            fileName: row.name || 'Custom_Creator_Agreement.pdf',
            uploadedAt: new Date(row.timestamp || Date.now()).getTime(),
            isCustom: true,
            version: '2.0'
          };
          localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(meta));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dq_agreement_template_updated', { detail: meta }));
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('Sync template from Supabase notice:', e);
    }
    return false;
  },

  // Save updated template from Admin Panel (supports file object, base64 string, or metadata)
  async saveTemplate(base64DataOrTemplate: any, fileName?: string): Promise<void> {
    try {
      let base64String = '';
      let name = fileName || 'Custom_Creator_Agreement.pdf';

      if (typeof base64DataOrTemplate === 'string') {
        base64String = base64DataOrTemplate;
      } else if (base64DataOrTemplate && base64DataOrTemplate.pdfBase64) {
        base64String = base64DataOrTemplate.pdfBase64;
        name = base64DataOrTemplate.pdfName || name;
      }

      if (base64String) {
        // Validate that it's a parseable PDF
        const cleanBase64 = base64String.replace(/^data:application\/pdf;base64,/, '');
        const testBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
        await PDFDocument.load(testBytes);

        localStorage.setItem(STORAGE_KEY_CUSTOM_PDF, base64String);
        const meta: AdminAgreementTemplateMetadata = {
          fileName: name,
          uploadedAt: Date.now(),
          isCustom: true,
          version: '2.0'
        };
        localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(meta));

        // Synchronize to Supabase so designers on all devices and browsers immediately load this original PDF
        try {
          const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
          const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';

          await fetch(`${SUPABASE_URL}/rest/v1/login_history`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              id: 'master_agreement_template_pdf',
              phone: 'admin_master',
              name: name,
              role: 'master_agreement_template',
              status: base64String,
              timestamp: new Date().toISOString()
            })
          });
        } catch (sErr) {
          console.warn('Could not sync template to Supabase cloud:', sErr);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dq_agreement_template_updated', { detail: { fileName: name, isCustom: true } }));
      }
    } catch (e) {
      console.error('Error saving agreement template:', e);
      throw e;
    }
  },

  // Reset template to default 3-page agreement
  resetTemplateToDefault(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_PDF);
      const defaultMeta: AdminAgreementTemplateMetadata = {
        fileName: 'Creator_Code_of_Conduct_and_Payout_Agreement.pdf',
        uploadedAt: Date.now(),
        isCustom: false,
        version: '1.0'
      };
      localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(defaultMeta));

      // Remove from Supabase
      try {
        const SUPABASE_URL = 'https://gzbwvleuuxyidohujibj.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Ynd2bGV1dXh5aWRvaHVqaWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg3ODEsImV4cCI6MjEwNTQ4NDc4MX0.qIvmq3FnjJPkKOcxnvFYS158NxF0GHKvd0PSwP7hECk';
        fetch(`${SUPABASE_URL}/rest/v1/login_history?id=eq.master_agreement_template_pdf`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dq_agreement_template_updated', { detail: defaultMeta }));
      }
    } catch (e) {
      console.error('Error resetting agreement template:', e);
    }
  },

  // Get active master template as a direct Blob URL for iframe embedding
  async getMasterTemplatePdfBlobUrl(): Promise<string> {
    const meta = this.getTemplateMetadata();
    const customBase64 = this.getCustomPdfBase64();

    if (meta.isCustom && customBase64) {
      try {
        const cleanBase64 = customBase64.replace(/^data:application\/pdf;base64,/, '');
        const pdfBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Error reading custom PDF blob, generating default:', e);
      }
    }

    const doc = await this.createOfficial3PageAgreementPdf();
    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  },

  // Get active master template as Uint8Array bytes directly for PDF.js canvas rendering
  async getMasterTemplatePdfBytes(): Promise<Uint8Array> {
    const meta = this.getTemplateMetadata();
    const customBase64 = this.getCustomPdfBase64();

    if (meta.isCustom && customBase64) {
      try {
        const cleanBase64 = customBase64.replace(/^data:application\/pdf;base64,/, '');
        return Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
      } catch (e) {
        console.warn('Error reading custom PDF bytes, generating default:', e);
      }
    }

    const doc = await this.createOfficial3PageAgreementPdf();
    return await doc.save();
  },

  // Generate Base Agreement PDF (or use Admin uploaded PDF template) and Stamp E-Signature
  async generateSignedPdf(data: AgreementData | any): Promise<Uint8Array> {
    const meta = this.getTemplateMetadata();
    const customBase64 = this.getCustomPdfBase64();
    let pdfDoc: PDFDocument;

    const normalizedData: AgreementData = {
      creatorName: data.creatorName || data.name || 'Verified Creator',
      whatsapp: data.whatsapp || data.whatsappNumber || data.phone || '',
      date: data.date || data.dateSigned || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      signatureDataUrl: data.signatureDataUrl || data.sigUrl || '',
      designerId: data.designerId || data.id || ''
    };

    if (meta.isCustom && customBase64) {
      // Admin uploaded a custom PDF template!
      try {
        const base64Data = customBase64.replace(/^data:application\/pdf;base64,/, '');
        const existingPdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        pdfDoc = await PDFDocument.load(existingPdfBytes);
      } catch (err) {
        console.warn('Could not load custom admin PDF, falling back to official 3-page document generator:', err);
        pdfDoc = await this.createOfficial3PageAgreementPdf();
      }
    } else {
      // Create official 3-page Design Quixo Creator Code of Conduct & Payout Agreement
      pdfDoc = await this.createOfficial3PageAgreementPdf();
    }

    // Embed the digital signature image if available
    let signatureImage: any = null;
    if (normalizedData.signatureDataUrl && normalizedData.signatureDataUrl.startsWith('data:image/')) {
      try {
        const cleanBase64 = normalizedData.signatureDataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        const imageBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
        if (normalizedData.signatureDataUrl.includes('image/jpeg') || normalizedData.signatureDataUrl.includes('image/jpg')) {
          signatureImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          signatureImage = await pdfDoc.embedPng(imageBytes);
        }
      } catch (sigErr) {
        console.warn('Error embedding signature image:', sigErr);
      }
    }

    // Access page 3 (or last page)
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width } = lastPage.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // If it's our built-in 3-page agreement, we stamp cleanly into Section 13 Acceptance block
    // Stamping coordinates for Section 13 on Page 3:
    // Page 3 has:
    // Creator Name: [value]           Date: [value]
    // Line divider
    // Creator Signature: [sig image]  WhatsApp Number: [value]
    // Line divider

    const nameVal = cleanPdfText(normalizedData.creatorName);
    const dateVal = cleanPdfText(normalizedData.date);
    const phoneVal = normalizedData.whatsapp ? `+91 ${normalizedData.whatsapp.replace(/[^0-9]/g, '').slice(-10)}` : 'Registered WhatsApp';

    // Stamp values directly into Section 13 fields on Page 3:
    // Row 1 Values (Creator Name & Date)
    lastPage.drawText(nameVal, {
      x: 132,
      y: 198,
      size: 10,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.22),
    });

    lastPage.drawText(dateVal, {
      x: 348,
      y: 198,
      size: 9.5,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.22),
    });

    // Row 2 Values (Signature image & WhatsApp)
    if (signatureImage) {
      const sigDims = signatureImage.scaleToFit(140, 36);
      lastPage.drawImage(signatureImage, {
        x: 54,
        y: 88,
        width: sigDims.width,
        height: sigDims.height,
      });
    } else {
      lastPage.drawText(nameVal, {
        x: 54,
        y: 105,
        size: 13,
        font: fontBold,
        color: rgb(0.12, 0.35, 0.85),
      });
      lastPage.drawText('[Digitally Signed Electronically]', {
        x: 54,
        y: 92,
        size: 7,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5),
      });
    }

    lastPage.drawText(phoneVal, {
      x: 418,
      y: 133,
      size: 9.5,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.22),
    });

    // Official Verification Watermark Badge at bottom right of acceptance block
    lastPage.drawText('[VERIFIED DIGITAL E-SIGNATURE]', {
      x: 310,
      y: 105,
      size: 7.5,
      font: fontBold,
      color: rgb(0.1, 0.55, 0.25),
    });

    lastPage.drawText(`Auth Ref: DQ-ESIGN-${cleanPdfText((normalizedData.designerId || phoneVal.replace(/[^0-9]/g, '') || 'AUTH').slice(-8))}`, {
      x: 310,
      y: 92,
      size: 7,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.55),
    });

    return await pdfDoc.save();
  },

  // Build the exact 3-page "Creator Code of Conduct & Payout Agreement" matching the attached document
  async createOfficial3PageAgreementPdf(): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageWidth = 595.28;  // A4 standard points
    const pageHeight = 841.89;
    const margin = 54;
    const contentWidth = pageWidth - (margin * 2);

    const drawHeader = (page: any) => {
      page.drawText('DESIGN QUIXO', {
        x: margin,
        y: pageHeight - 38,
        size: 9,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.25),
      });
      page.drawText('Creator Code of Conduct & Payout Agreement', {
        x: pageWidth - margin - 200,
        y: pageHeight - 38,
        size: 8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.55),
      });
      page.drawLine({
        start: { x: margin, y: pageHeight - 44 },
        end: { x: pageWidth - margin, y: pageHeight - 44 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
    };

    const drawFooter = (page: any, pageNum: number) => {
      page.drawLine({
        start: { x: margin, y: 44 },
        end: { x: pageWidth - margin, y: 44 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
      page.drawText('Design Quixo - Confidential Draft', {
        x: margin,
        y: 32,
        size: 8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.55),
      });
      page.drawText(`Page ${pageNum}`, {
        x: pageWidth - margin - 30,
        y: 32,
        size: 8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.55),
      });
    };

    const wrapAndDrawText = (page: any, text: string, x: number, startY: number, maxWidth: number, fontSize: number, font: any, color: any, lineHeight: number = 12.5): number => {
      const sanitized = cleanPdfText(text);
      const words = sanitized.split(' ');
      let currentLine = '';
      let y = startY;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth) {
          page.drawText(currentLine, { x, y, size: fontSize, font, color });
          currentLine = word;
          y -= lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        page.drawText(currentLine, { x, y, size: fontSize, font, color });
        y -= lineHeight;
      }
      return y;
    };

    // ==========================================
    // PAGE 1
    // ==========================================
    const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(page1);
    drawFooter(page1, 1);

    let y = pageHeight - 78;

    // Document Title
    const titleText = 'Creator Code of Conduct & Payout Agreement';
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 17);
    page1.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y,
      size: 17,
      font: fontBold,
      color: rgb(0.08, 0.18, 0.35),
    });
    y -= 15;

    // Subtitle
    const subText1 = 'This Agreement governs your participation as an independent Creator ("Designer") on the Design';
    const subText2 = 'Quixo platform.';
    const subWidth1 = fontRegular.widthOfTextAtSize(subText1, 9.5);
    const subWidth2 = fontRegular.widthOfTextAtSize(subText2, 9.5);
    page1.drawText(subText1, { x: (pageWidth - subWidth1) / 2, y, size: 9.5, font: fontRegular, color: rgb(0.35, 0.4, 0.48) });
    y -= 13;
    page1.drawText(subText2, { x: (pageWidth - subWidth2) / 2, y, size: 9.5, font: fontRegular, color: rgb(0.35, 0.4, 0.48) });
    y -= 25;

    // 1. Parties & Purpose
    page1.drawText('1. Parties & Purpose', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec1Text = 'This Creator Code of Conduct & Payout Agreement ("Agreement") is entered into between Design Quixo ("Platform," "we," "us") and the individual accepting this Agreement during onboarding ("Creator," "Designer," "you"). By submitting a Creator application, completing verification, or accepting any Job Brief on the Platform, you agree to be bound by the terms below.';
    y = wrapAndDrawText(page1, sec1Text, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);
    y -= 10;

    // 2. Nature of Relationship
    page1.drawText('2. Nature of Relationship', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec2Text = 'You are engaged as an independent contractor, not as an employee, agent, or partner of Design Quixo. Nothing in this Agreement creates an employer-employee relationship. Statutory employment benefits such as Provident Fund (PF), Employee State Insurance (ESI), gratuity, or paid leave are not applicable to this engagement. You are responsible for your own tax filings, statutory contributions, and equipment. You are free to accept, decline, or work with other platforms or clients outside the restrictions explicitly stated in Section 5 (Non-Circumvention).';
    y = wrapAndDrawText(page1, sec2Text, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);
    y -= 10;

    // 3. Onboarding & Verification
    page1.drawText('3. Onboarding & Verification', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec3Text = 'All Creator applications are subject to a manual portfolio and skill review by the Design Quixo team, typically completed within 2-4 hours of submission. Access to live Job Briefs is unlocked only after approval. Design Quixo reserves the right to reject any application, or revoke previously granted access, at its sole discretion.';
    y = wrapAndDrawText(page1, sec3Text, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);
    y -= 10;

    // 4. Payout Terms
    page1.drawText('4. Payout Terms', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;

    // Green Box: 60% Final Design Payout
    const box4Height = 76;
    page1.drawRectangle({
      x: margin,
      y: y - box4Height + 10,
      width: contentWidth,
      height: box4Height,
      color: rgb(0.94, 0.98, 0.95), // Light mint
      borderColor: rgb(0.18, 0.65, 0.38),
      borderWidth: 1,
    });

    page1.drawText('[*] 60% Final Design Payout Policy', {
      x: margin + 12,
      y: y - 4,
      size: 9.5,
      font: fontBold,
      color: rgb(0.08, 0.48, 0.25),
    });

    const box4Text = 'Payout is strictly 60% of the job price for the final approved design accepted by the client, upon the Creator providing unmerged, layered source files (PSD / AI / EPS / CDR / Figma, as applicable to the job type). Unselected drafts receive no payout. Where a Job Brief is claimed by more than one Creator, only the Creator whose design is selected and approved by the client is entitled to payment under this clause.';
    wrapAndDrawText(page1, box4Text, margin + 12, y - 18, contentWidth - 24, 8.2, fontRegular, rgb(0.15, 0.25, 0.2), 11);
    y -= (box4Height + 4);

    const sec4SubText = 'Payouts are processed to the Creator\'s registered payment details within 3-5 business days of client approval and file handover. Design Quixo retains the remaining 40% of the job price as its platform commission, which covers client acquisition, dispute handling, payment processing, and platform operations.';
    y = wrapAndDrawText(page1, sec4SubText, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);
    y -= 10;

    // 5. Anti-Poaching & Non-Circumvention Rule
    page1.drawText('5. Anti-Poaching & Non-Circumvention Rule', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;

    // Amber Box: Anti-Poaching
    const box5Height = 78;
    page1.drawRectangle({
      x: margin,
      y: y - box5Height + 10,
      width: contentWidth,
      height: box5Height,
      color: rgb(1.0, 0.98, 0.93), // Light warm amber
      borderColor: rgb(0.9, 0.65, 0.15),
      borderWidth: 1,
    });

    page1.drawText('[!] Anti-Poaching Non-Circumvention Rule', {
      x: margin + 12,
      y: y - 4,
      size: 9.5,
      font: fontBold,
      color: rgb(0.72, 0.42, 0.05),
    });

    const box5Text = 'Contacting or accepting direct payments from Design Quixo clients outside the platform is strictly prohibited. This includes, without limitation, soliciting a client to work directly, sharing personal contact/payment details with a client for the purpose of bypassing the Platform, or accepting any job, payment, or repeat engagement from a client sourced via Design Quixo without routing it through the Platform. Violators face immediate permanent ban, wallet forfeiture and up to Rs. 1,00,000 legal penalty.';
    wrapAndDrawText(page1, box5Text, margin + 12, y - 18, contentWidth - 24, 8.2, fontRegular, rgb(0.3, 0.22, 0.1), 11);

    // ==========================================
    // PAGE 2
    // ==========================================
    const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(page2);
    drawFooter(page2, 2);

    y = pageHeight - 65;

    // Continuation of Section 5 text
    const sec5Cont = 'This restriction applies for the duration of your engagement with Design Quixo and for a period of 12 months after your account is deactivated or you cease to be an active Creator, in respect of any client you were introduced to through the Platform.';
    y = wrapAndDrawText(page2, sec5Cont, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);
    y -= 14;

    // 6. Quality Standards
    page2.drawText('6. Quality Standards', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 16;

    const qBullets = [
      '- All deliverables must be manually created by the Creator using standard design tools (e.g. Figma, Adobe Illustrator, Photoshop) and must reflect the Creator\'s own original work.',
      '- Designs must be original. Copying, tracing, or closely replicating another designer\'s, brand\'s, or photographer\'s existing copyrighted work without proper authorization or licensing is strictly prohibited and may result in immediate rejection of the submission, suspension, or permanent ban, in addition to any liability the Creator may bear for the underlying copyright infringement.',
      '- Deliverables must be free of distorted text, malformed elements, or unresolved artifacts, and must be submitted as properly structured, layered source files as specified in the Job Brief.'
    ];

    for (const bullet of qBullets) {
      y = wrapAndDrawText(page2, bullet, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);
      y -= 6;
    }
    y -= 8;

    // 7. Intellectual Property Assignment
    page2.drawText('7. Intellectual Property Assignment', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec7Text = 'Upon full payout for an accepted design, all intellectual property rights, including copyright, in the final approved deliverable are assigned to the client. The Creator retains no ownership claim over an approved and paid-for design, and may not reuse, resell, or redistribute it without the client\'s written consent. Unselected/unpaid drafts remain the intellectual property of the Creator, but may not be used in a way that infringes the confidentiality obligations in Section 8.';
    y = wrapAndDrawText(page2, sec7Text, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);
    y -= 14;

    // 8. Confidentiality
    page2.drawText('8. Confidentiality', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec8Text = 'Creators must treat all client briefs, reference materials, and business information shared through the Platform as confidential, and must not disclose such information to any third party or use it for any purpose other than fulfilling the relevant Job Brief.';
    y = wrapAndDrawText(page2, sec8Text, margin, y, contentWidth, 8.8, fontRegular, rgb(0.22, 0.26, 0.32), 12.5);

    // ==========================================
    // PAGE 3
    // ==========================================
    const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(page3);
    drawFooter(page3, 3);

    y = pageHeight - 65;

    // 9. Code of Conduct
    page3.drawText('9. Code of Conduct', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;

    const cocBullets = [
      '- Respond to accepted Job Briefs and client communication promptly and professionally.',
      '- Deliver work within the timeframe committed at the time of accepting the brief.',
      '- Provide revisions in good faith where reasonably requested and within the scope of the original brief.',
      '- Do not misrepresent your identity, skills, or portfolio during onboarding or in client communication.',
      '- Do not engage in harassment, abusive language, or discriminatory conduct toward clients, other Creators, or Design Quixo staff.'
    ];

    for (const bullet of cocBullets) {
      y = wrapAndDrawText(page3, bullet, margin, y, contentWidth, 8.6, fontRegular, rgb(0.22, 0.26, 0.32), 12);
      y -= 4;
    }
    y -= 8;

    // 10. Suspension & Termination
    page3.drawText('10. Suspension & Termination', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec10Text = 'Design Quixo may suspend or permanently terminate a Creator\'s access to the Platform, with or without notice, for violation of this Agreement, including but not limited to breach of Section 5 (Anti-Poaching), Section 6 (Quality Standards), repeated quality failures, or conduct that harms the Platform\'s reputation or client trust. Amounts already earned for approved, delivered work prior to termination will be paid out in accordance with Section 4, subject to any deductions or forfeiture applicable under Section 5.';
    y = wrapAndDrawText(page3, sec10Text, margin, y, contentWidth, 8.6, fontRegular, rgb(0.22, 0.26, 0.32), 12);
    y -= 8;

    // 11. Dispute Resolution
    page3.drawText('11. Dispute Resolution', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec11Text = 'In the event of a dispute regarding payout, job quality, or any other matter arising under this Agreement, both parties agree to first attempt resolution through Design Quixo\'s internal support channel. If unresolved within a reasonable period, either party may pursue remedies available under applicable law.';
    y = wrapAndDrawText(page3, sec11Text, margin, y, contentWidth, 8.6, fontRegular, rgb(0.22, 0.26, 0.32), 12);
    y -= 8;

    // 12. Governing Law & Jurisdiction
    page3.drawText('12. Governing Law & Jurisdiction', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec12Text = 'This Agreement shall be governed by and construed in accordance with the laws of India. The courts at Indore, Madhya Pradesh shall have exclusive jurisdiction over any disputes arising from this Agreement.';
    y = wrapAndDrawText(page3, sec12Text, margin, y, contentWidth, 8.6, fontRegular, rgb(0.22, 0.26, 0.32), 12);
    y -= 8;

    // 13. Acceptance
    page3.drawText('13. Acceptance', { x: margin, y, size: 11.5, font: fontBold, color: rgb(0.08, 0.12, 0.22) });
    y -= 15;
    const sec13Text = 'By clicking "Submit Creator Application," checking the acceptance box during onboarding, or accepting any Job Brief on the Platform, the Creator confirms that they have read, understood, and agree to be bound by all terms of this Agreement.';
    y = wrapAndDrawText(page3, sec13Text, margin, y, contentWidth, 8.6, fontRegular, rgb(0.22, 0.26, 0.32), 12);
    y -= 14;

    // Acceptance Form Grid Area matching the OCR/Screenshot
    // Row 1 Labels
    page3.drawText('Creator Name:', { x: margin, y: 198, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.28) });
    page3.drawText('Date:', { x: 310, y: 198, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.28) });

    // Divider Line 1
    page3.drawLine({
      start: { x: margin, y: 180 },
      end: { x: pageWidth - margin, y: 180 },
      thickness: 0.75,
      color: rgb(0.7, 0.75, 0.8),
    });

    // Row 2 Labels
    page3.drawText('Creator Signature / E-Signature:', { x: margin, y: 133, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.28) });
    page3.drawText('WhatsApp Number:', { x: 310, y: 133, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.28) });

    // Divider Line 2
    page3.drawLine({
      start: { x: margin, y: 78 },
      end: { x: pageWidth - margin, y: 78 },
      thickness: 0.75,
      color: rgb(0.7, 0.75, 0.8),
    });

    return pdfDoc;
  },

  // Save signed agreement record
  saveSignedAgreement(designerId: string, data: AgreementData, pdfBytes?: Uint8Array): void {
    try {
      let pdfUrl = '';
      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        pdfUrl = URL.createObjectURL(blob);
      }
      
      const payload: AgreementData = {
        ...data,
        designerId,
        signedAt: new Date().toISOString(),
        pdfDataUrl: pdfUrl
      };

      localStorage.setItem(`${STORAGE_KEY_SIGNED_PREFIX}${designerId}`, JSON.stringify(payload));

      // Also track in global signed designers index
      let allSigned: any[] = [];
      try {
        allSigned = JSON.parse(localStorage.getItem(STORAGE_KEY_ALL_SIGNED) || '[]');
      } catch (e) {}

      allSigned = allSigned.filter((item: any) => item.designerId !== designerId && item.whatsapp !== data.whatsapp);
      allSigned.unshift({
        designerId,
        creatorName: data.creatorName,
        whatsapp: data.whatsapp,
        date: data.date,
        signedAt: payload.signedAt,
        signatureDataUrl: data.signatureDataUrl
      });
      localStorage.setItem(STORAGE_KEY_ALL_SIGNED, JSON.stringify(allSigned));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dq_agreement_signed', { detail: payload }));
      }
    } catch (err) {
      console.error('Error saving signed agreement:', err);
    }
  },

  // Check if a designer has already signed
  getSignedAgreement(designerId: string): AgreementData | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_SIGNED_PREFIX}${designerId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  },

  // Get list of all signed agreements for Admin panel
  getAllSignedAgreements(): any[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_ALL_SIGNED) || '[]');
    } catch (e) {
      return [];
    }
  },

  // Download PDF bytes directly to client browser
  downloadPdf(pdfBytes: Uint8Array, filename: string = 'Design_Quixo_Signed_Agreement.pdf'): void {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    this.downloadBlob(blob, filename);
  },

  downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 2000);
  },

  // Download Master Template PDF (downloadTemplate / downloadMasterTemplate)
  async downloadTemplate(filename: string = 'Creator_Code_of_Conduct_and_Payout_Agreement.pdf'): Promise<void> {
    return this.downloadMasterTemplate(filename);
  },

  async downloadMasterTemplate(filename: string = 'Creator_Code_of_Conduct_and_Payout_Agreement.pdf'): Promise<void> {
    const meta = this.getTemplateMetadata();
    const customBase64 = this.getCustomPdfBase64();

    if (meta.isCustom && customBase64) {
      const base64Data = customBase64.replace(/^data:application\/pdf;base64,/, '');
      const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      this.downloadPdf(pdfBytes, meta.fileName || filename);
    } else {
      const doc = await this.createOfficial3PageAgreementPdf();
      const pdfBytes = await doc.save();
      this.downloadPdf(pdfBytes, filename);
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).AgreementService = AgreementService;
  (window as any).DQAgreementService = AgreementService;
}

export default AgreementService;

