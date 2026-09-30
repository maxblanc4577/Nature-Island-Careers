import React, { useState } from 'react';
import { JobListing, ResumeData } from '../types';
import { DOMINICA_SKILL_RECOMMENDATIONS } from '../data/resumeDefaults';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface SkillGapAnalysisProps {
  resumeData: ResumeData;
  jobs: JobListing[];
}

export const SkillGapAnalysis: React.FC<SkillGapAnalysisProps> = ({
  resumeData,
  jobs,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const targetJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  if (!targetJob) {
    return <div className="p-4 text-center text-slate-500">No active job listings available.</div>;
  }

  // Normalize candidate skills
  const candidateSkillWords = new Set(
    resumeData.skills.flatMap((s) => s.toLowerCase().split(/[\s,&/-]+/)).filter((w) => w.length > 2)
  );

  // Extract job requirements & skills
  const jobRequirements = [
    ...(targetJob.requiredSkills || []),
    ...(targetJob.requirements || []),
  ];

  // Match analysis
  const matchedRequirements: string[] = [];
  const missingRequirements: string[] = [];

  jobRequirements.forEach((req) => {
    const reqWords = req.toLowerCase().split(/[\s,&/-]+/).filter((w) => w.length > 2);
    const hasMatch = reqWords.some((w) => candidateSkillWords.has(w));
    if (hasMatch) {
      matchedRequirements.push(req);
    } else {
      missingRequirements.push(req);
    }
  });

  const totalReqs = matchedRequirements.length + missingRequirements.length || 1;
  const matchScore = Math.round((matchedRequirements.length / totalReqs) * 100);

  // Find recommended courses based on sector or missing keywords
  const recommendedCourses = Object.entries(DOMINICA_SKILL_RECOMMENDATIONS).filter(
    ([key, course]) => {
      if (course.sector === targetJob.sector) return true;
      const lowerMissing = missingRequirements.join(' ').toLowerCase();
      return lowerMissing.includes(key);
    }
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mb-1">
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span>Dominica Career Pathway Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            Skill Gaps Analysis & Certification Pathways
          </h2>
          <p className="text-xs text-slate-500">
            Compare your CV against accredited Dominica job postings and discover local upskilling programs.
          </p>
        </div>
      </div>

      {/* Target Job Selector */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Target Role to Compare:
        </label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} at {j.company} ({j.parish} • {j.sector})
            </option>
          ))}
        </select>
      </div>

      {/* Match Score Gauge */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shrink-0">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {matchScore}%
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-200">
              Match
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-white">
              {targetJob.title} Compatibility
            </h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              {matchedRequirements.length} of {totalReqs} key employer requirements matched from your active resume.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {matchScore >= 75 ? '★ Strong Candidate Profile' : '⚡ Upskilling Recommended'}
          </span>
        </div>
      </div>

      {/* Side-by-side Skills Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched Skills */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Matching Qualifications ({matchedRequirements.length})</span>
            </h4>
          </div>

          {matchedRequirements.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No direct keyword overlap found yet.</p>
          ) : (
            <div className="space-y-1.5">
              {matchedRequirements.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs text-slate-800 flex items-start gap-2 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing / Gap Skills */}
        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Skill Gaps to Address ({missingRequirements.length})</span>
            </h4>
          </div>

          {missingRequirements.length === 0 ? (
            <p className="text-xs text-emerald-700 font-semibold">
              Outstanding! Your CV covers all highlighted requirements for this role.
            </p>
          ) : (
            <div className="space-y-1.5">
              {missingRequirements.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs text-slate-800 flex items-start gap-2 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggested Courses & Certifications in Dominica */}
      <div className="pt-2 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>Recommended Dominica Courses & Accreditations</span>
          </h4>
          <span className="text-[11px] text-slate-500">Tailored to {targetJob.sector}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendedCourses.slice(0, 3).map(([key, course]) => (
            <div
              key={key}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-emerald-500 transition-all group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  {course.certificationType}
                </span>
                <h5 className="font-bold text-xs text-slate-900 mt-2 leading-snug group-hover:text-emerald-900">
                  {course.courseName}
                </h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  <strong>Provider:</strong> {course.provider}
                </p>
                <p className="text-[11px] text-slate-500">
                  <strong>Duration:</strong> {course.duration}
                </p>
              </div>

              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 group-hover:underline"
              >
                <span>Enroll / Course Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
