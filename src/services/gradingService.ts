// Grading service — grades + attendance
import { apiClient, unwrap } from './api/client';
import type { Grade, AttendanceRecord } from '../types';

// ===== Grades (Lecturer/Admin/Student) =====
export const getGrades = async (classId: number): Promise<Grade[]> => {
  return unwrap<Grade[]>(apiClient.get(`/classes/${classId}/grades`));
};
export const createGrade = async (classId: number, data: { studentId: number; midtermScore?: number; finalScore?: number }): Promise<Grade> => unwrap(apiClient.post(`/classes/${classId}/grades`, data));
export const getMyGrades = async (): Promise<Grade[]> => {
  return unwrap<Grade[]>(apiClient.get('/me/grades'));
};

// ===== Attendance =====
export const getAttendance = async (classId: number, date?: string): Promise<AttendanceRecord[]> => unwrap(apiClient.get(`/classes/${classId}/attendance`, { params: date ? { date } : undefined }));
export const submitAttendance = async (classId: number, payload: { attendanceDate: string; records: { studentId: number; status: AttendanceRecord['status'] }[] }): Promise<AttendanceRecord[]> => unwrap(apiClient.post(`/classes/${classId}/attendance`, payload));
export const getMyAttendance = async (classId: number): Promise<AttendanceRecord[]> => unwrap(apiClient.get(`/classes/${classId}/attendance/me`));


export interface QrTokenResponse {
  otpToken: string;
  expiresInSeconds: number;
  qrPayload: string;
}

export interface AcademicRiskResponse {
  studentId: number;
  studentName: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warningReasons: string[];
}

export const generateQrCodeToken = async (classId: number): Promise<QrTokenResponse> => {
  return unwrap<QrTokenResponse>(apiClient.post(/attendance/qr/generate?classId=));
};

export const validateQrCodeToken = async (classId: number, otpToken: string): Promise<void> => {
  await unwrap<void>(apiClient.post(/attendance/qr/validate, { classId, otpToken }));
};

export const getAcademicRiskWarning = async (studentId: number): Promise<AcademicRiskResponse> => {
  return unwrap<AcademicRiskResponse>(apiClient.get(/grading/academic-risk/));
};
