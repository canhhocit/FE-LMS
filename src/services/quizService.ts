// Quiz service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { Quiz, QuizQuestion, QuizAttempt } from '../types';

export const getQuizzesByClass = async (classId: number): Promise<Quiz[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, classId, title: 'Quiz 1 - Co ban', description: 'Kiem tra kien thuc co ban', startTime: '2026-04-01T08:00:00Z', endTime: '2026-04-01T10:00:00Z', durationMinutes: 30, maxAttempts: 2, status: 'PUBLISHED' },
      { id: 2, classId, title: 'Quiz 2 - Nang cao', description: 'Kiem tra kien thuc nang cao', startTime: '2026-04-15T08:00:00Z', endTime: '2026-04-15T10:00:00Z', durationMinutes: 45, maxAttempts: 1, status: 'DRAFT' },
    ];
  }
  return unwrap<Quiz[]>(apiClient.get(`/quizzes/class/${classId}`));
};

export const getQuiz = async (quizId: number): Promise<Quiz> => {
  if (USE_MOCK) {
    await delay();
    return { id: quizId, classId: 101, title: `Quiz ${quizId}`, startTime: '2026-04-01T08:00:00Z', endTime: '2026-04-01T10:00:00Z', durationMinutes: 30, maxAttempts: 2, status: 'PUBLISHED' };
  }
  return unwrap<Quiz>(apiClient.get(`/quizzes/${quizId}`));
};

export const getQuizQuestions = async (quizId: number): Promise<QuizQuestion[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, quizId, content: '1+1 = ?', options: ['1', '2', '3', '4'], correctAnswer: 1, points: 10 },
      { id: 2, quizId, content: '2*2 = ?', options: ['2', '3', '4', '5'], correctAnswer: 2, points: 10 },
      { id: 3, quizId, content: 'Cau truc du lieu?', options: ['Mang', 'Cay', 'Do thi', 'Tat ca'], correctAnswer: 3, points: 10 },
    ];
  }
  return unwrap<QuizQuestion[]>(apiClient.get(`/quizzes/${quizId}/questions`));
};

export const startQuiz = async (quizId: number): Promise<QuizAttempt> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), quizId, userId: 1, startedAt: new Date().toISOString(), answers: {} };
  }
  return unwrap<QuizAttempt>(apiClient.post(`/quizzes/${quizId}/start`, {}));
};

export const submitQuiz = async (attemptId: number, answers: Record<number, number>): Promise<QuizAttempt> => {
  if (USE_MOCK) {
    await delay();
    const correct: Record<number, number> = { 1: 1, 2: 2, 3: 3 };
    let score = 0;
    for (const k in correct) if (correct[+k] === answers[+k]) score += 10;
    return { id: attemptId, quizId: 1, userId: 1, startedAt: new Date().toISOString(), submittedAt: new Date().toISOString(), score, answers };
  }
  return unwrap<QuizAttempt>(apiClient.post(`/quizzes/attempts/${attemptId}/submit`, { answers }));
};

export const getQuizAttempts = async (quizId: number): Promise<QuizAttempt[]> => {
  if (USE_MOCK) {
    await delay();
    return [];
  }
  return unwrap<QuizAttempt[]>(apiClient.get(`/quizzes/${quizId}/attempts`));
};

export const createQuiz = async (data: Partial<Quiz>): Promise<Quiz> => {
  if (USE_MOCK) {
    await delay();
    return {
      id: Date.now(), classId: data.classId ?? 0, title: data.title ?? '',
      description: data.description ?? '', startTime: data.startTime ?? '',
      endTime: data.endTime ?? '', durationMinutes: data.durationMinutes ?? 30,
      maxAttempts: data.maxAttempts ?? 1, status: 'DRAFT',
    };
  }
  return unwrap<Quiz>(apiClient.post('/quizzes', data));
};

export const updateQuiz = async (quizId: number, data: Partial<Quiz>): Promise<Quiz> => {
  if (USE_MOCK) {
    await delay();
    return { id: quizId, classId: 101, title: data.title ?? '', startTime: '', endTime: '', durationMinutes: 30, maxAttempts: 1, status: 'PUBLISHED', ...data };
  }
  return unwrap<Quiz>(apiClient.put(`/quizzes/${quizId}`, data));
};

export const deleteQuiz = async (quizId: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/quizzes/${quizId}`));
};
