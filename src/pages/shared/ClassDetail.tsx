import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as contentService from "../../services/contentService";
import * as assessmentService from "../../services/assessmentService";
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from "../../components/Layout";
import type { Clazz, User, Chapter, Announcement, Assignment } from "../../types";

export default function ClassDetail() {
  const { id } = useParams();
  const cid = Number(id);
  const [clazz, setClazz] = useState<Clazz | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [c, st, ch, an, as] = await Promise.all([
          clazzService.getClazzDetail(cid),
          clazzService.getClassStudents(cid),
          contentService.getChapters(cid),
          contentService.getAnnouncements(cid),
          assessmentService.getAssignments(cid),
        ]);
        if (!mounted) return;
        setClazz(c); setStudents(st); setChapters(ch); setAnns(an); setAssigns(as);
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (mounted) setErr(err?.message ?? "Loi tai du lieu");
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [cid]);

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  if (!clazz) return <Empty msg="Khong tim thay lop" />;


  return (
    <div>
      <PageTitle>{clazz.classCode} - {clazz.className}</PageTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card><div className="text-xs text-slate-400">Giang vien</div><div className="font-medium">{clazz.lecturerName ?? "-"}</div></Card>
        <Card><div className="text-xs text-slate-400">Sĩ số tối đa</div><div className="font-medium">{clazz.maxStudents} SV</div></Card>
        <Card><div className="text-xs text-slate-500">Học kỳ</div><div><Pill color="indigo">{clazz.semester} · {clazz.academicYear}</Pill></div></Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Chuong trinh hoc</h3>
          {chapters.length === 0 ? <Empty msg="Chua co chuong nao" /> : (
            <ol className="space-y-2">
              {chapters.map((c: Chapter) => (
                <li key={c.id} className="border border-slate-800 rounded-lg p-3">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-slate-500">Chuong #{c.orderIndex}</div>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-3">Thong bao</h3>
            {anns.length === 0 ? <Empty msg="Chua co thong bao" /> : (
              <ul className="space-y-2 text-sm">
                {anns.map((a: Announcement) => (
                  <li key={a.id} className="border-l-2 border-indigo-500 pl-2">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-slate-400 line-clamp-2">{a.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">Bai tap</h3>
            {assigns.length === 0 ? <Empty msg="Chua co bai tap" /> : (
              <ul className="space-y-2 text-sm">
                {assigns.map((a: Assignment) => (
                  <li key={a.id} className="flex justify-between border-b border-slate-800 pb-1">
                    <Link to="assignments" className="hover:underline">{a.title}</Link>
                    <span className="text-xs text-slate-400">{a.maxScore}d</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <h3 className="font-semibold mt-6 mb-2">Sinh vien ({students.length})</h3>
      {students.length === 0 ? <Empty msg="Lop chua co sinh vien" /> : (
        <Card>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr><th className="text-left py-2">#</th><th className="text-left">Ho ten</th><th className="text-left">Email</th></tr>
            </thead>
            <tbody>
              {students.map((s: User, i: number) => (
                <tr key={s.id} className="border-b border-slate-800/50">
                  <td className="py-2 text-slate-500">{i + 1}</td>
                  <td>{s.fullName}</td>
                  <td className="text-slate-400">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
