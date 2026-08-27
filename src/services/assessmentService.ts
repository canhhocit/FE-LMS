// Assessment service — assignments + submissions
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay, mockAssignments, mockSubmissions } from './mock';
import type { Assignment, Submission } from '../types';

// ===== Assignments =====
export const getAssignments = async (classId: number): Promise<Assignment[]> => {
  if (USE_MOCK) { await delay(); return mockAssignments.filter((a) => a.classId === classId); }
  return unwrap<Assignment[]>(apiClient.get(`/classes/${classId}/assignments`));
};
export const createAssignment = async (classId: number, data: Omit<Assignment, 'id' | 'classId' | 'createdAt'>): Promise<Assignment> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), classId, createdAt: new Date().toISOString(), ...data };
  }
  return unwrap<Assignment>(apiClient.post(`/classes/${classId}/assignments`, data));
};

// ===== Submissions (Lecturer view) =====
export const getSubmissions = async (assignmentId: number): Promise<Submission[]> => {
  if (USE_MOCK) { await delay(); return mockSubmissions.filter((s) => s.assignmentId === assignmentId); }
  return unwrap<Submission[]>(apiClient.get(`/assignments/${assignmentId}/submissions`));
};
export const gradeSubmission = async (submissionId: number, payload: { score: number; feedback?: string }): Promise<Submission> => {
  if (USE_MOCK) {
    await delay();
    const idx = mockSubmissions.findIndex((s) => s.id === submissionId);
    if (idx < 0) throw { code: 404, message: 'Không tìm thấy bài nộp' };
    mockSubmissions[idx] = { ...mockSubmissions[idx], ...payload, status: 'GRADED' };
    return mockSubmissions[idx];
  }
  return unwrap<Submission>(apiClient.put(`/submissions/${submissionId}/grade`, payload));
};

// ===== Submissions (Student view) =====
export const submitAssignment = async (assignmentId: number, payload: { content: string; fileUrl?: string }): Promise<Submission> => {
  if (USE_MOCK) {
    await delay();
    const meId = JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 3;
    const sub: Submission = {
      id: Date.now(), assignmentId, studentId: meId, studentName: 'Tôi',
      submittedAt: new Date().toISOString(), status: 'SUBMITTED', ...payload,
    };
    mockSubmissions.push(sub);
    return sub;
  }
  return unwrap<Submission>(apiClient.post(`/assignments/${assignmentId}/submit`, payload));
};
export const getMySubmissions = async (): Promise<Submission[]> => {
  if (USE_MOCK) {
    await delay();
    const meId = JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 3;
    return mockSubmissions.filter((s) => s.studentId === meId);
  }
  return unwrap<Submission[]>(apiClient.get('/me/submissions'));
};