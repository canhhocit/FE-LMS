import React, { useState } from 'react';
import type { Schedule } from '../types';

interface TimetableGridProps {
  schedules: Schedule[];
  title?: string;
  onSelectSchedule?: (schedule: Schedule) => void;
  onDeleteSchedule?: (scheduleId: number) => void;
  isEditable?: boolean;
}

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

  const calcStart = PERIOD_TIMES[sP]?.start || '07:00';
  const calcEnd = PERIOD_TIMES[eP]?.end || '09:30';

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
    dayOfWeek: 2, // Thứ 3
    classCode: 'IT101-01-2026A',
    className: 'Nhập môn Lập trình',
    lecturerName: 'Nguyễn Văn An',
    room: 'A301',
    startPeriod: 1,
    endPeriod: 3,
    startTime: '06:45',
    endTime: '09:25',
  },
  {
    id: 102,
    clazzId: 2,
    dayOfWeek: 3, // Thứ 4
    classCode: 'IT202-01-2026A',
    className: 'Cơ sở dữ liệu',
    lecturerName: 'Trần Thị Bình',
    room: 'B204',
    startPeriod: 1,
    endPeriod: 3,
    startTime: '06:45',
    endTime: '09:25',
  },
  {
    id: 103,
    clazzId: 3,
    dayOfWeek: 4, // Thứ 5
    classCode: 'IT101-01-2026A',
    className: 'Nhập môn Lập trình (TH)',
    lecturerName: 'Nguyễn Văn An',
    room: 'LAB-02',
    startPeriod: 4,
    endPeriod: 6,
    startTime: '09:30',
    endTime: '12:10',
  },
  {
    id: 104,
    clazzId: 4,
    dayOfWeek: 6, // Thứ 7
    classCode: 'BUS101-01-2026A',
    className: 'Nguyên lý Quản trị',
    lecturerName: 'Lê Minh Cường',
    room: 'C105',
    startPeriod: 1,
    endPeriod: 2,
    startTime: '06:45',
    endTime: '08:25',
  },
  {
    id: 105,
    clazzId: 5,
    dayOfWeek: 7, // Chủ nhật
    classCode: 'GEN101-01-2026A',
    className: 'Kỹ năng mềm',
    lecturerName: 'Phạm Hồng Thái',
    room: 'Trực tuyến',
    startPeriod: 1,
    endPeriod: 2,
    startTime: '06:45',
    endTime: '08:25',
  },
];

const CARD_THEMES = [
  {
    bg: 'bg-amber-500/10 dark:bg-amber-950/50',
    border: 'border-amber-400/60 dark:border-amber-600/60',
    accent: 'bg-amber-600 text-white',
    text: 'text-amber-950 dark:text-amber-100',
    subtext: 'text-amber-800/80 dark:text-amber-300/80',
    badge: 'bg-amber-500/20 text-amber-900 dark:text-amber-200',
  },
  {
    bg: 'bg-indigo-500/10 dark:bg-indigo-950/50',
    border: 'border-indigo-400/60 dark:border-indigo-600/60',
    accent: 'bg-indigo-600 text-white',
    text: 'text-indigo-950 dark:text-indigo-100',
    subtext: 'text-indigo-800/80 dark:text-indigo-300/80',
    badge: 'bg-indigo-500/20 text-indigo-900 dark:text-indigo-200',
  },
  {
    bg: 'bg-blue-500/10 dark:bg-blue-950/50',
    border: 'border-blue-400/60 dark:border-blue-600/60',
    accent: 'bg-blue-600 text-white',
    text: 'text-blue-950 dark:text-blue-100',
    subtext: 'text-blue-800/80 dark:text-blue-300/80',
    badge: 'bg-blue-500/20 text-blue-900 dark:text-blue-200',
  },
  {
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/50',
    border: 'border-emerald-400/60 dark:border-emerald-600/60',
    accent: 'bg-emerald-600 text-white',
    text: 'text-emerald-950 dark:text-emerald-100',
    subtext: 'text-emerald-800/80 dark:text-emerald-300/80',
    badge: 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200',
  },
  {
    bg: 'bg-orange-500/10 dark:bg-orange-950/50',
    border: 'border-orange-400/60 dark:border-orange-600/60',
    accent: 'bg-orange-600 text-white',
    text: 'text-orange-950 dark:text-orange-100',
    subtext: 'text-orange-800/80 dark:text-orange-300/80',
    badge: 'bg-orange-500/20 text-orange-900 dark:text-orange-200',
  },
];

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function TimetableGrid({
  schedules,
  title = '📅 Lịch cá nhân',
  onSelectSchedule,
  onDeleteSchedule,
  isEditable = false,
}: TimetableGridProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 16)); // Sept 16, 2026

  const rawSchedules = schedules.length > 0 ? schedules : DEFAULT_DEMO_SCHEDULES;

  // Process schedules with correct times
  const displaySchedules = rawSchedules.map((s) => {
    const timeInfo = getScheduleTimeInfo(s);
    return { ...s, ...timeInfo };
  });

  // Calculate days of the current week (Monday to Sunday)
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

  // Month Calendar Navigation
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-6 items-start">
        {/* Main Weekly Timetable Area */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-5 sm:p-6 transition-colors">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-[#00376f] dark:text-blue-400 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-lg">📅</span>
              <span>{title}</span>
            </h2>
            <div className="text-xs font-semibold px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shadow-sm">
              Tuần: <span className="text-[#00376f] dark:text-blue-400 font-bold">{weekDates[0].getDate()}/{weekDates[0].getMonth() + 1}</span> – <span className="text-[#00376f] dark:text-blue-400 font-bold">{weekDates[6].getDate()}/{weekDates[6].getMonth() + 1}/{year}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              {/* Day Column Headers */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-800 text-center font-semibold text-sm">
                <div className="py-3 text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-tl-2xl">
                  <span>⏱️ Giờ VN</span>
                </div>
                {weekDates.map((d, idx) => {
                  const dayNum = d.getDate();
                  const isToday = d.toDateString() === currentDate.toDateString();
                  const dayLabel = idx === 6 ? 'Chủ nhật' : `Thứ ${idx + 2}`;

                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentDate(d)}
                      className={`py-2.5 px-1 cursor-pointer transition border-r border-slate-100 dark:border-slate-800/80 ${
                        isToday
                          ? 'bg-[#00376f] text-white rounded-t-2xl shadow-lg shadow-blue-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-base font-extrabold">{dayNum}</div>
                      <div className="text-xs font-medium opacity-90">{dayLabel}</div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="relative grid grid-cols-[70px_repeat(7,1fr)]">
                {/* Hours Left Column */}
                <div className="border-r border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-50/30 dark:bg-slate-900/40">
                  {HOURS.map((h) => (
                    <div key={h} className="h-16 flex items-start justify-center pt-1.5 border-b border-slate-100 dark:border-slate-800/60">
                      {`${h}:00`}
                    </div>
                  ))}
                </div>

                {/* 7 Columns for Days */}
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const dayOfWeekNum = dayIdx + 1; // 1 = Mon, 7 = Sun
                  const dayItems = displaySchedules.filter((s) => Number(s.dayOfWeek) === dayOfWeekNum);

                  return (
                    <div key={dayIdx} className="relative border-r border-slate-100 dark:border-slate-800/60 min-h-[832px]">
                      {/* Grid Horizontal Rows */}
                      {HOURS.map((h) => (
                        <div key={h} className="h-16 border-b border-slate-100 dark:border-slate-800/60" />
                      ))}

                      {/* Schedule Block Cards */}
                      {dayItems.map((item, itemIdx) => {
                        const theme = CARD_THEMES[(item.clazzId || item.id || itemIdx) % CARD_THEMES.length];
                        const topOffset = parseTimeToOffset(item.startTime, 6) * 64;
                        const durationHours = calculateDuration(item.startTime, item.endTime);
                        const cardHeight = Math.max(96, durationHours * 64);

                        return (
                          <div
                            key={item.id || itemIdx}
                            style={{ top: `${topOffset}px`, height: `${cardHeight}px` }}
                            onClick={() => onSelectSchedule?.(item)}
                            className={`absolute left-1 right-1 z-10 flex flex-col overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} shadow-md transition-all hover:z-30 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer backdrop-blur-sm`}
                          >
                            {/* Card Top Pill Bar */}
                            <div className={`px-2.5 py-1 text-[11px] font-bold truncate flex items-center justify-between ${theme.accent} shadow-sm`}>
                              <span className="truncate">{item.className || item.courseTitle || 'Môn học'}</span>
                              <span className="shrink-0 text-[10px] font-semibold opacity-95 ml-1">{item.startTime} - {item.endTime}</span>
                            </div>

                            {/* Card Content */}
                            <div className="p-2.5 flex-1 flex flex-col justify-between text-[11px] leading-snug space-y-1">
                              <div>
                                <div className={`font-bold ${theme.text} line-clamp-2 text-xs leading-tight`}>
                                  {item.className || item.courseTitle}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                  <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold ${theme.badge}`}>
                                    {item.classCode || item.clazzCode}
                                  </span>
                                  <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-900 dark:text-amber-200">
                                    {item.periodLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1 text-[10px] border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5">
                                <div className={`flex items-center gap-1 font-semibold ${theme.text}`}>
                                  <span>📍</span>
                                  <span className="truncate">{item.room || 'Trực tuyến'}</span>
                                </div>
                                {item.lecturerName && (
                                  <div className={`flex items-center gap-1 truncate ${theme.subtext}`}>
                                    <span>👤</span>
                                    <span className="truncate">{item.lecturerName}</span>
                                  </div>
                                )}
                              </div>

                              {isEditable && onDeleteSchedule && (
                                <div className="pt-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSchedule(item.id);
                                    }}
                                    className="text-[10px] text-rose-600 font-bold hover:underline"
                                  >
                                    Xoá
                                  </button>
                                </div>
                              )}
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

        {/* Right Mini-Calendar Side Panel */}
        <div className="space-y-5">
          {/* Mini Month Calendar Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-5 transition-colors">
            {/* Header: Month & Prev/Next buttons */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🗓️</span>
                <span>Tháng {month + 1}-{year}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="h-7 w-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
                  title="Tháng trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="h-7 w-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
                  title="Tháng sau"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>Cn</span>
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
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full transition font-semibold ${
                      isSelected
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold shadow-md shadow-orange-500/30 scale-105'
                        : cd.isCurrentMonth
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    {cd.dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Legend Info Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 text-xs shadow-md transition-colors space-y-3">
            <div className="font-bold text-[#00376f] dark:text-blue-400 flex items-center gap-2 text-sm">
              <span>💡 Ghi chú tiết học</span>
            </div>
            <div className="space-y-2 leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0 shadow-sm shadow-amber-500/50" />
                <span className="font-medium">Tiết 1 - 6 (Sáng): <strong className="text-slate-900 dark:text-slate-100">06:45 - 12:10</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-blue-600 shrink-0 shadow-sm shadow-blue-600/50" />
                <span className="font-medium">Tiết 7 - 12 (Chiều): <strong className="text-slate-900 dark:text-slate-100">12:30 - 17:55</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
