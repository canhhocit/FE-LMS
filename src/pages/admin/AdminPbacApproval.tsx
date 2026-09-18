import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Ban, History, User, BookOpen } from 'lucide-react';

interface PbacRequest {
  id: number;
  lecturerName: string;
  className: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  validUntil?: string;
  createdAt: string;
}

interface AuditLog {
  id: number;
  action: string;
  performedBy: string;
  className: string;
  targetStudent: string;
  oldValue: string;
  newValue: string;
  approvedBy: string;
  timestamp: string;
}

export const AdminPbacApproval: React.FC = () => {
  const [requests, setRequests] = useState<PbacRequest[]>([]);
  const [auditLogs] = useState<AuditLog[]>([]);

  const [duration, setDuration] = useState('60');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'>('ALL');

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const filteredRequests = statusFilter === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  const handleApprove = (id: number) => {
    const targetTime = new Date();
    targetTime.setMinutes(targetTime.getMinutes() + Number(duration));
    const validTime = targetTime.toLocaleString();
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'APPROVED', validUntil: validTime } : r));
  };

  const handleReject = (id: number) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
  };

  const handleRevoke = (id: number) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'REVOKED' } : r));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Phê duyệt Cấp quyền PBAC & Nhật ký Lịch sử (Audit Logs)
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Cấp quyền sửa điểm tạm thời cho Giảng viên có giới hạn thời gian & giám sát lịch sử thay đổi
          </p>
        </div>
      </div>

      {/* Requests Approval Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Danh sách Yêu cầu Cấp quyền mở khóa Điểm
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Thời hạn cấp mặc định:</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="30">30 Phút</option>
              <option value="60">60 Phút (1 Giờ)</option>
              <option value="120">120 Phút (2 Giờ)</option>
              <option value="1440">24 Giờ (1 Ngày)</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Tất cả ({requests.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Chờ duyệt
            {pendingCount > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" /> Từ chối
          </button>
          <button
            onClick={() => setStatusFilter('REVOKED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'REVOKED'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Ban className="w-3.5 h-3.5" /> Đã thu hồi
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                <th className="py-3 px-4">Mã YC</th>
                <th className="py-3 px-4">Giảng viên</th>
                <th className="py-3 px-4">Lớp học phần</th>
                <th className="py-3 px-4">Lý do</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thời hạn</th>
                <th className="py-3 px-4 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">#{r.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {r.lecturerName}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-indigo-400" /> {r.className}</span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{r.reason}</td>
                  <td className="py-3.5 px-4">
                    {r.status === 'PENDING' && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Chờ duyệt</span>}
                    {r.status === 'APPROVED' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Đã cấp quyền</span>}
                    {r.status === 'REJECTED' && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">Từ chối</span>}
                    {r.status === 'REVOKED' && <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">Thu hồi</span>}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-gray-500">{r.validUntil || 'Chưa cấp'}</td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="inline-flex items-center gap-1 bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-500 transition shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Phê duyệt ({duration}m)
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          className="inline-flex items-center gap-1 bg-rose-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-rose-500 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </>
                    )}
                    {r.status === 'APPROVED' && (
                      <button
                        onClick={() => handleRevoke(r.id)}
                        className="inline-flex items-center gap-1 bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-gray-600 transition"
                      >
                        <Ban className="w-3.5 h-3.5" /> Thu hồi quyền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Section (Item 8) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-purple-500" />
          Nhật ký Lịch sử Thay đổi Điểm & Cấp quyền (Audit Trail Log)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                <th className="py-3 px-4">Mã Log</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Đối tượng tác động</th>
                <th className="py-3 px-4">Giá trị cũ ➔ Giá trị mới</th>
                <th className="py-3 px-4">Người phê duyệt</th>
                <th className="py-3 px-4">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-600">#LOG-{log.id}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">{log.performedBy}</td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{log.targetStudent} ({log.className})</td>
                  <td className="py-3.5 px-4 text-xs font-mono">
                    <span className="text-rose-600 dark:text-rose-400">{log.oldValue}</span> ➔ <span className="text-emerald-600 dark:text-emerald-400">{log.newValue}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-gray-700 dark:text-gray-300">{log.approvedBy}</td>
                  <td className="py-3.5 px-4 text-xs text-gray-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPbacApproval;
