import { useEffect, useState, useCallback } from 'react';
import { Bot } from 'lucide-react';
import * as profileService from '../../services/profileService';
import * as aiAdvisorService from '../../services/aiAdvisorService';
import { PageHeader, Card, Spinner, ErrorBox, Badge, Button, Input, Select, Textarea, Toast } from '../../components/ui';
import type { UpdateProfileRequest, UserProfile } from '../../types';

export default function LecturerProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<UpdateProfileRequest>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi lưu hồ sơ');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ giảng viên"
        subtitle="Quản lý thông tin giảng dạy, cập nhật ảnh đại diện và cấu hình tài khoản"
      />

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-slate-900 text-2xl font-bold text-white shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{profile.fullName?.[0]?.toUpperCase() ?? '?'}</div>
              )}
              {editing && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/60 text-[10px] font-bold text-white transition opacity-0 hover:opacity-100">
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  {uploading ? 'Đang tải...' : 'Đổi ảnh'}
                </label>
              )}
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{profile.fullName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{profile.email}</div>
              <div className="mt-1">
                <Badge color="emerald">{profile.role}</Badge>
              </div>
            </div>
          </div>

          <Button variant={editing ? "secondary" : "primary"} onClick={() => setEditing(!editing)}>
            {editing ? 'Hủy' : 'Chỉnh sửa'}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <Input label="Mã giảng viên" value={profile.lecturerCode ?? 'Chưa cấp'} disabled />
          <Input label="Email hệ thống" value={profile.email} disabled />
          <Input
            label="Email cá nhân"
            value={editing ? (form.personalEmail ?? profile.personalEmail ?? '') : (profile.personalEmail ?? 'Chưa cập nhật')}
            onChange={(e) => setForm({ ...form, personalEmail: e.target.value })}
            disabled={!editing}
          />
          <Input label="Khoa" value={profile.faculty ?? 'Chưa cập nhật'} disabled />
          <Input label="Chuyên ngành" value={profile.major ?? 'Chưa cập nhật'} disabled />
          <Input label="Ngày sinh" value={profile.dateOfBirth ?? 'Chưa cập nhật'} disabled />
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button onClick={save}>Lưu thay đổi</Button>
          </div>
        )}
      </Card>

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
      return cfg.customPrompt || 'Hỗ trợ tra cứu giảng dạy ngắn gọn, chuẩn mực.';
    } catch { return 'Hỗ trợ tra cứu giảng dạy ngắn gọn, chuẩn mực.'; }
  });

  const [targetGoal, setTargetGoal] = useState(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem(configKey) || '{}');
      return cfg.targetGoal || 'Hỗ trợ giảng dạy & Quản lý lớp';
    } catch { return 'Hỗ trợ giảng dạy & Quản lý lớp'; }
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
    const config = { aiName, toneStyle, customPrompt, targetGoal };
    localStorage.setItem(configKey, JSON.stringify(config));
    window.dispatchEvent(new Event('lms_update_ai_config'));
    try {
      await aiAdvisorService.updateMyAiPreference({
        preferredName: aiName,
        toneStyle,
        personalContext: customPrompt,
      });
    } catch {}
    setMsg('Đã lưu cấu hình Trợ lý AI thành công!');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleExportChat = () => {
    try {
      const saved = localStorage.getItem(historyKey);
      if (!saved) {
        alert('Chưa có lịch sử trò chuyện!');
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
      setMsg('Đã xóa lịch sử trò chuyện');
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
            <span>Cấu hình Trợ lý AI Giảng dạy</span>
          </h3>
          <Badge color="emerald">Trợ lý Giảng dạy</Badge>
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
            <option value="FORMAL">Chuẩn mực Sư phạm</option>
            <option value="CONCISE">Ngắn gọn, Trực diện</option>
          </Select>

          <div className="md:col-span-2">
            <Textarea
              label="Chỉ dẫn hệ thống (System Prompt)"
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Nhập yêu cầu hỗ trợ giảng dạy riêng..."
            />
          </div>

          <Input
            label="Định hướng hỗ trợ"
            value={targetGoal}
            onChange={(e) => setTargetGoal(e.target.value)}
            placeholder="Quản lý lớp & Hỗ trợ học tập"
          />

          <div className="flex items-end">
            <Button onClick={handleSaveConfig} className="w-full">
              Lưu cấu hình AI
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lịch sử trò chuyện</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportChat}>Xuất JSON</Button>
            <Button variant="danger" size="sm" onClick={handleClear}>Xóa lịch sử</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
