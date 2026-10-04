import React, { useState, useRef, useEffect } from 'react';
import {
  ResumeData,
  ResumeVersion,
  ResumeTemplateLayout,
  JobListing,
  Parish,
  JobSector,
  ResumeExperience,
  ResumeEducation,
  ResumeCertification,
} from '../types';
import { INITIAL_RESUME_VERSIONS } from '../data/resumeDefaults';
import { ResumeTemplateView } from './ResumeTemplates';
import { LinkedInImportModal } from './LinkedInImportModal';
import { LinkedInQuickApplyExportModal } from './LinkedInQuickApplyExportModal';
import { CertificateScannerModal } from './CertificateScannerModal';
import { CoverLetterGenerator } from './CoverLetterGenerator';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { AtsChecker } from './AtsChecker';
import { generateResumePdf } from '../utils/generateResumePdf';
import {
  FileText,
  Sparkles,
  Download,
  Linkedin,
  Copy,
  Plus,
  Trash2,
  Edit3,
  Check,
  Layout,
  Briefcase,
  BookOpen,
  Award,
  Layers,
  Printer,
  ChevronDown,
  Loader2,
  Target,
  FileCheck,
  Send,
  Eye,
  Camera,
  Code2,
} from 'lucide-react';

interface ResumeBuilderProps {
  jobs: JobListing[];
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ jobs }) => {
  // Load versions from localStorage or initial seed
  const [versions, setVersions] = useState<ResumeVersion[]>(() => {
    try {
      const saved = localStorage.getItem('natureisland_resume_versions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_RESUME_VERSIONS;
  });

  const [activeVersionId, setActiveVersionId] = useState<string>(
    versions[0]?.id || 'res-ver-1'
  );

  const activeVersion =
    versions.find((v) => v.id === activeVersionId) || versions[0];

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('natureisland_resume_versions', JSON.stringify(versions));
    } catch {
      // ignore
    }
  }, [versions]);

  // Mode navigation inside Resume Builder
  const [activeMode, setActiveMode] = useState<
    'editor_preview' | 'cover_letter' | 'skill_gaps' | 'ats_checker'
  >('editor_preview');

  // Form Section Navigation
  const [formSection, setFormSection] = useState<
    'contact' | 'experience' | 'education' | 'skills' | 'certifications'
  >('contact');

  // Modals & States
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isLinkedInExportOpen, setIsLinkedInExportOpen] = useState(false);
  const [isCertScannerOpen, setIsCertScannerOpen] = useState(false);
  const [isNewVersionDialogOpen, setIsNewVersionDialogOpen] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionSector, setNewVersionSector] =
    useState<JobSector>('Information Technology & Digital');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  const resumePreviewRef = useRef<HTMLDivElement>(null);

  // Update active version's data
  const updateActiveData = (updater: (prev: ResumeData) => ResumeData) => {
    setVersions((prev) =>
      prev.map((v) => {
        if (v.id === activeVersionId) {
          return {
            ...v,
            data: updater(v.data),
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return v;
      })
    );
  };

  // Change active layout template
  const setLayoutTemplate = (layout: ResumeTemplateLayout) => {
    setVersions((prev) =>
      prev.map((v) =>
        v.id === activeVersionId ? { ...v, layoutTemplate: layout } : v
      )
    );
  };

  // Create new version
  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionTitle.trim()) return;

    const newVer: ResumeVersion = {
      id: `ver-${Date.now()}`,
      title: newVersionTitle.trim(),
      targetSector: newVersionSector,
      layoutTemplate: 'modern',
      updatedAt: new Date().toISOString().split('T')[0],
      data: {
        ...activeVersion.data,
        headline: `${newVersionTitle} Candidate`,
      },
    };

    setVersions((prev) => [newVer, ...prev]);
    setActiveVersionId(newVer.id);
    setNewVersionTitle('');
    setIsNewVersionDialogOpen(false);
  };

  // Duplicate current version
  const handleDuplicateVersion = () => {
    const copyVer: ResumeVersion = {
      ...activeVersion,
      id: `ver-copy-${Date.now()}`,
      title: `${activeVersion.title} (Copy)`,
      updatedAt: new Date().toISOString().split('T')[0],
      data: JSON.parse(JSON.stringify(activeVersion.data)),
    };
    setVersions((prev) => [copyVer, ...prev]);
    setActiveVersionId(copyVer.id);
  };

  // Delete version
  const handleDeleteVersion = (id: string) => {
    if (versions.length <= 1) {
      return;
    }
    const remaining = versions.filter((v) => v.id !== id);
    setVersions(remaining);
    if (remaining.length > 0) {
      setActiveVersionId(remaining[0].id);
    }
  };

  // Handle PDF Export
  const handleExportPdf = async () => {
    if (!resumePreviewRef.current) return;
    setIsExportingPdf(true);

    try {
      await generateResumePdf({
        element: resumePreviewRef.current,
        fileName: `${activeVersion.data.fullName || 'Candidate'}_Dominica_${activeVersion.layoutTemplate}_CV.pdf`,
        candidateName: activeVersion.data.fullName || 'Candidate',
      });
      setExportNotice(true);
      setTimeout(() => setExportNotice(false), 2500);
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle LinkedIn imported data application
  const handleApplyLinkedInData = (parsed: Partial<ResumeData>) => {
    updateActiveData((prev) => ({
      ...prev,
      fullName: parsed.fullName || prev.fullName,
      headline: parsed.headline || prev.headline,
      email: parsed.email || prev.email,
      phone: parsed.phone || prev.phone,
      parish: parsed.parish || prev.parish,
      summary: parsed.summary || prev.summary,
      skills:
        parsed.skills && parsed.skills.length > 0
          ? Array.from(new Set([...prev.skills, ...parsed.skills]))
          : prev.skills,
      experiences:
        parsed.experiences && parsed.experiences.length > 0
          ? [...parsed.experiences, ...prev.experiences]
          : prev.experiences,
      education:
        parsed.education && parsed.education.length > 0
          ? [...parsed.education, ...prev.education]
          : prev.education,
    }));
  };

  // Helpers for Experience & Education items
  const addExperience = () => {
    const newExp: ResumeExperience = {
      id: `exp-${Date.now()}`,
      title: 'New Position',
      company: 'Dominica Organization Ltd',
      location: 'Roseau, Dominica',
      startDate: '2024-01',
      endDate: 'Present',
      isCurrent: true,
      highlights: ['Managed daily operations and team deliverables.'],
    };
    updateActiveData((prev) => ({
      ...prev,
      experiences: [newExp, ...prev.experiences],
    }));
  };

  const removeExperience = (id: string) => {
    updateActiveData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const addEducation = () => {
    const newEdu: ResumeEducation = {
      id: `edu-${Date.now()}`,
      institution: 'Dominica State College (DSC)',
      degree: 'Associate Degree',
      field: 'Business & Technology',
      location: 'Stockfarm, Dominica',
      graduationYear: '2025',
    };
    updateActiveData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const removeEducation = (id: string) => {
    updateActiveData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (!activeVersion.data.skills.includes(trimmed)) {
      updateActiveData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateActiveData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Version Manager Control Center */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Commonwealth of Dominica CV Studio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Resume Builder & Career Suite
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Create and manage targeted CV versions, import LinkedIn credentials, generate tailored cover letters, and export print-ready PDFs formatted for Dominica employers.
            </p>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setIsCertScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-emerald-600/40"
              title="Upload photo of paper certificate with camera OCR"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Scan Certificate</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLinkedInExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-blue-500/40"
              title="Generate LinkedIn Quick-Apply formatted JSON payload"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-300" />
              <span>LinkedIn Quick-Apply JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLinkedInModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0A66C2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn Import</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Version Manager Bar */}
        <div className="pt-3 border-t border-emerald-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Version Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Active Version:</span>
            </span>
            <select
              value={activeVersionId}
              onChange={(e) => setActiveVersionId(e.target.value)}
              className="bg-slate-900/90 text-white font-semibold border border-emerald-600/50 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {versions.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  {ver.title} ({ver.layoutTemplate.toUpperCase()})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsNewVersionDialogOpen(true)}
              className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              title="Create new resume version"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDuplicateVersion}
              className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
              title="Duplicate current version"
            >
              <Copy className="w-4 h-4" />
            </button>
            {versions.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteVersion(activeVersion.id)}
                className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 transition-colors cursor-pointer"
                title="Delete current version"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Template Layout Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-emerald-700/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300 px-2">
              Layout:
            </span>
            <button
              type="button"
              onClick={() => setLayoutTemplate('modern')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeVersion.layoutTemplate === 'modern'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Modern (Tech/Remote)
            </button>
            <button
              type="button"
              onClick={() => setLayoutTemplate('classic')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeVersion.layoutTemplate === 'classic'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Classic (Public/Bank)
            </button>
            <button
              type="button"
              onClick={() => setLayoutTemplate('creative')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeVersion.layoutTemplate === 'creative'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Creative (Eco-Tourism)
            </button>
          </div>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Professional Dominica PDF CV downloaded successfully!</span>
        </div>
      )}

      {/* Sub-Feature Mode Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveMode('editor_preview')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeMode === 'editor_preview'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>CV Editor & Live Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('cover_letter')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeMode === 'cover_letter'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Cover Letter Generator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('skill_gaps')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeMode === 'skill_gaps'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Skill Gaps Analysis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('ats_checker')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeMode === 'ats_checker'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>ATS Compatibility Scanner</span>
        </button>
      </div>

      {/* MODE 1: CV EDITOR & LIVE PREVIEW */}
      {activeMode === 'editor_preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Form Editor (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            {/* Form Section Navigation Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-3">
              {(
                [
                  { id: 'contact', label: 'Contact & DSS' },
                  { id: 'experience', label: 'Experience' },
                  { id: 'education', label: 'Education' },
                  { id: 'skills', label: 'Skills' },
                  { id: 'certifications', label: 'Certifications' },
                ] as const
              ).map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setFormSection(sec.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    formSection === sec.id
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Form Fields: Contact Info */}
            {formSection === 'contact' && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={activeVersion.data.fullName}
                    onChange={(e) =>
                      updateActiveData((d) => ({ ...d, fullName: e.target.value }))
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Professional Headline / Role
                  </label>
                  <input
                    type="text"
                    value={activeVersion.data.headline}
                    onChange={(e) =>
                      updateActiveData((d) => ({ ...d, headline: e.target.value }))
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={activeVersion.data.email}
                      onChange={(e) =>
                        updateActiveData((d) => ({ ...d, email: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Telephone
                    </label>
                    <input
                      type="text"
                      value={activeVersion.data.phone}
                      onChange={(e) =>
                        updateActiveData((d) => ({ ...d, phone: e.target.value }))
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dominica Parish
                    </label>
                    <select
                      value={activeVersion.data.parish}
                      onChange={(e) =>
                        updateActiveData((d) => ({
                          ...d,
                          parish: e.target.value as Parish,
                        }))
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {[
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
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Town / Locality
                    </label>
                    <input
                      type="text"
                      value={activeVersion.data.locality}
                      onChange={(e) =>
                        updateActiveData((d) => ({ ...d, locality: e.target.value }))
                      }
                      placeholder="e.g. Roseau Central, Picard"
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dominica Social Security (DSS) No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={activeVersion.data.dssNumber || ''}
                    onChange={(e) =>
                      updateActiveData((d) => ({ ...d, dssNumber: e.target.value }))
                    }
                    placeholder="e.g. DSS-098241"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Professional Summary
                  </label>
                  <textarea
                    rows={4}
                    value={activeVersion.data.summary}
                    onChange={(e) =>
                      updateActiveData((d) => ({ ...d, summary: e.target.value }))
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Form Fields: Work Experience */}
            {formSection === 'experience' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase">
                    Work History ({activeVersion.data.experiences.length})
                  </span>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Role</span>
                  </button>
                </div>

                {activeVersion.data.experiences.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-2 gap-2 pr-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              experiences: d.experiences.map((item) =>
                                item.id === exp.id ? { ...item, title: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          Company / Employer
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              experiences: d.experiences.map((item) =>
                                item.id === exp.id ? { ...item, company: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          Start Date (YYYY-MM)
                        </label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              experiences: d.experiences.map((item) =>
                                item.id === exp.id ? { ...item, startDate: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          End Date (or Present)
                        </label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              experiences: d.experiences.map((item) =>
                                item.id === exp.id ? { ...item, endDate: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">
                        Responsibilities & Achievements (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={exp.highlights.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          updateActiveData((d) => ({
                            ...d,
                            experiences: d.experiences.map((item) =>
                              item.id === exp.id ? { ...item, highlights: lines } : item
                            ),
                          }));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form Fields: Education */}
            {formSection === 'education' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase">
                    Education & Credentials
                  </span>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Degree</span>
                  </button>
                </div>

                {activeVersion.data.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">
                        Institution / College
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateActiveData((d) => ({
                            ...d,
                            education: d.education.map((item) =>
                              item.id === edu.id ? { ...item, institution: val } : item
                            ),
                          }));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          Degree / Qualification
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              education: d.education.map((item) =>
                                item.id === edu.id ? { ...item, degree: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              education: d.education.map((item) =>
                                item.id === edu.id ? { ...item, field: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          Graduation Year
                        </label>
                        <input
                          type="text"
                          value={edu.graduationYear}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              education: d.education.map((item) =>
                                item.id === edu.id ? { ...item, graduationYear: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          Honors / Distinction
                        </label>
                        <input
                          type="text"
                          value={edu.honors || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveData((d) => ({
                              ...d,
                              education: d.education.map((item) =>
                                item.id === edu.id ? { ...item, honors: val } : item
                              ),
                            }));
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form Fields: Skills */}
            {formSection === 'skills' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Add New Skill / Capability
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="newSkillInput"
                      placeholder="e.g. Python, DDA Customer Care, HACCP"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="flex-1 p-2 border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(
                          'newSkillInput'
                        ) as HTMLInputElement;
                        if (input && input.value) {
                          addSkill(input.value);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-emerald-800 text-white rounded-lg font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 uppercase block mb-2">
                    Current Skills ({activeVersion.data.skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                    {activeVersion.data.skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-emerald-700 hover:text-rose-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields: Certifications */}
            {formSection === 'certifications' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-700 uppercase block">
                  Certifications & Licenses
                </span>
                {activeVersion.data.certifications?.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-slate-900">{c.name}</strong>
                      <p className="text-[11px] text-slate-500">
                        {c.issuer} ({c.year})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Live CV Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Live Document Preview (A4 / Letter Format)</span>
              </span>
              <span>Template: <strong className="uppercase text-slate-900">{activeVersion.layoutTemplate}</strong></span>
            </div>

            {/* Scrollable Container with standard printable sheet */}
            <div className="overflow-x-auto bg-slate-100 p-4 rounded-2xl border border-slate-200 max-h-[820px] overflow-y-auto">
              <ResumeTemplateView
                ref={resumePreviewRef}
                data={activeVersion.data}
                layout={activeVersion.layoutTemplate}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: COVER LETTER GENERATOR */}
      {activeMode === 'cover_letter' && (
        <CoverLetterGenerator resumeData={activeVersion.data} jobs={jobs} />
      )}

      {/* MODE 3: SKILL GAPS ANALYSIS */}
      {activeMode === 'skill_gaps' && (
        <SkillGapAnalysis resumeData={activeVersion.data} jobs={jobs} />
      )}

      {/* MODE 4: ATS COMPATIBILITY SCANNER */}
      {activeMode === 'ats_checker' && (
        <AtsChecker resumeData={activeVersion.data} jobs={jobs} />
      )}

      {/* LinkedIn Import Modal */}
      {isLinkedInModalOpen && (
        <LinkedInImportModal
          isOpen={isLinkedInModalOpen}
          onClose={() => setIsLinkedInModalOpen(false)}
          onApplyParsedData={handleApplyLinkedInData}
        />
      )}

      {/* LinkedIn Quick-Apply JSON Export Modal */}
      {isLinkedInExportOpen && (
        <LinkedInQuickApplyExportModal
          isOpen={isLinkedInExportOpen}
          onClose={() => setIsLinkedInExportOpen(false)}
          resumeData={activeVersion.data}
          versionTitle={activeVersion.title}
        />
      )}

      {/* Certificate Scanner & Camera Upload Modal */}
      {isCertScannerOpen && (
        <CertificateScannerModal
          isOpen={isCertScannerOpen}
          onClose={() => setIsCertScannerOpen(false)}
          onAddCertification={(newCert, relatedSkills) => {
            updateActiveData((prev) => ({
              ...prev,
              certifications: [...(prev.certifications || []), newCert],
              skills:
                relatedSkills && relatedSkills.length > 0
                  ? Array.from(new Set([...prev.skills, ...relatedSkills]))
                  : prev.skills,
            }));
          }}
        />
      )}

      {/* Create New Version Dialog */}
      {isNewVersionDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Create New Resume Version
            </h3>
            <form onSubmit={handleCreateVersion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Version Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Geothermal Project Specialist"
                  value={newVersionTitle}
                  onChange={(e) => setNewVersionTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Dominica Sector:
                </label>
                <select
                  value={newVersionSector}
                  onChange={(e) => setNewVersionSector(e.target.value as JobSector)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {[
                    'Information Technology & Digital',
                    'Eco-Tourism & Hospitality',
                    'Renewable Energy & Geothermal',
                    'Agriculture & Agro-Processing',
                    'Healthcare & Medical',
                    'Banking & Financial Services',
                    'Education & Training',
                    'Public Sector & Cooperatives',
                    'Logistics & Marine Services',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewVersionDialogOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Create Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
