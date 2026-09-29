import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { SECTOR_COMPENSATION_GUIDE } from '../data/salaryData';
import { AdminSalaryTrendsChart } from './AdminSalaryTrendsChart';
import { AdminParishSalaryDistribution } from './AdminParishSalaryDistribution';
import { Parish } from '../types';
import {
  BarChart3,
  FileDown,
  RefreshCw,
  Database,
  Building,
  Users,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface AdminAnalyticsProps {
  onOpenExportPdf: () => void;
  onSelectParishFilter?: (p: Parish) => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  onOpenExportPdf,
  onSelectParishFilter,
}) => {
  const {
    jobs,
    applications,
    recruiters,
    syncRecords,
    runSyncSimulation,
    isAdminLoggedIn,
  } = useJobContext();

  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'parishes' | 'guide' | 'database'>('trends');
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      runSyncSimulation('Dominica Labour Division');
      setSyncing(false);
    }, 1000);
  };

  const totalMonthlyAvg = Math.round(
    jobs.reduce((acc, curr) => acc + (curr.minSalary + curr.maxSalary) / 2, 0) / (jobs.length || 1)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-800/80 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-600/40">
              Commonwealth of Dominica • Official Labor Observatory
            </span>
            {isAdminLoggedIn && (
              <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Admin Certified
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            Dominica Employment & Salary Analytics
          </h2>
          <p className="text-sm text-emerald-100/90 mt-1 max-w-xl">
            Real-time labor market indicators, parish wage distributions in Eastern Caribbean Dollars (XCD), and economic benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Registry'}</span>
          </button>

          <button
            onClick={onOpenExportPdf}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Market PDF Report</span>
          </button>
        </div>
      </div>

      {/* Island High-Level Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase">
            <span>Island Vacancies</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{jobs.length}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Across 10 Dominica Parishes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase">
            <span>Median Monthly Wage</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            EC$ {totalMonthlyAvg.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-600 font-semibold mt-1">
            ≈ ${(totalMonthlyAvg / 2.7).toFixed(0)} USD (2.70 Peg)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase">
            <span>Candidate Resumes</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{applications.length}</p>
          <p className="text-[11px] text-blue-700 font-semibold mt-1">Registered island applicants</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase">
            <span>Employer Registry</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{recruiters.length}</p>
          <p className="text-[11px] text-purple-700 font-semibold mt-1">100% Dominica Registered</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-sm font-bold">
        <button
          onClick={() => setActiveSubTab('trends')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'trends'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Quarterly Sector Growth
        </button>

        <button
          onClick={() => setActiveSubTab('parishes')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'parishes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          10-Parish Salary Breakdown
        </button>

        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'guide'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Compensation Reference Matrix
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Database Sync & Audit Logs
        </button>
      </div>

      {/* Sub Tab Views */}
      {activeSubTab === 'trends' && <AdminSalaryTrendsChart />}

      {activeSubTab === 'parishes' && (
        <AdminParishSalaryDistribution onSelectParishFilter={onSelectParishFilter} />
      )}

      {activeSubTab === 'guide' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Dominica Statutory & Industry Salary Reference Matrix (2026)
            </h3>
            <p className="text-xs text-slate-600">
              Guideline ranges for career levels across the Commonwealth of Dominica in Eastern Caribbean Dollars (XCD)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Sector</th>
                  <th className="p-3">Entry Level (Monthly)</th>
                  <th className="p-3">Mid-Level (Monthly)</th>
                  <th className="p-3">Senior / Executive (Monthly)</th>
                  <th className="p-3">NEP Support Eligible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SECTOR_COMPENSATION_GUIDE.map((guide) => (
                  <tr key={guide.sector} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{guide.sector}</td>
                    <td className="p-3 font-medium text-slate-700">
                      EC$ {guide.entryLevel.min.toLocaleString()} - {guide.entryLevel.max.toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-emerald-800">
                      EC$ {guide.midLevel.min.toLocaleString()} - {guide.midLevel.max.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-teal-900">
                      EC$ {guide.seniorLevel.min.toLocaleString()} - {guide.seniorLevel.max.toLocaleString()}
                    </td>
                    <td className="p-3">
                      {guide.nepStipendSupport ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          ✓ NEP Approved
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Standard</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Registry Sync & Integrity Logs</h3>
              <p className="text-xs text-slate-600">
                Audit history of classified database syncs and employer verification records
              </p>
            </div>
            <button
              onClick={handleSync}
              className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              Trigger Instant Sync
            </button>
          </div>

          <div className="space-y-3">
            {syncRecords.map((record) => (
              <div
                key={record.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">{record.targetSystem}</span>
                    <span className="text-slate-600 font-medium">
                      Type: <strong>{record.syncType}</strong> • Status: <strong>{record.status}</strong> • Records: {record.recordsCount}
                    </span>
                  </div>
                </div>
                <div className="text-right text-slate-600 font-mono">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
