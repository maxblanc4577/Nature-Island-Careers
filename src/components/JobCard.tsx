import React from 'react';
import { JobListing, JobSector } from '../types';
import { useJobContext } from '../context/JobContext';
import { ShareJobModal } from './ShareJobModal';
import {
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  ShieldCheck,
  Laptop,
  Sparkles,
  Globe,
  Zap,
  Share2,
  Eye,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
  onApply: (job: JobListing) => void;
  onQuickApply?: (job: JobListing) => void;
  onPromptAuth?: () => void;
  onOpenAiGuidance?: (sector: JobSector) => void;
  onShare?: (job: JobListing) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSelect,
  onApply,
  onQuickApply,
  onPromptAuth,
  onOpenAiGuidance,
  onShare,
}) => {
  const { toggleSaveJob, isJobSaved, currentUser } = useJobContext();
  const saved = isJobSaved(job.id);
  const [isPulsing, setIsPulsing] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = React.useState(false);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPulsing(true);
    toggleSaveJob(job.id);
    setTimeout(() => setIsPulsing(false), 550);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(job);
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <article className="job-card-container group relative bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs hover:border-emerald-600/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1.5 before:rounded-r-full before:bg-transparent hover:before:bg-emerald-600 before:transition-all before:duration-300">
      
      <div>
        {/* Top Kicker: Company and Save button */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="text-stone-900 font-bold">{job.company}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="text-stone-600">{job.parish}</span>
            {job.isGlobalRemote && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-teal-900 bg-teal-50 border border-teal-200/90 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                  <Globe className="w-3 h-3 text-teal-600" />
                  {job.employerCountry ? `${job.employerCountry} Remote` : 'Global Remote'}
                </span>
              </>
            )}
            {job.isRemoteAssignment && !job.isGlobalRemote && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-emerald-700" />
                  Remote Work Assignment
                </span>
              </>
            )}
            {job.isNepApproved && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-amber-800 font-medium flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  NEP Verified
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleShareClick}
              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-800 hover:bg-stone-50 transition-colors cursor-pointer"
              title="Share job opportunity"
              aria-label="Share job"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleSave}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPulsing
                  ? 'animate-heartbeat text-emerald-600 bg-emerald-50'
                  : 'text-stone-400 hover:text-emerald-800 hover:bg-stone-50'
              }`}
              title={saved ? 'Remove saved vacancy' : 'Save vacancy'}
              aria-label="Bookmark job"
            >
              {saved ? (
                <BookmarkCheck
                  className={`w-4 h-4 text-emerald-700 fill-emerald-100 ${
                    isPulsing ? 'text-emerald-600 fill-emerald-300' : ''
                  }`}
                />
              ) : (
                <Bookmark
                  className={`w-4 h-4 ${
                    isPulsing ? 'text-emerald-600 fill-emerald-200' : ''
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {/* Primary Job Title with High Visual Hierarchy */}
        <h3
          onClick={() => onSelect(job)}
          className="text-xl sm:text-2xl font-black text-slate-950 group-hover:text-emerald-700 transition-colors duration-200 cursor-pointer leading-tight tracking-tight font-display mb-3 flex flex-wrap items-baseline gap-2.5"
        >
          <span>{job.title}</span>
          {job.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
              Featured
            </span>
          )}
        </h3>

        {/* Elevated Salary Range & Work Attributes with Distinct Styling */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50/95 border border-emerald-300/80 shadow-xs">
            <span className="text-emerald-700 font-black font-mono text-base sm:text-lg tabular-nums tracking-tight">
              <span className="text-xs uppercase font-sans font-extrabold mr-1 text-emerald-800">EC$</span>
              {job.minSalary.toLocaleString()} – {job.maxSalary.toLocaleString()}
            </span>
            <span className="text-emerald-800/80 font-sans font-semibold text-xs lowercase">
              /{job.salaryPeriod}
            </span>
            <span className="text-emerald-300 font-sans text-xs">|</span>
            <span className="text-emerald-800 font-sans font-bold text-xs">
              ≈ ${(job.minSalary / 2.7).toFixed(0)}–${(job.maxSalary / 2.7).toFixed(0)} USD
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg text-stone-800 font-bold">
              {job.workModel}
            </span>
            <span className="bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg text-stone-800 font-bold">
              {job.employmentType}
            </span>
            <span className="text-stone-600 font-semibold text-xs px-1">
              {job.sector}
            </span>
            {job.projectDuration && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-600 font-medium">{job.projectDuration}</span>
              </>
            )}
          </div>
        </div>

        {/* Concise Description preview */}
        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Required skills preview if remote assignment */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
            <span className="text-stone-400 text-[10px] uppercase font-semibold">Deliverables:</span>
            {job.requiredSkills.slice(0, 3).map((sk) => (
              <span key={sk} className="bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded text-stone-700">
                {sk}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Row: Deadlines and CTA Buttons */}
      <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-[11px] text-stone-400 flex items-center gap-2">
          <span>Deadline: <span className="text-stone-700 font-medium font-mono tabular-nums">{job.applicationDeadline}</span></span>
          {onOpenAiGuidance && (
            <button
              onClick={() => onOpenAiGuidance(job.sector)}
              className="hidden sm:inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium hover:underline cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>AI Prep Tips</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick View in-card toggle button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickViewOpen(!isQuickViewOpen);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-xs border ${
              isQuickViewOpen
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-200/90'
            }`}
            title="Preview key details directly inside this card"
            aria-expanded={isQuickViewOpen}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isQuickViewOpen ? 'Hide Preview' : 'Quick View'}</span>
            {isQuickViewOpen ? (
              <ChevronUp className="w-3 h-3 text-emerald-300" />
            ) : (
              <ChevronDown className="w-3 h-3 text-emerald-700" />
            )}
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            className="flex items-center gap-1 px-2.5 py-1.5 text-stone-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg font-medium transition-colors cursor-pointer text-xs border border-stone-200"
            title="Share job opportunity"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(job);
            }}
            className="px-3 py-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg font-medium transition-colors cursor-pointer text-xs"
          >
            Details
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (currentUser) {
                if (onQuickApply) {
                  onQuickApply(job);
                } else {
                  onApply(job);
                }
              } else {
                if (onPromptAuth) {
                  onPromptAuth();
                } else if (onQuickApply) {
                  onQuickApply(job);
                } else {
                  onApply(job);
                }
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold transition-all shadow-xs cursor-pointer hover:shadow-sm text-xs active:scale-95"
            title={currentUser ? "Quick Apply with your saved candidate profile" : "Sign in to Quick Apply"}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Quick Apply</span>
          </button>
        </div>
      </div>

      {/* Abbreviated In-Card Quick View Section */}
      {isQuickViewOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 pt-4 border-t border-emerald-100 bg-emerald-50/40 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-5 sm:p-6 rounded-b-2xl border-b border-x border-emerald-200/60 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header pill & full description excerpt */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-700" />
                Abbreviated Job Overview
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                Parish: <strong className="text-stone-800">{job.parish}</strong> · {job.locality}
              </span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-normal">
              {job.description}
            </p>
          </div>

          {/* Key Responsibilities & Requirements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-stone-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-emerald-700" />
                  Key Responsibilities
                </span>
                <ul className="space-y-1 text-stone-600 text-[11px]">
                  {job.responsibilities.slice(0, 3).map((r, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                      <span className="line-clamp-2">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-stone-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3 text-indigo-700" />
                  Core Requirements
                </span>
                <ul className="space-y-1 text-stone-600 text-[11px]">
                  {job.requirements.slice(0, 3).map((req, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-700 font-bold shrink-0">•</span>
                      <span className="line-clamp-2">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Benefits & Accreditation Badges */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Benefits & Compensation:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {job.benefits.map((b, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Footer inside In-Card view */}
          <div className="pt-2.5 flex items-center justify-between border-t border-emerald-200/60 text-xs">
            <span className="text-[11px] text-stone-500">
              Application Deadline: <strong className="text-stone-800 font-mono">{job.applicationDeadline}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(job)}
                className="text-emerald-800 hover:text-emerald-950 font-bold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Full Details Modal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareJobModal
          job={job}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </article>
  );
};
