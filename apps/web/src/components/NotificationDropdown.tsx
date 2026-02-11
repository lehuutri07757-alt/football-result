'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types/notification';
import { useAuthStore } from '@/stores/auth.store';

const TYPE_ICONS: Record<string, string> = {
  system: '⚙️',
  deposit: '💰',
  withdrawal: '💸',
  bet: '🎯',
  promotion: '🎁',
  account: '👤',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationDropdown() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently ignore
    }
  }, [isAuthenticated]);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications({ limit: 10 });
      setNotifications(res.data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Poll unread count every 30s
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      const tid = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
      return () => {
        clearTimeout(tid);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded-full p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white transition-colors"
      >
        <Bell size={18} className="sm:hidden" />
        <Bell size={20} className="hidden sm:block" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed right-3 top-14 sm:top-16 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-950 dark:ring-white/10">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex gap-3 p-3 sm:p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                    !n.isRead ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${!n.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="flex-shrink-0 h-2 w-2 mt-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {n.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {timeAgo(n.createdAt)}
                      </span>
                      {n.actionUrl && (
                        <ExternalLink size={10} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      className="flex-shrink-0 mt-0.5 p-1 rounded-full text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  // Could navigate to a full notifications page in the future
                }}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
