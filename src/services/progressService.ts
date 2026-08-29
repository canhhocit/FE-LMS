// Progress & Enrollment service
import { apiClient, unwrap } from './api/client';
import type { Clazz, EnrollmentProgress } from '../types';

export const markLessonComplete = async (lessonId: number, enrollmentId: number): Promise<void> =>
  unwrap<void>(apiClient.post(`/progress/lessons/${lessonId}/complete`, null, { params: { enrollmentId } }));

export const getEnrollmentProgress = async (enrollmentId: number): Promise<EnrollmentProgress> => {
  return unwrap<EnrollmentProgress>(apiClient.get(`/enrollments/${enrollmentId}/progress`));
};

export const getMyEnrollments = async (): Promise<Clazz[]> => {
  return unwrap<Clazz[]>(apiClient.get('/me/classes'));
};
