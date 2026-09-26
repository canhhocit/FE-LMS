import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Clock, PlusCircle, Key, User, BookOpen, AlertTriangle } from 'lucide-react';
import { listLecturers } from '../../services/adminService';
import { getAllClasses } from '../../services/clazzService';
import { PageHeader, StatCard, Card, Button, Input, Select, Badge, Modal, Spinner, Empty } from '../../components/ui';
import type { User as UserType, Clazz } from '../../types';

interface PbacRequest {
  id: number;
  lecturerName: string;
  className: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  validUntil?: string;
  createdAt: string;
  grantedDirectly?: boolean;
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

const generateId = () => Math.floor(Math.random() * 10000000) + 1;

export const AdminPbacApproval: React.FC = () => {
  const [requests, setRequests] = useState<PbacRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [duration, setDuration] = useState('60');
  const [customMinutes, setCustomMinutes] = useState('45');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'>('ALL');

  // Backend Data for Comboboxes
  const [lecturersList, setLecturersList] = useState<UserType[]>([]);
  const [classesList, setClassesList] = useState<Clazz[]>([]);

  // Direct Grant Modal State
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [selectedLecturerId, setSelectedLecturerId] = useState<number | ''>('');
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [directPermType, setDirectPermType] = useState('Sửa điểm Học phần');
  
  // Expiration Time Mode
  const [timeMode, setTimeMode] = useState<'PRESET' | 'EXACT_DATETIME'>('PRESET');
  const [directDuration, setDirectDuration] = useState('60');
  const [directCustomMinutes, setDirectCustomMinutes] = useState('90');
  const [exactDateTime, setExactDateTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [directReason, setDirectReason] = useState('');

  // Fetch Lecturers and Classes when Modal opens
  useEffect(() => {
    if (showDirectModal) {
      listLecturers('', 0, 200)
        .then((res) => {
          const list = res || [];
          setLecturersList(list);
          if (list.length > 0) {
            setSelectedLecturerId(list[0].id);
          }
        })
        .catch(() => {});

      getAllClasses()
        .then((res) => {
          const list = res || [];
          setClassesList(list);
          if (list.length > 0) {
            setSelectedClassId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [showDirectModal]);

  const handleLecturerSelectChange = (lecturerIdNum: number) => {
    setSelectedLecturerId(lecturerIdNum);
    const matching = classesList.filter((c) => c.lecturerId === lecturerIdNum);
    if (matching.length > 0) {
      setSelectedClassId(matching[0].id);
    } else if (classesList.length > 0) {
      setSelectedClassId(classesList[0].id);
    } else {
      setSelectedClassId('');
    }
  };

  const filteredClasses = classesList.filter((c) => {
    if (!selectedLecturerId) return true;
    return c.lecturerId === Number(selectedLecturerId);
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const filteredRequests = statusFilter === 'ALL'
    ? requests
    : requests.filter((r) => r.status === statusFilter);

  const calculateValidTime = (dur: string, customMinStr?: string) => {
    if (dur === 'NEVER') return 'Không hết hạn (Vĩnh viễn)';
    const minutes = dur === 'CUSTOM' ? Number(customMinStr || 60) : Number(dur);
    const targetTime = new Date();
    targetTime.setMinutes(targetTime.getMinutes() + minutes);
    return targetTime.toLocaleString('vi-VN');
  };

  const handleApprove = (id: number, overrideDuration?: string) => {
    const durToUse = overrideDuration || duration;
    const validTime = calculateValidTime(durToUse, customMinutes);

    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'APPROVED', validUntil: validTime } : r)));

    const req = requests.find((r) => r.id === id);
    if (req) {
      const newLog: AuditLog = {
        id: generateId(),
        action: 'PHÊ DUYỆT CẤP QUYỀN PBAC',
        performedBy: req.lecturerName,
        className: req.className,
        targetStudent: 'Lớp học phần',
        oldValue: 'Trạng thái: CHỜ DUYỆT',
        newValue: `Cấp quyền sửa điểm (Thời hạn: ${validTime})`,
        approvedBy: 'Admin Hệ Thống',
        timestamp: new Date().toLocaleString('vi-VN'),
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
  };

  const handleReject = (id: number) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r)));
  };

  const handleRevoke = (id: number) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'REVOKED' } : r)));
  };

  const handleDirectGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedLecturerObj = lecturersList.find((l) => l.id === Number(selectedLecturerId));
    const lecturerNameStr = selectedLecturerObj
      ? `${selectedLecturerObj.fullName} (${selectedLecturerObj.email})`
      : 'Giảng viên hệ thống';

    const selectedClassObj = classesList.find((c) => c.id === Number(selectedClassId));
    const classNameStr = selectedClassObj
      ? `${selectedClassObj.className} (${selectedClassObj.classCode})`
      : 'Lớp học phần';

    const computedValidTime = timeMode === 'EXACT_DATETIME'
      ? new Date(exactDateTime).toLocaleString('vi-VN')
      : calculateValidTime(directDuration, directCustomMinutes);

    const newGrant: PbacRequest = {
      id: generateId(),
      lecturerName: lecturerNameStr,
      className: classNameStr,
      reason: directReason.trim()
        ? `[Admin gán trực tiếp - ${directPermType}] ${directReason.trim()}`
        : `[Admin gán trực tiếp - ${directPermType}]`,
      status: 'APPROVED',
      validUntil: computedValidTime,
      createdAt: new Date().toLocaleString('vi-VN'),
      grantedDirectly: true,
    };

    setRequests([newGrant, ...requests]);

    const newLog: AuditLog = {
      id: generateId(),
      action: 'ADMIN CHỦ ĐỘNG CẤP QUYỀN PBAC',
      performedBy: 'Admin Hệ Thống',
      className: classNameStr,
      targetStudent: lecturerNameStr,
      oldValue: 'Chưa có quyền',
      newValue: `Admin cấp trực tiếp quyền: ${directPermType} (Thời hạn: ${computedValidTime})`,
      approvedBy: 'Admin Hệ Thống',
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    setAuditLogs([newLog, ...auditLogs]);

    setShowDirectModal(false);
    setDirectReason('');
  };

  const getStatusBadge = (status: PbacRequest['status']) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</Badge>;
      case 'APPROVED': return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã cấp quyền</Badge>;
      case 'REJECTED': return <Badge variant="danger">Từ chối</Badge>;
      case 'REVOKED': return <Badge variant="neutral">Đã thu hồi</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Phê duyệt PBAC' }]}
        title="Phê duyệt & Cấp quyền PBAC"
        subtitle="Quản lý phê duyệt yêu cầu cấp quyền và chủ động cấp quyền sửa điểm tạm thời cho Giảng viên"
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowDirectModal(true)}>
            <PlusCircle className="w-4 h-4" /> Cấp quyền trực tiếp
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Chờ duyệt"
          value={`${pendingCount} yêu cầu`}
          icon={<Clock className="w-5 h-5" />}
          trend={pendingCount > 0 ? "Cần xử lý" : "Đã hoàn thành"}
          trendColor={pendingCount > 0 ? "amber" : "emerald"}
          color="amber"
        />
        <StatCard
          label="Tổng yêu cầu"
          value={`${requests.length} yêu cầu`}
          icon={<ShieldCheck className="w-5 h-5" />}
          trend="PBAC Policy"
          trendColor="emerald"
          color="accent"
        />
        <StatCard
          label="Lịch sử Audit"
          value={`${auditLogs.length} ghi nhận`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend="Lưu vết hệ thống"
          trendColor="emerald"
          color="emerald"
        />
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REVOKED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md transition ${statusFilter === st ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                {st === 'ALL' ? 'Tất cả' : st === 'PENDING' ? 'Chờ duyệt' : st === 'APPROVED' ? 'Đã cấp' : st === 'REJECTED' ? 'Từ chối' : 'Thu hồi'}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <Empty msg="Chưa có yêu cầu cấp quyền PBAC nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Giảng viên</th>
                  <th className="py-3.5 px-4">Lớp học phần</th>
                  <th className="py-3.5 px-4">Lý do xin / Cấp quyền</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4">Thời hạn hiệu lực</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{r.lecturerName}</td>
                    <td className="py-3.5 px-4 text-navy-900 dark:text-navy-300 font-mono font-semibold">{r.className}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{r.reason}</td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{r.validUntil || '-'}</td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {r.status === 'PENDING' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleApprove(r.id)}>Duyệt</Button>
                          <Button variant="secondary" size="sm" onClick={() => handleReject(r.id)}>Từ chối</Button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <Button variant="ghost" size="sm" onClick={() => handleRevoke(r.id)}>
                          <span className="text-rose-600">Thu hồi</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Cấp quyền trực tiếp */}
      <Modal
        isOpen={showDirectModal}
        onClose={() => setShowDirectModal(false)}
        title="Gán quyền PBAC Trực tiếp cho Giảng viên"
      >
        <form onSubmit={handleDirectGrantSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Giảng viên được cấp quyền *
            </label>
            <Select
              value={selectedLecturerId}
              onChange={(e) => handleLecturerSelectChange(Number(e.target.value))}
              options={[
                { label: '-- Chọn giảng viên --', value: '' },
                ...lecturersList.map(l => ({ label: `${l.fullName} (${l.email})`, value: String(l.id) }))
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lớp học phần *
            </label>
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              options={[
                { label: '-- Chọn lớp học phần --', value: '' },
                ...filteredClasses.map(c => ({ label: `${c.className} (${c.classCode})`, value: String(c.id) }))
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Loại quyền cấp
            </label>
            <Select
              value={directPermType}
              onChange={(e) => setDirectPermType(e.target.value)}
              options={[
                { label: 'Sửa điểm Học phần (Chấm phúc khảo / Sửa sai sót)', value: 'Sửa điểm Học phần' },
                { label: 'Cập nhật Điểm danh & Chuyên cần', value: 'Cập nhật Điểm danh & Chuyên cần' },
                { label: 'Toàn quyền chỉnh sửa Nội dung & Điểm', value: 'Toàn quyền chỉnh sửa Nội dung & Điểm' },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Thời hạn hết hiệu lực
            </label>
            <Select
              value={directDuration}
              onChange={(e) => setDirectDuration(e.target.value)}
              options={[
                { label: '30 Phút', value: '30' },
                { label: '60 Phút (1 Giờ)', value: '60' },
                { label: '120 Phút (2 Giờ)', value: '120' },
                { label: 'Vĩnh viễn', value: 'NEVER' },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú lý do cấp
            </label>
            <Input
              value={directReason}
              onChange={(e) => setDirectReason(e.target.value)}
              placeholder="VD: Phê duyệt theo đơn xin chỉnh sửa điểm của Khoa"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowDirectModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác nhận Cấp quyền
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPbacApproval;
