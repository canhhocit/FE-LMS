import { apiClient, unwrap } from './api/client';
import type { AuthUser, LoginRequest, ChangePasswordRequest } from '../types';

export const login = async (body: LoginRequest): Promise<AuthUser> => {
  return unwrap<AuthUser>(apiClient.post('/auth/login', body));
};

export const refresh = async (refreshToken: string): Promise<AuthUser> =>
  unwrap<AuthUser>(apiClient.post('/auth/refresh', { refreshToken }));

export const changePassword = async (body: ChangePasswordRequest): Promise<void> => {
  await unwrap<void>(apiClient.post('/auth/change-password', body));
};
