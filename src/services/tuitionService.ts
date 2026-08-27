import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { TuitionInvoice, TuitionRate } from '../types';

export const getMyTuition = async (): Promise<TuitionInvoice[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      {
        id: 1,
        studentId: 3,
        studentFullName: 'Phạm Hoàng Nam',
        semester: '2026-1',
        academicYear: '2025-2026',
        totalCredits: 18,
        pricePerCredit: 520000,
        amount: 9360000,
        status: 'PENDING',
      },
      {
        id: 2,
        studentId: 3,
        studentFullName: 'Phạm Hoàng Nam',
        semester: '2025-2',
        academicYear: '2025-2026',
        totalCredits: 20,
        pricePerCredit: 520000,
        amount: 10400000,
        status: 'PAID',
        paidAt: '2026-02-10T00:00:00Z',
      },
    ];
  }
  return unwrap<TuitionInvoice[]>(apiClient.get('/me/tuition'));
};

export const getTuitionRates = async (): Promise<TuitionRate[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, name: 'Học phí tín chỉ', pricePerCredit: 520000, effectiveFrom: '2025-09-01', description: 'Áp dụng cho tín chỉ chính quy' },
      { id: 2, name: 'Học phí chuyên ngành', pricePerCredit: 610000, effectiveFrom: '2025-09-01', description: 'Áp dụng cho các ngành chuyên sâu' },
    ];
  }
  return unwrap<TuitionRate[]>(apiClient.get('/admin/tuition/rates'));
};

export const createTuitionRate = async (data: Partial<TuitionRate>): Promise<TuitionRate> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), name: data.name ?? 'Mức mới', pricePerCredit: data.pricePerCredit ?? 0, effectiveFrom: data.effectiveFrom ?? new Date().toISOString().slice(0, 10), description: data.description ?? '' };
  }
  return unwrap<TuitionRate>(apiClient.post('/admin/tuition/rates', data));
};

export const generateInvoice = async (studentId: number, semester: string, academicYear: string): Promise<TuitionInvoice> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), studentId, studentFullName: 'Sinh viên demo', semester, academicYear, totalCredits: 18, pricePerCredit: 520000, amount: 9360000, status: 'PENDING' };
  }
  return unwrap<TuitionInvoice>(apiClient.post(`/admin/tuition/${studentId}/generate`, null, { params: { semester, academicYear } }));
};
