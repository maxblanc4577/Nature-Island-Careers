import React, { useState, useEffect, useRef } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { SubscriptionPlan, Parish } from '../types';
import {
  SandboxPaymentOutcome,
  isValidEmail,
  validateCardNumber,
  validateCardExpiry,
  validateCardCvc,
  convertXcdToUsd,
  detectCardBrandAndLast4,
  stripSecretFromIntentId,
  generateIdempotencyKey,
} from '../utils/paymentValidation';
import {
  X,
  CreditCard,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const STRIPE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) ||
  'pk_test_51MockDominicaNatureIslandCareersKey2026';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPlan?: SubscriptionPlan;
}

interface PricingPackage {
  id: string;
  name: string;
  planKey: SubscriptionPlan;
  priceXCD: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const PACKAGES: PricingPackage[] = [
  {
    id: 'pkg-standard',
    name: 'Standard Classified Listing',
    planKey: 'Standard Local Employer',
    priceXCD: 150,
    description: '30-day verified classified publication across Dominica’s 10 parishes.',
    features: [
      '30-day listing on Nature Island Careers',
      'Automated candidate email routing',
      'Parish wage benchmark indexing',
      'Dominica Social Security (DSS) receipt',
    ],
  },
  {
    id: 'pkg-featured',
    name: 'Featured Top-of-Board Pin',
    planKey: 'Standard Local Employer',
    priceXCD: 350,
    popular: true,
    description: 'Pinned to the top of all search results with prominent Dominica gold badge.',
    features: [
      'Everything in Standard listing',
      'Pinned atop Roseau, Portsmouth & island feeds',
      'Dispatched in instant subscriber alerts to 1,200+ seekers',
      '3x higher candidate application volume',
    ],
  },
  {
    id: 'pkg-enterprise',
    name: 'Enterprise Employer Partner',
    planKey: 'Enterprise Growth Partner',
    priceXCD: 950,
    description: 'Full hiring suite for resorts, banks, utilities, and global remote teams.',
    features: [
      'Unlimited job & remote classified vacancies',
      'Full candidate resume database access',
      'Dominica Work in Nature (WIN) remote sponsor tier',
      'Dedicated recruitment support from our team',
    ],
  },
  {
    id: 'pkg-nep',
    name: 'NEP Accredited Partner Tier',
    planKey: 'NEP Partner Tier',
    priceXCD: 280,
    description: 'Subsidized tier for National Employment Programme registered employers.',
    features: [
      'Government apprentice wage subsidies compatibility',
      'Direct pipeline to Dominica State College (DSC) graduates',
      'Verified NEP employer checkmark',
    ],
  },
];

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPlan,
}) => {
  const {
    currentRecruiter,
    currentUser,
    subscribeClientPlan,
    addInvoice,
    toggleRecruiterAutoRenew,
    stripeSettings,
  } = useJobContext();
  const isStripePortalEnabled = stripeSettings?.merchantPortalsEnabled?.stripe !== false;
  const currencyPeg = stripeSettings?.currencyPeg || 2.7;
  const isSandboxMode =
    stripeSettings?.mode !== 'live' || STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const resolveInitialPkgId = (plan?: SubscriptionPlan) =>
    plan === 'Enterprise Growth Partner'
      ? 'pkg-enterprise'
      : plan === 'NEP Partner Tier'
      ? 'pkg-nep'
      : 'pkg-featured';

  const [selectedPkgId, setSelectedPkgId] = useState<string>(resolveInitialPkgId(initialPlan));
  const [billingCadence, setBillingCadence] = useState<'monthly' | 'one_time'>('monthly');

  // Card inputs (default to blank on production or sandbox test value via Fill Test Data)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [cardholderName, setCardholderName] = useState(
    currentRecruiter ? currentRecruiter.companyName : currentUser ? currentUser.name : 'Dominica Employer Ltd'
  );
  const [billingEmail, setBillingEmail] = useState(
    currentRecruiter ? currentRecruiter.email : currentUser ? currentUser.email : 'billing@company.dm'
  );
  const [billingParish, setBillingParish] = useState<Parish>('St. George');
  const [postalCode, setPostalCode] = useState('00109');

  // Stripe processing & validation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sandboxOutcome, setSandboxOutcome] = useState<SandboxPaymentOutcome>('success');
  const [receiptData, setReceiptData] = useState<{
    chargeId: string;
    paymentIntentId: string;
    invoiceNumber: string;
    amountXCD: number;
    amountUSD: number;
    date: string;
    packageName: string;
    billingInterval: 'monthly' | 'one_time';
    paymentMethodLabel: string;
  } | null>(null);

  // Embedded Checkout Form State
  const [checkoutMode, setCheckoutMode] = useState<'embedded_form' | 'custom_card'>('embedded_form');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [embeddedLoading, setEmbeddedLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);

  // Synchronous double-click lock & per-attempt idempotency key
  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey('nic_stripe'));

  const currentPkg = PACKAGES.find((p) => p.id === selectedPkgId) || PACKAGES[1];
  const priceUSDNumber = convertXcdToUsd(currentPkg.priceXCD, currencyPeg);
  const priceUSD = priceUSDNumber.toFixed(2);

  // Reset transient state when modal opens or active account/plan changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPkgId(resolveInitialPkgId(initialPlan));
      setCardholderName(
        currentRecruiter
          ? currentRecruiter.companyName
          : currentUser
          ? currentUser.name
          : 'Dominica Employer Ltd'
      );
      setBillingEmail(
        currentRecruiter
          ? currentRecruiter.email
          : currentUser
          ? currentUser.email
          : 'billing@company.dm'
      );
      setPaymentError(null);
      setPaymentSuccess(false);
      setReceiptData(null);
      setSandboxOutcome('success');
      setIsProcessing(false);
      submitLockRef.current = false;
      idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
    }
  }, [isOpen, initialPlan, currentRecruiter?.id, currentUser?.id]);

  // Regenerate idempotency key whenever user selects a different package or cadence
  useEffect(() => {
    idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
    setPaymentError(null);
  }, [selectedPkgId, billingCadence]);

  // Initialize Checkout Session from server-side /api/stripe/create-checkout-session
  useEffect(() => {
    if (!isOpen || !isStripePortalEnabled) return;
    let isCancelled = false;
    setEmbeddedLoading(true);
    setSessionError(null);

    fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey('nic_cs'),
      },
      body: JSON.stringify({
        planName: currentPkg.name,
        priceXCD: currentPkg.priceXCD,
        ui_mode: 'form',
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Payment gateway responded with status ${res.status}`);
        }
        return data;
      })
      .then((data) => {
        if (isCancelled) return;
        const secret = data.client_secret || data.clientSecret;
        if (secret || data.id) {
          // Store only non-secret session identifier in client state/DOM
          setSessionId(stripSecretFromIntentId(data.id || secret));
          setSessionError(null);
        } else {
          throw new Error('Server did not return a valid checkout session identifier.');
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setSessionError(
          err?.message || 'Unable to initialize Stripe payment session. Please check connection and retry.'
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setEmbeddedLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, isStripePortalEnabled, selectedPkgId, billingCadence, currentPkg.name, currentPkg.priceXCD, retryTrigger]);

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('892');
    setPaymentError(null);
  };

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isProcessing) return;

    // Validate all inputs before initiating charge
    if (!cardholderName.trim() || cardholderName.trim().length < 2) {
      setPaymentError('Please enter a valid cardholder or company name.');
      return;
    }
    if (!isValidEmail(billingEmail)) {
      setPaymentError('Please enter a valid receipt email address (e.g. billing@company.dm).');
      return;
    }
    const cardCheck = validateCardNumber(cardNumber);
    if (!cardCheck.valid) {
      setPaymentError(cardCheck.error || 'Invalid card number.');
      return;
    }
    const expiryCheck = validateCardExpiry(cardExpiry);
    if (!expiryCheck.valid) {
      setPaymentError(expiryCheck.error || 'Invalid card expiration date.');
      return;
    }
    const cvcCheck = validateCardCvc(cardCvc);
    if (!cvcCheck.valid) {
      setPaymentError(cvcCheck.error || 'Invalid security code.');
      return;
    }

    submitLockRef.current = true;
    setIsProcessing(true);
    setPaymentError(null);

    const { brand, last4 } = detectCardBrandAndLast4(cardNumber);
    const attemptIdemKey = idempotencyKeyRef.current;

    try {
      // Step 1: Create PaymentIntent on backend (using non-sensitive amount & metadata)
      const intentRes = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `${attemptIdemKey}_intent`,
        },
        body: JSON.stringify({
          amountXCD: currentPkg.priceXCD,
          description: currentPkg.name,
          customerEmail: billingEmail.trim(),
          employerName: cardholderName.trim(),
          billingInterval: billingCadence,
          idempotencyKey: `${attemptIdemKey}_intent`,
        }),
      });

      const intentData = await intentRes.json().catch(() => ({}));
      if (!intentRes.ok || !intentData.id) {
        throw new Error(intentData.error || `Unable to create payment intent (${intentRes.status}).`);
      }

      // Step 2: Confirm PaymentIntent (never sending raw card number or CVC to backend)
      const confirmRes = await fetch('/api/stripe/confirm-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': attemptIdemKey,
        },
        body: JSON.stringify({
          paymentIntentId: stripSecretFromIntentId(intentData.id),
          planName: currentPkg.name,
          amountXCD: currentPkg.priceXCD,
          employerName: cardholderName.trim(),
          customerEmail: billingEmail.trim(),
          billingInterval: billingCadence,
          cardLast4: last4,
          cardBrand: brand,
          idempotencyKey: attemptIdemKey,
          simulateOutcome: isSandboxMode ? sandboxOutcome : 'success',
        }),
      });

      const confirmData = await confirmRes.json().catch(() => ({}));
      if (!confirmRes.ok || !confirmData.success) {
        // Generate a fresh idempotency key for the next retry after a failed/canceled attempt
        idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
        throw new Error(
          confirmData.error ||
            `Payment could not be completed (status ${confirmRes.status}). Your card was not charged.`
        );
      }

      const safeIntentId = stripSecretFromIntentId(confirmData.paymentIntentId || intentData.id);
      const safeUsd = Number(confirmData.amountUSD ?? priceUSDNumber);
      const paymentMethodLabel = confirmData.paymentMethodLabel || `Stripe •••• ${last4} (${brand})`;

      if (currentUser) {
        subscribeClientPlan(currentUser.id, currentPkg.planKey, 'Credit/Debit Card (XCD)');
      }

      addInvoice({
        recruiterId: currentRecruiter?.id || 'rec_fort_young',
        companyName: cardholderName.trim(),
        recipientEmail: billingEmail.trim(),
        paymentIntentId: safeIntentId,
        idempotencyKey: attemptIdemKey,
        invoiceNumber: confirmData.invoiceNumber || `INV-DOM-2026-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        plan: currentPkg.name,
        amountXCD: currentPkg.priceXCD,
        amountUSD: safeUsd,
        billingInterval: billingCadence,
        status: 'Paid',
        paymentMethod: paymentMethodLabel,
        receiptUrl: confirmData.receiptUrl || `https://pay.stripe.com/receipts/invoices/${confirmData.chargeId}`,
        stripeSubscriptionId:
          billingCadence === 'monthly'
            ? `sub_stripe_${safeIntentId.slice(-8)}`
            : undefined,
      });

      if (billingCadence === 'monthly' && currentRecruiter && savePaymentMethod) {
        toggleRecruiterAutoRenew(currentRecruiter.id, true);
      }

      // Clear CVC from component state immediately after completion
      setCardCvc('');

      setReceiptData({
        chargeId: confirmData.chargeId,
        paymentIntentId: safeIntentId,
        invoiceNumber: confirmData.invoiceNumber || 'INV-DOM-2026',
        amountXCD: currentPkg.priceXCD,
        amountUSD: safeUsd,
        date: new Date().toLocaleString(),
        packageName: currentPkg.name,
        billingInterval: billingCadence,
        paymentMethodLabel,
      });

      setPaymentSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setPaymentError(
        err?.message || 'Network failure while contacting Stripe gateway. No charge was made.'
      );
    } finally {
      setIsProcessing(false);
      submitLockRef.current = false;
    }
  };

  const handleCancelCheckout = () => {
    setPaymentError('Payment checkout was canceled. No charge was processed.');
    idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nature Island Careers Payment Gateway"
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Stripe Header Banner */}
        <div className="bg-[#635BFF] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="px-2 py-1 bg-white/20 rounded-md font-black text-sm tracking-tight flex items-center gap-1.5">
              <span>stripe</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/30 px-1 py-0.2 rounded">
                {isSandboxMode ? 'Sandbox' : 'Portal'}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">Nature Island Careers Payment Gateway</h2>
              <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-white" />
                <span>256-bit End-to-End SSL Encrypted · {isSandboxMode ? 'Test / Sandbox Mode' : 'Live PCI-DSS Checkout'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment gateway modal"
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccess && receiptData ? (
          <div className="p-8 text-center space-y-5" data-testid="stripe-payment-receipt">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Payment Authorized by Stripe
              </span>
              <h3 className="text-2xl font-black text-slate-900">EC$ {receiptData.amountXCD.toLocaleString()} Received</h3>
              <p className="text-xs text-slate-600">
                Equivalent to <strong>${receiptData.amountUSD.toFixed(2)} USD</strong> ({currencyPeg.toFixed(2)} Peg)
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono font-bold text-slate-900">{receiptData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Package:</span>
                <span className="font-bold text-slate-900">{receiptData.packageName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Billing Cadence:</span>
                <span className="font-bold text-emerald-800">
                  {receiptData.billingInterval === 'monthly' ? 'Monthly Recurring Subscription (Stripe Auto-Renew)' : '30-Day Listing Pass'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-mono text-slate-800">{receiptData.paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Stripe Charge ID:</span>
                <span className="font-mono text-slate-800">{receiptData.chargeId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Billing Entity:</span>
                <span className="font-semibold text-slate-800">{cardholderName} ({billingParish})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-700">{receiptData.date}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Dominica DSS Tax Code:</span>
                <span className="text-emerald-700 font-bold">DSS-TAX-EXEMPT-2026</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-sm mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
              A formal Stripe receipt and invoice has been recorded in your <strong>Billing History</strong> and an email notification has been automatically dispatched to <strong>{billingEmail}</strong>.
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
        ) : !isStripePortalEnabled ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Stripe Merchant Checkout Temporarily Paused
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              An administrator has paused Stripe card checkout in the Merchant Payment Portals console. Please contact <strong>info@natureislecareers.com</strong> or use another enabled payment portal.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleStripeSubmit} noValidate className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
            {paymentError && (
              <div
                role="alert"
                data-testid="stripe-payment-error"
                className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Payment Not Completed</strong>
                    <p className="text-rose-800 mt-0.5">{paymentError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentError(null)}
                  aria-label="Dismiss payment error"
                  className="text-rose-600 hover:text-rose-900 font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Billing Cadence Toggle */}
            <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setBillingCadence('monthly')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  billingCadence === 'monthly'
                    ? 'bg-[#635BFF] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Monthly Recurring Subscription (Auto-Renew)</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCadence('one_time')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  billingCadence === 'one_time'
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>Single 30-Day Listing Pass</span>
              </button>
            </div>

            {/* Step 1: Select Classified Package */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  1. Choose Employer Package
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Pegged Currency: EC$ {currencyPeg.toFixed(2)} : $1 USD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPkgId === pkg.id;
                  const usd = convertXcdToUsd(pkg.priceXCD, currencyPeg).toFixed(2);

                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      aria-pressed={isSelected}
                      className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#635BFF] bg-[#635BFF]/5 ring-2 ring-[#635BFF]/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute top-2.5 right-2.5 bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                          Popular
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-slate-900 pr-12">{pkg.name}</h4>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900">
                          EC$ {pkg.priceXCD}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ≈ ${usd} USD
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{pkg.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Stripe Payment Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                  <span>2. Payment Details (Stripe Protected)</span>
                </span>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setCheckoutMode('embedded_form')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      checkoutMode === 'embedded_form'
                        ? 'bg-white text-[#635BFF] shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Embedded Form SDK
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutMode('custom_card')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      checkoutMode === 'custom_card'
                        ? 'bg-white text-slate-900 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Direct Card
                  </button>
                </div>
              </div>

              {checkoutMode === 'embedded_form' ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${sessionError ? 'bg-rose-500' : embeddedLoading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className="font-bold text-slate-800">Stripe Embedded Checkout Form</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {sessionId && !embeddedLoading && (
                        <span className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded truncate max-w-[180px]" title={sessionId}>
                          session: {sessionId.slice(0, 14)}...
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 font-mono px-2 py-0.5 rounded">
                        pk: {STRIPE_PUBLISHABLE_KEY.slice(0, 12)}...
                      </span>
                      <button
                        type="button"
                        onClick={fillTestCard}
                        className="text-[11px] font-bold text-[#635BFF] hover:underline cursor-pointer shrink-0"
                      >
                        ⚡ Fill Test Data
                      </button>
                    </div>
                  </div>

                  {embeddedLoading && (
                    <div className="p-6 bg-slate-50/80 border border-slate-200 rounded-xl text-center space-y-2">
                      <div className="w-8 h-8 border-3 border-indigo-200 border-t-[#635BFF] rounded-full animate-spin mx-auto" />
                      <h5 className="font-bold text-sm text-slate-800">Initializing payment...</h5>
                      <p className="text-xs text-slate-500">
                        Preparing secure session with Stripe for EC$ {currentPkg.priceXCD} (US$ {priceUSD})
                      </p>
                    </div>
                  )}

                  {sessionError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-700 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Checkout Session Initialization Error</span>
                      </div>
                      <p className="text-rose-600 leading-relaxed">{sessionError}</p>
                      <button
                        type="button"
                        onClick={() => setRetryTrigger((r) => r + 1)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Session Initialization</span>
                      </button>
                    </div>
                  )}

                  <div
                    id="checkout-form"
                    className={`p-5 bg-white border-2 border-indigo-100 rounded-xl shadow-xs space-y-4 transition-all ${
                      embeddedLoading ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="stripe-card-number" className="block text-[12px] font-bold text-slate-700 mb-1">
                          Card Information *
                        </label>
                        <div className="relative">
                          <input
                            id="stripe-card-number"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full pl-3 pr-20 py-2.5 rounded border border-slate-300 text-sm font-mono focus:border-[#0570de] focus:ring-1 focus:ring-[#0570de] focus:outline-none bg-white"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                              VISA
                            </span>
                            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                              MC
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="stripe-card-expiry" className="block text-[12px] font-bold text-slate-700 mb-1">
                            Expiration (MM / YY) *
                          </label>
                          <input
                            id="stripe-card-expiry"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 rounded border border-slate-300 text-sm font-mono focus:border-[#0570de] focus:ring-1 focus:ring-[#0570de] focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="stripe-card-cvc" className="block text-[12px] font-bold text-slate-700 mb-1">
                            CVC *
                          </label>
                          <input
                            id="stripe-card-cvc"
                            type="password"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            maxLength={4}
                            required
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="CVC"
                            className="w-full px-3 py-2 rounded border border-slate-300 text-sm font-mono focus:border-[#0570de] focus:ring-1 focus:ring-[#0570de] focus:outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="stripe-cardholder-name" className="block text-[12px] font-bold text-slate-700 mb-1">
                          Name on Card *
                        </label>
                        <input
                          id="stripe-cardholder-name"
                          type="text"
                          required
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder="Full Name / Employer Entity"
                          className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-medium focus:border-[#0570de] focus:ring-1 focus:ring-[#0570de] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="stripe-billing-email" className="block text-[12px] font-bold text-slate-700 mb-1">
                          Receipt Email Address *
                        </label>
                        <input
                          id="stripe-billing-email"
                          type="email"
                          required
                          value={billingEmail}
                          onChange={(e) => setBillingEmail(e.target.value)}
                          placeholder="billing@company.dm"
                          className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-medium focus:border-[#0570de] focus:ring-1 focus:ring-[#0570de] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="stripe-billing-parish" className="block text-[12px] font-bold text-slate-700 mb-1">
                          Parish / Region
                        </label>
                        <select
                          id="stripe-billing-parish"
                          value={billingParish}
                          onChange={(e) => setBillingParish(e.target.value as Parish)}
                          className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-medium bg-white"
                        >
                          <option value="St. George">Dominica (St. George - Roseau)</option>
                          <option value="St. John">Dominica (St. John - Portsmouth)</option>
                          <option value="St. Paul">Dominica (St. Paul)</option>
                          <option value="St. Andrew">Dominica (St. Andrew)</option>
                          <option value="St. Patrick">Dominica (St. Patrick)</option>
                          <option value="St. Joseph">Dominica (St. Joseph)</option>
                          <option value="St. David">Dominica (St. David)</option>
                          <option value="Island-wide / Remote">Dominica (Remote / WIN Visa)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="stripe-postal-code" className="block text-[12px] font-bold text-slate-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          id="stripe-postal-code"
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="00109"
                          className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 pt-1 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={savePaymentMethod}
                        onChange={(e) => setSavePaymentMethod(e.target.checked)}
                        className="rounded text-[#0570de] focus:ring-[#0570de] w-4 h-4 cursor-pointer"
                      />
                      <span>Enable automated monthly renewal for active employer listing</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label htmlFor="stripe-direct-card" className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Card Number *
                      </label>
                      <input
                        id="stripe-direct-card"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-mono font-medium focus:ring-2 focus:ring-[#635BFF] focus:outline-none bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="stripe-direct-expiry" className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Expiration (MM/YY) *
                        </label>
                        <input
                          id="stripe-direct-expiry"
                          type="text"
                          inputMode="numeric"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#635BFF] focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="stripe-direct-cvc" className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          CVC / CVV *
                        </label>
                        <input
                          id="stripe-direct-cvc"
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="CVC"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#635BFF] focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="stripe-direct-name" className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Cardholder / Company Name *
                      </label>
                      <input
                        id="stripe-direct-name"
                        type="text"
                        required
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="e.g. Fort Young Hotel Ltd"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="stripe-direct-email" className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Receipt Email Address *
                      </label>
                      <input
                        id="stripe-direct-email"
                        type="email"
                        required
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                        placeholder="billing@company.dm"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sandbox Outcome Simulator Selector (Visible ONLY in Test/Sandbox mode) */}
              {isSandboxMode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-amber-950 block">Sandbox Test Mode Scenario</span>
                    <span className="text-[11px] text-amber-800">Test payment outcomes without real charges</span>
                  </div>
                  <select
                    aria-label="Sandbox test payment outcome"
                    data-testid="stripe-sandbox-outcome-select"
                    value={sandboxOutcome}
                    onChange={(e) => setSandboxOutcome(e.target.value as SandboxPaymentOutcome)}
                    className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-semibold text-xs text-slate-800 cursor-pointer"
                  >
                    <option value="success">Authorized Success (Test Card)</option>
                    <option value="decline">Simulate Card Declined</option>
                    <option value="cancel">Simulate Cancelled Payment</option>
                    <option value="timeout">Simulate Gateway Timeout</option>
                    <option value="network_error">Simulate Network Failure</option>
                  </select>
                </div>
              )}
            </div>

            {/* Total and Submit */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Selected: {currentPkg.name}</span>
                <span className="font-bold text-amber-300">EC$ {currentPkg.priceXCD}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Processing Fee (Stripe Dominica):</span>
                <span className="text-emerald-400 font-semibold">Waived (EC$ 0.00)</span>
              </div>
              <div className="flex items-center justify-between font-black text-base">
                <span>Total Due:</span>
                <div className="text-right">
                  <span className="text-white">EC$ {currentPkg.priceXCD}</span>
                  <span className="block text-xs font-normal text-slate-400">
                    ≈ ${priceUSD} USD
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelCheckout}
                  disabled={isProcessing}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel Charge
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || embeddedLoading}
                  data-testid="stripe-submit-btn"
                  className="flex-1 py-3 bg-[#635BFF] hover:bg-[#5349e0] disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing Charge with Stripe...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay EC$ {currentPkg.priceXCD} with Stripe</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Guaranteed by Stripe Financial
              </span>
              <span>•</span>
              <span>Dominica Social Security Verified</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
