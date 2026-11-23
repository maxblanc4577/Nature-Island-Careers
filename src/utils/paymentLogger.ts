import { stripSecretFromIntentId } from './paymentValidation';

export type PaymentLogEventType =
  | 'session_init'
  | 'payment_attempt'
  | 'retry_scheduled'
  | 'retry_exhausted'
  | 'payment_confirmed'
  | 'payment_error'
  | 'payment_canceled'
  | 'element_reset'
  | 'webhook_verified';

export interface PaymentLogEntry {
  id: string;
  timestamp: string;
  event: PaymentLogEventType;
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
  errorCode?: string;
  errorType?: string;
  paymentIntentId?: string;
  chargeId?: string;
  amountXCD?: number;
  amountUSD?: number;
  attemptNumber?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface MappedStripeError {
  code: string;
  title: string;
  userMessage: string;
  actionSteps: string[];
  retryable: boolean;
  isTransient: boolean;
}

const SENSITIVE_KEY_PATTERN = /(card.?number|pan|cvc|cvv|secret|token|password|sk_live|sk_test|rk_live|rk_test)/i;
const SENSITIVE_VALUE_PATTERN = /(sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|rk_live_[A-Za-z0-9]+|rk_test_[A-Za-z0-9]+|_secret_[A-Za-z0-9]+)/gi;

export function sanitizePaymentMetadata(
  raw?: Record<string, unknown>
): Record<string, string | number | boolean> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const sanitized: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) continue;
    if (typeof value === 'string') {
      const cleaned = value.replace(SENSITIVE_VALUE_PATTERN, '[REDACTED]').slice(0, 240);
      sanitized[key] = cleaned;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function mapStripeErrorCode(
  codeOrMessage?: string | null,
  rawError?: { code?: string; decline_code?: string; type?: string; message?: string; status?: number }
): MappedStripeError {
  const rawCode = (
    rawError?.decline_code ||
    rawError?.code ||
    codeOrMessage ||
    ''
  )
    .toLowerCase()
    .trim();
  const msg = (rawError?.message || codeOrMessage || '').toLowerCase();

  if (rawCode === 'insufficient_funds' || msg.includes('insufficient_funds') || msg.includes('insufficient funds')) {
    return {
      code: 'insufficient_funds',
      title: 'Insufficient Funds',
      userMessage: 'Your issuing bank declined the charge due to insufficient available balance.',
      actionSteps: [
        'Verify your account balance or daily debit limit with your bank (e.g. NBD, Republic Bank, or FirstCaribbean).',
        'Try another Visa or Mastercard, or click Retry to enter updated card details.',
      ],
      retryable: true,
      isTransient: false,
    };
  }

  if (rawCode === 'expired_card' || msg.includes('expired_card') || msg.includes('expired')) {
    return {
      code: 'expired_card',
      title: 'Card Expired',
      userMessage: 'The expiration date entered is in the past or your card has expired.',
      actionSteps: [
        'Confirm the MM/YY expiration date printed on your physical or virtual card.',
        'Use a valid active card and submit again.',
      ],
      retryable: true,
      isTransient: false,
    };
  }

  if (rawCode === 'incorrect_cvc' || rawCode === 'invalid_cvc' || msg.includes('cvc') || msg.includes('security code')) {
    return {
      code: 'incorrect_cvc',
      title: 'Incorrect Security Code (CVC)',
      userMessage: 'The 3- or 4-digit CVC/CVV security code did not match your card issuer record.',
      actionSteps: [
        'Check the 3-digit code on the back of your card (or 4-digit code on the front for Amex).',
        'Click Try Again to re-enter your card security code.',
      ],
      retryable: true,
      isTransient: false,
    };
  }

  if (rawCode === 'incorrect_number' || rawCode === 'invalid_number' || msg.includes('card number')) {
    return {
      code: 'invalid_number',
      title: 'Invalid Card Number',
      userMessage: 'The card number could not be validated by the payment network.',
      actionSteps: [
        'Double-check all 16 digits of your card number.',
        'In Sandbox test mode, click "Fill Test Data" to use Visa test card 4242.',
      ],
      retryable: true,
      isTransient: false,
    };
  }

  if (rawCode === 'authentication_required' || rawCode === 'payment_intent_authentication_failure' || msg.includes('3d secure') || msg.includes('authentication')) {
    return {
      code: 'authentication_required',
      title: '3D Secure Verification Required',
      userMessage: 'Your bank requested 3D Secure (Verified by Visa / Mastercard ID Check) confirmation.',
      actionSteps: [
        'Ensure pop-ups are allowed and complete the one-time bank verification prompt.',
        'Click Retry Payment to re-initiate 3D Secure verification.',
      ],
      retryable: true,
      isTransient: false,
    };
  }

  if (rawCode === 'card_declined' || rawCode === 'generic_decline' || msg.includes('declined')) {
    return {
      code: 'card_declined',
      title: 'Card Declined by Issuer',
      userMessage: rawError?.message || 'Your card was declined by the issuing bank. No funds were captured.',
      actionSteps: [
        'Confirm international / e-commerce transactions in USD are enabled on your Caribbean bank card.',
        'Click Try Again to switch cards or update your payment method.',
      ],
      retryable: true,
      isTransient: false,
    };
  }

  if (rawCode === 'payment_canceled' || rawCode === 'canceled' || msg.includes('cancel')) {
    return {
      code: 'payment_canceled',
      title: 'Checkout Canceled',
      userMessage: 'Payment authorization was canceled before submission. Your card was not charged.',
      actionSteps: [
        'Select your preferred employer plan and submit whenever you are ready.',
      ],
      retryable: true,
      isTransient: false,
    };
  }

  if (
    rawCode === 'gateway_timeout' ||
    rawCode === 'timeout' ||
    rawError?.status === 408 ||
    rawError?.status === 504 ||
    msg.includes('timed out') ||
    msg.includes('timeout')
  ) {
    return {
      code: 'gateway_timeout',
      title: 'Gateway Timeout',
      userMessage: 'Stripe gateway timed out before confirming authorization. No charge was made.',
      actionSteps: [
        'Wait a few seconds for network congestion to clear.',
        'Our retry engine attempts automatic recovery on transient drops; you may also retry manually.',
      ],
      retryable: true,
      isTransient: true,
    };
  }

  if (
    rawCode === 'network_error' ||
    rawCode === 'api_connection_error' ||
    rawError?.status === 502 ||
    rawError?.status === 503 ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('unable to reach')
  ) {
    return {
      code: 'network_error',
      title: 'Transient Network Failure',
      userMessage: 'Connection to the Stripe payment gateway dropped temporarily. Your card was not charged.',
      actionSteps: [
        'Check your internet connection and verify no firewall is blocking Stripe.',
        'Click Retry Payment to re-submit safely with your idempotency guard.',
      ],
      retryable: true,
      isTransient: true,
    };
  }

  if (rawCode === 'portal_disabled' || rawError?.status === 503) {
    return {
      code: 'portal_disabled',
      title: 'Merchant Portal Temporarily Paused',
      userMessage: 'Stripe checkout is currently paused by the portal administrator.',
      actionSteps: [
        'Contact info@natureislecareers.com or use an alternate Dominica merchant portal.',
      ],
      retryable: false,
      isTransient: false,
    };
  }

  return {
    code: rawCode || 'processing_error',
    title: 'Payment Processing Error',
    userMessage:
      (rawError?.message || codeOrMessage || 'An unexpected error occurred while contacting Stripe. No charge was made.').replace(
        SENSITIVE_VALUE_PATTERN,
        '[REDACTED]'
      ),
    actionSteps: [
      'Review the billing fields and try again.',
      'If the issue persists, share the Payment Intent reference from the debug log with info@natureislecareers.com.',
    ],
    retryable: true,
    isTransient: false,
  };
}

const sessionLogs: PaymentLogEntry[] = [];

export const PaymentLogging = {
  log(entry: Omit<PaymentLogEntry, 'id' | 'timestamp'>): PaymentLogEntry {
    const safeIntentId = entry.paymentIntentId
      ? stripSecretFromIntentId(entry.paymentIntentId).replace(SENSITIVE_VALUE_PATTERN, '[REDACTED]')
      : undefined;

    const record: PaymentLogEntry = {
      id: `plog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
      paymentIntentId: safeIntentId,
      message: entry.message.replace(SENSITIVE_VALUE_PATTERN, '[REDACTED]'),
      metadata: sanitizePaymentMetadata(entry.metadata),
    };

    sessionLogs.unshift(record);
    if (sessionLogs.length > 50) {
      sessionLogs.pop();
    }

    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'test') {
      console.info('[PaymentLogger]', JSON.stringify(record));
    }

    return record;
  },

  getLogs(): PaymentLogEntry[] {
    return [...sessionLogs];
  },

  clear(): void {
    sessionLogs.length = 0;
  },
};

export interface RetryBackoffOptions<T> {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetryScheduled?: (info: { attempt: number; maxRetries: number; delayMs: number; reason: string }) => void;
  operation: (attempt: number) => Promise<T>;
}

export class TransientPaymentError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, opts?: { status?: number; code?: string }) {
    super(message);
    this.name = 'TransientPaymentError';
    this.status = opts?.status;
    this.code = opts?.code;
  }
}

export function isTransientFailureError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof TransientPaymentError) return true;
  const anyErr = err as { status?: number; code?: string; name?: string; message?: string };
  if (typeof anyErr.status === 'number' && [408, 429, 502, 503, 504].includes(anyErr.status)) {
    return true;
  }
  if (anyErr.code && ['network_error', 'gateway_timeout', 'api_connection_error'].includes(anyErr.code)) {
    return true;
  }
  if (anyErr.name === 'TypeError' && typeof anyErr.message === 'string' && /fetch|network/i.test(anyErr.message)) {
    return true;
  }
  return false;
}

const waitWithSignal = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export async function executeWithExponentialBackoff<T>({
  maxRetries = 3,
  baseDelayMs = 450,
  maxDelayMs = 4000,
  signal,
  shouldRetry = isTransientFailureError,
  onRetryScheduled,
  operation,
}: RetryBackoffOptions<T>): Promise<T> {
  let attempt = 0;
  // attempt = 0 is the initial call; retries run attempt = 1..maxRetries
  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    try {
      return await operation(attempt);
    } catch (err: unknown) {
      const anyErr = err as { name?: string; message?: string };
      if (anyErr?.name === 'AbortError' || signal?.aborted) {
        throw err;
      }
      if (attempt >= maxRetries || !shouldRetry(err, attempt)) {
        throw err;
      }
      attempt += 1;
      const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const delayMs = Math.round(exponential);
      onRetryScheduled?.({
        attempt,
        maxRetries,
        delayMs,
        reason: anyErr?.message || 'Transient network failure',
      });
      await waitWithSignal(delayMs, signal);
    }
  }
}
