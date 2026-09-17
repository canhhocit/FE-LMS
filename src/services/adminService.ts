import { apiClient, unwrap } from './api/client';
import type { DashboardStats, User } from '../types';

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => unwrap(apiClient.get('/admin/dashboard'));

export const listStudentsPage = async (
  keyword = '',
  adminClassName = '',
  page = 0,
  size = 20
): Promise<PageResponse<User>> => {
  const result = await unwrap<{
    content?: User[];
    totalPages?: number;
    totalElements?: number;
    number?: number;
    size?: number;
  }>(apiClient.get('/admin/users/students', { params: { keyword, adminClassName, page, size } }));

  return {
    content: result?.content ?? [],
    totalPages: result?.totalPages ?? 0,
    totalElements: result?.totalElements ?? 0,
    page: result?.number ?? page,
    size: result?.size ?? size,
  };
};

export const listLecturersPage = async (
  keyword = '',
  page = 0,
  size = 20
): Promise<PageResponse<User>> => {
  const result = await unwrap<{
    content?: User[];
    totalPages?: number;
    totalElements?: number;
    number?: number;
    size?: number;
  }>(apiClient.get('/admin/users/lecturers', { params: { keyword, page, size } }));

  return {
    content: result?.content ?? [],
    totalPages: result?.totalPages ?? 0,
    totalElements: result?.totalElements ?? 0,
    page: result?.number ?? page,
    size: result?.size ?? size,
  };
};

export const listStudents = async (keyword = '', adminClassName = '', page = 0, size = 500): Promise<User[]> => {
  const res = await listStudentsPage(keyword, adminClassName, page, size);
  return res.content;
};

export const listLecturers = async (keyword = '', page = 0, size = 500): Promise<User[]> => {
  const res = await listLecturersPage(keyword, page, size);
  return res.content;
};
