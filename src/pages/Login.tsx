import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await login(id, pw);
      const to = loc.state?.from;
      nav(to && to !== '/login' ? to : '/', { replace: true });
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Đăng nhập thất bại');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="text-4xl">🎓</div>
          <h1 className="text-2xl font-bold mt-2">LearningHub</h1>
          <p className="text-sm text-slate-600">Đăng nhập để tiếp tục</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-slate-700">Tài khoản</span>
            <input value={id} onChange={(e) => setId(e.target.value)} required
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-500/40" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-700">Mật khẩu</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-500/40" />
              </label>
              {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">{err}</div>}
          <button disabled={busy}
            className="w-full py-2 rounded-lg bg-[#00376f] text-white hover:bg-[#002b57] disabled:opacity-50 font-medium">
            {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}