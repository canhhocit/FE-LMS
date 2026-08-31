// Profile service
import { apiClient, unwrap } from './api/client';
import type { UpdateProfileRequest, UserProfile } from '../types';

export const getMyProfile = async (): Promise<UserProfile> => {
  return unwrap<UserProfile>(apiClient.get('/me/profile'));
};

export const updateMyProfile = async (data: UpdateProfileRequest): Promise<UserProfile> => {
  return unwrap<UserProfile>(apiClient.put('/me/profile', data));
};

export const uploadAvatar = async (file: File): Promise<UserProfile> => {
  const form = new FormData();
  form.append('file', file);
  return unwrap<UserProfile>(apiClient.post('/me/profile/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }));
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await unwrap<void>(apiClient.post('/auth/change-password', { oldPassword, newPassword }));
};
