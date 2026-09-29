import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { InterviewDetails } from '../types';
import { X, Calendar, Clock, Video, MapPin, CheckCircle2, Send } from 'lucide-react';

interface InterviewSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
}

export const InterviewSchedulerModal: React.FC<InterviewSchedulerModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
}) => {
  const { scheduleInterview } = useJobContext();

  const [date, setDate] = useState('2026-10-05');
  const [time, setTime] = useState('10:00 AM AST');
  const [mode, setMode] = useState<'In-person' | 'Virtual Video Call'>('Virtual Video Call');
  const [location, setLocation] = useState('Google Meet link will be shared 15 mins prior');
  const [instructions, setInstructions] = useState('Please have your portfolio and relevant certifications ready.');
  const [scheduled, setScheduled] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const details: InterviewDetails = {
      date,
      time,
      location,
      mode,
      instructions,
    };

    scheduleInterview(applicationId, details);

    setScheduled(true);
    setTimeout(() => {
      setScheduled(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-900/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Schedule Interview</h3>
              <p className="text-xs text-emerald-200">{candidateName} • {jobTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {scheduled ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Interview Dispatched!</h4>
            <p className="text-sm text-slate-600">
              The candidate has been notified with the date, format, and preparation guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Interview Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Time *
                </label>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 10:00 AM AST"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Interview Format *
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white"
              >
                <option value="Virtual Video Call">Virtual Video Call (Google Meet / Zoom)</option>
                <option value="In-person">In-Person at Dominica Office / Resort</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Location or Meeting Link
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Roseau address or Virtual URL"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Instructions for Candidate
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Specific documents or portfolio items to bring..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Confirm & Invite Candidate</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
