import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { Parish, JobSector } from '../types';
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  Sparkles,
  MapPin,
  Briefcase,
  Send,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export const JobAlertAutomationManager: React.FC = () => {
  const {
    alerts,
    subscribeToAlert,
    toggleAlertActive,
    currentUser,
    notifications,
    sendManualTestAlert,
    jobs,
  } = useJobContext();

  const userEmail = currentUser?.email || 'marcus.blanc@waitukubuli.dm';
  const userName = currentUser?.name || 'Marcus Blanc';

  const userAlert = alerts.find(
    (a) => a.email.toLowerCase() === userEmail.toLowerCase()
  ) || alerts[0];

  const [selectedParishes, setSelectedParishes] = useState<Parish[]>(
    userAlert?.parishes || ['St. George', 'St. John']
  );
  const [selectedSectors, setSelectedSectors] = useState<JobSector[]>(
    userAlert?.sectors || [
      'Information Technology & Digital',
      'Eco-Tourism & Hospitality',
    ]
  );
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>(
    userAlert?.frequency || 'instant'
  );
  const [keyword, setKeyword] = useState(userAlert?.keyword || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const parishesList: Parish[] = [
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

  const sectorsList: JobSector[] = [
    'Information Technology & Digital',
    'Eco-Tourism & Hospitality',
    'Renewable Energy & Geothermal',
    'Agriculture & Agro-Processing',
    'Healthcare & Medical',
    'Banking & Financial Services',
    'Education & Training',
    'Public Sector & Cooperatives',
    'Logistics & Marine Services',
  ];

  const toggleParish = (p: Parish) => {
    setSelectedParishes((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const toggleSector = (s: JobSector) => {
    setSelectedSectors((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    subscribeToAlert({
      email: userEmail,
      name: userName,
      parishes: selectedParishes,
      sectors: selectedSectors,
      frequency,
      keyword,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2400);
  };

  const handleTriggerTestAlert = () => {
    sendManualTestAlert(userEmail);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  // Filter alert-specific notifications from history
  const alertNotifications = notifications.filter(
    (n) => n.type === 'job_alert' || n.subject.includes('Alert') || n.subject.includes('Match')
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Automated Classified Dispatcher</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Automated Job Match Alerts
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            Never miss an opening. Whenever a registered Dominica employer posts a job matching your criteria, our automated matching engine dispatches an alert directly to your inbox.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerTestAlert}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-center"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Test Match Email</span>
        </button>
      </div>

      {testSent && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Automated matching email dispatched to {userEmail}! Check your notifications drawer.</span>
        </div>
      )}

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Automated alert preferences updated successfully!</span>
        </div>
      )}

      {/* Preferences Form */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Recipient & Frequency Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Recipient Email:
            </label>
            <div className="flex items-center gap-2 p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono">
              <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="truncate">{userEmail}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dispatch Cadence:
            </label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as 'instant' | 'daily' | 'weekly')
              }
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
            >
              <option value="instant">⚡ Real-Time Instant (As soon as published)</option>
              <option value="daily">📅 Daily Digest (8:00 AM AST)</option>
              <option value="weekly">🗓️ Weekly Summary (Every Monday)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Keyword Filter (Optional):
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Remote, Solar, React, Manager"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Sector Preference Selectors */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Dominica Employment Sectors:
          </label>
          <div className="flex flex-wrap gap-2">
            {sectorsList.map((sec) => {
              const selected = selectedSectors.includes(sec);
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => toggleSector(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selected
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parish Preference Selectors */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Parishes in Dominica:
          </label>
          <div className="flex flex-wrap gap-2">
            {parishesList.map((p) => {
              const selected = selectedParishes.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleParish(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selected
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Automated Alert Settings
          </button>
        </div>
      </form>

      {/* Dispatched History */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-700" />
          <span>Recently Dispatched Match Alerts ({alertNotifications.length})</span>
        </h4>

        {alertNotifications.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No automated alerts dispatched yet.</p>
        ) : (
          <div className="space-y-2">
            {alertNotifications.slice(0, 4).map((notif) => (
              <div
                key={notif.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <strong className="text-slate-900">{notif.subject}</strong>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{notif.previewText}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {notif.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
