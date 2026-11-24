import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Parish, JobSector, UserAccount, EmployerInvoice } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      await getDocFromServer(doc(db, 'test', 'connection'));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

// Blueprint volumetric constraints (verbatim from firebase-blueprint.json)
export const USER_PROFILE_CONSTRAINTS = {
  UID_MAX_LENGTH: 128,
  UID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  EMAIL_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 160,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 120,
  PARISH_MIN_LENGTH: 2,
  PARISH_MAX_LENGTH: 64,
  PHONE_MIN_LENGTH: 4,
  PHONE_MAX_LENGTH: 40,
  COMPANY_MAX_LENGTH: 140,
  DSS_MAX_LENGTH: 64,
  SECTOR_MAX_LENGTH: 100,
  SKILLS_MAX_ITEMS: 10,
  SKILL_ITEM_MAX_LENGTH: 80,
};

export function sanitizeUserProfileForFirestore(
  uid: string,
  user: UserAccount
): Record<string, unknown> {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, USER_PROFILE_CONSTRAINTS.UID_MAX_LENGTH);
  const cleanEmail = (user.email || 'user@natureislecareers.com')
    .trim()
    .slice(0, USER_PROFILE_CONSTRAINTS.EMAIL_MAX_LENGTH);
  const cleanName = (user.name || 'Dominica User')
    .trim()
    .slice(0, USER_PROFILE_CONSTRAINTS.NAME_MAX_LENGTH);
  const finalName = cleanName.length >= 2 ? cleanName : 'Dominica User';
  const accountType = user.role === 'client' ? 'employer' : 'candidate';
  const cleanParish = (user.parish || 'St. George')
    .trim()
    .slice(0, USER_PROFILE_CONSTRAINTS.PARISH_MAX_LENGTH);

  const payload: Record<string, unknown> = {
    uid: cleanUid,
    email: cleanEmail,
    name: finalName,
    accountType,
    parish: cleanParish.length >= 2 ? cleanParish : 'St. George',
  };

  if (user.phone && user.phone.trim().length >= USER_PROFILE_CONSTRAINTS.PHONE_MIN_LENGTH) {
    payload.phone = user.phone.trim().slice(0, USER_PROFILE_CONSTRAINTS.PHONE_MAX_LENGTH);
  }
  if (user.companyName && user.companyName.trim().length >= 1) {
    payload.companyName = user.companyName
      .trim()
      .slice(0, USER_PROFILE_CONSTRAINTS.COMPANY_MAX_LENGTH);
  }
  if (user.dssRegistrationNo && user.dssRegistrationNo.trim().length >= 1) {
    payload.dssRegistrationNo = user.dssRegistrationNo
      .trim()
      .slice(0, USER_PROFILE_CONSTRAINTS.DSS_MAX_LENGTH);
  }
  if (user.careerSector && user.careerSector.trim().length >= 2) {
    payload.careerSector = user.careerSector
      .trim()
      .slice(0, USER_PROFILE_CONSTRAINTS.SECTOR_MAX_LENGTH);
  }
  if (Array.isArray(user.skills)) {
    const cleanSkills = user.skills
      .map((s) => String(s).trim().slice(0, USER_PROFILE_CONSTRAINTS.SKILL_ITEM_MAX_LENGTH))
      .filter((s) => s.length > 0)
      .slice(0, USER_PROFILE_CONSTRAINTS.SKILLS_MAX_ITEMS);
    payload.skills = cleanSkills;
  }

  return payload;
}

export const EMAIL_SUBSCRIPTION_CONSTRAINTS = {
  ID_MAX_LENGTH: 128,
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  UID_MAX_LENGTH: 128,
  EMAIL_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 160,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 120,
  CATEGORIES_MAX_ITEMS: 10,
  CATEGORY_ITEM_MAX_LENGTH: 100,
  PARISHES_MAX_ITEMS: 11,
  PARISH_ITEM_MAX_LENGTH: 64,
};

export function sanitizeEmailSubscriptionForFirestore(input: {
  id: string;
  uid: string;
  email: string;
  name?: string;
  categories: string[];
  parishes?: string[];
  frequency: 'instant' | 'daily' | 'weekly';
  active: boolean;
}): Record<string, unknown> {
  const cleanId = input.id
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.ID_MAX_LENGTH) || 'sub_default';
  const cleanUid = input.uid
    .replace(/[^a-zA-Z0-9_\-]/g, '')
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.UID_MAX_LENGTH);
  const cleanEmail = (input.email || 'user@natureislecareers.com')
    .trim()
    .toLowerCase()
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.EMAIL_MAX_LENGTH);
  const cleanName = (input.name || 'Dominica Subscriber')
    .trim()
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.NAME_MAX_LENGTH);
  const cleanCategories = (input.categories || [])
    .map((c) => String(c).trim().slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.CATEGORY_ITEM_MAX_LENGTH))
    .filter((c) => c.length >= 2)
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.CATEGORIES_MAX_ITEMS);
  const cleanParishes = (input.parishes || [])
    .map((p) => String(p).trim().slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.PARISH_ITEM_MAX_LENGTH))
    .filter((p) => p.length >= 2)
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.PARISHES_MAX_ITEMS);

  const payload: Record<string, unknown> = {
    id: cleanId,
    uid: cleanUid,
    email: cleanEmail.length >= 3 ? cleanEmail : 'user@natureislecareers.com',
    name: cleanName.length >= 2 ? cleanName : 'Dominica Subscriber',
    categories: cleanCategories.length > 0 ? cleanCategories : ['All Job Sectors'],
    parishes: cleanParishes,
    frequency: ['instant', 'daily', 'weekly'].includes(input.frequency) ? input.frequency : 'instant',
    active: Boolean(input.active),
  };

  return payload;
}

export const EMPLOYER_INVOICE_CONSTRAINTS = {
  ID_MAX_LENGTH: 128,
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  UID_MAX_LENGTH: 128,
  RECRUITER_ID_MAX_LENGTH: 128,
  COMPANY_MAX_LENGTH: 140,
  EMAIL_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 160,
  INVOICE_NUM_MIN_LENGTH: 3,
  INVOICE_NUM_MAX_LENGTH: 64,
  DATE_MIN_LENGTH: 4,
  DATE_MAX_LENGTH: 40,
  EXPIRY_MAX_LENGTH: 64,
  PLAN_MIN_LENGTH: 2,
  PLAN_MAX_LENGTH: 140,
  DESC_MIN_LENGTH: 2,
  DESC_MAX_LENGTH: 400,
  PAYMENT_METHOD_MIN_LENGTH: 2,
  PAYMENT_METHOD_MAX_LENGTH: 120,
};

export function sanitizeInvoiceForFirestore(
  uid: string,
  invoice: EmployerInvoice
): Record<string, unknown> {
  const cleanId =
    invoice.id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, EMPLOYER_INVOICE_CONSTRAINTS.ID_MAX_LENGTH) ||
    `inv_${Date.now()}`;
  const cleanUid = uid
    .replace(/[^a-zA-Z0-9_\-]/g, '')
    .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.UID_MAX_LENGTH);

  const payload: Record<string, unknown> = {
    id: cleanId,
    uid: cleanUid,
    recruiterId: (invoice.recruiterId || 'rec_default')
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.RECRUITER_ID_MAX_LENGTH),
    companyName: (invoice.companyName || 'Dominica Employer')
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.COMPANY_MAX_LENGTH),
    invoiceNumber: (invoice.invoiceNumber || 'INV-DOM-0001')
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.INVOICE_NUM_MAX_LENGTH),
    date: (invoice.date || new Date().toISOString().split('T')[0])
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.DATE_MAX_LENGTH),
    plan: (invoice.plan || 'Standard Local Employer')
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.PLAN_MAX_LENGTH),
    amountXCD: Math.max(0, Number(invoice.amountXCD) || 0),
    amountUSD: Math.max(0, Number(invoice.amountUSD) || 0),
    billingInterval: ['monthly', 'one_time', 'annual'].includes(invoice.billingInterval)
      ? invoice.billingInterval
      : 'monthly',
    status: [
      'Paid',
      'Pending',
      'Processing',
      'Renewal Pending',
      'Failed',
      'Canceled',
      'Refunded',
    ].includes(invoice.status)
      ? invoice.status
      : 'Pending',
    paymentMethod: (invoice.paymentMethod || 'Stripe Card Checkout')
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.PAYMENT_METHOD_MAX_LENGTH),
  };

  if (
    invoice.recipientEmail &&
    invoice.recipientEmail.trim().length >= EMPLOYER_INVOICE_CONSTRAINTS.EMAIL_MIN_LENGTH
  ) {
    payload.recipientEmail = invoice.recipientEmail
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.EMAIL_MAX_LENGTH);
  }
  if (invoice.expiryDate && invoice.expiryDate.trim().length >= 4) {
    payload.expiryDate = invoice.expiryDate
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.EXPIRY_MAX_LENGTH);
  }
  if (
    invoice.description &&
    invoice.description.trim().length >= EMPLOYER_INVOICE_CONSTRAINTS.DESC_MIN_LENGTH
  ) {
    payload.description = invoice.description
      .trim()
      .slice(0, EMPLOYER_INVOICE_CONSTRAINTS.DESC_MAX_LENGTH);
  }

  return payload;
}

export async function syncInvoiceToFirestore(invoice: EmployerInvoice): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return;

  const cleanId =
    invoice.id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, EMPLOYER_INVOICE_CONSTRAINTS.ID_MAX_LENGTH) ||
    `inv_${Date.now()}`;
  const docPath = `users/${fbUser.uid}/invoices/${cleanId}`;
  const docRef = doc(db, 'users', fbUser.uid, 'invoices', cleanId);

  let exists = false;
  try {
    const snap = await getDoc(docRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  const basePayload = sanitizeInvoiceForFirestore(fbUser.uid, { ...invoice, id: cleanId });

  if (!exists) {
    try {
      await setDoc(docRef, {
        ...basePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  } else {
    const updatePayload: Record<string, unknown> = {
      status: basePayload.status,
      paymentMethod: basePayload.paymentMethod,
      updatedAt: serverTimestamp(),
    };
    if (basePayload.expiryDate !== undefined) updatePayload.expiryDate = basePayload.expiryDate;
    if (basePayload.description !== undefined) updatePayload.description = basePayload.description;
    if (basePayload.recipientEmail !== undefined) {
      updatePayload.recipientEmail = basePayload.recipientEmail;
    }

    try {
      await updateDoc(docRef, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }
}

export async function syncAuthenticatedUserToFirestore(user: UserAccount): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.emailVerified) return;

  const userDocPath = `users/${fbUser.uid}`;
  const docRef = doc(db, 'users', fbUser.uid);

  let exists = false;
  try {
    const snap = await getDoc(docRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userDocPath);
  }

  const basePayload = sanitizeUserProfileForFirestore(fbUser.uid, user);

  if (!exists) {
    try {
      await setDoc(docRef, {
        ...basePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userDocPath);
    }
  } else {
    const updatePayload: Record<string, unknown> = {
      name: basePayload.name,
      parish: basePayload.parish,
      updatedAt: serverTimestamp(),
    };
    if (basePayload.phone !== undefined) updatePayload.phone = basePayload.phone;
    if (basePayload.companyName !== undefined) updatePayload.companyName = basePayload.companyName;
    if (basePayload.dssRegistrationNo !== undefined) {
      updatePayload.dssRegistrationNo = basePayload.dssRegistrationNo;
    }
    if (basePayload.careerSector !== undefined) updatePayload.careerSector = basePayload.careerSector;
    if (basePayload.skills !== undefined) updatePayload.skills = basePayload.skills;

    try {
      await updateDoc(docRef, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userDocPath);
    }
  }
}

export type SocialAuthProviderType = 'google' | 'github';

export async function signInWithSocialProviderPopup(
  providerType: SocialAuthProviderType,
  preferredRole: 'jobseeker' | 'client',
  extraFields?: {
    companyName?: string;
    dssRegistrationNo?: string;
    parish?: Parish;
    phone?: string;
    careerSector?: JobSector;
    skills?: string[];
  }
): Promise<UserAccount> {
  const provider = providerType === 'github' ? githubProvider : googleProvider;
  const credential = await signInWithPopup(auth, provider);
  const fbUser: FirebaseUser = credential.user;
  const userDocPath = `users/${fbUser.uid}`;
  const docRef = doc(db, 'users', fbUser.uid);

  let existingData: Record<string, any> | null = null;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      existingData = snap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userDocPath);
  }

  if (existingData) {
    const mappedRole = existingData.accountType === 'employer' ? 'client' : 'jobseeker';
    return {
      id: fbUser.uid,
      email: existingData.email || fbUser.email || 'user@natureislecareers.com',
      name: existingData.name || fbUser.displayName || 'Dominica User',
      role: mappedRole,
      parish: (existingData.parish as Parish) || 'St. George',
      phone: existingData.phone || fbUser.phoneNumber || '+1 (767) 275-0100',
      avatarUrl: fbUser.photoURL || undefined,
      companyName: existingData.companyName,
      dssRegistrationNo: existingData.dssRegistrationNo,
      careerSector: (existingData.careerSector as JobSector) || 'Eco-Tourism & Hospitality',
      skills: Array.isArray(existingData.skills) ? existingData.skills : ['Project Management'],
      createdAt: new Date().toISOString().split('T')[0],
    };
  }

  const newAccount: UserAccount = {
    id: fbUser.uid,
    email: fbUser.email || 'user@natureislecareers.com',
    name: fbUser.displayName || 'Dominica Professional',
    role: preferredRole,
    parish: extraFields?.parish || 'St. George',
    phone: extraFields?.phone || fbUser.phoneNumber || '+1 (767) 275-0100',
    avatarUrl: fbUser.photoURL || undefined,
    companyName:
      preferredRole === 'client'
        ? extraFields?.companyName || `${fbUser.displayName || 'Dominica'} Enterprises`
        : undefined,
    dssRegistrationNo:
      preferredRole === 'client' ? extraFields?.dssRegistrationNo || 'DSS-DOM-88410' : undefined,
    careerSector: extraFields?.careerSector || 'Eco-Tourism & Hospitality',
    skills: extraFields?.skills || ['Project Management', 'Caribbean Operations'],
    createdAt: new Date().toISOString().split('T')[0],
  };

  if (fbUser.emailVerified) {
    const payload = sanitizeUserProfileForFirestore(fbUser.uid, newAccount);
    try {
      await setDoc(docRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userDocPath);
    }
  }

  return newAccount;
}

export async function signInWithGooglePopup(
  preferredRole: 'jobseeker' | 'client',
  extraFields?: {
    companyName?: string;
    dssRegistrationNo?: string;
    parish?: Parish;
    phone?: string;
    careerSector?: JobSector;
    skills?: string[];
  }
): Promise<UserAccount> {
  return signInWithSocialProviderPopup('google', preferredRole, extraFields);
}

export async function signInWithGithubPopup(
  preferredRole: 'jobseeker' | 'client',
  extraFields?: {
    companyName?: string;
    dssRegistrationNo?: string;
    parish?: Parish;
    phone?: string;
    careerSector?: JobSector;
    skills?: string[];
  }
): Promise<UserAccount> {
  return signInWithSocialProviderPopup('github', preferredRole, extraFields);
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch {
    // ignore signOut errors in offline/test environments
  }
}

export interface FirebasePasswordResetDispatchResult {
  sentViaFirebase: boolean;
  resetLink: string;
  oobCode: string;
  errorCode?: string;
  errorMessage?: string;
}

export async function sendFirebasePasswordReset(
  email: string,
  verificationCode?: string
): Promise<FirebasePasswordResetDispatchResult> {
  const cleanEmail = email.trim().toLowerCase();
  const oobCode = `oob_${verificationCode || Math.floor(100000 + Math.random() * 900000)}_${Date.now().toString(36)}`;
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://natureislecareers.com';
  const resetLink = `${origin}/?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}&email=${encodeURIComponent(cleanEmail)}`;

  try {
    if (cleanEmail) {
      await sendPasswordResetEmail(auth, cleanEmail, {
        url: resetLink,
        handleCodeInApp: false,
      });
      return {
        sentViaFirebase: true,
        resetLink,
        oobCode,
      };
    }
  } catch (err: any) {
    return {
      sentViaFirebase: false,
      resetLink,
      oobCode,
      errorCode: err?.code || 'auth/fallback-verification',
      errorMessage: err?.message || 'Dispatched via Nature Island Careers verification service.',
    };
  }
  return {
    sentViaFirebase: false,
    resetLink,
    oobCode,
  };
}

export { onAuthStateChanged, sendPasswordResetEmail };
