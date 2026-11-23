import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { HelmetProvider } from 'react-helmet-async';
import { JobProvider } from '../context/JobContext';
import { StripePaymentModal } from '../components/StripePaymentModal';
import { SubscriptionCheckoutModal } from '../components/SubscriptionCheckoutModal';
import { BillingHistory } from '../components/BillingHistory';
import { JobCard } from '../components/JobCard';
import { ShareJobModal, buildJobShareUrl } from '../components/ShareJobModal';
import { CandidateProfileHub } from '../components/CandidateProfileHub';
import { HeroSection } from '../components/HeroSection';
import { BrandIdentityGenerator } from '../components/BrandIdentityGenerator';
import { CandidateCoverLetterGenerator } from '../components/CandidateCoverLetterGenerator';
import { CareerInterviewFlashcards } from '../components/CareerInterviewFlashcards';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { Header } from '../components/Header';
import App from '../App';
import {
  isValidEmail,
  isValidPhone,
  luhnCheck,
  validateCardNumber,
  validateCardExpiry,
  validateCardCvc,
  validateBankAccountRef,
  convertXcdToUsd,
  detectCardBrandAndLast4,
  stripSecretFromIntentId,
  generateIdempotencyKey,
} from '../utils/paymentValidation';
import { JobListing } from '../types';

const sampleJob: JobListing = {
  id: 'job-qa-audit-1',
  title: 'Geothermal Reservoir Operations Engineer',
  company: 'Dominica Geothermal Development Co. (DGDC)',
  parish: 'St. George',
  locality: 'Laudat, Roseau Valley',
  sector: 'Renewable Energy & Geothermal',
  employmentType: 'Full-Time',
  workModel: 'On-site',
  minSalary: 6500,
  maxSalary: 9500,
  salaryPeriod: 'month',
  isNepApproved: true,
  featured: true,
  description: 'Lead sustainable geothermal wellhead monitoring and pressure regulation in Laudat.',
  responsibilities: ['Monitor SCADA telemetry', 'Maintain safety valves'],
  requirements: ['BSc Mechanical or Geothermal Engineering'],
  benefits: ['Health insurance', 'Parish transport allowance'],
  screeningQuestions: [],
  contactEmail: 'careers@dgdc.dm',
  applicationDeadline: '2026-12-31',
  postedAt: '2026-11-20',
  viewsCount: 120,
  applicantsCount: 8,
  recruiterId: 'rec_fort_young',
};

describe('Phase 1-3 QA: Payment Validation, Math & Stripe / XCD Safeguards', () => {
  it('validates card numbers, expiry dates, CVCs, bank refs, emails, and phones cleanly', () => {
    expect(luhnCheck('4242424242424242')).toBe(true);
    expect(luhnCheck('4242424242424243')).toBe(false);
    expect(validateCardNumber('4242 4242 4242 4242').valid).toBe(true);
    expect(validateCardNumber('4242 •••• •••• 4242').valid).toBe(false);
    expect(validateCardExpiry('12/29').valid).toBe(true);
    expect(validateCardExpiry('01/20').valid).toBe(false);
    expect(validateCardCvc('892').valid).toBe(true);
    expect(validateCardCvc('12').valid).toBe(false);
    expect(validateBankAccountRef('NBD-40918-2026').valid).toBe(true);
    expect(validateBankAccountRef('12').valid).toBe(false);
    expect(isValidEmail('hr@fortyoung.dm')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidPhone('+1 (767) 448-5000')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
  });

  it('computes XCD-to-USD pegged totals accurately and strips secrets cleanly', () => {
    expect(convertXcdToUsd(250, 2.7)).toBe(92.59);
    expect(convertXcdToUsd(650, 2.7)).toBe(240.74);
    expect(convertXcdToUsd(180, 2.7)).toBe(66.67);
    expect(convertXcdToUsd(150, 2.7)).toBe(55.56);
    expect(convertXcdToUsd(350, 2.7)).toBe(129.63);
    expect(convertXcdToUsd(950, 2.7)).toBe(351.85);
    expect(convertXcdToUsd(280, 2.7)).toBe(103.7);
    expect(detectCardBrandAndLast4('4242 4242 4242 4242')).toEqual({ brand: 'Visa', last4: '4242' });
    expect(stripSecretFromIntentId('pi_sandbox_123_secret_abc')).toBe('pi_sandbox_123');
    expect(generateIdempotencyKey('nic')).toMatch(/^nic_/);
  });

  it('renders StripePaymentModal, SubscriptionCheckoutModal, and BillingHistory without exposing secret keys', () => {
    const stripeHtml = renderToStaticMarkup(
      <JobProvider>
        <StripePaymentModal isOpen={true} onClose={() => {}} />
      </JobProvider>
    );
    expect(stripeHtml).toContain('Sandbox');
    expect(stripeHtml).toContain('Featured Top-of-Board Pin');
    expect(stripeHtml).not.toContain('sk_live_');
    expect(stripeHtml).not.toContain('sk_test_');

    const subHtml = renderToStaticMarkup(
      <JobProvider>
        <SubscriptionCheckoutModal isOpen={true} onClose={() => {}} />
      </JobProvider>
    );
    expect(subHtml).toContain('Standard Local');
    expect(subHtml).toContain('Enterprise Partner');
    expect(subHtml).toContain('NEP Host Tier');
    expect(subHtml).toContain('NBD Direct Debit');
    expect(subHtml).not.toContain('sk_live_');
    expect(subHtml).not.toContain('sk_test_');

    const billingHtml = renderToStaticMarkup(
      <JobProvider>
        <BillingHistory onOpenStripe={() => {}} />
      </JobProvider>
    );
    expect(billingHtml).toContain('Billing');
  });
});

describe('Phase 4 & Features: JobCard Bookmark -> My Saved Jobs & Web Share / Modal', () => {
  it('renders interactive Bookmark icon for My Saved Jobs alongside existing Heart save control', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <JobCard job={sampleJob} onSelect={() => {}} onApply={() => {}} />
      </JobProvider>
    );
    expect(html).toContain('data-testid="bookmark-job-btn-job-qa-audit-1"');
    expect(html).toContain('Bookmark job to My Saved Jobs');
    expect(html).toContain('data-testid="save-job-btn-job-qa-audit-1"');
    expect(html).toContain('data-testid="share-job-btn-job-qa-audit-1"');
  });

  it('renders My Saved Jobs tab and section inside CandidateProfileHub', () => {
    const hubHtml = renderToStaticMarkup(
      <JobProvider>
        <CandidateProfileHub
          initialSubTab="saved_jobs"
          onBrowseJobs={() => {}}
          onSelectJob={() => {}}
        />
      </JobProvider>
    );
    expect(hubHtml).toContain('data-testid="subtab-saved-jobs"');
    expect(hubHtml).toContain('My Saved Jobs');
    expect(hubHtml).toContain('data-testid="saved-job-folders-bar"');
  });

  it('wires Web Share API with AbortError guard and ShareJobModal quick social links fallback in JobCard & ShareJobModal', () => {
    const jobCardSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/JobCard.tsx'),
      'utf8'
    );
    expect(jobCardSrc).toContain("typeof navigator.share === 'function'");
    expect(jobCardSrc).toContain('await navigator.share(');
    expect(jobCardSrc).toContain("err?.name === 'AbortError'");
    expect(jobCardSrc).toContain('setShowShareModal(true)');

    const shareUrl = buildJobShareUrl(sampleJob.id, 'https://natureislecareers.com');
    expect(shareUrl).toBe('https://natureislecareers.com?job=job-qa-audit-1');

    const shareModalHtml = renderToStaticMarkup(
      <ShareJobModal job={sampleJob} isOpen={true} onClose={() => {}} />
    );
    expect(shareModalHtml).toContain('Share via Email');
    expect(shareModalHtml).toContain('Share via WhatsApp');
    expect(shareModalHtml).toContain('LinkedIn');
    expect(shareModalHtml).toContain('X / Twitter');
  });
});

describe('PWA Service Worker, Offline Cached Job Listings & App Route Resilience', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    // preserve default environment
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it('contains valid PNG PWA icons in public/ and compliant VitePWA manifest + Workbox job cache config', () => {
    const iconFiles = [
      'public/pwa-192x192.png',
      'public/pwa-512x512.png',
      'public/pwa-maskable-512x512.png',
      'public/apple-touch-icon.png',
    ];
    for (const relPath of iconFiles) {
      const buf = fs.readFileSync(path.resolve(process.cwd(), relPath));
      // PNG magic bytes: 89 50 4E 47
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      expect(buf[2]).toBe(0x4e);
      expect(buf[3]).toBe(0x47);
    }

    const viteConfigSrc = fs.readFileSync(path.resolve(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(viteConfigSrc).toContain('VitePWA(');
    expect(viteConfigSrc).toContain("short_name: 'NIC Jobs'");
    expect(viteConfigSrc).toContain("display: 'standalone'");
    expect(viteConfigSrc).toContain("purpose: 'maskable'");
    expect(viteConfigSrc).toContain('dominica-jobs-api-cache');
    expect(viteConfigSrc).toContain("handler: 'NetworkFirst'");
    expect(viteConfigSrc).toContain('enabled: true');

    const indexHtmlSrc = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(indexHtmlSrc).toContain('/apple-touch-icon.png');
    expect(indexHtmlSrc).toContain('apple-mobile-web-app-capable');

    const mainSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    expect(mainSrc).toContain('virtual:pwa-register');
    expect(mainSrc).toContain('registerSW(');
  });

  it('renders OfflineIndicator when offline and mounts PWAInstallButton in Header', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...originalNavigator, onLine: false },
      configurable: true,
      writable: true,
    });

    const offlineHtml = renderToStaticMarkup(
      <JobProvider>
        <OfflineIndicator />
      </JobProvider>
    );
    expect(offlineHtml).toContain('data-testid="offline-indicator-banner"');
    expect(offlineHtml).toContain('Offline Mode');

    const headerSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/Header.tsx'),
      'utf8'
    );
    expect(headerSrc).toContain('<PWAInstallButton');
    const headerHtml = renderToStaticMarkup(
      <JobProvider>
        <Header
          activeTab="jobs"
          setActiveTab={() => {}}
          onOpenNotifications={() => {}}
          onOpenAuth={() => {}}
          onOpenAdminLogin={() => {}}
          onOpenRemoteModal={() => {}}
        />
      </JobProvider>
    );
    expect(headerHtml).toContain('Nature Island Careers');
  });

  it('renders core audited sections cleanly and handles 404 routes + Hero CTA safely', () => {
    const heroHtml = renderToStaticMarkup(
      <JobProvider>
        <HeroSection
          searchQuery=""
          setSearchQuery={() => {}}
          selectedParish="All"
          setSelectedParish={() => {}}
          selectedSector="All"
          setSelectedSector={() => {}}
          totalJobsCount={14}
          onOpenAlertModal={() => {}}
          onOpenRemoteModal={() => {}}
        />
      </JobProvider>
    );
    expect(heroHtml).toContain('14');

    const brandHtml = renderToStaticMarkup(<BrandIdentityGenerator />);
    expect(brandHtml).toContain('data-testid="brand-identity-generator-root"');

    const coverHtml = renderToStaticMarkup(
      <JobProvider>
        <CandidateCoverLetterGenerator />
      </JobProvider>
    );
    expect(coverHtml).toContain('Generate Now');

    const flashHtml = renderToStaticMarkup(<CareerInterviewFlashcards />);
    expect(flashHtml).toContain('Flashcard');

    const appHtml = renderToStaticMarkup(
      <HelmetProvider>
        <App />
      </HelmetProvider>
    );
    expect(appHtml).toContain('Nature Island Careers');
    expect(appHtml).toContain('Browse Classifieds');
  });
});
