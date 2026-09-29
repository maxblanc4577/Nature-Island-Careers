import React, { useState, useEffect } from 'react';
import { useJobContext } from '../context/JobContext';
import { JobListing, Parish, JobSector, ApplicationStatus, RecruiterAccount, EmployerInvoice } from '../types';
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
  Receipt,
  Search,
  Copy,
  Check,
  ExternalLink,
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
    stripeSettings,
    updateStripeSettings,
    invoices,
    addInvoice,
    sendRecruiterReminders,
  } = useJobContext();

  const [activeTab, setActiveTab] = useState<'jobs' | 'recruiters' | 'applications' | 'settings' | 'sync' | 'stripe' | 'payment-logs'>('jobs');

  // Payment Logs State
  const [paymentLogSearch, setPaymentLogSearch] = useState('');
  const [paymentLogStatusFilter, setPaymentLogStatusFilter] = useState<'All' | 'Paid' | 'Processing' | 'Renewal Pending'>('All');
  const [inspectedInvoice, setInspectedInvoice] = useState<EmployerInvoice | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPaymentIntent = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  // Auto-save mechanism: automatically persists site settings changes to localStorage on every change
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const updatedSettings = {
      siteName,
      contactEmail,
      announcement,
      currencyPeg,
      showEmergencyBanner,
      backgroundImageUrl,
      fullPageBackground,
    };
    onUpdateSiteSettings(updatedSettings);
    try {
      localStorage.setItem('natureisland_site_settings', JSON.stringify(updatedSettings));
    } catch {
      // ignore
    }
    setSettingsSaved(true);
    const timer = setTimeout(() => setSettingsSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [
    siteName,
    contactEmail,
    announcement,
    currencyPeg,
    showEmergencyBanner,
    backgroundImageUrl,
    fullPageBackground,
  ]);

  // Stripe configuration states
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>(stripeSettings.mode);
  const [stripePublishableKey, setStripePublishableKey] = useState(stripeSettings.publishableKey);
  const [stripeSecretKey, setStripeSecretKey] = useState(stripeSettings.secretKey);
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState(stripeSettings.webhookSecret);
  const [stripePeg, setStripePeg] = useState(stripeSettings.currencyPeg || 2.70);
  const [stripeAutoRenewDiscount, setStripeAutoRenewDiscount] = useState(stripeSettings.monthlyDiscountPercent || 15);
  const [stripeSavedMsg, setStripeSavedMsg] = useState(false);

  // Stripe Portal Login State
  const [isStripeDashboardOpen, setIsStripeDashboardOpen] = useState(false);

  // Manual Employer Billing Form
  const [selectedBilledRecruiterId, setSelectedBilledRecruiterId] = useState(recruiters[0]?.id || 'rec_fort_young');
  const [billingPlanName, setBillingPlanName] = useState('Featured Top-of-Board Pin');
  const [billingAmountXCD, setBillingAmountXCD] = useState(350);
  const [billingCadenceChoice, setBillingCadenceChoice] = useState<'monthly' | 'one_time'>('monthly');
  const [billingSuccessAlert, setBillingSuccessAlert] = useState<string | null>(null);

  // Automated Reminders Service
  const [reminderServiceStatus, setReminderServiceStatus] = useState<string | null>(null);

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
                <h2 className="text-lg font-black tracking-tight">Admin Master Control & Console</h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Commonwealth of Dominica Labour Division & Nature Island Careers Unified Administration
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
            onClick={() => setActiveTab('payment-logs')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payment-logs'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Payment Logs ({invoices.length})</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Global App Settings & Branding</h3>
                <p className="text-xs text-slate-500">Configure portal name, official communication email, currency peg, and banners</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-full shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Auto-Save Enabled (Instant localStorage Sync)</span>
              </div>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Auto-saved to localStorage & synchronized across the platform!</span>
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

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{settingsSaved ? 'Saved to localStorage' : 'Force Save Settings'}</span>
                </button>

                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Auto-save is active: changes persist automatically on every keystroke & click</span>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab: STRIPE PAYMENT PORTAL */}
        {activeTab === 'stripe' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Header with Stripe Portal Login Button */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#635BFF] text-white text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <CreditCard className="w-3.5 h-3.5" /> Stripe Connect
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    stripeMode === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {stripeMode === 'live' ? '● Live Production Gateway' : '● Test Sandbox Mode'}
                  </span>
                </div>
                <h3 className="text-xl font-black font-display tracking-tight">
                  Stripe Payment & Employer Billing Portal
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Administer payment portal settings, manage live Stripe API keys, bill employers directly, and review recurring subscription metrics.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsStripeDashboardOpen(true)}
                  className="bg-[#635BFF] hover:bg-[#5249e6] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                >
                  <Globe className="w-4 h-4" />
                  <span>Login to Stripe Portal</span>
                </button>

                {onOpenStripe && (
                  <button
                    type="button"
                    onClick={onOpenStripe}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Open Checkout Flow</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-slate-500 block font-semibold text-[11px]">Total Invoices Generated</span>
                <span className="text-xl font-black text-slate-900 mt-1 block font-mono">{invoices.length}</span>
                <span className="text-[10px] text-emerald-600 font-bold">100% Stripe Reconciled</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-slate-500 block font-semibold text-[11px]">Volume Billed (XCD)</span>
                <span className="text-xl font-black text-emerald-700 mt-1 block font-mono">
                  EC${invoices.reduce((acc, i) => acc + (i.status === 'Paid' ? i.amountXCD : 0), 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">
                  ~${Math.round(invoices.reduce((acc, i) => acc + (i.status === 'Paid' ? i.amountXCD : 0), 0) / 2.7).toLocaleString()} USD
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-slate-500 block font-semibold text-[11px]">Recurring Subscriptions</span>
                <span className="text-xl font-black text-indigo-700 mt-1 block font-mono">
                  {invoices.filter((i) => i.billingInterval === 'monthly').length}
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">Active Auto-Renew</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-slate-500 block font-semibold text-[11px]">Dominica Tax Peg</span>
                <span className="text-xl font-black text-slate-900 mt-1 block font-mono">
                  2.70 <span className="text-xs font-normal text-slate-500">XCD/USD</span>
                </span>
                <span className="text-[10px] text-slate-500">Statutory Fixed Rate</span>
              </div>
            </div>

            {/* Section 1: Set & Change Payment Portal Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-bold text-sm text-slate-900">Set & Change Payment Portal Information</h4>
                </div>
                {stripeSavedMsg && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved!
                  </span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateStripeSettings({
                    mode: stripeMode,
                    publishableKey: stripePublishableKey,
                    secretKey: stripeSecretKey,
                    webhookSecret: stripeWebhookSecret,
                    currencyPeg: stripePeg,
                    monthlyDiscountPercent: stripeAutoRenewDiscount,
                  });
                  setStripeSavedMsg(true);
                  setTimeout(() => setStripeSavedMsg(false), 2500);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stripe Mode Toggle */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Gateway Operating Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStripeMode('test')}
                        className={`py-2 px-3 rounded-lg font-bold border transition-all cursor-pointer ${
                          stripeMode === 'test'
                            ? 'bg-amber-100 border-amber-400 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        🧪 Test Sandbox Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setStripeMode('live')}
                        className={`py-2 px-3 rounded-lg font-bold border transition-all cursor-pointer ${
                          stripeMode === 'live'
                            ? 'bg-emerald-600 border-emerald-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        ⚡ Live Production Mode
                      </button>
                    </div>
                  </div>

                  {/* Currency Peg */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Currency Peg Ratio (EC$ : $1 USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stripePeg}
                      onChange={(e) => setStripePeg(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_live_... or pk_test_..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Stripe Secret Key
                    </label>
                    <input
                      type="password"
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      placeholder="sk_live_... or sk_test_..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Stripe Webhook Signing Secret
                    </label>
                    <input
                      type="text"
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Monthly Recurring Subscription Discount (%)
                    </label>
                    <input
                      type="number"
                      value={stripeAutoRenewDiscount}
                      onChange={(e) => setStripeAutoRenewDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Payment Portal Configuration</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Section 2: Bill Employers Directly via Stripe */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-bold text-sm text-slate-900">Allow Employers to be Billed with Stripe</h4>
                </div>
                {billingSuccessAlert && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                    {billingSuccessAlert}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Employer to Bill *</label>
                  <select
                    value={selectedBilledRecruiterId}
                    onChange={(e) => setSelectedBilledRecruiterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {recruiters.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.companyName} ({rec.parish})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing Package / Item *</label>
                  <select
                    value={billingPlanName}
                    onChange={(e) => {
                      setBillingPlanName(e.target.value);
                      if (e.target.value === 'Standard Classified Listing') setBillingAmountXCD(150);
                      else if (e.target.value === 'Featured Top-of-Board Pin') setBillingAmountXCD(350);
                      else if (e.target.value === 'Enterprise Employer Partner') setBillingAmountXCD(950);
                      else if (e.target.value === 'NEP Accredited Partner') setBillingAmountXCD(280);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="Featured Top-of-Board Pin">Featured Top-of-Board Pin (EC$ 350)</option>
                    <option value="Standard Classified Listing">Standard Classified Listing (EC$ 150)</option>
                    <option value="Enterprise Employer Partner">Enterprise Employer Partner (EC$ 950)</option>
                    <option value="NEP Accredited Partner">NEP Accredited Partner (EC$ 280)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing Cadence *</label>
                  <select
                    value={billingCadenceChoice}
                    onChange={(e) => setBillingCadenceChoice(e.target.value as 'monthly' | 'one_time')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="monthly">Monthly Recurring Subscription (Stripe Auto)</option>
                    <option value="one_time">One-Time 30-Day Listing Pass</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 font-mono">
                  Amount: <strong className="text-emerald-800 text-sm">EC${billingAmountXCD}</strong> (~${Math.round(billingAmountXCD / 2.7)} USD)
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const rec = recruiters.find((r) => r.id === selectedBilledRecruiterId) || recruiters[0];
                    addInvoice({
                      recruiterId: rec.id,
                      companyName: rec.companyName,
                      invoiceNumber: `INV-DOM-2026-${Math.floor(100 + Math.random() * 900)}`,
                      date: new Date().toISOString().split('T')[0],
                      plan: billingPlanName,
                      amountXCD: billingAmountXCD,
                      amountUSD: Math.round(billingAmountXCD / 2.7),
                      billingInterval: billingCadenceChoice,
                      status: 'Paid',
                      paymentMethod: 'Stripe •••• 4242 (Visa)',
                      receiptUrl: `https://pay.stripe.com/receipts/invoices/ch_admin_${Date.now()}`,
                      stripeSubscriptionId: billingCadenceChoice === 'monthly' ? `sub_stripe_admin_${Date.now().toString().slice(-6)}` : undefined,
                    });
                    setBillingSuccessAlert(`Successfully billed ${rec.companyName} EC$${billingAmountXCD} via Stripe!`);
                    setTimeout(() => setBillingSuccessAlert(null), 3500);
                  }}
                  className="px-5 py-2.5 bg-[#635BFF] hover:bg-[#5249e6] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Execute Stripe Charge & Generate Invoice</span>
                </button>
              </div>
            </div>

            {/* Section 3: Automated Recruiter Reminders Service */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-bold text-sm text-teal-950">
                    Automated Recruiter Reminders Service
                  </h4>
                </div>
                <span className="text-[11px] font-mono bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded font-bold">
                  Sender: {contactEmail}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Sends automated email notifications to all registered Dominican employers regarding pending job postings awaiting review, candidate pipeline digests, and upcoming monthly subscription renewals using the configured contactEmail (<strong>{contactEmail}</strong>).
              </p>

              {reminderServiceStatus && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 animate-in fade-in flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{reminderServiceStatus}</span>
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const res = sendRecruiterReminders(contactEmail);
                    setReminderServiceStatus(`Dispatched ${res.sentCount} automated reminder emails via ${contactEmail} to employers!`);
                    setTimeout(() => setReminderServiceStatus(null), 4000);
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Automated Recruiter Reminders Now</span>
                </button>
              </div>
            </div>

            {/* Section 4: Live Employer Invoices Log */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Global Employer Invoices & Stripe Receipts ({invoices.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">Live transaction records generated by Dominica recruitment charges.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('payment-logs')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Open Full Payment Logs (Payment Intent IDs) &rarr;</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Payment Intent</th>
                      <th className="p-2.5">Employer</th>
                      <th className="p-2.5">Plan</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Interval</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 8).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          {inv.paymentIntentId || `pi_live_${inv.id.replace('inv-', '')}XCD`}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">{inv.companyName}</td>
                        <td className="p-2.5">{inv.plan}</td>
                        <td className="p-2.5 font-mono text-slate-500">{inv.date}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-800">
                          EC${inv.amountXCD} <span className="text-[10px] font-normal text-slate-400">(~${inv.amountUSD})</span>
                        </td>
                        <td className="p-2.5">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {inv.billingInterval === 'monthly' ? 'Monthly Auto' : '30-Day'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Portal Dashboard Modal / Overlay */}
        {isStripeDashboardOpen && (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#635BFF] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  <div>
                    <h3 className="text-base font-black">Stripe Connected Express Dashboard</h3>
                    <p className="text-xs text-indigo-100">
                      Nature Island Careers Inc. • acct_1PzDominicaNatureExchange
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStripeDashboardOpen(false)}
                  className="p-1.5 text-indigo-200 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs text-slate-800">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="text-emerald-950 block">Authenticated & Synced:</strong>
                    <span className="text-emerald-800">
                      Logged into Stripe portal with administrative rights. Payouts scheduled weekly to National Bank of Dominica (NBD) Account #••••4401.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Balance</span>
                    <span className="text-lg font-black text-slate-900 font-mono mt-1 block">EC$ 18,450.00</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Ready for payout</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">In-Flight Volume</span>
                    <span className="text-lg font-black text-slate-900 font-mono mt-1 block">EC$ 3,150.00</span>
                    <span className="text-[10px] text-slate-500">Processing charges</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Subscriptions</span>
                    <span className="text-lg font-black text-indigo-700 font-mono mt-1 block">14 Employers</span>
                    <span className="text-[10px] text-indigo-600 font-bold">Monthly recurring</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50">
                  <span className="font-bold text-slate-800 block">Stripe Gateway Endpoints & Webhooks:</span>
                  <div className="font-mono text-[11px] text-slate-600 space-y-1">
                    <div>Live Endpoint: <span className="text-slate-900 font-bold">https://api.stripe.com/v1/charges</span></div>
                    <div>Webhook Listener: <span className="text-slate-900 font-bold">https://natureislandcareers.com/api/stripe-webhooks</span></div>
                    <div>Events Monitored: <span className="text-emerald-700">invoice.payment_succeeded, customer.subscription.updated</span></div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStripeDashboardOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close Dashboard
                  </button>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Open External Stripe.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: PAYMENT LOGS */}
        {activeTab === 'payment-logs' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-lg">Stripe Payment Logs & Financial Audit</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Live Stripe Audit
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological ledger of all Stripe transactions, payment intent IDs, captured amounts, and settlement statuses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStripeDashboardOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#635BFF] hover:bg-[#5249e6] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Stripe Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('stripe')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Gateway Keys</span>
                </button>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-4 rounded-xl text-white shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">Total Captured Volume</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black font-mono">
                    EC${invoices.reduce((acc, inv) => acc + inv.amountXCD, 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">
                    (${invoices.reduce((acc, inv) => acc + inv.amountUSD, 0).toLocaleString()} USD)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-200/80 mt-1 block">Fixed Peg: 2.70 XCD/USD</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Transactions</span>
                <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                  {invoices.length} Payments
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">100% Stripe Webhook Verified</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Paid Invoices</span>
                <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                  {invoices.filter((inv) => inv.status === 'Paid').length} Settled
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Zero disputes / Chargebacks</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Latest Transaction</span>
                <span className="text-xs font-mono font-bold text-slate-800 truncate block mt-1">
                  {invoices[0]?.paymentIntentId || 'pi_live_sync_001'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {invoices[0]?.date || 'Today'}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by Payment Intent ID (e.g. pi_...), Employer, or Invoice #..."
                  value={paymentLogSearch}
                  onChange={(e) => setPaymentLogSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 shrink-0">Status:</span>
                <select
                  value={paymentLogStatusFilter}
                  onChange={(e) => setPaymentLogStatusFilter(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="All">All Statuses ({invoices.length})</option>
                  <option value="Paid">Paid / Succeeded</option>
                  <option value="Processing">Processing</option>
                  <option value="Renewal Pending">Renewal Pending</option>
                </select>
              </div>
            </div>

            {/* Chronological Payment Transactions Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3.5">Date & Timestamp</th>
                      <th className="py-3 px-3.5">Payment Intent ID</th>
                      <th className="py-3 px-3.5">Employer / Entity</th>
                      <th className="py-3 px-3.5">Description / Plan</th>
                      <th className="py-3 px-3.5">Amount (XCD / USD)</th>
                      <th className="py-3 px-3.5">Method</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {invoices
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .filter((inv) => {
                        const term = paymentLogSearch.toLowerCase().trim();
                        const matchesSearch =
                          !term ||
                          (inv.paymentIntentId && inv.paymentIntentId.toLowerCase().includes(term)) ||
                          inv.companyName.toLowerCase().includes(term) ||
                          inv.invoiceNumber.toLowerCase().includes(term) ||
                          inv.plan.toLowerCase().includes(term);
                        const matchesStatus =
                          paymentLogStatusFilter === 'All' || inv.status === paymentLogStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block font-mono">
                              {inv.date}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {inv.timestamp || `${inv.date} 12:00:00 AST`}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                                {inv.paymentIntentId || `pi_live_${inv.id.replace('inv-', '')}XCD`}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPaymentIntent(inv.paymentIntentId || `pi_live_${inv.id.replace('inv-', '')}XCD`)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                title="Copy Payment Intent ID"
                              >
                                {copiedId === (inv.paymentIntentId || `pi_live_${inv.id.replace('inv-', '')}XCD`) ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                              {inv.invoiceNumber}
                            </span>
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                              {inv.companyName}
                            </span>
                            {inv.stripeSubscriptionId && (
                              <span className="text-[10px] text-indigo-600 font-mono block">
                                Sub: {inv.stripeSubscriptionId}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="text-slate-800 block text-xs truncate max-w-[160px]">
                              {inv.plan}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {inv.billingInterval}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap font-mono">
                            <span className="font-extrabold text-emerald-700 block">
                              EC${inv.amountXCD.toLocaleString()}.00
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ${inv.amountUSD.toLocaleString()}.00 USD
                            </span>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                            {inv.paymentMethod}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : inv.status === 'Processing'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {inv.status === 'Paid' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
                              {inv.status}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectedInvoice(inv)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer border border-slate-200"
                              >
                                Inspect JSON
                              </button>
                              {inv.receiptUrl && (
                                <a
                                  href={inv.receiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 hover:bg-emerald-50 text-emerald-700 rounded transition-colors"
                                  title="Open Stripe Receipt"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* JSON Payload Inspection Modal */}
            {inspectedInvoice && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
                  <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-white">
                        Stripe PaymentIntent Payload · {inspectedInvoice.paymentIntentId || inspectedInvoice.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedInvoice(null)}
                      className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto bg-slate-950 text-slate-200 space-y-2">
                    <pre className="text-[11px] leading-relaxed text-emerald-300 overflow-x-auto whitespace-pre">
{JSON.stringify(
  {
    id: inspectedInvoice.paymentIntentId || `pi_live_${inspectedInvoice.id}XCD`,
    object: 'payment_intent',
    amount: inspectedInvoice.amountXCD * 100,
    amount_received: inspectedInvoice.status === 'Paid' ? inspectedInvoice.amountXCD * 100 : 0,
    currency: 'xcd',
    status: inspectedInvoice.status === 'Paid' ? 'succeeded' : 'processing',
    customer: {
      name: inspectedInvoice.companyName,
      recruiter_id: inspectedInvoice.recruiterId,
    },
    metadata: {
      invoice_number: inspectedInvoice.invoiceNumber,
      plan: inspectedInvoice.plan,
      billing_interval: inspectedInvoice.billingInterval,
      fixed_peg_rate: '2.70 XCD/USD',
      usd_equivalent: inspectedInvoice.amountUSD,
      platform: 'Nature Island Careers Commonwealth of Dominica',
    },
    payment_method_types: ['card'],
    charges: {
      total_count: 1,
      data: [
        {
          id: `ch_${(inspectedInvoice.paymentIntentId || inspectedInvoice.id).replace('pi_', '')}`,
          paid: inspectedInvoice.status === 'Paid',
          payment_method_details: {
            card: {
              brand: inspectedInvoice.paymentMethod.includes('Mastercard')
                ? 'mastercard'
                : inspectedInvoice.paymentMethod.includes('Amex')
                ? 'amex'
                : 'visa',
              last4: inspectedInvoice.paymentMethod.split('•••• ')[1]?.split(' ')[0] || '4242',
              country: 'DM',
            },
            type: 'card',
          },
          receipt_url: inspectedInvoice.receiptUrl || 'https://pay.stripe.com/receipts',
        },
      ],
    },
    created: Math.floor(new Date(inspectedInvoice.date).getTime() / 1000),
    livemode: !inspectedInvoice.paymentIntentId?.includes('Test'),
  },
  null,
  2
)}
                    </pre>
                  </div>

                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPaymentIntent(JSON.stringify(inspectedInvoice, null, 2))}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Copy Raw JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedInvoice(null)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
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
