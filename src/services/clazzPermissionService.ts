import { apiClient, unwrap } from './api/client';

export const grantClazzPermissions = async (clazzId: number, userId: number, permissionCodes: string[]): Promise<void> => {
  await apiClient.post(`/clazzes/${clazzId}/permissions`, { userId, permissionCodes });
};

export const getClazzPermissions = async (clazzId: number, userId: number): Promise<string[]> =>
  unwrap(apiClient.get(`/clazzes/${clazzId}/permissions/${userId}`));

export const revokeClazzPermissions = async (clazzId: number, userId: number): Promise<void> => {
  await apiClient.delete(`/clazzes/${clazzId}/permissions/${userId}`);
};
