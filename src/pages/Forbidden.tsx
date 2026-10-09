import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button, Card } from '../components/ui';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-white font-sans">
      <Card className="max-w-md w-full p-8 text-center border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="mb-4 flex justify-center">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-12 h-12" />
          </div>
        </div>
        <h1 className="mb-1 text-4xl font-extrabold text-navy-900 dark:text-navy-300">403</h1>
        <h2 className="mb-2 text-lg font-bold">Không có quyền truy cập</h2>
        <p className="mb-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Trang bạn đang truy cập yêu cầu quyền hạn đặc biệt khác với tài khoản của bạn. Vui lòng quay lại trang chủ.
        </p>
        <Link to="/">
          <Button variant="primary" size="md">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay về Trang chủ
          </Button>
        </Link>
      </Card>
    </div>
  );
}
