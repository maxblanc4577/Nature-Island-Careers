import React, { useState } from 'react';
import { JobListing } from '../types';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  X,
  Share2,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Linkedin,
  Twitter,
  MapPin,
  Building,
  DollarSign,
  ExternalLink,
} from 'lucide-react';

interface ShareJobModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareJobModal: React.FC<ShareJobModalProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  const modalRef = useModalKeyboard({ isOpen: isOpen && Boolean(job), onClose });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen || !job) return null;

  // Generate unique URL with job query param / anchor
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://natureislandcareers.com';
  const shareUrl = `${baseUrl}?job=${job.id}`;
  const shareText = `🇩🇲 Dominica Career Opportunity: ${job.title} at ${job.company}\n📍 Parish: ${job.parish} (${job.locality || 'Dominica'})\n💰 Compensation: EC$ ${job.minSalary.toLocaleString()} - EC$ ${job.maxSalary.toLocaleString()} / month\n🌐 Sector: ${job.sector}\n\n👉 Apply or view complete requirements:\n${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const handleCopySummary = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2400);
    } catch {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2400);
    }
  };

  const shareEmailUrl = `mailto:?subject=${encodeURIComponent(`Dominica Job Vacancy: ${job.title} - ${job.company}`)}&body=${encodeURIComponent(`${shareText}\n\nApply or view full details here:\n${shareUrl}`)}`;
  const shareWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const shareLinkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const shareTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Share ${job.title}`}
        tabIndex={-1}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-display">
                Share Job Opportunity
              </h2>
              <p className="text-xs text-stone-500">
                Nature Island Careers · Commonwealth of Dominica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-stone-800">
          {/* Job Snippet Card */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              {job.sector}
            </span>
            <h3 className="font-bold text-stone-950 text-base leading-snug">
              {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
              <span className="font-semibold text-stone-900">{job.company}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {job.parish}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold text-emerald-800">
                EC${job.minSalary.toLocaleString()} - EC${job.maxSalary.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Copy Unique Link Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Direct Classified URL
              </label>
              <span className="text-[10px] text-stone-400 font-medium">Click to select link</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-xs font-mono bg-stone-100 text-stone-800 border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Copy to Clipboard Primary Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm shrink-0 active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/50 shadow-emerald-600/30'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white hover:shadow-md'
                }`}
                title="Copy link to clipboard"
              >
                {copiedLink ? (
                  <span className="flex items-center gap-1.5 animate-in zoom-in-75 duration-200">
                    <span className="w-4 h-4 bg-white text-emerald-700 rounded-full flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span>Copied to Clipboard!</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Copy className="w-4 h-4 text-emerald-200" />
                    <span>Copy to Clipboard</span>
                  </span>
                )}
              </button>
            </div>

            {/* Visual Feedback Confirmation Banner */}
            {copiedLink && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-emerald-700 text-white rounded-full flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Link copied to clipboard! Ready to paste into chat or documents.</span>
                </div>
                <span className="text-[10px] text-emerald-700 uppercase font-black tracking-wider">
                  Success
                </span>
              </div>
            )}
          </div>

          {/* Quick Copy Formatted Post Snippet */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-900 block">
                Share Full Dominica Job Posting
              </span>
              <span className="text-[11px] text-stone-500 block">
                Copies title, company, parish, salary range, and application URL formatted for WhatsApp and emails.
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopySummary}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                copiedSummary
                  ? 'bg-teal-600 text-white ring-2 ring-teal-500/50'
                  : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 shadow-2xs'
              }`}
            >
              {copiedSummary ? (
                <span className="flex items-center gap-1 animate-in zoom-in-75 duration-200">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  <span>Summary Copied!</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                  <span>Copy Job Summary</span>
                </span>
              )}
            </button>
          </div>

          {/* Direct Social / Messaging Share Channels */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <span className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Quick Share Via
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href={shareWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              <a
                href={shareEmailUrl}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-stone-600" />
                <span>Email</span>
              </a>

              <a
                href={shareLinkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 text-xs font-semibold transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                <span>LinkedIn</span>
              </a>

              <a
                href={shareTwitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold transition-colors"
              >
                <Twitter className="w-3.5 h-3.5 text-stone-700" />
                <span>X / Twitter</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Dominica Classified Vacancy ID: <strong className="font-mono text-stone-700">{job.id}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 font-semibold text-stone-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
