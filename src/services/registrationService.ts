// Registration Period & Class registration service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { RegistrationPeriod } from '../types';

export const getRegistrationPeriods = async (): Promise<RegistrationPeriod[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, name: 'HK1 2025-2026', startDate: '2025-09-01', endDate: '2025-09-15', status: 'CLOSED' },
      { id: 2, name: 'HK2 2025-2026', startDate: '2026-02-01', endDate: '2026-02-15', status: 'ACTIVE' },
    ];
  }
  return unwrap<RegistrationPeriod[]>(apiClient.get('/admin/registration-periods'));
};

export const createRegistrationPeriod = async (data: Partial<RegistrationPeriod>): Promise<RegistrationPeriod> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), name: data.name ?? '', startDate: data.startDate ?? '', endDate: data.endDate ?? '', status: 'UPCOMING' };
  }
  return unwrap<RegistrationPeriod>(apiClient.post('/admin/registration-periods', data));
};

export const updateRegistrationPeriod = async (id: number, data: Partial<RegistrationPeriod>): Promise<RegistrationPeriod> => {
  if (USE_MOCK) {
    await delay();
    return { id, name: '', startDate: '', endDate: '', status: 'UPCOMING', ...data };
  }
  return unwrap<RegistrationPeriod>(apiClient.put(`/admin/registration-periods/${id}`, data));
};

export const deleteRegistrationPeriod = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/admin/registration-periods/${id}`));
};

export const registerClass = async (clazzId: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.post(`/registration/${clazzId}`));
};

export const unregisterClass = async (clazzId: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/registration/${clazzId}`));
};
