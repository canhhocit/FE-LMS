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
  const [requests, setRequests] = useState<PbacRequest[]>([
    {
      id: 101,
      lecturerName: 'TS. Nguyễn Văn A',
      className: 'Lập trình Flutter (62PM1_L01)',
      reason: 'Nhập nhầm điểm thành phần cột giữa kỳ cho 2 sinh viên',
      status: 'PENDING',
      createdAt: '2026-09-18 18:30:00',
    },
    {
      id: 102,
      lecturerName: 'PGS.TS Trần Thị B',
      className: 'Công nghệ phần mềm (62PM1_L02)',
      reason: 'Cập nhật điểm minh chứng chuyên cần bổ sung',
      status: 'APPROVED',
      validUntil: '2026-09-18 20:00:00',
      createdAt: '2026-09-18 17:15:00',
    },
  ]);

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: 1,
      action: 'SỬA ĐIỂM GIỮA KỲ',
      performedBy: 'TS. Nguyễn Văn A',
      className: 'Lập trình Flutter (62PM1_L01)',
      targetStudent: 'SV Nguyễn Văn Nam (MSV: 20210001)',
      oldValue: 'Cột Giữa Kỳ: 6.5',
      newValue: 'Cột Giữa Kỳ: 8.5',
      approvedBy: 'Admin Hệ Thống',
      timestamp: '2026-09-18 17:45:12',
    },
    {
      id: 2,
      action: 'CẤP QUYỀN PBAC SỬA ĐIỂM',
      performedBy: 'TS. Nguyễn Văn A',
      className: 'Lập trình Flutter (62PM1_L01)',
      targetStudent: 'Toàn bộ Lớp L01',
      oldValue: 'Trạng thái: KHÓA ĐIỂM',
      newValue: 'Cấp quyền sửa điểm (Thời hạn 60 phút)',
      approvedBy: 'Admin Hệ Thống',
      timestamp: '2026-09-18 17:15:00',
    },
  ]);

  const [duration, setDuration] = useState('60');

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
              {requests.map((r) => (
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
