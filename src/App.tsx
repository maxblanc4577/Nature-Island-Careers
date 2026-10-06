import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDebounce } from './hooks/useDebounce';
import { ErrorBoundary } from './components/ErrorBoundary';
import { filterAndSortJobs } from './utils/filterJobs';
import { JobProvider, useJobContext } from './context/JobContext';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { JobFilters } from './components/JobFilters';
import { JobCard } from './components/JobCard';
import { JobDetailModal } from './components/JobDetailModal';
import { ApplyModal } from './components/ApplyModal';
import { PostJobModal } from './components/PostJobModal';
import { SubscribeAlertModal } from './components/SubscribeAlertModal';
import { FeedbackModal } from './components/FeedbackModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SubscriptionCheckoutModal } from './components/SubscriptionCheckoutModal';
import { RemoteAssignmentModal } from './components/RemoteAssignmentModal';
import { InterviewSchedulerModal } from './components/InterviewSchedulerModal';
import { ExportPdfReportModal } from './components/ExportPdfReportModal';
import { StripePaymentModal } from './components/StripePaymentModal';
import { AdminMasterPortalModal } from './components/AdminMasterPortalModal';
import { ShareJobModal } from './components/ShareJobModal';
import { CandidateProfileHub } from './components/CandidateProfileHub';
import { MyApplicationsDashboard } from './components/MyApplicationsDashboard';
import { RecruiterPortal } from './components/RecruiterPortal';
import { AdminAnalytics } from './components/AdminAnalytics';
import { CareerGuidanceAssistant } from './components/CareerGuidanceAssistant';
import { ResumeBuilder } from './components/ResumeBuilder';
import { JobCompareModal } from './components/JobCompareModal';
import { Footer } from './components/Footer';
import { EmailAlertToast } from './components/EmailAlertToast';
import { JobListing, Parish, JobSector, EmploymentType, WorkModel } from './types';
import {
  Briefcase,
  Search,
  Sparkles,
  MapPin,
  Laptop,
  CheckCircle2,
  DollarSign,
  Filter,
  Layers,
  ArrowRight,
  BellRing,
  Scale,
  X,
} from 'lucide-react';

function DominicaJobBoardContent() {
  const { jobs, savedJobIds, isAdminLoggedIn } = useJobContext();

  // Compared jobs state for side-by-side comparison modal
  const [comparedJobIds, setComparedJobIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const handleToggleCompare = (job: JobListing) => {
    setComparedJobIds((prev) => {
      if (prev.includes(job.id)) {
        return prev.filter((id) => id !== job.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), job.id];
      }
      return [...prev, job.id];
    });
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'jobs'
    | 'remote'
    | 'profile'
    | 'applications'
    | 'resume_builder'
    | 'recruiter'
    | 'analytics'
    | 'career'
  >('jobs');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  // Debounced search query to prevent excessive filtering re-renders while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [selectedParish, setSelectedParish] = useState<Parish | 'All'>('All');
  const [selectedSector, setSelectedSector] = useState<JobSector | 'All'>('All');
  const [selectedType, setSelectedType] = useState<EmploymentType | 'All'>('All');
  const [selectedWorkModel, setSelectedWorkModel] = useState<WorkModel | 'All'>('All');
  const [nepOnly, setNepOnly] = useState(false);
  const [minSalary, setMinSalary] = useState(1500);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'salaryHigh' | 'views'>('recent');

  // Modal dialog states
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobListing | null>(null);
  const [jobToApply, setJobToApply] = useState<JobListing | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isSubscribeAlertOpen, setIsSubscribeAlertOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubscriptionCheckoutOpen, setIsSubscriptionCheckoutOpen] = useState(false);
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [isMasterAdminOpen, setIsMasterAdminOpen] = useState(false);
  const [jobToShare, setJobToShare] = useState<JobListing | null>(null);

  // Auto-open job detail if URL query param ?job=<id> is present
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const jobId = params.get('job');
      if (jobId && jobs.length > 0) {
        const found = jobs.find((j) => j.id === jobId);
        if (found) {
          setSelectedJobForDetail(found);
        }
      }
    } catch {
      // ignore
    }
  }, [jobs]);

  // Admin Portal keyboard shortcut: Alt + A or Ctrl + Shift + A
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        handleOpenAdminMasterPortal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminLoggedIn]);

  // Dynamic Site Settings state
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('natureisland_site_settings');
    return saved
      ? JSON.parse(saved)
      : {
          siteName: 'Nature Island Careers',
          contactEmail: 'info@natureislandcareers.com',
          announcement: 'Dominica Work In Nature (WIN) 2026 Extended Visas Active · Certified 18-Month Remote Stay',
          currencyPeg: 2.70,
          showEmergencyBanner: false,
          backgroundImageUrl: '/nature_island_photo.svg',
          fullPageBackground: false,
        };
  });

  const handleUpdateSiteSettings = (newSettings: typeof siteSettings) => {
    setSiteSettings(newSettings);
    localStorage.setItem('natureisland_site_settings', JSON.stringify(newSettings));
  };

  // Interview scheduling state for recruiter
  const [interviewData, setInterviewData] = useState<{
    isOpen: boolean;
    applicationId: string;
    candidateName: string;
    jobTitle: string;
  }>({
    isOpen: false,
    applicationId: '',
    candidateName: '',
    jobTitle: '',
  });

  // Filtered jobs calculation using pure helper function
  const filteredJobs = useMemo(() => {
    return filterAndSortJobs(jobs, {
      activeTab,
      showSavedOnly,
      savedJobIds,
      searchQuery: debouncedSearchQuery,
      selectedParish,
      selectedSector,
      selectedType,
      selectedWorkModel,
      nepOnly,
      minSalary,
      sortBy,
    });
  }, [
    jobs,
    activeTab,
    showSavedOnly,
    savedJobIds,
    debouncedSearchQuery,
    selectedParish,
    selectedSector,
    selectedType,
    selectedWorkModel,
    nepOnly,
    minSalary,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedParish('All');
    setSelectedSector('All');
    setSelectedType('All');
    setSelectedWorkModel('All');
    setNepOnly(false);
    setMinSalary(1500);
    setShowSavedOnly(false);
    setSortBy('recent');
  };

  const handleOpenAdminMasterPortal = () => {
    if (isAdminLoggedIn) {
      setIsMasterAdminOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white relative"
      style={
        siteSettings.fullPageBackground
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(248, 250, 252, 0.94), rgba(248, 250, 252, 0.97)), url('${siteSettings.backgroundImageUrl || '/nature_island_photo.svg'}')`,
              backgroundAttachment: 'fixed',
              backgroundSize: 'cover',
            }
          : undefined
      }
    >
      {/* Dynamic SEO Meta Tags via React Helmet */}
      <Helmet>
        <title>
          {selectedJobForDetail
            ? `${selectedJobForDetail.title} at ${selectedJobForDetail.company} (${selectedJobForDetail.parish}) | Nature Island Careers`
            : activeTab === 'remote'
            ? 'Dominica Remote Work & WIN Extended Visa Jobs | Nature Island Careers'
            : activeTab === 'career'
            ? 'Dominica Career Guide & DSS Accreditation | Nature Island Careers'
            : activeTab === 'analytics'
            ? 'Dominica Labour Market Trends & Salary Index | Nature Island Careers'
            : `${siteSettings.siteName || 'Nature Island Careers'} - Dominica Premier Classified Board & Career Hub`}
        </title>
        <meta
          name="description"
          content={
            selectedJobForDetail
              ? `Apply for ${selectedJobForDetail.title} at ${selectedJobForDetail.company} in ${selectedJobForDetail.parish}, Dominica. Salary: EC$ ${selectedJobForDetail.minSalary} - ${selectedJobForDetail.maxSalary} / month. DSS accredited.`
              : siteSettings.announcement ||
                'Dominica premier job classified board and career portal. Verified vacancies across all 10 parishes in the Commonwealth of Dominica (Waitukubuli). NEP accredited.'
          }
        />
        <meta
          property="og:title"
          content={
            selectedJobForDetail
              ? `${selectedJobForDetail.title} - ${selectedJobForDetail.company} (${selectedJobForDetail.parish})`
              : `${siteSettings.siteName || 'Nature Island Careers'} - Dominica`
          }
        />
        <meta
          property="og:description"
          content={
            selectedJobForDetail
              ? `Apply for ${selectedJobForDetail.title} at ${selectedJobForDetail.company} in Dominica.`
              : 'Dominica premier digital job classifieds and talent ecosystem.'
          }
        />
      </Helmet>

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
        onOpenAdminPortal={handleOpenAdminMasterPortal}
        siteSettings={siteSettings}
      />

      {/* Main Content Areas */}
      <main className="flex-1">
        {/* TAB 1: CLASSIFIEDS JOB BOARD */}
        {activeTab === 'jobs' && (
          <div>
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedParish={selectedParish}
              setSelectedParish={setSelectedParish}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              totalJobsCount={jobs.length}
              onOpenAlertModal={() => setIsSubscribeAlertOpen(true)}
              onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
              backgroundImageUrl={siteSettings.backgroundImageUrl || '/nature_island_photo.svg'}
              siteName={siteSettings.siteName}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar Filters */}
                <div className="lg:col-span-1">
                  <JobFilters
                    selectedParish={selectedParish}
                    setSelectedParish={setSelectedParish}
                    selectedSector={selectedSector}
                    setSelectedSector={setSelectedSector}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    selectedWorkModel={selectedWorkModel}
                    setSelectedWorkModel={setSelectedWorkModel}
                    nepOnly={nepOnly}
                    setNepOnly={setNepOnly}
                    minSalaryXCD={minSalary}
                    setMinSalaryXCD={setMinSalary}
                    filteredCount={filteredJobs.length}
                    onReset={handleResetFilters}
                  />
                </div>

                {/* Right Job Listings Grid */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Results Count & Sort Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {filteredJobs.length} {filteredJobs.length === 1 ? 'Vacancy' : 'Vacancies'} Available
                      </span>
                      {selectedParish !== 'All' && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          Parish: {selectedParish}
                        </span>
                      )}
                      {selectedSector !== 'All' && (
                        <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          {selectedSector}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setIsSubscribeAlertOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Register your email and criteria for automated alerts"
                      >
                        <BellRing className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Get Job Alerts</span>
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-600">Sort:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="recent">Most Recent & Featured</option>
                          <option value="salaryHigh">Highest Salary (EC$)</option>
                          <option value="views">Most Viewed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Listings Cards */}
                  {filteredJobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">No matching classifieds found</h3>
                      <p className="text-sm text-slate-600 max-w-md mx-auto">
                        Try clearing or relaxing your filters, or broaden your parish search across Dominica.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onSelect={() => setSelectedJobForDetail(job)}
                          onApply={() => setJobToApply(job)}
                          onQuickApply={() => setJobToApply(job)}
                          onPromptAuth={() => setIsAuthOpen(true)}
                          onShare={(job) => setJobToShare(job)}
                          isCompared={comparedJobIds.includes(job.id)}
                          onToggleCompare={handleToggleCompare}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REMOTE / WIN ROLES */}
        {activeTab === 'remote' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto space-y-4 text-center">
                <div className="inline-flex items-center gap-2 bg-teal-800/60 border border-teal-600/40 rounded-full px-3.5 py-1 text-xs font-semibold text-teal-200">
                  <Laptop className="w-4 h-4 text-teal-300" />
                  <span>Dominica Work in Nature (WIN) Remote Career Marketplace</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black">
                  Work from Paradise • Live in Dominica
                </h2>
                <p className="max-w-2xl mx-auto text-teal-100/90 text-sm sm:text-base leading-relaxed">
                  Discover digital nomad roles, remote tech positions, and overseas consultancies compliant with the Dominica WIN Extended Visa (up to 18-month legal residency with zero local income tax on foreign earnings).
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setIsRemoteModalOpen(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    View WIN Extended Stay Guidelines & Calculator
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900">
                  Active Remote & WIN-Certified Positions ({filteredJobs.length})
                </h3>
                <div className="space-y-3.5">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSelect={() => setSelectedJobForDetail(job)}
                      onApply={() => setJobToApply(job)}
                      onQuickApply={() => setJobToApply(job)}
                      onPromptAuth={() => setIsAuthOpen(true)}
                      onShare={(job) => setJobToShare(job)}
                      isCompared={comparedJobIds.includes(job.id)}
                      onToggleCompare={handleToggleCompare}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED CANDIDATE PROFILE HUB (Personal Details, Photo, Applications, Resume Builder, Saved Jobs) */}
        {(activeTab === 'profile' || activeTab === 'applications' || activeTab === 'resume_builder') && (
          <CandidateProfileHub
            initialSubTab={
              activeTab === 'applications'
                ? 'applications'
                : activeTab === 'resume_builder'
                ? 'resume_builder'
                : 'details'
            }
            onBrowseJobs={() => setActiveTab('jobs')}
            onSelectJob={(jobId) => {
              const j = jobs.find((item) => item.id === jobId);
              if (j) setSelectedJobForDetail(j);
            }}
          />
        )}

        {/* TAB 4: RECRUITER / EMPLOYER PORTAL */}
        {activeTab === 'recruiter' && (
          <RecruiterPortal
            onOpenPostJob={() => setIsPostJobOpen(true)}
            onOpenSubscription={() => setIsSubscriptionCheckoutOpen(true)}
            onScheduleInterview={(applicationId, candidateName, jobTitle) => {
              setInterviewData({
                isOpen: true,
                applicationId,
                candidateName,
                jobTitle,
              });
            }}
          />
        )}

        {/* TAB 5: PARISH SALARY & MARKET ANALYTICS */}
        {activeTab === 'analytics' && (
          <AdminAnalytics
            onOpenExportPdf={() => setIsExportPdfOpen(true)}
            onSelectParishFilter={(p) => {
              setSelectedParish(p);
              setActiveTab('jobs');
            }}
          />
        )}

        {/* TAB 7: CAREER GUIDANCE ASSISTANT */}
        {activeTab === 'career' && <CareerGuidanceAssistant />}
      </main>

      {/* Global Footer */}
      <Footer
        onSelectParish={(p) => {
          setSelectedParish(p);
          setActiveTab('jobs');
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }}
        onOpenAlert={() => setIsSubscribeAlertOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenAdminPortal={handleOpenAdminMasterPortal}
        onOpenCareerGuide={() => {
          setActiveTab('career');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSalaryTrends={() => {
          setActiveTab('analytics');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenEmployerPortal={() => {
          setActiveTab('recruiter');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Simulated Email Alert Toast */}
      <EmailAlertToast />

      {/* Floating Compare Action Dock */}
      {comparedJobIds.length > 0 && (
        <aside
          aria-label="Job Comparison Dock"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md text-white px-4 sm:px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 sm:gap-5 animate-in slide-in-from-bottom-5 duration-200 max-w-[95vw]"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-black tracking-tight whitespace-nowrap">
              Compare Roles ({comparedJobIds.length}/4)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 max-w-sm overflow-hidden">
            {comparedJobIds.map((id) => {
              const job = jobs.find((j) => j.id === id);
              return job ? (
                <span
                  key={id}
                  className="text-[11px] bg-slate-800 text-stone-300 px-2 py-0.5 rounded-lg border border-slate-700 truncate max-w-[120px]"
                >
                  {job.title}
                </span>
              ) : null;
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
            >
              <Scale className="w-3.5 h-3.5 text-amber-300" />
              <span>Compare Side-by-Side</span>
            </button>

            <button
              type="button"
              onClick={() => setComparedJobIds([])}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              title="Clear comparison selection"
              aria-label="Clear comparison selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* MODALS */}
      {/* Side-by-Side Job Comparison Modal */}
      <JobCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        jobs={jobs.filter((j) => comparedJobIds.includes(j.id))}
        onApply={(job) => {
          setIsCompareModalOpen(false);
          setSelectedJobForDetail(job);
        }}
        onQuickApply={(job) => {
          setIsCompareModalOpen(false);
          setJobToApply(job);
        }}
        onRemoveCompare={(id) => setComparedJobIds((prev) => prev.filter((item) => item !== id))}
      />

      {/* Stripe Payment Portal Modal */}
      <StripePaymentModal
        isOpen={isStripeModalOpen}
        onClose={() => setIsStripeModalOpen(false)}
      />

      {/* Master Admin Portal Modal (Manage All Changes to App) */}
      <AdminMasterPortalModal
        isOpen={isMasterAdminOpen}
        onClose={() => setIsMasterAdminOpen(false)}
        siteSettings={siteSettings}
        onUpdateSiteSettings={handleUpdateSiteSettings}
        onOpenStripe={() => {
          setIsMasterAdminOpen(false);
          setIsStripeModalOpen(true);
        }}
      />
      {selectedJobForDetail && (
        <JobDetailModal
          job={selectedJobForDetail}
          onClose={() => setSelectedJobForDetail(null)}
          onApply={(job) => {
            setSelectedJobForDetail(null);
            setJobToApply(job);
          }}
          onOpenAlert={() => {
            setSelectedJobForDetail(null);
            setIsSubscribeAlertOpen(true);
          }}
        />
      )}

      {jobToApply && (
        <ApplyModal
          job={jobToApply}
          isOpen={!!jobToApply}
          onClose={() => setJobToApply(null)}
          onSuccess={() => {
            setJobToApply(null);
            setActiveTab('applications');
          }}
        />
      )}

      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
      />

      <SubscribeAlertModal
        isOpen={isSubscribeAlertOpen}
        onClose={() => setIsSubscribeAlertOpen(false)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onRequireSubscription={() => {
          setIsAuthOpen(false);
          setIsSubscriptionCheckoutOpen(true);
        }}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsMasterAdminOpen(true);
        }}
      />

      <SubscriptionCheckoutModal
        isOpen={isSubscriptionCheckoutOpen}
        onClose={() => setIsSubscriptionCheckoutOpen(false)}
      />

      <RemoteAssignmentModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
        onOpenSubscription={() => {
          setIsRemoteModalOpen(false);
          setIsSubscriptionCheckoutOpen(true);
        }}
      />

      <ExportPdfReportModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
      />

      {interviewData.isOpen && (
        <InterviewSchedulerModal
          isOpen={interviewData.isOpen}
          onClose={() =>
            setInterviewData({
              isOpen: false,
              applicationId: '',
              candidateName: '',
              jobTitle: '',
            })
          }
          applicationId={interviewData.applicationId}
          candidateName={interviewData.candidateName}
          jobTitle={interviewData.jobTitle}
        />
      )}

      {jobToShare && (
        <ShareJobModal
          job={jobToShare}
          isOpen={Boolean(jobToShare)}
          onClose={() => setJobToShare(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <JobProvider>
        <DominicaJobBoardContent />
      </JobProvider>
    </ErrorBoundary>
  );
}
