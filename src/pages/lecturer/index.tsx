// Lecturer pages
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as assessmentService from '../../services/assessmentService';
import * as gradingService from '../../services/gradingService';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import { TeacherIcon, FlameIcon, DotIcon } from '../../components/icons';
import type { Clazz, Assignment, Submission, AttendanceRecord } from '../../types';

export function LecturerDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    clazzService.getMyClasses().then(setClasses);
    // Tổng submissions của các bài tập thuộc lớp của giảng viên
    (async () => {
      const cs = await clazzService.getMyClasses();
      const allAssigns = (await Promise.all(cs.map((c) => assessmentService.getAssignments(c.id)))).flat();
      const allSubs = (await Promise.all(allAssigns.map((a) => assessmentService.getSubmissions(a.id)))).flat();
      if (m) setSubs(allSubs);
    })().finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  const gradedCount = subs.filter((s) => s.score != null).length;
  const pendingCount = subs.filter((s) => s.score == null).length;
  const activityDates = subs.map((item) => new Date(item.submittedAt)).filter((date) => !Number.isNaN(date.getTime()));
  const uniqueDates = new Set(activityDates.map((date) => date.toISOString().slice(0, 10)));
  const teachingStreak = Math.min(7, Math.max(1, uniqueDates.size || 1));
  const recentActivity = subs.slice(0, 4).map((item) => ({
    title: `Bài nộp mới · ${item.studentId}`,
    detail: item.score == null ? 'Chờ chấm điểm' : 'Đã chấm điểm',
    time: new Date(item.submittedAt).toLocaleDateString('vi-VN'),
  }));

  if (loading) return <Spinner />;
  return (
    <div className="space-y-5">
      <PageTitle>
        Xin chào, {user?.fullName} <TeacherIcon className="inline w-5 h-5 ml-1 text-indigo-600" />
      </PageTitle>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-linear-to-br from-indigo-600 to-blue-500 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-100">Lớp phụ trách</div>
          <div className="mt-2 text-3xl font-bold">{classes.length}</div>
        </Card>
        <Card className="bg-linear-to-br from-amber-50 to-orange-50">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-amber-700">Tổng bài nộp</div>
          <div className="mt-2 text-3xl font-bold text-amber-700">{subs.length}</div>
        </Card>
        <Card className="bg-linear-to-br from-emerald-50 to-green-50">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-700">Đã chấm</div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">{gradedCount}</div>
        </Card>
        <Card className="bg-linear-to-br from-rose-50 to-pink-50">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-rose-700">Chờ chấm</div>
          <div className="mt-2 text-3xl font-bold text-rose-700">{pendingCount}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-800">Recent activity</h3>
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Live</span>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? <Empty msg="Chưa có hoạt động gần đây" /> : recentActivity.map((item) => (
              <div key={`${item.title}-${item.time}`} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="mt-1.5 grid h-5 w-5 place-items-center rounded-full bg-indigo-100 flex-shrink-0">
                  <DotIcon className="w-1.5 h-1.5 text-indigo-700" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                </div>
                <div className="text-[11px] text-slate-400">{item.time}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-800">Teaching streak</h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">{teachingStreak} ngày</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 text-white flex-shrink-0">
              <FlameIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{teachingStreak} ngày</div>
              <div className="text-sm text-slate-500">Bạn vẫn giữ nhịp phản hồi và giảng dạy đều đặn.</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-800">Lớp của tôi</h3>
          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Active</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {classes.map((c) => (
            <Link key={c.id} to={`/lecturer/classes/${c.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-indigo-700">{c.classCode}</span>
                <Pill color="indigo">{c.semester}</Pill>
              </div>
              <div className="font-semibold text-slate-800">{c.className}</div>
              <div className="mt-1 text-xs text-slate-500">{c.courseTitle ?? 'Học phần'} · Tối đa {c.maxStudents} sinh viên</div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>{c.academicYear}</span>
                <span className="font-medium text-indigo-700">Xem chi tiết →</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
export function LecturerClasses() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    clazzService.getMyClasses().then((c) => m && setClasses(c)).finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Lớp phụ trách</PageTitle>
      {classes.length === 0 ? <Empty msg="Chưa có lớp nào" /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {classes.map((c) => (
            <Link key={c.id} to={`/lecturer/classes/${c.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-primary transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-indigo-300 font-mono">{c.classCode}</div>
                  <div className="font-semibold">{c.className}</div>
                  <div className="text-xs text-slate-400 mt-1">{c.semester} · {c.academicYear}</div>
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
// Lecturer quản lý assignments + chấm điểm
const getDefaultDueDate = () => {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now.toISOString().slice(0, 16);
};

export function LecturerAssignments() {
  const [data, setData] = useState<{ clazz: Clazz; assigns: Assignment[] }[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { title: string; description: string; dueDate: string; maxScore: number }>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    (async () => {
      const cs = await clazzService.getMyClasses();
      const rs = await Promise.all(cs.map(async (c) => ({ clazz: c, assigns: await assessmentService.getAssignments(c.id) })));
      if (mounted) setData(rs);
    })().finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const updateDraft = (classId: number, field: keyof (typeof drafts)[number], value: string | number) => {
    setDrafts((prev) => ({
      ...prev,
      [classId]: {
        title: prev[classId]?.title ?? '',
        description: prev[classId]?.description ?? '',
        dueDate: prev[classId]?.dueDate ?? getDefaultDueDate(),
        maxScore: prev[classId]?.maxScore ?? 10,
        [field]: value,
      },
    }));
  };

  const createAssignmentFor = async (classId: number) => {
    const draft = drafts[classId];
    if (!draft?.title.trim()) return;

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      dueDate: new Date(draft.dueDate).toISOString(),
      maxScore: Number(draft.maxScore) || 10,
    };

    await assessmentService.createAssignment(classId, payload);
    setDrafts((prev) => ({ ...prev, [classId]: { title: '', description: '', dueDate: getDefaultDueDate(), maxScore: 10 } }));
    const refreshed = await Promise.all(data.map(async ({ clazz, assigns }) => ({ clazz, assigns: clazz.id === classId ? await assessmentService.getAssignments(clazz.id) : assigns })));
    setData(refreshed);
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Bài tập</PageTitle>
      {data.length === 0 ? <Empty msg="Chưa có lớp nào" /> : data.map(({ clazz, assigns }) => (
        <div key={clazz.id} className="mb-6">
          <h3 className="text-sm text-slate-400 mb-2">{clazz.classCode} — {clazz.className}</h3>
          <Card>
            <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={drafts[clazz.id]?.title ?? ''}
                onChange={(e) => updateDraft(clazz.id, 'title', e.target.value)}
                placeholder="Tên bài tập"
                className="px-2 py-1.5 rounded border border-slate-200 bg-white text-sm"
              />
              <input
                type="datetime-local"
                value={drafts[clazz.id]?.dueDate ?? getDefaultDueDate()}
                onChange={(e) => updateDraft(clazz.id, 'dueDate', e.target.value)}
                className="px-2 py-1.5 rounded border border-slate-200 bg-white text-sm"
              />
              <input
                type="number"
                min={1}
                value={drafts[clazz.id]?.maxScore ?? 10}
                onChange={(e) => updateDraft(clazz.id, 'maxScore', Number(e.target.value) || 10)}
                className="px-2 py-1.5 rounded border border-slate-200 bg-white text-sm"
              />
              <button
                onClick={() => void createAssignmentFor(clazz.id)}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white"
              >
                + Tạo bài tập
              </button>
              <textarea
                value={drafts[clazz.id]?.description ?? ''}
                onChange={(e) => updateDraft(clazz.id, 'description', e.target.value)}
                placeholder="Mô tả bài tập"
                rows={2}
                className="md:col-span-2 xl:col-span-4 px-2 py-1.5 rounded border border-slate-200 bg-white text-sm"
              />
            </div>

            {assigns.length === 0 ? <Empty msg="Chưa có bài tập" /> : (
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-400 border-b border-slate-800">
                  <tr><th className="text-left py-2">Bài</th><th>Hạn</th><th>Điểm tối đa</th><th></th></tr>
                </thead>
                <tbody>
                  {assigns.map((a) => (
                    <tr key={a.id} className="border-b border-slate-800/50">
                      <td className="py-2 font-medium">{a.title}</td>
                      <td className="text-xs text-slate-400">{new Date(a.dueDate).toLocaleDateString('vi-VN')}</td>
                      <td>{a.maxScore}</td>
                      <td className="text-right">
                        <Link to={`/lecturer/grading?assignmentId=${a.id}`} className="text-xs text-indigo-300 hover:underline">Xem bài nộp →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}

// ===== Grading + Attendance (gộp 1 trang) =====
export function LecturerGrading() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [att, setAtt] = useState<AttendanceRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      const cs = await clazzService.getMyClasses();
      if (!m) return;
      setClasses(cs);
      if (cs.length && selectedClass === null) setSelectedClass(cs[0].id);
    })().finally(() => m && setLoading(false));
    return () => { m = false; };
  }, [selectedClass]);

  // Load submissions của lớp
  useEffect(() => {
    if (selectedClass == null) return;
    (async () => {
      const as = await assessmentService.getAssignments(selectedClass);
      const ss = (await Promise.all(as.map((a) => assessmentService.getSubmissions(a.id)))).flat();
      setSubs(ss);
    })();
  }, [selectedClass]);

  // Load attendance
  useEffect(() => {
    if (selectedClass == null) return;
    gradingService.getAttendance(selectedClass, date).then((rs) => {
      setAtt(rs.filter((a) => a.attendanceDate === date));
    });
  }, [selectedClass, date]);

  const gradeRow = async (id: number, score: number, feedback?: string) => {
    await assessmentService.gradeSubmission(id, { score, feedback: feedback?.trim() || undefined });
    const as = await assessmentService.getAssignments(selectedClass!);
    const ss = (await Promise.all(as.map((a) => assessmentService.getSubmissions(a.id)))).flat();
    setSubs(ss);
  };

  const updateAtt = (studentId: number, status: AttendanceRecord['status']) => {
    setAtt((records) => records.map((record) => record.studentId === studentId ? { ...record, status } : record));
  };

  const saveAtt = async () => {
    if (!selectedClass) return;
    await gradingService.submitAttendance(selectedClass, { attendanceDate: date, records: att.map(({ studentId, status }) => ({ studentId, status })) });
    alert('Đã lưu điểm danh');
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Chấm điểm & Điểm danh</PageTitle>
      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm text-slate-400">Lớp:</label>
        <select value={selectedClass ?? ''} onChange={(e) => setSelectedClass(Number(e.target.value))}
          className="bg-white border border-slate-200 rounded px-2 py-1 text-sm">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.classCode} — {c.className}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">📝 Bài nộp cần chấm ({subs.filter(s => s.score == null).length})</h3>
          {subs.length === 0 ? <Empty msg="Chưa có bài nộp" /> : (
            <div className="space-y-2 max-h-125 overflow-auto">
              {subs.map((s) => (
                <div key={s.id} className="border border-slate-800 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{s.studentName ?? `SV #${s.studentId}`}</div>
                      <div className="text-xs text-slate-500">{new Date(s.submittedAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <Pill color={s.score != null ? 'green' : s.isLate ? 'red' : 'amber'}>{s.score != null ? 'DA CHAM' : s.isLate ? 'NOP TRE' : 'CHO CHAM'}</Pill>
                  </div>
                  {((s.fileUrls && s.fileUrls.length > 0) || s.fileUrl) ? (
                    <div className="mt-2 space-y-1">
                      {((s.fileUrls && s.fileUrls.length > 0) ? s.fileUrls : [s.fileUrl]).filter(Boolean).map((url, index) => (
                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block text-sm text-blue-700 underline break-all">
                          Mở file bài nộp {index + 1}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-500">Không có file đính kèm</div>
                  )}
                  {s.score == null ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        <input id={`score-${s.id}`} type="number" defaultValue={8} className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-sm" />
                        <button onClick={() => gradeRow(s.id, Number((document.getElementById(`score-${s.id}`) as HTMLInputElement).value), (document.getElementById(`feedback-${s.id}`) as HTMLTextAreaElement | null)?.value)}
                          className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500">Chấm</button>
                      </div>
                      <textarea id={`feedback-${s.id}`} rows={2} placeholder="Nhận xét" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm" />
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <div className="text-sm">Điểm: <span className="text-emerald-300 font-semibold">{s.score}</span></div>
                      <textarea id={`feedback-${s.id}`} defaultValue={s.feedback ?? ''} rows={2} placeholder="Nhận xét" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm" />
                      <button onClick={() => gradeRow(s.id, Number((document.getElementById(`score-${s.id}`) as HTMLInputElement | null)?.value ?? s.score ?? 0), (document.getElementById(`feedback-${s.id}`) as HTMLTextAreaElement | null)?.value)}
                        className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500">Cập nhật</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">📋 Điểm danh</h3>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-sm" />
          </div>
          {att.length === 0 ? <Empty msg="Chưa có dữ liệu điểm danh ngày này" /> : (
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr><th className="text-left py-2">SV</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {att.map((r) => (
                  <tr key={r.studentId} className="border-b border-slate-800/50">
                    <td className="py-2">{r.studentName}</td>
                    <td>
                      <select value={r.status} onChange={(e) => updateAtt(r.studentId, e.target.value as AttendanceRecord['status'])}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs">
                        <option value="PRESENT">Có mặt</option>
                        <option value="LATE">Đi trễ</option>
                        <option value="ABSENT">Vắng</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button onClick={saveAtt} className="mt-3 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm">Lưu điểm danh</button>
        </Card>
      </div>
    </div>
  );
}
