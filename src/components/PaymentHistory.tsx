import React, { useEffect, useMemo, useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { EmployerInvoice } from '../types';
import {
  CreditCard,
  Download,
  Search,
  CheckCircle2,
  FileText,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export interface PaymentHistoryRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  planName: string;
  companyName: string;
  recipientEmail?: string;
  amountXCD: number;
  amountUSD: number;
  billingInterval: 'annual' | 'monthly' | 'one_time';
  status: 'Paid' | 'Pending' | 'Processing' | 'Renewal Pending' | 'Failed' | 'Canceled' | 'Refunded';
  paymentMethod: string;
  paymentIntentId?: string;
}

const FORMULA_INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = FORMULA_INJECTION_PREFIXES.some((prefix) => raw.startsWith(prefix))
    ? `'${raw}`
    : raw;
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildPaymentHistoryCsv(records: PaymentHistoryRecord[]): string {
  const headers = [
    'Invoice Number',
    'Date',
    'Plan / Service',
    'Billing Entity',
    'Recipient Email',
    'Cadence',
    'Amount (XCD)',
    'Amount (USD)',
    'Payment Method',
    'Status',
    'Stripe PaymentIntent',
  ];

  const rows = records.map((rec) =>
    [
      rec.invoiceNumber,
      rec.date,
      rec.planName,
      rec.companyName,
      rec.recipientEmail || '',
      rec.billingInterval === 'annual'
        ? 'Annual Plan'
        : rec.billingInterval === 'monthly'
        ? 'Monthly Auto-Renew'
        : 'One-Time',
      rec.amountXCD.toFixed(2),
      rec.amountUSD.toFixed(2),
      rec.paymentMethod,
      rec.status,
      rec.paymentIntentId || '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}

export const PaymentHistory: React.FC = () => {
  const { invoices, currentUser, currentRecruiter } = useJobContext();
  const [serverRecords, setServerRecords] = useState<PaymentHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentHistoryRecord['status']>('all');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const emailParam = currentUser?.email
        ? `?email=${encodeURIComponent(currentUser.email)}`
        : '';
      const res = await fetch(`/api/payments/history${emailParam}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.payments)) {
          setServerRecords(data.payments);
        }
      }
    } catch {
      // Fall back smoothly to JobContext invoices when offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser?.email]);

  const mergedRecords = useMemo<PaymentHistoryRecord[]>(() => {
    const contextRecords: PaymentHistoryRecord[] = invoices
      .filter((inv: EmployerInvoice) => {
        if (!currentUser && !currentRecruiter) return true;
        if (currentRecruiter && inv.recruiterId === currentRecruiter.id) return true;
        if (
          currentUser?.email &&
          inv.recipientEmail?.toLowerCase() === currentUser.email.toLowerCase()
        ) {
          return true;
        }
        return !currentUser?.email || !inv.recipientEmail;
      })
      .map((inv: EmployerInvoice) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        planName: inv.plan,
        companyName: inv.companyName,
        recipientEmail: inv.recipientEmail,
        amountXCD: inv.amountXCD,
        amountUSD: inv.amountUSD,
        billingInterval: inv.billingInterval || 'one_time',
        status: inv.status,
        paymentMethod: inv.paymentMethod,
        paymentIntentId: inv.paymentIntentId,
      }));

    const seenKeys = new Set<string>();
    const combined: PaymentHistoryRecord[] = [];
    for (const rec of [...serverRecords, ...contextRecords]) {
      const dedupeKey = rec.paymentIntentId || rec.invoiceNumber || rec.id;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);
      combined.push(rec);
    }
    return combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [serverRecords, invoices, currentUser, currentRecruiter]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mergedRecords.filter((rec) => {
      if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
      if (!q) return true;
      return (
        rec.invoiceNumber.toLowerCase().includes(q) ||
        rec.planName.toLowerCase().includes(q) ||
        rec.companyName.toLowerCase().includes(q) ||
        rec.paymentMethod.toLowerCase().includes(q) ||
        (rec.paymentIntentId || '').toLowerCase().includes(q)
      );
    });
  }, [mergedRecords, searchQuery, statusFilter]);

  const totalPaidXCD = useMemo(
    () =>
      filteredRecords
        .filter((r) => r.status === 'Paid')
        .reduce((sum, r) => sum + r.amountXCD, 0),
    [filteredRecords]
  );

  const handleExportCsv = () => {
    const csvContent = buildPaymentHistoryCsv(filteredRecords);
    const filename = `nature-island-payment-history-${new Date().toISOString().split('T')[0]}.csv`;

    try {
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportMessage(`Exported ${filteredRecords.length} payment record(s) to ${filename}`);
      window.setTimeout(() => setExportMessage(null), 4000);
    } catch {
      setExportMessage('Unable to generate CSV download in this browser environment.');
    }
  };

  const getBadgeStyle = (status: PaymentHistoryRecord['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Processing':
      case 'Renewal Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Refunded':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Failed':
      case 'Canceled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6" data-testid="payment-history-panel">
      {/* Summary Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Personal Financial Record-Keeping</span>
            </div>
            <h3 className="text-xl font-black font-display">
              Payment & Subscription History
            </h3>
            <p className="text-xs text-emerald-100/80 max-w-xl">
              Review all Stripe transactions, classified receipts, and subscription renewals in EC$ (XCD) and export clean records as CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchHistory}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              type="button"
              data-testid="export-payment-history-csv-btn"
              onClick={handleExportCsv}
              disabled={filteredRecords.length === 0}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredRecords.length})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-xl p-3">
            <span className="text-emerald-300 text-[11px] font-bold block">Total Transactions</span>
            <span className="text-lg font-black font-mono">{filteredRecords.length}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <span className="text-emerald-300 text-[11px] font-bold block">Verified Paid Total</span>
            <span className="text-lg font-black font-mono">EC$ {totalPaidXCD.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <span className="text-emerald-300 text-[11px] font-bold block">Audit Standard</span>
            <span className="text-sm font-bold block mt-0.5">Dominica DSS / RFC-4180 CSV</span>
          </div>
        </div>
      </div>

      {exportMessage && (
        <div
          role="status"
          data-testid="payment-history-export-status"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice, plan, or Stripe ID..."
              aria-label="Search payment history"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'Paid', 'Processing', 'Failed', 'Refunded'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">No payment transactions match your filter</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Completed Stripe payments, listing upgrades, and invoices will appear here for download.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Plan / Service</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {rec.invoiceNumber}
                      {rec.paymentIntentId && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {rec.paymentIntentId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{rec.date}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{rec.planName}</span>
                      <span className="text-[11px] text-slate-500">{rec.companyName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span className="font-extrabold text-emerald-900 block">
                        EC${rec.amountXCD.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ~${rec.amountUSD.toFixed(2)} USD
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {rec.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(
                          rec.status
                        )}`}
                      >
                        {rec.status === 'Failed' && <AlertCircle className="w-3 h-3" />}
                        {rec.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
