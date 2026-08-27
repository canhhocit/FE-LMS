// Chat service — REST + WebSocket (STOMP)
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay, mockMessages, mockStats, mockUsers } from './mock';
import type { Message, DashboardStats, User } from '../types';

export const getMessages = async (withUserId: number, page = 0, size = 20): Promise<Message[]> => {
  if (USE_MOCK) {
    await delay();
    const meId = JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 3;
    return mockMessages
      .filter((m) => (m.senderId === meId && m.receiverId === withUserId) || (m.senderId === withUserId && m.receiverId === meId))
      .slice(page * size, (page + 1) * size);
  }
  return unwrap<Message[]>(apiClient.get('/messages', { params: { withUserId, page, size } }));
};

export const sendMessage = async (payload: { receiverId: number; content: string; courseId?: number }): Promise<Message> => {
  if (USE_MOCK) {
    await delay();
    const meId = JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 3;
    const msg: Message = {
      id: Date.now(), senderId: meId, receiverId: payload.receiverId,
      content: payload.content, sentAt: new Date().toISOString(), read: false, courseId: payload.courseId,
    };
    mockMessages.push(msg);
    return msg;
  }
  return unwrap<Message>(apiClient.post('/messages', payload));
};

export const markRead = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); const m = mockMessages.find((x) => x.id === id); if (m) m.read = true; return; }
  await unwrap<void>(apiClient.patch(`/messages/${id}/read`));
};

export const getUnreadCount = async (): Promise<number> => {
  if (USE_MOCK) {
    await delay();
    const meId = JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 3;
    return mockMessages.filter((m) => m.receiverId === meId && !m.read).length;
  }
  return unwrap<number>(apiClient.get('/messages/unread-count'));
};

// ===== Admin dashboard =====
export const getDashboardStats = async (): Promise<DashboardStats> => {
  if (USE_MOCK) { await delay(); return mockStats; }
  return unwrap<DashboardStats>(apiClient.get('/admin/dashboard'));
};

// ===== User (Admin) =====
export const listStudents = async (keyword = '', page = 0, size = 20): Promise<User[]> => {
  if (USE_MOCK) {
    await delay();
    const k = keyword.toLowerCase();
    return mockUsers.filter((u) => u.role === 'STUDENT' && (!k || u.fullName.toLowerCase().includes(k) || u.email.toLowerCase().includes(k))).slice(page * size, (page + 1) * size);
  }
  return unwrap<User[]>(apiClient.get('/admin/users/students', { params: { keyword, page, size } }));
};
export const listLecturers = async (keyword = '', page = 0, size = 20): Promise<User[]> => {
  if (USE_MOCK) {
    await delay();
    const k = keyword.toLowerCase();
    return mockUsers.filter((u) => u.role === 'LECTURER' && (!k || u.fullName.toLowerCase().includes(k) || u.email.toLowerCase().includes(k))).slice(page * size, (page + 1) * size);
  }
  return unwrap<User[]>(apiClient.get('/admin/users/lecturers', { params: { keyword, page, size } }));
};