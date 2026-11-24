import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  X,
  Shield,
  Lock,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  ShieldAlert,
  Clock,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

export const ADMIN_MAX_LOGIN_ATTEMPTS = 3;
export const ADMIN_LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds temporary lockout
export const ADMIN_SECURITY_STORAGE_KEY = 'natureisland_admin_security_state';

export interface AdminSecurityState {
  failedAttempts: number;
  lockoutUntil: number | null;
  honeypotTriggered: boolean;
}

export const INITIAL_ADMIN_SECURITY_STATE: AdminSecurityState = {
  failedAttempts: 0,
  lockoutUntil: null,
  honeypotTriggered: false,
};

export function evaluateHoneypotTrap(honeypotValue: string): boolean {
  return typeof honeypotValue === 'string' && honeypotValue.trim().length > 0;
}

export function isAdminLoginLockedOut(
  state: AdminSecurityState,
  nowMs: number = Date.now()
): { locked: boolean; remainingSeconds: number } {
  if (!state.lockoutUntil || state.lockoutUntil <= nowMs) {
    return { locked: false, remainingSeconds: 0 };
  }
  const remainingSeconds = Math.max(1, Math.ceil((state.lockoutUntil - nowMs) / 1000));
  return { locked: true, remainingSeconds };
}

export function recordFailedAdminAttempt(
  state: AdminSecurityState,
  nowMs: number = Date.now(),
  maxAttempts: number = ADMIN_MAX_LOGIN_ATTEMPTS,
  lockoutDurationMs: number = ADMIN_LOCKOUT_DURATION_MS
): AdminSecurityState {
  // If previous lockout already expired, reset counter before counting this new failure
  const baseAttempts =
    state.lockoutUntil && state.lockoutUntil <= nowMs ? 0 : state.failedAttempts;
  const nextAttempts = baseAttempts + 1;
  const shouldLock = nextAttempts >= maxAttempts;

  return {
    ...state,
    failedAttempts: nextAttempts,
    lockoutUntil: shouldLock ? nowMs + lockoutDurationMs : null,
  };
}

export function loadAdminSecurityState(): AdminSecurityState {
  try {
    const raw = sessionStorage.getItem(ADMIN_SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
        lockoutUntil: typeof parsed.lockoutUntil === 'number' ? parsed.lockoutUntil : null,
        honeypotTriggered: Boolean(parsed.honeypotTriggered),
      };
    }
  } catch {
    // ignore storage errors
  }
  return INITIAL_ADMIN_SECURITY_STATE;
}

export function saveAdminSecurityState(state: AdminSecurityState): void {
  try {
    sessionStorage.setItem(ADMIN_SECURITY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

interface AdminGatewayFormProps {
  onSuccess: () => void;
  onReturnPublic?: () => void;
  isStandalone?: boolean;
  initialMode?: 'login' | 'register';
}

const AdminGatewayForm: React.FC<AdminGatewayFormProps> = ({
  onSuccess,
  onReturnPublic,
  isStandalone = false,
  initialMode = 'login',
}) => {
  const { adminLogin, isAdminRegistered } = useJobContext();

  const [gatewayMode, setGatewayMode] = useState<'login' | 'register'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'register') return 'register';
      }
    } catch {
      // ignore
    }
    return initialMode;
  });

  useEffect(() => {
    setGatewayMode(initialMode);
    setErrorMessage(null);
  }, [initialMode]);
  const [adminAccountRegistered, setAdminAccountRegistered] = useState<boolean>(() =>
    Boolean(isAdminRegistered)
  );
  const [adminName, setAdminName] = useState('');
  // Security hardened: Never prefill credentials or expose plain-text hints
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Bot-honeypot trap field (must remain empty for human users)
  const [honeypotUrl, setHoneypotUrl] = useState('');

  const [securityState, setSecurityState] = useState<AdminSecurityState>(() =>
    loadAdminSecurityState()
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lockoutStatus = isAdminLoginLockedOut(securityState, nowMs);

  useEffect(() => {
    let active = true;
    if (typeof fetch !== 'function') return;
    fetch('/api/admin/registration-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data && typeof data.registered === 'boolean') {
          setAdminAccountRegistered(data.registered);
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('dominica_admin_registered', String(data.registered));
            }
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Tick countdown timer every second while locked out
  useEffect(() => {
    if (!securityState.lockoutUntil) return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (securityState.lockoutUntil && current >= securityState.lockoutUntil) {
        const clearedState: AdminSecurityState = {
          failedAttempts: 0,
          lockoutUntil: null,
          honeypotTriggered: false,
        };
        setSecurityState(clearedState);
        saveAdminSecurityState(clearedState);
        setErrorMessage(null);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [securityState.lockoutUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentTimestamp = Date.now();
    setNowMs(currentTimestamp);

    // 1. Check bot-honeypot trap first
    if (evaluateHoneypotTrap(honeypotUrl)) {
      const trappedState: AdminSecurityState = {
        ...securityState,
        honeypotTriggered: true,
        failedAttempts: ADMIN_MAX_LOGIN_ATTEMPTS,
        lockoutUntil: currentTimestamp + ADMIN_LOCKOUT_DURATION_MS,
      };
      setSecurityState(trappedState);
      saveAdminSecurityState(trappedState);
      setErrorMessage('Automated bot activity detected. Access request terminated.');
      return;
    }

    // 2. Check active brute-force lockout
    const currentLockout = isAdminLoginLockedOut(securityState, currentTimestamp);
    if (currentLockout.locked) {
      setErrorMessage(
        `Too many failed attempts. Gateway locked for ${currentLockout.remainingSeconds}s.`
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    if (gatewayMode === 'register') {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== 'info@natureislecareers.com') {
        setLoading(false);
        setErrorMessage('Single admin registration is strictly restricted to info@natureislecareers.com.');
        return;
      }
      if (password !== confirmPassword) {
        setLoading(false);
        setErrorMessage('Password confirmation does not match.');
        return;
      }
    }

    let serverErrorMsg: string | null = null;

    try {
      const endpoint = gatewayMode === 'register' ? '/api/admin/register' : '/api/admin/verify';
      const payload =
        gatewayMode === 'register'
          ? {
              email: email.trim(),
              password,
              confirmPassword,
              name: adminName.trim() || 'Dominica Labour Administrator',
              honeypot: honeypotUrl,
            }
          : {
              username: email.trim(),
              password,
              honeypot: honeypotUrl,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.authorized) {
          if (gatewayMode === 'register') {
            setAdminAccountRegistered(true);
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('dominica_admin_registered', 'true');
              }
            } catch {
              // ignore
            }
          }
          if (data.token) {
            sessionStorage.setItem('natureisland_admin_token', data.token);
          }
          const resetState = INITIAL_ADMIN_SECURITY_STATE;
          setSecurityState(resetState);
          saveAdminSecurityState(resetState);
          const ok = adminLogin(email.trim(), password, data.token);
          setLoading(false);
          if (ok) {
            onSuccess();
          } else {
            setErrorMessage('Single-login access is restricted to info@natureislecareers.com.');
          }
          return;
        }
        if (res.status === 409 || data?.alreadyRegistered) {
          setAdminAccountRegistered(true);
          setLoading(false);
          setErrorMessage(
            data?.error ||
              'Single administrator account (info@natureislecareers.com) is already registered.'
          );
          return;
        }
        serverErrorMsg = data?.error || 'Authentication failed.';
      } else {
        serverErrorMsg = 'Unexpected response from admin verification server.';
      }
    } catch {
      serverErrorMsg = 'Admin verification server is unreachable. Please ensure the server is running.';
    }

    setLoading(false);

    const updatedState = recordFailedAdminAttempt(securityState, Date.now());
    setSecurityState(updatedState);
    saveAdminSecurityState(updatedState);
    setPassword('');
    setConfirmPassword('');

    const nextLock = isAdminLoginLockedOut(updatedState, Date.now());
    if (nextLock.locked) {
      setErrorMessage(
        `Maximum authentication attempts (${ADMIN_MAX_LOGIN_ATTEMPTS}) exceeded. Temporary lockout engaged.`
      );
    } else {
      const remaining = Math.max(0, ADMIN_MAX_LOGIN_ATTEMPTS - updatedState.failedAttempts);
      setErrorMessage(
        serverErrorMsg
          ? `${serverErrorMsg} (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining).`
          : `Authentication failed. Authorized email is info@natureislecareers.com (${remaining} ${
              remaining === 1 ? 'attempt' : 'attempts'
            } remaining before lockout).`
      );
    }
  };

  return (
    <div className="p-6 sm:p-8 text-xs text-slate-800 space-y-5">
      <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[11px] flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Single-Login Administrative Gateway:</strong> Restricted to{' '}
          <span className="font-mono text-emerald-300">info@natureislecareers.com</span>. Allows a
          single admin registration and unlocks the Admin Portal and Merchant Payment Portals with
          automated brute-force lockout protection.
        </div>
      </div>

      {/* Mode Switcher: Sign In vs Single Admin Registration */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          data-testid="admin-mode-signin-btn"
          onClick={() => {
            setGatewayMode('login');
            setErrorMessage(null);
          }}
          className={`py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            gatewayMode === 'login'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Admin Sign In</span>
        </button>
        <button
          type="button"
          data-testid="admin-mode-register-btn"
          onClick={() => {
            setGatewayMode('register');
            setErrorMessage(null);
          }}
          className={`py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            gatewayMode === 'register'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register Single Admin</span>
        </button>
      </div>

      {gatewayMode === 'login' && !adminAccountRegistered && (
        <div
          data-testid="admin-first-time-register-banner"
          className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-emerald-950"
        >
          <span>First-time setup? Register the single admin account once.</span>
          <button
            type="button"
            data-testid="admin-banner-switch-register-btn"
            onClick={() => {
              setGatewayMode('register');
              setErrorMessage(null);
            }}
            className="font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0 cursor-pointer"
          >
            Register &rarr;
          </button>
        </div>
      )}

      {/* Temporary Brute-Force Lockout Banner */}
      {lockoutStatus.locked && (
        <div
          data-testid="admin-lockout-banner"
          role="alert"
          className="p-3.5 bg-amber-950/95 border border-amber-700 text-amber-100 rounded-xl flex items-start gap-2.5 text-[11px]"
        >
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300">
              Security Lockout Active ({lockoutStatus.remainingSeconds}s remaining)
            </div>
            <p className="text-amber-200/90">
              Gateway temporarily locked due to repeated failed sign-in attempts. Please wait for
              the cooldown timer to expire before retrying.
            </p>
          </div>
        </div>
      )}

      {/* Bot Honeypot Triggered Alert */}
      {securityState.honeypotTriggered && (
        <div
          data-testid="admin-honeypot-alert"
          role="alert"
          className="p-3 bg-rose-950 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2 text-[11px]"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Automated bot submission blocked by security honeypot filter.</span>
        </div>
      )}

      {gatewayMode === 'register' && adminAccountRegistered ? (
        <div
          data-testid="admin-already-registered-notice"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-emerald-950"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <div className="font-bold text-xs">Single Admin Account Already Registered</div>
              <p className="text-emerald-900/90">
                The single administrator registration for{' '}
                <span className="font-mono font-semibold">info@natureislecareers.com</span> has
                already been completed. Additional admin registrations are permanently disabled.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="switch-to-admin-signin-btn"
            onClick={() => {
              setGatewayMode('login');
              setErrorMessage(null);
            }}
            className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs cursor-pointer transition-colors"
          >
            Proceed to Admin Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          {/* Bot-Honeypot Field (Hidden from human users, traps automated form fillers) */}
          <div
            aria-hidden="true"
            className="sr-only overflow-hidden h-0 w-0 opacity-0 pointer-events-none"
          >
            <label htmlFor="admin_verification_website_url">
              Organization Website Verification (Leave blank)
            </label>
            <input
              id="admin_verification_website_url"
              name="admin_verification_website_url"
              data-testid="admin-honeypot-input"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypotUrl}
              onChange={(e) => setHoneypotUrl(e.target.value)}
            />
          </div>

          {gatewayMode === 'register' && (
            <div>
              <label
                htmlFor="admin-register-name"
                className="block font-semibold text-slate-900 mb-1.5"
              >
                Administrator Display Name
              </label>
              <input
                id="admin-register-name"
                data-testid="admin-register-name-input"
                type="text"
                disabled={lockoutStatus.locked || loading}
                autoComplete="off"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Dominica Labour Administrator"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="admin-login-email"
              className="block font-semibold text-slate-900 mb-1.5"
            >
              Administrator Identifier *
            </label>
            <input
              id="admin-login-email"
              data-testid="admin-email-input"
              type="email"
              required
              disabled={lockoutStatus.locked || loading}
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@natureislecareers.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="admin-login-password"
              className="block font-semibold text-slate-900 mb-1.5"
            >
              Master Security Passphrase *
            </label>
            <input
              id="admin-login-password"
              data-testid="admin-password-input"
              type="password"
              required
              disabled={lockoutStatus.locked || loading}
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {gatewayMode === 'register' && (
            <div>
              <label
                htmlFor="admin-confirm-password"
                className="block font-semibold text-slate-900 mb-1.5"
              >
                Confirm Passphrase *
              </label>
              <input
                id="admin-confirm-password"
                data-testid="admin-confirm-password-input"
                type="password"
                required
                disabled={lockoutStatus.locked || loading}
                autoComplete="off"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Attempt Counter Indicator */}
          {securityState.failedAttempts > 0 && !lockoutStatus.locked && (
            <div
              data-testid="admin-attempt-tracker"
              className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg"
            >
              <span>Failed attempts recorded:</span>
              <span className="font-mono font-bold">
                {securityState.failedAttempts} / {ADMIN_MAX_LOGIN_ATTEMPTS}
              </span>
            </div>
          )}

          {errorMessage && (
            <div
              data-testid="admin-login-error"
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-[11px]"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            {onReturnPublic ? (
              <button
                type="button"
                onClick={onReturnPublic}
                data-testid="admin-return-public-btn"
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium cursor-pointer hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
              >
                {isStandalone && <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{isStandalone ? 'Exit to Public Site' : 'Cancel'}</span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              data-testid="admin-submit-btn"
              disabled={loading || lockoutStatus.locked}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {gatewayMode === 'register' ? (
                <UserPlus className="w-3.5 h-3.5" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>
                {lockoutStatus.locked
                  ? `Locked (${lockoutStatus.remainingSeconds}s)`
                  : loading
                  ? gatewayMode === 'register'
                    ? 'Registering Admin...'
                    : 'Authenticating...'
                  : gatewayMode === 'register'
                  ? 'Register Single Admin'
                  : 'Authenticate Console'}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export interface StandaloneAdminLoginPageProps {
  onSuccess: () => void;
  onReturnPublic: () => void;
  initialMode?: 'login' | 'register';
}

export const StandaloneAdminLoginPage: React.FC<StandaloneAdminLoginPageProps> = ({
  onSuccess,
  onReturnPublic,
  initialMode = 'login',
}) => {
  return (
    <div
      data-testid="standalone-admin-login-page"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white"
    >
      {/* Isolated Minimal Top Bar (No public navigation, directories, or wallet controls) */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>SYS-GATEWAY // /admin-login</span>
        </div>
        <button
          type="button"
          onClick={onReturnPublic}
          className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Site</span>
        </button>
      </div>

      {/* Centered Isolated Gateway Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white flex items-center gap-3.5 border-b border-slate-800">
            <div className="p-2.5 bg-emerald-900/80 text-emerald-300 rounded-xl border border-emerald-700/50">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">
                Admin Console Security Gateway
              </h1>
              <p className="text-xs text-slate-300">
                Isolated System & Operations Access
              </p>
            </div>
          </div>

          <AdminGatewayForm
            onSuccess={onSuccess}
            onReturnPublic={onReturnPublic}
            isStandalone={true}
            initialMode={initialMode}
          />
        </div>
      </main>

      {/* Minimal Security Notice (No public footer) */}
      <div className="max-w-md w-full mx-auto text-center pb-2 text-[11px] text-slate-500 font-mono">
        Isolated Administrative Session · Unauthorized access is prohibited
      </div>
    </div>
  );
};

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const modalRef = useModalKeyboard({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Control Login"
        tabIndex={-1}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-5 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 text-emerald-200 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">
                Admin Console Security Gateway
              </h2>
              <p className="text-xs text-emerald-200/80">
                Isolated System & Operations Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close admin login"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AdminGatewayForm
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          onReturnPublic={onClose}
          isStandalone={false}
          initialMode={initialMode}
        />
      </div>
    </div>
  );
};
