import { apiClient, unwrap } from './api/client';
import type { TuitionInvoice, TuitionRate } from '../types';
export const getMyTuition = async (): Promise<TuitionInvoice[]> => unwrap(apiClient.get('/me/tuition'));
export const getTuitionRates = async (): Promise<TuitionRate[]> => unwrap(apiClient.get('/admin/tuition/rates'));
export const createTuitionRate = async (data: { academicYear: string; pricePerCredit: number; isActive: boolean }): Promise<TuitionRate> => unwrap(apiClient.post('/admin/tuition/rates', data));
export const generateInvoice = async (studentId: number, semester: string, academicYear: string): Promise<TuitionInvoice> => unwrap(apiClient.post(`/admin/tuition/${studentId}/generate`, null, { params: { semester, academicYear } }));
export const markInvoicePaid = async (invoiceId: number): Promise<void> => unwrap(apiClient.post(`/admin/tuition/${invoiceId}/mark-paid`));
