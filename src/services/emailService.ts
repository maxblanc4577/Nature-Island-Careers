import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  EMAIL_SUBSCRIPTION_CONSTRAINTS,
  handleFirestoreError,
  OperationType,
  sanitizeEmailSubscriptionForFirestore,
  sanitizeUserProfileForFirestore,
} from '../firebase';
import { isValidEmail } from '../utils/paymentValidation';
import { JobSector, Parish } from '../types';

export interface SubscribeJobCategoriesInput {
  email: string;
  name?: string;
  categories: (JobSector | string)[];
  parishes?: (Parish | string)[];
  frequency?: 'instant' | 'daily' | 'weekly';
  keyword?: string;
  minSalary?: number;
}

export interface EmailCategorySubscriptionRecord {
  id: string;
  uid?: string;
  email: string;
  name: string;
  categories: string[];
  parishes: string[];
  frequency: 'instant' | 'daily' | 'weekly';
  active: boolean;
  persistedInFirestore: boolean;
  persistedInBackend: boolean;
  createdAt: string;
  updatedAt: string;
}

export function normalizeCategoryList(categories: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const cat of categories) {
    const clean = String(cat || '')
      .trim()
      .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.CATEGORY_ITEM_MAX_LENGTH);
    if (clean.length >= 2 && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      normalized.push(clean);
    }
    if (normalized.length >= EMAIL_SUBSCRIPTION_CONSTRAINTS.CATEGORIES_MAX_ITEMS) break;
  }
  return normalized;
}

export function buildDeterministicSubscriptionId(email: string, categories: string[]): string {
  const cleanEmail = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 48);
  const catHash = categories
    .join('_')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 32);
  const combined = `sub_${cleanEmail}_${catHash || 'all'}`.slice(
    0,
    EMAIL_SUBSCRIPTION_CONSTRAINTS.ID_MAX_LENGTH
  );
  return combined.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

export async function subscribeToJobCategories(
  input: SubscribeJobCategoriesInput
): Promise<EmailCategorySubscriptionRecord> {
  const cleanEmail = (input.email || '').trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    throw new Error('Please provide a valid email address to subscribe to job categories.');
  }

  const normalizedCategories = normalizeCategoryList(input.categories || []);
  if (normalizedCategories.length === 0) {
    throw new Error('At least one job category must be selected.');
  }

  const normalizedParishes = (input.parishes || [])
    .map((p) => String(p || '').trim().slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.PARISH_ITEM_MAX_LENGTH))
    .filter((p) => p.length > 0)
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.PARISHES_MAX_ITEMS);

  const cleanName = (input.name || 'Dominica Job Seeker')
    .trim()
    .slice(0, EMAIL_SUBSCRIPTION_CONSTRAINTS.NAME_MAX_LENGTH);
  const finalName = cleanName.length >= 2 ? cleanName : 'Dominica Job Seeker';
  const frequency: 'instant' | 'daily' | 'weekly' =
    input.frequency && ['instant', 'daily', 'weekly'].includes(input.frequency)
      ? input.frequency
      : 'instant';

  const subscriptionId = buildDeterministicSubscriptionId(cleanEmail, normalizedCategories);
  const nowIso = new Date().toISOString();

  let persistedInBackend = false;
  let persistedInFirestore = false;

  // 1. Persist via backend email subscription service endpoint for automated alerts
  try {
    if (typeof fetch === 'function') {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          email: cleanEmail,
          name: finalName,
          categories: normalizedCategories,
          parishes: normalizedParishes,
          frequency,
          keyword: input.keyword?.trim() || undefined,
          minSalary: input.minSalary && input.minSalary > 0 ? input.minSalary : undefined,
        }),
      });
      if (res.ok) {
        persistedInBackend = true;
      }
    }
  } catch {
    // Allow Firestore persistence to proceed even if offline
  }

  // 2. Persist directly into isolated Firestore subcollection when verified Firebase session exists
  const fbUser = auth.currentUser;
  if (fbUser && fbUser.emailVerified) {
    const userDocPath = `users/${fbUser.uid}`;
    const userDocRef = doc(db, 'users', fbUser.uid);

    // Master Gate prerequisite: guarantee parent user document exists prior to subcollection write
    try {
      const parentSnap = await getDoc(userDocRef);
      if (!parentSnap.exists()) {
        const baselineProfile = sanitizeUserProfileForFirestore(fbUser.uid, {
          id: fbUser.uid,
          email: fbUser.email || cleanEmail,
          name: fbUser.displayName || finalName,
          role: 'jobseeker',
          parish: (normalizedParishes[0] as Parish) || 'St. George',
          createdAt: nowIso.split('T')[0],
        });
        await setDoc(userDocRef, {
          ...baselineProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, userDocPath);
    }

    const subPath = `users/${fbUser.uid}/emailSubscriptions/${subscriptionId}`;
    const subRef = doc(db, 'users', fbUser.uid, 'emailSubscriptions', subscriptionId);
    const sanitized = sanitizeEmailSubscriptionForFirestore({
      id: subscriptionId,
      uid: fbUser.uid,
      email: cleanEmail,
      name: finalName,
      categories: normalizedCategories,
      parishes: normalizedParishes,
      frequency,
      active: true,
    });

    try {
      await setDoc(subRef, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      persistedInFirestore = true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, subPath);
    }
  }

  return {
    id: subscriptionId,
    uid: fbUser?.uid,
    email: cleanEmail,
    name: finalName,
    categories: normalizedCategories,
    parishes: normalizedParishes,
    frequency,
    active: true,
    persistedInFirestore,
    persistedInBackend,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function getUserEmailSubscriptions(
  emailFilter?: string
): Promise<EmailCategorySubscriptionRecord[]> {
  const fbUser = auth.currentUser;
  if (fbUser && fbUser.emailVerified) {
    const colPath = `users/${fbUser.uid}/emailSubscriptions`;
    try {
      const snap = await getDocs(collection(db, 'users', fbUser.uid, 'emailSubscriptions'));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid,
          email: data.email,
          name: data.name || 'Dominica Job Seeker',
          categories: Array.isArray(data.categories) ? data.categories : [],
          parishes: Array.isArray(data.parishes) ? data.parishes : [],
          frequency: data.frequency || 'instant',
          active: data.active !== false,
          persistedInFirestore: true,
          persistedInBackend: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  try {
    const query = emailFilter ? `?email=${encodeURIComponent(emailFilter.trim().toLowerCase())}` : '';
    const res = await fetch(`/api/email/subscriptions${query}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data?.subscriptions) ? data.subscriptions : [];
    }
  } catch {
    // ignore network failure
  }
  return [];
}

export async function unsubscribeFromJobCategories(subscriptionId: string): Promise<void> {
  const fbUser = auth.currentUser;
  if (fbUser && fbUser.emailVerified) {
    const subPath = `users/${fbUser.uid}/emailSubscriptions/${subscriptionId}`;
    try {
      await deleteDoc(doc(db, 'users', fbUser.uid, 'emailSubscriptions', subscriptionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, subPath);
    }
  }

  try {
    if (typeof fetch === 'function') {
      await fetch(`/api/email/subscribe/${encodeURIComponent(subscriptionId)}`, {
        method: 'DELETE',
      });
    }
  } catch {
    // ignore network failure
  }
}
