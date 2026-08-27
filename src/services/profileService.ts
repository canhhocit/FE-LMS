// Profile service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { UserProfile } from '../types';

export const getMyProfile = async (): Promise<UserProfile> => {
  if (USE_MOCK) {
    await delay();
    return {
      id: 1, email: 'sv001@demo.lms', fullName: 'Nguyen Van A', role: 'STUDENT',
      studentCode: 'SV001', phone: '0123456789', avatarUrl: '',
    };
  }
  return unwrap<UserProfile>(apiClient.get('/me/profile'));
};

export const updateMyProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  if (USE_MOCK) {
    await delay();
    return { id: 1, email: 'sv001@demo.lms', fullName: data.fullName ?? 'Nguyen Van A', role: 'STUDENT', ...data };
  }
  return unwrap<UserProfile>(apiClient.put('/me/profile', data));
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.post('/auth/change-password', { oldPassword, newPassword }));
};
