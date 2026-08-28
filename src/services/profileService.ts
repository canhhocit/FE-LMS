// Profile service
import { apiClient, unwrap } from './api/client';
import type { UpdateProfileRequest, UserProfile } from '../types';

export const getMyProfile = async (): Promise<UserProfile> => {
  return unwrap<UserProfile>(apiClient.get('/me/profile'));
};

export const updateMyProfile = async (data: UpdateProfileRequest): Promise<UserProfile> => {
  return unwrap<UserProfile>(apiClient.put('/me/profile', data));
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await unwrap<void>(apiClient.post('/auth/change-password', { oldPassword, newPassword }));
};
