import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { JobSector } from '../types';
import {
  X,
  Laptop,
  CheckCircle2,
  Lock,
  Sparkles,
  Wifi,
  Calendar,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

interface RemoteAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscription: () => void;
}

const SECTORS: JobSector[] = [
  'Information Technology & Digital',
  'Eco-Tourism & Hospitality',
  'Renewable Energy & Geothermal',
  'Banking & Financial Services',
  'Healthcare & Medical',
  'Agriculture & Agro-Processing',
  'Education & Training',
  'Logistics & Marine Services',
  'Public Sector & Cooperatives',
];

export const RemoteAssignmentModal: React.FC<RemoteAssignmentModalProps> = ({
  isOpen,
  onClose,
  onOpenSubscription,
}) => {
  const { currentUser, createRemoteAssignment, currentRecruiter } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const isSubscribed = currentUser?.subscription?.status === 'active';

  const [title, setTitle] = useState('');
  const [sector, setSector] = useState<JobSector>('Information Technology & Digital');
  const [projectDuration, setProjectDuration] = useState('2-Month Milestone Contract');
  const [minSalary, setMinSalary] = useState(4800);
  const [maxSalary, setMaxSalary] = useState(6500);
  const [skillsText, setSkillsText] = useState('React, TypeScript, Tailwind CSS, API Integration');
  const [description, setDescription] = useState(
    'Work remotely from any of Dominica’s 10 parishes on high-impact digital initiatives with flexible asynchronous deliverables.'
  );
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    'Build and maintain responsive client-facing web workflows\nAttend weekly virtual standups via Google Meet\nDeliver documented code milestone sprints'
  );
  const [requirementsText, setRequirementsText] = useState(
    'High-speed broadband access in Dominica (Flow / Digicel / Starlink)\nProven portfolio of completed remote assignments\nStrong self-direction and transparent reporting'
  );
  const [applicationDeadline, setApplicationDeadline] = useState('2026-11-30');
  const [hasInternetStipend, setHasInternetStipend] = useState(true);

  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const responsibilities = responsibilitiesText.split('\n').map((s) => s.trim()).filter(Boolean);
    const requirements = requirementsText.split('\n').map((s) => s.trim()).filter(Boolean);
    const requiredSkills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    const benefits = [
      hasInternetStipend ? 'EC$350 monthly high-speed internet stipend' : 'Standard project fee',
      'Flexible asynchronous working hours',
      'Dominica Social Security compliance and certificate of completion',
    ];

    const ok = createRemoteAssignment({
      title,
      sector,
      projectDuration,
      minSalary: Number(minSalary),
      maxSalary: Number(maxSalary),
      requiredSkills,
      description,
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Execute remote milestone deliverables'],
      requirements: requirements.length > 0 ? requirements : ['Workstation and broadband connection'],
      benefits,
      applicationDeadline,
    });

    if (ok) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Place Remote Work Assignment"
        tabIndex={-1}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-display">
                Place Remote Work Assignment
              </h2>
              <p className="text-xs text-stone-500">
                Engage remote Dominican talent across all 10 parishes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] text-xs space-y-4">
          
          {/* Subscription Check Gate */}
          {!isSubscribed ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 font-display">
                  Active Client Subscription Required
                </h3>
                <p className="text-stone-600 max-w-sm mx-auto text-xs mt-1">
                  To place remote work assignments and source talent across Dominica's parishes, your organization must maintain an active client subscription.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSubscription();
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Activate Client Subscription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-display">
                Remote Work Assignment Published!
              </h3>
              <p className="text-stone-600 max-w-sm mx-auto">
                Your remote assignment is now live across Dominica. Matching remote talent will receive automated email alerts.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-950 flex items-center justify-between">
                <span>Employer: <strong>{currentUser?.companyName || currentRecruiter.companyName}</strong></span>
                <span className="font-semibold text-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Subscription Active
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Assignment / Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Remote Web & Mobile Frontend Engineer (React/TypeScript)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Industry Sector *
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value as JobSector)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Contract / Project Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectDuration}
                    onChange={(e) => setProjectDuration(e.target.value)}
                    placeholder="e.g. 1 Month Milestone / Ongoing Remote"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Compensation in XCD */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Min Compensation (EC$ XCD/mo) *
                  </label>
                  <input
                    type="number"
                    required
                    value={minSalary}
                    onChange={(e) => setMinSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Max Compensation (EC$ XCD/mo) *
                  </label>
                  <input
                    type="number"
                    required
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Required Remote Skills (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="e.g. React, Node.js, GIS Mapping, Financial Auditing, Patois/French"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInternetStipend}
                    onChange={(e) => setHasInternetStipend(e.target.checked)}
                    className="rounded border-emerald-300 text-emerald-800 focus:ring-emerald-700"
                  />
                  <div>
                    <span className="font-semibold text-stone-900 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-emerald-700" />
                      Include Island-Wide Broadband Reimbursement (EC$350/mo)
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      Subsidizes Flow/Digicel fiber or Starlink connections for remote staff.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Project Deliverables & Mission *
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Milestones (One per line)
                  </label>
                  <textarea
                    rows={2}
                    value={responsibilitiesText}
                    onChange={(e) => setResponsibilitiesText(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-900 mb-1">
                    Requirements (One per line)
                  </label>
                  <textarea
                    rows={2}
                    value={requirementsText}
                    onChange={(e) => setRequirementsText(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-900 mb-1">
                  Proposal Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Post Remote Assignment
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
