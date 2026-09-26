import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as scheduleService from '../../services/scheduleService';
import { useAuth } from '../../contexts/useAuth';
import { PageHeader, Card, Spinner, ErrorBox, Button, Input, Select } from '../../components/ui';
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
    <div className="space-y-6">
      <PageHeader
        title="Lịch giảng dạy cá nhân"
        subtitle="Thời khóa biểu các tiết giảng dạy được phân công trong tuần"
      />

      {canEditSchedule ? (
        <Card>
          <div className="grid gap-3 md:grid-cols-5 mb-3">
            <Select
              label="Lớp học phần"
              value={selectedClassId ?? ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
            >
              {classes.map((c) => <option key={c.id} value={c.id}>{c.classCode} - {c.className}</option>)}
            </Select>

            <Select
              label="Thứ"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
            >
              {DAY_NAMES.filter(Boolean).map((label, idx) => <option key={idx + 1} value={idx + 1}>{label}</option>)}
            </Select>

            <Input
              type="number"
              min={1}
              max={12}
              label="Tiết bắt đầu"
              value={startPeriod}
              onChange={(e) => setStartPeriod(Number(e.target.value))}
            />

            <Input
              type="number"
              min={1}
              max={12}
              label="Tiết kết thúc"
              value={endPeriod}
              onChange={(e) => setEndPeriod(Number(e.target.value))}
            />

            <Input
              label="Phòng học"
              placeholder="A8.403"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void submitSchedule()}>
              {selectedScheduleId == null ? 'Thêm tiết học' : 'Cập nhật tiết học'}
            </Button>
            {selectedScheduleId != null && (
              <Button variant="secondary" onClick={resetForm}>Hủy</Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
          <div>
            <p className="font-bold">Lịch giảng dạy do Phòng Đào tạo phân công</p>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">Để yêu cầu thay đổi lịch dạy, vui lòng gửi Yêu cầu cấp quyền PBAC.</p>
          </div>
          <Link to="/lecturer/permission-requests">
            <Button size="sm">Gửi Yêu cầu PBAC</Button>
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
