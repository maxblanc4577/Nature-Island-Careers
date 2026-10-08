import React, { useState, useEffect, useMemo } from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import {
  InterviewDetails,
  InterviewEvaluation,
  EvaluationRecommendation,
} from '../types';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Send,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Timer,
  ClipboardCheck,
  Star,
  Award,
} from 'lucide-react';

export type InterviewTimerMode = 'elapsed' | 'countdown';

/**
 * Formats a duration in seconds as MM:SS or HH:MM:SS.
 */
export function formatInterviewTimerDisplay(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Advances the interview timer by 1 second based on mode ('elapsed' or 'countdown').
 */
export function stepInterviewTimer(
  currentSeconds: number,
  mode: InterviewTimerMode
): { nextSeconds: number; completed: boolean } {
  if (mode === 'elapsed') {
    return { nextSeconds: currentSeconds + 1, completed: false };
  }
  const next = Math.max(0, currentSeconds - 1);
  return { nextSeconds: next, completed: next === 0 };
}

/**
 * Calculates the aggregate score, percentage, and recommended hiring decision
 * from specific post-interview evaluation criteria (1 to 5 scale).
 */
export function calculateInterviewEvaluationSummary(scores: {
  communication: number;
  technicalFit: number;
  culturalFit: number;
  problemSolving?: number;
}): {
  overallScore: number;
  percentage: number;
  recommendation: EvaluationRecommendation;
} {
  const clamp = (val: number) => Math.max(1, Math.min(5, Number(val) || 1));
  const comm = clamp(scores.communication);
  const tech = clamp(scores.technicalFit);
  const cult = clamp(scores.culturalFit);
  const values = [comm, tech, cult];

  if (typeof scores.problemSolving === 'number' && !Number.isNaN(scores.problemSolving)) {
    values.push(clamp(scores.problemSolving));
  }

  const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
  const overallScore = Number(avg.toFixed(1));
  const percentage = Math.round((avg / 5) * 100);

  let recommendation: EvaluationRecommendation = 'Hold / Follow-up';
  if (overallScore >= 4.5) {
    recommendation = 'Strong Hire';
  } else if (overallScore >= 3.5) {
    recommendation = 'Hire';
  } else if (overallScore >= 2.5) {
    recommendation = 'Hold / Follow-up';
  } else {
    recommendation = 'No Hire';
  }

  return { overallScore, percentage, recommendation };
}

/**
 * Builds a complete InterviewEvaluation record from recruiter criteria scores.
 */
export function createInterviewEvaluationRecord(input: {
  communication: number;
  technicalFit: number;
  culturalFit: number;
  problemSolving?: number;
  recommendation?: EvaluationRecommendation;
  comments?: string;
}): InterviewEvaluation {
  const summary = calculateInterviewEvaluationSummary(input);
  return {
    communication: Math.max(1, Math.min(5, Number(input.communication) || 1)),
    technicalFit: Math.max(1, Math.min(5, Number(input.technicalFit) || 1)),
    culturalFit: Math.max(1, Math.min(5, Number(input.culturalFit) || 1)),
    problemSolving:
      typeof input.problemSolving === 'number'
        ? Math.max(1, Math.min(5, Number(input.problemSolving) || 1))
        : undefined,
    overallScore: summary.overallScore,
    percentage: summary.percentage,
    recommendation: input.recommendation || summary.recommendation,
    comments: input.comments?.trim() || undefined,
    evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };
}

interface InterviewSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

export const InterviewSchedulerModal: React.FC<InterviewSchedulerModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
  notes: propNotes = '',
  onNotesChange,
}) => {
  const {
    scheduleInterview,
    addApplicationNote,
    saveInterviewEvaluation,
    applications,
  } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });

  const existingApp = applications.find((a) => a.id === applicationId);
  const existingEval =
    existingApp?.interviewEvaluation || existingApp?.interviewDetails?.evaluation;

  const [date, setDate] = useState(existingApp?.interviewDetails?.date || '2026-10-05');
  const [time, setTime] = useState(existingApp?.interviewDetails?.time || '10:00 AM AST');
  const [mode, setMode] = useState<'In-person' | 'Virtual Video Call'>(
    existingApp?.interviewDetails?.mode || 'Virtual Video Call'
  );
  const [location, setLocation] = useState(
    existingApp?.interviewDetails?.location || 'Google Meet link will be shared 15 mins prior'
  );
  const [instructions, setInstructions] = useState(
    existingApp?.interviewDetails?.instructions ||
      'Please have your portfolio and relevant certifications ready.'
  );
  const [notes, setNotes] = useState(
    propNotes || existingApp?.interviewDetails?.notes || ''
  );
  const [postScheduleNote, setPostScheduleNote] = useState('');
  const [postNoteSaved, setPostNoteSaved] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  // Live Interview Call Timer State (Elapsed or Countdown)
  const [timerMode, setTimerMode] = useState<InterviewTimerMode>('elapsed');
  const [countdownPresetMinutes, setCountdownPresetMinutes] = useState<number>(30);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);

  // Post-Call Interview Evaluation Criteria State
  const [communicationScore, setCommunicationScore] = useState<number>(
    existingEval?.communication || 4
  );
  const [technicalFitScore, setTechnicalFitScore] = useState<number>(
    existingEval?.technicalFit || 4
  );
  const [culturalFitScore, setCulturalFitScore] = useState<number>(
    existingEval?.culturalFit || 4
  );
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(
    existingEval?.problemSolving || 4
  );
  const [customRecommendation, setCustomRecommendation] =
    useState<EvaluationRecommendation | ''>('');
  const [evaluationComments, setEvaluationComments] = useState<string>(
    existingEval?.comments || ''
  );
  const [evaluationSaved, setEvaluationSaved] = useState<boolean>(false);
  const [savedEvaluationRecord, setSavedEvaluationRecord] =
    useState<InterviewEvaluation | null>(existingEval || null);

  const computedEvalSummary = useMemo(
    () =>
      calculateInterviewEvaluationSummary({
        communication: communicationScore,
        technicalFit: technicalFitScore,
        culturalFit: culturalFitScore,
        problemSolving: problemSolvingScore,
      }),
    [communicationScore, technicalFitScore, culturalFitScore, problemSolvingScore]
  );

  const activeRecommendation: EvaluationRecommendation =
    customRecommendation || computedEvalSummary.recommendation;

  useEffect(() => {
    if (propNotes !== undefined && propNotes !== notes) {
      setNotes(propNotes);
    }
  }, [propNotes]);

  useEffect(() => {
    if (!isTimerRunning) return;

    const intervalId = window.setInterval(() => {
      setTimerSeconds((prev) => {
        const { nextSeconds, completed } = stepInterviewTimer(prev, timerMode);
        if (completed) {
          setIsTimerRunning(false);
          setTimerCompleted(true);
        }
        return nextSeconds;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isTimerRunning, timerMode]);

  if (!isOpen) return null;

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (onNotesChange) {
      onNotesChange(val);
    }
  };

  const handleSwitchTimerMode = (newMode: InterviewTimerMode) => {
    setIsTimerRunning(false);
    setTimerCompleted(false);
    setTimerMode(newMode);
    if (newMode === 'elapsed') {
      setTimerSeconds(0);
    } else {
      setTimerSeconds(countdownPresetMinutes * 60);
    }
  };

  const handleSelectCountdownPreset = (mins: number) => {
    setCountdownPresetMinutes(mins);
    setIsTimerRunning(false);
    setTimerCompleted(false);
    if (timerMode === 'countdown') {
      setTimerSeconds(mins * 60);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerCompleted(false);
    setTimerSeconds(timerMode === 'elapsed' ? 0 : countdownPresetMinutes * 60);
  };

  const handleLogDurationToNotes = () => {
    const formatted = formatInterviewTimerDisplay(timerSeconds);
    const label =
      timerMode === 'elapsed'
        ? `[Live Call Elapsed: ${formatted}]`
        : `[Live Call Countdown Remaining: ${formatted} of ${countdownPresetMinutes}:00]`;
    const updatedNotes = notes.trim() ? `${notes.trim()} ${label}` : label;
    handleNotesChange(updatedNotes);
  };

  const handleSaveEvaluation = () => {
    const record = createInterviewEvaluationRecord({
      communication: communicationScore,
      technicalFit: technicalFitScore,
      culturalFit: culturalFitScore,
      problemSolving: problemSolvingScore,
      recommendation: activeRecommendation,
      comments: evaluationComments,
    });

    saveInterviewEvaluation(applicationId, record);
    setSavedEvaluationRecord(record);

    const evalTag = `[Evaluation: ${record.overallScore}/5 (${record.percentage}%) - ${record.recommendation} | Comm:${record.communication} Tech:${record.technicalFit} Culture:${record.culturalFit}]${
      record.comments ? ` ${record.comments}` : ''
    }`;
    const mergedNotes = [notes.trim(), evalTag].filter(Boolean).join(' | ');
    handleNotesChange(mergedNotes);

    setEvaluationSaved(true);
    setTimeout(() => setEvaluationSaved(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const details: InterviewDetails = {
      date,
      time,
      location,
      mode,
      instructions,
      notes: notes.trim() || undefined,
      evaluation: savedEvaluationRecord || undefined,
    };

    scheduleInterview(applicationId, details);
    setScheduled(true);
  };

  const handleSavePostScheduleFeedback = () => {
    const trimmed = postScheduleNote.trim();
    if (!trimmed) return;
    addApplicationNote(applicationId, trimmed);
    const mergedNotes = [notes.trim(), trimmed].filter(Boolean).join(' | ');
    handleNotesChange(mergedNotes);
    setPostScheduleNote('');
    setPostNoteSaved(true);
    setTimeout(() => setPostNoteSaved(false), 2000);
  };

  const renderLiveInterviewTimerWidget = () => (
    <div
      data-testid="interview-live-timer"
      className="bg-slate-900 text-white rounded-xl p-3.5 border border-emerald-700/50 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Timer className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
            Live Interview Call Timer
          </span>
        </div>

        {/* Mode Switcher: Elapsed vs Countdown */}
        <div className="inline-flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px] font-bold">
          <button
            type="button"
            data-testid="timer-mode-elapsed"
            onClick={() => handleSwitchTimerMode('elapsed')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              timerMode === 'elapsed'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Elapsed
          </button>
          <button
            type="button"
            data-testid="timer-mode-countdown"
            onClick={() => handleSwitchTimerMode('countdown')}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              timerMode === 'countdown'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Countdown
          </button>
        </div>
      </div>

      {timerMode === 'countdown' && (
        <div className="flex items-center justify-between gap-2 text-[11px] bg-slate-800/80 px-2.5 py-1.5 rounded-lg">
          <span className="text-slate-300 font-semibold">Target Call Slot:</span>
          <div className="flex items-center gap-1">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                data-testid={`timer-preset-${mins}m`}
                onClick={() => handleSelectCountdownPreset(mins)}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                  countdownPresetMinutes === mins
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-baseline gap-2">
          <span
            data-testid="interview-timer-display"
            className={`font-mono text-2xl font-black tracking-tight ${
              timerCompleted
                ? 'text-rose-400 animate-pulse'
                : isTimerRunning
                ? 'text-emerald-400'
                : 'text-white'
            }`}
          >
            {formatInterviewTimerDisplay(timerSeconds)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {timerCompleted
              ? 'Time Up!'
              : isTimerRunning
              ? timerMode === 'elapsed'
                ? 'Recording Elapsed'
                : 'Counting Down'
              : timerMode === 'elapsed'
              ? 'Elapsed Mode'
              : 'Countdown Ready'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="timer-start-pause-btn"
            onClick={() => {
              setTimerCompleted(false);
              setIsTimerRunning((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              isTimerRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="timer-reset-btn"
            onClick={handleResetTimer}
            title="Reset Timer"
            aria-label="Reset Timer"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            data-testid="timer-log-duration-btn"
            onClick={handleLogDurationToNotes}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold transition-colors cursor-pointer"
            title="Insert current call duration into Recruiter Notes"
          >
            Log Time
          </button>
        </div>
      </div>
    </div>
  );

  const renderCriterionRow = (
    label: string,
    criterionKey: 'communication' | 'technicalFit' | 'culturalFit' | 'problemSolving',
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="flex items-center justify-between gap-2 py-1">
      <label
        htmlFor={`eval-${criterionKey}`}
        className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
      >
        <span>{label}</span>
        <span className="text-[11px] font-extrabold text-emerald-700">({value}/5)</span>
      </label>

      <div className="flex items-center gap-1" data-testid={`eval-score-${criterionKey}`}>
        {[1, 2, 3, 4, 5].map((scoreVal) => (
          <button
            key={scoreVal}
            type="button"
            data-testid={`eval-${criterionKey}-btn-${scoreVal}`}
            onClick={() => onChange(scoreVal)}
            aria-label={`Score ${label} ${scoreVal} out of 5`}
            className={`w-6 h-6 rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center border ${
              value >= scoreVal
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
            }`}
          >
            {scoreVal}
          </button>
        ))}
      </div>
    </div>
  );

  const renderInterviewEvaluationForm = () => (
    <div
      data-testid="interview-evaluation-form"
      className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-3.5 space-y-3 text-left"
    >
      <div className="flex items-center justify-between gap-2 border-b border-amber-200/70 pb-2">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4 text-emerald-700" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
            Interview Evaluation Scorecard
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            data-testid="eval-overall-score"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-800 text-white"
          >
            <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
            {computedEvalSummary.overallScore}/5 ({computedEvalSummary.percentage}%)
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 leading-snug">
        Score <strong>{candidateName}</strong> on core competencies immediately after your scheduled interview call:
      </p>

      <div className="space-y-1 divide-y divide-amber-100">
        {renderCriterionRow(
          'Communication & Clarity',
          'communication',
          communicationScore,
          setCommunicationScore
        )}
        {renderCriterionRow(
          'Technical Fit & Role Readiness',
          'technicalFit',
          technicalFitScore,
          setTechnicalFitScore
        )}
        {renderCriterionRow(
          'Cultural Fit & Team Alignment',
          'culturalFit',
          culturalFitScore,
          setCulturalFitScore
        )}
        {renderCriterionRow(
          'Problem Solving & Initiative',
          'problemSolving',
          problemSolvingScore,
          setProblemSolvingScore
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div>
          <label
            htmlFor="eval-recommendation-select"
            className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1"
          >
            Hiring Recommendation
          </label>
          <select
            id="eval-recommendation-select"
            data-testid="eval-recommendation-select"
            value={activeRecommendation}
            onChange={(e) =>
              setCustomRecommendation(e.target.value as EvaluationRecommendation)
            }
            className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900"
          >
            <option value="Strong Hire">Strong Hire (Top Tier)</option>
            <option value="Hire">Hire (Meets Bar)</option>
            <option value="Hold / Follow-up">Hold / Follow-up</option>
            <option value="No Hire">No Hire</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="eval-comments-input"
            className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1"
          >
            Evaluation Summary Note
          </label>
          <input
            id="eval-comments-input"
            data-testid="eval-comments-input"
            type="text"
            value={evaluationComments}
            onChange={(e) => setEvaluationComments(e.target.value)}
            placeholder="Key strengths or post-call verdict..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs text-slate-800"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {evaluationSaved ? (
          <span
            data-testid="interview-evaluation-saved-badge"
            className="text-[11px] font-bold text-emerald-800 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interview Evaluation Saved ({activeRecommendation})</span>
          </span>
        ) : savedEvaluationRecord ? (
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Last Scored: {savedEvaluationRecord.overallScore}/5 ·{' '}
              {savedEvaluationRecord.recommendation}
            </span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">
            Syncs directly with candidate rating & dossier
          </span>
        )}

        <button
          type="button"
          data-testid="save-interview-evaluation-btn"
          onClick={handleSaveEvaluation}
          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>Save Evaluation</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Schedule Interview"
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-emerald-900/20 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Schedule & Evaluate Interview
              </h3>
              <p className="text-xs text-emerald-200">
                {candidateName} • {jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {scheduled ? (
          <div className="p-6 text-center space-y-4 max-h-[82vh] overflow-y-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-slate-900">Interview Dispatched!</h4>
              <p className="text-xs text-slate-600">
                The candidate has been notified with the date, format, and preparation guidelines.
              </p>
            </div>

            {/* Live Interview Call Timer also accessible during/after scheduling */}
            <div className="text-left">{renderLiveInterviewTimerWidget()}</div>

            {/* Post-Call Interview Evaluation Scorecard */}
            {renderInterviewEvaluationForm()}

            {notes.trim() && (
              <div className="text-left bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-emerald-800 mb-0.5">
                  Saved Recruiter Feedback Note:
                </span>
                <p>{notes}</p>
              </div>
            )}

            {/* Post-scheduling feedback input */}
            <div className="text-left space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Add Follow-up Candidate Feedback Note (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={postScheduleNote}
                  onChange={(e) => setPostScheduleNote(e.target.value)}
                  placeholder="Jot down additional candidate feedback..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={handleSavePostScheduleFeedback}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Save Note
                </button>
              </div>
              {postNoteSaved && (
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Candidate feedback saved to application record.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setScheduled(false);
                onClose();
              }}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Done & Return to Portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[82vh] overflow-y-auto">
            {/* Live Interview Countdown / Elapsed Call Timer */}
            {renderLiveInterviewTimerWidget()}

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
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Specific documents or portfolio items to bring..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="recruiter-interview-notes"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Recruiter Notes & Candidate Feedback</span>
              </label>
              <textarea
                id="recruiter-interview-notes"
                data-testid="interview-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Jot down internal candidate feedback, screening impressions, or interview focus areas..."
                className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/30 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Post-Call Interview Evaluation Form */}
            {renderInterviewEvaluationForm()}

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
