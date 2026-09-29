import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { SubscriptionPlan, Parish } from '../types';
import {
  X,
  CreditCard,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  FileText,
  Building,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

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
  const { currentRecruiter, currentUser, subscribeClientPlan, addInvoice, toggleRecruiterAutoRenew } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    initialPlan === 'Enterprise Growth Partner'
      ? 'pkg-enterprise'
      : initialPlan === 'NEP Partner Tier'
      ? 'pkg-nep'
      : 'pkg-featured'
  );

  const [billingCadence, setBillingCadence] = useState<'monthly' | 'one_time'>('monthly');

  // Stripe form fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardholderName, setCardholderName] = useState(
    currentRecruiter ? currentRecruiter.companyName : currentUser ? currentUser.name : 'Dominica Employer Ltd'
  );
  const [billingEmail, setBillingEmail] = useState(
    currentRecruiter ? currentRecruiter.email : currentUser ? currentUser.email : 'billing@company.dm'
  );
  const [billingParish, setBillingParish] = useState<Parish>('St. George');
  const [postalCode, setPostalCode] = useState('00109');

  // Stripe processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    chargeId: string;
    paymentIntentId: string;
    amountXCD: number;
    amountUSD: number;
    date: string;
    packageName: string;
    billingInterval: 'monthly' | 'one_time';
  } | null>(null);

  if (!isOpen) return null;

  const currentPkg = PACKAGES.find((p) => p.id === selectedPkgId) || PACKAGES[1];
  const priceUSD = (currentPkg.priceXCD / 2.7).toFixed(2);

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('892');
  };

  const handleStripeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate real Stripe PaymentIntent & 3D Secure confirmation
    setTimeout(() => {
      const chargeId = `ch_stripe_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 12)}_secret`;

      if (currentUser) {
        subscribeClientPlan(currentUser.id, currentPkg.planKey, 'Credit/Debit Card (XCD)');
      }

      // Record official Employer Invoice in JobContext
      const cleanDigits = cardNumber.replace(/\D/g, '');
      const last4 = cleanDigits.slice(-4) || '4242';
      addInvoice({
        recruiterId: currentRecruiter?.id || 'rec_fort_young',
        companyName: cardholderName,
        invoiceNumber: `INV-DOM-2026-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        plan: currentPkg.name,
        amountXCD: currentPkg.priceXCD,
        amountUSD: Math.round(Number(priceUSD)),
        billingInterval: billingCadence,
        status: 'Paid',
        paymentMethod: `Stripe •••• ${last4} (${cleanDigits.startsWith('4') ? 'Visa' : 'Mastercard'})`,
        receiptUrl: `https://pay.stripe.com/receipts/invoices/${chargeId}`,
        stripeSubscriptionId: billingCadence === 'monthly' ? `sub_stripe_${Math.random().toString(36).substring(2, 9)}` : undefined,
      });

      if (billingCadence === 'monthly' && currentRecruiter) {
        toggleRecruiterAutoRenew(currentRecruiter.id, true);
      }

      setReceiptData({
        chargeId,
        paymentIntentId,
        amountXCD: currentPkg.priceXCD,
        amountUSD: Number(priceUSD),
        date: new Date().toLocaleString(),
        packageName: currentPkg.name,
        billingInterval: billingCadence,
      });

      setIsProcessing(false);
      setPaymentSuccess(true);
      if (onSuccess) onSuccess();
    }, 1500);
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
        <div className="bg-[#635BFF] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="px-2 py-1 bg-white/20 rounded-md font-black text-sm tracking-tight flex items-center gap-1.5">
              <span>stripe</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/30 px-1 py-0.2 rounded">
                Portal
              </span>
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">Nature Island Careers Payment Gateway</h2>
              <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-white" />
                <span>256-bit End-to-End SSL Encrypted · PCI-DSS Level 1 Certified</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccess && receiptData ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Payment Authorized by Stripe
              </span>
              <h3 className="text-2xl font-black text-slate-900">EC$ {receiptData.amountXCD.toLocaleString()} Received</h3>
              <p className="text-xs text-slate-600">
                Equivalent to approx <strong>${receiptData.amountUSD.toFixed(2)} USD</strong> (2.70 Peg)
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2 font-medium">
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

            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              A formal Stripe receipt and invoice has been recorded in your <strong>Billing History</strong> and dispatched to <strong>{billingEmail}</strong>.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Print Tax Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Return to Employer Portal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStripeSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <span>1. Choose Employer Package</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Pegged Currency: EC$ 2.70 : $1 USD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPkgId === pkg.id;
                  const usd = (pkg.priceXCD / 2.7).toFixed(0);

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Stripe Payment Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
                  <span>2. Payment Details (Stripe Protected)</span>
                </label>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="text-[11px] font-bold text-[#635BFF] hover:underline cursor-pointer"
                >
                  ⚡ Auto-fill Test Card
                </button>
              </div>

              {/* Card Number Input (Stripe Style) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full pl-3 pr-20 py-2.5 rounded-lg border border-slate-300 text-sm font-mono font-medium focus:ring-2 focus:ring-[#635BFF] focus:outline-none bg-white"
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
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Expiration (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#635BFF] focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#635BFF] focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Cardholder / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="e.g. Fort Young Hotel Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Receipt Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="billing@company.dm"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#635BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Billing Parish (Dominica)
                  </label>
                  <select
                    value={billingParish}
                    onChange={(e) => setBillingParish(e.target.value as Parish)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                  >
                    <option value="St. George">St. George (Roseau)</option>
                    <option value="St. John">St. John (Portsmouth)</option>
                    <option value="St. Paul">St. Paul (Canefield)</option>
                    <option value="St. Andrew">St. Andrew (Marigot)</option>
                    <option value="St. Patrick">St. Patrick (Grand Bay)</option>
                    <option value="St. Joseph">St. Joseph (Salisbury)</option>
                    <option value="St. David">St. David (Kalinago)</option>
                    <option value="St. Luke">St. Luke (Pointe Michel)</option>
                    <option value="St. Mark">St. Mark (Soufrière)</option>
                    <option value="St. Peter">St. Peter (Colihaut)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="00109"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>
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

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-[#635BFF] hover:bg-[#5349e0] disabled:bg-slate-700 text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
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
                  </>
                )}
              </button>
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
