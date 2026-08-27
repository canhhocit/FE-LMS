// Schedule service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { Schedule } from '../types';

const formatPeriod = (period?: number): string => {
  if (period == null) return '00:00';
  const hour = (period - 1) * 2;
  return `${String(hour).padStart(2, '0')}:00`;
};

const normalizeSchedule = (item: Schedule): Schedule => ({
  ...item,
  classCode: item.classCode ?? item.clazzCode ?? '',
  className: item.className ?? item.courseTitle ?? '',
  startTime: item.startTime ?? formatPeriod(item.startPeriod),
  endTime: item.endTime ?? formatPeriod(item.endPeriod),
  clazzCode: item.clazzCode ?? item.classCode ?? '',
  courseTitle: item.courseTitle ?? item.className ?? '',
});

export const getMySchedule = async (): Promise<Schedule[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, clazzId: 101, classCode: 'CS101', className: 'Nhap mon Lap trinh', dayOfWeek: 2, startTime: '08:00', endTime: '10:00', room: 'A101', lecturerName: 'Tran Thi Giang' },
      { id: 2, clazzId: 102, classCode: 'CS201', className: 'Cau truc du lieu', dayOfWeek: 3, startTime: '10:00', endTime: '12:00', room: 'A102', lecturerName: 'Tran Thi Giang' },
      { id: 3, clazzId: 101, classCode: 'CS101', className: 'Nhap mon Lap trinh', dayOfWeek: 5, startTime: '13:00', endTime: '15:00', room: 'A101', lecturerName: 'Tran Thi Giang' },
    ].map(normalizeSchedule);
  }
  return unwrap<Schedule[]>(apiClient.get('/me/schedule')).then((items) => items.map(normalizeSchedule));
};

export const getClazzSchedule = async (clazzId: number): Promise<Schedule[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: clazzId * 10 + 1, clazzId, dayOfWeek: 2, startPeriod: 1, endPeriod: 2, room: 'A101' },
      { id: clazzId * 10 + 2, clazzId, dayOfWeek: 4, startPeriod: 1, endPeriod: 2, room: 'A101' },
    ].map(normalizeSchedule);
  }
  return unwrap<Schedule[]>(apiClient.get(`/clazzes/${clazzId}/schedules`)).then((items) => items.map(normalizeSchedule));
};
