export type Parish =
  | 'St. George'
  | 'St. John'
  | 'St. Paul'
  | 'St. Andrew'
  | 'St. Patrick'
  | 'St. Joseph'
  | 'St. David'
  | 'St. Luke'
  | 'St. Mark'
  | 'St. Peter'
  | 'Island-wide / Remote';

export type JobSector =
  | 'Eco-Tourism & Hospitality'
  | 'Renewable Energy & Geothermal'
  | 'Agriculture & Agro-Processing'
  | 'Healthcare & Medical'
  | 'Banking & Financial Services'
  | 'Information Technology & Digital'
  | 'Education & Training'
  | 'Logistics & Marine Services'
  | 'Public Sector & Cooperatives';

export type EmploymentType =
  | 'Full-Time'
  | 'Part-Time'
  | 'Contract'
  | 'Seasonal'
  | 'Apprenticeship / NEP';

export type WorkModel = 'On-site' | 'Hybrid' | 'Remote';

export type ApplicationStatus =
  | 'Applied'
  | 'Screened'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Offer Extended'
  | 'Hired'
  | 'Archived';

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: 'yes_no' | 'text';
  required: boolean;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  parish: Parish;
  locality: string; // e.g. "Roseau Waterfront", "Picard", "Canefield Industrial Area"
  sector: JobSector;
  employmentType: EmploymentType;
  workModel: WorkModel;
  minSalary: number; // in XCD
  maxSalary: number; // in XCD
  salaryPeriod: 'month' | 'year' | 'hour';
  isNepApproved: boolean; // National Employment Programme verified
  featured: boolean;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  screeningQuestions: ScreeningQuestion[];
  contactEmail: string;
  applicationDeadline: string;
  postedAt: string;
  viewsCount: number;
  applicantsCount: number;
  recruiterId: string;
  isRemoteAssignment?: boolean;
  projectDuration?: string;
  requiredSkills?: string[];
  // Global Remote Employer additions
  isGlobalRemote?: boolean;
  employerCountry?: string; // e.g. "United States", "United Kingdom", "Canada", "Worldwide", etc.
  timezoneRequirement?: string;
  currency?: 'XCD' | 'USD' | 'EUR' | 'GBP' | 'CAD';
}

export type SubscriptionPlan = 'Standard Local Employer' | 'Enterprise Growth Partner' | 'NEP Partner Tier';

export interface EmployerInvoice {
  id: string;
  recruiterId: string;
  companyName: string;
  invoiceNumber: string;
  date: string;
  plan: string;
  amountXCD: number;
  amountUSD: number;
  billingInterval: 'monthly' | 'one_time' | 'annual';
  status: 'Paid' | 'Processing' | 'Renewal Pending';
  paymentMethod: string;
  receiptUrl?: string;
  stripeSubscriptionId?: string;
  paymentIntentId?: string;
  timestamp?: string;
  stripeFeeXCD?: number;
  currency?: string;
}

export interface StripeSettings {
  mode: 'test' | 'live';
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currencyPeg: number;
  monthlyDiscountPercent: number;
  autoRenewEnabled: boolean;
  lastWebhookPing?: string;
}

export interface ClientSubscription {
  plan: SubscriptionPlan;
  priceXCD: number;
  status: 'active' | 'pending_payment' | 'expired';
  paymentMethod: 'National Bank of Dominica (NBD)' | 'Credit/Debit Card (XCD)' | 'Republic Bank / Wire';
  transactionRef: string;
  subscribedAt: string;
  renewsAt: string;
  quotaPostings: number;
  remoteWorkEnabled: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'jobseeker' | 'client' | 'admin';
  parish: Parish;
  phone?: string;
  // Jobseeker fields
  resumeFileName?: string;
  skills?: string[];
  careerSector?: JobSector;
  // Client fields
  companyName?: string;
  dssRegistrationNo?: string;
  subscription?: ClientSubscription;
  createdAt: string;
}

export interface ApplicationTimelineEvent {
  date: string;
  action: string;
  note?: string;
}

export interface InterviewDetails {
  date: string;
  time: string;
  location: string;
  mode: 'In-person' | 'Virtual Video Call';
  instructions?: string;
}

export interface InterviewSlot {
  id: string;
  date: string; // e.g. "Monday, Oct 5, 2026"
  time: string; // e.g. "10:00 AM AST"
  mode: 'In-person' | 'Virtual Video Call';
  location: string;
  interviewer: string;
  available: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
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
  status: ApplicationStatus;
  rating: number; // 0 to 5
  notes: string[];
  interviewDetails?: InterviewDetails;
  availableInterviewSlots?: InterviewSlot[];
  selectedSlotId?: string;
  appliedAt: string;
  timeline: ApplicationTimelineEvent[];
}

export interface SectorSalaryTrend {
  sector: JobSector;
  color: string;
  data: { month: string; monthLabel: string; avgSalary: number; vacanciesCount: number }[];
}

export interface ParishSalaryBenchmark {
  parish: Parish;
  minSalary: number;
  q1Salary: number;
  medianSalary: number;
  q3Salary: number;
  maxSalary: number;
  sampleCount: number;
  topSector: JobSector;
  costOfLivingIndex: number; // base 100
}

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  previewText: string;
  bodyHtml: string;
  type:
    | 'application_received'
    | 'status_update'
    | 'interview_invite'
    | 'job_alert'
    | 'recruiter_new_applicant'
    | 'feedback_received';
  timestamp: string;
  isRead: boolean;
  relatedJobId?: string;
}

export interface JobAlertSubscription {
  id: string;
  email: string;
  name: string;
  parishes: Parish[];
  sectors: JobSector[];
  keyword?: string;
  frequency: 'instant' | 'daily' | 'weekly';
  active: boolean;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  role: 'Job Seeker' | 'Employer / Recruiter' | 'General Public';
  category: 'Candidate Experience' | 'Recruiter Tools' | 'Listing Accuracy' | 'Labour Policy & Wages';
  rating: number; // 1 to 5
  message: string;
  parish?: Parish;
  submittedAt: string;
}

export interface RecruiterAccount {
  id: string;
  companyName: string;
  parish: Parish;
  locality: string;
  country?: string;
  isInternational?: boolean;
  industry: JobSector;
  verified: boolean;
  contactPerson: string;
  phone: string;
  email: string;
  dssRegistrationNo: string; // Dominica Social Security number
  nepPartner: boolean;
}

export interface DatabaseSyncRecord {
  id: string;
  targetSystem: 'Dominica Labour Division' | 'National Employment Programme (NEP)' | 'Dominica Social Security (DSS)';
  syncType: 'Export Vacancies' | 'Import NEP Trainees' | 'Bi-directional Reconcile';
  timestamp: string;
  recordsCount: number;
  status: 'Completed' | 'Pending' | 'Flagged';
  checksum: string;
}

// Resume Builder & Career Suite Types
export type ResumeTemplateLayout = 'modern' | 'classic' | 'creative';

export interface ResumeExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  highlights: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  graduationYear: string;
  honors?: string;
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  credentialId?: string;
}

export interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  parish: Parish;
  locality: string;
  dssNumber?: string; // Dominica Social Security / National ID
  portfolioUrl?: string;
  linkedinUrl?: string;
  summary: string;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  certifications: ResumeCertification[];
  languages: string[];
}

export interface ResumeVersion {
  id: string;
  title: string;
  targetSector: JobSector;
  layoutTemplate: ResumeTemplateLayout;
  data: ResumeData;
  updatedAt: string;
}

export interface NetworkingEvent {
  id: string;
  title: string;
  category: 'Career Fair' | 'Industry Meetup' | 'Workshop' | 'Tech & Innovation';
  date: string;
  time: string;
  venue: string;
  parish: Parish;
  organizer: string;
  description: string;
  isFree: boolean;
  attendeesCount: number;
  registrationUrl?: string;
  calendarStart: string; // ISO or YYYYMMDDTHHmmssZ
  calendarEnd: string;
}

export interface ResumeVersionHistoryEntry {
  version: string;
  timestamp: string;
  author: string;
  changeSummary: string;
  snapshotContent: string;
}

export interface ResumeLibraryDocument {
  id: string;
  title: string;
  docType: 'Resume' | 'Cover Letter';
  sector: JobSector;
  status: 'Active' | 'Draft' | 'Archived';
  currentVersion: string;
  lastModified: string;
  parish: Parish;
  tags: string[];
  content: string;
  versionHistory: ResumeVersionHistoryEntry[];
}


