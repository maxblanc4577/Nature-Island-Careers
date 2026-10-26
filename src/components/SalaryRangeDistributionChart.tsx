import React, { useState, useMemo } from 'react';
import { useJobContext } from '../context/JobContext';
import { JobListing } from '../types';
import {
  BarChart3,
  TrendingUp,
  Info,
  DollarSign,
  Briefcase,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface SalaryBracket {
  id: string;
  label: string;
  shortLabel: string;
  subLabel: string;
  min: number;
  max: number; // Infinity for open-ended top bracket
  usdRange: string;
  marketRole: string;
  barColor: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
}

export const SALARY_BRACKETS: SalaryBracket[] = [
  {
    id: 'under-3k',
    label: '< EC$ 3,000',
    shortLabel: '< 3K',
    subLabel: 'Entry / Trainee Baseline',
    min: 0,
    max: 2999,
    usdRange: '< $1,111 USD',
    marketRole: 'Apprenticeship / NEP Support, Junior Service, Entry Operations',
    barColor: 'bg-emerald-500',
    bgLight: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-800',
  },
  {
    id: '3k-5k',
    label: 'EC$ 3,000 – EC$ 5,000',
    shortLabel: '3K–5K',
    subLabel: 'Junior to Mid-Level',
    min: 3000,
    max: 5000,
    usdRange: '≈ $1,111 – $1,852 USD',
    marketRole: 'Skilled Trades, Hospitality Supervisory, Technicians, Accounts Clerks',
    barColor: 'bg-teal-500',
    bgLight: 'bg-teal-50/70',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-800',
  },
  {
    id: '5k-7.5k',
    label: 'EC$ 5,000 – EC$ 7,500',
    shortLabel: '5K–7.5K',
    subLabel: 'Specialist & Professional',
    min: 5001,
    max: 7500,
    usdRange: '≈ $1,852 – $2,778 USD',
    marketRole: 'Engineers, Software Developers, Dive Instructors, Health Specialists',
    barColor: 'bg-cyan-600',
    bgLight: 'bg-cyan-50/70',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-800',
  },
  {
    id: '7.5k-10k',
    label: 'EC$ 7,500 – EC$ 10,000',
    shortLabel: '7.5K–10K',
    subLabel: 'Senior Technical / Leads',
    min: 7501,
    max: 10000,
    usdRange: '≈ $2,778 – $3,704 USD',
    marketRole: 'Lead Geothermal Engineers, Operations Managers, Eco-Resort GMs',
    barColor: 'bg-amber-500',
    bgLight: 'bg-amber-50/70',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
  },
  {
    id: 'over-10k',
    label: '> EC$ 10,000',
    shortLabel: '> 10K',
    subLabel: 'Executive & Global Remote',
    min: 10001,
    max: Infinity,
    usdRange: '> $3,704 USD',
    marketRole: 'Executive Directors, Chief Officers, Global WIN Specialists',
    barColor: 'bg-indigo-600',
    bgLight: 'bg-indigo-50/70',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-800',
  },
];

interface SalaryRangeDistributionChartProps {
  jobs?: JobListing[];
  className?: string;
  onSelectJob?: (job: JobListing) => void;
}

export const SalaryRangeDistributionChart: React.FC<SalaryRangeDistributionChartProps> = ({
  jobs: propsJobs,
  className = '',
  onSelectJob,
}) => {
  const { jobs: contextJobs } = useJobContext();
  const jobs = propsJobs || contextJobs;

  const [selectedBracketId, setSelectedBracketId] = useState<string | null>(null);

  // Calculate mid-point salary for each job
  const jobSalaries = useMemo(() => {
    return jobs.map((job) => {
      const mid = (job.minSalary + job.maxSalary) / 2;
      return {
        job,
        midSalary: mid,
      };
    });
  }, [jobs]);

  // Group jobs into salary brackets
  const distributionData = useMemo(() => {
    const totalCount = jobs.length || 1;

    return SALARY_BRACKETS.map((bracket) => {
      const matchingJobs = jobSalaries
        .filter(({ midSalary }) => {
          if (bracket.max === Infinity) {
            return midSalary >= bracket.min;
          }
          return midSalary >= bracket.min && midSalary <= bracket.max;
        })
        .map(({ job }) => job);

      const count = matchingJobs.length;
      const percentage = Math.round((count / totalCount) * 100);

      return {
        ...bracket,
        count,
        percentage,
        jobs: matchingJobs,
      };
    });
  }, [jobs, jobSalaries]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (jobs.length === 0) {
      return {
        min: 0,
        max: 0,
        median: 0,
        average: 0,
        total: 0,
      };
    }

    const mids = jobs.map((j) => (j.minSalary + j.maxSalary) / 2).sort((a, b) => a - b);
    const minSalary = Math.min(...jobs.map((j) => j.minSalary));
    const maxSalary = Math.max(...jobs.map((j) => j.maxSalary));
    const average = Math.round(mids.reduce((a, b) => a + b, 0) / mids.length);
    const medianIndex = Math.floor(mids.length / 2);
    const median =
      mids.length % 2 === 0
        ? Math.round((mids[medianIndex - 1] + mids[medianIndex]) / 2)
        : Math.round(mids[medianIndex]);

    return {
      min: minSalary,
      max: maxSalary,
      median,
      average,
      total: jobs.length,
    };
  }, [jobs]);

  const activeBracket = useMemo(() => {
    if (!selectedBracketId) return null;
    return distributionData.find((b) => b.id === selectedBracketId) || null;
  }, [selectedBracketId, distributionData]);

  // Maximum percentage for scaling visual chart bars
  const maxPercentage = useMemo(() => {
    const maxP = Math.max(...distributionData.map((d) => d.percentage), 10);
    return Math.max(maxP, 25);
  }, [distributionData]);

  return (
    <div
      data-testid="salary-distribution-chart"
      className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 ${className}`}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Market Norms & Compensation Curve</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Dominica EC$ Salary Range Distribution
          </h3>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Visual breakdown of all {jobs.length} published vacancies across 5 statutory and economic salary brackets in Eastern Caribbean Dollars (XCD). Click any bracket to inspect specific job listings.
          </p>
        </div>

        {selectedBracketId && (
          <button
            type="button"
            onClick={() => setSelectedBracketId(null)}
            className="text-xs font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer self-start sm:self-center transition-colors"
          >
            Clear Bracket Filter
          </button>
        )}
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Median Monthly
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
            EC$ {stats.median.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">
            ≈ ${(stats.median / 2.7).toFixed(0)} USD
          </span>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Average Monthly
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
            EC$ {stats.average.toLocaleString()}
          </p>
          <span className="text-[10px] text-teal-700 font-semibold">
            ≈ ${(stats.average / 2.7).toFixed(0)} USD
          </span>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Island Entry Floor
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
            EC$ {stats.min.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold">
            NEP & statutory floor
          </span>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Top Executive Peak
          </span>
          <p className="text-lg sm:text-xl font-black text-indigo-950 font-mono tabular-nums mt-0.5">
            EC$ {stats.max.toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-700 font-semibold">
            ≈ ${(stats.max / 2.7).toFixed(0)} USD
          </span>
        </div>
      </div>

      {/* Visual Distribution Bars */}
      <div className="space-y-3.5 pt-2">
        {distributionData.map((bracket) => {
          const isSelected = selectedBracketId === bracket.id;
          const barWidthPercent = Math.max(
            bracket.count > 0 ? 4 : 0,
            Math.round((bracket.percentage / maxPercentage) * 100)
          );

          return (
            <div
              key={bracket.id}
              data-testid={`salary-bracket-row-${bracket.id}`}
              onClick={() => setSelectedBracketId(isSelected ? null : bracket.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 font-mono">
                    {bracket.label}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    ({bracket.subLabel})
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    · {bracket.usdRange}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    data-testid={`bracket-count-${bracket.id}`}
                    className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md"
                  >
                    {bracket.count} {bracket.count === 1 ? 'vacancy' : 'vacancies'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 font-mono min-w-[40px] text-right">
                    {bracket.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${bracket.barColor}`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              {/* Typical Roles in Bracket */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span className="truncate max-w-[85%] text-slate-600 font-medium">
                  {bracket.marketRole}
                </span>
                <span className="text-emerald-700 font-bold shrink-0 flex items-center gap-0.5">
                  {isSelected ? 'Viewing' : 'Inspect'}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Drilldown for Selected Bracket */}
      {activeBracket && (
        <div
          data-testid={`bracket-drilldown-${activeBracket.id}`}
          className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <h4 className="font-extrabold text-sm text-slate-900">
                Job Postings in {activeBracket.label} ({activeBracket.jobs.length})
              </h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Sorted by midpoint compensation
            </span>
          </div>

          {activeBracket.jobs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No active job listings currently fall within this specific salary bracket.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {activeBracket.jobs.map((job) => (
                <div
                  key={job.id}
                  data-testid={`bracket-job-card-${job.id}`}
                  onClick={() => onSelectJob && onSelectJob(job)}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-emerald-400 transition-colors cursor-pointer flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{job.title}</h5>
                      <p className="text-[11px] text-slate-500 font-medium">{job.company} · {job.parish}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                      EC${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{job.workModel} · {job.employmentType}</span>
                    <span className="text-emerald-700 font-semibold">{job.sector}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Market Norms Guidance Note */}
      <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl p-4 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-950">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold">Dominica Labor Market Context & Peg Guidance:</p>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            Compensation is quoted in Eastern Caribbean Dollars (XCD), pegged by treaty at <strong>2.70 XCD to 1.00 USD</strong>. Roles exceeding <strong>EC$ 8,000/month</strong> fall into the upper-quartile bracket and represent competitive leadership, geothermal engineering, or international Work In Nature (WIN) assignments.
          </p>
        </div>
      </div>
    </div>
  );
};
