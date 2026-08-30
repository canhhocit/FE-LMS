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
import type { Clazz, Assignment, Submission, Grade, Notification } from "../../types";

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
    return { label: 'Đang học', badgeClass: 'bg-amber-100 text-amber-700', barClass: 'from-amber-500 to-orange-400', glowClass: 'shadow-[0_0_0_1px_rgba(245,158,11,0.18)] ring-1 ring-amber-200 animate-pulse' };
  }
  return { label: 'Chưa học', badgeClass: 'bg-slate-100 text-slate-600', barClass: 'from-slate-300 to-slate-200', glowClass: 'ring-1 ring-slate-200' };
};

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
          ['📚', 'HỌC TẬP', 'Đăng ký học', '/student/registrations', 'bg-blue-600'],
          ['▣', 'LỊCH', 'Thời khóa biểu', '/student/schedule', 'bg-amber-500'],
          ['▤', 'TÀI CHÍNH', 'Học phí', '/student/tuition', 'bg-emerald-600'],
          ['▦', 'THÔNG TIN', 'Tin tức & thông báo', '/student/notifications', 'bg-rose-500'],
        ].map(([icon, label, title, to, color]) => (
          <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-[0_8px_20px_rgba(36,59,120,0.08)] transition hover:-translate-y-0.5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl text-white ${color}`}>{icon}</span>
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
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 text-xl font-bold text-white">🔥</div>
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
  if (disabled) return <span className="text-xs text-slate-500">Da nop</span>;
  return (
    <button disabled={busy}
      onClick={async () => {
        const c = window.prompt("Nhap noi dung bai lam:");
        if (!c) return;
        setBusy(true);
        try { await assessmentService.submitAssignment(assignmentId, { fileUrl: c }); window.location.reload(); }
        finally { setBusy(false); }
      }}
      className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">
      {busy ? "..." : "Nop"}
    </button>
  );
}

export function StudentGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    Promise.all([gradingService.getMyGrades(), clazzService.getMyClasses()])
      .then(([g, c]) => { if (m) { setGrades(g); setClasses(c); } })
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
