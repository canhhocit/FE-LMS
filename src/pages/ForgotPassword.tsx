import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await authService.forgotPassword(email.trim());
      setMessage({
        type: 'success',
        text: 'Đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra inbox.',
      });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: (err as { message?: string })?.message ?? 'Yêu cầu thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#243b78] via-[#2d5aa0] to-[#1a2654] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#f58220] text-2xl">✦</div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Quên mật khẩu</h1>
          <p className="text-sm text-center text-slate-600 mb-6">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
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
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
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
