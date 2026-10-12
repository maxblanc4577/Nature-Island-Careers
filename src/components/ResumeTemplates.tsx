import React from 'react';
import { ResumeData, ResumeTemplateLayout } from '../types';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export interface ResumeTemplateOption {
  id: ResumeTemplateLayout;
  label: string;
  shortLabel: string;
  tagline: string;
  accentClass: string;
}

export const RESUME_TEMPLATE_OPTIONS: ResumeTemplateOption[] = [
  {
    id: 'modern',
    label: 'Modern',
    shortLabel: 'Modern',
    tagline: 'Tech, Remote & Digital (2-Column)',
    accentClass: 'bg-emerald-600 text-white',
  },
  {
    id: 'executive',
    label: 'Executive',
    shortLabel: 'Executive',
    tagline: 'Leadership, Finance & Boardroom',
    accentClass: 'bg-slate-800 text-amber-300',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    shortLabel: 'Minimalist',
    tagline: 'Clean ATS & Editorial Monochrome',
    accentClass: 'bg-zinc-900 text-white',
  },
  {
    id: 'classic',
    label: 'Classic',
    shortLabel: 'Classic',
    tagline: 'Public Sector & Civil Service',
    accentClass: 'bg-stone-700 text-white',
  },
  {
    id: 'creative',
    label: 'Creative',
    shortLabel: 'Creative',
    tagline: 'Eco-Tourism & Hospitality',
    accentClass: 'bg-teal-600 text-white',
  },
];

interface ResumeTemplateProps {
  data: ResumeData;
  layout: ResumeTemplateLayout;
}

export const ResumeTemplateView = React.forwardRef<HTMLDivElement, ResumeTemplateProps>(
  ({ data, layout }, ref) => {
    switch (layout) {
      case 'executive':
        return <ExecutiveTemplate data={data} ref={ref} />;
      case 'minimalist':
        return <MinimalistTemplate data={data} ref={ref} />;
      case 'classic':
        return <ClassicTemplate data={data} ref={ref} />;
      case 'creative':
        return <CreativeTemplate data={data} ref={ref} />;
      case 'modern':
      default:
        return <ModernTemplate data={data} ref={ref} />;
    }
  }
);

ResumeTemplateView.displayName = 'ResumeTemplateView';

// ==========================================
// 1. MODERN TEMPLATE (Tech / Remote / WIN)
// ==========================================
const ModernTemplate = React.forwardRef<HTMLDivElement, { data: ResumeData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="resume-template-modern"
        data-layout="modern"
        className="w-full bg-white text-slate-800 shadow-xl print:shadow-none border border-slate-200 print:border-none rounded-lg overflow-hidden font-sans text-[13px] leading-relaxed max-w-[850px] mx-auto min-h-[1050px]"
      >
        {/* Top Accent Header Bar */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 text-emerald-200 border border-emerald-600/40 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full mb-2">
                <span>Dominica Verified Candidate</span>
                {data.dssNumber && <span>• DSS: {data.dssNumber}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {data.fullName || 'Candidate Name'}
              </h1>
              <p className="text-sm font-semibold text-emerald-300 mt-0.5">
                {data.headline || 'Professional Title'}
              </p>
            </div>

            {/* Quick Contact Box */}
            <div className="text-xs space-y-1 text-emerald-100/90 sm:text-right">
              <div className="flex items-center sm:justify-end gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>
                  {data.locality ? `${data.locality}, ` : ''}
                  {data.parish} • Dominica
                </span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{data.email}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{data.phone}</span>
              </div>
              {data.linkedinUrl && (
                <div className="flex items-center sm:justify-end gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate max-w-[200px]">{data.linkedinUrl}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Layout Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-7">
          {/* Main Left/Center Column (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            {/* Executive Summary */}
            {data.summary && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b-2 border-emerald-700/30 pb-1 mb-2.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Professional Summary</span>
                </h2>
                <p className="text-slate-700 text-xs sm:text-[13px] leading-relaxed">
                  {data.summary}
                </p>
              </section>
            )}

            {/* Work Experience */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b-2 border-emerald-700/30 pb-1 mb-3.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                <span>Employment & Experience</span>
              </h2>

              <div className="space-y-4">
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-3 border-l-2 border-emerald-200">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {exp.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-mono">
                        {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-emerald-900 mb-1.5">
                      {exp.company} <span className="font-normal text-slate-500">• {exp.location}</span>
                    </div>

                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs">
                      {exp.highlights.map((item, idx) => (
                        <li key={idx} className="leading-snug">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b-2 border-emerald-700/30 pb-1 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Education & Academic Credentials</span>
              </h2>

              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                      </h3>
                      <span className="text-[11px] font-mono font-semibold text-slate-600">
                        {edu.graduationYear}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-900 font-medium mt-0.5">
                      {edu.institution} <span className="text-slate-500">• {edu.location}</span>
                    </div>
                    {edu.honors && (
                      <p className="text-[11px] text-amber-800 font-medium mt-1">
                        ★ {edu.honors}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Right Column (4 cols) */}
          <div className="md:col-span-4 space-y-6 md:border-l md:border-slate-200 md:pl-6">
            {/* Core Competencies / Skills */}
            <section data-testid="resume-template-skills-section">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b-2 border-emerald-700/30 pb-1 mb-3">
                Skills & Deliverables
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    data-testid="resume-skill-tag"
                    className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Certifications & Licenses */}
            {data.certifications && data.certifications.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b-2 border-emerald-700/30 pb-1 mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Certifications</span>
                </h2>
                <div className="space-y-2.5">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="text-xs">
                      <div className="font-bold text-slate-900 leading-tight">
                        {cert.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {cert.issuer} • <span className="font-mono">{cert.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {data.languages && data.languages.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b-2 border-emerald-700/30 pb-1 mb-2.5">
                  Languages
                </h2>
                <div className="space-y-1 text-xs text-slate-700">
                  {data.languages.map((lang, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>{lang}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dominica Social Security & Legal Work Clearance Note */}
            <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1 text-emerald-900">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dominica Authorization</span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-normal">
                Authorized for legal employment in the Commonwealth of Dominica under national labour laws and CARICOM CSME frameworks.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
ModernTemplate.displayName = 'ModernTemplate';

// ==========================================
// 2. CLASSIC TEMPLATE (Executive / Public Sector / Finance)
// ==========================================
const ClassicTemplate = React.forwardRef<HTMLDivElement, { data: ResumeData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="resume-template-classic"
        data-layout="classic"
        className="w-full bg-white text-stone-900 shadow-xl print:shadow-none border border-stone-200 print:border-none p-8 font-serif leading-relaxed max-w-[850px] mx-auto min-h-[1050px]"
      >
        {/* Header - Formal Centered */}
        <header className="text-center pb-5 border-b-2 border-stone-800 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase text-stone-950 font-serif">
            {data.fullName || 'Candidate Name'}
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-stone-600">
            {data.headline || 'Professional Headline'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-stone-600 font-sans pt-1">
            <span>{data.parish}, Commonwealth of Dominica</span>
            <span>•</span>
            <span>{data.phone}</span>
            <span>•</span>
            <span className="underline">{data.email}</span>
            {data.dssNumber && (
              <>
                <span>•</span>
                <span>DSS No: {data.dssNumber}</span>
              </>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="space-y-6 pt-5">
          {/* Executive Summary */}
          {data.summary && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-1 mb-2 font-sans">
                Professional Profile
              </h2>
              <p className="text-xs sm:text-[13px] text-stone-800 leading-relaxed text-justify">
                {data.summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-1 mb-3.5 font-sans">
              Professional Experience
            </h2>

            <div className="space-y-4">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between">
                    <span className="font-bold text-sm text-stone-950">
                      {exp.title} — <span className="font-semibold italic text-stone-700">{exp.company}</span>
                    </span>
                    <span className="text-xs font-sans text-stone-600">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-stone-500 italic">
                    {exp.location}
                  </p>

                  <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-stone-800">
                    {exp.highlights.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-1 mb-3 font-sans">
              Education & Qualifications
            </h2>

            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-stone-950 text-[13px]">
                      {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                    </span>
                    <div className="text-stone-700 italic">
                      {edu.institution}, {edu.location}
                    </div>
                    {edu.honors && (
                      <div className="text-[11px] text-stone-600 font-sans">
                        Honors: {edu.honors}
                      </div>
                    )}
                  </div>
                  <span className="font-sans text-stone-600 font-medium">
                    {edu.graduationYear}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Core Competencies */}
          <section data-testid="resume-template-skills-section">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-1 mb-2 font-sans">
              Key Competencies & Technical Skills
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-800 font-sans leading-relaxed">
              {data.skills.map((skill, idx) => (
                <span
                  key={idx}
                  data-testid="resume-skill-tag"
                  className="bg-stone-100 text-stone-900 border border-stone-300 px-2 py-0.5 rounded font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Certifications & Licenses */}
          {data.certifications && data.certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-400 pb-1 mb-2 font-sans">
                Professional Credentials & Certifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-1.5 text-stone-800">
                    <span className="font-bold">▪</span>
                    <span>
                      <strong>{cert.name}</strong> ({cert.issuer}, {cert.year})
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }
);
ClassicTemplate.displayName = 'ClassicTemplate';

// ==========================================
// 3. CREATIVE TEMPLATE (Eco-Resort / Tourism / Design)
// ==========================================
const CreativeTemplate = React.forwardRef<HTMLDivElement, { data: ResumeData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="resume-template-creative"
        data-layout="creative"
        className="w-full bg-white text-slate-800 shadow-xl print:shadow-none border border-teal-200 print:border-none rounded-2xl overflow-hidden font-sans text-[13px] leading-relaxed max-w-[850px] mx-auto min-h-[1050px]"
      >
        {/* Creative Nature Banner with tropical styling */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-950 text-white p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full inline-block mb-2">
                🌿 Nature Isle Talent • {data.parish}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {data.fullName || 'Candidate Name'}
              </h1>
              <p className="text-base text-teal-200 font-semibold mt-1">
                {data.headline || 'Hospitality & Eco-Tourism Specialist'}
              </p>
            </div>

            {/* Contact Card */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 text-xs space-y-1 text-teal-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{data.locality || data.parish}, Dominica</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{data.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{data.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Creative Body */}
        <div className="p-8 space-y-6">
          {/* Summary Quote */}
          {data.summary && (
            <div className="bg-teal-50/70 border-l-4 border-teal-600 p-4 rounded-r-xl text-teal-950 italic text-xs sm:text-[13px] leading-relaxed">
              "{data.summary}"
            </div>
          )}

          {/* Experience Cards */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-teal-900 flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                <Briefcase className="w-4 h-4" />
              </span>
              <span>Career Journey & Achievements</span>
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {data.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 hover:border-teal-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {exp.title}
                    </h3>
                    <span className="bg-teal-100/80 text-teal-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-teal-800 mb-2">
                    {exp.company} • <span className="font-normal text-slate-500">{exp.location}</span>
                  </div>

                  <ul className="space-y-1 text-xs text-slate-700">
                    {exp.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education & Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Education */}
            <section>
              <h2 className="text-sm font-black uppercase tracking-wider text-teal-900 flex items-center gap-2 mb-3">
                <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span>Education & Training</span>
              </h2>

              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <h4 className="font-bold text-slate-900">
                      {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                    </h4>
                    <p className="text-teal-800 font-medium">{edu.institution}</p>
                    <p className="text-slate-500 text-[11px]">{edu.location} • Class of {edu.graduationYear}</p>
                    {edu.honors && (
                      <p className="text-amber-800 font-semibold text-[11px] mt-1">★ {edu.honors}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Skills & Certifications */}
            <section className="space-y-4" data-testid="resume-template-skills-section">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-teal-900 flex items-center gap-2 mb-3">
                  <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                    <Award className="w-4 h-4" />
                  </span>
                  <span>Specialized Skills</span>
                </h2>

                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      data-testid="resume-skill-tag"
                      className="bg-teal-50 text-teal-900 border border-teal-300/80 px-2.5 py-1 rounded-lg text-xs font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {data.certifications && data.certifications.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Accreditations
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {data.certifications.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>{c.name}</strong> — {c.issuer} ({c.year})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }
);
CreativeTemplate.displayName = 'CreativeTemplate';

// ==========================================
// 4. EXECUTIVE TEMPLATE (Senior Leadership / Corporate / Boardroom)
// ==========================================
const ExecutiveTemplate = React.forwardRef<HTMLDivElement, { data: ResumeData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="resume-template-executive"
        data-layout="executive"
        className="w-full bg-white text-slate-900 shadow-xl print:shadow-none border border-slate-300 print:border-none rounded-lg overflow-hidden font-sans text-[13px] leading-relaxed max-w-[850px] mx-auto min-h-[1050px]"
      >
        {/* Executive Slate & Gold Header */}
        <div className="bg-slate-950 text-white px-8 py-7 border-b-4 border-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Dossier • Commonwealth of Dominica</span>
                {data.dssNumber && <span>• DSS {data.dssNumber}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-serif">
                {data.fullName || 'Candidate Name'}
              </h1>
              <p className="text-sm font-semibold text-amber-300 mt-1 tracking-wide">
                {data.headline || 'Executive Director & Senior Specialist'}
              </p>
            </div>

            <div className="text-xs space-y-1 text-slate-300 sm:text-right font-mono">
              <div>
                {data.locality ? `${data.locality}, ` : ''}
                {data.parish}, Dominica
              </div>
              <div>{data.email}</div>
              <div>{data.phone}</div>
              {data.linkedinUrl && (
                <div className="text-amber-300/90 truncate max-w-[220px]">{data.linkedinUrl}</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Executive Profile Callout */}
          {data.summary && (
            <section className="bg-slate-50 border-l-4 border-slate-900 p-4 rounded-r-lg">
              <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 mb-1.5">
                Executive Leadership Profile
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                {data.summary}
              </p>
            </section>
          )}

          {/* Core Leadership & Technical Competencies */}
          <section data-testid="resume-template-skills-section">
            <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-3 flex items-center justify-between">
              <span>Core Competencies & Strategic Capabilities</span>
              <span className="text-[10px] font-semibold text-amber-700">Executive Portfolio</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, idx) => (
                <span
                  key={idx}
                  data-testid="resume-skill-tag"
                  className="bg-slate-900 text-amber-300 px-3 py-1 rounded text-xs font-bold tracking-wide"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Professional Experience */}
          <section>
            <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-4">
              Career Track Record & Leadership Impact
            </h2>
            <div className="space-y-5">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 bg-slate-100/80 px-3 py-1.5 rounded border border-slate-200">
                    <div>
                      <span className="font-black text-slate-950 text-sm">{exp.title}</span>
                      <span className="text-slate-500 mx-2">|</span>
                      <span className="font-bold text-amber-800 text-xs uppercase tracking-wider">
                        {exp.company}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="px-3 text-[11px] text-slate-500 font-medium">
                    Location: {exp.location}
                  </div>
                  <ul className="list-disc list-outside pl-7 space-y-1 text-xs text-slate-800">
                    {exp.highlights.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education & Credentials Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <section>
              <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Academic Credentials
              </h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="text-xs space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-950">
                      <span>
                        {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                      </span>
                      <span className="font-mono text-slate-600">{edu.graduationYear}</span>
                    </div>
                    <div className="text-slate-700 font-medium">
                      {edu.institution} • {edu.location}
                    </div>
                    {edu.honors && (
                      <div className="text-[11px] text-amber-800 font-semibold">★ {edu.honors}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Certifications & Languages
              </h2>
              <div className="space-y-2 text-xs">
                {data.certifications?.map((cert) => (
                  <div key={cert.id} className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900">{cert.name}</span>
                    <span className="text-slate-500 font-mono shrink-0">
                      {cert.issuer} ({cert.year})
                    </span>
                  </div>
                ))}
                {data.languages && data.languages.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                    <strong className="text-slate-900 uppercase">Languages: </strong>
                    {data.languages.join(' • ')}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }
);
ExecutiveTemplate.displayName = 'ExecutiveTemplate';

// ==========================================
// 5. MINIMALIST TEMPLATE (Clean Editorial / ATS-First / Monochrome)
// ==========================================
const MinimalistTemplate = React.forwardRef<HTMLDivElement, { data: ResumeData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="resume-template-minimalist"
        data-layout="minimalist"
        className="w-full bg-white text-zinc-900 shadow-xl print:shadow-none border border-zinc-200 print:border-none p-8 sm:p-10 font-sans text-[13px] leading-relaxed max-w-[850px] mx-auto min-h-[1050px]"
      >
        {/* Minimalist Clean Header */}
        <header className="pb-6 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-zinc-950">
              {data.fullName || 'Candidate Name'}
            </h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              {data.headline || 'Professional Specialist'}
            </p>
          </div>
          <div className="text-xs text-zinc-500 space-y-0.5 sm:text-right font-mono">
            <div>
              {data.locality ? `${data.locality}, ` : ''}
              {data.parish}, Dominica
            </div>
            <div>
              {data.email} • {data.phone}
            </div>
            {data.dssNumber && <div>DSS ID: {data.dssNumber}</div>}
          </div>
        </header>

        <div className="space-y-7 pt-6">
          {/* Summary */}
          {data.summary && (
            <section className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6">
              <div className="sm:col-span-3">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Summary
                </h2>
              </div>
              <div className="sm:col-span-9">
                <p className="text-xs sm:text-[13px] text-zinc-700 leading-relaxed">
                  {data.summary}
                </p>
              </div>
            </section>
          )}

          {/* Experience */}
          <section className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 border-t border-zinc-100 pt-6">
            <div className="sm:col-span-3">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                Experience
              </h2>
            </div>
            <div className="sm:col-span-9 space-y-5">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <h3 className="font-semibold text-zinc-950 text-sm">
                      {exp.title}{' '}
                      <span className="font-normal text-zinc-500">at {exp.company}</span>
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">{exp.location}</div>
                  <ul className="space-y-1 text-xs text-zinc-700 pt-0.5">
                    {exp.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-zinc-400 select-none">—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section
            data-testid="resume-template-skills-section"
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 border-t border-zinc-100 pt-6"
          >
            <div className="sm:col-span-3">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                Skills
              </h2>
            </div>
            <div className="sm:col-span-9 flex flex-wrap gap-1.5">
              {data.skills.map((skill, idx) => (
                <span
                  key={idx}
                  data-testid="resume-skill-tag"
                  className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-0.5 rounded text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 border-t border-zinc-100 pt-6">
            <div className="sm:col-span-3">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                Education
              </h2>
            </div>
            <div className="sm:col-span-9 space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="flex flex-wrap justify-between items-baseline text-xs">
                  <div>
                    <span className="font-semibold text-zinc-900">
                      {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                    </span>
                    <span className="text-zinc-500">
                      {' '}
                      — {edu.institution}, {edu.location}
                    </span>
                    {edu.honors && (
                      <div className="text-[11px] text-zinc-500 mt-0.5">{edu.honors}</div>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {edu.graduationYear}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 border-t border-zinc-100 pt-6">
              <div className="sm:col-span-3">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Credentials
                </h2>
              </div>
              <div className="sm:col-span-9 space-y-1.5 text-xs text-zinc-700">
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between">
                    <span className="font-medium text-zinc-900">
                      {cert.name} <span className="text-zinc-500">({cert.issuer})</span>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">{cert.year}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }
);
MinimalistTemplate.displayName = 'MinimalistTemplate';
