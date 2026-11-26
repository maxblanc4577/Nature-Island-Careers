import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { Parish, JobSector, SubscriptionPlan } from '../types';
import { isValidEmail } from '../utils/paymentValidation';
import { EMPLOYER_MEMBERSHIP_PLANS } from '../utils/membershipPlans';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import {
  Building,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

const PARISHES: Parish[] = [
  'St. George',
  'St. John',
  'St. Paul',
  'St. Andrew',
  'St. Patrick',
  'St. Joseph',
  'St. David',
  'St. Luke',
  'St. Mark',
  'St. Peter',
  'Island-wide / Remote',
];

const SECTORS: JobSector[] = [
  'Eco-Tourism & Hospitality',
  'Renewable Energy & Geothermal',
  'Agriculture & Agro-Processing',
  'Healthcare & Medical',
  'Banking & Financial Services',
  'Information Technology & Digital',
  'Education & Training',
  'Logistics & Marine Services',
  'Public Sector & Cooperatives',
];

interface EmployerRegisterFormProps {
  onSuccess?: (proceedToCheckout: boolean) => void;
  onOpenAdminGateway?: (initialMode?: 'login' | 'register') => void;
}

export const EmployerRegisterForm: React.FC<EmployerRegisterFormProps> = ({
  onSuccess,
  onOpenAdminGateway,
}) => {
  const { registerClient, authenticateWithGoogle, authenticateWithGithub } = useJobContext();

  const [clCompany, setClCompany] = useState('');
  const [clName, setClName] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [clPassword, setClPassword] = useState('');
  const [clConfirmPassword, setClConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clPhone, setClPhone] = useState('+1 (767) 448-');
  const [clParish, setClParish] = useState<Parish>('St. George');
  const [clDss, setClDss] = useState('DSS-DOM-90124');
  const [clIndustry, setClIndustry] = useState<JobSector>('Eco-Tourism & Hospitality');
  const [clSelectedPlan, setClSelectedPlan] = useState<SubscriptionPlan>(
    'Enterprise Growth Partner'
  );
  const [proceedToCheckout, setProceedToCheckout] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clCompany.trim() || clCompany.trim().length < 2) {
      setFormError('Please enter your company or organization name.');
      return;
    }
    if (!clName.trim() || clName.trim().length < 2) {
      setFormError('Please enter the contact person or HR lead name.');
      return;
    }
    if (!isValidEmail(clEmail)) {
      setFormError('Please enter a valid business email address.');
      return;
    }
    if (clEmail.trim().toLowerCase() === 'info@natureislecareers.com') {
      setFormError(
        'info@natureislecareers.com is reserved exclusively for single administrator registration via the Admin Console Gateway.'
      );
      return;
    }
    if (clPassword && clPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (clPassword !== clConfirmPassword) {
      setFormError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    registerClient({
      companyName: clCompany.trim(),
      name: clName.trim(),
      email: clEmail.trim(),
      phone: clPhone.trim() || '+1 (767) 448-0100',
      parish: clParish,
      dssRegistrationNo: clDss.trim() || 'DSS-DOM-90124',
      industry: clIndustry,
      password: clPassword || undefined,
      selectedPlan: clSelectedPlan,
    });

    onSuccess?.(proceedToCheckout);
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      await authenticateWithGoogle('client', {
        companyName: clCompany || undefined,
        dssRegistrationNo: clDss || undefined,
        parish: clParish,
        phone: clPhone,
        careerSector: clIndustry,
      });
      onSuccess?.(false);
    } catch (err: any) {
      const message =
        err?.message && !err.message.includes('popup-closed-by-user')
          ? `Google authentication error: ${err.message}`
          : 'Google sign-in popup was closed before completing authentication.';
      setFormError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setFormError(null);
    setIsGithubLoading(true);
    try {
      await authenticateWithGithub('client', {
        companyName: clCompany || undefined,
        dssRegistrationNo: clDss || undefined,
        parish: clParish,
        phone: clPhone,
        careerSector: clIndustry,
      });
      onSuccess?.(false);
    } catch (err: any) {
      const message =
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/configuration-not-found'
          ? 'GitHub OAuth provider is not enabled yet in your Firebase project. Enable GitHub in Firebase Console > Authentication > Sign-in method.'
          : err?.message && !err.message.includes('popup-closed-by-user')
          ? `GitHub authentication error: ${err.message}`
          : 'GitHub sign-in popup was closed before completing authentication.';
      setFormError(message);
    } finally {
      setIsGithubLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleClientSubmit}
      className="space-y-3.5 text-xs"
      data-testid="employer-register-form"
    >
      {formError && (
        <div
          role="alert"
          data-testid="auth-form-error"
          className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <span className="block">{formError}</span>
            {onOpenAdminGateway && formError.includes('info@natureislecareers.com') && (
              <button
                type="button"
                data-testid="auth-open-admin-gateway-btn"
                onClick={() => onOpenAdminGateway('register')}
                className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                <span>Open Single Admin Registration Gateway</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1">
        <div className="font-semibold flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-amber-800" />
          Dominica Employer &amp; Recruiter Account
        </div>
        <p>
          Register your organization with your Dominica Social Security (DSS) employer number to
          access the Employer Command Center, post vacancies, and manage applicants.
        </p>
      </div>

      <div>
        <label htmlFor="cl-company" className="block font-semibold text-stone-900 mb-1">
          Company / Organization Name *
        </label>
        <input
          id="cl-company"
          data-testid="employer-register-company"
          type="text"
          required
          value={clCompany}
          onChange={(e) => setClCompany(e.target.value)}
          placeholder="e.g. Rosalie Bay Eco-Resort & Spa"
          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cl-name" className="block font-semibold text-stone-900 mb-1">
            Contact Person / HR Lead *
          </label>
          <input
            id="cl-name"
            data-testid="employer-register-name"
            type="text"
            required
            value={clName}
            onChange={(e) => setClName(e.target.value)}
            placeholder="e.g. Marise Shillingford"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
          />
        </div>
        <div>
          <label htmlFor="cl-email" className="block font-semibold text-stone-900 mb-1">
            Business Email Address *
          </label>
          <input
            id="cl-email"
            data-testid="employer-register-email"
            type="email"
            required
            value={clEmail}
            onChange={(e) => setClEmail(e.target.value)}
            placeholder="hr@rosaliebay.dm"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cl-password" className="block font-semibold text-stone-900 mb-1">
            Employer Password *
          </label>
          <div className="relative">
            <input
              id="cl-password"
              data-testid="employer-register-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={clPassword}
              onChange={(e) => setClPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full pl-3 pr-16 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
            />
            <button
              type="button"
              data-testid="toggle-employer-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 hover:text-stone-900 rounded flex items-center gap-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="cl-confirm-password" className="block font-semibold text-stone-900 mb-1">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              id="cl-confirm-password"
              data-testid="employer-register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={clConfirmPassword}
              onChange={(e) => setClConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full pl-3 pr-16 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
            />
            <button
              type="button"
              data-testid="toggle-employer-confirm-password-btn"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              aria-pressed={showConfirmPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 hover:text-stone-900 rounded flex items-center gap-1 cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>
      </div>

      <PasswordStrengthIndicator
        password={clPassword}
        confirmPassword={clConfirmPassword}
        testIdPrefix="employer"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cl-phone" className="block font-semibold text-stone-900 mb-1">
            Business Phone *
          </label>
          <input
            id="cl-phone"
            data-testid="employer-register-phone"
            type="tel"
            required
            value={clPhone}
            onChange={(e) => setClPhone(e.target.value)}
            placeholder="+1 (767) 448-5000"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
          />
        </div>
        <div>
          <label htmlFor="cl-dss" className="block font-semibold text-stone-900 mb-1">
            DSS Registration Number *
          </label>
          <input
            id="cl-dss"
            data-testid="employer-register-dss"
            type="text"
            required
            value={clDss}
            onChange={(e) => setClDss(e.target.value)}
            placeholder="DSS-DOM-XXXXX"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cl-parish" className="block font-semibold text-stone-900 mb-1">
            Parish Headquarters *
          </label>
          <select
            id="cl-parish"
            data-testid="employer-register-parish"
            value={clParish}
            onChange={(e) => setClParish(e.target.value as Parish)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
          >
            {PARISHES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cl-industry" className="block font-semibold text-stone-900 mb-1">
            Primary Industry Sector
          </label>
          <select
            id="cl-industry"
            data-testid="employer-register-industry"
            value={clIndustry}
            onChange={(e) => setClIndustry(e.target.value as JobSector)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Select Employer Membership Plan */}
      <div data-testid="employer-register-membership-section" className="space-y-1.5">
        <span className="block font-semibold text-stone-900">
          Select Employer Membership Tier *
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {EMPLOYER_MEMBERSHIP_PLANS.map((tier) => {
            const isSelected = clSelectedPlan === tier.plan;
            return (
              <button
                key={tier.plan}
                type="button"
                data-testid={`employer-register-plan-${tier.plan.replace(/\s+/g, '-').toLowerCase()}`}
                aria-pressed={isSelected}
                onClick={() => setClSelectedPlan(tier.plan)}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                }`}
              >
                <div className="font-bold text-[11px] leading-tight">{tier.shortLabel}</div>
                <div className="font-mono font-extrabold text-sm text-emerald-900 tabular-nums mt-0.5">
                  EC${tier.priceXCD}
                  <span className="text-[10px] font-normal text-stone-500">/mo</span>
                </div>
                <div className="text-[10px] text-stone-600 mt-0.5 leading-snug">
                  {tier.quotaPostings >= 999
                    ? 'Unlimited Vacancies · WIN Remote'
                    : `${tier.quotaPostings} Active Vacancies`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-stone-700 cursor-pointer pt-1">
        <input
          type="checkbox"
          data-testid="employer-proceed-to-checkout-checkbox"
          checked={proceedToCheckout}
          onChange={(e) => setProceedToCheckout(e.target.checked)}
          className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
        />
        <span>
          Proceed to payment verification &amp; generate membership invoice after signup
        </span>
      </label>

      <div className="pt-2 space-y-2.5">
        <button
          type="submit"
          data-testid="submit-employer-register-btn"
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Building className="w-4 h-4" />
          <span>Create Employer Account</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="employer-google-auth-btn"
            disabled={isGoogleLoading || isGithubLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 text-[11px]"
          >
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            data-testid="employer-github-auth-btn"
            disabled={isGoogleLoading || isGithubLoading}
            onClick={handleGithubSignIn}
            className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white border border-stone-900 rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 text-[11px]"
          >
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    </form>
  );
};
