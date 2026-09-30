import React, { useState, useEffect } from 'react';
import {
  DOMINICA_TRENDING_ROLES,
  TRAINING_PROGRAMS_CATALOG,
  TrendingJobRole,
  TrainingProgram,
} from '../data/trendingRolesData';
import { ResumeLibraryDocument, ResumeVersion, JobListing, JobSector } from '../types';
import { INITIAL_RESUME_LIBRARY } from '../data/resumeLibraryDefaults';
import { INITIAL_RESUME_VERSIONS } from '../data/resumeDefaults';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Bookmark,
  BookmarkCheck,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building,
  DollarSign,
  Laptop,
  Flame,
} from 'lucide-react';

interface CareerSkillsGapAnalyzerProps {
  jobs: JobListing[];
}

export const CareerSkillsGapAnalyzer: React.FC<CareerSkillsGapAnalyzerProps> = ({ jobs }) => {
  // Load stored resumes from library and builder
  const [storedDocs] = useState<ResumeLibraryDocument[]>(() => {
    try {
      const saved = localStorage.getItem('natureisland_resume_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_RESUME_LIBRARY;
  });

  const [storedVersions] = useState<ResumeVersion[]>(() => {
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

  // Selected source resume ID
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    storedDocs[0]?.id || 'doc-lib-1'
  );

  // Target role mode: 'trending' vs 'active_jobs'
  const [roleMode, setRoleMode] = useState<'trending' | 'active_jobs'>('trending');
  const [selectedTrendingId, setSelectedTrendingId] = useState<string>(
    DOMINICA_TRENDING_ROLES[0].id
  );
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');

  // Training provider filter: 'All' | 'Local' | 'Online'
  const [trainingFilter, setTrainingFilter] = useState<'All' | 'Local' | 'Online'>('All');

  // Upskilling study plan state
  const [savedCourseIds, setSavedCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('natureisland_saved_courses');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['dsc-cloud', 'dda-customer'];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleSaveCourse = (courseId: string) => {
    setSavedCourseIds((prev) => {
      const updated = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      try {
        localStorage.setItem('natureisland_saved_courses', JSON.stringify(updated));
      } catch {
        // ignore
      }
      triggerToast(
        updated.includes(courseId)
          ? 'Course added to your personal career development plan!'
          : 'Course removed from your development plan.'
      );
      return updated;
    });
  };

  // Determine candidate skills from selected source
  const selectedDoc = storedDocs.find((d) => d.id === selectedResumeId);
  const selectedVer = storedVersions.find((v) => v.id === selectedResumeId);

  let candidateSkills: string[] = [];
  let candidateTitle = '';
  let candidateParish = 'St. George';

  if (selectedDoc) {
    candidateTitle = selectedDoc.title;
    candidateParish = selectedDoc.parish;
    candidateSkills = selectedDoc.tags || [];
    // Also parse common technical tokens from content
    const tokens = selectedDoc.content
      .split(/[\n,•|]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2 && t.length < 35);
    candidateSkills = Array.from(new Set([...candidateSkills, ...tokens.slice(0, 15)]));
  } else if (selectedVer) {
    candidateTitle = selectedVer.title;
    candidateParish = selectedVer.data.parish;
    candidateSkills = selectedVer.data.skills || [];
  } else {
    candidateTitle = 'Marcus Blanc (Cloud Systems CV)';
    candidateSkills = [
      'React & Next.js',
      'TypeScript',
      'Node.js & Express',
      'AWS Cloud Infrastructure',
      'PostgreSQL',
      'Docker',
      'REST APIs',
    ];
  }

  // Determine target requirements
  let targetTitle = '';
  let targetSector: JobSector = 'Information Technology & Digital';
  let targetLocation = '';
  let targetSalary = '';
  let requiredSkillsList: string[] = [];
  let relevantCourseKeys: string[] = [];

  if (roleMode === 'trending') {
    const trending =
      DOMINICA_TRENDING_ROLES.find((r) => r.id === selectedTrendingId) ||
      DOMINICA_TRENDING_ROLES[0];
    targetTitle = trending.title;
    targetSector = trending.sector;
    targetLocation = trending.parishFocus;
    targetSalary = trending.monthlySalaryXCD;
    requiredSkillsList = trending.requiredSkills;
    relevantCourseKeys = trending.recommendedCourseKeys;
  } else {
    const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
    if (activeJob) {
      targetTitle = activeJob.title;
      targetSector = activeJob.sector;
      targetLocation = `${activeJob.locality} (${activeJob.parish})`;
      targetSalary = `EC$ ${activeJob.minSalary.toLocaleString()} – EC$ ${activeJob.maxSalary.toLocaleString()} / ${activeJob.salaryPeriod}`;
      requiredSkillsList = [
        ...(activeJob.requiredSkills || []),
        ...(activeJob.requirements || []),
      ];
      // Match relevant course keys by sector
      relevantCourseKeys = Object.keys(TRAINING_PROGRAMS_CATALOG).filter(
        (k) =>
          TRAINING_PROGRAMS_CATALOG[k].name.toLowerCase().includes(activeJob.sector.toLowerCase()) ||
          k.includes('dsc') ||
          k.includes('coursera') ||
          k.includes('dda')
      );
    }
  }

  // Normalized skill comparison
  const candidateNormalized = new Set(
    candidateSkills.map((s) => s.toLowerCase().replace(/[^\w]/g, ''))
  );

  const matchedSkills: string[] = [];
  const gapSkills: string[] = [];

  requiredSkillsList.forEach((req) => {
    const reqClean = req.toLowerCase().replace(/[^\w]/g, '');
    const hasOverlap = Array.from(candidateNormalized).some(
      (c) => reqClean.includes(c) || c.includes(reqClean) || req.toLowerCase().split(' ').some((w) => w.length > 3 && c.includes(w))
    );
    if (hasOverlap) {
      matchedSkills.push(req);
    } else {
      gapSkills.push(req);
    }
  });

  const totalReqCount = matchedSkills.length + gapSkills.length || 1;
  const matchPercentage = Math.min(100, Math.round((matchedSkills.length / totalReqCount) * 100));

  // Filter training programs
  const recommendedCourses: TrainingProgram[] = Object.values(
    TRAINING_PROGRAMS_CATALOG
  ).filter((course) => {
    // Check if directly tied to target or matches missing gap skills
    const matchesTarget = relevantCourseKeys.includes(course.id);
    const matchesGaps = gapSkills.some((gap) =>
      course.skillsTaught.some(
        (st) =>
          gap.toLowerCase().includes(st.toLowerCase()) ||
          st.toLowerCase().includes(gap.toLowerCase())
      )
    );

    if (!matchesTarget && !matchesGaps) return false;

    if (trainingFilter === 'Local' && !course.type.includes('Local')) return false;
    if (trainingFilter === 'Online' && !course.type.includes('Online')) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Dominica National Workforce Competency Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Skills Gap Analysis & Career Upskilling
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
            Compare your stored resume credentials against trending growth sectors in the Commonwealth of Dominica. Identify your qualification gaps and discover accredited local programs (DSC, UWI, DDA, DBOS) and international certifications to qualify for top-tier salaries.
          </p>
        </div>

        {/* Highlight badge */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-1.5 shrink-0 self-start md:self-center">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>High-Demand Sectors 2026</span>
          </div>
          <p className="text-emerald-100 text-[11px]">
            • Geothermal Baselines (Laudat)<br />
            • WIN Remote Tech Infrastructure<br />
            • Nature Isle Eco-Hospitality Peak
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source Resume Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>1. Select Stored Candidate Resume:</span>
            </label>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              {candidateParish}
            </span>
          </div>

          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <optgroup label="Stored Library Documents">
              {storedDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.currentVersion} • {doc.docType})
                </option>
              ))}
            </optgroup>
            <optgroup label="Resume Builder Active Iterations">
              {storedVersions.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  {ver.title} ({ver.targetSector})
                </option>
              ))}
            </optgroup>
          </select>

          {/* Candidate Skills Pill Inventory */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
              Extracted Qualifications ({candidateSkills.length} competencies):
            </span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
              {candidateSkills.slice(0, 10).map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium shadow-2xs"
                >
                  {skill}
                </span>
              ))}
              {candidateSkills.length > 10 && (
                <span className="text-[10px] font-bold text-emerald-800 self-center px-1">
                  +{candidateSkills.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Target Job Role Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>2. Select Target Dominica Position:</span>
            </label>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setRoleMode('trending')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  roleMode === 'trending' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Trending Island Roles
              </button>
              <button
                type="button"
                onClick={() => setRoleMode('active_jobs')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  roleMode === 'active_jobs' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Active Vacancies ({jobs.length})
              </button>
            </div>
          </div>

          {roleMode === 'trending' ? (
            <select
              value={selectedTrendingId}
              onChange={(e) => setSelectedTrendingId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {DOMINICA_TRENDING_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} — {role.monthlySalaryXCD} ({role.demandTag})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.company} ({job.parish}, EC${job.minSalary.toLocaleString()})
                </option>
              ))}
            </select>
          )}

          {/* Target Metadata Banner */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-800">{targetTitle}</span>
            <span className="font-mono font-bold text-emerald-800">{targetSalary}</span>
          </div>
        </div>
      </div>

      {/* MATCH PERCENTAGE & GAP ANALYSIS COMPARISON */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Composite Score Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-md">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {matchPercentage}%
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-300">
                Match Score
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {matchPercentage >= 75
                    ? '★ Competitive Candidate'
                    : matchPercentage >= 50
                    ? '⚡ Actionable Bridge Opportunity'
                    : '🌱 Foundational Training Needed'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {targetTitle} Gap Assessment
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Matched <strong>{matchedSkills.length}</strong> of <strong>{totalReqCount}</strong> core competencies. Completing the recommended courses below bridges the remaining <strong>{gapSkills.length}</strong> missing qualifications.
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-right text-slate-400 shrink-0">
            <span>Location: <strong className="text-white">{targetLocation}</strong></span>
          </div>
        </div>

        {/* 2-Column Comparison Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Matched Skills */}
          <div className="bg-emerald-50/60 rounded-xl p-5 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Match Competencies ({matchedSkills.length})</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-800">
                Found in your CV
              </span>
            </div>

            {matchedSkills.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                No direct keyword overlap found yet. Review the target requirements on the right.
              </p>
            ) : (
              <div className="space-y-2">
                {matchedSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs text-slate-800 flex items-center justify-between shadow-2xs"
                  >
                    <span className="font-semibold text-slate-900">{skill}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Ready</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Skill Gaps */}
          <div className="bg-amber-50/60 rounded-xl p-5 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Identified Skill Gaps ({gapSkills.length})</span>
              </h4>
              <span className="text-[11px] font-bold text-amber-800">
                Recommended Upskilling
              </span>
            </div>

            {gapSkills.length === 0 ? (
              <div className="p-4 bg-white rounded-lg border border-emerald-300 text-xs text-emerald-800 font-semibold text-center">
                Outstanding! Your resume covers all core employer deliverables for this position.
              </div>
            ) : (
              <div className="space-y-2">
                {gapSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-slate-800 flex items-center justify-between shadow-2xs"
                  >
                    <span className="font-semibold text-slate-900">{skill}</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                      Gap to Bridge
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECOMMENDED DOMINICA LOCAL & ACCREDITED ONLINE PROGRAMS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
              <span>Curated Education & Certification Pathways</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Programs to Bridge Your Skill Gaps
            </h3>
            <p className="text-xs text-slate-500">
              Verified local courses (Dominica State College, UWI, DDA, DBOS) and global online credentials tailored to {targetSector}.
            </p>
          </div>

          {/* Filter Local vs Online */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['All', 'Local', 'Online'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTrainingFilter(mode)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  trainingFilter === mode
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'All' ? 'All Providers' : mode === 'Local' ? 'Dominica In-Person' : 'Online / Hybrid'}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendedCourses.map((course) => {
            const isSaved = savedCourseIds.includes(course.id);
            const isLocal = course.type.includes('Local');

            return (
              <div
                key={course.id}
                className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isLocal
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {isLocal ? '🇩🇲 Dominica In-Person' : '🌐 Accredited Online'}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleSaveCourse(course.id)}
                      className="p-1 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                      title={isSaved ? 'Remove from study plan' : 'Add to career plan'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-emerald-700 fill-emerald-100" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-900 leading-snug font-display">
                    {course.name}
                  </h4>

                  <p className="text-xs text-emerald-800 font-semibold mt-1">
                    {course.institution}
                  </p>

                  <div className="space-y-1 text-xs text-slate-600 my-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{course.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{course.cost}</span>
                    </div>
                  </div>

                  {/* Skills Taught */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Curriculum & Competencies Covered:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {course.skillsTaught.map((s, i) => (
                        <span
                          key={i}
                          className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {course.certificationEarned.substring(0, 24)}...
                  </span>

                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Enroll / Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROADMAP ACTION PLAN */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h4 className="text-base font-bold text-white">
            Dominica Career Progression Roadmap: Next Steps
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
            <span className="text-amber-400 font-bold uppercase tracking-wider block">
              Phase 1: Bridge Core Skills
            </span>
            <p className="text-slate-300 leading-relaxed">
              Enroll in local programs at Dominica State College or UWI Global Campus. Take advantage of government scholarships or NEP apprenticeships.
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
            <span className="text-emerald-400 font-bold uppercase tracking-wider block">
              Phase 2: Update Dominica CV
            </span>
            <p className="text-slate-300 leading-relaxed">
              Open the <strong>Resume Builder</strong> in your Candidate Hub. Add your new certifications and generate a tailored Dominica PDF CV with the Modern or Classic template.
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
            <span className="text-teal-400 font-bold uppercase tracking-wider block">
              Phase 3: Network & Interview
            </span>
            <p className="text-slate-300 leading-relaxed">
              Attend the upcoming Dominica Career Expos (at DSC Auditorium or Fort Young), practice Caribbean mock interview questions in <strong>Interview Prep Mode</strong>, and submit directly to employers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
