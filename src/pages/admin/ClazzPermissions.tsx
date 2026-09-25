import { useEffect, useState } from 'react';
import * as clazzService from '../../services/clazzService';
import * as cpService from '../../services/clazzPermissionService';
import { listLecturers } from '../../services/adminService';
import { PageHeader, Card, Spinner, Empty, ErrorBox, Badge, Button } from '../../components/ui';
import type { Clazz, User } from '../../types';
import { Shield, UserCheck, Key, CheckCircle2, AlertCircle } from 'lucide-react';

interface Lecturer {
  id: number;
  fullName: string;
  email: string;
  lecturerCode?: string;
  faculty?: string;
}

export default function ClazzPermissions() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [allLecturers, setAllLecturers] = useState<Lecturer[]>([]);
  const [selectedLecturer, setSelectedLecturer] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const allPerms = ['MANAGE_CONTENT', 'GRADE_STUDENTS', 'MANAGE_ATTENDANCE', 'VIEW_REPORTS'];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Load all classes & all lecturers on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [classList, lecturerList] = await Promise.all([
          clazzService.getMyClasses(),
          listLecturers('', 0, 500),
        ]);
        if (mounted) {
          setClasses(classList);
          setAllLecturers(lecturerList as Lecturer[]);
          if (classList.length > 0) {
            setSelectedClass(classList[0].id);
          }
          if (lecturerList.length > 0) {
            setSelectedLecturer(lecturerList[0].id);
          }
        }
      } catch (e: unknown) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu phân quyền');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch PBAC permissions whenever selected class or lecturer changes
  useEffect(() => {
    let mounted = true;
    if (!selectedClass || !selectedLecturer) {
      setPermissions([]);
      return;
    }
    (async () => {
      try {
        const perms = await cpService.getClazzPermissions(selectedClass, selectedLecturer);
        if (mounted) setPermissions(perms);
      } catch {
        if (mounted) setPermissions([]);
      }
    })();
    return () => { mounted = false; };
  }, [selectedClass, selectedLecturer]);

  const togglePerm = (code: string) => {
    setPermissions(prev => prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedLecturer) return;
    setSaving(true);
    setMsg(null);
    try {
      await cpService.grantClazzPermissions(selectedClass, selectedLecturer, permissions);
      setMsg('Đã cập nhật phân quyền PBAC cho Giảng viên thành công!');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lưu phân quyền thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedClass || !selectedLecturer) return;
    if (!confirm('Bạn có chắc chắn muốn thu hồi toàn bộ quyền PBAC của giảng viên này trong lớp?')) return;
    try {
      await cpService.revokeClazzPermissions(selectedClass, selectedLecturer);
      setPermissions([]);
      setMsg('Đã thu hồi tất cả quyền trong lớp học.');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Thu hồi thất bại');
    }
  };

  if (loading) return <Spinner />;

  const activeClazz = classes.find(c => c.id === selectedClass);
  const activeLecturer = allLecturers.find(l => l.id === selectedLecturer);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Phân quyền Lớp học (PBAC)' }]}
        title="Phân quyền Giảng viên theo Lớp học (PBAC)"
        subtitle="Cấp quyền quản lý chi tiết (Nội dung bài học, Chấm điểm, Điểm danh, Báo cáo) cho từng Giảng viên trong lớp học phần"
      />

      {err && <ErrorBox msg={err} />}
      {msg && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Select Class & Select Lecturer */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-accent-600" />
              1. Chọn Lớp học phần
            </h3>
            <select
              value={selectedClass ?? ''}
              onChange={e => setSelectedClass(Number(e.target.value))}
              aria-label="Chọn lớp học phần"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-accent-500/20 outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.classCode || c.className} ({c.semester || 'HK1'})
                </option>
              ))}
            </select>
            {activeClazz && (
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>GV Phụ trách chính: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeClazz.lecturerName || 'Chưa gán'}</span></div>
                <div>Sĩ số: <span className="font-semibold">{activeClazz.maxStudents} sinh viên</span></div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-accent-600" />
                2. Chọn Giảng viên
              </h3>
              <Badge color="indigo">{allLecturers.length} GV</Badge>
            </div>
            
            {allLecturers.length === 0 ? (
              <Empty msg="Chưa có giảng viên nào trong hệ thống" />
            ) : (
              <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
                {allLecturers.map(l => {
                  const isSelected = selectedLecturer === l.id;
                  const isPrimary = activeClazz?.lecturerName && (l.fullName.includes(activeClazz.lecturerName) || activeClazz.lecturerName.includes(l.fullName));
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => { setSelectedLecturer(l.id); setMsg(null); }}
                      className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-accent-50 border-accent-300 text-accent-900 dark:bg-accent-950/40 dark:border-accent-800 dark:text-white'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{l.fullName}</span>
                        {isPrimary && <Badge color="green">GV chính</Badge>}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{l.email}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: PBAC Permissions Matrix */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-accent-600" />
                  Quyền PBAC trong lớp: <span className="text-accent-600 dark:text-accent-400">{activeLecturer?.fullName || 'Chưa chọn'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lớp: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeClazz?.classCode} - {activeClazz?.className}</span>
                </p>
              </div>

              {selectedLecturer && permissions.length > 0 && (
                <Button variant="danger" size="sm" onClick={handleRevoke}>
                  Thu hồi tất cả
                </Button>
              )}
            </div>

            {!selectedLecturer ? (
              <Empty msg="Vui lòng chọn một giảng viên ở cột bên trái để quản lý phân quyền" />
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {allPerms.map(code => {
                    const checked = permissions.includes(code);
                    const permDescriptions: Record<string, { title: string; desc: string }> = {
                      MANAGE_CONTENT: { title: 'Quản lý Nội dung Bài học', desc: 'Cho phép tạo, sửa, xóa chương học, bài học, tải video và đính kèm tài liệu' },
                      GRADE_STUDENTS: { title: 'Chấm điểm & Nhập điểm', desc: 'Cho phép chấm bài nộp của sinh viên, nhập điểm giữa kỳ, cuối kỳ và xuất bảng điểm' },
                      MANAGE_ATTENDANCE: { title: 'Quản lý Điểm danh QR', desc: 'Cho phép tạo mã QR điểm danh buổi học và sửa trạng thái vắng/có mặt của sinh viên' },
                      VIEW_REPORTS: { title: 'Xem Báo cáo Analytics', desc: 'Cho phép xem biểu đồ phổ điểm, tỷ lệ chuyên cần và danh sách sinh viên nguy cơ' },
                    };

                    const info = permDescriptions[code] || { title: code, desc: '' };

                    return (
                      <label
                        key={code}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'bg-accent-50/40 border-accent-300 dark:bg-accent-950/30 dark:border-accent-800'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePerm(code)}
                          className="h-4 w-4 mt-0.5 rounded border-slate-300 text-accent-600 focus:ring-accent-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{info.title}</span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {info.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Thay đổi quyền PBAC sẽ có hiệu lực ngay lập tức.
                  </span>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    loading={saving}
                  >
                    Lưu phân quyền PBAC
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
