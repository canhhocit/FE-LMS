import { apiClient, unwrap } from './api/client';
import type { User } from '../types';

export interface PermissionInfo {
  code: string;
  description: string;
}

export const getAllPermissions = async (): Promise<PermissionInfo[]> =>
  unwrap(apiClient.get('/admin/permissions'));

export const getUserPermissions = async (userId: number): Promise<string[]> =>
  unwrap(apiClient.get(`/admin/users/${userId}/permissions`));

export const updateUserPermissions = async (userId: number, permissions: string[]): Promise<void> =>
  unwrap(apiClient.put(`/admin/users/${userId}/permissions`, permissions));

export const getAdmins = async (): Promise<User[]> =>
  unwrap(apiClient.get('/admin/users/admins'));

export const createAdminUser = async (data: {
  fullName: string;
  email: string;
  password?: string;
  permissions?: string[];
}): Promise<User> => {
  const newUser = await unwrap<User>(
    apiClient.post('/admin/users', {
      fullName: data.fullName,
      email: data.email,
      password: data.password || '123456@',
      role: 'ADMIN',
    }),
  );
  if (data.permissions && data.permissions.length > 0 && newUser?.id) {
    await updateUserPermissions(newUser.id, data.permissions);
  }
  return newUser;
};
