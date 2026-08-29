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
      setErr((e as { message?: string })?.message ?? "Đăng nhập thất bại");
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

          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Tài khoản
              </span>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
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
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                placeholder="Nhập mật khẩu"
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#00376f] focus:ring-4 focus:ring-blue-900/10"
              />
            </label>
            {err && (
              <div
                role="alert"
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

          <div className="my-8 border-y border-slate-200">
            <button
              type="button"
              onClick={() => setShowDemoAccounts((visible) => !visible)}
              aria-expanded={showDemoAccounts}
              className="flex w-full items-center gap-3 py-4 text-left text-sm text-[#365b85] transition hover:text-[#00376f]"
            >
              <span
                className={`text-lg leading-none transition-transform ${showDemoAccounts ? "rotate-180" : ""}`}
              >🔻</span>
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
