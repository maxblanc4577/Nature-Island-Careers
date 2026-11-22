import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { convertXcdToUsd } from '../utils/paymentValidation';
import { EmployerInvoice } from '../types';
import {
  CreditCard,
  FileText,
  CheckCircle2,
  Download,
  ShieldCheck,
  RefreshCw,
  Receipt,
  X,
} from 'lucide-react';

interface BillingHistoryProps {
  onOpenStripe: () => void;
}

export const BillingHistory: React.FC<BillingHistoryProps> = ({ onOpenStripe }) => {
  const {
    currentRecruiter,
    invoices,
    stripeSettings,
    toggleRecruiterAutoRenew,
  } = useJobContext();

  const [selectedInvoice, setSelectedInvoice] = useState<EmployerInvoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | EmployerInvoice['status']>('all');

  const receiptModalRef = useModalKeyboard({
    isOpen: Boolean(selectedInvoice),
    onClose: () => setSelectedInvoice(null),
  });

  const employerInvoices = invoices.filter(
    (inv) =>
      (currentRecruiter?.id && inv.recruiterId === currentRecruiter.id) ||
      (currentRecruiter?.companyName &&
        inv.companyName.toLowerCase() === currentRecruiter.companyName.toLowerCase())
  );

  const displayedInvoices = employerInvoices.filter((inv) =>
    filterStatus === 'all' ? true : inv.status === filterStatus
  );

  const currencyPeg = stripeSettings?.currencyPeg || 2.7;
  const totalSpentXCD = employerInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amountXCD, 0);

  const totalSpentUSD = convertXcdToUsd(totalSpentXCD, currencyPeg);
  const isAutoRenewActive = stripeSettings.autoRenewEnabled;

  // Compute next billing date dynamically (+30 days from most recent monthly invoice or today)
  const latestMonthlyInvoice = employerInvoices.find(
    (inv) => inv.billingInterval === 'monthly' && inv.status === 'Paid'
  );
  const baseDate = latestMonthlyInvoice ? new Date(latestMonthlyInvoice.date) : new Date();
  const nextBillingDate = new Date(
    Number.isNaN(baseDate.getTime()) ? Date.now() + 30 * 86400000 : baseDate.getTime() + 30 * 86400000
  )
    .toISOString()
    .split('T')[0];

  const getStatusBadgeClass = (status: EmployerInvoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'Processing':
      case 'Renewal Pending':
        return 'bg-amber-100 text-amber-800';
      case 'Refunded':
        return 'bg-sky-100 text-sky-800';
      case 'Failed':
      case 'Canceled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white p-6 rounded-2xl shadow-lg border border-emerald-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#635BFF] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <CreditCard className="w-3 h-3" /> Stripe Verified Billing
              </span>
              <span className="bg-emerald-800/80 text-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                EC$ (XCD) & USD Supported
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display">
              Employer Billing & Monthly Recurring Subscriptions
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Automated monthly recurring Stripe payments for job postings on Nature Island Careers. Maintain continuous vacancy visibility across all 10 parishes of Dominica.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onOpenStripe}
              className="bg-[#635BFF] hover:bg-[#5249e6] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Subscribe / Upgrade Plan</span>
            </button>
          </div>
        </div>

        {/* Recurring Billing Toggle Bar */}
        <div className="mt-6 pt-5 border-t border-emerald-800/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-emerald-300 font-bold block text-[11px]">Auto-Renew Status</span>
              <span className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isAutoRenewActive ? 'Active (Monthly)' : 'Paused'}
              </span>
            </div>
            <button
              type="button"
              disabled={!currentRecruiter}
              onClick={() => currentRecruiter && toggleRecruiterAutoRenew(currentRecruiter.id, !isAutoRenewActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                isAutoRenewActive
                  ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40'
                  : 'bg-amber-600/40 hover:bg-amber-600/60 text-amber-200 border border-amber-500/40'
              }`}
            >
              {isAutoRenewActive ? 'Turn Off Auto-Renew' : 'Enable Auto-Renew'}
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-emerald-300 font-bold block text-[11px]">Total Invoiced to Date</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-extrabold font-mono text-white">
                EC${totalSpentXCD.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-200 font-mono">
                (~${totalSpentUSD.toFixed(2)} USD)
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-emerald-300 font-bold block text-[11px]">Next Scheduled Billing</span>
              <span className="text-xs font-mono font-bold text-white block mt-0.5">
                {isAutoRenewActive ? `${nextBillingDate} (Stripe Auto)` : 'Manual Renewal'}
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-1 rounded text-[10px]">
              {isAutoRenewActive ? 'Sync Active' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Table Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-700" />
              <span>Official Employer Invoices & Payment History</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              All tax invoices generated via Stripe with Dominica Social Security and VAT receipting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'Paid', 'Processing', 'Failed', 'Refunded'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterStatus === status
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? `All Invoices (${employerInvoices.length})` : status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List Table */}
        {displayedInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No invoices match the selected filter</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Invoices will appear here once you post a job vacancy or subscribe to a monthly recruitment plan.
            </p>
            <button
              type="button"
              onClick={onOpenStripe}
              className="mt-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Post a Classified / Subscribe via Stripe
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Plan / Service</th>
                  <th className="py-3 px-4">Cadence</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{inv.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.plan}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        <RefreshCw className="w-3 h-3 text-emerald-600" />
                        {inv.billingInterval === 'monthly' ? 'Monthly Auto' : '30-Day'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <div className="font-extrabold text-emerald-900">EC${inv.amountXCD.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">(~${inv.amountUSD.toFixed(2)} USD)</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-mono text-xs">{inv.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`${getStatusBadgeClass(inv.status)} text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1`}>
                        {inv.status === 'Paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-emerald-800 hover:text-emerald-950 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            ref={receiptModalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Official Dominica Employer Receipt ${selectedInvoice.invoiceNumber}`}
            tabIndex={-1}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Top */}
            <div className="p-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Official Dominica Employer Receipt</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close receipt modal"
                className="text-emerald-300 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="text-center pb-3 border-b border-slate-200">
                <h3 className="text-base font-black text-slate-900">NATURE ISLAND CAREERS</h3>
                <p className="text-[11px] text-slate-500">Commonwealth of Dominica Labour Division Authorized Exchange</p>
                <p className="text-[11px] text-emerald-800 font-mono mt-1 font-bold">VAT / DSS Reg: DOM-EMP-TAX-77491</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Billed To</span>
                  <span className="font-bold text-slate-900 block">{selectedInvoice.companyName}</span>
                  <span className="text-[11px] text-slate-600">Commonwealth of Dominica</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice No</span>
                  <span className="font-mono font-bold text-slate-900 block">{selectedInvoice.invoiceNumber}</span>
                  <span className="text-[11px] text-slate-600">Date: {selectedInvoice.date}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-slate-100 py-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{selectedInvoice.plan}</span>
                  <span className="font-mono font-bold text-slate-900">EC${selectedInvoice.amountXCD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Billing Cadence: {selectedInvoice.billingInterval === 'monthly' ? 'Monthly Recurring Subscription' : 'One-Time Listing'}</span>
                  <span className="font-mono">USD Approx: ${selectedInvoice.amountUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Payment Gateway: Stripe Verified</span>
                  <span className="font-mono">{selectedInvoice.paymentMethod}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-emerald-950 pt-1">
                <span>Total {selectedInvoice.status}:</span>
                <span className="font-mono text-base">EC${selectedInvoice.amountXCD.toLocaleString()} XCD</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Payment status: {selectedInvoice.status}. Eligible for Dominica corporate tax deduction.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
