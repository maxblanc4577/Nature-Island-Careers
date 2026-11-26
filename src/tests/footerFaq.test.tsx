import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  FAQAccordion,
  FOOTER_FAQ_ITEMS,
  FAQ_TOPICS,
  filterFaqsByTopic,
  getNextAccordionOpenId,
} from '../components/FAQAccordion';
import {
  Footer,
  NEWSLETTER_SUBSCRIPTIONS_STORAGE_KEY,
  loadNewsletterSubscriptions,
  saveNewsletterSubscription,
} from '../components/Footer';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('FAQAccordion & Footer Integration', () => {
  it('renders standalone FAQAccordion with the three required Dominica questions', () => {
    const html = renderToStaticMarkup(<FAQAccordion />);

    expect(html).toContain('data-testid="footer-faq-section"');
    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('How do I post a job?');
    expect(html).toContain('How does salary negotiation work in Dominica?');
    expect(html).toContain('What are the requirements for a Dominica work permit?');

    FAQ_TOPICS.forEach((topic) => {
      expect(html).toContain(`data-testid="footer-faq-filter-${topic.id}"`);
      expect(html).toContain(topic.label);
    });

    FOOTER_FAQ_ITEMS.forEach((item, index) => {
      expect(html).toContain(`data-testid="footer-faq-trigger-${item.id}"`);
      expect(html).toContain(`data-testid="footer-faq-panel-${item.id}"`);
      expect(html).toContain(item.answer);
      expect(html).toContain(`aria-controls="footer-faq-panel-${item.id}"`);
      expect(html).toContain(
        `id="footer-faq-trigger-${item.id}" data-testid="footer-faq-trigger-${item.id}" aria-expanded="${
          index === 0 ? 'true' : 'false'
        }"`
      );
    });
  });

  it('integrates FAQAccordion and Newsletter Signup Form inside Footer', () => {
    const html = renderToStaticMarkup(
      <Footer onOpenAlert={() => {}} onOpenFeedback={() => {}} />
    );

    expect(html).toContain('data-testid="footer-faq-section"');
    expect(html).toContain('How do I post a job?');
    expect(html).toContain('How does salary negotiation work in Dominica?');
    expect(html).toContain('What are the requirements for a Dominica work permit?');

    expect(html).toContain('data-testid="footer-newsletter-section"');
    expect(html).toContain('data-testid="footer-newsletter-form"');
    expect(html).toContain('data-testid="footer-newsletter-email-input"');
    expect(html).toContain('data-testid="footer-newsletter-submit-btn"');

    const footerSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/Footer.tsx'),
      'utf8'
    );
    expect(footerSrc).toContain("from './FAQAccordion'");
    expect(footerSrc).toContain('<FAQAccordion />');
    expect(footerSrc).toContain('data-testid="footer-newsletter-toast"');
  });

  it('covers job postings, salary negotiation, and Dominica work permits across topics', () => {
    const jobPostings = filterFaqsByTopic('job_postings');
    const salaryNegotiation = filterFaqsByTopic('salary_negotiation');
    const workPermits = filterFaqsByTopic('work_permits');

    expect(jobPostings.length).toBeGreaterThanOrEqual(2);
    expect(salaryNegotiation.length).toBeGreaterThanOrEqual(2);
    expect(workPermits.length).toBeGreaterThanOrEqual(2);
    expect(filterFaqsByTopic('all').length).toBe(
      jobPostings.length + salaryNegotiation.length + workPermits.length
    );

    expect(workPermits.some((q) => q.question === 'What are the requirements for a Dominica work permit?')).toBe(true);
    expect(salaryNegotiation.some((q) => q.question === 'How does salary negotiation work in Dominica?')).toBe(true);
    expect(jobPostings.some((q) => q.question === 'How do I post a job?')).toBe(true);
  });

  it('toggles accordion items cleanly between expanded and collapsed states', () => {
    const firstId = FOOTER_FAQ_ITEMS[0].id;
    const secondId = FOOTER_FAQ_ITEMS[1].id;

    expect(getNextAccordionOpenId(firstId, firstId)).toBeNull();
    expect(getNextAccordionOpenId(firstId, secondId)).toBe(secondId);
    expect(getNextAccordionOpenId(null, secondId)).toBe(secondId);
  });
});

describe('Footer Newsletter Signup & LocalStorage Subscription List', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
  });

  it('validates email addresses and persists subscriptions to localStorage without duplicates', () => {
    const invalidRes = saveNewsletterSubscription('not-an-email');
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toContain('valid email');
    expect(loadNewsletterSubscriptions()).toHaveLength(0);

    const firstRes = saveNewsletterSubscription('  Elena.Henderson@Waitukubuli.dm ');
    expect(firstRes.success).toBe(true);
    expect(firstRes.alreadySubscribed).toBe(false);
    expect(firstRes.subscription?.email).toBe('elena.henderson@waitukubuli.dm');

    const storedRaw = globalThis.localStorage.getItem(NEWSLETTER_SUBSCRIPTIONS_STORAGE_KEY);
    expect(storedRaw).toBeTruthy();
    expect(loadNewsletterSubscriptions()).toHaveLength(1);

    const dupRes = saveNewsletterSubscription('elena.henderson@waitukubuli.dm');
    expect(dupRes.success).toBe(true);
    expect(dupRes.alreadySubscribed).toBe(true);
    expect(loadNewsletterSubscriptions()).toHaveLength(1);

    const secondRes = saveNewsletterSubscription('career.lead@roseau.dm');
    expect(secondRes.success).toBe(true);
    expect(loadNewsletterSubscriptions()).toHaveLength(2);
  });
});
