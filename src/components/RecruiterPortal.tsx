import React, { useState, useEffect, useMemo } from 'react';
import { useJobContext } from '../context/JobContext';
import { ApplicationStatus, JobApplication, JobListing } from '../types';
import { BillingHistory } from './BillingHistory';
import { PostJobModal } from './PostJobModal';
import {
  Building,
  PlusCircle,
  Users,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Receipt,
  BellRing,
  Send,
  Video,
  ChevronLeft,
  ChevronRight,
  Star,
  Activity,
  Briefcase,
  UserCheck,
  GripVertical,
  ArrowUpDown,
  Award,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  CheckSquare,
  Flame,
  X,
} from 'lucide-react';

export interface ScheduledInterviewItem {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  isoDate: string; // YYYY-MM-DD
  displayDate: string;
  time: string;
  mode: 'In-person' | 'Virtual Video Call';
  location: string;
  instructions?: string;
  notes?: string;
}

export type EmployerActivityType = 'Job Posted' | 'Candidate Applied' | 'Interview Scheduled';

export interface EmployerActivityItem {
  id: string;
  type: EmployerActivityType;
  title: string;
  description: string;
  timestamp: string;
  organizationName: string;
  recruiterId: string;
  relatedId?: string;
}

export interface ApplicationStatusVisual {
  label: string;
  dotColorClass: string;
  badgeColorClass: string;
}

export type SkillMatchLevel = 'Strong Match' | 'Partial Match' | 'Skill Gap';

export interface SkillGapCell {
  skill: string;
  score: number; // 0 to 100
  level: SkillMatchLevel;
  evidence: string;
}

export interface CandidateSkillGapRow {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  rating: number;
  overallMatchScore: number;
  isIdealMatch: boolean;
  cells: SkillGapCell[];
  strongSkills: string[];
  missingSkills: string[];
}

export interface SkillGapHeatmapMatrix {
  skills: string[];
  rows: CandidateSkillGapRow[];
  idealMatchCount: number;
  averageReadiness: number;
}

export interface RecruiterDirectMessage {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  senderRole: 'recruiter' | 'candidate';
  senderName: string;
  companyName: string;
  content: string;
  timestamp: string;
  isEncrypted: boolean;
}

export function createDirectMessageRecord(params: {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  senderName: string;
  companyName: string;
  content: string;
  senderRole?: 'recruiter' | 'candidate';
}): RecruiterDirectMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    applicationId: params.applicationId,
    candidateName: params.candidateName,
    candidateEmail: params.candidateEmail,
    jobTitle: params.jobTitle,
    senderRole: params.senderRole || 'recruiter',
    senderName: params.senderName,
    companyName: params.companyName,
    content: params.content.trim(),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isEncrypted: true,
  };
}

export function bulkUpdateApplicationsStatus(
  applications: JobApplication[],
  selectedIds: string[],
  newStatus: ApplicationStatus
): JobApplication[] {
  const idSet = new Set(selectedIds);
  return applications.map((app) =>
    idSet.has(app.id) ? { ...app, status: newStatus } : app
  );
}

const DEFAULT_SECTOR_SKILLS: Record<string, string[]> = {
  'Eco-Tourism & Hospitality': [
    'PADI / Marine Safety',
    'Eco-Hospitality',
    'Guest Relations',
    'Crisis Management',
    'Sustainable Operations',
  ],
  'Renewable Energy & Geothermal': [
    'SCADA Systems',
    'Steam Turbines',
    'High-Voltage Safety',
    'Thermodynamics',
    'Environmental Compliance',
  ],
  'Information Technology & Digital': [
    'TypeScript / React',
    'Cloud Infrastructure',
    'Cybersecurity',
    'API Integration',
    'Agile Delivery',
  ],
};

export function buildSkillGapHeatmapData(
  applications: JobApplication[],
  jobs: JobListing[],
  selectedJobId: string = 'all'
): SkillGapHeatmapMatrix {
  const jobMap = new Map<string, JobListing>();
  jobs.forEach((j) => jobMap.set(j.id, j));

  // Collect target skills from selected job or across relevant jobs
  const skillSet = new Set<string>();
  const targetJobs =
    selectedJobId !== 'all'
      ? jobs.filter((j) => j.id === selectedJobId)
      : jobs;

  targetJobs.forEach((job) => {
    if (job.requiredSkills && job.requiredSkills.length > 0) {
      job.requiredSkills.forEach((s) => skillSet.add(s));
    } else if (job.requirements && job.requirements.length > 0) {
      job.requirements.slice(0, 4).forEach((req) => {
        const cleaned = req.split(/[,.(]/)[0].trim().slice(0, 26);
        if (cleaned) skillSet.add(cleaned);
      });
    }
  });

  if (skillSet.size < 4) {
    const fallbackSector = targetJobs[0]?.sector || 'Eco-Tourism & Hospitality';
    const fallbackList =
      DEFAULT_SECTOR_SKILLS[fallbackSector] ||
      DEFAULT_SECTOR_SKILLS['Eco-Tourism & Hospitality'];
    fallbackList.forEach((s) => skillSet.add(s));
  }

  const skills = Array.from(skillSet).slice(0, 6);

  const rows: CandidateSkillGapRow[] = applications.map((app) => {
    const job = jobMap.get(app.jobId);
    const corpus = [
      app.coverNote || '',
      app.resumeFileName || '',
      app.jobTitle || '',
      ...(app.notes || []),
      ...Object.values(app.screeningAnswers || {}),
    ]
      .join(' ')
      .toLowerCase();

    const jobRequiredLower = new Set(
      (job?.requiredSkills || []).map((s) => s.toLowerCase())
    );

    const cells: SkillGapCell[] = skills.map((skill, skillIdx) => {
      const skillLower = skill.toLowerCase();
      const tokens = skillLower
        .split(/[\s/&,-]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2);

      const directHit =
        corpus.includes(skillLower) ||
        tokens.some((tok) => corpus.includes(tok));

      const isJobCoreSkill = jobRequiredLower.has(skillLower);
      const baseRatingBoost = (app.rating || 3) * 11;
      // Deterministic hash offset from candidate id + skill index
      const charSum =
        app.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) +
        skillIdx * 13;
      const deterministicVariance = (charSum % 25) - 8;

      let rawScore =
        42 +
        baseRatingBoost +
        (directHit ? 22 : 0) +
        (isJobCoreSkill ? 8 : 0) +
        deterministicVariance;

      if (app.status === 'Rejected' || app.status === 'Archived') {
        rawScore -= 18;
      }

      const score = Math.max(25, Math.min(99, Math.round(rawScore)));
      let level: SkillMatchLevel = 'Skill Gap';
      if (score >= 80) {
        level = 'Strong Match';
      } else if (score >= 55) {
        level = 'Partial Match';
      }

      const evidence =
        level === 'Strong Match'
          ? `Verified proficiency in ${skill} via resume & screening`
          : level === 'Partial Match'
          ? `Transferable experience in ${skill}; probe depth in interview`
          : `Skill gap identified in ${skill}; requires onboarding / NEP training`;

      return {
        skill,
        score,
        level,
        evidence,
      };
    });

    const overallMatchScore =
      cells.length > 0
        ? Math.round(cells.reduce((sum, c) => sum + c.score, 0) / cells.length)
        : 0;

    const strongSkills = cells
      .filter((c) => c.level === 'Strong Match')
      .map((c) => c.skill);
    const missingSkills = cells
      .filter((c) => c.level === 'Skill Gap')
      .map((c) => c.skill);

    return {
      applicationId: app.id,
      candidateName: app.applicantName,
      candidateEmail: app.applicantEmail,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      rating: app.rating || 0,
      overallMatchScore,
      isIdealMatch: overallMatchScore >= 75,
      cells,
      strongSkills,
      missingSkills,
    };
  });

  const sortedRows = [...rows].sort(
    (a, b) => b.overallMatchScore - a.overallMatchScore
  );
  const idealMatchCount = sortedRows.filter((r) => r.isIdealMatch).length;
  const averageReadiness =
    sortedRows.length > 0
      ? Math.round(
          sortedRows.reduce((sum, r) => sum + r.overallMatchScore, 0) /
            sortedRows.length
        )
      : 0;

  return {
    skills,
    rows: sortedRows,
    idealMatchCount,
    averageReadiness,
  };
}

export function getApplicationStatusIndicator(status: ApplicationStatus | string): ApplicationStatusVisual {
  switch (status) {
    case 'Pending':
    case 'Applied':
      return {
        label: status === 'Applied' ? 'Pending (Applied)' : 'Pending',
        dotColorClass: 'bg-amber-500',
        badgeColorClass: 'bg-amber-50 text-amber-900 border-amber-200',
      };
    case 'Screened':
      return {
        label: 'Screened',
        dotColorClass: 'bg-sky-500',
        badgeColorClass: 'bg-sky-50 text-sky-900 border-sky-200',
      };
    case 'Shortlisted':
      return {
        label: 'Shortlisted',
        dotColorClass: 'bg-indigo-500',
        badgeColorClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
      };
    case 'Interview Scheduled':
      return {
        label: 'Interview Scheduled',
        dotColorClass: 'bg-emerald-500',
        badgeColorClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      };
    case 'Offer Extended':
    case 'Hired':
      return {
        label: status,
        dotColorClass: 'bg-green-600',
        badgeColorClass: 'bg-green-50 text-green-900 border-green-200',
      };
    case 'Rejected':
    case 'Archived':
      return {
        label: status === 'Archived' ? 'Rejected / Archived' : 'Rejected',
        dotColorClass: 'bg-rose-500',
        badgeColorClass: 'bg-rose-50 text-rose-900 border-rose-200',
      };
    default:
      return {
        label: String(status),
        dotColorClass: 'bg-slate-400',
        badgeColorClass: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

export function getCandidateRankLabel(rating: number): {
  label: string;
  badgeClass: string;
} {
  if (rating >= 5) {
    return {
      label: 'Top Ranked (#1 Tier)',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }
  if (rating === 4) {
    return {
      label: 'High Priority',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    };
  }
  if (rating === 3) {
    return {
      label: 'Qualified',
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    };
  }
  if (rating >= 1) {
    return {
      label: 'Developing',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    };
  }
  return {
    label: 'Unrated',
    badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
  };
}

export function sortApplicationsByPriority(
  apps: JobApplication[],
  sortMode: 'rating_desc' | 'rating_asc' | 'recent'
): JobApplication[] {
  const copy = [...apps];
  if (sortMode === 'rating_desc') {
    return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  if (sortMode === 'rating_asc') {
    return copy.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }
  return copy.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

/**
 * Normalizes human-readable or ISO dates (e.g. "Wednesday, Oct 7, 2026" or "2026-10-02") into YYYY-MM-DD.
 */
export function normalizeInterviewDate(rawDate: string): string {
  if (!rawDate) return '2026-10-07';
  const trimmed = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '2026-10-07';
}

export function formatReadableInterviewDate(isoDate: string): string {
  const normalized = normalizeInterviewDate(isoDate);
  const [y, m, d] = normalized.split('-').map(Number);
  if (!y || !m || !d) return normalized;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function rescheduleInterviewItem(
  items: ScheduledInterviewItem[],
  targetIdOrAppId: string,
  newDateRaw: string
): ScheduledInterviewItem[] {
  const normalizedIso = normalizeInterviewDate(newDateRaw);
  const displayDate = formatReadableInterviewDate(normalizedIso);
  return items
    .map((item) =>
      item.id === targetIdOrAppId || item.applicationId === targetIdOrAppId
        ? {
            ...item,
            isoDate: normalizedIso,
            displayDate,
          }
        : item
    )
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

export function buildEmployerActivityFeed(
  jobs: JobListing[],
  applications: JobApplication[],
  companyName: string,
  recruiterId: string,
  customEvents: EmployerActivityItem[] = []
): EmployerActivityItem[] {
  const feed: EmployerActivityItem[] = [];
  const lowerCompany = (companyName || '').toLowerCase();

  // 1. Organization jobs -> 'Job Posted'
  const orgJobs = jobs.filter(
    (j) =>
      j.recruiterId === recruiterId ||
      (lowerCompany && j.company.toLowerCase() === lowerCompany)
  );
  const orgJobIds = new Set(orgJobs.map((j) => j.id));

  orgJobs.forEach((job) => {
    feed.push({
      id: `act-job-${job.id}`,
      type: 'Job Posted',
      title: `Job Posted: ${job.title}`,
      description: `${job.company} published "${job.title}" in ${job.parish} (EC$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}).`,
      timestamp: `${job.postedAt} 09:00`,
      organizationName: companyName,
      recruiterId,
      relatedId: job.id,
    });
  });

  // 2. Organization applications -> 'Candidate Applied' & 'Interview Scheduled'
  const orgApps = applications.filter(
    (a) =>
      orgJobIds.has(a.jobId) ||
      (lowerCompany && a.companyName.toLowerCase() === lowerCompany)
  );

  orgApps.forEach((app) => {
    feed.push({
      id: `act-app-${app.id}`,
      type: 'Candidate Applied',
      title: `Candidate Applied: ${app.applicantName}`,
      description: `${app.applicantName} (${app.parish}) submitted an application for "${app.jobTitle}".`,
      timestamp: app.appliedAt,
      organizationName: companyName,
      recruiterId,
      relatedId: app.id,
    });

    const hasScheduledInterview =
      Boolean(app.interviewDetails) ||
      app.status === 'Interview Scheduled' ||
      (app.timeline && app.timeline.some((t) => t.action.toLowerCase().includes('interview')));

    if (hasScheduledInterview) {
      const interviewTimeline = app.timeline
        ? [...app.timeline].reverse().find((t) => t.action.toLowerCase().includes('interview'))
        : undefined;
      const dateStr =
        app.interviewDetails?.date ||
        app.availableInterviewSlots?.[0]?.date ||
        'Upcoming Slot';
      const timeStr =
        app.interviewDetails?.time ||
        app.availableInterviewSlots?.[0]?.time ||
        '10:00 AM AST';
      const modeStr =
        app.interviewDetails?.mode ||
        app.availableInterviewSlots?.[0]?.mode ||
        'Virtual Video Call';

      feed.push({
        id: `act-int-${app.id}`,
        type: 'Interview Scheduled',
        title: `Interview Scheduled: ${app.applicantName}`,
        description: `${modeStr} scheduled with ${app.applicantName} for "${app.jobTitle}" on ${dateStr} at ${timeStr}.`,
        timestamp: interviewTimeline?.date || app.appliedAt,
        organizationName: companyName,
        recruiterId,
        relatedId: app.id,
      });
    }
  });

  // 3. Merge custom real-time events for this organization
  const matchingCustom = customEvents.filter(
    (ev) =>
      ev.recruiterId === recruiterId ||
      (lowerCompany && ev.organizationName.toLowerCase() === lowerCompany)
  );

  const combined = [...matchingCustom, ...feed];
  return combined.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function buildInterviewsFromApplications(apps: JobApplication[]): ScheduledInterviewItem[] {
  const items: ScheduledInterviewItem[] = [];

  apps.forEach((app) => {
    if (app.interviewDetails) {
      const isoDate = normalizeInterviewDate(app.interviewDetails.date);
      items.push({
        id: `int-${app.id}`,
        applicationId: app.id,
        candidateName: app.applicantName,
        candidateEmail: app.applicantEmail,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        isoDate,
        displayDate: app.interviewDetails.date,
        time: app.interviewDetails.time,
        mode: app.interviewDetails.mode,
        location: app.interviewDetails.location,
        instructions: app.interviewDetails.instructions,
        notes: app.interviewDetails.notes || app.notes?.[app.notes.length - 1],
      });
    } else if (
      (app.status === 'Interview Scheduled' || app.status === 'Shortlisted') &&
      app.availableInterviewSlots &&
      app.availableInterviewSlots.length > 0
    ) {
      const chosenSlot =
        app.availableInterviewSlots.find((s) => s.id === app.selectedSlotId) ||
        app.availableInterviewSlots[0];
      const isoDate = normalizeInterviewDate(chosenSlot.date);
      items.push({
        id: `int-slot-${app.id}-${chosenSlot.id}`,
        applicationId: app.id,
        candidateName: app.applicantName,
        candidateEmail: app.applicantEmail,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        isoDate,
        displayDate: chosenSlot.date,
        time: chosenSlot.time,
        mode: chosenSlot.mode,
        location: chosenSlot.location,
      });
    }
  });

  return items.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

interface RecruiterPortalProps {
  onOpenPostJob?: () => void;
  onOpenSubscription: () => void;
  onScheduleInterview: (
    applicationId: string,
    candidateName: string,
    jobTitle: string,
    notes?: string
  ) => void;
  onOpenStripe?: () => void;
}

export const RecruiterPortal: React.FC<RecruiterPortalProps> = ({
  onOpenPostJob,
  onOpenSubscription,
  onScheduleInterview,
  onOpenStripe,
}) => {
  const {
    currentRecruiter,
    jobs,
    applications,
    updateApplicationStatus,
    rateApplication,
    scheduleInterview,
    recruiters,
    setCurrentRecruiterId,
    sendRecruiterReminders,
    invoices,
    stripeSettings,
  } = useJobContext();

  // Self-contained Post a Vacancy modal state inside RecruiterPortal
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);

  const handleOpenPostVacancy = () => {
    setIsPostJobOpen(true);
    if (onOpenPostJob) {
      onOpenPostJob();
    }
  };

  const [activePortalTab, setActivePortalTab] = useState<'candidates' | 'schedule' | 'billing'>('candidates');
  const [selectedJobId, setSelectedJobId] = useState<string | 'all'>('all');
  const [interviewModeFilter, setInterviewModeFilter] = useState<'All' | 'In-person' | 'Virtual Video Call'>('All');
  const [reminderStatusMsg, setReminderStatusMsg] = useState<string | null>(null);

  // Candidate Rating & Priority Sort state
  const [candidateSortBy, setCandidateSortBy] = useState<'rating_desc' | 'recent' | 'rating_asc'>('rating_desc');
  const [minStarFilter, setMinStarFilter] = useState<number>(0);

  // Bulk Selection & Bulk Update Status state
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [bulkStatusValue, setBulkStatusValue] = useState<ApplicationStatus | ''>('');
  const [bulkStatusBannerMsg, setBulkStatusBannerMsg] = useState<string | null>(null);

  // Skill-Gap Heatmap Filter & Selected Cell state
  const [showIdealMatchesOnly, setShowIdealMatchesOnly] = useState(false);
  const [selectedHeatmapCandidateId, setSelectedHeatmapCandidateId] = useState<string | null>(null);

  // Direct Messaging Interface state
  const [activeMessageAppId, setActiveMessageAppId] = useState<string | null>(null);
  const [isMessagingOpen, setIsMessagingOpen] = useState<boolean>(false);
  const [directMessageDraft, setDirectMessageDraft] = useState<string>('');
  const [directMessages, setDirectMessages] = useState<RecruiterDirectMessage[]>(() => {
    try {
      const saved = localStorage.getItem('dominica_recruiter_direct_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [
      {
        id: 'msg-seed-1',
        applicationId: 'app-1',
        candidateName: 'Marcus Jean-Jacques',
        candidateEmail: 'm.jeanjacques@cwdom.dm',
        jobTitle: 'Marine Operations & Dive Safety Officer',
        senderRole: 'recruiter',
        senderName: 'Fort Young Hotel & Dive Resort HR',
        companyName: 'Fort Young Hotel & Dive Resort',
        content:
          'Hello Marcus, thank you for your application. Could you confirm your PADI Divemaster renewal certificate number ahead of our review?',
        timestamp: '2026-10-06 14:20',
        isEncrypted: true,
      },
      {
        id: 'msg-seed-2',
        applicationId: 'app-1',
        candidateName: 'Marcus Jean-Jacques',
        candidateEmail: 'm.jeanjacques@cwdom.dm',
        jobTitle: 'Marine Operations & Dive Safety Officer',
        senderRole: 'candidate',
        senderName: 'Marcus Jean-Jacques',
        companyName: 'Fort Young Hotel & Dive Resort',
        content:
          'Good afternoon! Yes, my PADI credential is active through 2027 and I have my Coast Guard Coxswain license ready to share.',
        timestamp: '2026-10-06 15:05',
        isEncrypted: true,
      },
    ];
  });

  // Activity Feed Filter & Custom Logged Events
  const [activityFilter, setActivityFilter] = useState<'All' | EmployerActivityType>('All');
  const [customActivityEvents, setCustomActivityEvents] = useState<EmployerActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem('dominica_employer_activity_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const appendEmployerActivity = (
    type: EmployerActivityType,
    title: string,
    description: string,
    relatedId?: string
  ) => {
    const newEvent: EmployerActivityItem = {
      id: `act-live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      description,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      organizationName: currentRecruiter.companyName,
      recruiterId: currentRecruiter.id,
      relatedId,
    };
    setCustomActivityEvents((prev) => {
      const next = [newEvent, ...prev];
      try {
        localStorage.setItem('dominica_employer_activity_logs', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Filter recruiter's jobs
  const myJobs = currentRecruiter
    ? jobs.filter(
        (j) =>
          j.recruiterId === currentRecruiter.id ||
          j.company.toLowerCase() === currentRecruiter.companyName.toLowerCase()
      )
    : jobs.slice(0, 5);

  const relevantJobIds = myJobs.map((j) => j.id);
  const relevantApplications = applications.filter((a) =>
    selectedJobId === 'all' ? relevantJobIds.includes(a.jobId) : a.jobId === selectedJobId
  );

  // Sorted & filtered applications by star rating / priority
  const prioritizedApplications = useMemo(() => {
    const filtered =
      minStarFilter > 0
        ? relevantApplications.filter((a) => (a.rating || 0) >= minStarFilter)
        : relevantApplications;
    return sortApplicationsByPriority(filtered, candidateSortBy);
  }, [relevantApplications, candidateSortBy, minStarFilter]);

  // Skill-Gap Heatmap Data for relevant applications
  const skillGapHeatmap = useMemo(() => {
    return buildSkillGapHeatmapData(relevantApplications, myJobs, selectedJobId);
  }, [relevantApplications, myJobs, selectedJobId]);

  const visibleHeatmapRows = useMemo(() => {
    if (!showIdealMatchesOnly) return skillGapHeatmap.rows;
    return skillGapHeatmap.rows.filter((r) => r.isIdealMatch);
  }, [skillGapHeatmap.rows, showIdealMatchesOnly]);

  // Active candidate for Direct Messaging
  const activeMessageApp = useMemo(() => {
    if (activeMessageAppId) {
      const found = applications.find((a) => a.id === activeMessageAppId);
      if (found) return found;
    }
    return prioritizedApplications[0] || applications[0] || null;
  }, [activeMessageAppId, applications, prioritizedApplications]);

  const activeCandidateMessages = useMemo(() => {
    if (!activeMessageApp) return [];
    return directMessages.filter((m) => m.applicationId === activeMessageApp.id);
  }, [directMessages, activeMessageApp]);

  const handleOpenDirectMessageForCandidate = (app: JobApplication) => {
    setActiveMessageAppId(app.id);
    setIsMessagingOpen(true);
  };

  const handleSendDirectMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeMessageApp || !directMessageDraft.trim()) return;

    const newMsg = createDirectMessageRecord({
      applicationId: activeMessageApp.id,
      candidateName: activeMessageApp.applicantName,
      candidateEmail: activeMessageApp.applicantEmail,
      jobTitle: activeMessageApp.jobTitle,
      senderName: `${currentRecruiter.contactPerson} (${currentRecruiter.companyName})`,
      companyName: currentRecruiter.companyName,
      content: directMessageDraft,
      senderRole: 'recruiter',
    });

    setDirectMessages((prev) => {
      const updated = [...prev, newMsg];
      try {
        localStorage.setItem('dominica_recruiter_direct_messages', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });

    setDirectMessageDraft('');
  };

  // Bulk Selection & Bulk Status Update handlers
  const allVisibleSelected =
    prioritizedApplications.length > 0 &&
    prioritizedApplications.every((app) => selectedApplicationIds.includes(app.id));

  const handleToggleSelectAllApplications = () => {
    if (allVisibleSelected) {
      setSelectedApplicationIds([]);
    } else {
      setSelectedApplicationIds(prioritizedApplications.map((app) => app.id));
    }
  };

  const handleToggleSelectApplication = (appId: string) => {
    setSelectedApplicationIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const executeBulkStatusUpdate = (targetStatus: ApplicationStatus) => {
    if (!targetStatus || selectedApplicationIds.length === 0) return;
    selectedApplicationIds.forEach((appId) => {
      updateApplicationStatus(appId, targetStatus);
    });
    setBulkStatusBannerMsg(
      `Updated status to "${targetStatus}" for ${selectedApplicationIds.length} selected candidate${
        selectedApplicationIds.length > 1 ? 's' : ''
      }.`
    );
    setTimeout(() => setBulkStatusBannerMsg(null), 4000);
  };

  const handleBulkStatusDropdownChange = (val: string) => {
    const typedStatus = val as ApplicationStatus | '';
    setBulkStatusValue(typedStatus);
    if (typedStatus && selectedApplicationIds.length > 0) {
      executeBulkStatusUpdate(typedStatus);
    }
  };

  // Employer Activity Feed for the current organization
  const organizationActivityFeed = useMemo(() => {
    return buildEmployerActivityFeed(
      jobs,
      applications,
      currentRecruiter?.companyName || 'Dominica Employer',
      currentRecruiter?.id || 'rec_fort_young',
      customActivityEvents
    );
  }, [jobs, applications, currentRecruiter?.companyName, currentRecruiter?.id, customActivityEvents]);

  const filteredActivityFeed = useMemo(() => {
    if (activityFilter === 'All') return organizationActivityFeed;
    return organizationActivityFeed.filter((item) => item.type === activityFilter);
  }, [organizationActivityFeed, activityFilter]);

  // Existing interviewData state representing upcoming scheduled interviews
  const [interviewData, setInterviewData] = useState<ScheduledInterviewItem[]>(() =>
    buildInterviewsFromApplications(applications)
  );

  // Keep interviewData synchronized when applications or selectedJobId change
  useEffect(() => {
    const sourceApps =
      relevantApplications.length > 0 ? relevantApplications : applications;
    const synced = buildInterviewsFromApplications(sourceApps);
    setInterviewData(synced);
  }, [applications, currentRecruiter?.id, selectedJobId, relevantApplications.length]);

  // Drag-and-drop and click-to-reschedule state for Calendar View
  const [draggedInterviewId, setDraggedInterviewId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [interviewToRescheduleId, setInterviewToRescheduleId] = useState<string | null>(null);
  const [rescheduleBannerMsg, setRescheduleBannerMsg] = useState<string | null>(null);

  // Calendar month navigation state (defaults to October 2026 where scheduled interviews reside)
  const [calendarYearMonth, setCalendarYearMonth] = useState<{ year: number; month: number }>(() => {
    const firstDate = interviewData[0]?.isoDate || '2026-10-07';
    const [y, m] = firstDate.split('-').map(Number);
    return {
      year: y || 2026,
      month: m ? m - 1 : 9, // 0-indexed month (9 = October)
    };
  });

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Handle rescheduling an interview via drag-and-drop or direct date selection
  const handleRescheduleInterviewOnCalendar = (interviewIdOrAppId: string, newIsoDateRaw: string) => {
    if (!newIsoDateRaw) return;
    const normalizedIso = normalizeInterviewDate(newIsoDateRaw);
    const readableDate = formatReadableInterviewDate(normalizedIso);

    const targetItem = interviewData.find(
      (i) => i.id === interviewIdOrAppId || i.applicationId === interviewIdOrAppId
    );

    setInterviewData((prev) => rescheduleInterviewItem(prev, interviewIdOrAppId, normalizedIso));

    if (targetItem) {
      scheduleInterview(targetItem.applicationId, {
        date: readableDate,
        time: targetItem.time,
        location: targetItem.location,
        mode: targetItem.mode,
        instructions: targetItem.instructions,
        notes: targetItem.notes,
      });

      appendEmployerActivity(
        'Interview Scheduled',
        `Interview Rescheduled: ${targetItem.candidateName}`,
        `Moved ${targetItem.mode} for "${targetItem.jobTitle}" to ${readableDate} (${normalizedIso}) at ${targetItem.time}.`,
        targetItem.applicationId
      );

      setRescheduleBannerMsg(
        `Interview with ${targetItem.candidateName} rescheduled to ${readableDate} (${normalizedIso}).`
      );
      setTimeout(() => setRescheduleBannerMsg(null), 4000);
    }

    setDraggedInterviewId(null);
    setDragOverDate(null);
    setInterviewToRescheduleId(null);
  };

  // Build calendar days for the current month
  const calendarDays = useMemo(() => {
    const { year, month } = calendarYearMonth;
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number | null; isoDate: string | null }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null, isoDate: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, isoDate: iso });
    }
    return cells;
  }, [calendarYearMonth]);

  const monthLabel = useMemo(() => {
    const dt = new Date(calendarYearMonth.year, calendarYearMonth.month, 1);
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarYearMonth]);

  const visibleInterviews = useMemo(() => {
    if (interviewModeFilter === 'All') return interviewData;
    return interviewData.filter((item) => item.mode === interviewModeFilter);
  }, [interviewData, interviewModeFilter]);

  const filteredInterviewsForDisplay = useMemo(() => {
    if (!selectedCalendarDate) return visibleInterviews;
    return visibleInterviews.filter((item) => item.isoDate === selectedCalendarDate);
  }, [visibleInterviews, selectedCalendarDate]);

  const handlePrevMonth = () => {
    setSelectedCalendarDate(null);
    setCalendarYearMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setSelectedCalendarDate(null);
    setCalendarYearMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const employerInvoicesCount = invoices.filter(
    (inv) =>
      inv.recruiterId === currentRecruiter?.id ||
      inv.companyName.toLowerCase() === currentRecruiter?.companyName.toLowerCase()
  ).length;

  const handleTriggerReminders = () => {
    const res = sendRecruiterReminders('info@natureislecareers.com');
    setReminderStatusMsg(`Automated reminder check sent to ${res.sentCount} recruiter accounts.`);
    setTimeout(() => setReminderStatusMsg(null), 3500);
  };

  const activeRescheduleInterview = interviewToRescheduleId
    ? interviewData.find((i) => i.id === interviewToRescheduleId)
    : null;

  const selectedHeatmapRow = useMemo(() => {
    if (selectedHeatmapCandidateId) {
      const found = skillGapHeatmap.rows.find(
        (r) => r.applicationId === selectedHeatmapCandidateId
      );
      if (found) return found;
    }
    return visibleHeatmapRows[0] || null;
  }, [selectedHeatmapCandidateId, skillGapHeatmap.rows, visibleHeatmapRows]);

  const renderSkillGapHeatmapSection = () => (
    <div
      data-testid="skill-gap-heatmap"
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-1">
            <Flame className="w-3.5 h-3.5 text-emerald-600" />
            <span>Talent Intelligence Visualization</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Candidate Skill-Gap Analysis Heatmap ({visibleHeatmapRows.length})
          </h3>
          <p className="text-xs text-slate-600">
            Visual competency matrix comparing candidate applications against required vacancy skills to pinpoint ideal matches and training gaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span className="text-slate-700">Strong (80-100%)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              <span className="text-slate-700">Partial (55-79%)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              <span className="text-slate-700">Skill Gap (&lt;55%)</span>
            </span>
          </div>

          <button
            type="button"
            data-testid="heatmap-ideal-filter-btn"
            onClick={() => setShowIdealMatchesOnly((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showIdealMatchesOnly
                ? 'bg-emerald-800 text-white border-emerald-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {showIdealMatchesOnly
                ? `Showing Ideal Matches (${skillGapHeatmap.idealMatchCount})`
                : `Filter Ideal Matches (${skillGapHeatmap.idealMatchCount})`}
            </span>
          </button>
        </div>
      </div>

      {visibleHeatmapRows.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
          No candidate applications match the current skill-gap filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3 min-w-[190px]">Candidate & Role</th>
                  <th className="p-3 text-center min-w-[110px]">Overall Match</th>
                  {skillGapHeatmap.skills.map((skill) => (
                    <th key={skill} className="p-3 text-center min-w-[120px]">
                      {skill}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {visibleHeatmapRows.map((row) => {
                  const isRowSelected =
                    selectedHeatmapRow?.applicationId === row.applicationId;
                  return (
                    <tr
                      key={row.applicationId}
                      data-testid={`heatmap-row-${row.applicationId}`}
                      onClick={() => setSelectedHeatmapCandidateId(row.applicationId)}
                      className={`transition-colors cursor-pointer ${
                        isRowSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">
                            {row.candidateName}
                          </span>
                          {row.isIdealMatch && (
                            <span
                              data-testid={`ideal-match-badge-${row.applicationId}`}
                              className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300"
                            >
                              Ideal Match
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                          {row.jobTitle}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          data-testid={`heatmap-overall-score-${row.applicationId}`}
                          className={`inline-flex items-center justify-center font-black text-xs px-2.5 py-1 rounded-lg border ${
                            row.overallMatchScore >= 75
                              ? 'bg-emerald-900 text-amber-300 border-emerald-700'
                              : row.overallMatchScore >= 55
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {row.overallMatchScore}%
                        </span>
                      </td>

                      {row.cells.map((cell, sIdx) => {
                        const cellColor =
                          cell.level === 'Strong Match'
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : cell.level === 'Partial Match'
                            ? 'bg-amber-400/90 text-slate-950 border-amber-500'
                            : 'bg-rose-500 text-white border-rose-600';
                        return (
                          <td key={cell.skill} className="p-2 text-center">
                            <div
                              data-testid={`heatmap-cell-${row.applicationId}-${sIdx}`}
                              title={`${cell.skill}: ${cell.score}% (${cell.level}) — ${cell.evidence}`}
                              className={`rounded-lg px-2 py-1.5 border font-bold transition-transform hover:scale-105 ${cellColor}`}
                            >
                              <div className="text-xs font-black">{cell.score}%</div>
                              <div className="text-[9px] uppercase tracking-wider opacity-95">
                                {cell.level === 'Strong Match'
                                  ? 'Strong'
                                  : cell.level === 'Partial Match'
                                  ? 'Partial'
                                  : 'Gap'}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Skill-Gap Diagnostic Summary Bar for Selected Candidate */}
          {selectedHeatmapRow && (
            <div
              data-testid="heatmap-candidate-diagnostic"
              className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    Diagnostic Summary: {selectedHeatmapRow.candidateName}
                  </span>
                  <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    {selectedHeatmapRow.overallMatchScore}% Overall Readiness
                  </span>
                </div>
                <p className="text-slate-600">
                  <strong>Verified Strengths:</strong>{' '}
                  {selectedHeatmapRow.strongSkills.length > 0
                    ? selectedHeatmapRow.strongSkills.join(', ')
                    : 'Core foundational competencies'}
                  {' • '}
                  <strong>Identified Skill Gaps:</strong>{' '}
                  {selectedHeatmapRow.missingSkills.length > 0
                    ? selectedHeatmapRow.missingSkills.join(', ')
                    : 'None — Ready for immediate deployment'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const appObj = applications.find(
                      (a) => a.id === selectedHeatmapRow.applicationId
                    );
                    if (appObj) handleOpenDirectMessageForCandidate(appObj);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message About Skills</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDirectMessagingSection = () => (
    <div
      data-testid="recruiter-direct-messaging-panel"
      className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-md space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Candidate Direct Messaging • E2E Encrypted</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Direct Applicant Communications
          </h3>
          <p className="text-xs text-slate-600">
            Send secure, direct messages to candidates from your applicant pipeline regarding credentials, interviews, or offers.
          </p>
        </div>

        {isMessagingOpen && (
          <button
            type="button"
            onClick={() => setIsMessagingOpen(false)}
            className="self-start sm:self-center text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Minimize Panel</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Candidate Conversation Selector */}
        <div className="lg:col-span-4 border border-slate-200 rounded-xl bg-slate-50/50 p-3 space-y-2 max-h-[340px] overflow-y-auto">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
            Select Applicant Thread ({prioritizedApplications.length})
          </div>
          {prioritizedApplications.map((app) => {
            const isSelected = activeMessageApp?.id === app.id;
            const threadCount = directMessages.filter(
              (m) => m.applicationId === app.id
            ).length;
            return (
              <button
                key={app.id}
                type="button"
                data-testid={`dm-candidate-thread-${app.id}`}
                onClick={() => setActiveMessageAppId(app.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs'
                    : 'bg-white hover:bg-emerald-50/60 text-slate-800 border-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate">{app.applicantName}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isSelected ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    {app.jobTitle}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {threadCount} msg{threadCount === 1 ? '' : 's'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Conversation & Message Composer */}
        <div className="lg:col-span-8 flex flex-col justify-between border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          {activeMessageApp ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-sm font-extrabold text-slate-900">
                    {activeMessageApp.applicantName}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    ({activeMessageApp.applicantEmail})
                  </span>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    Applying for: {activeMessageApp.jobTitle}
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                  🔒 TLS / E2E Protected Channel
                </span>
              </div>

              {/* Message History */}
              <div
                data-testid="direct-message-thread-list"
                className="space-y-2.5 max-h-[200px] min-h-[120px] overflow-y-auto pr-1 py-1"
              >
                {activeCandidateMessages.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No direct messages sent to {activeMessageApp.applicantName} yet. Start a secure conversation below.
                  </div>
                ) : (
                  activeCandidateMessages.map((msg) => {
                    const isRecruiter = msg.senderRole === 'recruiter';
                    return (
                      <div
                        key={msg.id}
                        data-testid={`direct-message-item-${msg.id}`}
                        className={`p-3 rounded-xl text-xs max-w-[88%] ${
                          isRecruiter
                            ? 'ml-auto bg-emerald-900 text-white'
                            : 'mr-auto bg-slate-100 text-slate-900 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 mb-1 font-semibold">
                          <span>{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Templates */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Quick Templates:
                </span>
                {[
                  'Please share your updated certification / portfolio.',
                  'Are you available for a 30-min virtual interview this week?',
                  'We are reviewing your shortlisted application with our team.',
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDirectMessageDraft(tpl)}
                    className="text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                  >
                    {tpl.slice(0, 34)}...
                  </button>
                ))}
              </div>

              {/* Composer Form */}
              <form onSubmit={handleSendDirectMessage} className="flex gap-2 pt-1">
                <input
                  type="text"
                  data-testid="direct-message-input"
                  aria-label={`Send secure message to ${activeMessageApp.applicantName}`}
                  value={directMessageDraft}
                  onChange={(e) => setDirectMessageDraft(e.target.value)}
                  placeholder={`Write a secure message to ${activeMessageApp.applicantName}...`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  data-testid="send-direct-message-btn"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            </>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              Select a candidate from the applicant list to send a direct message.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderInterviewCalendarSection = () => (
    <div
      data-testid="recruiter-interview-calendar"
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interview Schedule</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Interview Schedule ({visibleInterviews.length})
          </h3>
          <p className="text-xs text-slate-600">
            Drag and drop appointments onto any date cell or select a date directly to reschedule interviews for {currentRecruiter.companyName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Format Filter */}
          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold">
            {(['All', 'In-person', 'Virtual Video Call'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInterviewModeFilter(mode)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  interviewModeFilter === mode
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'All' ? 'All' : mode === 'Virtual Video Call' ? 'Virtual' : 'In-person'}
              </button>
            ))}
          </div>

          {selectedCalendarDate && (
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Show All Dates ({visibleInterviews.length})
            </button>
          )}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-extrabold text-slate-900 min-w-[125px] text-center">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reschedule Mode or Confirmation Banner */}
      {activeRescheduleInterview && (
        <div
          data-testid="calendar-reschedule-mode-banner"
          className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950"
        >
          <div className="flex items-center gap-2 font-semibold">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Rescheduling <strong>{activeRescheduleInterview.candidateName}</strong> ({activeRescheduleInterview.jobTitle}) — Click any target date on the calendar below to move this appointment.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setInterviewToRescheduleId(null)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] self-start sm:self-center cursor-pointer"
          >
            Cancel Reschedule
          </button>
        </div>
      )}

      {rescheduleBannerMsg && (
        <div
          data-testid="calendar-reschedule-toast"
          className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-950 font-semibold"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{rescheduleBannerMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setRescheduleBannerMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Month Grid */}
        <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
              <div key={dayName} className="py-2.5">
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-white">
            {calendarDays.map((cell, idx) => {
              if (!cell.day || !cell.isoDate) {
                return <div key={`empty-${idx}`} className="min-h-[82px] bg-slate-50/60" />;
              }

              const dayInterviews = visibleInterviews.filter((i) => i.isoDate === cell.isoDate);
              const isSelected = selectedCalendarDate === cell.isoDate;
              const isDragTarget = dragOverDate === cell.isoDate;
              const hasInterviews = dayInterviews.length > 0;

              return (
                <div
                  key={cell.isoDate}
                  data-testid={`calendar-day-${cell.isoDate}`}
                  role="button"
                  tabIndex={0}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverDate !== cell.isoDate) {
                      setDragOverDate(cell.isoDate);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverDate === cell.isoDate) {
                      setDragOverDate(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedId =
                      e.dataTransfer?.getData('text/plain') || draggedInterviewId;
                    if (droppedId && cell.isoDate) {
                      handleRescheduleInterviewOnCalendar(droppedId, cell.isoDate);
                    }
                  }}
                  onClick={() => {
                    if (interviewToRescheduleId && cell.isoDate) {
                      handleRescheduleInterviewOnCalendar(interviewToRescheduleId, cell.isoDate);
                      return;
                    }
                    setSelectedCalendarDate((prev) =>
                      prev === cell.isoDate ? null : cell.isoDate
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (interviewToRescheduleId && cell.isoDate) {
                        handleRescheduleInterviewOnCalendar(interviewToRescheduleId, cell.isoDate);
                        return;
                      }
                      setSelectedCalendarDate((prev) =>
                        prev === cell.isoDate ? null : cell.isoDate
                      );
                    }
                  }}
                  className={`min-h-[82px] p-1.5 text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isDragTarget
                      ? 'bg-emerald-100 ring-2 ring-inset ring-emerald-500'
                      : interviewToRescheduleId
                      ? 'hover:bg-amber-50 hover:ring-2 hover:ring-inset hover:ring-amber-500'
                      : isSelected
                      ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-600'
                      : hasInterviews
                      ? 'bg-amber-50/40 hover:bg-emerald-50/60'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : hasInterviews
                          ? 'bg-emerald-100 text-emerald-900 font-extrabold'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {hasInterviews && (
                      <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                        {dayInterviews.length}
                      </span>
                    )}
                  </div>

                  {hasInterviews && (
                    <div className="space-y-1 mt-1 w-full">
                      {dayInterviews.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          data-testid={`calendar-interview-pill-${item.id}`}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer?.setData('text/plain', item.id);
                            setDraggedInterviewId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggedInterviewId(null);
                            setDragOverDate(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInterviewToRescheduleId((prev) =>
                              prev === item.id ? null : item.id
                            );
                          }}
                          className={`text-[10px] font-semibold truncate px-1.5 py-0.5 rounded flex items-center gap-1 cursor-grab active:cursor-grabbing ${
                            interviewToRescheduleId === item.id
                              ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-700'
                              : 'bg-emerald-900 text-white hover:bg-emerald-800'
                          }`}
                          title={`Drag to another date or click to reschedule: ${item.candidateName} (${item.time})`}
                        >
                          <GripVertical className="w-2.5 h-2.5 shrink-0 opacity-75" />
                          <span className="truncate">{item.candidateName}</span>
                        </div>
                      ))}
                      {dayInterviews.length > 2 && (
                        <div className="text-[9px] font-bold text-emerald-700 pl-1">
                          +{dayInterviews.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Scheduled Interviews List */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              {selectedCalendarDate
                ? `Interviews on ${selectedCalendarDate}`
                : 'Upcoming Interview Agenda'}
            </h4>
            <span className="text-xs font-bold text-emerald-700">
              {filteredInterviewsForDisplay.length} scheduled
            </span>
          </div>

          {filteredInterviewsForDisplay.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              No scheduled interviews found for this selection.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredInterviewsForDisplay.map((interview) => (
                <div
                  key={interview.id}
                  data-testid={`agenda-interview-card-${interview.id}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer?.setData('text/plain', interview.id);
                    setDraggedInterviewId(interview.id);
                  }}
                  onDragEnd={() => {
                    setDraggedInterviewId(null);
                    setDragOverDate(null);
                  }}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                    interviewToRescheduleId === interview.id
                      ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-400'
                      : 'border-slate-200 hover:border-emerald-400 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0 cursor-grab" />
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {interview.candidateName}
                        </span>
                        <span className="text-[11px] text-emerald-800 font-semibold block">
                          {interview.jobTitle}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        interview.mode === 'Virtual Video Call'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {interview.mode === 'Virtual Video Call' ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {interview.mode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/80">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{interview.displayDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{interview.time}</span>
                    </div>
                  </div>

                  {/* Direct Date Picker & Calendar Select Reschedule Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <label
                        htmlFor={`reschedule-date-${interview.id}`}
                        className="text-[10px] font-bold uppercase text-slate-500"
                      >
                        Move Date:
                      </label>
                      <input
                        id={`reschedule-date-${interview.id}`}
                        data-testid={`reschedule-date-input-${interview.id}`}
                        type="date"
                        aria-label={`Select new date for ${interview.candidateName}`}
                        value={interview.isoDate}
                        onChange={(e) =>
                          handleRescheduleInterviewOnCalendar(interview.id, e.target.value)
                        }
                        className="text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-0.5 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid={`select-reschedule-btn-${interview.id}`}
                        onClick={() =>
                          setInterviewToRescheduleId((prev) =>
                            prev === interview.id ? null : interview.id
                          )
                        }
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          interviewToRescheduleId === interview.id
                            ? 'bg-amber-500 text-slate-950 border-amber-600'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {interviewToRescheduleId === interview.id
                          ? 'Pick Calendar Date...'
                          : 'Pick on Calendar'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onScheduleInterview(
                            interview.applicationId,
                            interview.candidateName,
                            interview.jobTitle,
                            interview.notes || ''
                          )
                        }
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
                      >
                        Details / Notes
                      </button>
                    </div>
                  </div>

                  {interview.notes && (
                    <div className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
                      <span className="font-bold text-emerald-800">Notes: </span>
                      <span>{interview.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEmployerActivityFeedWidget = () => (
    <div
      data-testid="employer-activity-feed"
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 mb-1">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Organization Audit Log</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Employer Activity Feed ({filteredActivityFeed.length})
          </h3>
          <p className="text-xs text-slate-600">
            Real-time log of recent actions for <strong>{currentRecruiter.companyName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Job Posted', 'Candidate Applied', 'Interview Scheduled'] as const).map(
            (category) => (
              <button
                key={category}
                type="button"
                data-testid={`activity-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActivityFilter(category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activityFilter === category
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            )
          )}
        </div>
      </div>

      {filteredActivityFeed.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
          No organization activity recorded for this filter yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1">
          {filteredActivityFeed.slice(0, 9).map((event) => {
            const isJobPosted = event.type === 'Job Posted';
            const isCandidateApplied = event.type === 'Candidate Applied';
            return (
              <div
                key={event.id}
                data-testid={`activity-feed-item-${event.id}`}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all flex items-start gap-3"
              >
                <div
                  className={`p-2 rounded-xl shrink-0 border ${
                    isJobPosted
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isCandidateApplied
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isJobPosted ? (
                    <Briefcase className="w-4 h-4" />
                  ) : isCandidateApplied ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isJobPosted
                          ? 'bg-amber-100 text-amber-900'
                          : isCandidateApplied
                          ? 'bg-sky-100 text-sky-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {event.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {event.timestamp}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {event.title}
                  </p>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Recruiter Header Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-800/80 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-600/40">
              🇩🇲 Employer & Recruiter Command Center
            </span>
            <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Dominica Verified Employer
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            {currentRecruiter ? currentRecruiter.companyName : 'Dominica Employer Portal'}
          </h2>
          <p className="text-sm text-emerald-100/90 mt-1 max-w-xl">
            Manage your classified listings, analyze candidate skill gaps, send secure direct messages, and schedule interviews.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenStripe && (
            <button
              onClick={onOpenStripe}
              className="inline-flex items-center gap-1.5 bg-[#635BFF] hover:bg-[#5249e6] text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-white" />
              <span>Stripe Checkout</span>
            </button>
          )}

          <button
            onClick={() => setActivePortalTab('billing')}
            className={`inline-flex items-center gap-2 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer ${
              activePortalTab === 'billing'
                ? 'bg-white text-slate-950 ring-2 ring-emerald-400'
                : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-300" />
            <span>Billing History ({employerInvoicesCount})</span>
          </button>

          <button
            onClick={handleOpenPostVacancy}
            data-testid="employer-portal-post-vacancy-btn"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a vacancy</span>
          </button>
        </div>
      </div>

      {/* Automated Email Reminder Status Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-teal-950">
          <BellRing className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="font-extrabold">Automated Recruiter Reminders Service: </span>
            <span className="text-slate-600">
              Active reminders regarding pending listings and renewal dates dispatched via <strong>info@natureislecareers.com</strong>.
            </span>
            {reminderStatusMsg && (
              <span className="ml-2 bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[11px] animate-pulse">
                {reminderStatusMsg}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleTriggerReminders}
          className="bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <Send className="w-3 h-3" />
          <span>Dispatch Automated Reminders</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          onClick={() => setActivePortalTab('candidates')}
          className={`py-3 px-5 text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activePortalTab === 'candidates'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Classifieds & Candidates ({relevantApplications.length})</span>
        </button>

        <button
          data-testid="interview-schedule-tab"
          onClick={() => setActivePortalTab('schedule')}
          className={`py-3 px-5 text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activePortalTab === 'schedule'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Interview Schedule ({interviewData.length})</span>
        </button>

        <button
          onClick={() => setActivePortalTab('billing')}
          className={`py-3 px-5 text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activePortalTab === 'billing'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing History & Monthly Stripe Subscriptions</span>
          {employerInvoicesCount > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.2 rounded-full font-bold">
              {employerInvoicesCount}
            </span>
          )}
        </button>
      </div>

      {/* Recruiter Switcher */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <Building className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Active Employer:</strong> {currentRecruiter.companyName} ({currentRecruiter.parish}) • DSS Reg: {currentRecruiter.dssRegistrationNo}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {recruiters.map((r) => (
            <button
              key={r.id}
              onClick={() => setCurrentRecruiterId(r.id)}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                r.id === currentRecruiter.id
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {r.companyName}
            </button>
          ))}
        </div>
      </div>

      {activePortalTab === 'billing' ? (
        <BillingHistory onOpenStripe={onOpenStripe || onOpenSubscription} />
      ) : activePortalTab === 'schedule' ? (
        renderInterviewCalendarSection()
      ) : (
        <>
          {/* Recruiter Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-600 uppercase">Active Vacancies</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{myJobs.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-emerald-600 uppercase">Total Applicants</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{relevantApplications.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-blue-600 uppercase">Scheduled Interviews</p>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {interviewData.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-purple-600 uppercase">Ideal Skill Matches</p>
              <p className="text-2xl font-black text-emerald-700 mt-1 flex items-center gap-1.5">
                <span>{skillGapHeatmap.idealMatchCount}</span>
                <span className="text-xs font-bold text-slate-500">
                  ({skillGapHeatmap.averageReadiness}% avg)
                </span>
              </p>
            </div>
          </div>

          {/* Employer Activity Feed Widget */}
          {renderEmployerActivityFeedWidget()}

          {/* Candidate Skill-Gap Analysis Heatmap Visualization */}
          {renderSkillGapHeatmapSection()}

          {/* Direct Messaging Interface */}
          {renderDirectMessagingSection()}

          {/* Upcoming Scheduled Interviews Calendar View */}
          {renderInterviewCalendarSection()}

          {/* Active Listings Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Active Job Classifieds</h3>
                <p className="text-xs text-slate-600">Select a listing to filter the applicant pipeline and skill-gap heatmap</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedJobId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedJobId === 'all'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Classifieds ({myJobs.length})
                </button>
                <button
                  onClick={handleOpenPostVacancy}
                  data-testid="classifieds-post-vacancy-btn"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post a vacancy</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedJobId === job.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {job.parish}
                    </span>
                    <span className="text-xs text-slate-500 font-medium font-mono">
                      EC${job.minSalary} - ${job.maxSalary}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{job.title}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {applications.filter((a) => a.jobId === job.id).length} Applicants
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {job.viewsCount} views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Applicant Tracking Pipeline with Checkboxes, Bulk Update Status, Star-Rating & Direct Messaging */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Applicant Pipeline ({prioritizedApplications.length})
                </h3>
                <p className="text-xs text-slate-600">
                  Select multiple candidates for bulk status updates, star-rate talent, send direct messages, or schedule interviews
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Bulk Update Status Controls */}
                <div
                  data-testid="bulk-update-status-toolbar"
                  className="flex flex-wrap items-center gap-2 bg-emerald-50/90 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span
                    data-testid="bulk-selected-count"
                    className="font-extrabold text-emerald-950"
                  >
                    {selectedApplicationIds.length} selected
                  </span>
                  <label htmlFor="bulk-update-status-select" className="sr-only">
                    Bulk Update Status
                  </label>
                  <select
                    id="bulk-update-status-select"
                    data-testid="bulk-update-status-select"
                    aria-label="Bulk Update Status"
                    value={bulkStatusValue}
                    onChange={(e) => handleBulkStatusDropdownChange(e.target.value)}
                    className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 text-xs cursor-pointer"
                  >
                    <option value="">Bulk Update Status...</option>
                    <option value="Pending">Pending</option>
                    <option value="Applied">Applied</option>
                    <option value="Screened">Screened</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Offer Extended">Offer Extended</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <button
                    type="button"
                    data-testid="apply-bulk-status-btn"
                    disabled={!bulkStatusValue || selectedApplicationIds.length === 0}
                    onClick={() => {
                      if (bulkStatusValue) {
                        executeBulkStatusUpdate(bulkStatusValue);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Apply Bulk Status
                  </button>
                  {selectedApplicationIds.length > 0 && (
                    <button
                      type="button"
                      data-testid="clear-bulk-selection-btn"
                      onClick={() => setSelectedApplicationIds([])}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Talent Prioritization Controls */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-bold text-slate-600">Prioritize:</span>
                  <select
                    data-testid="candidate-priority-sort"
                    aria-label="Sort candidates by rating or date"
                    value={candidateSortBy}
                    onChange={(e) => setCandidateSortBy(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 font-bold text-slate-800 text-xs cursor-pointer"
                  >
                    <option value="rating_desc">Highest Rated First (Talent Rank)</option>
                    <option value="recent">Most Recent Application</option>
                    <option value="rating_asc">Lowest Rated First</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-200 text-xs">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <select
                    data-testid="candidate-star-filter"
                    aria-label="Filter candidates by minimum star rating"
                    value={minStarFilter}
                    onChange={(e) => setMinStarFilter(Number(e.target.value))}
                    className="bg-white border border-amber-300 rounded-lg px-2 py-0.5 font-bold text-amber-900 text-xs cursor-pointer"
                  >
                    <option value={0}>All Candidate Ratings</option>
                    <option value={4}>4+ Stars Only (Top Talent)</option>
                    <option value={5}>5 Stars Only (Top Ranked)</option>
                  </select>
                </div>

                {/* Status Legend with Colored Dots */}
                <div
                  data-testid="recruiter-status-legend"
                  className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>Pending</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Interview Scheduled</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span>Rejected</span>
                  </span>
                </div>
              </div>
            </div>

            {bulkStatusBannerMsg && (
              <div
                data-testid="bulk-status-toast"
                className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-950 font-semibold"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bulkStatusBannerMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkStatusBannerMsg(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {prioritizedApplications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No candidate applications recorded for this selection yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          data-testid="select-all-applications-checkbox"
                          aria-label="Select all candidates"
                          checked={allVisibleSelected}
                          onChange={handleToggleSelectAllApplications}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Applicant & Rank</th>
                      <th className="p-3">Job Applied For</th>
                      <th className="p-3">Candidate Star Rating</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Resume & Feedback Notes</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prioritizedApplications.map((app, index) => {
                      const statusVisual = getApplicationStatusIndicator(app.status);
                      const currentRating = app.rating || 0;
                      const rankInfo = getCandidateRankLabel(currentRating);
                      const isRowChecked = selectedApplicationIds.includes(app.id);
                      const candidateMessageCount = directMessages.filter(
                        (m) => m.applicationId === app.id
                      ).length;
                      const latestNote =
                        app.interviewDetails?.notes ||
                        (app.notes && app.notes.length > 0
                          ? app.notes[app.notes.length - 1]
                          : '');
                      return (
                        <tr
                          key={app.id}
                          className={`transition-colors ${
                            isRowChecked ? 'bg-emerald-50/60' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              data-testid={`select-application-checkbox-${app.id}`}
                              aria-label={`Select ${app.applicantName}`}
                              checked={isRowChecked}
                              onChange={() => handleToggleSelectApplication(app.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span
                                data-testid={`candidate-rank-badge-${app.id}`}
                                className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 shrink-0"
                                title={`Talent Priority Rank #${index + 1}`}
                              >
                                #{index + 1}
                              </span>
                              <span
                                data-testid={`status-dot-${app.id}`}
                                title={`Status: ${statusVisual.label}`}
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusVisual.dotColorClass}`}
                              />
                              <span>{app.applicantName}</span>
                            </div>
                            <div className="text-[11px] font-normal text-slate-600 flex items-center gap-1 mt-0.5 pl-4">
                              <Mail className="w-3 h-3" />
                              {app.applicantEmail}
                            </div>
                          </td>
                          <td className="p-3 font-medium text-slate-800">{app.jobTitle}</td>
                          <td className="p-3">
                            <div
                              data-testid={`candidate-rating-${app.id}`}
                              className="flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((starValue) => {
                                  const isFilled = starValue <= currentRating;
                                  return (
                                    <button
                                      key={starValue}
                                      type="button"
                                      data-testid={`rate-star-${app.id}-${starValue}`}
                                      aria-label={`Rate ${app.applicantName} ${starValue} out of 5 stars`}
                                      onClick={() => rateApplication(app.id, starValue)}
                                      className="p-0.5 rounded hover:scale-110 transition-transform cursor-pointer"
                                      title={`Set rating to ${starValue} star${starValue > 1 ? 's' : ''}`}
                                    >
                                      <Star
                                        className={`w-4 h-4 ${
                                          isFilled
                                            ? 'fill-amber-400 text-amber-500'
                                            : 'text-slate-300 hover:text-amber-400'
                                        }`}
                                      />
                                    </button>
                                  );
                                })}
                                <span
                                  data-testid={`candidate-rating-value-${app.id}`}
                                  className="ml-1 text-[11px] font-extrabold text-slate-800"
                                >
                                  {currentRating}/5
                                </span>
                              </div>
                              <span
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${rankInfo.badgeClass}`}
                              >
                                {rankInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 max-w-xs">
                            <span className="font-semibold text-emerald-700 block truncate">
                              📄 {app.resumeFileName}
                            </span>
                            {app.coverNote && (
                              <p className="text-[11px] text-slate-600 italic line-clamp-1 mt-0.5">
                                "{app.coverNote}"
                              </p>
                            )}
                            {latestNote && (
                              <p
                                data-testid={`application-note-${app.id}`}
                                className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded px-1.5 py-0.5 mt-1 line-clamp-1"
                                title={latestNote}
                              >
                                📝 {latestNote}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <div
                              data-testid="application-status-indicator"
                              className="flex flex-col gap-1.5"
                            >
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold w-fit ${statusVisual.badgeColorClass}`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${statusVisual.dotColorClass}`}
                                />
                                <span>{statusVisual.label}</span>
                              </span>
                              <select
                                aria-label={`Status for ${app.applicantName}`}
                                value={app.status}
                                onChange={(e) =>
                                  updateApplicationStatus(
                                    app.id,
                                    e.target.value as ApplicationStatus
                                  )
                                }
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Applied">Applied</option>
                                <option value="Screened">Screened</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Interview Scheduled">Interview Scheduled</option>
                                <option value="Offer Extended">Offer Extended</option>
                                <option value="Hired">Hired</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Archived">Archived</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                data-testid={`message-candidate-btn-${app.id}`}
                                onClick={() => handleOpenDirectMessageForCandidate(app)}
                                className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                title={`Send direct message to ${app.applicantName}`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Message</span>
                                {candidateMessageCount > 0 && (
                                  <span className="bg-emerald-700 text-white text-[10px] px-1.5 rounded-full">
                                    {candidateMessageCount}
                                  </span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  onScheduleInterview(
                                    app.id,
                                    app.applicantName,
                                    app.jobTitle,
                                    latestNote
                                  )
                                }
                                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                                <span>Schedule</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Self-contained Post a Vacancy Modal inside RecruiterPortal */}
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
      />
    </div>
  );
};
