import { api } from './api';
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/notification';

export const notificationService = {
  /** Get current user's notifications (paginated) */
  async getMyNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: string;
    type?: string;
  }): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>(
      '/notifications/me',
      { params },
    );
    return data;
  },

  /** Get unread notification count */
  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<UnreadCountResponse>(
      '/notifications/me/unread-count',
    );
    return data.count;
  },

  /** Mark a single notification as read */
  async markAsRead(id: string): Promise<Notification> {
    const { data } = await api.post<Notification>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  /** Mark all notifications as read */
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/me/read-all');
  },
};
