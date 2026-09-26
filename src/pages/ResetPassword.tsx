import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import * as authService from '../services/authService';
import { Button, Input, Card } from '../components/ui';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage({ type: 'error', text: 'Token liên kết không hợp lệ' });
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(newPassword)) {
      setMessage({
        type: 'error',
        text: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await authService.resetPassword(token, newPassword);
      setMessage({
        type: 'success',
        text: 'Mật khẩu đã được đặt lại thành công. Đang chuyển hướng đến đăng nhập...',
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: (err as { message?: string })?.message ?? 'Đặt lại mật khẩu thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-md">
          <div className="flex justify-center mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-900 text-xl font-bold text-white shadow-xs">
              LH
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-1">
            Đặt lại mật khẩu
          </h1>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-6">
            Nhập mật khẩu mới an toàn cho tài khoản của bạn.
          </p>

          {message && (
            <div
              className={`mb-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu mới
              </label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu từ 8 ký tự trở lên"
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-navy-700 dark:text-navy-300 hover:underline font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
