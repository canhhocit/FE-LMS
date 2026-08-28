import { apiClient, unwrap } from './api/client';
import type { Registration, RegistrationPeriod } from '../types';
export const getRegistrationPeriods = async (): Promise<RegistrationPeriod[]> => unwrap(apiClient.get('/admin/registration-periods'));
export const createRegistrationPeriod = async (data: Partial<RegistrationPeriod>): Promise<RegistrationPeriod> => unwrap(apiClient.post('/admin/registration-periods', data));
export const updateRegistrationPeriod = async (id: number, data: Partial<RegistrationPeriod>): Promise<RegistrationPeriod> => unwrap(apiClient.put(`/admin/registration-periods/${id}`, data));
export const deleteRegistrationPeriod = async (id: number): Promise<void> => { await apiClient.delete(`/admin/registration-periods/${id}`); };
export const registerClass = async (clazzId: number): Promise<void> => { await apiClient.post(`/registration/${clazzId}`); };
export const unregisterClass = async (clazzId: number): Promise<void> => { await apiClient.delete(`/registration/${clazzId}`); };
export const getMyRegistrations = async (): Promise<Registration[]> => unwrap(apiClient.get('/me/registrations'));
