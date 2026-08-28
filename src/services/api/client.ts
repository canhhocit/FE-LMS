import axios from 'axios';
import { readStoredUser, writeStoredUser, clearStoredUser } from '../../contexts/authStorage';
import type { AuthUser } from '../../types';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const user = readStoredUser();
  if (user?.token) config.headers.Authorization = `${user.type || 'Bearer'} ${user.token}`;
  return config;
});

let refreshRequest: Promise<AuthUser> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const user = readStoredUser();
    if (error.response?.status !== 401 || request?._retry || !user?.refreshToken || request?.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    request._retry = true;
    refreshRequest ??= axios.post<{ result: AuthUser }>(`${baseURL}/auth/refresh`, {
      refreshToken: user.refreshToken,
    }).then((response) => response.data.result).finally(() => { refreshRequest = null; });

    try {
      const refreshed = await refreshRequest;
      writeStoredUser(refreshed);
      request.headers.Authorization = `${refreshed.type || 'Bearer'} ${refreshed.token}`;
      return apiClient(request);
    } catch (refreshError) {
      clearStoredUser();
      return Promise.reject(refreshError);
    }
  },
);

// Chuẩn hoá response: BE trả {code,message,result} → trả về result
export interface ApiEnvelope<T> { code: number; message: string; result: T; }
export const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.result);

export default apiClient;