import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  verifyCandidateSkill,
  calculateVerifiedSkillsVisibilityBoost,
  generateFallbackQuestionsForSavedJob,
} from '../components/CandidateProfileHub';
import { ResumeBuilder } from '../components/ResumeBuilder';
import {
  generateContextualSkillSuggestions,
  fetchGeminiSkillSuggestions,
} from '../utils/skillSuggestionEngine';

describe('CandidateProfileHub Interview Prep & Verify Skills Features', () => {
  it('attaches links or descriptions to skills, generates Verified badge records, and boosts profile visibility', () => {
    const skills = ['React & TypeScript', 'Geothermal SCADA Protocols', 'PostgreSQL'];

    // Verify first skill with a link and description
    let map = verifyCandidateSkill(
      'React & TypeScript',
      {
        evidenceUrl: 'https://github.com/waitukubuli/scada-portal',
        evidenceDescription: 'Built production React telemetry dashboard for Roseau Valley.',
      },
      {}
    );

    expect(map['React & TypeScript']?.verified).toBe(true);
    expect(map['React & TypeScript']?.evidenceUrl).toBe(
      'https://github.com/waitukubuli/scada-portal'
    );
    expect(map['React & TypeScript']?.evidenceDescription).toContain('Roseau Valley');

    // Verify second skill with a description only
    map = verifyCandidateSkill(
      'Geothermal SCADA Protocols',
      {
        evidenceDescription: 'Certified in high-voltage wellhead telemetry at Laudat station.',
      },
      map
    );

    expect(map['Geothermal SCADA Protocols']?.verified).toBe(true);

    // Calling verifyCandidateSkill with empty evidence should not verify a skill
    map = verifyCandidateSkill('PostgreSQL', { evidenceUrl: '', evidenceDescription: '' }, map);
    expect(map['PostgreSQL']).toBeUndefined();

    const summary = calculateVerifiedSkillsVisibilityBoost(skills, map);
    expect(summary.verifiedCount).toBe(2);
    expect(summary.totalSkills).toBe(3);
    expect(summary.visibilityBoostPercent).toBe(30);
    expect(summary.visibilityTier).toContain('High Recruiter Visibility');
  });

  it('generates mock interview questions specific to the user saved job roles', () => {
    const savedJob = {
      id: 'job-saved-101',
      title: 'Senior Geothermal SCADA Engineer',
      company: 'Dominica Geothermal Development Co.',
      parish: 'St. George',
      sector: 'Renewable Energy & Geothermal',
      requirements: [
        '5+ years operating SCADA & PLC telemetry pipelines',
        'Experience with high-voltage substation safety in tropical climates',
      ],
      responsibilities: ['Lead real-time wellhead monitoring in Laudat'],
    };

    const questions = generateFallbackQuestionsForSavedJob(
      savedJob,
      ['Geothermal SCADA Protocols', 'React & TypeScript'],
      'Technical'
    );

    expect(questions.length).toBeGreaterThanOrEqual(4);
    expect(questions[0].jobId).toBe('job-saved-101');
    expect(questions[0].jobTitle).toBe('Senior Geothermal SCADA Engineer');
    expect(questions[0].company).toBe('Dominica Geothermal Development Co.');
    expect(questions[0].question).toContain('Senior Geothermal SCADA Engineer');
    expect(questions[0].question).toContain('Dominica Geothermal Development Co.');
    expect(questions[0].question).toContain('5+ years operating SCADA & PLC telemetry pipelines');
  });

  it('recommends relevant professional skills based on Experience job title and renders 1-click AI Skill Suggestion chips in ResumeBuilder', async () => {
    const devSuggestions = generateContextualSkillSuggestions({
      jobTitle: 'Senior Full-Stack Software Engineer',
      sector: 'Information Technology & Digital',
    });
    expect(devSuggestions.suggestedSkills.length).toBeGreaterThanOrEqual(6);
    expect(devSuggestions.suggestedSkills).toContain('TypeScript & JavaScript (ES6+)');

    const hospitalitySuggestions = await fetchGeminiSkillSuggestions({
      jobTitle: 'Eco-Resort Hospitality Operations Manager',
      sector: 'Eco-Tourism & Hospitality',
    });
    expect(hospitalitySuggestions.suggestedSkills.length).toBeGreaterThanOrEqual(6);
    expect(hospitalitySuggestions.suggestedSkills).toContain(
      'Discover Dominica Authority (DDA) Standards'
    );

    const html = renderToStaticMarkup(
      React.createElement(ResumeBuilder, {
        jobs: [],
      })
    );
    expect(html).toContain('experience-job-title-input-0');
    expect(html).toContain('suggest-skills-btn-0');
    expect(html).toContain('ai-skill-suggestions-panel-0');
    expect(html).toContain('add-all-suggested-skills-btn-0');
    expect(html).toContain('suggested-skill-chip-0-0');
  });
});

