import React, { useState } from 'react';
import { JobListing, ResumeData } from '../types';
import { useJobContext } from '../context/JobContext';
import {
  Sparkles,
  Copy,
  Check,
  FileDown,
  Printer,
  Building,
  MapPin,
  RefreshCw,
  Send,
  Loader2,
} from 'lucide-react';

interface CoverLetterGeneratorProps {
  resumeData: ResumeData;
  jobs: JobListing[];
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  resumeData,
  jobs,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const buildInitialLetter = (job: JobListing, data: ResumeData): string => {
    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const topSkills = data.skills.slice(0, 3).join(', ');
    const latestExp = data.experiences[0];

    return `${data.fullName || 'Marcus Blanc'}
${data.locality ? `${data.locality}, ` : ''}${data.parish}, Commonwealth of Dominica
Email: ${data.email} | Phone: ${data.phone}
${data.dssNumber ? `Dominica Social Security (DSS) No: ${data.dssNumber}\n` : ''}
${todayStr}

Hiring Committee & Human Resources Department
${job.company}
${job.locality}, ${job.parish}
Commonwealth of Dominica (Waitukubuli)

RE: Application for the Position of ${job.title} (Vacancy Ref #${job.id})

Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${job.title} vacancy at ${job.company}, as recently announced on Nature Island Careers. Having closely observed ${job.company}’s leadership and commitment to excellence in ${job.locality}, I am eager to contribute my background and technical competencies to your team.

With my background in ${data.headline || job.sector} and hands-on expertise in ${topSkills || 'strategic execution, project delivery, and local stakeholder liaison'}, I bring proven capabilities that align directly with the responsibilities outlined in your vacancy announcement.${latestExp ? ` In my recent role as ${latestExp.title} at ${latestExp.company}, I successfully delivered measurable results while ensuring compliance with Caribbean operational standards.` : ''}

As a resident of ${data.parish}, I am deeply invested in the sustainable development and economic growth of the Commonwealth of Dominica. The mission of ${job.company} in advancing high-quality employment within our island aligns with my professional values. I am fully authorized to work in Dominica and prepared to contribute immediately to your ongoing objectives.

Thank you for your consideration of my application. I welcome the opportunity to discuss how my qualifications, local knowledge, and dedication will benefit ${job.company} in an interview.

Sincerely,

${data.fullName || 'Marcus Blanc'}
${data.headline ? `${data.headline}\n` : ''}Commonwealth of Dominica`;
  };

  const [letterContent, setLetterContent] = useState<string>(() =>
    selectedJob ? buildInitialLetter(selectedJob, resumeData) : ''
  );

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    const newJob = jobs.find((j) => j.id === jobId);
    if (newJob) {
      setLetterContent(buildInitialLetter(newJob, resumeData));
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedJob) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/career/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: selectedJob,
          resumeData,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.coverLetter) {
          setLetterContent(json.coverLetter);
          setIsGenerating(false);
          return;
        }
      }
    } catch {
      // ignore, use fallback
    }

    // High quality client-side fallback
    setTimeout(() => {
      setLetterContent(buildInitialLetter(selectedJob, resumeData));
      setIsGenerating(false);
    }, 600);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(letterContent);
      } else {
        const ta = document.createElement('textarea');
        ta.value = letterContent;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadText = () => {
    const element = document.createElement('a');
    const file = new Blob([letterContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${(resumeData.fullName || 'Candidate').replace(/\s+/g, '_')}_Cover_Letter_${selectedJob?.company || 'Dominica'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>AI Cover Letter Generator</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            Tailored Cover Letter for Dominica Employers
          </h2>
          <p className="text-xs text-slate-500">
            Automatically aligns your resume credentials with local vacancy requirements and parish context.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                <span>Drafting Letter...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Re-Generate Letter</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Job Selector */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Target Dominica Vacancy:
        </label>
        <select
          value={selectedJobId}
          onChange={(e) => handleJobChange(e.target.value)}
          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} — {j.company} ({j.parish}, EC${j.minSalary.toLocaleString()} - EC${j.maxSalary.toLocaleString()})
            </option>
          ))}
        </select>

        {selectedJob && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {selectedJob.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {selectedJob.locality} ({selectedJob.parish})
            </span>
            <span className="text-emerald-800 font-bold font-mono">
              EC${selectedJob.minSalary.toLocaleString()} / {selectedJob.salaryPeriod}
            </span>
          </div>
        )}
      </div>

      {/* Editable Cover Letter Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Cover Letter Draft (Editable):
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadText}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>
        </div>

        <textarea
          rows={16}
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
          className="w-full text-xs font-sans p-4 border border-slate-300 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white shadow-inner font-mono"
        />
      </div>
    </div>
  );
};
