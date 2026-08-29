import { apiClient, unwrap } from './api/client';
import type { Schedule } from '../types';

const formatPeriod = (period?: number): string => period == null ? '00:00' : `${String((period - 1) * 2).padStart(2, '0')}:00`;
const normalizeSchedule = (item: Schedule): Schedule => ({
  ...item,
  classCode: item.classCode ?? item.clazzCode,
  className: item.className ?? item.courseTitle,
  startTime: item.startTime ?? formatPeriod(item.startPeriod),
  endTime: item.endTime ?? formatPeriod(item.endPeriod),
});

export const getMySchedule = async (): Promise<Schedule[]> => unwrap<Schedule[]>(apiClient.get('/me/schedule')).then((items) => items.map(normalizeSchedule));
export const getClazzSchedule = async (clazzId: number): Promise<Schedule[]> => unwrap<Schedule[]>(apiClient.get(`/clazzes/${clazzId}/schedules`)).then((items) => items.map(normalizeSchedule));
export const createSchedule = async (clazzId: number, payload: { dayOfWeek: number; startPeriod: number; endPeriod: number; room?: string }): Promise<Schedule> => unwrap<Schedule>(apiClient.post(`/clazzes/${clazzId}/schedules`, payload)).then(normalizeSchedule);
export const updateSchedule = async (scheduleId: number, payload: { dayOfWeek: number; startPeriod: number; endPeriod: number; room?: string }): Promise<Schedule> => unwrap<Schedule>(apiClient.put(`/schedules/${scheduleId}`, payload)).then(normalizeSchedule);
export const deleteSchedule = async (scheduleId: number): Promise<void> => { await apiClient.delete(`/schedules/${scheduleId}`); };
