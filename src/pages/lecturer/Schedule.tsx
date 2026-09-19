import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as scheduleService from '../../services/scheduleService';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle, Card, Spinner, ErrorBox } from '../../components/Layout';
import TimetableGrid from '../../components/TimetableGrid';
import type { Clazz, Schedule } from '../../types';

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function LecturerSchedule() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startPeriod, setStartPeriod] = useState<number>(1);
  const [endPeriod, setEndPeriod] = useState<number>(2);
  const [room, setRoom] = useState('');

  const canEditSchedule = user?.role === 'ADMIN'
    || user?.permissions?.includes('MANAGE_SCHEDULE')
    || user?.permissions?.includes('EDIT_SCHEDULE');

  const loadData = async () => {
    try {
      const [myClasses, mySchedules] = await Promise.all([
        clazzService.getMyClasses(),
        scheduleService.getMySchedule(),
      ]);
      setClasses(myClasses);
      if (myClasses.length > 0 && selectedClassId === null) {
        setSelectedClassId(myClasses[0].id);
      }
      const formattedSchedules = mySchedules.map((s) => ({
        ...s,
        lecturerName: s.lecturerName || user?.fullName || 'Giảng viên',
      }));
      setSchedules(formattedSchedules);
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải lịch giảng dạy cá nhân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    setSelectedScheduleId(null);
    setDayOfWeek(1);
    setStartPeriod(1);
    setEndPeriod(2);
    setRoom('');
  };

  const submitSchedule = async () => {
    if (!canEditSchedule) return;
    if (selectedClassId == null) return;
    if (startPeriod > endPeriod) return setErr('Tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc');

    try {
      if (selectedScheduleId == null) {
        await scheduleService.createSchedule(selectedClassId, { dayOfWeek, startPeriod, endPeriod, room: room.trim() || undefined });
      } else {
        await scheduleService.updateSchedule(selectedScheduleId, { dayOfWeek, startPeriod, endPeriod, room: room.trim() || undefined });
      }
      await loadData();
      resetForm();
      setErr(null);
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Lưu lịch thất bại');
    }
  };

  const removeSchedule = async (scheduleId: number) => {
    if (!canEditSchedule) return;
    try {
      await scheduleService.deleteSchedule(scheduleId);
      await loadData();
      if (selectedScheduleId === scheduleId) resetForm();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Xoá lịch thất bại');
    }
  };

  const fillForm = (item: Schedule) => {
    if (!canEditSchedule) return;
    setSelectedScheduleId(item.id);
    if (item.clazzId) setSelectedClassId(item.clazzId);
    setDayOfWeek(item.dayOfWeek ?? 1);
    setStartPeriod(item.startPeriod ?? 1);
    setEndPeriod(item.endPeriod ?? 2);
    setRoom(item.room ?? '');
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-4">
      <PageTitle>Lịch giảng dạy cá nhân</PageTitle>

      {canEditSchedule ? (
        <Card className="mb-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Lớp học</label>
              <select value={selectedClassId ?? ''} onChange={(e) => setSelectedClassId(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700">
                {classes.map((c) => <option key={c.id} value={c.id}>{c.classCode} - {c.className}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Thứ</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700">
                {DAY_NAMES.filter(Boolean).map((label, idx) => <option key={idx + 1} value={idx + 1}>{label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Tiết bắt đầu</label>
              <input type="number" min={1} max={12} value={startPeriod} onChange={(e) => setStartPeriod(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Tiết kết thúc</label>
              <input type="number" min={1} max={12} value={endPeriod} onChange={(e) => setEndPeriod(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Phòng học</label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="A8.403" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => void submitSchedule()} className="rounded-xl bg-[#00376f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002b57] transition shadow">
              {selectedScheduleId == null ? 'Thêm tiết học' : 'Cập nhật tiết học'}
            </button>
            {selectedScheduleId != null && (
              <button onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold dark:bg-slate-800 dark:border-slate-700">Huỷ</button>
            )}
          </div>
        </Card>
      ) : (
        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 rounded-2xl p-4 text-sm flex flex-wrap items-center justify-between gap-3 shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-700 dark:text-blue-300 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">Lịch giảng dạy do Admin / Phòng Đào tạo phân công</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Giảng viên chỉ xem thời khóa biểu cá nhân. Nếu cần điều chỉnh hoặc xin bổ sung lịch dạy, vui lòng gửi Yêu cầu cấp quyền PBAC.</p>
            </div>
          </div>
          <Link to="/lecturer/permission-requests" className="bg-[#00376f] text-white font-semibold text-xs px-3.5 py-2 rounded-xl hover:bg-[#002a55] transition shadow-xs">
            Gửi yêu cầu cấp quyền PBAC
          </Link>
        </div>
      )}

      <TimetableGrid
        schedules={schedules}
        title="Lịch giảng dạy cá nhân"
        onSelectSchedule={canEditSchedule ? (s) => fillForm(s) : undefined}
        onDeleteSchedule={canEditSchedule ? (id) => void removeSchedule(id) : undefined}
        isEditable={canEditSchedule}
      />
    </div>
  );
}
