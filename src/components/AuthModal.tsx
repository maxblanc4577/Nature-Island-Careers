import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { Parish, JobSector } from '../types';
import { evaluatePasswordStrength } from '../utils/passwordStrength';
import { sendFirebasePasswordReset } from '../firebase';
import {
  X,
  User,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Mail,
  ArrowLeft,
  RefreshCw,
  Link2,
} from 'lucide-react';

export type AuthModalMode =
  | 'jobseeker_register'
  | 'client_register'
  | 'login'
  | 'forgot_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireSubscription: () => void;
  initialMode?: AuthModalMode;
  onAuthSuccess?: (role: 'jobseeker' | 'client') => void;
}

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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onRequireSubscription,
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const {
    currentUser,
    registerJobseeker,
    registerClient,
    loginUser,
    authenticateWithGoogle,
    authenticateWithGithub,
    logoutUser,
    requestPasswordReset,
    confirmPasswordReset,
    users,
    recruiters,
  } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const [mode, setMode] = useState<AuthModalMode>(initialMode);

  // Forgot Password flow state
  const [recoveryStep, setRecoveryStep] = useState<
    'request_code' | 'verify_and_reset' | 'reset_complete'
  >('request_code');
  const [recoveryEmail, setRecoveryEmail] = useState('maxblanc10468@gmail.com');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [dispatchedCode, setDispatchedCode] = useState<string | null>(null);
  const [dispatchedResetLink, setDispatchedResetLink] = useState<string | null>(null);
  const [firebaseResetDispatched, setFirebaseResetDispatched] = useState<boolean>(false);
  const [isSendingReset, setIsSendingReset] = useState<boolean>(false);
  const [recoveryAccountName, setRecoveryAccountName] = useState<string>('');
  const [recoveryAccountRole, setRecoveryAccountRole] = useState<
    'jobseeker' | 'client' | 'admin'
  >('jobseeker');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [loginResetSuccessBanner, setLoginResetSuccessBanner] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
      setFormError(null);
      setLoginError(null);
      setRecoveryError(null);
      setRecoveryNotice(null);
      if (initialMode !== 'forgot_password') {
        setRecoveryStep('request_code');
      }
    }
  }, [isOpen, initialMode]);

  // Candidate (Job Seeker) registration fields
  const [jsName, setJsName] = useState('');
  const [jsEmail, setJsEmail] = useState('');
  const [jsPassword, setJsPassword] = useState('');
  const [jsConfirmPassword, setJsConfirmPassword] = useState('');
  const [jsPhone, setJsPhone] = useState('+1 (767) 275-');
  const [jsParish, setJsParish] = useState<Parish>('St. George');
  const [jsSector, setJsSector] = useState<JobSector>('Renewable Energy & Geothermal');
  const [jsSkills, setJsSkills] = useState('Project Management, SCADA Systems, Eco-Tourism');

  // Employer (Client) registration fields
  const [clCompany, setClCompany] = useState('');
  const [clName, setClName] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [clPassword, setClPassword] = useState('');
  const [clConfirmPassword, setClConfirmPassword] = useState('');
  const [clPhone, setClPhone] = useState('+1 (767) 448-');
  const [clParish, setClParish] = useState<Parish>('St. George');
  const [clDss, setClDss] = useState('DSS-DOM-90124');
  const [clIndustry, setClIndustry] = useState<JobSector>('Eco-Tourism & Hospitality');
  const [proceedToCheckout, setProceedToCheckout] = useState(false);

  // Login fields
  const [loginAccountType, setLoginAccountType] = useState<'all' | 'jobseeker' | 'client'>('all');
  const [loginEmail, setLoginEmail] = useState('maxblanc10468@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  if (!isOpen) return null;

  const handleJobseekerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!jsName.trim() || jsName.trim().length < 2) {
      setFormError('Please enter your full legal name (at least 2 characters).');
      return;
    }
    if (!jsEmail.trim() || !jsEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (jsPassword && jsPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (jsPassword !== jsConfirmPassword) {
      setFormError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    const skillsArray = jsSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    registerJobseeker({
      name: jsName.trim(),
      email: jsEmail.trim(),
      phone: jsPhone.trim() || '+1 (767) 275-0100',
      parish: jsParish,
      careerSector: jsSector,
      skills: skillsArray.length > 0 ? skillsArray : ['Professional Operations'],
      password: jsPassword || undefined,
    });
    onAuthSuccess?.('jobseeker');
    onClose();
  };

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
    if (!clEmail.trim() || !clEmail.includes('@')) {
      setFormError('Please enter a valid business email address.');
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
    });
    onAuthSuccess?.('client');
    onClose();
    if (proceedToCheckout) {
      onRequireSubscription();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedEmail = loginEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setLoginError('Please enter your registered email address.');
      return;
    }

    const roleFilter = loginAccountType === 'all' ? undefined : loginAccountType;
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === trimmedEmail &&
        u.role !== 'admin' &&
        (!roleFilter || u.role === roleFilter)
    );
    const matchedRecruiter =
      !matchedUser && (!roleFilter || roleFilter === 'client')
        ? recruiters.find((r) => r.email.toLowerCase() === trimmedEmail)
        : undefined;

    if (!matchedUser && !matchedRecruiter) {
      setLoginError(
        loginAccountType === 'client'
          ? 'No Employer account found with this email. Create an Employer account or select one below.'
          : loginAccountType === 'jobseeker'
          ? 'No Candidate account found with this email. Create a Candidate account or select one below.'
          : 'Account not found with this email. Select an account below or create a new account.'
      );
      return;
    }

    if (matchedUser?.password && loginPassword !== matchedUser.password) {
      setLoginError('Invalid password for this account. Please check your password and try again.');
      return;
    }

    const success = loginUser(trimmedEmail, loginPassword || undefined, roleFilter);
    if (success) {
      setLoginError(null);
      const targetRole = matchedUser?.role === 'client' || matchedRecruiter ? 'client' : 'jobseeker';
      onAuthSuccess?.(targetRole);
      onClose();
    } else {
      setLoginError('Unable to sign in with those credentials. Please verify your email and password.');
    }
  };

  const handleGoogleSignIn = async (role: 'jobseeker' | 'client') => {
    setFormError(null);
    setLoginError(null);
    setIsGoogleLoading(true);
    try {
      const account = await authenticateWithGoogle(role, {
        companyName: role === 'client' ? clCompany || undefined : undefined,
        dssRegistrationNo: role === 'client' ? clDss || undefined : undefined,
        parish: role === 'client' ? clParish : jsParish,
        phone: role === 'client' ? clPhone : jsPhone,
        careerSector: role === 'client' ? clIndustry : jsSector,
      });
      onAuthSuccess?.(account.role === 'client' ? 'client' : 'jobseeker');
      onClose();
    } catch (err: any) {
      const message =
        err?.message && !err.message.includes('popup-closed-by-user')
          ? `Google authentication error: ${err.message}`
          : 'Google sign-in popup was closed before completing authentication.';
      if (mode === 'login') {
        setLoginError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async (role: 'jobseeker' | 'client') => {
    setFormError(null);
    setLoginError(null);
    setIsGithubLoading(true);
    try {
      const account = await authenticateWithGithub(role, {
        companyName: role === 'client' ? clCompany || undefined : undefined,
        dssRegistrationNo: role === 'client' ? clDss || undefined : undefined,
        parish: role === 'client' ? clParish : jsParish,
        phone: role === 'client' ? clPhone : jsPhone,
        careerSector: role === 'client' ? clIndustry : jsSector,
      });
      onAuthSuccess?.(account.role === 'client' ? 'client' : 'jobseeker');
      onClose();
    } catch (err: any) {
      const message =
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/configuration-not-found'
          ? 'GitHub OAuth provider is not enabled yet in your Firebase project. Enable GitHub in Firebase Console > Authentication > Sign-in method.'
          : err?.message && !err.message.includes('popup-closed-by-user')
          ? `GitHub authentication error: ${err.message}`
          : 'GitHub sign-in popup was closed before completing authentication.';
      if (mode === 'login') {
        setLoginError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setIsGithubLoading(false);
    }
  };

  const openForgotPasswordFlow = () => {
    setMode('forgot_password');
    setRecoveryStep('request_code');
    setRecoveryEmail(loginEmail.trim() || 'maxblanc10468@gmail.com');
    setRecoveryCodeInput('');
    setDispatchedCode(null);
    setDispatchedResetLink(null);
    setFirebaseResetDispatched(false);
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryError(null);
    setRecoveryNotice(null);
    setLoginError(null);
  };

  const handleRequestRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoveryNotice(null);

    const result = requestPasswordReset(recoveryEmail);
    if (!result.success) {
      setRecoveryError(
        result.error || 'Could not send verification code. Please check your email address.'
      );
      return;
    }

    setIsSendingReset(true);
    const fbResult = await sendFirebasePasswordReset(recoveryEmail, result.code);
    setIsSendingReset(false);

    setDispatchedCode(result.code || null);
    setDispatchedResetLink(result.resetLink || fbResult.resetLink || null);
    setFirebaseResetDispatched(fbResult.sentViaFirebase);
    setRecoveryAccountName(result.accountName || 'Account Holder');
    setRecoveryAccountRole(result.accountRole || 'jobseeker');
    setRecoveryStep('verify_and_reset');
    setRecoveryNotice(
      `Password reset link and 6-digit verification code dispatched to ${recoveryEmail.trim()}.`
    );
  };

  const handleResendRecoveryCode = async () => {
    setRecoveryError(null);
    const result = requestPasswordReset(recoveryEmail);
    if (!result.success) {
      setRecoveryError(result.error || 'Unable to resend verification code.');
      return;
    }
    const fbResult = await sendFirebasePasswordReset(recoveryEmail, result.code);
    setDispatchedCode(result.code || null);
    setDispatchedResetLink(result.resetLink || fbResult.resetLink || null);
    setFirebaseResetDispatched(fbResult.sentViaFirebase);
    setRecoveryNotice(
      `A new password reset link and 6-digit verification code were sent to ${recoveryEmail.trim()}.`
    );
  };

  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!recoveryCodeInput.trim() || recoveryCodeInput.trim().length < 6) {
      setRecoveryError('Please enter the 6-digit email verification code.');
      return;
    }
    if (!recoveryNewPassword || recoveryNewPassword.length < 6) {
      setRecoveryError('New password must be at least 6 characters long.');
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('New password and confirmation do not match.');
      return;
    }

    const result = confirmPasswordReset(
      recoveryEmail,
      recoveryCodeInput,
      recoveryNewPassword
    );
    if (!result.success) {
      setRecoveryError(
        result.error || 'Verification failed. Please check your code and try again.'
      );
      return;
    }

    setLoginEmail(recoveryEmail.trim());
    setLoginPassword(recoveryNewPassword);
    setRecoveryStep('reset_complete');
  };

  const candidateAccounts = users.filter((u) => u.role === 'jobseeker');
  const employerAccounts = users.filter((u) => u.role === 'client');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        data-testid="auth-modal-dialog"
        aria-label={
          mode === 'jobseeker_register'
            ? 'Candidate Account Registration'
            : mode === 'client_register'
            ? 'Employer Account Registration'
            : mode === 'forgot_password'
            ? 'Recover Account Password'
            : 'Sign In to Nature Island Careers'
        }
        tabIndex={-1}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-display">
              {mode === 'jobseeker_register'
                ? 'Create Candidate Account (Job Seeker)'
                : mode === 'client_register'
                ? 'Create Employer Account (Recruiter)'
                : mode === 'forgot_password'
                ? 'Account Password Recovery'
                : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs text-stone-500">
              Nature Island Careers · Employer & Candidate Account Portal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Session Status Bar (with Log Out button if signed in) */}
        {currentUser && (
          <div
            data-testid="auth-modal-active-session"
            className="px-4 py-2.5 bg-emerald-950 text-white flex items-center justify-between gap-3 text-xs border-b border-emerald-800"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold">{currentUser.name}</span>
                {currentUser.companyName ? ` (${currentUser.companyName})` : ''} ·{' '}
                <span className="text-emerald-300 uppercase font-extrabold text-[10px]">
                  {currentUser.role === 'client' ? 'Employer Account' : 'Candidate Account'}
                </span>
              </div>
            </div>
            <button
              type="button"
              data-testid="auth-modal-logout-btn"
              onClick={() => {
                logoutUser();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-stone-200 bg-white text-xs font-semibold">
          <button
            type="button"
            data-testid="auth-tab-login"
            onClick={() => {
              setMode('login');
              setFormError(null);
              setLoginError(null);
            }}
            className={`py-2.5 px-2 text-center transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            type="button"
            data-testid="auth-tab-candidate-register"
            onClick={() => {
              setMode('jobseeker_register');
              setFormError(null);
              setLoginError(null);
            }}
            className={`py-2.5 px-2 text-center transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'jobseeker_register'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>New Candidate</span>
          </button>
          <button
            type="button"
            data-testid="auth-tab-employer-register"
            onClick={() => {
              setMode('client_register');
              setFormError(null);
              setLoginError(null);
            }}
            className={`py-2.5 px-2 text-center transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'client_register'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>New Employer</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[78vh] text-xs space-y-4">
          {formError && mode !== 'login' && (
            <div
              role="alert"
              data-testid="auth-form-error"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Candidate / Job Seeker Registration Form */}
          {mode === 'jobseeker_register' && (
            <form onSubmit={handleJobseekerSubmit} className="space-y-3.5" data-testid="candidate-register-form">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-950 flex items-center justify-between gap-2">
                <div>
                  <strong>Free Candidate Account:</strong> Create a verified Dominican candidate profile, save jobs, build your resume, and track applications.
                </div>
              </div>

              <div>
                <label htmlFor="js-name" className="block font-semibold text-stone-900 mb-1">
                  Full Legal Name *
                </label>
                <input
                  id="js-name"
                  data-testid="candidate-register-name"
                  type="text"
                  required
                  value={jsName}
                  onChange={(e) => setJsName(e.target.value)}
                  placeholder="e.g. Elena Henderson"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="js-email" className="block font-semibold text-stone-900 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="js-email"
                    data-testid="candidate-register-email"
                    type="email"
                    required
                    value={jsEmail}
                    onChange={(e) => setJsEmail(e.target.value)}
                    placeholder="elena.henderson@waitukubuli.dm"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="js-phone" className="block font-semibold text-stone-900 mb-1">
                    Contact Phone (Dominica) *
                  </label>
                  <input
                    id="js-phone"
                    data-testid="candidate-register-phone"
                    type="tel"
                    required
                    value={jsPhone}
                    onChange={(e) => setJsPhone(e.target.value)}
                    placeholder="+1 (767) 275-8891"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="js-password" className="block font-semibold text-stone-900 mb-1">
                    Account Password *
                  </label>
                  <div className="relative">
                    <input
                      id="js-password"
                      data-testid="candidate-register-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={jsPassword}
                      onChange={(e) => setJsPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-3 pr-16 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      data-testid="toggle-candidate-password-btn"
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
                  <label htmlFor="js-confirm-password" className="block font-semibold text-stone-900 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="js-confirm-password"
                      data-testid="candidate-register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={jsConfirmPassword}
                      onChange={(e) => setJsConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-3 pr-16 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      data-testid="toggle-candidate-confirm-password-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      aria-pressed={showConfirmPassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 hover:text-stone-900 rounded flex items-center gap-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <PasswordStrengthIndicator
                password={jsPassword}
                confirmPassword={jsConfirmPassword}
                testIdPrefix="candidate"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="js-parish" className="block font-semibold text-stone-900 mb-1">
                    Parish of Residence *
                  </label>
                  <select
                    id="js-parish"
                    data-testid="candidate-register-parish"
                    value={jsParish}
                    onChange={(e) => setJsParish(e.target.value as Parish)}
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
                  <label htmlFor="js-sector" className="block font-semibold text-stone-900 mb-1">
                    Primary Career Sector
                  </label>
                  <select
                    id="js-sector"
                    data-testid="candidate-register-sector"
                    value={jsSector}
                    onChange={(e) => setJsSector(e.target.value as JobSector)}
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

              <div>
                <label htmlFor="js-skills" className="block font-semibold text-stone-900 mb-1">
                  Key Skills & Certifications (Comma separated)
                </label>
                <input
                  id="js-skills"
                  data-testid="candidate-register-skills"
                  type="text"
                  value={jsSkills}
                  onChange={(e) => setJsSkills(e.target.value)}
                  placeholder="e.g. Electrical SCADA, PADI Divemaster, Culinary Arts, React"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  data-testid="submit-candidate-register-btn"
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Candidate Account</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="candidate-google-auth-btn"
                    disabled={isGoogleLoading || isGithubLoading}
                    onClick={() => handleGoogleSignIn('jobseeker')}
                    className="w-full py-2 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 text-[11px]"
                  >
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    data-testid="candidate-github-auth-btn"
                    disabled={isGoogleLoading || isGithubLoading}
                    onClick={() => handleGithubSignIn('jobseeker')}
                    className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white border border-stone-900 rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 text-[11px]"
                  >
                    <span>Continue with GitHub</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. Employer / Client Registration Form */}
          {mode === 'client_register' && (
            <form onSubmit={handleClientSubmit} className="space-y-3.5" data-testid="employer-register-form">
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  Dominica Employer & Recruiter Account
                </div>
                <p>
                  Register your organization with your Dominica Social Security (DSS) employer number to access the Employer Command Center, post vacancies, and manage applicants.
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
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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

              <label className="flex items-center gap-2 text-[11px] text-stone-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={proceedToCheckout}
                  onChange={(e) => setProceedToCheckout(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>Also open Employer Subscription Checkout after creating account</span>
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
                    onClick={() => handleGoogleSignIn('client')}
                    className="w-full py-2 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 text-[11px]"
                  >
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    data-testid="employer-github-auth-btn"
                    disabled={isGoogleLoading || isGithubLoading}
                    onClick={() => handleGithubSignIn('client')}
                    className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white border border-stone-900 rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 text-[11px]"
                  >
                    <span>Continue with GitHub</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 3. Sign In Form (Supports both Candidates and Employers) */}
          {mode === 'login' && (
            <div className="space-y-4" data-testid="login-panel">
              {/* Role Filter Pills */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                {(
                  [
                    { id: 'all', label: 'All Accounts' },
                    { id: 'jobseeker', label: 'Candidate Login' },
                    { id: 'client', label: 'Employer Login' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`login-role-filter-${item.id}`}
                    onClick={() => {
                      setLoginAccountType(item.id);
                      setLoginError(null);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      loginAccountType === item.id
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3" data-testid="login-form">
                <div>
                  <label htmlFor="login-email-input" className="block font-semibold text-stone-900 mb-1">
                    Registered Email Address *
                  </label>
                  <input
                    id="login-email-input"
                    data-testid="login-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password-input" className="block font-semibold text-stone-900">
                      Password
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        data-testid="forgot-password-btn"
                        onClick={openForgotPasswordFlow}
                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Forgot Password?</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-[11px] text-stone-600 hover:text-stone-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      data-testid="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter your account password"
                      className="w-full pl-3 pr-16 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                    />
                    <button
                      type="button"
                      data-testid="toggle-login-password-btn"
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

                {loginResetSuccessBanner && (
                  <div
                    role="status"
                    data-testid="login-reset-success-banner"
                    className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{loginResetSuccessBanner}</span>
                  </div>
                )}

                {loginError && (
                  <p
                    role="alert"
                    data-testid="login-error-message"
                    className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 text-[11px]"
                  >
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  data-testid="submit-login-btn"
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Account</span>
                </button>
              </form>

              {/* Google & GitHub Social Sign-In options */}
              <div className="space-y-2 pt-1" data-testid="social-login-providers">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Social Login (Firebase Auth · Google & GitHub)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="login-google-candidate-btn"
                    disabled={isGoogleLoading || isGithubLoading}
                    onClick={() => handleGoogleSignIn('jobseeker')}
                    className="py-2 px-3 bg-white hover:bg-emerald-50 text-stone-800 border border-stone-300 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Google Sign In (Candidate)</span>
                  </button>
                  <button
                    type="button"
                    data-testid="login-github-candidate-btn"
                    disabled={isGoogleLoading || isGithubLoading}
                    onClick={() => handleGithubSignIn('jobseeker')}
                    className="py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white border border-stone-900 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>GitHub Sign In (Candidate)</span>
                  </button>
                  <button
                    type="button"
                    data-testid="login-google-employer-btn"
                    disabled={isGoogleLoading || isGithubLoading}
                    onClick={() => handleGoogleSignIn('client')}
                    className="py-2 px-3 bg-white hover:bg-amber-50 text-stone-800 border border-stone-300 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Google Sign In (Employer)</span>
                  </button>
                  <button
                    type="button"
                    data-testid="login-github-employer-btn"
                    disabled={isGoogleLoading || isGithubLoading}
                    onClick={() => handleGithubSignIn('client')}
                    className="py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white border border-stone-900 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>GitHub Sign In (Employer)</span>
                  </button>
                </div>
              </div>

              {/* Quick One-Click Switchers for Candidate & Employer Accounts */}
              <div className="pt-3 border-t border-stone-200 space-y-3">
                {(loginAccountType === 'all' || loginAccountType === 'jobseeker') &&
                  candidateAccounts.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1.5">
                        Candidate Accounts ({candidateAccounts.length}):
                      </span>
                      <div className="space-y-1.5">
                        {candidateAccounts.slice(0, 4).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            data-testid={`quick-login-candidate-${u.email}`}
                            onClick={() => {
                              loginUser(u.email);
                              onAuthSuccess?.('jobseeker');
                              onClose();
                            }}
                            className="w-full text-left p-2.5 bg-stone-50 hover:bg-emerald-50 rounded-xl border border-stone-200 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 truncate flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>{u.name}</span>
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono truncate">
                                {u.email} · CANDIDATE ({u.parish})
                              </div>
                            </div>
                            <span className="text-emerald-800 text-[11px] font-bold shrink-0">
                              Log In &rarr;
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {(loginAccountType === 'all' || loginAccountType === 'client') &&
                  employerAccounts.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-1.5">
                        Employer Accounts ({employerAccounts.length}):
                      </span>
                      <div className="space-y-1.5">
                        {employerAccounts.slice(0, 4).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            data-testid={`quick-login-employer-${u.email}`}
                            onClick={() => {
                              loginUser(u.email);
                              onAuthSuccess?.('client');
                              onClose();
                            }}
                            className="w-full text-left p-2.5 bg-stone-50 hover:bg-amber-50 rounded-xl border border-stone-200 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 truncate flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>
                                  {u.companyName ? `${u.companyName} (${u.name})` : u.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono truncate">
                                {u.email} · EMPLOYER ({u.dssRegistrationNo || u.parish})
                              </div>
                            </div>
                            <span className="text-amber-900 text-[11px] font-bold shrink-0">
                              Log In &rarr;
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* 4. Forgot Password & Email Verification Recovery Flow */}
          {mode === 'forgot_password' && (
            <div className="space-y-4" data-testid="forgot-password-panel">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  data-testid="back-to-login-btn"
                  onClick={() => {
                    setMode('login');
                    setRecoveryError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-[11px] text-stone-500">
                  {recoveryStep === 'request_code'
                    ? 'Step 1 of 2 · Email Verification'
                    : recoveryStep === 'verify_and_reset'
                    ? 'Step 2 of 2 · Verify & Reset'
                    : 'Recovery Complete'}
                </span>
              </div>

              {recoveryError && (
                <div
                  role="alert"
                  data-testid="forgot-password-error"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {/* Step 1: Request Email Verification Code */}
              {recoveryStep === 'request_code' && (
                <form
                  onSubmit={handleRequestRecoveryCode}
                  className="space-y-3.5"
                  data-testid="forgot-password-request-form"
                >
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <div className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-800" />
                      <span>Recover Account via Email Verification</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Enter the email address registered to your Candidate or Employer account. We will send a 6-digit verification code to confirm your identity before resetting your password.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-password-email"
                      className="block font-semibold text-stone-900 mb-1"
                    >
                      Registered Account Email *
                    </label>
                    <input
                      id="forgot-password-email"
                      data-testid="forgot-password-email-input"
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => {
                        setRecoveryEmail(e.target.value);
                        setRecoveryError(null);
                      }}
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReset}
                    data-testid="send-recovery-code-btn"
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white rounded-xl font-semibold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>
                      {isSendingReset
                        ? 'Dispatching Firebase Reset Link...'
                        : 'Send Verification Code & Reset Link'}
                    </span>
                  </button>
                </form>
              )}

              {/* Step 2: Verify 6-Digit Code / Reset Link & Set New Password */}
              {recoveryStep === 'verify_and_reset' && (
                <form
                  onSubmit={handleConfirmPasswordReset}
                  className="space-y-3.5"
                  data-testid="forgot-password-verify-form"
                >
                  <div
                    data-testid="recovery-email-dispatched-banner"
                    className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Firebase Reset Link & Verification Email Sent</span>
                      </span>
                      <button
                        type="button"
                        data-testid="change-recovery-email-btn"
                        onClick={() => {
                          setRecoveryStep('request_code');
                          setRecoveryError(null);
                        }}
                        className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        Change Email
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-900">
                      {recoveryNotice ||
                        `We sent a password reset link and 6-digit verification code to ${recoveryEmail.trim()}`}{' '}
                      ({recoveryAccountName} ·{' '}
                      {recoveryAccountRole === 'client' ? 'Employer' : 'Candidate'}).
                    </p>
                  </div>

                  {dispatchedResetLink && (
                    <div
                      data-testid="firebase-reset-link-box"
                      className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            Firebase Auth Reset Link{' '}
                            {firebaseResetDispatched ? '(Sent via Firebase Auth)' : '(Dispatched)'}
                          </span>
                        </span>
                        {dispatchedCode && (
                          <button
                            type="button"
                            data-testid="use-firebase-reset-link-btn"
                            onClick={() => {
                              setRecoveryCodeInput(dispatchedCode);
                              setRecoveryError(null);
                              setRecoveryNotice(
                                'Reset link verified! Enter your new password below.'
                              );
                            }}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition-colors"
                          >
                            Verify via Reset Link
                          </button>
                        )}
                      </div>
                      <div
                        data-testid="dispatched-reset-link-url"
                        className="text-[10px] font-mono text-stone-600 break-all bg-white px-2.5 py-1.5 rounded-lg border border-stone-200"
                      >
                        {dispatchedResetLink}
                      </div>
                    </div>
                  )}

                  {dispatchedCode && (
                    <div
                      data-testid="recovery-code-preview-box"
                      className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                          Dispatched Email Verification Code
                        </div>
                        <div
                          data-testid="dispatched-recovery-code"
                          className="text-sm font-mono font-extrabold tracking-widest text-stone-900 mt-0.5 tabular-nums"
                        >
                          {dispatchedCode}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid="autofill-recovery-code-btn"
                          onClick={() => {
                            setRecoveryCodeInput(dispatchedCode);
                            setRecoveryError(null);
                          }}
                          className="px-2.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          Auto-Fill Code
                        </button>
                        <button
                          type="button"
                          data-testid="resend-recovery-code-btn"
                          onClick={handleResendRecoveryCode}
                          className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg cursor-pointer"
                          title="Resend Verification Code"
                          aria-label="Resend Verification Code"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="recovery-verification-code"
                      className="block font-semibold text-stone-900 mb-1"
                    >
                      6-Digit Email Verification Code *
                    </label>
                    <input
                      id="recovery-verification-code"
                      data-testid="recovery-verification-code-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={recoveryCodeInput}
                      onChange={(e) => {
                        setRecoveryCodeInput(e.target.value);
                        setRecoveryError(null);
                      }}
                      placeholder="Enter 6-digit code (e.g. 482910)"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono tracking-widest text-stone-900 tabular-nums"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="recovery-new-password"
                        className="block font-semibold text-stone-900 mb-1"
                      >
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          id="recovery-new-password"
                          data-testid="recovery-new-password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={recoveryNewPassword}
                          onChange={(e) => {
                            setRecoveryNewPassword(e.target.value);
                            setRecoveryError(null);
                          }}
                          placeholder="Min. 6 characters"
                          className="w-full pl-3 pr-16 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                        />
                        <button
                          type="button"
                          data-testid="toggle-recovery-password-btn"
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
                      <label
                        htmlFor="recovery-confirm-password"
                        className="block font-semibold text-stone-900 mb-1"
                      >
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          id="recovery-confirm-password"
                          data-testid="recovery-confirm-password-input"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={recoveryConfirmPassword}
                          onChange={(e) => {
                            setRecoveryConfirmPassword(e.target.value);
                            setRecoveryError(null);
                          }}
                          placeholder="Re-enter new password"
                          className="w-full pl-3 pr-16 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                        />
                        <button
                          type="button"
                          data-testid="toggle-recovery-confirm-password-btn"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          aria-pressed={showConfirmPassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 hover:text-stone-900 rounded flex items-center gap-1 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <PasswordStrengthIndicator
                    password={recoveryNewPassword}
                    confirmPassword={recoveryConfirmPassword}
                    testIdPrefix="recovery"
                  />

                  <button
                    type="submit"
                    data-testid="submit-password-reset-btn"
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Verify Email & Reset Password</span>
                  </button>
                </form>
              )}

              {/* Step 3: Password Reset Complete */}
              {recoveryStep === 'reset_complete' && (
                <div
                  data-testid="password-reset-success"
                  className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-3 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-stone-900">
                      Password Successfully Reset
                    </h3>
                    <p className="text-xs text-stone-600">
                      Your email address (<strong>{recoveryEmail.trim()}</strong>) has been verified and your new password is now active.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      data-testid="reset-complete-auto-login-btn"
                      onClick={() => {
                        const loggedIn = loginUser(
                          recoveryEmail.trim(),
                          recoveryNewPassword
                        );
                        if (loggedIn) {
                          onAuthSuccess?.(
                            recoveryAccountRole === 'client' ? 'client' : 'jobseeker'
                          );
                          onClose();
                        }
                      }}
                      className="flex-1 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In Now</span>
                    </button>
                    <button
                      type="button"
                      data-testid="return-to-login-after-reset-btn"
                      onClick={() => {
                        setLoginResetSuccessBanner(
                          'Password reset verified. You can now sign in with your new password.'
                        );
                        setMode('login');
                      }}
                      className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl font-semibold cursor-pointer"
                    >
                      Return to Sign In Form
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
