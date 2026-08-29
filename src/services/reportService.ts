import { apiClient, unwrap } from './api/client';
import type { AcademicStatus, EnrollmentReport, ScoreReport, TranscriptItem, DashboardStats } from '../types';

const toNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const getDashboardStats = async (): Promise<DashboardStats> => unwrap(apiClient.get('/admin/dashboard'));
export const getEnrollmentsByMonth = async (): Promise<EnrollmentReport[]> => { const data = await unwrap<{ series?: Record<string, number> }>(apiClient.get('/admin/reports/enrollments-by-month')); return Object.entries(data?.series ?? {}).map(([month, count]) => ({ month, count })); };
export const getAverageScoreByClazz = async (): Promise<ScoreReport[]> => { const data = await unwrap<Record<string, number>>(apiClient.get('/admin/reports/average-score-by-clazz')); return Object.entries(data ?? {}).map(([className, averageScore]) => ({ classId: className, classCode: className, className, averageScore })); };
export const getAcademicStatus = async (): Promise<AcademicStatus> => {
  const data = await unwrap<AcademicStatus>(apiClient.get('/me/academic-status'));
  return {
    ...data,
    cumulativeGpa: toNumber(data?.cumulativeGpa),
    totalCredits: data?.totalCredits ?? 0,
    passedCredits: data?.passedCredits ?? 0,
    warningLevel: data?.warningLevel ?? null,
    totalCourses: data?.totalCourses ?? 0,
    passedCourses: data?.passedCourses ?? 0,
    failedCourses: (data?.failedCourses ?? []).map((course) => ({
      ...course,
      credit: Number(course.credit ?? 0),
      totalScore: toNumber(course.totalScore),
    })),
  };
};
export const getTranscript = async (): Promise<TranscriptItem[]> => {
  const rows = await unwrap<TranscriptItem[]>(apiClient.get('/me/transcript'));
  return rows.map((row) => ({
    ...row,
    credit: Number(row.credit ?? 0),
    totalScore: toNumber(row.totalScore),
    gpa: toNumber(row.gpa),
  }));
};
export const exportEnrollmentsExcel = async (): Promise<Blob> => { throw new Error('MISSING_BACKEND_API: enrollment report export'); };
export const exportScorePdf = async (): Promise<Blob> => { throw new Error('MISSING_BACKEND_API: score report export'); };
