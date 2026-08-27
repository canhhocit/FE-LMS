// Admin pages
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as chatService from '../../services/chatService';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import type { Clazz, User, DashboardStats } from '../../types';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    chatService.getDashboardStats().then((s) => m && setStats(s)).finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  if (!stats) return null;
  const items: { label: string; val: number; color: string }[] = [
    { label: 'Người dùng',     val: stats.totalUsers,       color: 'text-indigo-300' },
    { label: 'Lớp học',        val: stats.totalClasses,     color: 'text-emerald-300' },
    { label: 'Đăng ký học',    val: stats.totalEnrollments, color: 'text-amber-300' },
    { label: 'Bài tập',        val: stats.totalAssignments, color: 'text-rose-300' },
    { label: 'Bài đã nộp',     val: stats.totalSubmissions, color: 'text-cyan-300' },
  ];
  return (
    <div>
      <PageTitle>Dashboard quản trị</PageTitle>
      <div className="grid md:grid-cols-5 gap-4">
        {items.map((i) => (
          <Card key={i.label}>
            <div className="text-xs text-slate-400">{i.label}</div>
            <div className={`text-3xl font-bold ${i.color}`}>{i.val}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [tab, setTab] = useState<'STUDENT' | 'LECTURER'>('STUDENT');
  const [kw, setKw] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    const p = tab === 'STUDENT' ? chatService.listStudents(kw) : chatService.listLecturers(kw);
    p.then(setUsers).finally(() => setLoading(false));
  };
  useEffect(load, [tab, kw]);
  return (
    <div>
      <PageTitle>Người dùng</PageTitle>
      <div className="flex gap-2 mb-3">
        {(['STUDENT', 'LECTURER'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-sm ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
            {t === 'STUDENT' ? 'Sinh viên' : 'Giảng viên'}
          </button>
        ))}
        <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tìm theo tên/email…"
          className="ml-auto px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm" />
      </div>
      <Card>
        {loading ? <Spinner /> : users.length === 0 ? <Empty msg="Không có kết quả" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr><th className="text-left py-2">#</th><th>Họ tên</th><th>Email</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-slate-800/50">
                  <td className="py-2 text-slate-500">{i + 1}</td>
                  <td>{u.fullName}</td>
                  <td className="text-slate-400">{u.email}</td>
                  <td><Pill color={u.active !== false ? 'green' : 'red'}>{u.active !== false ? 'Active' : 'Inactive'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function AdminClasses() {
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
      <PageTitle>Tất cả lớp học</PageTitle>
      <Card>
        {classes.length === 0 ? <Empty msg="Chưa có lớp nào" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr>
                <th className="text-left py-2">Mã</th><th className="text-left">Tên lớp</th><th>Giảng viên</th><th>SV</th><th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/50">
                  <td className="py-2 font-mono text-indigo-300">{c.code}</td>
                  <td><Link to={`/admin/classes/${c.id}`} className="hover:underline">{c.name}</Link></td>
                  <td className="text-slate-400">{c.lecturerName}</td>
                  <td className="text-center">{c.studentCount ?? 0}</td>
                  <td><Pill color={c.status === 'ACTIVE' ? 'green' : c.status === 'CLOSED' ? 'slate' : 'amber'}>{c.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}