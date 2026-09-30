import React, { useState } from 'react';
import { ResumeData } from '../types';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { LINKEDIN_PROFILE_PRESETS } from '../data/resumeDefaults';
import {
  X,
  Linkedin,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Copy,
  Zap,
} from 'lucide-react';

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: Partial<ResumeData>) => void;
}

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData,
}) => {
  const modalRef = useModalKeyboard({ isOpen, onClose });
  const [activeTab, setActiveTab] = useState<'presets' | 'paste'>('presets');
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<ResumeData> | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen) return null;

  // Intelligent parser for raw LinkedIn profile text / JSON
  const parseLinkedInData = (text: string): Partial<ResumeData> => {
    const trimmed = text.trim();

    // Check if JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        return {
          fullName: obj.fullName || obj.name || '',
          headline: obj.headline || obj.title || '',
          email: obj.email || '',
          phone: obj.phone || '',
          summary: obj.summary || obj.about || '',
          skills: Array.isArray(obj.skills) ? obj.skills : [],
          experiences: Array.isArray(obj.experiences) ? obj.experiences : [],
          education: Array.isArray(obj.education) ? obj.education : [],
        };
      } catch {
        // continue to text parser
      }
    }

    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: Partial<ResumeData> = {
      skills: [],
      experiences: [],
      education: [],
    };

    if (lines.length > 0) {
      parsed.fullName = lines[0].replace(/^(Name:|\*\*Name:\*\*)\s*/i, '');
    }
    if (lines.length > 1) {
      parsed.headline = lines[1].replace(/^(Headline:|\*\*Headline:\*\*)\s*/i, '');
    }

    // Extract email
    const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) parsed.email = emailMatch[0];

    // Extract phone
    const phoneMatch = trimmed.match(/(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    if (phoneMatch) parsed.phone = phoneMatch[0];

    // Extract parish/location in Dominica
    const parishes = [
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
    ] as const;
    for (const p of parishes) {
      if (new RegExp(p.replace('.', '\\.?'), 'i').test(trimmed)) {
        parsed.parish = p;
        break;
      }
    }

    // Extract About/Summary
    const aboutMatch = trimmed.match(/(?:About|Summary):\s*\n*([^]*?)(?=\n(?:Experience|Education|Skills):|$)/i);
    if (aboutMatch && aboutMatch[1]) {
      parsed.summary = aboutMatch[1].trim();
    }

    // Extract Skills
    const skillsMatch = trimmed.match(/(?:Skills|Top Skills):\s*\n*([^]*?)(?=\n(?:Experience|Education|About):|$)/i);
    if (skillsMatch && skillsMatch[1]) {
      parsed.skills = skillsMatch[1]
        .split(/[,•\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && !/skills/i.test(s));
    }

    // Heuristic experience extraction
    const expMatch = trimmed.match(/(?:Experience):\s*\n*([^]*?)(?=\n(?:Education|Skills|About):|$)/i);
    if (expMatch && expMatch[1]) {
      const expBlocks = expMatch[1].split(/\n{2,}/);
      parsed.experiences = expBlocks
        .slice(0, 4)
        .map((block, idx) => {
          const bLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          const title = bLines[0] || 'Professional Role';
          const companyLine = bLines[1] || 'Dominica Enterprise';
          const company = companyLine.split('•')[0].trim();
          const highlights = bLines
            .filter((l) => l.startsWith('-') || l.startsWith('•') || l.startsWith('*'))
            .map((l) => l.replace(/^[-•*]\s*/, ''));

          return {
            id: `exp-imp-${Date.now()}-${idx}`,
            title,
            company,
            location: 'Dominica',
            startDate: '2023-01',
            endDate: 'Present',
            isCurrent: true,
            highlights: highlights.length > 0 ? highlights : ['Managed key responsibilities and delivered core objectives.'],
          };
        })
        .filter((e) => e.title.length > 2);
    }

    // Heuristic education extraction
    const eduMatch = trimmed.match(/(?:Education):\s*\n*([^]*?)(?=\n(?:Experience|Skills|About):|$)/i);
    if (eduMatch && eduMatch[1]) {
      const eduLines = eduMatch[1].split('\n').map((l) => l.trim()).filter(Boolean);
      if (eduLines.length >= 2) {
        parsed.education = [
          {
            id: `edu-imp-${Date.now()}`,
            institution: eduLines[0],
            degree: eduLines[1],
            field: eduLines[2] || 'Higher Studies',
            location: 'Roseau, Dominica',
            graduationYear: '2022',
          },
        ];
      }
    }

    return parsed;
  };

  const handleSelectPreset = (presetText: string) => {
    setRawText(presetText);
    const result = parseLinkedInData(presetText);
    setParsedPreview(result);
  };

  const handleManualParse = () => {
    if (!rawText.trim()) return;
    const result = parseLinkedInData(rawText);
    setParsedPreview(result);
  };

  const handleApply = () => {
    if (!parsedPreview) return;
    onApplyParsedData(parsedPreview);
    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Import from LinkedIn"
        tabIndex={-1}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#0A66C2] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Linkedin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                LinkedIn Profile Importer & Parser
              </h2>
              <p className="text-xs text-blue-100">
                Auto-populate experience, skills, and education into your Dominica CV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close LinkedIn import"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('presets')}
              className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                activeTab === 'presets'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              1-Click Dominica Profile Presets
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Paste Custom Text / Export
            </button>
          </div>

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Select a pre-formatted candidate profile tailored to key Dominican employment sectors to instantly see the parser in action:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LINKEDIN_PROFILE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.rawText)}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-[#0A66C2] hover:bg-blue-50/50 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-[#0A66C2]">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{preset.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {preset.rawText.substring(0, 90)}...
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#0A66C2] mt-3">
                      Load Preset →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Paste raw profile text, LinkedIn resume export, or JSON:
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Marcus Blanc\nSenior Cloud Engineer | React, AWS\nRoseau, Dominica • marcus@dm.com\n\nExperience:\nSoftware Engineer\nCaribbean Tech Labs • 2022 - Present\n- Built scalable systems\n\nEducation:\nDominica State College\nAssociate Degree, Computer Science\n\nSkills:\nTypeScript, React, Cloud Architecture, PostgreSQL`}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
              <button
                type="button"
                onClick={handleManualParse}
                className="px-4 py-2 bg-[#0A66C2] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse Profile Content</span>
              </button>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedPreview && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mapped Candidate Fields</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Ready to Import
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                  <span className="font-bold text-slate-900">{parsedPreview.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Headline</span>
                  <span className="font-semibold text-slate-800">{parsedPreview.headline || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email / Phone</span>
                  <span className="text-slate-700 font-mono">
                    {parsedPreview.email || '—'} • {parsedPreview.phone || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Dominica Parish</span>
                  <span className="text-emerald-800 font-semibold">{parsedPreview.parish || 'St. George (Default)'}</span>
                </div>
              </div>

              {parsedPreview.experiences && parsedPreview.experiences.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                    Work Experience ({parsedPreview.experiences.length} positions detected)
                  </span>
                  <div className="space-y-1">
                    {parsedPreview.experiences.map((exp, i) => (
                      <div key={i} className="text-xs bg-white p-2 rounded border border-slate-200">
                        <strong className="text-slate-900">{exp.title}</strong> at {exp.company}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedPreview.skills && parsedPreview.skills.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                    Detected Skills ({parsedPreview.skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {parsedPreview.skills.slice(0, 10).map((skill, i) => (
                      <span
                        key={i}
                        className="bg-blue-50 text-[#0A66C2] border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                    {parsedPreview.skills.length > 10 && (
                      <span className="text-slate-400 text-[10px] self-center">
                        +{parsedPreview.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>LinkedIn data applied successfully to active resume!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedPreview}
            onClick={handleApply}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
              parsedPreview
                ? 'bg-[#0A66C2] hover:bg-blue-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Apply to Active CV</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
