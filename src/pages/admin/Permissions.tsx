import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, Check, Search, Trash2, Save, AlertCircle, RotateCcw } from 'lucide-react';
import * as permissionService from '../../services/permissionService';
import { deleteUser } from '../../services/userService';
import { PageHeader, Card, Spinner, Badge, Button, Input, Modal, ErrorBox } from '../../components/ui';
import type { User } from '../../types';
import type { PermissionInfo } from '../../services/permissionService';

const ROLE_TEMPLATES = [
  {
    name: 'Quản lý Đào tạo & Lớp học',
    desc: 'Quản lý chương trình đào tạo, môn học, lớp học phần và lớp hành chính',
    perms: ['MANAGE_CURRICULUM', 'MANAGE_USERS'],
  },
  {
    name: 'Quản lý Học phí & Tài chính',
    desc: 'Thiết lập định mức học phí, phát hành và kiểm tra hóa đơn học phí',
    perms: ['MANAGE_TUITION', 'VIEW_REPORTS'],
  },
  {
    name: 'Quản lý Đăng ký Học phần',
    desc: 'Mở/đóng các đợt đăng ký tín chỉ và thiết lập danh sách môn mở',
    perms: ['MANAGE_REGISTRATION', 'MANAGE_CURRICULUM'],
  },
  {
    name: 'Cán bộ Phê duyệt PBAC & Điểm',
    desc: 'Phê duyệt yêu cầu chỉnh sửa điểm và quy định chính sách điểm',
    perms: ['MANAGE_GRADING_POLICY', 'VIEW_REPORTS'],
  },
  {
    name: 'Quản trị viên Hệ thống (Full Admin)',
    desc: 'Có toàn quyền quản lý mọi phân hệ và cấu hình hệ thống',
    perms: ['MANAGE_USERS', 'MANAGE_CURRICULUM', 'MANAGE_TUITION', 'MANAGE_GRADING_POLICY', 'VIEW_REPORTS', 'MANAGE_REGISTRATION', 'SYSTEM_CONFIG'],
  },
];

export default function Permissions() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionInfo[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [initialPermissions, setInitialPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchKw, setSearchKw] = useState('');

  // Create Admin Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123456@');
  const [newSelectedPerms, setNewSelectedPerms] = useState<string[]>(['MANAGE_CURRICULUM', 'MANAGE_USERS']);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [adminsData, permsData] = await Promise.all([
        permissionService.getAdmins(),
        permissionService.getAllPermissions(),
      ]);
      setAdmins(adminsData);
      setAllPermissions(permsData);
      if (adminsData.length > 0 && !selectedAdmin) {
        setSelectedAdmin(adminsData[0]);
      }
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Không thể tải dữ liệu phân quyền' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedAdmin) return;
    let m = true;
    permissionService.getUserPermissions(selectedAdmin.id)
      .then((perms) => {
        if (m) {
          setUserPermissions(perms);
          setInitialPermissions(perms);
        }
      })
      .catch((e: unknown) => {
        if (m) setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Không thể tải quyền của admin được chọn' });
      });

    return () => { m = false; };
  }, [selectedAdmin]);

  const hasChanges =
    JSON.stringify([...userPermissions].sort()) !== JSON.stringify([...initialPermissions].sort());

  const handleTogglePermission = (code: string) => {
    setUserPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleResetChanges = () => {
    setUserPermissions([...initialPermissions]);
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    setMsg(null);
    try {
      await permissionService.updateUserPermissions(selectedAdmin.id, userPermissions);
      setInitialPermissions([...userPermissions]);
      setMsg({ type: 'success', text: `Đã cập nhật phân quyền thành công cho tài khoản ${selectedAdmin.fullName}!` });
      loadData();
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Cập nhật phân quyền thất bại' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdmin = async (admin: User) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn XÓA vĩnh viễn tài khoản Quản trị viên "${admin.fullName}" (${admin.email})?\n\nHành động này sẽ xóa toàn bộ quyền và tài khoản đăng nhập.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteUser(admin.id);
      setMsg({ type: 'success', text: `Đã xóa vĩnh viễn tài khoản ${admin.fullName}.` });
      setSelectedAdmin(null);
      await loadData();
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Xóa tài khoản thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  const applyTemplate = (perms: string[]) => {
    setNewSelectedPerms([...perms]);
  };

  const handleToggleNewPerm = (code: string) => {
    setNewSelectedPerms((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr(null);
    if (!newFullName.trim()) {
      setCreateErr('Vui lòng nhập Họ và tên');
      return;
    }
    if (!newEmail.trim()) {
      setCreateErr('Vui lòng nhập Email');
      return;
    }

    setCreating(true);
    try {
      const created = await permissionService.createAdminUser({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim() || '123456@',
        permissions: newSelectedPerms,
      });

      setShowCreateModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('123456@');
      setNewSelectedPerms(['MANAGE_CURRICULUM', 'MANAGE_USERS']);
      setMsg({ type: 'success', text: `Tạo thành công tài khoản Quản trị/Manager: ${created.fullName} (${created.email})!` });

      const refreshedAdmins = await permissionService.getAdmins();
      setAdmins(refreshedAdmins);
      const newlyCreated = refreshedAdmins.find((a) => a.id === created.id || a.email === created.email);
      if (newlyCreated) {
        setSelectedAdmin(newlyCreated);
      }
    } catch (e: unknown) {
      setCreateErr((e as { message?: string })?.message ?? 'Tạo tài khoản admin thất bại');
    } finally {
      setCreating(false);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.fullName?.toLowerCase().includes(searchKw.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchKw.toLowerCase()),
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Phân quyền tài khoản (RBAC)' }]}
        title="Phân quyền Quản trị viên & Manager (RBAC)"
        subtitle="Quản lý danh sách tài khoản Admin/Manager, thiết lập phạm vi quyền hạn và xóa tài khoản khi cần"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateErr(null);
              setShowCreateModal(true);
            }}
          >
            <UserPlus className="w-4 h-4" />
            Tạo tài khoản Manager / Admin
          </Button>
        }
      />

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Danh sách Admin */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-navy-700 dark:text-navy-300" />
                Quản trị viên ({admins.length})
              </h3>
            </div>

            <div className="mb-3">
              <Input
                value={searchKw}
                onChange={(e) => setSearchKw(e.target.value)}
                placeholder="Tìm tên hoặc email..."
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto pr-1 space-y-1">
              {filteredAdmins.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy quản trị viên</div>
              ) : (
                filteredAdmins.map((adm) => {
                  const isSelected = selectedAdmin?.id === adm.id;
                  return (
                    <button
                      key={adm.id}
                      type="button"
                      onClick={() => {
                        setSelectedAdmin(adm);
                        setMsg(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs transition cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-navy-50 text-navy-900 border border-navy-300 dark:bg-navy-950/40 dark:text-white dark:border-navy-800 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{adm.fullName}</span>
                        {isSelected && <Check className="w-4 h-4 text-navy-700 dark:text-navy-300" />}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-mono">{adm.email}</div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Thiết lập quyền chi tiết */}
        <div className="md:col-span-2 space-y-4">
          {selectedAdmin ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Phân quyền tài khoản: {selectedAdmin.fullName}
                    </h3>
                    <Badge variant="purple">{selectedAdmin.role}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedAdmin.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDeleteAdmin(selectedAdmin)}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" /> Xóa tài khoản
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Danh sách quyền hạn chức năng ({userPermissions.length} / {allPermissions.length})
                  </h4>
                  {hasChanges && (
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={handleResetChanges}>
                        <RotateCcw className="w-3.5 h-3.5" /> Hoàn tác
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSavePermissions} disabled={saving}>
                        <Save className="w-3.5 h-3.5" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {allPermissions.map((p) => {
                    const isChecked = userPermissions.includes(p.code);
                    return (
                      <label
                        key={p.code}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-navy-50/50 border-navy-200 dark:bg-navy-950/30 dark:border-navy-800'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(p.code)}
                          className="mt-0.5 rounded border-slate-300 text-navy-900 focus:ring-navy-700"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{p.code}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.description}</div>
                          <div className="font-mono text-[10px] text-slate-400 mt-1">{p.code}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button variant="primary" size="sm" onClick={handleSavePermissions} disabled={!hasChanges || saving}>
                    <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi phân quyền'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-8 text-center text-slate-400 text-xs">Vui lòng chọn một quản trị viên từ danh sách bên trái</div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Tạo Manager / Admin */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo mới Tài khoản Manager / Admin & Cấp quyền"
      >
        {createErr && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {createErr}
          </div>
        )}

        <form onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Họ và tên Quản trị viên *
            </label>
            <Input
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="VD: Nguyen Van B"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email công vụ *
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="VD: manager.b@lms.edu.vn"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu mặc định
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn mẫu vai trò nhanh (Role Preset)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {ROLE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => applyTemplate(tmpl.perms)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-navy-500 text-left bg-slate-50 dark:bg-slate-900 transition"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{tmpl.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{tmpl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tùy chỉnh danh sách quyền cụ thể ({newSelectedPerms.length})
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2">
              {allPermissions.map((p) => {
                const checked = newSelectedPerms.includes(p.code);
                return (
                  <label key={p.code} className="flex items-center gap-2 text-[11px] cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleNewPerm(p.code)}
                      className="rounded border-slate-300 text-navy-900 focus:ring-navy-700"
                    />
                    <span className="truncate">{p.code}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={creating}>
              {creating ? 'Đang tạo...' : 'Tạo mới tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
