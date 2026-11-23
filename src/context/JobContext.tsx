import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  JobListing,
  JobApplication,
  EmailNotification,
  JobAlertSubscription,
  FeedbackItem,
  RecruiterAccount,
  DatabaseSyncRecord,
  ApplicationStatus,
  Parish,
  JobSector,
  InterviewDetails,
  InterviewEvaluation,
  InterviewSlot,
  UserAccount,
  ClientSubscription,
  SubscriptionPlan,
  EmployerInvoice,
  StripeSettings,
  SubscriptionCriteria,
  AlertPreferenceRule,
  SavedJobFolder,
  AdminActivityCategory,
  AdminActivityLogEntry,
  AdminEmailAlert,
  SiteSettings,
} from '../types';
import {
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECRUITERS,
  INITIAL_SYNC_RECORDS,
  INITIAL_FEEDBACK,
  INITIAL_USERS,
  INITIAL_INVOICES,
  INITIAL_STRIPE_SETTINGS,
} from '../data/mockData';
import {
  notifySavedJobStatusChange,
  notifyNewJobMatch,
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission,
} from '../utils/browserNotifications';
import {
  signInWithGooglePopup,
  signInWithGithubPopup,
  signInWithSocialProviderPopup,
  SocialAuthProviderType,
  signOutFromFirebase,
  syncAuthenticatedUserToFirestore,
  sendFirebasePasswordReset,
} from '../firebase';
import { getMembershipPlanDetails } from '../utils/membershipPlans';

interface JobContextType {
  // Role & Recruiter
  activeRole: 'jobseeker' | 'recruiter' | 'admin';
  setActiveRole: (role: 'jobseeker' | 'recruiter' | 'admin') => void;
  currentRecruiter: RecruiterAccount;
  setCurrentRecruiterId: (id: string) => void;
  recruiters: RecruiterAccount[];
  updateRecruiter: (id: string, updates: Partial<RecruiterAccount>) => void;

  // Invoices & Stripe Billing
  invoices: EmployerInvoice[];
  addInvoice: (invoice: Omit<EmployerInvoice, 'id'>) => EmployerInvoice;
  notifyEmployerPaymentSuccess: (
    invoice: EmployerInvoice,
    recipientEmail?: string,
    portalUsed?: string
  ) => EmailNotification;
  stripeSettings: StripeSettings;
  updateStripeSettings: (settings: Partial<StripeSettings>) => void;
  toggleRecruiterAutoRenew: (recruiterId: string, enabled: boolean) => void;
  sendRecruiterReminders: (contactEmail?: string) => { sentCount: number; messages: string[] };
  notifySubscriptionExpired: (employerName: string, plan: string, expiryDate?: string) => void;

  // User Authentication & Registration
  currentUser: UserAccount | null;
  users: UserAccount[];
  registerJobseeker: (data: {
    name: string;
    email: string;
    phone: string;
    parish: Parish;
    careerSector: JobSector;
    skills: string[];
    resumeFileName?: string;
    resumeText?: string;
    password?: string;
    headline?: string;
    bio?: string;
    residencyStatus?: string;
    minSalaryRequirement?: number;
    preferredParish?: Parish;
    preferredSector?: JobSector;
    autoMatchEmailsEnabled?: boolean;
  }) => UserAccount;
  registerClient: (data: {
    companyName: string;
    name: string;
    email: string;
    phone: string;
    parish: Parish;
    dssRegistrationNo: string;
    industry: JobSector;
    password?: string;
    locality?: string;
    nepPartner?: boolean;
    selectedPlan?: SubscriptionPlan;
  }) => UserAccount;
  subscribeClientPlan: (
    userId: string,
    plan: SubscriptionPlan,
    paymentMethod: 'National Bank of Dominica (NBD)' | 'Credit/Debit Card (XCD)' | 'Republic Bank / Wire',
    options?: { skipEmail?: boolean; transactionRef?: string }
  ) => void;
  loginUser: (email: string, password?: string, roleFilter?: 'jobseeker' | 'client') => boolean;
  authenticateWithGoogle: (
    preferredRole: 'jobseeker' | 'client',
    extraFields?: {
      companyName?: string;
      dssRegistrationNo?: string;
      parish?: Parish;
      phone?: string;
      careerSector?: JobSector;
      skills?: string[];
    }
  ) => Promise<UserAccount>;
  authenticateWithGithub: (
    preferredRole: 'jobseeker' | 'client',
    extraFields?: {
      companyName?: string;
      dssRegistrationNo?: string;
      parish?: Parish;
      phone?: string;
      careerSector?: JobSector;
      skills?: string[];
    }
  ) => Promise<UserAccount>;
  authenticateWithSocialProvider: (
    providerType: SocialAuthProviderType,
    preferredRole: 'jobseeker' | 'client',
    extraFields?: {
      companyName?: string;
      dssRegistrationNo?: string;
      parish?: Parish;
      phone?: string;
      careerSector?: JobSector;
      skills?: string[];
    }
  ) => Promise<UserAccount>;
  logoutUser: () => void;
  updateCurrentUser: (updatedFields: Partial<UserAccount>) => void;
  requestPasswordReset: (email: string) => {
    success: boolean;
    code?: string;
    resetLink?: string;
    oobCode?: string;
    accountName?: string;
    accountRole?: 'jobseeker' | 'client' | 'admin';
    error?: string;
  };
  confirmPasswordReset: (
    email: string,
    code: string,
    newPassword: string
  ) => {
    success: boolean;
    error?: string;
    user?: UserAccount;
  };

  // Admin Portal Single Login, Activity Log & Idle Session Security
  isAdminLoggedIn: boolean;
  adminEmail: string | null;
  adminSessionToken: string | null;
  adminLogin: (email: string, pass: string, serverToken?: string) => boolean;
  adminLogout: () => void;
  adminActivityLogs: AdminActivityLogEntry[];
  logAdminActivity: (
    action: string,
    details: string,
    category?: AdminActivityCategory
  ) => AdminActivityLogEntry;
  clearAdminActivityLogs: () => void;
  mergeAdminAuditLogs: (serverLogs: AdminActivityLogEntry[]) => void;
  adminEmailAlerts: AdminEmailAlert[];
  mergeAdminEmailAlerts: (serverAlerts: AdminEmailAlert[]) => void;
  sendAdminEmailAlert: (params: {
    eventType: 'new_job_posting' | 'stripe_payment_finalized';
    subject: string;
    summary: string;
    bodyHtml?: string;
    relatedJobId?: string;
    relatedInvoiceId?: string;
    amountXCD?: number;
    syncToServer?: boolean;
    serverPayload?: Record<string, unknown>;
  }) => AdminEmailAlert;
  clearAdminEmailAlerts: () => void;
  isAdminSessionExpiredPromptOpen: boolean;
  dismissAdminSessionExpiredPrompt: () => void;
  triggerAdminIdleTimeout: () => void;
  resetAdminIdleTimer: () => void;
  lastAdminActivityAt: number;
  adminIdleTimeoutMs: number;

  // Jobs & Remote Assignments
  jobs: JobListing[];
  getJobById: (id: string) => JobListing | undefined;
  createJob: (jobData: Omit<JobListing, 'id' | 'postedAt' | 'viewsCount' | 'applicantsCount'>) => void;
  createRemoteAssignment: (assignmentData: {
    title: string;
    sector: JobSector;
    projectDuration: string;
    minSalary: number;
    maxSalary: number;
    requiredSkills: string[];
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
    applicationDeadline: string;
  }) => boolean;
  updateJob: (id: string, updates: Partial<JobListing>) => void;
  deleteJob: (id: string) => void;
  incrementJobViews: (id: string) => void;

  // Bookmarks & Custom Named Folders
  savedJobIds: string[];
  savedJobFolders: SavedJobFolder[];
  toggleSaveJob: (id: string, folderName?: string) => void;
  isJobSaved: (id: string) => boolean;
  createSavedFolder: (folderName: string) => SavedJobFolder;
  deleteSavedFolder: (folderId: string) => void;
  renameSavedFolder: (folderId: string, newName: string) => void;
  saveJobToFolder: (jobId: string, folderNameOrId: string) => void;
  removeJobFromFolder: (jobId: string, folderId: string) => void;
  getJobFolders: (jobId: string) => SavedJobFolder[];

  // Dismissed Job Cards (Swipe to Dismiss on Mobile / iOS / Android)
  dismissedJobIds: string[];
  dismissJob: (jobId: string) => void;
  restoreDismissedJob: (jobId: string) => void;
  clearDismissedJobs: () => void;

  // Applications
  applications: JobApplication[];
  myApplications: JobApplication[];
  quickApplyToJob: (jobId: string) => {
    applicationId: string;
    resumeFileName: string;
    alreadyApplied: boolean;
  } | null;
  submitApplication: (applicationData: {
    jobId: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    parish: Parish;
    citizenStatus: 'Dominican Citizen' | 'CARICOM CSME' | 'Work Permit Holder' | 'NEP Trainee';
    resumeFileName: string;
    resumeFileSize: string;
    portfolioUrl?: string;
    coverNote: string;
    screeningAnswers: Record<string, string>;
  }) => string; // returns application ID
  updateApplicationStatus: (appId: string, newStatus: ApplicationStatus, customEmailMessage?: string) => void;
  rateApplication: (appId: string, rating: number) => void;
  addApplicationNote: (appId: string, note: string) => void;
  scheduleInterview: (appId: string, details: InterviewDetails) => void;
  saveInterviewEvaluation: (appId: string, evaluation: InterviewEvaluation) => void;
  selectInterviewSlot: (appId: string, slotId: string, candidateNote?: string) => void;
  withdrawApplication: (appId: string) => void;

  // Real-time Email Notifications
  notifications: EmailNotification[];
  unreadNotificationCount: number;
  unreadJobAlertCount: number;
  hasUnreadAlertMatches: boolean;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  latestDispatchedEmail: EmailNotification | null;
  dismissLatestEmail: () => void;
  dispatchEmail: (notification: EmailNotification) => void;
  sendManualTestAlert: (targetEmail: string) => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission>;

  // Recent Searches persisted in localStorage
  recentSearches: string[];
  setRecentSearches: React.Dispatch<React.SetStateAction<string[]>>;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Alerts Subscriptions & Persistent Subscription Criteria
  alerts: JobAlertSubscription[];
  subscriptionCriteria: SubscriptionCriteria;
  setSubscriptionCriteria: React.Dispatch<React.SetStateAction<SubscriptionCriteria>>;
  saveSubscriptionCriteria: (criteria: Partial<SubscriptionCriteria>) => SubscriptionCriteria;
  loadSubscriptionCriteria: () => SubscriptionCriteria;
  subscribeToAlert: (data: {
    email: string;
    name: string;
    parishes: Parish[];
    sectors: JobSector[];
    frequency: 'instant' | 'daily' | 'weekly';
    keyword?: string;
    minSalary?: number;
  }) => void;
  toggleAlertActive: (id: string) => void;

  // Feedback
  feedbacks: FeedbackItem[];
  submitFeedback: (feedback: Omit<FeedbackItem, 'id' | 'submittedAt'>) => void;

  // Local Employment DB Integration
  syncRecords: DatabaseSyncRecord[];
  runSyncSimulation: (targetSystem: 'Dominica Labour Division' | 'National Employment Programme (NEP)' | 'Dominica Social Security (DSS)') => void;
  exportDatabaseCSV: () => void;

  // Site Settings (including competitive / high-range salary threshold)
  siteSettings: SiteSettings;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => void;

  // Automated Job Expiration (>45 Days)
  isJobExpired: (job: JobListing, referenceTimestamp?: number) => boolean;
  renewJobListing: (jobId: string) => void;
  expiredJobIds: string[];

  // Automated Job Matching (Proactive Jobseeker Emails)
  automatedJobMatches: AutomatedJobMatchRecord[];
  runAutomatedJobMatchingForJob: (job: JobListing) => AutomatedJobMatchRecord[];
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JOB_EXPIRATION_DAYS = 45;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Nature Island Careers',
  contactEmail: 'info@natureislecareers.com',
  announcement: 'Dominica Work In Nature (WIN) 2026 Extended Visas Active · Certified 18-Month Remote Stay',
  currencyPeg: 2.70,
  showEmergencyBanner: false,
  backgroundImageUrl: '/nature_island_photo.svg',
  fullPageBackground: false,
  competitiveSalaryThreshold: 8000,
};

export function isJobListingExpired(
  job: Pick<JobListing, 'postedAt' | 'isExpired' | 'status'>,
  referenceTimestamp: number = Date.now()
): boolean {
  if (job.isExpired || job.status === 'expired') return true;
  if (!job.postedAt) return false;
  const postedTime = new Date(job.postedAt).getTime();
  if (isNaN(postedTime)) return false;
  const diffDays = (referenceTimestamp - postedTime) / (1000 * 60 * 60 * 24);
  return diffDays > JOB_EXPIRATION_DAYS;
}

export interface AutomatedJobMatchRecord {
  id: string;
  candidateEmail: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  matchedAt: string;
  reasons: string[];
}

export const AUTO_JOB_MATCHES_STORAGE_KEY = 'dominica_auto_jobseeker_matches';

export function evaluateJobMatchForJobseeker(
  job: JobListing,
  candidate: UserAccount,
  alerts: JobAlertSubscription[] = []
): { matched: boolean; reasons: string[] } {
  if (candidate.role !== 'jobseeker') {
    return { matched: false, reasons: [] };
  }
  if (!candidate.email || !candidate.email.trim()) {
    return { matched: false, reasons: [] };
  }
  if (candidate.autoMatchEmailsEnabled === false) {
    return { matched: false, reasons: [] };
  }
  if (isJobListingExpired(job)) {
    return { matched: false, reasons: [] };
  }

  const linkedAlert = alerts.find(
    (a) => a.active && a.email.toLowerCase() === candidate.email.toLowerCase()
  );

  // 1. Saved Salary Requirement check (XCD / month)
  const savedMinSalary = candidate.minSalaryRequirement ?? linkedAlert?.minSalary ?? 0;
  if (savedMinSalary > 0 && job.maxSalary < savedMinSalary) {
    return { matched: false, reasons: [] };
  }

  // 2. Preferred Parish check
  const prefParish = candidate.preferredParish || candidate.parish;
  const parishMatches =
    !prefParish ||
    prefParish === job.parish ||
    prefParish === 'Island-wide / Remote' ||
    job.parish === 'Island-wide / Remote';
  if (!parishMatches) {
    return { matched: false, reasons: [] };
  }

  // 3. Preferred Sector check
  const prefSector = candidate.preferredSector || candidate.careerSector;
  const sectorMatches = !prefSector || prefSector === job.sector;
  if (!sectorMatches) {
    return { matched: false, reasons: [] };
  }

  const reasons: string[] = [
    savedMinSalary > 0
      ? `Salary EC$${job.minSalary.toLocaleString()}–EC$${job.maxSalary.toLocaleString()} meets saved EC$${savedMinSalary.toLocaleString()} requirement`
      : `Compensation EC$${job.minSalary.toLocaleString()}–EC$${job.maxSalary.toLocaleString()} / ${job.salaryPeriod}`,
    `Preferred Parish (${prefParish || job.parish})`,
    `Preferred Sector (${prefSector || job.sector})`,
  ];

  return { matched: true, reasons };
}

export function buildAutomatedJobMatchEmail(
  job: JobListing,
  candidate: UserAccount,
  reasons: string[]
): EmailNotification {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const salaryDisplay = `EC$${job.minSalary.toLocaleString()} - EC$${job.maxSalary.toLocaleString()} / ${job.salaryPeriod}`;
  return {
    id: `notif-automatch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    recipientEmail: candidate.email,
    recipientName: candidate.name,
    subject: `Automated Job Match: ${job.title} in ${job.parish} (${salaryDisplay})`,
    previewText: `New match at ${job.company} (${job.sector}) aligning with your saved salary, parish (${candidate.preferredParish || candidate.parish}), and sector criteria.`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
        <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #006b4d; margin: 0;">Nature Island Careers · Automated Job Matching</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Proactive Match for Registered Candidate Profile</p>
        </div>
        <p style="font-size: 15px; color: #1e293b;">Hello ${candidate.name},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
          A newly published Dominica opportunity matches your saved salary requirement, preferred parish, and target sector:
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #065f46; margin: 0 0 6px 0;">${job.title}</h3>
          <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Employer:</strong> ${job.company}</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Parish:</strong> ${job.parish} (${job.locality})</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Sector:</strong> ${job.sector}</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #065f46; font-weight: 600;"><strong>Compensation:</strong> ${salaryDisplay}</p>
        </div>
        <ul style="font-size: 13px; color: #334155; padding-left: 18px;">
          ${reasons.map((r) => `<li>${r}</li>`).join('')}
        </ul>
        <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
          Log into Nature Island Careers to review full requirements or submit a 1-Click Quick Apply.
        </p>
      </div>
    `,
    type: 'job_alert',
    timestamp,
    isRead: false,
    relatedJobId: job.id,
  };
}

export const SUBSCRIPTION_CRITERIA_STORAGE_KEY = 'dominica_subscription_criteria';
export const RECENT_SEARCHES_STORAGE_KEY = 'dominica_recent_searches';
export const LEGACY_RECENT_SEARCHES_KEY = 'natureisland_recent_searches';
export const SAVED_JOB_FOLDERS_STORAGE_KEY = 'dominica_saved_job_folders';
export const ADMIN_ACTIVITY_LOG_STORAGE_KEY = 'dominica_admin_activity_log';
export const ADMIN_LAST_ACTIVE_STORAGE_KEY = 'dominica_admin_last_active';
export const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export const DEFAULT_ADMIN_ACTIVITY_LOGS: AdminActivityLogEntry[] = [
  {
    id: 'adm-log-init-1',
    action: 'Site Settings Synchronized',
    details: 'Portal branding & XCD/USD currency peg (2.70) verified in localStorage.',
    category: 'Site Settings',
    timestamp: '2026-10-08 09:15:00 AST',
    actor: 'info@natureislecareers.com',
  },
  {
    id: 'adm-log-init-2',
    action: 'Stripe Payment Gateway Verified',
    details: 'Live XCD checkout & recurring employer billing webhook configured.',
    category: 'Payment Update',
    timestamp: '2026-10-08 09:10:00 AST',
    actor: 'info@natureislecareers.com',
  },
];

let inMemoryAdminActivityLogs: AdminActivityLogEntry[] | null = null;

export function loadAdminActivityLogsFromStorage(): AdminActivityLogEntry[] {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const raw = localStorage.getItem(ADMIN_ACTIVITY_LOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is AdminActivityLogEntry =>
              Boolean(
                item &&
                  typeof item.id === 'string' &&
                  typeof item.action === 'string' &&
                  typeof item.timestamp === 'string'
              )
          );
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  if (inMemoryAdminActivityLogs !== null) {
    return inMemoryAdminActivityLogs;
  }
  return DEFAULT_ADMIN_ACTIVITY_LOGS;
}

export function saveAdminActivityLogsToStorage(
  logs: AdminActivityLogEntry[]
): AdminActivityLogEntry[] {
  inMemoryAdminActivityLogs = logs;
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(ADMIN_ACTIVITY_LOG_STORAGE_KEY, JSON.stringify(logs));
    }
  } catch {
    // ignore storage errors
  }
  return logs;
}

export function appendAdminActivityLogEntry(
  currentLogs: AdminActivityLogEntry[],
  entry: {
    action: string;
    details: string;
    category?: AdminActivityCategory;
    actor?: string;
    timestamp?: string;
  }
): AdminActivityLogEntry[] {
  const formattedTime =
    entry.timestamp ||
    new Date().toISOString().replace('T', ' ').substring(0, 19) + ' AST';
  const newItem: AdminActivityLogEntry = {
    id: `adm-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: entry.action,
    details: entry.details,
    category: entry.category || 'Site Settings',
    timestamp: formattedTime,
    actor: entry.actor || 'info@natureislecareers.com',
  };
  const updated = [newItem, ...currentLogs].slice(0, 100);
  saveAdminActivityLogsToStorage(updated);
  return updated;
}

export function isAdminSessionIdleExpired(
  lastActivityMs: number,
  nowMs: number = Date.now(),
  timeoutMs: number = ADMIN_IDLE_TIMEOUT_MS
): boolean {
  if (!Number.isFinite(lastActivityMs) || lastActivityMs <= 0) return false;
  return nowMs - lastActivityMs >= timeoutMs;
}

export function getRemainingAdminSessionMs(
  lastActivityMs: number,
  nowMs: number = Date.now(),
  timeoutMs: number = ADMIN_IDLE_TIMEOUT_MS
): number {
  if (!Number.isFinite(lastActivityMs) || lastActivityMs <= 0) return timeoutMs;
  return Math.max(0, timeoutMs - (nowMs - lastActivityMs));
}

export const DEFAULT_SAVED_JOB_FOLDERS: SavedJobFolder[] = [
  {
    id: 'folder-priority',
    name: 'Priority Applications',
    jobIds: ['job-101'],
    createdAt: '2026-09-20',
  },
  {
    id: 'folder-remote',
    name: 'Remote & WIN Roles',
    jobIds: ['job-102'],
    createdAt: '2026-09-22',
  },
  {
    id: 'folder-eco-energy',
    name: 'Eco-Tourism & Energy',
    jobIds: [],
    createdAt: '2026-09-25',
  },
];

export function loadSavedJobFoldersFromStorage(): SavedJobFolder[] {
  try {
    const raw = localStorage.getItem(SAVED_JOB_FOLDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (f): f is SavedJobFolder =>
            Boolean(f && typeof f.id === 'string' && typeof f.name === 'string' && Array.isArray(f.jobIds))
        );
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_SAVED_JOB_FOLDERS;
}

export function saveSavedJobFoldersToStorage(folders: SavedJobFolder[]): SavedJobFolder[] {
  try {
    localStorage.setItem(SAVED_JOB_FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch {
    // ignore storage errors
  }
  return folders;
}

export const DEFAULT_RECENT_SEARCHES: string[] = [
  'Eco-Resort',
  'Software Developer',
  'Solar Energy',
  'Geothermal Engineer',
];

export function loadRecentSearchesFromStorage(): string[] {
  try {
    const raw =
      localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_RECENT_SEARCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim());
        return cleaned;
      }
    }
  } catch {
    // ignore storage / parse errors
  }
  return DEFAULT_RECENT_SEARCHES;
}

export function saveRecentSearchesToStorage(searches: string[]): string[] {
  try {
    const serialized = JSON.stringify(searches);
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_RECENT_SEARCHES_KEY, serialized);
  } catch {
    // ignore storage errors
  }
  return searches;
}

export const DEFAULT_SUBSCRIPTION_CRITERIA: SubscriptionCriteria = {
  email: 'maxblanc10468@gmail.com',
  name: 'Max Blanc',
  parishes: ['St. George', 'St. John'],
  sectors: [
    'Renewable Energy & Geothermal',
    'Eco-Tourism & Hospitality',
    'Information Technology & Digital',
  ],
  keyword: '',
  frequency: 'instant',
  enabled: true,
  alertPreferences: [
    {
      id: 'pref-1',
      sector: 'Renewable Energy & Geothermal',
      parish: 'St. George',
      active: true,
    },
    {
      id: 'pref-2',
      sector: 'Eco-Tourism & Hospitality',
      parish: 'St. George',
      active: true,
    },
    {
      id: 'pref-3',
      sector: 'Information Technology & Digital',
      parish: 'Island-wide / Remote',
      active: true,
    },
  ],
  updatedAt: '2026-09-24',
};

export function loadSubscriptionCriteriaFromStorage(): SubscriptionCriteria {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_CRITERIA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SUBSCRIPTION_CRITERIA,
        ...parsed,
        parishes: Array.isArray(parsed.parishes)
          ? parsed.parishes
          : DEFAULT_SUBSCRIPTION_CRITERIA.parishes,
        sectors: Array.isArray(parsed.sectors)
          ? parsed.sectors
          : DEFAULT_SUBSCRIPTION_CRITERIA.sectors,
        alertPreferences: Array.isArray(parsed.alertPreferences)
          ? parsed.alertPreferences
          : DEFAULT_SUBSCRIPTION_CRITERIA.alertPreferences,
      };
    }
    // Fallback to dominica_alerts if present
    const savedAlertsRaw = localStorage.getItem('dominica_alerts');
    if (savedAlertsRaw) {
      const parsedAlerts: JobAlertSubscription[] = JSON.parse(savedAlertsRaw);
      const firstActive = parsedAlerts.find((a) => a.active) || parsedAlerts[0];
      if (firstActive) {
        const derivedPrefs: AlertPreferenceRule[] =
          firstActive.sectors.length > 0
            ? firstActive.sectors.map((sec, idx) => ({
                id: `pref-derived-${idx}`,
                sector: sec,
                parish: firstActive.parishes[idx % Math.max(1, firstActive.parishes.length)] || 'All Parishes',
                keyword: firstActive.keyword,
                active: firstActive.active,
              }))
            : DEFAULT_SUBSCRIPTION_CRITERIA.alertPreferences || [];
        return {
          email: firstActive.email,
          name: firstActive.name,
          parishes: firstActive.parishes,
          sectors: firstActive.sectors,
          keyword: firstActive.keyword || '',
          frequency: firstActive.frequency,
          enabled: firstActive.active,
          alertPreferences: derivedPrefs,
          updatedAt: firstActive.createdAt || new Date().toISOString().split('T')[0],
        };
      }
    }
  } catch {
    // ignore JSON / storage errors
  }
  return DEFAULT_SUBSCRIPTION_CRITERIA;
}

export function saveSubscriptionCriteriaToStorage(criteria: SubscriptionCriteria): SubscriptionCriteria {
  try {
    localStorage.setItem(SUBSCRIPTION_CRITERIA_STORAGE_KEY, JSON.stringify(criteria));
  } catch {
    // ignore storage errors
  }
  return criteria;
}

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persistent state or fallback to mock data
  const [activeRole, setActiveRole] = useState<'jobseeker' | 'recruiter' | 'admin'>('jobseeker');
  const [recruiters, setRecruiters] = useState<RecruiterAccount[]>(() => {
    try {
      const saved = localStorage.getItem('dominica_recruiters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_RECRUITERS;
  });
  const [currentRecruiterId, setCurrentRecruiterId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('dominica_current_recruiter_id');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'rec_fort_young';
  });

  const [jobs, setJobs] = useState<JobListing[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_jobs') : null;
      return saved ? JSON.parse(saved) : INITIAL_JOBS;
    } catch {
      return INITIAL_JOBS;
    }
  });

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_applications') : null;
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  const [notifications, setNotifications] = useState<EmailNotification[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_notifications') : null;
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [alerts, setAlerts] = useState<JobAlertSubscription[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_alerts') : null;
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'alert-1',
        email: 'maxblanc10468@gmail.com',
        name: 'Max Blanc',
        parishes: ['St. George', 'St. John'],
        sectors: ['Renewable Energy & Geothermal', 'Eco-Tourism & Hospitality', 'Information Technology & Digital'],
        frequency: 'instant',
        active: true,
        createdAt: '2026-09-24',
      },
    ];
  });

  const [subscriptionCriteria, setSubscriptionCriteria] = useState<SubscriptionCriteria>(() =>
    loadSubscriptionCriteriaFromStorage()
  );

  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadRecentSearchesFromStorage()
  );

  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_saved_jobs') : null;
      return saved ? JSON.parse(saved) : ['job-101', 'job-102'];
    } catch {
      return ['job-101', 'job-102'];
    }
  });

  const [savedJobFolders, setSavedJobFolders] = useState<SavedJobFolder[]>(() =>
    loadSavedJobFoldersFromStorage()
  );

  const [dismissedJobIds, setDismissedJobIds] = useState<string[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_dismissed_jobs') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_feedbacks') : null;
      return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
    } catch {
      return INITIAL_FEEDBACK;
    }
  });

  const [syncRecords, setSyncRecords] = useState<DatabaseSyncRecord[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_sync_records') : null;
      return saved ? JSON.parse(saved) : INITIAL_SYNC_RECORDS;
    } catch {
      return INITIAL_SYNC_RECORDS;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_users') : null;
      return saved ? JSON.parse(saved) : (INITIAL_USERS as UserAccount[]);
    } catch {
      return INITIAL_USERS as UserAccount[];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('dominica_logged_out') === 'true') {
        return null;
      }
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_current_user') : null;
      return saved ? JSON.parse(saved) : ((INITIAL_USERS[0] as UserAccount) || null);
    } catch {
      return (INITIAL_USERS[0] as UserAccount) || null;
    }
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem('dominica_admin_logged') === 'true';
    } catch {
      return false;
    }
  });

  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('dominica_admin_logged') === 'true') {
        return localStorage.getItem('dominica_admin_email') || 'info@natureislecareers.com';
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem('natureisland_admin_token');
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [adminActivityLogs, setAdminActivityLogs] = useState<AdminActivityLogEntry[]>(() =>
    loadAdminActivityLogsFromStorage()
  );

  const [adminEmailAlerts, setAdminEmailAlerts] = useState<AdminEmailAlert[]>(() => {
    try {
      const saved =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('dominica_admin_email_alerts')
          : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastAdminActivityAt, setLastAdminActivityAt] = useState<number>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(ADMIN_LAST_ACTIVE_STORAGE_KEY) : null;
      if (saved) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return Date.now();
  });

  const [isAdminSessionExpiredPromptOpen, setIsAdminSessionExpiredPromptOpen] =
    useState<boolean>(false);

  const [invoices, setInvoices] = useState<EmployerInvoice[]>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_employer_invoices') : null;
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [stripeSettings, setStripeSettings] = useState<StripeSettings>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dominica_stripe_settings') : null;
      return saved ? JSON.parse(saved) : INITIAL_STRIPE_SETTINGS;
    } catch {
      return INITIAL_STRIPE_SETTINGS;
    }
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('natureisland_site_settings') : null;
      if (saved) {
        return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SITE_SETTINGS;
  });

  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('natureisland_site_settings', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      return updated;
    });
  };

  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('natureisland_site_settings', JSON.stringify(siteSettings));
      }
    } catch {
      // ignore
    }
  }, [siteSettings]);

  // Automated 45-day expiration check on jobs: flags active jobs >45 days old as expired
  useEffect(() => {
    const now = Date.now();
    let hasChanges = false;
    const updated = jobs.map((job) => {
      const expired = isJobListingExpired(job, now);
      if (expired && (!job.isExpired || job.status !== 'expired')) {
        hasChanges = true;
        return {
          ...job,
          isExpired: true,
          status: 'expired' as const,
        };
      }
      return job;
    });
    if (hasChanges) {
      setJobs(updated);
    }
  }, []);

  const isJobExpired = (job: JobListing, referenceTimestamp: number = Date.now()): boolean => {
    return isJobListingExpired(job, referenceTimestamp);
  };

  const renewJobListing = (jobId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              postedAt: today,
              isExpired: false,
              status: 'active' as const,
            }
          : job
      )
    );
  };

  const expiredJobIds = jobs.filter((job) => isJobListingExpired(job)).map((job) => job.id);

  const [latestDispatchedEmail, setLatestDispatchedEmail] = useState<EmailNotification | null>(null);

  // Sync to local storage & Service Worker Cache Storage for offline availability
  useEffect(() => {
    try {
      localStorage.setItem('dominica_jobs', JSON.stringify(jobs));
    } catch {
      // ignore storage quota errors
    }
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches
        .open('dominica-jobs-api-cache')
        .then((cache) => {
          const payload = JSON.stringify({
            jobs,
            cachedAt: new Date().toISOString(),
            source: 'dominica-offline-sync',
          });
          return cache.put(
            '/api/jobs',
            new Response(payload, {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        })
        .catch(() => {
          // ignore cache storage errors in restricted contexts
        });
    }
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('dominica_employer_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('dominica_stripe_settings', JSON.stringify(stripeSettings));
  }, [stripeSettings]);

  useEffect(() => {
    localStorage.setItem('dominica_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('dominica_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('dominica_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    saveSubscriptionCriteriaToStorage(subscriptionCriteria);
  }, [subscriptionCriteria]);

  useEffect(() => {
    saveRecentSearchesToStorage(recentSearches);
  }, [recentSearches]);

  const addRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 6);
      saveRecentSearchesToStorage(updated);
      return updated;
    });
  };

  const removeRecentSearch = (query: string) => {
    const trimmed = query.trim();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      saveRecentSearchesToStorage(updated);
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(LEGACY_RECENT_SEARCHES_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  const loadSubscriptionCriteria = React.useCallback((): SubscriptionCriteria => {
    const loaded = loadSubscriptionCriteriaFromStorage();
    setSubscriptionCriteria(loaded);
    return loaded;
  }, []);

  const saveSubscriptionCriteria = (
    updates: Partial<SubscriptionCriteria>
  ): SubscriptionCriteria => {
    const merged: SubscriptionCriteria = {
      ...subscriptionCriteria,
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setSubscriptionCriteria(merged);
    saveSubscriptionCriteriaToStorage(merged);

    const updatedMinSalary = updates.minSalary ?? merged.minSalary;
    // Keep primary alert entry in `alerts` synchronized as well
    setAlerts((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.email.toLowerCase() === merged.email.toLowerCase()
      );
      const syncedSub: JobAlertSubscription = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `alert-${Date.now()}`,
        email: merged.email,
        name: merged.name,
        parishes: merged.parishes,
        sectors: merged.sectors,
        keyword: merged.keyword,
        minSalary: updatedMinSalary,
        frequency: merged.frequency,
        active: merged.enabled,
        createdAt: existingIdx >= 0 ? prev[existingIdx].createdAt : merged.updatedAt,
      };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = syncedSub;
        return copy;
      }
      return [syncedSub, ...prev];
    });

    // Synchronize matching UserAccount salary/parish/sector preferences
    if (merged.email) {
      const targetEmail = merged.email.toLowerCase();
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.email.toLowerCase() !== targetEmail || u.role !== 'jobseeker') return u;
          return {
            ...u,
            minSalaryRequirement: updatedMinSalary ?? u.minSalaryRequirement,
            preferredParish: merged.parishes[0] || u.preferredParish,
            preferredSector: merged.sectors[0] || u.preferredSector,
            autoMatchEmailsEnabled: merged.enabled,
          };
        })
      );
      if (currentUser && currentUser.email.toLowerCase() === targetEmail && currentUser.role === 'jobseeker') {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                minSalaryRequirement: updatedMinSalary ?? prev.minSalaryRequirement,
                preferredParish: merged.parishes[0] || prev.preferredParish,
                preferredSector: merged.sectors[0] || prev.preferredSector,
                autoMatchEmailsEnabled: merged.enabled,
              }
            : prev
        );
      }
    }

    return merged;
  };

  useEffect(() => {
    localStorage.setItem('dominica_saved_jobs', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  useEffect(() => {
    saveSavedJobFoldersToStorage(savedJobFolders);
  }, [savedJobFolders]);

  useEffect(() => {
    localStorage.setItem('dominica_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem('dominica_sync_records', JSON.stringify(syncRecords));
  }, [syncRecords]);

  useEffect(() => {
    localStorage.setItem('dominica_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('dominica_recruiters', JSON.stringify(recruiters));
    } catch {
      // ignore
    }
  }, [recruiters]);

  useEffect(() => {
    try {
      localStorage.setItem('dominica_current_recruiter_id', currentRecruiterId);
    } catch {
      // ignore
    }
  }, [currentRecruiterId]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dominica_current_user', JSON.stringify(currentUser));
      localStorage.removeItem('dominica_logged_out');
    } else {
      localStorage.removeItem('dominica_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('dominica_admin_logged', isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  useEffect(() => {
    saveAdminActivityLogsToStorage(adminActivityLogs);
  }, [adminActivityLogs]);

  const logAdminActivity = React.useCallback(
    (
      action: string,
      details: string,
      category: AdminActivityCategory = 'Site Settings'
    ): AdminActivityLogEntry => {
      const formattedTime =
        new Date().toISOString().replace('T', ' ').substring(0, 19) + ' AST';
      const newEntry: AdminActivityLogEntry = {
        id: `adm-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action,
        details,
        category,
        timestamp: formattedTime,
        actor: 'info@natureislecareers.com',
      };
      setAdminActivityLogs((prev) => {
        const updated = [newEntry, ...prev].slice(0, 100);
        saveAdminActivityLogsToStorage(updated);
        return updated;
      });

      try {
        if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
          const token =
            adminSessionToken ||
            (typeof sessionStorage !== 'undefined'
              ? sessionStorage.getItem('natureisland_admin_token')
              : null);
          if (token) {
            fetch('/api/admin/audit-logs', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-token': token,
              },
              body: JSON.stringify({ action, details, category }),
            }).catch(() => {});
          }
        }
      } catch {
        // ignore non-browser env
      }

      return newEntry;
    },
    [adminSessionToken]
  );

  const clearAdminActivityLogs = React.useCallback(() => {
    setAdminActivityLogs([]);
    saveAdminActivityLogsToStorage([]);
  }, []);

  const mergeAdminAuditLogs = React.useCallback((serverLogs: AdminActivityLogEntry[]) => {
    if (!Array.isArray(serverLogs) || serverLogs.length === 0) return;
    setAdminActivityLogs((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const newOnes = serverLogs.filter((item) => item && item.id && !existingIds.has(item.id));
      if (newOnes.length === 0) return prev;
      const merged = [...prev, ...newOnes].slice(0, 120);
      saveAdminActivityLogsToStorage(merged);
      return merged;
    });
  }, []);

  const mergeAdminEmailAlerts = React.useCallback((serverAlerts: AdminEmailAlert[]) => {
    if (!Array.isArray(serverAlerts) || serverAlerts.length === 0) return;
    setAdminEmailAlerts((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const newOnes = serverAlerts.filter((item) => item && item.id && !existingIds.has(item.id));
      if (newOnes.length === 0) return prev;
      return [...newOnes, ...prev].slice(0, 120);
    });
  }, []);

  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dominica_admin_email_alerts', JSON.stringify(adminEmailAlerts));
      }
    } catch {
      // ignore
    }
  }, [adminEmailAlerts]);

  const clearAdminEmailAlerts = React.useCallback(() => {
    setAdminEmailAlerts([]);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dominica_admin_email_alerts', JSON.stringify([]));
      }
    } catch {
      // ignore
    }
  }, []);

  const resetAdminIdleTimer = React.useCallback(() => {
    const now = Date.now();
    setLastAdminActivityAt(now);
    try {
      localStorage.setItem(ADMIN_LAST_ACTIVE_STORAGE_KEY, String(now));
    } catch {
      // ignore
    }
  }, []);

  const triggerAdminIdleTimeout = React.useCallback(() => {
    setIsAdminLoggedIn(false);
    setAdminEmail(null);
    setAdminSessionToken(null);
    setActiveRole((prev) => (prev === 'admin' ? 'jobseeker' : prev));
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dominica_admin_logged', 'false');
        localStorage.removeItem('dominica_admin_email');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('natureisland_admin_token');
      }
    } catch {
      // ignore
    }
    setIsAdminSessionExpiredPromptOpen(true);
    logAdminActivity(
      'Admin Session Expired (15m Idle Timeout)',
      'Automatic idle session timeout cleared isAdminLoggedIn state after 15 minutes of inactivity.',
      'Session & Security'
    );
  }, [logAdminActivity]);

  const dismissAdminSessionExpiredPrompt = React.useCallback(() => {
    setIsAdminSessionExpiredPromptOpen(false);
  }, []);

  // Automatic 15-minute idle session timeout monitor when isAdminLoggedIn is true
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    const handleActivity = () => {
      const now = Date.now();
      setLastAdminActivityAt(now);
      try {
        localStorage.setItem(ADMIN_LAST_ACTIVE_STORAGE_KEY, String(now));
      } catch {
        // ignore
      }
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );

    const remainingMs = getRemainingAdminSessionMs(
      lastAdminActivityAt,
      Date.now(),
      ADMIN_IDLE_TIMEOUT_MS
    );

    const timeoutId = window.setTimeout(() => {
      triggerAdminIdleTimeout();
    }, remainingMs);

    return () => {
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, handleActivity)
      );
      window.clearTimeout(timeoutId);
    };
  }, [isAdminLoggedIn, lastAdminActivityAt, triggerAdminIdleTimeout]);

  const currentRecruiter = recruiters.find((r) => r.id === currentRecruiterId) || recruiters[0];

  const getJobById = (id: string) => jobs.find((j) => j.id === id);

  const incrementJobViews = (id: string) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, viewsCount: job.viewsCount + 1 } : job))
    );
  };

  const createSavedFolder = (folderName: string): SavedJobFolder => {
    const trimmed = folderName.trim() || 'Saved Opportunities';
    const existing = savedJobFolders.find(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const newFolder: SavedJobFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      jobIds: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSavedJobFolders((prev) => {
      const next = [...prev, newFolder];
      saveSavedJobFoldersToStorage(next);
      return next;
    });
    return newFolder;
  };

  const deleteSavedFolder = (folderId: string) => {
    setSavedJobFolders((prev) => {
      const next = prev.filter((f) => f.id !== folderId);
      saveSavedJobFoldersToStorage(next);
      return next;
    });
  };

  const renameSavedFolder = (folderId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSavedJobFolders((prev) => {
      const next = prev.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f));
      saveSavedJobFoldersToStorage(next);
      return next;
    });
  };

  const saveJobToFolder = (jobId: string, folderNameOrId: string) => {
    const target = folderNameOrId.trim();
    if (!target) return;

    setSavedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));

    setSavedJobFolders((prev) => {
      const matchIndex = prev.findIndex(
        (f) => f.id === target || f.name.toLowerCase() === target.toLowerCase()
      );
      if (matchIndex >= 0) {
        const folder = prev[matchIndex];
        if (folder.jobIds.includes(jobId)) return prev;
        const next = [...prev];
        next[matchIndex] = { ...folder, jobIds: [...folder.jobIds, jobId] };
        saveSavedJobFoldersToStorage(next);
        return next;
      } else {
        const newFolder: SavedJobFolder = {
          id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: target,
          jobIds: [jobId],
          createdAt: new Date().toISOString().split('T')[0],
        };
        const next = [...prev, newFolder];
        saveSavedJobFoldersToStorage(next);
        return next;
      }
    });
  };

  const removeJobFromFolder = (jobId: string, folderId: string) => {
    setSavedJobFolders((prev) => {
      const next = prev.map((f) =>
        f.id === folderId ? { ...f, jobIds: f.jobIds.filter((id) => id !== jobId) } : f
      );
      saveSavedJobFoldersToStorage(next);
      return next;
    });
  };

  const getJobFolders = (jobId: string): SavedJobFolder[] => {
    return savedJobFolders.filter((f) => f.jobIds.includes(jobId));
  };

  const toggleSaveJob = (id: string, folderName?: string) => {
    if (folderName && folderName.trim()) {
      saveJobToFolder(id, folderName.trim());
      return;
    }
    const isCurrentlySaved = isJobSaved(id);
    if (isCurrentlySaved) {
      setSavedJobIds((prev) => prev.filter((item) => item !== id));
      setSavedJobFolders((folders) => {
        const next = folders.map((f) => ({
          ...f,
          jobIds: f.jobIds.filter((jid) => jid !== id),
        }));
        saveSavedJobFoldersToStorage(next);
        return next;
      });
    } else {
      setSavedJobIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const isJobSaved = (id: string) =>
    savedJobIds.includes(id) || savedJobFolders.some((f) => f.jobIds.includes(id));

  // User registration & authentication
  const registerJobseeker = (data: {
    name: string;
    email: string;
    phone: string;
    parish: Parish;
    careerSector: JobSector;
    skills: string[];
    resumeFileName?: string;
    resumeText?: string;
    password?: string;
    headline?: string;
    bio?: string;
    residencyStatus?: string;
    minSalaryRequirement?: number;
    preferredParish?: Parish;
    preferredSector?: JobSector;
    autoMatchEmailsEnabled?: boolean;
  }) => {
    const cleanEmail = data.email.trim();
    const existing = users.find(
      (u) => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.role === 'jobseeker'
    );
    const newUser: UserAccount = {
      id: existing?.id || `usr-jobseeker-${Date.now()}`,
      email: cleanEmail,
      name: data.name.trim(),
      role: 'jobseeker',
      parish: data.parish,
      phone: data.phone.trim(),
      password: data.password,
      headline: data.headline,
      bio: data.bio,
      residencyStatus: data.residencyStatus || 'Dominican Citizen (Waitukubuli)',
      careerSector: data.careerSector,
      skills: data.skills,
      resumeFileName: data.resumeFileName || 'Dominica_Candidate_Resume.pdf',
      resumeText: data.resumeText ?? existing?.resumeText,
      minSalaryRequirement: data.minSalaryRequirement ?? existing?.minSalaryRequirement,
      preferredParish: data.preferredParish ?? data.parish,
      preferredSector: data.preferredSector ?? data.careerSector,
      autoMatchEmailsEnabled: data.autoMatchEmailsEnabled ?? true,
      createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.email.toLowerCase() !== cleanEmail.toLowerCase());
      const updated = [newUser, ...filtered];
      try {
        localStorage.setItem('dominica_users', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    try {
      localStorage.removeItem('dominica_logged_out');
      localStorage.setItem('dominica_current_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setCurrentUser(newUser);
    setActiveRole('jobseeker');
    syncAuthenticatedUserToFirestore(newUser).catch(() => {});
    return newUser;
  };

  const registerClient = (data: {
    companyName: string;
    name: string;
    email: string;
    phone: string;
    parish: Parish;
    dssRegistrationNo: string;
    industry: JobSector;
    password?: string;
    locality?: string;
    nepPartner?: boolean;
    selectedPlan?: SubscriptionPlan;
  }) => {
    const cleanEmail = data.email.trim();
    const cleanCompany = data.companyName.trim();
    const existingRecruiter = recruiters.find(
      (r) =>
        r.email.toLowerCase() === cleanEmail.toLowerCase() ||
        r.companyName.toLowerCase() === cleanCompany.toLowerCase()
    );
    const recruiterId = existingRecruiter?.id || `rec_${Date.now()}`;
    const newRecruiter: RecruiterAccount = {
      id: recruiterId,
      companyName: cleanCompany,
      parish: data.parish,
      locality: data.locality?.trim() || `${data.parish} Headquarters`,
      industry: data.industry,
      verified: true,
      contactPerson: data.name.trim(),
      phone: data.phone.trim(),
      email: cleanEmail,
      dssRegistrationNo: data.dssRegistrationNo.trim(),
      nepPartner: data.nepPartner ?? true,
    };

    setRecruiters((prev) => {
      const filtered = prev.filter((r) => r.id !== recruiterId);
      const next = [newRecruiter, ...filtered];
      try {
        localStorage.setItem('dominica_recruiters', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setCurrentRecruiterId(recruiterId);

    const existingUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.role === 'client'
    );
    const initialPlanMeta = getMembershipPlanDetails(
      data.selectedPlan || existingUser?.subscription?.plan || 'Standard Local Employer'
    );
    const newUser: UserAccount = {
      id: existingUser?.id || `usr-client-${Date.now()}`,
      email: cleanEmail,
      name: data.name.trim(),
      companyName: cleanCompany,
      role: 'client',
      parish: data.parish,
      phone: data.phone.trim(),
      password: data.password,
      dssRegistrationNo: data.dssRegistrationNo.trim(),
      industry: data.industry,
      locality: newRecruiter.locality,
      recruiterId,
      subscription: data.selectedPlan
        ? {
            plan: initialPlanMeta.plan,
            priceXCD: initialPlanMeta.priceXCD,
            status: 'pending_payment',
            paymentMethod: 'National Bank of Dominica (NBD)',
            transactionRef: `INV-DOM-${Date.now().toString().slice(-6)}`,
            subscribedAt: new Date().toISOString().split('T')[0],
            renewsAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            quotaPostings: initialPlanMeta.quotaPostings,
            remoteWorkEnabled: initialPlanMeta.remoteWorkEnabled,
          }
        : existingUser?.subscription || {
            plan: initialPlanMeta.plan,
            priceXCD: initialPlanMeta.priceXCD,
            status: 'pending_payment',
            paymentMethod: 'National Bank of Dominica (NBD)',
            transactionRef: `INV-DOM-${Date.now().toString().slice(-6)}`,
            subscribedAt: new Date().toISOString().split('T')[0],
            renewsAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            quotaPostings: initialPlanMeta.quotaPostings,
            remoteWorkEnabled: initialPlanMeta.remoteWorkEnabled,
          },
      createdAt: existingUser?.createdAt || new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.email.toLowerCase() !== cleanEmail.toLowerCase());
      const updated = [newUser, ...filtered];
      try {
        localStorage.setItem('dominica_users', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    try {
      localStorage.removeItem('dominica_logged_out');
      localStorage.setItem('dominica_current_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setCurrentUser(newUser);
    setActiveRole('recruiter');
    syncAuthenticatedUserToFirestore(newUser).catch(() => {});
    return newUser;
  };

  const subscribeClientPlan = (
    userId: string,
    plan: SubscriptionPlan,
    paymentMethod: 'National Bank of Dominica (NBD)' | 'Credit/Debit Card (XCD)' | 'Republic Bank / Wire',
    options?: { skipEmail?: boolean; transactionRef?: string }
  ) => {
    const planMeta = getMembershipPlanDetails(plan);
    const price = planMeta.priceXCD;
    const txRef = options?.transactionRef || `TX-DOM-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toISOString().split('T')[0];
    const renewsStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const updatedSub: ClientSubscription = {
      plan,
      priceXCD: price,
      status: 'active',
      paymentMethod,
      transactionRef: txRef,
      subscribedAt: nowStr,
      renewsAt: renewsStr,
      quotaPostings: planMeta.quotaPostings,
      remoteWorkEnabled: planMeta.remoteWorkEnabled,
    };

    const targetUser =
      usersRef.current.find((u) => u.id === userId) ||
      (currentUser?.id === userId ? currentUser : undefined);

    setUsers((prev) => {
      const next = prev.map((u) => (u.id === userId ? { ...u, subscription: updatedSub } : u));
      try {
        localStorage.setItem('dominica_users', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (currentUser && currentUser.id === userId) {
      const updatedCurrentUser = { ...currentUser, subscription: updatedSub };
      setCurrentUser(updatedCurrentUser);
      try {
        localStorage.setItem('dominica_current_user', JSON.stringify(updatedCurrentUser));
      } catch {
        // ignore
      }
    }

    if (!options?.skipEmail) {
      const resolvedEmail = targetUser?.email || currentUser?.email || 'careers@fortyounghotel.com';
      const resolvedName = targetUser?.companyName || targetUser?.name || currentUser?.name || 'Dominican Employer';
      const emailNotif: EmailNotification = {
        id: `notif-sub-${Date.now()}`,
        recipientEmail: resolvedEmail,
        recipientName: resolvedName,
        subject: `Account & Membership Verified: ${plan} Active (Ref ${txRef})`,
        previewText: `Signup & payment verification completed for ${resolvedName}. Selected membership: ${plan} (EC$${price}/month).`,
        bodyHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h2 style="color: #006b4d; margin-top: 0;">Nature Island Careers · Employer Membership Verified</h2>
            <p style="font-size: 14px; color: #334155;">
              Your employer registration and payment verification for the <strong>${plan}</strong> membership tier are now complete.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Selected Membership:</strong> ${plan} (${planMeta.quotaLabel})</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #065f46;"><strong>Amount Paid:</strong> EC$${price.toLocaleString()} XCD</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #065f46;"><strong>Payment Gateway:</strong> ${paymentMethod}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #065f46;"><strong>Transaction Ref:</strong> ${txRef}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #065f46;"><strong>Next Renewal:</strong> ${renewsStr}</p>
            </div>
          </div>
        `,
        type: 'employer_membership_verified',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRead: false,
      };
      dispatchEmail(emailNotif);
    }

    if (paymentMethod === 'Credit/Debit Card (XCD)') {
      sendAdminEmailAlert({
        eventType: 'stripe_payment_finalized',
        subject: `[Admin Stripe Alert] Client Subscription Paid: ${targetUser?.companyName || currentUser?.companyName || currentUser?.name || 'Dominican Employer'} — EC$ ${price.toLocaleString()} (${txRef})`,
        summary: `Client employer subscription (${plan}) settled via card checkout for EC$ ${price.toLocaleString()} XCD.`,
        relatedInvoiceId: txRef,
        amountXCD: price,
        serverPayload: {
          employerName: targetUser?.companyName || currentUser?.companyName || currentUser?.name || 'Dominican Employer',
          planName: plan,
          invoiceId: txRef,
          amountXCD: price,
        },
      });
    }
  };

  const loginUser = (
    email: string,
    password?: string,
    roleFilter?: 'jobseeker' | 'client'
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    let found = users.find((u) => {
      const emailMatches = u.email.toLowerCase() === cleanEmail;
      if (!emailMatches) return false;
      if (roleFilter && u.role !== roleFilter) return false;
      return true;
    });

    // If not in users array yet, check if email matches a RecruiterAccount
    if (!found && (!roleFilter || roleFilter === 'client')) {
      const matchingRecruiter = recruiters.find(
        (r) => r.email.toLowerCase() === cleanEmail
      );
      if (matchingRecruiter) {
        found = {
          id: `usr-client-${matchingRecruiter.id}`,
          email: matchingRecruiter.email,
          name: matchingRecruiter.contactPerson,
          companyName: matchingRecruiter.companyName,
          role: 'client',
          parish: matchingRecruiter.parish,
          phone: matchingRecruiter.phone,
          dssRegistrationNo: matchingRecruiter.dssRegistrationNo,
          industry: matchingRecruiter.industry,
          locality: matchingRecruiter.locality,
          recruiterId: matchingRecruiter.id,
          createdAt: '2026-09-01',
        };
        setUsers((prev) => [found!, ...prev]);
      }
    }

    if (found) {
      // Check password if the user account has a password set and a password was passed
      if (found.password && password !== undefined && password !== '' && found.password !== password) {
        return false;
      }

      try {
        localStorage.removeItem('dominica_logged_out');
        localStorage.setItem('dominica_current_user', JSON.stringify(found));
      } catch {
        // ignore
      }

      setCurrentUser(found);
      if (found.role === 'admin') {
        setIsAdminLoggedIn(true);
        setActiveRole('admin');
      } else if (found.role === 'client') {
        setActiveRole('recruiter');
        const matchingRec = recruiters.find(
          (r) =>
            r.id === found?.recruiterId ||
            r.email.toLowerCase() === found?.email.toLowerCase() ||
            (found?.companyName &&
              r.companyName.toLowerCase() === found.companyName.toLowerCase())
        );
        if (matchingRec) {
          setCurrentRecruiterId(matchingRec.id);
        }
      } else {
        setActiveRole('jobseeker');
      }
      return true;
    }
    return false;
  };

  const authenticateWithSocialProvider = async (
    providerType: SocialAuthProviderType,
    preferredRole: 'jobseeker' | 'client',
    extraFields?: {
      companyName?: string;
      dssRegistrationNo?: string;
      parish?: Parish;
      phone?: string;
      careerSector?: JobSector;
      skills?: string[];
    }
  ): Promise<UserAccount> => {
    const account =
      providerType === 'github'
        ? await signInWithGithubPopup(preferredRole, extraFields)
        : await signInWithGooglePopup(preferredRole, extraFields);

    if (account.role === 'client') {
      const recId = account.recruiterId || `rec_${account.id.slice(0, 8)}`;
      const newRec: RecruiterAccount = {
        id: recId,
        companyName: account.companyName || `${account.name} Organization`,
        parish: account.parish || 'St. George',
        locality: `${account.parish || 'St. George'} Headquarters`,
        industry: account.careerSector || 'Eco-Tourism & Hospitality',
        verified: true,
        contactPerson: account.name,
        phone: account.phone || '+1 (767) 275-0100',
        email: account.email,
        dssRegistrationNo: account.dssRegistrationNo || 'DSS-DOM-88410',
        nepPartner: true,
      };
      setRecruiters((prev) => {
        const filtered = prev.filter(
          (r) => r.id !== recId && r.email.toLowerCase() !== account.email.toLowerCase()
        );
        const next = [newRec, ...filtered];
        try {
          localStorage.setItem('dominica_recruiters', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      setCurrentRecruiterId(recId);
      setActiveRole('recruiter');
    } else {
      setActiveRole('jobseeker');
    }

    setUsers((prev) => {
      const filtered = prev.filter(
        (u) => u.id !== account.id && u.email.toLowerCase() !== account.email.toLowerCase()
      );
      const next = [account, ...filtered];
      try {
        localStorage.setItem('dominica_users', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    try {
      localStorage.removeItem('dominica_logged_out');
      localStorage.setItem('dominica_current_user', JSON.stringify(account));
    } catch {
      // ignore
    }
    setCurrentUser(account);
    return account;
  };

  const authenticateWithGoogle = async (
    preferredRole: 'jobseeker' | 'client',
    extraFields?: {
      companyName?: string;
      dssRegistrationNo?: string;
      parish?: Parish;
      phone?: string;
      careerSector?: JobSector;
      skills?: string[];
    }
  ): Promise<UserAccount> => {
    return authenticateWithSocialProvider('google', preferredRole, extraFields);
  };

  const authenticateWithGithub = async (
    preferredRole: 'jobseeker' | 'client',
    extraFields?: {
      companyName?: string;
      dssRegistrationNo?: string;
      parish?: Parish;
      phone?: string;
      careerSector?: JobSector;
      skills?: string[];
    }
  ): Promise<UserAccount> => {
    return authenticateWithSocialProvider('github', preferredRole, extraFields);
  };

  const logoutUser = () => {
    signOutFromFirebase().catch(() => {});
    try {
      localStorage.setItem('dominica_logged_out', 'true');
      localStorage.removeItem('dominica_current_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setActiveRole('jobseeker');
  };

  const updateCurrentUser = (updatedFields: Partial<UserAccount>) => {
    const base = currentUser || {
      id: `user-${Date.now()}`,
      name: 'Dominica Job Seeker',
      email: 'jobseeker@waitukubuli.dm',
      role: 'jobseeker' as const,
      parish: 'St. George' as Parish,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated: UserAccount = { ...base, ...updatedFields };
    setCurrentUser(updated);
    localStorage.setItem('dominica_current_user', JSON.stringify(updated));
    setUsers((prevUsers) => {
      const exists = prevUsers.some((u) => u.id === updated.id);
      const nextUsers = exists
        ? prevUsers.map((u) => (u.id === updated.id ? updated : u))
        : [updated, ...prevUsers];
      localStorage.setItem('dominica_users', JSON.stringify(nextUsers));
      return nextUsers;
    });
  };

  // Password Recovery via Email Verification
  const [passwordResetCodes, setPasswordResetCodes] = useState<
    Record<string, { code: string; expiresAt: number }>
  >(() => {
    try {
      const saved = localStorage.getItem('dominica_password_reset_codes');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const requestPasswordReset = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid registered email address.',
      };
    }

    let targetUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!targetUser) {
      const matchingRecruiter = recruiters.find(
        (r) => r.email.toLowerCase() === cleanEmail
      );
      if (matchingRecruiter) {
        targetUser = {
          id: `usr-client-${matchingRecruiter.id}`,
          email: matchingRecruiter.email,
          name: matchingRecruiter.contactPerson,
          companyName: matchingRecruiter.companyName,
          role: 'client',
          parish: matchingRecruiter.parish,
          phone: matchingRecruiter.phone,
          dssRegistrationNo: matchingRecruiter.dssRegistrationNo,
          industry: matchingRecruiter.industry,
          locality: matchingRecruiter.locality,
          recruiterId: matchingRecruiter.id,
          createdAt: '2026-09-01',
        };
        setUsers((prev) => {
          const next = [targetUser!, ...prev];
          try {
            localStorage.setItem('dominica_users', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
    }

    if (!targetUser) {
      return {
        success: false,
        error:
          'No registered Candidate or Employer account was found for that email address.',
      };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const oobCode = `oob_${verificationCode}_${Date.now().toString(36)}`;
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://natureislecareers.com';
    const resetLink = `${origin}/?mode=resetPassword&oobCode=${encodeURIComponent(
      oobCode
    )}&email=${encodeURIComponent(cleanEmail)}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    setPasswordResetCodes((prev) => {
      const updated = {
        ...prev,
        [cleanEmail]: { code: verificationCode, expiresAt },
      };
      try {
        localStorage.setItem('dominica_password_reset_codes', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Trigger Firebase Auth password reset email link dispatch
    sendFirebasePasswordReset(cleanEmail, verificationCode).catch(() => {});

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const resetEmailNotif: EmailNotification = {
      id: `notif-pwd-reset-${Date.now()}`,
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      subject: `Password Reset Link & Verification Code (${verificationCode}) · Nature Island Careers`,
      previewText: `Click the secure Firebase password reset link or enter verification code ${verificationCode} to reset your ${
        targetUser.role === 'client' ? 'Employer' : 'Candidate'
      } account password.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #006b4d; margin-top: 0;">Nature Island Careers · Password Reset & Email Verification</h2>
          <p style="font-size: 14px; color: #334155;">
            Hello <strong>${targetUser.name}</strong>, we received a request to recover access to your ${
        targetUser.role === 'client'
          ? `Employer (${targetUser.companyName || 'Recruiter'})`
          : 'Candidate'
      } account.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 14px 0;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #0f172a;">Option 1: Secure Password Reset Link (Firebase Auth)</p>
            <p style="margin: 0; font-size: 12px; font-family: monospace; word-break: break-all; color: #047857;">${resetLink}</p>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #065f46; text-transform: uppercase; letter-spacing: 0.08em;">Option 2: 6-Digit Email Verification Code</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; font-family: monospace; letter-spacing: 0.2em; color: #064e3b;">${verificationCode}</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #047857;">Expires in 15 minutes</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            Use either the Firebase reset link or the 6-digit verification code in the Password Recovery window to verify your email and set a new password.
          </p>
        </div>
      `,
      type: 'status_update',
      timestamp: nowTimestamp,
      isRead: false,
    };
    dispatchEmail(resetEmailNotif);

    return {
      success: true,
      code: verificationCode,
      resetLink,
      oobCode,
      accountName: targetUser.name,
      accountRole: targetUser.role,
    };
  };

  const confirmPasswordReset = (email: string, code: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!cleanCode || cleanCode.length < 6) {
      return {
        success: false,
        error: 'Please enter the 6-digit verification code sent to your email.',
      };
    }
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters long.',
      };
    }

    const storedRecord = passwordResetCodes[cleanEmail];
    if (!storedRecord) {
      return {
        success: false,
        error: 'No active verification code found for this email. Please request a new code.',
      };
    }
    if (Date.now() > storedRecord.expiresAt) {
      return {
        success: false,
        error: 'Your verification code has expired. Please request a new verification code.',
      };
    }
    if (storedRecord.code !== cleanCode) {
      return {
        success: false,
        error: 'Invalid verification code. Please check the 6-digit code sent to your email and try again.',
      };
    }

    const existingTarget = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!existingTarget) {
      return {
        success: false,
        error: 'Account could not be located for password update.',
      };
    }

    const updatedUser: UserAccount = {
      ...existingTarget,
      password: newPassword,
    };

    setUsers((prev) => {
      const next = prev.map((u) =>
        u.email.toLowerCase() === cleanEmail ? updatedUser : u
      );
      try {
        localStorage.setItem('dominica_users', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    if (currentUser && currentUser.email.toLowerCase() === cleanEmail) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('dominica_current_user', JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
    }

    // Clear the used reset code
    setPasswordResetCodes((prev) => {
      const next = { ...prev };
      delete next[cleanEmail];
      try {
        localStorage.setItem('dominica_password_reset_codes', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const confirmNotif: EmailNotification = {
      id: `notif-pwd-confirmed-${Date.now()}`,
      recipientEmail: updatedUser.email,
      recipientName: updatedUser.name,
      subject: `Security Notice: Your Password Was Reset · Nature Island Careers`,
      previewText: `The password for ${updatedUser.email} was successfully updated via email verification.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #006b4d; margin-top: 0;">Password Successfully Updated</h2>
          <p style="font-size: 14px; color: #334155;">
            Hello <strong>${updatedUser.name}</strong>, your Nature Island Careers account password for <strong>${updatedUser.email}</strong> has been securely reset following email verification.
          </p>
        </div>
      `,
      type: 'status_update',
      timestamp: nowTimestamp,
      isRead: false,
    };
    dispatchEmail(confirmNotif);

    return {
      success: true,
      user: updatedUser,
    };
  };

  const adminLogin = (email: string, _pass: string, serverToken?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    // Single allowed admin account: info@natureislecareers.com
    if (cleanEmail !== 'info@natureislecareers.com') {
      return false;
    }

    const hasServerToken = Boolean(serverToken && serverToken.trim().length > 0);
    if (!hasServerToken) {
      return false;
    }

    const sessionToken = serverToken!.trim();

    setIsAdminLoggedIn(true);
    setAdminEmail('info@natureislecareers.com');
    setAdminSessionToken(sessionToken);
    setActiveRole('admin');
    setIsAdminSessionExpiredPromptOpen(false);
    resetAdminIdleTimer();

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dominica_admin_logged', 'true');
        localStorage.setItem('dominica_admin_email', 'info@natureislecareers.com');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('natureisland_admin_token', sessionToken);
      }
    } catch {
      // ignore storage errors
    }

    logAdminActivity(
      'Admin Console Authenticated (Single Login)',
      `Single-session admin login verified for info@natureislecareers.com (15m idle guard active).`,
      'Session & Security'
    );
    return true;
  };

  const adminLogout = () => {
    const tokenToRevoke = adminSessionToken;
    setIsAdminLoggedIn(false);
    setAdminEmail(null);
    setAdminSessionToken(null);
    setActiveRole('jobseeker');
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dominica_admin_logged', 'false');
        localStorage.removeItem('dominica_admin_email');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('natureisland_admin_token');
      }
      if (typeof fetch !== 'undefined' && typeof window !== 'undefined' && tokenToRevoke) {
        fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'x-admin-token': tokenToRevoke },
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
    logAdminActivity(
      'Admin Session Signed Out',
      'Administrator manually signed out and terminated single-login session.',
      'Session & Security'
    );
  };

  const updateRecruiter = (id: string, updates: Partial<RecruiterAccount>) => {
    let targetName = id;
    setRecruiters((prev) =>
      prev.map((rec) => {
        if (rec.id === id) {
          targetName = rec.companyName;
          return { ...rec, ...updates };
        }
        return rec;
      })
    );

    const isApprovalChange =
      typeof updates.verified === 'boolean' || typeof updates.nepPartner === 'boolean';
    const actionLabel =
      updates.verified === true
        ? 'Employer Account Approved'
        : updates.verified === false
        ? 'Employer Verification Revoked'
        : updates.nepPartner === true
        ? 'NEP Partner Account Approved'
        : updates.nepPartner === false
        ? 'NEP Partner Status Removed'
        : 'Employer Account Updated';

    logAdminActivity(
      actionLabel,
      `${actionLabel} for ${targetName} (${Object.keys(updates).join(', ')}).`,
      isApprovalChange ? 'Account Approval' : 'Site Settings'
    );
  };

  const getSiteContactEmail = (): string => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('natureisland_site_settings') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.contactEmail) return parsed.contactEmail;
      }
    } catch {
      // ignore
    }
    return 'info@natureislecareers.com';
  };

  const notifyEmployerPaymentSuccess = (
    invoice: EmployerInvoice,
    recipientEmail?: string,
    portalUsed: string = 'Stripe Card Checkout'
  ): EmailNotification => {
    const matchedRecruiter = recruiters.find(
      (r) =>
        r.id === invoice.recruiterId ||
        r.companyName.toLowerCase() === invoice.companyName.toLowerCase()
    );
    const matchedUser = usersRef.current.find(
      (u) =>
        u.role === 'client' &&
        (u.recruiterId === invoice.recruiterId ||
          (recipientEmail && u.email.toLowerCase() === recipientEmail.toLowerCase()) ||
          (invoice.companyName && u.companyName?.toLowerCase() === invoice.companyName.toLowerCase()))
    );
    const targetEmail =
      recipientEmail?.trim() ||
      invoice.recipientEmail?.trim() ||
      matchedUser?.email ||
      matchedRecruiter?.email ||
      getSiteContactEmail();
    const contactPerson =
      invoice.contactPerson ||
      matchedUser?.name ||
      matchedRecruiter?.contactPerson ||
      invoice.companyName;
    const dssReg =
      invoice.dssRegistrationNo ||
      matchedUser?.dssRegistrationNo ||
      matchedRecruiter?.dssRegistrationNo ||
      'DSS-DOM-VERIFIED';
    const parish =
      invoice.parish || matchedUser?.parish || matchedRecruiter?.parish || 'St. George';
    const planMeta = getMembershipPlanDetails(invoice.plan);
    const quotaPostings = invoice.quotaPostings ?? planMeta.quotaPostings;
    const remoteEnabled = invoice.remoteWorkEnabled ?? planMeta.remoteWorkEnabled;
    const membershipFeatures =
      invoice.membershipFeatures && invoice.membershipFeatures.length > 0
        ? invoice.membershipFeatures
        : planMeta.features;
    const renewsAt =
      invoice.renewsAt ||
      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const sentAtIso = new Date().toISOString();
    const formattedTime = sentAtIso.replace('T', ' ').substring(0, 16);

    const paymentReceiptNotif: EmailNotification = {
      id: `notif-emp-verified-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientEmail: targetEmail,
      recipientName: contactPerson,
      subject: `Employer Signup & Payment Verified: ${invoice.plan} Active — Invoice ${invoice.invoiceNumber}`,
      previewText: `Registration & payment verification completed for ${invoice.companyName}. Selected membership: ${invoice.plan} (EC$ ${invoice.amountXCD.toLocaleString()} · ${quotaPostings >= 999 ? 'Unlimited vacancies' : `${quotaPostings} active vacancies`} · Invoice ${invoice.invoiceNumber}).`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 10px;">
          <div style="border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #065f46; margin: 0;">Nature Island Careers · Employer Account &amp; Payment Verified</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Membership Confirmation &amp; Tax Invoice (${portalUsed})</p>
          </div>
          <p style="font-size: 14px; color: #1e293b;">Dear ${contactPerson},</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Your employer signup and payment verification for <strong>${invoice.companyName}</strong> have been completed. Your selected membership tier is now active across the Commonwealth of Dominica.
          </p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 0; color: #0f172a;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Selected Membership:</strong> ${invoice.plan} (${invoice.billingInterval === 'monthly' ? 'Monthly Recurring' : '30-Day Pass'})</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Posting Quota:</strong> ${quotaPostings >= 999 ? 'Unlimited Active Vacancies' : `${quotaPostings} Active Vacancies`} · Remote/WIN: ${remoteEnabled ? 'Enabled' : 'Standard Local'}</p>
            <p style="margin: 4px 0 0 0; color: #065f46;"><strong>Amount Verified &amp; Paid:</strong> EC$ ${invoice.amountXCD.toLocaleString()} XCD (~$${invoice.amountUSD.toFixed(2)} USD)</p>
            <p style="margin: 4px 0 0 0; color: #334155;"><strong>DSS Registration:</strong> ${dssReg} · <strong>Parish:</strong> ${parish}</p>
            <p style="margin: 4px 0 0 0; color: #334155;"><strong>Payment Channel:</strong> ${invoice.paymentMethod}</p>
            <p style="margin: 4px 0 0 0; color: #334155;"><strong>Verification Ref:</strong> ${invoice.paymentIntentId || 'Verified'}</p>
            <p style="margin: 4px 0 0 0; color: #334155;"><strong>Next Renewal Date:</strong> ${renewsAt}</p>
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 14px;">
            <strong>Included Membership Entitlements:</strong>
            <ul style="margin: 6px 0 0 18px; padding: 0;">
              ${membershipFeatures.map((feat) => `<li>${feat}</li>`).join('')}
            </ul>
          </div>
          <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            VAT / DSS Code: DOM-EMP-TAX-77491 · Dispatched automatically via Nature Island Careers Employer Billing · info@natureislecareers.com
          </p>
        </div>
      `,
      type: 'employer_membership_verified',
      timestamp: formattedTime,
      isRead: false,
      relatedInvoiceId: invoice.invoiceNumber,
    };

    dispatchEmail(paymentReceiptNotif);

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id
          ? {
              ...inv,
              recipientEmail: targetEmail,
              notifiedAt: sentAtIso,
              contactPerson,
              dssRegistrationNo: dssReg,
              parish,
              quotaPostings,
              remoteWorkEnabled: remoteEnabled,
              membershipFeatures,
              renewsAt,
              signupVerifiedAt: sentAtIso,
              verificationChannel: portalUsed,
            }
          : inv
      )
    );

    logAdminActivity(
      'Employer Signup & Payment Notification Sent',
      `Dispatched verification notification & membership invoice (${invoice.plan}) to ${targetEmail} (${invoice.companyName}) for ${invoice.invoiceNumber} — EC$${invoice.amountXCD}.`,
      'Payment Update'
    );

    try {
      if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
        fetch('/api/stripe/notify-employer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employerName: invoice.companyName,
            recipientEmail: targetEmail,
            planName: invoice.plan,
            membershipTier: invoice.plan,
            amountXCD: invoice.amountXCD,
            amountUSD: invoice.amountUSD,
            invoiceId: invoice.invoiceNumber,
            paymentIntentId: invoice.paymentIntentId,
            portalUsed,
            signupVerified: true,
            dssRegistrationNo: dssReg,
            parish,
            quotaPostings,
            renewsAt,
            billingInterval: invoice.billingInterval,
          }),
        }).catch(() => {});
      }
    } catch {
      // ignore non-browser test environments
    }

    return paymentReceiptNotif;
  };

  const addInvoice = (invoiceData: Omit<EmployerInvoice, 'id'>) => {
    const matchedRecruiter = recruiters.find(
      (r) =>
        r.id === invoiceData.recruiterId ||
        r.companyName.toLowerCase() === invoiceData.companyName.toLowerCase()
    );
    const matchedUser = usersRef.current.find(
      (u) =>
        u.role === 'client' &&
        (u.recruiterId === invoiceData.recruiterId ||
          (invoiceData.recipientEmail &&
            u.email.toLowerCase() === invoiceData.recipientEmail.toLowerCase()) ||
          u.companyName?.toLowerCase() === invoiceData.companyName.toLowerCase())
    );
    const resolvedRecipient =
      invoiceData.recipientEmail ||
      matchedUser?.email ||
      matchedRecruiter?.email ||
      getSiteContactEmail();
    const nowIso = new Date().toISOString();
    const planMeta = getMembershipPlanDetails(invoiceData.plan);
    const defaultRenewsAt =
      invoiceData.renewsAt ||
      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const newInvoice: EmployerInvoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      recipientEmail: resolvedRecipient,
      contactPerson:
        invoiceData.contactPerson ||
        matchedUser?.name ||
        matchedRecruiter?.contactPerson ||
        invoiceData.companyName,
      dssRegistrationNo:
        invoiceData.dssRegistrationNo ||
        matchedUser?.dssRegistrationNo ||
        matchedRecruiter?.dssRegistrationNo ||
        'DSS-DOM-VERIFIED',
      parish:
        invoiceData.parish || matchedUser?.parish || matchedRecruiter?.parish || 'St. George',
      quotaPostings: invoiceData.quotaPostings ?? planMeta.quotaPostings,
      remoteWorkEnabled: invoiceData.remoteWorkEnabled ?? planMeta.remoteWorkEnabled,
      membershipFeatures:
        invoiceData.membershipFeatures && invoiceData.membershipFeatures.length > 0
          ? invoiceData.membershipFeatures
          : planMeta.features,
      renewsAt: defaultRenewsAt,
      notifiedAt: invoiceData.status === 'Paid' ? nowIso : undefined,
      signupVerifiedAt: invoiceData.status === 'Paid' ? nowIso : undefined,
      verificationChannel:
        invoiceData.verificationChannel || invoiceData.paymentMethod || 'Stripe Card Checkout',
      paymentIntentId:
        invoiceData.paymentIntentId ||
        `pi_live_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}XCD`,
      timestamp:
        invoiceData.timestamp ||
        nowIso.replace('T', ' ').substring(0, 19) + ' AST',
      currency: invoiceData.currency || 'XCD',
      stripeFeeXCD:
        invoiceData.stripeFeeXCD ||
        Number(((invoiceData.amountXCD * 0.029) + 0.81).toFixed(2)),
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    logAdminActivity(
      'Payment Update: Employer Invoice Generated',
      `Billed ${newInvoice.companyName} EC$${newInvoice.amountXCD} (${newInvoice.plan} · ${newInvoice.invoiceNumber}).`,
      'Payment Update'
    );

    if (newInvoice.status === 'Paid') {
      notifyEmployerPaymentSuccess(
        newInvoice,
        resolvedRecipient,
        newInvoice.paymentMethod || 'Stripe Card Checkout'
      );

      // Alert info@natureislecareers.com whenever a payment is finalized via Stripe
      const isStripeTransaction =
        (newInvoice.paymentMethod || '').toLowerCase().includes('stripe') ||
        (newInvoice.paymentMethod || '').toLowerCase().includes('card') ||
        (newInvoice.paymentIntentId || '').startsWith('pi_');

      if (isStripeTransaction) {
        sendAdminEmailAlert({
          eventType: 'stripe_payment_finalized',
          subject: `[Admin Stripe Alert] Payment Finalized: ${newInvoice.companyName} — EC$ ${newInvoice.amountXCD.toLocaleString()} (${newInvoice.invoiceNumber})`,
          summary: `Stripe payment finalized for ${newInvoice.companyName} (${newInvoice.plan} · ${newInvoice.billingInterval}): EC$ ${newInvoice.amountXCD.toLocaleString()} (~$${newInvoice.amountUSD.toLocaleString()} USD).`,
          relatedInvoiceId: newInvoice.invoiceNumber,
          amountXCD: newInvoice.amountXCD,
          syncToServer: false,
        });
      }
    }

    return newInvoice;
  };

  const notifySubscriptionExpired = (employerName: string, plan: string, expiryDate?: string) => {
    const siteContactEmail = getSiteContactEmail();
    const dateStr = expiryDate || new Date().toISOString().split('T')[0];
    const emailNotif: EmailNotification = {
      id: `notif-site-subexp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientEmail: siteContactEmail,
      recipientName: 'Nature Island Careers Operations Desk',
      subject: `[Subscription Expiry Alert] Employer Subscription Expired: ${employerName}`,
      previewText: `Employer ${employerName}'s ${plan} subscription has expired on ${dateStr}. Notice delivered to site contact.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid #b91c1c; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #b91c1c; margin: 0;">Subscription Expiry Alert · Nature Island Careers</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Automatic Background Service Notice to ${siteContactEmail}</p>
          </div>
          <p style="font-size: 14px; color: #1e293b;">The following employer subscription has expired or lapsed:</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;"><strong>Employer:</strong> ${employerName}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Plan:</strong> ${plan}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Expiration Date:</strong> ${dateStr}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Action Required:</strong> Contact employer regarding subscription renewal options.</p>
          </div>
          <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            Dominica Labour Exchange Automated Background Service · Delivered to ${siteContactEmail}
          </p>
        </div>
      `,
      type: 'status_update',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    dispatchEmail(emailNotif);
  };

  const updateStripeSettings = (updates: Partial<StripeSettings>) => {
    const next = { ...stripeSettings, ...updates };
    setStripeSettings(next);
    logAdminActivity(
      'Payment Update: Stripe Gateway Configuration',
      `Updated Stripe mode (${next.mode.toUpperCase()}), peg (${next.currencyPeg} XCD/USD), and discount (${next.monthlyDiscountPercent}%).`,
      'Payment Update'
    );
  };

  const toggleRecruiterAutoRenew = (recruiterId: string, enabled: boolean) => {
    setStripeSettings((prev) => ({ ...prev, autoRenewEnabled: enabled }));
    const rec = recruiters.find((r) => r.id === recruiterId) || currentRecruiter;
    const notif: EmailNotification = {
      id: `notif-autorenew-${Date.now()}`,
      recipientEmail: rec.email,
      recipientName: rec.contactPerson || rec.companyName,
      subject: `Stripe Auto-Renewal Updated: ${enabled ? 'ENABLED' : 'PAUSED'}`,
      previewText: `Monthly recurring Stripe billing status updated for ${rec.companyName}.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h3 style="color: #065f46; margin-top: 0;">Nature Island Careers · Subscription Management</h3>
          <p style="font-size: 14px; color: #334155;">
            Monthly recurring Stripe billing is now <strong>${enabled ? 'ACTIVE' : 'PAUSED'}</strong> for ${rec.companyName}.
          </p>
          <p style="font-size: 13px; color: #64748b;">
            When active, your job posting quota automatically refreshes every 30 days without interruption.
          </p>
        </div>
      `,
      type: 'status_update',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    dispatchEmail(notif);
  };

  const sendRecruiterReminders = (contactEmail: string = 'info@natureislecareers.com') => {
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 16);
    let sentCount = 0;
    const messages: string[] = [];

    recruiters.forEach((rec) => {
      const recJobs = jobs.filter(
        (j) => j.recruiterId === rec.id || j.company.toLowerCase() === rec.companyName.toLowerCase()
      );
      const pendingApplicants = applications.filter(
        (a) => recJobs.some((j) => j.id === a.jobId) && a.status === 'Applied'
      );

      const notifSub: EmailNotification = {
        id: `notif-reminder-${rec.id}-${Date.now()}`,
        recipientEmail: rec.email,
        recipientName: rec.contactPerson || rec.companyName,
        subject: `[Automated Reminder] Pending Postings & Subscription Renewal · ${rec.companyName}`,
        previewText: `Upcoming monthly renewal notice and review of ${recJobs.length} active listings from Nature Island Careers.`,
        bodyHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #006b4d; margin: 0;">Nature Island Careers · Employer Alert</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Recruiter Reminder Service (${contactEmail})</p>
            </div>
            <p style="font-size: 14px; color: #1e293b;">Dear ${rec.contactPerson || rec.companyName},</p>
            <p style="font-size: 13px; color: #334155; line-height: 1.5;">
              This is a scheduled reminder regarding your organization's recruitment postings and subscription renewal on Dominica's official job exchange:
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin: 16px 0; font-size: 13px;">
              <p style="margin: 0; color: #0f172a;"><strong>Employer Organization:</strong> ${rec.companyName} (${rec.locality})</p>
              <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Active Published Listings:</strong> ${recJobs.length} vacancies</p>
              <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Pending Unscreened Applicants:</strong> ${pendingApplicants.length} candidate dossiers awaiting review</p>
              <p style="margin: 4px 0 0 0; color: #065f46;"><strong>Stripe Monthly Subscription:</strong> Auto-renew active (EC$ 350 / month). Billing method: Stripe Card on file.</p>
            </div>
            <p style="font-size: 13px; color: #475569;">
              To approve pending postings, review candidate dossiers, or update payment settings, please log into your Recruiter Command Center. Inquiries may be directed to <strong>${contactEmail}</strong>.
            </p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
              Commonwealth of Dominica National Labour Exchange · Sent via ${contactEmail}
            </p>
          </div>
        `,
        type: 'job_alert',
        timestamp: nowStr,
        isRead: false,
      };

      dispatchEmail(notifSub);
      sentCount++;
      messages.push(`Reminder dispatched to ${rec.companyName} (${rec.email})`);
    });

    return { sentCount, messages };
  };

  const myApplications = applications.filter(
    (app) => app.applicantEmail.toLowerCase() === (currentUser?.email || 'maxblanc10468@gmail.com').toLowerCase()
  );

  const withdrawApplication = (appId: string) => {
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            status: 'Archived',
            timeline: [
              ...app.timeline,
              { date: nowTimestamp, action: 'Application Withdrawn', note: 'Candidate voluntarily withdrew application.' },
            ],
          };
        }
        return app;
      })
    );
  };

  const createRemoteAssignment = (data: {
    title: string;
    sector: JobSector;
    projectDuration: string;
    minSalary: number;
    maxSalary: number;
    requiredSkills: string[];
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
    applicationDeadline: string;
  }): boolean => {
    const clientUser = currentUser?.role === 'client' ? currentUser : users.find((u) => u.role === 'client' && u.subscription?.status === 'active');
    const isSubscribed = clientUser?.subscription?.status === 'active';

    if (!isSubscribed) {
      return false;
    }

    createJob({
      title: data.title,
      company: clientUser?.companyName || currentRecruiter.companyName,
      parish: 'Island-wide / Remote',
      locality: 'Remote across all 10 parishes of Dominica',
      sector: data.sector,
      employmentType: 'Contract',
      workModel: 'Remote',
      minSalary: data.minSalary,
      maxSalary: data.maxSalary,
      salaryPeriod: 'month',
      isNepApproved: false,
      featured: true,
      isRemoteAssignment: true,
      projectDuration: data.projectDuration,
      requiredSkills: data.requiredSkills,
      description: data.description,
      responsibilities: data.responsibilities,
      requirements: data.requirements,
      benefits: data.benefits,
      screeningQuestions: [
        {
          id: 'q_remote_1',
          question: 'Do you have high-speed broadband connection and a remote workstation in Dominica?',
          type: 'yes_no',
          required: true,
        },
      ],
      contactEmail: clientUser?.email || currentRecruiter.email,
      applicationDeadline: data.applicationDeadline,
      recruiterId: currentRecruiter.id,
    });

    return true;
  };

  // Dispatch email helper
  const dispatchEmail = React.useCallback((notification: EmailNotification) => {
    setNotifications((prev) => [notification, ...prev]);
    setLatestDispatchedEmail(notification);
  }, []);

  const dismissLatestEmail = React.useCallback(() => {
    setLatestDispatchedEmail(null);
  }, []);

  const sendAdminEmailAlert = React.useCallback(
    (params: {
      eventType: 'new_job_posting' | 'stripe_payment_finalized';
      subject: string;
      summary: string;
      bodyHtml?: string;
      relatedJobId?: string;
      relatedInvoiceId?: string;
      amountXCD?: number;
      syncToServer?: boolean;
      serverPayload?: Record<string, unknown>;
    }): AdminEmailAlert => {
      const adminRecipient = 'info@natureislecareers.com' as const;
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const emailRecord: EmailNotification = {
        id: `notif-adm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        recipientEmail: adminRecipient,
        recipientName: 'Nature Island Careers Admin',
        subject: params.subject,
        previewText: params.summary,
        bodyHtml:
          params.bodyHtml ||
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #006b4d; margin: 0;">Nature Island Careers · Admin Portal Alert</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Automated Alert Delivered to ${adminRecipient}</p>
            </div>
            <p style="font-size: 14px; font-weight: bold; color: #0f172a;">${params.subject}</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">${params.summary}</p>
            <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 16px;">
              Event Type: ${params.eventType} · Timestamp: ${nowTimestamp} AST
            </p>
          </div>
        `,
        type: 'status_update',
        timestamp: nowTimestamp,
        isRead: false,
        relatedJobId: params.relatedJobId,
      };

      dispatchEmail(emailRecord);

      const alertEntry: AdminEmailAlert = {
        id: `adm-email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        eventType: params.eventType,
        recipientEmail: adminRecipient,
        subject: params.subject,
        summary: params.summary,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' AST',
        status: 'sent',
        relatedJobId: params.relatedJobId,
        relatedInvoiceId: params.relatedInvoiceId,
        amountXCD: params.amountXCD,
      };

      setAdminEmailAlerts((prev) => [alertEntry, ...prev].slice(0, 100));

      logAdminActivity(
        params.eventType === 'stripe_payment_finalized'
          ? 'Admin Email Alert Sent (Stripe Finalized)'
          : 'Admin Email Alert Sent (New Job Posting)',
        `Dispatched automated alert to ${adminRecipient}: ${params.subject}`,
        'Admin Alerts'
      );

      if (params.syncToServer !== false) {
        try {
          if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
            const endpoint =
              params.eventType === 'stripe_payment_finalized'
                ? '/api/admin/notify-stripe-payment'
                : '/api/admin/notify-new-job';
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params.serverPayload || { title: params.subject, summary: params.summary }),
            }).catch(() => {});
          }
        } catch {
          // ignore non-browser env
        }
      }

      return alertEntry;
    },
    [dispatchEmail, logAdminActivity]
  );

  // Automated Job Matching Engine (Proactive email to registered jobseekers)
  const [automatedJobMatches, setAutomatedJobMatches] = useState<AutomatedJobMatchRecord[]>([]);
  const usersRef = React.useRef<UserAccount[]>(users);
  usersRef.current = users;
  const alertsRef = React.useRef<JobAlertSubscription[]>(alerts);
  alertsRef.current = alerts;
  const currentUserRef = React.useRef<UserAccount | null>(currentUser);
  currentUserRef.current = currentUser;
  const knownJobIdsRef = React.useRef<Set<string>>(new Set(jobs.map((j) => j.id)));
  const notifiedJobseekerMatchesRef = React.useRef<Set<string>>(
    (() => {
      try {
        const raw =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem(AUTO_JOB_MATCHES_STORAGE_KEY)
            : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return new Set<string>(parsed.filter((item): item is string => typeof item === 'string'));
          }
        }
      } catch {
        // ignore
      }
      return new Set<string>();
    })()
  );

  const runAutomatedJobMatchingForJob = React.useCallback(
    (newJob: JobListing): AutomatedJobMatchRecord[] => {
      const newlyMatchedRecords: AutomatedJobMatchRecord[] = [];
      const currentUsers = usersRef.current;
      const currentAlerts = alertsRef.current;

      currentUsers.forEach((candidate) => {
        if (candidate.role !== 'jobseeker') return;
        const dedupKey = `${candidate.email.toLowerCase()}:${newJob.id}`;
        if (notifiedJobseekerMatchesRef.current.has(dedupKey)) return;

        const evaluation = evaluateJobMatchForJobseeker(newJob, candidate, currentAlerts);
        if (!evaluation.matched) return;

        notifiedJobseekerMatchesRef.current.add(dedupKey);
        const emailNotif = buildAutomatedJobMatchEmail(newJob, candidate, evaluation.reasons);
        dispatchEmail(emailNotif);

        if (
          currentUserRef.current &&
          currentUserRef.current.email.toLowerCase() === candidate.email.toLowerCase()
        ) {
          notifyNewJobMatch(
            newJob.title,
            newJob.company,
            newJob.parish,
            candidate.preferredSector || candidate.careerSector || newJob.sector
          );
        }

        newlyMatchedRecords.push({
          id: `automatch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          jobId: newJob.id,
          jobTitle: newJob.title,
          matchedAt: new Date().toISOString(),
          reasons: evaluation.reasons,
        });
      });

      if (newlyMatchedRecords.length > 0) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(
              AUTO_JOB_MATCHES_STORAGE_KEY,
              JSON.stringify(Array.from(notifiedJobseekerMatchesRef.current).slice(-300))
            );
          }
        } catch {
          // ignore
        }
        setAutomatedJobMatches((prev) => [...newlyMatchedRecords, ...prev].slice(0, 100));
      }

      // Sync with backend alert check-matches endpoint
      try {
        if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
          const registeredJobseekers = currentUsers
            .filter((u) => u.role === 'jobseeker' && u.autoMatchEmailsEnabled !== false)
            .map((u) => ({
              id: u.id,
              email: u.email,
              name: u.name,
              minSalaryRequirement: u.minSalaryRequirement,
              preferredParish: u.preferredParish || u.parish,
              preferredSector: u.preferredSector || u.careerSector,
              autoMatchEmailsEnabled: u.autoMatchEmailsEnabled ?? true,
            }));
          fetch('/api/alerts/check-matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job: newJob, registeredJobseekers }),
          }).catch((err) => console.warn('Backend alert check notice:', err));
        }
      } catch {
        // ignore non-browser test env
      }

      return newlyMatchedRecords;
    },
    [dispatchEmail]
  );

  // Automatically trigger jobseeker matching whenever new jobs appear in `jobs`
  useEffect(() => {
    const newJobsToMatch: JobListing[] = [];
    jobs.forEach((job) => {
      if (!knownJobIdsRef.current.has(job.id)) {
        knownJobIdsRef.current.add(job.id);
        newJobsToMatch.push(job);
      }
    });
    newJobsToMatch.forEach((job) => {
      runAutomatedJobMatchingForJob(job);
    });
  }, [jobs, runAutomatedJobMatchingForJob]);

  // Create Job
  const createJob = (jobData: Omit<JobListing, 'id' | 'postedAt' | 'viewsCount' | 'applicantsCount'>) => {
    const newJob: JobListing = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedAt: new Date().toISOString().split('T')[0],
      viewsCount: 1,
      applicantsCount: 0,
    };

    knownJobIdsRef.current.add(newJob.id);
    setJobs((prev) => [newJob, ...prev]);

    // Proactively email matching registered jobseekers (salary requirement + parish + sector)
    const autoMatchedRecords = runAutomatedJobMatchingForJob(newJob);
    const alreadyEmailedSet = new Set(
      autoMatchedRecords.map((rec) => rec.candidateEmail.toLowerCase())
    );

    // Check alerts and notify matching subscribers in real-time
    const matchingAlerts = alerts.filter((a) => {
      if (!a.active) return false;
      if (alreadyEmailedSet.has(a.email.toLowerCase())) return false;
      const parishMatch =
        a.parishes.length === 0 ||
        a.parishes.includes(newJob.parish) ||
        newJob.parish === 'Island-wide / Remote';
      const sectorMatch =
        a.sectors.length === 0 || a.sectors.includes(newJob.sector);
      const salaryMatch =
        !a.minSalary || a.minSalary <= 0 || newJob.maxSalary >= a.minSalary;
      const kw = a.keyword?.trim().toLowerCase();
      const keywordMatch =
        !kw ||
        newJob.title.toLowerCase().includes(kw) ||
        newJob.description.toLowerCase().includes(kw) ||
        newJob.company.toLowerCase().includes(kw) ||
        newJob.locality.toLowerCase().includes(kw) ||
        (newJob.requiredSkills?.some((s) => s.toLowerCase().includes(kw)) ?? false);
      return parishMatch && sectorMatch && salaryMatch && keywordMatch;
    });

    // Always alert admin (info@natureislecareers.com) when a new job posting is submitted
    sendAdminEmailAlert({
      eventType: 'new_job_posting',
      subject: `[New Job Created] ${newJob.title} by ${newJob.company} (${newJob.parish})`,
      summary: `New classified vacancy published: ${newJob.title} at ${newJob.company}. Salary: EC$${newJob.minSalary.toLocaleString()} - EC$${newJob.maxSalary.toLocaleString()} / ${newJob.salaryPeriod}.`,
      relatedJobId: newJob.id,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #006b4d; margin: 0;">Nature Island Careers · Platform Administrator Alert</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Automatic Notification to info@natureislecareers.com</p>
          </div>
          <p style="font-size: 14px; color: #1e293b;">A new job posting has just been submitted on Nature Island Careers:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 0; color: #0f172a;"><strong>Position:</strong> ${newJob.title}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Employer:</strong> ${newJob.company}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Parish:</strong> ${newJob.parish} (${newJob.locality})</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Sector:</strong> ${newJob.sector}</p>
            <p style="margin: 4px 0 0 0; color: #065f46; font-weight: bold;"><strong>Salary Range:</strong> EC$${newJob.minSalary.toLocaleString()} - EC$${newJob.maxSalary.toLocaleString()} / ${newJob.salaryPeriod}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Work Model:</strong> ${newJob.workModel} · ${newJob.employmentType}</p>
            <p style="margin: 4px 0 0 0; color: #0f172a;"><strong>Application Deadline:</strong> ${newJob.applicationDeadline}</p>
          </div>
          <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            Delivered automatically to info@natureislecareers.com via Admin Notification Service.
          </p>
        </div>
      `,
      serverPayload: {
        jobId: newJob.id,
        title: newJob.title,
        company: newJob.company,
        parish: newJob.parish,
        minSalary: newJob.minSalary,
        maxSalary: newJob.maxSalary,
      },
    });

    const siteContactEmail = getSiteContactEmail();
    if (siteContactEmail.toLowerCase() !== 'info@natureislecareers.com') {
      dispatchEmail({
        id: `notif-site-newjob-${Date.now()}`,
        recipientEmail: siteContactEmail,
        recipientName: 'Nature Island Careers Operations Team',
        subject: `[New Job Created] ${newJob.title} by ${newJob.company} (${newJob.parish})`,
        previewText: `New classified vacancy published: ${newJob.title} at ${newJob.company}. Salary: EC$${newJob.minSalary.toLocaleString()} - EC$${newJob.maxSalary.toLocaleString()}.`,
        bodyHtml: `<p>New vacancy published: <strong>${newJob.title}</strong> at ${newJob.company} (${newJob.parish}).</p>`,
        type: 'status_update',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRead: false,
        relatedJobId: newJob.id,
      });
    }

    matchingAlerts.forEach((alert) => {
      const emailNotif: EmailNotification = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        recipientEmail: alert.email,
        recipientName: alert.name,
        subject: `Real-Time Job Alert: ${newJob.title} in ${newJob.parish}`,
        previewText: `${newJob.company} just posted a new vacancy: ${newJob.title} in ${newJob.parish}. Salary: EC$${newJob.minSalary.toLocaleString()} - EC$${newJob.maxSalary.toLocaleString()}/${newJob.salaryPeriod}.`,
        bodyHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #006b4d; margin: 0;">Nature Isle Careers · Dominica</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Automated Real-Time Employment Match</p>
            </div>
            <p style="font-size: 15px; color: #1e293b;">Hello ${alert.name},</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">
              A brand new position matching your subscription criteria has just been published by an accredited employer in Dominica:
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
              <h3 style="color: #065f46; margin: 0 0 6px 0;">${newJob.title}</h3>
              <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Company:</strong> ${newJob.company}</p>
              <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Parish:</strong> ${newJob.parish} (${newJob.locality})</p>
              <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Sector:</strong> ${newJob.sector}</p>
              <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 600; margin-top: 6px;">
                Salary: EC$${newJob.minSalary.toLocaleString()} - EC$${newJob.maxSalary.toLocaleString()} / ${newJob.salaryPeriod}
              </p>
            </div>
            <p style="font-size: 13px; color: #64748b;">
              Log into your portal to submit your resume immediately. Early applicants have higher review velocity.
            </p>
          </div>
        `,
        type: 'job_alert',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRead: false,
        relatedJobId: newJob.id,
      };

      dispatchEmail(emailNotif);
    });

    // Browser notification: check if newly posted job matches user's previous search criteria
    try {
      const savedSearchesRaw = localStorage.getItem('natureisland_recent_searches');
      if (savedSearchesRaw) {
        const recentQueries: string[] = JSON.parse(savedSearchesRaw);
        for (const query of recentQueries) {
          if (!query || query.trim().length === 0) continue;
          const q = query.toLowerCase().trim();
          const isMatch =
            newJob.title.toLowerCase().includes(q) ||
            newJob.company.toLowerCase().includes(q) ||
            newJob.sector.toLowerCase().includes(q) ||
            newJob.locality.toLowerCase().includes(q) ||
            newJob.description.toLowerCase().includes(q) ||
            newJob.parish.toLowerCase().includes(q);

          if (isMatch) {
            notifyNewJobMatch(newJob.title, newJob.company, newJob.parish, query);
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const updateJob = (id: string, updates: Partial<JobListing>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    if (savedJobIds.includes(id)) {
      const job = jobs.find((j) => j.id === id);
      if (job) {
        const statusSummary = updates.applicationDeadline
          ? `Deadline updated to ${updates.applicationDeadline}`
          : updates.employmentType
          ? `Type updated to ${updates.employmentType}`
          : 'Details updated';
        notifySavedJobStatusChange(job.title, job.company, statusSummary);
      }
    }
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  // Dismiss / Restore Job Cards (Swipe to Dismiss on Mobile / iOS / Android)
  const dismissJob = (jobId: string) => {
    setDismissedJobIds((prev) => {
      if (prev.includes(jobId)) return prev;
      const next = [...prev, jobId];
      try {
        localStorage.setItem('dominica_dismissed_jobs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const restoreDismissedJob = (jobId: string) => {
    setDismissedJobIds((prev) => {
      const next = prev.filter((id) => id !== jobId);
      try {
        localStorage.setItem('dominica_dismissed_jobs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearDismissedJobs = () => {
    setDismissedJobIds([]);
    try {
      localStorage.removeItem('dominica_dismissed_jobs');
    } catch {
      // ignore
    }
  };

  // 1-Click Quick Apply using authenticated user's primary resume
  const quickApplyToJob = (
    jobId: string
  ): {
    applicationId: string;
    resumeFileName: string;
    alreadyApplied: boolean;
  } | null => {
    if (!currentUser) return null;

    const primaryResumeFileName =
      currentUser.resumeFileName?.trim() ||
      `${currentUser.name.trim().replace(/\s+/g, '_')}_Primary_Resume.pdf`;

    const existingApp = applications.find(
      (app) =>
        app.jobId === jobId &&
        app.applicantEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (existingApp) {
      return {
        applicationId: existingApp.id,
        resumeFileName: existingApp.resumeFileName || primaryResumeFileName,
        alreadyApplied: true,
      };
    }

    const job = getJobById(jobId);
    const autoScreeningAnswers: Record<string, string> = {};
    if (job?.screeningQuestions) {
      job.screeningQuestions.forEach((question) => {
        const qKey =
          typeof question === 'string'
            ? question
            : question.id || question.question;
        autoScreeningAnswers[qKey] = `Verified via ${currentUser.name}'s Candidate Profile (1-Click Quick Apply)`;
      });
    }

    const validCitizenStatuses = [
      'Dominican Citizen',
      'CARICOM CSME',
      'Work Permit Holder',
      'NEP Trainee',
    ] as const;
    const citizenStatus = validCitizenStatuses.includes(
      currentUser.residencyStatus as any
    )
      ? (currentUser.residencyStatus as
          | 'Dominican Citizen'
          | 'CARICOM CSME'
          | 'Work Permit Holder'
          | 'NEP Trainee')
      : 'Dominican Citizen';

    const applicationId = submitApplication({
      jobId,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
      applicantPhone: currentUser.phone || '+1 (767) 275-0000',
      parish: currentUser.parish || 'St. George',
      citizenStatus,
      resumeFileName: primaryResumeFileName,
      resumeFileSize: '340 KB',
      coverNote: `Submitted via 1-Click Quick Apply using primary profile resume (${primaryResumeFileName}).`,
      screeningAnswers: autoScreeningAnswers,
    });

    return {
      applicationId,
      resumeFileName: primaryResumeFileName,
      alreadyApplied: false,
    };
  };

  // Submit Application
  const submitApplication = (applicationData: {
    jobId: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    parish: Parish;
    citizenStatus: 'Dominican Citizen' | 'CARICOM CSME' | 'Work Permit Holder' | 'NEP Trainee';
    resumeFileName: string;
    resumeFileSize: string;
    portfolioUrl?: string;
    coverNote: string;
    screeningAnswers: Record<string, string>;
  }): string => {
    const job = getJobById(applicationData.jobId);
    const appId = `DOM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newApp: JobApplication = {
      ...applicationData,
      id: appId,
      jobTitle: job ? job.title : 'Dominica Position',
      companyName: job ? job.company : 'Dominica Employer',
      status: 'Applied',
      rating: 0,
      notes: [],
      appliedAt: nowTimestamp,
      timeline: [
        {
          date: nowTimestamp,
          action: 'Application Submitted',
          note: `Received application via mobile submission. Verification code: ${appId}.`,
        },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);

    // Increment applicantsCount on job
    setJobs((prev) =>
      prev.map((j) => (j.id === applicationData.jobId ? { ...j, applicantsCount: j.applicantsCount + 1 } : j))
    );

    // 1. Email notification to applicant
    const applicantEmailNotif: EmailNotification = {
      id: `notif-app-${Date.now()}`,
      recipientEmail: applicationData.applicantEmail,
      recipientName: applicationData.applicantName,
      subject: `Application Confirmation: ${newApp.jobTitle} at ${newApp.companyName}`,
      previewText: `Your application (${appId}) was securely delivered to ${newApp.companyName}.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #006b4d; margin: 0;">Nature Isle Careers · Dominica</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Application Receipt & Tracking Reference</p>
          </div>
          <p style="font-size: 15px; color: #1e293b;">Dear ${applicationData.applicantName},</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Thank you for submitting your application for <strong>${newApp.jobTitle}</strong> at <strong>${newApp.companyName}</strong>. Your profile and credentials have been securely routed to the employer’s recruitment desk.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Tracking Reference: <strong style="color: #0f172a;">${appId}</strong></p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Parish: <strong style="color: #0f172a;">${applicationData.parish}</strong></p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Submitted Resume: <strong style="color: #0f172a;">${applicationData.resumeFileName} (${applicationData.resumeFileSize})</strong></p>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Under Dominican Labor Guidelines and the Data Protection Act, your personal records remain strictly confidential. You will receive automated email alerts as the hiring team reviews your candidacy.
          </p>
        </div>
      `,
      type: 'application_received',
      timestamp: nowTimestamp,
      isRead: false,
      relatedJobId: applicationData.jobId,
    };

    dispatchEmail(applicantEmailNotif);

    // 2. Email notification to employer
    if (job) {
      const employerEmailNotif: EmailNotification = {
        id: `notif-rec-${Date.now()}`,
        recipientEmail: job.contactEmail,
        recipientName: job.company,
        subject: `New Candidate Alert: ${applicationData.applicantName} applied for ${job.title}`,
        previewText: `${applicationData.applicantName} (${applicationData.parish}) submitted an application with resume.`,
        bodyHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h3 style="color: #006b4d; margin-top: 0;">New Applicant Alert · ${job.company}</h3>
            <p style="font-size: 14px; color: #334155;">
              A new candidate has submitted an application for <strong>${job.title}</strong>:
            </p>
            <ul style="font-size: 14px; color: #1e293b; line-height: 1.6;">
              <li><strong>Candidate:</strong> ${applicationData.applicantName}</li>
              <li><strong>Email:</strong> ${applicationData.applicantEmail}</li>
              <li><strong>Phone:</strong> ${applicationData.applicantPhone}</li>
              <li><strong>Parish of Residence:</strong> ${applicationData.parish}</li>
              <li><strong>Eligibility:</strong> ${applicationData.citizenStatus}</li>
              <li><strong>Resume:</strong> ${applicationData.resumeFileName}</li>
            </ul>
            <p style="font-size: 13px; color: #64748b;">
              Open your Nature Isle Recruiter Portal to view their complete dossier and move them through your hiring pipeline.
            </p>
          </div>
        `,
        type: 'recruiter_new_applicant',
        timestamp: nowTimestamp,
        isRead: false,
        relatedJobId: job.id,
      };

      setNotifications((prev) => [employerEmailNotif, ...prev]);
    }

    return appId;
  };

  // Update Application Status with optional automated email
  const updateApplicationStatus = (appId: string, newStatus: ApplicationStatus, customEmailMessage?: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const defaultNote =
      newStatus === 'Approved'
        ? 'Application reviewed and approved by administration.'
        : newStatus === 'Denied'
        ? 'Application reviewed and denied at this stage.'
        : 'Status updated by recruiter.';

    const updatedTimeline = [
      ...app.timeline,
      {
        date: nowTimestamp,
        action: `Status Changed to ${newStatus}`,
        note: customEmailMessage || defaultNote,
      },
    ];

    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus, timeline: updatedTimeline } : a))
    );

    // Send automated status update email to applicant
    const statusEmail: EmailNotification = {
      id: `notif-stat-${Date.now()}`,
      recipientEmail: app.applicantEmail,
      recipientName: app.applicantName,
      subject:
        newStatus === 'Approved'
          ? `Application Approved: ${app.jobTitle} at ${app.companyName}`
          : newStatus === 'Denied'
          ? `Application Decision: ${app.jobTitle} at ${app.companyName} (Denied)`
          : `Status Update: ${app.jobTitle} at ${app.companyName} (${newStatus})`,
      previewText: `Your application status for ${app.jobTitle} has been updated to "${newStatus}".`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid ${newStatus === 'Denied' ? '#be123c' : '#006b4d'}; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: ${newStatus === 'Denied' ? '#be123c' : '#006b4d'}; margin: 0;">${app.companyName}</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Application Status Update · Ref ${app.id}</p>
          </div>
          <p style="font-size: 15px; color: #1e293b;">Dear ${app.applicantName},</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            We are writing to inform you that your application for <strong>${app.jobTitle}</strong> has transitioned to:
          </p>
          <div style="background: ${newStatus === 'Denied' ? '#fff1f2' : '#f0fdf4'}; border-left: 4px solid ${newStatus === 'Denied' ? '#be123c' : '#006b4d'}; padding: 14px 18px; margin: 16px 0;">
            <strong style="color: ${newStatus === 'Denied' ? '#9f1239' : '#065f46'}; font-size: 16px;">${newStatus}</strong>
            ${customEmailMessage ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #1e293b;">${customEmailMessage}</p>` : ''}
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Thank you for your interest in contributing to the Dominican workforce with ${app.companyName}.
          </p>
        </div>
      `,
      type: 'status_update',
      timestamp: nowTimestamp,
      isRead: false,
      relatedJobId: app.jobId,
    };

    dispatchEmail(statusEmail);

    if (newStatus === 'Approved' || newStatus === 'Denied') {
      logAdminActivity(
        `Application ${newStatus}`,
        `${app.applicantName} (${app.applicantEmail}) for "${app.jobTitle}" at ${app.companyName} marked ${newStatus}.`,
        'Account Approval'
      );
    }

    // Browser notification: notify applicant / saved job status change
    const isSaved = savedJobIds.includes(app.jobId);
    if (isSaved || currentUser?.email === app.applicantEmail) {
      notifySavedJobStatusChange(app.jobTitle, app.companyName, newStatus);
    }
  };

  // Rate candidate
  const rateApplication = (appId: string, rating: number) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, rating } : a)));
  };

  // Add internal recruiter note
  const addApplicationNote = (appId: string, note: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, notes: [...a.notes, note] } : a))
    );
  };

  // Schedule Interview
  const scheduleInterview = (appId: string, details: InterviewDetails) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const trimmedNotes = details.notes?.trim();
    const updatedTimeline = [
      ...app.timeline,
      {
        date: nowTimestamp,
        action: `Interview Scheduled`,
        note: `${details.mode} on ${details.date} at ${details.time} (${details.location})${
          trimmedNotes ? ` · Recruiter Notes: ${trimmedNotes}` : ''
        }`,
      },
    ];

    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: 'Interview Scheduled',
              interviewDetails: details,
              notes: trimmedNotes ? [...a.notes, trimmedNotes] : a.notes,
              timeline: updatedTimeline,
            }
          : a
      )
    );

    // Send interview email notification to applicant
    const interviewEmail: EmailNotification = {
      id: `notif-int-${Date.now()}`,
      recipientEmail: app.applicantEmail,
      recipientName: app.applicantName,
      subject: `Interview Invitation: ${app.jobTitle} with ${app.companyName}`,
      previewText: `Interview scheduled for ${details.date} at ${details.time} (${details.location}).`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #006b4d; margin: 0;">${app.companyName}</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Interview Invitation</p>
          </div>
          <p style="font-size: 15px; color: #1e293b;">Dear ${app.applicantName},</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Following our review of your credentials, we are pleased to invite you to an interview for the <strong>${app.jobTitle}</strong> opening.
          </p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Date:</strong> ${details.date}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Time:</strong> ${details.time} AST (Dominica Time)</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Meeting Mode:</strong> ${details.mode}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Venue / Connection:</strong> ${details.location}</p>
            ${details.instructions ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #047857;"><strong>Instructions:</strong> ${details.instructions}</p>` : ''}
          </div>
          <p style="font-size: 13px; color: #64748b;">
            Please ensure you have copies of your Dominican ID / passport and certified academic certificates ready.
          </p>
        </div>
      `,
      type: 'interview_invite',
      timestamp: nowTimestamp,
      isRead: false,
      relatedJobId: app.jobId,
    };

    dispatchEmail(interviewEmail);
  };

  // Save Post-Call Interview Evaluation
  const saveInterviewEvaluation = (appId: string, evaluation: InterviewEvaluation) => {
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const evalSummaryNote = `[Interview Evaluation: ${evaluation.overallScore}/5 (${evaluation.percentage}%) · ${evaluation.recommendation}] Comm: ${evaluation.communication}/5, Tech Fit: ${evaluation.technicalFit}/5, Cultural Fit: ${evaluation.culturalFit}/5${
      evaluation.problemSolving ? `, Problem Solving: ${evaluation.problemSolving}/5` : ''
    }${evaluation.comments ? ` — "${evaluation.comments}"` : ''}`;

    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const updatedDetails: InterviewDetails | undefined = a.interviewDetails
          ? { ...a.interviewDetails, evaluation }
          : undefined;
        return {
          ...a,
          rating: Math.max(1, Math.min(5, Math.round(evaluation.overallScore))),
          interviewEvaluation: evaluation,
          interviewDetails: updatedDetails,
          notes: [...a.notes, evalSummaryNote],
          timeline: [
            ...a.timeline,
            {
              date: nowTimestamp,
              action: `Interview Evaluation Completed (${evaluation.recommendation})`,
              note: evalSummaryNote,
            },
          ],
        };
      })
    );
  };

  // Candidate selects an available recruiter-provided interview slot
  const selectInterviewSlot = (appId: string, slotId: string, candidateNote?: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    // Look for chosen slot from app.availableInterviewSlots or create matching details
    const chosenSlot = app.availableInterviewSlots?.find((s) => s.id === slotId) || {
      id: slotId,
      date: 'Monday, Oct 5, 2026',
      time: '10:00 AM AST',
      mode: 'Virtual Video Call' as const,
      location: 'Google Meet Video Call',
      interviewer: 'Recruiting Panel',
      available: true,
    };

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedSlots = app.availableInterviewSlots
      ? app.availableInterviewSlots.map((s) => ({
          ...s,
          available: s.id === slotId ? false : true,
        }))
      : [
          {
            ...chosenSlot,
            available: false,
          },
        ];

    const interviewDetails: InterviewDetails = {
      date: chosenSlot.date,
      time: chosenSlot.time,
      location: chosenSlot.location,
      mode: chosenSlot.mode,
      instructions: candidateNote
        ? `Candidate Note: "${candidateNote}". Interviewer: ${chosenSlot.interviewer}`
        : `Interviewer: ${chosenSlot.interviewer}`,
    };

    const updatedTimeline = [
      ...app.timeline,
      {
        date: nowTimestamp,
        action: 'Interview Slot Selected by Candidate',
        note: `Confirmed appointment on ${chosenSlot.date} at ${chosenSlot.time} (${chosenSlot.mode}). Interviewer: ${chosenSlot.interviewer}.`,
      },
    ];

    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: 'Interview Scheduled',
              selectedSlotId: slotId,
              availableInterviewSlots: updatedSlots,
              interviewDetails,
              timeline: updatedTimeline,
            }
          : a
      )
    );

    // Send automated email confirmation to candidate
    const confirmationEmail: EmailNotification = {
      id: `notif-slot-${Date.now()}`,
      recipientEmail: app.applicantEmail,
      recipientName: app.applicantName,
      subject: `Interview Confirmed: ${app.jobTitle} with ${app.companyName}`,
      previewText: `Your interview has been booked for ${chosenSlot.date} at ${chosenSlot.time} (${chosenSlot.mode}).`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #006b4d; margin: 0;">${app.companyName}</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Automated Interview Confirmation · Ref ${app.id}</p>
          </div>
          <p style="font-size: 15px; color: #1e293b;">Dear ${app.applicantName},</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Your selected interview slot for <strong>${app.jobTitle}</strong> has been successfully booked and synchronized with the recruiter desk:
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Date:</strong> ${chosenSlot.date}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Time:</strong> ${chosenSlot.time} AST</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Format:</strong> ${chosenSlot.mode}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;"><strong>Location / Link:</strong> ${chosenSlot.location}</p>
            <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Host:</strong> ${chosenSlot.interviewer}</p>
          </div>
          ${candidateNote ? `<p style="font-size: 13px; color: #475569;"><strong>Candidate Note:</strong> "${candidateNote}"</p>` : ''}
          <p style="font-size: 13px; color: #64748b;">
            Please ensure you have photographic Dominican ID / passport ready at the start of your session.
          </p>
        </div>
      `,
      type: 'interview_invite',
      timestamp: nowTimestamp,
      isRead: false,
      relatedJobId: app.jobId,
    };

    dispatchEmail(confirmationEmail);
  };

  // Notifications
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;
  const unreadJobAlertCount = notifications.filter(
    (n) => !n.isRead && n.type === 'job_alert'
  ).length;
  const hasUnreadAlertMatches =
    unreadJobAlertCount > 0 ||
    unreadNotificationCount > 0 ||
    Boolean(latestDispatchedEmail && !latestDispatchedEmail.isRead);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const sendManualTestAlert = (targetEmail: string) => {
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const testNotif: EmailNotification = {
      id: `test-${Date.now()}`,
      recipientEmail: targetEmail,
      recipientName: 'Valued Job Seeker',
      subject: 'Test Real-Time Alert: New Verified Dominican Vacancies Dispatched',
      previewText: 'Real-time alert delivery verified for Roseau and Portsmouth openings.',
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h3 style="color: #006b4d; margin-top: 0;">Nature Isle Careers · Live Alert Dispatch Test</h3>
          <p style="font-size: 14px; color: #334155;">
            This confirms that real-time email delivery is operational for <strong>${targetEmail}</strong>.
          </p>
          <p style="font-size: 13px; color: #64748b;">
            You will receive instant alerts whenever new vacancies in Dominica match your registered parishes and preferred salary brackets.
          </p>
        </div>
      `,
      type: 'job_alert',
      timestamp: nowTimestamp,
      isRead: false,
    };
    dispatchEmail(testNotif);
  };

  // Subscriptions
  const subscribeToAlert = (data: {
    email: string;
    name: string;
    parishes: Parish[];
    sectors: JobSector[];
    frequency: 'instant' | 'daily' | 'weekly';
    keyword?: string;
    minSalary?: number;
  }) => {
    const newAlert: JobAlertSubscription = {
      ...data,
      id: `alert-${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAlerts((prev) => [newAlert, ...prev]);

    // Also persist to subscriptionCriteria in localStorage
    const derivedRules: AlertPreferenceRule[] =
      data.sectors.length > 0
        ? data.sectors.map((sec, idx) => ({
            id: `pref-${Date.now()}-${idx}`,
            sector: sec,
            parish:
              data.parishes[idx % Math.max(1, data.parishes.length)] || 'All Parishes',
            keyword: data.keyword,
            active: true,
          }))
        : [
            {
              id: `pref-${Date.now()}-0`,
              sector: 'All Sectors',
              parish: data.parishes[0] || 'All Parishes',
              keyword: data.keyword,
              active: true,
            },
          ];

    const updatedCriteria: SubscriptionCriteria = {
      email: data.email,
      name: data.name,
      parishes: data.parishes,
      sectors: data.sectors,
      keyword: data.keyword || '',
      minSalary: data.minSalary,
      frequency: data.frequency,
      enabled: true,
      alertPreferences: derivedRules,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setSubscriptionCriteria(updatedCriteria);
    saveSubscriptionCriteriaToStorage(updatedCriteria);

    // Keep matching jobseeker account salary/parish/sector preferences synchronized
    const cleanEmail = data.email.trim().toLowerCase();
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.email.toLowerCase() !== cleanEmail || u.role !== 'jobseeker') return u;
        return {
          ...u,
          minSalaryRequirement: data.minSalary ?? u.minSalaryRequirement,
          preferredParish: data.parishes[0] || u.preferredParish,
          preferredSector: data.sectors[0] || u.preferredSector,
          autoMatchEmailsEnabled: true,
        };
      })
    );
    if (currentUser && currentUser.email.toLowerCase() === cleanEmail && currentUser.role === 'jobseeker') {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              minSalaryRequirement: data.minSalary ?? prev.minSalaryRequirement,
              preferredParish: data.parishes[0] || prev.preferredParish,
              preferredSector: data.sectors[0] || prev.preferredSector,
              autoMatchEmailsEnabled: true,
            }
          : prev
      );
    }

    // Sync subscription criteria with backend service
    fetch('/api/alerts/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => console.warn('Backend alert subscribe sync notice:', err));

    // Send confirmation email
    const confirmEmail: EmailNotification = {
      id: `alert-sub-${Date.now()}`,
      recipientEmail: data.email,
      recipientName: data.name,
      subject: `Real-Time Alerts Active: Nature Isle Job Watch (${data.frequency})`,
      previewText: `You are now subscribed to verified jobs in Dominica across ${data.parishes.length > 0 ? data.parishes.join(', ') : 'All Parishes'}.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h3 style="color: #006b4d; margin-top: 0;">Real-Time Job Alerts Activated</h3>
          <p style="font-size: 14px; color: #334155;">
            Hello <strong>${data.name}</strong>, your custom employment filter has been registered with Nature Isle Careers:
          </p>
          <ul style="font-size: 14px; color: #1e293b; line-height: 1.6;">
            <li><strong>Parishes:</strong> ${data.parishes.length > 0 ? data.parishes.join(', ') : 'Island-wide (All 10 Parishes)'}</li>
            <li><strong>Sectors:</strong> ${data.sectors.length > 0 ? data.sectors.join(', ') : 'All Industries'}</li>
            ${data.minSalary ? `<li><strong>Minimum Salary:</strong> EC$${data.minSalary.toLocaleString()}/month</li>` : ''}
            <li><strong>Notification Frequency:</strong> ${data.frequency.toUpperCase()}</li>
          </ul>
          <p style="font-size: 13px; color: #64748b;">
            Whenever a Dominican employer posts a matching job listing, you will be notified immediately.
          </p>
        </div>
      `,
      type: 'job_alert',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    dispatchEmail(confirmEmail);
  };

  const toggleAlertActive = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  // Feedback
  const submitFeedback = (feedbackData: Omit<FeedbackItem, 'id' | 'submittedAt'>) => {
    const newFeedback: FeedbackItem = {
      ...feedbackData,
      id: `fb-${Date.now()}`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setFeedbacks((prev) => [newFeedback, ...prev]);

    // Send thank you email notification
    const feedbackNotif: EmailNotification = {
      id: `notif-fb-${Date.now()}`,
      recipientEmail: feedbackData.email,
      recipientName: feedbackData.name,
      subject: `Thank You for Your Feedback on Dominica's Job Board`,
      previewText: `Your recommendations have been shared with our labor market platform administrators.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h3 style="color: #006b4d; margin-top: 0;">Dominica Labor Market Platform Feedback</h3>
          <p style="font-size: 14px; color: #334155;">
            Dear ${feedbackData.name},
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Thank you for providing your ${feedbackData.rating}-star review regarding <strong>${feedbackData.category}</strong>. Continuous community feedback helps our island-wide employment ecosystem thrive.
          </p>
        </div>
      `,
      type: 'feedback_received',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    dispatchEmail(feedbackNotif);
  };

  // Database Sync Simulation
  const runSyncSimulation = (targetSystem: 'Dominica Labour Division' | 'National Employment Programme (NEP)' | 'Dominica Social Security (DSS)') => {
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newRecord: DatabaseSyncRecord = {
      id: `sync-${Date.now()}`,
      targetSystem,
      syncType:
        targetSystem === 'National Employment Programme (NEP)'
          ? 'Import NEP Trainees'
          : targetSystem === 'Dominica Labour Division'
          ? 'Export Vacancies'
          : 'Bi-directional Reconcile',
      timestamp: nowTimestamp,
      recordsCount: Math.floor(12 + Math.random() * 28),
      status: 'Completed',
      checksum: `DOM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };
    setSyncRecords((prev) => [newRecord, ...prev]);
  };

  const exportDatabaseCSV = () => {
    const headers = [
      'Vacancy ID',
      'Title',
      'Employer',
      'Parish',
      'Sector',
      'Type',
      'Min Salary (XCD)',
      'Max Salary (XCD)',
      'NEP Approved',
      'Applicants',
      'Posted Date',
    ];
    const rows = jobs.map((j) => [
      j.id,
      `"${j.title.replace(/"/g, '""')}"`,
      `"${j.company.replace(/"/g, '""')}"`,
      j.parish,
      `"${j.sector}"`,
      j.employmentType,
      j.minSalary,
      j.maxSalary,
      j.isNepApproved ? 'YES' : 'NO',
      j.applicantsCount,
      j.postedAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Dominica_Labour_Registry_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Background service: audit employer subscriptions and alert site contact email if expired
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    users.forEach((u) => {
      if (u.role === 'client' && u.subscription) {
        const isExpired =
          u.subscription.status === 'expired' ||
          (u.subscription.renewsAt && u.subscription.renewsAt < today);
        if (isExpired) {
          const alertKey = `notified_sub_exp_${u.id}_${u.subscription.renewsAt}`;
          if (!sessionStorage.getItem(alertKey)) {
            sessionStorage.setItem(alertKey, 'true');
            notifySubscriptionExpired(
              u.companyName || u.name,
              u.subscription.plan,
              u.subscription.renewsAt
            );
          }
        }
      }
    });
  }, [users]);

  return (
    <JobContext.Provider
      value={{
        activeRole,
        setActiveRole,
        currentRecruiter,
        setCurrentRecruiterId,
        recruiters,
        updateRecruiter,
        // Invoices & Stripe Billing
        invoices,
        addInvoice,
        notifyEmployerPaymentSuccess,
        stripeSettings,
        updateStripeSettings,
        toggleRecruiterAutoRenew,
        sendRecruiterReminders,
        notifySubscriptionExpired,
        // User Auth & Subscription
        currentUser,
        users,
        registerJobseeker,
        registerClient,
        subscribeClientPlan,
        loginUser,
        authenticateWithGoogle,
        authenticateWithGithub,
        authenticateWithSocialProvider,
        logoutUser,
        updateCurrentUser,
        requestPasswordReset,
        confirmPasswordReset,
        isAdminLoggedIn,
        adminEmail,
        adminSessionToken,
        adminLogin,
        adminLogout,
        adminActivityLogs,
        logAdminActivity,
        clearAdminActivityLogs,
        mergeAdminAuditLogs,
        adminEmailAlerts,
        mergeAdminEmailAlerts,
        sendAdminEmailAlert,
        clearAdminEmailAlerts,
        isAdminSessionExpiredPromptOpen,
        dismissAdminSessionExpiredPrompt,
        triggerAdminIdleTimeout,
        resetAdminIdleTimer,
        lastAdminActivityAt,
        adminIdleTimeoutMs: ADMIN_IDLE_TIMEOUT_MS,
        // Jobs & Remote
        jobs,
        getJobById,
        createJob,
        createRemoteAssignment,
        updateJob,
        deleteJob,
        incrementJobViews,
        savedJobIds,
        savedJobFolders,
        toggleSaveJob,
        isJobSaved,
        createSavedFolder,
        deleteSavedFolder,
        renameSavedFolder,
        saveJobToFolder,
        removeJobFromFolder,
        getJobFolders,
        dismissedJobIds,
        dismissJob,
        restoreDismissedJob,
        clearDismissedJobs,
        applications,
        myApplications,
        quickApplyToJob,
        submitApplication,
        updateApplicationStatus,
        rateApplication,
        addApplicationNote,
        scheduleInterview,
        saveInterviewEvaluation,
        selectInterviewSlot,
        withdrawApplication,
        notifications,
        unreadNotificationCount,
        unreadJobAlertCount,
        hasUnreadAlertMatches,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        latestDispatchedEmail,
        dismissLatestEmail,
        dispatchEmail,
        sendManualTestAlert,
        requestBrowserNotificationPermission,
        recentSearches,
        setRecentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
        alerts,
        subscriptionCriteria,
        setSubscriptionCriteria,
        saveSubscriptionCriteria,
        loadSubscriptionCriteria,
        subscribeToAlert,
        toggleAlertActive,
        feedbacks,
        submitFeedback,
        syncRecords,
        runSyncSimulation,
        exportDatabaseCSV,
        siteSettings,
        updateSiteSettings,
        isJobExpired,
        renewJobListing,
        expiredJobIds,
        automatedJobMatches,
        runAutomatedJobMatchingForJob,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
};
