import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { JobListing, Parish, JobSector } from '../types';
import { BrandLogoMark } from './BrandLogo';
import {
  Briefcase,
  Search,
  MapPin,
  Laptop,
  Bookmark,
  Bell,
  User,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Wifi,
  BatteryCharging,
  Signal,
  ChevronRight,
  Building,
  Compass,
  FileText,
  Share2,
  ArrowUpRight,
  Smartphone,
  Monitor,
  Columns,
  Maximize2,
  Minimize2,
  Plus,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  DollarSign,
  Zap,
  Trash2,
  RotateCcw,
} from 'lucide-react';

export type PlatformViewMode = 'desktop' | 'ios' | 'android' | 'compare';

export type AppTabType =
  | 'jobs'
  | 'remote'
  | 'profile'
  | 'applications'
  | 'resume_builder'
  | 'recruiter'
  | 'analytics'
  | 'career';

interface MobilePlatformViewsProps {
  viewMode: PlatformViewMode;
  onChangeViewMode: (mode: PlatformViewMode) => void;
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  jobs: JobListing[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedParish: Parish | 'All';
  setSelectedParish: (p: Parish | 'All') => void;
  selectedSector: JobSector | 'All';
  setSelectedSector: (s: JobSector | 'All') => void;
  nepOnly: boolean;
  setNepOnly: (v: boolean) => void;
  minSalary: number;
  setMinSalary: (v: number) => void;
  onResetFilters: () => void;
  onSelectJob: (job: JobListing) => void;
  onApplyJob: (job: JobListing) => void;
  onShareJob: (job: JobListing) => void;
  onOpenAuth: (mode?: 'jobseeker_register' | 'client_register' | 'login') => void;
  onOpenNotifications: () => void;
  onOpenAlertModal: () => void;
  onOpenRemoteModal: () => void;
}

const PARISH_OPTIONS: Array<Parish | 'All'> = [
  'All',
  'St. George',
  'St. John',
  'St. Paul',
  'St. Andrew',
  'St. Patrick',
  'St. Joseph',
  'St. David',
  'St. Luke',
  'St. Mark',
  'St. Peter',
  'Island-wide / Remote',
];

const SECTOR_OPTIONS: Array<JobSector | 'All'> = [
  'All',
  'Eco-Tourism & Hospitality',
  'Renewable Energy & Geothermal',
  'Agriculture & Agro-Processing',
  'Healthcare & Medical',
  'Banking & Financial Services',
  'Information Technology & Digital',
  'Education & Training',
  'Logistics & Marine Services',
  'Public Sector & Cooperatives',
];

type MobileInnerTab = 'jobs' | 'remote' | 'saved' | 'career' | 'profile';

interface SingleDeviceViewProps extends Omit<MobilePlatformViewsProps, 'viewMode' | 'onChangeViewMode'> {
  platform: 'ios' | 'android';
  displayLayout: 'framed' | 'fullwidth';
  onSwitchToDesktop: () => void;
}

export const SingleMobileDeviceView: React.FC<SingleDeviceViewProps> = ({
  platform,
  displayLayout,
  activeTab,
  setActiveTab,
  jobs,
  searchQuery,
  setSearchQuery,
  selectedParish,
  setSelectedParish,
  selectedSector,
  setSelectedSector,
  nepOnly,
  setNepOnly,
  minSalary,
  setMinSalary,
  onResetFilters,
  onSelectJob,
  onApplyJob,
  onShareJob,
  onOpenAuth,
  onOpenNotifications,
  onOpenAlertModal,
  onOpenRemoteModal,
  onSwitchToDesktop,
}) => {
  const {
    currentUser,
    savedJobIds,
    toggleSaveJob,
    applications,
    unreadNotificationCount,
    unreadJobAlertCount,
    logoutUser,
    dismissedJobIds,
    dismissJob,
    restoreDismissedJob,
    clearDismissedJobs,
    quickApplyToJob,
  } = useJobContext();

  const [mobileTab, setMobileTab] = useState<MobileInnerTab>(() => {
    if (activeTab === 'remote') return 'remote';
    if (activeTab === 'career' || activeTab === 'resume_builder' || activeTab === 'analytics') return 'career';
    if (activeTab === 'profile' || activeTab === 'applications' || activeTab === 'recruiter') return 'profile';
    return 'jobs';
  });

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'remote' | 'nep'>('all');

  // Swipe to Dismiss interaction state for iOS and Android job cards
  const [swipingJobId, setSwipingJobId] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [lastDismissedJob, setLastDismissedJob] = useState<JobListing | null>(null);
  const [mobileQuickApplyReceipt, setMobileQuickApplyReceipt] = useState<
    Record<string, { applicationId: string; resumeFileName: string }>
  >({});

  const handleCardSwipeStart = (jobId: string, clientX: number) => {
    setSwipingJobId(jobId);
    setSwipeStartX(clientX);
    setSwipeOffset(0);
  };

  const handleCardSwipeMove = (jobId: string, clientX: number) => {
    if (swipingJobId !== jobId || swipeStartX === null) return;
    const delta = clientX - swipeStartX;
    setSwipeOffset(delta);
  };

  const handleCardDismiss = (job: JobListing) => {
    dismissJob(job.id);
    setLastDismissedJob(job);
    setSwipingJobId(null);
    setSwipeStartX(null);
    setSwipeOffset(0);
  };

  const handleCardSwipeEnd = (job: JobListing) => {
    if (swipingJobId === job.id && Math.abs(swipeOffset) >= 70) {
      handleCardDismiss(job);
      return;
    }
    setSwipingJobId(null);
    setSwipeStartX(null);
    setSwipeOffset(0);
  };

  const handleUndoMobileDismiss = () => {
    if (lastDismissedJob) {
      restoreDismissedJob(lastDismissedJob.id);
      setLastDismissedJob(null);
    }
  };

  const handleMobileQuickApply = (job: JobListing) => {
    if (!currentUser) {
      onApplyJob(job);
      return;
    }
    const res = quickApplyToJob(job.id);
    if (res) {
      setMobileQuickApplyReceipt((prev) => ({
        ...prev,
        [job.id]: {
          applicationId: res.applicationId,
          resumeFileName: res.resumeFileName,
        },
      }));
    }
  };

  const hasUserAppliedToJob = (jobId: string): boolean => {
    if (mobileQuickApplyReceipt[jobId]) return true;
    if (!currentUser) return false;
    return applications.some(
      (app) =>
        app.jobId === jobId &&
        app.applicantEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  };

  const handleMobileTabSelect = (tab: MobileInnerTab) => {
    setMobileTab(tab);
    if (tab === 'jobs') setActiveTab('jobs');
    if (tab === 'remote') setActiveTab('remote');
    if (tab === 'career') setActiveTab('career');
    if (tab === 'profile') {
      setActiveTab(currentUser?.role === 'client' ? 'recruiter' : 'profile');
    }
  };

  const displayedJobs = React.useMemo(() => {
    let list = jobs.filter((j) => !dismissedJobIds.includes(j.id));
    if (mobileTab === 'remote' || segmentFilter === 'remote') {
      list = list.filter((j) => j.workModel === 'Remote' || j.isRemoteAssignment || j.isGlobalRemote);
    } else if (mobileTab === 'saved') {
      list = list.filter((j) => savedJobIds.includes(j.id));
    }
    if (segmentFilter === 'nep') {
      list = list.filter((j) => j.isNepApproved);
    }
    return list;
  }, [jobs, mobileTab, segmentFilter, savedJobIds, dismissedJobIds]);

  const totalAlerts = (unreadJobAlertCount || 0) + (unreadNotificationCount || 0);

  // ============================================================================
  // iOS 18 NATIVE VIEW (iPhone 16 Pro / Human Interface Guidelines)
  // ============================================================================
  if (platform === 'ios') {
    return (
      <div
        data-testid="ios-view-container"
        className={` mx-auto transition-all duration-300 ${
          displayLayout === 'framed'
            ? 'w-full max-w-[410px] rounded-[52px] p-[11px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.55)] border-[3px] border-slate-600/80 relative'
            : 'w-full max-w-2xl rounded-3xl border border-slate-200 shadow-xl bg-white overflow-hidden'
        }`}
      >
        {/* Hardware Side Buttons (Framed Mode Only) */}
        {displayLayout === 'framed' && (
          <>
            <div className="hidden sm:block absolute -left-[5px] top-28 w-[3px] h-8 bg-slate-600 rounded-l-md" />
            <div className="hidden sm:block absolute -left-[5px] top-40 w-[3px] h-14 bg-slate-600 rounded-l-md" />
            <div className="hidden sm:block absolute -left-[5px] top-56 w-[3px] h-14 bg-slate-600 rounded-l-md" />
            <div className="hidden sm:block absolute -right-[5px] top-44 w-[3px] h-20 bg-slate-600 rounded-r-md" />
          </>
        )}

        {/* Inner iOS Screen Canvas */}
        <div
          className={`bg-[#F2F2F7] text-slate-900 flex flex-col overflow-hidden relative ${
            displayLayout === 'framed' ? 'rounded-[42px] h-[812px]' : 'min-h-[760px]'
          }`}
        >
          {/* iOS 18 Status Bar + Dynamic Island */}
          <div
            data-testid="ios-status-bar"
            className="sticky top-0 z-30 bg-[#F2F2F7]/90 backdrop-blur-xl px-6 pt-2.5 pb-2 flex items-center justify-between text-xs font-semibold text-slate-900 select-none"
          >
            <span className="font-bold tracking-tight text-[13px] w-14">9:41</span>

            {/* Dynamic Island */}
            <button
              type="button"
              data-testid="ios-dynamic-island"
              onClick={onOpenNotifications}
              className="bg-black text-white rounded-full px-3.5 py-1 flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer"
              title="iOS Dynamic Island — Live Dominica Job Activity"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-tight text-emerald-300">
                🇩🇲 {displayedJobs.length} Roles
              </span>
              {totalAlerts > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {totalAlerts}
                </span>
              )}
            </button>

            <div className="flex items-center justify-end gap-1.5 w-14 text-slate-900">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>

          {/* iOS Large Title Navigation Header */}
          <div className="bg-[#F2F2F7]/90 backdrop-blur-xl px-4 pb-3 border-b border-slate-300/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-[#082407] inline-flex items-center justify-center p-0.5">
                  <BrandLogoMark className="w-full h-full" />
                </span>
                <span>Nature Island Careers • iOS 18</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(true)}
                  data-testid="ios-filter-button"
                  aria-label="Open iOS Filters"
                  className="min-h-[36px] min-w-[36px] px-2.5 rounded-full bg-white/90 text-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-2xs border border-slate-200/80 active:scale-95 transition-transform cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  aria-label="iOS Notifications"
                  className="min-h-[36px] min-w-[36px] rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-2xs border border-slate-200/80 relative active:scale-95 transition-transform cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-emerald-700" />
                  {totalAlerts > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {totalAlerts}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {mobileTab === 'jobs' && 'Nature Island Jobs'}
              {mobileTab === 'remote' && 'WIN Remote Visa'}
              {mobileTab === 'saved' && `Saved Vacancies (${savedJobIds.length})`}
              {mobileTab === 'career' && 'Career AI & Resume'}
              {mobileTab === 'profile' && (currentUser ? currentUser.name : 'Account & Profile')}
            </h2>

            {/* iOS Native Search Bar */}
            {(mobileTab === 'jobs' || mobileTab === 'remote' || mobileTab === 'saved') && (
              <div className="mt-2.5 space-y-2.5">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Dominica jobs, companies, parishes..."
                    data-testid="ios-search-input"
                    className="w-full pl-9 pr-8 py-2 bg-slate-200/75 focus:bg-white rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* iOS Segmented Control */}
                <div
                  data-testid="ios-segmented-control"
                  className="grid grid-cols-3 bg-slate-200/80 p-0.5 rounded-xl text-[11px] font-bold"
                >
                  <button
                    type="button"
                    onClick={() => setSegmentFilter('all')}
                    className={`py-1.5 rounded-[10px] transition-all cursor-pointer ${
                      segmentFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({jobs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSegmentFilter('remote')}
                    className={`py-1.5 rounded-[10px] transition-all cursor-pointer ${
                      segmentFilter === 'remote'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    WIN Remote
                  </button>
                  <button
                    type="button"
                    onClick={() => setSegmentFilter('nep')}
                    className={`py-1.5 rounded-[10px] transition-all cursor-pointer ${
                      segmentFilter === 'nep'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    NEP Verified
                  </button>
                </div>

                {/* Parish Quick Scroller */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {PARISH_OPTIONS.map((parish) => (
                    <button
                      key={parish}
                      type="button"
                      onClick={() => setSelectedParish(parish)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedParish === parish
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      {parish === 'All' ? 'All Parishes' : parish}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* iOS Scrollable Main Body */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
            {/* TAB: JOBS / REMOTE / SAVED */}
            {(mobileTab === 'jobs' || mobileTab === 'remote' || mobileTab === 'saved') && (
              <>
                {mobileTab === 'remote' && (
                  <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        🇩🇲 Work In Nature (WIN) Visa
                      </span>
                      <Laptop className="w-4 h-4 text-teal-300" />
                    </div>
                    <h3 className="text-sm font-extrabold">18-Month Remote Residency in Dominica</h3>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      0% local income tax on foreign remote earnings. High-speed fiber across Roseau, Portsmouth & Marigot.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenRemoteModal}
                      className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Open WIN Visa Eligibility & Cost Calculator
                    </button>
                  </div>
                )}

                {dismissedJobIds.length > 0 && (
                  <div
                    data-testid="mobile-dismiss-undo-banner-ios"
                    className="bg-slate-900 text-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs shadow-sm"
                  >
                    <span className="truncate text-[11px] font-medium text-slate-200">
                      {lastDismissedJob
                        ? `Swiped to dismiss "${lastDismissedJob.title}"`
                        : `${dismissedJobIds.length} dismissed card${dismissedJobIds.length > 1 ? 's' : ''}`}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {lastDismissedJob && (
                        <button
                          type="button"
                          data-testid="mobile-undo-dismiss-btn-ios"
                          onClick={handleUndoMobileDismiss}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                        >
                          Undo
                        </button>
                      )}
                      <button
                        type="button"
                        data-testid="mobile-restore-all-dismissed-ios"
                        onClick={() => {
                          clearDismissedJobs();
                          setLastDismissedJob(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 hover:text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore ({dismissedJobIds.length})</span>
                      </button>
                    </div>
                  </div>
                )}

                {displayedJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center space-y-3 shadow-2xs border border-slate-200/60">
                    <Search className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">No vacancies match your filter</p>
                    <p className="text-xs text-slate-500">
                      Try clearing active parish or sector filters to browse all Dominica opportunities.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSegmentFilter('all');
                        clearDismissedJobs();
                        onResetFilters();
                      }}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayedJobs.map((job) => {
                      const isSaved = savedJobIds.includes(job.id);
                      const isApplied = hasUserAppliedToJob(job.id);
                      const currentSwipeX = swipingJobId === job.id ? swipeOffset : 0;
                      return (
                        <div
                          key={job.id}
                          className="relative overflow-hidden rounded-2xl"
                        >
                          {/* Swipe-to-Dismiss Action Background Layer (iOS) */}
                          <div
                            data-testid={`swipe-dismiss-bg-ios-${job.id}`}
                            className="absolute inset-0 bg-rose-600 text-white rounded-2xl px-4 flex items-center justify-between text-xs font-extrabold select-none pointer-events-none"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Trash2 className="w-4 h-4" />
                              <span>Swipe to Dismiss</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span>Swipe to Dismiss</span>
                              <Trash2 className="w-4 h-4" />
                            </span>
                          </div>

                          <div
                            data-testid={`ios-job-card-${job.id}`}
                            onTouchStart={(e) => {
                              if (e.touches && e.touches.length > 0) {
                                handleCardSwipeStart(job.id, e.touches[0].clientX);
                              }
                            }}
                            onTouchMove={(e) => {
                              if (e.touches && e.touches.length > 0) {
                                handleCardSwipeMove(job.id, e.touches[0].clientX);
                              }
                            }}
                            onTouchEnd={() => handleCardSwipeEnd(job)}
                            style={
                              currentSwipeX !== 0
                                ? {
                                    transform: `translateX(${currentSwipeX}px)`,
                                    opacity: Math.max(0.4, 1 - Math.abs(currentSwipeX) / 220),
                                  }
                                : undefined
                            }
                            className="relative bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-200/70 active:scale-[0.99] transition-all space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => onSelectJob(job)}
                              >
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  {job.featured && (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                                      Featured
                                    </span>
                                  )}
                                  {job.isNepApproved && (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                      NEP Verified
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {job.workModel}
                                  </span>
                                </div>
                                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                                  {job.title}
                                </h3>
                                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                                  {job.company}
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  data-testid={`swipe-dismiss-btn-ios-${job.id}`}
                                  onClick={() => handleCardDismiss(job)}
                                  aria-label="Swipe to dismiss job card"
                                  title="Swipe to dismiss job card"
                                  className="min-h-[36px] min-w-[36px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSaveJob(job.id)}
                                  aria-label={isSaved ? 'Remove from Saved' : 'Save Vacancy'}
                                  className={`min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                                    isSaved
                                      ? 'text-amber-500 bg-amber-50'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                              <span className="inline-flex items-center gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {job.parish}
                              </span>
                              <span className="font-extrabold text-slate-900">
                                EC$ {job.minSalary.toLocaleString()} - {job.maxSalary.toLocaleString()}
                                <span className="text-[10px] font-normal text-slate-500">/{job.salaryPeriod}</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => onSelectJob(job)}
                                className="min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>View Details</span>
                              </button>
                              {currentUser ? (
                                <button
                                  type="button"
                                  data-testid={`mobile-quick-apply-btn-ios-${job.id}`}
                                  onClick={() => handleMobileQuickApply(job)}
                                  disabled={isApplied}
                                  className={`min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors ${
                                    isApplied
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-default'
                                      : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                                  }`}
                                >
                                  {isApplied ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Quick Applied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                      <span>Quick Apply</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onApplyJob(job)}
                                  className="min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                >
                                  <span>Apply Now</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* TAB: CAREER AI & TOOLS */}
            {mobileTab === 'career' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/70 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">iOS Career Suite</h3>
                      <p className="text-xs text-slate-500">AI Resume Rewrite, Mock Interviews & Analytics</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('resume_builder');
                        onSwitchToDesktop();
                      }}
                      className="w-full min-h-[54px] py-2.5 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">AI Smart Resume Builder</p>
                          <p className="text-[11px] text-slate-500">Modern, Executive & Minimalist PDF layouts</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('career');
                        onSwitchToDesktop();
                      }}
                      className="w-full min-h-[54px] py-2.5 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-teal-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Dominica Career Guidance & DSS Info</p>
                          <p className="text-[11px] text-slate-500">NEP training, labour laws & salary guidance</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('analytics');
                        onSwitchToDesktop();
                      }}
                      className="w-full min-h-[54px] py-2.5 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Parish Salary Index (EC$)</p>
                          <p className="text-[11px] text-slate-500">Compare wages across all 10 Dominica parishes</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="bg-emerald-950 text-white rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                    Instant Job Alerts
                  </h4>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    Receive push & email alerts when new DSS-accredited employers post roles in your parish.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAlertModal}
                    className="w-full min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Configure Dominica Job Alerts
                  </button>
                </div>
              </div>
            )}

            {/* TAB: PROFILE & ACCOUNT */}
            {mobileTab === 'profile' && (
              <div className="space-y-3">
                {currentUser ? (
                  <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/70 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black text-base flex items-center justify-center">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {currentUser.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {currentUser.role === 'client' ? 'Verified Employer' : 'Candidate Account'} • {currentUser.parish}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <span className="text-base font-black text-slate-900">{applications.length}</span>
                        <span className="block text-[10px] font-semibold text-slate-500">Applications</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <span className="text-base font-black text-slate-900">{savedJobIds.length}</span>
                        <span className="block text-[10px] font-semibold text-slate-500">Saved Jobs</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(currentUser.role === 'client' ? 'recruiter' : 'profile');
                          onSwitchToDesktop();
                        }}
                        className="w-full min-h-[44px] bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Open Full {currentUser.role === 'client' ? 'Employer Portal' : 'Candidate Profile Hub'}
                      </button>
                      <button
                        type="button"
                        onClick={logoutUser}
                        className="w-full min-h-[44px] bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/70 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Sign In to Nature Island Careers
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sync your saved jobs, verified skills, resume templates, and Dominica applications across iOS, Android, and Web.
                    </p>
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenAuth('login')}
                        className="w-full min-h-[46px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In / Continue with Google or GitHub</span>
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenAuth('jobseeker_register')}
                          className="min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Candidate Sign Up
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAuth('client_register')}
                          className="min-h-[44px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Employer Sign Up
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* iOS Slide-Up Filter Bottom Sheet */}
          {isFilterSheetOpen && (
            <div className="absolute inset-0 z-40 bg-black/45 backdrop-blur-xs flex flex-col justify-end">
              <div className="bg-white rounded-t-3xl p-4 space-y-4 max-h-[80%] overflow-y-auto animate-in slide-in-from-bottom-5">
                <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">Filter Dominica Jobs</h3>
                  <button
                    type="button"
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="text-xs font-bold text-emerald-700 px-2 py-1 cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parish Location</label>
                    <select
                      value={selectedParish}
                      onChange={(e) => setSelectedParish(e.target.value as Parish | 'All')}
                      className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-800"
                    >
                      {PARISH_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Industry Sector</label>
                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value as JobSector | 'All')}
                      className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-800"
                    >
                      {SECTOR_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Minimum Monthly Salary: EC$ {minSalary.toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min={1500}
                      max={10000}
                      step={500}
                      value={minSalary}
                      onChange={(e) => setMinSalary(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-bold text-slate-800">NEP Accredited Roles Only</span>
                    <input
                      type="checkbox"
                      checked={nepOnly}
                      onChange={(e) => setNepOnly(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetFilters();
                      setIsFilterSheetOpen(false);
                    }}
                    className="min-h-[44px] rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="min-h-[44px] rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Show {displayedJobs.length} Results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* iOS 5-Tab Translucent Bottom Tab Bar */}
          <nav
            data-testid="ios-bottom-tab-bar"
            aria-label="iOS Bottom Tab Navigation"
            className="bg-white/90 backdrop-blur-xl border-t border-slate-300/70 px-2 pt-1.5 pb-1 grid grid-cols-5 items-center select-none"
          >
            <button
              type="button"
              onClick={() => handleMobileTabSelect('jobs')}
              className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
                mobileTab === 'jobs' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">Jobs</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileTabSelect('remote')}
              className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
                mobileTab === 'remote' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Laptop className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">WIN Visa</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileTabSelect('saved')}
              className={`min-h-[48px] flex flex-col items-center justify-center relative cursor-pointer ${
                mobileTab === 'saved' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">Saved</span>
              {savedJobIds.length > 0 && (
                <span className="absolute top-1 right-4 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {savedJobIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleMobileTabSelect('career')}
              className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
                mobileTab === 'career' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">Career AI</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileTabSelect('profile')}
              className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
                mobileTab === 'profile' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">Profile</span>
            </button>
          </nav>

          {/* iOS Home Indicator */}
          <div className="bg-white/90 pb-2 pt-1 flex justify-center">
            <div className="w-32 h-1.5 bg-slate-900/80 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ANDROID 15 VIEW (Google Pixel 9 Pro / Material Design 3 / Material You)
  // ============================================================================
  return (
    <div
      data-testid="android-view-container"
      className={`mx-auto transition-all duration-300 ${
        displayLayout === 'framed'
          ? 'w-full max-w-[412px] rounded-[44px] p-[10px] bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-[0_25px_70px_-15px_rgba(15,23,42,0.6)] border-[3px] border-zinc-700 relative'
          : 'w-full max-w-2xl rounded-3xl border border-emerald-900/15 shadow-xl bg-[#F6FBF7] overflow-hidden'
      }`}
    >
      {/* Pixel Hardware Volume & Power Rocker (Right Side) */}
      {displayLayout === 'framed' && (
        <>
          <div className="hidden sm:block absolute -right-[5px] top-32 w-[3px] h-12 bg-zinc-700 rounded-r-md" />
          <div className="hidden sm:block absolute -right-[5px] top-52 w-[3px] h-20 bg-zinc-700 rounded-r-md" />
        </>
      )}

      {/* Inner Android 15 Material You Screen Canvas */}
      <div
        className={`bg-[#F6FBF7] text-[#171D19] flex flex-col overflow-hidden relative ${
          displayLayout === 'framed' ? 'rounded-[35px] h-[812px]' : 'min-h-[760px]'
        }`}
      >
        {/* Android 15 Status Bar + Centered Hole-Punch Camera */}
        <div
          data-testid="android-status-bar"
          className="sticky top-0 z-30 bg-[#EEF5F0] px-5 pt-2.5 pb-2 flex items-center justify-between text-xs font-medium text-[#171D19] select-none"
        >
          <div className="flex items-center gap-1.5 w-20">
            <span className="font-bold text-[12px]">9:41</span>
            <span className="text-[10px] bg-emerald-800 text-white px-1.5 py-0.2 rounded font-bold">
              🇩🇲
            </span>
          </div>

          {/* Pixel Punch-Hole Camera */}
          <div
            data-testid="android-camera-cutout"
            className="w-3.5 h-3.5 rounded-full bg-black ring-2 ring-zinc-800/40"
            title="Pixel 9 Pro Front Camera"
          />

          <div className="flex items-center justify-end gap-1.5 w-20 text-[#171D19]">
            <span className="text-[10px] font-extrabold">5G</span>
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">98%</span>
          </div>
        </div>

        {/* Material Design 3 Search Bar & Filter Chips Header */}
        <div className="bg-[#EEF5F0] px-4 pt-1 pb-3 border-b border-emerald-900/10 space-y-2.5">
          {/* Material 3 Pill Search Bar */}
          <div className="flex items-center bg-[#E0ECE4] rounded-full px-3 py-1.5 gap-2 shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-[#082407] flex items-center justify-center p-1 shrink-0">
              <BrandLogoMark className="w-full h-full" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dominica jobs, parishes..."
              data-testid="android-search-input"
              className="flex-1 bg-transparent text-xs font-semibold text-[#171D19] placeholder:text-emerald-950/60 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-emerald-900/70 hover:text-emerald-950 cursor-pointer"
                aria-label="Clear Android search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              data-testid="android-filter-button"
              aria-label="Open Material 3 Filter Sheet"
              className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Material 3 Assist & Filter Chips */}
          <div
            data-testid="android-filter-chips"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
          >
            <button
              type="button"
              onClick={() => setSegmentFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                segmentFilter === 'all'
                  ? 'bg-[#C4EED0] text-[#072711] border-[#072711]/20'
                  : 'bg-white/80 text-slate-700 border-slate-300'
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => setSegmentFilter('remote')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                segmentFilter === 'remote'
                  ? 'bg-[#C4EED0] text-[#072711] border-[#072711]/20'
                  : 'bg-white/80 text-slate-700 border-slate-300'
              }`}
            >
              WIN Remote Visa
            </button>
            <button
              type="button"
              onClick={() => setSegmentFilter('nep')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                segmentFilter === 'nep'
                  ? 'bg-[#C4EED0] text-[#072711] border-[#072711]/20'
                  : 'bg-white/80 text-slate-700 border-slate-300'
              }`}
            >
              ✓ NEP Accredited
            </button>
            {PARISH_OPTIONS.slice(1, 6).map((parish) => (
              <button
                key={parish}
                type="button"
                onClick={() =>
                  setSelectedParish(selectedParish === parish ? 'All' : parish)
                }
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  selectedParish === parish
                    ? 'bg-[#C4EED0] text-[#072711] border-[#072711]/20'
                    : 'bg-white/80 text-slate-700 border-slate-300'
                }`}
              >
                {parish}
              </button>
            ))}
          </div>
        </div>

        {/* Android Material You Scrollable Content Stream */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 pb-20">
          {(mobileTab === 'jobs' || mobileTab === 'remote' || mobileTab === 'saved') && (
            <>
              {/* Material You Banner Card */}
              <div className="bg-[#D5E8D9] text-[#0A2012] rounded-[24px] p-4 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                    Android 15 • Material You Dynamic Theme
                  </span>
                  <h3 className="text-sm font-extrabold">
                    {displayedJobs.length} Verified Dominica Vacancies
                  </h3>
                  <p className="text-[11px] text-emerald-950/80">
                    Salaries in Eastern Caribbean Dollars (EC$ / XCD)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAlertModal}
                  className="shrink-0 px-3.5 py-2 rounded-full bg-[#0F5223] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Alerts
                </button>
              </div>

              {dismissedJobIds.length > 0 && (
                <div
                  data-testid="mobile-dismiss-undo-banner-android"
                  className="bg-[#171D19] text-white rounded-full px-4 py-2.5 flex items-center justify-between gap-2 text-xs shadow-sm"
                >
                  <span className="truncate text-[11px] font-medium text-emerald-100">
                    {lastDismissedJob
                      ? `Swiped to dismiss "${lastDismissedJob.title}"`
                      : `${dismissedJobIds.length} dismissed card${dismissedJobIds.length > 1 ? 's' : ''}`}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {lastDismissedJob && (
                      <button
                        type="button"
                        data-testid="mobile-undo-dismiss-btn-android"
                        onClick={handleUndoMobileDismiss}
                        className="px-3 py-1 rounded-full bg-[#C4EED0] text-[#072711] font-extrabold text-[11px] cursor-pointer"
                      >
                        Undo
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="mobile-restore-all-dismissed-android"
                      onClick={() => {
                        clearDismissedJobs();
                        setLastDismissedJob(null);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white/15 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore ({dismissedJobIds.length})</span>
                    </button>
                  </div>
                </div>
              )}

              {displayedJobs.length === 0 ? (
                <div className="bg-white rounded-[24px] p-8 text-center space-y-3 border border-emerald-900/10">
                  <p className="text-sm font-bold text-slate-800">No matching Dominica jobs</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSegmentFilter('all');
                      clearDismissedJobs();
                      onResetFilters();
                    }}
                    className="px-5 py-2.5 bg-[#0F5223] text-white rounded-full text-xs font-bold cursor-pointer"
                  >
                    Clear All Chips
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedJobs.map((job) => {
                    const isSaved = savedJobIds.includes(job.id);
                    const isApplied = hasUserAppliedToJob(job.id);
                    const currentSwipeX = swipingJobId === job.id ? swipeOffset : 0;
                    return (
                      <div
                        key={job.id}
                        className="relative overflow-hidden rounded-[24px]"
                      >
                        {/* Swipe-to-Dismiss Action Background Layer (Android Material 3) */}
                        <div
                          data-testid={`swipe-dismiss-bg-android-${job.id}`}
                          className="absolute inset-0 bg-rose-700 text-white rounded-[24px] px-5 flex items-center justify-between text-xs font-extrabold select-none pointer-events-none"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4" />
                            <span>Swipe to Dismiss</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span>Swipe to Dismiss</span>
                            <Trash2 className="w-4 h-4" />
                          </span>
                        </div>

                        <div
                          data-testid={`android-job-card-${job.id}`}
                          onTouchStart={(e) => {
                            if (e.touches && e.touches.length > 0) {
                              handleCardSwipeStart(job.id, e.touches[0].clientX);
                            }
                          }}
                          onTouchMove={(e) => {
                            if (e.touches && e.touches.length > 0) {
                              handleCardSwipeMove(job.id, e.touches[0].clientX);
                            }
                          }}
                          onTouchEnd={() => handleCardSwipeEnd(job)}
                          style={
                            currentSwipeX !== 0
                              ? {
                                  transform: `translateX(${currentSwipeX}px)`,
                                  opacity: Math.max(0.4, 1 - Math.abs(currentSwipeX) / 220),
                                }
                              : undefined
                          }
                          className="relative bg-white rounded-[24px] p-4 shadow-2xs border border-emerald-900/10 space-y-3 transition-transform active:scale-[0.99]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex items-start gap-3 cursor-pointer flex-1"
                              onClick={() => onSelectJob(job)}
                            >
                              <div className="w-11 h-11 rounded-2xl bg-[#C4EED0] text-[#072711] font-black text-sm flex items-center justify-center shrink-0">
                                {job.company.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-extrabold text-[#171D19] leading-snug">
                                  {job.title}
                                </h3>
                                <p className="text-xs font-semibold text-emerald-800 truncate">
                                  {job.company} • {job.parish}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  <span className="text-[10px] font-bold bg-[#EEF5F0] text-emerald-950 px-2.5 py-0.5 rounded-full">
                                    EC$ {job.minSalary.toLocaleString()}–{job.maxSalary.toLocaleString()}
                                  </span>
                                  {job.isNepApproved && (
                                    <span className="text-[10px] font-bold bg-[#C4EED0] text-[#072711] px-2.5 py-0.5 rounded-full">
                                      NEP
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {job.workModel}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                data-testid={`swipe-dismiss-btn-android-${job.id}`}
                                onClick={() => handleCardDismiss(job)}
                                aria-label="Swipe to dismiss job card"
                                title="Swipe to dismiss job card"
                                className="min-h-[40px] min-w-[40px] rounded-full text-slate-400 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSaveJob(job.id)}
                                aria-label={isSaved ? 'Unsave job' : 'Save job'}
                                className={`min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                  isSaved ? 'text-emerald-800 bg-[#C4EED0]/60' : 'text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-800' : ''}`} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onShareJob(job)}
                              aria-label="Share job"
                              className="min-h-[40px] px-3 rounded-full text-emerald-900 hover:bg-[#EEF5F0] text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectJob(job)}
                              className="min-h-[40px] px-4 rounded-full bg-[#E0ECE4] hover:bg-[#C4EED0] text-[#072711] text-xs font-bold cursor-pointer"
                            >
                              Details
                            </button>
                            {currentUser ? (
                              <button
                                type="button"
                                data-testid={`mobile-quick-apply-btn-android-${job.id}`}
                                onClick={() => handleMobileQuickApply(job)}
                                disabled={isApplied}
                                className={`min-h-[40px] px-4 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs ${
                                  isApplied
                                    ? 'bg-[#C4EED0] text-[#072711] cursor-default'
                                    : 'bg-[#0F5223] hover:bg-emerald-900 text-white cursor-pointer'
                                }`}
                              >
                                {isApplied ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Quick Applied</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                    <span>Quick Apply</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onApplyJob(job)}
                                className="min-h-[40px] px-4 rounded-full bg-[#0F5223] hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <span>Apply</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ANDROID TAB: CAREER AI */}
          {mobileTab === 'career' && (
            <div className="space-y-3">
              <div className="bg-white rounded-[24px] p-4 border border-emerald-900/10 space-y-3">
                <h3 className="text-base font-extrabold text-[#171D19]">
                  Material You Career & AI Tools
                </h3>
                <p className="text-xs text-slate-600">
                  Gemini-powered Smart Resume Rewrite, Mock Interviews & Parish Wage Index.
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('resume_builder');
                      onSwitchToDesktop();
                    }}
                    className="w-full min-h-[52px] px-4 rounded-2xl bg-[#EEF5F0] hover:bg-[#C4EED0] text-[#072711] font-bold text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4" />
                      <span>Smart Resume Builder (Modern / Executive / Minimalist)</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('career');
                      onSwitchToDesktop();
                    }}
                    className="w-full min-h-[52px] px-4 rounded-2xl bg-[#EEF5F0] hover:bg-[#C4EED0] text-[#072711] font-bold text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4" />
                      <span>Dominica Career Guide & DSS Compliance</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onOpenRemoteModal}
                    className="w-full min-h-[52px] px-4 rounded-2xl bg-[#EEF5F0] hover:bg-[#C4EED0] text-[#072711] font-bold text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Laptop className="w-4 h-4" />
                      <span>WIN 18-Month Remote Visa Calculator</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ANDROID TAB: PROFILE */}
          {mobileTab === 'profile' && (
            <div className="space-y-3">
              {currentUser ? (
                <div className="bg-white rounded-[24px] p-5 border border-emerald-900/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F5223] text-white font-black text-base flex items-center justify-center">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#171D19]">{currentUser.name}</h3>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(currentUser.role === 'client' ? 'recruiter' : 'profile');
                        onSwitchToDesktop();
                      }}
                      className="flex-1 min-h-[44px] rounded-full bg-[#0F5223] text-white text-xs font-bold cursor-pointer"
                    >
                      Open Full Hub
                    </button>
                    <button
                      type="button"
                      onClick={logoutUser}
                      className="min-h-[44px] px-4 rounded-full bg-rose-100 text-rose-800 text-xs font-bold cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[24px] p-5 border border-emerald-900/10 text-center space-y-3">
                  <ShieldCheck className="w-10 h-10 text-[#0F5223] mx-auto" />
                  <h3 className="text-base font-extrabold text-[#171D19]">
                    Android Account Sync
                  </h3>
                  <p className="text-xs text-slate-600">
                    Sign in with Google, GitHub, or Email to track your Dominica job applications and verified skills.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="w-full min-h-[48px] rounded-full bg-[#0F5223] text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Sign In / Create Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Material 3 Extended Floating Action Button (FAB) */}
        <button
          type="button"
          data-testid="android-fab"
          onClick={onOpenAlertModal}
          className="absolute bottom-24 right-4 z-20 h-13 px-4 rounded-2xl bg-[#C4EED0] hover:bg-[#b0e6bf] text-[#072711] font-extrabold text-xs shadow-lg border border-emerald-900/15 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Job Alert</span>
        </button>

        {/* Material 3 Bottom Sheet Filter Drawer */}
        {isFilterSheetOpen && (
          <div className="absolute inset-0 z-40 bg-black/50 flex flex-col justify-end">
            <div className="bg-[#F6FBF7] rounded-t-[28px] p-5 space-y-4 max-h-[80%] overflow-y-auto">
              <div className="w-8 h-1 bg-slate-400 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#171D19]">Material 3 Job Filters</h3>
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="text-xs font-bold text-[#0F5223] cursor-pointer"
                >
                  Apply
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parish</label>
                  <select
                    value={selectedParish}
                    onChange={(e) => setSelectedParish(e.target.value as Parish | 'All')}
                    className="w-full p-2.5 rounded-2xl bg-[#E0ECE4] font-semibold text-[#171D19]"
                  >
                    {PARISH_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sector</label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value as JobSector | 'All')}
                    className="w-full p-2.5 rounded-2xl bg-[#E0ECE4] font-semibold text-[#171D19]"
                  >
                    {SECTOR_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetFilters();
                    setIsFilterSheetOpen(false);
                  }}
                  className="flex-1 min-h-[44px] rounded-full border border-slate-300 font-bold text-xs cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="flex-1 min-h-[44px] rounded-full bg-[#0F5223] text-white font-bold text-xs cursor-pointer"
                >
                  View {displayedJobs.length} Jobs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Material Design 3 Navigation Bar (Pill Active Indicators) */}
        <nav
          data-testid="android-bottom-nav"
          aria-label="Android Material 3 Bottom Navigation"
          className="bg-[#EEF5F0] border-t border-emerald-900/10 px-2 pt-2 pb-1 grid grid-cols-5 items-center select-none"
        >
          {(
            [
              { id: 'jobs', label: 'Explore', icon: Briefcase },
              { id: 'remote', label: 'WIN Visa', icon: Laptop },
              { id: 'saved', label: 'Saved', icon: Bookmark },
              { id: 'career', label: 'AI Tools', icon: Sparkles },
              { id: 'profile', label: 'Account', icon: User },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isActive = mobileTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMobileTabSelect(item.id)}
                className="min-h-[52px] flex flex-col items-center justify-center cursor-pointer"
              >
                <span
                  className={`px-4 py-1 rounded-full transition-colors flex items-center justify-center ${
                    isActive ? 'bg-[#C4EED0] text-[#072711]' : 'text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight ${
                    isActive ? 'font-extrabold text-[#072711]' : 'font-medium text-slate-600'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Android 15 Gesture Pill Bar */}
        <div className="bg-[#EEF5F0] pb-2 pt-1 flex justify-center">
          <div className="w-28 h-1 bg-slate-600/70 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const MobilePlatformViews: React.FC<MobilePlatformViewsProps> = (props) => {
  const { viewMode, onChangeViewMode } = props;
  const [displayLayout, setDisplayLayout] = useState<'framed' | 'fullwidth'>('framed');

  if (viewMode === 'desktop') return null;

  return (
    <section
      data-testid="mobile-platform-views-section"
      aria-label="iOS and Android Mobile Platform Views"
      className="py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white min-h-[calc(100vh-80px)]"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Control Bar for iOS / Android / Side-by-Side Comparison */}
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Native Mobile Views</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Real-time synced with Dominica Classifieds & Firebase Auth
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
              {viewMode === 'ios' && 'iOS 18 Experience (iPhone 16 Pro — Human Interface Guidelines)'}
              {viewMode === 'android' && 'Android 15 Experience (Pixel 9 Pro — Material You / Material 3)'}
              {viewMode === 'compare' && 'iOS 18 & Android 15 Side-by-Side Interactive Comparison'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Switch between iOS, Android, Side-by-Side, and Web */}
            <div className="inline-flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                data-testid="mobile-toolbar-ios-btn"
                onClick={() => onChangeViewMode('ios')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'ios'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iOS View</span>
              </button>

              <button
                type="button"
                data-testid="mobile-toolbar-android-btn"
                onClick={() => onChangeViewMode('android')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'android'
                    ? 'bg-[#C4EED0] text-[#072711] shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android View</span>
              </button>

              <button
                type="button"
                data-testid="mobile-toolbar-compare-btn"
                onClick={() => onChangeViewMode('compare')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'compare'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>iOS + Android</span>
              </button>
            </div>

            {/* Framed vs Full-Width Mobile Toggle */}
            {viewMode !== 'compare' && (
              <button
                type="button"
                data-testid="toggle-device-frame-btn"
                onClick={() =>
                  setDisplayLayout((prev) => (prev === 'framed' ? 'fullwidth' : 'framed'))
                }
                className="px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-600 cursor-pointer"
              >
                {displayLayout === 'framed' ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand Full-Width</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Device Frame</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              data-testid="return-desktop-view-btn"
              onClick={() => onChangeViewMode('desktop')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Web View</span>
            </button>
          </div>
        </div>

        {/* Active Mobile Viewports */}
        {viewMode === 'compare' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              <div className="flex items-center justify-between max-w-[410px] mx-auto px-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  iOS 18 • iPhone 16 Pro
                </span>
                <span className="text-[11px] text-slate-400">Dynamic Island • Frosted Glass</span>
              </div>
              <SingleMobileDeviceView
                {...props}
                platform="ios"
                displayLayout="framed"
                onSwitchToDesktop={() => onChangeViewMode('desktop')}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between max-w-[412px] mx-auto px-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Android 15 • Pixel 9 Pro
                </span>
                <span className="text-[11px] text-slate-400">Material You • Tonal Chips & FAB</span>
              </div>
              <SingleMobileDeviceView
                {...props}
                platform="android"
                displayLayout="framed"
                onSwitchToDesktop={() => onChangeViewMode('desktop')}
              />
            </div>
          </div>
        ) : (
          <SingleMobileDeviceView
            {...props}
            platform={viewMode === 'ios' ? 'ios' : 'android'}
            displayLayout={displayLayout}
            onSwitchToDesktop={() => onChangeViewMode('desktop')}
          />
        )}
      </div>
    </section>
  );
};
