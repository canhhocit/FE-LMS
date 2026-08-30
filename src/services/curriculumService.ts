import { apiClient, unwrap } from './api/client';
import type { Curriculum, Course, Prerequisite, GradingPolicy, GpaScaleRule } from '../types';
export const getCurricula = async (): Promise<Curriculum[]> => unwrap(apiClient.get('/admin/curricula'));
export const getCurriculum = async (id: number): Promise<Curriculum> => unwrap(apiClient.get(`/curricula/${id}`));
export const createCurriculum = async (data: Omit<Curriculum, 'id'>): Promise<Curriculum> => unwrap(apiClient.post('/admin/curricula', data));
export const updateCurriculum = async (id: number, data: Partial<Curriculum>): Promise<Curriculum> => unwrap(apiClient.put(`/admin/curricula/${id}`, data));
export const deleteCurriculum = async (id: number): Promise<void> => { await apiClient.delete(`/admin/curricula/${id}`); };
export const getCoursesByCurriculum = async (id: number): Promise<Course[]> => unwrap(apiClient.get(`/curricula/${id}/courses`));
export const getAllCourses = async (): Promise<Course[]> => unwrap(apiClient.get('/admin/courses'));
export const createCourse = async (data: Omit<Course, 'id' | 'createdAt'>): Promise<Course> => unwrap(apiClient.post('/admin/courses', data));
export const deleteCourse = async (id: number): Promise<void> => { await apiClient.delete(`/admin/courses/${id}`); };
export const getPrerequisites = async (id: number): Promise<Prerequisite[]> => unwrap(apiClient.get(`/courses/${id}/prerequisites`));
export const addPrerequisite = async (id: number, prerequisiteCourseId: number): Promise<void> => { await apiClient.post(`/admin/courses/${id}/prerequisites`, { prerequisiteCourseId }); };
export const removePrerequisite = async (id: number, prerequisiteId: number): Promise<void> => { await apiClient.delete(`/admin/courses/${id}/prerequisites/${prerequisiteId}`); };
export const checkPrerequisite = async (id: number): Promise<number[]> => unwrap(apiClient.get(`/courses/${id}/prerequisites/check`));

export const getGradingPolicyPublic = async (curriculumId: number): Promise<GradingPolicy> =>
  unwrap(apiClient.get(`/curricula/${curriculumId}/grading-policy`));

export const getGradingPolicy = async (curriculumId: number): Promise<GradingPolicy> =>
  unwrap(apiClient.get(`/admin/curricula/${curriculumId}/grading-policy`));

export const updateGradingPolicy = async (curriculumId: number, data: Omit<GradingPolicy, 'id' | 'curriculumId'>): Promise<GradingPolicy> =>
  unwrap(apiClient.put(`/admin/curricula/${curriculumId}/grading-policy`, data));

export const getGpaScaleRules = async (curriculumId: number): Promise<GpaScaleRule[]> =>
  unwrap(apiClient.get(`/admin/curricula/${curriculumId}/gpa-scale`));

export const updateGpaScaleRules = async (curriculumId: number, data: Omit<GpaScaleRule, 'id' | 'curriculumId'>[]): Promise<GpaScaleRule[]> =>
  unwrap(apiClient.put(`/admin/curricula/${curriculumId}/gpa-scale`, data));
