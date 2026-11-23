import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useJobContext } from '../context/JobContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { jobs } = useJobContext();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-indicator-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xl border border-amber-400/50"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        Offline Mode — Viewing {jobs.length} cached Dominica job listings
      </span>
    </div>
  );
};
