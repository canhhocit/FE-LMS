import { apiClient, unwrap } from './api/client';
import type { Quiz, QuizQuestion, QuizAttempt } from '../types';

export type QuizStart = string;
export type QuizAnswer = { questionId: number; selectedAnswer: 'A' | 'B' | 'C' | 'D' };

export const getQuizzesByClass = async (classId: number): Promise<Quiz[]> =>
  unwrap<Quiz[]>(apiClient.get(`/quizzes/class/${classId}`));

export const getQuiz = async (quizId: number): Promise<Quiz> =>
  unwrap<Quiz>(apiClient.get(`/quizzes/${quizId}`));

export const getQuizQuestions = async (quizId: number): Promise<QuizQuestion[]> =>
  unwrap<QuizQuestion[]>(apiClient.get(`/quizzes/${quizId}/questions`));

export const startQuiz = async (quizId: number): Promise<QuizStart> =>
  unwrap<QuizStart>(apiClient.post(`/quizzes/${quizId}/start`));

export const submitQuiz = async (quizId: number, answers: QuizAnswer[]): Promise<QuizAttempt> =>
  unwrap<QuizAttempt>(apiClient.post(`/quizzes/${quizId}/attempts`, { answers }));

export const createQuiz = async (classId: number, data: Omit<Quiz, 'id' | 'classId' | 'createdAt'>): Promise<Quiz> =>
  unwrap<Quiz>(apiClient.post(`/quizzes/class/${classId}`, data));

export const updateQuiz = async (quizId: number, data: Partial<Omit<Quiz, 'id' | 'classId' | 'createdAt'>>): Promise<Quiz> =>
  unwrap<Quiz>(apiClient.put(`/quizzes/${quizId}`, data));

export const deleteQuiz = async (quizId: number): Promise<void> =>
  unwrap<void>(apiClient.delete(`/quizzes/${quizId}`));

// Question CRUD
export interface QuestionRequest {
  content?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export const createQuestion = async (quizId: number, data: QuestionRequest): Promise<QuizQuestion> =>
  unwrap<QuizQuestion>(apiClient.post(`/quizzes/${quizId}/questions`, data));

export const updateQuestion = async (questionId: number, data: QuestionRequest): Promise<QuizQuestion> =>
  unwrap<QuizQuestion>(apiClient.put(`/quizzes/questions/${questionId}`, data));

export const deleteQuestion = async (questionId: number): Promise<void> => {
  await apiClient.delete(`/quizzes/questions/${questionId}`);
};
