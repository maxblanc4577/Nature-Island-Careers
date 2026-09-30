import React from 'react';
import { useJobContext } from '../context/JobContext';
import {
  Briefcase,
  Bell,
  PlusCircle,
  User,
  Laptop,
  CheckCircle2,
  Shield,
  LogOut,
  Building,
  Compass,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'jobs' | 'remote' | 'applications' | 'recruiter' | 'analytics' | 'career';
  setActiveTab: (tab: 'jobs' | 'remote' | 'applications' | 'recruiter' | 'analytics' | 'career') => void;
  onOpenPostJob: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenAdminLogin: () => void;
  onOpenRemoteModal: () => void;
  onOpenAdminPortal?: () => void;
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
  onOpenPostJob,
  onOpenNotifications,
  onOpenAuth,
  onOpenAdminLogin,
  onOpenRemoteModal,
  onOpenAdminPortal,
  siteSettings,
}) => {
  const {
    currentUser,
    currentRecruiter,
    isAdminLoggedIn,
    unreadNotificationCount,
    applications,
    logoutUser,
    adminLogout,
  } = useJobContext();

  const userApplicationsCount = applications.length;

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
          <span>⚠️ Official Dominica Disaster & Weather Advisory: Nature Island Careers operates emergency staffing line. Contact info@natureislandcareers.com</span>
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
              onClick={() => setActiveTab('applications')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === 'applications'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span>Candidate Hub & CV</span>
              {userApplicationsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-600 text-white text-[11px] rounded-full font-bold">
                  {userApplicationsCount}
                </span>
              )}
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
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
 
             {/* Post Job Button */}
             <button
              onClick={onOpenPostJob}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow-sm shadow-emerald-700/20 transition-all hover:shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Post a Vacancy</span>
              <span className="sm:hidden">Post</span>
            </button>

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden lg:inline truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                <button
                  onClick={logoutUser}
                  title="Sign out"
                  className="text-slate-600 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
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
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 font-semibold text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer bg-white"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
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
            onClick={() => setActiveTab('applications')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'applications' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Candidate Hub ({userApplicationsCount})
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
    </header>
  );
};
