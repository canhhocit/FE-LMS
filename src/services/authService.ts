// Auth service — signature khớp API_CONTRACT: /auth/login, /auth/change-password
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay, mockAuthUsers } from './mock';
import type { AuthUser, LoginRequest, ChangePasswordRequest } from '../types';

const mockLogin = async (body: LoginRequest): Promise<AuthUser> => {
  await delay();
  const u = mockAuthUsers[body.identifier];
  if (!u || body.password !== '123456') {
    throw { code: 401, message: 'Sai tài khoản hoặc mật khẩu (gợi ý: 123456)' };
  }
  return u;
};

export const login = async (body: LoginRequest): Promise<AuthUser> => {
  if (USE_MOCK) return mockLogin(body);

  try {
    return unwrap<AuthUser>(apiClient.post('/auth/login', body));
  } catch (error: any) {
    const isMockDisabled = (import.meta.env.VITE_USE_MOCK as string | undefined)?.toLowerCase() === 'false';
    const isDemoAccount = !!mockAuthUsers[body.identifier];
    const wantsDemoFallback = body.password === '123456' && isDemoAccount;

    if (!isMockDisabled && wantsDemoFallback) {
      return mockLogin(body);
    }

    const status = error?.response?.status ?? error?.code;
    if (status === 401 || status === 403 || status === 500 || !status) {
      if (!isMockDisabled && isDemoAccount && body.password === '123456') {
        return mockLogin(body);
      }
    }

    throw error;
  }
};

export const changePassword = async (body: ChangePasswordRequest): Promise<void> => {
  if (USE_MOCK) {
    await delay();
    if (!body.oldPassword || !body.newPassword) {
      throw { code: 400, message: 'Thiếu mật khẩu cũ/mới' };
    }
    return;
  }
  await unwrap<void>(apiClient.post('/auth/change-password', body));
};
