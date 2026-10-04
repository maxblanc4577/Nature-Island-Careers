import React from 'react';
import { CandidateProfileHub } from './CandidateProfileHub';

interface MyApplicationsDashboardProps {
  onBrowseJobs: () => void;
  onSelectJob: (jobId: string) => void;
  initialSubTab?: 'details' | 'applications' | 'resume_builder' | 'saved_jobs' | 'job_alerts';
}

export const MyApplicationsDashboard: React.FC<MyApplicationsDashboardProps> = ({
  onBrowseJobs,
  onSelectJob,
  initialSubTab = 'applications',
}) => {
  return (
    <CandidateProfileHub
      onBrowseJobs={onBrowseJobs}
      onSelectJob={onSelectJob}
      initialSubTab={initialSubTab}
    />
  );
};
