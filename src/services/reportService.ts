// Report service (admin)
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { DashboardStats, EnrollmentReport, ScoreReport, AcademicStatus, TranscriptItem } from '../types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  if (USE_MOCK) {
    await delay();
    return { totalUsers: 1240, totalClasses: 38, totalEnrollments: 4200, totalAssignments: 152, totalSubmissions: 3800 };
  }
  return unwrap<DashboardStats>(apiClient.get('/admin/dashboard'));
};

export const getEnrollmentsByMonth = async (): Promise<EnrollmentReport[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { month: '2025-09', count: 1200 },
      { month: '2025-10', count: 1450 },
      { month: '2026-02', count: 1550 },
    ];
  }
  return unwrap<EnrollmentReport[]>(apiClient.get('/admin/reports/enrollments-by-month'));
};

export const getAverageScoreByClazz = async (): Promise<ScoreReport[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { classId: 101, classCode: 'CS101', className: 'Nhap mon LT', averageScore: 7.8, studentCount: 45 },
      { classId: 102, classCode: 'CS201', className: 'Cau truc du lieu', averageScore: 6.9, studentCount: 38 },
    ];
  }
  return unwrap<ScoreReport[]>(apiClient.get('/admin/reports/average-score-by-clazz'));
};

export const exportEnrollmentsExcel = async (): Promise<Blob> => {
  if (USE_MOCK) {
    await delay();
    return new Blob(['mock,data\n1,2'], { type: 'text/csv' });
  }
  const res = await apiClient.get('/admin/reports/enrollments/export', { responseType: 'blob' });
  return res.data as Blob;
};

export const exportScorePdf = async (): Promise<Blob> => {
  if (USE_MOCK) {
    await delay();
    return new Blob(['mock pdf'], { type: 'application/pdf' });
  }
  const res = await apiClient.get('/admin/reports/score/export', { responseType: 'blob' });
  return res.data as Blob;
};

export const getAcademicStatus = async (): Promise<AcademicStatus> => {
  if (USE_MOCK) {
    await delay();
    return { semester: 'HK2 2025-2026', gpa: 7.8, cumulativeGpa: 7.5, totalCredits: 18, earnedCredits: 18, warningLevel: 'NONE' };
  }
  return unwrap<AcademicStatus>(apiClient.get('/me/academic-status'));
};

export const getTranscript = async (): Promise<TranscriptItem[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { semester: 'HK1 2025-2026', courseCode: 'CS101', courseName: 'Nhap mon LT', credits: 3, score: 8.0, letter: 'B+' },
      { semester: 'HK1 2025-2026', courseCode: 'CS102', courseName: 'Toan roi rac', credits: 3, score: 7.5, letter: 'B' },
      { semester: 'HK2 2025-2026', courseCode: 'CS201', courseName: 'Cau truc du lieu', credits: 3, score: 8.5, letter: 'A' },
    ];
  }
  return unwrap<TranscriptItem[]>(apiClient.get('/me/transcript'));
};
