import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { SubscriptionPlan, EmployerInvoice } from '../types';
import { convertXcdToUsd, generateIdempotencyKey, stripSecretFromIntentId } from '../utils/paymentValidation';
import { PaymentForm, PaymentCompletionPayload } from './PaymentForm';
import { X, Lock, Sparkles, AlertCircle, BookOpen, RefreshCw, Clock } from 'lucide-react';

const STRIPE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) ||
  'pk_test_51MockDominicaNatureIslandCareersKey2026';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPlan?: SubscriptionPlan;
  retryInvoice?: EmployerInvoice | null;
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

function inferPlanKeyFromInvoice(planName: string): SubscriptionPlan {
  const normalized = (planName || '').toLowerCase();
  if (normalized.includes('enterprise')) return 'Enterprise Growth Partner';
  if (normalized.includes('nep')) return 'NEP Partner Tier';
  return 'Standard Local Employer';
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPlan,
  retryInvoice = null,
}) => {
  const {
    currentRecruiter,
    currentUser,
    subscribeClientPlan,
    addInvoice,
    markInvoicePaid,
    toggleRecruiterAutoRenew,
    stripeSettings,
  } = useJobContext();

  const isStripePortalEnabled = stripeSettings?.merchantPortalsEnabled?.stripe !== false;
  const currencyPeg = stripeSettings?.currencyPeg || 2.7;
  const isMockPublishableKey =
    !STRIPE_PUBLISHABLE_KEY ||
    STRIPE_PUBLISHABLE_KEY.includes('Mock') ||
    STRIPE_PUBLISHABLE_KEY === 'pk_test_sample';
  const isSandboxMode = stripeSettings?.mode !== 'live' || isMockPublishableKey;
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const resolveInitialPkgId = (plan?: SubscriptionPlan) =>
    plan === 'Enterprise Growth Partner'
      ? 'pkg-enterprise'
      : plan === 'NEP Partner Tier'
      ? 'pkg-nep'
      : 'pkg-featured';

  const [selectedPkgId, setSelectedPkgId] = useState<string>(resolveInitialPkgId(initialPlan));
  const [billingCadence, setBillingCadence] = useState<'monthly' | 'one_time'>('monthly');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<'live' | 'sandbox_simulator'>('sandbox_simulator');
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);

  const selectedStandardPkg = PACKAGES.find((p) => p.id === selectedPkgId) || PACKAGES[1];

  const currentPkg: PricingPackage = retryInvoice
    ? {
        id: `retry-${retryInvoice.id}`,
        name: retryInvoice.plan,
        planKey: inferPlanKeyFromInvoice(retryInvoice.plan),
        priceXCD: retryInvoice.amountXCD,
        description:
          retryInvoice.description ||
          `Pending invoice settlement for ${retryInvoice.companyName} (${retryInvoice.invoiceNumber})`,
        features:
          retryInvoice.membershipFeatures && retryInvoice.membershipFeatures.length > 0
            ? retryInvoice.membershipFeatures
            : selectedStandardPkg.features,
      }
    : selectedStandardPkg;

  const priceUSDNumber = convertXcdToUsd(currentPkg.priceXCD, currencyPeg);

  useEffect(() => {
    if (isOpen) {
      if (retryInvoice) {
        const inferredPlan = inferPlanKeyFromInvoice(retryInvoice.plan);
        setSelectedPkgId(resolveInitialPkgId(inferredPlan));
        setBillingCadence(retryInvoice.billingInterval === 'one_time' ? 'one_time' : 'monthly');
      } else {
        setSelectedPkgId(resolveInitialPkgId(initialPlan));
      }
      setShowWebhookGuide(false);
    }
  }, [isOpen, initialPlan, retryInvoice]);

  useEffect(() => {
    if (!isOpen || !isStripePortalEnabled) return;
    let isCancelled = false;
    setSessionLoading(true);
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
        const secret = data.client_secret || data.clientSecret || null;
        if (secret || data.id) {
          setClientSecret(secret);
          setSessionId(stripSecretFromIntentId(data.id || secret || ''));
          setSessionMode(
            data.mode === 'sandbox_simulator' || String(secret || '').includes('sandbox')
              ? 'sandbox_simulator'
              : 'live'
          );
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
          setSessionLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, isStripePortalEnabled, selectedPkgId, billingCadence, currentPkg.name, currentPkg.priceXCD, retryTrigger, retryInvoice?.id]);

  const handlePaymentSuccess = (result: PaymentCompletionPayload) => {
    if (currentUser) {
      subscribeClientPlan(currentUser.id, currentPkg.planKey, 'Credit/Debit Card (XCD)', {
        skipEmail: true,
        transactionRef: result.chargeId || result.paymentIntentId,
      });
    }

    if (retryInvoice) {
      markInvoicePaid(retryInvoice.id, {
        paymentIntentId: result.paymentIntentId,
        paymentMethod: result.paymentMethodLabel,
        receiptUrl: result.receiptUrl,
        recipientEmail: result.billingEmail,
        companyName: result.cardholderName,
        idempotencyKey: result.idempotencyKey,
        portalUsed: 'Stripe Retry Checkout',
      });
    } else {
      addInvoice({
        recruiterId: currentRecruiter?.id || currentUser?.recruiterId || 'rec_fort_young',
        companyName: result.cardholderName,
        recipientEmail: result.billingEmail,
        contactPerson: currentUser?.name || currentRecruiter?.contactPerson || result.cardholderName,
        dssRegistrationNo: currentUser?.dssRegistrationNo || currentRecruiter?.dssRegistrationNo || 'DSS-DOM-VERIFIED',
        parish: result.billingParish || currentUser?.parish || currentRecruiter?.parish || 'St. George',
        paymentIntentId: result.paymentIntentId,
        idempotencyKey: result.idempotencyKey,
        invoiceNumber: result.invoiceNumber,
        date: new Date().toISOString().split('T')[0],
        plan: currentPkg.name,
        amountXCD: currentPkg.priceXCD,
        amountUSD: result.amountUSD,
        billingInterval: billingCadence,
        status: 'Paid',
        paymentMethod: result.paymentMethodLabel,
        receiptUrl: result.receiptUrl,
        membershipFeatures: currentPkg.features,
        stripeSubscriptionId:
          billingCadence === 'monthly'
            ? `sub_stripe_${result.paymentIntentId.slice(-8)}`
            : undefined,
      });
    }

    if (billingCadence === 'monthly' && currentRecruiter && result.savePaymentMethod) {
      toggleRecruiterAutoRenew(currentRecruiter.id, true);
    }

    if (onSuccess) onSuccess();
  };

  if (!isOpen) return null;

  const initialName = retryInvoice
    ? retryInvoice.companyName
    : currentRecruiter
    ? currentRecruiter.companyName
    : currentUser
    ? currentUser.name
    : 'Dominica Employer Ltd';

  const initialEmail = retryInvoice?.recipientEmail
    ? retryInvoice.recipientEmail
    : currentRecruiter
    ? currentRecruiter.email
    : currentUser
    ? currentUser.email
    : 'billing@company.dm';

  const topControls = (
    <div className="space-y-5">
      {retryInvoice && (
        <div
          data-testid="stripe-retry-invoice-banner"
          className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-1.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-orange-800 uppercase tracking-wider text-[11px]">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              Retrying Pending Invoice · {retryInvoice.invoiceNumber}
            </span>
            <span className="font-mono font-black text-slate-900">
              EC$ {retryInvoice.amountXCD.toLocaleString()} (~${priceUSDNumber.toFixed(2)} USD)
            </span>
          </div>
          <p className="font-bold text-slate-900">
            {retryInvoice.plan} — {retryInvoice.companyName}
          </p>
          {retryInvoice.description && (
            <p className="text-slate-600">{retryInvoice.description}</p>
          )}
          {retryInvoice.expiryDate && (
            <p className="text-[11px] font-semibold text-orange-700 font-mono tabular-nums">
              Payment Deadline: {new Date(retryInvoice.expiryDate).toLocaleString()}
            </p>
          )}
        </div>
      )}
      {sessionLoading && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-700">
          <div className="w-4 h-4 border-2 border-indigo-200 border-t-[#635BFF] rounded-full animate-spin shrink-0" />
          <span>Synchronizing secure Stripe session ({currentPkg.name})...</span>
        </div>
      )}

      {sessionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Checkout Session Initialization Notice</span>
          </div>
          <p className="text-rose-600">{sessionError}</p>
          <button
            type="button"
            onClick={() => setRetryTrigger((r) => r + 1)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Session Initialization</span>
          </button>
        </div>
      )}

      {!retryInvoice && (
        <>
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
                {sessionId ? ` · Session ${sessionId.slice(0, 12)}` : ''}
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
                      <span className="text-lg font-black text-slate-900">EC$ {pkg.priceXCD}</span>
                      <span className="text-[11px] text-slate-500 font-medium">≈ ${usd} USD</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{pkg.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const canMountLiveCheckoutForm = Boolean(
    !isMockPublishableKey &&
      clientSecret &&
      !clientSecret.includes('sandbox') &&
      sessionMode !== 'sandbox_simulator'
  );

  const pkgSummary = {
    id: currentPkg.id,
    name: currentPkg.name,
    priceXCD: currentPkg.priceXCD,
    priceUSDNumber,
    billingCadence,
  };

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
        <div className="bg-[#635BFF] text-white p-5 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="px-2 py-1 bg-white/20 rounded-md font-black text-sm tracking-tight flex items-center gap-1.5">
              <span>stripe</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/30 px-1 py-0.2 rounded">
                {isSandboxMode ? 'Sandbox' : 'Portal'}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                Nature Island Careers Payment Gateway
              </h2>
              <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-white" />
                <span>
                  256-bit End-to-End SSL Encrypted ·{' '}
                  {isSandboxMode ? 'Test / Sandbox Mode' : 'Live PCI-DSS Checkout'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="toggle-webhook-guide-btn"
              onClick={() => setShowWebhookGuide((v) => !v)}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="View Stripe Webhook Integration Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Webhook Guide</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close payment gateway modal"
              className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showWebhookGuide && (
          <div
            data-testid="stripe-webhook-guide-panel"
            className="bg-slate-950 text-slate-100 p-4 border-b border-slate-800 text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <strong className="text-emerald-300 font-bold">
                Stripe Webhook Auto-Sync Architecture (/api/stripe/webhook)
              </strong>
              <button
                type="button"
                onClick={() => setShowWebhookGuide(false)}
                className="text-slate-400 hover:text-white text-[11px] font-bold cursor-pointer"
              >
                Close Guide
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Verified via <code className="text-amber-300">stripe.webhooks.constructEvent</code> using
              raw request bytes (<code className="text-amber-300">req.rawBody</code>) and{' '}
              <code className="text-amber-300">STRIPE_WEBHOOK_SECRET</code>. Automatically syncs order
              and job listing payment statuses on{' '}
              <code className="text-emerald-300">checkout.session.completed</code> (verifying{' '}
              <code className="text-emerald-300">payment_status !== &apos;unpaid&apos;</code>),{' '}
              <code className="text-emerald-300">checkout.session.async_payment_succeeded</code>,{' '}
              <code className="text-emerald-300">payment_intent.succeeded</code>,{' '}
              <code className="text-rose-300">payment_intent.payment_failed</code>, and{' '}
              <code className="text-sky-300">charge.refunded</code>.
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-emerald-300">
              stripe listen --forward-to localhost:3000/api/stripe/webhook
            </div>
          </div>
        )}

        {!isStripePortalEnabled ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Stripe Merchant Checkout Temporarily Paused
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              An administrator has paused Stripe card checkout in the Merchant Payment Portals
              console. Please contact <strong>info@natureislecareers.com</strong> or use another
              enabled payment portal.
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
          <PaymentForm
            pkg={pkgSummary}
            currencyPeg={currencyPeg}
            isSandboxMode={isSandboxMode}
            publishableKey={STRIPE_PUBLISHABLE_KEY}
            initialName={initialName}
            initialEmail={initialEmail}
            clientSecret={clientSecret}
            hasLiveElements={false}
            useCheckoutFormSdk={canMountLiveCheckoutForm}
            onSuccess={handlePaymentSuccess}
            onClose={onClose}
            renderTopControls={topControls}
          />
        )}
      </div>
    </div>
  );
};
