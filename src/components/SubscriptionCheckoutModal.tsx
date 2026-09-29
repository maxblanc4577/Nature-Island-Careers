import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { SubscriptionPlan } from '../types';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
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
  const { currentUser, subscribeClientPlan } = useJobContext();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('Enterprise Growth Partner');
  const [paymentMethod, setPaymentMethod] = useState<
    'National Bank of Dominica (NBD)' | 'Credit/Debit Card (XCD)' | 'Republic Bank / Wire'
  >('National Bank of Dominica (NBD)');
  
  // Card Details state
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [bankAccountNo, setBankAccountNo] = useState('NBD-40918-2026');

  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptTx, setReceiptTx] = useState<string | null>(null);

  if (!isOpen) return null;

  const planPrices: Record<SubscriptionPlan, number> = {
    'Standard Local Employer': 250,
    'Enterprise Growth Partner': 650,
    'NEP Partner Tier': 180,
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsProcessing(true);
    setTimeout(() => {
      subscribeClientPlan(currentUser.id, selectedPlan, paymentMethod);
      setIsProcessing(false);
      const fakeTx = `TX-DOM-${Math.floor(100000 + Math.random() * 900000)}`;
      setReceiptTx(fakeTx);
      if (onSuccess) onSuccess();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-display">
                Dominica Employer Subscription Gateway
              </h2>
              <p className="text-xs text-stone-500">
                Mandatory client registration & recruitment licensing fee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] text-xs text-stone-800 space-y-5">
          {receiptTx ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-stone-950 font-display">
                Client Subscription Verified & Activated!
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-stone-900">{currentUser?.companyName || currentUser?.name}</strong>. Your subscription has been authorized under Commonwealth of Dominica Labour exchange protocols.
              </p>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Plan Tier:</span>
                  <span className="font-bold text-emerald-950">{selectedPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Subscription Fee:</span>
                  <span className="font-mono font-bold text-stone-900">EC${planPrices[selectedPlan].toLocaleString()} XCD / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Channel:</span>
                  <span className="text-stone-800">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Remote Assignments:</span>
                  <span className="text-emerald-800 font-semibold">Enabled Island-wide</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Transaction Reference:</span>
                  <span className="font-mono text-emerald-900 font-semibold">{receiptTx}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Proceed to Recruiter Portal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-4">
              
              {/* Account summary banner */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Client / Organization:</span>
                  <span className="font-bold text-stone-900">{currentUser?.companyName || 'Registered Employer'}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">DSS Registration:</span>
                  <span className="font-mono font-semibold text-emerald-800">{currentUser?.dssRegistrationNo || 'DSS-DOM-VERIFIED'}</span>
                </div>
              </div>

              {/* Plan Selection Tiers */}
              <div>
                <label className="block font-bold text-stone-900 text-xs mb-2">
                  Select Employer Subscription Tier *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* Tier 1: Standard */}
                  <div
                    onClick={() => setSelectedPlan('Standard Local Employer')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPlan === 'Standard Local Employer'
                        ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-bold text-stone-900 text-xs">Standard Local</div>
                    <div className="text-base font-extrabold font-mono text-emerald-900 mt-1 tabular-nums">
                      EC$250<span className="text-[10px] font-normal text-stone-400">/mo</span>
                    </div>
                    <ul className="text-[10px] text-stone-500 mt-2 space-y-1">
                      <li>• 5 Active Vacancies</li>
                      <li>• Standard candidate dossier</li>
                      <li>• Email alert broadcasts</li>
                    </ul>
                  </div>

                  {/* Tier 2: Enterprise (Recommended) */}
                  <div
                    onClick={() => setSelectedPlan('Enterprise Growth Partner')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                      selectedPlan === 'Enterprise Growth Partner'
                        ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 bg-amber-500 text-stone-950 font-bold text-[9px] px-1.5 py-0.2 rounded-full uppercase">
                      Recommended
                    </span>
                    <div className="font-bold text-stone-900 text-xs">Enterprise Partner</div>
                    <div className="text-base font-extrabold font-mono text-emerald-900 mt-1 tabular-nums">
                      EC$650<span className="text-[10px] font-normal text-stone-400">/mo</span>
                    </div>
                    <ul className="text-[10px] text-stone-500 mt-2 space-y-1">
                      <li className="font-semibold text-emerald-800">• Unlimited Vacancies</li>
                      <li className="font-semibold text-emerald-800">• Remote Work Assignments</li>
                      <li>• Direct interview scheduler</li>
                    </ul>
                  </div>

                  {/* Tier 3: NEP Partner */}
                  <div
                    onClick={() => setSelectedPlan('NEP Partner Tier')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPlan === 'NEP Partner Tier'
                        ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600/30'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-bold text-stone-900 text-xs">NEP Host Tier</div>
                    <div className="text-base font-extrabold font-mono text-emerald-900 mt-1 tabular-nums">
                      EC$180<span className="text-[10px] font-normal text-stone-400">/mo</span>
                    </div>
                    <ul className="text-[10px] text-stone-500 mt-2 space-y-1">
                      <li>• Government Subsidized</li>
                      <li>• 15 Apprentice Vacancies</li>
                      <li>• Priority NEP Matching</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-stone-900 text-xs mb-2">
                  Dominican Payment Method *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('National Bank of Dominica (NBD)')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      paymentMethod === 'National Bank of Dominica (NBD)'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">NBD Direct Debit</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">National Bank of Dominica</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Credit/Debit Card (XCD)')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      paymentMethod === 'Credit/Debit Card (XCD)'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">Credit/Debit Card</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Visa / Mastercard (XCD)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Republic Bank / Wire')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      paymentMethod === 'Republic Bank / Wire'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">Republic Bank Wire</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Local Bank Transfer</div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Inputs */}
              {paymentMethod === 'Credit/Debit Card (XCD)' ? (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                        CVC Security Code
                      </label>
                      <input
                        type="text"
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
                  <label className="block text-[11px] font-semibold text-stone-800">
                    Corporate Account Reference / IBAN:
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-900"
                  />
                  <p className="text-[10px] text-stone-500">
                    Direct automated debit authorized through Eastern Caribbean Automated Clearing House (ECACH).
                  </p>
                </div>
              )}

              {/* Security Guarantee */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>
                  Authorized by the Commonwealth of Dominica Labour Division. Encrypted 256-bit checkout.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {isProcessing ? 'Processing Transaction...' : `Pay EC$${planPrices[selectedPlan].toLocaleString()} & Activate`}
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
