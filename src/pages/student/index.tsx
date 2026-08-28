// Student pages
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as assessmentService from "../../services/assessmentService";
import * as gradingService from "../../services/gradingService";
import * as notificationService from "../../services/notificationService";
import * as scheduleService from "../../services/scheduleService";
import { PageTitle, Card, Spinner, Empty, Pill } from "../../components/Layout";
import { useAuth } from "../../contexts/useAuth";
import type { Clazz, Assignment, Submission, Grade, Notification } from "../../types";

export function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    Promise.allSettled([
      clazzService.getMyClasses(),
      assessmentService.getMySubmissions(),
        <PageTitle>Trang chủ</PageTitle>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm text-slate-500">Chào mừng trở lại,</p><h2 className="text-xl font-bold text-[#243b78]">{user?.fullName}</h2></div><span className="text-xs text-slate-400">Hôm nay · {new Date().toLocaleDateString('vi-VN')}</span></div>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[['📚', 'HỌC TẬP', 'Đăng ký học', '/student/registrations', 'bg-blue-600'], ['▣', 'LỊCH', 'Thời khóa biểu', '/student/schedule', 'bg-amber-500'], ['▤', 'TÀI CHÍNH', 'Học phí', '/student/tuition', 'bg-emerald-600'], ['▦', 'THÔNG TIN', 'Tin tức & thông báo', '/student/notifications', 'bg-rose-500']].map(([icon, label, title, to, color]) => <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-[0_8px_20px_rgba(36,59,120,0.08)] transition hover:-translate-y-0.5"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl text-white ${color}`}>{icon}</span><span><span className="block text-[11px] font-medium text-slate-400">{label}</span><span className="block font-semibold text-[#243b78]">{title}</span></span></Link>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-3"><h3 className="font-semibold text-[#243b78]">Tin đào tạo</h3><Link to="/student/notifications" className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">Xem tất cả</Link></div><div className="px-4">{notifications.length === 0 ? <Empty msg="Chưa có thông báo mới" /> : notifications.map((notification) => <Link to="/student/notifications" key={notification.id} className="block border-b border-dashed border-slate-200 py-3 last:border-0"><div className="flex gap-3"><span className="text-blue-600">⚑</span><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{notification.title}</div><div className="mt-1 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleDateString('vi-VN')}</div></div></div></Link>)}</div></Card>
          <Card className="overflow-hidden p-0"><div className="border-b border-rose-100 bg-rose-50 px-4 py-3"><h3 className="font-semibold text-[#243b78]">Tổng quan học tập</h3></div><div className="grid grid-cols-2 gap-px bg-slate-100"><div className="bg-white p-4"><div className="text-xs text-slate-500">Lớp đang học</div><div className="mt-1 text-2xl font-bold text-[#243b78]">{classes.length}</div></div><div className="bg-white p-4"><div className="text-xs text-slate-500">Buổi học</div><div className="mt-1 text-2xl font-bold text-amber-600">{scheduleCount}</div></div><div className="bg-white p-4"><div className="text-xs text-slate-500">Bài đã nộp</div><div className="mt-1 text-2xl font-bold text-emerald-600">{subs.length}</div></div><div className="bg-white p-4"><div className="text-xs text-slate-500">Chờ chấm</div><div className="mt-1 text-2xl font-bold text-rose-600">{subs.filter((submission) => submission.score == null).length}</div></div></div></Card>
        </div>
        <div className="mt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-[#243b78]">Lớp học của tôi</h3><Link to="/student/classes" className="text-xs font-semibold text-blue-700">Xem tất cả</Link></div><div className="grid gap-3 md:grid-cols-2">{classes.slice(0, 4).map((c: Clazz) => <Link key={c.id} to={`/student/classes/${c.id}`} className="block rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="mb-2 flex items-start justify-between gap-2"><span className="font-mono text-xs font-semibold text-blue-700">{c.classCode}</span><Pill color="indigo">{c.semester}</Pill></div><div className="font-semibold text-slate-800">{c.className}</div><div className="mt-1 text-xs text-slate-500">{c.courseTitle ?? 'Học phần'} · {c.lecturerName ?? 'Chưa phân công'}</div></Link>)}</div>{classes.length === 0 && <Card><Empty msg="Bạn chưa có lớp học nào" /></Card>}</div>
            className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-primary transition">
            <div className="text-xs text-indigo-300 font-mono">{c.classCode}</div>
            <div className="font-semibold">{c.className}</div>
            <div className="text-xs text-slate-400 mt-1">{c.lecturerName ?? 'Chưa phân công'} - {c.semester}</div>
          </Link>
        ))}
              <PageTitle>Trang chủ</PageTitle>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm text-slate-500">Chào mừng trở lại,</p><h2 className="text-xl font-bold text-[#243b78]">{user?.fullName}</h2></div><span className="text-xs text-slate-400">Hôm nay · {new Date().toLocaleDateString('vi-VN')}</span></div>
              <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[['📚', 'HỌC TẬP', 'Đăng ký học', '/student/registrations', 'bg-blue-600'], ['▣', 'LỊCH', 'Thời khóa biểu', '/student/schedule', 'bg-amber-500'], ['▤', 'TÀI CHÍNH', 'Học phí', '/student/tuition', 'bg-emerald-600'], ['▦', 'THÔNG TIN', 'Tin tức & thông báo', '/student/notifications', 'bg-rose-500']].map(([icon, label, title, to, color]) => <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-[0_8px_20px_rgba(36,59,120,0.08)] transition hover:-translate-y-0.5"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl text-white ${color}`}>{icon}</span><span><span className="block text-[11px] font-medium text-slate-400">{label}</span><span className="block font-semibold text-[#243b78]">{title}</span></span></Link>)}
  const [classes, setClasses] = useState<Clazz[]>([]);
              <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <Card className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-3"><h3 className="font-semibold text-[#243b78]">Tin đào tạo</h3><Link to="/student/notifications" className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">Xem tất cả</Link></div><div className="px-4">{notifications.length === 0 ? <Empty msg="Chưa có thông báo mới" /> : notifications.map((notification) => <Link to="/student/notifications" key={notification.id} className="block border-b border-dashed border-slate-200 py-3 last:border-0"><div className="flex gap-3"><span className="text-blue-600">⚑</span><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{notification.title}</div><div className="mt-1 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleDateString('vi-VN')}</div></div></div></Link>)}</div></Card>
                <Card className="overflow-hidden p-0"><div className="border-b border-rose-100 bg-rose-50 px-4 py-3"><h3 className="font-semibold text-[#243b78]">Tổng quan học tập</h3></div><div className="grid grid-cols-2 gap-px bg-slate-100"><div className="bg-white p-4"><div className="text-xs text-slate-500">Lớp đang học</div><div className="mt-1 text-2xl font-bold text-[#243b78]">{classes.length}</div></div><div className="bg-white p-4"><div className="text-xs text-slate-500">Buổi học</div><div className="mt-1 text-2xl font-bold text-amber-600">{scheduleCount}</div></div><div className="bg-white p-4"><div className="text-xs text-slate-500">Bài đã nộp</div><div className="mt-1 text-2xl font-bold text-emerald-600">{subs.length}</div></div><div className="bg-white p-4"><div className="text-xs text-slate-500">Chờ chấm</div><div className="mt-1 text-2xl font-bold text-rose-600">{subs.filter((submission) => submission.score == null).length}</div></div></div></Card>
              </div>
              <div className="mt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-[#243b78]">Lớp học của tôi</h3><Link to="/student/classes" className="text-xs font-semibold text-blue-700">Xem tất cả</Link></div><div className="grid gap-3 md:grid-cols-2">{classes.slice(0, 4).map((c: Clazz) => <Link key={c.id} to={`/student/classes/${c.id}`} className="block rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="mb-2 flex items-start justify-between gap-2"><span className="font-mono text-xs font-semibold text-blue-700">{c.classCode}</span><Pill color="indigo">{c.semester}</Pill></div><div className="font-semibold text-slate-800">{c.className}</div><div className="mt-1 text-xs text-slate-500">{c.courseTitle ?? 'Học phần'} · {c.lecturerName ?? 'Chưa phân công'}</div></Link>)}</div>{classes.length === 0 && <Card><Empty msg="Bạn chưa có lớp học nào" /></Card>}</div>
      {classes.length === 0 ? <Empty msg="Ban chua co lop nao" /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {classes.map((c: Clazz) => (
            <Link key={c.id} to={`/student/classes/${c.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-primary transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-indigo-300 font-mono">{c.classCode}</div>
                  <div className="font-semibold">{c.className}</div>
                  <div className="text-xs text-slate-400 mt-1">{c.lecturerName}</div>
                </div>
                <Pill color="green">{c.semester}</Pill>
              </div>
            </Link>
          ))}
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
  return (
    <div>
      <PageTitle>Bai tap cua toi</PageTitle>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-400 border-b border-slate-800">
            <tr><th className="text-left py-2">Bai</th><th>Han nop</th><th>Diem</th><th>Trang thai</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(({ a, sub }) => (
              <tr key={a.id} className="border-b border-slate-800/50">
                <td className="py-2"><div className="font-medium">{a.title}</div><div className="text-xs text-slate-500">{a.description}</div></td>
                <td className="text-slate-400 text-xs">{new Date(a.dueDate).toLocaleDateString("vi-VN")}</td>
                <td className="text-center">{sub?.score != null ? <span className="text-emerald-300 font-semibold">{sub.score}/{a.maxScore}</span> : <span className="text-slate-500">-</span>}</td>
                <td className="text-center">{sub ? <Pill color={sub.score != null ? "green" : sub.isLate ? "red" : "amber"}>{sub.score != null ? "DA CHAM" : sub.isLate ? "NOP TRE" : "DA NOP"}</Pill> : <Pill color="slate">CHUA NOP</Pill>}</td>
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
