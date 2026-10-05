import { apiClient, unwrap } from './api/client';

export interface GradingPolicy {
  id: number;
  attendanceWeight: number;
  midtermWeight: number;
  finalWeight: number;
  curriculumId: number;
}

export interface GpaScaleRule {
  id: number;
  min10Scale: number;
  max10Scale: number;
  gpaScale: number;
  letterGrade: string;
}

export const getGradingPolicyPublic = async (curriculumId: number): Promise<GradingPolicy> =>
  unwrap<GradingPolicy>(apiClient.get(`/curricula/${curriculumId}/grading-policy`));

export const getGradingPolicy = async (curriculumId: number): Promise<GradingPolicy> =>
  unwrap<GradingPolicy>(apiClient.get(`/admin/curricula/${curriculumId}/grading-policy`));

export const updateGradingPolicy = async (
  curriculumId: number,
  payload: { attendanceWeight: number; midtermWeight: number; finalWeight: number }
): Promise<GradingPolicy> =>
  unwrap<GradingPolicy>(apiClient.put(`/admin/curricula/${curriculumId}/grading-policy`, payload));

export const getGpaScaleRules = async (curriculumId: number): Promise<GpaScaleRule[]> =>
  unwrap<GpaScaleRule[]>(apiClient.get(`/admin/curricula/${curriculumId}/gpa-scale`));

export const updateGpaScaleRules = async (
  curriculumId: number,
  payload: Omit<GpaScaleRule, 'id'>[]
): Promise<GpaScaleRule[]> =>
  unwrap<GpaScaleRule[]>(apiClient.put(`/admin/curricula/${curriculumId}/gpa-scale`, payload));
