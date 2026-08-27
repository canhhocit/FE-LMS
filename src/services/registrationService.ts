// Registration Period & Class registration service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { RegistrationPeriod } from '../types';

const normalizeRegistrationPeriod = (item: RegistrationPeriod): RegistrationPeriod => ({
  ...item,
  startDate: item.startDate ?? item.openAt ?? '',
  endDate: item.endDate ?? item.closeAt ?? '',
  status: item.status ?? (item.isActive ? 'ACTIVE' : 'CLOSED'),
  openAt: item.openAt ?? item.startDate ?? '',
  closeAt: item.closeAt ?? item.endDate ?? '',
  isActive: item.isActive ?? item.status === 'ACTIVE',
});

export const getRegistrationPeriods = async (): Promise<RegistrationPeriod[]> => {
  if (USE_MOCK) {
    await delay();
    return ([
      { id: 1, name: 'HK1 2025-2026', startDate: '2025-09-01', endDate: '2025-09-15', status: 'CLOSED' as const },
      { id: 2, name: 'HK2 2025-2026', startDate: '2026-02-01', endDate: '2026-02-15', status: 'ACTIVE' as const },
    ] as RegistrationPeriod[]).map(normalizeRegistrationPeriod);
  }
  return unwrap<RegistrationPeriod[]>(apiClient.get('/admin/registration-periods')).then((items) => items.map(normalizeRegistrationPeriod));
};

export const createRegistrationPeriod = async (data: Partial<RegistrationPeriod>): Promise<RegistrationPeriod> => {
  if (USE_MOCK) {
    await delay();
    return normalizeRegistrationPeriod({ id: Date.now(), name: data.name ?? '', startDate: data.startDate ?? '', endDate: data.endDate ?? '', status: 'UPCOMING' });
  }
  return unwrap<RegistrationPeriod>(apiClient.post('/admin/registration-periods', data)).then(normalizeRegistrationPeriod);
};

export const updateRegistrationPeriod = async (id: number, data: Partial<RegistrationPeriod>): Promise<RegistrationPeriod> => {
  if (USE_MOCK) {
    await delay();
    return normalizeRegistrationPeriod({ id, name: '', startDate: '', endDate: '', status: 'UPCOMING', ...data });
  }
  return unwrap<RegistrationPeriod>(apiClient.put(`/admin/registration-periods/${id}`, data)).then(normalizeRegistrationPeriod);
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
