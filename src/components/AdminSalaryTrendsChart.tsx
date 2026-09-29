import React, { useState } from 'react';
import { SECTOR_SALARY_TRENDS, TIMEFRAME_OPTIONS, TimeframeOption, getSectorTrendsForTimeframe } from '../data/salaryData';
import { TrendingUp, BarChart2, Calendar, Sparkles } from 'lucide-react';

export const AdminSalaryTrendsChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1y');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  const sectorTrends = getSectorTrendsForTimeframe(timeframe);

  const filteredTrends =
    selectedSector === 'all'
      ? sectorTrends
      : sectorTrends.filter((t) => t.sector === selectedSector);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <span>Dominica Sector Salary Growth Trends (2025–2026)</span>
          </h3>
          <p className="text-xs text-slate-600">
            Tracking monthly wage movement in Eastern Caribbean Dollars (XCD) across key island sectors
          </p>
        </div>

        {/* Timeframe & Sector Filter */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-bold">
            {TIMEFRAME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeframe(opt.id)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeframe === opt.id
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">All Sectors Overview</option>
            {SECTOR_SALARY_TRENDS.map((s) => (
              <option key={s.sector} value={s.sector}>
                {s.sector}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mini Trend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredTrends.slice(0, 4).map((trend) => {
          const latest = trend.data[trend.data.length - 1];
          const initial = trend.data[0];
          const diff = latest.avgSalary - initial.avgSalary;
          const pct = Math.round((diff / initial.avgSalary) * 100);

          return (
            <div
              key={trend.sector}
              onClick={() => setSelectedSector(trend.sector === selectedSector ? 'all' : trend.sector)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedSector === trend.sector
                  ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-600 line-clamp-1 block">
                {trend.sector}
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-black text-slate-900">
                  EC$ {latest.avgSalary.toLocaleString()}
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    pct >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  +{pct}%
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                {latest.vacanciesCount} active vacancies in registry
              </p>
            </div>
          );
        })}
      </div>

      {/* Comparative Visualizer */}
      <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">Historical Monthly Progression (EC$ / Month)</span>
          </div>
          <span className="text-slate-400 text-[11px]">Dominica Labor Observatory</span>
        </div>

        {/* Chart Rows */}
        <div className="space-y-4 pt-2">
          {filteredTrends.map((s) => {
            const latest = s.data[s.data.length - 1];

            return (
              <div key={s.sector} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{s.sector}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    EC$ {latest.avgSalary.toLocaleString()} (Sep 2026)
                  </span>
                </div>

                {/* Quarter/Month Steps Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {s.data.slice(-6).map((item) => (
                    <div
                      key={item.month}
                      className="bg-slate-800 p-2 rounded-lg border border-slate-700/80 text-center"
                    >
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold truncate">
                        {item.monthLabel}
                      </span>
                      <span className="text-xs font-bold text-white">
                        ${item.avgSalary.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
