import React from 'react';
import { useJobContext } from '../context/JobContext';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import { X, Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, Calendar, Mail } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, requestBrowserNotificationPermission } = useJobContext();
  const modalRef = useModalKeyboard({ isOpen, onClose });
  const [browserPerm, setBrowserPerm] = React.useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        return Notification.permission;
      } catch {
        return 'default';
      }
    }
    return 'denied';
  });

  const handleEnableBrowserNotifs = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPerm(res);
  };

  if (!isOpen) return null;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'interview_invite':
        return <Calendar className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'status_update':
      case 'application_received':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'job_alert':
        return <Bell className="w-4 h-4 text-blue-500 shrink-0" />;
      default:
        return <Mail className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Dominica Notifications"
          tabIndex={-1}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
        >
          {/* Drawer Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Bell className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-base">Dominica Notifications</h3>
                <p className="text-xs text-slate-300">Classified updates & alerts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  title="Mark all as read"
                  className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Browser Notification Status Card */}
          <div className="mx-4 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${browserPerm === 'granted' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <div>
                <span className="font-bold text-slate-800 block">
                  {browserPerm === 'granted' ? 'Browser Notifications Enabled' : 'Browser Notifications'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {browserPerm === 'granted'
                    ? 'Alerts for saved jobs & search matches are active'
                    : 'Get live alerts for saved job changes & search matches'}
                </span>
              </div>
            </div>
            {browserPerm !== 'granted' && (
              <button
                type="button"
                onClick={handleEnableBrowserNotifs}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shrink-0"
              >
                Enable
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-600">No new notifications</p>
                <p className="text-xs text-slate-600">
                  You will receive updates here when you apply to jobs or when new vacancies are posted in your chosen parish.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    notif.isRead
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center space-x-2">
                      {getIconForType(notif.type)}
                      <h4 className="text-xs font-bold leading-tight">{notif.subject}</h4>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 pl-6 leading-relaxed">{notif.previewText}</p>
                  <p className="text-[10px] text-slate-600 pl-6 mt-2 font-medium">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Dominica Local Time
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
