import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { JobListing } from '../types';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  Briefcase,
  Wand2,
  RefreshCw,
  Building,
  MapPin,
  ChevronDown,
  Info,
  Clock,
  Printer,
} from 'lucide-react';

interface CandidateCoverLetterGeneratorProps {
  onSelectJobForDetails?: (jobId: string) => void;
}

export const CandidateCoverLetterGenerator: React.FC<CandidateCoverLetterGeneratorProps> = ({
  onSelectJobForDetails,
}) => {
  const { currentUser, jobs } = useJobContext();

  // Selected job (defaults to the first active job)
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [isCustomJob, setIsCustomJob] = useState<boolean>(false);
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customSector, setCustomSector] = useState('Information Technology & Digital');
  const [customParish, setCustomParish] = useState('St. George');
  const [customDescription, setCustomDescription] = useState('');

  // Generation options
  const [tone, setTone] = useState<'professional' | 'visionary' | 'green_economy'>('professional');
  const [customNotes, setCustomNotes] = useState('');

  // Output state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active target job
  const activeJob: JobListing | undefined = jobs.find((j) => j.id === selectedJobId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    const targetJobPayload = isCustomJob
      ? {
          title: customJobTitle || 'Open Role',
          company: customCompany || 'Dominica Employer',
          sector: customSector,
          parish: customParish,
          description: customDescription || 'Key responsibilities aligned with Caribbean operations.',
          salaryText: 'Competitive (XCD)',
        }
      : activeJob
      ? {
          title: activeJob.title,
          company: activeJob.company,
          sector: activeJob.sector,
          parish: activeJob.parish,
          description: activeJob.description,
          salaryText: `EC$ ${activeJob.minSalary.toLocaleString()} - ${activeJob.maxSalary.toLocaleString()}`,
        }
      : {
          title: 'Professional Position',
          company: 'Dominica Organization',
          sector: 'Dominica Economy',
          parish: 'St. George',
          description: 'Key operations in Dominica.',
          salaryText: 'Standard',
        };

    const candidatePayload = {
      name: currentUser?.name || 'Max Blanc',
      email: currentUser?.email || 'maxblanc4577@gmail.com',
      phone: currentUser?.phone || '+1 (767) 275-4577',
      parish: currentUser?.parish || 'St. George',
      headline: currentUser?.headline || 'Senior Full-Stack Cloud Architect & Green Tech Lead',
      bio:
        currentUser?.bio ||
        'Experienced Dominican software engineer with proven track record in high-availability cloud platforms and digital modernization across the Caribbean.',
      skills: currentUser?.skills || [
        'React & TypeScript',
        'Node.js & Express',
        'PostgreSQL',
        'Geothermal SCADA Protocols',
      ],
      residencyStatus: currentUser?.residencyStatus || 'Dominican Citizen (Waitukubuli)',
    };

    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateProfile: candidatePayload,
          job: targetJobPayload,
          tone,
          customNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned error while generating cover letter.');
      }

      const data = await res.json();
      if (data.coverLetter) {
        setGeneratedLetter(data.coverLetter);
      } else {
        throw new Error('No cover letter returned.');
      }
    } catch (err: any) {
      console.error('Cover letter generation failed:', err);
      setErrorMsg('Could not contact the AI service. A generated draft has been provided.');
      // Local fallback
      const fallback = `${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

${candidatePayload.name}
${candidatePayload.parish}, Commonwealth of Dominica
${candidatePayload.phone} • ${candidatePayload.email}

Hiring Committee
${targetJobPayload.company}
${targetJobPayload.parish}, Commonwealth of Dominica

Dear Hiring Committee,

I am writing to express my enthusiastic interest in the ${targetJobPayload.title} opportunity at ${targetJobPayload.company}. Having followed your organization's impactful work across ${targetJobPayload.sector} in Dominica, I am eager to apply my background as a ${candidatePayload.headline} to support your upcoming milestones.

Throughout my career in Waitukubuli, I have built deep competence in ${candidatePayload.skills.join(', ')}. My approach pairs rigorous technical standards with deep local awareness, ensuring sustainable outcomes tailored for our island's resilient economic landscape.

I would welcome the opportunity to discuss how my qualifications align with your strategic needs. Thank you for your consideration, and I look forward to speaking with you.

Warm regards,

${candidatePayload.name}
${candidatePayload.headline}`;
      setGeneratedLetter(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!generatedLetter) return;
    const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dominica_Cover_Letter_${(activeJob?.title || 'Application').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!generatedLetter) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cover Letter - ${currentUser?.name || 'Candidate'}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; max-width: 750px; margin: 0 auto; white-space: pre-wrap; font-size: 14px; }
            </style>
          </head>
          <body>${generatedLetter}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            AI Cover Letter Generator
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Personalized Dominica Cover Letters
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Synthesizes your stored candidate summary, skills, and Dominican parish location with specific classified job requirements to produce high-impact applications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Letter...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>Generate AI Cover Letter</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium rounded-xl flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Two Column Layout: Configuration & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Role & Settings */}
        <div className="lg:col-span-5 space-y-5">
          {/* Candidate Profile Context Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Context Loaded from Candidate Profile:
            </span>
            <div className="text-xs text-slate-800 space-y-1">
              <p>
                <strong>Applicant:</strong> {currentUser?.name || 'Max Blanc'}
              </p>
              <p>
                <strong>Headline:</strong>{' '}
                {currentUser?.headline || 'Senior Full-Stack Cloud Architect'}
              </p>
              <p>
                <strong>Location:</strong> {currentUser?.parish || 'St. George'}, Dominica
              </p>
              <p className="line-clamp-2">
                <strong>Bio:</strong>{' '}
                {currentUser?.bio || 'Experienced Dominican software engineer...'}
              </p>
            </div>
          </div>

          {/* Job Selection Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Target Job Opportunity *
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCustomJob(false)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    !isCustomJob
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  From Classifieds
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomJob(true)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    isCustomJob
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Custom Role
                </button>
              </div>
            </div>

            {!isCustomJob ? (
              <div className="space-y-3">
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} · {j.company} ({j.parish})
                    </option>
                  ))}
                </select>

                {activeJob && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-700" />
                      {activeJob.company} • {activeJob.parish}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {activeJob.description}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-800 pt-1">
                      Salary: EC$ {activeJob.minSalary.toLocaleString()} -{' '}
                      {activeJob.maxSalary.toLocaleString()} / mo ({activeJob.workModel})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="e.g. Lead Geothermal Operations Supervisor"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Dominica Electricity Services (DOMLEC)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Job Description / Responsibilities
                  </label>
                  <textarea
                    rows={3}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Paste key responsibilities or requirements..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Tone Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Letter Tone & Perspective
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTone('professional')}
                  className={`p-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                    tone === 'professional'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Professional
                </button>
                <button
                  type="button"
                  onClick={() => setTone('visionary')}
                  className={`p-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                    tone === 'visionary'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Visionary
                </button>
                <button
                  type="button"
                  onClick={() => setTone('green_economy')}
                  className={`p-2 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                    tone === 'green_economy'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Green Economy
                </button>
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Additional Highlights (Optional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Mention my 2025 DSC certification in Solar PV installation..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Generated Letter Preview & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Personalized Cover Letter</h3>
              </div>

              {generatedLetter && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
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
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Download as Text"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Print / PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              )}
            </div>

            {/* Letter Content Area */}
            {generatedLetter ? (
              <div className="space-y-3">
                <textarea
                  rows={18}
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs sm:text-sm font-sans leading-relaxed focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Your generated cover letter will appear here..."
                />
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    Words: {generatedLetter.trim().split(/\s+/).filter(Boolean).length} · Reading
                    Time: ~
                    {Math.ceil(
                      generatedLetter.trim().split(/\s+/).filter(Boolean).length / 200
                    )}{' '}
                    min
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    Editable directly in the editor above
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-16 px-6 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">Ready to Generate Your Letter</h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Click the <strong>"Generate AI Cover Letter"</strong> button above to construct an executive application tailored for {activeJob?.title || 'your target role'} in Dominica.
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
                >
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>Generate Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
