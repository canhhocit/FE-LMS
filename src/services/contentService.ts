import { apiClient, unwrap } from './api/client';
import type { Chapter, Lesson, Announcement } from '../types';

export const getChapters = async (classId: number): Promise<Chapter[]> => unwrap(apiClient.get(`/classes/${classId}/chapters`));
export const createChapter = async (classId: number, data: Omit<Chapter, 'id' | 'classId'>): Promise<Chapter> => unwrap(apiClient.post(`/classes/${classId}/chapters`, data));
export const updateChapter = async (chapterId: number, data: Partial<Chapter>): Promise<Chapter> => unwrap(apiClient.put(`/chapters/${chapterId}`, data));
export const deleteChapter = async (chapterId: number): Promise<void> => { await apiClient.delete(`/chapters/${chapterId}`); };

export const getLessons = async (chapterId: number): Promise<Lesson[]> => unwrap(apiClient.get(`/chapters/${chapterId}/lessons`));
export const createLesson = async (chapterId: number, data: Omit<Lesson, 'id' | 'chapterId'>): Promise<Lesson> => unwrap(apiClient.post(`/chapters/${chapterId}/lessons`, data));
export const updateLesson = async (lessonId: number, data: Partial<Lesson>): Promise<Lesson> => unwrap(apiClient.put(`/lessons/${lessonId}`, data));
export const deleteLesson = async (lessonId: number): Promise<void> => { await apiClient.delete(`/lessons/${lessonId}`); };
export const uploadLessonVideo = async (
  lessonId: number,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  return unwrap<string>(
    apiClient.post(`/lessons/${lessonId}/upload-video`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    })
  );
};

export const uploadLessonAttachment = async (
  lessonId: number,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  return unwrap<string>(
    apiClient.post(`/lessons/${lessonId}/upload-attachment`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    })
  );
};

export const getAnnouncements = async (classId: number): Promise<Announcement[]> => unwrap(apiClient.get(`/classes/${classId}/announcements`));
export const createAnnouncement = async (classId: number, data: { title: string; content: string }): Promise<Announcement> => unwrap(apiClient.post(`/classes/${classId}/announcements`, data));
export const updateAnnouncement = async (announcementId: number, data: { title: string; content: string }): Promise<Announcement> => unwrap(apiClient.put(`/announcements/${announcementId}`, data));
export const deleteAnnouncement = async (announcementId: number): Promise<void> => { await apiClient.delete(`/announcements/${announcementId}`); };

// ===== AI Lesson Summarizer =====
export interface AiLessonSummaryResponse {
  lessonId: number;
  summary: string;
  keyTakeaways?: string[];
  suggestedQuestions?: string[];
}

export const getAiLessonSummary = async (lessonId: number): Promise<AiLessonSummaryResponse> => {
  return unwrap<AiLessonSummaryResponse>(apiClient.get(`/content/lessons/${lessonId}/ai-summary`));
};
