import React, { useState } from 'react';
import { Key, Send, Clock, CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';

interface RequestItem {
  id: number;
  classId: number;
  className: string;
  permissionType: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  validUntil?: string;
  createdAt: string;
}

export const PermissionRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: 101,
      classId: 1,
      className: 'Lớp Lập trình Flutter - 62PM1_L01',
      permissionType: 'Sửa điểm Học phần (Lớp L01)',
      reason: 'Nhập nhầm điểm thành phần cột giữa kỳ cho 2 sinh viên',
      status: 'APPROVED',
      validUntil: '2026-09-18 20:00:00',
      createdAt: '2026-09-18 18:30:00',
    },
    {
      id: 102,
      classId: 2,
      className: 'Lớp Công nghệ phần mềm - 62PM1_L02',
      permissionType: 'Sửa điểm Chuyên cần',
      reason: 'Cập nhật sinh viên có giấy xin phép vắng mặt bổ sung',
      status: 'PENDING',
      createdAt: '2026-09-18 18:45:00',
    },
  ]);

  const [classId, setClassId] = useState('1');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newItem: RequestItem = {
        id: Date.now(),
        classId: Number(classId),
        className: classId === '1' ? 'Lớp Lập trình Flutter - 62PM1_L01' : 'Lớp Công nghệ phần mềm - 62PM1_L02',
        permissionType: 'Sửa điểm Học phần',
        reason,
        status: 'PENDING',
        createdAt: new Date().toLocaleString(),
      };
      setRequests([newItem, ...requests]);
      setReason('');
      setIsSubmitting(false);
      setMsg('✅ Đã gửi yêu cầu cấp quyền PBAC lên Admin phê duyệt!');
      setTimeout(() => setMsg(''), 4000);
    }, 600);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt (Có hiệu lực)</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200"><Clock className="w-3.5 h-3.5" /> Đang chờ duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 px-2.5 py-1 rounded-full border border-rose-200"><XCircle className="w-3.5 h-3.5" /> Từ chối</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200"><AlertCircle className="w-3.5 h-3.5" /> Đã hết hạn</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-7 h-7" />
            Yêu cầu Cấp quyền Sửa điểm (PBAC)
          </h1>
          <p className="text-amber-100 text-sm mt-1">
            Gửi yêu cầu mở khóa quyền chỉnh sửa điểm học phần đã khóa có thời hạn tới Admin
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
          {msg}
        </div>
      )}

      {/* Form Request */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          Tạo Yêu cầu Cấp quyền mới
        </h2>
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chọn Lớp học phần</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="1">Lớp Lập trình Flutter - 62PM1_L01</option>
                <option value="2">Lớp Công nghệ phần mềm - 62PM1_L02</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Loại quyền xin cấp</label>
              <input
                type="text"
                disabled
                value="Chỉnh sửa Điểm thành phần Học phần (PBAC)"
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Lý do xin cấp quyền chỉnh sửa điểm (*)</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả rõ lý do cần chỉnh sửa (ví dụ: nhập nhầm cột điểm thành phần, bổ sung điểm minh chứng...)"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md hover:brightness-110 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Cấp Quyền'}
          </button>
        </form>
      </div>

      {/* Table My Requests */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Lịch sử Yêu cầu đã gửi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                <th className="py-3 px-4">Mã YC</th>
                <th className="py-3 px-4">Lớp học phần</th>
                <th className="py-3 px-4">Lý do</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thời hạn hiệu lực</th>
                <th className="py-3 px-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600">#{r.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">{r.className}</td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{r.reason}</td>
                  <td className="py-3.5 px-4">{renderStatusBadge(r.status)}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-gray-500">{r.validUntil || 'Chưa duyệt'}</td>
                  <td className="py-3.5 px-4 text-xs text-gray-400">{r.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PermissionRequestsPage;
