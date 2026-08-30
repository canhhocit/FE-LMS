// Lecturer Schedule page
import { useEffect, useState } from 'react';
import * as clazzService from '../../services/clazzService';
import * as scheduleService from '../../services/scheduleService';
import { PageTitle, Card, Spinner, Empty, ErrorBox } from '../../components/Layout';
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
          const firstId = myClasses[0].id;
          setSelectedClassId(firstId);
          await loadSchedules(firstId);
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
    void loadSchedules(selectedClassId).catch((e) => setErr((e as { message?: string })?.message ?? 'Lỗi tải lịch')); 
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

  const days = Array.from(new Set(schedules.map((s) => s.dayOfWeek))).sort();

  return (
    <div>
      <PageTitle>Lịch giảng dạy</PageTitle>

      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Lớp học</label>
            <select value={selectedClassId ?? ''} onChange={(e) => setSelectedClassId(Number(e.target.value))} className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.classCode} - {c.className}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Thứ</label>
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm">
              {DAY_NAMES.filter(Boolean).map((label, idx) => <option key={idx + 1} value={idx + 1}>{label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Tiết bắt đầu</label>
            <input type="number" min={1} max={12} value={startPeriod} onChange={(e) => setStartPeriod(Number(e.target.value))} className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Tiết kết thúc</label>
            <input type="number" min={1} max={12} value={endPeriod} onChange={(e) => setEndPeriod(Number(e.target.value))} className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Phòng học</label>
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="A301" className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => void submitSchedule()} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500">
            {selectedScheduleId == null ? 'Thêm tiết học' : 'Cập nhật tiết học'}
          </button>
          {selectedScheduleId != null && (
            <button onClick={resetForm} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">Huỷ</button>
          )}
        </div>
      </Card>

      {schedules.length === 0 ? <Empty msg="Chưa có lịch dạy" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {days.map((d) => {
            const dayIndex = Number(d);
            return (
              <Card key={d}>
                <h3 className="font-semibold mb-3 text-primary">{DAY_NAMES[dayIndex] ?? `Ngày ${dayIndex}`}</h3>
                <ul className="space-y-2 text-sm">
                  {schedules.filter((s) => s.dayOfWeek === dayIndex).map((s) => (
                    <li key={s.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                      <div className="font-mono text-primary">{s.startTime} - {s.endTime}</div>
                      <div className="font-medium">{s.classCode} - {s.className}</div>
                      <div className="text-xs text-slate-400">Phòng: {s.room ?? '-'}</div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => fillForm(s)} className="text-xs text-indigo-600 hover:underline">Sửa</button>
                        <button onClick={() => void removeSchedule(s.id)} className="text-xs text-rose-600 hover:underline">Xoá</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
