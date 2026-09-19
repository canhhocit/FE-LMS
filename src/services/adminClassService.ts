import { apiClient, unwrap } from './api/client';

export interface AdminClassRequest {
  className: string;
  faculty?: string;
  academicYear?: string;
  curriculumId?: number;
  homeroomTeacherId?: number;
}

export interface AdminClassResponse {
  id: number;
  className: string;
  faculty?: string;
  facultyName?: string;
  advisorName?: string;
  academicYear?: string;
  curriculumId?: number;
  curriculumName?: string;
  homeroomTeacherId?: number;
  homeroomTeacherName?: string;
  homeroomTeacherCode?: string;
  studentCount?: number;
}

export const getAllAdminClasses = async (): Promise<AdminClassResponse[]> => unwrap(apiClient.get('/admin/administrative-classes'));
export const getAdminClassById = async (id: number): Promise<AdminClassResponse> => unwrap(apiClient.get(`/admin/administrative-classes/${id}`));
export const createAdminClass = async (data: AdminClassRequest): Promise<AdminClassResponse> => unwrap(apiClient.post('/admin/administrative-classes', data));
export const updateAdminClass = async (id: number, data: AdminClassRequest): Promise<AdminClassResponse> => unwrap(apiClient.put(`/admin/administrative-classes/${id}`, data));
export const deleteAdminClass = async (id: number): Promise<void> => { await apiClient.delete(`/admin/administrative-classes/${id}`); };
export const getStudentsByAdminClass = async (id: number): Promise<any[]> => unwrap(apiClient.get(`/admin/administrative-classes/${id}/students`));
