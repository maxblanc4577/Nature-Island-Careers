import React from 'react';
import { Parish } from '../types';
import { ShieldCheck, Mail, MapPin, Compass, BookOpen, BarChart3 } from 'lucide-react';

interface FooterProps {
  onSelectParish: (p: Parish) => void;
  onOpenAlert: () => void;
  onOpenFeedback: () => void;
  onOpenAdminPortal?: () => void;
  onOpenCareerGuide?: () => void;
  onOpenSalaryTrends?: () => void;
  onOpenEmployerPortal?: () => void;
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
];

export const Footer: React.FC<FooterProps> = ({
  onSelectParish,
  onOpenAlert,
  onOpenFeedback,
  onOpenAdminPortal,
  onOpenCareerGuide,
  onOpenSalaryTrends,
  onOpenEmployerPortal,
}) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          
          {/* Col 1: Wordmark & About */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <span className="text-xl font-bold tracking-tight text-white font-display block">
              Nature Island Careers
            </span>
            <p className="text-stone-400 text-xs leading-relaxed">
              Dominica’s premier job classified board and career portal. Dedicated to sustainable employment, geothermal energy, eco-tourism, and community development across the Commonwealth of Dominica.
            </p>
            <div className="pt-1">
              <a
                href="mailto:info@natureislandcareers.com"
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>info@natureislandcareers.com</span>
              </a>
            </div>
            <div className="pt-2 text-[11px] text-stone-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compliant with Dominica Labour Standards</span>
            </div>
          </div>

          {/* Col 2: Parishes & Programmes */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                Vacancies by Parish
              </h3>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-stone-400">
                {PARISHES.map((p) => (
                  <button
                    key={p}
                    onClick={() => onSelectParish(p)}
                    className="text-left hover:text-white transition-colors cursor-pointer truncate"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-stone-800/80">
              <span className="text-[11px] font-semibold text-stone-300 block mb-1">Dominican Programmes</span>
              <p className="text-[11px] text-stone-500 leading-tight">NEP Apprenticeships · DSS Registration · CARICOM CSME</p>
            </div>
          </div>

          {/* Col 3: Alerts & Notifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Stay Informed & Alerts
            </h3>
            <p className="text-stone-400 leading-relaxed text-xs">
              Configure real-time automated email alerts for new positions in your parish and industry.
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={onOpenAlert}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                <span>Configure Email Alerts</span>
              </button>

              <button
                onClick={onOpenFeedback}
                className="w-full text-center py-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                Submit Platform Feedback
              </button>
            </div>
          </div>

          {/* Col 4: Parish Salary Trends (Placed directly next to Stay Informed & Alerts) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Parish Salary Trends</span>
            </h3>
            <p className="text-stone-400 leading-relaxed text-xs">
              Statutory wage baselines, cost-of-living indices, and compensation percentiles across all 10 parishes.
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onOpenSalaryTrends}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white rounded-lg font-medium cursor-pointer transition-all border border-amber-600/60 shadow-xs text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                <span>View Salary Trends</span>
              </button>

              <div className="pt-1 flex flex-col space-y-1.5 text-[11px] text-stone-400">
                <button
                  type="button"
                  onClick={onOpenSalaryTrends}
                  className="text-left hover:text-amber-300 transition-colors cursor-pointer truncate"
                >
                  • St. George (Roseau): EC$3,850
                </button>
                <button
                  type="button"
                  onClick={onOpenSalaryTrends}
                  className="text-left hover:text-amber-300 transition-colors cursor-pointer truncate"
                >
                  • St. John (Portsmouth): EC$3,400
                </button>
                <button
                  type="button"
                  onClick={onOpenSalaryTrends}
                  className="text-left hover:text-amber-300 transition-colors cursor-pointer truncate"
                >
                  • Geothermal & Renewable Energy
                </button>
              </div>
            </div>
          </div>

          {/* Col 5: Career Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Career Guide</span>
            </h3>
            <p className="text-stone-400 leading-relaxed text-xs">
              Vocational roadmaps, NEP apprentice pathways, CSME certification, and interview tips.
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onOpenCareerGuide}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 text-white rounded-lg font-medium cursor-pointer transition-all border border-indigo-700/60 shadow-xs text-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                <span>Launch Career Guide</span>
              </button>

              <div className="pt-1 flex flex-col space-y-1.5 text-[11px] text-stone-400">
                <button
                  type="button"
                  onClick={onOpenCareerGuide}
                  className="text-left hover:text-indigo-300 transition-colors cursor-pointer truncate"
                >
                  • Eco-Tourism & Hospitality Tracks
                </button>
                <button
                  type="button"
                  onClick={onOpenCareerGuide}
                  className="text-left hover:text-indigo-300 transition-colors cursor-pointer truncate"
                >
                  • CSME Free Movement Guidelines
                </button>
                <button
                  type="button"
                  onClick={onOpenCareerGuide}
                  className="text-left hover:text-indigo-300 transition-colors cursor-pointer truncate"
                >
                  • Dominica Resume & Interview Prep
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright & regional notice */}
        <div className="mt-8 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-3">
          <div>
            © {new Date().getFullYear()} Nature Island Careers · Commonwealth of Dominica. All rights reserved.
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span>Commonwealth of Dominica (Waitukubuli)</span>
            <span>·</span>
            <span>DSS & NEP Accredited</span>
            {onOpenAdminPortal && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={onOpenAdminPortal}
                  className="text-stone-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                  title="Admin Master Console & Site Settings"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Admin Console</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
