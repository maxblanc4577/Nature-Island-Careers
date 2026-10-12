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
  LogIn,
  UserPlus,
  Smartphone,
  Monitor,
  Columns,
} from 'lucide-react';
import { PlatformViewMode } from './MobilePlatformViews';
import { BrandLogo } from './BrandLogo';

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
  onOpenAuth: (mode?: 'jobseeker_register' | 'client_register' | 'login') => void;
  onOpenAdminLogin: () => void;
  onOpenRemoteModal: () => void;
  onOpenAdminPortal?: () => void;
  searchQuery?: string;
  onSelectSearchQuery?: (query: string) => void;
  viewMode?: PlatformViewMode;
  onChangeViewMode?: (mode: PlatformViewMode) => void;
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
  viewMode = 'desktop',
  onChangeViewMode,
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

          <div className="flex items-center space-x-3 sm:space-x-4 text-xs font-medium">
            {/* Platform View Switcher: Web | iOS | Android | Compare */}
            <div
              data-testid="platform-view-switcher"
              role="group"
              aria-label="Platform View Mode Switcher"
              className="sr-only inline-flex items-center bg-emerald-900/90 border border-emerald-700/70 rounded-lg p-0.5 gap-0.5"
            >
              <button
                type="button"
                data-testid="view-mode-desktop"
                onClick={() => onChangeViewMode?.('desktop')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-emerald-500 text-slate-950 shadow-2xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="Standard Responsive Desktop Web View"
              >
                <Monitor className="w-3 h-3" />
                <span>Web</span>
              </button>
              <button
                type="button"
                data-testid="view-mode-ios"
                onClick={() => onChangeViewMode?.('ios')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'ios'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="Switch to iOS 18 (iPhone 16 Pro) App View"
              >
                <Smartphone className="w-3 h-3" />
                <span>iOS</span>
              </button>
              <button
                type="button"
                data-testid="view-mode-android"
                onClick={() => onChangeViewMode?.('android')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'android'
                    ? 'bg-[#C4EED0] text-[#072711] shadow-2xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="Switch to Android 15 (Material You) App View"
              >
                <Smartphone className="w-3 h-3" />
                <span>Android</span>
              </button>
              <button
                type="button"
                data-testid="view-mode-compare"
                onClick={() => onChangeViewMode?.('compare')}
                className={`hidden sm:flex px-2 py-0.5 rounded-md text-[11px] font-bold items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'compare'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
                title="Compare iOS & Android Views Side-by-Side"
              >
                <Columns className="w-3 h-3" />
                <span>iOS + Android</span>
              </button>
            </div>

            <button
              onClick={onOpenRemoteModal}
              className="hidden md:flex text-teal-300 hover:text-teal-200 items-center gap-1 transition-colors cursor-pointer"
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
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setActiveTab('jobs')}
            data-testid="header-brand-logo"
          >
            <BrandLogo variant="header" />
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

            {/* Account Controls & Singular 'Profile' Entry in Header */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    data-testid="header-account-menu-button"
                    onClick={() =>
                      setActiveTab(currentUser.role === 'client' ? 'recruiter' : 'profile')
                    }
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      activeTab === 'profile' ||
                      activeTab === 'applications' ||
                      activeTab === 'resume_builder' ||
                      (currentUser.role === 'client' && activeTab === 'recruiter')
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-xs'
                        : 'bg-slate-100/90 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border-slate-200/80'
                    }`}
                    title={
                      currentUser.role === 'client'
                        ? 'Employer Account Portal'
                        : 'Candidate Profile Hub'
                    }
                  >
                    <div
                      className={`w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 ${
                        currentUser.role === 'client' ? 'bg-amber-700' : 'bg-emerald-700'
                      }`}
                    >
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : currentUser.role === 'client' ? (
                        <Building className="w-3.5 h-3.5" />
                      ) : (
                        currentUser.name.charAt(0)
                      )}
                    </div>
                    <div className="text-left hidden sm:block leading-tight">
                      <span className="text-xs font-bold text-slate-800 block truncate max-w-[115px]">
                        {currentUser.role === 'client'
                          ? currentUser.companyName || currentUser.name
                          : currentUser.name}
                      </span>
                      <span
                        className={`text-[10px] font-black block uppercase tracking-wider ${
                          currentUser.role === 'client' ? 'text-amber-800' : 'text-emerald-700'
                        }`}
                      >
                        {currentUser.role === 'client' ? 'Employer' : 'Profile'}
                      </span>
                    </div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserMenuOpen((prev) => !prev);
                      }}
                      className="p-0.5 hover:bg-slate-200/60 rounded"
                      title="Open Account Options"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                      <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {currentUser.name}
                        </span>
                        {currentUser.companyName && (
                          <span className="text-[11px] font-semibold text-amber-800 block truncate">
                            {currentUser.companyName}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 block truncate">
                          {currentUser.email}
                        </span>
                        <span
                          className={`inline-block mt-1 text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                            currentUser.role === 'client'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {currentUser.role === 'client'
                            ? 'Dominica Employer Account'
                            : 'Dominica Candidate Profile'}
                        </span>
                      </div>

                      {currentUser.role === 'client' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('recruiter');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center gap-2 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
                        >
                          <Building className="w-4 h-4 text-amber-700" />
                          <span>Employer Command Center</span>
                        </button>
                      ) : null}

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
                          setIsUserMenuOpen(false);
                          onOpenAuth('login');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 text-emerald-600" />
                        <span>Switch / Create Account</span>
                      </button>

                      <button
                        type="button"
                        data-testid="dropdown-logout-button"
                        onClick={() => {
                          logoutUser();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct 1-Click Log Out Button in Header */}
                <button
                  type="button"
                  data-testid="header-logout-button"
                  onClick={() => {
                    logoutUser();
                    setIsUserMenuOpen(false);
                  }}
                  title="Log Out of Account"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="header-login-button"
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Log In</span>
                </button>

                <button
                  type="button"
                  data-testid="header-register-button"
                  onClick={() => onOpenAuth('jobseeker_register')}
                  className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Create Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'profile' || activeTab === 'applications' || activeTab === 'resume_builder'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 bg-white'
                  }`}
                  title="Candidate Profile"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="hidden xl:inline">Profile</span>
                </button>
              </div>
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
