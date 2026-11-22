export type SandboxPaymentOutcome =
  | 'success'
  | 'decline'
  | 'cancel'
  | 'timeout'
  | 'network_error';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function luhnCheck(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(raw: string): { valid: boolean; error?: string } {
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return { valid: false, error: 'Card number is required.' };
  }
  if (raw.includes('•')) {
    return { valid: false, error: 'Please enter the full 16-digit card number or click Fill Test Data.' };
  }
  if (digits.length < 13 || digits.length > 19) {
    return { valid: false, error: 'Card number must be between 13 and 19 digits.' };
  }
  if (!luhnCheck(digits)) {
    return { valid: false, error: 'Card number failed validation check. Please verify the digits.' };
  }
  return { valid: true };
}

export function validateCardExpiry(raw: string): { valid: boolean; error?: string } {
  const cleaned = raw.replace(/\s+/g, '');
  const match = cleaned.match(/^(\d{2})\/(\d{2,4})$/);
  if (!match) {
    return { valid: false, error: 'Expiration must be in MM/YY format.' };
  }
  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  if (match[2].length === 2) {
    year += 2000;
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Expiration month must be between 01 and 12.' };
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'Card is expired. Please provide a valid future expiration date.' };
  }
  return { valid: true };
}

export function validateCardCvc(raw: string): { valid: boolean; error?: string } {
  const digits = raw.trim();
  if (!/^\d{3,4}$/.test(digits)) {
    return { valid: false, error: 'CVC/CVV security code must be 3 or 4 digits.' };
  }
  return { valid: true };
}

export function validateBankAccountRef(raw: string): { valid: boolean; error?: string } {
  const trimmed = raw.trim();
  if (trimmed.length < 6 || !/^[A-Za-z0-9\-\s]{6,34}$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Please enter a valid corporate bank account reference or IBAN (at least 6 alphanumeric characters).',
    };
  }
  return { valid: true };
}

export function convertXcdToUsd(amountXCD: number, peg: number = 2.7): number {
  const safePeg = Number.isFinite(peg) && peg > 0 ? peg : 2.7;
  if (!Number.isFinite(amountXCD) || amountXCD <= 0) return 0;
  return Math.round((amountXCD / safePeg) * 100) / 100;
}

export function detectCardBrandAndLast4(raw: string): { brand: string; last4: string } {
  const digits = raw.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '4242';
  let brand = 'Card';
  if (digits.startsWith('4')) brand = 'Visa';
  else if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) brand = 'Mastercard';
  else if (/^3[47]/.test(digits)) brand = 'Amex';
  return { brand, last4 };
}

export function stripSecretFromIntentId(intentOrSecret: string): string {
  if (!intentOrSecret) return '';
  const idx = intentOrSecret.indexOf('_secret');
  return idx >= 0 ? intentOrSecret.slice(0, idx) : intentOrSecret;
}

export function generateIdempotencyKey(prefix: string = 'idem'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
