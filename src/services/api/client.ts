import axios from 'axios';
import { readStoredUser, writeStoredUser, clearStoredUser } from '../../contexts/authStorage';
import type { AuthUser } from '../../types';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const user = readStoredUser();
  if (user?.token) config.headers.Authorization = `${user.type || 'Bearer'} ${user.token}`;
  return config;
});

const extractErrorMessage = (error: unknown) => {
  const requestUrl = (error as { config?: { url?: string } })?.config?.url ?? '';
  const status = (error as { response?: { status?: number } })?.response?.status ?? 500;
  const payload = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  const raw = payload?.message ?? payload?.error;

  if (!error || !(error as { response?: unknown }).response) {
    return 'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.';
  }

  // Nếu là request đăng nhập bị thất bại (401 hoặc 400)
  if (requestUrl.includes('/auth/login') && (status === 401 || status === 400)) {
    return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
  }

  if (status === 400) return raw || 'Dữ liệu không hợp lệ';
  if (status === 401) {
    if (raw && raw !== 'Unauthorized access' && !raw.includes('Unauthorized')) {
      return raw;
    }
    return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  }
  if (status === 403) return raw || 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return raw || 'Không tìm thấy dữ liệu yêu cầu.';
  if (status === 409) return raw || 'Dữ liệu bị trùng hoặc xung đột nghiệp vụ.';
  if (status >= 500) return 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
  return raw || 'Yêu cầu không thành công';
};

let refreshRequest: Promise<AuthUser> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const user = readStoredUser();
    const isUnauthorized = error.response?.status === 401;
    if (!isUnauthorized || request?._retry || !user?.refreshToken || request?.url?.includes('/auth/')) {
      return Promise.reject(new Error(extractErrorMessage(error)));
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
      return Promise.reject(new Error(extractErrorMessage(refreshError)));
    }
  },
);

// Chuẩn hoá response: BE trả {code,message,result} → trả về result
export interface ApiEnvelope<T> { code: number; message: string; result: T; }
export const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.result);

export default apiClient;
