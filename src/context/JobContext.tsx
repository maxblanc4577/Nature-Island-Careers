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

interface JobContextType {
  // Role & Recruiter
  activeRole: 'jobseeker' | 'recruiter' | 'admin';
  setActiveRole: (role: 'jobseeker' | 'recruiter' | 'admin') => void;
  currentRecruiter: RecruiterAccount;
  setCurrentRecruiterId: (id: string) => void;
  recruiters: RecruiterAccount[];

  // Invoices & Stripe Billing
  invoices: EmployerInvoice[];
  addInvoice: (invoice: Omit<EmployerInvoice, 'id'>) => EmployerInvoice;
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
  }) => UserAccount;
  registerClient: (data: {
    companyName: string;
    name: string;
    email: string;
    phone: string;
    parish: Parish;
    dssRegistrationNo: string;
    industry: JobSector;
  }) => UserAccount;
  subscribeClientPlan: (
    userId: string,
    plan: SubscriptionPlan,
    paymentMethod: 'National Bank of Dominica (NBD)' | 'Credit/Debit Card (XCD)' | 'Republic Bank / Wire'
  ) => void;
  loginUser: (email: string) => boolean;
  logoutUser: () => void;
  updateCurrentUser: (updatedFields: Partial<UserAccount>) => void;

  // Admin Portal Login & Security
  isAdminLoggedIn: boolean;
  adminLogin: (email: string, pass: string) => boolean;
  adminLogout: () => void;

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

  // Applications
  applications: JobApplication[];
  myApplications: JobApplication[];
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
  }) => void;
  toggleAlertActive: (id: string) => void;

  // Feedback
  feedbacks: FeedbackItem[];
  submitFeedback: (feedback: Omit<FeedbackItem, 'id' | 'submittedAt'>) => void;

  // Local Employment DB Integration
  syncRecords: DatabaseSyncRecord[];
  runSyncSimulation: (targetSystem: 'Dominica Labour Division' | 'National Employment Programme (NEP)' | 'Dominica Social Security (DSS)') => void;
  exportDatabaseCSV: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const SUBSCRIPTION_CRITERIA_STORAGE_KEY = 'dominica_subscription_criteria';
export const RECENT_SEARCHES_STORAGE_KEY = 'dominica_recent_searches';
export const LEGACY_RECENT_SEARCHES_KEY = 'natureisland_recent_searches';
export const SAVED_JOB_FOLDERS_STORAGE_KEY = 'dominica_saved_job_folders';

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
  const [recruiters] = useState<RecruiterAccount[]>(INITIAL_RECRUITERS);
  const [currentRecruiterId, setCurrentRecruiterId] = useState<string>('rec_fort_young');

  const [jobs, setJobs] = useState<JobListing[]>(() => {
    const saved = localStorage.getItem('dominica_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('dominica_applications');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  const [notifications, setNotifications] = useState<EmailNotification[]>(() => {
    const saved = localStorage.getItem('dominica_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [alerts, setAlerts] = useState<JobAlertSubscription[]>(() => {
    const saved = localStorage.getItem('dominica_alerts');
    return saved ? JSON.parse(saved) : [
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
    const saved = localStorage.getItem('dominica_saved_jobs');
    return saved ? JSON.parse(saved) : ['job-101', 'job-102'];
  });

  const [savedJobFolders, setSavedJobFolders] = useState<SavedJobFolder[]>(() =>
    loadSavedJobFoldersFromStorage()
  );

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    const saved = localStorage.getItem('dominica_feedbacks');
    return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
  });

  const [syncRecords, setSyncRecords] = useState<DatabaseSyncRecord[]>(() => {
    const saved = localStorage.getItem('dominica_sync_records');
    return saved ? JSON.parse(saved) : INITIAL_SYNC_RECORDS;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('dominica_users');
    return saved ? JSON.parse(saved) : (INITIAL_USERS as UserAccount[]);
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('dominica_current_user');
    return saved ? JSON.parse(saved) : ((INITIAL_USERS[0] as UserAccount) || null);
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('dominica_admin_logged') === 'true';
  });

  const [invoices, setInvoices] = useState<EmployerInvoice[]>(() => {
    const saved = localStorage.getItem('dominica_employer_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [stripeSettings, setStripeSettings] = useState<StripeSettings>(() => {
    const saved = localStorage.getItem('dominica_stripe_settings');
    return saved ? JSON.parse(saved) : INITIAL_STRIPE_SETTINGS;
  });

  const [latestDispatchedEmail, setLatestDispatchedEmail] = useState<EmailNotification | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('dominica_jobs', JSON.stringify(jobs));
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

  const loadSubscriptionCriteria = (): SubscriptionCriteria => {
    const loaded = loadSubscriptionCriteriaFromStorage();
    setSubscriptionCriteria(loaded);
    return loaded;
  };

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
    if (currentUser) {
      localStorage.setItem('dominica_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dominica_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('dominica_admin_logged', isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

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
    setSavedJobIds((prev) => {
      const isCurrentlySaved = prev.includes(id);
      if (isCurrentlySaved) {
        setSavedJobFolders((folders) => {
          const next = folders.map((f) => ({
            ...f,
            jobIds: f.jobIds.filter((jid) => jid !== id),
          }));
          saveSavedJobFoldersToStorage(next);
          return next;
        });
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
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
  }) => {
    const newUser: UserAccount = {
      id: `usr-jobseeker-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: 'jobseeker',
      parish: data.parish,
      phone: data.phone,
      careerSector: data.careerSector,
      skills: data.skills,
      resumeFileName: data.resumeFileName || 'Dominica_Candidate_Resume.pdf',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setActiveRole('jobseeker');
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
  }) => {
    const newUser: UserAccount = {
      id: `usr-client-${Date.now()}`,
      email: data.email,
      name: data.name,
      companyName: data.companyName,
      role: 'client',
      parish: data.parish,
      phone: data.phone,
      dssRegistrationNo: data.dssRegistrationNo,
      subscription: {
        plan: 'Standard Local Employer',
        priceXCD: 250,
        status: 'pending_payment',
        paymentMethod: 'National Bank of Dominica (NBD)',
        transactionRef: `INV-DOM-${Date.now().toString().slice(-6)}`,
        subscribedAt: new Date().toISOString().split('T')[0],
        renewsAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        quotaPostings: 5,
        remoteWorkEnabled: false,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setActiveRole('recruiter');
    return newUser;
  };

  const subscribeClientPlan = (
    userId: string,
    plan: SubscriptionPlan,
    paymentMethod: 'National Bank of Dominica (NBD)' | 'Credit/Debit Card (XCD)' | 'Republic Bank / Wire'
  ) => {
    const price = plan === 'Enterprise Growth Partner' ? 650 : plan === 'NEP Partner Tier' ? 180 : 250;
    const txRef = `TX-DOM-${Math.floor(100000 + Math.random() * 900000)}`;
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
      quotaPostings: plan === 'Enterprise Growth Partner' ? 999 : plan === 'NEP Partner Tier' ? 15 : 5,
      remoteWorkEnabled: true,
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, subscription: updatedSub } : u))
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, subscription: updatedSub });
    }

    // Send confirmation email
    const emailNotif: EmailNotification = {
      id: `notif-sub-${Date.now()}`,
      recipientEmail: currentUser?.email || 'careers@fortyounghotel.com',
      recipientName: currentUser?.name || 'Dominican Employer',
      subject: `Subscription Confirmed: ${plan} Active (Ref ${txRef})`,
      previewText: `Your employer subscription of EC$${price}/month has been verified. Remote Work Assignment and Vacancy posting privileges are active.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <h2 style="color: #006b4d; margin-top: 0;">Nature Isle Careers · Employer Subscription Active</h2>
          <p style="font-size: 14px; color: #334155;">
            Thank you for subscribing to the <strong>${plan}</strong> plan for Dominican recruitment.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Amount Paid:</strong> EC$${price.toLocaleString()} XCD</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #065f46;"><strong>Payment Gateway:</strong> ${paymentMethod}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #065f46;"><strong>Transaction Ref:</strong> ${txRef}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #065f46;"><strong>Next Renewal:</strong> ${renewsStr}</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            Your account is now authorized to place Remote Work Assignments across Dominica and manage applicant candidate dossiers.
          </p>
        </div>
      `,
      type: 'status_update',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    dispatchEmail(emailNotif);
  };

  const loginUser = (email: string) => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      if (found.role === 'admin') {
        setIsAdminLoggedIn(true);
        setActiveRole('admin');
      } else if (found.role === 'client') {
        setActiveRole('recruiter');
      } else {
        setActiveRole('jobseeker');
      }
      return true;
    }
    return false;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setActiveRole('jobseeker');
  };

  const updateCurrentUser = (updatedFields: Partial<UserAccount>) => {
    setCurrentUser((prev) => {
      const base = prev || {
        id: `user-${Date.now()}`,
        name: 'Dominica Job Seeker',
        email: 'jobseeker@waitukubuli.dm',
        role: 'jobseeker' as const,
        parish: 'St. George' as Parish,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated: UserAccount = { ...base, ...updatedFields };
      localStorage.setItem('dominica_current_user', JSON.stringify(updated));
      setUsers((prevUsers) => {
        const exists = prevUsers.some((u) => u.id === updated.id);
        const nextUsers = exists
          ? prevUsers.map((u) => (u.id === updated.id ? updated : u))
          : [updated, ...prevUsers];
        localStorage.setItem('dominica_users', JSON.stringify(nextUsers));
        return nextUsers;
      });
      return updated;
    });
  };

  const adminLogin = (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const validEmails = [
      'info@natureislecareers.com',
      'info@natureislandcareers.com',
      'info@natureislandcarees.com',
    ];
    if (validEmails.includes(cleanEmail) && pass === 'natureislandcareers') {
      setIsAdminLoggedIn(true);
      setActiveRole('admin');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveRole('jobseeker');
  };

  const getSiteContactEmail = (): string => {
    try {
      const saved = localStorage.getItem('natureisland_site_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.contactEmail) return parsed.contactEmail;
      }
    } catch {
      // ignore
    }
    return 'info@natureislecareers.com';
  };

  const addInvoice = (invoiceData: Omit<EmployerInvoice, 'id'>) => {
    const newInvoice: EmployerInvoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      paymentIntentId:
        invoiceData.paymentIntentId ||
        `pi_live_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}XCD`,
      timestamp:
        invoiceData.timestamp ||
        new Date().toISOString().replace('T', ' ').substring(0, 19) + ' AST',
      currency: invoiceData.currency || 'XCD',
      stripeFeeXCD:
        invoiceData.stripeFeeXCD ||
        Number(((invoiceData.amountXCD * 0.029) + 0.81).toFixed(2)),
    };
    setInvoices((prev) => [newInvoice, ...prev]);
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
    setStripeSettings((prev) => ({ ...prev, ...updates }));
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
  const dispatchEmail = (notification: EmailNotification) => {
    setNotifications((prev) => [notification, ...prev]);
    setLatestDispatchedEmail(notification);
  };

  const dismissLatestEmail = () => {
    setLatestDispatchedEmail(null);
  };

  // Create Job
  const createJob = (jobData: Omit<JobListing, 'id' | 'postedAt' | 'viewsCount' | 'applicantsCount'>) => {
    const newJob: JobListing = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedAt: new Date().toISOString().split('T')[0],
      viewsCount: 1,
      applicantsCount: 0,
    };

    setJobs((prev) => [newJob, ...prev]);

    // Notify backend alert service to trigger automated matching candidate notifications
    fetch('/api/alerts/check-matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job: newJob }),
    }).catch((err) => console.warn('Backend alert check notice:', err));

    // Check alerts and notify matching subscribers in real-time
    const matchingAlerts = alerts.filter((a) => {
      if (!a.active) return false;
      const parishMatch =
        a.parishes.length === 0 ||
        a.parishes.includes(newJob.parish) ||
        newJob.parish === 'Island-wide / Remote';
      const sectorMatch =
        a.sectors.length === 0 || a.sectors.includes(newJob.sector);
      const kw = a.keyword?.trim().toLowerCase();
      const keywordMatch =
        !kw ||
        newJob.title.toLowerCase().includes(kw) ||
        newJob.description.toLowerCase().includes(kw) ||
        newJob.company.toLowerCase().includes(kw) ||
        newJob.locality.toLowerCase().includes(kw) ||
        (newJob.requiredSkills?.some((s) => s.toLowerCase().includes(kw)) ?? false);
      return parishMatch && sectorMatch && keywordMatch;
    });

    // Background service: automatically trigger email notification to the site contact email
    const siteContactEmail = getSiteContactEmail();
    const siteAdminJobNotice: EmailNotification = {
      id: `notif-site-newjob-${Date.now()}`,
      recipientEmail: siteContactEmail,
      recipientName: 'Nature Island Careers Operations Team',
      subject: `[New Job Created] ${newJob.title} by ${newJob.company} (${newJob.parish})`,
      previewText: `New classified vacancy published: ${newJob.title} at ${newJob.company}. Salary: EC$${newJob.minSalary.toLocaleString()} - EC$${newJob.maxSalary.toLocaleString()}.`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #006b4d; margin: 0;">Nature Island Careers · Platform Administrator Alert</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Automatic Notification to Site Contact (${siteContactEmail})</p>
          </div>
          <p style="font-size: 14px; color: #1e293b;">A new job posting has just been published on Nature Island Careers:</p>
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
            Delivered automatically to site contact email (${siteContactEmail}) via Background Service.
          </p>
        </div>
      `,
      type: 'status_update',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
      relatedJobId: newJob.id,
    };
    dispatchEmail(siteAdminJobNotice);

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
    const updatedTimeline = [
      ...app.timeline,
      {
        date: nowTimestamp,
        action: `Status Changed to ${newStatus}`,
        note: customEmailMessage || `Status updated by recruiter.`,
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
      subject: `Status Update: ${app.jobTitle} at ${app.companyName} (${newStatus})`,
      previewText: `Your application status for ${app.jobTitle} has been updated to "${newStatus}".`,
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
          <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #006b4d; margin: 0;">${app.companyName}</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Application Status Update · Ref ${app.id}</p>
          </div>
          <p style="font-size: 15px; color: #1e293b;">Dear ${app.applicantName},</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            We are writing to inform you that your application for <strong>${app.jobTitle}</strong> has transitioned to:
          </p>
          <div style="background: #f0fdf4; border-left: 4px solid #006b4d; padding: 14px 18px; margin: 16px 0;">
            <strong style="color: #065f46; font-size: 16px;">${newStatus}</strong>
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
      frequency: data.frequency,
      enabled: true,
      alertPreferences: derivedRules,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setSubscriptionCriteria(updatedCriteria);
    saveSubscriptionCriteriaToStorage(updatedCriteria);

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
        // Invoices & Stripe Billing
        invoices,
        addInvoice,
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
        logoutUser,
        updateCurrentUser,
        isAdminLoggedIn,
        adminLogin,
        adminLogout,
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
        applications,
        myApplications,
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
