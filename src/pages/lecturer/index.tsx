// Lecturer pages
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as assessmentService from '../../services/assessmentService';
import * as gradingService from '../../services/gradingService';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
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
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Xin chào, {user?.fullName} 👨‍🏫</PageTitle>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card><div className="text-xs text-slate-400">Lớp phụ trách</div><div className="text-2xl font-bold">{classes.length}</div></Card>
        <Card><div className="text-xs text-slate-400">Bài tập</div><div className="text-2xl font-bold">{subs.length}</div></Card>
        <Card><div className="text-xs text-slate-400">Đã chấm</div><div className="text-2xl font-bold text-emerald-300">{subs.filter(s => s.score != null).length}</div></Card>
        <Card><div className="text-xs text-slate-400">Chờ chấm</div><div className="text-2xl font-bold text-amber-300">{subs.filter(s => s.score == null).length}</div></Card>
      </div>
      <h3 className="font-semibold mb-2">Lớp của tôi</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {classes.map((c) => (
          <Link key={c.id} to={`/lecturer/classes/${c.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-primary transition">
            <div className="text-xs text-indigo-300 font-mono">{c.classCode}</div>
            <div className="font-semibold">{c.className}</div>
            <div className="text-xs text-slate-400 mt-1">Học kỳ {c.semester} · tối đa {c.maxStudents} SV</div>
          </Link>
        ))}
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
export function LecturerAssignments() {
  const [data, setData] = useState<{ clazz: Clazz; assigns: Assignment[] }[]>([]);
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
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Bài tập</PageTitle>
      {data.length === 0 ? <Empty msg="Chưa có lớp nào" /> : data.map(({ clazz, assigns }) => (
        <div key={clazz.id} className="mb-6">
          <h3 className="text-sm text-slate-400 mb-2">{clazz.classCode} — {clazz.className}</h3>
          <Card>
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

  const gradeRow = async (id: number, score: number) => {
    await assessmentService.gradeSubmission(id, { score });
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
            <div className="space-y-2 max-h-[500px] overflow-auto">
              {subs.map((s) => (
                <div key={s.id} className="border border-slate-800 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{s.studentName ?? `SV #${s.studentId}`}</div>
                      <div className="text-xs text-slate-500">{new Date(s.submittedAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <Pill color={s.score != null ? 'green' : s.isLate ? 'red' : 'amber'}>{s.score != null ? 'DA CHAM' : s.isLate ? 'NOP TRE' : 'CHO CHAM'}</Pill>
                  </div>
                  <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Mở file bài nộp</a>
                  {s.score == null ? (
                    <div className="flex gap-2">
                      <input id={`score-${s.id}`} type="number" defaultValue={8} className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-sm" />
                      <button onClick={() => gradeRow(s.id, Number((document.getElementById(`score-${s.id}`) as HTMLInputElement).value))}
                        className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500">Chấm</button>
                    </div>
                  ) : (
                    <div className="text-sm">Điểm: <span className="text-emerald-300 font-semibold">{s.score}</span></div>
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
