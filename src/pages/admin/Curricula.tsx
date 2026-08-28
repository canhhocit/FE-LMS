// Admin Curricula & Courses page
import { useEffect, useState } from 'react';
import * as curriculumService from '../../services/curriculumService';
import { PageTitle, Card, Spinner, Empty, ErrorBox } from '../../components/Layout';
import type { Curriculum, Course } from '../../types';

export default function AdminCurricula() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let m = true;
    Promise.all([curriculumService.getCurricula(), curriculumService.getAllCourses()])
      .then(([cu, co]) => m && (setCurricula(cu), setCourses(co)))
      .catch((e) => m && setErr((e as { message?: string })?.message ?? 'Lỗi'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  return (
    <div>
      <PageTitle>Chương trình đào tạo & Môn học</PageTitle>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold mb-3">Chương trình đào tạo</h3>
          {curricula.length === 0 ? <Empty msg="Chưa có CTĐT" /> : (
            <ul className="space-y-2 text-sm">
              {curricula.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setSelected(c)}
                    className={`w-full text-left p-2 rounded ${selected?.id === c.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.faculty ?? '-'} · {c.academicYear ?? '-'}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Danh sách môn học ({courses.length})</h3>
          {courses.length === 0 ? <Empty msg="Chưa có môn học" /> : (
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr><th className="text-left py-2">Mã</th><th className="text-left">Tên môn</th><th>Tín chỉ</th><th>Tiên quyết</th></tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/50">
                    <td className="py-2 font-mono text-indigo-300">{c.code}</td>
                    <td>{c.title}</td>
                    <td className="text-center">{c.credit}</td>
                    <td>
                      <span className="text-slate-500">-</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
