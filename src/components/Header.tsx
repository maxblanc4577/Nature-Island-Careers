import React, { useState, useRef, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { RecentSearches } from './RecentSearches';
import {
  Briefcase,
  Bell,
  User,
  Laptop,
  Shield,
  LogOut,
  Building,
  Compass,
  FileText,
  ChevronDown,
  Bookmark,
} from 'lucide-react';

export { RecentSearches };

interface HeaderProps {
  activeTab:
    | 'jobs'
    | 'remote'
    | 'profile'
    | 'applications'
    | 'resume_builder'
    | 'recruiter'
    | 'analytics'
    | 'career';
  setActiveTab: (
    tab:
      | 'jobs'
      | 'remote'
      | 'profile'
      | 'applications'
      | 'resume_builder'
      | 'recruiter'
      | 'analytics'
      | 'career'
  ) => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenAdminLogin: () => void;
  onOpenRemoteModal: () => void;
  onOpenAdminPortal?: () => void;
  searchQuery?: string;
  onSelectSearchQuery?: (query: string) => void;
  siteSettings?: {
    siteName: string;
    contactEmail: string;
    announcement: string;
    currencyPeg: number;
    showEmergencyBanner: boolean;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenAuth,
  onOpenAdminLogin,
  onOpenRemoteModal,
  onOpenAdminPortal,
  searchQuery = '',
  onSelectSearchQuery,
  siteSettings,
}) => {
  const {
    currentUser,
    currentRecruiter,
    isAdminLoggedIn,
    unreadNotificationCount,
    unreadJobAlertCount,
    hasUnreadAlertMatches,
    applications,
    savedJobIds,
    logoutUser,
    adminLogout,
  } = useJobContext();

  const hasUnreadMatches = hasUnreadAlertMatches || unreadJobAlertCount > 0 || unreadNotificationCount > 0;

  const userApplicationsCount = applications.length;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      {/* Top Banner Notice: Dominica Nature Isle & Currency Note */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-800/80 text-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-700/60">
              🇩🇲 Nature Isle of the Caribbean
            </span>
            <span className="hidden sm:inline text-emerald-300/90 text-xs font-medium">
              {siteSettings?.announcement || (
                <>All salaries in <strong>Eastern Caribbean Dollars (XCD / EC$)</strong> • Fixed Peg ${siteSettings?.currencyPeg || '2.70'} XCD : $1.00 USD</>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <button
              onClick={onOpenRemoteModal}
              className="text-teal-300 hover:text-teal-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Dominica WIN Extended Visa</span>
            </button>
            {isAdminLoggedIn && (
              <>
                <span className="text-emerald-800">|</span>
                <button
                  onClick={adminLogout}
                  className="text-stone-400 hover:text-white text-[11px] underline cursor-pointer"
                >
                  Exit Admin
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Advisory Banner if enabled by Admin */}
      {siteSettings?.showEmergencyBanner && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-amber-600">
          <span>⚠️ Official Dominica Disaster & Weather Advisory: Nature Island Careers operates emergency staffing line. Contact info@natureislecareers.com</span>
        </div>
      )}

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('jobs')}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 flex items-center justify-center shadow-md shadow-emerald-700/20 border border-emerald-500/30 overflow-hidden">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-rose-500 to-transparent"></div>
              <Briefcase className="w-5 h-5 text-white relative z-10" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-[16px] tracking-tight text-slate-900">Nature Island</span>
                <span className="font-bold text-[16px] text-emerald-600">Careers</span>
              </div>
              <p className="text-[10px] font-medium tracking-wide uppercase text-slate-600">
                Dominica Classified & Career Hub
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Browse Classifieds
            </button>

            <button
              onClick={() => setActiveTab('remote')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'remote'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Laptop className="w-4 h-4 text-teal-600" />
              <span>Remote / WIN Roles</span>
            </button>

            <button
              onClick={() => setActiveTab('career')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'career'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Career Guidance & Library</span>
            </button>

            <button
              onClick={() => setActiveTab('recruiter')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'recruiter'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Employer Portal</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* New Job Alerts Notification Icon */}
            <button
              onClick={onOpenNotifications}
              data-testid="new-job-alerts-button"
              aria-label="New Job Alerts"
              className={`relative p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                hasUnreadMatches
                  ? 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
              title="New Job Alerts"
            >
              <Bell
                data-testid="new-job-alerts-icon"
                className={`w-5 h-5 ${hasUnreadMatches ? 'animate-heartbeat text-emerald-700' : ''}`}
              />
              <span className="hidden xl:inline text-xs font-semibold">New Job Alerts</span>
              {hasUnreadMatches && (
                <span
                  data-testid="unread-alerts-badge"
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-heartbeat"
                >
                  {unreadJobAlertCount || unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Singular 'Profile' Entry in Header */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeTab === 'profile' || activeTab === 'applications' || activeTab === 'resume_builder'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-xs'
                      : 'bg-slate-100/90 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border-slate-200/80'
                  }`}
                  title="Candidate Profile Hub"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div className="text-left hidden sm:block leading-tight">
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-[100px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-black block uppercase tracking-wider">
                      Profile
                    </span>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUserMenuOpen((prev) => !prev);
                    }}
                    className="p-0.5 hover:bg-slate-200/60 rounded"
                    title="Open Profile Options"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {currentUser.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {currentUser.email}
                      </span>
                      <span className="inline-block mt-1 text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Dominica Candidate Profile
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Personal Details & Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('applications');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        <span>My Applications</span>
                      </span>
                      {userApplicationsCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full font-bold">
                          {userApplicationsCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('resume_builder');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Resume Builder & PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        <span>Saved Vacancies</span>
                      </span>
                      {savedJobIds.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                          {savedJobIds.length}
                        </span>
                      )}
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        logoutUser();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : currentRecruiter ? (
              <div className="flex items-center space-x-2 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <Building className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-800 hidden lg:inline truncate max-w-[110px]">
                  {currentRecruiter.companyName}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('profile')}
                className={`inline-flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'profile' || activeTab === 'applications' || activeTab === 'resume_builder'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 bg-white'
                }`}
                title="Candidate Profile"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-100 text-xs font-semibold space-x-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'jobs' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Classifieds
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'remote' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Remote / WIN
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'profile' || activeTab === 'applications' || activeTab === 'resume_builder'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-600'
            }`}
          >
            Profile {userApplicationsCount > 0 ? `(${userApplicationsCount})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('career')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'career' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Career Hub & Library
          </button>
          <button
            onClick={() => setActiveTab('recruiter')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'recruiter' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Employers
          </button>
        </div>
      </div>

      {/* Recent Searches Component in Header tracking search history in localStorage */}
      <RecentSearches
        activeQuery={searchQuery}
        onSelectQuery={(query) => {
          if (onSelectSearchQuery) {
            onSelectSearchQuery(query);
          } else {
            setActiveTab('jobs');
          }
        }}
      />
    </header>
  );
};
