import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JobProvider, isJobListingExpired, JOB_EXPIRATION_DAYS, DEFAULT_SITE_SETTINGS } from '../context/JobContext';
import { JobCard } from '../components/JobCard';
import { SalaryRangeDistributionChart, SALARY_BRACKETS } from '../components/SalaryRangeDistributionChart';
import { RecruiterPortal } from '../components/RecruiterPortal';
import { JobListing, SiteSettings } from '../types';

const mockJobBelowThreshold: JobListing = {
  id: 'job-test-standard',
  title: 'Junior Eco-Tour Guide',
  company: 'Dominica Nature Tours',
  parish: 'St. George',
  locality: 'Roseau Bayfront',
  sector: 'Eco-Tourism & Hospitality',
  employmentType: 'Full-Time',
  workModel: 'On-site',
  minSalary: 2500,
  maxSalary: 4500, // < 8000
  salaryPeriod: 'month',
  isNepApproved: true,
  featured: false,
  description: 'Lead eco-treks across the Waitukubuli National Trail.',
  responsibilities: ['Guide hikers', 'Share flora/fauna facts'],
  requirements: ['CPR certified', 'Good physical condition'],
  benefits: ['Stipend', 'Gear allowance'],
  screeningQuestions: [],
  contactEmail: 'tours@natureisle.dm',
  applicationDeadline: '2026-11-30',
  postedAt: '2026-10-15',
  viewsCount: 15,
  applicantsCount: 2,
  recruiterId: 'rec_fort_young',
};

const mockJobCompetitive: JobListing = {
  id: 'job-test-competitive',
  title: 'Lead Geothermal Systems Specialist',
  company: 'Dominica Geothermal Development Co.',
  parish: 'St. George',
  locality: 'Laudat Geothermal Field',
  sector: 'Renewable Energy & Geothermal',
  employmentType: 'Full-Time',
  workModel: 'Hybrid',
  minSalary: 7500,
  maxSalary: 9500, // >= 8000
  salaryPeriod: 'month',
  isNepApproved: false,
  featured: true,
  description: 'Oversee binary geothermal power cycle operations in Laudat Valley.',
  responsibilities: ['System telemetry', 'Wellhead inspection'],
  requirements: ['Mechanical/Chemical Engineering Degree'],
  benefits: ['Health plan', 'Vehicle allowance'],
  screeningQuestions: [],
  contactEmail: 'careers@geothermal.dm',
  applicationDeadline: '2026-11-20',
  postedAt: '2026-10-10',
  viewsCount: 88,
  applicantsCount: 8,
  recruiterId: 'rec_fort_young',
};

const mockJobExpired: JobListing = {
  id: 'job-test-expired',
  title: 'Historic Masonry Restoration Tech',
  company: 'Fort Young Hotel & Dive Resort',
  parish: 'St. George',
  locality: 'Victoria Street, Roseau',
  sector: 'Eco-Tourism & Hospitality',
  employmentType: 'Full-Time',
  workModel: 'On-site',
  minSalary: 3500,
  maxSalary: 5500,
  salaryPeriod: 'month',
  isNepApproved: true,
  featured: false,
  description: 'Restoration of 17th-century volcanic stone walls.',
  responsibilities: ['Historic masonry'],
  requirements: ['5 years experience'],
  benefits: ['Meals provided'],
  screeningQuestions: [],
  contactEmail: 'careers@fortyounghotel.com',
  applicationDeadline: '2026-08-01',
  postedAt: '2026-07-01', // > 45 days ago
  viewsCount: 120,
  applicantsCount: 5,
  recruiterId: 'rec_fort_young',
  isExpired: true,
  status: 'expired',
};

describe('JobCard: Competitive Salary Tag & Save Job Heart Button', () => {
  it('renders a subtle "Competitive" tag when maxSalary meets or exceeds threshold (EC$ 8,000)', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <JobCard
          job={mockJobCompetitive}
          onSelect={() => {}}
          onApply={() => {}}
        />
      </JobProvider>
    );

    expect(html).toContain('data-testid="competitive-salary-tag-job-test-competitive"');
    expect(html).toContain('Competitive');
  });

  it('does NOT render the "Competitive" tag when maxSalary is below threshold', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <JobCard
          job={mockJobBelowThreshold}
          onSelect={() => {}}
          onApply={() => {}}
        />
      </JobProvider>
    );

    expect(html).not.toContain('data-testid="competitive-salary-tag-job-test-standard"');
  });

  it('renders Save Job heart button with data-testid, aria-label, and heart icon', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <JobCard
          job={mockJobCompetitive}
          onSelect={() => {}}
          onApply={() => {}}
        />
      </JobProvider>
    );

    expect(html).toContain('data-testid="save-job-btn-job-test-competitive"');
    expect(html).toContain('aria-label="Save Job"');
    expect(html).toContain('fill-none');
  });
});

describe('Automated 45-Day Job Expiration Logic', () => {
  it('defines expiration period of 45 days', () => {
    expect(JOB_EXPIRATION_DAYS).toBe(45);
  });

  it('correctly calculates expiration status based on postedAt timestamp', () => {
    const fixedNow = new Date('2026-10-26T12:00:00Z').getTime();

    // 10 days old -> not expired
    const recentJob = {
      postedAt: '2026-10-16',
      isExpired: false,
    };
    expect(isJobListingExpired(recentJob, fixedNow)).toBe(false);

    // 50 days old -> expired
    const oldJob = {
      postedAt: '2026-08-30',
      isExpired: false,
    };
    expect(isJobListingExpired(oldJob, fixedNow)).toBe(true);

    // Flagged expired -> expired
    const flaggedJob = {
      postedAt: '2026-10-20',
      isExpired: true,
    };
    expect(isJobListingExpired(flaggedJob, fixedNow)).toBe(true);
  });

  it('verifies default siteSettings has competitiveSalaryThreshold configured to 8000', () => {
    expect(DEFAULT_SITE_SETTINGS.competitiveSalaryThreshold).toBe(8000);
  });
});

describe('SalaryRangeDistributionChart Component', () => {
  const sampleJobs: JobListing[] = [
    { ...mockJobBelowThreshold, id: 'j-1', minSalary: 2000, maxSalary: 2800 }, // mid = 2400 (< 3k)
    { ...mockJobBelowThreshold, id: 'j-2', minSalary: 3200, maxSalary: 4200 }, // mid = 3700 (3k-5k)
    { ...mockJobBelowThreshold, id: 'j-3', minSalary: 3800, maxSalary: 4800 }, // mid = 4300 (3k-5k)
    { ...mockJobBelowThreshold, id: 'j-4', minSalary: 5500, maxSalary: 6500 }, // mid = 6000 (5k-7.5k)
    { ...mockJobCompetitive, id: 'j-5', minSalary: 8000, maxSalary: 9600 },    // mid = 8800 (7.5k-10k)
    { ...mockJobCompetitive, id: 'j-6', minSalary: 11000, maxSalary: 15000 },  // mid = 13000 (> 10k)
  ];

  it('renders all 5 EC$ brackets in the distribution chart', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <SalaryRangeDistributionChart jobs={sampleJobs} />
      </JobProvider>
    );

    expect(html).toContain('data-testid="salary-distribution-chart"');

    SALARY_BRACKETS.forEach((bracket) => {
      expect(html).toContain(`data-testid="salary-bracket-row-${bracket.id}"`);
      expect(html).toContain(`data-testid="bracket-count-${bracket.id}"`);
    });
  });

  it('calculates counts correctly for sample jobs across brackets', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <SalaryRangeDistributionChart jobs={sampleJobs} />
      </JobProvider>
    );

    // j-1 is in under-3k (1 vacancy)
    expect(html).toContain('1 vacancy');
    // j-2 and j-3 are in 3k-5k (2 vacancies)
    expect(html).toContain('2 vacancies');
    // EC$ currency label is present
    expect(html).toContain('EC$');
  });
});

describe('RecruiterPortal: Expired Listings Filter & Badges', () => {
  it('renders the classifieds expiry filter toolbar and expired badge on expired listings', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <RecruiterPortal
          onOpenSubscription={() => {}}
          onScheduleInterview={() => {}}
        />
      </JobProvider>
    );

    expect(html).toContain('data-testid="filter-all-jobs"');
    expect(html).toContain('data-testid="filter-active-jobs"');
    expect(html).toContain('data-testid="filter-expired-jobs"');
    expect(html).toContain('All Classifieds');
  });
});
