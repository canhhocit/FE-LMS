// Auth service — signature khớp API_CONTRACT: /auth/login, /auth/change-password
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay, mockAuthUsers, mockDemoPasswords } from './mock';
import type { AuthUser, LoginRequest, ChangePasswordRequest } from '../types';

const normalizeIdentifier = (value: string) => value?.trim();

const isValidMockPassword = (identifier: string, password: string) => {
  const key = normalizeIdentifier(identifier);
  if (!key) return false;

  const expected = mockDemoPasswords[key];
  return password === expected || password === '123456';
};

const mockLogin = async (body: LoginRequest): Promise<AuthUser> => {
  await delay();
  const identifier = normalizeIdentifier(body.identifier) ?? '';
  const user = mockAuthUsers[identifier];

  if (!user || !isValidMockPassword(identifier, body.password)) {
    throw { code: 401, message: 'Sai tài khoản hoặc mật khẩu. Demo dùng password hoặc 123456 cho mock.' };
  }

  return user;
};

export const login = async (body: LoginRequest): Promise<AuthUser> => {
  const identifier = normalizeIdentifier(body.identifier) ?? '';

  if (USE_MOCK) return mockLogin(body);

  try {
    return unwrap<AuthUser>(apiClient.post('/auth/login', body));
  } catch (error: any) {
    const isMockDisabled = (import.meta.env.VITE_USE_MOCK as string | undefined)?.toLowerCase() === 'false';
    const isDemoAccount = !!mockAuthUsers[identifier];

    if (!isMockDisabled && isDemoAccount && isValidMockPassword(identifier, body.password)) {
      return mockLogin(body);
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
