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

export const forgotPassword = async (email: string): Promise<void> => {
  await unwrap<void>(apiClient.post('/auth/forgot-password', { email }));
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await unwrap<void>(apiClient.post('/auth/reset-password', { token, newPassword }));
};


export interface TotpSetupResponse {
  secretKey: string;
  qrCodeUrl: string;
}

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Ignore if token already invalid
  }
};

export const setup2FA = async (): Promise<TotpSetupResponse> => {
  return unwrap<TotpSetupResponse>(apiClient.post('/auth/2fa/setup'));
};

export const verify2FA = async (code: string): Promise<boolean> => {
  return unwrap<boolean>(apiClient.post('/auth/2fa/verify', { code }));
};
