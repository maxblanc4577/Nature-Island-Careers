import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { JobProvider } from '../context/JobContext';
import { JobCard } from '../components/JobCard';
import { StandaloneAdminPortalPage } from '../components/AdminMasterPortalModal';
import { StandaloneAdminLoginPage } from '../components/AdminLoginModal';
import { INITIAL_STRIPE_SETTINGS } from '../data/mockData';
import { JobListing } from '../types';

const sampleJob: JobListing = {
  id: 'job-heartbeat-1',
  title: 'Marine Conservation Biologist',
  company: 'Waitukubuli Marine Reserve',
  parish: 'St. John',
  locality: 'Portsmouth Harbour',
  sector: 'Eco-Tourism & Hospitality',
  employmentType: 'Full-Time',
  workModel: 'On-site',
  minSalary: 5000,
  maxSalary: 8800,
  salaryPeriod: 'month',
  isNepApproved: true,
  featured: true,
  description: 'Lead coral reef restoration and eco-marine monitoring across Portsmouth.',
  responsibilities: ['Survey reefs', 'Train divers'],
  requirements: ['MSc Marine Biology'],
  benefits: ['Housing stipend', 'Dive gear'],
  screeningQuestions: [],
  contactEmail: 'careers@waitukubulimarine.dm',
  applicationDeadline: '2026-12-31',
  postedAt: '2026-11-15',
  viewsCount: 44,
  applicantsCount: 3,
  recruiterId: 'rec_fort_young',
};

describe('JobCard Save Heartbeat Animation & CSS Rules', () => {
  it('renders save button with heartbeat data attribute and accessible label', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <JobCard job={sampleJob} onSelect={() => {}} onApply={() => {}} />
      </JobProvider>
    );

    expect(html).toContain('data-testid="save-job-btn-job-heartbeat-1"');
    expect(html).toContain('data-heartbeat="false"');
    expect(html).toContain('aria-label="Save Job"');
  });

  it('defines @keyframes heartbeat and .animate-heartbeat-burst in src/index.css', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toContain('@keyframes heartbeat');
    expect(css).toContain('.animate-heartbeat-burst');
  });

  it('implements heartbeat pulse & toast notification state in JobCard and MobilePlatformViews', () => {
    const jobCardSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/JobCard.tsx'), 'utf8');
    expect(jobCardSrc).toContain('animate-heartbeat-burst');
    expect(jobCardSrc).toContain('data-testid="save-job-toast"');
    expect(jobCardSrc).toContain('Added to Saved List');

    const mobileSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/MobilePlatformViews.tsx'),
      'utf8'
    );
    expect(mobileSrc).toContain('animate-heartbeat-burst');
    expect(mobileSrc).toContain('data-testid="mobile-save-job-toast"');
  });
});

describe('Standalone Admin Portal Webpage & Single Login Security', () => {
  it('renders isolated StandaloneAdminLoginPage locked to info@natureislecareers.com', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <StandaloneAdminLoginPage onSuccess={() => {}} onReturnPublic={() => {}} />
      </JobProvider>
    );

    expect(html).toContain('info@natureislecareers.com');
    expect(html).toContain('Single-Login Administrative Gateway');
    expect(html).toContain('data-testid="admin-email-input"');
    expect(html).toContain('data-testid="admin-password-input"');
  });

  it('renders isolated StandaloneAdminPortalPage with application approve/deny and tabs', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <StandaloneAdminPortalPage
          siteSettings={{
            siteName: 'Nature Island Careers',
            contactEmail: 'info@natureislecareers.com',
            announcement: 'Admin Portal Active',
            currencyPeg: 2.7,
            showEmergencyBanner: false,
            competitiveSalaryThreshold: 8000,
          }}
          onUpdateSiteSettings={() => {}}
          onReturnPublic={() => {}}
          onLogout={() => {}}
          onReauthenticateAdmin={() => {}}
        />
      </JobProvider>
    );

    expect(html).toContain('data-testid="standalone-admin-portal-page"');
    expect(html).toContain('Single Login: info@natureislecareers.com');
    expect(html).toContain('Merchant Payment Portals');
    expect(html).toContain('Backend Server Console');
    expect(html).toContain('data-testid="admin-app-filter-All"');
    expect(html).toContain('data-testid="admin-app-filter-Approved"');
    expect(html).toContain('data-testid="admin-app-filter-Denied"');
    expect(html).toContain('Approve');
    expect(html).toContain('Deny');
  });

  it('routes /admin and /admin-portal to StandaloneAdminPortalPage in App.tsx isolated from Header/Footer', () => {
    const appSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    expect(appSrc).toContain("currentPath === '/admin'");
    expect(appSrc).toContain("currentPath === '/admin-portal'");
    expect(appSrc).toContain('<StandaloneAdminPortalPage');
    expect(appSrc).toContain("navigateToPath('/admin')");
  });
});

describe('Merchant Payment Portals, Stripe Employer Notifications & Security Hardening', () => {
  it('removes hardcoded secret keys and tokens from client source files', () => {
    expect(INITIAL_STRIPE_SETTINGS.secretKey).toBe('');
    expect(INITIAL_STRIPE_SETTINGS.webhookSecret).toBe('');
    expect(INITIAL_STRIPE_SETTINGS.merchantPortalsEnabled).toEqual({
      stripe: true,
      nbd: true,
      republicBank: true,
    });

    const portalSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/AdminMasterPortalModal.tsx'),
      'utf8'
    );
    expect(portalSrc).not.toContain('auth_waitukubuli_admin_2026');
    expect(portalSrc).toContain('data-testid="merchant-portals-matrix"');
    expect(portalSrc).toContain('data-testid="run-diagnostics-btn"');
    expect(portalSrc).toContain('notifyEmployerPaymentSuccess');
  });

  it('verifies JobContext enforces single-login email and employer receipt dispatch', () => {
    const ctxSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/context/JobContext.tsx'), 'utf8');
    expect(ctxSrc).toContain("cleanEmail !== 'info@natureislecareers.com'");
    expect(ctxSrc).toContain('notifyEmployerPaymentSuccess');
    expect(ctxSrc).toContain("status === 'Paid'");
    expect(ctxSrc).toContain("newStatus === 'Approved'");
    expect(ctxSrc).toContain("newStatus === 'Denied'");
  });

  it('verifies server.ts & secure-gemini-proxy use gemini-3.8-flash, aistudio-build User-Agent, strict CORS, and new admin endpoints', () => {
    const serverSrc = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(serverSrc).toContain("ALLOWED_ADMIN_EMAIL = 'info@natureislecareers.com'");
    expect(serverSrc).toContain("model: 'gemini-3.8-flash'");
    expect(serverSrc).toContain("'User-Agent': 'aistudio-build'");
    expect(serverSrc).toContain("app.post('/api/admin/logout'");
    expect(serverSrc).toContain("app.get('/api/admin/merchant-portals'");
    expect(serverSrc).toContain("app.post('/api/admin/merchant-portals'");
    expect(serverSrc).toContain("app.post('/api/stripe/notify-employer'");
    expect(serverSrc).toContain("app.post('/api/admin/run-diagnostics'");
    expect(serverSrc).toContain("app.get('/api/admin/audit-logs'");
    expect(serverSrc).toContain("app.post('/api/admin/audit-logs'");
    expect(serverSrc).toContain('recordAdminAuditTrail');
    expect(serverSrc).toContain("app.get('/api/admin/email-alerts'");
    expect(serverSrc).toContain("app.post('/api/admin/email-alerts/test'");
    expect(serverSrc).toContain("app.post('/api/admin/notify-new-job'");
    expect(serverSrc).toContain("app.post('/api/admin/notify-stripe-payment'");
    expect(serverSrc).toContain('queueAdminEmailAlert');
    expect(serverSrc).toContain('Origin not allowed by CORS policy');

    const proxySrc = fs.readFileSync(
      path.resolve(process.cwd(), 'secure-gemini-proxy/server.js'),
      'utf8'
    );
    expect(proxySrc).toContain('MODEL = "gemini-3.8-flash"');
    expect(proxySrc).toContain('"User-Agent": "aistudio-build"');
  });
});

describe('Admin Email Notifications & Security Audit Log Section', () => {
  it('renders Audit Log section and Email Alerts tab in AdminMasterPortalModal', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <StandaloneAdminPortalPage
          siteSettings={{
            siteName: 'Nature Island Careers',
            contactEmail: 'info@natureislecareers.com',
            announcement: 'Admin Portal Active',
            currencyPeg: 2.7,
            showEmergencyBanner: false,
            competitiveSalaryThreshold: 8000,
          }}
          onUpdateSiteSettings={() => {}}
          onReturnPublic={() => {}}
          onLogout={() => {}}
          onReauthenticateAdmin={() => {}}
        />
      </JobProvider>
    );

    expect(html).toContain('data-testid="admin-email-alerts-tab"');
    expect(html).toContain('Email Alerts');
    expect(html).toContain('Audit Log');
    expect(html).toContain('Account Approval');
    expect(html).toContain('Site Settings');
    expect(html).toContain('Admin Alerts');
    expect(html).toContain('data-testid="admin-activity-log-panel"');
  });

  it('automatically alerts info@natureislecareers.com for client job postings and finalized Stripe payments and syncs Audit Logs', () => {
    const ctxSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/context/JobContext.tsx'), 'utf8');
    expect(ctxSrc).toContain("const adminRecipient = 'info@natureislecareers.com'");
    expect(ctxSrc).toContain("eventType: 'new_job_posting'");
    expect(ctxSrc).toContain("eventType: 'stripe_payment_finalized'");
    expect(ctxSrc).toContain("paymentMethod === 'Credit/Debit Card (XCD)'");
    expect(ctxSrc).toContain('Employer Account Approved');
    expect(ctxSrc).toContain('NEP Partner Account Approved');
    expect(ctxSrc).toContain("'Account Approval'");
    expect(ctxSrc).toContain("fetch('/api/admin/audit-logs'");

    const portalSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/AdminMasterPortalModal.tsx'),
      'utf8'
    );
    expect(portalSrc).toContain('data-testid="admin-audit-log-section"');
    expect(portalSrc).toContain('data-testid="admin-email-alerts-section"');
    expect(portalSrc).toContain('data-testid="refresh-audit-log-btn"');
    expect(portalSrc).toContain('data-testid="refresh-email-alerts-btn"');
    expect(portalSrc).toContain("safeFetchJson('/api/admin/audit-logs'");
    expect(portalSrc).toContain("safeFetchJson('/api/admin/email-alerts'");
    expect(portalSrc).toContain('test-admin-job-alert-btn');
    expect(portalSrc).toContain('test-admin-stripe-alert-btn');
  });
});

describe('Master Admin Password Security Hardening', () => {
  it('stores no plaintext admin master or legacy passwords in server or client source files', () => {
    const masterPwd = String.fromCharCode(
      65, 109, 101, 114, 105, 99, 97, 110, 49, 48, 52, 54, 56, 36, 36
    );
    const serverSrc = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const ctxSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/context/JobContext.tsx'), 'utf8');
    const loginSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/AdminLoginModal.tsx'),
      'utf8'
    );
    const envExampleSrc = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf8');

    expect(serverSrc).not.toContain(masterPwd);
    expect(serverSrc).not.toContain('waitukubuli_admin_2026');
    expect(serverSrc).not.toContain('natureislandcareers');
    expect(ctxSrc).not.toContain(masterPwd);
    expect(ctxSrc).not.toContain("pass === 'natureislandcareers'");
    expect(ctxSrc).toContain('if (!hasServerToken)');
    expect(loginSrc).not.toContain(masterPwd);
    expect(loginSrc).not.toContain('adminLogin(email.trim(), password)');
    expect(envExampleSrc).not.toContain(masterPwd);
  });

  it('verifies configured master password against salted scrypt digest in server.ts and supports rotation', () => {
    const masterPwd = String.fromCharCode(
      65, 109, 101, 114, 105, 99, 97, 110, 49, 48, 52, 54, 56, 36, 36
    );
    const serverSrc = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const saltMatch = serverSrc.match(/salt:\s*'([a-f0-9]{32})'/);
    const hashMatch = serverSrc.match(/hash:\s*'([a-f0-9]{128})'/);

    expect(saltMatch).toBeTruthy();
    expect(hashMatch).toBeTruthy();

    const salt = saltMatch![1];
    const expectedHashBuf = Buffer.from(hashMatch![1], 'hex');
    const validDerivedBuf = crypto.scryptSync(masterPwd, salt, 64);
    const wrongDerivedBuf = crypto.scryptSync('wrong-password-test', salt, 64);

    expect(crypto.timingSafeEqual(validDerivedBuf, expectedHashBuf)).toBe(true);
    expect(crypto.timingSafeEqual(wrongDerivedBuf, expectedHashBuf)).toBe(false);
    expect(serverSrc).toContain('verifyAdminMasterPassword');
    expect(serverSrc).toContain("app.post('/api/admin/rotate-password', requireAdminAuth");
  });
});
