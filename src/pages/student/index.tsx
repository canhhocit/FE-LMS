// Student pages
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as assessmentService from "../../services/assessmentService";
import * as gradingService from "../../services/gradingService";
import * as notificationService from "../../services/notificationService";
import * as progressService from "../../services/progressService";
import * as registrationService from "../../services/registrationService";
import * as scheduleService from "../../services/scheduleService";
import { PageTitle, Card, Spinner, Empty, Pill } from "../../components/Layout";
import { useAuth } from "../../contexts/useAuth";
import type { Clazz, Assignment, Submission, Grade, Notification, GradingPolicy, SubmissionType } from "../../types";
import * as profileService from "../../services/profileService";
import * as curriculumService from "../../services/curriculumService";

type ClassProgressState = {
  percentage: number;
  completedCount: number;
  totalCount: number;
  status: 'completed' | 'in-progress' | 'not-started';
};

const getStatusMeta = (percentage: number) => {
  if (percentage >= 100) {
    return { label: 'Đã học', badgeClass: 'bg-emerald-100 text-emerald-700', barClass: 'from-emerald-500 to-emerald-400', glowClass: 'shadow-[0_0_0_1px_rgba(16,185,129,0.15)] ring-1 ring-emerald-200' };
  }
  if (percentage > 0) {
    return { label: 'Đang học', badgeClass: 'bg-amber-100 text-amber-700', barClass: 'from-amber-500 to-orange-400', glowClass: 'shadow-[0_0_0_1px_rgba(245,158,11,0.18)] ring-1 ring-amber-200' };
  }
  return { label: 'Chưa học', badgeClass: 'bg-slate-100 text-slate-600', barClass: 'from-slate-300 to-slate-200', glowClass: 'ring-1 ring-slate-200' };
};

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v14.5H7.5A2.5 2.5 0 0 0 5 21V6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v14.5H7.5A2.5 2.5 0 0 0 5 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 8h7M8.5 11.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.8v3M16 3.8v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 13h2.5v2.5H8.5z" fill="currentColor" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M4 8.6A2.6 2.6 0 0 1 6.6 6h10.8A2.6 2.6 0 0 1 20 8.6v7.8A2.6 2.6 0 0 1 17.4 19H6.6A2.6 2.6 0 0 1 4 16.4V8.6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 12h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 10.5h12.5A2.5 2.5 0 0 1 19 13v1.5A2.5 2.5 0 0 1 16.5 17H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M7 17.5h10l-1.1-1.5V10a4.9 4.9 0 1 0-9.8 0v6l-1.1 1.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path d="M12 2.6c2.1 2.6 3.4 4.2 3.4 6.7 0 2.6-1.6 4.2-3.4 5.4-1.8-1.2-3.4-2.8-3.4-5.4 0-2.5 1.3-4.1 3.4-6.7Z" fill="currentColor" opacity="0.96" />
      <path d="M12 8.7c2.3 1.6 4.1 3.4 4.1 6 0 3-2.4 5.3-4.1 5.3-1.7 0-4.1-2.3-4.1-5.3 0-2.6 1.8-4.4 4.1-6Z" fill="currentColor" opacity="0.78" />
    </svg>
  );
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [classProgress, setClassProgress] = useState<Record<number, ClassProgressState>>({});
  const [subs, setSubs] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      clazzService.getMyClasses(),
      assessmentService.getMySubmissions(),
      notificationService.getNotifications(),
      scheduleService.getMySchedule(),
    ])
      .then(async ([classesResult, subsResult, notificationResult, scheduleResult]) => {
        if (!mounted) return;

        if (classesResult.status === 'fulfilled') {
          const classList = classesResult.value;
          setClasses(classList);

          try {
            const registrations = await registrationService.getMyRegistrations();
            const progressMap: Record<number, ClassProgressState> = {};

            const results = await Promise.allSettled(
              registrations.map(async (registration) => {
                const progress = await progressService.getEnrollmentProgress(registration.enrollmentId);
                return { clazzId: registration.clazzId, progress };
              })
            );

            results.forEach((result) => {
              if (result.status !== 'fulfilled') return;
              const { clazzId, progress } = result.value;
              const percentage = progress?.percentage ?? 0;
              const status = percentage >= 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started';
              progressMap[clazzId] = {
                percentage,
                completedCount: progress?.completedCount ?? 0,
                totalCount: progress?.totalCount ?? 0,
                status,
              };
            });

            if (mounted) setClassProgress(progressMap);
          } catch {
            if (mounted) setClassProgress({});
          }
        }

        if (subsResult.status === 'fulfilled') setSubs(subsResult.value);
        if (notificationResult.status === 'fulfilled') setNotifications(notificationResult.value);
        if (scheduleResult.status === 'fulfilled') setScheduleCount(scheduleResult.value.length);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const continueLearningClass = classes.find((clazzItem) => (classProgress[clazzItem.id]?.percentage ?? 0) > 0)
    ?? classes[0]
    ?? null;
  const continueLearningProgress = continueLearningClass ? classProgress[continueLearningClass.id] : null;
  const continueLearningPercentage = continueLearningProgress?.percentage ?? 0;
  const continueLearningMeta = getStatusMeta(continueLearningPercentage);

  const activityDates = [
    ...notifications.map((item) => new Date(item.createdAt)),
    ...subs.map((item) => new Date(item.submittedAt)),
  ].filter((value) => !Number.isNaN(value.getTime()));
  const uniqueDates = new Set(activityDates.map((date) => date.toISOString().slice(0, 10)));
  const learningStreak = Math.min(7, Math.max(1, uniqueDates.size || 1));
  const recentActivity = [
    ...notifications.slice(0, 3).map((item) => ({
      title: item.title,
      detail: 'Thông báo mới',
      time: new Date(item.createdAt).toLocaleDateString('vi-VN'),
    })),
    ...subs.slice(0, 3).map((item) => ({
      title: item.fileUrl ? 'Bài nộp đã gửi' : 'Bài tập đã cập nhật',
      detail: 'Hoạt động học tập',
      time: new Date(item.submittedAt).toLocaleDateString('vi-VN'),
    })),
  ].slice(0, 4);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageTitle>Trang chủ</PageTitle>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500">Chào mừng trở lại,</p>
          <h2 className="text-xl font-bold text-[#243b78]">{user?.fullName}</h2>
        </div>
        <span className="text-xs text-slate-400">Hôm nay · {new Date().toLocaleDateString('vi-VN')}</span>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: BookIcon, label: 'HỌC TẬP', title: 'Đăng ký học', to: '/student/registrations', color: 'bg-blue-600' },
          { icon: CalendarIcon, label: 'LỊCH', title: 'Thời khóa biểu', to: '/student/schedule', color: 'bg-amber-500' },
          { icon: WalletIcon, label: 'TÀI CHÍNH', title: 'Học phí', to: '/student/tuition', color: 'bg-emerald-600' },
          { icon: BellIcon, label: 'THÔNG TIN', title: 'Tin tức & thông báo', to: '/student/notifications', color: 'bg-rose-500' },
        ].map(({ icon: Icon, label, title, to, color }) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-[0_8px_20px_rgba(36,59,120,0.08)] transition hover:-translate-y-0.5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white ${color}`}>
              <Icon />
            </span>
            <span>
              <span className="block text-[11px] font-medium text-slate-400">{label}</span>
              <span className="block font-semibold text-[#243b78]">{title}</span>
            </span>
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden border border-indigo-100 bg-linear-to-r from-indigo-600 via-blue-600 to-sky-500 text-white shadow-[0_16px_30px_rgba(59,130,246,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-50">
              Học tiếp
            </div>
            <h3 className="text-2xl font-bold text-white">
              {continueLearningClass ? continueLearningClass.className : 'Chưa có lớp học nào'}
            </h3>
            <p className="mt-1 text-sm text-indigo-50">
              {continueLearningClass ? `${continueLearningClass.classCode} · ${continueLearningClass.courseTitle ?? 'Học phần'}` : 'Bắt đầu bằng một lớp học để thấy tiến độ của bạn.'}
            </p>
          </div>

          <div className="min-w-55 lg:max-w-70">
            <div className="mb-2 flex items-center justify-between text-sm text-indigo-50">
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${continueLearningMeta.badgeClass}`}>
                {continueLearningMeta.label}
              </span>
              <span className="font-semibold">{continueLearningPercentage}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full bg-linear-to-r ${continueLearningMeta.barClass} transition-all duration-300`}
                style={{ width: `${Math.min(100, continueLearningPercentage)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-100">
              <span>{continueLearningProgress?.completedCount ?? 0}/{continueLearningProgress?.totalCount ?? 0} bài học</span>
              {continueLearningClass ? (
                <Link to={`/student/classes/${continueLearningClass.id}`} className="font-semibold text-white underline-offset-2 hover:underline">
                  Tiếp tục
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[#243b78]">Learning streak</h3>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">{learningStreak} ngày</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-[0_10px_20px_rgba(251,146,60,0.28)]">
            <FlameIcon />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{learningStreak} ngày</div>
            <div className="text-sm text-slate-500">Bạn đang duy trì nhịp học đều đặn.</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-3">
            <h3 className="font-semibold text-[#243b78]">Recent activity</h3>
            <Link to="/student/notifications" className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              Xem tất cả
            </Link>
          </div>
          <div className="px-4">
            {recentActivity.length === 0 ? (
              <Empty msg="Chưa có hoạt động gần đây" />
            ) : (
              recentActivity.map((activity, index) => (
                <div key={`${activity.title}-${index}`} className="flex gap-3 border-b border-dashed border-slate-200 py-3 last:border-0">
                  <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-xs text-blue-700">•</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{activity.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{activity.detail}</div>
                  </div>
                  <div className="text-[11px] text-slate-400">{activity.time}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-3">
            <h3 className="font-semibold text-[#243b78]">Tổng quan học tập</h3>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            <div className="bg-white p-4">
              <div className="text-xs text-slate-500">Lớp đang học</div>
              <div className="mt-1 text-2xl font-bold text-[#243b78]">{classes.length}</div>
            </div>
            <div className="bg-white p-4">
              <div className="text-xs text-slate-500">Buổi học</div>
              <div className="mt-1 text-2xl font-bold text-amber-600">{scheduleCount}</div>
            </div>
            <div className="bg-white p-4">
              <div className="text-xs text-slate-500">Bài đã nộp</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">{subs.length}</div>
            </div>
            <div className="bg-white p-4">
              <div className="text-xs text-slate-500">Chờ chấm</div>
              <div className="mt-1 text-2xl font-bold text-rose-600">{subs.filter((submission) => submission.score == null).length}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-[#243b78]">Lớp học của tôi</h3>
          <Link to="/student/classes" className="text-xs font-semibold text-blue-700">Xem tất cả</Link>
        </div>

        {classes.length === 0 ? (
          <Card>
            <Empty msg="Bạn chưa có lớp học nào" />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {classes.slice(0, 4).map((c: Clazz) => {
              const progress = classProgress[c.id];
              const percentage = progress?.percentage ?? 0;
              const statusMeta = getStatusMeta(percentage);
              return (
                <Link
                  key={c.id}
                  to={`/student/classes/${c.id}`}
                  className={`block rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusMeta.glowClass}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-700">{c.classCode}</span>
                    <Pill color="indigo">{c.semester}</Pill>
                  </div>
                  <div className="font-semibold text-slate-800">{c.className}</div>
                  <div className="mt-1 text-xs text-slate-500">{c.courseTitle ?? 'Học phần'} · {c.lecturerName ?? 'Chưa phân công'}</div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusMeta.badgeClass}`}>
                      {statusMeta.label}
                    </span>
                    <span className="text-xs font-medium text-slate-600">{percentage}%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-linear-to-r ${statusMeta.barClass} transition-all duration-300`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentClasses() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [classProgress, setClassProgress] = useState<Record<number, ClassProgressState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await clazzService.getMyClasses();
        if (!mounted) return;
        setClasses(data);

        const registrations = await registrationService.getMyRegistrations();
        const progressMap: Record<number, ClassProgressState> = {};
        const results = await Promise.allSettled(
          registrations.map(async (registration) => {
            const progress = await progressService.getEnrollmentProgress(registration.enrollmentId);
            return { clazzId: registration.clazzId, progress };
          })
        );

        results.forEach((result) => {
          if (result.status !== 'fulfilled') return;
          const { clazzId, progress } = result.value;
          const percentage = progress?.percentage ?? 0;
          progressMap[clazzId] = {
            percentage,
            completedCount: progress?.completedCount ?? 0,
            totalCount: progress?.totalCount ?? 0,
            status: percentage >= 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started',
          };
        });

        if (mounted) setClassProgress(progressMap);
      } catch {
        if (mounted) setClassProgress({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const statusSummary = classes.reduce(
    (acc, clazzItem) => {
      const percentage = classProgress[clazzItem.id]?.percentage ?? 0;
      if (percentage >= 100) acc.completed += 1;
      else if (percentage > 0) acc.inProgress += 1;
      else acc.notStarted += 1;
      return acc;
    },
    { completed: 0, inProgress: 0, notStarted: 0 }
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <PageTitle>Lớp học của tôi</PageTitle>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: 'Đã học', value: statusSummary.completed, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Đang học', value: statusSummary.inProgress, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Chưa học', value: statusSummary.notStarted, tone: 'bg-slate-100 text-slate-600' },
        ].map((summary) => (
          <div key={summary.label} className={`rounded-2xl border border-white p-4 shadow-sm ${summary.tone}`}>
            <div className="text-xs font-medium uppercase tracking-[0.12em] opacity-80">{summary.label}</div>
            <div className="mt-2 text-2xl font-bold">{summary.value}</div>
          </div>
        ))}
      </div>
      {classes.length === 0 ? (
        <Empty msg="Bạn chưa có lớp học nào" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {classes.map((c) => {
            const progress = classProgress[c.id];
            const percentage = progress?.percentage ?? 0;
            const statusMeta = getStatusMeta(percentage);
            return (
              <Link
                key={c.id}
                to={`/student/classes/${c.id}`}
                className={`block rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusMeta.glowClass}`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-700">{c.classCode}</span>
                  <Pill color="indigo">{c.semester}</Pill>
                </div>
                <div className="font-semibold text-slate-800">{c.className}</div>
                <div className="mt-1 text-xs text-slate-500">{c.courseTitle ?? 'Học phần'} · {c.lecturerName ?? 'Chưa phân công'}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusMeta.badgeClass}`}>
                    {statusMeta.label}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{percentage}%</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${statusMeta.barClass} transition-all duration-300`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StudentAssignments() {
  const [items, setItems] = useState<{ a: Assignment; sub?: Submission }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    (async () => {
      try {
        setLoading(true);
        const cs: Clazz[] = await clazzService.getMyClasses();
        const all: Assignment[][] = await Promise.all(cs.map((c: Clazz) => assessmentService.getAssignments(c.id)));
        const subs: Submission[] = await assessmentService.getMySubmissions();
        const merged = all.flat().map((a: Assignment) => ({ a, sub: subs.find((s: Submission) => s.assignmentId === a.id) }));
        if (m) setItems(merged);
      } finally { if (m) setLoading(false); }
    })();
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  const summary = {
    total: items.length,
    submitted: items.filter(({ sub }) => !!sub).length,
    graded: items.filter(({ sub }) => sub?.score != null).length,
    pending: items.filter(({ sub }) => !sub).length,
  };

  return (
    <div>
      <PageTitle>Bài tập của tôi</PageTitle>
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          { label: 'Tổng bài tập', value: summary.total, tone: 'bg-indigo-50 text-indigo-700' },
          { label: 'Đã nộp', value: summary.submitted, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Đã chấm', value: summary.graded, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Chưa nộp', value: summary.pending, tone: 'bg-amber-50 text-amber-700' },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border border-white p-4 shadow-sm ${item.tone}`}>
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-80">{item.label}</div>
            <div className="mt-2 text-2xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-800">Flow nộp bài</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Assignment</span>
        </div>

        <table className="w-full text-sm">
          <thead className="text-xs text-slate-400 border-b border-slate-200">
            <tr><th className="text-left py-2">Bài</th><th>Hạn nộp</th><th>Điểm</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(({ a, sub }) => (
              <tr key={a.id} className="border-b border-slate-200/80 last:border-0">
                <td className="py-2"><div className="font-medium text-slate-800">{a.title}</div><div className="text-xs text-slate-500">{a.description}</div></td>
                <td className="text-slate-500 text-xs">{new Date(a.dueDate).toLocaleDateString("vi-VN")}</td>
                <td className="text-center">{sub?.score != null ? <span className="font-semibold text-emerald-600">{sub.score}/{a.maxScore}</span> : <span className="text-slate-500">-</span>}</td>
                <td className="text-center">{sub ? <Pill color={sub.score != null ? "green" : sub.isLate ? "red" : "amber"}>{sub.score != null ? "Đã chấm" : sub.isLate ? "Nộp trễ" : "Đã nộp"}</Pill> : <Pill color="slate">Chưa nộp</Pill>}</td>
                <td><SubmitBtn assignmentId={a.id} disabled={!!sub} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SubmitBtn({ assignmentId, disabled }: { assignmentId: number; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [submissionType, setSubmissionType] = useState<SubmissionType>('FILE');
  const [fileUrl, setFileUrl] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [externalLink, setExternalLink] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const resetFileSelection = () => {
    setSelectedFiles([]);
    setFileUrl('');
    setFileUrls([]);
  };

  const addFilesToSelection = (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;

    setSelectedFiles((prev) => {
      const seen = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const merged = [...prev];
      incomingFiles.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(key)) {
          merged.push(file);
          seen.add(key);
        }
      });
      return merged;
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveSelectedFile = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setSelectedFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const openPreview = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPreviewUrl(URL.createObjectURL(file));
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const validate = (value: string) => {
    if (!value.trim()) return 'Vui lòng nhập dữ liệu';
    if (submissionType === 'GOOGLE_DRIVE_LINK' && !/^https?:\/\/.*drive\.google\.com\//i.test(value)) return 'Link Google Drive không hợp lệ';
    if (submissionType === 'GITHUB_LINK' && !/^https?:\/\/github\.com\//i.test(value)) return 'Link GitHub không hợp lệ';
    return '';
  };

  const submit = async () => {
    try {
      let payloadFileUrl = fileUrl;
      let payloadFileUrls = fileUrls;
      if (submissionType === 'FILE' || submissionType === 'IMAGE') {
        if (selectedFiles.length === 0 && !fileUrl && payloadFileUrls.length === 0) {
          window.alert('Vui lòng chọn file hoặc upload trước khi nộp');
          return;
        }
        if (selectedFiles.length > 0) {
          const uploaded = await assessmentService.uploadSubmissionFiles(assignmentId, selectedFiles);
          payloadFileUrl = uploaded[0] ?? '';
          payloadFileUrls = uploaded;
          setFileUrl(payloadFileUrl);
          setFileUrls(payloadFileUrls);
        }
      }

      const payloadValue = submissionType === 'FILE' || submissionType === 'IMAGE' ? payloadFileUrl : externalLink;
      const error = validate(payloadValue);
      if (error) {
        window.alert(error);
        return;
      }

      setBusy(true);
      await assessmentService.submitAssignment(assignmentId, {
        submissionType,
        fileUrl: submissionType === 'FILE' || submissionType === 'IMAGE' ? payloadFileUrl : '',
        fileUrls: submissionType === 'FILE' || submissionType === 'IMAGE' ? payloadFileUrls : [],
        externalLink: submissionType === 'FILE' || submissionType === 'IMAGE' ? '' : payloadValue,
      });
      setOpen(false);
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nộp bài thất bại. Vui lòng thử lại.';
      window.alert(message);
    } finally {
      setBusy(false);
    }
  };

  if (disabled) return <span className="text-xs text-slate-500">Đã nộp</span>;
  return (
    <>
      <button
        disabled={busy}
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#243b78] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1e3267] disabled:opacity-50"
      >
        {busy ? '...' : 'Nộp'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl max-h-[86vh] overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Nộp bài tập</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
              {[
                { label: 'Tải file', value: 'FILE' },
                { label: 'Ảnh', value: 'IMAGE' },
                { label: 'Google Drive', value: 'GOOGLE_DRIVE_LINK' },
                { label: 'GitHub', value: 'GITHUB_LINK' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSubmissionType(option.value as SubmissionType)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${submissionType === option.value ? 'border-[#243b78] bg-[#243b78] text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {submissionType === 'FILE' || submissionType === 'IMAGE' ? (
              <div className="mb-4 space-y-3">
                <div
                  className={`rounded-2xl border-2 border-dashed p-3 transition ${isDragActive ? 'border-[#243b78] bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragActive(false);
                    addFilesToSelection(Array.from(event.dataTransfer.files ?? []));
                  }}
                >
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {submissionType === 'FILE' ? 'Chọn nhiều file hoặc kéo thả vào đây' : 'Chọn ảnh bài làm hoặc kéo thả ảnh vào đây'}
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="file"
                      multiple
                      accept={submissionType === 'IMAGE' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg'}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        if (files.length > 0) {
                          addFilesToSelection(files);
                        }
                        event.target.value = '';
                      }}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#243b78] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                    />

                    {selectedFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={resetFileSelection}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">
                    {submissionType === 'FILE'
                      ? 'Có thể chọn nhiều file từ máy hoặc kéo thả trực tiếp. Mỗi file sẽ được hiển thị rõ ràng trước khi nộp.'
                      : 'Bạn có thể chọn 1 hoặc nhiều ảnh chụp bài làm.'}
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <span>Tổng cộng</span>
                      <span>{selectedFiles.length} file</span>
                    </div>

                    <div className="grid max-h-48 gap-2 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                      {selectedFiles.map((file, index) => {
                        const isImage = file.type.startsWith('image/');
                        return (
                          <div
                            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
                            draggable
                            onDragStart={() => setDraggedIndex(index)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (draggedIndex !== null) {
                                moveSelectedFile(draggedIndex, index);
                                setDraggedIndex(null);
                              }
                            }}
                          >
                            <button type="button" onClick={() => isImage && openPreview(file)} className="shrink-0">
                              {isImage ? (
                                <img src={URL.createObjectURL(file)} alt={file.name} className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200" />
                              ) : (
                                <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-200 text-[9px] font-bold text-slate-600">
                                  {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                </div>
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-slate-700">{file.name}</div>
                              <div className="mt-0.5 text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="rounded-md border border-red-200 bg-white px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-500">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} file đã chọn` : 'Chưa có file nào được chọn'}
                </div>
              </div>
            ) : (
              <>
                <label className="mb-2 block text-sm font-medium text-slate-700">Link nộp</label>
                <input
                  value={externalLink}
                  onChange={(event) => setExternalLink(event.target.value)}
                  className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-[#243b78]"
                  placeholder={submissionType === 'GOOGLE_DRIVE_LINK' ? 'https://drive.google.com/...' : 'https://github.com/username/repo'}
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { resetFileSelection(); setOpen(false); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Huỷ</button>
              <button type="button" onClick={() => void submit()} className="rounded-lg bg-[#243b78] px-3 py-2 text-sm font-medium text-white hover:bg-[#1e3267]">Nộp bài</button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4" onClick={closePreview}>
          <div className="max-h-[92vh] max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white p-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-3 px-2 pt-1">
              <span className="text-sm font-medium text-slate-700">Xem trước ảnh</span>
              <button type="button" onClick={closePreview} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">Đóng</button>
            </div>
            <img src={previewUrl} alt="Preview" className="max-h-[78vh] max-w-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </>
  );
}

export function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [policy, setPolicy] = useState<GradingPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    Promise.all([
      gradingService.getMyGrades(),
      clazzService.getMyClasses(),
      profileService.getMyProfile().then((prof) => {
        if (prof?.curriculumId) {
          return curriculumService.getGradingPolicyPublic(prof.curriculumId).catch(() => null);
        }
        return null;
      }).catch(() => null)
    ])
      .then(([g, c, p]) => {
        if (m) {
          setGrades(g);
          setClasses(c);
          setPolicy(p);
        }
      })
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  const classesById = new Map(classes.map((item) => [item.id, item]));
  const scored = grades.map((g) => g.totalScore).filter((score): score is number => score != null);
  const avg = scored.length ? (scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(2) : "-";
  const groupedGrades = new Map<string, Grade[]>();
  grades.forEach((grade) => {
    const clazz = classesById.get(grade.classId);
    const group = `${clazz?.academicYear ?? 'Chưa xác định'} · ${clazz?.semester ?? 'Chưa xác định'}`;
    groupedGrades.set(group, [...(groupedGrades.get(group) ?? []), grade]);
  });
  return (
    <div>
      <PageTitle>Bảng điểm</PageTitle>
      {policy !== undefined && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 flex justify-between items-center shadow-sm">
          <span className="font-semibold text-blue-900">Trọng số tính điểm áp dụng:</span>
          <span className="font-medium">
            {policy
              ? `${Math.round(policy.attendanceWeight * 100)}% Chuyên cần + ${Math.round(policy.midtermWeight * 100)}% Giữa kỳ + ${Math.round(policy.finalWeight * 100)}% Cuối kỳ`
              : '40% Giữa kỳ + 60% Cuối kỳ'}
          </span>
        </div>
      )}
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(220px,0.75fr)_2fr]">
        <Card className="bg-linear-to-br from-[#00376f] to-[#0b5ca8] text-white">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-lg font-bold">{user?.fullName?.[0] ?? '?'}</div>
            <div><div className="font-semibold">{user?.fullName}</div><div className="text-xs text-blue-100">Sinh viên · {user?.email}</div></div>
          </div>
          <div className="space-y-3 border-t border-white/20 pt-4 text-sm"><div className="flex justify-between gap-3"><span className="text-blue-100">Mã sinh viên</span><span>{user?.id ? `SV #${user.id}` : '-'}</span></div><div className="flex justify-between gap-3"><span className="text-blue-100">Số học phần</span><span>{grades.length}</span></div></div>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><div className="text-xs font-medium text-slate-500">Điểm trung bình</div><div className="mt-2 text-3xl font-bold text-emerald-600">{avg}</div><div className="mt-1 text-xs text-slate-400">Theo điểm tổng kết</div></Card>
          <Card><div className="text-xs font-medium text-slate-500">Học phần có điểm</div><div className="mt-2 text-3xl font-bold text-primary">{grades.length}</div><div className="mt-1 text-xs text-slate-400">Theo lớp học phần</div></Card>
          <Card><div className="text-xs font-medium text-slate-500">Điểm cao nhất</div><div className="mt-2 text-3xl font-bold text-slate-900">{scored.length ? Math.max(...scored).toFixed(1) : '-'}</div><div className="mt-1 text-xs text-slate-400">Thang điểm 10</div></Card>
        </div>
      </div>
      {grades.length === 0 ? <Card><Empty msg="Chưa có điểm" /></Card> : Array.from(groupedGrades.entries()).map(([group, groupGrades]) => (
        <Card key={group} className="mb-4 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3"><div><div className="font-semibold text-primary">{group}</div><div className="text-xs text-slate-500">Bảng điểm học phần</div></div><span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary">{groupGrades.length} học phần</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-175 text-sm"><thead className="border-b border-slate-200 text-xs text-slate-500"><tr><th className="px-4 py-3 text-left">Học phần</th><th className="text-left">Lớp học phần</th><th className="text-center">Giữa kỳ</th><th className="text-center">Cuối kỳ</th><th className="text-center">Tổng kết</th><th className="text-center">Đánh giá</th></tr></thead><tbody>{groupGrades.map((grade) => { const clazz = classesById.get(grade.classId); const passed = grade.totalScore != null && grade.totalScore >= 5; return <tr key={grade.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3"><div className="font-medium text-slate-800">{clazz?.courseTitle ?? 'Chưa có thông tin môn học'}</div><div className="mt-0.5 text-xs text-slate-400">Môn #{clazz?.courseId ?? '-'}</div></td><td className="font-mono text-xs text-primary">{clazz?.classCode ?? `Lớp #${grade.classId}`}</td><td className="text-center">{grade.midtermScore ?? '-'}</td><td className="text-center">{grade.finalScore ?? '-'}</td><td className="text-center font-semibold text-slate-900">{grade.totalScore ?? '-'}</td><td className="text-center"><Pill color={passed ? 'green' : grade.totalScore == null ? 'slate' : 'red'}>{passed ? 'Đạt' : grade.totalScore == null ? 'Chưa đủ điểm' : 'Chưa đạt'}</Pill></td></tr>; })}</tbody></table></div>
        </Card>
      ))}
    </div>
  );
}
