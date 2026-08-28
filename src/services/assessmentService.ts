// Assessment service — assignments + submissions
import { apiClient, unwrap } from './api/client';
import type { Assignment, Submission } from '../types';

// ===== Assignments =====
export const getAssignments = async (classId: number): Promise<Assignment[]> => {
  return unwrap<Assignment[]>(apiClient.get(`/classes/${classId}/assignments`));
};
export const createAssignment = async (classId: number, data: Omit<Assignment, 'id' | 'classId' | 'createdAt'>): Promise<Assignment> => {
  return unwrap<Assignment>(apiClient.post(`/classes/${classId}/assignments`, data));
};

// ===== Submissions (Lecturer view) =====
export const getSubmissions = async (assignmentId: number): Promise<Submission[]> => {
  return unwrap<Submission[]>(apiClient.get(`/assignments/${assignmentId}/submissions`));
};
export const gradeSubmission = async (submissionId: number, payload: { score: number; feedback?: string }): Promise<Submission> => {
  return unwrap<Submission>(apiClient.put(`/submissions/${submissionId}/grade`, payload));
};

// ===== Submissions (Student view) =====
export const submitAssignment = async (assignmentId: number, payload: { fileUrl: string }): Promise<Submission> => {
  return unwrap<Submission>(apiClient.post(`/assignments/${assignmentId}/submit`, payload));
};
export const getMySubmissions = async (): Promise<Submission[]> => {
  return unwrap<Submission[]>(apiClient.get('/me/submissions'));
};