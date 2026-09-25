// Lecturer Profile page
import { useEffect, useState, useCallback } from 'react';
import { Bot } from 'lucide-react';
import * as profileService from '../../services/profileService';
import * as aiAdvisorService from '../../services/aiAdvisorService';
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
      <AiSettingsCard />
    </div>
  );
}

function AiSettingsCard() {
  const storedAuth = JSON.parse(localStorage.getItem('lms_auth') ?? 'null');
  const userId = storedAuth?.id || 'guest';
  const configKey = `lms_ai_config_${userId}`;
  const historyKey = `lms_ai_chat_history_${userId}`;

  // Custom AI Instructions State
  const [aiName, setAiName] = useState(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem(configKey) || '{}');
      return cfg.aiName || 'Hikari AI';
    } catch { return 'Hikari AI'; }
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
      return cfg.customPrompt || 'Đóng vai Trợ lý Giảng dạy & Cố vấn Học tập 24/7, đưa ra câu trả lời ngắn gọn, chuẩn mực sư phạm.';
    } catch { return 'Đóng vai Trợ lý Giảng dạy & Cố vấn Học tập 24/7, đưa ra câu trả lời ngắn gọn, chuẩn mực sư phạm.'; }
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
    setMsg('Đã lưu cấu hình cá nhân hóa cho Trợ lý AI thành công!');
    setTimeout(() => setMsg(null), 3500);
  };

  const handleExportChat = () => {
    try {
      const saved = localStorage.getItem(historyKey);
      if (!saved) {
        alert('Chưa có lịch sử trò chuyện nào để xuất!');
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
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với Trợ lý AI không?')) {
      localStorage.removeItem(historyKey);
      window.dispatchEvent(new Event('lms_clear_ai_chat'));
      setMsg('Đã xóa toàn bộ lịch sử trò chuyện với Trợ lý AI thành công!');
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <Card className="mt-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
            <Bot className="w-5 h-5 text-indigo-600 shrink-0" />
            Cá nhân hóa Trợ lý AI (Custom Instructions)
          </h3>
          <span className="text-xs px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold rounded-full border border-purple-200 dark:border-purple-800">
            Live AI Persona
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tùy chỉnh tên trợ lý, chỉ dẫn hệ thống (System Prompt), nhiệm vụ giảng dạy và văn phong phản hồi của AI theo đúng nhu cầu của bạn.
        </p>

        {/* Custom Instructions Form */}
        <div className="grid md:grid-cols-2 gap-3 mt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Tên Trợ lý AI hiển thị:
            </label>
            <input
              type="text"
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              placeholder="Vd: Hikari AI, Jarvis..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Phong cách giao tiếp (Tone of Voice):
            </label>
            <select
              value={toneStyle}
              onChange={(e) => setToneStyle(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            >
              <option value="FRIENDLY">Thân thiện, khích lệ & Gần gũi</option>
              <option value="FORMAL">Trang trọng, Chuẩn mực Sư phạm</option>
              <option value="CONCISE">Ngắn gọn, Trực diện & Tập trung</option>
              <option value="TUTOR">Hỗ trợ Giảng dạy & Giải thích Chi tiết</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Chỉ dẫn cá nhân hóa Custom System Instructions (System Prompt):
            </label>
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Nhập yêu cầu riêng cho AI (Vd: Hỗ trợ soạn đề bài tập, tổng hợp điểm rèn luyện...)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Mục tiêu / Định hướng hỗ trợ:
            </label>
            <input
              type="text"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="Vd: Quản lý lớp & Soạn giáo án..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSaveConfig}
              className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
            >
              Lưu Cấu hình Cá nhân hóa AI
            </button>
          </div>
        </div>

        {/* History Management & Export */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-1">
          <span className="text-xs text-slate-500 font-medium">Quản lý Lịch sử trò chuyện:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportChat}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
            >
              Xuất Lịch sử (.json)
            </button>
            <button
              onClick={handleClear}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-900 transition cursor-pointer"
            >
              Xóa Lịch sử Chat AI
            </button>
          </div>
        </div>

        {msg && <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">{msg}</div>}
      </div>
    </Card>
  );
}
