import { apiClient, unwrap } from './api/client';
import type { Notification } from '../types';

export const notifyNotificationsUpdated = (count?: number) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('notifications:updated', {
      detail: { count },
    }));
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  const page = await unwrap<{ content?: Notification[] }>(apiClient.get('/me/notifications'));
  return (page?.content ?? []).map((item) => ({
    ...item,
    isRead: item.isRead ?? false,
  }));
};
export const getUnreadCount = async (): Promise<number> => {
  try {
    return await unwrap<number>(apiClient.get('/me/notifications/unread-count'));
  } catch {
    return 0;
  }
};

export const markAsRead = async (id: number): Promise<void> => {
  try {
    await apiClient.patch(`/notifications/${id}/read`);
    const nextCount = await getUnreadCount();
    notifyNotificationsUpdated(nextCount);
  } catch (error) {
    throw error;
  }
};
