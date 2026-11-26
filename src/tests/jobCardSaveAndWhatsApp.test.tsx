import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { JobProvider } from '../context/JobContext';
import { JobCard } from '../components/JobCard';
import { buildShareViaWhatsAppUrl, buildJobShareUrl } from '../components/ShareJobModal';
import { JobListing } from '../types';

const sampleJob: JobListing = {
  id: 'job-whatsapp-burst-1',
  title: 'Geothermal Plant Technician',
  company: 'Dominica Geothermal Development Co.',
  parish: 'St. George',
  locality: 'Laudat, Roseau Valley',
  sector: 'Renewable Energy & Geothermal',
  employmentType: 'Full-Time',
  workModel: 'On-site',
  minSalary: 5200,
  maxSalary: 7800,
  salaryPeriod: 'month',
  isNepApproved: false,
  featured: true,
  description: 'Operate and maintain clean geothermal steam turbines in Laudat.',
  responsibilities: ['Monitor turbine pressure', 'Inspect wellhead valves'],
  requirements: ['Diploma in Mechanical Engineering'],
  benefits: ['Medical insurance', 'Safety gear allowance'],
  screeningQuestions: [],
  contactEmail: 'hr@geothermaldominica.dm',
  applicationDeadline: '2026-12-31',
  postedAt: '2026-11-20',
  viewsCount: 61,
  applicantsCount: 5,
  recruiterId: 'rec_geo_1',
};

describe('JobCard Heart-Burst Save Animation & Share via WhatsApp Button', () => {
  it('renders Share via WhatsApp link with pre-filled job title and deep link to job detail view', () => {
    const html = renderToStaticMarkup(
      <JobProvider>
        <JobCard job={sampleJob} onSelect={() => {}} onApply={() => {}} />
      </JobProvider>
    );

    expect(html).toContain(`data-testid="share-via-whatsapp-btn-${sampleJob.id}"`);
    expect(html).toContain('aria-label="Share via WhatsApp"');
    expect(html).toContain('Share via WhatsApp');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');

    const expectedTitle = encodeURIComponent(sampleJob.title);
    const expectedJobUrl = encodeURIComponent(buildJobShareUrl(sampleJob.id));
    expect(html).toContain(`https://wa.me/?text=`);
    expect(html).toContain(expectedTitle);
    expect(html).toContain(expectedJobUrl);
  });

  it('builds Share via WhatsApp URL containing exact job title and specific ?job= detail URL', () => {
    const customUrl = buildJobShareUrl(sampleJob.id, 'https://natureislandcareers.com/');
    expect(customUrl).toBe('https://natureislandcareers.com/?job=job-whatsapp-burst-1');

    const waUrl = buildShareViaWhatsAppUrl(sampleJob, customUrl);
    expect(waUrl.startsWith('https://wa.me/?text=')).toBe(true);
    const decodedMessage = decodeURIComponent(waUrl.replace('https://wa.me/?text=', ''));
    expect(decodedMessage).toContain(sampleJob.title);
    expect(decodedMessage).toContain(sampleJob.company);
    expect(decodedMessage).toContain(customUrl);
  });

  it('implements heart-burst ring/spark keyframes in index.css and replayable burst overlay on JobCard Save button', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toContain('@keyframes heart-burst-ring');
    expect(css).toContain('@keyframes heart-burst-spark');
    expect(css).toContain('.animate-heart-burst-ring');
    expect(css).toContain('.animate-heart-burst-spark');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');

    const jobCardSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/JobCard.tsx'), 'utf8');
    expect(jobCardSrc).toContain('saveBurstKey');
    expect(jobCardSrc).toContain('data-testid={`save-job-burst-${job.id}`}');
    expect(jobCardSrc).toContain('animate-heart-burst-ring');
    expect(jobCardSrc).toContain('animate-heart-burst-spark');
    expect(jobCardSrc).toContain('animate-heartbeat-burst');
  });
});
