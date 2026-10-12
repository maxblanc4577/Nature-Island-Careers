export type PasswordStrengthLevel = 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';

export interface PasswordCriteriaState {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  percentage: number;
  level: PasswordStrengthLevel;
  label: string;
  guidance: string;
  criteria: PasswordCriteriaState;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const criteria: PasswordCriteriaState = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9\s]/.test(password),
  };

  if (!password || password.length === 0) {
    return {
      score: 0,
      percentage: 0,
      level: 'Empty',
      label: 'Not entered',
      guidance: 'Use 8+ characters with upper/lowercase letters, numbers, and symbols.',
      criteria,
    };
  }

  const passedCount = [
    criteria.minLength,
    criteria.hasUppercase && criteria.hasLowercase,
    criteria.hasNumber,
    criteria.hasSpecial,
  ].filter(Boolean).length;

  let score: 0 | 1 | 2 | 3 | 4 = 1;
  if (password.length < 6) {
    score = 1;
  } else if (passedCount <= 1) {
    score = 1;
  } else if (passedCount === 2) {
    score = 2;
  } else if (passedCount === 3) {
    score = 3;
  } else {
    score = 4;
  }

  const levelMap: Record<1 | 2 | 3 | 4, PasswordStrengthLevel> = {
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  };

  const guidanceMap: Record<1 | 2 | 3 | 4, string> = {
    1: 'Weak password — add more characters, numbers, or symbols to protect your account.',
    2: 'Fair password — include uppercase letters and a special symbol for stronger security.',
    3: 'Good password — meets core security standards; add a symbol or extra length for maximum strength.',
    4: 'Strong password — meets all security requirements for Nature Island Careers.',
  };

  const level = levelMap[score];

  return {
    score,
    percentage: score * 25,
    level,
    label: `${level} (${score * 25}%)`,
    guidance: guidanceMap[score],
    criteria,
  };
}
