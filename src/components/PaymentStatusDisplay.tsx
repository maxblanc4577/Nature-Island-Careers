import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { MappedStripeError, PaymentLogEntry } from '../utils/paymentLogger';

export interface PaymentReceiptSummary {
  chargeId: string;
  paymentIntentId: string;
  invoiceNumber: string;
  amountXCD: number;
  amountUSD: number;
  date: string;
  packageName: string;
  billingInterval: 'monthly' | 'one_time';
  paymentMethodLabel: string;
}

export interface RetryAttemptState {
  retrying: boolean;
  attempt: number;
  maxRetries: number;
  nextDelayMs?: number;
}

interface PaymentStatusDisplayProps {
  status: 'idle' | 'processing' | 'succeeded' | 'error';
  receipt: PaymentReceiptSummary | null;
  errorInfo: MappedStripeError | null;
  logs: PaymentLogEntry[];
  currencyPeg: number;
  billingEmail: string;
  cardholderName: string;
  billingParish: string;
  retryState?: RetryAttemptState;
  onRetry: () => void;
  onDismissError: () => void;
  onClose: () => void;
}

export const PaymentStatusDisplay: React.FC<PaymentStatusDisplayProps> = ({
  status,
  receipt,
  errorInfo,
  logs,
  currencyPeg,
  billingEmail,
  cardholderName,
  billingParish,
  retryState,
  onRetry,
  onDismissError,
  onClose,
}) => {
  const [showDebugLogs, setShowDebugLogs] = useState(false);

  useEffect(() => {
    if (status === 'succeeded' && receipt && typeof window !== 'undefined') {
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti errors in headless/test environments without canvas context
      }
    }
  }, [status, receipt]);

  if (status === 'succeeded' && receipt) {
    return (
      <div className="p-8 text-center space-y-5" data-testid="stripe-payment-receipt">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Payment Authorized by Stripe
          </span>
          <h3 className="text-2xl font-black text-slate-900">
            EC$ {receipt.amountXCD.toLocaleString()} Received
          </h3>
          <p className="text-xs text-slate-600">
            Equivalent to <strong>${receipt.amountUSD.toFixed(2)} USD</strong> ({currencyPeg.toFixed(2)} Peg)
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2 font-medium">
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Invoice Number:</span>
            <span className="font-mono font-bold text-slate-900">{receipt.invoiceNumber}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Package:</span>
            <span className="font-bold text-slate-900">{receipt.packageName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Billing Cadence:</span>
            <span className="font-bold text-emerald-800">
              {receipt.billingInterval === 'monthly'
                ? 'Monthly Recurring Subscription (Stripe Auto-Renew)'
                : '30-Day Listing Pass'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-mono text-slate-800">{receipt.paymentMethodLabel}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Stripe Charge ID:</span>
            <span className="font-mono text-slate-800">{receipt.chargeId}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Billing Entity:</span>
            <span className="font-semibold text-slate-800">
              {cardholderName} ({billingParish})
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Timestamp:</span>
            <span className="text-slate-700">{receipt.date}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Dominica DSS Tax Code:</span>
            <span className="text-emerald-700 font-bold">DSS-TAX-EXEMPT-2026</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 max-w-sm mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
          A formal Stripe receipt and invoice has been recorded in your{' '}
          <strong>Billing History</strong> and an email notification has been automatically
          dispatched to <strong>{billingEmail}</strong>.
        </p>

        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Print Tax Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Return to Employer Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {retryState?.retrying && (
        <div
          role="status"
          data-testid="stripe-retry-status"
          className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center gap-2.5"
        >
          <Loader2 className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
          <div>
            <strong className="font-bold">
              Transient network drop detected — Auto-retry {retryState.attempt}/{retryState.maxRetries}
            </strong>
            <span className="block text-[11px] text-amber-800">
              Re-submitting with exponential backoff ({retryState.nextDelayMs ?? 450}ms) and your idempotency guard...
            </span>
          </div>
        </div>
      )}

      {status === 'error' && errorInfo && (
        <div
          role="alert"
          data-testid="stripe-payment-error"
          className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-bold text-sm">{errorInfo.title}</strong>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800">
                    {errorInfo.code}
                  </span>
                </div>
                <p className="text-rose-900 leading-relaxed">{errorInfo.userMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss payment error"
              className="text-rose-600 hover:text-rose-900 font-bold cursor-pointer"
            >
              ×
            </button>
          </div>

          {errorInfo.actionSteps.length > 0 && (
            <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-rose-800">
              {errorInfo.actionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-200/80">
            <div className="flex items-center gap-2">
              {errorInfo.retryable && (
                <button
                  type="button"
                  data-testid="stripe-retry-element-btn"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again & Reset Card Form</span>
                </button>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                No charge made
              </span>
            </div>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDebugLogs((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-800 hover:underline cursor-pointer"
              >
                <Terminal className="w-3 h-3" />
                <span>Diagnostics ({logs.length})</span>
                {showDebugLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {showDebugLogs && logs.length > 0 && (
            <div
              data-testid="stripe-diagnostic-logs"
              className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-[10px] space-y-1.5 max-h-40 overflow-y-auto"
            >
              {logs.slice(0, 6).map((entry) => (
                <div key={entry.id} className="border-b border-slate-800 pb-1 last:border-b-0">
                  <span className="text-slate-400">{entry.timestamp.slice(11, 19)}</span>{' '}
                  <span className="text-amber-300">[{entry.event}]</span>{' '}
                  <span>{entry.message}</span>
                  {entry.errorCode && (
                    <span className="text-rose-400"> (code={entry.errorCode})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
