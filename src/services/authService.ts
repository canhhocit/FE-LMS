// Auth service — signature khớp API_CONTRACT: /auth/login, /auth/change-password
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay, mockAuthUsers } from './mock';
import type { AuthUser, LoginRequest, ChangePasswordRequest } from '../types';

export const login = async (body: LoginRequest): Promise<AuthUser> => {
  if (USE_MOCK) {
    await delay();
    const u = mockAuthUsers[body.identifier];
    if (!u || body.password !== '123456') {
      throw { code: 401, message: 'Sai tài khoản hoặc mật khẩu (gợi ý: 123456)' };
    }
    return u;
  }
  return unwrap<AuthUser>(apiClient.post('/auth/login', body));
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
