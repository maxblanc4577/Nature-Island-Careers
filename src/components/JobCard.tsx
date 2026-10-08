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
  Heart,
  Clock,
  Flame,
  BarChart3,
  Scale,
  TrendingUp,
  FolderPlus,
  Folder,
  Check,
  Plus,
} from 'lucide-react';

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
  onApply: (job: JobListing) => void;
  onQuickApply?: (job: JobListing) => void;
  onPromptAuth?: () => void;
  onOpenAiGuidance?: (sector: JobSector) => void;
  onShare?: (job: JobListing) => void;
  isCompared?: boolean;
  onToggleCompare?: (job: JobListing) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSelect,
  onApply,
  onQuickApply,
  onPromptAuth,
  onOpenAiGuidance,
  onShare,
  isCompared = false,
  onToggleCompare,
}) => {
  const {
    toggleSaveJob,
    isJobSaved,
    currentUser,
    savedJobFolders,
    saveJobToFolder,
    removeJobFromFolder,
    getJobFolders,
  } = useJobContext();
  const saved = isJobSaved(job.id);
  const jobFolders = getJobFolders(job.id);
  const [isPulsing, setIsPulsing] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = React.useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = React.useState(false);
  const [customFolderName, setCustomFolderName] = React.useState('');

  // Feature: Save Toggle with Heart Icon (persisted to localStorage via JobContext)
  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPulsing(true);
    toggleSaveJob(job.id);
    setTimeout(() => setIsPulsing(false), 550);
  };

  const handleToggleFolderMembership = (e: React.MouseEvent, folderId: string, folderName: string, isInFolder: boolean) => {
    e.stopPropagation();
    if (isInFolder) {
      removeJobFromFolder(job.id, folderId);
    } else {
      saveJobToFolder(job.id, folderName);
    }
  };

  const handleCreateCustomFolderAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleaned = customFolderName.trim();
    if (!cleaned) return;
    saveJobToFolder(job.id, cleaned);
    setCustomFolderName('');
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(job);
    } else {
      setShowShareModal(true);
    }
  };

  // Feature: 'New' badge or subtle pulse animation for jobs posted within the last 24 hours
  const isNewJob = React.useMemo(() => {
    if (!job.postedAt) return false;
    const postTime = new Date(job.postedAt).getTime();
    if (isNaN(postTime)) return false;
    const diffHours = (Date.now() - postTime) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  }, [job.postedAt]);

  // Feature: Status badge ('Active', 'Urgent', or 'Remote-Friendly')
  const statusBadge = React.useMemo<{
    label: 'Urgent' | 'Remote-Friendly' | 'Active';
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }>(() => {
    if (job.workModel === 'Remote' || job.isGlobalRemote || job.isRemoteAssignment) {
      return {
        label: 'Remote-Friendly',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/90',
        icon: Laptop,
      };
    }
    if (job.applicationDeadline) {
      const deadlineTime = new Date(job.applicationDeadline).getTime();
      const daysLeft = (deadlineTime - Date.now()) / (1000 * 60 * 60 * 24);
      if (!isNaN(daysLeft) && daysLeft >= 0 && daysLeft <= 7) {
        return {
          label: 'Urgent',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/90',
          icon: Clock,
        };
      }
    }
    return {
      label: 'Active',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      icon: CheckCircle2,
    };
  }, [job.workModel, job.isGlobalRemote, job.isRemoteAssignment, job.applicationDeadline]);

  // Feature: 'Recommended' badge for roles that align with user's saved experience tags
  const isRecommended = React.useMemo(() => {
    if (!currentUser) return false;
    const userSkills = currentUser.skills || [];
    const userSector = currentUser.careerSector;

    if (userSector && job.sector === userSector) return true;

    if (userSkills.length > 0) {
      const searchSpace = [
        job.title,
        job.sector,
        ...(job.requirements || []),
        ...(job.requiredSkills || []),
      ]
        .join(' ')
        .toLowerCase();

      return userSkills.some((skill) => skill.trim().length > 2 && searchSpace.includes(skill.toLowerCase().trim()));
    }
    return false;
  }, [currentUser, job]);

  // Feature: Competitive Intensity Chart calculation
  const competitiveIntensity = React.useMemo(() => {
    const applicants = job.applicantsCount || 0;
    const benchmarkDemand = 25; // Sector benchmark application count
    const percentage = Math.min(100, Math.round((applicants / benchmarkDemand) * 100));

    if (applicants < 10) {
      return {
        level: 'Low Competition',
        callout: 'High shortlist chance',
        barColor: 'bg-emerald-500',
        containerClass: 'bg-emerald-50/70 border-emerald-200/80',
        textColor: 'text-emerald-800',
        applicants,
        percentage,
      };
    } else if (applicants < 25) {
      return {
        level: 'Moderate Pace',
        callout: 'Normal review rate',
        barColor: 'bg-amber-500',
        containerClass: 'bg-amber-50/70 border-amber-200/80',
        textColor: 'text-amber-800',
        applicants,
        percentage,
      };
    } else {
      return {
        level: 'High Demand',
        callout: 'Competitive selection pool',
        barColor: 'bg-rose-500',
        containerClass: 'bg-rose-50/70 border-rose-200/80',
        textColor: 'text-rose-800',
        applicants,
        percentage,
      };
    }
  }, [job.applicantsCount]);

  const StatusIcon = statusBadge.icon;

  return (
    <article className="job-card-container group relative bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs hover:border-emerald-600/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1.5 before:rounded-r-full before:bg-transparent hover:before:bg-emerald-600 before:transition-all before:duration-300">
      
      <div>
        {/* Top Kicker: Badges, Status, Compare, and Heart Save Button */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="text-stone-900 font-bold">{job.company}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="text-stone-600">{job.parish}</span>

            {/* Dynamic Status Badge ('Active', 'Urgent', or 'Remote-Friendly') */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${statusBadge.badgeClass}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span>{statusBadge.label}</span>
            </span>

            {/* 'New' badge with subtle pulse animation for listings posted within last 24h */}
            {isNewJob && (
              <span className="relative inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>New</span>
              </span>
            )}

            {/* 'Recommended' badge for roles aligning with user profile experience tags */}
            {isRecommended && (
              <span
                className="inline-flex items-center gap-1 bg-violet-100 text-violet-900 border border-violet-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs"
                title="Recommended: Matches your profile skills and experience"
              >
                <Sparkles className="w-2.5 h-2.5 text-violet-700 fill-violet-600" />
                <span>Recommended</span>
              </span>
            )}

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

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Feature: Compare Checkbox */}
            {onToggleCompare && (
              <label
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors border select-none ${
                  isCompared
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/90'
                }`}
                title="Select to compare side-by-side"
              >
                <input
                  type="checkbox"
                  checked={isCompared}
                  onChange={() => onToggleCompare(job)}
                  className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                />
                <span className="text-[11px]">Compare</span>
              </label>
            )}

            <button
              type="button"
              onClick={handleShareClick}
              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-800 hover:bg-stone-50 transition-colors cursor-pointer"
              title="Share job opportunity"
              aria-label="Share job"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Feature: 'Save' toggle icon button (Heart icon) persisted to localStorage */}
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center border ${
                saved
                  ? 'text-rose-600 bg-rose-50 border-rose-200 shadow-2xs hover:bg-rose-100'
                  : 'text-stone-400 hover:text-rose-500 hover:bg-rose-50/60 border-stone-200/60'
              } ${isPulsing ? 'scale-125 transition-transform duration-200' : ''}`}
              title={saved ? 'Remove from saved vacancies' : 'Save vacancy (Heart)'}
              aria-label={saved ? 'Unsave vacancy' : 'Save vacancy'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  saved ? 'fill-rose-500 text-rose-500 stroke-rose-600' : 'text-stone-400 hover:text-rose-500'
                }`}
              />
            </button>

            {/* Feature: Save job to custom named folders */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                data-testid={`save-to-folder-btn-${job.id}`}
                onClick={() => setIsFolderMenuOpen((prev) => !prev)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                  jobFolders.length > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80'
                }`}
                title="Save job to custom named folders"
                aria-label="Save to folder"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">
                  {jobFolders.length > 0 ? jobFolders[0].name : 'Folder'}
                </span>
                {jobFolders.length > 1 && (
                  <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1 rounded">
                    +{jobFolders.length - 1}
                  </span>
                )}
              </button>

              {isFolderMenuOpen && (
                <div
                  data-testid={`folder-popover-${job.id}`}
                  className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30 space-y-2.5 text-left"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-amber-600" />
                      Save to Custom Folder
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFolderMenuOpen(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {savedJobFolders.map((folder) => {
                      const isInFolder = folder.jobIds.includes(job.id);
                      return (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={(e) =>
                            handleToggleFolderMembership(e, folder.id, folder.name, isInFolder)
                          }
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            isInFolder
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{folder.name}</span>
                          {isInFolder ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400">{folder.jobIds.length}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <form
                    onSubmit={handleCreateCustomFolderAndSave}
                    className="pt-2 border-t border-slate-100 flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={customFolderName}
                      onChange={(e) => setCustomFolderName(e.target.value)}
                      placeholder="New folder name..."
                      aria-label="New folder name"
                      className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
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
        <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
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

        {/* Feature: Competitive Intensity Chart */}
        <div className={`mt-3 p-2.5 rounded-xl border ${competitiveIntensity.containerClass} flex flex-col gap-1.5 transition-all`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-stone-600" />
              <span className="text-[11px] font-bold text-stone-800">
                Application Intensity:
              </span>
              <span className={`text-[11px] font-extrabold ${competitiveIntensity.textColor}`}>
                {competitiveIntensity.level}
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium font-mono">
              {competitiveIntensity.applicants} applicants · ~25 avg
            </span>
          </div>

          {/* Visual Bar Indicator */}
          <div className="w-full bg-stone-200/90 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${competitiveIntensity.barColor}`}
              style={{ width: `${Math.max(8, competitiveIntensity.percentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-500">
            <span>{competitiveIntensity.callout}</span>
            <span className="font-mono font-bold">{competitiveIntensity.percentage}% typical volume</span>
          </div>
        </div>

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
