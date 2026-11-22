import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { JobListing, Parish } from '../types';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { isValidEmail, isValidPhone } from '../utils/paymentValidation';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  Shield,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Check,
  Sparkles,
  Save,
  AlertCircle,
} from 'lucide-react';

interface ApplyModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appId: string) => void;
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
  'Island-wide / Remote',
];

export const ApplyModal: React.FC<ApplyModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { submitApplication } = useJobContext();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [completedAppId, setCompletedAppId] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Form State
  const [applicantName, setApplicantName] = useState('Max Blanc');
  const [applicantEmail, setApplicantEmail] = useState('maxblanc10468@gmail.com');
  const [applicantPhone, setApplicantPhone] = useState('+1 (767) 275-9921');
  const [parish, setParish] = useState<Parish>('St. George');
  const [citizenStatus, setCitizenStatus] = useState<
    'Dominican Citizen' | 'CARICOM CSME' | 'Work Permit Holder' | 'NEP Trainee'
  >('Dominican Citizen');

  const [resumeFileName, setResumeFileName] = useState('Max_Blanc_Professional_CV.pdf');
  const [resumeFileSize, setResumeFileSize] = useState('285 KB');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverNote, setCoverNote] = useState(
    'I am enthusiastic about bringing my dedication, leadership, and technical qualifications to this opening in Dominica.'
  );

  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({
    q1: 'Yes, fully certified and qualified in Dominica.',
    q2: 'Over 4 years of proven direct operational experience.',
  });

  const [consentChecked, setConsentChecked] = useState(true);

  // Restore draft from localStorage when opening modal
  useEffect(() => {
    if (!job || !isOpen) return;
    try {
      const draftKey = `natureisland_apply_draft_${job.id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.applicantName) setApplicantName(parsed.applicantName);
        if (parsed.applicantEmail) setApplicantEmail(parsed.applicantEmail);
        if (parsed.applicantPhone) setApplicantPhone(parsed.applicantPhone);
        if (parsed.parish) setParish(parsed.parish);
        if (parsed.citizenStatus) setCitizenStatus(parsed.citizenStatus);
        if (parsed.portfolioUrl) setPortfolioUrl(parsed.portfolioUrl);
        if (parsed.coverNote) setCoverNote(parsed.coverNote);
        if (parsed.screeningAnswers) setScreeningAnswers(parsed.screeningAnswers);
        if (parsed.step) setStep(parsed.step);
      }
    } catch {
      // ignore
    }
  }, [job?.id, isOpen]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Reset transient state when opening or changing job
  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
  }, [isOpen, job?.id]);

  // Save Draft to localStorage
  const handleSaveDraft = () => {
    if (!job) return;
    try {
      const draftKey = `natureisland_apply_draft_${job.id}`;
      const draftData = {
        applicantName,
        applicantEmail,
        applicantPhone,
        parish,
        citizenStatus,
        portfolioUrl,
        coverNote,
        screeningAnswers,
        step,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setDraftNotice(true);
      const t = window.setTimeout(() => setDraftNotice(false), 2400);
      timersRef.current.push(t);
    } catch (e) {
      console.warn('Could not save draft', e);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setCompletedAppId(null);
    setValidationError(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    onClose();
  };

  const modalRef = useModalKeyboard({ isOpen: isOpen && Boolean(job), onClose: resetAndClose });

  if (!isOpen || !job) return null;

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedExt = /\.(pdf|doc|docx)$/i;
      if (!allowedExt.test(file.name)) {
        setValidationError('Invalid file format. Please upload a PDF, DOC, or DOCX resume.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('Resume file exceeds the 5 MB limit. Please select a smaller document.');
        return;
      }
      setResumeFileName(file.name);
      setResumeFileSize(`${Math.max(1, Math.round(file.size / 1024))} KB`);
    }
  };

  const validateStep1 = (): boolean => {
    if (!applicantName.trim() || applicantName.trim().length < 2) {
      setValidationError('Please enter your full legal name (at least 2 characters).');
      return false;
    }
    if (!isValidEmail(applicantEmail)) {
      setValidationError('Please enter a valid email address for application updates.');
      return false;
    }
    if (!isValidPhone(applicantPhone)) {
      setValidationError('Please enter a valid contact phone number (at least 7 digits).');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!resumeFileName.trim()) {
      setValidationError('Please upload or keep a valid PDF/DOCX resume before continuing.');
      return false;
    }
    if (portfolioUrl.trim()) {
      try {
        const parsed = new URL(portfolioUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setValidationError('Portfolio URL must begin with https:// or http://.');
          return false;
        }
      } catch {
        setValidationError('Please enter a valid Portfolio / LinkedIn URL (e.g. https://linkedin.com/in/yourname).');
        return false;
      }
    }
    if (!coverNote.trim() || coverNote.trim().length < 10) {
      setValidationError('Please provide a brief personal statement (at least 10 characters).');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const validateStep3 = (): boolean => {
    for (const q of job.screeningQuestions) {
      if (!q.required) continue;
      if (q.type === 'yes_no') continue;
      const ans = (screeningAnswers[q.id] || '').trim();
      if (!ans) {
        setValidationError(`Please answer the required screening question: "${q.question}"`);
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    if (!consentChecked) {
      setValidationError('Please certify accuracy and grant consent before submitting.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setValidationError(null);

    const normalizedScreening = { ...screeningAnswers };
    job.screeningQuestions.forEach((q) => {
      if (q.type === 'yes_no' && !normalizedScreening[q.id]) {
        normalizedScreening[q.id] = 'Yes';
      }
    });

    const t1 = window.setTimeout(() => {
      try {
        const newId = submitApplication({
          jobId: job.id,
          applicantName: applicantName.trim(),
          applicantEmail: applicantEmail.trim(),
          applicantPhone: applicantPhone.trim(),
          parish,
          citizenStatus,
          resumeFileName,
          resumeFileSize,
          portfolioUrl: portfolioUrl.trim() || undefined,
          coverNote: coverNote.trim(),
          screeningAnswers: normalizedScreening,
        });

        setIsSubmitting(false);
        setIsSubmitSuccess(true);

        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#047857', '#0d9488', '#fbbf24', '#10b981', '#34d399'],
          });
        } catch (err) {
          console.warn('Confetti notice:', err);
        }

        try {
          localStorage.removeItem(`natureisland_apply_draft_${job.id}`);
        } catch {
          // ignore
        }

        const t2 = window.setTimeout(() => {
          setIsSubmitSuccess(false);
          isSubmittingRef.current = false;
          setCompletedAppId(newId);
          onSuccess(newId);
        }, 750);
        timersRef.current.push(t2);
      } catch {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        setValidationError('Unable to transmit application right now. Please try again.');
      }
    }, 700);
    timersRef.current.push(t1);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={job.title}
        tabIndex={-1}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Application Submission
            </span>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
              {job.title}
            </h2>
            <p className="text-xs text-stone-500">{job.company} · {job.parish}</p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            aria-label="Close application modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {!completedAppId && (
          <div className="px-5 pt-3 pb-2 bg-stone-100/50 border-b border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className={step >= 1 ? 'font-semibold text-emerald-800' : ''}>1. Contact</span>
            <span>·</span>
            <span className={step >= 2 ? 'font-semibold text-emerald-800' : ''}>2. Resume & Note</span>
            <span>·</span>
            <span className={step >= 3 ? 'font-semibold text-emerald-800' : ''}>3. Screening</span>
            <span>·</span>
            <span className={step >= 4 ? 'font-semibold text-emerald-800' : ''}>4. Review</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh]">
          {completedAppId ? (
            /* Success confirmation screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-950 font-display">
                  Application Successfully Delivered!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  Your credentials have been securely transmitted to {job.company}'s hiring team in Dominica.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl max-w-md mx-auto text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Reference Number:</span>
                  <span className="font-mono font-bold text-emerald-950">{completedAppId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Confirmation Sent To:</span>
                  <span className="font-mono text-stone-700">{applicantEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Employer Notice:</span>
                  <span className="text-emerald-800 font-medium">Dispatched via Instant Relay</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Return to Vacancy Board
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
              {validationError && (
                <div
                  role="alert"
                  data-testid="apply-modal-validation-error"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}
              
              {/* STEP 1: Identification */}
              {step === 1 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-stone-900 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Max Blanc"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-900 mb-1">
                        Email Address (for Real-Time Alerts) *
                      </label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-900 mb-1">
                        Contact Phone (Dominica) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+1 (767) 555-0199"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-900 mb-1">
                        Parish of Residence in Dominica *
                      </label>
                      <select
                        value={parish}
                        onChange={(e) => setParish(e.target.value as Parish)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
                      >
                        {PARISHES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-900 mb-1">
                        Work Eligibility Status *
                      </label>
                      <select
                        value={citizenStatus}
                        onChange={(e) =>
                          setCitizenStatus(
                            e.target.value as
                              | 'Dominican Citizen'
                              | 'CARICOM CSME'
                              | 'Work Permit Holder'
                              | 'NEP Trainee'
                          )
                        }
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
                      >
                        <option value="Dominican Citizen">Dominican Citizen (National)</option>
                        <option value="CARICOM CSME">CARICOM CSME Skills Certificate</option>
                        <option value="NEP Trainee">National Employment Programme (NEP)</option>
                        <option value="Work Permit Holder">Dominica Work Permit Holder</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep1()) setStep(2);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-medium cursor-pointer"
                    >
                      <span>Continue to Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Resume & Statement */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-stone-900 mb-1">
                      Upload Resume / Curriculum Vitae *
                    </label>
                    <div className="border-2 border-dashed border-stone-300 hover:border-emerald-700 rounded-xl p-4 text-center bg-stone-50 hover:bg-emerald-50/30 transition-colors">
                      <UploadCloud className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                      <p className="text-stone-700 font-medium">Click to select or drop PDF / DOCX file</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Maximum size 5 MB</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUploadSim}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="mt-2 inline-block px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-[11px] font-medium cursor-pointer"
                      >
                        Browse Device
                      </label>
                    </div>

                    {/* Active file display */}
                    <div className="mt-2 flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-800" />
                        <div>
                          <div className="font-semibold text-stone-900">{resumeFileName}</div>
                          <div className="text-[10px] text-stone-500">{resumeFileSize} · Verified format</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-medium">Ready</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-900 mb-1">
                      Portfolio, LinkedIn, or GitHub URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-900 mb-1">
                      Cover Note / Personal Statement *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Highlight your relevant Dominican or regional Caribbean experience..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1 px-3 py-2 text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep2()) setStep(3);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-medium cursor-pointer"
                    >
                      <span>Continue to Screening</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Screening Questionnaire */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600">
                    <span className="font-semibold text-stone-900">Employer Screening: </span>
                    {job.company} requires answers to these candidate assessment criteria.
                  </div>

                  {job.screeningQuestions.length === 0 ? (
                    <div className="text-stone-500 py-3">
                      No mandatory screening questions for this position. Proceed to final review.
                    </div>
                  ) : (
                    job.screeningQuestions.map((q) => (
                      <div key={q.id} className="space-y-1">
                        <label className="block font-semibold text-stone-900">
                          {q.question} {q.required && '*'}
                        </label>
                        {q.type === 'yes_no' ? (
                          <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={(screeningAnswers[q.id] || 'Yes') === 'Yes'}
                                onChange={() =>
                                  setScreeningAnswers((prev) => ({ ...prev, [q.id]: 'Yes' }))
                                }
                                className="text-emerald-800"
                              />
                              <span>Yes</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={screeningAnswers[q.id] === 'No'}
                                onChange={() =>
                                  setScreeningAnswers((prev) => ({ ...prev, [q.id]: 'No' }))
                                }
                                className="text-emerald-800"
                              />
                              <span>No</span>
                            </label>
                          </div>
                        ) : (
                          <input
                            type="text"
                            required={q.required}
                            value={screeningAnswers[q.id] || ''}
                            onChange={(e) =>
                              setScreeningAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="Provide your response..."
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                          />
                        )}
                      </div>
                    ))
                  )}

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1 px-3 py-2 text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep3()) setStep(4);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-medium cursor-pointer"
                    >
                      <span>Review & Submit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Consent */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-stone-700">
                    <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                      Application Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400">Applicant: </span>
                        <span className="font-medium text-stone-900">{applicantName}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Parish: </span>
                        <span className="font-medium text-stone-900">{parish}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Contact: </span>
                        <span className="font-medium text-stone-900">{applicantEmail}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Document: </span>
                        <span className="font-medium text-stone-900">{resumeFileName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dominica Labor & Data Protection Notice */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-emerald-950 text-xs">
                        Dominica Data Protection & Secure Handling
                      </h5>
                      <p className="text-[11px] text-emerald-900/80 leading-relaxed mt-0.5">
                        Your identity and resume details are securely encrypted and forwarded exclusively to {job.company}’s verified recruiter portal. An automated confirmation email will be generated in real-time.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 rounded border-stone-300 text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>
                      I certify that the information provided is accurate and grant permission for verified Dominican recruiters to contact me.
                    </span>
                  </label>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex items-center gap-1 px-3 py-2 text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="flex items-center gap-1.5 px-3.5 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95"
                        title="Save application draft to resume later"
                      >
                        <Save className="w-3.5 h-3.5 text-stone-500" />
                        <span>{draftNotice ? 'Draft Saved!' : 'Save Draft'}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !consentChecked}
                        className={`relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold shadow-xs cursor-pointer disabled:opacity-50 transition-all duration-300 active:scale-95 ${
                          isSubmitSuccess
                            ? 'bg-emerald-600 text-white scale-105 ring-2 ring-emerald-400'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        }`}
                      >
                        {isSubmitting ? (
                          <span>Processing Transmission...</span>
                        ) : isSubmitSuccess ? (
                          <span className="flex items-center gap-1.5 animate-in zoom-in-75 duration-200">
                            <span className="w-4 h-4 bg-white text-emerald-800 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                            <span>Submitted Successfully!</span>
                          </span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Submit Application</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
