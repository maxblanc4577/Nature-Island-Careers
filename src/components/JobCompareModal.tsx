import React from 'react';
import { JobListing } from '../types';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  X,
  Scale,
  CheckCircle2,
  ShieldCheck,
  Building,
  MapPin,
  DollarSign,
  Briefcase,
  Zap,
  Globe,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

interface JobCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobListing[];
  onApply: (job: JobListing) => void;
  onQuickApply?: (job: JobListing) => void;
  onRemoveCompare: (jobId: string) => void;
}

export const JobCompareModal: React.FC<JobCompareModalProps> = ({
  isOpen,
  onClose,
  jobs,
  onApply,
  onQuickApply,
  onRemoveCompare,
}) => {
  const modalRef = useModalKeyboard({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Side-by-Side Job Comparison"
        tabIndex={-1}
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-2xl border border-emerald-500/40 text-amber-300">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Side-by-Side Vacancy Comparison
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  {jobs.length} {jobs.length === 1 ? 'Job Selected' : 'Jobs Compared'}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Direct comparative analysis of compensation, employment models, requirements, and competitive intensity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-xl transition-colors cursor-pointer hover:bg-white/10"
            aria-label="Close comparison modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {jobs.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Scale className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No jobs selected for comparison</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Check the "Compare" box on any job card in the directory to compare key compensation and qualifications side-by-side.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="grid gap-4 min-w-[700px]"
                style={{
                  gridTemplateColumns: `repeat(${jobs.length}, minmax(280px, 1fr))`,
                }}
              >
                {jobs.map((job) => {
                  const applicants = job.applicantsCount || 0;
                  const intensityLevel =
                    applicants < 10 ? 'Low' : applicants < 25 ? 'Moderate' : 'High';

                  return (
                    <div
                      key={job.id}
                      className="bg-stone-50/70 border-2 border-stone-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-600/50 transition-all shadow-xs"
                    >
                      {/* Top Header & Remove */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            {job.company}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveCompare(job.id)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from comparison"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h3 className="font-extrabold text-stone-950 text-base leading-snug mb-1">
                          {job.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-3">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>
                            {job.parish} · {job.locality}
                          </span>
                        </div>

                        {/* Salary Highlight */}
                        <div className="p-3 bg-white border border-emerald-200/80 rounded-xl mb-3 shadow-2xs">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            Compensation
                          </span>
                          <div className="text-emerald-700 font-black font-mono text-base tabular-nums">
                            EC${job.minSalary.toLocaleString()} – EC${job.maxSalary.toLocaleString()}
                            <span className="text-xs font-sans text-stone-500 font-normal"> /{job.salaryPeriod}</span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800">
                            ≈ ${(job.minSalary / 2.7).toFixed(0)} – ${(job.maxSalary / 2.7).toFixed(0)} USD
                          </span>
                        </div>

                        {/* Attribute Matrix */}
                        <div className="space-y-2 text-xs divide-y divide-stone-200/60">
                          <div className="pt-2 flex justify-between">
                            <span className="text-stone-500 font-medium">Work Model:</span>
                            <span className="font-bold text-stone-800">{job.workModel}</span>
                          </div>
                          <div className="pt-2 flex justify-between">
                            <span className="text-stone-500 font-medium">Employment:</span>
                            <span className="font-bold text-stone-800">{job.employmentType}</span>
                          </div>
                          <div className="pt-2 flex justify-between">
                            <span className="text-stone-500 font-medium">Industry Sector:</span>
                            <span className="font-bold text-stone-800 text-right truncate max-w-[170px]" title={job.sector}>
                              {job.sector}
                            </span>
                          </div>
                          <div className="pt-2 flex justify-between items-center">
                            <span className="text-stone-500 font-medium">NEP Verified:</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                job.isNepApproved
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {job.isNepApproved ? 'NEP Accredited' : 'Standard'}
                            </span>
                          </div>
                          <div className="pt-2 flex justify-between items-center">
                            <span className="text-stone-500 font-medium">Competition:</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                intensityLevel === 'Low'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : intensityLevel === 'Moderate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {intensityLevel} ({applicants} applicants)
                            </span>
                          </div>
                          <div className="pt-2 flex justify-between">
                            <span className="text-stone-500 font-medium">Deadline:</span>
                            <span className="font-mono font-bold text-stone-800">
                              {job.applicationDeadline}
                            </span>
                          </div>
                        </div>

                        {/* Top Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-stone-200">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                              Key Requirements
                            </span>
                            <ul className="text-[11px] text-stone-600 space-y-1">
                              {job.requirements.slice(0, 3).map((r, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span className="line-clamp-2">{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Top Benefits */}
                        {job.benefits && job.benefits.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-stone-200">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                              Perks & Benefits
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {job.benefits.slice(0, 3).map((b, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-white border border-stone-200 text-stone-700 px-1.5 py-0.5 rounded"
                                >
                                  ✓ {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-4 border-t border-stone-200 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onQuickApply) {
                              onQuickApply(job);
                            } else {
                              onApply(job);
                            }
                            onClose();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer text-xs"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Quick Apply</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onApply(job);
                            onClose();
                          }}
                          className="w-full py-1.5 text-center text-xs font-semibold text-stone-600 hover:text-emerald-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        >
                          View Full Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 border-t border-stone-200 p-4 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            Compare up to 4 roles simultaneously across Dominican parishes.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
