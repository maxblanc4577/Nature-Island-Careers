import React from 'react';
import { JobListing } from '../types';
import { useJobContext } from '../context/JobContext';
import { X, MapPin, Building, Calendar, DollarSign, ShieldCheck, CheckCircle2, Bookmark, BookmarkCheck, Globe } from 'lucide-react';

interface JobDetailModalProps {
  job: JobListing | null;
  onClose: () => void;
  onApply: (job: JobListing) => void;
  onOpenAlert: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onApply,
  onOpenAlert,
}) => {
  const { toggleSaveJob, isJobSaved } = useJobContext();

  if (!job) return null;
  const saved = isJobSaved(job.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-start justify-between gap-4 bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <span className="font-semibold text-emerald-900">{job.company}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {job.parish} ({job.locality})
              </span>
              {job.isNepApproved && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-800 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> NEP Sponsored
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-955 font-display">
              {job.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleSaveJob(job.id)}
              className="p-2 text-stone-400 hover:text-emerald-800 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
              title={saved ? 'Remove saved' : 'Save job'}
            >
              {saved ? (
                <BookmarkCheck className="w-5 h-5 text-emerald-700 fill-emerald-100" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-stone-800 text-sm">
          
          {/* Global Remote Employer Banner */}
          {job.isGlobalRemote && (
            <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-teal-900 font-extrabold text-sm">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Global Remote Vacancy • International Employer</span>
                {job.employerCountry && (
                  <span className="bg-teal-200/80 text-teal-950 font-bold px-2 py-0.5 rounded-full text-xs">
                    {job.employerCountry}
                  </span>
                )}
              </div>
              <p className="text-slate-700 leading-relaxed">
                This position is offered by an international employer welcoming remote applicants residing in the Commonwealth of Dominica, CARICOM professionals, and global digital nomads living in Dominica on the <strong>Work In Nature (WIN) Extended Stay Visa</strong> (up to 18-month legal stay with zero local income tax on foreign earnings).
              </p>
              {job.timezoneRequirement && (
                <div className="text-[11px] font-semibold text-teal-950 flex items-center gap-1.5">
                  <span>⏱️ Timezone Expectation:</span>
                  <span className="font-mono text-emerald-800">{job.timezoneRequirement}</span>
                </div>
              )}
            </div>
          )}

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs">
            <div>
              <div className="text-[11px] text-stone-400 flex items-center gap-1 mb-0.5">
                <DollarSign className="w-3 h-3 text-emerald-700" /> Remuneration
              </div>
              <div className="font-semibold text-emerald-950 font-mono tabular-nums">
                EC${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-400">per {job.salaryPeriod}</div>
            </div>

            <div>
              <div className="text-[11px] text-stone-400 flex items-center gap-1 mb-0.5">
                <Building className="w-3 h-3 text-stone-500" /> Sector
              </div>
              <div className="font-semibold text-stone-900 truncate">
                {job.sector}
              </div>
              <div className="text-[10px] text-stone-400">{job.workModel}</div>
            </div>

            <div>
              <div className="text-[11px] text-stone-400 flex items-center gap-1 mb-0.5">
                <Calendar className="w-3 h-3 text-stone-500" /> Deadline
              </div>
              <div className="font-semibold text-stone-900 font-mono tabular-nums">
                {job.applicationDeadline}
              </div>
              <div className="text-[10px] text-stone-400">Posted {job.postedAt}</div>
            </div>

            <div>
              <div className="text-[11px] text-stone-400 flex items-center gap-1 mb-0.5">
                <ShieldCheck className="w-3 h-3 text-stone-500" /> Applicants
              </div>
              <div className="font-semibold text-stone-900 font-mono tabular-nums">
                {job.applicantsCount} submitted
              </div>
              <div className="text-[10px] text-stone-400">{job.viewsCount} views</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Role Overview
            </h3>
            <p className="text-stone-700 leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Key Responsibilities
            </h3>
            <ul className="space-y-2">
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Candidate Requirements & Credentials
            </h3>
            <ul className="space-y-2">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Compensation & Employee Benefits
            </h3>
            <ul className="space-y-2">
              {job.benefits.map((ben, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-2 shrink-0" />
                  <span>{ben}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Screening preview note */}
          {job.screeningQuestions.length > 0 && (
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
              <span className="font-semibold text-stone-900">Application Screening: </span>
              <span className="text-stone-600">
                This employer has {job.screeningQuestions.length} specific questionnaire item(s) regarding certifications and residency which you will answer during submission.
              </span>
            </div>
          )}

          {/* Parish context note */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Local Employment Division Compliance:</div>
              <div className="text-emerald-900/80 mt-0.5">
                This vacancy operates in accordance with the Commonwealth of Dominica Labour Standards Act and Dominica Social Security guidelines.
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onOpenAlert}
            className="text-xs text-stone-600 hover:text-emerald-900 font-medium underline underline-offset-2 cursor-pointer"
          >
            Notify me of similar jobs in {job.parish}
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onApply(job);
              }}
              className="flex-1 sm:flex-none px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors"
            >
              Apply for Vacancy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
