import { describe, it, expect } from 'vitest';
import {
  doesJobMatchSubscription,
  doesJobMatchAlertPreferences,
  createSubscriptionEmailNotification,
} from '../components/EmailAlertToast';
import {
  normalizeInterviewDate,
  getApplicationStatusIndicator,
  buildEmployerActivityFeed,
  rescheduleInterviewItem,
  getCandidateRankLabel,
  sortApplicationsByPriority,
  buildSkillGapHeatmapData,
  createDirectMessageRecord,
  bulkUpdateApplicationsStatus,
  ScheduledInterviewItem,
} from '../components/RecruiterPortal';
import {
  formatInterviewTimerDisplay,
  stepInterviewTimer,
  calculateInterviewEvaluationSummary,
  createInterviewEvaluationRecord,
} from '../components/InterviewSchedulerModal';
import {
  parseResumeDocumentContent,
  applyParsedResumeToCandidateProfile,
} from '../components/CandidateProfileHub';
import {
  saveRecentSearchesToStorage,
  loadRecentSearchesFromStorage,
  DEFAULT_RECENT_SEARCHES,
  saveSavedJobFoldersToStorage,
  loadSavedJobFoldersFromStorage,
  DEFAULT_SAVED_JOB_FOLDERS,
} from '../context/JobContext';
import { JobListing, JobAlertSubscription, AlertPreferenceRule, JobApplication } from '../types';

const mockJob: JobListing = {
  id: 'job-test-901',
  title: 'Senior Geothermal Turbine Engineer',
  company: 'Dominica Geothermal Development Company',
  parish: 'St. George',
  locality: 'Roseau Valley / Laudat',
  sector: 'Renewable Energy & Geothermal',
  employmentType: 'Full-Time',
  workModel: 'On-site',
  minSalary: 7500,
  maxSalary: 9800,
  salaryPeriod: 'month',
  isNepApproved: true,
  featured: true,
  description: 'Lead geothermal power plant commissioning and steam turbine diagnostics.',
  responsibilities: ['Monitor turbine output'],
  requirements: ['BSc Mechanical Engineering'],
  benefits: ['Relocation allowance'],
  screeningQuestions: [],
  contactEmail: 'info@natureislecareers.com',
  applicationDeadline: '2026-11-30',
  postedAt: '2026-10-07',
  viewsCount: 15,
  applicantsCount: 3,
  recruiterId: 'rec_geothermal',
  requiredSkills: ['SCADA', 'Steam Turbines', 'Thermodynamics'],
};

const baseSubscription: JobAlertSubscription = {
  id: 'sub-test-1',
  email: 'candidate@waitukubuli.dm',
  name: 'Elena Henderson',
  parishes: ['St. George', 'St. Paul'],
  sectors: ['Renewable Energy & Geothermal'],
  frequency: 'instant',
  active: true,
  createdAt: '2026-10-01',
};

describe('EmailAlertToast Mock Email Notification Service', () => {
  it('matches active subscription when parish and sector align', () => {
    expect(doesJobMatchSubscription(mockJob, baseSubscription)).toBe(true);
  });

  it('does not match inactive subscription', () => {
    const inactiveSub: JobAlertSubscription = { ...baseSubscription, active: false };
    expect(doesJobMatchSubscription(mockJob, inactiveSub)).toBe(false);
  });

  it('checks optional keyword against title, description, company, and requiredSkills', () => {
    const matchingKeywordSub: JobAlertSubscription = {
      ...baseSubscription,
      keyword: 'SCADA',
    };
    const nonMatchingKeywordSub: JobAlertSubscription = {
      ...baseSubscription,
      keyword: 'Hospitality Chef',
    };

    expect(doesJobMatchSubscription(mockJob, matchingKeywordSub)).toBe(true);
    expect(doesJobMatchSubscription(mockJob, nonMatchingKeywordSub)).toBe(false);
  });

  it('builds a properly formatted EmailNotification payload for matched jobs', () => {
    const notif = createSubscriptionEmailNotification(mockJob, {
      ...baseSubscription,
      keyword: 'Geothermal',
    });

    expect(notif.recipientEmail).toBe('candidate@waitukubuli.dm');
    expect(notif.recipientName).toBe('Elena Henderson');
    expect(notif.type).toBe('job_alert');
    expect(notif.relatedJobId).toBe('job-test-901');
    expect(notif.subject).toContain('Senior Geothermal Turbine Engineer');
    expect(notif.bodyHtml).toContain('info@natureislecareers.com');
    expect(notif.bodyHtml).toContain('Geothermal');
  });

  it('evaluates stateful alertPreferences rules against job sector and parish', () => {
    const prefs: AlertPreferenceRule[] = [
      {
        id: 'pref-test-1',
        sector: 'Renewable Energy & Geothermal',
        parish: 'St. George',
        active: true,
      },
    ];
    const result = doesJobMatchAlertPreferences(mockJob, prefs);
    expect(result.matched).toBe(true);
    expect(result.matchedRule?.id).toBe('pref-test-1');
  });

  it('normalizes interview dates for the RecruiterPortal calendar view', () => {
    expect(normalizeInterviewDate('2026-10-02')).toBe('2026-10-02');
    expect(normalizeInterviewDate('Wednesday, Oct 7, 2026')).toBe('2026-10-07');
  });

  it('provides recentSearches storage helpers and defaults', () => {
    expect(Array.isArray(DEFAULT_RECENT_SEARCHES)).toBe(true);
    expect(DEFAULT_RECENT_SEARCHES.length).toBeGreaterThan(0);
    const saved = saveRecentSearchesToStorage(['Geothermal', 'Roseau']);
    expect(saved).toEqual(['Geothermal', 'Roseau']);
    expect(Array.isArray(loadRecentSearchesFromStorage())).toBe(true);
  });

  it('provides custom named saved job folders storage helpers', () => {
    expect(Array.isArray(DEFAULT_SAVED_JOB_FOLDERS)).toBe(true);
    const customFolders = [
      {
        id: 'folder-custom-1',
        name: 'Top Dominica Roles',
        jobIds: ['job-101'],
        createdAt: '2026-10-07',
      },
    ];
    expect(saveSavedJobFoldersToStorage(customFolders)).toEqual(customFolders);
    expect(Array.isArray(loadSavedJobFoldersFromStorage())).toBe(true);
  });

  it('returns distinct colored dot status indicators for Pending, Interview Scheduled, and Rejected', () => {
    const pending = getApplicationStatusIndicator('Pending');
    const scheduled = getApplicationStatusIndicator('Interview Scheduled');
    const rejected = getApplicationStatusIndicator('Rejected');

    expect(pending.dotColorClass).toContain('bg-amber-500');
    expect(scheduled.dotColorClass).toContain('bg-emerald-500');
    expect(rejected.dotColorClass).toContain('bg-rose-500');
  });

  it('builds Employer Activity Feed entries for Job Posted, Candidate Applied, and Interview Scheduled', () => {
    const sampleApp: JobApplication = {
      id: 'app-test-1',
      jobId: 'job-test-901',
      jobTitle: 'Senior Geothermal Turbine Engineer',
      companyName: 'Dominica Geothermal Development Company',
      applicantName: 'Elena Henderson',
      applicantEmail: 'candidate@waitukubuli.dm',
      applicantPhone: '+1 (767) 275-1111',
      parish: 'St. George',
      citizenStatus: 'Dominican Citizen',
      resumeFileName: 'Elena_CV.pdf',
      resumeFileSize: '210 KB',
      coverNote: 'Experienced engineer',
      screeningAnswers: {},
      status: 'Interview Scheduled',
      rating: 5,
      notes: [],
      interviewDetails: {
        date: '2026-10-08',
        time: '10:00 AM AST',
        location: 'Roseau Valley',
        mode: 'In-person',
      },
      appliedAt: '2026-10-06 11:00',
      timeline: [{ date: '2026-10-06 11:00', action: 'Application Submitted' }],
    };

    const feed = buildEmployerActivityFeed(
      [mockJob],
      [sampleApp],
      'Dominica Geothermal Development Company',
      'rec_geothermal'
    );

    const types = feed.map((f) => f.type);
    expect(types).toContain('Job Posted');
    expect(types).toContain('Candidate Applied');
    expect(types).toContain('Interview Scheduled');
  });

  it('reschedules an interview item to a newly selected calendar date', () => {
    const initialInterviews: ScheduledInterviewItem[] = [
      {
        id: 'int-app-1',
        applicationId: 'app-1',
        candidateName: 'Elena Henderson',
        candidateEmail: 'candidate@waitukubuli.dm',
        jobId: 'job-test-901',
        jobTitle: 'Senior Geothermal Turbine Engineer',
        companyName: 'Dominica Geothermal Development Company',
        isoDate: '2026-10-07',
        displayDate: 'Wednesday, Oct 7, 2026',
        time: '02:00 PM AST',
        mode: 'In-person',
        location: 'Roseau',
      },
    ];

    const updated = rescheduleInterviewItem(initialInterviews, 'int-app-1', '2026-10-15');
    expect(updated[0].isoDate).toBe('2026-10-15');
    expect(updated[0].displayDate).toContain('Oct 15, 2026');
  });

  it('ranks and sorts candidates by star rating for talent prioritization', () => {
    const topLabel = getCandidateRankLabel(5);
    const highLabel = getCandidateRankLabel(4);
    expect(topLabel.label).toContain('Top Ranked');
    expect(highLabel.label).toContain('High Priority');

    const apps = [
      { id: 'a1', rating: 3, appliedAt: '2026-10-05' },
      { id: 'a2', rating: 5, appliedAt: '2026-10-01' },
      { id: 'a3', rating: 4, appliedAt: '2026-10-07' },
    ] as JobApplication[];

    const sorted = sortApplicationsByPriority(apps, 'rating_desc');
    expect(sorted.map((a) => a.id)).toEqual(['a2', 'a3', 'a1']);
  });

  it('generates skill-gap analysis heatmap matrix for candidate applications', () => {
    const sampleApp: JobApplication = {
      id: 'app-heat-1',
      jobId: 'job-test-901',
      jobTitle: 'Senior Geothermal Turbine Engineer',
      companyName: 'Dominica Geothermal Development Company',
      applicantName: 'Elena Henderson',
      applicantEmail: 'candidate@waitukubuli.dm',
      applicantPhone: '+1 (767) 275-1111',
      parish: 'St. George',
      citizenStatus: 'Dominican Citizen',
      resumeFileName: 'Elena_SCADA_Steam_Turbines_CV.pdf',
      resumeFileSize: '210 KB',
      coverNote: 'Experienced in SCADA, Steam Turbines, and Thermodynamics.',
      screeningAnswers: {},
      status: 'Shortlisted',
      rating: 5,
      notes: [],
      appliedAt: '2026-10-06 11:00',
      timeline: [],
    };

    const heatmap = buildSkillGapHeatmapData([sampleApp], [mockJob], 'job-test-901');
    expect(heatmap.skills).toContain('SCADA');
    expect(heatmap.skills).toContain('Steam Turbines');
    expect(heatmap.rows.length).toBe(1);
    expect(heatmap.rows[0].candidateName).toBe('Elena Henderson');
    expect(heatmap.rows[0].overallMatchScore).toBeGreaterThanOrEqual(75);
    expect(heatmap.rows[0].isIdealMatch).toBe(true);
  });

  it('creates an encrypted direct message record for candidate communications', () => {
    const msg = createDirectMessageRecord({
      applicationId: 'app-1',
      candidateName: 'Marcus Jean-Jacques',
      candidateEmail: 'm.jeanjacques@cwdom.dm',
      jobTitle: 'Marine Operations & Dive Safety Officer',
      senderName: 'Fort Young HR',
      companyName: 'Fort Young Hotel & Dive Resort',
      content: 'Can you join a call tomorrow at 10 AM?',
    });
    expect(msg.applicationId).toBe('app-1');
    expect(msg.isEncrypted).toBe(true);
    expect(msg.content).toBe('Can you join a call tomorrow at 10 AM?');
  });

  it('bulk updates the status of multiple selected applications at once', () => {
    const apps = [
      { id: 'app-1', status: 'Pending' },
      { id: 'app-2', status: 'Pending' },
      { id: 'app-3', status: 'Screened' },
    ] as JobApplication[];

    const updated = bulkUpdateApplicationsStatus(
      apps,
      ['app-1', 'app-2'],
      'Interview Scheduled'
    );
    expect(updated.find((a) => a.id === 'app-1')?.status).toBe('Interview Scheduled');
    expect(updated.find((a) => a.id === 'app-2')?.status).toBe('Interview Scheduled');
    expect(updated.find((a) => a.id === 'app-3')?.status).toBe('Screened');
  });

  it('formats and steps the live interview timer in elapsed and countdown modes', () => {
    expect(formatInterviewTimerDisplay(0)).toBe('00:00');
    expect(formatInterviewTimerDisplay(125)).toBe('02:05');
    expect(formatInterviewTimerDisplay(3661)).toBe('01:01:01');

    const elapsedStep = stepInterviewTimer(10, 'elapsed');
    expect(elapsedStep).toEqual({ nextSeconds: 11, completed: false });

    const countdownStep = stepInterviewTimer(1, 'countdown');
    expect(countdownStep).toEqual({ nextSeconds: 0, completed: true });
  });

  it('scores candidates on Interview Evaluation criteria (communication, technicalFit, culturalFit)', () => {
    const summary = calculateInterviewEvaluationSummary({
      communication: 5,
      technicalFit: 4,
      culturalFit: 5,
      problemSolving: 4,
    });
    expect(summary.overallScore).toBe(4.5);
    expect(summary.percentage).toBe(90);
    expect(summary.recommendation).toBe('Strong Hire');

    const evalRecord = createInterviewEvaluationRecord({
      communication: 5,
      technicalFit: 4,
      culturalFit: 5,
      problemSolving: 4,
      comments: 'Excellent geothermal SCADA knowledge and clear communication.',
    });
    expect(evalRecord.communication).toBe(5);
    expect(evalRecord.technicalFit).toBe(4);
    expect(evalRecord.culturalFit).toBe(5);
    expect(evalRecord.recommendation).toBe('Strong Hire');
    expect(evalRecord.comments).toContain('SCADA');
  });

  it('extracts skills, experience, and education from an uploaded resume document to populate candidate profile', () => {
    const sampleResumeText = `Elena Henderson
Senior Geothermal SCADA Engineer
Roseau, St. George, Dominica | elena@waitukubuli.dm | +1 (767) 275-8891

Summary:
Experienced Dominican SCADA and renewable energy engineer.

Skills:
SCADA, Geothermal Operations, React, TypeScript, PostgreSQL

Work Experience:
Lead SCADA Engineer at Dominica Geothermal Development Co. (2023 - Present)
- Built real-time telemetry dashboards in Laudat.

Education:
B.Sc. in Electrical Engineering | University of the West Indies (UWI) | 2020`;

    const parsed = parseResumeDocumentContent(sampleResumeText, 'Elena_CV.txt');
    expect(parsed.fullName).toBe('Elena Henderson');
    expect(parsed.email).toBe('elena@waitukubuli.dm');
    expect(parsed.parish).toBe('St. George');
    expect(parsed.skills).toContain('SCADA');
    expect(parsed.skills).toContain('React');
    expect(parsed.experience.length).toBeGreaterThan(0);
    expect(parsed.experience[0].title).toContain('Lead SCADA Engineer');
    expect(parsed.education.length).toBeGreaterThan(0);
    expect(parsed.education[0].degree).toContain('B.Sc.');

    const updatedProfile = applyParsedResumeToCandidateProfile(
      { name: 'Max Blanc', skills: ['Node.js'] },
      parsed
    );
    expect(updatedProfile.name).toBe('Elena Henderson');
    expect(updatedProfile.skills).toContain('SCADA');
    expect(updatedProfile.skills).toContain('Node.js');
    expect(updatedProfile.experience?.length).toBeGreaterThan(0);
    expect(updatedProfile.education?.length).toBeGreaterThan(0);
  });
});
