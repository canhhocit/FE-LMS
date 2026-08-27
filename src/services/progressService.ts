// Progress & Enrollment service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { EnrollmentProgress, LessonProgress, Enrollment } from '../types';

export const markLessonComplete = async (lessonId: number, enrollmentId: number): Promise<LessonProgress> => {
  if (USE_MOCK) {
    await delay();
    return { lessonId, completed: true, completedAt: new Date().toISOString() };
  }
  return unwrap<LessonProgress>(apiClient.post(`/progress/lessons/${lessonId}/complete`, null, { params: { enrollmentId } }));
};

export const getEnrollmentProgress = async (enrollmentId: number): Promise<EnrollmentProgress> => {
  if (USE_MOCK) {
    await delay();
    return { enrollmentId, classId: 101, totalLessons: 10, completedLessons: 4, percent: 40, lessons: [] };
  }
  return unwrap<EnrollmentProgress>(apiClient.get(`/enrollments/${enrollmentId}/progress`));
};

export const getMyEnrollments = async (): Promise<Enrollment[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, classId: 101, classCode: 'CS101', className: 'Nhap mon LT', status: 'ENROLLED', progress: 40 },
      { id: 2, classId: 102, classCode: 'CS201', className: 'Cau truc du lieu', status: 'ENROLLED', progress: 70 },
    ];
  }
  // /me/classes co the tra ve lop da enroll
  return unwrap<Enrollment[]>(apiClient.get('/me/classes'));
};
