// Curriculum & Prerequisite service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { Curriculum, Course, Prerequisite } from '../types';

export const getCurricula = async (): Promise<Curriculum[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, code: 'CS-K2024', name: 'CNTT - K2024', description: 'Chuong trinh dao tao CNTT', totalCredits: 130 },
      { id: 2, code: 'IS-K2024', name: 'HTTT - K2024', description: 'Chuong trinh dao tao HTTT', totalCredits: 125 },
    ];
  }
  return unwrap<Curriculum[]>(apiClient.get('/admin/curricula'));
};

export const getCurriculum = async (id: number): Promise<Curriculum> => {
  if (USE_MOCK) {
    await delay();
    return { id, code: `CT-${id}`, name: `CT ${id}`, totalCredits: 130 };
  }
  return unwrap<Curriculum>(apiClient.get(`/curricula/${id}`));
};

export const createCurriculum = async (data: Partial<Curriculum>): Promise<Curriculum> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), code: data.code ?? '', name: data.name ?? '', totalCredits: data.totalCredits ?? 0, description: data.description };
  }
  return unwrap<Curriculum>(apiClient.post('/admin/curricula', data));
};

export const updateCurriculum = async (id: number, data: Partial<Curriculum>): Promise<Curriculum> => {
  if (USE_MOCK) { await delay(); return { id, code: '', name: '', totalCredits: 0, ...data }; }
  return unwrap<Curriculum>(apiClient.put(`/admin/curricula/${id}`, data));
};

export const deleteCurriculum = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/admin/curricula/${id}`));
};

export const getCoursesByCurriculum = async (curriculumId: number): Promise<Course[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 101, code: 'CS101', name: 'Nhap mon LT', credits: 3 },
      { id: 102, code: 'CS201', name: 'Cau truc du lieu', credits: 3 },
    ];
  }
  return unwrap<Course[]>(apiClient.get(`/curricula/${curriculumId}/courses`));
};

export const getAllCourses = async (): Promise<Course[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 101, code: 'CS101', name: 'Nhap mon LT', credits: 3 },
      { id: 102, code: 'CS201', name: 'Cau truc du lieu', credits: 3 },
      { id: 103, code: 'CS301', name: 'Thuat toan', credits: 3 },
    ];
  }
  return unwrap<Course[]>(apiClient.get('/admin/courses'));
};

export const createCourse = async (data: Partial<Course>): Promise<Course> => {
  if (USE_MOCK) { await delay(); return { id: Date.now(), code: data.code ?? '', name: data.name ?? '', credits: data.credits ?? 0 }; }
  return unwrap<Course>(apiClient.post('/admin/courses', data));
};

export const deleteCourse = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/admin/courses/${id}`));
};

export const getPrerequisites = async (courseId: number): Promise<Prerequisite[]> => {
  if (USE_MOCK) {
    await delay();
    return [{ id: 1, courseId, prerequisiteCourseId: 101 }];
  }
  return unwrap<Prerequisite[]>(apiClient.get(`/courses/${courseId}/prerequisites`));
};

export const addPrerequisite = async (courseId: number, prereqId: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.post(`/admin/courses/${courseId}/prerequisites`, { prerequisiteCourseId: prereqId }));
};

export const removePrerequisite = async (courseId: number, prereqId: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/admin/courses/${courseId}/prerequisites/${prereqId}`));
};

export const checkPrerequisite = async (courseId: number): Promise<{ allowed: boolean; missing: number[] }> => {
  if (USE_MOCK) { await delay(); return { allowed: true, missing: [] }; }
  return unwrap<{ allowed: boolean; missing: number[] }>(apiClient.get(`/courses/${courseId}/prerequisites/check`));
};
