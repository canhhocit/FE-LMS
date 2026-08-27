// Admin user management service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { User, PageResp, Role } from '../types';

export interface AdminUser extends User {
  studentCode?: string;
  phone?: string;
  adminClassId?: number;
}

export const getUsers = async (params?: { page?: number; size?: number; keyword?: string; role?: Role }): Promise<PageResp<AdminUser>> => {
  if (USE_MOCK) {
    await delay();
    const all: AdminUser[] = [
      { id: 1, email: 'admin@demo.lms', fullName: 'Admin System', role: 'ADMIN', active: true, createdAt: '2024-01-01' },
      { id: 2, email: 'gv001@demo.lms', fullName: 'Tran Thi Giang', role: 'LECTURER', active: true, createdAt: '2024-02-01' },
      { id: 3, email: 'sv001@demo.lms', fullName: 'Nguyen Van A', role: 'STUDENT', active: true, studentCode: 'SV001', createdAt: '2025-09-01' },
      { id: 4, email: 'sv002@demo.lms', fullName: 'Le Thi B', role: 'STUDENT', active: true, studentCode: 'SV002', createdAt: '2025-09-01' },
    ];
    return { content: all, totalElements: all.length, totalPages: 1, number: 0, size: 10 };
  }
  const role = params?.role;
  const endpoint = role === 'LECTURER' ? '/admin/users/lecturers' : '/admin/users/students';
  return unwrap<PageResp<AdminUser>>(apiClient.get(endpoint, { params }));
};

export const createUser = async (data: Partial<AdminUser> & { password: string }): Promise<AdminUser> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), email: data.email ?? '', fullName: data.fullName ?? '', role: data.role ?? 'STUDENT', active: true, ...data };
  }
  return unwrap<AdminUser>(apiClient.post('/admin/users', data));
};

export const updateUser = async (id: number, data: Partial<AdminUser>): Promise<AdminUser> => {
  if (USE_MOCK) {
    await delay();
    return { id, email: '', fullName: '', role: 'STUDENT', ...data };
  }
  return unwrap<AdminUser>(apiClient.put(`/admin/users/${id}`, data));
};

export const deleteUser = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/admin/users/${id}`));
};

export const resetPassword = async (id: number, newPassword: string): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.post(`/admin/users/${id}/reset-password`, { newPassword }));
};

export const toggleUserStatus = async (id: number, active: boolean): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.patch(`/admin/users/${id}/status`, { active }));
};

export const importUsersExcel = async (file: File): Promise<User[]> => {
  if (USE_MOCK) { await delay(); return []; }
  const form = new FormData();
  form.append('file', file);
  return unwrap<User[]>(apiClient.post('/admin/users/import-students', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }));
};

export const importUsersByRole = async (role: Role, file: File): Promise<User[]> => {
  if (USE_MOCK) { await delay(); return []; }
  const form = new FormData();
  form.append('file', file);
  const endpoint = role === 'LECTURER' ? '/admin/users/import-lecturers' : '/admin/users/import-students';
  return unwrap<User[]>(apiClient.post(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }));
};

export const exportUsersExcel = async (): Promise<Blob> => {
  if (USE_MOCK) {
    await delay();
    return new Blob(['mock,users'], { type: 'text/csv' });
  }
  const res = await apiClient.get('/admin/users/students/export', { responseType: 'blob' });
  return res.data as Blob;
};

export const exportUsersByRole = async (role: Role): Promise<Blob> => {
  if (USE_MOCK) {
    await delay();
    return new Blob(['mock,users'], { type: 'text/csv' });
  }
  const endpoint = role === 'LECTURER' ? '/admin/users/lecturers/export' : '/admin/users/students/export';
  const res = await apiClient.get(endpoint, { responseType: 'blob' });
  return res.data as Blob;
};

// ===== Administrative class (lop hanh chinh) =====
export interface AdministrativeClass {
  id: number;
  code: string;
  name: string;
  year: number;
  studentCount?: number;
}

export const getAdministrativeClasses = async (): Promise<AdministrativeClass[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, code: 'CNTT-K15', name: 'CNTT K15', year: 2024, studentCount: 45 },
      { id: 2, code: 'CNTT-K16', name: 'CNTT K16', year: 2025, studentCount: 50 },
    ];
  }
  return unwrap<AdministrativeClass[]>(apiClient.get('/admin/administrative-classes'));
};

export const createAdministrativeClass = async (data: Partial<AdministrativeClass>): Promise<AdministrativeClass> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), code: data.code ?? '', name: data.name ?? '', year: data.year ?? new Date().getFullYear() };
  }
  return unwrap<AdministrativeClass>(apiClient.post('/admin/administrative-classes', data));
};

export const updateAdministrativeClass = async (id: number, data: Partial<AdministrativeClass>): Promise<AdministrativeClass> => {
  if (USE_MOCK) {
    await delay();
    return { id, code: '', name: '', year: new Date().getFullYear(), ...data };
  }
  return unwrap<AdministrativeClass>(apiClient.put(`/admin/administrative-classes/${id}`, data));
};

export const deleteAdministrativeClass = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/admin/administrative-classes/${id}`));
};
