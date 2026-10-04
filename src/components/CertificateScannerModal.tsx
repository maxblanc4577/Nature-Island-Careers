import React, { useState, useRef } from 'react';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { ResumeCertification } from '../types';
import {
  X,
  Camera,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Loader2,
  FileCheck,
  Award,
  Calendar,
  Building,
  Check,
  RefreshCw,
} from 'lucide-react';

interface CertificateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCertification: (cert: ResumeCertification, relatedSkills?: string[]) => void;
}

export const CertificateScannerModal: React.FC<CertificateScannerModalProps> = ({
  isOpen,
  onClose,
  onAddCertification,
}) => {
  const modalRef = useModalKeyboard({ isOpen, onClose });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);

  // Extracted fields
  const [certName, setCertName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [credentialId, setCredentialId] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        runAiAnalysis(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiAnalysis = (fileName: string) => {
    setIsAnalyzing(true);
    setAnalysisCompleted(false);

    // Simulate smart OCR / Gemini multimodal document analysis
    setTimeout(() => {
      let parsedName = 'Certified Eco-Tourism & Marine Heritage Specialist';
      let parsedIssuer = 'Dominica State College (DSC)';
      let parsedYear = '2025';
      let parsedCredId = `DSC-CERT-${Math.floor(100000 + Math.random() * 900000)}`;
      let skills = ['Eco-Tourism Guiding', 'First Aid & CPR', 'Dominica Flora & Fauna'];

      const lower = fileName.toLowerCase();
      if (lower.includes('solar') || lower.includes('electric') || lower.includes('energy')) {
        parsedName = 'High-Voltage Photovoltaic & Microgrid Technician';
        parsedIssuer = 'DOMLEC / Caribbean Renewable Energy Development';
        parsedCredId = `CREDP-DM-${Math.floor(10000 + Math.random() * 90000)}`;
        skills = ['Solar PV Installation', 'High-Voltage Safety', 'SCADA Monitoring'];
      } else if (lower.includes('tech') || lower.includes('cloud') || lower.includes('code') || lower.includes('comp')) {
        parsedName = 'Full-Stack Web Development & Cloud Systems';
        parsedIssuer = 'UWI Open Campus / Waitukubuli Tech Initiative';
        parsedCredId = `UWI-DM-${Math.floor(10000 + Math.random() * 90000)}`;
        skills = ['React & Node.js', 'PostgreSQL', 'Cloud Infrastructure'];
      }

      setCertName(parsedName);
      setIssuer(parsedIssuer);
      setYear(parsedYear);
      setCredentialId(parsedCredId);
      setSuggestedSkills(skills);
      setIsAnalyzing(false);
      setAnalysisCompleted(true);
    }, 1400);
  };

  const handleApply = () => {
    if (!certName.trim() || !issuer.trim()) return;

    const newCert: ResumeCertification = {
      id: `cert-${Date.now()}`,
      name: certName.trim(),
      issuer: issuer.trim(),
      year: year.trim() || '2025',
    };

    onAddCertification(newCert, suggestedSkills);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI Document & Certificate Scanner"
        tabIndex={-1}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40 text-amber-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white font-display">
                  AI Certificate & Document Scanner
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Gemini OCR
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Snap or upload a photo of your paper certificate to auto-populate your CV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs text-stone-800">
          {/* Upload or Camera input */}
          {!imagePreview ? (
            <div className="border-2 border-dashed border-stone-300 hover:border-emerald-700 rounded-2xl p-8 text-center bg-stone-50 hover:bg-emerald-50/20 transition-all space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  Take a Photo or Select Certificate Image
                </p>
                <p className="text-stone-500 mt-1">
                  Dominica State College degrees, CXC / CAPE diplomas, City & Guilds badges, or technical workshop certificates.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelected}
                className="hidden"
                id="camera-cert-upload"
              />

              <div className="flex items-center justify-center gap-3 pt-2">
                <label
                  htmlFor="camera-cert-upload"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Camera / Browse</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview with scanning line */}
              <div className="relative rounded-xl overflow-hidden border border-stone-300 max-h-48 bg-black flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Scanned Certificate"
                  className="max-h-48 w-auto object-contain opacity-90"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center backdrop-blur-xs">
                    <div className="text-center text-white space-y-2">
                      <Loader2 className="w-7 h-7 animate-spin text-amber-300 mx-auto" />
                      <p className="text-xs font-bold">Extracting Certificate Details via OCR...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Parsed Output Form */}
              {analysisCompleted && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Certificate Details Extracted Successfully</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      Rescan Another
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                        Certificate / Degree Title *
                      </label>
                      <input
                        type="text"
                        value={certName}
                        onChange={(e) => setCertName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                          Issuing Authority / Institution *
                        </label>
                        <input
                          type="text"
                          value={issuer}
                          onChange={(e) => setIssuer(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                          Year Awarded
                        </label>
                        <input
                          type="text"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    {suggestedSkills.length > 0 && (
                      <div className="pt-1">
                        <span className="block text-[11px] font-bold text-stone-600 mb-1">
                          Detected Associated Skills:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded text-[11px] font-medium"
                            >
                              + {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            Cancel
          </button>

          {analysisCompleted && (
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Add to Resume Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
