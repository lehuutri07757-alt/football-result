export enum NotificationType {
  SYSTEM = 'system',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BET = 'bet',
  PROMOTION = 'promotion',
  ACCOUNT = 'account',
}

export interface Notification {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}
