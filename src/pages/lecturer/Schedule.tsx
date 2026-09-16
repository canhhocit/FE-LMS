import { useEffect, useState } from 'react';
import * as clazzService from '../../services/clazzService';
import * as scheduleService from '../../services/scheduleService';
import { PageTitle, Card, Spinner, ErrorBox } from '../../components/Layout';
import TimetableGrid from '../../components/TimetableGrid';
import type { Clazz, Schedule } from '../../types';

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function LecturerSchedule() {
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

  const loadSchedules = async (classId: number) => {
    const data = await scheduleService.getClazzSchedule(classId);
    setSchedules(data);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const myClasses = await clazzService.getMyClasses();
        if (!mounted) return;
        setClasses(myClasses);
        if (myClasses.length > 0) {
          setSelectedClassId(myClasses[0].id);
        }
      } catch (e) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải lịch giảng dạy');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedClassId == null) return;
    let mounted = true;
    (async () => {
      try {
        const data = await scheduleService.getClazzSchedule(selectedClassId);
        if (mounted) {
          setSchedules(data);
        }
      } catch (e) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải lịch');
      }
    })();
    return () => { mounted = false; };
  }, [selectedClassId]);

  const resetForm = () => {
    setSelectedScheduleId(null);
    setDayOfWeek(1);
    setStartPeriod(1);
    setEndPeriod(2);
    setRoom('');
  };

  const submitSchedule = async () => {
    if (selectedClassId == null) return;
    if (startPeriod > endPeriod) return setErr('Tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc');

    try {
      if (selectedScheduleId == null) {
        await scheduleService.createSchedule(selectedClassId, { dayOfWeek, startPeriod, endPeriod, room: room.trim() || undefined });
      } else {
        await scheduleService.updateSchedule(selectedScheduleId, { dayOfWeek, startPeriod, endPeriod, room: room.trim() || undefined });
      }
      await loadSchedules(selectedClassId);
      resetForm();
      setErr(null);
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Lưu lịch thất bại');
    }
  };

  const removeSchedule = async (scheduleId: number) => {
    try {
      await scheduleService.deleteSchedule(scheduleId);
      if (selectedClassId != null) await loadSchedules(selectedClassId);
      if (selectedScheduleId === scheduleId) resetForm();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Xoá lịch thất bại');
    }
  };

  const fillForm = (item: Schedule) => {
    setSelectedScheduleId(item.id);
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

      <TimetableGrid
        schedules={schedules}
        title="Lịch giảng dạy cá nhân"
        onSelectSchedule={(s) => fillForm(s)}
        onDeleteSchedule={(id) => void removeSchedule(id)}
        isEditable={true}
      />
    </div>
  );
}
