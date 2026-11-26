import React, { useState, useEffect } from 'react';
import { Parish } from '../types';
import {
  ShieldCheck,
  Mail,
  Compass,
  BookOpen,
  BarChart3,
  Palette,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { isValidEmail } from '../utils/paymentValidation';
import {
  FAQAccordion,
  FOOTER_FAQ_ITEMS,
  FAQ_TOPICS,
  filterFaqsByTopic,
  getNextAccordionOpenId,
  type FaqTopic,
  type FooterFaqItem,
} from './FAQAccordion';

export {
  FAQAccordion,
  FOOTER_FAQ_ITEMS,
  FAQ_TOPICS,
  filterFaqsByTopic,
  getNextAccordionOpenId,
  type FaqTopic,
  type FooterFaqItem,
};

export const NEWSLETTER_SUBSCRIPTIONS_STORAGE_KEY = 'natureisland_newsletter_subscriptions';

export interface NewsletterSubscription {
  id: string;
  email: string;
  subscribedAt: string;
}

export function loadNewsletterSubscriptions(): NewsletterSubscription[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(NEWSLETTER_SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is NewsletterSubscription =>
        Boolean(entry) &&
        typeof entry.id === 'string' &&
        typeof entry.email === 'string' &&
        typeof entry.subscribedAt === 'string'
    );
  } catch {
    return [];
  }
}

export function saveNewsletterSubscription(rawEmail: string): {
  success: boolean;
  alreadySubscribed: boolean;
  subscription?: NewsletterSubscription;
  subscriptions: NewsletterSubscription[];
  error?: string;
} {
  const cleanEmail = rawEmail.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      alreadySubscribed: false,
      subscriptions: loadNewsletterSubscriptions(),
      error: 'Please enter a valid email address.',
    };
  }

  const existingList = loadNewsletterSubscriptions();
  const duplicate = existingList.find((item) => item.email.toLowerCase() === cleanEmail);
  if (duplicate) {
    return {
      success: true,
      alreadySubscribed: true,
      subscription: duplicate,
      subscriptions: existingList,
    };
  }

  const nextItem: NewsletterSubscription = {
    id: `nl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: cleanEmail,
    subscribedAt: new Date().toISOString(),
  };

  const updated = [nextItem, ...existingList];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NEWSLETTER_SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore storage quota errors
  }

  return {
    success: true,
    alreadySubscribed: false,
    subscription: nextItem,
    subscriptions: updated,
  };
}

interface FooterProps {
  onSelectParish?: (p: Parish) => void;
  onOpenAlert: () => void;
  onOpenFeedback: () => void;
  onOpenAdminPortal?: () => void;
  onOpenCareerGuide?: () => void;
  onOpenSalaryTrends?: () => void;
  onOpenEmployerPortal?: () => void;
  onOpenBrandStudio?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectParish: _onSelectParish,
  onOpenAlert,
  onOpenFeedback,
  onOpenAdminPortal,
  onOpenCareerGuide,
  onOpenSalaryTrends,
  onOpenEmployerPortal: _onOpenEmployerPortal,
  onOpenBrandStudio,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscription[]>(() =>
    loadNewsletterSubscriptions()
  );
  const [newsletterToast, setNewsletterToast] = useState<{
    email: string;
    alreadySubscribed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!newsletterToast) return;
    const timer = window.setTimeout(() => {
      setNewsletterToast(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [newsletterToast]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);

    const result = saveNewsletterSubscription(newsletterEmail);
    if (!result.success || !result.subscription) {
      setNewsletterError(result.error || 'Please enter a valid email address.');
      return;
    }

    setSubscribers(result.subscriptions);
    setNewsletterEmail('');
    setNewsletterToast({
      email: result.subscription.email,
      alreadySubscribed: result.alreadySubscribed,
    });
  };

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {/* Col 1: Wordmark & About */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <BrandLogo variant="footer" />
            <p className="text-stone-400 text-xs leading-relaxed">
              Dominica’s premier job classified board and career portal. Dedicated to sustainable
              employment, geothermal energy, eco-tourism, and community development across the
              Commonwealth of Dominica.
            </p>
            <div className="pt-1">
              <a
                href="mailto:info@natureislecareers.com"
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>info@natureislecareers.com</span>
              </a>
            </div>
            <div className="pt-2 text-[11px] text-stone-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compliant with Dominica Labour Standards</span>
            </div>
            {onOpenBrandStudio && (
              <div className="pt-2">
                <button
                  type="button"
                  data-testid="footer-brand-studio-btn"
                  onClick={onOpenBrandStudio}
                  className="inline-flex items-center gap-1.5 text-stone-300 hover:text-amber-300 transition-colors cursor-pointer text-xs font-semibold"
                >
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Brand Kit &amp; Social Mockups</span>
                </button>
              </div>
            )}
          </div>

          {/* Col 2: Dominican Programmes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Dominican Programmes
            </h3>
            <p className="text-stone-400 text-xs leading-relaxed">
              NEP Apprenticeships, DSS Social Security Registration, and CARICOM CSME Free Movement
              accreditation across Waitukubuli.
            </p>
          </div>

          {/* Col 3: Alerts & Notifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Stay Informed &amp; Alerts
            </h3>
            <p className="text-stone-400 leading-relaxed text-xs">
              Configure real-time automated email alerts for new positions in your parish and
              industry.
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onOpenAlert}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                <span>Configure Email Alerts</span>
              </button>

              <button
                type="button"
                onClick={onOpenFeedback}
                className="w-full text-center py-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                Submit Platform Feedback
              </button>
            </div>
          </div>

          {/* Col 4: Parish Salary Trends */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Parish Salary Trends</span>
            </h3>
            <p className="text-stone-400 leading-relaxed text-xs">
              Statutory wage baselines, cost-of-living indices, and compensation percentiles across
              all 10 parishes.
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
                  • Geothermal &amp; Renewable Energy
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
                  • Eco-Tourism &amp; Hospitality Tracks
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
                  • Dominica Resume &amp; Interview Prep
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup Band */}
        <section
          aria-labelledby="footer-newsletter-heading"
          data-testid="footer-newsletter-section"
          className="mt-10 pt-8 border-t border-stone-800/80"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            <div className="lg:col-span-5 space-y-1.5">
              <h2
                id="footer-newsletter-heading"
                className="text-base font-bold text-white tracking-tight font-display"
              >
                Dominica Career &amp; Vacancy Newsletter
              </h2>
              <p className="text-stone-400 text-xs leading-relaxed">
                Receive weekly digests on new parish job openings, EC$ salary benchmarks, and
                Ministry of Labour updates.
              </p>
              {subscribers.length > 0 && (
                <p
                  data-testid="footer-newsletter-count"
                  className="text-[11px] text-emerald-400 tabular-nums"
                >
                  {subscribers.length} saved local{' '}
                  {subscribers.length === 1 ? 'subscription' : 'subscriptions'}
                </p>
              )}
            </div>

            <div className="lg:col-span-7">
              <form
                onSubmit={handleNewsletterSubmit}
                data-testid="footer-newsletter-form"
                className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center"
                noValidate
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address for newsletter
                </label>
                <input
                  id="footer-newsletter-email"
                  data-testid="footer-newsletter-email-input"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterError) setNewsletterError(null);
                  }}
                  placeholder="you@example.dm"
                  required
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  data-testid="footer-newsletter-submit-btn"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Subscribe</span>
                </button>
              </form>
              {newsletterError && (
                <p
                  role="alert"
                  data-testid="footer-newsletter-error"
                  className="mt-2 text-xs text-rose-400"
                >
                  {newsletterError}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Integrated FAQAccordion Component */}
        <FAQAccordion />

        {/* Bottom copyright & regional notice */}
        <div className="mt-8 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-3">
          <div>
            © {new Date().getFullYear()} Nature Island Careers · Commonwealth of Dominica. All rights
            reserved.
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span>Commonwealth of Dominica (Waitukubuli)</span>
            <span>·</span>
            <span>DSS &amp; NEP Accredited</span>
            {onOpenAdminPortal && (
              <>
                <span className="text-stone-700">·</span>
                <a
                  href="/admin-login"
                  data-testid="discreet-admin-footer-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenAdminPortal();
                  }}
                  className="text-stone-600 hover:text-stone-400 transition-colors cursor-pointer text-[10px] font-normal tracking-tight"
                >
                  Admin Console
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Newsletter Subscription Success Toast */}
      {newsletterToast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="footer-newsletter-toast"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-emerald-950 text-white border border-emerald-700 rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs min-w-0">
            <p className="font-semibold text-white">
              {newsletterToast.alreadySubscribed
                ? 'Already Subscribed'
                : 'Subscribed to Newsletter'}
            </p>
            <p className="text-emerald-200 break-words">
              {newsletterToast.alreadySubscribed
                ? `${newsletterToast.email} is already on the subscription list.`
                : `${newsletterToast.email} has been added to your local subscription list.`}
            </p>
          </div>
          <button
            type="button"
            data-testid="footer-newsletter-toast-close"
            onClick={() => setNewsletterToast(null)}
            aria-label="Dismiss newsletter notification"
            className="text-emerald-300 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </footer>
  );
};
