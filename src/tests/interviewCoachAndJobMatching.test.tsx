import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  JobProvider,
  evaluateJobMatchForJobseeker,
  buildAutomatedJobMatchEmail,
} from '../context/JobContext';
import { CareerGuidanceAssistant } from '../components/CareerGuidanceAssistant';
import { JobAlertAutomationManager } from '../components/JobAlertAutomationManager';
import { SubscribeAlertModal } from '../components/SubscribeAlertModal';
import { JobListing, UserAccount } from '../types';

const todayStr = new Date().toISOString().split('T')[0];

const sampleNewJob: JobListing = {
  id: 'job-match-test-1',
  title: 'Senior Geothermal SCADA Engineer',
  company: 'Dominica Geothermal Development Co.',
  parish: 'St. George',
  locality: 'Laudat Valley',
  sector: 'Renewable Energy & Geothermal',
  employmentType: 'Full-Time',
  workModel: 'On-site',
  minSalary: 5500,
  maxSalary: 8200,
  salaryPeriod: 'month',
  isNepApproved: true,
  featured: true,
  description: 'Lead geothermal plant SCADA telemetry and preventive reliability.',
  responsibilities: ['Monitor turbine SCADA dashboards', 'Coordinate maintenance'],
  requirements: ['Electrical or SCADA Engineering degree', '3+ years plant telemetry'],
  benefits: ['Health insurance', 'Fuel allowance'],
  screeningQuestions: [],
  contactEmail: 'careers@geothermal.dm',
  applicationDeadline: '2026-12-30',
  postedAt: todayStr,
  viewsCount: 1,
  applicantsCount: 0,
  recruiterId: 'rec_fort_young',
};

const baseCandidate: UserAccount = {
  id: 'usr-test-js-1',
  email: 'maxblanc10468@gmail.com',
  name: 'Max Blanc',
  role: 'jobseeker',
  parish: 'St. George',
  careerSector: 'Renewable Energy & Geothermal',
  preferredParish: 'St. George',
  preferredSector: 'Renewable Energy & Geothermal',
  minSalaryRequirement: 5000,
  autoMatchEmailsEnabled: true,
  skills: ['Geothermal SCADA Protocols', 'React & TypeScript'],
  createdAt: '2026-09-01',
};

describe('Real-Time Interview Coach Chatbot (CareerGuidanceAssistant + Hardened Gemini Proxy)', () => {
  it('renders the Interview Coach tab with Gemini Proxy badge in CareerGuidanceAssistant', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <CareerGuidanceAssistant />
      </JobProvider>
    );

    expect(html).toContain('data-testid="tab-interview-coach"');
    expect(html).toContain('Interview Coach');
    expect(html).toContain('Gemini Proxy');
  });

  it('wires uploaded resume context, specific job application selector, and /api/chat error handling in CareerGuidanceAssistant', () => {
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/CareerGuidanceAssistant.tsx'),
      'utf8'
    );

    expect(src).toContain("mode: 'interview_coach'");
    expect(src).toContain('data-testid="coach-application-select"');
    expect(src).toContain('data-testid="coach-application-details"');
    expect(src).toContain('data-testid="coach-resume-upload"');
    expect(src).toContain('data-testid="coach-resume-text-input"');
    expect(src).toContain('data-testid="coach-chat-input"');
    expect(src).toContain('data-testid="coach-error-banner"');
    expect(src).toContain('if (!res.ok)');
    expect(src).toContain('interviewContext');
    expect(src).not.toContain('dangerouslySetInnerHTML');
  });

  it('fences candidate resume & job application details in server.ts and secure-gemini-proxy/server.js', () => {
    const serverSrc = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(serverSrc).toContain('INTERVIEW_COACH_SYSTEM_PROMPT');
    expect(serverSrc).toContain('validateAndSanitizeInterviewContext');
    expect(serverSrc).toContain('<candidate_context>');
    expect(serverSrc).toContain('<user_input>');
    expect(serverSrc).toContain("mode === 'interview_coach'");

    const proxySrc = fs.readFileSync(
      path.resolve(process.cwd(), 'secure-gemini-proxy/server.js'),
      'utf8'
    );
    expect(proxySrc).toContain('INTERVIEW_COACH_SYSTEM_PROMPT');
    expect(proxySrc).toContain('buildFencedCoachContext');
    expect(proxySrc).toContain('<candidate_context>');
  });
});

describe('Automated Job Matching Feature (JobProvider + Preference Controls)', () => {
  it('matches a jobseeker when salary requirement, preferred parish, and preferred sector align', () => {
    const result = evaluateJobMatchForJobseeker(sampleNewJob, baseCandidate);
    expect(result.matched).toBe(true);
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
    expect(result.reasons.some((r) => r.includes('St. George'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Renewable Energy & Geothermal'))).toBe(true);
  });

  it('supports Island-wide / Remote matching across parishes', () => {
    const remoteJob: JobListing = { ...sampleNewJob, parish: 'Island-wide / Remote' };
    expect(evaluateJobMatchForJobseeker(remoteJob, baseCandidate).matched).toBe(true);

    const remoteCandidate: UserAccount = {
      ...baseCandidate,
      preferredParish: 'Island-wide / Remote',
    };
    const portsmouthJob: JobListing = { ...sampleNewJob, parish: 'St. John' };
    expect(evaluateJobMatchForJobseeker(portsmouthJob, remoteCandidate).matched).toBe(true);
  });

  it('rejects listings below saved salary requirement, mismatched parish, mismatched sector, or expired jobs', () => {
    const underpaidJob: JobListing = { ...sampleNewJob, minSalary: 2500, maxSalary: 4200 };
    expect(evaluateJobMatchForJobseeker(underpaidJob, baseCandidate).matched).toBe(false);

    const wrongParishJob: JobListing = { ...sampleNewJob, parish: 'St. Patrick' };
    expect(evaluateJobMatchForJobseeker(wrongParishJob, baseCandidate).matched).toBe(false);

    const wrongSectorJob: JobListing = {
      ...sampleNewJob,
      sector: 'Banking & Financial Services',
    };
    expect(evaluateJobMatchForJobseeker(wrongSectorJob, baseCandidate).matched).toBe(false);

    const expiredJob: JobListing = {
      ...sampleNewJob,
      postedAt: '2020-01-01',
      isExpired: true,
      status: 'expired',
    };
    expect(evaluateJobMatchForJobseeker(expiredJob, baseCandidate).matched).toBe(false);

    const optedOutCandidate: UserAccount = {
      ...baseCandidate,
      autoMatchEmailsEnabled: false,
    };
    expect(evaluateJobMatchForJobseeker(sampleNewJob, optedOutCandidate).matched).toBe(false);
  });

  it('builds a formatted automated job match email notification for the matched jobseeker', () => {
    const evalRes = evaluateJobMatchForJobseeker(sampleNewJob, baseCandidate);
    const email = buildAutomatedJobMatchEmail(sampleNewJob, baseCandidate, evalRes.reasons);

    expect(email.recipientEmail).toBe('maxblanc10468@gmail.com');
    expect(email.type).toBe('job_alert');
    expect(email.relatedJobId).toBe('job-match-test-1');
    expect(email.subject).toContain('Automated Job Match');
    expect(email.subject).toContain('Senior Geothermal SCADA Engineer');
    expect(email.bodyHtml).toContain('EC$5,500 - EC$8,200');
    expect(email.bodyHtml).toContain('Renewable Energy & Geothermal');
  });

  it('proactively runs automated job matching inside JobProvider and syncs with /api/alerts/check-matches', () => {
    const ctxSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/context/JobContext.tsx'),
      'utf8'
    );
    expect(ctxSrc).toContain('runAutomatedJobMatchingForJob');
    expect(ctxSrc).toContain('evaluateJobMatchForJobseeker');
    expect(ctxSrc).toContain('knownJobIdsRef');
    expect(ctxSrc).toContain('notifiedJobseekerMatchesRef');
    expect(ctxSrc).toContain('registeredJobseekers');

    const serverSrc = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(serverSrc).toContain('registeredJobseekers');
    expect(serverSrc).toContain('minSalaryRequirement');
    expect(serverSrc).toContain('preferredParish');
    expect(serverSrc).toContain('preferredSector');
  });

  it('renders minimum salary requirement controls in JobAlertAutomationManager and SubscribeAlertModal', () => {
    const alertHtml = renderToStaticMarkup(
      <JobProvider>
        <JobAlertAutomationManager />
      </JobProvider>
    );
    expect(alertHtml).toContain('data-testid="alert-min-salary-input"');

    const modalHtml = renderToStaticMarkup(
      <JobProvider>
        <SubscribeAlertModal isOpen={true} onClose={() => {}} />
      </JobProvider>
    );
    expect(modalHtml).toContain('data-testid="subscribe-min-salary-input"');
  });
});
