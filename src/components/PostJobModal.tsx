import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { Parish, JobSector, EmploymentType, WorkModel, JobListing } from '../types';
import {
  X,
  Building,
  MapPin,
  Briefcase,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Globe,
  Laptop,
} from 'lucide-react';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose }) => {
  const { currentRecruiter, createJob } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const [isGlobalRemote, setIsGlobalRemote] = useState(false);
  const [employerCountry, setEmployerCountry] = useState('United States');
  const [customCountry, setCustomCountry] = useState('');
  const [timezoneRequirement, setTimezoneRequirement] = useState('Any Timezone (Flexible)');
  const [currency, setCurrency] = useState<'USD' | 'XCD' | 'GBP' | 'EUR' | 'CAD'>('USD');

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState(currentRecruiter ? currentRecruiter.companyName : '');
  const [parish, setParish] = useState<Parish>('St. George');
  const [locality, setLocality] = useState('');
  const [sector, setSector] = useState<JobSector>('Information Technology & Digital');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-Time');
  const [workModel, setWorkModel] = useState<WorkModel>('On-site');
  const [rawSalaryMin, setRawSalaryMin] = useState(3000);
  const [rawSalaryMax, setRawSalaryMax] = useState(5000);
  const [salaryPeriod, setSalaryPeriod] = useState<'month' | 'year' | 'hour'>('month');
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [contactEmail, setContactEmail] = useState(currentRecruiter ? currentRecruiter.email : '');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNepApproved, setIsNepApproved] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  // Currency multiplier to XCD (EC$)
  const getXCDMultiplier = (curr: string) => {
    switch (curr) {
      case 'USD':
        return 2.70;
      case 'GBP':
        return 3.50;
      case 'EUR':
        return 2.90;
      case 'CAD':
        return 2.00;
      case 'XCD':
      default:
        return 1.0;
    }
  };

  const calculatedMinXCD = Math.round(rawSalaryMin * getXCDMultiplier(currency));
  const calculatedMaxXCD = Math.round(rawSalaryMax * getXCDMultiplier(currency));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !companyName.trim() || !description.trim()) {
      alert('Please fill in the job title, company name, and job description.');
      return;
    }

    const requirements = requirementsText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const responsibilities = responsibilitiesText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const benefits = benefitsText
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const effectiveCountry =
      isGlobalRemote
        ? (employerCountry === 'Other' ? (customCountry.trim() || 'International') : employerCountry)
        : 'Dominica';

    const newJob: Omit<JobListing, 'id' | 'postedAt' | 'viewsCount' | 'applicantsCount'> = {
      title,
      company: companyName,
      parish: isGlobalRemote ? 'Island-wide / Remote' : parish,
      locality: locality || (isGlobalRemote ? `Global Remote (${effectiveCountry}) • Dominica WIN Certified` : `${parish}, Dominica`),
      sector,
      employmentType,
      workModel: isGlobalRemote ? 'Remote' : workModel,
      minSalary: calculatedMinXCD,
      maxSalary: calculatedMaxXCD,
      salaryPeriod,
      description,
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Execute remote responsibilities in alignment with team goals'],
      requirements: requirements.length > 0 ? requirements : ['Reliable high-speed broadband connection and proven remote autonomy'],
      benefits: benefits.length > 0 ? benefits : ['Competitive international compensation', 'Flexible remote schedule'],
      screeningQuestions: [],
      contactEmail: contactEmail || 'info@natureislandcareers.com',
      applicationDeadline: '2026-11-30',
      isNepApproved: isGlobalRemote ? false : isNepApproved,
      featured: isFeatured,
      recruiterId: currentRecruiter ? currentRecruiter.id : 'rec_automattic',
      isGlobalRemote,
      employerCountry: effectiveCountry,
      timezoneRequirement: isGlobalRemote ? timezoneRequirement : undefined,
      currency,
    };

    createJob(newJob);
    setSubmittedSuccess(true);

    setTimeout(() => {
      setSubmittedSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Post a Job Classified"
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-900/20 my-8 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <Briefcase className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Post a Job Classified</h2>
              <p className="text-xs text-emerald-200">Commonwealth of Dominica Career Exchange</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Job Classified Live!</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Your vacancy has been published and distributed to job seekers across Dominica.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Employer Type Toggle: Dominica Local vs Global Remote */}
            <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsGlobalRemote(false);
                  setWorkModel('On-site');
                  setCurrency('XCD');
                  setParish('St. George');
                }}
                className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isGlobalRemote
                    ? 'bg-white text-emerald-800 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4 text-emerald-600" />
                <span>🏢 Dominica Local Employer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGlobalRemote(true);
                  setWorkModel('Remote');
                  setCurrency('USD');
                  setParish('Island-wide / Remote');
                  if (!locality) setLocality('Global Remote (Work from Dominica / WIN Certified)');
                }}
                className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isGlobalRemote
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4 text-amber-300" />
                <span>🌍 Global Remote Employer (Worldwide)</span>
              </button>
            </div>

            {/* Global Remote Employer Banner */}
            {isGlobalRemote && (
              <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-teal-900 font-extrabold">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Worldwide Remote Recruitment • Dominica Work In Nature (WIN)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Employers from anywhere in the world (US, UK, Canada, Europe, etc.) can post remote positions open to Dominican talent, diaspora professionals, and remote digital nomads residing in Dominica under the certified 18-month WIN Extended Stay Visa.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Employer Country / Headquarters *
                    </label>
                    <select
                      value={employerCountry}
                      onChange={(e) => setEmployerCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="United States">🇺🇸 United States</option>
                      <option value="United Kingdom">🇬🇧 United Kingdom</option>
                      <option value="Canada">🇨🇦 Canada</option>
                      <option value="European Union">🇪🇺 European Union (Germany, France, etc.)</option>
                      <option value="Caribbean / CARICOM">🏝️ Caribbean / CARICOM</option>
                      <option value="Australia">🇦🇺 Australia</option>
                      <option value="Worldwide">🌐 Global / Worldwide Remote</option>
                      <option value="Other">Custom Country</option>
                    </select>
                    {employerCountry === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter Country / Territory"
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        className="mt-1 w-full px-2.5 py-1 rounded border border-slate-300 text-xs font-medium"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Timezone Flexibility
                    </label>
                    <select
                      value={timezoneRequirement}
                      onChange={(e) => setTimezoneRequirement(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="Any Timezone (Flexible)">Any Timezone (Asynchronous)</option>
                      <option value="US Eastern / AST (Dominica Time)">US Eastern / AST (Dominica Time - GMT-4)</option>
                      <option value="US Pacific / Western">US Pacific (PST / PDT)</option>
                      <option value="Europe / UK (GMT / BST / CET)">Europe / UK (GMT / CET)</option>
                      <option value="Asia / Pacific">Asia / Pacific</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isGlobalRemote ? "e.g. Senior Remote Software Engineer, Cloud Architect" : "e.g. Lead Eco-Resort Chef, Solar Technician"}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Company / Organization *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={isGlobalRemote ? "e.g. Automattic, Stripe, CloudStream Studios" : "e.g. Fort Young Hotel, Dominica Electricity"}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Parish & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  {isGlobalRemote ? 'Territory / Scope *' : 'Parish (Dominica) *'}
                </label>
                <select
                  value={parish}
                  onChange={(e) => setParish(e.target.value as Parish)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Island-wide / Remote">Island-wide / Remote (WIN Extended Visa)</option>
                  <option value="St. George">St. George (Roseau & Capital)</option>
                  <option value="St. John">St. John (Portsmouth & Cabrits)</option>
                  <option value="St. Paul">St. Paul (Canefield & Mahaut)</option>
                  <option value="St. Andrew">St. Andrew (Marigot & Airport)</option>
                  <option value="St. Patrick">St. Patrick (Grand Bay)</option>
                  <option value="St. Joseph">St. Joseph (Salisbury & Mero)</option>
                  <option value="St. David">St. David (Kalinago Territory)</option>
                  <option value="St. Luke">St. Luke (Pointe Michel)</option>
                  <option value="St. Mark">St. Mark (Soufrière & Scotts Head)</option>
                  <option value="St. Peter">St. Peter (Colihaut)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  {isGlobalRemote ? 'Remote Workstation Detail' : 'Locality / Village'}
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder={isGlobalRemote ? "e.g. Global Remote • Work from Dominica or Anywhere" : "e.g. Victoria Street, Roseau"}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Sector, Type, Model */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Sector *
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as JobSector)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Information Technology & Digital">IT & Digital</option>
                  <option value="Eco-Tourism & Hospitality">Eco-Tourism & Hospitality</option>
                  <option value="Renewable Energy & Geothermal">Renewable Energy & Geothermal</option>
                  <option value="Agriculture & Agro-Processing">Agriculture & Agro-Processing</option>
                  <option value="Healthcare & Medical">Healthcare & Medical</option>
                  <option value="Education & Training">Education & Training</option>
                  <option value="Banking & Financial Services">Banking & Financial Services</option>
                  <option value="Logistics & Marine Services">Logistics & Marine</option>
                  <option value="Public Sector & Cooperatives">Public Sector & Cooperatives</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Seasonal">Seasonal</option>
                  <option value="Apprenticeship / NEP">Apprenticeship / NEP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Work Model
                </label>
                <select
                  value={workModel}
                  onChange={(e) => setWorkModel(e.target.value as WorkModel)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Remote">Remote (WIN Eligible)</option>
                  <option value="On-site">On-site in Dominica</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Multi-Currency Compensation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Compensation & Currency</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Payment Currency:</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="XCD">XCD (EC$)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Min Salary ({currency})</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={rawSalaryMin}
                    onChange={(e) => setRawSalaryMin(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Max Salary ({currency})</label>
                  <input
                    type="number"
                    min={rawSalaryMin}
                    step="100"
                    value={rawSalaryMax}
                    onChange={(e) => setRawSalaryMax(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Period</label>
                  <select
                    value={salaryPeriod}
                    onChange={(e) => setSalaryPeriod(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold bg-white"
                  >
                    <option value="month">Per Month</option>
                    <option value="year">Per Year</option>
                    <option value="hour">Per Hour</option>
                  </select>
                </div>
              </div>

              {/* Conversion helper display */}
              <div className="pt-1 text-xs bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-2.5 flex items-center justify-between text-emerald-900 font-semibold">
                <span>Equivalent in Eastern Caribbean Dollars:</span>
                <span className="font-extrabold text-emerald-800 font-mono">
                  EC$ {calculatedMinXCD.toLocaleString()} - {calculatedMaxXCD.toLocaleString()} / {salaryPeriod}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Job Description & Scope *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail role objectives, day-to-day duties, and team environment..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Key Responsibilities (One per line)
              </label>
              <textarea
                rows={2}
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                placeholder="e.g.&#10;Oversee daily operations and kitchen prep&#10;Liaise with local farmers for fresh produce"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Key Qualifications / Requirements (One per line)
              </label>
              <textarea
                rows={2}
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                placeholder="e.g.&#10;Associate Degree from Dominica State College (DSC) or equivalent&#10;3+ years experience in hospitality management"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Benefits & Perks (One per line)
              </label>
              <textarea
                rows={2}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder="e.g.&#10;Staff shuttle service to/from Roseau&#10;On-duty meals prepared by resort culinary team"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Application Receiving Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hr@yourcompany.dm or info@natureislandcareers.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Badges and Featured options */}
            <div className="pt-2 flex flex-col sm:flex-row gap-4 border-t border-slate-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Pin to Top of Dominica Classifieds (Featured Listing)
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNepApproved}
                  onChange={(e) => setIsNepApproved(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  National Employment Programme (NEP) Verified
                </span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Publish Job Listing
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
