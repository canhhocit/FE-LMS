import { apiClient, unwrap } from './api/client';

export interface PermissionRequest {
  id: number;
  lecturerId: number;
  lecturerName: string;
  permissionType: string;
  classId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  reason: string;
  approvedById?: number | null;
  approvedByName?: string | null;
  validUntil?: string | null;
  createdAt: string;
}

export const getMyPermissionRequests = (): Promise<PermissionRequest[]> =>
  unwrap(apiClient.get('/auth/pbac/my-requests'));

export const createPermissionRequest = (request: {
  classId: number;
  permissionType: string;
  reason: string;
}): Promise<PermissionRequest> =>
  unwrap(apiClient.post('/auth/pbac/request', request));
