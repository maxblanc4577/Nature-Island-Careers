import React from 'react';
import { JobListing, JobSector } from '../types';
import { useJobContext } from '../context/JobContext';
import { Bookmark, BookmarkCheck, ArrowRight, ShieldCheck, Laptop, Sparkles, Globe, Zap } from 'lucide-react';

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
  onApply: (job: JobListing) => void;
  onQuickApply?: (job: JobListing) => void;
  onOpenAiGuidance?: (sector: JobSector) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSelect,
  onApply,
  onQuickApply,
  onOpenAiGuidance,
}) => {
  const { toggleSaveJob, isJobSaved } = useJobContext();
  const saved = isJobSaved(job.id);
  const [isPulsing, setIsPulsing] = React.useState(false);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPulsing(true);
    toggleSaveJob(job.id);
    setTimeout(() => setIsPulsing(false), 550);
  };

  return (
    <article className="group bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-emerald-700/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      
      <div>
        {/* Top Kicker: Company and Save button */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="text-stone-900 font-semibold">{job.company}</span>
            <span aria-hidden="true">·</span>
            <span>{job.parish}</span>
            {job.isGlobalRemote && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-teal-900 bg-teal-50 border border-teal-200/90 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                  <Globe className="w-3 h-3 text-teal-600" />
                  {job.employerCountry ? `${job.employerCountry} Remote` : 'Global Remote'}
                </span>
              </>
            )}
            {job.isRemoteAssignment && !job.isGlobalRemote && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-emerald-700" />
                  Remote Work Assignment
                </span>
              </>
            )}
            {job.isNepApproved && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-800 font-medium flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  NEP Verified
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleToggleSave}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
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

        {/* Primary Job Title */}
        <h3
          onClick={() => onSelect(job)}
          className="text-base sm:text-lg font-bold text-stone-950 group-hover:text-emerald-900 transition-colors cursor-pointer leading-snug font-display"
        >
          {job.title}
        </h3>

        {/* Clean Unboxed Metadata with typographic separators */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 mt-2 mb-3.5">
          <span className="text-emerald-800 font-semibold font-mono tabular-nums">
            EC${job.minSalary.toLocaleString()} - EC${job.maxSalary.toLocaleString()}
            <span className="text-stone-400 font-sans font-normal text-[11px]"> / {job.salaryPeriod}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{job.workModel}</span>
          <span aria-hidden="true">·</span>
          <span>{job.employmentType}</span>
          <span aria-hidden="true">·</span>
          <span>{job.sector}</span>
          {job.projectDuration && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-stone-600 font-medium">{job.projectDuration}</span>
            </>
          )}
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
              if (onQuickApply) {
                onQuickApply(job);
              } else {
                onApply(job);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-bold transition-all shadow-xs cursor-pointer hover:shadow-sm text-xs"
            title="Quick Apply without opening full details"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Quick Apply</span>
          </button>
        </div>
      </div>

    </article>
  );
};
