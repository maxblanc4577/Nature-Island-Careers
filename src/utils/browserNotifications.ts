/**
 * Utility for Web Browser Notifications.
 * Handles permission requesting, checking, and dispatching browser notifications
 * with full error handling for iframe sandboxes and unsupportive browsers.
 */

export const getBrowserNotificationPermission = (): NotificationPermission => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      return Notification.permission;
    } catch {
      return 'default';
    }
  }
  return 'denied';
};

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Browser notification permission request failed or was blocked by container:', err);
      return 'denied';
    }
  }
  return 'denied';
};

export const sendBrowserNotification = (
  title: string,
  options?: NotificationOptions
): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/dominica_flag.svg',
        badge: '/dominica_flag.svg',
        tag: 'nature-island-careers',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    }
  } catch (err) {
    console.warn('Unable to dispatch browser notification:', err);
  }

  return false;
};

/**
 * Triggers a browser notification when a saved job's status changes.
 */
export const notifySavedJobStatusChange = (
  jobTitle: string,
  companyName: string,
  status: string
) => {
  const title = `🔔 Saved Job Status Update`;
  const body = `Your saved position "${jobTitle}" at ${companyName} has an updated status: ${status}.`;
  sendBrowserNotification(title, {
    body,
    icon: '/dominica_flag.svg',
  });
};

/**
 * Triggers a browser notification when a newly posted job matches the user's previous search criteria.
 */
export const notifyNewJobMatch = (
  jobTitle: string,
  companyName: string,
  parish: string,
  matchedKeyword: string
) => {
  const title = `✨ New Job Match for "${matchedKeyword}"`;
  const body = `${companyName} just posted "${jobTitle}" in ${parish}, matching your recent search.`;
  sendBrowserNotification(title, {
    body,
    icon: '/dominica_flag.svg',
  });
};
