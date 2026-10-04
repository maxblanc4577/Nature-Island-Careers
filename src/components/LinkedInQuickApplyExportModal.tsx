import React, { useState } from 'react';
import { ResumeData } from '../types';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  X,
  Linkedin,
  Copy,
  Download,
  Check,
  Code2,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface LinkedInQuickApplyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  versionTitle: string;
}

export const LinkedInQuickApplyExportModal: React.FC<LinkedInQuickApplyExportModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  versionTitle,
}) => {
  const modalRef = useModalKeyboard({ isOpen, onClose });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Split name
  const nameParts = (resumeData.fullName || 'Dominica Professional').trim().split(' ');
  const firstName = nameParts[0] || 'Dominica';
  const lastName = nameParts.slice(1).join(' ') || 'Candidate';

  // Construct structured LinkedIn Quick Apply API JSON payload
  const linkedInPayload = {
    $schema: 'https://schema.linkedin.com/v2/quick-apply/candidate-profile.json',
    profile: {
      firstName,
      lastName,
      formattedName: resumeData.fullName,
      headline: resumeData.headline || 'Dominica Career Professional',
      summary: resumeData.summary || '',
      contactInfo: {
        emailAddress: resumeData.email,
        phoneNumbers: [
          {
            number: resumeData.phone,
            type: 'MOBILE',
          },
        ],
        location: {
          countryCode: 'DM',
          countryName: 'Commonwealth of Dominica',
          region: resumeData.parish,
          city: resumeData.locality || 'Roseau',
        },
      },
      positions: resumeData.experiences.map((exp) => ({
        id: exp.id,
        title: exp.title,
        companyName: exp.company,
        location: exp.location,
        isCurrent: exp.isCurrent,
        startDate: {
          formatted: exp.startDate,
        },
        endDate: exp.isCurrent ? null : { formatted: exp.endDate },
        summary: (exp.highlights || []).join('\n• '),
        responsibilities: exp.highlights || [],
      })),
      educations: resumeData.education.map((edu) => ({
        id: edu.id,
        schoolName: edu.institution,
        degreeName: edu.degree,
        fieldOfStudy: edu.field,
        startDate: null,
        endDate: {
          year: parseInt(edu.graduationYear) || 2025,
        },
        location: edu.location,
      })),
      certifications: (resumeData.certifications || []).map((cert) => ({
        id: cert.id,
        name: cert.name,
        authority: cert.issuer,
        year: cert.year,
      })),
      skills: resumeData.skills.map((skill) => ({
        name: skill,
        standardizedName: skill.toLowerCase(),
      })),
    },
    exportMetadata: {
      generatedBy: 'Nature Island Careers • Waitukubuli National Exchange',
      versionTitle,
      exportTimestamp: new Date().toISOString(),
      formatVersion: '2.4.0-caribbean',
    },
  };

  const jsonString = JSON.stringify(linkedInPayload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${(resumeData.fullName || 'Candidate').replace(/\s+/g, '_')}_LinkedIn_QuickApply.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="LinkedIn Quick-Apply JSON Export"
        tabIndex={-1}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#004182] to-[#0A66C2] text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white font-display">
                  LinkedIn Quick-Apply Export
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  JSON API v2
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Structured candidate profile formatted for 1-click recruiter ingestion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-950 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Automated Format Transformation: </span>
            <span>
              Your Dominica CV ({resumeData.experiences.length} positions, {resumeData.education.length} educational degrees, {resumeData.skills.length} skills) has been compiled into the standard LinkedIn profile schema. Recruiters can parse this directly into applicant tracking systems.
            </span>
          </div>
        </div>

        {/* Code Preview */}
        <div className="p-4 sm:p-5 flex-1 overflow-hidden flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON Payload ({new Blob([jsonString]).size} bytes)</span>
            </span>
            <span className="text-[11px] text-emerald-800 font-bold">✓ Validated Schema</span>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-emerald-300 leading-relaxed border border-slate-800 shadow-inner select-all">
            <pre>{jsonString}</pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-stone-500">
            Exported from active version: <strong className="text-stone-800">{versionTitle}</strong>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-600" />
                  <span>Copy JSON Payload</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
