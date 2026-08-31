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
export const uploadSubmissionFile = async (assignmentId: number, file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  return unwrap<string>(apiClient.post(`/assignments/${assignmentId}/submit-file`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }));
};
export const uploadSubmissionFiles = async (assignmentId: number, files: File[]): Promise<string[]> => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return unwrap<string[]>(apiClient.post(`/assignments/${assignmentId}/submit-files`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }));
};
export const submitAssignment = async (assignmentId: number, payload: {
  submissionType?: 'FILE' | 'IMAGE' | 'GOOGLE_DRIVE_LINK' | 'GITHUB_LINK';
  fileUrl?: string;
  fileUrls?: string[];
  externalLink?: string;
}): Promise<Submission> => {
  return unwrap<Submission>(apiClient.post(`/assignments/${assignmentId}/submit`, payload));
};
export const getMySubmissions = async (): Promise<Submission[]> => {
  return unwrap<Submission[]>(apiClient.get('/me/submissions'));
};