// Axios instance — sẵn sàng dùng khi switch VITE_USE_MOCK=false
import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Gắn JWT nếu có (mock-mode cũng set để test)
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('lms_auth');
  if (raw) {
    try {
      const u = JSON.parse(raw);
      if (u?.token) config.headers.Authorization = `${u.type ?? 'Bearer'} ${u.token}`;
    } catch { /* ignore */ }
  }
  return config;
});

// Chuẩn hoá response: BE trả {code,message,result} → trả về result
export interface ApiEnvelope<T> { code: number; message: string; result: T; }
export const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.result);

// Flag toàn cục: bật/tắt mock không phụ thuộc env import-time
export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK as string | undefined)?.toLowerCase() !== 'false';

export default apiClient;