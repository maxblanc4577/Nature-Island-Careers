import React, { useState } from 'react';
import { PARISH_SALARY_BENCHMARKS } from '../data/salaryData';
import { ParishSalaryBenchmark, Parish } from '../types';
import { MapPin, TrendingUp, DollarSign, Building, Award, CheckCircle2 } from 'lucide-react';

interface AdminParishSalaryDistributionProps {
  onSelectParishFilter?: (parish: Parish) => void;
}

export const AdminParishSalaryDistribution: React.FC<AdminParishSalaryDistributionProps> = ({
  onSelectParishFilter,
}) => {
  const [selectedParish, setSelectedParish] = useState<ParishSalaryBenchmark>(
    PARISH_SALARY_BENCHMARKS[0]
  );

  const maxMedian = Math.max(...PARISH_SALARY_BENCHMARKS.map((p) => p.medianSalary));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Parish Salary Distribution & Economic Benchmarks</span>
          </h3>
          <p className="text-xs text-slate-600">
            Median monthly compensation across Dominica's 10 parishes in Eastern Caribbean Dollars (XCD)
          </p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full self-start sm:self-center">
          10 Parishes Indexed
        </span>
      </div>

      {/* Main Bar Chart Comparison */}
      <div className="space-y-3 pt-2">
        {PARISH_SALARY_BENCHMARKS.map((item) => {
          const percentage = Math.round((item.medianSalary / maxMedian) * 100);
          const isSelected = selectedParish.parish === item.parish;

          return (
            <div
              key={item.parish}
              onClick={() => setSelectedParish(item)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-900">{item.parish}</span>
                  <span className="text-slate-600 font-normal">({item.topSector})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-600 font-normal">
                    ≈ ${(item.medianSalary / 2.7).toFixed(0)} USD
                  </span>
                  <span className="text-emerald-700 font-black">
                    EC$ {item.medianSalary.toLocaleString()} / mo
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      : 'bg-emerald-600/70'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Parish Detail Card */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Parish Economic Spotlight
            </span>
            <h4 className="text-xl font-black text-white">{selectedParish.parish}</h4>
            <p className="text-xs text-emerald-200">Leading Sector: {selectedParish.topSector}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-300 font-semibold">Median Monthly Pay</span>
            <p className="text-2xl font-black text-amber-300">
              EC$ {selectedParish.medianSalary.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <span className="text-emerald-300 font-bold block mb-1">Salary Range (25th - 75th %):</span>
            <p className="text-slate-200 font-medium">
              EC$ {selectedParish.q1Salary.toLocaleString()} – EC$ {selectedParish.q3Salary.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Absolute: ${selectedParish.minSalary.toLocaleString()} - ${selectedParish.maxSalary.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <span className="text-emerald-300 font-bold block mb-1">Sample Size & Data:</span>
            <p className="text-slate-200 font-medium">
              {selectedParish.sampleCount} Verified Employer Reports
            </p>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <span className="text-emerald-300 font-bold block mb-1">Economic Baseline:</span>
            <p className="text-slate-200 font-medium">
              Cost of Living Index: <strong>{selectedParish.costOfLivingIndex}</strong> (Baseline 100)
            </p>
          </div>
        </div>

        {onSelectParishFilter && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onSelectParishFilter(selectedParish.parish)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Filter Board to {selectedParish.parish} Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
