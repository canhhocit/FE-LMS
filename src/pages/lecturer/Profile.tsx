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
    try {
      await profileService.updateMyProfile({
        fullName: form.fullName ?? profile.fullName,
        dateOfBirth: form.dateOfBirth ?? null,
        faculty: form.faculty ?? null,
        major: form.major ?? null,
      });
      setEditing(false); load();
    }
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
          <button onClick={() => setEditing(!editing)} className="ml-auto px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-sm">
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-slate-400">Mã giảng viên</div>
            <div className="mt-1">{profile.lecturerCode ?? '-'}</div>
          </div>
          <div><div className="text-xs text-slate-400">Khoa</div>
            <div className="mt-1">{profile.faculty ?? '-'}</div>
          </div>
          <div><div className="text-xs text-slate-400">Chuyên ngành</div><div className="mt-1">{profile.major ?? '-'}</div></div>
          <div><div className="text-xs text-slate-400">Ngày sinh</div><div className="mt-1">{profile.dateOfBirth ?? '-'}</div></div>
        </div>
        {editing && <button onClick={save} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500">Lưu</button>}
      </Card>
    </div>
  );
}
