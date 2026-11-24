import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { JobProvider } from '../context/JobContext';
import { CandidateProfileHub } from '../components/CandidateProfileHub';
import {
  InvoiceHistoryTab,
  INVOICES_PER_PAGE,
  isPendingInvoiceStatus,
  formatTimeRemainingShort,
} from '../components/InvoiceHistoryTab';
import { StripePaymentModal } from '../components/StripePaymentModal';
import { INITIAL_INVOICES } from '../data/mockData';
import {
  buildInvoicePdfFilename,
  generateInvoicePdfBlob,
  downloadInvoicesAsZip,
} from '../utils/generateInvoicePdf';
import { EmployerInvoice } from '../types';

describe('Invoice History Tab inside CandidateProfileHub', () => {
  it('renders the Invoice History tab, financial summary row, search & Sort By Date controls, and 10-per-page pagination', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <CandidateProfileHub
          initialSubTab="invoice_history"
          onBrowseJobs={() => {}}
          onSelectJob={() => {}}
        />
      </JobProvider>
    );

    // Tab navigation button
    expect(html).toContain('data-testid="subtab-invoice-history"');
    expect(html).toContain('Invoice History');

    // Summary row above table
    expect(html).toContain('data-testid="invoice-financial-summary"');
    expect(html).toContain('Total Paid');
    expect(html).toContain('Total Pending');
    expect(html).toContain('Total Lifetime Spend');

    // Bulk export header action
    expect(html).toContain('data-testid="download-selected-zip-btn"');
    expect(html).toContain('Download Selected as ZIP');

    // Search & Sort By Date controls
    expect(html).toContain('data-testid="invoice-search-input"');
    expect(html).toContain('data-testid="invoice-sort-date-select"');
    expect(html).toContain('Newest First');
    expect(html).toContain('Oldest First');

    // Pagination (10 invoices per page across 13+ seeded invoices)
    expect(INVOICES_PER_PAGE).toBe(10);
    expect(INITIAL_INVOICES.length).toBeGreaterThan(10);
    expect(html).toContain('data-testid="invoice-pagination"');
    expect(html).toContain(`Showing 1–10 of ${INITIAL_INVOICES.length} invoices`);
    expect(html).toContain('data-testid="invoice-page-1"');
    expect(html).toContain('data-testid="invoice-page-2"');
  });

  it('applies conditional CSS styling (green for paid, orange for pending), Download PDF links, Retry Payment buttons, row checkboxes, and <24h expiry countdown badges', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <InvoiceHistoryTab onRetryPayment={() => {}} />
      </JobProvider>
    );

    // Green for Paid and Orange for Pending status badges
    expect(html).toContain('text-green-700');
    expect(html).toContain('text-orange-600');

    // Download PDF link/button & Retry Payment button for pending invoices
    expect(html).toContain('Download PDF');
    expect(html).toContain('Retry Payment');

    // Row checkboxes
    expect(html).toContain('type="checkbox"');

    // Expiry Date column and <24h visual countdown badge
    expect(html).toContain('Expiry Date');
    expect(html).toContain('data-testid="invoice-expiry-countdown-badge"');
    expect(html).toContain('Expires in');
  });

  it('correctly evaluates pending status helpers and short countdown labels', () => {
    expect(isPendingInvoiceStatus('Pending')).toBe(true);
    expect(isPendingInvoiceStatus('Renewal Pending')).toBe(true);
    expect(isPendingInvoiceStatus('Processing')).toBe(true);
    expect(isPendingInvoiceStatus('Paid')).toBe(false);

    expect(formatTimeRemainingShort(14 * 3600 * 1000 + 5 * 60 * 1000)).toBe('14h 05m');
    expect(formatTimeRemainingShort(45 * 60 * 1000)).toBe('45m');
    expect(formatTimeRemainingShort(-1000)).toBe('Expired');
  });
});

describe('StripePaymentModal Pending Invoice Retry & Bulk ZIP Export', () => {
  it('pre-populates StripePaymentModal with pending invoice details when retrying payment', () => {
    const pendingInv: EmployerInvoice = {
      id: 'inv-pending-test-1',
      recruiterId: 'rec_fort_young',
      companyName: 'Secret Bay Residences',
      recipientEmail: 'accounts@secretbay.dm',
      invoiceNumber: 'INV-DOM-2026-991',
      date: '2026-11-23',
      plan: 'Enterprise Employer Partner',
      description: 'Annual eco-resort recruitment membership renewal in Portsmouth.',
      amountXCD: 950,
      amountUSD: 351.85,
      billingInterval: 'monthly',
      status: 'Pending',
      paymentMethod: 'Stripe Card Checkout',
      expiryDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    };

    const modalHtml = renderToStaticMarkup(
      <JobProvider>
        <StripePaymentModal
          isOpen={true}
          retryInvoice={pendingInv}
          onClose={() => {}}
        />
      </JobProvider>
    );

    expect(modalHtml).toContain('data-testid="stripe-retry-invoice-banner"');
    expect(modalHtml).toContain('INV-DOM-2026-991');
    expect(modalHtml).toContain('Secret Bay Residences');
    expect(modalHtml).toContain('EC$ 950');
    expect(modalHtml).not.toContain('1. Choose Employer Package');
  });

  it('builds valid PDF filenames and bundles selected invoices into a downloadable ZIP archive', async () => {
    const sampleInvoices = INITIAL_INVOICES.slice(0, 2);
    const filename = buildInvoicePdfFilename(sampleInvoices[0]);
    expect(filename).toContain(sampleInvoices[0].invoiceNumber);
    expect(filename.endsWith('.pdf')).toBe(true);

    const { blob } = await generateInvoicePdfBlob(sampleInvoices[0]);
    expect(blob.size).toBeGreaterThan(0);

    const zipName = await downloadInvoicesAsZip(sampleInvoices);
    expect(zipName).toMatch(/^Nature_Island_Careers_Invoices_.*\.zip$/);

    // Verify JSZip can generate a real archive with the same invoice blobs
    const zip = new JSZip();
    for (const inv of sampleInvoices) {
      const entry = await generateInvoicePdfBlob(inv);
      zip.file(entry.fileName, entry.blob);
    }
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
    const reloaded = await JSZip.loadAsync(zipBuffer);
    expect(Object.keys(reloaded.files).length).toBe(2);
  });
});

describe('Mock Email Receipt Toast & Automated 48h/New-Invoice Background Service', () => {
  it('wires triggerMockEmailReceipt, automated new-invoice alerts, and 48-hour deadline monitor in JobContext & EmailAlertToast', () => {
    const contextSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/context/JobContext.tsx'),
      'utf8'
    );
    expect(contextSrc).toContain('triggerMockEmailReceipt');
    expect(contextSrc).toContain('notifyEmployerInvoiceGenerated');
    expect(contextSrc).toContain('notifyEmployerPendingDeadline48h');
    expect(contextSrc).toContain('runPendingInvoiceDeadlineCheck');
    expect(contextSrc).toContain('/api/employer/invoice-alerts');
    expect(contextSrc).toContain('FORTY_EIGHT_HOURS_MS');

    const toastSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/EmailAlertToast.tsx'),
      'utf8'
    );
    expect(toastSrc).toContain('onViewInvoiceInProfile');
    expect(toastSrc).toContain('data-testid="toast-view-invoice-btn"');
    expect(toastSrc).toContain('View Invoice in Profile');
    expect(toastSrc).toContain('Stripe Payment Receipt');
    expect(toastSrc).toContain('48h Payment Deadline Alert');

    const serverSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'server.ts'),
      'utf8'
    );
    expect(serverSrc).toContain('/api/employer/invoice-alerts');
    expect(serverSrc).toContain('payment_deadline_48h');
    expect(serverSrc).toContain('invoice_generated');
  });
});
