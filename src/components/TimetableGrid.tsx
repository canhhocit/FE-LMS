import React, { useState } from 'react';
import type { Schedule } from '../types';
import { Calendar, Clock, MapPin, User, RefreshCw, ChevronLeft, ChevronRight, Trash2, ArrowRight } from 'lucide-react';
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

const CARD_STYLES = [
  { headerBg: 'bg-indigo-600', border: 'border-indigo-600/60', text: 'text-indigo-700 dark:text-indigo-300' },
  { headerBg: 'bg-emerald-600', border: 'border-emerald-600/60', text: 'text-emerald-700 dark:text-emerald-300' },
  { headerBg: 'bg-amber-600', border: 'border-amber-600/60', text: 'text-amber-700 dark:text-amber-300' },
  { headerBg: 'bg-purple-600', border: 'border-purple-600/60', text: 'text-purple-700 dark:text-purple-300' },
  { headerBg: 'bg-blue-600', border: 'border-blue-600/60', text: 'text-blue-700 dark:text-blue-300' },
];

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const getScheduleTimeInfo = (item: Schedule) => {
  const sP = item.startPeriod || 1;
  const eP = item.endPeriod || (item.startPeriod ? item.startPeriod + 2 : 3);

  const calcStart = PERIOD_TIMES[sP]?.start || '06:45';
  const calcEnd = PERIOD_TIMES[eP]?.end || '09:25';

  let startTime = (item.startTime && item.startTime !== '00:00' && item.startTime !== '00:00:00')
    ? item.startTime
    : calcStart;
  let endTime = (item.endTime && item.endTime !== '00:00' && item.endTime !== '00:00:00')
    ? item.endTime
    : calcEnd;

  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  if ((h2 * 60 + m2) <= (h1 * 60 + m1)) {
    startTime = calcStart;
    endTime = calcEnd;
  }

  return { startTime, endTime, periodLabel: `Tiết ${sP}-${eP}` };
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

    let startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // 0 = Mon

    const days: { date: Date; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, dayNum: prevDate.getDate(), isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const currDate = new Date(year, month, i);
      days.push({ date: currDate, dayNum: i, isCurrentMonth: true });
    }

    // Next month padding
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
      {/* Left Main Grid Area */}
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

        {/* Grid Content */}
        {displaySchedules.length === 0 ? (
          <div className="p-12 text-center flex-1 flex items-center justify-center">
            <Empty msg="Chưa có lịch học hoặc lịch giảng dạy nào được ghi nhận." />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto flex-1">
            <div className="grid grid-cols-7 gap-3 min-w-[960px]">
              {weekDates.map((date, idx) => {
                const dayNum = idx + 1; // 1 = Mon ... 7 = Sun
                const daySchedules = displaySchedules.filter((s) => s.dayOfWeek === dayNum);
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = date.toDateString() === currentDate.toDateString();

                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentDate(date)}
                    className={`rounded-xl border p-3 min-h-[220px] flex flex-col gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:border-indigo-700 dark:bg-indigo-950/30 shadow-xs'
                        : isToday
                        ? 'border-indigo-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40'
                        : 'border-slate-200/80 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0 gap-1">
                      <span className={`text-xs font-bold whitespace-nowrap ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][idx]}
                      </span>
                      <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0 ${
                        isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {date.getDate()}/{date.getMonth() + 1}
                      </span>
                    </div>

                    {daySchedules.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400 dark:text-slate-600 italic">
                        Trống
                      </div>
                    ) : (
                      daySchedules.map((item, sIdx) => {
                        const style = CARD_STYLES[sIdx % CARD_STYLES.length];
                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSchedule?.(item);
                            }}
                            className={`rounded-xl border bg-white dark:bg-slate-900 p-2.5 shadow-2xs space-y-1.5 transition hover:shadow-xs ${
                              onSelectSchedule ? 'cursor-pointer hover:border-indigo-500' : ''
                            } ${style.border}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                {item.courseTitle || item.className || item.classCode}
                              </span>
                              {isEditable && onDeleteSchedule && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSchedule(item.id);
                                  }}
                                  className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="whitespace-nowrap">{item.periodLabel} ({item.startTime}-{item.endTime})</span>
                            </div>

                            {item.room && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">Phòng {item.room}</span>
                              </div>
                            )}

                            {item.lecturerName && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{item.lecturerName}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Footer Info */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs text-slate-400">
          <div className="text-[11px] font-mono">
            Ca học: 06:45 - 17:55 (Tiết 1 - 12)
          </div>
        </div>
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
                const style = CARD_STYLES[(item.clazzId || item.id || idx) % CARD_STYLES.length];

                return (
                  <div key={item.id || idx} className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-slate-800 transition text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                        {item.className || item.courseTitle}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0 ${style.headerBg}`}>
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
