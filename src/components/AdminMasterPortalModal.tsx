import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { JobListing, Parish, JobSector, ApplicationStatus, RecruiterAccount } from '../types';
import {
  X,
  Shield,
  Briefcase,
  Building,
  Users,
  Settings,
  Trash2,
  Edit3,
  CheckCircle2,
  PlusCircle,
  FileDown,
  RefreshCw,
  Sparkles,
  Lock,
  Mail,
  Eye,
  Sliders,
  AlertTriangle,
  Globe,
  DollarSign,
  CreditCard,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

interface AdminMasterPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: {
    siteName: string;
    contactEmail: string;
    announcement: string;
    currencyPeg: number;
    showEmergencyBanner: boolean;
    backgroundImageUrl?: string;
    fullPageBackground?: boolean;
  };
  onUpdateSiteSettings: (settings: {
    siteName: string;
    contactEmail: string;
    announcement: string;
    currencyPeg: number;
    showEmergencyBanner: boolean;
    backgroundImageUrl?: string;
    fullPageBackground?: boolean;
  }) => void;
  onOpenStripe?: () => void;
}

export const AdminMasterPortalModal: React.FC<AdminMasterPortalModalProps> = ({
  isOpen,
  onClose,
  siteSettings,
  onUpdateSiteSettings,
  onOpenStripe,
}) => {
  const {
    jobs,
    updateJob,
    deleteJob,
    createJob,
    recruiters,
    applications,
    updateApplicationStatus,
    syncRecords,
    runSyncSimulation,
    exportDatabaseCSV,
  } = useJobContext();

  const [activeTab, setActiveTab] = useState<'jobs' | 'recruiters' | 'applications' | 'settings' | 'sync' | 'stripe'>('jobs');

  // Job editing modal state
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);

  // Settings form state
  const [siteName, setSiteName] = useState(siteSettings.siteName || 'Nature Island Careers');
  const [contactEmail, setContactEmail] = useState(siteSettings.contactEmail || 'info@natureislandcareers.com');
  const [announcement, setAnnouncement] = useState(siteSettings.announcement);
  const [currencyPeg, setCurrencyPeg] = useState(siteSettings.currencyPeg || 2.70);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(siteSettings.showEmergencyBanner || false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(siteSettings.backgroundImageUrl || '/nature_island_photo.svg');
  const [fullPageBackground, setFullPageBackground] = useState(siteSettings.fullPageBackground || false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // New quick job form
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('Dominica Public Works Ltd');
  const [newParish, setNewParish] = useState<Parish>('St. George');
  const [newSector, setNewSector] = useState<JobSector>('Eco-Tourism & Hospitality');
  const [newMinSalary, setNewMinSalary] = useState(3500);
  const [newMaxSalary, setNewMaxSalary] = useState(5500);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings({
      siteName,
      contactEmail,
      announcement,
      currencyPeg,
      showEmergencyBanner,
      backgroundImageUrl,
      fullPageBackground,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleSaveJobEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    updateJob(editingJob.id, {
      title: editingJob.title,
      company: editingJob.company,
      parish: editingJob.parish,
      locality: editingJob.locality,
      sector: editingJob.sector,
      minSalary: Number(editingJob.minSalary),
      maxSalary: Number(editingJob.maxSalary),
      featured: editingJob.featured,
      isNepApproved: editingJob.isNepApproved,
      description: editingJob.description,
    });

    setEditingJob(null);
  };

  const handleCreateQuickJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    createJob({
      title: newTitle,
      company: newCompany,
      parish: newParish,
      locality: `${newParish}, Dominica`,
      sector: newSector,
      employmentType: 'Full-Time',
      workModel: 'On-site',
      minSalary: newMinSalary,
      maxSalary: newMaxSalary,
      salaryPeriod: 'month',
      isNepApproved: false,
      featured: true,
      description: `Official administrative posting added by system management for ${newCompany} in ${newParish}.`,
      responsibilities: ['Ensure compliance with Dominica industry standards'],
      requirements: ['Valid work authorization in the Commonwealth of Dominica'],
      benefits: ['Dominica Social Security covered'],
      screeningQuestions: [],
      contactEmail,
      applicationDeadline: '2026-11-30',
      recruiterId: 'rec_fort_young',
    });

    setNewTitle('');
    setIsAddingJob(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-emerald-900/30 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-xl border border-emerald-500/40 text-amber-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">Nature Island Careers • Admin Command Center</h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Live platform administration, classified modifications, employer registry & global settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'jobs'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Classifieds ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recruiters')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recruiters'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Employers ({recruiters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'applications'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Applications ({applications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Global App Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('stripe')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stripe'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span>Stripe Payment Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync & DB Tools</span>
          </button>
        </div>

        {/* Tab 1: CLASSIFIEDS MANAGEMENT */}
        {activeTab === 'jobs' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">All Island Classified Vacancies</h3>
                <p className="text-xs text-slate-500">Edit parameters, pin featured vacancies, or remove listings live</p>
              </div>

              <button
                onClick={() => setIsAddingJob(!isAddingJob)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAddingJob ? 'Close Form' : 'Quick Add Vacancy'}</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {isAddingJob && (
              <form onSubmit={handleCreateQuickJob} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-emerald-900">Add New Classified Vacancy</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Job Title *"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Company Name *"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <select
                    value={newParish}
                    onChange={(e) => setNewParish(e.target.value as Parish)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="St. George">St. George (Roseau)</option>
                    <option value="St. John">St. John (Portsmouth)</option>
                    <option value="St. Paul">St. Paul</option>
                    <option value="St. Andrew">St. Andrew</option>
                    <option value="St. Patrick">St. Patrick</option>
                    <option value="St. Joseph">St. Joseph</option>
                    <option value="St. David">St. David</option>
                    <option value="St. Luke">St. Luke</option>
                    <option value="St. Mark">St. Mark</option>
                    <option value="St. Peter">St. Peter</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Publish to Board
                  </button>
                </div>
              </form>
            )}

            {/* Classifieds Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Job Title & Sector</th>
                    <th className="p-3">Employer</th>
                    <th className="p-3">Parish</th>
                    <th className="p-3">Salary (EC$)</th>
                    <th className="p-3">Status Badges</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{job.title}</span>
                        <span className="text-[11px] text-slate-500">{job.sector}</span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{job.company}</td>
                      <td className="p-3 text-slate-600">{job.parish}</td>
                      <td className="p-3 font-semibold text-emerald-800">
                        ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateJob(job.id, { featured: !job.featured })}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                              job.featured
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {job.featured ? '★ Featured' : '+ Feature'}
                          </button>
                          {job.isNepApproved && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                              NEP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingJob(job)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1 cursor-pointer"
                          title="Edit Job"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete listing "${job.title}"?`)) {
                              deleteJob(job.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* In-Line Job Edit Drawer/Modal */}
            {editingJob && (
              <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h4 className="font-bold text-slate-900">Edit Vacancy: {editingJob.title}</h4>
                    <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveJobEdit} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Title</label>
                      <input
                        type="text"
                        value={editingJob.title}
                        onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Company</label>
                        <input
                          type="text"
                          value={editingJob.company}
                          onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                          className="w-full px-3 py-1.5 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Parish</label>
                        <select
                          value={editingJob.parish}
                          onChange={(e) => setEditingJob({ ...editingJob, parish: e.target.value as Parish })}
                          className="w-full px-3 py-1.5 border rounded-lg bg-white"
                        >
                          <option value="St. George">St. George</option>
                          <option value="St. John">St. John</option>
                          <option value="St. Paul">St. Paul</option>
                          <option value="St. Andrew">St. Andrew</option>
                          <option value="St. Patrick">St. Patrick</option>
                          <option value="St. Joseph">St. Joseph</option>
                          <option value="St. David">St. David</option>
                          <option value="St. Luke">St. Luke</option>
                          <option value="St. Mark">St. Mark</option>
                          <option value="St. Peter">St. Peter</option>
                          <option value="Island-wide / Remote">Island-wide / Remote</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Min Salary (EC$)</label>
                        <input
                          type="number"
                          value={editingJob.minSalary}
                          onChange={(e) => setEditingJob({ ...editingJob, minSalary: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Max Salary (EC$)</label>
                        <input
                          type="number"
                          value={editingJob.maxSalary}
                          onChange={(e) => setEditingJob({ ...editingJob, maxSalary: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={editingJob.description}
                        onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingJob.featured}
                          onChange={(e) => setEditingJob({ ...editingJob, featured: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>Featured Pin</span>
                      </label>
                      <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingJob.isNepApproved}
                          onChange={(e) => setEditingJob({ ...editingJob, isNepApproved: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>NEP Approved</span>
                      </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setEditingJob(null)}
                        className="px-4 py-1.5 border rounded-lg text-slate-600 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: RECRUITERS & EMPLOYERS */}
        {activeTab === 'recruiters' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">Accredited Dominican Employers</h3>
              <p className="text-xs text-slate-500">Manage verified statuses, DSS numbers, and employer permissions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recruiters.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{r.companyName}</h4>
                      <p className="text-xs text-slate-600">{r.industry} · {r.parish}</p>
                    </div>
                    {r.verified && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>Contact: <strong>{r.contactPerson}</strong> ({r.email})</p>
                    <p>DSS Reg: <span className="font-mono text-slate-800 font-semibold">{r.dssRegistrationNo}</span></p>
                    <p>Phone: {r.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: APPLICATIONS REVIEW */}
        {activeTab === 'applications' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">Candidate Submissions Across Dominica</h3>
              <p className="text-xs text-slate-500">Live applications, status dispatch, and candidate credentials</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Applicant Name</th>
                    <th className="p-3">Target Vacancy</th>
                    <th className="p-3">Resume</th>
                    <th className="p-3">Parish / Status</th>
                    <th className="p-3">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{app.applicantName}</span>
                        <span className="text-[11px] text-slate-500">{app.applicantEmail}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{app.jobTitle}</span>
                        <span className="text-[11px] text-slate-500">{app.companyName}</span>
                      </td>
                      <td className="p-3 text-emerald-700 font-medium">
                        📄 {app.resumeFileName}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-700 font-semibold block">{app.parish}</span>
                        <span className="text-[10px] text-slate-500">{app.citizenStatus}</span>
                      </td>
                      <td className="p-3">
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                          className="px-2 py-1 rounded border border-slate-300 font-semibold text-xs bg-white cursor-pointer"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: GLOBAL APP SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div>
              <h3 className="font-black text-slate-900 text-base">Global App Settings & Branding</h3>
              <p className="text-xs text-slate-500">Configure portal name, official communication email, currency peg, and banners</p>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All changes applied and synchronized across the platform!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">
                  Portal Name
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">
                  Official Contact & Inquiry Email
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">
                  Top Announcement Banner
                </label>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="e.g. Dominica Work In Nature (WIN) 2026 applications now active"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900"
                />
              </div>

              {/* Background Photo Settings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <label className="font-bold text-slate-800 uppercase block text-xs">
                      Nature Island Background Photo
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">Active: {backgroundImageUrl.includes('photo') ? 'Scenic Photo' : 'Custom'}</span>
                </div>

                {/* Preset Photo Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBackgroundImageUrl('/nature_island_photo.svg')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      backgroundImageUrl === '/nature_island_photo.svg'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="text-base">🌴</span>
                    <div>
                      <div className="text-[11px] leading-tight">Nature Island Photo</div>
                      <div className="text-[9px] text-slate-400">Emerald Peaks & Rainforest</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBackgroundImageUrl('/dominica_flag.svg')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      backgroundImageUrl === '/dominica_flag.svg'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="text-base">🇩🇲</span>
                    <div>
                      <div className="text-[11px] leading-tight">Dominica Flag</div>
                      <div className="text-[9px] text-slate-400">Official National Colors</div>
                    </div>
                  </button>
                </div>

                {/* Custom Photo URL Input */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Or Enter Custom Photo URL:
                  </label>
                  <input
                    type="text"
                    value={backgroundImageUrl}
                    onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    placeholder="https://... or /nature_island_photo.svg"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800 text-[11px]"
                  />
                </div>

                {/* File Upload for Local Photo */}
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Photo From Computer</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) {
                              setBackgroundImageUrl(reader.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-slate-400">PNG, JPG, or SVG supported</span>
                </div>

                {/* Full-Page Background Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                    <input
                      type="checkbox"
                      checked={fullPageBackground}
                      onChange={(e) => setFullPageBackground(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Extend Photo Background to Full Application Body (with frosted overlay)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">
                    Currency Peg (XCD : 1 USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currencyPeg}
                    onChange={(e) => setCurrencyPeg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={showEmergencyBanner}
                      onChange={(e) => setShowEmergencyBanner(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Weather / Storm Advisory Banner</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Apply All Portal Changes</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab: STRIPE PAYMENT PORTAL */}
        {activeTab === 'stripe' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>Stripe Payment Portal & Employer Monetization</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage employer billing, paid job listings, featured gold pins, and subscriptions
                </p>
              </div>

              {onOpenStripe && (
                <button
                  type="button"
                  onClick={onOpenStripe}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>Launch Stripe Payment Portal UI</span>
                </button>
              )}
            </div>

            {/* Active Pricing Packages Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tier 1</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">Standard</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Standard Classified Listing</h4>
                <div className="text-lg font-black text-emerald-700">EC$ 150 <span className="text-[11px] font-normal text-slate-500">/ 30 days</span></div>
                <p className="text-[11px] text-slate-600">30-day verified classified publication across Dominica’s 10 parishes.</p>
              </div>

              <div className="bg-amber-50/60 border border-amber-300 rounded-xl p-4 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-bl">
                  POPULAR
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Tier 2</span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">Featured Pin</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Featured Top-of-Board Pin</h4>
                <div className="text-lg font-black text-amber-700">EC$ 350 <span className="text-[11px] font-normal text-slate-500">/ 30 days</span></div>
                <p className="text-[11px] text-slate-600">Pinned to top of search results with gold badge and 1,200+ seeker email blast.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tier 3</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">NEP Subsidized</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">NEP Accredited Partner</h4>
                <div className="text-lg font-black text-emerald-700">EC$ 280 <span className="text-[11px] font-normal text-slate-500">/ quarter</span></div>
                <p className="text-[11px] text-slate-600">Subsidized rate for National Employment Programme registered employers.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tier 4</span>
                  <span className="bg-purple-200 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded">Enterprise</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">Enterprise Growth Partner</h4>
                <div className="text-lg font-black text-purple-700">EC$ 950 <span className="text-[11px] font-normal text-slate-500">/ month</span></div>
                <p className="text-[11px] text-slate-600">Unlimited listings, candidate resume database access, and dedicated recruitment.</p>
              </div>
            </div>

            {/* Stripe Integration Info & Gateway Status */}
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="font-bold text-xs">Stripe Gateway: Operational & Encrypted (TLS 1.3)</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">XCD / USD Enabled</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Supported Methods</span>
                  <span className="font-semibold text-white">Visa, MasterCard, American Express, Apple Pay, Google Pay</span>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Stripe Mode</span>
                  <span className="font-semibold text-amber-300">Live Test Sandbox Mode</span>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Tax & DSS Compliance</span>
                  <span className="font-semibold text-white">Automatic Tax Invoices with DSS TIN</span>
                </div>
              </div>

              {onOpenStripe && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={onOpenStripe}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Open Interactive Stripe Payment Portal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: SYNC & DB TOOLS */}
        {activeTab === 'sync' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <div>
              <h3 className="font-black text-slate-900 text-base">Government Systems Integration & Audit</h3>
              <p className="text-xs text-slate-500">Bi-directional reconciliation with Dominica statutory bodies</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => runSyncSimulation('Dominica Labour Division')}
                className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-xl text-left space-y-1 transition-all cursor-pointer"
              >
                <span className="font-bold text-xs text-slate-900 block">Dominica Labour Division</span>
                <p className="text-[11px] text-slate-500">Sync registered national vacancies & wage baselines</p>
              </button>

              <button
                onClick={() => runSyncSimulation('National Employment Programme (NEP)')}
                className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-xl text-left space-y-1 transition-all cursor-pointer"
              >
                <span className="font-bold text-xs text-slate-900 block">NEP Apprenticeship Registry</span>
                <p className="text-[11px] text-slate-500">Import verified trainees & DSC apprentice slots</p>
              </button>

              <button
                onClick={() => runSyncSimulation('Dominica Social Security (DSS)')}
                className="p-4 bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-xl text-left space-y-1 transition-all cursor-pointer"
              >
                <span className="font-bold text-xs text-slate-900 block">Dominica Social Security</span>
                <p className="text-[11px] text-slate-500">Verify employer DSS registration numbers</p>
              </button>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                onClick={exportDatabaseCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Export Classifieds Registry CSV</span>
              </button>
            </div>

            {/* Sync Records */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs text-slate-700 uppercase">Recent System Audit Logs</h4>
              {syncRecords.map((rec) => (
                <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs font-medium">
                  <div>
                    <span className="font-bold text-slate-900">{rec.targetSystem}</span> · {rec.syncType}
                    <span className="block text-[11px] text-slate-500">Checksum: {rec.checksum}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-bold">{rec.status}</span>
                    <span className="block text-[11px] text-slate-500">{new Date(rec.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Authenticated Administrator Console · Nature Island Careers
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
};
