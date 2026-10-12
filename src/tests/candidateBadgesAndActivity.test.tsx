import { describe, it, expect } from 'vitest';
import {
  calculateCandidateProfileBadges,
  buildCandidateRecentActivityFeed,
} from '../components/CandidateProfileHub';

describe('CandidateProfileHub Gamified Badges & Recent Activity Feed', () => {
  it('unlocks Profile Pioneer for initial details and Skill Master for 5+ skills', () => {
    const initialLocked = calculateCandidateProfileBadges({
      name: 'Max',
      email: '',
      phone: '',
      parish: '',
      headline: '',
      bio: '',
      skills: ['React', 'TypeScript'],
      experience: [],
      education: [],
    });

    const pioneerLocked = initialLocked.badges.find((b) => b.id === 'profile_pioneer');
    const skillMasterLocked = initialLocked.badges.find((b) => b.id === 'skill_master');
    expect(pioneerLocked?.unlocked).toBe(false);
    expect(skillMasterLocked?.unlocked).toBe(false);

    const unlockedResult = calculateCandidateProfileBadges({
      name: 'Max Blanc',
      email: 'maxblanc4577@gmail.com',
      phone: '+1 (767) 275-4577',
      parish: 'St. George',
      headline: 'Senior Cloud Engineer',
      bio: 'Experienced Dominican cloud engineer building geothermal telemetry systems.',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'SCADA'],
      experience: [
        {
          id: 'exp-1',
          title: 'Lead Engineer',
          company: 'DOMLEC',
          location: 'Roseau',
          startDate: '2022',
          endDate: 'Present',
          isCurrent: true,
          highlights: ['Led grid telemetry'],
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'Dominica State College',
          degree: 'B.Sc. Computer Science',
          field: 'IT',
          location: 'Roseau',
          graduationYear: '2020',
        },
      ],
      resumeFileName: 'Max_Blanc_CV.pdf',
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    const pioneerUnlocked = unlockedResult.badges.find((b) => b.id === 'profile_pioneer');
    const skillMasterUnlocked = unlockedResult.badges.find((b) => b.id === 'skill_master');
    const allStarUnlocked = unlockedResult.badges.find((b) => b.id === 'nature_island_all_star');

    expect(pioneerUnlocked?.unlocked).toBe(true);
    expect(skillMasterUnlocked?.unlocked).toBe(true);
    expect(allStarUnlocked?.unlocked).toBe(true);
    expect(unlockedResult.unlockedCount).toBe(7);
  });

  it('builds Recent Activity feed displaying Profile updated, Application sent to X company, and Interview scheduled events', () => {
    const badgeSummary = calculateCandidateProfileBadges({
      name: 'Max Blanc',
      email: 'maxblanc4577@gmail.com',
      phone: '+1 (767) 275-4577',
      parish: 'St. George',
      headline: 'Senior Cloud Engineer',
      bio: 'Experienced Dominican cloud engineer building geothermal telemetry systems.',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'SCADA'],
      experience: [],
      education: [],
    });

    const feed = buildCandidateRecentActivityFeed({
      applications: [
        {
          id: 'app-1',
          jobId: 'job-101',
          jobTitle: 'Senior Guest Experience Manager',
          companyName: 'Fort Young Hotel & Dive Resort',
          status: 'Interview Scheduled',
          parish: 'St. George',
          appliedAt: '2026-09-24',
          interviewDetails: {
            date: 'Wednesday, Oct 7, 2026',
            time: '02:00 PM AST',
            mode: 'In-person',
          },
        },
      ],
      jobs: [
        {
          id: 'job-101',
          title: 'Senior Guest Experience Manager',
          company: 'Fort Young Hotel & Dive Resort',
          parish: 'St. George',
          workModel: 'On-site',
        },
      ],
      name: 'Max Blanc',
      headline: 'Senior Cloud Engineer',
      completionPercentage: 85,
      skillsCount: 5,
      badges: badgeSummary.badges,
    });

    const titles = feed.map((e) => e.title);
    expect(titles.some((t) => /Profile updated/i.test(t))).toBe(true);
    expect(
      titles.some((t) => /Application sent to Fort Young Hotel & Dive Resort/i.test(t))
    ).toBe(true);
    expect(
      titles.some((t) => /Interview scheduled with Fort Young Hotel & Dive Resort/i.test(t))
    ).toBe(true);
  });
});
