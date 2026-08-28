import { apiClient, unwrap } from './api/client';
import type { Chapter, Lesson, Announcement } from '../types';
export const getChapters = async (classId: number): Promise<Chapter[]> => unwrap(apiClient.get(`/classes/${classId}/chapters`));
export const createChapter = async (classId: number, data: Omit<Chapter, 'id' | 'classId'>): Promise<Chapter> => unwrap(apiClient.post(`/classes/${classId}/chapters`, data));
export const getLessons = async (chapterId: number): Promise<Lesson[]> => unwrap(apiClient.get(`/chapters/${chapterId}/lessons`));
export const createLesson = async (chapterId: number, data: Omit<Lesson, 'id' | 'chapterId'>): Promise<Lesson> => unwrap(apiClient.post(`/chapters/${chapterId}/lessons`, data));
export const getAnnouncements = async (classId: number): Promise<Announcement[]> => unwrap(apiClient.get(`/classes/${classId}/announcements`));
export const createAnnouncement = async (classId: number, data: { title: string; content: string }): Promise<Announcement> => unwrap(apiClient.post(`/classes/${classId}/announcements`, data));
