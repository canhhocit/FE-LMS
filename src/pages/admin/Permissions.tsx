import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, Check, Search, Lock, X, Plus, Key } from 'lucide-react';
import * as permissionService from '../../services/permissionService';
import { PageTitle, Card, Spinner, Pill } from '../../components/Layout';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        if (m) setUserPermissions(perms);
      })
      .catch((e: unknown) => {
        if (m) setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Không thể tải quyền của admin được chọn' });
      });

    return () => { m = false; };
  }, [selectedAdmin]);

  const handleTogglePermission = (code: string) => {
    setUserPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    setMsg(null);
    try {
      await permissionService.updateUserPermissions(selectedAdmin.id, userPermissions);
      setMsg({ type: 'success', text: `Đã cập nhật phân quyền thành công cho tài khoản ${selectedAdmin.fullName}!` });
      loadData();
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Cập nhật phân quyền thất bại' });
    } finally {
      setSaving(false);
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

      // Refresh list and select the new user
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PageTitle>Phân quyền quản trị viên (RBAC)</PageTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Quản lý danh sách tài khoản Admin/Manager và thiết lập phạm vi quyền hạn chức năng
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateErr(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00376f] hover:bg-[#002b57] text-white font-semibold text-xs shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tạo tài khoản Manager / Admin mới</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
        }`}>
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
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
                <Shield className="w-4 h-4 text-[#00376f] dark:text-[#63a1ff]" />
                Danh sách Quản trị viên ({admins.length})
              </h3>
            </div>

            {/* Tìm kiếm admin */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKw}
                onChange={(e) => setSearchKw(e.target.value)}
                placeholder="Tìm tên hoặc email admin..."
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00376f]"
              />
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto pr-1 space-y-1">
              {filteredAdmins.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy quản trị viên phù hợp</div>
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
                      className={`w-full text-left p-3 rounded-lg text-sm transition cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-blue-50 text-[#00376f] border border-blue-200 dark:bg-slate-800 dark:text-[#63a1ff] dark:border-slate-700 font-semibold shadow-xs'
                          : 'hover:bg-neutral-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{adm.fullName}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#00376f] dark:text-[#63a1ff]" />}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{adm.email}</div>
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
              <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 dark:border-slate-800 pb-4 mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Phân quyền tài khoản: {selectedAdmin.fullName}</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedAdmin.email}</p>
                </div>
                <Pill intent="neutral">QUẢN TRỊ VIÊN</Pill>
              </div>

              <div className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Chọn các quyền quản trị được phép truy cập:
              </div>

              <div className="space-y-2.5 mb-6">
                {allPermissions.map((perm) => {
                  const isChecked = userPermissions.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? 'bg-blue-50/50 border-blue-200 dark:bg-slate-800/80 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.code)}
                        className="mt-1 h-4 w-4 rounded border-neutral-300 text-[#00376f] focus:ring-[#00376f] cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-[#00376f] dark:text-[#63a1ff] tracking-wide">{perm.code}</div>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">{perm.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#00376f] hover:bg-[#002b57] text-white disabled:opacity-50 transition shadow-sm cursor-pointer inline-flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi phân quyền'}</span>
                </button>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center p-12 rounded-2xl bg-neutral-50 dark:bg-slate-900 border border-dashed border-neutral-200 dark:border-slate-800 text-slate-400">
              Vui lòng chọn một quản trị viên ở danh sách bên trái để thiết lập quyền
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo tài khoản Manager / Admin mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#00376f] dark:bg-slate-800 dark:text-[#63a1ff]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Tạo tài khoản Admin / Manager mới</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cấp tài khoản cán bộ quản lý và thiết lập quyền hạn ban đầu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createErr && (
              <div className="p-3 rounded-lg text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
                {createErr}
              </div>
            )}

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Quản Lý"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#00376f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="VD: manager.daotao@learninghub.edu.vn"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#00376f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="123456@"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#00376f] focus:outline-none font-mono"
                />
              </div>

              {/* Template lựa chọn vai trò nhanh */}
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mẫu vai trò chức năng (Quick Presets):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => applyTemplate(tmpl.perms)}
                      className="text-left p-2.5 rounded-lg border border-neutral-200 dark:border-slate-800 hover:border-[#00376f] hover:bg-blue-50/50 dark:hover:bg-slate-800 transition cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#00376f] dark:group-hover:text-[#63a1ff]">
                        {tmpl.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {tmpl.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phân quyền chi tiết ban đầu */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phân quyền chi tiết cho tài khoản mới:
                </label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {allPermissions.map((perm) => {
                    const isChecked = newSelectedPerms.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-50/50 border-blue-200 dark:bg-slate-800/80 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleNewPerm(perm.code)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-neutral-300 text-[#00376f] focus:ring-[#00376f] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#00376f] dark:text-[#63a1ff]">{perm.code}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 ml-2">{perm.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-1.5 rounded-lg text-xs font-bold bg-[#00376f] hover:bg-[#002b57] text-white disabled:opacity-50 transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{creating ? 'Đang tạo...' : 'Tạo tài khoản & Phân quyền'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
