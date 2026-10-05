import { JobListing, Parish, JobSector, EmploymentType, WorkModel } from '../types';

export interface FilterJobsOptions {
  activeTab?: string;
  showSavedOnly?: boolean;
  savedJobIds?: string[];
  searchQuery?: string;
  selectedParish?: Parish | 'All';
  selectedSector?: JobSector | 'All';
  selectedType?: EmploymentType | 'All';
  selectedWorkModel?: WorkModel | 'All';
  nepOnly?: boolean;
  minSalary?: number;
  sortBy?: 'recent' | 'salaryHigh' | 'views';
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
    nepOnly = false,
    minSalary = 0,
    sortBy = 'recent',
  } = options;

  const trimmedQuery = searchQuery.trim().toLowerCase();

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
