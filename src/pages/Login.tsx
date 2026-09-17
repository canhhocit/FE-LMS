import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

const DEMO_ACCOUNTS = [
  {
    role: "Quản trị viên",
    detail: "Toàn quyền hệ thống",
    identifier: "admin@learninghub.edu.vn",
    tone: "bg-blue-100 text-blue-800",
  },
  {
    role: "Giảng viên",
    detail: "Quản lý lớp học và chấm điểm",
    identifier: "gv.nguyenvana@learninghub.edu.vn",
    tone: "bg-emerald-100 text-emerald-800",
  },
  {
    role: "Sinh viên",
    detail: "Học tập và theo dõi tiến độ",
    identifier: "sv20240001@student.edu.vn",
    tone: "bg-amber-100 text-amber-800",
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src="/slide_main.jpg"
          alt="Sinh viên tung mũ tốt nghiệp"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,35,73,0.18),rgba(0,20,45,0.84))]" />
        <div className="relative flex min-h-screen flex-col justify-between p-12 text-white xl:p-16">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-extrabold text-[#00376f] shadow-lg">
              LH
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">
                LearningHub
              </div>
              <div className="text-xs text-blue-100">Nền tảng học tập số</div>
            </div>
          </div>
          <div className="max-w-xl pb-4">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
              Learn. Connect. Grow.
            </p>
            <h1 className="text-5xl font-bold leading-[1.08] xl:text-6xl">
              Mở cánh cửa đến hành trình của bạn.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-50/90">
              Một không gian tập trung cho lớp học, tiến độ và những bước tiến
              mới mỗi ngày.
            </p>
          </div>
          <div className="text-xs text-blue-100/75">
            LearningHub · Hệ thống quản lý học tập
          </div>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5 py-10 sm:px-8">
        <div className="w-full max-w-125">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-[#00376f] text-xl font-extrabold text-white">
              LH
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#00376f]">
              LearningHub
            </p>
          </div>
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-[#00376f]">
              Chào mừng trở lại
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Đăng nhập vào tài khoản
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Tiếp tục hành trình học tập của bạn.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5" noValidate>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Tài khoản
              </span>
              <input
                id="identifier"
                name="identifier"
                autoComplete="username"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                aria-invalid={Boolean(err)}
                aria-describedby={err ? 'login-error' : undefined}
                placeholder="Nhập email tài khoản"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#00376f] focus:ring-4 focus:ring-blue-900/10"
              />
            </label>
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Mật khẩu
                </span>
                <Link to="/forgot-password" className="text-xs text-[#00376f] hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  aria-invalid={Boolean(err)}
                  aria-describedby={err ? 'login-error' : undefined}
                  placeholder="Nhập mật khẩu"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-4 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#00376f] focus:ring-4 focus:ring-blue-900/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                  title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </label>
            {err && (
              <div
                id="login-error"
                role="alert"
                aria-live="assertive"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-xl bg-[#00376f] font-semibold text-white shadow-lg shadow-blue-950/15 transition hover:bg-[#002b57] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
          <div className="relative my-4 flex items-center justify-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div><span className="relative bg-[#f7f9fc] px-3 text-xs uppercase text-slate-400">hoặc</span></div>
          <button
            type="button"
            onClick={async () => {
              const email = window.prompt("Nhập địa chỉ Email Google của bạn (liên kết với tài khoản hệ thống):");
              if (!email) return;
              setBusy(true);
              setErr(null);
              try {
                const res = await import("../services/authService").then(m => m.googleLogin(email));
                localStorage.setItem("user", JSON.stringify(res));
                window.location.href = `/${res.role.toLowerCase()}`;
              } catch (e: unknown) {
                setErr((e as { message?: string })?.message ?? "Không tìm thấy tài khoản Google liên kết với hệ thống.");
              } finally {
                setBusy(false);
              }
            }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            <span>Đăng nhập bằng Google</span>
          </button>
          <a href="http://localhost:8080/oauth2/authorization/azure" className="mt-2 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"><svg className="h-5 w-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg><span>Đăng nhập với Microsoft 365</span></a>

          <div className="my-8 border-y border-slate-200">
            <button
              type="button"
              onClick={() => setShowDemoAccounts((visible) => !visible)}
              aria-expanded={showDemoAccounts}
              className="flex w-full items-center gap-3 py-4 text-left text-sm text-[#365b85] transition hover:text-[#00376f]"
            >
              <svg
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showDemoAccounts ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-medium">Tài khoản Demo</span>
            </button>
            {showDemoAccounts && (
              <div className="space-y-3 pb-4">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    type="button"
                    key={account.identifier}
                    onClick={() => {
                      setId(account.identifier);
                      setPw("password");
                      setErr(null);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${account.tone}`}
                    >
                      {account.role.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">
                        {account.role}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {account.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#00376f]">
                      Dùng thử
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-center text-xs text-slate-400">
            Demo UI & backend
          </p>
        </div>
      </main>
    </div>
  );
}
