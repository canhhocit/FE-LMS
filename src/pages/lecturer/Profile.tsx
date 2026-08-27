// Lecturer Profile page
import { useEffect, useState, useCallback } from 'react';
import * as profileService from '../../services/profileService';
import { PageTitle, Card, Spinner, ErrorBox, Pill } from '../../components/Layout';
import type { UserProfile } from '../../types';

export default function LecturerProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  // setState only fires inside async callbacks to avoid the "set-state-in-effect" lint.
  const load = useCallback(() => {
    let mounted = true;
    profileService.getMyProfile()
      .then((p) => {
        if (!mounted) return;
        setProfile(p);
        setForm(p);
      })
      .catch((e: unknown) => mounted && setErr((e as { message?: string })?.message ?? 'Lỗi'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);
  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  if (!profile) return null;
  const save = async () => {
    try { await profileService.updateMyProfile(form); setEditing(false); load(); }
    catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  return (
    <div>
      <PageTitle>Hồ sơ giảng viên</PageTitle>
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-3xl">
            {profile.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="text-xl font-semibold">{profile.fullName}</div>
            <div className="text-sm text-slate-400">{profile.email}</div>
            <div className="text-xs mt-1"><Pill color="green">{profile.role}</Pill></div>
          </div>
          <button onClick={() => setEditing(!editing)} className="ml-auto px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm">
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-slate-400">Số điện thoại</div>
            {editing ? <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm" /> : <div className="mt-1">{profile.phone ?? '-'}</div>}
          </div>
          <div><div className="text-xs text-slate-400">Địa chỉ</div>
            {editing ? <input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm" /> : <div className="mt-1">{profile.address ?? '-'}</div>}
          </div>
        </div>
        {editing && <button onClick={save} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500">Lưu</button>}
      </Card>
    </div>
  );
}
