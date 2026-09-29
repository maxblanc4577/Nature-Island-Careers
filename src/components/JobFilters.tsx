import React from 'react';
import { Parish, JobSector, EmploymentType, WorkModel } from '../types';
import { RotateCcw, Check, Sparkles } from 'lucide-react';

interface JobFiltersProps {
  selectedParish: Parish | 'All';
  setSelectedParish: (p: Parish | 'All') => void;
  selectedSector: JobSector | 'All';
  setSelectedSector: (s: JobSector | 'All') => void;
  selectedType: EmploymentType | 'All';
  setSelectedType: (t: EmploymentType | 'All') => void;
  selectedWorkModel: WorkModel | 'All';
  setSelectedWorkModel: (w: WorkModel | 'All') => void;
  nepOnly: boolean;
  setNepOnly: (n: boolean) => void;
  minSalaryXCD: number;
  setMinSalaryXCD: (val: number) => void;
  onReset: () => void;
  filteredCount: number;
}

const PARISHES: (Parish | 'All')[] = [
  'All',
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

const SECTORS: (JobSector | 'All')[] = [
  'All',
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

const TYPES: (EmploymentType | 'All')[] = [
  'All',
  'Full-Time',
  'Part-Time',
  'Contract',
  'Seasonal',
  'Apprenticeship / NEP',
];

const WORK_MODELS: (WorkModel | 'All')[] = ['All', 'On-site', 'Hybrid', 'Remote'];

export const JobFilters: React.FC<JobFiltersProps> = ({
  selectedParish,
  setSelectedParish,
  selectedSector,
  setSelectedSector,
  selectedType,
  setSelectedType,
  selectedWorkModel,
  setSelectedWorkModel,
  nepOnly,
  setNepOnly,
  minSalaryXCD,
  setMinSalaryXCD,
  onReset,
  filteredCount,
}) => {
  return (
    <aside className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-6">
      
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div>
          <h2 className="text-sm font-bold text-stone-900 font-display">Filter Vacancies</h2>
          <p className="text-[11px] text-stone-500 tabular-nums">
            Showing {filteredCount} matching {filteredCount === 1 ? 'role' : 'roles'}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-900 transition-colors cursor-pointer"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* NEP Programme Toggle */}
      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={nepOnly}
            onChange={(e) => setNepOnly(e.target.checked)}
            className="mt-0.5 rounded border-amber-300 text-emerald-800 focus:ring-emerald-700"
          />
          <div>
            <span className="text-xs font-semibold text-stone-900 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              NEP Approved Roles
            </span>
            <p className="text-[11px] text-stone-500 leading-normal mt-0.5">
              Positions registered with the National Employment Programme for Dominican graduates & apprentices.
            </p>
          </div>
        </label>
      </div>

      {/* Parish Selector */}
      <div>
        <label className="block text-xs font-semibold text-stone-900 mb-2">
          Parish of Dominica
        </label>
        <select
          value={selectedParish}
          onChange={(e) => setSelectedParish(e.target.value as Parish | 'All')}
          className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
        >
          {PARISHES.map((p) => (
            <option key={p} value={p}>
              {p === 'All' ? 'All 10 Parishes + Remote' : p}
            </option>
          ))}
        </select>
      </div>

      {/* Industry Sector */}
      <div>
        <label className="block text-xs font-semibold text-stone-900 mb-2">
          Industry Sector
        </label>
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value as JobSector | 'All')}
          className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
        >
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Employment Type */}
      <div>
        <label className="block text-xs font-semibold text-stone-900 mb-2">
          Employment Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                selectedType === type
                  ? 'bg-emerald-800 text-white font-medium'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Work Model (On-site, Hybrid, Remote) */}
      <div>
        <label className="block text-xs font-semibold text-stone-900 mb-2">
          Work Arrangement
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {WORK_MODELS.map((model) => (
            <button
              key={model}
              onClick={() => setSelectedWorkModel(model)}
              className={`px-2 py-1.5 text-xs rounded-lg transition-colors text-center cursor-pointer ${
                selectedWorkModel === model
                  ? 'bg-emerald-800 text-white font-medium'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Salary Slider in XCD */}
      <div className="pt-2 border-t border-stone-100">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-stone-900">Minimum Salary</span>
          <span className="font-mono tabular-nums text-emerald-800 font-semibold">
            {minSalaryXCD === 0 ? 'Any' : `EC$${minSalaryXCD.toLocaleString()}/mo`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={8000}
          step={500}
          value={minSalaryXCD}
          onChange={(e) => setMinSalaryXCD(Number(e.target.value))}
          className="w-full accent-emerald-800 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
          <span>EC$0</span>
          <span>EC$4,000</span>
          <span>EC$8,000+</span>
        </div>
      </div>

    </aside>
  );
};
