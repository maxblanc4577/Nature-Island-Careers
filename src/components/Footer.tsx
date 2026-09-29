import React from 'react';
import { Parish } from '../types';
import { ShieldCheck, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onSelectParish: (p: Parish) => void;
  onOpenAlert: () => void;
  onOpenFeedback: () => void;
  onOpenAdminPortal?: () => void;
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
}) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Wordmark & About */}
          <div className="space-y-3 md:col-span-1">
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

          {/* Col 2: Parishes Directory */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
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

          {/* Col 3: Programmes & Recruiter Hub */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Dominican Programmes
            </h3>
            <ul className="space-y-1.5 text-stone-400">
              <li>
                <span className="text-stone-300 font-medium">National Employment Programme (NEP)</span>
                <p className="text-[11px] text-stone-500">Government apprentice wage subsidies</p>
              </li>
              <li>
                <span className="text-stone-300 font-medium">Dominica Social Security (DSS)</span>
                <p className="text-[11px] text-stone-500">Pension and employee registration</p>
              </li>
              <li>
                <span className="text-stone-300 font-medium">CARICOM CSME Skills Verification</span>
                <p className="text-[11px] text-stone-500">Regional free movement accreditation</p>
              </li>
            </ul>
          </div>

          {/* Col 4: Alerts & Administrative Hub */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Stay Informed & Admin
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
              
              {onOpenAdminPortal && (
                <button
                  onClick={onOpenAdminPortal}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>Admin Portal (Master Control)</span>
                </button>
              )}

              <button
                onClick={onOpenFeedback}
                className="w-full text-center py-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                Submit Platform Feedback
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright & regional notice */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-3">
          <div>
            © {new Date().getFullYear()} Nature Island Careers · Commonwealth of Dominica. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Currency: Eastern Caribbean Dollar (XCD)</span>
            <span>·</span>
            <span>Roseau & Portsmouth Labour Exchanges</span>
            {onOpenAdminPortal && (
              <>
                <span>·</span>
                <button
                  onClick={onOpenAdminPortal}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  Admin Console
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
