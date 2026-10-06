import { apiClient, unwrap } from './api/client';
import type { TuitionInvoice, TuitionRate, PayOSPaymentResponse } from '../types';

export const getMyTuition = async (): Promise<TuitionInvoice[]> => unwrap(apiClient.get('/me/tuition'));
export const getTuitionRates = async (): Promise<TuitionRate[]> => unwrap(apiClient.get('/admin/tuition/rates'));
export interface TuitionRatePayload {
  academicYear: string;
  semester: string | null;
  effectiveFrom: string;
  pricePerCredit: number;
  isActive: boolean;
}
export const createTuitionRate = async (data: TuitionRatePayload): Promise<TuitionRate> =>
  unwrap(apiClient.post('/admin/tuition/rates', data));
export const generateInvoice = async (studentId: number, semester: string, academicYear: string): Promise<TuitionInvoice> => unwrap(apiClient.post(`/admin/tuition/${studentId}/generate`, null, { params: { semester, academicYear } }));
export const markInvoicePaid = async (invoiceId: number): Promise<void> => unwrap(apiClient.post(`/admin/tuition/${invoiceId}/mark-paid`));

export const updateTuitionRate = async (id: number, data: TuitionRatePayload): Promise<TuitionRate> =>
  unwrap(apiClient.put(`/admin/tuition/rates/${id}`, data));

export const deleteTuitionRate = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/tuition/rates/${id}`);
};

export const payMyInvoice = async (invoiceId: number): Promise<TuitionInvoice> =>
  unwrap(apiClient.post(`/me/tuition/${invoiceId}/simulate-payment`));

export const getPaymentOptions = async (): Promise<{ simulationEnabled: boolean; payOsEnabled: boolean }> =>
  unwrap(apiClient.get('/public/payment-options'));

export const createPayOSPayment = async (invoiceId: number): Promise<PayOSPaymentResponse> =>
  unwrap(apiClient.post(`/me/tuition/${invoiceId}/payos-create-payment`));

export const verifyPayOSPayment = async (invoiceId: number): Promise<TuitionInvoice> =>
  unwrap(apiClient.post(`/me/tuition/${invoiceId}/payos-verify`));
