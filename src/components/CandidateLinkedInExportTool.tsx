import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import {
  ExternalLink,
  Download,
  Copy,
  Check,
  Share2,
  Award,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const CandidateLinkedInExportTool: React.FC = () => {
  const { currentUser } = useJobContext();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Resume data from localStorage if saved in resume builder
  const storedResume = (() => {
    try {
      const raw = localStorage.getItem('dominica_candidate_resume');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return null;
  })();

  const candidateName = currentUser?.name || 'Max Blanc';
  const headline = currentUser?.headline || 'Senior Full-Stack Cloud Architect & Green Systems Lead';
  const parish = currentUser?.parish || 'St. George';
  const bio =
    currentUser?.bio ||
    'Experienced Dominican technology practitioner with 6+ years designing high-availability cloud platforms, sustainable IoT monitoring tools, and cross-functional teams in the Commonwealth of Dominica.';
  const skills = currentUser?.skills || [
    'React & TypeScript',
    'Node.js & Express',
    'PostgreSQL',
    'Cloud Architecture (GCP/AWS)',
    'Geothermal SCADA Protocols',
  ];

  // Experiences and Education (from stored resume or defaults)
  const experiences = storedResume?.experiences || [
    {
      id: 'exp-1',
      title: 'Senior Cloud Infrastructure Architect',
      company: 'Dominica Tech Innovation Hub',
      location: 'Roseau, St. George, Dominica',
      startDate: '2023',
      endDate: 'Present',
      isCurrent: true,
      highlights: [
        'Architected fault-tolerant microservices for island-wide utility billing and clean energy analytics.',
        'Mentored junior developers from Dominica State College (DSC) in modern TypeScript and cloud security.',
      ],
    },
    {
      id: 'exp-2',
      title: 'Full-Stack Software Engineer',
      company: 'Waitukubuli Digital Solutions',
      location: 'Portsmouth, St. John, Dominica',
      startDate: '2021',
      endDate: '2023',
      isCurrent: false,
      highlights: [
        'Built real-time agro-supply logistics systems connecting farmers across St. David and St. Andrew.',
        'Engineered responsive web portals handling 15,000+ monthly Caribbean users.',
      ],
    },
  ];

  const educations = storedResume?.education || [
    {
      id: 'edu-1',
      institution: 'Dominica State College (DSC)',
      degree: 'Associate of Science',
      field: 'Computer Science & Information Technology',
      graduationYear: '2020',
      location: 'Stockfarm, Roseau, Dominica',
    },
  ];

  const certifications = storedResume?.certifications || [
    {
      id: 'cert-1',
      name: 'Google Cloud Certified Professional Architect',
      issuer: 'Google Cloud Platform',
      year: '2024',
    },
    {
      id: 'cert-2',
      name: 'Dominica Renewable Energy & Geothermal Safety Standards',
      issuer: 'Dominica Ministry of Energy & DGDC',
      year: '2025',
    },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Generate LinkedIn 'Add to Profile' URL for Certification
  const getLinkedInCertUrl = (certName: string, issuer: string, year: string) => {
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: certName,
      organizationName: issuer,
      issueYear: year,
      certUrl: 'https://natureislandcareers.com',
    });
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  };

  // Generate LinkedIn 'Add to Profile' URL for Education
  const getLinkedInEduUrl = (school: string, degree: string, field: string, year: string) => {
    const params = new URLSearchParams({
      startTask: 'EDUCATION',
      schoolName: school,
      degreeName: degree,
      fieldOfStudy: field,
      endYear: year,
    });
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  };

  // Formatted LinkedIn About Section
  const formattedAboutText = `${headline} | Commonwealth of Dominica 🇩🇲

${bio}

📍 Location: ${parish}, Dominica
💼 Key Competencies:
• ${skills.join('\n• ')}

Verified through Nature Island Careers (Waitukubuli Premier Job Classifieds).`;

  // Download structured LinkedIn profile JSON
  const handleDownloadLinkedInJSON = () => {
    const linkedInExportObject = {
      $schema: 'https://json.schemastore.org/resume',
      basics: {
        name: candidateName,
        label: headline,
        email: currentUser?.email || 'candidate@waitukubuli.dm',
        phone: currentUser?.phone || '+1 767 275-XXXX',
        summary: bio,
        location: {
          city: parish,
          countryCode: 'DM',
          region: 'Dominica (Waitukubuli)',
        },
        profiles: [
          {
            network: 'Nature Island Careers',
            username: candidateName.toLowerCase().replace(/\s+/g, '.'),
            url: 'https://natureislandcareers.com',
          },
        ],
      },
      work: experiences.map((exp: any) => ({
        name: exp.company,
        position: exp.title,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.isCurrent ? 'Present' : exp.endDate,
        summary: (exp.highlights || []).join('\n• '),
        highlights: exp.highlights || [],
      })),
      education: educations.map((edu: any) => ({
        institution: edu.institution,
        area: edu.field,
        studyType: edu.degree,
        endDate: edu.graduationYear,
      })),
      certificates: certifications.map((c: any) => ({
        name: c.name,
        issuer: c.issuer,
        date: c.year,
      })),
      skills: skills.map((s: string) => ({ name: s, level: 'Advanced' })),
    };

    const blob = new Blob([JSON.stringify(linkedInExportObject, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dominica_Candidate_LinkedIn_Profile_${candidateName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0a66c2] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#0a66c2]" />
            LinkedIn Integration & Export
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            LinkedIn 'Add to Profile' & Career Data Export
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Synchronize your verified Dominica certifications, education, and career experience directly to LinkedIn using official 1-click 'Add to Profile' deep-links or export structured career JSON.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadLinkedInJSON}
          className="inline-flex items-center gap-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download LinkedIn JSON</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Official 1-Click 'Add to Profile' Buttons */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              1-Click 'Add to Profile' Certifications
            </h3>
            <p className="text-xs text-slate-500">
              Clicking these buttons opens LinkedIn with your Dominican certifications and credentials prefilled.
            </p>

            <div className="space-y-2.5">
              {certifications.map((cert: any) => (
                <div
                  key={cert.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{cert.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {cert.issuer} • Issued {cert.year}
                    </p>
                  </div>
                  <a
                    href={getLinkedInCertUrl(cert.name, cert.issuer, cert.year)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <span>Add to LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              1-Click 'Add to Profile' Education
            </h3>
            <div className="space-y-2.5">
              {educations.map((edu: any) => (
                <div
                  key={edu.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{edu.institution}</p>
                    <p className="text-[11px] text-slate-500">
                      {edu.degree} in {edu.field} ({edu.graduationYear})
                    </p>
                  </div>
                  <a
                    href={getLinkedInEduUrl(
                      edu.institution,
                      edu.degree,
                      edu.field,
                      edu.graduationYear
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <span>Add to LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: LinkedIn About Copy & Profile JSON Schema */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                Formatted LinkedIn "About" Summary
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(formattedAboutText, 'about')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedSection === 'about' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Formatted specifically for pasting into the LinkedIn "About" section on your public profile.
            </p>
            <textarea
              readOnly
              rows={8}
              value={formattedAboutText}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 leading-relaxed focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Open Resume & LinkedIn Schema
              </h3>
              <button
                type="button"
                onClick={handleDownloadLinkedInJSON}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Universal JSON standard compatible with LinkedIn Easy Apply, JSON Resume, and Caribbean ATS portals.
            </p>
            <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 no-scrollbar">
              <pre>{JSON.stringify({
                name: candidateName,
                headline,
                location: `${parish}, Dominica`,
                experiencesCount: experiences.length,
                certificationsCount: certifications.length,
                skillsCount: skills.length,
                standards: "JSON Resume & LinkedIn Schema v1.0",
              }, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
