import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
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

  const [email, setEmail] = useState('admin@dominica.gov.dm');
  const [password, setPassword] = useState('DominicaLabour2026!');
  const [pin, setPin] = useState('7670');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      const ok = adminLogin(email, password);
      setLoading(false);
      if (ok) {
        onSuccess();
        onClose();
      } else {
        setError(true);
      }
    }, 600);
  };

  const handleFillDemo = () => {
    setEmail('admin@dominica.gov.dm');
    setPassword('DominicaLabour2026!');
    setPin('7670');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-purple-900 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-800 text-purple-200 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">
                Administrator Secure Portal
              </h2>
              <p className="text-xs text-purple-200/80">
                Commonwealth of Dominica Labour Division
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-lg cursor-pointer"
            aria-label="Close admin login"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 text-xs text-stone-800 space-y-4">
          
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-[11px] flex items-start justify-between gap-2">
            <div>
              <strong>Authorized Personnel Only:</strong> Access National Labour Exchange metrics, database synchronization, and employer subscription audits.
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[10px] bg-purple-800 text-white font-semibold px-2 py-1 rounded shrink-0 hover:bg-purple-900 cursor-pointer"
            >
              Fill Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-stone-900 mb-1">
                Admin Government Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dominica.gov.dm"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-purple-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-900 mb-1">
                Security Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-purple-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-900 mb-1">
                Dominica Division Security PIN (4-Digits) *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="7670"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-purple-700 font-mono tracking-widest text-center text-sm font-bold"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Invalid administrator credentials. Please check your email or PIN.</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{loading ? 'Authenticating...' : 'Authenticate & Enter'}</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
