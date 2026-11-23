import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useModalKeyboard } from '../hooks/useModalKeyboard';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const modalRef = useModalKeyboard({
    isOpen: showIOSGuide,
    onClose: () => setShowIOSGuide(false),
  });

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        data-testid="pwa-install-btn"
        onClick={() => {
          void install();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer shrink-0"
        title="Install Nature Island Careers app for offline Dominica job browsing"
      >
        <Download className="w-3.5 h-3.5 text-emerald-100" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          data-testid="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-900 transition-colors cursor-pointer shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Install Nature Island Careers on iOS"
              tabIndex={-1}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  Install on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close iOS install instructions"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> for offline access to Dominica job listings across all 10 parishes.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-700 py-2 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
