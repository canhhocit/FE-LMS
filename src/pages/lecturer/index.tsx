// Lecturer pages
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as assessmentService from '../../services/assessmentService';
import * as gradingService from '../../services/gradingService';
import * as chatService from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import type { Clazz, Assignment, Submission, Attendance, AttendanceRecord } from '../../types';

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
        <Card><div className="text-xs text-slate-400">Đã chấm</div><div className="text-2xl font-bold text-emerald-300">{subs.filter(s => s.status === 'GRADED').length}</div></Card>
        <Card><div className="text-xs text-slate-400">Chờ chấm</div><div className="text-2xl font-bold text-amber-300">{subs.filter(s => s.status === 'SUBMITTED').length}</div></Card>
      </div>
      <h3 className="font-semibold mb-2">Lớp của tôi</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {classes.map((c) => (
          <Link key={c.id} to={`/lecturer/classes/${c.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-indigo-500/50 transition">
            <div className="text-xs text-indigo-300 font-mono">{c.code}</div>
            <div className="font-semibold">{c.name}</div>
            <div className="text-xs text-slate-400 mt-1">{c.studentCount ?? 0} SV · {c.status}</div>
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
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-indigo-500/50 transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-indigo-300 font-mono">{c.code}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{c.startDate} → {c.endDate}</div>
                </div>
                <Pill color={c.status === 'ACTIVE' ? 'green' : c.status === 'CLOSED' ? 'slate' : 'amber'}>{c.status}</Pill>
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
  const load = () => {
    setLoading(true);
    (async () => {
      const cs = await clazzService.getMyClasses();
      const rs = await Promise.all(cs.map(async (c) => ({ clazz: c, assigns: await assessmentService.getAssignments(c.id) })));
      setData(rs);
    })().finally(() => setLoading(false));
  };
  useEffect(load, []);
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Bài tập</PageTitle>
      {data.length === 0 ? <Empty msg="Chưa có lớp nào" /> : data.map(({ clazz, assigns }) => (
        <div key={clazz.id} className="mb-6">
          <h3 className="text-sm text-slate-400 mb-2">{clazz.code} — {clazz.name}</h3>
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
  const [att, setAtt] = useState<Attendance | null>(null);
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
      setAtt(rs.find((a) => a.date === date) ?? { classId: selectedClass, date, records: [] });
    });
  }, [selectedClass, date]);

  const gradeRow = async (id: number, score: number) => {
    await assessmentService.gradeSubmission(id, { score });
    const as = await assessmentService.getAssignments(selectedClass!);
    const ss = (await Promise.all(as.map((a) => assessmentService.getSubmissions(a.id)))).flat();
    setSubs(ss);
  };

  const updateAtt = (studentId: number, status: AttendanceRecord['status']) => {
    if (!att) return;
    const records = [...att.records];
    const idx = records.findIndex((r) => r.studentId === studentId);
    if (idx >= 0) records[idx] = { ...records[idx], status };
    else records.push({ studentId, status });
    setAtt({ ...att, records });
  };

  const saveAtt = async () => {
    if (!att) return;
    await gradingService.submitAttendance(att.classId, { date: att.date, records: att.records });
    alert('Đã lưu điểm danh');
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Chấm điểm & Điểm danh</PageTitle>
      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm text-slate-400">Lớp:</label>
        <select value={selectedClass ?? ''} onChange={(e) => setSelectedClass(Number(e.target.value))}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">📝 Bài nộp cần chấm ({subs.filter(s => s.status !== 'GRADED').length})</h3>
          {subs.length === 0 ? <Empty msg="Chưa có bài nộp" /> : (
            <div className="space-y-2 max-h-[500px] overflow-auto">
              {subs.map((s) => (
                <div key={s.id} className="border border-slate-800 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{s.studentName ?? `SV #${s.studentId}`}</div>
                      <div className="text-xs text-slate-500">{new Date(s.submittedAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <Pill color={s.status === 'GRADED' ? 'green' : 'amber'}>{s.status}</Pill>
                  </div>
                  <pre className="bg-slate-950/60 rounded p-2 text-xs my-2 whitespace-pre-wrap">{s.content}</pre>
                  {s.status !== 'GRADED' ? (
                    <div className="flex gap-2">
                      <input id={`score-${s.id}`} type="number" defaultValue={8} className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm" />
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
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm" />
          </div>
          {!att || att.records.length === 0 ? <Empty msg="Chưa có dữ liệu điểm danh ngày này" /> : (
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr><th className="text-left py-2">SV</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {att.records.map((r) => (
                  <tr key={r.studentId} className="border-b border-slate-800/50">
                    <td className="py-2">{r.studentName ?? `#${r.studentId}`}</td>
                    <td>
                      <select value={r.status} onChange={(e) => updateAtt(r.studentId, e.target.value as AttendanceRecord['status'])}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs">
                        <option value="PRESENT">Có mặt</option>
                        <option value="LATE">Đi trễ</option>
                        <option value="ABSENT">Vắng</option>
                        <option value="EXCUSED">Phép</option>
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

export function LecturerChat() {
  const [msgs, setMsgs] = useState<import('../../types').Message[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const OTHER = 3; // mock chat với student
  const load = () => chatService.getMessages(OTHER).then(setMsgs);
  useEffect(() => { load(); }, []);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await chatService.sendMessage({ receiverId: OTHER, content: text }); setText(''); load(); }
    finally { setBusy(false); }
  };
  const me = Number(JSON.parse(localStorage.getItem('lms_auth') || '{}').id ?? 2);
  return (
    <div>
      <PageTitle>Tin nhắn với sinh viên</PageTitle>
      <Card className="flex flex-col">
        <div className="flex-1 min-h-[300px] max-h-[500px] overflow-auto space-y-2 mb-3">
          {msgs.length === 0 ? <Empty msg="Chưa có tin nhắn" /> : msgs.map((m) => (
            <div key={m.id} className={`flex ${m.senderId === me ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.senderId === me ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                <div>{m.content}</div>
                <div className="text-[10px] opacity-70 mt-1">{new Date(m.sentAt).toLocaleString('vi-VN')}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Nhập tin nhắn…" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg" />
          <button onClick={send} disabled={busy} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">Gửi</button>
        </div>
      </Card>
    </div>
  );
}