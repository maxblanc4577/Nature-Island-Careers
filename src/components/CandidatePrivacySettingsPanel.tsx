import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { CandidatePrivacySettings } from '../types';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
  Save,
  Plus,
  Trash2,
  UserCheck,
  Bell,
} from 'lucide-react';

export const CandidatePrivacySettingsPanel: React.FC = () => {
  const { currentUser, updateCurrentUser } = useJobContext();

  const currentSettings: CandidatePrivacySettings = currentUser?.privacySettings || {
    isResumePublic: true,
    hideContactInfo: false,
    openToWorkStatus: 'actively_looking',
    restrictedEmployers: ['Current Employer (Confidential)'],
    allowDirectRecruiterMessages: true,
  };

  const [isResumePublic, setIsResumePublic] = useState<boolean>(currentSettings.isResumePublic);
  const [hideContactInfo, setHideContactInfo] = useState<boolean>(currentSettings.hideContactInfo);
  const [openToWorkStatus, setOpenToWorkStatus] = useState<
    'actively_looking' | 'open_to_offers' | 'casually_exploring' | 'not_looking'
  >(currentSettings.openToWorkStatus);
  const [restrictedEmployers, setRestrictedEmployers] = useState<string[]>(
    currentSettings.restrictedEmployers || []
  );
  const [newEmployerInput, setNewEmployerInput] = useState('');
  const [allowDirectRecruiterMessages, setAllowDirectRecruiterMessages] = useState<boolean>(
    currentSettings.allowDirectRecruiterMessages
  );
  const [saveToast, setSaveToast] = useState(false);

  const handleAddRestrictedEmployer = () => {
    const trimmed = newEmployerInput.trim();
    if (trimmed && !restrictedEmployers.includes(trimmed)) {
      setRestrictedEmployers((prev) => [...prev, trimmed]);
      setNewEmployerInput('');
    }
  };

  const handleRemoveRestrictedEmployer = (nameToRemove: string) => {
    setRestrictedEmployers((prev) => prev.filter((n) => n !== nameToRemove));
  };

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: CandidatePrivacySettings = {
      isResumePublic,
      hideContactInfo,
      openToWorkStatus,
      restrictedEmployers,
      allowDirectRecruiterMessages,
    };

    updateCurrentUser({
      privacySettings: updatedSettings,
    });

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Candidate Privacy & Talent Visibility
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Resume Visibility & Privacy Controls
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Control whether verified Dominican employers can discover your profile, anonymize contact details, and hide your candidacy from current employers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
              isResumePublic
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}
          >
            {isResumePublic ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resume Public</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Resume Private</span>
              </>
            )}
          </span>
        </div>
      </div>

      {saveToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Privacy settings updated and enforced across Dominica recruiter searches.
          </span>
          <button
            type="button"
            onClick={() => setSaveToast(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-base leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSavePrivacy} className="space-y-6">
        {/* Toggle 1: Resume Visibility */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Allow Verified Dominica Recruiters to Search Your Resume
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                When enabled, verified recruiters at organizations like Fort Young, Secret Bay, Dominica Electricity Services (DOMLEC), and DGDC can discover your profile in the candidate search pool.
              </p>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={isResumePublic}
                onChange={(e) => setIsResumePublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Toggle 2: Contact Anonymization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Anonymize Personal Contact Information
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Protects your direct phone/WhatsApp number and personal email until you accept an interview invitation or apply directly to a vacancy. Recruiters will contact you securely through the Nature Island Careers platform.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={hideContactInfo}
                onChange={(e) => setHideContactInfo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Toggle 3: Open to Work Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <label className="text-sm font-bold text-slate-900 block">
            Dominica Career & Employment Availability Status
          </label>
          <p className="text-xs text-slate-500">
            Signals your interest level to recruiters reviewing candidate pipelines.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              {
                id: 'actively_looking',
                title: 'Actively Looking',
                desc: 'Ready for interviews and immediate placement in Dominica or Remote.',
              },
              {
                id: 'open_to_offers',
                title: 'Open to High-Impact Offers',
                desc: 'Comfortable in current role but exploring competitive executive opportunities.',
              },
              {
                id: 'casually_exploring',
                title: 'Casually Exploring',
                desc: 'Browsing market salaries and industry updates across the parishes.',
              },
              {
                id: 'not_looking',
                title: 'Not Looking (Stealth Mode)',
                desc: 'Completely hidden from search. Only visible to jobs you explicitly apply to.',
              },
            ].map((statusOption) => (
              <label
                key={statusOption.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  openToWorkStatus === statusOption.id
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="openToWorkStatus"
                  value={statusOption.id}
                  checked={openToWorkStatus === statusOption.id}
                  onChange={() => setOpenToWorkStatus(statusOption.id as any)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{statusOption.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{statusOption.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Restricted Employers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-slate-600" />
              Restricted Employers (Blocked from Viewing Your Profile)
            </h3>
            <p className="text-xs text-slate-500">
              Add company names from whom you wish to remain invisible (e.g., your current employer).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {restrictedEmployers.map((emp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200"
              >
                <span>{emp}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRestrictedEmployer(emp)}
                  className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
            {restrictedEmployers.length === 0 && (
              <span className="text-xs text-slate-400 italic">No companies currently blocked.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newEmployerInput}
              onChange={(e) => setNewEmployerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRestrictedEmployer();
                }
              }}
              placeholder="e.g. Current Employer Name..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddRestrictedEmployer}
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Block Employer</span>
            </button>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Privacy updates take effect immediately across all parish employer accounts.
          </p>

          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Privacy Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
