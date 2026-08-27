// Content service — chapters / lessons / announcements
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay, mockChapters, mockLessons, mockAnnouncements } from './mock';
import type { Chapter, Lesson, Announcement } from '../types';

// ===== Chapters =====
export const getChapters = async (classId: number): Promise<Chapter[]> => {
  if (USE_MOCK) { await delay(); return mockChapters.filter((c) => c.classId === classId); }
  return unwrap<Chapter[]>(apiClient.get(`/classes/${classId}/chapters`));
};
export const createChapter = async (classId: number, data: Omit<Chapter, 'id' | 'classId'>): Promise<Chapter> => {
  if (USE_MOCK) { await delay(); return { id: Date.now(), classId, ...data }; }
  return unwrap<Chapter>(apiClient.post(`/classes/${classId}/chapters`, data));
};

// ===== Lessons =====
export const getLessons = async (chapterId: number): Promise<Lesson[]> => {
  if (USE_MOCK) { await delay(); return mockLessons.filter((l) => l.chapterId === chapterId); }
  return unwrap<Lesson[]>(apiClient.get(`/chapters/${chapterId}/lessons`));
};
export const createLesson = async (chapterId: number, data: Omit<Lesson, 'id' | 'chapterId'>): Promise<Lesson> => {
  if (USE_MOCK) { await delay(); return { id: Date.now(), chapterId, ...data }; }
  return unwrap<Lesson>(apiClient.post(`/chapters/${chapterId}/lessons`, data));
};

// ===== Announcements =====
export const getAnnouncements = async (classId: number): Promise<Announcement[]> => {
  if (USE_MOCK) { await delay(); return mockAnnouncements.filter((a) => a.classId === classId); }
  return unwrap<Announcement[]>(apiClient.get(`/classes/${classId}/announcements`));
};
export const createAnnouncement = async (classId: number, data: { title: string; content: string }): Promise<Announcement> => {
  if (USE_MOCK) { await delay(); return { id: Date.now(), classId, createdBy: 2, createdAt: new Date().toISOString(), ...data }; }
  return unwrap<Announcement>(apiClient.post(`/classes/${classId}/announcements`, data));
};