import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, Check, Search, Lock, X, Plus, Key, Trash2, Save, AlertCircle, RotateCcw } from 'lucide-react';
import * as permissionService from '../../services/permissionService';
import { deleteUser } from '../../services/userService';
import { PageHeader, Card, Spinner, Badge, Button, ErrorBox } from '../../components/ui';
import type { User } from '../../types';
import type { PermissionInfo } from '../../services/permissionService';

// Template role quick presets for new manager accounts
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
    <div className="space-y-6">
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
            + Tạo tài khoản Manager / Admin
          </Button>
        }
      />

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
        }`}>
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Danh sách Admin */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-accent-600" />
                Quản trị viên ({admins.length})
              </h3>
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKw}
                onChange={(e) => setSearchKw(e.target.value)}
                placeholder="Tìm tên hoặc email..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
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
                          ? 'bg-accent-50 text-accent-900 border border-accent-300 dark:bg-accent-950/40 dark:text-white dark:border-accent-800 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{adm.fullName}</span>
                        {isSelected && <Check className="w-4 h-4 text-accent-600" />}
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
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedAdmin.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="indigo">QUẢN TRỊ VIÊN</Badge>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleting}
                    onClick={() => handleDeleteAdmin(selectedAdmin)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa tài khoản
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chọn các quyền quản trị được phép truy cập:
                </span>
                {hasChanges && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full dark:bg-amber-950/40 dark:text-amber-300 animate-pulse flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Có thay đổi chưa lưu
                  </span>
                )}
              </div>

              <div className="space-y-2.5 mb-6">
                {allPermissions.map((perm) => {
                  const isChecked = userPermissions.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-accent-50/40 border-accent-300 dark:bg-accent-950/30 dark:border-accent-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.code)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-accent-700 dark:text-accent-400 tracking-wide font-mono">{perm.code}</div>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">{perm.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Action Buttons Header/Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {hasChanges ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetChanges}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Hoàn tác
                    </button>
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                      Có thay đổi chưa lưu
                    </span>
                  </div>
                ) : <div />}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSavePermissions}
                  loading={saving}
                  disabled={!hasChanges && !saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi phân quyền'}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center p-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Vui lòng chọn một quản trị viên ở danh sách bên trái để thiết lập quyền
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo tài khoản Manager / Admin mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-950/60 dark:text-accent-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Tạo tài khoản Admin / Manager mới</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cấp tài khoản cán bộ quản lý và thiết lập quyền hạn ban đầu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createErr && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
                {createErr}
              </div>
            )}

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-accent-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email đăng nhập *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Nhập email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-accent-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu ban đầu</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu ban đầu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-accent-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Chọn mẫu Vai trò (Template):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => applyTemplate(tmpl.perms)}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 text-left transition cursor-pointer"
                    >
                      <div className="text-xs font-bold text-accent-700 dark:text-accent-400">{tmpl.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{tmpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Quyền hạn cấp ban đầu:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {allPermissions.map((p) => {
                    const checked = newSelectedPerms.includes(p.code);
                    return (
                      <label key={p.code} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleNewPerm(p.code)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.code}</div>
                          <div className="text-[11px] text-slate-400">{p.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <Button
                  variant="primary"
                  size="md"
                  loading={creating}
                  type="submit"
                >
                  <UserPlus className="w-4 h-4" />
                  Tạo tài khoản ngay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
