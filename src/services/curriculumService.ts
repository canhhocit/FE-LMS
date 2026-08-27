// Curriculum & Prerequisite service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { Curriculum, Course, Prerequisite } from '../types';

const normalizeCurriculum = (item: Curriculum): Curriculum => ({
  ...item,
  code: item.code ?? `CT-${item.id}`,
  totalCredits: item.totalCredits ?? 0,
  description: item.description ?? '',
});

const normalizeCourse = (item: Course): Course => ({
  ...item,
  title: item.title ?? item.name ?? `Course ${item.id}`,
  code: item.code ?? '',
  credit: item.credit ?? item.credits ?? 0,
  name: item.name ?? item.title ?? `Course ${item.id}`,
  credits: item.credits ?? item.credit ?? 0,
});

export const getCurricula = async (): Promise<Curriculum[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, code: 'CS-K2024', name: 'CNTT - K2024', description: 'Chuong trinh dao tao CNTT', totalCredits: 130 },
      { id: 2, code: 'IS-K2024', name: 'HTTT - K2024', description: 'Chuong trinh dao tao HTTT', totalCredits: 125 },
    ].map(normalizeCurriculum);
  }
  return unwrap<Curriculum[]>(apiClient.get('/admin/curricula')).then((items) => items.map(normalizeCurriculum));
};

export const getCurriculum = async (id: number): Promise<Curriculum> => {
  if (USE_MOCK) {
    await delay();
    return normalizeCurriculum({ id, code: `CT-${id}`, name: `CT ${id}`, totalCredits: 130 });
  }
  return unwrap<Curriculum>(apiClient.get(`/curricula/${id}`)).then(normalizeCurriculum);
};

export const createCurriculum = async (data: Partial<Curriculum>): Promise<Curriculum> => {
  if (USE_MOCK) {
    await delay();
    return normalizeCurriculum({ id: Date.now(), code: data.code ?? '', name: data.name ?? '', totalCredits: data.totalCredits ?? 0, description: data.description });
  }
  return unwrap<Curriculum>(apiClient.post('/admin/curricula', data)).then(normalizeCurriculum);
};

export const updateCurriculum = async (id: number, data: Partial<Curriculum>): Promise<Curriculum> => {
  if (USE_MOCK) { await delay(); return normalizeCurriculum({ id, code: '', name: '', totalCredits: 0, ...data }); }
  return unwrap<Curriculum>(apiClient.put(`/admin/curricula/${id}`, data)).then(normalizeCurriculum);
};

export const deleteCurriculum = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/admin/curricula/${id}`));
};

export const getCoursesByCurriculum = async (curriculumId: number): Promise<Course[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 101, code: 'CS101', title: 'Nhap mon LT', credit: 3 },
      { id: 102, code: 'CS201', title: 'Cau truc du lieu', credit: 3 },
    ].map(normalizeCourse);
  }
  return unwrap<Course[]>(apiClient.get(`/curricula/${curriculumId}/courses`)).then((items) => items.map(normalizeCourse));
};

export const getAllCourses = async (): Promise<Course[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 101, code: 'CS101', title: 'Nhap mon LT', credit: 3 },
      { id: 102, code: 'CS201', title: 'Cau truc du lieu', credit: 3 },
      { id: 103, code: 'CS301', title: 'Thuat toan', credit: 3 },
    ].map(normalizeCourse);
  }
  return unwrap<Course[]>(apiClient.get('/admin/courses')).then((items) => items.map(normalizeCourse));
};

export const createCourse = async (data: Partial<Course>): Promise<Course> => {
  if (USE_MOCK) { await delay(); return normalizeCourse({ id: Date.now(), code: data.code ?? '', title: data.title ?? data.name ?? '', credit: data.credit ?? data.credits ?? 0, name: data.name ?? data.title ?? '' }); }
  return unwrap<Course>(apiClient.post('/admin/courses', data)).then(normalizeCourse);
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
