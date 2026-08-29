// Student Profile page
import { useEffect, useState, useCallback } from 'react';
import * as profileService from '../../services/profileService';
import { PageTitle, Card, Spinner, ErrorBox, Pill } from '../../components/Layout';
import type { UpdateProfileRequest, UserProfile } from '../../types';

function Field({ label, value, editing, onChange, type = 'text', options, className = '' }:
  { label: string; value?: string | null; editing?: boolean; onChange?: (v: string) => void; type?: string; options?: string[]; className?: string; }) {
  return (
    <div className={className}>
      <div className="text-xs text-slate-400">{label}</div>
      {editing && onChange ? (
        type === 'select' ? (
          <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm">
            {options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm" />
        )
      ) : (
        <div className="mt-1">{value ?? '-'}</div>
      )}
    </div>
  );
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UpdateProfileRequest>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
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
    try {
      await profileService.updateMyProfile({
        fullName: form.fullName ?? profile.fullName,
        dateOfBirth: form.dateOfBirth ?? profile.dateOfBirth ?? null,
        faculty: form.faculty ?? profile.faculty ?? null,
        major: form.major ?? profile.major ?? null,
      });
      setEditing(false); load();
    }
    catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  return (
    <div>
      <PageTitle>Hồ sơ cá nhân</PageTitle>
      <Card className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl">
            {profile.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="text-xl font-semibold">{profile.fullName}</div>
            <div className="text-sm text-slate-400">{profile.email}</div>
            <div className="text-xs mt-1"><Pill color="indigo">{profile.role}</Pill></div>
          </div>
          <button onClick={() => setEditing(!editing)} className="ml-auto px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-sm">
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <Field label="Mã sinh viên" value={profile.studentCode} />
          <Field label="Ngày sinh" value={profile.dateOfBirth} type="date" editing={editing}
            onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
          <Field label="Khoa" value={profile.faculty} editing={editing}
            onChange={(v) => setForm({ ...form, faculty: v })} />
          <Field label="Chuyên ngành" value={profile.major} editing={editing}
            onChange={(v) => setForm({ ...form, major: v })} />
        </div>
        {editing && (
          <button onClick={save} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500">Lưu</button>
        )}
      </Card>
      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [old, setOld] = useState('');
  const [newP, setNewP] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setErr(null); setMsg(null);
    try { await profileService.changePassword(old, newP); setMsg('Đổi mật khẩu thành công'); setOld(''); setNewP(''); }
    catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  return (
    <Card>
      <h3 className="font-semibold mb-3">Đổi mật khẩu</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <input type="password" placeholder="Mật khẩu cũ" value={old} onChange={(e) => setOld(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
        <input type="password" placeholder="Mật khẩu mới" value={newP} onChange={(e) => setNewP(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
      </div>
      {err && <div className="mt-2 text-sm text-rose-300">{err}</div>}
      {msg && <div className="mt-2 text-sm text-emerald-300">{msg}</div>}
      <button onClick={submit} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500">Đổi</button>
    </Card>
  );
}
