import React, { useState, useRef, useEffect } from 'react';
import {
  PaymentElement,
  LinkAuthenticationElement,
  AddressElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Parish, JobSector } from '../types';
import {
  SandboxPaymentOutcome,
  isValidEmail,
  validateCardNumber,
  validateCardExpiry,
  validateCardCvc,
  detectCardBrandAndLast4,
  stripSecretFromIntentId,
  generateIdempotencyKey,
} from '../utils/paymentValidation';
import {
  PaymentLogging,
  PaymentLogEntry,
  MappedStripeError,
  mapStripeErrorCode,
  executeWithExponentialBackoff,
  TransientPaymentError,
} from '../utils/paymentLogger';
import {
  PaymentStatusDisplay,
  PaymentReceiptSummary,
  RetryAttemptState,
} from './PaymentStatusDisplay';

export interface PaymentPackageSummary {
  id: string;
  name: string;
  priceXCD: number;
  priceUSDNumber: number;
  billingCadence: 'monthly' | 'one_time';
}

export interface PaymentCompletionPayload {
  chargeId: string;
  paymentIntentId: string;
  invoiceNumber: string;
  amountXCD: number;
  amountUSD: number;
  billingInterval: 'monthly' | 'one_time';
  paymentMethodLabel: string;
  receiptUrl: string;
  cardholderName: string;
  billingEmail: string;
  billingParish: Parish;
  idempotencyKey: string;
  savePaymentMethod: boolean;
}

export const STRIPE_CHECKOUT_FORM_APPEARANCE = {
  theme: 'stripe',
  labels: 'auto',
  inputs: 'spaced',
  variables: {
    borderRadius: '4px',
    colorBackground: '#ffffff',
    colorDanger: '#df1b41',
    colorPrimary: '#0570de',
    colorSuccess: '#00c853',
    colorText: '#30313d',
    fontFamily: 'default',
    fontSizeBase: '16px',
    spacingUnit: '4px',
  },
} as const;

interface PaymentFormProps {
  pkg: PaymentPackageSummary;
  currencyPeg: number;
  isSandboxMode: boolean;
  publishableKey: string;
  initialName: string;
  initialEmail: string;
  clientSecret?: string | null;
  hasLiveElements?: boolean;
  useCheckoutFormSdk?: boolean;
  onSuccess: (result: PaymentCompletionPayload) => void;
  onClose: () => void;
  retryBackoffBaseMs?: number;
  maxRetries?: number;
  renderTopControls?: React.ReactNode;
}

interface DahliaCheckoutFormSectionProps {
  publishableKey: string;
  clientSecret: string;
  onConfirmStart: () => void;
  onConfirmSuccess: (session: any) => void;
  onConfirmError: (err: any) => void;
}

const DahliaCheckoutFormSection: React.FC<DahliaCheckoutFormSectionProps> = ({
  publishableKey,
  clientSecret,
  onConfirmStart,
  onConfirmSuccess,
  onConfirmError,
}) => {
  const [mountError, setMountError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !clientSecret) return;
    let cancelled = false;
    let mountedForm: { unmount?: () => void; destroy?: () => void } | null = null;

    const mountCheckoutForm = async () => {
      try {
        const stripeGlobal = (window as any).Stripe;
        if (typeof stripeGlobal !== 'function') {
          throw new Error(
            'Stripe.js (https://js.stripe.com/dahlia/stripe.js) has not loaded yet. Please refresh and try again.'
          );
        }

        const stripe = stripeGlobal(publishableKey);
        const clientSecretPromise = Promise.resolve(clientSecret);
        const checkout = stripe.initCheckoutFormSdk({
          clientSecret: clientSecretPromise,
          appearance: STRIPE_CHECKOUT_FORM_APPEARANCE,
        });

        const form = checkout.createForm({ layout: 'expanded' });
        mountedForm = form;
        form.mount('#checkout-form');

        const loadActionsResult = await checkout.loadActions();
        if (!cancelled && loadActionsResult.type === 'success') {
          form.on('confirm', async (event: any) => {
            try {
              onConfirmStart();
              const confirmResult = await loadActionsResult.actions.confirm({
                formConfirmEvent: event,
              });
              if (confirmResult?.type === 'error') {
                onConfirmError(confirmResult.error);
                return;
              }
              onConfirmSuccess(confirmResult?.session);
            } catch (error) {
              console.error('Payment confirmation error:', error);
              onConfirmError(error);
            }
          });
        } else if (!cancelled && loadActionsResult?.type === 'error') {
          setMountError(loadActionsResult.error?.message || 'Unable to load Stripe Checkout actions.');
        }
      } catch (err: any) {
        if (!cancelled) {
          setMountError(err?.message || 'Unable to mount Stripe Embedded Checkout form.');
        }
      }
    };

    mountCheckoutForm();

    return () => {
      cancelled = true;
      try {
        mountedForm?.unmount?.();
        mountedForm?.destroy?.();
      } catch {
        // Ignore cleanup errors if element already unmounted
      }
    };
  }, [publishableKey, clientSecret]);

  return (
    <div className="space-y-3" data-testid="stripe-dahlia-checkout-container">
      {mountError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mountError}</span>
        </div>
      )}
      <div
        id="checkout-form"
        data-testid="stripe-dahlia-checkout-form"
        className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs min-h-[240px]"
      />
    </div>
  );
};

interface StripeElementsFieldsProps {
  billingEmail: string;
  onEmailChange: (email: string) => void;
}

const LiveStripeElementsFields: React.FC<StripeElementsFieldsProps> = ({
  billingEmail,
  onEmailChange,
}) => {
  return (
    <div className="space-y-4" data-testid="stripe-live-elements-container">
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <LinkAuthenticationElement
          options={{ defaultValues: { email: billingEmail } }}
          onChange={(ev: any) => {
            if (ev?.value?.email) onEmailChange(ev.value.email);
          }}
        />
      </div>
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <AddressElement
          options={{
            mode: 'billing',
            defaultValues: {
              address: { country: 'DM' },
            },
          }}
        />
      </div>
    </div>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  pkg,
  currencyPeg,
  isSandboxMode,
  publishableKey,
  initialName,
  initialEmail,
  clientSecret,
  hasLiveElements = false,
  useCheckoutFormSdk = false,
  onSuccess,
  onClose,
  retryBackoffBaseMs = 350,
  maxRetries = 2,
  renderTopControls,
}) => {
  const stripe = hasLiveElements ? useStripe() : null;
  const elements = hasLiveElements ? useElements() : null;

  const [status, setStatus] = useState<'idle' | 'processing' | 'succeeded' | 'error'>('idle');
  const [checkoutMode, setCheckoutMode] = useState<'embedded_form' | 'custom_card'>('embedded_form');
  const [elementResetKey, setElementResetKey] = useState(0);

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('892');
  const [cardholderName, setCardholderName] = useState(initialName);
  const [billingEmail, setBillingEmail] = useState(initialEmail);
  const [billingParish, setBillingParish] = useState<Parish>('St. George');
  const [postalCode, setPostalCode] = useState('00109');
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [sandboxOutcome, setSandboxOutcome] = useState<SandboxPaymentOutcome>('success');

  const [errorInfo, setErrorInfo] = useState<MappedStripeError | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceiptSummary | null>(null);
  const [logs, setLogs] = useState<PaymentLogEntry[]>(() => PaymentLogging.getLogs());
  const [retryState, setRetryState] = useState<RetryAttemptState>({
    retrying: false,
    attempt: 0,
    maxRetries,
  });

  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey('nic_stripe'));
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setCardholderName(initialName);
    setBillingEmail(initialEmail);
  }, [initialName, initialEmail]);

  useEffect(() => {
    idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
    setErrorInfo(null);
    if (status === 'error') setStatus('idle');
  }, [pkg.id, pkg.billingCadence]);

  const appendLog = (entry: Parameters<typeof PaymentLogging.log>[0]) => {
    PaymentLogging.log(entry);
    if (isMountedRef.current) {
      setLogs(PaymentLogging.getLogs());
    }
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('892');
    setErrorInfo(null);
    if (status === 'error') setStatus('idle');
  };

  const handleResetAndRetry = () => {
    abortControllerRef.current?.abort();
    idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
    setElementResetKey((k) => k + 1);
    setErrorInfo(null);
    setStatus('idle');
    setRetryState({ retrying: false, attempt: 0, maxRetries });
    appendLog({
      event: 'element_reset',
      status: 'info',
      message: 'Stripe Elements card form reset for new payment attempt.',
      amountXCD: pkg.priceXCD,
      amountUSD: pkg.priceUSDNumber,
    });
  };

  const handleCancelCheckout = () => {
    abortControllerRef.current?.abort();
    idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
    const mapped = mapStripeErrorCode('payment_canceled');
    setErrorInfo(mapped);
    setStatus('error');
    setRetryState({ retrying: false, attempt: 0, maxRetries });
    appendLog({
      event: 'payment_canceled',
      status: 'warning',
      message: 'Payment checkout was canceled by user before capture.',
      errorCode: mapped.code,
      amountXCD: pkg.priceXCD,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || status === 'processing') return;

    const useLiveStripeSdk = Boolean(hasLiveElements && stripe && elements && clientSecret && !isSandboxMode);

    if (!useLiveStripeSdk) {
      if (!cardholderName.trim() || cardholderName.trim().length < 2) {
        setErrorInfo(
          mapStripeErrorCode('validation_error', {
            code: 'validation_error',
            message: 'Please enter a valid cardholder or company name.',
          })
        );
        setStatus('error');
        return;
      }
      if (!isValidEmail(billingEmail)) {
        setErrorInfo(
          mapStripeErrorCode('validation_error', {
            code: 'validation_error',
            message: 'Please enter a valid receipt email address (e.g. billing@company.dm).',
          })
        );
        setStatus('error');
        return;
      }
      const cardCheck = validateCardNumber(cardNumber);
      if (!cardCheck.valid) {
        setErrorInfo(mapStripeErrorCode('invalid_number', { message: cardCheck.error }));
        setStatus('error');
        return;
      }
      const expiryCheck = validateCardExpiry(cardExpiry);
      if (!expiryCheck.valid) {
        setErrorInfo(mapStripeErrorCode('expired_card', { message: expiryCheck.error }));
        setStatus('error');
        return;
      }
      const cvcCheck = validateCardCvc(cardCvc);
      if (!cvcCheck.valid) {
        setErrorInfo(mapStripeErrorCode('incorrect_cvc', { message: cvcCheck.error }));
        setStatus('error');
        return;
      }
    }

    submitLockRef.current = true;
    setStatus('processing');
    setErrorInfo(null);
    setRetryState({ retrying: false, attempt: 0, maxRetries });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const { brand, last4 } = detectCardBrandAndLast4(cardNumber);
    const attemptIdemKey = idempotencyKeyRef.current;

    appendLog({
      event: 'payment_attempt',
      status: 'info',
      message: `Initiating Stripe payment for ${pkg.name} (EC$ ${pkg.priceXCD})`,
      amountXCD: pkg.priceXCD,
      amountUSD: pkg.priceUSDNumber,
      metadata: { cadence: pkg.billingCadence, sandbox: isSandboxMode },
    });

    try {
      const confirmedPayload = await executeWithExponentialBackoff<PaymentCompletionPayload>({
        maxRetries,
        baseDelayMs: retryBackoffBaseMs,
        maxDelayMs: Math.max(retryBackoffBaseMs * 4, 1500),
        signal: controller.signal,
        onRetryScheduled: ({ attempt, maxRetries: max, delayMs, reason }) => {
          if (!isMountedRef.current) return;
          setRetryState({ retrying: true, attempt, maxRetries: max, nextDelayMs: delayMs });
          appendLog({
            event: 'retry_scheduled',
            status: 'warning',
            attemptNumber: attempt,
            message: `Auto-retry ${attempt}/${max} scheduled in ${delayMs}ms (${reason})`,
            amountXCD: pkg.priceXCD,
          });
        },
        operation: async () => {
          if (useLiveStripeSdk && stripe && elements) {
            const confirmResult = await stripe.confirmPayment({
              elements,
              confirmParams: {
                return_url:
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/?payment_success=true`
                    : 'https://natureislecareers.com/?payment_success=true',
                receipt_email: billingEmail.trim(),
              },
              redirect: 'if_required',
            });

            if (confirmResult.error) {
              const mapped = mapStripeErrorCode(confirmResult.error.code, {
                code: confirmResult.error.code,
                decline_code: confirmResult.error.decline_code,
                type: confirmResult.error.type,
                message: confirmResult.error.message,
              });
              if (mapped.isTransient) {
                throw new TransientPaymentError(mapped.userMessage, { code: mapped.code });
              }
              const fatal = new Error(mapped.userMessage) as Error & {
                code?: string;
                mapped?: MappedStripeError;
              };
              fatal.code = mapped.code;
              fatal.mapped = mapped;
              throw fatal;
            }

            const pi = confirmResult.paymentIntent;
            const safeIntentId = stripSecretFromIntentId(pi?.id || clientSecret || `pi_live_${Date.now()}`);
            return {
              chargeId: `ch_live_${safeIntentId.slice(-8).toUpperCase()}`,
              paymentIntentId: safeIntentId,
              invoiceNumber: `INV-DOM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              amountXCD: pkg.priceXCD,
              amountUSD: pkg.priceUSDNumber,
              billingInterval: pkg.billingCadence,
              paymentMethodLabel: `Stripe Card (${pi?.payment_method_types?.[0] || 'Card'})`,
              receiptUrl: `https://pay.stripe.com/receipts/invoices/${safeIntentId}`,
              cardholderName: cardholderName.trim(),
              billingEmail: billingEmail.trim(),
              billingParish,
              idempotencyKey: attemptIdemKey,
              savePaymentMethod,
            };
          }

          // Sandbox or server-orchestrated PaymentIntent workflow
          const intentRes = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': `${attemptIdemKey}_intent`,
            },
            body: JSON.stringify({
              amountXCD: pkg.priceXCD,
              description: pkg.name,
              customerEmail: billingEmail.trim(),
              employerName: cardholderName.trim(),
              billingInterval: pkg.billingCadence,
              idempotencyKey: `${attemptIdemKey}_intent`,
            }),
          });

          const intentData = await intentRes.json().catch(() => ({}));
          if (!intentRes.ok || !intentData.id) {
            if ([408, 429, 502, 503, 504].includes(intentRes.status) && intentData.code !== 'portal_disabled') {
              throw new TransientPaymentError(
                intentData.error || `Temporary Stripe gateway status ${intentRes.status}`,
                { status: intentRes.status, code: intentData.code }
              );
            }
            const err = new Error(
              intentData.error || `Unable to create payment intent (${intentRes.status}).`
            ) as Error & { status?: number; code?: string };
            err.status = intentRes.status;
            err.code = intentData.code;
            throw err;
          }

          const confirmRes = await fetch('/api/stripe/confirm-payment-intent', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': attemptIdemKey,
            },
            body: JSON.stringify({
              paymentIntentId: stripSecretFromIntentId(intentData.id),
              planName: pkg.name,
              amountXCD: pkg.priceXCD,
              employerName: cardholderName.trim(),
              customerEmail: billingEmail.trim(),
              billingInterval: pkg.billingCadence,
              cardLast4: last4,
              cardBrand: brand,
              idempotencyKey: attemptIdemKey,
              simulateOutcome: isSandboxMode ? sandboxOutcome : 'success',
            }),
          });

          const confirmData = await confirmRes.json().catch(() => ({}));
          if (!confirmRes.ok || !confirmData.success) {
            if ([408, 429, 502, 503, 504].includes(confirmRes.status) && confirmData.code !== 'portal_disabled') {
              throw new TransientPaymentError(
                confirmData.error || `Gateway temporary status ${confirmRes.status}`,
                { status: confirmRes.status, code: confirmData.code }
              );
            }
            const err = new Error(
              confirmData.error || `Payment could not be completed (status ${confirmRes.status}).`
            ) as Error & { status?: number; code?: string };
            err.status = confirmRes.status;
            err.code = confirmData.code;
            throw err;
          }

          const safeIntentId = stripSecretFromIntentId(confirmData.paymentIntentId || intentData.id);
          return {
            chargeId: confirmData.chargeId,
            paymentIntentId: safeIntentId,
            invoiceNumber:
              confirmData.invoiceNumber || `INV-DOM-2026-${Math.floor(100 + Math.random() * 900)}`,
            amountXCD: pkg.priceXCD,
            amountUSD: Number(confirmData.amountUSD ?? pkg.priceUSDNumber),
            billingInterval: pkg.billingCadence,
            paymentMethodLabel: confirmData.paymentMethodLabel || `Stripe •••• ${last4} (${brand})`,
            receiptUrl:
              confirmData.receiptUrl || `https://pay.stripe.com/receipts/invoices/${confirmData.chargeId}`,
            cardholderName: cardholderName.trim(),
            billingEmail: billingEmail.trim(),
            billingParish,
            idempotencyKey: attemptIdemKey,
            savePaymentMethod,
          };
        },
      });

      if (!isMountedRef.current) return;

      setCardCvc('');
      setRetryState({ retrying: false, attempt: 0, maxRetries });
      setReceipt({
        chargeId: confirmedPayload.chargeId,
        paymentIntentId: confirmedPayload.paymentIntentId,
        invoiceNumber: confirmedPayload.invoiceNumber,
        amountXCD: confirmedPayload.amountXCD,
        amountUSD: confirmedPayload.amountUSD,
        date: new Date().toLocaleString(),
        packageName: pkg.name,
        billingInterval: confirmedPayload.billingInterval,
        paymentMethodLabel: confirmedPayload.paymentMethodLabel,
      });
      setStatus('succeeded');
      appendLog({
        event: 'payment_confirmed',
        status: 'success',
        paymentIntentId: confirmedPayload.paymentIntentId,
        chargeId: confirmedPayload.chargeId,
        amountXCD: confirmedPayload.amountXCD,
        amountUSD: confirmedPayload.amountUSD,
        message: `Authorized payment ${confirmedPayload.invoiceNumber} (${confirmedPayload.paymentMethodLabel})`,
      });
      onSuccess(confirmedPayload);
    } catch (err: any) {
      if (err?.name === 'AbortError' || !isMountedRef.current) return;
      idempotencyKeyRef.current = generateIdempotencyKey('nic_stripe');
      const mapped =
        err?.mapped ||
        mapStripeErrorCode(err?.code || err?.message, {
          code: err?.code,
          status: err?.status,
          message: err?.message,
        });
      setRetryState({ retrying: false, attempt: 0, maxRetries });
      setErrorInfo(mapped);
      setStatus('error');
      appendLog({
        event: mapped.isTransient ? 'retry_exhausted' : 'payment_error',
        status: 'error',
        errorCode: mapped.code,
        message: mapped.userMessage,
        amountXCD: pkg.priceXCD,
      });
    } finally {
      submitLockRef.current = false;
    }
  };

  if (status === 'succeeded' && receipt) {
    return (
      <PaymentStatusDisplay
        status="succeeded"
        receipt={receipt}
        errorInfo={null}
        logs={logs}
        currencyPeg={currencyPeg}
        billingEmail={billingEmail}
        cardholderName={cardholderName}
        billingParish={billingParish}
        onRetry={handleResetAndRetry}
        onDismissError={() => setErrorInfo(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
      <PaymentStatusDisplay
        status={status}
        receipt={receipt}
        errorInfo={errorInfo}
        logs={logs}
        currencyPeg={currencyPeg}
        billingEmail={billingEmail}
        cardholderName={cardholderName}
        billingParish={billingParish}
        retryState={retryState}
        onRetry={handleResetAndRetry}
        onDismissError={() => {
          setErrorInfo(null);
          if (status === 'error') setStatus('idle');
        }}
        onClose={onClose}
      />

      {renderTopControls}

      <div key={elementResetKey} className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-[#635BFF]" />
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

        {useCheckoutFormSdk && Boolean(clientSecret) && !clientSecret?.includes('sandbox') ? (
          <DahliaCheckoutFormSection
            publishableKey={publishableKey}
            clientSecret={clientSecret!}
            onConfirmStart={() => {
              setStatus('processing');
              setErrorInfo(null);
            }}
            onConfirmSuccess={(session) => {
              const safeIntentId = stripSecretFromIntentId(
                session?.id || clientSecret || `cs_live_${Date.now()}`
              );
              const payload: PaymentCompletionPayload = {
                chargeId: `ch_live_${safeIntentId.slice(-8).toUpperCase()}`,
                paymentIntentId: safeIntentId,
                invoiceNumber: `INV-DOM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                amountXCD: pkg.priceXCD,
                amountUSD: pkg.priceUSDNumber,
                billingInterval: pkg.billingCadence,
                paymentMethodLabel: 'Stripe Embedded Checkout Form',
                receiptUrl: `https://pay.stripe.com/receipts/invoices/${safeIntentId}`,
                cardholderName: cardholderName.trim(),
                billingEmail: billingEmail.trim(),
                billingParish,
                idempotencyKey: idempotencyKeyRef.current,
                savePaymentMethod,
              };
              setReceipt({
                chargeId: payload.chargeId,
                paymentIntentId: payload.paymentIntentId,
                invoiceNumber: payload.invoiceNumber,
                amountXCD: payload.amountXCD,
                amountUSD: payload.amountUSD,
                date: new Date().toLocaleString(),
                packageName: pkg.name,
                billingInterval: payload.billingInterval,
                paymentMethodLabel: payload.paymentMethodLabel,
              });
              setStatus('succeeded');
              onSuccess(payload);
            }}
            onConfirmError={(err) => {
              const mapped = mapStripeErrorCode(err?.code || err?.message, {
                code: err?.code,
                message: err?.message,
              });
              setErrorInfo(mapped);
              setStatus('error');
            }}
          />
        ) : hasLiveElements && !isSandboxMode && clientSecret ? (
          <LiveStripeElementsFields
            billingEmail={billingEmail}
            onEmailChange={(email) => setBillingEmail(email)}
          />
        ) : checkoutMode === 'embedded_form' ? (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800">Stripe Embedded Checkout Form</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 font-mono px-2 py-0.5 rounded">
                  pk: {publishableKey.slice(0, 12)}...
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

            <div
              id="checkout-form"
              className="p-5 bg-white border-2 border-indigo-100 rounded-xl shadow-xs space-y-4 transition-all"
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

        {isSandboxMode && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-amber-950 block">Sandbox Test Mode Scenario</span>
              <span className="text-[11px] text-amber-800">
                Transient timeouts & network failures automatically retry with exponential backoff
              </span>
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
              <option value="timeout">Simulate Gateway Timeout (Auto-Retries)</option>
              <option value="network_error">Simulate Network Failure (Auto-Retries)</option>
            </select>
          </div>
        )}
      </div>

      {/* Total and Submit */}
      {!(useCheckoutFormSdk && Boolean(clientSecret) && !clientSecret?.includes('sandbox')) && (
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Selected: {pkg.name}</span>
            <span className="font-bold text-amber-300">EC$ {pkg.priceXCD}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400">Processing Fee (Stripe Dominica):</span>
            <span className="text-emerald-400 font-semibold">Waived (EC$ 0.00)</span>
          </div>
          <div className="flex items-center justify-between font-black text-base">
            <span>Total Due:</span>
            <div className="text-right">
              <span className="text-white">EC$ {pkg.priceXCD}</span>
              <span className="block text-xs font-normal text-slate-400">
                ≈ ${pkg.priceUSDNumber.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelCheckout}
              disabled={status === 'processing'}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Cancel Charge
            </button>
            <button
              type="submit"
              disabled={status === 'processing'}
              data-testid="stripe-submit-btn"
              className="flex-1 py-3 bg-[#635BFF] hover:bg-[#5349e0] disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {retryState.retrying
                      ? `Retrying (${retryState.attempt}/${retryState.maxRetries})...`
                      : 'Authorizing Charge with Stripe...'}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay EC$ {pkg.priceXCD} with Stripe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Guaranteed by Stripe Financial
        </span>
        <span>•</span>
        <span>Dominica Social Security Verified</span>
      </div>
    </form>
  );
};
