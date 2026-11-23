import React, { useState, useEffect, useRef } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { EmployerInvoice, SubscriptionPlan } from '../types';
import {
  EMPLOYER_MEMBERSHIP_PLANS,
  getMembershipPlanDetails,
  isSubscriptionPlan,
} from '../utils/membershipPlans';
import { generateInvoicePdf } from '../utils/generateInvoicePdf';
import {
  SandboxPaymentOutcome,
  validateCardNumber,
  validateCardExpiry,
  validateCardCvc,
  validateBankAccountRef,
  convertXcdToUsd,
  detectCardBrandAndLast4,
  stripSecretFromIntentId,
  generateIdempotencyKey,
} from '../utils/paymentValidation';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  MailCheck,
  Download,
  Printer,
  Receipt,
} from 'lucide-react';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentRecruiter, subscribeClientPlan, addInvoice, stripeSettings } =
    useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const portalsEnabled = stripeSettings?.merchantPortalsEnabled || {
    stripe: true,
    nbd: true,
    republicBank: true,
  };
  const currencyPeg = stripeSettings?.currencyPeg || 2.7;

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('Enterprise Growth Partner');
  const [paymentMethod, setPaymentMethod] = useState<
    'National Bank of Dominica (NBD)' | 'Credit/Debit Card (XCD)' | 'Republic Bank / Wire'
  >('National Bank of Dominica (NBD)');

  // Card & Bank Details state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [bankAccountNo, setBankAccountNo] = useState('NBD-40918-2026');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sandboxOutcome, setSandboxOutcome] = useState<SandboxPaymentOutcome>('success');
  const [receiptTx, setReceiptTx] = useState<string | null>(null);
  const [verifiedInvoice, setVerifiedInvoice] = useState<EmployerInvoice | null>(null);

  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey('nic_sub'));

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setReceiptTx(null);
      setVerifiedInvoice(null);
      setIsProcessing(false);
      setIsDownloadingPdf(false);
      setSandboxOutcome('success');
      submitLockRef.current = false;
      idempotencyKeyRef.current = generateIdempotencyKey('nic_sub');
      if (isSubscriptionPlan(currentUser?.subscription?.plan)) {
        setSelectedPlan(currentUser.subscription.plan);
      }
      if (portalsEnabled.nbd) {
        setPaymentMethod('National Bank of Dominica (NBD)');
      } else if (portalsEnabled.stripe) {
        setPaymentMethod('Credit/Debit Card (XCD)');
      } else if (portalsEnabled.republicBank) {
        setPaymentMethod('Republic Bank / Wire');
      }
    }
  }, [
    isOpen,
    currentUser?.subscription?.plan,
    portalsEnabled.nbd,
    portalsEnabled.stripe,
    portalsEnabled.republicBank,
  ]);

  useEffect(() => {
    idempotencyKeyRef.current = generateIdempotencyKey('nic_sub');
    setErrorMessage(null);
  }, [selectedPlan, paymentMethod]);

  if (!isOpen) return null;

  const selectedPlanMeta = getMembershipPlanDetails(selectedPlan);
  const selectedPriceXCD = selectedPlanMeta.priceXCD;
  const selectedPriceUSD = convertXcdToUsd(selectedPriceXCD, currencyPeg);

  const isSelectedPortalEnabled =
    (paymentMethod === 'National Bank of Dominica (NBD)' && portalsEnabled.nbd !== false) ||
    (paymentMethod === 'Credit/Debit Card (XCD)' && portalsEnabled.stripe !== false) ||
    (paymentMethod === 'Republic Bank / Wire' && portalsEnabled.republicBank !== false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isProcessing) return;

    if (!currentUser) {
      setErrorMessage('Please sign in to an employer account before activating a subscription.');
      return;
    }

    if (!isSelectedPortalEnabled) {
      setErrorMessage(
        `${paymentMethod} is currently paused by an administrator. Please choose another channel.`
      );
      return;
    }

    if (paymentMethod === 'Credit/Debit Card (XCD)') {
      const cardCheck = validateCardNumber(cardNumber);
      if (!cardCheck.valid) {
        setErrorMessage(cardCheck.error || 'Invalid card number.');
        return;
      }
      const expCheck = validateCardExpiry(cardExpiry);
      if (!expCheck.valid) {
        setErrorMessage(expCheck.error || 'Invalid card expiration date.');
        return;
      }
      const cvcCheck = validateCardCvc(cardCvc);
      if (!cvcCheck.valid) {
        setErrorMessage(cvcCheck.error || 'Invalid security code.');
        return;
      }
    } else {
      const bankCheck = validateBankAccountRef(bankAccountNo);
      if (!bankCheck.valid) {
        setErrorMessage(bankCheck.error || 'Invalid corporate bank account reference.');
        return;
      }
    }

    submitLockRef.current = true;
    setIsProcessing(true);
    setErrorMessage(null);

    const attemptIdemKey = idempotencyKeyRef.current;

    try {
      let txRef = `TX-DOM-${Math.floor(100000 + Math.random() * 900000)}`;
      let paymentMethodLabel: string = paymentMethod;
      let intentId: string | undefined;
      let receiptUrl: string | undefined;

      if (paymentMethod === 'Credit/Debit Card (XCD)') {
        const { brand, last4 } = detectCardBrandAndLast4(cardNumber);
        const res = await fetch('/api/stripe/confirm-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': attemptIdemKey,
          },
          body: JSON.stringify({
            planName: selectedPlan,
            amountXCD: selectedPriceXCD,
            employerName: currentUser.companyName || currentUser.name,
            customerEmail: currentUser.email,
            billingInterval: 'monthly',
            cardLast4: last4,
            cardBrand: brand,
            idempotencyKey: attemptIdemKey,
            simulateOutcome: sandboxOutcome,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          idempotencyKeyRef.current = generateIdempotencyKey('nic_sub');
          throw new Error(data.error || `Card authorization failed (status ${res.status}).`);
        }
        txRef = data.chargeId || txRef;
        intentId = stripSecretFromIntentId(data.paymentIntentId || '');
        paymentMethodLabel = data.paymentMethodLabel || `Stripe •••• ${last4} (${brand})`;
        receiptUrl = data.receiptUrl;
      } else {
        if (sandboxOutcome === 'decline') {
          throw new Error(`ECACH Direct Debit declined for account ${bankAccountNo.trim()}.`);
        }
        if (sandboxOutcome === 'cancel') {
          throw new Error('Bank debit authorization canceled before submission.');
        }
        if (sandboxOutcome === 'timeout') {
          throw new Error('Bank clearing gateway timed out. No debit was processed.');
        }
        if (sandboxOutcome === 'network_error') {
          throw new Error(
            'Network connection interrupted before reaching clearing house. Please retry.'
          );
        }
      }

      const issueDate = new Date().toISOString().split('T')[0];
      const renewsDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      subscribeClientPlan(currentUser.id, selectedPlan, paymentMethod, {
        skipEmail: true,
        transactionRef: txRef,
      });

      const createdInvoice = addInvoice({
        recruiterId: currentRecruiter?.id || currentUser.recruiterId || 'rec_fort_young',
        companyName: currentUser.companyName || currentUser.name,
        recipientEmail: currentUser.email,
        contactPerson: currentUser.name,
        dssRegistrationNo:
          currentUser.dssRegistrationNo || currentRecruiter?.dssRegistrationNo || 'DSS-DOM-VERIFIED',
        parish: currentUser.parish || currentRecruiter?.parish || 'St. George',
        paymentIntentId: intentId || txRef,
        idempotencyKey: attemptIdemKey,
        invoiceNumber: `INV-DOM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: issueDate,
        renewsAt: renewsDate,
        plan: selectedPlan,
        amountXCD: selectedPriceXCD,
        amountUSD: selectedPriceUSD,
        billingInterval: 'monthly',
        status: 'Paid',
        paymentMethod: paymentMethodLabel,
        receiptUrl,
        quotaPostings: selectedPlanMeta.quotaPostings,
        remoteWorkEnabled: selectedPlanMeta.remoteWorkEnabled,
        membershipFeatures: selectedPlanMeta.features,
        verificationChannel: paymentMethod,
      });

      setCardCvc('');
      setVerifiedInvoice(createdInvoice);
      setReceiptTx(txRef);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Subscription transaction could not be completed. Please try again.'
      );
    } finally {
      setIsProcessing(false);
      submitLockRef.current = false;
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (!verifiedInvoice || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await generateInvoicePdf(verifiedInvoice);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const invoicePlanMeta = getMembershipPlanDetails(verifiedInvoice?.plan || selectedPlan);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dominica Employer Subscription Gateway"
        tabIndex={-1}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
              {receiptTx ? <Receipt className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-display">
                {receiptTx
                  ? 'Verified Employer Membership & Official Invoice'
                  : 'Dominica Employer Subscription Gateway'}
              </h2>
              <p className="text-xs text-stone-500">
                {receiptTx
                  ? 'Signup verification, payment confirmation & membership tax invoice'
                  : 'Mandatory client registration & recruitment licensing fee'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[78vh] text-xs text-stone-800 space-y-5">
          {receiptTx && verifiedInvoice ? (
            <div data-testid="employer-membership-invoice" className="space-y-5">
              {/* Verification & Notification Confirmation Banner */}
              <div
                data-testid="employer-notification-sent-banner"
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3"
              >
                <div className="w-9 h-9 bg-emerald-800 text-white rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-950 font-display">
                    Employer Signup &amp; Payment Verification Completed
                  </h3>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Official verification notification and membership invoice dispatched to{' '}
                    <strong className="font-semibold">{verifiedInvoice.recipientEmail}</strong>. Your{' '}
                    <strong>{verifiedInvoice.plan}</strong> membership is now active.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-800 font-medium pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <MailCheck className="w-3.5 h-3.5" />
                      Notification Recorded in Drawer &amp; Ledger
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{verifiedInvoice.invoiceNumber}</span>
                  </div>
                </div>
              </div>

              {/* Formal Tax & Membership Invoice Sheet */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                {/* Invoice Issuer Header */}
                <div className="px-5 py-4 bg-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold tracking-tight">NATURE ISLAND CAREERS</div>
                    <div className="text-[11px] text-stone-300">
                      Commonwealth of Dominica Labour Division Authorized Exchange
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xs font-mono font-bold text-emerald-300">
                      {verifiedInvoice.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-stone-300 font-mono">
                      VAT / DSS Reg: DOM-EMP-TAX-77491
                    </div>
                  </div>
                </div>

                {/* Billed To & Invoice Meta */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-stone-200 bg-stone-50/70">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-stone-500">Billed To Employer</div>
                    <div className="text-sm font-bold text-stone-950">
                      {verifiedInvoice.companyName}
                    </div>
                    <div className="text-xs text-stone-700">
                      {verifiedInvoice.contactPerson || verifiedInvoice.companyName} ·{' '}
                      {verifiedInvoice.recipientEmail}
                    </div>
                    <div className="text-[11px] text-stone-600 font-mono">
                      DSS Reg: {verifiedInvoice.dssRegistrationNo || 'DSS-DOM-VERIFIED'} · Parish:{' '}
                      {verifiedInvoice.parish || 'St. George'}
                    </div>
                  </div>

                  <div className="sm:text-right space-y-1 tabular-nums">
                    <div className="text-[10px] font-bold text-stone-500">
                      Invoice Status &amp; Settlement
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      {verifiedInvoice.status} · Verified Employer Membership
                    </div>
                    <div className="text-[11px] text-stone-600 font-mono">
                      Issued: {verifiedInvoice.date} · Renews: {verifiedInvoice.renewsAt || '30-Day Cycle'}
                    </div>
                    <div className="text-[11px] text-stone-600">
                      {verifiedInvoice.paymentMethod} · Ref:{' '}
                      <span className="font-mono">{verifiedInvoice.paymentIntentId || receiptTx}</span>
                    </div>
                  </div>
                </div>

                {/* Itemized Selected Membership Table */}
                <div className="p-5 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500">
                          <th className="pb-2 pr-3">Selected Membership Tier</th>
                          <th className="pb-2 px-3">Billing Cycle</th>
                          <th className="pb-2 pl-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        <tr>
                          <td className="py-3 pr-3 align-top">
                            <div
                              data-testid="invoice-selected-membership"
                              className="font-bold text-stone-950 text-sm"
                            >
                              {verifiedInvoice.plan}
                            </div>
                            <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                              {invoicePlanMeta.quotaLabel} ·{' '}
                              {verifiedInvoice.remoteWorkEnabled ?? invoicePlanMeta.remoteWorkEnabled
                                ? 'WIN Remote Assignments Enabled'
                                : 'Local Parish Classifieds'}
                            </div>
                            <ul className="mt-2 space-y-1 text-[11px] text-stone-600">
                              {(
                                verifiedInvoice.membershipFeatures || invoicePlanMeta.features
                              ).map((feature, idx) => (
                                <li key={idx}>• {feature}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-3 px-3 align-top text-stone-700 whitespace-nowrap">
                            {verifiedInvoice.billingInterval === 'monthly'
                              ? 'Monthly Recurring'
                              : '30-Day Pass'}
                          </td>
                          <td className="py-3 pl-3 align-top text-right font-mono tabular-nums whitespace-nowrap">
                            <div className="font-bold text-stone-950">
                              EC${verifiedInvoice.amountXCD.toLocaleString()} XCD
                            </div>
                            <div className="text-[11px] text-stone-500">
                              ≈ ${verifiedInvoice.amountUSD.toFixed(2)} USD
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Total Row */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">
                      Total Paid &amp; Verified (XCD / Pegged USD)
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-900 tabular-nums">
                      EC${verifiedInvoice.amountXCD.toLocaleString()} XCD (~$
                      {verifiedInvoice.amountUSD.toFixed(2)} USD)
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="download-invoice-pdf-btn"
                    onClick={handleDownloadInvoicePdf}
                    disabled={isDownloadingPdf}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Invoice'}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="print-invoice-btn"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-600" />
                    <span>Print Invoice</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer whitespace-nowrap"
                >
                  Proceed to Recruiter Portal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckout} noValidate className="space-y-4">
              {!currentUser && (
                <div
                  role="alert"
                  className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Please sign in to an employer account before completing subscription checkout.
                  </span>
                </div>
              )}

              {currentUser?.role === 'client' &&
                currentUser.subscription?.status === 'pending_payment' && (
                  <div
                    data-testid="checkout-pending-verification-banner"
                    className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold block text-xs">
                        Employer Account Created — Payment Verification Required
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        Verify payment for your selected{' '}
                        <strong>{selectedPlan}</strong> membership to activate posting privileges and receive your official invoice &amp; notification.
                      </span>
                    </div>
                  </div>
                )}

              {errorMessage && (
                <div
                  role="alert"
                  data-testid="subscription-checkout-error"
                  className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    aria-label="Dismiss checkout error"
                    className="font-bold text-rose-600 hover:text-rose-900 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Account summary banner */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px]">Client / Organization:</span>
                  <span className="font-bold text-stone-900">
                    {currentUser?.companyName || currentUser?.name || 'Sign in required'}
                  </span>
                  {currentUser?.email && (
                    <span className="text-[11px] text-stone-500 block">{currentUser.email}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block text-[10px]">DSS Registration:</span>
                  <span className="font-mono font-semibold text-emerald-800">
                    {currentUser?.dssRegistrationNo || 'DSS-DOM-VERIFIED'}
                  </span>
                </div>
              </div>

              {/* Plan Selection Tiers */}
              <div>
                <span className="block font-bold text-stone-900 text-xs mb-2">
                  Select Employer Subscription Tier *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {EMPLOYER_MEMBERSHIP_PLANS.map((tier) => {
                    const isSelected = selectedPlan === tier.plan;
                    return (
                      <button
                        key={tier.plan}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPlan(tier.plan)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {tier.recommended && (
                          <span className="text-[10px] font-bold text-amber-800 block mb-0.5">
                            Recommended
                          </span>
                        )}
                        <div className="font-bold text-stone-900 text-xs">{tier.shortLabel}</div>
                        <div className="text-base font-extrabold font-mono text-emerald-900 mt-1 tabular-nums">
                          EC${tier.priceXCD}
                          <span className="text-[10px] font-normal text-stone-500">/mo</span>
                        </div>
                        <ul className="text-[10px] text-stone-600 mt-2 space-y-1">
                          {tier.features.slice(0, 3).map((feat, idx) => (
                            <li key={idx}>• {feat}</li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <span className="block font-bold text-stone-900 text-xs mb-2">
                  Dominican Payment Method *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={portalsEnabled.nbd === false}
                    onClick={() => setPaymentMethod('National Bank of Dominica (NBD)')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all disabled:opacity-45 disabled:cursor-not-allowed ${
                      paymentMethod === 'National Bank of Dominica (NBD)'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">NBD Direct Debit</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {portalsEnabled.nbd === false
                        ? 'Temporarily paused'
                        : 'National Bank of Dominica'}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={portalsEnabled.stripe === false}
                    onClick={() => setPaymentMethod('Credit/Debit Card (XCD)')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all disabled:opacity-45 disabled:cursor-not-allowed ${
                      paymentMethod === 'Credit/Debit Card (XCD)'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">Credit/Debit Card</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {portalsEnabled.stripe === false
                        ? 'Temporarily paused'
                        : 'Visa / Mastercard (XCD)'}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={portalsEnabled.republicBank === false}
                    onClick={() => setPaymentMethod('Republic Bank / Wire')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all disabled:opacity-45 disabled:cursor-not-allowed ${
                      paymentMethod === 'Republic Bank / Wire'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">Republic Bank Wire</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {portalsEnabled.republicBank === false
                        ? 'Temporarily paused'
                        : 'Local Bank Transfer'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Inputs */}
              {paymentMethod === 'Credit/Debit Card (XCD)' ? (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div>
                    <label
                      htmlFor="sub-card-number"
                      className="block text-[11px] font-semibold text-stone-800 mb-1"
                    >
                      Card Number *
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        id="sub-card-number"
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="sub-card-expiry"
                        className="block text-[11px] font-semibold text-stone-800 mb-1"
                      >
                        Expiry Date (MM/YY) *
                      </label>
                      <input
                        id="sub-card-expiry"
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="sub-card-cvc"
                        className="block text-[11px] font-semibold text-stone-800 mb-1"
                      >
                        CVC Security Code *
                      </label>
                      <input
                        id="sub-card-cvc"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <label
                    htmlFor="sub-bank-account"
                    className="block text-[11px] font-semibold text-stone-800"
                  >
                    Corporate Account Reference / IBAN *
                  </label>
                  <input
                    id="sub-bank-account"
                    type="text"
                    required
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900"
                  />
                  <p className="text-[10px] text-stone-500">
                    Direct automated debit authorized through Eastern Caribbean Automated Clearing
                    House (ECACH).
                  </p>
                </div>
              )}

              {/* Sandbox test scenario selector in sandbox mode */}
              {stripeSettings?.mode !== 'live' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-amber-900">Sandbox Outcome:</span>
                  <select
                    aria-label="Sandbox subscription outcome"
                    value={sandboxOutcome}
                    onChange={(e) => setSandboxOutcome(e.target.value as SandboxPaymentOutcome)}
                    className="px-2 py-1 bg-white border border-amber-300 rounded-lg font-semibold text-stone-800"
                  >
                    <option value="success">Authorized Success</option>
                    <option value="decline">Declined Payment</option>
                    <option value="cancel">Cancelled Payment</option>
                    <option value="timeout">Timeout</option>
                    <option value="network_error">Network Failure</option>
                  </select>
                </div>
              )}

              {/* Security Guarantee */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-emerald-950">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>
                    Authorized by the Commonwealth of Dominica Labour Division. Encrypted 256-bit
                    checkout.
                  </span>
                </div>
                <span className="font-mono font-bold shrink-0 tabular-nums">
                  ≈ ${selectedPriceUSD.toFixed(2)} USD
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-subscription-checkout-btn"
                  disabled={isProcessing || !isSelectedPortalEnabled}
                  className="flex items-center gap-1.5 px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isProcessing
                      ? 'Verifying Payment...'
                      : `Verify & Pay EC$${selectedPriceXCD.toLocaleString()}`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
