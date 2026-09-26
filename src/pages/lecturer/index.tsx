// Lecturer pages
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone, CheckCircle2, XCircle, ClipboardList, CalendarCheck2,
  Save, ArrowRight
} from 'lucide-react';
import * as clazzService from '../../services/clazzService';
import * as assessmentService from '../../services/assessmentService';
import * as gradingService from '../../services/gradingService';
import { useAuth } from '../../contexts/useAuth';
import { PageHeader, Card, StatCard, Spinner, Empty, Badge, Button, Table, Input, Textarea, Select, Toast } from '../../components/ui';
import type { Clazz, Assignment, Submission, AttendanceRecord } from '../../types';

export function LecturerDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    clazzService.getMyClasses().then(setClasses);
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
  const recentActivity = subs.slice(0, 4).map((item) => ({
    title: `Bài nộp mới · SV #${item.studentId}`,
    detail: item.score == null ? 'Chờ chấm điểm' : 'Đã chấm điểm',
    time: new Date(item.submittedAt).toLocaleDateString('vi-VN'),
  }));

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Xin chào, ${user?.fullName || 'Giảng viên'}`}
        subtitle="Tổng quan lớp giảng dạy, bài nộp của sinh viên và hoạt động gần đây"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lớp phụ trách" value={classes.length} color="accent" />
        <StatCard label="Tổng bài nộp" value={subs.length} color="sky" />
        <StatCard label="Đã chấm điểm" value={gradedCount} color="emerald" />
        <StatCard label="Chờ chấm điểm" value={pendingCount} color="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-accent-600 dark:text-accent-400" />
              Hoạt động nộp bài gần đây
            </h3>
            <Badge color="indigo">Mới cập nhật</Badge>
          </div>

          {recentActivity.length === 0 ? (
            <Empty msg="Chưa có bài nộp nào gần đây" />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.detail}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{item.time}</span>
                    <Link to="/lecturer/grading">
                      <Button variant="ghost" size="sm">Chấm điểm <ArrowRight className="w-3 h-3" /></Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Lớp giảng dạy</h3>
            <Link to="/lecturer/classes" className="text-xs font-semibold text-accent-600 hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-2.5">
            {classes.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/lecturer/classes/${c.id}`}>
                <div className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-accent-500/50 transition cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-accent-600 dark:text-accent-400">{c.classCode}</span>
                    <Badge color="indigo">{c.semester}</Badge>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{c.className}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{c.courseTitle ?? 'Học phần'}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
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
    <div className="space-y-6">
      <PageHeader
        title="Lớp phụ trách giảng dạy"
        subtitle="Danh sách các lớp học phần được phân công giảng dạy trong học kỳ"
      />

      {classes.length === 0 ? (
        <Empty msg="Chưa có lớp nào được phân công" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => (
            <Link key={c.id} to={`/lecturer/classes/${c.id}`}>
              <Card className="hover:border-accent-500/50 cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-accent-600 dark:text-accent-400">{c.classCode}</span>
                    <Badge color="indigo">{c.semester}</Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{c.className}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {c.courseTitle ?? 'Học phần'} · Tối đa {c.maxStudents} sinh viên
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>{c.academicYear}</span>
                  <span className="font-semibold text-accent-600 dark:text-accent-400">Xem chi tiết lớp →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Bài tập"
        subtitle="Tạo mới bài tập và theo dõi bài làm của sinh viên theo từng lớp học phần"
      />

      {data.length === 0 ? (
        <Empty msg="Chưa có lớp học phần nào" />
      ) : (
        data.map(({ clazz, assigns }) => (
          <Card key={clazz.id}>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {clazz.classCode} — {clazz.className}
              </h3>
              <Badge color="indigo">{assigns.length} bài tập</Badge>
            </div>

            {/* Create Assignment Form */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 mb-5 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Tạo bài tập mới</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Tên bài tập"
                  placeholder="Ví dụ: Bài tập tuần 3"
                  value={drafts[clazz.id]?.title ?? ''}
                  onChange={(e) => updateDraft(clazz.id, 'title', e.target.value)}
                />
                <Input
                  type="datetime-local"
                  label="Hạn nộp"
                  value={drafts[clazz.id]?.dueDate ?? getDefaultDueDate()}
                  onChange={(e) => updateDraft(clazz.id, 'dueDate', e.target.value)}
                />
                <Input
                  type="number"
                  label="Thang điểm tối đa"
                  min={1}
                  value={drafts[clazz.id]?.maxScore ?? 10}
                  onChange={(e) => updateDraft(clazz.id, 'maxScore', Number(e.target.value) || 10)}
                />
              </div>
              <Textarea
                label="Mô tả bài tập / Hướng dẫn"
                rows={2}
                placeholder="Nhập nội dung hướng dẫn làm bài..."
                value={drafts[clazz.id]?.description ?? ''}
                onChange={(e) => updateDraft(clazz.id, 'description', e.target.value)}
              />
              <div className="flex justify-end pt-1">
                <Button onClick={() => void createAssignmentFor(clazz.id)} disabled={!drafts[clazz.id]?.title?.trim()}>
                  + Tạo bài tập
                </Button>
              </div>
            </div>

            {assigns.length === 0 ? (
              <Empty msg="Chưa có bài tập nào trong lớp này" />
            ) : (
              <Table headers={['Tên bài tập', 'Hạn nộp', 'Điểm tối đa', 'Thao tác']}>
                {assigns.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs">{a.title}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-xs">{a.maxScore}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/lecturer/grading?assignmentId=${a.id}`}>
                        <Button variant="ghost" size="sm">Xem bài nộp →</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

export function LecturerGrading() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [att, setAtt] = useState<AttendanceRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

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

  useEffect(() => {
    if (selectedClass == null) return;
    (async () => {
      const as = await assessmentService.getAssignments(selectedClass);
      const ss = (await Promise.all(as.map((a) => assessmentService.getSubmissions(a.id)))).flat();
      setSubs(ss);
    })();
  }, [selectedClass]);

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
    alert('Đã lưu điểm danh thành công!');
  };

  const handlePublishGrades = async () => {
    if (!selectedClass) return;
    if (!window.confirm('Công bố điểm sẽ gửi thông báo đến tất cả sinh viên và không thể thu hồi. Bạn có chắc chắn?')) return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      await gradingService.publishGrades(selectedClass);
      setPublishMsg('Đã công bố điểm thành công! Sinh viên đã nhận thông báo.');
    } catch (e: unknown) {
      setPublishMsg((e as { message?: string })?.message ?? 'Công bố điểm thất bại');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chấm điểm & Điểm danh"
        subtitle="Quản lý điểm bài tập, điểm danh theo buổi học và công bố điểm cho sinh viên"
        actions={
          <Button onClick={handlePublishGrades} loading={publishing} disabled={!selectedClass}>
            <Megaphone className="w-3.5 h-3.5" />
            <span>Công bố điểm</span>
          </Button>
        }
      />

      {publishMsg && <Toast message={publishMsg} type="info" onClose={() => setPublishMsg(null)} />}

      <div className="max-w-md">
        <Select
          label="Chọn lớp học phần"
          value={selectedClass ?? ''}
          onChange={(e) => setSelectedClass(Number(e.target.value))}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.classCode} — {c.className}</option>
          ))}
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Submissions Grading */}
        <Card>
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-accent-600" />
              Bài nộp cần chấm ({subs.filter(s => s.score == null).length})
            </h3>
          </div>

          {subs.length === 0 ? (
            <Empty msg="Chưa có bài nộp nào" />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {subs.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{s.studentName ?? `SV #${s.studentId}`}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{new Date(s.submittedAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <Badge color={s.score != null ? 'emerald' : s.isLate ? 'red' : 'amber'}>
                      {s.score != null ? 'Đã chấm' : s.isLate ? 'Nộp trễ' : 'Chờ chấm'}
                    </Badge>
                  </div>

                  {((s.fileUrls && s.fileUrls.length > 0) || s.fileUrl) && (
                    <div className="space-y-1">
                      {((s.fileUrls && s.fileUrls.length > 0) ? s.fileUrls : [s.fileUrl]).filter(Boolean).map((url, idx) => (
                        <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-accent-600 hover:underline truncate">
                          Mở file đính kèm {idx + 1} →
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <div className="flex gap-2">
                      <input
                        id={`score-${s.id}`}
                        type="number"
                        defaultValue={s.score ?? 8}
                        className="w-20 px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg outline-none"
                        placeholder="Điểm"
                      />
                      <Button
                        size="sm"
                        onClick={() => gradeRow(s.id, Number((document.getElementById(`score-${s.id}`) as HTMLInputElement).value), (document.getElementById(`feedback-${s.id}`) as HTMLTextAreaElement | null)?.value)}
                      >
                        Lưu điểm
                      </Button>
                    </div>
                    <textarea
                      id={`feedback-${s.id}`}
                      defaultValue={s.feedback ?? ''}
                      rows={2}
                      placeholder="Nhập lời nhận xét..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Attendance */}
        <Card>
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-accent-600" />
              Điểm danh theo buổi
            </h3>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg outline-none"
            />
          </div>

          {att.length === 0 ? (
            <Empty msg="Chưa có dữ liệu điểm danh cho ngày này" />
          ) : (
            <div className="space-y-4">
              <Table headers={['Sinh viên', 'Trạng thái điểm danh']}>
                {att.map((r) => (
                  <tr key={r.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 text-xs">{r.studentName}</td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={r.status}
                        onChange={(e) => updateAtt(r.studentId, e.target.value as AttendanceRecord['status'])}
                        className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg outline-none"
                      >
                        <option value="PRESENT">Có mặt</option>
                        <option value="LATE">Đi trễ</option>
                        <option value="ABSENT">Vắng mặt</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </Table>

              <div className="flex justify-end">
                <Button onClick={saveAtt}>Lưu điểm danh</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
