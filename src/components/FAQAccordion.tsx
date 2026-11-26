import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export type FaqTopic = 'all' | 'job_postings' | 'salary_negotiation' | 'work_permits';

export interface FooterFaqItem {
  id: string;
  topic: Exclude<FaqTopic, 'all'>;
  topicLabel: string;
  question: string;
  answer: string;
}

export const FOOTER_FAQ_ITEMS: FooterFaqItem[] = [
  {
    id: 'how-to-post-a-job',
    topic: 'job_postings',
    topicLabel: 'Job Postings',
    question: 'How do I post a job?',
    answer:
      'Create an Employer account with your Dominica Social Security (DSS) registration number, open the Employer Command Center, and select Post Vacancy or Remote / WIN Contract. Choose a membership tier (Standard, Enterprise, or Remote), enter your EC$ salary band and parish, and publish immediately after checkout.',
  },
  {
    id: 'job-posting-verification',
    topic: 'job_postings',
    topicLabel: 'Job Postings',
    question: 'How are job postings verified and how long do vacancies stay active?',
    answer:
      'Every employer organization registers with its DSS employer reference before publishing vacancies. Approved job postings remain active island-wide for 30 days and can be renewed directly from the Employer Command Center.',
  },
  {
    id: 'how-salary-negotiation-works-dominica',
    topic: 'salary_negotiation',
    topicLabel: 'Salary Negotiation',
    question: 'How does salary negotiation work in Dominica?',
    answer:
      'Local salaries across Dominica are quoted in Eastern Caribbean Dollars (EC$ / XCD) anchored at the fixed EC$ 2.70 to US$ 1.00 peg. Candidates typically benchmark offers against Parish Salary Trends (such as Roseau / St. George vs. Portsmouth / St. John rates) and negotiate both base pay within the listed EC$ band and allowances such as transport, housing, and DSS-covered benefits.',
  },
  {
    id: 'salary-negotiation-bands',
    topic: 'salary_negotiation',
    topicLabel: 'Salary Negotiation',
    question: 'Are posted EC$ salary ranges negotiable for specialist or CSME roles?',
    answer:
      'Most employers list a target compensation band reflecting entry-to-senior readiness. Highlighting specialized credentials—such as geothermal SCADA certifications, PADI leadership, or CARICOM CSME Skills accreditation—provides concrete leverage when discussing starting placement within the band or a 90-day performance review.',
  },
  {
    id: 'dominica-work-permit-requirements',
    topic: 'work_permits',
    topicLabel: 'Dominica Work Permits',
    question: 'What are the requirements for a Dominica work permit?',
    answer:
      'Non-Dominican nationals employed by a local Dominican entity generally require a Ministry of Labour work permit sponsored by the hiring employer. Standard requirements include a valid passport, a signed job offer showing local recruitment compliance, police clearance certificate, medical fitness certificate, proof of qualifications, DSS employer registration, and the statutory work permit fee—unless exempt under a CARICOM CSME Skills Certificate.',
  },
  {
    id: 'work-permits-win-visa',
    topic: 'work_permits',
    topicLabel: 'Dominica Work Permits',
    question: 'Does the Work In Nature (WIN) Extended Stay Visa cover local Dominica employment?',
    answer:
      'Dominica’s 18-month Work In Nature (WIN) Extended Stay Visa authorizes remote professionals and digital entrepreneurs to reside across the island while working for clients or employers outside Dominica. Taking salaried employment directly with a local Dominican entity still requires a standard work permit or CSME Skills Certificate.',
  },
];

export const FAQ_TOPICS: { id: FaqTopic; label: string }[] = [
  { id: 'all', label: 'All Topics' },
  { id: 'job_postings', label: 'Job Postings' },
  { id: 'salary_negotiation', label: 'Salary Negotiation' },
  { id: 'work_permits', label: 'Dominica Work Permits' },
];

export function filterFaqsByTopic(topic: FaqTopic): FooterFaqItem[] {
  return topic === 'all'
    ? FOOTER_FAQ_ITEMS
    : FOOTER_FAQ_ITEMS.filter((item) => item.topic === topic);
}

export function getNextAccordionOpenId(
  currentOpenId: string | null,
  clickedId: string
): string | null {
  return currentOpenId === clickedId ? null : clickedId;
}

export interface FAQAccordionProps {
  items?: FooterFaqItem[];
  defaultOpenId?: string | null;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items = FOOTER_FAQ_ITEMS,
  defaultOpenId = items[0]?.id ?? null,
}) => {
  const [activeTopic, setActiveTopic] = useState<FaqTopic>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(defaultOpenId);

  const visibleFaqs =
    items === FOOTER_FAQ_ITEMS
      ? filterFaqsByTopic(activeTopic)
      : activeTopic === 'all'
      ? items
      : items.filter((item) => item.topic === activeTopic);

  const handleSelectTopic = (topic: FaqTopic) => {
    setActiveTopic(topic);
    const nextList =
      items === FOOTER_FAQ_ITEMS
        ? filterFaqsByTopic(topic)
        : topic === 'all'
        ? items
        : items.filter((item) => item.topic === topic);
    setOpenFaqId(nextList[0]?.id ?? null);
  };

  const toggleFaqItem = (id: string) => {
    setOpenFaqId((prev) => getNextAccordionOpenId(prev, id));
  };

  return (
    <section
      aria-labelledby="footer-faq-heading"
      data-testid="footer-faq-section"
      className="mt-10 pt-8 border-t border-stone-800/80"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Candidate &amp; Employer Guidance</span>
          </div>
          <h2
            id="footer-faq-heading"
            className="text-lg font-bold text-white tracking-tight font-display"
          >
            Frequently Asked Questions
          </h2>
          <p className="text-stone-400 text-xs leading-relaxed">
            Clear answers covering DSS-verified job postings, EC$ salary negotiation across
            Dominica, and Ministry of Labour work permit requirements.
          </p>

          <div
            role="group"
            aria-label="Filter FAQ by topic"
            className="flex flex-wrap gap-1.5 pt-1"
          >
            {FAQ_TOPICS.map((topic) => {
              const isActive = activeTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  data-testid={`footer-faq-filter-${topic.id}`}
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isActive
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-800/70 text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          data-testid="footer-faq-accordion"
          className="lg:col-span-8 divide-y divide-stone-800 border-t border-b border-stone-800"
        >
          {visibleFaqs.map((item) => {
            const isExpanded = openFaqId === item.id;
            const triggerId = `footer-faq-trigger-${item.id}`;
            const panelId = `footer-faq-panel-${item.id}`;

            return (
              <div key={item.id} className="py-1">
                <h3>
                  <button
                    type="button"
                    id={triggerId}
                    data-testid={`footer-faq-trigger-${item.id}`}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleFaqItem(item.id)}
                    className="w-full py-3.5 px-1 flex items-center justify-between gap-4 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="block text-[11px] font-medium text-emerald-400">
                        {item.topicLabel}
                      </span>
                      <span className="block text-sm font-semibold text-stone-100 group-hover:text-white transition-colors">
                        {item.question}
                      </span>
                    </div>
                    <ChevronDown
                      aria-hidden="true"
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
                        isExpanded
                          ? 'rotate-180 text-emerald-400'
                          : 'text-stone-400 group-hover:text-stone-200'
                      }`}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  data-testid={`footer-faq-panel-${item.id}`}
                  hidden={!isExpanded}
                  className="pb-4 px-1 text-xs text-stone-300 leading-relaxed max-w-3xl"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
