import {
  JobListing,
  Parish,
  JobSector,
  EmploymentType,
  WorkModel,
  DatePostedFilter,
} from '../types';

export type { DatePostedFilter };

export interface FilterJobsOptions {
  activeTab?: string;
  showSavedOnly?: boolean;
  savedJobIds?: string[];
  searchQuery?: string;
  selectedParish?: Parish | 'All';
  selectedSector?: JobSector | 'All';
  selectedType?: EmploymentType | 'All';
  selectedWorkModel?: WorkModel | 'All';
  selectedDatePosted?: DatePostedFilter;
  datePosted?: DatePostedFilter;
  referenceDate?: string | number | Date;
  nepOnly?: boolean;
  minSalary?: number;
  sortBy?: 'recent' | 'salaryHigh' | 'views';
}

function getDatePostedMaxAgeMs(filterValue?: DatePostedFilter): number | null {
  if (!filterValue) return null;
  const normalized = filterValue.trim().toLowerCase();
  if (normalized === 'all' || normalized === 'any' || normalized === 'any time') {
    return null;
  }
  if (normalized === 'last 24 hours' || normalized === '24h' || normalized === '1d') {
    return 24 * 60 * 60 * 1000;
  }
  if (normalized === 'last 7 days' || normalized === '7d') {
    return 7 * 24 * 60 * 60 * 1000;
  }
  if (normalized === 'last 30 days' || normalized === '30d') {
    return 30 * 24 * 60 * 60 * 1000;
  }
  return null;
}

/**
 * Pure helper function to filter and sort job listings.
 * Used in App.tsx with debounced search query and in unit tests.
 */
export function filterAndSortJobs(
  jobs: JobListing[],
  options: FilterJobsOptions = {}
): JobListing[] {
  const {
    activeTab = 'jobs',
    showSavedOnly = false,
    savedJobIds = [],
    searchQuery = '',
    selectedParish = 'All',
    selectedSector = 'All',
    selectedType = 'All',
    selectedWorkModel = 'All',
    selectedDatePosted,
    datePosted,
    referenceDate,
    nepOnly = false,
    minSalary = 0,
    sortBy = 'recent',
  } = options;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const activeDateFilter = selectedDatePosted ?? datePosted ?? 'All';
  const maxAgeMs = getDatePostedMaxAgeMs(activeDateFilter);
  const referenceTimestampMs =
    referenceDate !== undefined ? new Date(referenceDate).getTime() : Date.now();

  return jobs
    .filter((job) => {
      // If on remote tab, filter only remote roles
      if (activeTab === 'remote' && job.workModel !== 'Remote') {
        return false;
      }

      // Saved only filter
      if (showSavedOnly && !savedJobIds.includes(job.id)) {
        return false;
      }

      // Keyword search
      if (trimmedQuery) {
        const matchesTitle = job.title.toLowerCase().includes(trimmedQuery);
        const matchesCompany = job.company.toLowerCase().includes(trimmedQuery);
        const matchesDesc = job.description.toLowerCase().includes(trimmedQuery);
        const matchesLocation = job.locality.toLowerCase().includes(trimmedQuery);
        if (!matchesTitle && !matchesCompany && !matchesDesc && !matchesLocation) {
          return false;
        }
      }

      // Parish filter
      if (selectedParish !== 'All' && job.parish !== selectedParish) {
        return false;
      }

      // Sector filter
      if (selectedSector !== 'All' && job.sector !== selectedSector) {
        return false;
      }

      // Employment Type filter
      if (selectedType !== 'All' && job.employmentType !== selectedType) {
        return false;
      }

      // Work Model filter
      if (selectedWorkModel !== 'All' && job.workModel !== selectedWorkModel) {
        return false;
      }

      // Date Posted filter ('Last 24 hours', 'Last 7 days', 'Last 30 days')
      if (maxAgeMs !== null) {
        if (!job.postedAt) return false;
        const postedTimeMs = new Date(job.postedAt).getTime();
        if (isNaN(postedTimeMs)) return false;
        const diffMs = referenceTimestampMs - postedTimeMs;
        if (diffMs < -86400000 || diffMs > maxAgeMs) {
          return false;
        }
      }

      // NEP Approved only
      if (nepOnly && !job.isNepApproved) {
        return false;
      }

      // Salary filter
      if (typeof minSalary === 'number' && job.maxSalary < minSalary) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'salaryHigh') {
        return b.maxSalary - a.maxSalary;
      }
      if (sortBy === 'views') {
        return b.viewsCount - a.viewsCount;
      }
      // 'recent' by default (featured first, then date)
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
}
