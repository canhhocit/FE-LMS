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

const CARD_STYLES = [
  { headerBg: 'bg-amber-600', border: 'border-amber-600', text: 'text-amber-700' },
  { headerBg: 'bg-primary-600', border: 'border-primary-600', text: 'text-primary-700' },
  { headerBg: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-700' },
  { headerBg: 'bg-orange-600', border: 'border-orange-600', text: 'text-orange-700' },
  { headerBg: 'bg-emerald-600', border: 'border-emerald-600', text: 'text-emerald-700' },
];

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

  const rawSchedules = Array.isArray(schedules) ? schedules : [];

  const displaySchedules = rawSchedules.map((s) => {
    const timeInfo = getScheduleTimeInfo(s);
    return { ...s, ...timeInfo };
  });

  const resetToToday = () => {
    setCurrentDate(new Date());
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

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-50 text-accent-700 hover:bg-accent-100 dark:bg-accent-950/40 dark:text-accent-300 transition cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Hôm nay
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {displaySchedules.length === 0 ? (
        <div className="p-8 text-center">
          <Empty msg="Chưa có lịch học hoặc lịch giảng dạy nào được ghi nhận." />
        </div>
      ) : (
        <div className="p-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {weekDates.map((date, idx) => {
              const dayNum = idx + 1; // 1 = Mon ... 7 = Sun
              const daySchedules = displaySchedules.filter((s) => s.dayOfWeek === dayNum);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3 min-h-[160px] flex flex-col gap-2 transition ${
                    isToday
                      ? 'border-accent-300 bg-accent-50/30 dark:border-accent-800 dark:bg-accent-950/20'
                      : 'border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][idx]}
                    </span>
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${isToday ? 'bg-accent-600 text-white font-bold' : 'text-slate-400'}`}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                  </div>

                  {daySchedules.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400 italic">
                      Trống
                    </div>
                  ) : (
                    daySchedules.map((item, sIdx) => {
                      const style = CARD_STYLES[sIdx % CARD_STYLES.length];
                      return (
                        <div
                          key={item.id}
                          onClick={() => onSelectSchedule?.(item)}
                          className={`rounded-lg border bg-white dark:bg-slate-900 p-2.5 shadow-2xs space-y-1 transition hover:shadow-xs ${
                            onSelectSchedule ? 'cursor-pointer hover:border-accent-400' : ''
                          } ${style.border}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {item.courseTitle || item.className || item.classCode}
                            </span>
                            {isEditable && onDeleteSchedule && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSchedule(item.id);
                                }}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.periodLabel} ({item.startTime}-{item.endTime})</span>
                          </div>

                          {item.room && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Phòng {item.room}</span>
                            </div>
                          )}

                          {item.lecturerName && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{item.lecturerName}</span>
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
    </div>
  );
};

export default TimetableGrid;
