import { useEffect, useState, useCallback } from 'react';
import { Bot, User, Key } from 'lucide-react';
import * as profileService from '../../services/profileService';
import * as aiAdvisorService from '../../services/aiAdvisorService';
import { AvatarUploader } from '../../components/AvatarUploader';
import { PageHeader, Card, Spinner, ErrorBox, Badge, Button, Input, Select, Textarea, Toast } from '../../components/ui';
import type { UpdateProfileRequest, UserProfile } from '../../types';

function Field({ label, value, editing, onChange, type = 'text', options }:
  { label: string; value?: string | null; editing?: boolean; onChange?: (v: string) => void; type?: string; options?: string[]; }) {
  const displayVal = value && value.trim() !== '' ? value : null;
  return (
    <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</div>
      {editing && onChange ? (
        type === 'select' ? (
          <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        ) : (
          <Input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="Nhập thông tin..." />
        )
      ) : (
        <div className={`text-xs font-semibold ${displayVal ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
          {displayVal ?? 'Chưa cập nhật'}
        </div>
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
      .catch((e: unknown) => mounted && setErr((e as { message?: string })?.message ?? 'Lỗi tải hồ sơ'))
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

  const handleAvatarUpload = async (file: File) => {
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
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi lưu thông tin');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ cá nhân"
        subtitle="Quản lý thông tin cá nhân, cập nhật avatar và cấu hình tài khoản"
      />

      <Card>
        {editing && (
          <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-3">Đổi ảnh đại diện</h4>
            <AvatarUploader
              currentAvatar={profile.avatarUrl ?? undefined}
              onUpload={handleAvatarUpload}
              label="Lưu ảnh"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-slate-900 text-2xl font-bold text-white shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{profile.fullName?.[0]?.toUpperCase() ?? '?'}</div>
              )}
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{profile.fullName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{profile.email}</div>
              <div className="mt-1">
                <Badge color="indigo">{profile.role}</Badge>
              </div>
            </div>
          </div>

          <Button variant={editing ? "secondary" : "primary"} onClick={() => setEditing(!editing)}>
            {editing ? 'Hủy' : 'Chỉnh sửa hồ sơ'}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-xs">
          <Field label="Mã sinh viên" value={profile.studentCode} />
          <Field label="Lớp hành chính" value={profile.adminClassName ?? 'Chưa phân lớp'} />
          <Field label="Chương trình đào tạo" value={profile.curriculumName ?? profile.major ?? 'Chưa cập nhật'} />
          <Field label="Khoa" value={profile.faculty} editing={editing} onChange={(v) => setForm({ ...form, faculty: v })} />
          <Field label="Chuyên ngành" value={profile.major} editing={editing} onChange={(v) => setForm({ ...form, major: v })} />
          <Field label="Ngày sinh" value={profile.dateOfBirth} type="date" editing={editing} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
          <Field label="Email sinh viên (mặc định)" value={profile.email} />
          <Field label="Email cá nhân" value={profile.personalEmail} editing={editing} type="email" onChange={(v) => setForm({ ...form, personalEmail: v })} />
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button onClick={save}>Lưu thay đổi</Button>
          </div>
        )}
      </Card>

      <ChangePasswordCard />
      <AiSettingsCard />
    </div>
  );
}

function AiSettingsCard() {
  const storedAuth = JSON.parse(localStorage.getItem('lms_auth') ?? 'null');
  const userId = storedAuth?.id || 'guest';
  const configKey = `lms_ai_config_${userId}`;
  const historyKey = `lms_ai_chat_history_${userId}`;

  const [aiName, setAiName] = useState(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem(configKey) || '{}');
      return cfg.aiName || 'Trợ lý AI';
    } catch { return 'Trợ lý AI'; }
  });

  const [toneStyle, setToneStyle] = useState(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem(configKey) || '{}');
      return cfg.toneStyle || 'FRIENDLY';
    } catch { return 'FRIENDLY'; }
  });

  const [customPrompt, setCustomPrompt] = useState(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem(configKey) || '{}');
      return cfg.customPrompt || 'Hỗ trợ tra cứu thông tin học tập ngắn gọn, chính xác.';
    } catch { return 'Hỗ trợ tra cứu thông tin học tập ngắn gọn, chính xác.'; }
  });

  const [targetGpa, setTargetGpa] = useState(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem(configKey) || '{}');
      return cfg.targetGpa || '3.6';
    } catch { return '3.6'; }
  });

  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    aiAdvisorService.getMyAiPreference()
      .then((pref) => {
        if (!mounted || !pref) return;
        if (pref.preferredName) setAiName(pref.preferredName);
        if (pref.toneStyle) setToneStyle(pref.toneStyle);
        if (pref.personalContext) setCustomPrompt(pref.personalContext);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleSaveConfig = async () => {
    const config = { aiName, toneStyle, customPrompt, targetGpa };
    localStorage.setItem(configKey, JSON.stringify(config));
    window.dispatchEvent(new Event('lms_update_ai_config'));
    try {
      await aiAdvisorService.updateMyAiPreference({
        preferredName: aiName,
        toneStyle,
        personalContext: customPrompt,
      });
    } catch {}
    setMsg('Đã lưu cấu hình Trợ lý AI thành công');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleExportChat = () => {
    try {
      const saved = localStorage.getItem(historyKey);
      if (!saved) {
        alert('Chưa có lịch sử trò chuyện để xuất!');
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(saved);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `lms_ai_chat_history_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert('Không thể xuất file lịch sử chat!');
    }
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?')) {
      localStorage.removeItem(historyKey);
      window.dispatchEvent(new Event('lms_clear_ai_chat'));
      setMsg('Đã xóa toàn bộ lịch sử trò chuyện AI');
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {msg && <Toast message={msg} type="success" onClose={() => setMsg(null)} />}

        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent-600 dark:text-accent-400" />
            <span>Cấu hình Trợ lý AI</span>
          </h3>
          <Badge color="slate">Trợ lý học tập</Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Tên Trợ lý AI hiển thị"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
            placeholder="Ví dụ: Trợ lý AI"
          />

          <Select
            label="Phong cách giao tiếp"
            value={toneStyle}
            onChange={(e) => setToneStyle(e.target.value)}
          >
            <option value="FRIENDLY">Gần gũi & Khích lệ</option>
            <option value="FORMAL">Chuẩn mực, Trang trọng</option>
            <option value="CONCISE">Ngắn gọn, Trực diện</option>
            <option value="TUTOR">Giải thích Chi tiết</option>
          </Select>

          <div className="md:col-span-2">
            <Textarea
              label="Chỉ dẫn hệ thống cho AI (System Prompt)"
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Yêu cầu cách xưng hô hoặc ưu tiên thông tin..."
            />
          </div>

          <Input
            label="Mục tiêu GPA kỳ tới"
            value={targetGpa}
            onChange={(e) => setTargetGpa(e.target.value)}
            placeholder="Ví dụ: 3.6"
          />

          <div className="flex items-end">
            <Button onClick={handleSaveConfig} className="w-full">
              Lưu cấu hình AI
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quản lý dữ liệu hội thoại</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportChat}>Xuất JSON</Button>
            <Button variant="danger" size="sm" onClick={handleClear}>Xóa lịch sử</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ChangePasswordCard() {
  const [old, setOld] = useState('');
  const [newP, setNewP] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null); setMsg(null);
    try {
      await profileService.changePassword(old, newP);
      setMsg('Đổi mật khẩu thành công');
      setOld('');
      setNewP('');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Đổi mật khẩu thất bại');
    }
  };

  return (
    <Card>
      <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Đổi mật khẩu</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Input
          type="password"
          label="Mật khẩu hiện tại"
          placeholder="••••••••"
          value={old}
          onChange={(e) => setOld(e.target.value)}
        />
        <Input
          type="password"
          label="Mật khẩu mới"
          placeholder="••••••••"
          value={newP}
          onChange={(e) => setNewP(e.target.value)}
        />
      </div>

      {err && <ErrorBox msg={err} />}
      {msg && <Toast message={msg} type="success" onClose={() => setMsg(null)} />}

      <div className="mt-3 flex justify-end">
        <Button onClick={submit} disabled={!old || !newP}>
          Cập nhật mật khẩu
        </Button>
      </div>
    </Card>
  );
}
