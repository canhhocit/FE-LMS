import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { Eye, EyeOff, GraduationCap, Lock, Mail, ChevronDown, Sparkles } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "Quản trị viên",
    detail: "Toàn quyền hệ thống",
    identifier: "admin@learninghub.edu.vn",
    color: "primary",
  },
  {
    role: "Giảng viên",
    detail: "Quản lý lớp học và chấm điểm",
    identifier: "gv.nguyenvana@learninghub.edu.vn",
    color: "emerald",
  },
  {
    role: "Sinh viên",
    detail: "Học tập và theo dõi tiến độ",
    identifier: "sv20240001@student.edu.vn",
    color: "amber",
  },
];

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  if (user) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(id, pw);
      const to = loc.state?.from;
      nav(to && to !== "/login" ? to : "/", { replace: true });
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Tên đăng nhập hoặc mật khẩu không chính xác.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await import("../services/authService").then(m => m.googleLogin(googleEmailInput.trim()));
      localStorage.setItem("user", JSON.stringify(res));
      window.location.href = `/${res.role.toLowerCase()}`;
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Đăng nhập Google thất bại.");
      setShowGoogleModal(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr] dark:bg-slate-950">
      {/* Hero Side */}
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src="/slide_main.jpg"
          alt="Sinh viên tung mũ tốt nghiệp"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/40 via-primary-900/80 to-primary-950/95" />
        <div className="relative flex min-h-screen flex-col justify-between p-12 text-white xl:p-16">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-black text-primary-600 shadow-card">
              LH
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">LearningHub</div>
              <div className="text-xs text-primary-200">Nền tảng học tập số</div>
            </div>
          </div>
          <div className="max-w-xl pb-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Learn. Connect. Grow.
            </p>
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Mở cánh cửa đến hành trình tri thức của bạn.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              Một không gian tập trung cho lớp học, tiến độ và những bước tiến mới mỗi ngày.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            LearningHub · Hệ thống Quản lý Học tập
          </div>
        </div>
      </section>

      {/* Form Side */}
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="mb-6 lg:hidden">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary-600 text-xl font-extrabold text-white">
              LH
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              LearningHub
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
              Chào mừng trở lại
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Đăng nhập tài khoản
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tiếp tục hành trình học tập của bạn.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tài khoản / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="identifier"
                  name="identifier"
                  autoComplete="username"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  placeholder="Nhập email tài khoản"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <Link to="/forgot-password" className="text-xs text-accent-600 dark:text-accent-400 hover:underline font-medium">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 pl-10 pr-10 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition"
                  title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {err && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-xl bg-primary-600 hover:bg-primary-700 font-semibold text-white shadow-card transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-sm"
            >
              {busy ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative bg-slate-50 dark:bg-slate-950 px-3 text-xs uppercase text-slate-400">
              hoặc
            </span>
          </div>

          {/* Social Sign-in Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Đăng nhập với Google
            </button>

            <a
              href="http://localhost:8080/oauth2/authorization/azure"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Đăng nhập bằng Microsoft 365 (SSO)
            </a>
          </div>

          {/* Demo Accounts Collapsible */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Tài khoản thử nghiệm nhanh
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDemoAccounts ? 'rotate-180' : ''}`} />
            </button>

            {showDemoAccounts && (
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.identifier}
                    type="button"
                    onClick={() => {
                      setId(acc.identifier);
                      setPw("123456");
                    }}
                    className="flex w-full items-center justify-between p-2 rounded-lg text-left text-xs bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{acc.role}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{acc.identifier}</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      Chọn
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Google Email Input Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Đăng nhập bằng Google</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nhập địa chỉ Email Google liên kết với tài khoản hệ thống của bạn:
            </p>
            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                placeholder="vi-du@student.edu.vn"
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent-500/20"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white cursor-pointer"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
