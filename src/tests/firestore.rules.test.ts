import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JobProvider } from '../context/JobContext';
import { AuthModal } from '../components/AuthModal';
import { Header } from '../components/Header';
import { MobilePlatformViews } from '../components/MobilePlatformViews';
import { JobCard } from '../components/JobCard';
import { INITIAL_JOBS } from '../data/mockData';
import {
  sanitizeUserProfileForFirestore,
  USER_PROFILE_CONSTRAINTS,
  OperationType,
  handleFirestoreError,
  sendFirebasePasswordReset,
  googleProvider,
  githubProvider,
} from '../firebase';
import { evaluatePasswordStrength } from '../utils/passwordStrength';
import { UserAccount } from '../types';
import fs from 'node:fs';
import path from 'node:path';

// Pure evaluator mirroring firestore.rules for the Dirty Dozen payload verification
interface RuleEvalContext {
  auth: {
    uid: string;
    email_verified: boolean;
  } | null;
  requestTime: string;
}

function evaluateUserProfileRules(
  op: 'get' | 'list' | 'create' | 'update' | 'delete',
  userIdParam: string,
  ctx: RuleEvalContext,
  incomingData?: Record<string, any>,
  existingData?: Record<string, any>
): 'ALLOWED' | 'PERMISSION_DENIED' {
  const isSignedIn = ctx.auth !== null;
  const isVerifiedUser = isSignedIn && ctx.auth?.email_verified === true;
  const isValidId =
    typeof userIdParam === 'string' &&
    userIdParam.length >= 1 &&
    userIdParam.length <= 128 &&
    /^[a-zA-Z0-9_\-]+$/.test(userIdParam);
  const isOwner = isVerifiedUser && ctx.auth?.uid === userIdParam;

  if (op === 'list') {
    return 'PERMISSION_DENIED';
  }
  if (op === 'get' || op === 'delete') {
    return isOwner && isValidId ? 'ALLOWED' : 'PERMISSION_DENIED';
  }

  if (!incomingData || !isOwner || !isValidId) {
    return 'PERMISSION_DENIED';
  }

  const requiredKeys = [
    'uid',
    'email',
    'name',
    'accountType',
    'parish',
    'createdAt',
    'updatedAt',
  ];
  const allowedKeys = new Set([
    ...requiredKeys,
    'phone',
    'companyName',
    'dssRegistrationNo',
    'careerSector',
    'skills',
  ]);

  const incomingKeys = Object.keys(incomingData);
  const hasAllRequired = requiredKeys.every((k) => incomingKeys.includes(k));
  const hasOnlyAllowed = incomingKeys.every((k) => allowedKeys.has(k));
  if (!hasAllRequired || !hasOnlyAllowed) {
    return 'PERMISSION_DENIED';
  }

  if (
    typeof incomingData.uid !== 'string' ||
    incomingData.uid !== ctx.auth?.uid ||
    incomingData.uid.length < 1 ||
    incomingData.uid.length > 128 ||
    !/^[a-zA-Z0-9_\-]+$/.test(incomingData.uid)
  ) {
    return 'PERMISSION_DENIED';
  }

  if (
    typeof incomingData.email !== 'string' ||
    incomingData.email.length < 3 ||
    incomingData.email.length > 160
  ) {
    return 'PERMISSION_DENIED';
  }

  if (
    typeof incomingData.name !== 'string' ||
    incomingData.name.length < 2 ||
    incomingData.name.length > 120
  ) {
    return 'PERMISSION_DENIED';
  }

  if (
    incomingData.accountType !== 'candidate' &&
    incomingData.accountType !== 'employer'
  ) {
    return 'PERMISSION_DENIED';
  }

  if (
    typeof incomingData.parish !== 'string' ||
    incomingData.parish.length < 2 ||
    incomingData.parish.length > 64
  ) {
    return 'PERMISSION_DENIED';
  }

  if (
    'skills' in incomingData &&
    (!Array.isArray(incomingData.skills) ||
      incomingData.skills.length > 10 ||
      (incomingData.skills.length > 0 &&
        (typeof incomingData.skills[0] !== 'string' ||
          incomingData.skills[0].length > 80)))
  ) {
    return 'PERMISSION_DENIED';
  }

  if (op === 'create') {
    if (
      incomingData.createdAt !== ctx.requestTime ||
      incomingData.updatedAt !== ctx.requestTime
    ) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  if (op === 'update') {
    if (!existingData) return 'PERMISSION_DENIED';
    if (
      incomingData.uid !== existingData.uid ||
      incomingData.email !== existingData.email ||
      incomingData.accountType !== existingData.accountType ||
      incomingData.createdAt !== existingData.createdAt ||
      incomingData.updatedAt !== ctx.requestTime
    ) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  return 'PERMISSION_DENIED';
}

describe('Firestore Security Rules & Employer/Candidate Account Management', () => {
  const validTimestamp = '2026-10-12T05:00:00Z';
  const validCtx: RuleEvalContext = {
    auth: { uid: 'user_123', email_verified: true },
    requestTime: validTimestamp,
  };

  const baseValidPayload = {
    uid: 'user_123',
    email: 'elena@waitukubuli.dm',
    name: 'Elena Henderson',
    accountType: 'candidate',
    parish: 'St. George',
    createdAt: validTimestamp,
    updatedAt: validTimestamp,
  };

  beforeEach(() => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };
  });

  it('verifies firestore.rules file contains all Eight Pillars and strict UserProfile blueprint checks', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain('allow read, write: if false;');
    expect(rulesContent).toContain('request.auth.token.email_verified == true');
    expect(rulesContent).toContain('isValidUserProfile(incoming())');
    expect(rulesContent).toContain('allow list: if false;');
  });

  it('rejects all 12 Dirty Dozen adversarial payloads with PERMISSION_DENIED', () => {
    // 1. Identity Spoofing on Create
    expect(
      evaluateUserProfileRules('create', 'victim_999', validCtx, {
        ...baseValidPayload,
        uid: 'victim_999',
      })
    ).toBe('PERMISSION_DENIED');

    // 2. Unverified Email Write
    expect(
      evaluateUserProfileRules(
        'create',
        'user_123',
        { auth: { uid: 'user_123', email_verified: false }, requestTime: validTimestamp },
        baseValidPayload
      )
    ).toBe('PERMISSION_DENIED');

    // 3. Privilege Escalation / Role Spoofing
    expect(
      evaluateUserProfileRules('create', 'user_123', validCtx, {
        ...baseValidPayload,
        accountType: 'admin',
      })
    ).toBe('PERMISSION_DENIED');

    // 4. Shadow Field Injection on Create
    expect(
      evaluateUserProfileRules('create', 'user_123', validCtx, {
        ...baseValidPayload,
        isAdmin: true,
      })
    ).toBe('PERMISSION_DENIED');

    // 5. Denial-of-Wallet Oversized String
    expect(
      evaluateUserProfileRules('create', 'user_123', validCtx, {
        ...baseValidPayload,
        name: 'A'.repeat(500),
      })
    ).toBe('PERMISSION_DENIED');

    // 6. ID Poisoning
    expect(
      evaluateUserProfileRules('get', 'invalid/id$poison!', validCtx)
    ).toBe('PERMISSION_DENIED');

    // 7. Unbounded Skills Array (> 10 items)
    expect(
      evaluateUserProfileRules('create', 'user_123', validCtx, {
        ...baseValidPayload,
        skills: Array.from({ length: 15 }, (_, i) => `Skill ${i}`),
      })
    ).toBe('PERMISSION_DENIED');

    // 8. Forged Client Timestamp on Create
    expect(
      evaluateUserProfileRules('create', 'user_123', validCtx, {
        ...baseValidPayload,
        createdAt: '1999-01-01T00:00:00Z',
      })
    ).toBe('PERMISSION_DENIED');

    // 9. Update-Gap / Value Poisoning on Update
    expect(
      evaluateUserProfileRules(
        'update',
        'user_123',
        validCtx,
        { ...baseValidPayload, name: 12345 as any },
        baseValidPayload
      )
    ).toBe('PERMISSION_DENIED');

    // 10. Immutable Field Mutation on Update (changing accountType)
    expect(
      evaluateUserProfileRules(
        'update',
        'user_123',
        validCtx,
        { ...baseValidPayload, accountType: 'employer' },
        baseValidPayload
      )
    ).toBe('PERMISSION_DENIED');

    // 11. Cross-User PII Read
    expect(
      evaluateUserProfileRules('get', 'other_user_456', validCtx)
    ).toBe('PERMISSION_DENIED');

    // 12. Collection Scraping via List
    expect(evaluateUserProfileRules('list', 'user_123', validCtx)).toBe(
      'PERMISSION_DENIED'
    );
  });

  it('allows valid Candidate and Employer document creation and owner reads', () => {
    expect(
      evaluateUserProfileRules('create', 'user_123', validCtx, baseValidPayload)
    ).toBe('ALLOWED');

    expect(
      evaluateUserProfileRules('create', 'user_123', validCtx, {
        ...baseValidPayload,
        accountType: 'employer',
        companyName: 'Fort Young Hotel & Dive Resort',
        dssRegistrationNo: 'DSS-DOM-48192',
      })
    ).toBe('ALLOWED');

    expect(evaluateUserProfileRules('get', 'user_123', validCtx)).toBe('ALLOWED');
  });

  it('sanitizes outgoing user profiles to match firebase-blueprint.json constraints', () => {
    const mockEmployer: UserAccount = {
      id: 'usr-1',
      email: 'careers@fortyounghotel.com',
      name: 'Kareem Peltier',
      companyName: 'Fort Young Hotel & Dive Resort',
      role: 'client',
      parish: 'St. George',
      phone: '+1 (767) 448-5000',
      dssRegistrationNo: 'DSS-DOM-48192',
      skills: Array.from({ length: 14 }, (_, i) => `Skill_${i}`),
      createdAt: '2026-10-12',
    };

    const sanitized = sanitizeUserProfileForFirestore('uid_abc_123', mockEmployer);
    expect(sanitized.uid).toBe('uid_abc_123');
    expect(sanitized.accountType).toBe('employer');
    expect((sanitized.skills as string[]).length).toBeLessThanOrEqual(
      USER_PROFILE_CONSTRAINTS.SKILLS_MAX_ITEMS
    );
  });

  it('formats structured FirestoreErrorInfo JSON in handleFirestoreError', () => {
    expect(() =>
      handleFirestoreError(
        new Error('Missing or insufficient permissions.'),
        OperationType.CREATE,
        'users/uid_test'
      )
    ).toThrow(/Missing or insufficient permissions/);
  });

  it('renders AuthModal with Login, New Candidate, and New Employer tabs and Header Log Out controls', () => {
    const loginHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(AuthModal, {
          isOpen: true,
          onClose: () => {},
          onRequireSubscription: () => {},
          initialMode: 'login',
        })
      )
    );
    expect(loginHtml).toContain('Log In to Account');
    expect(loginHtml).toContain('New Candidate');
    expect(loginHtml).toContain('New Employer');
    expect(loginHtml).toContain('Log Out');

    const candidateRegisterHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(AuthModal, {
          isOpen: true,
          onClose: () => {},
          onRequireSubscription: () => {},
          initialMode: 'jobseeker_register',
        })
      )
    );
    expect(candidateRegisterHtml).toContain('Create Candidate Account');

    const employerRegisterHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(AuthModal, {
          isOpen: true,
          onClose: () => {},
          onRequireSubscription: () => {},
          initialMode: 'client_register',
        })
      )
    );
    expect(employerRegisterHtml).toContain('Create Employer Account');

    const headerHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(Header, {
          activeTab: 'jobs',
          setActiveTab: () => {},
          onOpenNotifications: () => {},
          onOpenAuth: () => {},
          onOpenAdminLogin: () => {},
          onOpenRemoteModal: () => {},
        })
      )
    );
    expect(headerHtml).toContain('Log Out');
    expect(loginHtml).toContain('Forgot Password?');

    const forgotPasswordHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(AuthModal, {
          isOpen: true,
          onClose: () => {},
          onRequireSubscription: () => {},
          initialMode: 'forgot_password',
        })
      )
    );
    expect(forgotPasswordHtml).toContain('Account Password Recovery');
    expect(forgotPasswordHtml).toContain('Recover Account via Email Verification');
    expect(forgotPasswordHtml).toContain('Send Verification Code &amp; Reset Link');
    expect(candidateRegisterHtml).toContain('Password Strength');
    expect(employerRegisterHtml).toContain('Password Strength');
    expect(candidateRegisterHtml).toContain('toggle-candidate-password-btn');
    expect(candidateRegisterHtml).toContain('toggle-candidate-confirm-password-btn');
    expect(candidateRegisterHtml).toContain('Continue with Google');
    expect(candidateRegisterHtml).toContain('Continue with GitHub');
    expect(employerRegisterHtml).toContain('toggle-employer-password-btn');
    expect(employerRegisterHtml).toContain('toggle-employer-confirm-password-btn');
    expect(employerRegisterHtml).toContain('Continue with Google');
    expect(employerRegisterHtml).toContain('Continue with GitHub');
    expect(loginHtml).toContain('toggle-login-password-btn');
    expect(loginHtml).toContain('Google Sign In (Candidate)');
    expect(loginHtml).toContain('GitHub Sign In (Candidate)');
    expect(loginHtml).toContain('Google Sign In (Employer)');
    expect(loginHtml).toContain('GitHub Sign In (Employer)');
    expect(googleProvider.providerId).toBe('google.com');
    expect(githubProvider.providerId).toBe('github.com');
  });

  it('evaluates real-time password strength criteria accurately and generates Firebase Auth reset links', async () => {
    const emptyResult = evaluatePasswordStrength('');
    expect(emptyResult.level).toBe('Empty');
    expect(emptyResult.score).toBe(0);

    const weakResult = evaluatePasswordStrength('abc');
    expect(weakResult.level).toBe('Weak');
    expect(weakResult.score).toBe(1);

    const fairResult = evaluatePasswordStrength('dominica12');
    expect(fairResult.level).toBe('Fair');
    expect(fairResult.score).toBe(2);

    const goodResult = evaluatePasswordStrength('Dominica2026');
    expect(goodResult.level).toBe('Good');
    expect(goodResult.score).toBe(3);

    const strongResult = evaluatePasswordStrength('Dominica#2026!');
    expect(strongResult.level).toBe('Strong');
    expect(strongResult.score).toBe(4);
    expect(strongResult.criteria.minLength).toBe(true);
    expect(strongResult.criteria.hasUppercase).toBe(true);
    expect(strongResult.criteria.hasLowercase).toBe(true);
    expect(strongResult.criteria.hasNumber).toBe(true);
    expect(strongResult.criteria.hasSpecial).toBe(true);

    const resetDispatch = await sendFirebasePasswordReset(
      'maxblanc10468@gmail.com',
      '482910'
    );
    expect(resetDispatch.resetLink).toContain('mode=resetPassword');
    expect(resetDispatch.resetLink).toContain('maxblanc10468%40gmail.com');
    expect(resetDispatch.oobCode).toContain('oob_482910');
  });

  it('renders iOS 18, Android 15 Material You, and Side-by-Side mobile platform views', () => {
    const sharedProps = {
      onChangeViewMode: () => {},
      activeTab: 'jobs' as const,
      setActiveTab: () => {},
      jobs: [],
      searchQuery: '',
      setSearchQuery: () => {},
      selectedParish: 'All' as const,
      setSelectedParish: () => {},
      selectedSector: 'All' as const,
      setSelectedSector: () => {},
      nepOnly: false,
      setNepOnly: () => {},
      minSalary: 1500,
      setMinSalary: () => {},
      onResetFilters: () => {},
      onSelectJob: () => {},
      onApplyJob: () => {},
      onShareJob: () => {},
      onOpenAuth: () => {},
      onOpenNotifications: () => {},
      onOpenAlertModal: () => {},
      onOpenRemoteModal: () => {},
    };

    const iosHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(MobilePlatformViews, {
          ...sharedProps,
          viewMode: 'ios',
        })
      )
    );
    expect(iosHtml).toContain('ios-view-container');
    expect(iosHtml).toContain('ios-dynamic-island');
    expect(iosHtml).toContain('ios-bottom-tab-bar');

    const androidHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(MobilePlatformViews, {
          ...sharedProps,
          viewMode: 'android',
        })
      )
    );
    expect(androidHtml).toContain('android-view-container');
    expect(androidHtml).toContain('android-status-bar');
    expect(androidHtml).toContain('android-bottom-nav');
    expect(androidHtml).toContain('android-fab');

    const compareHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(MobilePlatformViews, {
          ...sharedProps,
          viewMode: 'compare',
        })
      )
    );
    expect(compareHtml).toContain('ios-view-container');
    expect(compareHtml).toContain('android-view-container');
  });

  it('shows Quick Apply button on JobCard only when authenticated and supports Swipe to Dismiss on iOS and Android job cards', () => {
    const sampleJob = INITIAL_JOBS[0];

    // 1. Unauthenticated: Quick Apply button should NOT appear; Apply Now button SHOULD appear
    try {
      localStorage.removeItem('dominica_current_user');
    } catch {
      // ignore
    }

    const unauthCardHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(JobCard, {
          job: sampleJob,
          onSelect: () => {},
          onApply: () => {},
          isAuthenticated: false,
        })
      )
    );
    expect(unauthCardHtml).toContain(`apply-now-btn-${sampleJob.id}`);
    expect(unauthCardHtml).not.toContain(`quick-apply-btn-${sampleJob.id}`);

    // 2. Authenticated: Quick Apply button SHOULD appear on JobCard
    const mockAuthUser: UserAccount = {
      id: 'usr_quick_apply_1',
      email: 'candidate@natureislecareers.com',
      name: 'Elena Henderson',
      role: 'jobseeker',
      parish: 'St. George',
      resumeFileName: 'Elena_Henderson_Primary_CV.pdf',
      createdAt: '2026-10-01',
    };
    try {
      localStorage.setItem('dominica_current_user', JSON.stringify(mockAuthUser));
    } catch {
      // ignore
    }

    const authCardHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(JobCard, {
          job: sampleJob,
          onSelect: () => {},
          onApply: () => {},
        })
      )
    );
    expect(authCardHtml).toContain(`quick-apply-btn-${sampleJob.id}`);
    expect(authCardHtml).toContain('Quick Apply');

    // 3. Mobile iOS & Android views render Swipe to Dismiss layers/controls and authenticated Quick Apply buttons
    const mobileSharedProps = {
      onChangeViewMode: () => {},
      activeTab: 'jobs' as const,
      setActiveTab: () => {},
      jobs: [sampleJob],
      searchQuery: '',
      setSearchQuery: () => {},
      selectedParish: 'All' as const,
      setSelectedParish: () => {},
      selectedSector: 'All' as const,
      setSelectedSector: () => {},
      nepOnly: false,
      setNepOnly: () => {},
      minSalary: 1500,
      setMinSalary: () => {},
      onResetFilters: () => {},
      onSelectJob: () => {},
      onApplyJob: () => {},
      onShareJob: () => {},
      onOpenAuth: () => {},
      onOpenNotifications: () => {},
      onOpenAlertModal: () => {},
      onOpenRemoteModal: () => {},
    };

    const mobileCompareWithJobsHtml = renderToStaticMarkup(
      React.createElement(
        JobProvider,
        null,
        React.createElement(MobilePlatformViews, {
          ...mobileSharedProps,
          viewMode: 'compare',
        })
      )
    );
    expect(mobileCompareWithJobsHtml).toContain(`swipe-dismiss-bg-ios-${sampleJob.id}`);
    expect(mobileCompareWithJobsHtml).toContain(`swipe-dismiss-btn-ios-${sampleJob.id}`);
    expect(mobileCompareWithJobsHtml).toContain(`mobile-quick-apply-btn-ios-${sampleJob.id}`);
    expect(mobileCompareWithJobsHtml).toContain(`swipe-dismiss-bg-android-${sampleJob.id}`);
    expect(mobileCompareWithJobsHtml).toContain(`swipe-dismiss-btn-android-${sampleJob.id}`);
    expect(mobileCompareWithJobsHtml).toContain(`mobile-quick-apply-btn-android-${sampleJob.id}`);
  });
});
