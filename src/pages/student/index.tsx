// Student pages
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as assessmentService from "../../services/assessmentService";
import * as gradingService from "../../services/gradingService";
import * as chatService from "../../services/chatService";
import { PageTitle, Card, Spinner, Empty, Pill } from "../../components/Layout";
import { useAuth } from "../../contexts/useAuth";
import type { Clazz, Assignment, Submission, Grade, Message } from "../../types";

export function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    Promise.all([clazzService.getMyClasses(), assessmentService.getMySubmissions()])
      .then(([c, s]) => { if (m) { setClasses(c); setSubs(s); } })
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Chao {user?.fullName}</PageTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card><div className="text-xs text-slate-400">Lop dang hoc</div><div className="text-2xl font-bold">{classes.length}</div></Card>
        <Card><div className="text-xs text-slate-400">Bai da nop</div><div className="text-2xl font-bold">{subs.length}</div></Card>
        <Card><div className="text-xs text-slate-400">Da cham</div><div className="text-2xl font-bold text-emerald-300">{subs.filter((s: Submission) => s.status === "GRADED").length}</div></Card>
      </div>
      <h3 className="font-semibold mb-2">Lop cua toi</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {classes.map((c: Clazz) => (
          <Link key={c.id} to={`/student/classes/${c.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-indigo-500/50 transition">
            <div className="text-xs text-indigo-300 font-mono">{c.code}</div>
            <div className="font-semibold">{c.name}</div>
            <div className="text-xs text-slate-400 mt-1">{c.lecturerName} - {c.studentCount} SV</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StudentClasses() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    clazzService.getMyClasses().then((c: Clazz[]) => m && setClasses(c)).finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Lop hoc cua toi</PageTitle>
      {classes.length === 0 ? <Empty msg="Ban chua co lop nao" /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {classes.map((c: Clazz) => (
            <Link key={c.id} to={`/student/classes/${c.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-indigo-500/50 transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-indigo-300 font-mono">{c.code}</div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{c.lecturerName}</div>
                </div>
                <Pill color={c.status === "ACTIVE" ? "green" : "slate"}>{c.status}</Pill>
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
                <td className="text-center">{sub ? <Pill color={sub.status === "GRADED" ? "green" : "amber"}>{sub.status}</Pill> : <Pill color="slate">CHUA NOP</Pill>}</td>
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
        try { await assessmentService.submitAssignment(assignmentId, { content: c }); window.location.reload(); }
        finally { setBusy(false); }
      }}
      className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">
      {busy ? "..." : "Nop"}
    </button>
  );
}

export function StudentGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    gradingService.getMyGrades().then((g: Grade[]) => m && setGrades(g)).finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  const avg = grades.length ? (grades.reduce((a: number, b: Grade) => a + b.score, 0) / grades.length).toFixed(2) : "-";
  return (
    <div>
      <PageTitle>Diem cua toi</PageTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card><div className="text-xs text-slate-400">Diem TB</div><div className="text-3xl font-bold text-emerald-300">{avg}</div></Card>
        <Card><div className="text-xs text-slate-400">So cot diem</div><div className="text-3xl font-bold">{grades.length}</div></Card>
        <Card><div className="text-xs text-slate-400">Cao nhat</div><div className="text-3xl font-bold">{grades.length ? Math.max(...grades.map((g: Grade) => g.score)) : "-"}</div></Card>
      </div>
      <Card>
        {grades.length === 0 ? <Empty msg="Chua co diem" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr><th className="text-left py-2">Loai</th><th>Diem</th><th>Ghi chu</th></tr>
            </thead>
            <tbody>
              {grades.map((g: Grade) => (
                <tr key={g.id} className="border-b border-slate-800/50">
                  <td className="py-2"><Pill color="indigo">{g.gradeType}</Pill></td>
                  <td className="text-center font-semibold">{g.score}</td>
                  <td className="text-slate-400">{g.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function StudentChat() {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const OTHER = 2;
  const load = () => chatService.getMessages(OTHER).then(setMsgs);
  useEffect(() => { load(); }, []);
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { await chatService.sendMessage({ receiverId: OTHER, content: text }); setText(""); load(); }
    finally { setBusy(false); }
  };
  const me = Number(JSON.parse(localStorage.getItem("lms_auth") || "{}").id ?? 3);
  return (
    <div>
      <PageTitle>Tin nhan voi giang vien</PageTitle>
      <Card className="flex flex-col">
        <div className="flex-1 min-h-[300px] max-h-[500px] overflow-auto space-y-2 mb-3">
          {msgs.length === 0 ? <Empty msg="Chua co tin nhan" /> : msgs.map((m: Message) => (
            <div key={m.id} className={`flex ${m.senderId === me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.senderId === me ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-100"}`}>
                <div>{m.content}</div>
                <div className="text-[10px] opacity-70 mt-1">{new Date(m.sentAt).toLocaleString("vi-VN")}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Nhap tin nhan..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg" />
          <button onClick={send} disabled={busy} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50">Gui</button>
        </div>
      </Card>
    </div>
  );
}
