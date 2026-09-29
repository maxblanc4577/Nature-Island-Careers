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
  InterviewSlot,
  UserAccount,
  ClientSubscription,
  SubscriptionPlan,
} from '../types';
import {
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECRUITERS,
  INITIAL_SYNC_RECORDS,
  INITIAL_FEEDBACK,
  INITIAL_USERS,
} from '../data/mockData';

interface JobContextType {
  // Role & Recruiter
  activeRole: 'jobseeker' | 'recruiter' | 'admin';
  setActiveRole: (role: 'jobseeker' | 'recruiter' | 'admin') => void;
  currentRecruiter: RecruiterAccount;
  setCurrentRecruiterId: (id: string) => void;
  recruiters: RecruiterAccount[];

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

  // Bookmarks
  savedJobIds: string[];
  toggleSaveJob: (id: string) => void;
  isJobSaved: (id: string) => boolean;

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
  selectInterviewSlot: (appId: string, slotId: string, candidateNote?: string) => void;
  withdrawApplication: (appId: string) => void;

  // Real-time Email Notifications
  notifications: EmailNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  latestDispatchedEmail: EmailNotification | null;
  dismissLatestEmail: () => void;
  sendManualTestAlert: (targetEmail: string) => void;

  // Alerts Subscriptions
  alerts: JobAlertSubscription[];
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

  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dominica_saved_jobs');
    return saved ? JSON.parse(saved) : ['job-101', 'job-102'];
  });

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

  const [latestDispatchedEmail, setLatestDispatchedEmail] = useState<EmailNotification | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('dominica_jobs', JSON.stringify(jobs));
  }, [jobs]);

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
    localStorage.setItem('dominica_saved_jobs', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

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

  const toggleSaveJob = (id: string) => {
    setSavedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isJobSaved = (id: string) => savedJobIds.includes(id);

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

  const adminLogin = (email: string, pass: string) => {
    if (email.toLowerCase().includes('admin') || pass.length >= 4) {
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

    // Check alerts and notify matching subscribers in real-time
    const matchingAlerts = alerts.filter(
      (a) =>
        a.active &&
        (a.parishes.length === 0 || a.parishes.includes(newJob.parish)) &&
        (a.sectors.length === 0 || a.sectors.includes(newJob.sector))
    );

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
  };

  const updateJob = (id: string, updates: Partial<JobListing>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
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
    const updatedTimeline = [
      ...app.timeline,
      {
        date: nowTimestamp,
        action: `Interview Scheduled`,
        note: `${details.mode} on ${details.date} at ${details.time} (${details.location})`,
      },
    ];

    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: 'Interview Scheduled',
              interviewDetails: details,
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

  return (
    <JobContext.Provider
      value={{
        activeRole,
        setActiveRole,
        currentRecruiter,
        setCurrentRecruiterId,
        recruiters,
        // User Auth & Subscription
        currentUser,
        users,
        registerJobseeker,
        registerClient,
        subscribeClientPlan,
        loginUser,
        logoutUser,
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
        toggleSaveJob,
        isJobSaved,
        applications,
        myApplications,
        submitApplication,
        updateApplicationStatus,
        rateApplication,
        addApplicationNote,
        scheduleInterview,
        selectInterviewSlot,
        withdrawApplication,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        latestDispatchedEmail,
        dismissLatestEmail,
        sendManualTestAlert,
        alerts,
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
