import { useEffect, useState } from 'react';
import * as permissionService from '../../services/permissionService';
import { PageTitle, Card, Spinner, Pill } from '../../components/Layout';
import type { User } from '../../types';
import type { PermissionInfo } from '../../services/permissionService';

export default function Permissions() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionInfo[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let m = true;
    Promise.all([
      permissionService.getAdmins(),
      permissionService.getAllPermissions(),
    ])
      .then(([adminsData, permsData]) => {
        if (m) {
          setAdmins(adminsData);
          setAllPermissions(permsData);
          if (adminsData.length > 0) {
            setSelectedAdmin(adminsData[0]);
          }
        }
      })
      .catch((e: unknown) => {
        if (m) setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Không thể tải dữ liệu phân quyền' });
      })
      .finally(() => {
        if (m) setLoading(false);
      });

    return () => { m = false; };
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

  const handleSave = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    setMsg(null);
    try {
      await permissionService.updateUserPermissions(selectedAdmin.id, userPermissions);
      setMsg({ type: 'success', text: 'Cập nhật phân quyền thành công!' });
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Cập nhật phân quyền thất bại' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageTitle>Phân quyền quản trị viên (RBAC)</PageTitle>

      {msg && (
        <div className={`p-4 rounded-xl text-sm border ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Danh sách Admin */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Danh sách Admin</h3>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2">
              {admins.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Không có admin nào</div>
              ) : (
                admins.map((adm) => (
                  <button key={adm.id} onClick={() => { setSelectedAdmin(adm); setMsg(null); }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition ${
                      selectedAdmin?.id === adm.id
                        ? 'bg-blue-50 text-blue-900 border border-blue-100 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}>
                    <div>{adm.fullName}</div>
                    <div className="text-xs text-slate-400 truncate">{adm.email}</div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Thiết lập quyền chi tiết */}
        <div className="md:col-span-2 space-y-4">
          {selectedAdmin ? (
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Quyền của: {selectedAdmin.fullName}</h3>
                  <p className="text-xs text-slate-400">{selectedAdmin.email}</p>
                </div>
                <Pill color="indigo">ADMIN</Pill>
              </div>

              <div className="space-y-3 mb-6">
                {allPermissions.map((perm) => {
                  const isChecked = userPermissions.includes(perm.code);
                  return (
                    <label key={perm.code}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        isChecked ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleTogglePermission(perm.code)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{perm.code}</div>
                        <div className="text-xs text-slate-500">{perm.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm">
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
              Vui lòng chọn một quản trị viên để phân quyền
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
