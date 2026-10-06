import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { ApplicationStatus, JobListing } from '../types';
import { BillingHistory } from './BillingHistory';
import {
  Building,
  PlusCircle,
  Users,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  Mail,
  MapPin,
  FileText,
  Receipt,
  BellRing,
  Send,
} from 'lucide-react';

interface RecruiterPortalProps {
  onOpenPostJob: () => void;
  onOpenSubscription: () => void;
  onScheduleInterview: (applicationId: string, candidateName: string, jobTitle: string) => void;
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
    recruiters,
    setCurrentRecruiterId,
    sendRecruiterReminders,
    invoices,
    stripeSettings,
  } = useJobContext();

  const [activePortalTab, setActivePortalTab] = useState<'candidates' | 'billing'>('candidates');
  const [selectedJobId, setSelectedJobId] = useState<string | 'all'>('all');
  const [reminderStatusMsg, setReminderStatusMsg] = useState<string | null>(null);

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
            Manage your classified listings, review candidate resumes, and automate monthly recurring Stripe payments.
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
            onClick={onOpenPostJob}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Vacancy</span>
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
      <div className="flex border-b border-slate-200 gap-2">
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
              <p className="text-xs font-bold text-blue-600 uppercase">In Pipeline</p>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {relevantApplications.filter((a) => a.status === 'Screened' || a.status === 'Shortlisted' || a.status === 'Interview Scheduled').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-purple-600 uppercase">Monthly Stripe Renewal</p>
              <p className="text-sm font-black text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {stripeSettings.autoRenewEnabled ? 'Active (Auto-Renew)' : 'Manual Renewal'}
              </p>
            </div>
          </div>

          {/* Active Listings Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Active Job Classifieds</h3>
                <p className="text-xs text-slate-600">Select a listing to filter the applicant pipeline below</p>
              </div>

              <div className="flex items-center space-x-2">
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

          {/* Applicant Tracking Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Applicant Pipeline ({relevantApplications.length})
                </h3>
                <p className="text-xs text-slate-600">
                  Screen candidates, update status, and book interview sessions
                </p>
              </div>
            </div>

            {relevantApplications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No candidate applications recorded for this selection yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Applicant Name</th>
                      <th className="p-3">Job Applied For</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Resume & Pitch</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {relevantApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          <div>{app.applicantName}</div>
                          <div className="text-[11px] font-normal text-slate-600 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {app.applicantEmail}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-800">{app.jobTitle}</td>
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
                        </td>
                        <td className="p-3">
                          <select
                            value={app.status}
                            onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white cursor-pointer"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Screened">Screened</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Offer Extended">Offer Extended</option>
                            <option value="Hired">Hired</option>
                            <option value="Archived">Archived</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onScheduleInterview(app.id, app.applicantName, app.jobTitle)}
                            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5 text-amber-700" />
                            <span>Schedule</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
