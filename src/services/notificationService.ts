// Notification service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { Notification } from '../types';

export const getNotifications = async (): Promise<Notification[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, title: 'Bai tap moi', content: 'Bai tap CS101 da duoc giao', read: false, createdAt: new Date().toISOString(), type: 'ASSIGNMENT' },
      { id: 2, title: 'Diem cap nhat', content: 'Diem giua ky CS101: 8.5', read: true, createdAt: new Date(Date.now() - 86400000).toISOString(), type: 'GRADE' },
    ];
  }
  return unwrap<Notification[]>(apiClient.get('/me/notifications'));
};

export const getUnreadCount = async (): Promise<number> => {
  if (USE_MOCK) { await delay(); return 1; }
  return unwrap<number>(apiClient.get('/me/notifications/unread-count'));
};

export const markAsRead = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.patch(`/notifications/${id}/read`));
};

export const markAllAsRead = async (): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.patch('/me/notifications/read-all'));
};
