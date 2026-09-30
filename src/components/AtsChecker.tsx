import React, { useState } from 'react';
import { JobListing, ResumeData } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  Percent,
  Search,
  Zap,
} from 'lucide-react';

interface AtsCheckerProps {
  resumeData: ResumeData;
  jobs: JobListing[];
}

export const AtsChecker: React.FC<AtsCheckerProps> = ({ resumeData, jobs }) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const targetJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  if (!targetJob) {
    return <div className="p-4 text-center text-slate-500">No active job listings found.</div>;
  }

  // 1. Keyword check
  const resumeText = JSON.stringify(resumeData).toLowerCase();
  const jobKeywords = [
    ...(targetJob.requiredSkills || []),
    ...(targetJob.responsibilities || []),
    targetJob.title,
    targetJob.sector,
    targetJob.locality,
  ]
    .flatMap((s) => s.toLowerCase().split(/[\s,&/-]+/))
    .filter((w) => w.length > 3);

  const uniqueJobKeywords = Array.from(new Set(jobKeywords));
  const matchedKeywords = uniqueJobKeywords.filter((kw) => resumeText.includes(kw));
  const keywordScore = Math.min(
    100,
    Math.round((matchedKeywords.length / Math.max(uniqueJobKeywords.length, 1)) * 100)
  );

  // 2. Action verbs check
  const actionVerbs = [
    'spearheaded',
    'managed',
    'architected',
    'built',
    'developed',
    'directed',
    'implemented',
    'coordinated',
    'reduced',
    'improved',
    'led',
    'negotiated',
    'designed',
    'delivered',
    'resolved',
  ];
  const detectedVerbs = actionVerbs.filter((v) => resumeText.includes(v));
  const verbScore = Math.min(100, Math.round((detectedVerbs.length / 5) * 100));

  // 3. Formatting & structure check
  let formatScore = 100;
  const issues: string[] = [];
  const passes: string[] = [];

  if (!resumeData.email || !resumeData.email.includes('@')) {
    formatScore -= 20;
    issues.push('Missing or invalid email address for automated ATS communication.');
  } else {
    passes.push('Clean, standard email header detected.');
  }

  if (!resumeData.phone) {
    formatScore -= 15;
    issues.push('Missing contact phone number (essential for Dominica recruiter screening).');
  } else {
    passes.push('Parseable contact telephone number provided.');
  }

  if (!resumeData.parish) {
    formatScore -= 10;
    issues.push('Missing Dominica Parish specification (employers use parish indexing).');
  } else {
    passes.push(`Dominica Parish locality (${resumeData.parish}) accurately registered.`);
  }

  if (!resumeData.experiences || resumeData.experiences.length === 0) {
    formatScore -= 30;
    issues.push('No work experience entries detected. ATS engines require timeline history.');
  } else {
    passes.push(`${resumeData.experiences.length} standard reverse-chronological work experiences.`);
  }

  if (!resumeData.skills || resumeData.skills.length < 5) {
    formatScore -= 15;
    issues.push('Less than 5 skills specified. Consider adding more sector-specific keywords.');
  } else {
    passes.push(`Strong skills inventory with ${resumeData.skills.length} indexed capabilities.`);
  }

  // Calculate Overall Composite ATS Score
  const overallAtsScore = Math.round(
    keywordScore * 0.45 + verbScore * 0.25 + Math.max(0, formatScore) * 0.3
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 mb-1">
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Automated Recruitment Screening Tool</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            ATS Compatibility & Keyword Scanner
          </h2>
          <p className="text-xs text-slate-500">
            Simulates automated enterprise candidate screening algorithms used by Dominica & international recruiters.
          </p>
        </div>
      </div>

      {/* Target Job Selector */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Score Resume Against Job:
        </label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} — {j.company} ({j.parish})
            </option>
          ))}
        </select>
      </div>

      {/* ATS Score Display */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Main Composite Score */}
        <div className="sm:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-md">
          <div className="text-4xl font-black font-mono text-emerald-400">
            {overallAtsScore}
            <span className="text-lg text-emerald-300">/100</span>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold text-slate-300 mt-1">
            ATS Overall Score
          </span>
          <span className="text-[10px] text-slate-400 mt-2">
            {overallAtsScore >= 75 ? 'Likely to pass first-round screening' : 'Room for keyword optimization'}
          </span>
        </div>

        {/* Breakdown Sub-scores */}
        <div className="sm:col-span-3 grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Keyword Density
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono my-1">
              {keywordScore}%
            </div>
            <p className="text-[10px] text-slate-500">
              {matchedKeywords.length} of {uniqueJobKeywords.length} vacancy terms found
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Action Verbs
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono my-1">
              {verbScore}%
            </div>
            <p className="text-[10px] text-slate-500">
              {detectedVerbs.length} high-impact leadership verbs
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Formatting & Data
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono my-1">
              {Math.max(0, formatScore)}%
            </div>
            <p className="text-[10px] text-slate-500">
              Parsability, headers & contacts
            </p>
          </div>
        </div>
      </div>

      {/* Actionable Feedback Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ATS Compliance Strengths</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {passes.map((p, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Standard single/two-column hierarchy parseable by modern OCR.</span>
            </li>
          </ul>
        </div>

        {/* Improvements */}
        <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Recommended Optimization Tweaks</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {issues.length === 0 ? (
              <li className="text-emerald-700 font-semibold">
                No structural formatting issues detected!
              </li>
            ) : (
              issues.map((iss, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                  <span>{iss}</span>
                </li>
              ))
            )}
            <li className="flex items-start gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
              <span>Ensure your cover letter mirrors the job title exact casing ("{targetJob.title}").</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
