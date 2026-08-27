// Schedule service
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { Schedule } from '../types';

export const getMySchedule = async (): Promise<Schedule[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, classId: 101, classCode: 'CS101', className: 'Nhap mon Lap trinh', dayOfWeek: 2, startTime: '08:00', endTime: '10:00', room: 'A101', lecturerName: 'Tran Thi Giang' },
      { id: 2, classId: 102, classCode: 'CS201', className: 'Cau truc du lieu', dayOfWeek: 3, startTime: '10:00', endTime: '12:00', room: 'A102', lecturerName: 'Tran Thi Giang' },
      { id: 3, classId: 101, classCode: 'CS101', className: 'Nhap mon Lap trinh', dayOfWeek: 5, startTime: '13:00', endTime: '15:00', room: 'A101', lecturerName: 'Tran Thi Giang' },
    ];
  }
  return unwrap<Schedule[]>(apiClient.get('/me/schedule'));
};

export const getClazzSchedule = async (clazzId: number): Promise<Schedule[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: clazzId * 10 + 1, classId: clazzId, dayOfWeek: 2, startTime: '08:00', endTime: '10:00', room: 'A101' },
      { id: clazzId * 10 + 2, classId: clazzId, dayOfWeek: 4, startTime: '08:00', endTime: '10:00', room: 'A101' },
    ];
  }
  return unwrap<Schedule[]>(apiClient.get(`/clazzes/${clazzId}/schedules`));
};
