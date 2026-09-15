import { apiClient, unwrap } from './api/client';

export interface DepartmentRequest {
  code: string;
  name: string;
  description?: string;
  headUserId?: number;
}

export interface DepartmentResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  headUserName?: string;
}

export const getDepartments = async (): Promise<DepartmentResponse[]> => unwrap(apiClient.get('/admin/departments'));
export const getDepartment = async (id: number): Promise<DepartmentResponse> => unwrap(apiClient.get(`/admin/departments/${id}`));
export const createDepartment = async (data: DepartmentRequest): Promise<DepartmentResponse> => unwrap(apiClient.post('/admin/departments', data));
export const updateDepartment = async (id: number, data: DepartmentRequest): Promise<DepartmentResponse> => unwrap(apiClient.put(`/admin/departments/${id}`, data));
export const deleteDepartment = async (id: number): Promise<void> => { await apiClient.delete(`/admin/departments/${id}`); };
