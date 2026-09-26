import React, { useState } from 'react';
import { Key, Send } from 'lucide-react';
import { PageHeader, Card, Button, Select, Textarea, Table, Badge, Toast } from '../../components/ui';

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
  const [requests, setRequests] = useState<RequestItem[]>([]);
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
      setMsg('Đã gửi yêu cầu cấp quyền PBAC tới Quản trị viên!');
      setTimeout(() => setMsg(''), 4000);
    }, 600);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge color="emerald">Đã duyệt</Badge>;
      case 'PENDING':
        return <Badge color="amber">Đang chờ</Badge>;
      case 'REJECTED':
        return <Badge color="red">Từ chối</Badge>;
      case 'EXPIRED':
        return <Badge color="slate">Hết hạn</Badge>;
      default:
        return <Badge color="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Key className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            Yêu cầu Cấp quyền Sửa điểm (PBAC)
          </span>
        }
        subtitle="Gửi yêu cầu mở khóa tạm thời quyền chỉnh sửa điểm học phần tới Ban quản trị"
      />

      {msg && <Toast message={msg} type="success" onClose={() => setMsg('')} />}

      <Card>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Tạo Yêu cầu Cấp quyền mới</h3>
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Chọn Lớp học phần"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="1">Lớp Lập trình Flutter - 62PM1_L01</option>
              <option value="2">Lớp Công nghệ phần mềm - 62PM1_L02</option>
            </Select>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Loại quyền xin cấp</label>
              <input
                type="text"
                disabled
                value="Chỉnh sửa Điểm thành phần Học phần (PBAC)"
                className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
              />
            </div>
          </div>

          <Textarea
            label="Lý do xin cấp quyền (*)"
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mô tả lý do xin cấp quyền (ví dụ: cập nhật minh chứng điểm danh, bổ sung cột điểm thi lại...)"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} disabled={!reason.trim()}>
              <Send className="w-3.5 h-3.5" /> Gửi Yêu cầu
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Lịch sử Yêu cầu đã gửi</h3>
        {requests.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Chưa có yêu cầu nào được gửi</div>
        ) : (
          <Table headers={['Mã YC', 'Lớp học phần', 'Lý do', 'Trạng thái', 'Thời hạn', 'Ngày tạo']}>
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-mono font-bold text-accent-600 text-xs">#{r.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs">{r.className}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate">{r.reason}</td>
                <td className="px-4 py-3 text-center">{renderStatusBadge(r.status)}</td>
                <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{r.validUntil || 'Chưa duyệt'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{r.createdAt}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
};

export default PermissionRequestsPage;
