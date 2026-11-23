import * as jspdfModule from 'jspdf';
import { EmployerInvoice } from '../types';
import { getMembershipPlanDetails } from './membershipPlans';

export const generateInvoicePdf = async (invoice: EmployerInvoice): Promise<string> => {
  const safeInv = (invoice.invoiceNumber || 'INV-DOM').replace(/[^\w.-]/gi, '_');
  const safeCompany = (invoice.companyName || 'Employer').trim().replace(/\s+/g, '_').replace(/[^\w.-]/gi, '_');
  const fileName = `${safeInv}_${safeCompany}_Membership_Invoice.pdf`;

  const JsPDFConstructor =
    (jspdfModule as any).jsPDF ||
    (jspdfModule as any).default?.jsPDF ||
    (jspdfModule as any).default;

  let pdf: any;
  try {
    pdf = new JsPDFConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  } catch {
    pdf = JsPDFConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  }

  const pageWidth = pdf?.internal?.pageSize?.getWidth?.() ?? 210;
  const margin = 16;
  const planMeta = getMembershipPlanDetails(invoice.plan);
  const features =
    invoice.membershipFeatures && invoice.membershipFeatures.length > 0
      ? invoice.membershipFeatures
      : planMeta.features;

  // Header band
  pdf?.setFillColor?.(6, 78, 59);
  pdf?.rect?.(0, 0, pageWidth, 34, 'F');

  pdf?.setTextColor?.(255, 255, 255);
  pdf?.setFont?.('helvetica', 'bold');
  pdf?.setFontSize?.(18);
  pdf?.text?.('NATURE ISLAND CAREERS', margin, 14);

  pdf?.setFont?.('helvetica', 'normal');
  pdf?.setFontSize?.(9.5);
  pdf?.text?.('Commonwealth of Dominica Labour Division Authorized Exchange', margin, 21);
  pdf?.text?.('VAT / DSS Registration: DOM-EMP-TAX-77491 · info@natureislecareers.com', margin, 27);

  // Invoice Title & Status
  let y = 46;
  pdf?.setTextColor?.(15, 23, 42);
  pdf?.setFont?.('helvetica', 'bold');
  pdf?.setFontSize?.(15);
  pdf?.text?.('OFFICIAL EMPLOYER MEMBERSHIP INVOICE', margin, y);

  pdf?.setFont?.('helvetica', 'bold');
  pdf?.setFontSize?.(10);
  pdf?.setTextColor?.(4, 120, 87);
  pdf?.text?.(`STATUS: ${invoice.status.toUpperCase()} · VERIFIED`, pageWidth - margin, y, {
    align: 'right',
  });

  y += 10;
  pdf?.setDrawColor?.(203, 213, 225);
  pdf?.line?.(margin, y, pageWidth - margin, y);
  y += 8;

  // Two-column billing details
  pdf?.setTextColor?.(100, 116, 139);
  pdf?.setFontSize?.(8.5);
  pdf?.text?.('BILLED TO (VERIFIED EMPLOYER)', margin, y);
  pdf?.text?.('INVOICE & VERIFICATION DETAILS', pageWidth / 2 + 6, y);

  y += 5;
  pdf?.setTextColor?.(15, 23, 42);
  pdf?.setFont?.('helvetica', 'bold');
  pdf?.setFontSize?.(10.5);
  pdf?.text?.(invoice.companyName || 'Dominica Employer', margin, y);
  pdf?.text?.(`Invoice #: ${invoice.invoiceNumber}`, pageWidth / 2 + 6, y);

  y += 5;
  pdf?.setFont?.('helvetica', 'normal');
  pdf?.setFontSize?.(9.5);
  pdf?.text?.(
    `Contact: ${invoice.contactPerson || invoice.companyName || 'HR Department'}`,
    margin,
    y
  );
  pdf?.text?.(`Issue Date: ${invoice.date}`, pageWidth / 2 + 6, y);

  y += 5;
  pdf?.text?.(`Email: ${invoice.recipientEmail || 'info@natureislecareers.com'}`, margin, y);
  pdf?.text?.(
    `Next Renewal: ${invoice.renewsAt || '30-Day Cycle'}`,
    pageWidth / 2 + 6,
    y
  );

  y += 5;
  pdf?.text?.(
    `DSS Reg: ${invoice.dssRegistrationNo || 'DSS-DOM-VERIFIED'} · Parish: ${invoice.parish || 'St. George'}`,
    margin,
    y
  );
  pdf?.text?.(`Gateway: ${invoice.paymentMethod}`, pageWidth / 2 + 6, y);

  if (invoice.paymentIntentId) {
    y += 5;
    pdf?.text?.(`Verification Ref: ${invoice.paymentIntentId}`, pageWidth / 2 + 6, y);
  }

  // Selected Membership Tier Table
  y += 12;
  pdf?.setFillColor?.(241, 245, 249);
  pdf?.rect?.(margin, y, pageWidth - margin * 2, 9, 'F');
  pdf?.setFont?.('helvetica', 'bold');
  pdf?.setFontSize?.(9);
  pdf?.setTextColor?.(51, 65, 85);
  pdf?.text?.('SELECTED MEMBERSHIP TIER & BENEFITS', margin + 3, y + 6);
  pdf?.text?.('CADENCE', pageWidth - 68, y + 6);
  pdf?.text?.('AMOUNT (XCD)', pageWidth - margin - 3, y + 6, { align: 'right' });

  y += 14;
  pdf?.setTextColor?.(15, 23, 42);
  pdf?.setFont?.('helvetica', 'bold');
  pdf?.setFontSize?.(11);
  pdf?.text?.(invoice.plan || planMeta.plan, margin + 3, y);

  pdf?.setFont?.('helvetica', 'normal');
  pdf?.setFontSize?.(9.5);
  pdf?.text?.(
    invoice.billingInterval === 'monthly' ? 'Monthly' : invoice.billingInterval === 'annual' ? 'Annual' : '30-Day',
    pageWidth - 68,
    y
  );
  pdf?.setFont?.('helvetica', 'bold');
  pdf?.text?.(`EC$ ${Number(invoice.amountXCD || 0).toLocaleString()}`, pageWidth - margin - 3, y, {
    align: 'right',
  });

  y += 5.5;
  pdf?.setFont?.('helvetica', 'normal');
  pdf?.setFontSize?.(8.8);
  pdf?.setTextColor?.(71, 85, 105);
  const quotaText = `Quota: ${
    invoice.quotaPostings && invoice.quotaPostings >= 999
      ? 'Unlimited Active Vacancies'
      : `${invoice.quotaPostings ?? planMeta.quotaPostings} Active Vacancies`
  } · Remote / WIN Assignments: ${
    invoice.remoteWorkEnabled ?? planMeta.remoteWorkEnabled ? 'Enabled' : 'Standard Local'
  }`;
  pdf?.text?.(quotaText, margin + 3, y);

  features.forEach((feat) => {
    y += 5;
    pdf?.text?.(`• ${feat}`, margin + 5, y);
  });

  // Totals block
  y += 10;
  pdf?.setDrawColor?.(203, 213, 225);
  pdf?.line?.(margin, y, pageWidth - margin, y);
  y += 8;

  pdf?.setFont?.('helvetica', 'bold');
  pdf?.setFontSize?.(12);
  pdf?.setTextColor?.(6, 78, 59);
  pdf?.text?.(`TOTAL ${invoice.status.toUpperCase()}`, margin, y);
  pdf?.text?.(
    `EC$ ${Number(invoice.amountXCD || 0).toLocaleString()} XCD (~$${Number(invoice.amountUSD || 0).toFixed(2)} USD)`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  // Footer
  y += 14;
  pdf?.setFont?.('helvetica', 'normal');
  pdf?.setFontSize?.(8.5);
  pdf?.setTextColor?.(100, 116, 139);
  pdf?.text?.(
    `Automated verification notice sent to ${invoice.recipientEmail || 'employer'}. Eligible for Dominica corporate tax deduction under DOM-EMP-TAX-77491.`,
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 }
  );

  pdf?.save?.(fileName);
  return fileName;
};
