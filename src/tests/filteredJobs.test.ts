import { describe, it, expect } from 'vitest';
import { filterAndSortJobs, FilterJobsOptions } from '../utils/filterJobs';
import { JobListing } from '../types';

const mockJobs: JobListing[] = [
  {
    id: 'job-1',
    title: 'Senior SCADA Engineer',
    company: 'Dominica Geothermal Co',
    parish: 'St. George',
    locality: 'Roseau Valley',
    sector: 'Renewable Energy & Geothermal',
    employmentType: 'Full-Time',
    workModel: 'On-site',
    minSalary: 7000,
    maxSalary: 9500,
    salaryPeriod: 'month',
    currency: 'XCD',
    description: 'High-voltage geothermal power plant grid operations.',
    responsibilities: ['Monitor grid stability'],
    requirements: ['Degree in Electrical Engineering'],
    benefits: ['Health coverage'],
    screeningQuestions: [],
    contactEmail: 'careers@dgdc.dm',
    applicationDeadline: '2026-11-01T10:00:00Z',
    postedAt: '2026-09-01T10:00:00Z',
    viewsCount: 120,
    applicantsCount: 8,
    recruiterId: 'rec_dgdc',
    featured: true,
    isNepApproved: true,
  },
  {
    id: 'job-2',
    title: 'Eco-Resort Guest Experience Lead',
    company: 'Secret Bay Luxury Villas',
    parish: 'St. John',
    locality: 'Portsmouth',
    sector: 'Eco-Tourism & Hospitality',
    employmentType: 'Full-Time',
    workModel: 'On-site',
    minSalary: 4200,
    maxSalary: 5800,
    salaryPeriod: 'month',
    currency: 'XCD',
    description: 'Lead world-class hospitality experience in Portsmouth.',
    responsibilities: ['VIP guest coordination'],
    requirements: ['Hospitality management certificate'],
    benefits: ['Tips', 'Transport'],
    screeningQuestions: [],
    contactEmail: 'hr@secretbay.dm',
    applicationDeadline: '2026-10-30T12:00:00Z',
    postedAt: '2026-09-15T12:00:00Z',
    viewsCount: 340,
    applicantsCount: 22,
    recruiterId: 'rec_secret_bay',
    featured: false,
    isNepApproved: false,
  },
  {
    id: 'job-3',
    title: 'Remote Full-Stack React Developer',
    company: 'Nature Isle Digital Hub',
    parish: 'St. George',
    locality: 'Roseau / Global',
    sector: 'Information Technology & Digital',
    employmentType: 'Contract',
    workModel: 'Remote',
    minSalary: 8000,
    maxSalary: 11000,
    salaryPeriod: 'month',
    currency: 'XCD',
    description: 'Build modern TypeScript platforms under Dominica WIN Extended Visa sponsorship.',
    responsibilities: ['Develop React & Express applications'],
    requirements: ['React, TypeScript, Node.js'],
    benefits: ['Remote stipend', 'Flexible hours'],
    screeningQuestions: [],
    contactEmail: 'dev@natureisledigital.dm',
    applicationDeadline: '2026-11-15T08:00:00Z',
    postedAt: '2026-09-20T08:00:00Z',
    viewsCount: 510,
    applicantsCount: 45,
    recruiterId: 'rec_nature_isle',
    featured: true,
    isNepApproved: true,
  },
  {
    id: 'job-4',
    title: 'Agro-Forestry Soil Specialist',
    company: 'Kalinago Organics Co-op',
    parish: 'St. David',
    locality: 'Salybia',
    sector: 'Agriculture & Agro-Processing',
    employmentType: 'Part-Time',
    workModel: 'On-site',
    minSalary: 2500,
    maxSalary: 3200,
    salaryPeriod: 'month',
    currency: 'XCD',
    description: 'Promote organic vanilla and root crop cultivation in Kalinago Territory.',
    responsibilities: ['Soil quality testing'],
    requirements: ['Agriculture experience'],
    benefits: ['Fresh produce allocation'],
    screeningQuestions: [],
    contactEmail: 'info@kalinagoorganics.dm',
    applicationDeadline: '2026-10-15T14:00:00Z',
    postedAt: '2026-08-10T14:00:00Z',
    viewsCount: 85,
    applicantsCount: 4,
    recruiterId: 'rec_kalinago',
    featured: false,
    isNepApproved: false,
  },
];

describe('filterAndSortJobs logic', () => {
  it('returns all jobs when default options are passed', () => {
    const result = filterAndSortJobs(mockJobs);
    expect(result.length).toBe(4);
  });

  describe('Keyword search', () => {
    it('filters by title case-insensitively', () => {
      const result = filterAndSortJobs(mockJobs, { searchQuery: 'react' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-3');
    });

    it('filters by company name', () => {
      const result = filterAndSortJobs(mockJobs, { searchQuery: 'Secret Bay' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-2');
    });

    it('filters by locality', () => {
      const result = filterAndSortJobs(mockJobs, { searchQuery: 'Portsmouth' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-2');
    });

    it('filters by description keywords', () => {
      const result = filterAndSortJobs(mockJobs, { searchQuery: 'geothermal' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-1');
    });

    it('ignores leading/trailing whitespace in search query', () => {
      const result = filterAndSortJobs(mockJobs, { searchQuery: '   react   ' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-3');
    });

    it('returns empty array when search query matches nothing', () => {
      const result = filterAndSortJobs(mockJobs, { searchQuery: 'xyznonexistentterm' });
      expect(result.length).toBe(0);
    });
  });

  describe('Parish and Sector filters', () => {
    it('filters by specific Dominican parish', () => {
      const result = filterAndSortJobs(mockJobs, { selectedParish: 'St. David' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-4');
    });

    it('returns all parishes when parish is All', () => {
      const result = filterAndSortJobs(mockJobs, { selectedParish: 'All' });
      expect(result.length).toBe(4);
    });

    it('filters by industry sector', () => {
      const result = filterAndSortJobs(mockJobs, {
        selectedSector: 'Eco-Tourism & Hospitality',
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-2');
    });
  });

  describe('Work Model & Remote Tab', () => {
    it('filters for Remote work model only when selected', () => {
      const result = filterAndSortJobs(mockJobs, { selectedWorkModel: 'Remote' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-3');
    });

    it('forces workModel === Remote when activeTab is remote', () => {
      const result = filterAndSortJobs(mockJobs, { activeTab: 'remote' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-3');
    });
  });

  describe('NEP Approval & Salary Thresholds', () => {
    it('filters only NEP approved jobs when nepOnly is true', () => {
      const result = filterAndSortJobs(mockJobs, { nepOnly: true });
      expect(result.length).toBe(2);
      expect(result.every((j) => j.isNepApproved)).toBe(true);
    });

    it('filters jobs where maxSalary is at or above minSalary threshold', () => {
      // Jobs with maxSalary >= 6000: job-1 (9500) and job-3 (11000)
      const result = filterAndSortJobs(mockJobs, { minSalary: 6000 });
      expect(result.length).toBe(2);
      expect(result.map((j) => j.id).sort()).toEqual(['job-1', 'job-3']);
    });
  });

  describe('Saved Jobs Filter', () => {
    it('filters only saved job IDs when showSavedOnly is true', () => {
      const result = filterAndSortJobs(mockJobs, {
        showSavedOnly: true,
        savedJobIds: ['job-2', 'job-4'],
      });
      expect(result.length).toBe(2);
      expect(result.map((j) => j.id)).toContain('job-2');
      expect(result.map((j) => j.id)).toContain('job-4');
    });
  });

  describe('Sorting behaviors', () => {
    it('sorts by salaryHigh descending', () => {
      const result = filterAndSortJobs(mockJobs, { sortBy: 'salaryHigh' });
      expect(result[0].id).toBe('job-3'); // 11000
      expect(result[1].id).toBe('job-1'); // 9500
      expect(result[2].id).toBe('job-2'); // 5800
      expect(result[3].id).toBe('job-4'); // 3200
    });

    it('sorts by viewsCount descending', () => {
      const result = filterAndSortJobs(mockJobs, { sortBy: 'views' });
      expect(result[0].id).toBe('job-3'); // 510
      expect(result[1].id).toBe('job-2'); // 340
      expect(result[2].id).toBe('job-1'); // 120
      expect(result[3].id).toBe('job-4'); // 85
    });

    it('prioritizes featured jobs before non-featured jobs in recent sort', () => {
      const result = filterAndSortJobs(mockJobs, { sortBy: 'recent' });
      // Both job-3 and job-1 are featured:
      expect(result[0].featured).toBe(true);
      expect(result[1].featured).toBe(true);
      // Non-featured jobs follow:
      expect(result[2].featured).toBe(false);
      expect(result[3].featured).toBe(false);
    });
  });
});
