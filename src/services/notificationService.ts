import { apiClient, unwrap } from './api/client';
import type { Notification } from '../types';

export const notifyNotificationsUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('notifications:updated'));
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  const page = await unwrap<{ content?: Notification[] }>(apiClient.get('/me/notifications'));
  return (page?.content ?? []).map((item) => ({
    ...item,
    isRead: item.isRead ?? false,
  }));
};
export const getUnreadCount = async (): Promise<number> => unwrap<number>(apiClient.get('/me/notifications/unread-count'));
export const markAsRead = async (id: number): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
  notifyNotificationsUpdated();
};
