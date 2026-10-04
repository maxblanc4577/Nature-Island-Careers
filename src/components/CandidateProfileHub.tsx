import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useJobContext } from '../context/JobContext';
import { ResumeBuilder } from './ResumeBuilder';
import { JobAlertAutomationManager } from './JobAlertAutomationManager';
import { CandidateCoverLetterGenerator } from './CandidateCoverLetterGenerator';
import { CandidateLinkedInExportTool } from './CandidateLinkedInExportTool';
import { CandidatePrivacySettingsPanel } from './CandidatePrivacySettingsPanel';
import { Parish, JobSector } from '../types';
import {
  User,
  Camera,
  Upload,
  CheckCircle2,
  Trash2,
  Bookmark,
  Briefcase,
  FileText,
  Bell,
  Save,
  RotateCcw,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Calendar,
  Clock,
  Layers,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Plus,
  BarChart3,
  Shield,
  Share2,
  AlertCircle,
  Video,
  Download,
  Activity,
  Award,
} from 'lucide-react';

export type CandidateHubSubTab =
  | 'overview'
  | 'details'
  | 'applications'
  | 'resume_builder'
  | 'cover_letter'
  | 'linkedin_export'
  | 'saved_jobs'
  | 'privacy'
  | 'job_alerts';

interface CandidateProfileHubProps {
  onBrowseJobs: () => void;
  onSelectJob: (jobId: string) => void;
  initialSubTab?: CandidateHubSubTab;
}

const PRESET_DOMINICA_AVATARS = [
  {
    name: 'Roseau Tech Specialist',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  },
  {
    name: 'Geothermal Engineer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  },
  {
    name: 'Eco-Hospitality Lead',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
  },
  {
    name: 'Agro-Business Coordinator',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  },
];

const DOMINICA_PARISHES: Parish[] = [
  'St. George',
  'St. John',
  'St. Paul',
  'St. Andrew',
  'St. Patrick',
  'St. Joseph',
  'St. David',
  'St. Luke',
  'St. Mark',
  'St. Peter',
  'Island-wide / Remote',
];

const RESIDENCY_OPTIONS = [
  'Dominican Citizen (Waitukubuli)',
  'Caricom Single Market (CSME) Skilled National',
  'Dominica Work In Nature (WIN) Remote Visa',
  'Permanent Resident',
  'Commonwealth Citizen / Work Permit Holder',
];

export const CandidateProfileHub: React.FC<CandidateProfileHubProps> = ({
  onBrowseJobs,
  onSelectJob,
  initialSubTab = 'overview',
}) => {
  const {
    currentUser,
    updateCurrentUser,
    applications,
    jobs,
    withdrawApplication,
    savedJobIds,
    toggleSaveJob,
    isJobSaved,
    alerts,
    dispatchEmail,
  } = useJobContext();

  const [activeSubTab, setActiveSubTab] = useState<CandidateHubSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Personal details form state
  const [name, setName] = useState(currentUser?.name || 'Max Blanc');
  const [email, setEmail] = useState(currentUser?.email || 'maxblanc4577@gmail.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (767) 275-4577');
  const [parish, setParish] = useState<Parish>(currentUser?.parish || 'St. George');
  const [headline, setHeadline] = useState(
    currentUser?.headline || 'Senior Full-Stack Cloud & Web Architect'
  );
  const [residencyStatus, setResidencyStatus] = useState(
    currentUser?.residencyStatus || 'Dominican Citizen (Waitukubuli)'
  );
  const [bio, setBio] = useState(
    currentUser?.bio ||
      'Experienced Dominican software engineer with 6+ years building sustainable digital platforms, clean energy IoT monitoring tools, and remote cloud infrastructure across the Eastern Caribbean.'
  );
  const [skills, setSkills] = useState<string[]>(
    currentUser?.skills || [
      'React & TypeScript',
      'Node.js & Express',
      'PostgreSQL',
      'Geothermal SCADA Protocols',
      'Cloud Architecture (GCP/AWS)',
      'Agro-Supply Chain Logistics',
    ]
  );
  const [newSkillInput, setNewSkillInput] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Sync state if currentUser changes from outside
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '+1 (767) 275-4577');
      setParish(currentUser.parish || 'St. George');
      setHeadline(currentUser.headline || 'Senior Full-Stack Cloud & Web Architect');
      setResidencyStatus(currentUser.residencyStatus || 'Dominican Citizen (Waitukubuli)');
      setBio(
        currentUser.bio ||
          'Experienced Dominican software engineer with 6+ years building sustainable digital platforms, clean energy IoT monitoring tools, and remote cloud infrastructure across the Eastern Caribbean.'
      );
      if (currentUser.skills && currentUser.skills.length > 0) {
        setSkills(currentUser.skills);
      }
    }
  }, [currentUser]);

  // File input ref for photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Completion Calculation
  const completionDetails = useMemo(() => {
    const items = [
      { name: 'Profile Photo', done: Boolean(currentUser?.avatarUrl), weight: 15, tab: 'details' as const },
      { name: 'Full Name & Email', done: Boolean(name && email), weight: 15, tab: 'details' as const },
      { name: 'Professional Headline', done: Boolean(headline && headline.length > 5), weight: 15, tab: 'details' as const },
      { name: 'Dominica Parish', done: Boolean(parish), weight: 10, tab: 'details' as const },
      { name: 'Executive Bio', done: Boolean(bio && bio.length > 20), weight: 15, tab: 'details' as const },
      { name: 'Core Skills (3+)', done: skills.length >= 3, weight: 15, tab: 'details' as const },
      { name: 'Stored Resume / CV', done: Boolean(currentUser?.resumeFileName || localStorage.getItem('dominica_candidate_resume')), weight: 15, tab: 'resume_builder' as const },
    ];

    const completedWeight = items.reduce((acc, item) => (item.done ? acc + item.weight : acc), 0);
    const percentage = Math.min(100, completedWeight);
    const missingItems = items.filter((item) => !item.done);

    return { percentage, missingItems };
  }, [currentUser, name, email, headline, parish, bio, skills]);

  // Upcoming Interviews
  const upcomingInterviews = useMemo(() => {
    return applications
      .filter((app) => app.status === 'Interview Scheduled' && app.interviewDetails)
      .map((app) => {
        const job = jobs.find((j) => j.id === app.jobId);
        return {
          application: app,
          job,
          details: app.interviewDetails!,
        };
      });
  }, [applications, jobs]);

  // Filter saved jobs
  const savedJobsList = jobs.filter((j) => isJobSaved(j.id) || savedJobIds.includes(j.id));

  // Synthesize Recent Activity
  const recentActivities = useMemo(() => {
    const events: Array<{ id: string; title: string; time: string; icon: string; category: string }> = [];

    // Application events
    applications.slice(0, 4).forEach((app) => {
      const job = jobs.find((j) => j.id === app.jobId);
      events.push({
        id: `act-app-${app.id}`,
        title: `Applied for ${job ? job.title : 'Dominica Position'} at ${job ? job.company : 'Employer'}`,
        time: new Date(app.appliedAt).toLocaleDateString(),
        icon: 'briefcase',
        category: app.status,
      });
    });

    // Saved job events
    savedJobsList.slice(0, 3).forEach((job) => {
      events.push({
        id: `act-save-${job.id}`,
        title: `Bookmarked ${job.title} (${job.parish})`,
        time: 'Recently saved',
        icon: 'bookmark',
        category: 'Saved',
      });
    });

    // Alerts events
    if (alerts.length > 0) {
      events.push({
        id: 'act-alert-sub',
        title: `Automated Dominica Job Alerts active for ${alerts[0].sectors.join(', ')}`,
        time: 'Active preference',
        icon: 'bell',
        category: 'Alerts',
      });
    }

    return events;
  }, [applications, savedJobsList, alerts, jobs]);

  // Handle Photo File Upload
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoUploadError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    setPhotoUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateCurrentUser({ avatarUrl: dataUrl });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    };
    reader.onerror = () => {
      setPhotoUploadError('Error processing photo file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Select Preset Avatar
  const handleSelectPresetAvatar = (url: string) => {
    updateCurrentUser({ avatarUrl: url });
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    updateCurrentUser({ avatarUrl: undefined });
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Handle Add Skill
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  // Handle Remove Skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Handle Save Personal Details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      name: name.trim() || 'Dominica Job Seeker',
      email: email.trim() || 'maxblanc4577@gmail.com',
      phone: phone.trim(),
      parish,
      headline: headline.trim(),
      residencyStatus,
      bio: bio.trim(),
      skills,
    });
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Generate iCal ICS download for interview
  const handleDownloadInterviewICS = (interview: { job?: any; details: any }) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nature Island Careers//Dominica Job Interview//EN
BEGIN:VEVENT
SUMMARY:Interview for ${interview.job ? interview.job.title : 'Job'} at ${interview.job ? interview.job.company : 'Dominica Employer'}
DESCRIPTION:Nature Island Careers Job Interview with ${interview.job ? interview.job.company : 'Company'}. Mode: ${interview.details.mode}. Location: ${interview.details.location}
LOCATION:${interview.details.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dominica_Interview_${(interview.job?.title || 'Job').replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get application status badge
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
      {/* Top Banner Notice: Success notification */}
      {saveSuccessNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Candidate profile details and preferences updated successfully!
          </span>
          <button
            type="button"
            onClick={() => setSaveSuccessNotice(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-base leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Candidate Profile Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-700/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Profile Photo with Camera Overlay */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-800 border-2 border-emerald-400/40 overflow-hidden shadow-lg flex items-center justify-center">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name || 'Candidate profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-emerald-100">
                    {(currentUser?.name || name || 'M').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Upload trigger overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 cursor-pointer"
                title="Change Profile Photo"
              >
                <Camera className="w-5 h-5 text-emerald-300" />
                <span>Change Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
                className="hidden"
              />
            </div>

            {/* Candidate Identity & Headline */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Dominica Candidate Profile
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-800/80 text-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-700/60">
                  🇩🇲 {parish}
                </span>
                <span className="inline-flex items-center gap-1 bg-teal-800/80 text-teal-200 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-teal-700/60">
                  <ShieldCheck className="w-3 h-3 text-teal-300" />
                  {residencyStatus}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white">{name}</h1>
              <p className="text-sm font-medium text-emerald-100/90">{headline}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-emerald-200/80 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-300" />
                  {email}
                </span>
                {phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-300" />
                    {phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('applications')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                activeSubTab === 'applications'
                  ? 'bg-emerald-800/90 border-emerald-400 shadow-sm'
                  : 'bg-emerald-900/40 border-emerald-700/40 hover:bg-emerald-900/70'
              }`}
            >
              <span className="text-[10px] font-bold text-emerald-300 uppercase block tracking-wider">
                Applications
              </span>
              <span className="text-xl font-black text-white">{applications.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('saved_jobs')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                activeSubTab === 'saved_jobs'
                  ? 'bg-emerald-800/90 border-emerald-400 shadow-sm'
                  : 'bg-emerald-900/40 border-emerald-700/40 hover:bg-emerald-900/70'
              }`}
            >
              <span className="text-[10px] font-bold text-emerald-300 uppercase block tracking-wider">
                Saved Jobs
              </span>
              <span className="text-xl font-black text-white">{savedJobsList.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('resume_builder')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                activeSubTab === 'resume_builder'
                  ? 'bg-emerald-800/90 border-emerald-400 shadow-sm'
                  : 'bg-emerald-900/40 border-emerald-700/40 hover:bg-emerald-900/70'
              }`}
            >
              <span className="text-[10px] font-bold text-emerald-300 uppercase block tracking-wider">
                Resume Studio
              </span>
              <span className="text-xl font-black text-white flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 3
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white p-2 rounded-2xl shadow-xs border gap-1.5 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'overview'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Profile Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('details')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'details'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Details & Photo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('applications')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'applications'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>My Applications ({applications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cover_letter')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'cover_letter'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Cover Letter</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('resume_builder')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'resume_builder'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Resume Builder & PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('linkedin_export')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'linkedin_export'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-4 h-4 text-[#0a66c2]" />
          <span>LinkedIn Export</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('saved_jobs')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'saved_jobs'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          <span>Saved Jobs ({savedJobsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('privacy')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'privacy'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('job_alerts')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeSubTab === 'job_alerts'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Job Alerts</span>
        </button>
      </div>

      {/* SECTION 0: TOP-LEVEL 'PROFILE OVERVIEW' DASHBOARD SUMMARY */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Profile Completion Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
                  Readiness Score
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Profile Completion Status: {completionDetails.percentage}%
                </h3>
                <p className="text-xs text-slate-500">
                  {completionDetails.percentage === 100
                    ? 'Your Dominica candidate profile is 100% complete and fully optimized for recruiter visibility.'
                    : 'Complete the remaining items to boost your match ranking with verified Dominican employers.'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-3xl font-black text-emerald-800">
                  {completionDetails.percentage}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/80">
              <div
                className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completionDetails.percentage}%` }}
              />
            </div>

            {/* Next Steps Chips if incomplete */}
            {completionDetails.missingItems.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Actionable Steps to Reach 100%:
                </span>
                <div className="flex flex-wrap gap-2">
                  {completionDetails.missingItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSubTab(item.tab)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.name}</span>
                      <span className="text-[10px] font-bold text-emerald-600">(+{item.weight}%)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Interview Reminders & Quick Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upcoming Interview Reminders */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-base text-slate-900">
                      Upcoming Interview Reminders
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {upcomingInterviews.length} Scheduled
                  </span>
                </div>

                {upcomingInterviews.length === 0 ? (
                  <div className="py-8 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      No Upcoming Interviews Scheduled
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Submit applications to open vacancies across Dominica. When recruiters schedule interviews, your reminders will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={onBrowseJobs}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline pt-1 cursor-pointer"
                    >
                      <span>Browse Open Vacancies</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingInterviews.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">
                              {item.job?.title || 'Position'}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              {item.job?.company || 'Dominica Employer'} • {item.job?.parish}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadInterviewICS(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-amber-900 rounded-lg font-bold border border-amber-300 transition-colors cursor-pointer shrink-0"
                            title="Add to Google Calendar / Apple Calendar"
                          >
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>Add to Calendar</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-slate-700 pt-1">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {item.details.date} at {item.details.time}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-slate-500" />
                            {item.details.mode} ({item.details.location})
                          </span>
                        </div>

                        {item.details.interviewerName && (
                          <p className="text-[11px] text-slate-500 italic pt-0.5">
                            Interviewer: {item.details.interviewerName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity Feed */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-base text-slate-900">Recent Activity</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">Live timeline</span>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No recent activity records yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="flex items-start gap-3 text-xs">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          {act.icon === 'briefcase' && <Briefcase className="w-3.5 h-3.5 text-emerald-700" />}
                          {act.icon === 'bookmark' && <Bookmark className="w-3.5 h-3.5 text-amber-500" />}
                          {act.icon === 'bell' && <Bell className="w-3.5 h-3.5 text-teal-600" />}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="font-bold text-slate-800 line-clamp-1">{act.title}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{act.category}</span>
                            <span>{act.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Hub Tools Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setActiveSubTab('cover_letter')}
              className="p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all text-left space-y-2 cursor-pointer shadow-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">AI Cover Letter</h4>
              <p className="text-xs text-slate-500">
                Generate customized cover letters for Dominica roles in seconds.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('resume_builder')}
              className="p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all text-left space-y-2 cursor-pointer shadow-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-teal-700" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Resume & PDF Studio</h4>
              <p className="text-xs text-slate-500">
                Select from 3 templates and download an executive PDF CV.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('linkedin_export')}
              className="p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all text-left space-y-2 cursor-pointer shadow-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4 text-[#0a66c2]" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">LinkedIn 'Add to Profile'</h4>
              <p className="text-xs text-slate-500">
                1-click credentials sync and structured career data export.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('privacy')}
              className="p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all text-left space-y-2 cursor-pointer shadow-xs group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4 text-slate-700" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Privacy & Visibility</h4>
              <p className="text-xs text-slate-500">
                Manage resume discoverability and anonymize contact info.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: PERSONAL DETAILS EDITING & PHOTO UPLOAD */}
      {activeSubTab === 'details' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Photo Management Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                Profile Photo & Visual Identity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your professional photo or choose a preset Nature Island avatar. This appears on your CV header and recruiter dossier.
              </p>
            </div>

            {photoUploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl">
                {photoUploadError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
              {/* Photo Preview & Controls */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-2xl bg-slate-100 border-2 border-emerald-500/30 overflow-hidden shadow-inner flex items-center justify-center">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <User className="w-10 h-10 mx-auto text-slate-300" />
                      <span className="text-[10px] font-semibold mt-1 block">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>

                  {currentUser?.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove profile photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dominica Preset Avatars */}
              <div className="flex-1 space-y-2 border-t sm:border-t-0 sm:border-l sm:pl-6 border-slate-100 pt-4 sm:pt-0">
                <span className="text-xs font-bold text-slate-700 block">
                  Or select a verified Dominica sector avatar:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_DOMINICA_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer hover:border-emerald-500 ${
                        currentUser?.avatarUrl === preset.url
                          ? 'border-emerald-600 bg-emerald-50 shadow-xs'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <span className="text-[11px] font-bold text-slate-700 leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details Form */}
          <form
            onSubmit={handleSaveDetails}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Basic Personal & Contact Information
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep your candidate record up to date. Employers and recruiters across Waitukubuli reach out via these details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Blanc"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. candidate@natureisland.dm"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (767) 275-XXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Parish of Residence in Dominica *
                </label>
                <select
                  value={parish}
                  onChange={(e) => setParish(e.target.value as Parish)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {DOMINICA_PARISHES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Professional Headline / Desired Role
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Geothermal Operations Specialist & SCADA Engineer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Dominica Work & Residency Status
                </label>
                <select
                  value={residencyStatus}
                  onChange={(e) => setResidencyStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {RESIDENCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Candidate Bio & Executive Summary
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a concise background summary highlighting your Dominican project experience, leadership achievements, and green economy contributions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Skills Tag Management */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Core Skills & Technical Competencies
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-emerald-600 hover:text-rose-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add a new skill (e.g. Tourism Guest Management, High Voltage Power, Python)..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Changes will synchronize across your active Dominica job applications.
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 2: MY APPLICATIONS */}
      {activeSubTab === 'applications' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Applications Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-slate-600 uppercase">Total Submitted</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{applications.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold text-blue-600 uppercase">Screened / Shortlisted</p>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {
                  applications.filter((a) => a.status === 'Screened' || a.status === 'Shortlisted')
                    .length
                }
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
                {
                  applications.filter((a) => a.status === 'Offer Extended' || a.status === 'Hired')
                    .length
                }
              </p>
            </div>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Applications Submitted Yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Explore Dominica's premier classified listings across eco-tourism, renewable energy, and digital tech roles.
              </p>
              <button
                onClick={onBrowseJobs}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
              >
                <span>Find Classifieds</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const job = jobs.find((j) => j.id === app.jobId);
                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          onClick={() => onSelectJob(app.jobId)}
                          className="font-bold text-base text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
                        >
                          {job ? job.title : 'Dominica Vacancy Application'}
                        </h4>
                        <span className="text-xs font-semibold text-slate-500">
                          at {job ? job.company : 'Confidential Employer'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {job && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.parish}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                        {job && (
                          <span className="font-semibold text-emerald-800">
                            EC$ {job.minSalary.toLocaleString()} - {job.maxSalary.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {app.interviewDetails && (
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Interview scheduled for {app.interviewDetails.date} at{' '}
                            {app.interviewDetails.time} ({app.interviewDetails.mode})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {getStatusBadge(app.status)}
                      <button
                        type="button"
                        onClick={() => withdrawApplication(app.id)}
                        title="Withdraw Application"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: RESUME BUILDER & PDF STUDIO */}
      {activeSubTab === 'resume_builder' && (
        <div className="animate-in fade-in">
          <ResumeBuilder jobs={jobs} />
        </div>
      )}

      {/* SECTION 4: AI COVER LETTER GENERATOR */}
      {activeSubTab === 'cover_letter' && (
        <div className="animate-in fade-in">
          <CandidateCoverLetterGenerator onSelectJobForDetails={onSelectJob} />
        </div>
      )}

      {/* SECTION 5: LINKEDIN EXPORT & 'ADD TO PROFILE' */}
      {activeSubTab === 'linkedin_export' && (
        <div className="animate-in fade-in">
          <CandidateLinkedInExportTool />
        </div>
      )}

      {/* SECTION 6: SUMMARY OF SAVED JOBS */}
      {activeSubTab === 'saved_jobs' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-500" />
                Bookmarked Vacancies ({savedJobsList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Review your saved Dominica career opportunities and submit customized applications.
              </p>
            </div>
            {savedJobsList.length > 0 && (
              <button
                onClick={onBrowseJobs}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                <span>Browse More Classifieds</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {savedJobsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                <Bookmark className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">No Saved Jobs Yet</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Click the bookmark star on any job listing in Roseau, Portsmouth, or Remote WIN roles to save it to your candidate profile for quick review.
              </p>
              <button
                onClick={onBrowseJobs}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
              >
                <span>Browse Available Jobs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedJobsList.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mb-1.5">
                          {job.sector}
                        </span>
                        <h4
                          onClick={() => onSelectJob(job.id)}
                          className="font-bold text-base text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors line-clamp-1"
                        >
                          {job.title}
                        </h4>
                        <p className="text-xs font-semibold text-slate-600">{job.company}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSaveJob(job.id)}
                        className="p-1.5 text-amber-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remove from saved jobs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.parish} ({job.locality})
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {job.employmentType}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {job.workModel}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-sm font-black text-emerald-800">
                        EC$ {job.minSalary.toLocaleString()} - {job.maxSalary.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/ month</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSaveJob(job.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      Remove
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectJob(job.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>View & Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: PRIVACY SETTINGS */}
      {activeSubTab === 'privacy' && (
        <div className="animate-in fade-in">
          <CandidatePrivacySettingsPanel />
        </div>
      )}

      {/* SECTION 8: JOB MATCH ALERTS */}
      {activeSubTab === 'job_alerts' && (
        <div className="animate-in fade-in">
          <JobAlertAutomationManager />
        </div>
      )}
    </div>
  );
};
