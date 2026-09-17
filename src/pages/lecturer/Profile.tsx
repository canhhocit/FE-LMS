// Lecturer Profile page
import { useEffect, useState, useCallback } from 'react';
import * as profileService from '../../services/profileService';
import { PageTitle, Card, Spinner, ErrorBox, Pill } from '../../components/Layout';
import type { UpdateProfileRequest, UserProfile } from '../../types';

export default function LecturerProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UpdateProfileRequest>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const updated = await profileService.uploadAvatar(file);
      setProfile(updated);
      setForm(updated);
      const stored = JSON.parse(localStorage.getItem('lms_auth') ?? 'null');
      if (stored) {
        localStorage.setItem('lms_auth', JSON.stringify({ ...stored, avatarUrl: updated.avatarUrl ?? null }));
      }
      window.dispatchEvent(new StorageEvent('storage', { key: 'lms_auth', newValue: localStorage.getItem('lms_auth') }));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể upload avatar');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const save = async () => {
    try {
      const updated = await profileService.updateMyProfile({
        fullName: form.fullName ?? profile.fullName,
        personalEmail: form.personalEmail ?? profile.personalEmail ?? null,
        dateOfBirth: form.dateOfBirth ?? profile.dateOfBirth ?? null,
        faculty: form.faculty ?? profile.faculty ?? null,
        major: form.major ?? profile.major ?? null,
        avatarUrl: form.avatarUrl ?? profile.avatarUrl ?? null,
      });
      setProfile(updated);
      setForm(updated);
      const stored = JSON.parse(localStorage.getItem('lms_auth') ?? 'null');
      if (stored) {
        localStorage.setItem('lms_auth', JSON.stringify({ ...stored, avatarUrl: updated.avatarUrl ?? null, fullName: updated.fullName }));
      }
      setEditing(false);
    }
    catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  return (
    <div>
      <PageTitle>Hồ sơ giảng viên</PageTitle>
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-emerald-600 text-3xl text-white shadow-sm">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">{profile.fullName?.[0]?.toUpperCase() ?? '?'}</div>
            )}
            {editing && (
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 text-[10px] font-medium text-white opacity-0 transition hover:opacity-100">
                <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                {uploading ? 'Đang tải...' : 'Đổi ảnh'}
              </label>
            )}
          </div>
          <div>
            <div className="text-xl font-semibold">{profile.fullName}</div>
            <div className="text-sm text-slate-400">{profile.email}</div>
            <div className="text-xs mt-1"><Pill color="green">{profile.role}</Pill></div>
          </div>
          <button onClick={() => setEditing(!editing)} className="ml-auto px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-sm">
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
            <div className="text-xs font-semibold text-slate-600 mb-1">Mã giảng viên</div>
            <div className="text-sm font-semibold text-slate-900">{profile.lecturerCode ?? 'Chưa cấp'}</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
            <div className="text-xs font-semibold text-slate-600 mb-1">Email hệ thống</div>
            <div className="text-sm font-semibold text-slate-900">{profile.email}</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
            <div className="text-xs font-semibold text-slate-600 mb-1">Email cá nhân (nhận thông báo & quên mật khẩu)</div>
            {editing ? (
              <input
                type="email"
                value={form.personalEmail ?? profile.personalEmail ?? ''}
                onChange={(e) => setForm({ ...form, personalEmail: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: email@gmail.com"
              />
            ) : (
              <div className={`text-sm font-semibold ${profile.personalEmail ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                {profile.personalEmail ?? 'Chưa cập nhật'}
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
            <div className="text-xs font-semibold text-slate-600 mb-1">Khoa</div>
            <div className={`text-sm font-semibold ${profile.faculty ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {profile.faculty ?? 'Chưa cập nhật'}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
            <div className="text-xs font-semibold text-slate-600 mb-1">Chuyên ngành</div>
            <div className={`text-sm font-semibold ${profile.major ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {profile.major ?? 'Chưa cập nhật'}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
            <div className="text-xs font-semibold text-slate-600 mb-1">Ngày sinh</div>
            <div className={`text-sm font-semibold ${profile.dateOfBirth ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {profile.dateOfBirth ?? 'Chưa cập nhật'}
            </div>
          </div>
        </div>
        {editing && <button onClick={save} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium">Lưu thay đổi</button>}
      </Card>
    </div>
  );
}
