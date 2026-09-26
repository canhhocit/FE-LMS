// Student pages
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, BookOpen, Calendar, CreditCard, Bell, ArrowRight, CheckCircle2, Clock, FileText, Upload, Trash2, Eye, X } from "lucide-react";
import * as clazzService from "../../services/clazzService";
import * as assessmentService from "../../services/assessmentService";
import * as gradingService from "../../services/gradingService";
import * as notificationService from "../../services/notificationService";
import * as progressService from "../../services/progressService";
import * as registrationService from "../../services/registrationService";
import * as scheduleService from "../../services/scheduleService";
import * as reportService from "../../services/reportService";
import { PageHeader, Card, StatCard, Spinner, Empty, Badge, Button, Table } from "../../components/ui";
import { AcademicWarningBanner } from "../../components/AcademicWarningBanner";
import { useAuth } from "../../contexts/useAuth";
import type { Clazz, Assignment, Submission, Grade, Notification, GradingPolicy, SubmissionType, AcademicStatus } from "../../types";
import * as profileService from "../../services/profileService";
import * as curriculumService from "../../services/curriculumService";

type ClassProgressState = {
  percentage: number;
  completedCount: number;
  totalCount: number;
  status: 'completed' | 'in-progress' | 'not-started';
};

const getStatusMeta = (percentage: number, totalCount?: number) => {
  if (totalCount === 0) {
    return { label: 'Chưa có bài học', badgeColor: 'slate' as const, barClass: 'bg-slate-300 dark:bg-slate-700' };
  }
  if (percentage >= 100) {
    return { label: 'Đã hoàn thành', badgeColor: 'emerald' as const, barClass: 'bg-emerald-500' };
  }
  if (percentage > 0) {
    return { label: 'Đang học', badgeColor: 'indigo' as const, barClass: 'bg-accent-600' };
  }
  return { label: 'Chưa bắt đầu', badgeColor: 'slate' as const, barClass: 'bg-slate-300 dark:bg-slate-700' };
};

export function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [classProgress, setClassProgress] = useState<Record<number, ClassProgressState>>({});
  const [subs, setSubs] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [academicStatus, setAcademicStatus] = useState<AcademicStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      clazzService.getMyClasses(),
      assessmentService.getMySubmissions(),
      notificationService.getNotifications(),
      scheduleService.getMySchedule(),
      reportService.getAcademicStatus().catch(() => null),
    ])
      .then(async ([classesResult, subsResult, notificationResult, scheduleResult, academicStatusResult]) => {
        if (!mounted) return;

        if (academicStatusResult.status === 'fulfilled' && academicStatusResult.value) {
          setAcademicStatus(academicStatusResult.value);
        }

        if (classesResult.status === 'fulfilled') {
          const classList = classesResult.value;
          setClasses(classList);

          try {
            const registrations = await registrationService.getMyRegistrations().catch(() => []);
            const progressMap: Record<number, ClassProgressState> = {};

            const classToEnrollmentMap: Record<number, number> = {};
            registrations.forEach((r) => {
              const cId = Number(r.clazzId ?? (r as any).classId ?? (r as any).id);
              const eId = Number(r.enrollmentId ?? (r as any).id);
              if (cId && eId) classToEnrollmentMap[cId] = eId;
            });

            classList.forEach((c) => {
              if (!classToEnrollmentMap[c.id]) {
                classToEnrollmentMap[c.id] = (c as any).enrollmentId ?? c.id;
              }
            });

            const results = await Promise.allSettled(
              Object.entries(classToEnrollmentMap).map(async ([clazzIdStr, enrollmentId]) => {
                const clazzId = Number(clazzIdStr);
                const progress = await progressService.getEnrollmentProgress(enrollmentId);
                return { clazzId, progress };
              })
            );

            results.forEach((result) => {
              if (result.status !== 'fulfilled' || !result.value) return;
              const { clazzId, progress } = result.value;
              if (!progress) return;
              const percentage = progress.percentage ?? 0;
              const status = percentage >= 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'not-started';
              progressMap[clazzId] = {
                percentage,
                completedCount: progress.completedCount ?? 0,
                totalCount: progress.totalCount ?? 0,
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
  const continueLearningMeta = getStatusMeta(continueLearningPercentage, continueLearningProgress?.totalCount);

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
    <div className="space-y-6">
      <PageHeader
        title={`Chào mừng trở lại, ${user?.fullName || 'Sinh viên'}`}
        subtitle={`Hôm nay, ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {/* Class Reminder Banner */}
      {continueLearningClass && (
        <div className="p-4 bg-accent-50/60 dark:bg-accent-950/40 border border-accent-200/80 dark:border-accent-900/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-600 text-white rounded-lg shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-accent-700 dark:text-accent-300 mr-1.5">Lịch học sắp tới:</span>
              <span>
                Lớp học phần <strong className="font-semibold text-slate-900 dark:text-white">{continueLearningClass.className} ({continueLearningClass.classCode})</strong> diễn ra theo thời khóa biểu sinh viên.
              </span>
            </div>
          </div>
          <Badge color="indigo" className="shrink-0">Nhắc lịch tự động</Badge>
        </div>
      )}

      {/* Academic Warning Banner */}
      <AcademicWarningBanner
        studentName={user?.fullName}
        studentCode={user?.studentCode || user?.email}
        debtCredits={academicStatus?.failedCourses?.reduce((sum, c) => sum + (c.credit || 0), 0) ?? 0}
        maxAllowedCredits={10}
      />

      {/* Quick Navigation Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <BookOpen className="w-5 h-5" />, label: 'Đăng ký học', desc: 'Đăng ký tín chỉ', to: '/student/registrations', color: 'accent' as const },
          { icon: <Calendar className="w-5 h-5" />, label: 'Thời khóa biểu', desc: `${scheduleCount} buổi học`, to: '/student/schedule', color: 'emerald' as const },
          { icon: <CreditCard className="w-5 h-5" />, label: 'Học phí', desc: 'Tra cứu & thanh toán', to: '/student/tuition', color: 'amber' as const },
          { icon: <Bell className="w-5 h-5" />, label: 'Thông báo', desc: `${notifications.length} tin mới`, to: '/student/notifications', color: 'rose' as const },
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <StatCard
              label={item.label}
              value={item.desc}
              icon={item.icon}
              color={item.color}
              className="hover:border-accent-500/50 cursor-pointer"
            />
          </Link>
        ))}
      </div>

      {/* Continue Learning Featured Card */}
      <Card className="bg-slate-900 text-white dark:bg-slate-900/90 dark:border-slate-800 border border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center rounded-md bg-accent-600/20 text-accent-300 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border border-accent-500/30">
              Tiến độ học tập
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {continueLearningClass ? continueLearningClass.className : 'Chưa có lớp học phần nào'}
            </h3>
            <p className="text-xs text-slate-400">
              {continueLearningClass ? `${continueLearningClass.classCode} · ${continueLearningClass.courseTitle ?? 'Học phần'}` : 'Vui lòng đăng ký học phần để bắt đầu.'}
            </p>
          </div>

          <div className="w-full lg:w-72 shrink-0 bg-slate-800/80 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <Badge color={continueLearningMeta.badgeColor}>{continueLearningMeta.label}</Badge>
              <span className="font-bold text-white">{continueLearningPercentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className={`h-full rounded-full ${continueLearningMeta.barClass} transition-all duration-300`}
                style={{ width: `${Math.min(100, continueLearningPercentage)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {continueLearningProgress && continueLearningProgress.totalCount === 0
                  ? 'Chưa có bài học'
                  : `${continueLearningProgress?.completedCount ?? 0}/${continueLearningProgress?.totalCount ?? 0} bài học`}
              </span>
              {continueLearningClass && (
                <Link to={`/student/classes/${continueLearningClass.id}`} className="font-semibold text-accent-400 hover:underline flex items-center gap-1">
                  Vào học <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Recent Activity & Academic Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Hoạt động gần đây</h3>
            <Link to="/student/notifications" className="text-xs font-semibold text-accent-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <Empty msg="Chưa có hoạt động gần đây" />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((activity, index) => (
                <div key={`${activity.title}-${index}`} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{activity.title}</div>
                    <div className="text-[11px] text-slate-400">{activity.detail}</div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tổng quan học kỳ</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Lớp đang học</div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{classes.length}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Buổi học</div>
              <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">{scheduleCount}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Bài đã nộp</div>
              <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{subs.length}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Chờ chấm</div>
              <div className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">{subs.filter((s) => s.score == null).length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Classes Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Lớp học phần của tôi</h3>
          <Link to="/student/classes" className="text-xs font-semibold text-accent-600 hover:underline">
            Xem tất cả ({classes.length})
          </Link>
        </div>

        {classes.length === 0 ? (
          <Empty msg="Bạn chưa tham gia lớp học phần nào" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.slice(0, 4).map((c: Clazz) => {
              const progress = classProgress[c.id];
              const percentage = progress?.percentage ?? 0;
              const statusMeta = getStatusMeta(percentage, progress?.totalCount);
              return (
                <Link key={c.id} to={`/student/classes/${c.id}`}>
                  <Card className="hover:border-accent-500/50 cursor-pointer h-full flex flex-col justify-between">
                    <div>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-accent-600 dark:text-accent-400">{c.classCode}</span>
                        <Badge color="indigo">{c.semester}</Badge>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.className}</h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {c.courseTitle ?? 'Học phần'} · {c.lecturerName ?? 'Chưa phân công'}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <Badge color={statusMeta.badgeColor}>{statusMeta.label}</Badge>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusMeta.barClass} transition-all duration-300`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
                        <span>
                          {progress && progress.totalCount === 0
                            ? 'Chưa có bài học'
                            : `${progress?.completedCount ?? 0}/${progress?.totalCount ?? 0} bài học`}
                        </span>
                        <span>{c.room ? `Phòng ${c.room}` : ''}</span>
                      </div>
                    </div>
                  </Card>
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
    <div className="space-y-6">
      <PageHeader
        title="Lớp học phần của tôi"
        subtitle="Danh sách các lớp học phần sinh viên đang theo học trong các học kỳ"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Đã hoàn thành" value={statusSummary.completed} color="emerald" />
        <StatCard label="Đang học" value={statusSummary.inProgress} color="accent" />
        <StatCard label="Chưa bắt đầu" value={statusSummary.notStarted} color="sky" />
      </div>

      {classes.length === 0 ? (
        <Empty msg="Bạn chưa tham gia lớp học phần nào" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => {
            const progress = classProgress[c.id];
            const percentage = progress?.percentage ?? 0;
            const statusMeta = getStatusMeta(percentage, progress?.totalCount);
            return (
              <Link key={c.id} to={`/student/classes/${c.id}`}>
                <Card className="hover:border-accent-500/50 cursor-pointer h-full flex flex-col justify-between">
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-accent-600 dark:text-accent-400">{c.classCode}</span>
                      <Badge color="indigo">{c.semester}</Badge>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{c.className}</h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {c.courseTitle ?? 'Học phần'} · {c.lecturerName ?? 'Chưa phân công'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <Badge color={statusMeta.badgeColor}>{statusMeta.label}</Badge>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusMeta.barClass} transition-all duration-300`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
                      <span>
                        {progress && progress.totalCount === 0
                          ? 'Chưa có bài học'
                          : `${progress?.completedCount ?? 0}/${progress?.totalCount ?? 0} bài học`}
                      </span>
                      <span>{c.room ? `Phòng ${c.room}` : ''}</span>
                    </div>
                  </div>
                </Card>
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
    <div className="space-y-6">
      <PageHeader
        title="Bài tập của tôi"
        subtitle="Danh sách bài tập và tiến độ nộp bài các lớp học phần"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng bài tập" value={summary.total} color="accent" />
        <StatCard label="Đã nộp" value={summary.submitted} color="emerald" />
        <StatCard label="Đã chấm" value={summary.graded} color="sky" />
        <StatCard label="Chưa nộp" value={summary.pending} color="amber" />
      </div>

      {items.length === 0 ? (
        <Empty msg="Chưa có bài tập nào" />
      ) : (
        <Table headers={['Tên bài tập', 'Hạn nộp', 'Điểm số', 'Trạng thái', 'Hành động']}>
          {items.map(({ a, sub }) => (
            <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900 dark:text-white text-xs">{a.title}</div>
                {a.description && <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{a.description}</div>}
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                {new Date(a.dueDate).toLocaleDateString("vi-VN")}
              </td>
              <td className="px-4 py-3 text-center">
                {sub?.score != null ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{sub.score} / {a.maxScore}</span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {sub ? (
                  <Badge color={sub.score != null ? "emerald" : sub.isLate ? "red" : "amber"}>
                    {sub.score != null ? "Đã chấm" : sub.isLate ? "Nộp trễ" : "Đã nộp"}
                  </Badge>
                ) : (
                  <Badge color="slate">Chưa nộp</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <SubmitBtn assignmentId={a.id} disabled={!!sub} />
              </td>
            </tr>
          ))}
        </Table>
      )}
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

  if (disabled) return <span className="text-xs text-slate-400 font-medium">Đã nộp</span>;
  return (
    <>
      <Button
        size="sm"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        {busy ? 'Đang gửi...' : 'Nộp bài'}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-modal max-h-[86vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nộp bài tập</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'File', value: 'FILE' },
                { label: 'Ảnh', value: 'IMAGE' },
                { label: 'Drive', value: 'GOOGLE_DRIVE_LINK' },
                { label: 'GitHub', value: 'GITHUB_LINK' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSubmissionType(option.value as SubmissionType)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                    submissionType === option.value
                      ? 'border-accent-600 bg-accent-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {submissionType === 'FILE' || submissionType === 'IMAGE' ? (
              <div className="mb-4 space-y-3">
                <div
                  className={`rounded-xl border-2 border-dashed p-4 transition text-center ${
                    isDragActive ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-950/30' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
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
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {submissionType === 'FILE' ? 'Kéo thả file vào đây hoặc chọn từ máy' : 'Kéo thả ảnh bài làm vào đây'}
                  </p>

                  <input
                    type="file"
                    multiple
                    accept={submissionType === 'IMAGE' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.png,.jpg,.jpeg'}
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      if (files.length > 0) addFilesToSelection(files);
                      event.target.value = '';
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 dark:file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 dark:file:text-slate-200 cursor-pointer mt-2"
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>File đã chọn ({selectedFiles.length})</span>
                      <button type="button" onClick={resetFileSelection} className="text-rose-600 hover:underline">Xóa tất cả</button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                          <span className="truncate max-w-[240px] text-slate-800 dark:text-slate-200">{file.name}</span>
                          <button type="button" onClick={() => removeSelectedFile(index)} className="text-slate-400 hover:text-rose-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Link nộp bài</label>
                <input
                  value={externalLink}
                  onChange={(event) => setExternalLink(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-accent-600"
                  placeholder={submissionType === 'GOOGLE_DRIVE_LINK' ? 'https://drive.google.com/...' : 'https://github.com/...'}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={() => void submit()}>Gửi bài nộp</Button>
            </div>
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
    <div className="space-y-6">
      <PageHeader
        title="Kết quả học tập"
        subtitle="Bảng điểm quá trình, giữa kỳ và tổng kết theo từng học phần"
      />

      {policy && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300">
          <span className="font-semibold">Trọng số tính điểm:</span>
          <span>
            {Math.round(policy.attendanceWeight * 100)}% Chuyên cần + {Math.round(policy.midtermWeight * 100)}% Giữa kỳ + {Math.round(policy.finalWeight * 100)}% Cuối kỳ
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Điểm TB tích lũy" value={avg} color="emerald" />
        <StatCard label="Số môn đã có điểm" value={grades.length} color="accent" />
        <StatCard label="Điểm cao nhất" value={scored.length ? Math.max(...scored).toFixed(1) : '-'} color="amber" />
      </div>

      {grades.length === 0 ? (
        <Empty msg="Chưa có kết quả điểm môn học" />
      ) : (
        Array.from(groupedGrades.entries()).map(([group, groupGrades]) => (
          <div key={group} className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{group}</h4>
            <Table headers={['Học phần', 'Mã Lớp HP', 'Giữa kỳ', 'Cuối kỳ', 'Tổng kết', 'Đánh giá']}>
              {groupGrades.map((grade) => {
                const clazz = classesById.get(grade.classId);
                const passed = grade.totalScore != null && grade.totalScore >= 5;
                return (
                  <tr key={grade.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{clazz?.courseTitle ?? 'Học phần'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-accent-600 dark:text-accent-400">
                      {clazz?.classCode ?? `Lớp #${grade.classId}`}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">{grade.midtermScore ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-xs">{grade.finalScore ?? '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white text-xs">
                      {grade.totalScore ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge color={passed ? 'emerald' : grade.totalScore == null ? 'slate' : 'red'}>
                        {passed ? 'Đạt' : grade.totalScore == null ? 'Chờ điểm' : 'Không đạt'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>
        ))
      )}
    </div>
  );
}
