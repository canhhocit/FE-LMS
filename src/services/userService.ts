import { apiClient, unwrap } from './api/client';
import type { Role, User } from '../types';

export const importUsersByRole = async (role: Role, file: File): Promise<User[]> => {
  const form = new FormData();
  form.append('file', file);
  const endpoint = role === 'STUDENT' ? '/admin/users/import-students' : '/admin/users/import-lecturers';
  return unwrap(apiClient.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } }));
};

export const exportUsersByRole = async (role: Role): Promise<Blob> => {
  const endpoint = role === 'STUDENT' ? '/admin/users/students/export' : '/admin/users/lecturers/export';
  const response = await apiClient.get(endpoint, { responseType: 'blob' });
  return response.data;
};

export interface UserCreateRequest {
  email: string;
  fullName: string;
  password?: string;
  role: Role;
  phone?: string;
  studentCode?: string;
  lecturerCode?: string;
  faculty?: string;
  major?: string;
  dateOfBirth?: string;
  adminClassId?: number;
  adminClassName?: string;
}

export const createUser = async (data: UserCreateRequest): Promise<User> =>
  unwrap(apiClient.post('/admin/users', data));

export const getUserById = async (id: number): Promise<User> =>
  unwrap(apiClient.get(`/admin/users/${id}`));

export const updateUser = async (id: number, data: UserCreateRequest): Promise<User> =>
  unwrap(apiClient.put(`/admin/users/${id}`, data));

export const deleteUser = async (id: number): Promise<void> =>
  unwrap(apiClient.delete(`/admin/users/${id}`));

export const resetPassword = async (id: number): Promise<void> =>
  unwrap(apiClient.post(`/admin/users/${id}/reset-password`));

export const updateUserStatus = async (id: number, status: string): Promise<void> =>
  unwrap(apiClient.patch(`/admin/users/${id}/status`, null, { params: { status } }));
