// Progress & Enrollment service
import { apiClient, unwrap } from './api/client';
import type { Clazz, EnrollmentProgress } from '../types';

export const markLessonComplete = async (lessonId: number, enrollmentId: number): Promise<void> => {
  try {
    await unwrap<void>(apiClient.post(`/progress/lessons/${lessonId}/complete`, null, { params: { enrollmentId } }));
  } catch {
    try {
      await unwrap<void>(apiClient.post(`/progress/lessons/${lessonId}/complete`, { enrollmentId }));
    } catch {
      await unwrap<void>(apiClient.post(`/lessons/${lessonId}/complete`, { enrollmentId }));
    }
  }
};

export const getEnrollmentProgress = async (enrollmentId: number): Promise<EnrollmentProgress | null> => {
  try {
    return await unwrap<EnrollmentProgress>(apiClient.get(`/enrollments/${enrollmentId}/progress`));
  } catch {
    try {
      return await unwrap<EnrollmentProgress>(apiClient.get(`/progress/enrollment/${enrollmentId}`));
    } catch {
      try {
        return await unwrap<EnrollmentProgress>(apiClient.get(`/me/classes/${enrollmentId}/progress`));
      } catch {
        return null;
      }
    }
  }
};

export const getMyEnrollments = async (): Promise<Clazz[]> => {
  return unwrap<Clazz[]>(apiClient.get('/me/classes'));
};
