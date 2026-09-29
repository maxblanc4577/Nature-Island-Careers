import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { Parish, JobSector } from '../types';
import { X, BellRing, Mail, MapPin, CheckCircle2, ShieldCheck, Sparkles, User } from 'lucide-react';

interface SubscribeAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscribeAlertModal: React.FC<SubscribeAlertModalProps> = ({ isOpen, onClose }) => {
  const { subscribeToAlert } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedParish, setSelectedParish] = useState<Parish | 'All'>('All');
  const [selectedSector, setSelectedSector] = useState<JobSector | 'All'>('All');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('daily');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('Please provide a valid email address.');
      return;
    }

    const parishes: Parish[] =
      selectedParish === 'All'
        ? [
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
          ]
        : [selectedParish];

    const sectors: JobSector[] =
      selectedSector === 'All'
        ? [
            'Eco-Tourism & Hospitality',
            'Renewable Energy & Geothermal',
            'Agriculture & Agro-Processing',
            'Healthcare & Medical',
            'Banking & Financial Services',
            'Information Technology & Digital',
            'Education & Training',
            'Logistics & Marine Services',
            'Public Sector & Cooperatives',
          ]
        : [selectedSector];

    subscribeToAlert({
      email,
      name: name.trim() || 'Dominica Resident',
      parishes,
      sectors,
      frequency,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nature Island Careers Alerts"
        tabIndex={-1}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-900/20 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <BellRing className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nature Island Careers Alerts</h3>
              <p className="text-xs text-emerald-200">Delivered from info@natureislandcareers.com</p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Alerts Configured!</h4>
            <p className="text-sm text-slate-600">
              We'll deliver freshly posted vacancies matching your criteria straight to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youremail@email.dm"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Target Parish
              </label>
              <select
                value={selectedParish}
                onChange={(e) => setSelectedParish(e.target.value as Parish | 'All')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="All">All 10 Parishes</option>
                <option value="St. George">St. George (Roseau)</option>
                <option value="St. John">St. John (Portsmouth)</option>
                <option value="St. Paul">St. Paul (Canefield & Mahaut)</option>
                <option value="St. Andrew">St. Andrew (Marigot & Airport)</option>
                <option value="St. Patrick">St. Patrick (Grand Bay)</option>
                <option value="St. Joseph">St. Joseph (Salisbury & Mero)</option>
                <option value="St. David">St. David (Kalinago Territory)</option>
                <option value="St. Luke">St. Luke (Pointe Michel)</option>
                <option value="St. Mark">St. Mark (Soufrière & Scotts Head)</option>
                <option value="St. Peter">St. Peter (Colihaut)</option>
                <option value="Island-wide / Remote">Island-wide / Remote (WIN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Sector Preference
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value as JobSector | 'All')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="All">All Job Sectors</option>
                <option value="Eco-Tourism & Hospitality">Eco-Tourism & Hospitality</option>
                <option value="Renewable Energy & Geothermal">Renewable Energy & Geothermal</option>
                <option value="Agriculture & Agro-Processing">Agriculture & Agro-Processing</option>
                <option value="Information Technology & Digital">IT & Digital</option>
                <option value="Healthcare & Medical">Healthcare & Medical</option>
                <option value="Education & Training">Education & Training</option>
                <option value="Banking & Financial Services">Banking & Financial Services</option>
                <option value="Logistics & Marine Services">Logistics & Marine</option>
                <option value="Public Sector & Cooperatives">Public Sector & Cooperatives</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Alert Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['instant', 'daily', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-1.5 text-xs font-bold capitalize rounded-lg border transition-all cursor-pointer ${
                      frequency === freq
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              Subscribe to Dominica Alerts
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
