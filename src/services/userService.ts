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
