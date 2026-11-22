import React, { useState, useEffect, useRef } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { SubscriptionPlan } from '../types';
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
  const { currentUser, currentRecruiter, subscribeClientPlan, addInvoice, stripeSettings } = useJobContext();
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sandboxOutcome, setSandboxOutcome] = useState<SandboxPaymentOutcome>('success');
  const [receiptTx, setReceiptTx] = useState<string | null>(null);

  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey('nic_sub'));

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setReceiptTx(null);
      setIsProcessing(false);
      setSandboxOutcome('success');
      submitLockRef.current = false;
      idempotencyKeyRef.current = generateIdempotencyKey('nic_sub');
      if (portalsEnabled.nbd) {
        setPaymentMethod('National Bank of Dominica (NBD)');
      } else if (portalsEnabled.stripe) {
        setPaymentMethod('Credit/Debit Card (XCD)');
      } else if (portalsEnabled.republicBank) {
        setPaymentMethod('Republic Bank / Wire');
      }
    }
  }, [isOpen, portalsEnabled.nbd, portalsEnabled.stripe, portalsEnabled.republicBank]);

  useEffect(() => {
    idempotencyKeyRef.current = generateIdempotencyKey('nic_sub');
    setErrorMessage(null);
  }, [selectedPlan, paymentMethod]);

  if (!isOpen) return null;

  const planPrices: Record<SubscriptionPlan, number> = {
    'Standard Local Employer': 250,
    'Enterprise Growth Partner': 650,
    'NEP Partner Tier': 180,
  };

  const selectedPriceXCD = planPrices[selectedPlan];
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
      setErrorMessage(`${paymentMethod} is currently paused by an administrator. Please choose another channel.`);
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
        // Explicit sandbox error simulation for bank debit testing as well
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
          throw new Error('Network connection interrupted before reaching clearing house. Please retry.');
        }
      }

      subscribeClientPlan(currentUser.id, selectedPlan, paymentMethod);
      addInvoice({
        recruiterId: currentRecruiter?.id || currentUser.recruiterId || 'rec_fort_young',
        companyName: currentUser.companyName || currentUser.name,
        recipientEmail: currentUser.email,
        paymentIntentId: intentId,
        idempotencyKey: attemptIdemKey,
        invoiceNumber: `INV-DOM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        plan: selectedPlan,
        amountXCD: selectedPriceXCD,
        amountUSD: selectedPriceUSD,
        billingInterval: 'monthly',
        status: 'Paid',
        paymentMethod: paymentMethodLabel,
        receiptUrl,
      });

      setCardCvc('');
      setReceiptTx(txRef);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Subscription transaction could not be completed. Please try again.');
    } finally {
      setIsProcessing(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Dominica Employer Subscription Gateway"
        tabIndex={-1}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
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
            type="button"
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
                  <span className="font-mono font-bold text-stone-900">
                    EC${selectedPriceXCD.toLocaleString()} XCD / mo (~${selectedPriceUSD.toFixed(2)} USD)
                  </span>
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
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Proceed to Recruiter Portal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckout} noValidate className="space-y-4">
              {!currentUser && (
                <div role="alert" className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Please sign in to an employer account before completing subscription checkout.
                  </span>
                </div>
              )}

              {errorMessage && (
                <div role="alert" data-testid="subscription-checkout-error" className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-start justify-between gap-2">
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
                  <span className="text-stone-400 block text-[10px]">Client / Organization:</span>
                  <span className="font-bold text-stone-900">{currentUser?.companyName || currentUser?.name || 'Sign in required'}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">DSS Registration:</span>
                  <span className="font-mono font-semibold text-emerald-800">{currentUser?.dssRegistrationNo || 'DSS-DOM-VERIFIED'}</span>
                </div>
              </div>

              {/* Plan Selection Tiers */}
              <div>
                <span className="block font-bold text-stone-900 text-xs mb-2">
                  Select Employer Subscription Tier *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    aria-pressed={selectedPlan === 'Standard Local Employer'}
                    onClick={() => setSelectedPlan('Standard Local Employer')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
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
                  </button>

                  <button
                    type="button"
                    aria-pressed={selectedPlan === 'Enterprise Growth Partner'}
                    onClick={() => setSelectedPlan('Enterprise Growth Partner')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative ${
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
                  </button>

                  <button
                    type="button"
                    aria-pressed={selectedPlan === 'NEP Partner Tier'}
                    onClick={() => setSelectedPlan('NEP Partner Tier')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
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
                  </button>
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
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {portalsEnabled.nbd === false ? 'Temporarily paused' : 'National Bank of Dominica'}
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
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {portalsEnabled.stripe === false ? 'Temporarily paused' : 'Visa / Mastercard (XCD)'}
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
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {portalsEnabled.republicBank === false ? 'Temporarily paused' : 'Local Bank Transfer'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Inputs */}
              {paymentMethod === 'Credit/Debit Card (XCD)' ? (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div>
                    <label htmlFor="sub-card-number" className="block text-[11px] font-semibold text-stone-800 mb-1">
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
                      <label htmlFor="sub-card-expiry" className="block text-[11px] font-semibold text-stone-800 mb-1">
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
                      <label htmlFor="sub-card-cvc" className="block text-[11px] font-semibold text-stone-800 mb-1">
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
                  <label htmlFor="sub-bank-account" className="block text-[11px] font-semibold text-stone-800">
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
                    Direct automated debit authorized through Eastern Caribbean Automated Clearing House (ECACH).
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
                  <span>Authorized by the Commonwealth of Dominica Labour Division. Encrypted 256-bit checkout.</span>
                </div>
                <span className="font-mono font-bold shrink-0">≈ ${selectedPriceUSD.toFixed(2)} USD</span>
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
                  disabled={isProcessing || !isSelectedPortalEnabled}
                  className="flex items-center gap-1.5 px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>
                    {isProcessing ? 'Processing Transaction...' : `Pay EC$${selectedPriceXCD.toLocaleString()} & Activate`}
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
