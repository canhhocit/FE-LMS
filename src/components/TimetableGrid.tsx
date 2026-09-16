import React, { useState } from 'react';
import type { Schedule } from '../types';

interface TimetableGridProps {
  schedules: Schedule[];
  title?: string;
  onSelectSchedule?: (schedule: Schedule) => void;
  onDeleteSchedule?: (scheduleId: number) => void;
  isEditable?: boolean;
}

const CalendarIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '06:45', end: '07:30' },
  2: { start: '07:40', end: '08:25' },
  3: { start: '08:35', end: '09:25' },
  4: { start: '09:30', end: '10:15' },
  5: { start: '10:25', end: '11:10' },
  6: { start: '11:20', end: '12:10' },
  7: { start: '12:30', end: '13:15' },
  8: { start: '13:25', end: '14:10' },
  9: { start: '14:20', end: '15:10' },
  10: { start: '15:15', end: '16:00' },
  11: { start: '16:10', end: '16:55' },
  12: { start: '17:05', end: '17:55' },
};

const getScheduleTimeInfo = (item: Schedule) => {
  const sP = item.startPeriod || 1;
  const eP = item.endPeriod || (item.startPeriod ? item.startPeriod + 2 : 3);

  const calcStart = PERIOD_TIMES[sP]?.start || '06:45';
  const calcEnd = PERIOD_TIMES[eP]?.end || '09:25';

  const startTime = (item.startTime && item.startTime !== '00:00' && item.startTime !== '00:00:00')
    ? item.startTime
    : calcStart;
  const endTime = (item.endTime && item.endTime !== '00:00' && item.endTime !== '00:00:00')
    ? item.endTime
    : calcEnd;

  return { startTime, endTime, periodLabel: `Tiết ${sP}-${eP}` };
};

const DEFAULT_DEMO_SCHEDULES: Schedule[] = [
  {
    id: 101,
    clazzId: 1,
    dayOfWeek: 1, // Thứ 2
    classCode: 'Tiếng Anh chuyên ngành-1-1-26(N12)/74DCTT23_74DCTT24',
    className: 'Tiếng Anh chuyên ngành',
    lecturerName: 'Phạm Thị Bích Ngọc',
    room: 'Trực tuyến',
    startPeriod: 1,
    endPeriod: 6,
    startTime: '06:45',
    endTime: '12:10',
  },
  {
    id: 102,
    clazzId: 2,
    dayOfWeek: 3, // Thứ 4
    classCode: 'Quản lý dự án phần mềm-1-1-26(N04)/74DCTT24',
    className: 'Quản lý dự án phần mềm',
    lecturerName: 'Nguyễn Hữu Mùi',
    room: 'A8.403',
    startPeriod: 2,
    endPeriod: 6,
    startTime: '07:40',
    endTime: '12:10',
  },
  {
    id: 103,
    clazzId: 3,
    dayOfWeek: 4, // Thứ 5
    classCode: 'Đồ án Xây dựng và phát triển phần mềm-1-1-26(N04)/74DCTT24',
    className: 'Đồ án Xây dựng và phát...',
    lecturerName: 'Lê Trung Kiên',
    room: 'Trực tuyến',
    startPeriod: 2,
    endPeriod: 6,
    startTime: '07:40',
    endTime: '12:10',
  },
  {
    id: 104,
    clazzId: 4,
    dayOfWeek: 5, // Thứ 6
    classCode: 'Nhập môn Xử lý ảnh-1-1-26(N04)/74DCTT24',
    className: 'Nhập môn Xử lý ảnh',
    lecturerName: 'Đỗ Bảo Long',
    room: 'A2.303',
    startPeriod: 1,
    endPeriod: 3,
    startTime: '06:45',
    endTime: '09:25',
  },
  {
    id: 105,
    clazzId: 4,
    dayOfWeek: 5, // Thứ 6
    classCode: 'Nhập môn Xử lý ảnh-1-1-26(N04)/74DCTT24',
    className: 'Nhập môn Xử lý ảnh',
    lecturerName: 'Đỗ Bảo Long',
    room: 'A2.303',
    startPeriod: 4,
    endPeriod: 6,
    startTime: '09:30',
    endTime: '12:10',
  },
];

const CARD_STYLES = [
  { headerBg: 'bg-[#ca8a04]', border: 'border-[#ca8a04]' }, // Golden yellow
  { headerBg: 'bg-[#00376f]', border: 'border-[#00376f]' }, // Dark Navy
  { headerBg: 'bg-[#1d4ed8]', border: 'border-[#1d4ed8]' }, // Royal Blue
  { headerBg: 'bg-[#ea580c]', border: 'border-[#ea580c]' }, // Orange Red
  { headerBg: 'bg-[#059669]', border: 'border-[#059669]' }, // Emerald
];

const HOURS = [6, 7, 8, 9, 10, 11, 12];

export default function TimetableGrid({
  schedules,
  title = 'Lịch cá nhân',
  onSelectSchedule,
  onDeleteSchedule,
  isEditable = false,
}: TimetableGridProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 16)); // Sept 16, 2026

  const rawSchedules = schedules.length > 0 ? schedules : DEFAULT_DEMO_SCHEDULES;

  const displaySchedules = rawSchedules.map((s) => {
    const timeInfo = getScheduleTimeInfo(s);
    return { ...s, ...timeInfo };
  });

  // Monday to Sunday
  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getMonthDays = (y: number, m: number) => {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ dayNum: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(y, m - 1, daysInPrevMonth - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ dayNum: i, isCurrentMonth: true, date: new Date(y, m, i) });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ dayNum: i, isCurrentMonth: false, date: new Date(y, m + 1, i) });
    }

    return days;
  };

  const calendarDays = getMonthDays(year, month);

  const parseTimeToOffset = (timeStr?: string, defaultHour = 6) => {
    if (!timeStr) return defaultHour - 6;
    const [h, m] = timeStr.split(':').map(Number);
    return Math.max(0, (h || defaultHour) - 6 + (m || 0) / 60);
  };

  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 2.5;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    return Math.max(1.2, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start text-slate-800">
      {/* Main Bright White Timetable Section */}
      <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        {/* Title Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <CalendarIcon className="h-5 w-5 text-[#00376f]" />
          <h2 className="text-base font-bold text-[#00376f]">{title}</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header Days Row */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b-2 border-[#00376f] text-center font-medium text-xs">
              <div className="py-2.5 text-slate-700 flex items-center justify-center gap-1 font-bold border-r border-slate-200">
                <ClockIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Giờ VN</span>
              </div>
              {weekDates.map((d, idx) => {
                const dayNum = d.getDate();
                const isSelectedDay = d.toDateString() === currentDate.toDateString();
                const dayLabel = idx === 6 ? 'Chủ nhật' : `Thứ ${idx + 2}`;

                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentDate(d)}
                    className={`py-2 px-1 cursor-pointer transition border-r border-slate-200 ${
                      isSelectedDay
                        ? 'bg-[#e8f0fe] text-[#00376f] font-bold rounded-t-lg border-b-2 border-[#00376f]'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold">{dayNum}</div>
                    <div className="text-[11px] text-slate-500">{dayLabel}</div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="relative grid grid-cols-[64px_repeat(7,1fr)]">
              {/* Left Time Column */}
              <div className="border-r border-slate-200 text-xs font-bold text-slate-700 font-sans">
                {HOURS.map((h) => (
                  <div key={h} className="h-16 flex items-start justify-center pt-1 border-b border-slate-200">
                    {`${h}:00`}
                  </div>
                ))}
              </div>

              {/* 7 Columns for Days */}
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const dayOfWeekNum = dayIdx + 1;
                const dayItems = displaySchedules.filter((s) => Number(s.dayOfWeek) === dayOfWeekNum);

                return (
                  <div key={dayIdx} className="relative border-r border-slate-200 min-h-[448px]">
                    {/* Horizontal hour lines */}
                    {HOURS.map((h) => (
                      <div key={h} className="h-16 border-b border-slate-200/80" />
                    ))}

                    {/* Schedule Cards matching screenshot */}
                    {dayItems.map((item, itemIdx) => {
                      const style = CARD_STYLES[(item.clazzId || item.id || itemIdx) % CARD_STYLES.length];
                      const topOffset = parseTimeToOffset(item.startTime, 6) * 64;
                      const durationHours = calculateDuration(item.startTime, item.endTime);
                      const cardHeight = Math.max(90, durationHours * 64);

                      return (
                        <div
                          key={item.id || itemIdx}
                          style={{ top: `${topOffset}px`, height: `${cardHeight}px` }}
                          onClick={() => onSelectSchedule?.(item)}
                          className={`absolute left-0.5 right-0.5 z-10 flex flex-col overflow-hidden bg-white border-2 ${style.border} rounded shadow-sm transition hover:shadow-md cursor-pointer`}
                        >
                          {/* Colored Header Bar */}
                          <div className={`px-2 py-1 text-[11px] font-bold text-white truncate flex items-center justify-between ${style.headerBg}`}>
                            <span className="truncate">{item.className || item.courseTitle}</span>
                            <span className="shrink-0 text-[10px] font-normal opacity-95 ml-1">{item.startTime} - {item.endTime} ({item.periodLabel})</span>
                          </div>

                          {/* Card Content - Centered */}
                          <div className="p-2 flex-1 flex flex-col justify-between text-center text-[11px] space-y-1">
                            <div>
                              <div className="font-semibold text-slate-800 text-[11px] leading-tight break-words">
                                {item.classCode || item.clazzCode}
                              </div>
                            </div>

                            <div className="space-y-0.5 text-[11px] text-slate-700 font-medium">
                              <div className="text-slate-800 font-bold">{item.room || 'Trực tuyến'}</div>
                              {item.lecturerName && (
                                <div className="text-slate-600 truncate">{item.lecturerName}</div>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                              <span className="hover:text-slate-600">👍</span>
                              <span className="hover:text-slate-600">➕</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Soft Blue Sidebar Panel */}
      <div className="w-full lg:w-72 shrink-0 space-y-4">
        {/* Soft Blue Mini Calendar Container */}
        <div className="bg-[#dbe5f9] rounded-xl p-4 shadow-sm">
          {/* Header Month Nav */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-[#00376f]">
              Tháng {month + 1}-{year}
            </span>
            <div className="flex items-center gap-2 text-[#00376f] font-bold text-sm">
              <button type="button" onClick={prevMonth} className="hover:opacity-75 px-1">‹</button>
              <button type="button" onClick={nextMonth} className="hover:opacity-75 px-1">›</button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600 mb-2">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>Cn</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((cd, idx) => {
              const isSelected = cd.date.toDateString() === currentDate.toDateString();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentDate(cd.date)}
                  className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full transition font-medium ${
                    isSelected
                      ? 'bg-[#ea580c] text-white font-bold shadow-md'
                      : cd.isCurrentMonth
                      ? 'text-slate-800 hover:bg-white/60'
                      : 'text-slate-400'
                  }`}
                >
                  {cd.dayNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
