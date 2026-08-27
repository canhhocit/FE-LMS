// Grading service — grades + attendance
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay, mockGrades, mockAttendance } from './mock';
import type { Grade, Attendance, AttendanceRecord } from '../types';

// ===== Grades (Lecturer/Admin/Student) =====
export const getGrades = async (classId: number): Promise<Grade[]> => {
  if (USE_MOCK) { await delay(); return mockGrades.filter((g) => g.classId === classId); }
  return unwrap<Grade[]>(apiClient.get(`/classes/${classId}/grades`));
};
export const createGrade = async (classId: number, data: Omit<Grade, 'id' | 'classId' | 'createdAt'>): Promise<Grade> => {
  if (USE_MOCK) {
    await delay();
    const g: Grade = { id: Date.now(), classId, createdAt: new Date().toISOString(), ...data };
    mockGrades.push(g);
    return g;
  }
  return unwrap<Grade>(apiClient.post(`/classes/${classId}/grades`, data));
};
export const getMyGrades = async (): Promise<Grade[]> => {
  if (USE_MOCK) {
    await delay();
    const meId = JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 3;
    return mockGrades.filter((g) => g.studentId === meId);
  }
  return unwrap<Grade[]>(apiClient.get('/me/grades'));
};

// ===== Attendance =====
export const getAttendance = async (classId: number, date?: string): Promise<Attendance[]> => {
  if (USE_MOCK) {
    await delay();
    let rs = mockAttendance.filter((a) => a.classId === classId);
    if (date) rs = rs.filter((a) => a.date === date);
    return rs;
  }
  return unwrap<Attendance[]>(apiClient.get(`/classes/${classId}/attendance`, { params: { date } }));
};
export const submitAttendance = async (classId: number, payload: { date: string; records: AttendanceRecord[] }): Promise<Attendance> => {
  if (USE_MOCK) {
    await delay();
    const att: Attendance = { classId, date: payload.date, records: payload.records };
    const idx = mockAttendance.findIndex((a) => a.classId === classId && a.date === payload.date);
    if (idx >= 0) mockAttendance[idx] = att; else mockAttendance.push(att);
    return att;
  }
  return unwrap<Attendance>(apiClient.post(`/classes/${classId}/attendance`, payload));
};
export const getMyAttendance = async (classId: number): Promise<Attendance[]> => {
  if (USE_MOCK) {
    await delay();
    const meId = JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 3;
    return mockAttendance
      .filter((a) => a.classId === classId)
      .map((a) => ({ ...a, records: a.records.filter((r) => r.studentId === meId) }));
  }
  return unwrap<Attendance[]>(apiClient.get(`/classes/${classId}/attendance/me`));
};
