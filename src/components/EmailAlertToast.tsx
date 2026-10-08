import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useJobContext } from '../context/JobContext';
import {
  EmailNotification,
  JobAlertSubscription,
  JobListing,
  AlertPreferenceRule,
  SubscriptionCriteria,
} from '../types';
import {
  Mail,
  X,
  CheckCircle2,
  BellRing,
  MapPin,
  Briefcase,
  Search,
  ExternalLink,
  Pause,
  Play,
  Sparkles,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';

export interface SubscriptionMatchResult {
  subscription: JobAlertSubscription;
  job: JobListing;
  matchedCriteria: {
    parish: string;
    sector: string;
    keyword?: string;
    frequency: 'instant' | 'daily' | 'weekly';
  };
}

/**
 * Evaluates whether a job listing matches a user's saved subscription criteria.
 */
export function doesJobMatchSubscription(
  job: JobListing,
  subscription: JobAlertSubscription
): boolean {
  if (!subscription.active) return false;

  const parishMatch =
    subscription.parishes.length === 0 ||
    subscription.parishes.includes(job.parish) ||
    job.parish === 'Island-wide / Remote';

  const sectorMatch =
    subscription.sectors.length === 0 ||
    subscription.sectors.includes(job.sector);

  const rawKeyword = subscription.keyword?.trim().toLowerCase();
  const keywordMatch =
    !rawKeyword ||
    job.title.toLowerCase().includes(rawKeyword) ||
    job.description.toLowerCase().includes(rawKeyword) ||
    job.company.toLowerCase().includes(rawKeyword) ||
    job.locality.toLowerCase().includes(rawKeyword) ||
    (job.requiredSkills?.some((s) => s.toLowerCase().includes(rawKeyword)) ?? false);

  return parishMatch && sectorMatch && keywordMatch;
}

/**
 * Evaluates whether a job listing matches any active rule in `alertPreferences` or `subscriptionCriteria`.
 */
export function doesJobMatchAlertPreferences(
  job: JobListing,
  alertPreferences: AlertPreferenceRule[],
  criteria?: SubscriptionCriteria
): { matched: boolean; matchedRule?: AlertPreferenceRule } {
  if (criteria && !criteria.enabled) {
    return { matched: false };
  }

  const activeRules = alertPreferences.filter((r) => r.active);
  for (const rule of activeRules) {
    const parishMatch =
      rule.parish === 'All Parishes' ||
      rule.parish === job.parish ||
      job.parish === 'Island-wide / Remote';

    const sectorMatch =
      rule.sector === 'All Sectors' || rule.sector === job.sector;

    const rawKeyword = (rule.keyword || criteria?.keyword || '').trim().toLowerCase();
    const keywordMatch =
      !rawKeyword ||
      job.title.toLowerCase().includes(rawKeyword) ||
      job.description.toLowerCase().includes(rawKeyword) ||
      job.company.toLowerCase().includes(rawKeyword) ||
      job.locality.toLowerCase().includes(rawKeyword) ||
      (job.requiredSkills?.some((s) => s.toLowerCase().includes(rawKeyword)) ?? false);

    if (parishMatch && sectorMatch && keywordMatch) {
      return { matched: true, matchedRule: rule };
    }
  }

  // Fallback to top-level criteria if no explicit alertPreferences rules are active
  if (activeRules.length === 0 && criteria && criteria.enabled) {
    const subAdapter: JobAlertSubscription = {
      id: 'criteria-sub',
      email: criteria.email,
      name: criteria.name,
      parishes: criteria.parishes,
      sectors: criteria.sectors,
      keyword: criteria.keyword,
      frequency: criteria.frequency,
      active: criteria.enabled,
      createdAt: criteria.updatedAt,
    };
    if (doesJobMatchSubscription(job, subAdapter)) {
      return {
        matched: true,
        matchedRule: {
          id: 'criteria-fallback',
          sector: job.sector,
          parish: job.parish,
          keyword: criteria.keyword,
          active: true,
        },
      };
    }
  }

  return { matched: false };
}

/**
 * Builds a structured EmailNotification object for a matched job and subscription.
 */
export function createSubscriptionEmailNotification(
  job: JobListing,
  subscription: JobAlertSubscription
): EmailNotification {
  const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const currency = job.currency || 'EC$';

  return {
    id: `notif-mock-svc-${job.id}-${subscription.id}-${Date.now()}`,
    recipientEmail: subscription.email,
    recipientName: subscription.name,
    subject: `New Matching Job Alert: ${job.title} (${job.parish})`,
    previewText: `${job.company} posted "${job.title}" in ${job.parish} matching your ${subscription.frequency} alert criteria (${job.sector}). Salary: ${currency}${job.minSalary.toLocaleString()} - ${currency}${job.maxSalary.toLocaleString()}/${job.salaryPeriod}.`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px;">
        <div style="border-bottom: 2px solid #006b4d; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #006b4d; margin: 0;">Nature Island Careers · Automated Job Alert</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Dispatched from info@natureislecareers.com (${subscription.frequency.toUpperCase()} digest)</p>
        </div>
        <p style="font-size: 15px; color: #1e293b;">Hello ${subscription.name},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
          A newly added vacancy matches your saved subscription criteria:
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #065f46; margin: 0 0 6px 0;">${job.title}</h3>
          <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Employer:</strong> ${job.company}</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Parish:</strong> ${job.parish} (${job.locality})</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>Sector:</strong> ${job.sector}</p>
          ${subscription.keyword ? `<p style="margin: 0; font-size: 13px; color: #047857;"><strong>Matched Keyword:</strong> "${subscription.keyword}"</p>` : ''}
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #065f46; font-weight: 600;">
            Compensation: ${currency}${job.minSalary.toLocaleString()} - ${currency}${job.maxSalary.toLocaleString()} / ${job.salaryPeriod}
          </p>
        </div>
      </div>
    `,
    type: 'job_alert',
    timestamp: nowTimestamp,
    isRead: false,
    relatedJobId: job.id,
  };
}

interface EmailAlertToastProps {
  onSelectJob?: (job: JobListing) => void;
  periodicIntervalMs?: number;
}

const DISPATCHED_STORAGE_KEY = 'dominica_mock_email_dispatched_pairs';

export const EmailAlertToast: React.FC<EmailAlertToastProps> = ({
  onSelectJob,
  periodicIntervalMs = 20000,
}) => {
  const {
    latestDispatchedEmail,
    dismissLatestEmail,
    dispatchEmail,
    alerts,
    subscriptionCriteria,
    saveSubscriptionCriteria,
    loadSubscriptionCriteria,
    jobs,
    getJobById,
  } = useJobContext();

  // Stateful alertPreferences list (e.g., job sector/parish matches) persisted via subscriptionCriteria
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferenceRule[]>(() => {
    if (
      subscriptionCriteria?.alertPreferences &&
      subscriptionCriteria.alertPreferences.length > 0
    ) {
      return subscriptionCriteria.alertPreferences;
    }
    return [
      {
        id: 'pref-1',
        sector: 'Renewable Energy & Geothermal',
        parish: 'St. George',
        active: true,
      },
      {
        id: 'pref-2',
        sector: 'Eco-Tourism & Hospitality',
        parish: 'St. George',
        active: true,
      },
      {
        id: 'pref-3',
        sector: 'Information Technology & Digital',
        parish: 'Island-wide / Remote',
        active: true,
      },
    ];
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPreferencesPanel, setShowPreferencesPanel] = useState(false);
  const [pendingMatches, setPendingMatches] = useState<SubscriptionMatchResult[]>([]);
  const [activeMatchMeta, setActiveMatchMeta] = useState<SubscriptionMatchResult | null>(null);
  const [visibleToast, setVisibleToast] = useState<EmailNotification | null>(null);

  // Track already-notified (subscriptionId:jobId) pairs so we don't spam duplicates
  const notifiedPairsRef = useRef<Set<string>>(new Set());
  // Track known job IDs to detect newly added jobs immediately
  const knownJobIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Sync local alertPreferences whenever subscriptionCriteria.alertPreferences changes externally
  useEffect(() => {
    if (
      subscriptionCriteria?.alertPreferences &&
      subscriptionCriteria.alertPreferences.length > 0
    ) {
      setAlertPreferences(subscriptionCriteria.alertPreferences);
    }
  }, [subscriptionCriteria?.alertPreferences]);

  // Load persisted subscriptionCriteria on mount
  useEffect(() => {
    const loaded = loadSubscriptionCriteria();
    if (loaded.alertPreferences && loaded.alertPreferences.length > 0) {
      setAlertPreferences(loaded.alertPreferences);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync visibleToast with context's latestDispatchedEmail
  useEffect(() => {
    if (latestDispatchedEmail) {
      setVisibleToast(latestDispatchedEmail);
    }
  }, [latestDispatchedEmail]);

  const handleTogglePreferenceRule = (ruleId: string) => {
    const updatedRules = alertPreferences.map((rule) =>
      rule.id === ruleId ? { ...rule, active: !rule.active } : rule
    );
    setAlertPreferences(updatedRules);

    const activeSectors = Array.from(
      new Set(
        updatedRules
          .filter((r) => r.active && r.sector !== 'All Sectors')
          .map((r) => r.sector as JobListing['sector'])
      )
    );
    const activeParishes = Array.from(
      new Set(
        updatedRules
          .filter((r) => r.active && r.parish !== 'All Parishes')
          .map((r) => r.parish as JobListing['parish'])
      )
    );

    saveSubscriptionCriteria({
      alertPreferences: updatedRules,
      sectors: activeSectors.length > 0 ? activeSectors : subscriptionCriteria.sectors,
      parishes: activeParishes.length > 0 ? activeParishes : subscriptionCriteria.parishes,
      enabled: updatedRules.some((r) => r.active),
    });
  };

  // Initialize known jobs & persisted notified pairs
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const savedPairs = sessionStorage.getItem(DISPATCHED_STORAGE_KEY);
      if (savedPairs) {
        const parsed: string[] = JSON.parse(savedPairs);
        parsed.forEach((p) => notifiedPairsRef.current.add(p));
      }
    } catch {
      // ignore storage errors
    }

    const activeSubs = alerts.filter((a) => a.active);
    const hasSessionHistory = notifiedPairsRef.current.size > 0;

    jobs.forEach((job, index) => {
      if (hasSessionHistory || index >= 2 || activeSubs.length === 0) {
        knownJobIdsRef.current.add(job.id);
      }
    });
  }, [jobs, alerts]);

  const markPairNotified = useCallback((subId: string, jobId: string) => {
    const key = `${subId}:${jobId}`;
    notifiedPairsRef.current.add(key);
    try {
      sessionStorage.setItem(
        DISPATCHED_STORAGE_KEY,
        JSON.stringify(Array.from(notifiedPairsRef.current))
      );
    } catch {
      // ignore
    }
  }, []);

  // Build effective subscription from subscriptionCriteria + alertPreferences
  const buildCriteriaSubscription = useCallback((): JobAlertSubscription => {
    const activeRuleSectors = Array.from(
      new Set(
        alertPreferences
          .filter((r) => r.active && r.sector !== 'All Sectors')
          .map((r) => r.sector as JobListing['sector'])
      )
    );
    const activeRuleParishes = Array.from(
      new Set(
        alertPreferences
          .filter((r) => r.active && r.parish !== 'All Parishes')
          .map((r) => r.parish as JobListing['parish'])
      )
    );

    return {
      id: 'criteria-persisted',
      email: subscriptionCriteria?.email || 'maxblanc10468@gmail.com',
      name: subscriptionCriteria?.name || 'Max Blanc',
      parishes:
        activeRuleParishes.length > 0
          ? activeRuleParishes
          : subscriptionCriteria?.parishes || [],
      sectors:
        activeRuleSectors.length > 0
          ? activeRuleSectors
          : subscriptionCriteria?.sectors || [],
      keyword: subscriptionCriteria?.keyword || '',
      frequency: subscriptionCriteria?.frequency || 'instant',
      active:
        (subscriptionCriteria?.enabled ?? true) &&
        alertPreferences.some((r) => r.active),
      createdAt: subscriptionCriteria?.updatedAt || '2026-09-24',
    };
  }, [alertPreferences, subscriptionCriteria]);

  // Scan for new matching jobs whenever `jobs`, `alerts`, or `alertPreferences` change
  useEffect(() => {
    const criteriaSub = buildCriteriaSubscription();
    const activeSubscriptions = [
      ...(criteriaSub.active ? [criteriaSub] : []),
      ...alerts.filter((a) => a.active),
    ];
    if (activeSubscriptions.length === 0) return;

    const newlyDiscoveredMatches: SubscriptionMatchResult[] = [];

    for (const job of jobs) {
      const isNewJob = !knownJobIdsRef.current.has(job.id);
      knownJobIdsRef.current.add(job.id);

      if (!isNewJob) continue;

      // Check against stateful alertPreferences + subscriptionCriteria first
      const prefEval = doesJobMatchAlertPreferences(
        job,
        alertPreferences,
        subscriptionCriteria
      );
      if (prefEval.matched) {
        const pairKey = `${criteriaSub.id}:${job.id}`;
        if (!notifiedPairsRef.current.has(pairKey)) {
          markPairNotified(criteriaSub.id, job.id);
          newlyDiscoveredMatches.push({
            subscription: criteriaSub,
            job,
            matchedCriteria: {
              parish: job.parish,
              sector: job.sector,
              keyword: prefEval.matchedRule?.keyword || criteriaSub.keyword,
              frequency: criteriaSub.frequency,
            },
          });
          continue;
        }
      }

      // Check remaining active subscriptions
      for (const sub of alerts.filter((a) => a.active)) {
        const pairKey = `${sub.id}:${job.id}`;
        if (notifiedPairsRef.current.has(pairKey)) continue;

        if (doesJobMatchSubscription(job, sub)) {
          markPairNotified(sub.id, job.id);
          newlyDiscoveredMatches.push({
            subscription: sub,
            job,
            matchedCriteria: {
              parish: job.parish,
              sector: job.sector,
              keyword: sub.keyword,
              frequency: sub.frequency,
            },
          });
        }
      }
    }

    if (newlyDiscoveredMatches.length > 0) {
      setPendingMatches((prev) => [...prev, ...newlyDiscoveredMatches]);
    }
  }, [
    jobs,
    alerts,
    alertPreferences,
    subscriptionCriteria,
    buildCriteriaSubscription,
    markPairNotified,
  ]);

  // Dispatch the next queued subscription match
  const triggerNextQueuedMatch = useCallback(() => {
    setPendingMatches((prev) => {
      if (prev.length === 0) return prev;
      const [nextMatch, ...rest] = prev;
      const emailNotif = createSubscriptionEmailNotification(
        nextMatch.job,
        nextMatch.subscription
      );
      setActiveMatchMeta(nextMatch);
      setVisibleToast(emailNotif);
      dispatchEmail(emailNotif);
      return rest;
    });
  }, [dispatchEmail]);

  // Periodic useEffect interval to simulate checking for 'new' jobs based on mock subscription criteria & alertPreferences
  useEffect(() => {
    if (isPaused) return;

    const intervalId = window.setInterval(() => {
      if (!isHovered && pendingMatches.length > 0) {
        triggerNextQueuedMatch();
        return;
      }

      if (isHovered) return;

      const criteriaSub = buildCriteriaSubscription();

      // 1. Check stateful alertPreferences & persisted subscriptionCriteria against jobs
      for (const job of jobs) {
        const pairKey = `${criteriaSub.id}:${job.id}`;
        if (notifiedPairsRef.current.has(pairKey)) continue;

        const prefEval = doesJobMatchAlertPreferences(
          job,
          alertPreferences,
          subscriptionCriteria
        );
        if (prefEval.matched) {
          markPairNotified(criteriaSub.id, job.id);
          const matchResult: SubscriptionMatchResult = {
            subscription: criteriaSub,
            job,
            matchedCriteria: {
              parish: job.parish,
              sector: job.sector,
              keyword: prefEval.matchedRule?.keyword || criteriaSub.keyword,
              frequency: criteriaSub.frequency,
            },
          };
          const emailNotif = createSubscriptionEmailNotification(job, criteriaSub);
          setActiveMatchMeta(matchResult);
          setVisibleToast(emailNotif);
          dispatchEmail(emailNotif);
          return;
        }
      }

      // 2. Fallback check across alerts list
      const activeSubscriptions = alerts.filter((a) => a.active);
      for (const sub of activeSubscriptions) {
        const unnotifiedMatchingJob = jobs.find((job) => {
          const pairKey = `${sub.id}:${job.id}`;
          return !notifiedPairsRef.current.has(pairKey) && doesJobMatchSubscription(job, sub);
        });

        if (unnotifiedMatchingJob) {
          markPairNotified(sub.id, unnotifiedMatchingJob.id);
          const matchResult: SubscriptionMatchResult = {
            subscription: sub,
            job: unnotifiedMatchingJob,
            matchedCriteria: {
              parish: unnotifiedMatchingJob.parish,
              sector: unnotifiedMatchingJob.sector,
              keyword: sub.keyword,
              frequency: sub.frequency,
            },
          };
          const emailNotif = createSubscriptionEmailNotification(unnotifiedMatchingJob, sub);
          setActiveMatchMeta(matchResult);
          setVisibleToast(emailNotif);
          dispatchEmail(emailNotif);
          break;
        }
      }
    }, periodicIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [
    isPaused,
    isHovered,
    pendingMatches.length,
    alerts,
    alertPreferences,
    subscriptionCriteria,
    jobs,
    periodicIntervalMs,
    buildCriteriaSubscription,
    triggerNextQueuedMatch,
    markPairNotified,
    dispatchEmail,
  ]);

  // Immediately show first queued match if no toast is currently active
  useEffect(() => {
    const activeToast = latestDispatchedEmail || visibleToast;
    if (!activeToast && pendingMatches.length > 0 && !isPaused) {
      const timer = window.setTimeout(() => {
        triggerNextQueuedMatch();
      }, 600);
      return () => window.clearTimeout(timer);
    }
  }, [latestDispatchedEmail, visibleToast, pendingMatches.length, isPaused, triggerNextQueuedMatch]);

  // Auto-dismiss toast after 9 seconds unless hovered or configuring preferences
  useEffect(() => {
    const activeToast = latestDispatchedEmail || visibleToast;
    if (!activeToast || isHovered || showPreferencesPanel) return;
    const timer = window.setTimeout(() => {
      dismissLatestEmail();
      setVisibleToast(null);
      setActiveMatchMeta(null);
    }, 9000);
    return () => window.clearTimeout(timer);
  }, [latestDispatchedEmail, visibleToast, isHovered, showPreferencesPanel, dismissLatestEmail]);

  const displayedEmail = latestDispatchedEmail || visibleToast;
  if (!displayedEmail) return null;

  const relatedJob =
    activeMatchMeta?.job ||
    (displayedEmail.relatedJobId
      ? getJobById(displayedEmail.relatedJobId)
      : undefined);

  const matchedSub =
    activeMatchMeta?.subscription ||
    alerts.find(
      (a) =>
        a.active &&
        a.email.toLowerCase() === displayedEmail.recipientEmail.toLowerCase()
    ) ||
    buildCriteriaSubscription();

  const isJobAlert = displayedEmail.type === 'job_alert';
  const activeRulesCount = alertPreferences.filter((r) => r.active).length;

  const handleDismiss = () => {
    dismissLatestEmail();
    setVisibleToast(null);
    setActiveMatchMeta(null);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/40 p-4 animate-in slide-in-from-bottom duration-300"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40 shrink-0">
            {isJobAlert ? <BellRing className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {isJobAlert ? 'Subscription Match Alert' : 'Email Dispatch Simulated'}
              </span>
              {matchedSub && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-amber-300 border border-emerald-700/60">
                  {matchedSub.frequency}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-100 leading-snug mt-0.5">
              {displayedEmail.subject}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreferencesPanel((prev) => !prev)}
            title="Manage saved alertPreferences (Parishes & Sectors)"
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              showPreferencesPanel
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            title={isPaused ? 'Resume periodic email alerts' : 'Pause periodic email alerts'}
            className="text-slate-400 hover:text-emerald-300 p-1 rounded-lg transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss email notification"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Alert Preferences Drawer (persisted in localStorage via subscriptionCriteria) */}
      {showPreferencesPanel && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-2 text-[11px]">
          <div className="flex items-center justify-between text-emerald-300 font-bold">
            <span>Saved Alert Preferences (localStorage)</span>
            <span className="text-[10px] text-slate-400">{activeRulesCount} active</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {alertPreferences.map((rule) => (
              <label
                key={rule.id}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/40"
              >
                <span className="truncate text-slate-200">
                  {rule.sector} • <strong className="text-emerald-400">{rule.parish}</strong>
                </span>
                <input
                  type="checkbox"
                  checked={rule.active}
                  onChange={() => handleTogglePreferenceRule(rule.id)}
                  className="accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Email Envelope & Preview Body */}
      <div className="mt-2.5 text-xs text-slate-300 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/70 leading-relaxed space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-700/60 pb-1">
          <span className="font-semibold text-slate-200 truncate">
            To: {displayedEmail.recipientEmail}
          </span>
          <span className="text-[10px] text-emerald-400/90 shrink-0">
            info@natureislecareers.com
          </span>
        </div>
        <p className="line-clamp-2 text-slate-300">{displayedEmail.previewText}</p>

        {/* Matched Subscription Criteria Badges */}
        {isJobAlert && (relatedJob || matchedSub) && (
          <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
            {relatedJob && (
              <>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  <MapPin className="w-2.5 h-2.5" />
                  {relatedJob.parish}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-900/90 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30 truncate max-w-[170px]">
                  <Briefcase className="w-2.5 h-2.5 shrink-0" />
                  {relatedJob.sector}
                </span>
              </>
            )}
            {matchedSub?.keyword && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                <Search className="w-2.5 h-2.5" />
                &ldquo;{matchedSub.keyword}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Delivered to inbox</span>
          </span>
          {activeRulesCount > 0 && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400"
              title={`Monitoring ${activeRulesCount} active alert preference rule(s)`}
            >
              <Clock className="w-3 h-3 text-emerald-400" />
              {isPaused ? 'Paused' : `${activeRulesCount} rule${activeRulesCount > 1 ? 's' : ''} active`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {pendingMatches.length > 0 && (
            <button
              type="button"
              onClick={triggerNextQueuedMatch}
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Next ({pendingMatches.length})
            </button>
          )}

          {relatedJob && onSelectJob && (
            <button
              type="button"
              onClick={() => {
                onSelectJob(relatedJob);
                handleDismiss();
              }}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
            >
              <span>View Job</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-300 hover:text-white underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
