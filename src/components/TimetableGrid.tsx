import React, { useState } from 'react';
import type { Schedule } from '../types';
import { Calendar, Clock, MapPin, User, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Empty } from './ui';

interface TimetableGridProps {
  schedules?: Schedule[];
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

const CARD_THEMES = [
  { headerBg: 'bg-amber-600', border: 'border-amber-600', text: 'text-amber-600', subBg: 'bg-amber-50 dark:bg-amber-950/40' },
  { headerBg: 'bg-slate-800 dark:bg-slate-700', border: 'border-slate-800 dark:border-slate-700', text: 'text-slate-800 dark:text-slate-200', subBg: 'bg-slate-50 dark:bg-slate-800/40' },
  { headerBg: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-600', subBg: 'bg-blue-50 dark:bg-blue-950/40' },
  { headerBg: 'bg-orange-600', border: 'border-orange-600', text: 'text-orange-600', subBg: 'bg-orange-50 dark:bg-orange-950/40' },
  { headerBg: 'bg-emerald-600', border: 'border-emerald-600', text: 'text-emerald-600', subBg: 'bg-emerald-50 dark:bg-emerald-950/40' },
];

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const HOURS_LIST = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const HOUR_ROW_HEIGHT = 64; // px per hour

function timeToHours(timeStr: string, fallbackH: number): number {
  if (!timeStr || timeStr === '00:00' || timeStr === '00:00:00') return fallbackH;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return fallbackH;
  return parts[0] + parts[1] / 60;
}

const getScheduleTimeInfo = (item: Schedule) => {
  const sP = item.startPeriod || 1;
  const eP = item.endPeriod || (item.startPeriod ? item.startPeriod + 2 : 3);

  const calcStart = PERIOD_TIMES[sP]?.start || '06:45';
  const calcEnd = PERIOD_TIMES[eP]?.end || '12:10';

  let startTime = (item.startTime && item.startTime !== '00:00' && item.startTime !== '00:00:00')
    ? item.startTime
    : calcStart;
  let endTime = (item.endTime && item.endTime !== '00:00' && item.endTime !== '00:00:00')
    ? item.endTime
    : calcEnd;

  const startH = timeToHours(startTime, 6.75);
  let endH = timeToHours(endTime, 12.167);

  if (endH <= startH) {
    endH = startH + 1.5;
  }

  return { startTime, endTime, periodLabel: `Tiết ${sP}-${eP}`, startH, endH };
};

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  schedules = [],
  title = 'Lịch cá nhân',
  onSelectSchedule,
  onDeleteSchedule,
  isEditable = false,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(new Date());

  const rawSchedules = Array.isArray(schedules) ? schedules : [];

  const displaySchedules = rawSchedules.map((s) => {
    const timeInfo = getScheduleTimeInfo(s);
    return { ...s, ...timeInfo };
  });

  const resetToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setCalendarMonthDate(now);
  };

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

  // Calendar days calculation for Right Side Mini Calendar
  const getCalendarDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startingDayOfWeek = firstDayOfMonth.getDay();
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days: { date: Date; dayNum: number; isCurrentMonth: boolean }[] = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, dayNum: prevDate.getDate(), isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const currDate = new Date(year, month, i);
      days.push({ date: currDate, dayNum: i, isCurrentMonth: true });
    }

    const remaining = (days.length > 35 ? 42 : 35) - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, dayNum: i, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = getCalendarDays(calendarMonthDate);

  const prevMonth = () => {
    setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1));
  };

  // Selected Day schedules for Right Side Agenda Panel
  const jsDay = currentDate.getDay();
  const backendDay = jsDay === 0 ? 7 : jsDay;
  const selectedDaySchedules = displaySchedules.filter((s) => s.dayOfWeek === backendDay);
  const selectedDayName = DAY_NAMES[backendDay];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Main 2D Time Grid Matrix */}
      <div className="flex-1 min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Hôm nay
            </button>
          </div>
        </div>

        {/* 2D Time Matrix Body */}
        {displaySchedules.length === 0 ? (
          <div className="p-12 text-center flex-1 flex items-center justify-center">
            <Empty msg="Chưa có lịch học hoặc lịch giảng dạy nào được ghi nhận." />
          </div>
        ) : (
          <div className="p-3 overflow-x-auto flex-1 select-none">
            <div className="min-w-[1000px] flex flex-col border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              
              {/* Top X-Axis Day Headers Row */}
              <div className="grid grid-cols-[64px_repeat(7,_1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-20">
                {/* Top-Left Corner Box: Giờ VN */}
                <div className="p-2 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                  <Clock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Giờ VN</span>
                </div>

                {/* 7 Day Column Headers */}
                {weekDates.map((date, idx) => {
                  const isToday = new Date().toDateString() === date.toDateString();
                  const isSelected = date.toDateString() === currentDate.toDateString();

                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentDate(date)}
                      className={`p-2 border-r border-slate-200 dark:border-slate-800 text-center transition cursor-pointer last:border-r-0 ${
                        isSelected
                          ? 'bg-blue-100/70 dark:bg-blue-950/60'
                          : isToday
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-base font-extrabold font-mono ${
                          isSelected || isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {date.getDate()}
                        </span>
                        <span className={`text-xs font-bold ${
                          isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][idx]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Grid Container */}
              <div className="relative grid grid-cols-[64px_repeat(7,_1fr)]">
                
                {/* Left Y-Axis Time Labels Column */}
                <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                  {HOURS_LIST.map((hour) => (
                    <div
                      key={hour}
                      style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                      className="border-b border-slate-100 dark:border-slate-800/60 px-1 py-1 text-center font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400"
                    >
                      {hour < 10 ? `0${hour}` : hour}:00
                    </div>
                  ))}
                </div>

                {/* 7 Columns Background Grid & Event Cards Placement */}
                {weekDates.map((date, idx) => {
                  const dayNum = idx + 1; // 1 = Mon ... 7 = Sun
                  const daySchedules = displaySchedules.filter((s) => s.dayOfWeek === dayNum);
                  const isSelected = date.toDateString() === currentDate.toDateString();

                  return (
                    <div
                      key={idx}
                      className={`relative border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 ${
                        isSelected ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                      }`}
                      style={{ height: `${HOURS_LIST.length * HOUR_ROW_HEIGHT}px` }}
                    >
                      {/* Background Hourly Grid Lines */}
                      {HOURS_LIST.map((hour) => (
                        <div
                          key={hour}
                          style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                          className="border-b border-slate-100 dark:border-slate-800/60"
                        />
                      ))}

                      {/* Event Cards Positioned by Time Offset */}
                      {daySchedules.map((item, sIdx) => {
                        const theme = CARD_THEMES[(item.clazzId || item.id || sIdx) % CARD_THEMES.length];
                        const topPx = Math.max(0, (item.startH - 6) * HOUR_ROW_HEIGHT);
                        const durationH = Math.max(1, item.endH - item.startH);
                        const heightPx = Math.max(76, durationH * HOUR_ROW_HEIGHT - 4);

                        return (
                          <div
                            key={item.id}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSchedule?.(item);
                            }}
                            className={`absolute left-1 right-1 z-10 rounded-xl border-2 overflow-hidden shadow-sm flex flex-col bg-white dark:bg-slate-900 transition hover:shadow-md hover:z-20 ${
                              theme.border
                            } ${onSelectSchedule ? 'cursor-pointer' : ''}`}
                          >
                            {/* Top Card Header Strip (Solid Theme Color) */}
                            <div className={`${theme.headerBg} px-2 py-1 text-white flex items-center justify-between gap-1 shrink-0`}>
                              <span className="font-bold text-xs truncate leading-snug">
                                {item.courseTitle || item.className || item.classCode}
                              </span>
                              <div className="text-[10px] font-mono leading-tight bg-black/25 px-1.5 py-0.5 rounded font-bold shrink-0 text-right flex flex-col items-end justify-center">
                                <div>{item.startTime} - {item.endTime}</div>
                                {item.periodLabel && (
                                  <div className="text-[9.5px] font-sans font-medium text-white/90">
                                    ({item.periodLabel})
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Body Info */}
                            <div className="p-2 flex-1 flex flex-col justify-between text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-medium space-y-1">
                              <div>
                                <div className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-2">
                                  {item.className || item.courseTitle}
                                </div>
                                {item.classCode && (
                                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    {item.classCode}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                {item.room && (
                                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{item.room}</span>
                                  </div>
                                )}
                                {item.lecturerName && (
                                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
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
                                    className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                                  >
                                    Xóa
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
        )}

      </div>

      {/* Right Sidebar Panel: Mini Calendar & Today's Agenda */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Soft Indigo/Blue Mini Calendar Container */}
        <div className="bg-indigo-50/70 dark:bg-slate-800/90 border border-indigo-100 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs">
          {/* Header Month Nav */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-indigo-950 dark:text-white">
              Tháng {calendarMonthDate.getMonth() + 1}-{calendarMonthDate.getFullYear()}
            </span>
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>Cn</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((cd, idx) => {
              const isSelected = cd.date.toDateString() === currentDate.toDateString();
              const isToday = cd.date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentDate(cd.date)}
                  className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full transition font-semibold text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'bg-indigo-600 text-white font-bold'
                      : cd.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {cd.dayNum}
                </button>
              );
            })}
          </div>

          {/* Reset to Today Button */}
          <div className="mt-3 border-t border-indigo-200/60 dark:border-slate-700/60 pt-2.5 flex justify-center">
            <button
              type="button"
              onClick={resetToToday}
              className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Về ngày hôm nay</span>
            </button>
          </div>
        </div>

        {/* Selected Day Agenda Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Lịch học {selectedDayName} ({currentDate.getDate()}/{currentDate.getMonth() + 1})</span>
            </div>
            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60">
              {selectedDaySchedules.length} môn
            </span>
          </div>

          {selectedDaySchedules.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium italic">
              Không có lịch học vào {selectedDayName}
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDaySchedules.map((item, idx) => {
                const theme = CARD_THEMES[(item.clazzId || item.id || idx) % CARD_THEMES.length];

                return (
                  <div key={item.id || idx} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-slate-800 transition text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                        {item.className || item.courseTitle}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0 ${theme.headerBg}`}>
                        {item.periodLabel}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.startTime} - {item.endTime}</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.room || 'Trực tuyến'}</span>
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1 flex items-center justify-between">
                      <span className="font-mono">{item.classCode}</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{item.lecturerName || 'Giảng viên'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
