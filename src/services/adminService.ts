import { apiClient, unwrap } from './api/client';
import type { DashboardStats, User } from '../types';

export const getDashboardStats = async (): Promise<DashboardStats> => unwrap(apiClient.get('/admin/dashboard'));
export const listStudents = async (keyword = '', page = 0, size = 20): Promise<User[]> => {
  const result = await unwrap<{ content?: User[] }>(apiClient.get('/admin/users/students', { params: { keyword, page, size } }));
  return result?.content ?? [];
};
export const listLecturers = async (keyword = '', page = 0, size = 20): Promise<User[]> => {
  const result = await unwrap<{ content?: User[] }>(apiClient.get('/admin/users/lecturers', { params: { keyword, page, size } }));
  return result?.content ?? [];
};
