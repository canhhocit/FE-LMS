// Login — mock 3 role sẵn
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

const DEMO: { label: string; identifier: string }[] = [
  { label: 'Sinh viên',  identifier: 'student@lms.vn' },
  { label: 'Giảng viên', identifier: 'lecturer@lms.vn' },
  { label: 'Admin',      identifier: 'admin@lms.vn' },
];

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [id, setId] = useState('student@lms.vn');
  const [pw, setPw] = useState('123456');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await login(id, pw);
      const to = loc.state?.from;
      const u = JSON.parse(localStorage.getItem('lms_auth') || '{}');
      nav(to && to !== '/login' ? to : `/${u.role?.toLowerCase() ?? 'student'}`, { replace: true });
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Đăng nhập thất bại');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl">🎓</div>
          <h1 className="text-2xl font-bold mt-2">LearningHub</h1>
          <p className="text-sm text-slate-400">Đăng nhập để tiếp tục</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-slate-400">Tài khoản (email)</span>
            <input value={id} onChange={(e) => setId(e.target.value)} required
              className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring focus:ring-indigo-500/40" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Mật khẩu</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required
              className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring focus:ring-indigo-500/40" />
          </label>
          {err && <div className="text-sm text-rose-300 bg-rose-900/30 border border-rose-700/50 rounded p-2">{err}</div>}
          <button disabled={busy}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-medium">
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-2">Demo nhanh (mật khẩu: 123456):</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO.map((d) => (
              <button key={d.identifier} type="button"
                onClick={() => { setId(d.identifier); setPw('123456'); }}
                className="text-xs px-2 py-2 rounded bg-slate-800 hover:bg-slate-700">
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}