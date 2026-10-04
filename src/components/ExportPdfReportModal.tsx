import React, { useState } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { generateSalaryPdfReport } from '../utils/generateSalaryPdfReport';
import { X, FileDown, CheckCircle2, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface ExportPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPdfReportModal: React.FC<ExportPdfReportModalProps> = ({ isOpen, onClose }) => {
  const { jobs, applications } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const [adminName, setAdminName] = useState('Dominica Labor & Employment Observatory');
  const [includeTrendsChart, setIncludeTrendsChart] = useState(true);
  const [includeDistributionChart, setIncludeDistributionChart] = useState(true);
  const [includeDetailedTables, setIncludeDetailedTables] = useState(true);
  const [notes, setNotes] = useState('Official statistical report generated from verified Dominica classified listings and compensation benchmarks.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      await generateSalaryPdfReport({
        adminName,
        jobs,
        applications,
        includeTrendsChart,
        includeDistributionChart,
        includeDetailedTables,
        notes,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsGenerating(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Export Dominica Market Report"
        tabIndex={-1}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-900/20 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <FileDown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Export Dominica Market Report</h3>
              <p className="text-xs text-emerald-200">Official Labor & Salary Benchmark PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">PDF Ready & Downloaded!</h4>
            <p className="text-sm text-slate-600">The formatted labor report is now saved to your downloads.</p>
          </div>
        ) : (
          <form onSubmit={handleExport} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Compiler / Authority Name
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-2 pt-1">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Include Report Sections:
              </span>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTrendsChart}
                  onChange={(e) => setIncludeTrendsChart(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Sector Salary Growth (Quarterly Trends)</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDistributionChart}
                  onChange={(e) => setIncludeDistributionChart(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Parish-by-Parish Wage Benchmark Chart</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDetailedTables}
                  onChange={(e) => setIncludeDetailedTables(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Classifieds Inventory & Sector Matrix</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Executive Notes & Observations
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling PDF Document...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download Dominica PDF Report</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
