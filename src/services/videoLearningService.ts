import { apiClient, unwrap } from './api/client';

export interface VideoProgress {
  id?: number;
  enrollmentId: number;
  lessonId: number;
  lastWatchedSeconds: number;
  maxWatchedSeconds: number;
  completed?: boolean;
}

export interface InVideoQuiz {
  id?: number;
  lessonId: number;
  timestampSeconds: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

export interface StudentVideoNote {
  id?: number;
  lessonId: number;
  noteText: string;
  timestampSeconds: number;
  createdAt?: string;
}

export const upsertProgress = async (data: { enrollmentId: number; lessonId: number; lastWatchedSeconds: number; maxWatchedSeconds: number }): Promise<VideoProgress> =>
  unwrap(apiClient.post('/video-learning/progress', data));

export const getProgress = async (lessonId: number, enrollmentId: number): Promise<VideoProgress | null> => {
  try {
    return await unwrap(apiClient.get(`/video-learning/progress/lesson/${lessonId}/enrollment/${enrollmentId}`));
  } catch {
    return null;
  }
};

export const getQuizzesForLesson = async (lessonId: number): Promise<InVideoQuiz[]> =>
  unwrap(apiClient.get(`/video-learning/quizzes/lesson/${lessonId}`));

export const createInVideoQuiz = async (quiz: Omit<InVideoQuiz, 'id'>): Promise<InVideoQuiz> =>
  unwrap(apiClient.post('/video-learning/quizzes', quiz));

export const getNotes = async (lessonId: number): Promise<StudentVideoNote[]> =>
  unwrap(apiClient.get(`/video-learning/notes/lesson/${lessonId}`));

export const addNote = async (data: { lessonId: number; noteText: string; timestampSeconds: number }): Promise<StudentVideoNote> =>
  unwrap(apiClient.post('/video-learning/notes', data));
