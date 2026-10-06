import { apiClient, unwrap } from "./api/client";

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

export interface SystemErrorLogEntry {
  id: number;
  actorId: number | null;
  actorEmail: string;
  exceptionType: string;
  errorMessage?: string;
  requestMethod?: string;
  requestPath?: string;
  stackTrace?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

type NestedPageResponse<T> = PageResponse<T> | { data: PageResponse<T> };

const getPage = async <T>(request: Promise<{ data: unknown }>): Promise<PageResponse<T>> => {
  const response = await unwrap<NestedPageResponse<T>>(request);
  return 'data' in response ? response.data : response;
};

export const getAuditLogs = async (page: number, size: number, resourceType?: string): Promise<PageResponse<AuditLogEntry>> => {
  const params: Record<string, string | number> = { page, size };
  if (resourceType) params.resourceType = resourceType;
  return getPage<AuditLogEntry>(apiClient.get("/admin/audit-logs", { params }));
};

export const exportAuditLogsCsv = async (resourceType?: string, page: number = 0, size: number = 20) => {
  const params: Record<string, string | number> = { page, size };
  if (resourceType) params.resourceType = resourceType;
  const response = await apiClient.get("/admin/audit-logs/export", { params, responseType: "blob" });
  return response;
};

export const getAuditLogsByActor = async (userId: number, page: number, size: number): Promise<PageResponse<AuditLogEntry>> => {
  return getPage<AuditLogEntry>(apiClient.get(`/admin/audit-logs/actor/${userId}`, { params: { page, size } }));
};

export const getSystemErrorLogs = async (page: number, size: number): Promise<PageResponse<SystemErrorLogEntry>> => {
  return getPage<SystemErrorLogEntry>(apiClient.get("/admin/system-error-logs", { params: { page, size } }));
};
