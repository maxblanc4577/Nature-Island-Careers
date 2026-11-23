import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { JobProvider } from '../context/JobContext';
import { PaymentForm } from '../components/PaymentForm';
import { PaymentStatusDisplay } from '../components/PaymentStatusDisplay';
import { StripePaymentModal } from '../components/StripePaymentModal';
import {
  PaymentHistory,
  escapeCsvCell,
  buildPaymentHistoryCsv,
  PaymentHistoryRecord,
} from '../components/PaymentHistory';
import { CandidateProfileHub } from '../components/CandidateProfileHub';
import {
  BrandAssetGenerator,
  BRAND_ASSET_PRESETS,
  resolveAdminAuthToken,
} from '../components/BrandAssetGenerator';
import { BrandIdentityGenerator } from '../components/BrandIdentityGenerator';
import { Header } from '../components/Header';
import {
  PaymentLogging,
  mapStripeErrorCode,
  sanitizePaymentMetadata,
  executeWithExponentialBackoff,
  TransientPaymentError,
} from '../utils/paymentLogger';
import {
  normalizeCategoryList,
  buildDeterministicSubscriptionId,
  subscribeToJobCategories,
} from '../services/emailService';
import { sanitizeEmailSubscriptionForFirestore, EMAIL_SUBSCRIPTION_CONSTRAINTS } from '../firebase';
import { generateResumePdf } from '../utils/generateResumePdf';
import {
  resolveShortcutAction,
  isEditableEventTarget,
  GLOBAL_NAVIGATION_SHORTCUTS,
  GlobalShortcutHandlers,
} from '../hooks/useGlobalKeyboardShortcuts';

describe('Batched Features Comprehensive Audit Suite', () => {
  beforeEach(() => {
    PaymentLogging.clear();
  });

  // 1. Email Category Subscriptions Service & Firestore Rules
  describe('1. Email Category Subscriptions Service & Firestore Rules', () => {
    it('normalizes categories deduplicating case-insensitively and enforces volumetric bounds', () => {
      const normalized = normalizeCategoryList([
        '  Geothermal Energy ',
        'geothermal energy',
        'Eco-Tourism',
        'x', // < 2 chars filtered out
        'Information Technology',
      ]);
      expect(normalized).toEqual(['Geothermal Energy', 'Eco-Tourism', 'Information Technology']);

      const tooMany = Array.from({ length: 20 }, (_, i) => `Category ${i + 1}`);
      expect(normalizeCategoryList(tooMany).length).toBe(
        EMAIL_SUBSCRIPTION_CONSTRAINTS.CATEGORIES_MAX_ITEMS
      );
    });

    it('builds deterministic valid Firestore document IDs and validates sanitizeEmailSubscriptionForFirestore', () => {
      const id = buildDeterministicSubscriptionId('Max.Blanc@Example.DM', [
        'Geothermal Energy',
        'IT & Tech',
      ]);
      expect(id).toMatch(/^[a-zA-Z0-9_\-]+$/);
      expect(id.length).toBeLessThanOrEqual(EMAIL_SUBSCRIPTION_CONSTRAINTS.ID_MAX_LENGTH);

      const sanitized = sanitizeEmailSubscriptionForFirestore({
        id,
        uid: 'uid_dominica_1',
        email: '  Max.Blanc@Example.DM ',
        name: 'Max Blanc',
        categories: ['Geothermal Energy'],
        parishes: ['St. George'],
        frequency: 'daily',
        active: true,
      });

      expect(sanitized.uid).toBe('uid_dominica_1');
      expect(sanitized.email).toBe('max.blanc@example.dm');
      expect(sanitized.frequency).toBe('daily');
      expect(sanitized.categories).toEqual(['Geothermal Energy']);
    });

    it('rejects invalid email or empty categories in subscribeToJobCategories and posts valid payload to /api/email/subscribe', async () => {
      await expect(
        subscribeToJobCategories({ email: 'not-an-email', categories: ['IT & Tech'] })
      ).rejects.toThrow(/valid email address/i);

      await expect(
        subscribeToJobCategories({ email: 'candidate@dominica.dm', categories: [] })
      ).rejects.toThrow(/At least one job category/i);

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await subscribeToJobCategories({
        email: 'Talent@Dominica.DM',
        name: 'Devon Paul',
        categories: ['Geothermal Energy', 'Eco-Tourism'],
        parishes: ['St. George'],
        frequency: 'weekly',
      });

      expect(result.email).toBe('talent@dominica.dm');
      expect(result.persistedInBackend).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/email/subscribe',
        expect.objectContaining({ method: 'POST' })
      );
      fetchSpy.mockRestore();
    });

    it('enforces owner-scoped email_verified rules & volumetric constraints in firestore.rules', () => {
      const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
      expect(rules).toContain('match /emailSubscriptions/{subscriptionId}');
      expect(rules).toContain('isValidEmailCategorySubscription(');
      expect(rules).toContain('email_verified == true');
      expect(rules).toContain('data.categories.size() <= 10');
      expect(rules).toContain('allow list: if false;');
    });
  });

  // 2. Stripe Exponential Backoff Auto-Retry, Diagnostics & Webhook Auto-Sync
  describe('2. Stripe Backoff Retry Engine, Diagnostics & Webhook Status Sync', () => {
    it('redacts Stripe secret keys & strips sensitive card keys from metadata and error logs', () => {
      const cleaned = sanitizePaymentMetadata({
        cardNumber: '4242424242424242',
        cvc: '123',
        note: 'token sk_live_secretXYZ123 leaked',
        amountXCD: 450,
      });

      expect(cleaned?.cardNumber).toBeUndefined();
      expect(cleaned?.cvc).toBeUndefined();
      expect(cleaned?.note).toContain('[REDACTED]');
      expect(cleaned?.note).not.toContain('sk_live_secretXYZ123');

      const log = PaymentLogging.log({
        event: 'payment_error',
        status: 'error',
        paymentIntentId: 'pi_123_secret_abcDEF',
        message: 'Failed with sk_test_mySecretKey99',
      });
      expect(log.paymentIntentId).toBe('pi_123');
      expect(log.message).toContain('[REDACTED]');
      expect(log.message).not.toContain('sk_test_mySecretKey99');
    });

    it('maps Stripe error codes and retries transient network/502 errors with exponential backoff', async () => {
      expect(mapStripeErrorCode('gateway_timeout').isTransient).toBe(true);
      expect(mapStripeErrorCode('card_declined').isTransient).toBe(false);

      const delays: number[] = [];
      let attempts = 0;

      const value = await executeWithExponentialBackoff({
        maxRetries: 3,
        baseDelayMs: 5,
        maxDelayMs: 100,
        onRetryScheduled: (info) => delays.push(info.delayMs),
        operation: async () => {
          attempts += 1;
          if (attempts < 3) {
            throw new TransientPaymentError('502 Bad Gateway', { status: 502 });
          }
          return 'succeeded';
        },
      });

      expect(value).toBe('succeeded');
      expect(attempts).toBe(3);
      expect(delays).toEqual([5, 10]); // exponential doubling: 5ms, 10ms
    });

    it('aborts non-transient card declines immediately and honours AbortSignal cancellation', async () => {
      let declineAttempts = 0;
      await expect(
        executeWithExponentialBackoff({
          maxRetries: 3,
          baseDelayMs: 5,
          operation: async () => {
            declineAttempts += 1;
            const err = new Error('Card declined by issuer');
            (err as any).code = 'card_declined';
            throw err;
          },
        })
      ).rejects.toThrow('Card declined by issuer');
      expect(declineAttempts).toBe(1);

      const controller = new AbortController();
      controller.abort();
      await expect(
        executeWithExponentialBackoff({
          maxRetries: 2,
          baseDelayMs: 50,
          signal: controller.signal,
          operation: async () => 'never',
        })
      ).rejects.toThrow(/Aborted/i);
    });

    it('renders PaymentForm, PaymentStatusDisplay (with retry status), and StripePaymentModal cleanly without secrets', () => {
      const formHtml = renderToStaticMarkup(
        <JobProvider>
          <PaymentForm
            pkg={{
              id: 'featured',
              name: 'Featured Top-of-Board Pin',
              priceXCD: 270,
              priceUSDNumber: 100,
              billingCadence: 'one_time',
            }}
            currencyPeg={2.7}
            isSandboxMode={true}
            publishableKey="pk_test_sandbox"
            initialName="Dominica Resorts"
            initialEmail="hr@dominica.dm"
            clientSecret="pi_sandbox_123_secret_456"
            hasLiveElements={false}
            onSuccess={() => {}}
            onClose={() => {}}
          />
        </JobProvider>
      );
      expect(formHtml).toContain('Pay EC$ 270 with Stripe');
      expect(formHtml).not.toContain('sk_live_');

      const statusRetryHtml = renderToStaticMarkup(
        <PaymentStatusDisplay
          status="processing"
          receipt={null}
          errorInfo={null}
          logs={[]}
          currencyPeg={2.7}
          billingEmail="hr@dominica.dm"
          cardholderName="Dominica Resorts"
          billingParish="St. George"
          retryState={{ retrying: true, attempt: 2, maxRetries: 3, nextDelayMs: 900 }}
          onRetry={() => {}}
          onDismissError={() => {}}
          onClose={() => {}}
        />
      );
      expect(statusRetryHtml).toContain('data-testid="stripe-retry-status"');
      expect(statusRetryHtml).toContain('Auto-retry 2/3');

      const modalHtml = renderToStaticMarkup(
        <JobProvider>
          <StripePaymentModal isOpen={true} onClose={() => {}} />
        </JobProvider>
      );
      expect(modalHtml).toContain('Sandbox');
      expect(modalHtml).toContain('Featured Top-of-Board Pin');
      expect(modalHtml).toContain('data-testid="toggle-webhook-guide-btn"');
    });

    it('verifies /api/stripe/webhook guards against unpaid checkout sessions and enriches /api/jobs paymentStatus', () => {
      const serverCode = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
      expect(serverCode).toContain("obj.payment_status === 'unpaid'");
      expect(serverCode).toContain('jobListingPaymentStatuses');
      expect(serverCode).toContain("app.get('/api/jobs'");
      expect(serverCode).toContain('paymentStatus: paymentSync.status');
    });
  });

  // 3. PaymentHistory & Formula-Safe CSV Export
  describe('3. PaymentHistory & CSV Export in CandidateProfileHub', () => {
    it('escapes formula injection characters and formats RFC-4180 CSV headers and rows', () => {
      expect(escapeCsvCell('=SUM(A1:A5)')).toBe('"\'=SUM(A1:A5)"');
      expect(escapeCsvCell('+1-767-555-0100')).toBe('"\'+1-767-555-0100"');
      expect(escapeCsvCell('-cmd|calc')).toBe('"\'-cmd|calc"');
      expect(escapeCsvCell('@admin')).toBe('"\'@admin"');
      expect(escapeCsvCell('Waitukubuli "Nature" Isle')).toBe('"Waitukubuli ""Nature"" Isle"');

      const sampleRecords: PaymentHistoryRecord[] = [
        {
          id: 'ord_1',
          invoiceNumber: 'INV-DOM-2026-001',
          date: '2026-11-23',
          planName: 'Featured Top-of-Board Pin',
          companyName: 'Jungle Bay Villas',
          recipientEmail: 'accounts@junglebay.dm',
          amountXCD: 270,
          amountUSD: 100,
          billingInterval: 'one_time',
          status: 'Paid',
          paymentMethod: 'Stripe •••• 4242 (Visa)',
          paymentIntentId: 'pi_sandbox_001',
        },
      ];

      const csv = buildPaymentHistoryCsv(sampleRecords);
      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('"Invoice Number"');
      expect(lines[0]).toContain('"Amount (XCD)"');
      expect(lines[1]).toContain('"INV-DOM-2026-001"');
      expect(lines[1]).toContain('"270.00"');
      expect(lines[1]).toContain('"Paid"');
    });

    it('renders PaymentHistory subtab in CandidateProfileHub with CSV export control', () => {
      const html = renderToStaticMarkup(
        <JobProvider>
          <CandidateProfileHub
            initialSubTab="payment_history"
            onBrowseJobs={() => {}}
            onSelectJob={() => {}}
          />
        </JobProvider>
      );
      expect(html).toContain('data-testid="subtab-payment-history"');
      expect(html).toContain('data-testid="payment-history-panel"');
      expect(html).toContain('data-testid="export-payment-history-csv-btn"');
    });
  });

  // 4. Admin AI BrandAssetGenerator
  describe('4. BrandAssetGenerator (Admin AI Image Studio)', () => {
    it('locks AI generation studio for non-admin users while rendering cleanly standalone', () => {
      const nonAdminHtml = renderToStaticMarkup(<BrandAssetGenerator isAdmin={false} />);
      expect(nonAdminHtml).toContain('data-testid="brand-asset-admin-lock"');
      expect(nonAdminHtml).not.toContain('data-testid="generate-brand-asset-btn"');

      const brandStudioStandaloneHtml = renderToStaticMarkup(<BrandIdentityGenerator />);
      expect(brandStudioStandaloneHtml).toContain('data-testid="tab-ai-brand-assets"');
    });

    it('renders full preset & art-direction studio controls for authenticated admins', () => {
      const adminHtml = renderToStaticMarkup(
        <BrandAssetGenerator isAdmin={true} adminToken="admin-token-123" />
      );
      expect(adminHtml).toContain('data-testid="brand-asset-generator-studio"');
      expect(adminHtml).toContain('data-testid="generate-brand-asset-btn"');
      BRAND_ASSET_PRESETS.forEach((preset) => {
        expect(adminHtml).toContain(`data-testid="asset-preset-${preset.id}"`);
      });
      expect(adminHtml).toContain('gemini-3.1-flash-lite-image');
      expect(resolveAdminAuthToken('token-abc')).toBe('token-abc');
    });

    it('configures server-side POST /api/brand/generate-asset guarded by requireAdminAuth without fake fallbacks', () => {
      const serverCode = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
      expect(serverCode).toContain("app.post('/api/brand/generate-asset', requireAdminAuth, aiRateLimiter");
      expect(serverCode).toContain("model: 'gemini-3.1-flash-lite-image'");
      expect(serverCode).toContain("code: 'gemini_not_configured'");
      expect(serverCode).not.toContain('fallbackSvg');
    });
  });

  // 5. ResumeBuilder PDF Export (jspdf)
  describe('5. ResumeBuilder PDF Export via jsPDF', () => {
    it('generates formatted PDF filenames and writes resume sections via jsPDF', async () => {
      const fileName = await generateResumePdf({
        candidateName: 'Elena Jno-Baptiste',
        layoutTemplate: 'executive',
        resumeData: {
          fullName: 'Elena Jno-Baptiste',
          headline: 'Geothermal Civil Engineer',
          email: 'elena@dominica.dm',
          phone: '+1-767-555-0192',
          parish: 'St. George',
          locality: 'Roseau',
          dssNumber: 'DSS-99210',
          summary: 'Lead infrastructure engineer supporting Laudat geothermal expansion.',
          experiences: [
            {
              id: 'exp_1',
              title: 'Senior Civil Engineer',
              company: 'DGDC Geothermal',
              location: 'Roseau Valley',
              startDate: '2023',
              endDate: 'Present',
              isCurrent: true,
              highlights: ['Managed steamfield pipeline installation.'],
            },
          ],
          education: [
            {
              id: 'edu_1',
              degree: 'BSc Civil Engineering',
              field: 'Structural Systems',
              institution: 'UWI St. Augustine',
              location: 'Trinidad',
              graduationYear: '2020',
            },
          ],
          skills: ['AutoCAD', 'Geotechnical Survey', 'Project Management'],
          languages: ['English (Native)'],
          certifications: [
            {
              id: 'cert_1',
              name: 'PMP Certification',
              issuer: 'PMI',
              year: '2024',
            },
          ],
        },
      });

      expect(fileName).toBe('Elena_Jno-Baptiste_Dominica_executive_CV.pdf');
    });

    it('includes PDF export trigger button inside CandidateProfileHub resume builder view', () => {
      const html = renderToStaticMarkup(
        <JobProvider>
          <CandidateProfileHub
            initialSubTab="resume_builder"
            onBrowseJobs={() => {}}
            onSelectJob={() => {}}
          />
        </JobProvider>
      );
      expect(html).toContain('data-testid="download-resume-pdf-btn"');
      expect(html).toContain('Download as PDF');
    });
  });

  // 6. Global Keyboard Shortcuts
  describe('6. Global Keyboard Shortcuts & Accessibility', () => {
    it('routes Alt+J, Alt+R, Alt+P, Alt+C, Alt+E, Alt+B, Alt+A/Ctrl+Shift+A, and Shift+? accurately', () => {
      const handlers: GlobalShortcutHandlers = {
        onNavigateJobs: vi.fn(),
        onNavigateRemote: vi.fn(),
        onNavigateProfile: vi.fn(),
        onNavigateCareer: vi.fn(),
        onNavigateEmployers: vi.fn(),
        onNavigateBrandStudio: vi.fn(),
        onNavigateAdmin: vi.fn(),
        onToggleHelpModal: vi.fn(),
      };

      expect(
        resolveShortcutAction(
          { key: 'j', altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, target: null },
          handlers
        )
      ).toBe('jobs');
      expect(handlers.onNavigateJobs).toHaveBeenCalledTimes(1);

      expect(
        resolveShortcutAction(
          { key: 'P', altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, target: null },
          handlers
        )
      ).toBe('profile');
      expect(handlers.onNavigateProfile).toHaveBeenCalledTimes(1);

      expect(
        resolveShortcutAction(
          { key: 'A', altKey: false, ctrlKey: true, metaKey: false, shiftKey: true, target: null },
          handlers
        )
      ).toBe('admin');
      expect(handlers.onNavigateAdmin).toHaveBeenCalledTimes(1);

      expect(
        resolveShortcutAction(
          { key: '?', altKey: false, ctrlKey: false, metaKey: false, shiftKey: true, target: null },
          handlers
        )
      ).toBe('help');
      expect(handlers.onToggleHelpModal).toHaveBeenCalledTimes(1);

      expect(GLOBAL_NAVIGATION_SHORTCUTS.some((s) => s.combo === 'Alt + J')).toBe(true);
      expect(GLOBAL_NAVIGATION_SHORTCUTS.some((s) => s.combo === 'Alt + P')).toBe(true);
    });

    it('suppresses shortcuts when focus is inside INPUT, TEXTAREA, SELECT, or contentEditable', () => {
      const handlers: GlobalShortcutHandlers = {
        onNavigateJobs: vi.fn(),
        onNavigateRemote: vi.fn(),
        onNavigateProfile: vi.fn(),
        onNavigateCareer: vi.fn(),
        onNavigateEmployers: vi.fn(),
        onNavigateBrandStudio: vi.fn(),
        onNavigateAdmin: vi.fn(),
        onToggleHelpModal: vi.fn(),
      };

      expect(isEditableEventTarget({ tagName: 'INPUT' } as any)).toBe(true);
      expect(isEditableEventTarget({ tagName: 'TEXTAREA' } as any)).toBe(true);
      expect(isEditableEventTarget({ tagName: 'SELECT' } as any)).toBe(true);
      expect(isEditableEventTarget({ tagName: 'DIV', isContentEditable: true } as any)).toBe(true);
      expect(isEditableEventTarget({ tagName: 'BODY', isContentEditable: false } as any)).toBe(false);

      expect(
        resolveShortcutAction(
          {
            key: 'j',
            altKey: true,
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            target: { tagName: 'INPUT' } as any,
          },
          handlers
        )
      ).toBeNull();
      expect(handlers.onNavigateJobs).not.toHaveBeenCalled();
    });

    it('renders keyboard shortcuts modal trigger button in Header', () => {
      const headerHtml = renderToStaticMarkup(
        <JobProvider>
          <Header
            activeTab="jobs"
            setActiveTab={() => {}}
            onOpenNotifications={() => {}}
            onOpenAuth={() => {}}
            onOpenAdminLogin={() => {}}
            onOpenRemoteModal={() => {}}
            onOpenAdminPortal={() => {}}
            onOpenBrandStudio={() => {}}
            onOpenShortcutsModal={() => {}}
            searchQuery=""
            onSelectSearchQuery={() => {}}
            viewMode="desktop"
            onChangeViewMode={() => {}}
          />
        </JobProvider>
      );
      expect(headerHtml).toContain('data-testid="header-shortcuts-btn"');
    });
  });
});
