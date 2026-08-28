import { apiClient, unwrap } from './api/client';
import type { AcademicStatus, EnrollmentReport, ScoreReport, TranscriptItem, DashboardStats } from '../types';
export const getDashboardStats = async (): Promise<DashboardStats> => unwrap(apiClient.get('/admin/dashboard'));
export const getEnrollmentsByMonth = async (): Promise<EnrollmentReport[]> => { const data = await unwrap<Record<string, number>>(apiClient.get('/admin/reports/enrollments-by-month')); return Object.entries(data ?? {}).map(([month, count]) => ({ month, count })); };
export const getAverageScoreByClazz = async (): Promise<ScoreReport[]> => { const data = await unwrap<Record<string, number>>(apiClient.get('/admin/reports/average-score-by-clazz')); return Object.entries(data ?? {}).map(([classId, averageScore]) => ({ classId: Number(classId), classCode: classId, className: classId, averageScore, studentCount: 0 })); };
export const getAcademicStatus = async (): Promise<AcademicStatus> => unwrap(apiClient.get('/me/academic-status'));
export const getTranscript = async (): Promise<TranscriptItem[]> => unwrap(apiClient.get('/me/transcript'));
export const exportEnrollmentsExcel = async (): Promise<Blob> => { throw new Error('MISSING_BACKEND_API: enrollment report export'); };
export const exportScorePdf = async (): Promise<Blob> => { throw new Error('MISSING_BACKEND_API: score report export'); };
