import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Ban, History, User, BookOpen, PlusCircle, Calendar, Key, X, AlertTriangle, Send } from 'lucide-react';
import { listLecturers } from '../../services/adminService';
import { getMyClasses } from '../../services/clazzService';
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
  
  // Expiration Time Mode (Preset duration vs Exact Date+Time Picker)
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
            const firstLecId = list[0].id;
            setSelectedLecturerId(firstLecId);
          }
        })
        .catch(() => {});

      getMyClasses()
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

  // Filter Classes taught by the selected Lecturer
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

    // Get selected lecturer details
    const selectedLecturerObj = lecturersList.find((l) => l.id === Number(selectedLecturerId));
    const lecturerNameStr = selectedLecturerObj
      ? `${selectedLecturerObj.fullName} (${selectedLecturerObj.email})`
      : 'Giảng viên hệ thống';

    // Get selected class details
    const selectedClassObj = classesList.find((c) => c.id === Number(selectedClassId));
    const classNameStr = selectedClassObj
      ? `${selectedClassObj.className} (${selectedClassObj.classCode})`
      : 'Lớp học phần';

    // Calculate Expiry Time
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header & Main Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Phê duyệt & Cấp quyền PBAC
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý phê duyệt từ yêu cầu và chủ động cấp quyền sửa điểm tạm thời cho Giảng viên
          </p>
        </div>
        <button
          onClick={() => setShowDirectModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-sm"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Cấp quyền
        </button>
      </div>

      {/* Direct Grant Modal */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-500" />
                Gán quyền PBAC Trực tiếp cho Giảng viên
              </h3>
              <button
                onClick={() => setShowDirectModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectGrantSubmit} className="space-y-4 text-sm">
              {/* Combobox 1: Giảng viên */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" /> Giảng viên được cấp quyền *
                </label>
                <select
                  value={selectedLecturerId}
                  onChange={(e) => handleLecturerSelectChange(Number(e.target.value))}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {lecturersList.length === 0 ? (
                    <option value="">-- Đang tải danh sách Giảng viên... --</option>
                  ) : (
                    lecturersList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.fullName} ({l.email}) {l.lecturerCode ? `- MSGV: ${l.lecturerCode}` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Combobox 2: Lớp học phần (Tự động load theo Giảng viên) */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5 justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Lớp học phần *
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    (Tự động lọc theo Giảng viên)
                  </span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {filteredClasses.length === 0 ? (
                    classesList.length === 0 ? (
                      <option value="">-- Đang tải danh sách Lớp học phần... --</option>
                    ) : (
                      classesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.className} ({c.classCode}) {c.lecturerName ? `- GV: ${c.lecturerName}` : ''}
                        </option>
                      ))
                    )
                  ) : (
                    filteredClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className} ({c.classCode}) - Học kỳ {c.semester}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Loại quyền PBAC
                </label>
                <select
                  value={directPermType}
                  onChange={(e) => setDirectPermType(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white font-medium outline-none cursor-pointer"
                >
                  <option value="Sửa điểm Học phần">Sửa điểm Học phần (Lớp học phần)</option>
                  <option value="Sửa điểm Chuyên cần">Sửa điểm Chuyên cần & Điểm danh</option>
                  <option value="Nhập điểm Thi bổ sung">Nhập điểm Thi bổ sung / Miễn giảm</option>
                  <option value="Mở lại bài nộp bài tập">Cấp quyền Mở lại nộp bài tập</option>
                </select>
              </div>

              {/* Set Time Mode: Presets vs Exact Date + Time Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-500" /> Thiết lập Thời gian hết hạn *
                  </label>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTimeMode('PRESET')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition ${
                        timeMode === 'PRESET'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Khoảng thời gian
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeMode('EXACT_DATETIME')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition ${
                        timeMode === 'EXACT_DATETIME'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Chọn Ngày + Giờ cụ thể
                    </button>
                  </div>
                </div>

                {timeMode === 'PRESET' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={directDuration}
                      onChange={(e) => setDirectDuration(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="30">30 Phút</option>
                      <option value="60">60 Phút (1 Giờ)</option>
                      <option value="120">120 Phút (2 Giờ)</option>
                      <option value="240">4 Giờ</option>
                      <option value="1440">24 Giờ (1 Ngày)</option>
                      <option value="4320">3 Ngày (72 Giờ)</option>
                      <option value="10080">7 Ngày (1 Tuần)</option>
                      <option value="NEVER">Vĩnh viễn (Không hết hạn)</option>
                      <option value="CUSTOM">Tùy chỉnh số phút...</option>
                    </select>

                    {directDuration === 'CUSTOM' && (
                      <input
                        type="number"
                        min="1"
                        placeholder="Số phút"
                        value={directCustomMinutes}
                        onChange={(e) => setDirectCustomMinutes(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="datetime-local"
                      required
                      value={exactDateTime}
                      onChange={(e) => setExactDateTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Chọn ngày và giờ chính xác đến từng phút quyền sẽ tự động hết hạn.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Ghi chú lý do cấp (Admin)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi rõ nguyên do Admin chủ động gán quyền..."
                  value={directReason}
                  onChange={(e) => setDirectReason(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white font-medium outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowDirectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Cấp quyền ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests Approval Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Danh sách Yêu cầu & Quyền đã Cấp
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Thời hạn khi duyệt:</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="30">30 Phút</option>
              <option value="60">60 Phút (1 Giờ)</option>
              <option value="120">120 Phút (2 Giờ)</option>
              <option value="240">4 Giờ</option>
              <option value="1440">24 Giờ (1 Ngày)</option>
              <option value="4320">3 Ngày (72 Giờ)</option>
              <option value="NEVER">Vĩnh viễn (Không hết hạn)</option>
              <option value="CUSTOM">Tùy chỉnh phút...</option>
            </select>
            {duration === 'CUSTOM' && (
              <input
                type="number"
                min="1"
                placeholder="Số phút"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-20 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1 text-xs font-bold text-gray-900 dark:text-white outline-none"
              />
            )}
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
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt / Gán trực tiếp
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
                <th className="py-3 px-4">Lý do / Loại gán</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thời hạn hết hạn</th>
                <th className="py-3 px-4 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400 font-medium">
                    Chưa có dữ liệu cấp quyền PBAC nào trong bộ lọc này
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">#{r.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {r.lecturerName}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> {r.className}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {r.grantedDirectly && (
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1">
                          Admin Gán Trực Tiếp
                        </span>
                      )}
                      {r.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.status === 'PENDING' && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          Chờ duyệt
                        </span>
                      )}
                      {r.status === 'APPROVED' && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Đã cấp quyền
                        </span>
                      )}
                      {r.status === 'REJECTED' && (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          Từ chối
                        </span>
                      )}
                      {r.status === 'REVOKED' && (
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                          Thu hồi
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-500 font-semibold">{r.validUntil || 'Chưa cấp'}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="inline-flex items-center gap-1 bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-500 transition shadow cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt (
                            {duration === 'CUSTOM'
                              ? `${customMinutes}m`
                              : duration === 'NEVER'
                              ? 'Vĩnh viễn'
                              : `${duration}m`}
                            )
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="inline-flex items-center gap-1 bg-rose-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-rose-500 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => handleRevoke(r.id)}
                          className="inline-flex items-center gap-1 bg-gray-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-gray-600 transition cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" /> Thu hồi quyền
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Section */}
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
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400 font-medium">
                    Chưa có nhật ký ghi nhận hành động nào
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Academic Warning Management Section (>10 Credits Debt Threshold) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Quản lý & Theo dõi Cảnh báo Học vụ (Nợ &gt; 10 Tín chỉ)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tự động phát hiện Sinh viên nợ tín chỉ vượt ngưỡng quy định hệ thống (mặc định &gt; 10 tín chỉ) để phát thông báo Cảnh báo Học vụ Lần 1.
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold rounded-xl border border-rose-200 dark:border-rose-800 shrink-0">
            Ngưỡng Cảnh báo: &gt; 10 Tín chỉ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                <th className="py-3 px-4">Mã Sinh viên</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp hành chính</th>
                <th className="py-3 px-4">Số Tín chỉ Nợ</th>
                <th className="py-3 px-4">Mức Cảnh báo</th>
                <th className="py-3 px-4 text-right">Phát thông báo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {[
                { id: 1, code: '74DCTT22099', name: 'Phạm Hữu Cảnh', adminClass: '74DCTT24', debt: 12, level: 'Cảnh báo Lần 1' },
                { id: 2, code: '74DCTT22105', name: 'Nguyễn Văn An', adminClass: '74DCTT24', debt: 14, level: 'Cảnh báo Lần 1' },
                { id: 3, code: '74DCTT22188', name: 'Trần Thị Mai', adminClass: '74DCTT25', debt: 11, level: 'Cảnh báo Lần 1' },
              ].map((s) => (
                <tr key={s.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-600">{s.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">{s.name}</td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{s.adminClass}</td>
                  <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">{s.debt} / 10 Tín chỉ</td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 rounded-full border border-rose-200">
                      {s.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Đã gửi Giấy Cảnh báo Học vụ Lần 1 đến Sinh viên ${s.name} (${s.code}) và GVCN lớp ${s.adminClass}!`)}
                      className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Gửi Thông báo Cảnh báo
                    </button>
                  </td>
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
