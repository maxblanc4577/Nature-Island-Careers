import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

export const PasswordStrengthIndicator: React.FC<{
  password: string;
  confirmPassword?: string;
  testIdPrefix?: string;
}> = ({ password, confirmPassword, testIdPrefix = 'password' }) => {
  const strength = evaluatePasswordStrength(password);
  const hasConfirm = typeof confirmPassword === 'string' && confirmPassword.length > 0;
  const passwordsMatch = hasConfirm && password === confirmPassword;

  const barColorMap: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'bg-stone-200',
    1: 'bg-rose-600',
    2: 'bg-amber-500',
    3: 'bg-emerald-500',
    4: 'bg-emerald-700',
  };

  const textColorMap: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'text-stone-500',
    1: 'text-rose-700',
    2: 'text-amber-700',
    3: 'text-emerald-700',
    4: 'text-emerald-800',
  };

  const checklistItems = [
    {
      key: 'minLength',
      label: '8+ characters',
      met: strength.criteria.minLength,
    },
    {
      key: 'mixedCase',
      label: 'Upper & lowercase (A-z)',
      met: strength.criteria.hasUppercase && strength.criteria.hasLowercase,
    },
    {
      key: 'hasNumber',
      label: 'At least 1 number (0-9)',
      met: strength.criteria.hasNumber,
    },
    {
      key: 'hasSpecial',
      label: 'Special symbol (!@#$)',
      met: strength.criteria.hasSpecial,
    },
  ];

  return (
    <div
      data-testid="password-strength-indicator"
      data-strength-prefix={testIdPrefix}
      className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2"
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-stone-700 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Password Strength</span>
        </span>
        <span
          data-testid="password-strength-label"
          className={`font-bold tabular-nums ${textColorMap[strength.score]}`}
        >
          {strength.label}
        </span>
      </div>

      {/* 4-Segment Progress Bar */}
      <div
        role="progressbar"
        aria-label="Password strength"
        aria-valuenow={strength.score}
        aria-valuemin={0}
        aria-valuemax={4}
        className="grid grid-cols-4 gap-1.5"
      >
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={`h-1.5 rounded-full transition-colors duration-150 ${
              strength.score >= segment ? barColorMap[strength.score] : 'bg-stone-200'
            }`}
          />
        ))}
      </div>

      <p className="text-[10px] text-stone-600 leading-snug">{strength.guidance}</p>

      {/* Real-Time Criteria Checklist */}
      <div
        data-testid="password-strength-checklist"
        className="grid grid-cols-2 gap-x-2 gap-y-1 pt-0.5"
      >
        {checklistItems.map((item) => (
          <div
            key={item.key}
            data-testid={`password-criterion-${item.key}`}
            className={`flex items-center gap-1 text-[10px] ${
              item.met ? 'text-emerald-800 font-semibold' : 'text-stone-500'
            }`}
          >
            <CheckCircle2
              className={`w-3 h-3 shrink-0 ${
                item.met ? 'text-emerald-600' : 'text-stone-300'
              }`}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {hasConfirm && (
        <div
          data-testid="password-match-indicator"
          className={`pt-1 border-t border-stone-200/80 flex items-center gap-1.5 text-[10px] font-semibold ${
            passwordsMatch ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {passwordsMatch ? (
            <>
              <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
              <span>Passwords match</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
              <span>Password confirmation does not match yet</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
