import { useQuery } from '@tanstack/react-query';
import * as adminService from '../services/adminService';
import * as clazzService from '../services/clazzService';
import * as scheduleService from '../services/scheduleService';
import * as tuitionService from '../services/tuitionService';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboardStats'],
    queryFn: () => adminService.getDashboardStats(),
  });
}

export function useMyClasses() {
  return useQuery({
    queryKey: ['myClasses'],
    queryFn: () => clazzService.getMyClasses(),
  });
}

export function useMySchedule() {
  return useQuery({
    queryKey: ['mySchedule'],
    queryFn: () => scheduleService.getMySchedule(),
  });
}

export function useMyTuition() {
  return useQuery({
    queryKey: ['myTuition'],
    queryFn: () => tuitionService.getMyTuition(),
  });
}
