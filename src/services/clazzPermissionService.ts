import { apiClient, unwrap } from './api/client';

export const grantClazzPermissions = async (clazzId: number, userId: number, permissionCodes: string[]): Promise<void> => {
  await apiClient.post(`/api/clazzes/${clazzId}/permissions`, { userId, permissionCodes });
};

export const getClazzPermissions = async (clazzId: number, userId: number): Promise<string[]> =>
  unwrap(apiClient.get(`/api/clazzes/${clazzId}/permissions/${userId}`));

export const revokeClazzPermissions = async (clazzId: number, userId: number): Promise<void> => {
  await apiClient.delete(`/api/clazzes/${clazzId}/permissions/${userId}`);
};
