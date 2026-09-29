import React from 'react';
import { useJobContext } from '../context/JobContext';
import {
  FileText,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  ArrowRight,
} from 'lucide-react';

interface MyApplicationsDashboardProps {
  onBrowseJobs: () => void;
  onSelectJob: (jobId: string) => void;
}

export const MyApplicationsDashboard: React.FC<MyApplicationsDashboardProps> = ({
  onBrowseJobs,
  onSelectJob,
}) => {
  const { applications, jobs, withdrawApplication } = useJobContext();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Offer Extended':
      case 'Hired':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {status}
          </span>
        );
      case 'Interview Scheduled':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-extrabold px-2.5 py-1 rounded-full border border-amber-300">
            <Calendar className="w-3.5 h-3.5 text-amber-600" /> Interview Scheduled
          </span>
        );
      case 'Shortlisted':
      case 'Screened':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-1 rounded-full border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> {status}
          </span>
        );
      case 'Archived':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-300">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-300">
            Applied
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Candidate Hub • Commonwealth of Dominica
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">My Job Applications</h2>
          <p className="text-sm text-emerald-100/90 mt-1 max-w-xl">
            Track your candidate submissions, interview invites from Dominican employers, and employer status updates.
          </p>
        </div>
        <button
          onClick={onBrowseJobs}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-center cursor-pointer"
        >
          <span>Find More Classifieds</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-600 uppercase">Total Submitted</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{applications.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-blue-600 uppercase">Screened / Shortlisted</p>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {applications.filter((a) => a.status === 'Screened' || a.status === 'Shortlisted').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-amber-600 uppercase">Interviews</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {applications.filter((a) => a.status === 'Interview Scheduled').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-emerald-600 uppercase">Offers / Hired</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {applications.filter((a) => a.status === 'Offer Extended' || a.status === 'Hired').length}
          </p>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No applications yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You haven't submitted any job applications yet. Browse the Dominica classifieds board to discover positions in Roseau, Portsmouth, and across the island.
          </p>
          <button
            onClick={onBrowseJobs}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            Explore Open Positions
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const job = jobs.find((j) => j.id === app.jobId);
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3
                        onClick={() => job && onSelectJob(job.id)}
                        className="text-base sm:text-lg font-extrabold text-slate-900 hover:text-emerald-700 cursor-pointer"
                      >
                        {app.jobTitle}
                      </h3>
                      {job?.workModel === 'Remote' && (
                        <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200">
                          WIN Permit
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1 font-medium">
                      <span className="flex items-center gap-1 text-slate-800 font-bold">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {app.companyName}
                      </span>
                      {job && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {job.locality} ({job.parish})
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Applied: {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-start sm:self-center">
                    {getStatusBadge(app.status)}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to withdraw this application?')) {
                          withdrawApplication(app.id);
                        }
                      }}
                      title="Withdraw application"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Candidate notes and resume */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-600">Applicant: {app.applicantName} ({app.applicantEmail})</span>
                    <span className="text-emerald-700 font-bold">Resume: {app.resumeFileName}</span>
                  </div>
                  {app.coverNote && (
                    <p className="text-slate-600 italic border-l-2 border-emerald-500 pl-2">
                      "{app.coverNote}"
                    </p>
                  )}
                  {app.interviewDetails && (
                    <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        Interview: <strong>{app.interviewDetails.date} at {app.interviewDetails.time}</strong>
                      </span>
                      <span>Format: {app.interviewDetails.mode} ({app.interviewDetails.location})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
