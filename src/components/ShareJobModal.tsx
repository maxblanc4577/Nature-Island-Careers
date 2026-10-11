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
  Eye,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface ShareJobModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
}

export function buildJobShareUrl(jobId: string, customBaseUrl?: string): string {
  const baseUrl =
    customBaseUrl ??
    (typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : 'https://natureislandcareers.com');
  return `${baseUrl}?job=${jobId}`;
}

export function buildShareViaEmailMailto(
  job: Pick<JobListing, 'id' | 'title' | 'company'> &
    Partial<Pick<JobListing, 'parish' | 'locality' | 'minSalary' | 'maxSalary' | 'sector'>>,
  customShareUrl?: string
): string {
  const shareUrl = customShareUrl || buildJobShareUrl(job.id);
  const subject = `Job Opportunity: ${job.title} at ${job.company}`;
  const locationLine = job.parish
    ? `Location: ${job.parish}${job.locality ? ` (${job.locality})` : ''}\n`
    : '';
  const salaryLine =
    typeof job.minSalary === 'number' && typeof job.maxSalary === 'number'
      ? `Compensation: EC$ ${job.minSalary.toLocaleString()} - EC$ ${job.maxSalary.toLocaleString()} / month\n`
      : '';
  const body = `Hi,\n\nI wanted to share this job opportunity with you:\n\nPosition: ${job.title}\nCompany: ${job.company}\n${locationLine}${salaryLine}\nView full job details and apply here:\n${shareUrl}`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildShareViaWhatsAppUrl(
  job: Pick<JobListing, 'id' | 'title' | 'company'> &
    Partial<Pick<JobListing, 'parish' | 'locality' | 'minSalary' | 'maxSalary' | 'sector'>>,
  customShareUrl?: string
): string {
  const shareUrl = customShareUrl || buildJobShareUrl(job.id);
  const locationPart = job.parish
    ? `\n📍 Location: ${job.parish}${job.locality ? ` (${job.locality})` : ''}`
    : '';
  const salaryPart =
    typeof job.minSalary === 'number' && typeof job.maxSalary === 'number'
      ? `\n💰 Compensation: EC$ ${job.minSalary.toLocaleString()} - EC$ ${job.maxSalary.toLocaleString()} / month`
      : '';
  const message = `🇩🇲 Job Opportunity: ${job.title} at ${job.company}${locationPart}${salaryPart}\n\n👉 View details & apply here:\n${shareUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildJobBoardPreviewHtml(job: JobListing, customShareUrl?: string): string {
  const shareUrl = customShareUrl || buildJobShareUrl(job.id);
  const minUsd = Math.round(job.minSalary / 2.7);
  const maxUsd = Math.round(job.maxSalary / 2.7);
  const statusLabel =
    job.workModel === 'Remote' || job.isGlobalRemote || job.isRemoteAssignment
      ? 'Remote-Friendly'
      : 'Active';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview: ${escapeHtml(job.title)} — ${escapeHtml(job.company)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f4;
      color: #1c1917;
      padding: 20px;
    }
    .preview-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #064e3b;
      color: #ecfdf5;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .preview-badge {
      background: rgba(255,255,255,0.18);
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .job-card {
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }
    .kicker {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #57534e;
      margin-bottom: 10px;
    }
    .company { font-weight: 700; color: #1c1917; }
    .status-pill {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .title {
      font-size: 20px;
      font-weight: 900;
      color: #090d16;
      margin-bottom: 12px;
      line-height: 1.25;
    }
    .salary-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .salary-box {
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      padding: 6px 12px;
      border-radius: 12px;
      font-weight: 800;
      color: #047857;
      font-size: 15px;
    }
    .tag {
      background: #f5f5f4;
      border: 1px solid #e7e5e4;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #292524;
    }
    .desc {
      font-size: 13px;
      color: #57534e;
      line-height: 1.55;
      margin-bottom: 16px;
    }
    .footer {
      border-top: 1px solid #f5f5f4;
      padding-top: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #78716c;
    }
    .readonly-cta {
      background: #e7e5e4;
      color: #57534e;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 11px;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="preview-banner">
    <span>Nature Island Careers · Main Board Listing Preview</span>
    <span class="preview-badge">Read-Only Preview</span>
  </div>
  <article class="job-card" aria-label="Read-only job card preview">
    <div class="kicker">
      <span class="company">${escapeHtml(job.company)}</span>
      <span>·</span>
      <span>${escapeHtml(job.parish)}</span>
      <span class="status-pill">${escapeHtml(statusLabel)}</span>
    </div>
    <h1 class="title">${escapeHtml(job.title)}</h1>
    <div class="salary-row">
      <div class="salary-box">
        EC$ ${job.minSalary.toLocaleString()} – ${job.maxSalary.toLocaleString()} /${escapeHtml(job.salaryPeriod)} (≈ $${minUsd}–$${maxUsd} USD)
      </div>
      <span class="tag">${escapeHtml(job.workModel)}</span>
      <span class="tag">${escapeHtml(job.employmentType)}</span>
      <span class="tag">${escapeHtml(job.sector)}</span>
    </div>
    <p class="desc">${escapeHtml(job.description)}</p>
    <div class="footer">
      <span>Deadline: <strong>${escapeHtml(job.applicationDeadline || 'Open until filled')}</strong> · ID: ${escapeHtml(job.id)}</span>
      <span class="readonly-cta">Read-Only Board Preview</span>
    </div>
  </article>
  <p style="margin-top: 12px; font-size: 11px; color: #78716c; text-align: center;">
    Direct URL: ${escapeHtml(shareUrl)}
  </p>
</body>
</html>`;
}

export function openJobBoardPreviewPopup(
  job: JobListing,
  customOpen?: (url?: string | URL, target?: string, features?: string) => Window | null
): Window | null {
  try {
    const openFn =
      customOpen ??
      (typeof window !== 'undefined' && typeof window.open === 'function'
        ? window.open.bind(window)
        : undefined);
    if (!openFn) return null;

    const popupFeatures =
      'width=640,height=560,left=160,top=120,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
    const popupWindow = openFn('', 'JobBoardListingPreview', popupFeatures);
    if (popupWindow && popupWindow.document) {
      popupWindow.document.open();
      popupWindow.document.write(buildJobBoardPreviewHtml(job));
      popupWindow.document.close();
      if (typeof popupWindow.focus === 'function') {
        popupWindow.focus();
      }
    }
    return popupWindow;
  } catch {
    return null;
  }
}

export const ShareJobModal: React.FC<ShareJobModalProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  const modalRef = useModalKeyboard({ isOpen: isOpen && Boolean(job), onClose });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);

  if (!isOpen || !job) return null;

  // Generate unique URL with job query param / anchor
  const shareUrl = buildJobShareUrl(job.id);
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

  const handleOpenPreviewPopup = () => {
    openJobBoardPreviewPopup(job);
    setIsPreviewPopupOpen(true);
  };

  const shareEmailUrl = buildShareViaEmailMailto(job, shareUrl);
  const shareWhatsAppUrl = buildShareViaWhatsAppUrl(job, shareUrl);
  const shareLinkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const shareTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  const applicantsCount = job.applicantsCount || 0;
  const intensityPercent = Math.min(100, Math.round((applicantsCount / 25) * 100));
  const intensityLevel =
    applicantsCount < 10
      ? 'Low Competition'
      : applicantsCount < 25
      ? 'Moderate Pace'
      : 'High Demand';

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

          <div className="flex items-center gap-2">
            {/* Preview Button */}
            <button
              type="button"
              onClick={handleOpenPreviewPopup}
              data-testid="preview-job-listing-btn"
              aria-label="Preview how this job listing appears on the main board"
              title="Open a temporary read-only preview of how this job listing appears on the main board"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-700/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span>Preview</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              aria-label="Close share dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-stone-800">
          {/* Job Snippet Card */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                {job.sector}
              </span>
              <span className="text-[10px] text-stone-400 font-medium">
                Main Board Summary
              </span>
            </div>
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
          <div className="space-y-2.5 pt-2 border-t border-stone-200">
            <span className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Quick Share Via
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Prominent Share via Email Button */}
              <a
                href={shareEmailUrl}
                data-testid="share-via-email-btn"
                aria-label={`Share ${job.title} at ${job.company} via Email`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-700/30 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 text-xs font-bold transition-colors shadow-2xs"
              >
                <Mail className="w-4 h-4 text-emerald-700" />
                <span>Share via Email</span>
              </a>

              {/* Prominent Share via WhatsApp Button launching wa.me intent */}
              <a
                href={shareWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="share-via-whatsapp-btn"
                aria-label={`Share ${job.title} at ${job.company} via WhatsApp`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-600/40 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Share via WhatsApp</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2">
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

      {/* Temporary Read-Only Main Board Preview Small Pop-up Window */}
      {isPreviewPopupOpen && (
        <div
          data-testid="job-board-preview-popup"
          role="dialog"
          aria-modal="true"
          aria-label={`Read-only main board preview for ${job.title}`}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-stone-100 w-full max-w-xl rounded-2xl shadow-2xl border-2 border-stone-300 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Small Pop-up Window Title Bar */}
            <div className="px-4 py-2.5 bg-emerald-950 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-800/90 text-emerald-100 text-[10px] font-bold uppercase tracking-wider border border-emerald-600/50">
                  <Lock className="w-2.5 h-2.5" />
                  Read-Only Preview
                </span>
                <span className="text-xs font-bold text-emerald-50 truncate">
                  Main Board Appearance · Pop-up Window
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewPopupOpen(false)}
                data-testid="close-preview-popup-btn"
                aria-label="Close preview pop-up window"
                className="px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Preview</span>
              </button>
            </div>

            {/* Simulated Main Board Surface with Read-Only JobCard */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-md select-none pointer-events-none">
                {/* Top Kicker */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 font-medium">
                    <span className="text-stone-900 font-bold">{job.company}</span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span className="text-stone-600">{job.parish}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200/90">
                      <span>
                        {job.workModel === 'Remote' || job.isGlobalRemote || job.isRemoteAssignment
                          ? 'Remote-Friendly'
                          : 'Active'}
                      </span>
                    </span>
                    {job.isNepApproved && (
                      <>
                        <span aria-hidden="true" className="text-stone-300">·</span>
                        <span className="text-amber-800 font-medium flex items-center gap-0.5 text-[11px]">
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          NEP Verified
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-tight tracking-tight font-display mb-3 flex flex-wrap items-baseline gap-2">
                  <span>{job.title}</span>
                  {job.featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                      Featured
                    </span>
                  )}
                </h3>

                {/* Salary & Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50/95 border border-emerald-300/80">
                    <span className="text-emerald-700 font-black font-mono text-sm sm:text-base tabular-nums">
                      EC$ {job.minSalary.toLocaleString()} – {job.maxSalary.toLocaleString()}
                    </span>
                    <span className="text-emerald-800/80 text-xs font-semibold">
                      /{job.salaryPeriod}
                    </span>
                    <span className="text-emerald-300 text-xs">|</span>
                    <span className="text-emerald-800 font-bold text-xs">
                      ≈ ${(job.minSalary / 2.7).toFixed(0)}–${(job.maxSalary / 2.7).toFixed(0)} USD
                    </span>
                  </div>
                  <span className="bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-lg text-stone-800 font-bold text-xs">
                    {job.workModel}
                  </span>
                  <span className="bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-lg text-stone-800 font-bold text-xs">
                    {job.employmentType}
                  </span>
                  <span className="text-stone-600 font-semibold text-xs">
                    {job.sector}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Competitive Intensity */}
                <div className="mt-3 p-2.5 rounded-xl border bg-stone-50 border-stone-200/80 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-stone-600" />
                      <span className="text-[11px] font-bold text-stone-800">
                        Application Intensity:
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-800">
                        {intensityLevel}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {applicantsCount} applicants
                    </span>
                  </div>
                  <div className="w-full bg-stone-200/90 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(8, intensityPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Read-Only Footer */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-400">
                    Deadline:{' '}
                    <span className="text-stone-700 font-medium font-mono">
                      {job.applicationDeadline}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 font-bold text-[11px] border border-stone-200">
                      Quick View
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-800/80 text-white font-bold text-[11px]">
                      View & Apply
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                  Temporary read-only preview of main board card layout
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewPopupOpen(false)}
                  className="text-emerald-800 hover:underline font-bold cursor-pointer"
                >
                  Dismiss Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
