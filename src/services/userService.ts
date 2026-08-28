import { apiClient, unwrap } from './api/client';
import type { Role, User } from '../types';

export const importUsersByRole = async (role: Role, file: File): Promise<User[]> => {
  const form = new FormData(); form.append('file', file);
  return unwrap(apiClient.post(`/admin/users/import/${role.toLowerCase()}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }));
};
export const exportUsersByRole = async (role: Role): Promise<Blob> => {
  const response = await apiClient.get(`/admin/users/export/${role.toLowerCase()}`, { responseType: 'blob' });
  return response.data;
};
