import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import * as authService from '../services/authService';

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
      setMessage({ type: 'error', text: 'Token không hợp lệ' });
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    // Password validation: min 8 chars, uppercase, lowercase, digit, special char
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#243b78] via-[#2d5aa0] to-[#1a2654] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#f58220] text-2xl">✦</div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Đặt lại mật khẩu</h1>
          <p className="text-sm text-center text-slate-600 mb-6">
            Nhập mật khẩu mới để tiếp tục
          </p>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                Ví dụ: Password@123 (chứa chữ hoa, chữ thường, số, ký tự đặc biệt)
              </p>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Quay lại{' '}
              <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
