import React from 'react';
import { useJobContext } from '../context/JobContext';
import { Mail, X, CheckCircle2 } from 'lucide-react';

export const EmailAlertToast: React.FC = () => {
  const { latestDispatchedEmail, dismissLatestEmail } = useJobContext();

  if (!latestDispatchedEmail) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/30 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Email Dispatch Simulated
            </span>
            <h4 className="text-xs font-bold text-slate-100">{latestDispatchedEmail.subject}</h4>
          </div>
        </div>
        <button
          onClick={dismissLatestEmail}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2.5 text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 leading-relaxed">
        <p className="font-semibold text-slate-200 mb-1">To: {latestDispatchedEmail.recipientEmail}</p>
        <p className="line-clamp-2 text-slate-300">{latestDispatchedEmail.previewText}</p>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered to inbox
        </span>
        <button
          onClick={dismissLatestEmail}
          className="text-slate-300 hover:text-white underline font-semibold"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
