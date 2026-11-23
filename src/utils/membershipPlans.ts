import { SubscriptionPlan } from '../types';

export interface MembershipPlanMeta {
  plan: SubscriptionPlan;
  shortLabel: string;
  priceXCD: number;
  quotaPostings: number;
  quotaLabel: string;
  remoteWorkEnabled: boolean;
  tagline: string;
  features: string[];
  recommended?: boolean;
}

export const EMPLOYER_MEMBERSHIP_PLANS: MembershipPlanMeta[] = [
  {
    plan: 'Standard Local Employer',
    shortLabel: 'Standard Local',
    priceXCD: 250,
    quotaPostings: 5,
    quotaLabel: '5 Active Job Vacancies / month',
    remoteWorkEnabled: false,
    tagline: 'For growing Dominica businesses hiring locally',
    features: [
      'Up to 5 active classified vacancies across Dominica',
      'Standard candidate dossier & resume review',
      'Automated parish & sector email alert broadcasts',
      'Official DSS & VAT corporate tax invoice receipting',
    ],
  },
  {
    plan: 'Enterprise Growth Partner',
    shortLabel: 'Enterprise Partner',
    priceXCD: 650,
    quotaPostings: 999,
    quotaLabel: 'Unlimited Job & Remote Vacancies',
    remoteWorkEnabled: true,
    tagline: 'For resorts, banks, utilities & WIN remote sponsors',
    recommended: true,
    features: [
      'Unlimited active classified & WIN remote assignments',
      'Direct interview scheduler & E2E candidate messaging',
      'Candidate skill-gap heatmap & verified credentials suite',
      'Dedicated Dominica employer verification badge',
    ],
  },
  {
    plan: 'NEP Partner Tier',
    shortLabel: 'NEP Host Tier',
    priceXCD: 180,
    quotaPostings: 15,
    quotaLabel: '15 NEP Apprentice Vacancies / month',
    remoteWorkEnabled: true,
    tagline: 'Subsidized tier for National Employment Programme hosts',
    features: [
      'Up to 15 NEP-accredited trainee & graduate listings',
      'Government wage subsidy compliance reporting',
      'Priority Dominica State College graduate pipeline',
      'Verified NEP partner status & DSS tax documentation',
    ],
  },
];

export function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return (
    value === 'Standard Local Employer' ||
    value === 'Enterprise Growth Partner' ||
    value === 'NEP Partner Tier'
  );
}

export function getMembershipPlanDetails(planName?: string): MembershipPlanMeta {
  const normalized = (planName || '').toLowerCase();
  if (normalized.includes('enterprise') || normalized.includes('growth')) {
    return EMPLOYER_MEMBERSHIP_PLANS[1];
  }
  if (normalized.includes('nep')) {
    return EMPLOYER_MEMBERSHIP_PLANS[2];
  }
  if (normalized.includes('standard')) {
    return EMPLOYER_MEMBERSHIP_PLANS[0];
  }
  return EMPLOYER_MEMBERSHIP_PLANS[0];
}
