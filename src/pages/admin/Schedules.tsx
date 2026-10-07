import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader, Spinner, Empty, Select } from '../../components/ui';
import TimetableGrid from '../../components/TimetableGrid';
import * as scheduleService from '../../services/scheduleService';
import type { Schedule } from '../../types';

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    scheduleService.getAllAdminSchedules()
      .then((data) => {
        if (mounted) {
          setSchedules(data);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (mounted) {
          setError((e as any)?.message || 'Không thể tải lịch học');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!schedules.length) return <Empty msg="Không có bất kỳ lịch học nào được xếp." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan Lịch học Toàn trường"
        subtitle="Xem thời khóa biểu của tất cả các lớp học phần để tránh xếp trùng lịch hoặc dồn cục."
      />
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
        <TimetableGrid schedules={schedules} title="Lịch học tổng hợp" />
      </div>
    </div>
  );
}
