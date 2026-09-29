import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { Parish, JobSector } from '../types';
import {
  X,
  User,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireSubscription: () => void;
  initialMode?: 'jobseeker_register' | 'client_register' | 'login';
}

const PARISHES: Parish[] = [
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
  'Island-wide / Remote',
];

const SECTORS: JobSector[] = [
  'Eco-Tourism & Hospitality',
  'Renewable Energy & Geothermal',
  'Agriculture & Agro-Processing',
  'Healthcare & Medical',
  'Banking & Financial Services',
  'Information Technology & Digital',
  'Education & Training',
  'Logistics & Marine Services',
  'Public Sector & Cooperatives',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onRequireSubscription,
  initialMode = 'jobseeker_register',
}) => {
  const { registerJobseeker, registerClient, loginUser, users } = useJobContext();

  const [mode, setMode] = useState<'jobseeker_register' | 'client_register' | 'login'>(initialMode);

  // Jobseeker fields
  const [jsName, setJsName] = useState('Max Blanc');
  const [jsEmail, setJsEmail] = useState('maxblanc10468@gmail.com');
  const [jsPhone, setJsPhone] = useState('+1 (767) 275-9921');
  const [jsParish, setJsParish] = useState<Parish>('St. George');
  const [jsSector, setJsSector] = useState<JobSector>('Renewable Energy & Geothermal');
  const [jsSkills, setJsSkills] = useState('Electrical SCADA, Microgrids, Marine Eco-Tour Safety');

  // Client fields
  const [clCompany, setClCompany] = useState('Dominica Geothermal Development Co.');
  const [clName, setClName] = useState('Dr. Vince Henderson Support');
  const [clEmail, setClEmail] = useState('careers@geothermaldominica.dm');
  const [clPhone, setClPhone] = useState('+1 (767) 449-3401');
  const [clParish, setClParish] = useState<Parish>('St. George');
  const [clDss, setClDss] = useState('DSS-DOM-90124');
  const [clIndustry, setClIndustry] = useState<JobSector>('Renewable Energy & Geothermal');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('maxblanc10468@gmail.com');
  const [loginError, setLoginError] = useState(false);

  if (!isOpen) return null;

  const handleJobseekerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = jsSkills.split(',').map((s) => s.trim()).filter(Boolean);
    registerJobseeker({
      name: jsName,
      email: jsEmail,
      phone: jsPhone,
      parish: jsParish,
      careerSector: jsSector,
      skills: skillsArray,
    });
    onClose();
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerClient({
      companyName: clCompany,
      name: clName,
      email: clEmail,
      phone: clPhone,
      parish: clParish,
      dssRegistrationNo: clDss,
      industry: clIndustry,
    });
    onClose();
    // Open mandatory subscription checkout
    onRequireSubscription();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginUser(loginEmail);
    if (success) {
      setLoginError(false);
      onClose();
    } else {
      setLoginError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-display">
              {mode === 'jobseeker_register'
                ? 'Job Seeker Registration'
                : mode === 'client_register'
                ? 'Client / Employer Registration'
                : 'Sign In to Dominica Careers'}
            </h2>
            <p className="text-xs text-stone-500">
              Nature Isle Careers · Unified Island Labour Exchange
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close registration modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-stone-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setMode('jobseeker_register')}
            className={`py-2.5 px-2 text-center transition-colors cursor-pointer border-b-2 ${
              mode === 'jobseeker_register'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Job Seeker
          </button>
          <button
            onClick={() => setMode('client_register')}
            className={`py-2.5 px-2 text-center transition-colors cursor-pointer border-b-2 ${
              mode === 'client_register'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Employer (Client)
          </button>
          <button
            onClick={() => setMode('login')}
            className={`py-2.5 px-2 text-center transition-colors cursor-pointer border-b-2 ${
              mode === 'login'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] text-xs space-y-4">
          
          {/* 1. Job Seeker Registration Form */}
          {mode === 'jobseeker_register' && (
            <form onSubmit={handleJobseekerSubmit} className="space-y-3.5">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-950">
                <strong>Free Job Seeker Access:</strong> Create a verified Dominican candidate profile, track your submitted applications in real-time, and get tailored AI career coaching.
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={jsName}
                  onChange={(e) => setJsName(e.target.value)}
                  placeholder="e.g. Max Blanc"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={jsEmail}
                    onChange={(e) => setJsEmail(e.target.value)}
                    placeholder="maxblanc10468@gmail.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Contact Phone (Dominica) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={jsPhone}
                    onChange={(e) => setJsPhone(e.target.value)}
                    placeholder="+1 (767) 555-0199"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Parish of Residence *
                  </label>
                  <select
                    value={jsParish}
                    onChange={(e) => setJsParish(e.target.value as Parish)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    {PARISHES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Primary Career Sector
                  </label>
                  <select
                    value={jsSector}
                    onChange={(e) => setJsSector(e.target.value as JobSector)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Key Skills & Certifications (Comma separated)
                </label>
                <input
                  type="text"
                  value={jsSkills}
                  onChange={(e) => setJsSkills(e.target.value)}
                  placeholder="e.g. Electrical SCADA, PADI Divemaster, Culinary Arts, React"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Complete Job Seeker Registration
                </button>
              </div>
            </form>
          )}

          {/* 2. Client / Employer Registration Form */}
          {mode === 'client_register' && (
            <form onSubmit={handleClientSubmit} className="space-y-3.5">
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  Mandatory Recruiter Subscription Notice
                </div>
                <p>
                  Dominican employers are required to register with their Dominica Social Security (DSS) employer number and pay a monthly subscription fee (from EC$250/mo) to post vacancies and remote work assignments.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={clCompany}
                  onChange={(e) => setClCompany(e.target.value)}
                  placeholder="e.g. Secret Bay Luxury Eco-Villas"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Contact Person / HR Lead *
                  </label>
                  <input
                    type="text"
                    required
                    value={clName}
                    onChange={(e) => setClName(e.target.value)}
                    placeholder="e.g. Marise Shillingford"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Business Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={clEmail}
                    onChange={(e) => setClEmail(e.target.value)}
                    placeholder="talent@secretbay.dm"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    DSS Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={clDss}
                    onChange={(e) => setClDss(e.target.value)}
                    placeholder="DSS-DOM-XXXXX"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Parish Headquarters *
                  </label>
                  <select
                    value={clParish}
                    onChange={(e) => setClParish(e.target.value as Parish)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    {PARISHES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Primary Industry Sector
                </label>
                <select
                  value={clIndustry}
                  onChange={(e) => setClIndustry(e.target.value as JobSector)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Register & Proceed to Subscription Payment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* 3. Sign In Form */}
          {mode === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900"
                  />
                  {loginError && (
                    <p className="text-red-700 text-[11px] mt-1">
                      Account not found with this email. Select a pre-configured account below or register.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Sign In
                </button>
              </form>

              {/* Quick One-Click Switchers for Demonstration */}
              <div className="pt-3 border-t border-stone-100">
                <span className="block text-[11px] font-semibold uppercase text-stone-400 mb-2">
                  Quick Select Active Persona:
                </span>
                <div className="space-y-1.5">
                  {users.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        loginUser(u.email);
                        onClose();
                      }}
                      className="w-full text-left p-2.5 bg-stone-50 hover:bg-emerald-50 rounded-lg border border-stone-200 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">
                          {u.name} {u.companyName ? `(${u.companyName})` : ''}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {u.email} · {u.role.toUpperCase()}
                        </div>
                      </div>
                      <span className="text-emerald-800 text-[11px] font-medium">Switch &rarr;</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
