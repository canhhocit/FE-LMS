import { apiClient, unwrap } from './api/client';

export interface AuditLogEntry {
  id: number;
  actorId: number;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: number;
  detail?: string;
  ipAddress?: string;
  result: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const getAuditLogs = async (page: number, size: number, resourceType?: string): Promise<PageResponse<AuditLogEntry>> => {
  const params: Record<string, any> = { page, size };
  if (resourceType) params.resourceType = resourceType;
  const data = await unwrap<any>(apiClient.get('/admin/audit-logs', { params }));
  return data?.data ?? data;
};

export const getAuditLogsByActor = async (userId: number, page: number, size: number): Promise<PageResponse<AuditLogEntry>> => {
export const exportAuditLogsCsv = async (resourceType?: string, page: number = 0, size: number = 20) => {
    const params: any = { page, size };
    if (resourceType) params.resourceType = resourceType;
    const response = await apiClient.get('/admin/audit-logs/export', { params, responseType: 'blob' });
    return response;
  };
  const data = await unwrap<any>(apiClient.get(`/admin/audit-logs/actor/${userId}`, { params: { page, size } }));
  return data?.data ?? data;
};
