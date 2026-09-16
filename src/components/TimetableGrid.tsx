import React, { useState } from 'react';
import type { Schedule } from '../types';

interface TimetableGridProps {
  schedules: Schedule[];
  title?: string;
  onSelectSchedule?: (schedule: Schedule) => void;
  onDeleteSchedule?: (scheduleId: number) => void;
  isEditable?: boolean;
}

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
    className: 'Đồ án Xây dựng và phát triển...',
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

const CARD_COLORS = [
  { header: 'bg-[#b45309] text-white', border: 'border-[#d97706]', bg: 'bg-[#fffbe0]' },
  { header: 'bg-[#0f172a] text-white', border: 'border-[#1e293b]', bg: 'bg-[#f8fafc]' },
  { header: 'bg-[#1d4ed8] text-white', border: 'border-[#2563eb]', bg: 'bg-[#eff6ff]' },
  { header: 'bg-[#c2410c] text-white', border: 'border-[#ea580c]', bg: 'bg-[#fff7ed]' },
  { header: 'bg-[#047857] text-white', border: 'border-[#059669]', bg: 'bg-[#ecfdf5]' },
];

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function TimetableGrid({
  schedules,
  title = '📅 Lịch cá nhân',
  onSelectSchedule,
  onDeleteSchedule,
  isEditable = false,
}: TimetableGridProps) {
  // Active selected date state for mini calendar
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 16)); // Sept 16, 2026 default

  const displaySchedules = schedules.length > 0 ? schedules : DEFAULT_DEMO_SCHEDULES;

  // Calculate days of the current week (Monday to Sunday)
  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day); // Monday as day 1
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

  // Month Calendar Navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Generate days array for mini calendar
  const getMonthDays = (y: number, m: number) => {
    const firstDay = new Date(y, m, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0, Sun=6
    const days = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ dayNum: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(y, m - 1, daysInPrevMonth - i) });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ dayNum: i, isCurrentMonth: true, date: new Date(y, m, i) });
    }
    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ dayNum: i, isCurrentMonth: false, date: new Date(y, m + 1, i) });
    }

    return days;
  };

  const calendarDays = getMonthDays(year, month);

  // Parse time "HH:MM" to decimal hours relative to 6:00
  const parseTimeToOffset = (timeStr?: string, defaultHour = 6) => {
    if (!timeStr) return defaultHour - 6;
    const [h, m] = timeStr.split(':').map(Number);
    return Math.max(0, (h || defaultHour) - 6 + (m || 0) / 60);
  };

  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 2.5; // default ~2.5h
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    return Math.max(0.75, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main Weekly Timetable Area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-[#00376f] dark:text-blue-400 flex items-center gap-2">
              <span>{title}</span>
            </h2>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-[#00376f] dark:bg-slate-800 dark:text-blue-300">
              Tuần: {weekDates[0].getDate()}/{weekDates[0].getMonth() + 1} - {weekDates[6].getDate()}/{weekDates[6].getMonth() + 1}/{year}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Day Headers */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700 text-center font-semibold text-sm">
                <div className="py-3 text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center border-r border-slate-200 dark:border-slate-800">
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
                      className={`py-2 px-1 cursor-pointer transition border-r border-slate-100 dark:border-slate-800 ${
                        isToday
                          ? 'bg-[#00376f] text-white rounded-t-xl shadow-md'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-base font-bold">{dayNum}</div>
                      <div className="text-xs font-medium opacity-90">{dayLabel}</div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="relative grid grid-cols-[70px_repeat(7,1fr)]">
                {/* Hours column & Grid horizontal lines */}
                <div className="border-r border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-mono">
                  {HOURS.map((h) => (
                    <div key={h} className="h-16 flex items-start justify-center pt-1 border-b border-slate-100 dark:border-slate-800/60">
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
                      {/* Empty Grid Cell lines */}
                      {HOURS.map((h) => (
                        <div key={h} className="h-16 border-b border-slate-100 dark:border-slate-800/60" />
                      ))}

                      {/* Class Schedule Cards positioned absolute */}
                      {dayItems.map((item, itemIdx) => {
                        const colorScheme = CARD_COLORS[(item.clazzId || item.id || itemIdx) % CARD_COLORS.length];
                        const topOffset = parseTimeToOffset(item.startTime, 6) * 64; // 64px per hour
                        const durationHours = calculateDuration(item.startTime, item.endTime);
                        const cardHeight = durationHours * 64;

                        const periodText = item.startPeriod && item.endPeriod
                          ? `(Tiết ${item.startPeriod}-${item.endPeriod})`
                          : '';

                        return (
                          <div
                            key={item.id || itemIdx}
                            style={{ top: `${topOffset}px`, height: `${cardHeight}px` }}
                            onClick={() => onSelectSchedule?.(item)}
                            className={`absolute left-0.5 right-0.5 z-10 flex flex-col overflow-hidden rounded-xl border ${colorScheme.border} ${colorScheme.bg} shadow-md transition hover:z-20 hover:shadow-lg dark:bg-slate-800 cursor-pointer`}
                          >
                            {/* Card Header Bar */}
                            <div className={`px-2 py-1 text-[11px] font-bold truncate flex items-center justify-between ${colorScheme.header}`}>
                              <span className="truncate">{item.className || item.courseTitle || 'Môn học'}</span>
                              <span className="shrink-0 text-[10px] opacity-90">{item.startTime} - {item.endTime}</span>
                            </div>

                            {/* Card Body */}
                            <div className="p-2 flex-1 flex flex-col justify-between text-[11px] leading-snug space-y-1">
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                                  {item.classCode || item.clazzCode || item.className}
                                </div>
                                {periodText && (
                                  <div className="text-[10px] text-amber-700 font-semibold dark:text-amber-400 mt-0.5">
                                    {item.startTime} - {item.endTime} {periodText}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-0.5 text-[10px] text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
                                <div className="flex items-center gap-1 font-medium">
                                  <span>📍 Phòng:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.room || 'Trực tuyến'}</span>
                                </div>
                                {item.lecturerName && (
                                  <div className="truncate text-slate-500 dark:text-slate-400">
                                    <span>👤</span> {item.lecturerName}
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
                                    className="text-[10px] text-rose-600 font-semibold hover:underline"
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
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 dark:bg-slate-900 dark:border-slate-800">
            {/* Header: Month & Prev/Next buttons */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Tháng {month + 1}-{year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 px-2 rounded-lg hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300 transition"
                  title="Tháng trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 px-2 rounded-lg hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300 transition"
                  title="Tháng sau"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
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
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full transition font-medium ${
                      isSelected
                        ? 'bg-orange-500 text-white font-bold shadow-md scale-105'
                        : cd.isCurrentMonth
                        ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    {cd.dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Legend Info */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-slate-600 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300 space-y-2">
            <div className="font-semibold text-[#00376f] dark:text-blue-400 flex items-center gap-1.5">
              <span>📌 Ghi chú</span>
            </div>
            <div className="space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Tiết 1-6 (Sáng): 06:45 - 12:10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                <span>Tiết 7-12 (Chiều): 12:30 - 17:50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
