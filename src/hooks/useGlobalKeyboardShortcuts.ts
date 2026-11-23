import { useEffect } from 'react';

export interface GlobalShortcutHandlers {
  onNavigateJobs: () => void;
  onNavigateRemote: () => void;
  onNavigateProfile: () => void;
  onNavigateCareer: () => void;
  onNavigateEmployers: () => void;
  onNavigateBrandStudio: () => void;
  onNavigateAdmin: () => void;
  onToggleHelpModal: () => void;
}

export interface KeyboardShortcutDescriptor {
  combo: string;
  key: string;
  label: string;
  description: string;
}

export const GLOBAL_NAVIGATION_SHORTCUTS: KeyboardShortcutDescriptor[] = [
  { combo: 'Alt + J', key: 'j', label: 'Jobs Board', description: 'Navigate to Browse Classifieds' },
  { combo: 'Alt + R', key: 'r', label: 'Remote / WIN', description: 'Navigate to Remote & WIN Visa Roles' },
  { combo: 'Alt + P', key: 'p', label: 'Profile Hub', description: 'Open Candidate Profile & Payment History' },
  { combo: 'Alt + C', key: 'c', label: 'Career Hub', description: 'Open Career Guidance & Labour Library' },
  { combo: 'Alt + E', key: 'e', label: 'Employer Portal', description: 'Open Employer / Recruiter Portal' },
  { combo: 'Alt + B', key: 'b', label: 'Brand Studio', description: 'Open Brand Identity & Asset Generator' },
  { combo: 'Alt + A', key: 'a', label: 'Admin Portal', description: 'Open Single-Login Admin Console' },
  { combo: 'Shift + ?', key: '?', label: 'Shortcuts Guide', description: 'Toggle keyboard shortcuts help dialog' },
];

export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as { tagName?: string; isContentEditable?: boolean };
  if (el.isContentEditable) return true;
  const tag = (el.tagName || '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function resolveShortcutAction(
  e: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'target'>,
  handlers: GlobalShortcutHandlers
): string | null {
  if (isEditableEventTarget(e.target)) {
    return null;
  }

  const keyLower = (e.key || '').toLowerCase();

  // Preserve Admin Portal shortcut: Alt + A or Ctrl + Shift + A
  if ((e.altKey && keyLower === 'a') || (e.ctrlKey && e.shiftKey && keyLower === 'a')) {
    handlers.onNavigateAdmin();
    return 'admin';
  }

  // Help modal toggle: Shift + ? (ignoring plain typing in inputs already guarded above)
  if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === '?' || (e.shiftKey && keyLower === '/'))) {
    handlers.onToggleHelpModal();
    return 'help';
  }

  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    switch (keyLower) {
      case 'j':
        handlers.onNavigateJobs();
        return 'jobs';
      case 'r':
        handlers.onNavigateRemote();
        return 'remote';
      case 'p':
        handlers.onNavigateProfile();
        return 'profile';
      case 'c':
        handlers.onNavigateCareer();
        return 'career';
      case 'e':
        handlers.onNavigateEmployers();
        return 'recruiter';
      case 'b':
        handlers.onNavigateBrandStudio();
        return 'brand';
      default:
        return null;
    }
  }

  return null;
}

export function useGlobalKeyboardShortcuts(handlers: GlobalShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matched = resolveShortcutAction(e, handlers);
      if (matched) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
