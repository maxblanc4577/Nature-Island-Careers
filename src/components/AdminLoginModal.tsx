import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  X,
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { adminLogin } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const [email, setEmail] = useState('info@natureislecareers.com');
  const [password, setPassword] = useState('natureislandcareers');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        if (data.token) {
          sessionStorage.setItem('natureisland_admin_token', data.token);
        }
        adminLogin(email, password);
        setLoading(false);
        onSuccess();
        onClose();
        return;
      }
    } catch (err) {
      console.warn('Server admin verify error:', err);
    }

    const ok = adminLogin(email, password);
    setLoading(false);
    if (ok) {
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  const handleFillDemo = () => {
    setEmail('info@natureislecareers.com');
    setPassword('natureislandcareers');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Control Login"
        tabIndex={-1}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 text-emerald-200 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">
                Administrator Master Access
              </h2>
              <p className="text-xs text-emerald-200/80">
                Nature Island Careers & Stripe Billing Portal
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

        {/* Form Body */}
        <div className="p-5 sm:p-6 text-xs text-stone-800 space-y-4">
          
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] flex items-start justify-between gap-2">
            <div>
              <strong>Secure Admin Authentication:</strong> Full privileges to edit site configuration, manage Stripe payment portal, automate employer recurring billing, and update Dominica job listings.
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[10px] bg-emerald-800 text-white font-semibold px-2.5 py-1 rounded shrink-0 hover:bg-emerald-900 cursor-pointer shadow-2xs"
            >
              Fill Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-stone-900 mb-1">
                Admin Email (Username) *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@natureislecareers.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Authorized email: info@natureislecareers.com</p>
            </div>

            <div>
              <label className="block font-semibold text-stone-900 mb-1">
                Admin Master Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="natureislandcareers"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Designated master key: natureislandcareers</p>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Invalid credentials! Authorized email is <strong>info@natureislecareers.com</strong> with password <strong>natureislandcareers</strong>.</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 cursor-pointer hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{loading ? 'Authenticating...' : 'Unlock Admin Master Portal'}</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
