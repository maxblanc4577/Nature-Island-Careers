import React, { useEffect, useMemo, useState } from 'react';
import { EmployerInvoice } from '../types';
import { useJobContext } from '../context/JobContext';
import { generateInvoicePdf, downloadInvoicesAsZip } from '../utils/generateInvoicePdf';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUpDown,
  X,
  Loader2,
} from 'lucide-react';

export const INVOICES_PER_PAGE = 10;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type InvoiceSortOrder = 'newest' | 'oldest';

export function isPendingInvoiceStatus(status: EmployerInvoice['status']): boolean {
  return status === 'Pending' || status === 'Renewal Pending' || status === 'Processing';
}

export function formatTimeRemainingShort(msRemaining: number): string {
  if (msRemaining <= 0) return 'Expired';
  const totalMinutes = Math.floor(msRemaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${Math.max(1, minutes)}m`;
}

interface InvoiceHistoryTabProps {
  onRetryPayment: (invoice: EmployerInvoice) => void;
  highlightedInvoiceId?: string | null;
}

export const InvoiceHistoryTab: React.FC<InvoiceHistoryTabProps> = ({
  onRetryPayment,
  highlightedInvoiceId = null,
}) => {
  const { invoices, stripeSettings } = useJobContext();
  const currencyPeg = stripeSettings?.currencyPeg || 2.7;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<InvoiceSortOrder>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Tick every 30s so <24h expiry countdown badges stay live
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Financial summary totals
  const summaryMetrics = useMemo(() => {
    let totalPaidXCD = 0;
    let paidCount = 0;
    let totalPendingXCD = 0;
    let pendingCount = 0;

    for (const inv of invoices) {
      if (inv.status === 'Paid') {
        totalPaidXCD += Number(inv.amountXCD || 0);
        paidCount += 1;
      } else if (isPendingInvoiceStatus(inv.status)) {
        totalPendingXCD += Number(inv.amountXCD || 0);
        pendingCount += 1;
      }
    }

    return {
      totalPaidXCD,
      paidCount,
      totalPendingXCD,
      pendingCount,
      totalLifetimeSpendXCD: totalPaidXCD,
    };
  }, [invoices]);

  // Filter & sort invoices by search query (company name or description keywords) and date
  const filteredAndSortedInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = invoices.filter((inv) => {
      if (!q) return true;
      return (
        (inv.companyName || '').toLowerCase().includes(q) ||
        (inv.description || '').toLowerCase().includes(q) ||
        (inv.plan || '').toLowerCase().includes(q) ||
        (inv.invoiceNumber || '').toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.date || 0).getTime() || 0;
      const timeB = new Date(b.date || 0).getTime() || 0;
      if (timeA !== timeB) {
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      }
      return sortOrder === 'newest'
        ? (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '')
        : (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
    });
  }, [invoices, searchQuery, sortOrder]);

  // Reset pagination when search query or sort order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedInvoices.length / INVOICES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  // Navigate to highlighted invoice's page if passed from email receipt notification
  useEffect(() => {
    if (!highlightedInvoiceId) return;
    const idx = filteredAndSortedInvoices.findIndex(
      (inv) =>
        inv.id === highlightedInvoiceId ||
        inv.invoiceNumber.toLowerCase() === highlightedInvoiceId.toLowerCase()
    );
    if (idx >= 0) {
      setCurrentPage(Math.floor(idx / INVOICES_PER_PAGE) + 1);
    }
  }, [highlightedInvoiceId, filteredAndSortedInvoices]);

  const paginatedInvoices = useMemo(() => {
    const startIdx = (safePage - 1) * INVOICES_PER_PAGE;
    return filteredAndSortedInvoices.slice(startIdx, startIdx + INVOICES_PER_PAGE);
  }, [filteredAndSortedInvoices, safePage]);

  const pageInvoiceIds = useMemo(
    () => paginatedInvoices.map((inv) => inv.id),
    [paginatedInvoices]
  );

  const allOnPageSelected =
    pageInvoiceIds.length > 0 && pageInvoiceIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageInvoiceIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageInvoiceIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedInvoices = useMemo(
    () => invoices.filter((inv) => selectedIds.includes(inv.id)),
    [invoices, selectedIds]
  );

  const handleDownloadPdf = async (invoice: EmployerInvoice) => {
    setDownloadingPdfId(invoice.id);
    setFeedbackBanner(null);
    try {
      const fileName = await generateInvoicePdf(invoice);
      setFeedbackBanner({
        type: 'success',
        message: `Downloaded PDF invoice: ${fileName}`,
      });
    } catch {
      setFeedbackBanner({
        type: 'error',
        message: `Unable to generate PDF for ${invoice.invoiceNumber}.`,
      });
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadSelectedZip = async () => {
    if (selectedInvoices.length === 0) return;
    setIsZipping(true);
    setFeedbackBanner(null);
    try {
      const zipFilename = await downloadInvoicesAsZip(selectedInvoices);
      setFeedbackBanner({
        type: 'success',
        message: `Exported ${selectedInvoices.length} selected invoice(s) into ${zipFilename}.`,
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: err?.message || 'Unable to bundle selected invoices into a ZIP archive.',
      });
    } finally {
      setIsZipping(false);
    }
  };

  const startIndex = filteredAndSortedInvoices.length === 0 ? 0 : (safePage - 1) * INVOICES_PER_PAGE + 1;
  const endIndex = Math.min(safePage * INVOICES_PER_PAGE, filteredAndSortedInvoices.length);

  return (
    <div data-testid="invoice-history-tab" className="space-y-5">
      {/* Header & Bulk Export Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              Employer Membership Invoice History
            </h3>
            <p className="text-xs text-slate-600">
              View past and pending employer membership purchases, export PDF receipts or ZIP archives, and settle pending balances via Stripe.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-testid="download-selected-zip-btn"
              onClick={handleDownloadSelectedZip}
              disabled={selectedInvoices.length === 0 || isZipping}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isZipping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              <span>
                Download Selected as ZIP
                {selectedInvoices.length > 0 ? ` (${selectedInvoices.length})` : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Financial Summary Row: Total Paid, Total Pending, Total Lifetime Spend */}
        <div
          data-testid="invoice-financial-summary"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Paid
              </span>
              <span className="text-[11px] font-semibold text-green-700">
                {summaryMetrics.paidCount} Paid
              </span>
            </div>
            <p
              data-testid="summary-total-paid"
              className="text-xl font-black font-mono tabular-nums text-green-700"
            >
              EC$ {summaryMetrics.totalPaidXCD.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
              ≈ ${(summaryMetrics.totalPaidXCD / currencyPeg).toFixed(2)} USD verified
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Pending
              </span>
              <span className="text-[11px] font-semibold text-orange-600">
                {summaryMetrics.pendingCount} Awaiting Payment
              </span>
            </div>
            <p
              data-testid="summary-total-pending"
              className="text-xl font-black font-mono tabular-nums text-orange-600"
            >
              EC$ {summaryMetrics.totalPendingXCD.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">
              ≈ ${(summaryMetrics.totalPendingXCD / currencyPeg).toFixed(2)} USD balance due
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Total Lifetime Spend
              </span>
              <span className="text-[11px] font-semibold text-emerald-300">
                {invoices.length} Total Invoices
              </span>
            </div>
            <p
              data-testid="summary-total-lifetime-spend"
              className="text-xl font-black font-mono tabular-nums text-white"
            >
              EC$ {summaryMetrics.totalLifetimeSpendXCD.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">
              ≈ ${(summaryMetrics.totalLifetimeSpendXCD / currencyPeg).toFixed(2)} USD cumulative spend
            </p>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackBanner && (
          <div
            role="status"
            data-testid="invoice-history-feedback"
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              feedbackBanner.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span className="flex items-center gap-2">
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackBanner.message}</span>
            </span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="p-1 hover:opacity-75 cursor-pointer"
              aria-label="Dismiss feedback"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Sort By Date Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="invoice-search-input"
              aria-label="Search invoices by company name or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name or invoice description..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear invoice search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="invoice-sort-by-date"
              className="text-xs font-bold text-slate-600 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort By Date</span>
            </label>
            <select
              id="invoice-sort-by-date"
              data-testid="invoice-sort-date-select"
              aria-label="Sort By Date"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as InvoiceSortOrder)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filteredAndSortedInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Matching Invoices Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No employer membership invoices matched &ldquo;{searchQuery}&rdquo;. Try clearing your search filter.
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all invoices on page"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAllOnPage}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Invoice & Employer</th>
                    <th className="py-3 px-3">Issue Date & Tier</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Expiry Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInvoices.map((inv) => {
                    const isPending = isPendingInvoiceStatus(inv.status);
                    const isPaid = inv.status === 'Paid';
                    const isSelected = selectedIds.includes(inv.id);
                    const isHighlighted =
                      Boolean(highlightedInvoiceId) &&
                      (inv.id === highlightedInvoiceId ||
                        inv.invoiceNumber.toLowerCase() ===
                          (highlightedInvoiceId || '').toLowerCase());

                    const expiryMs =
                      isPending && inv.expiryDate ? new Date(inv.expiryDate).getTime() : NaN;
                    const msRemaining = Number.isFinite(expiryMs) ? expiryMs - nowMs : NaN;
                    const isUnder24h =
                      Number.isFinite(msRemaining) &&
                      msRemaining > 0 &&
                      msRemaining < TWENTY_FOUR_HOURS_MS;
                    const isExpired = Number.isFinite(msRemaining) && msRemaining <= 0;

                    return (
                      <tr
                        key={inv.id}
                        data-testid={`invoice-row-${inv.id}`}
                        className={`transition-colors ${
                          isHighlighted
                            ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-400'
                            : isSelected
                            ? 'bg-slate-50'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 pl-4 pr-2 align-top">
                          <input
                            type="checkbox"
                            data-testid={`select-invoice-${inv.id}`}
                            aria-label={`Select invoice ${inv.invoiceNumber}`}
                            checked={isSelected}
                            onChange={() => toggleSelectRow(inv.id)}
                            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-3 align-top max-w-xs">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {inv.invoiceNumber}
                          </div>
                          <div className="font-bold text-slate-800 text-xs mt-0.5">
                            {inv.companyName}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {inv.description || `${inv.plan} membership billing`}
                          </p>
                        </td>

                        <td className="py-3.5 px-3 align-top">
                          <div className="font-mono tabular-nums font-semibold text-slate-800">
                            {inv.date}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                            {inv.plan}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize">
                            {inv.billingInterval === 'one_time'
                              ? '30-Day Pass'
                              : `${inv.billingInterval} cycle`}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-top font-mono tabular-nums whitespace-nowrap">
                          <div className="font-black text-slate-900">
                            EC$ {Number(inv.amountXCD || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ~${Number(inv.amountUSD || inv.amountXCD / currencyPeg).toFixed(2)} USD
                          </div>
                        </td>

                        <td
                          data-testid={`invoice-expiry-${inv.id}`}
                          className="py-3.5 px-3 align-top whitespace-nowrap"
                        >
                          {isPending && inv.expiryDate ? (
                            <div className="space-y-1">
                              <div className="font-mono tabular-nums text-[11px] font-semibold text-slate-800">
                                {new Date(inv.expiryDate).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                              {isUnder24h && (
                                <span
                                  data-testid="invoice-expiry-countdown-badge"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-orange-300 bg-orange-100 text-orange-800 text-[10px] font-bold font-mono tabular-nums"
                                >
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Expires in {formatTimeRemainingShort(msRemaining)}</span>
                                </span>
                              )}
                              {isExpired && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-300 bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  Expired
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 align-top whitespace-nowrap">
                          <span
                            data-testid={`invoice-status-${inv.id}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                              isPaid
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-orange-600 bg-orange-50 border-orange-200'
                            }`}
                          >
                            {isPaid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{inv.status}</span>
                          </span>
                        </td>

                        <td className="py-3.5 pl-3 pr-4 align-top text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              data-testid={`download-invoice-pdf-${inv.id}`}
                              onClick={() => handleDownloadPdf(inv)}
                              disabled={downloadingPdfId === inv.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              {downloadingPdfId === inv.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-emerald-700" />
                              )}
                              <span>Download PDF</span>
                            </button>

                            {isPending && (
                              <button
                                type="button"
                                data-testid={`retry-invoice-payment-${inv.id}`}
                                onClick={() => onRetryPayment(inv)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#635BFF] hover:bg-[#5349e0] text-white text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Retry Payment</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (10 invoices per page) */}
            <div
              data-testid="invoice-pagination"
              className="px-4 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <span className="text-slate-600 font-medium font-mono tabular-nums">
                Showing {startIndex}–{endIndex} of {filteredAndSortedInvoices.length} invoices
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="invoice-page-prev"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    data-testid={`invoice-page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={safePage === pageNum ? 'page' : undefined}
                    className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-colors cursor-pointer ${
                      safePage === pageNum
                        ? 'bg-emerald-800 text-white border border-emerald-800'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  data-testid="invoice-page-next"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
