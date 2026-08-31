import { NoEntryIcon } from '../components/icons';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <NoEntryIcon className="w-16 h-16 text-rose-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">403</h1>
        <h2 className="mb-3 text-xl font-semibold">Bạn không có quyền truy cập</h2>
        <p className="mb-6 text-sm text-slate-600">
          Trang này yêu cầu vai trò khác với tài khoản hiện tại. Vui lòng quay lại trang chính.
        </p>
        <a href="/" className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
