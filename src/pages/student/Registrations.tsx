import { useEffect, useState, useCallback } from 'react';
import { Search, ListChecks } from 'lucide-react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as registrationService from '../../services/registrationService';
import type { Registration, RegistrationPeriod, Clazz } from '../../types';

const fmtDate = (s?: string) => s ? new Date(s).toLocaleString('vi-VN') : '—';

export default function StudentRegistrations() {
  const [tab, setTab] = useState<'REGISTER' | 'MY_REGISTRATIONS'>('REGISTER');
  const [activePeriod, setActivePeriod] = useState<RegistrationPeriod | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Clazz[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [unregisteringId, setUnregisteringId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(() => {
    let mounted = true;
    Promise.all([
      registrationService.getActiveRegistrationPeriod(),
      registrationService.getMyRegistrations(),
      registrationService.getAvailableClassesToRegister().catch(() => []),
    ])
      .then(([period, mine, available]) => {
        if (!mounted) return;
        setActivePeriod(period);
        setMyRegistrations(mine);
        setAvailableClasses(available);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setErr((e as { message?: string })?.message ?? 'Lỗi tải thông tin đăng ký');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const handleRegister = async (clazz: Clazz) => {
    setRegisteringId(clazz.id);
    setErr(null);
    setSuccessMsg(null);
    try {
      await registrationService.registerClass(clazz.id);
      setSuccessMsg(`Đăng ký thành công lớp học phần: ${clazz.className} (${clazz.classCode})!`);
      loadData();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Đăng ký thất bại';
      setErr(msg);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleUnregister = async (clazzId: number, classCode?: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đăng ký lớp học phần ${classCode ?? ''}?`)) return;
    setUnregisteringId(clazzId);
    setErr(null);
    setSuccessMsg(null);
    try {
      await registrationService.unregisterClass(clazzId);
      setSuccessMsg('Đã hủy đăng ký lớp học phần thành công.');
      setMyRegistrations((prev) => prev.filter((item) => item.clazzId !== clazzId));
      loadData();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể hủy đăng ký');
    } finally {
      setUnregisteringId(null);
    }
  };

  if (loading) return <Spinner />;

  const totalRegisteredCredits = myRegistrations.reduce((sum, r) => sum + (r.credits ?? 0), 0);

  return (
    <div>
      <PageTitle>Cổng Đăng ký Học phần</PageTitle>

      {/* Thông tin Đợt đăng ký Active */}
      {activePeriod ? (
        <div className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-5 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">{activePeriod.name}</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Học kỳ: <span className="font-semibold text-slate-800 dark:text-slate-200">{activePeriod.semester}</span> · Năm học: <span className="font-semibold text-slate-800 dark:text-slate-200">{activePeriod.academicYear}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Trần tín chỉ tối đa:</span>
                <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{activePeriod.maxCredits ?? 'Không giới hạn'} tín chỉ</span>
              </div>
              <Pill intent="success">ĐANG MỞ ĐĂNG KÝ</Pill>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div>⏰ <span className="font-medium">Thời gian mở:</span> {fmtDate(activePeriod.openAt)}</div>
            <div>⏳ <span className="font-medium">Thời gian đóng:</span> {fmtDate(activePeriod.closeAt)}</div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-amber-800 flex items-center gap-3">
          <svg className="h-6 w-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold">Chưa có đợt đăng ký học phần nào đang mở</h4>
            <p className="text-xs text-amber-700 mt-0.5">Hiện tại hệ thống chưa mở đợt đăng ký tín chỉ mới. Bạn chỉ có thể xem danh sách các môn đã đăng ký trước đó.</p>
          </div>
        </div>
      )}

      {/* Direct Alert Messages */}
      {err && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{err}</span>
          </div>
          <button onClick={() => setErr(null)} className="text-xs font-semibold text-rose-700 hover:underline">Đóng</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-semibold text-emerald-700 hover:underline">Đóng</button>
        </div>
      )}

      <div className="mb-4 flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('REGISTER')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${tab === 'REGISTER' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Search className="w-3.5 h-3.5" />
          Đăng ký Lớp học phần mới ({availableClasses.length})
        </button>
        <button
          onClick={() => setTab('MY_REGISTRATIONS')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${tab === 'MY_REGISTRATIONS' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Học phần đã đăng ký ({myRegistrations.length} lớp · {totalRegisteredCredits} tín)
        </button>
      </div>

      {tab === 'REGISTER' ? (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Danh sách các Lớp học phần mở đăng ký</h3>
            <span className="text-xs text-slate-500">Tự động lọc các lớp chưa đăng ký</span>
          </div>

          {!activePeriod ? (
            <Empty msg="Đợt đăng ký hiện chưa mở" />
          ) : availableClasses.length === 0 ? (
            <Empty msg="Không còn lớp học phần nào khả dụng để đăng ký trong đợt này" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-4">Mã lớp HP</th>
                    <th className="py-3 px-4">Tên lớp HP</th>
                    <th className="py-3 px-4">Tên Môn học</th>
                    <th className="py-3 px-4">Giảng viên</th>
                    <th className="py-3 px-4 text-center">Sĩ số (Đã ĐK / Tối đa)</th>
                    <th className="py-3 px-4 text-center">Học kỳ</th>
                    <th className="py-3 px-4 text-right">Đăng ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {availableClasses.map((c) => {
                    const max = c.maxStudents ?? 0;
                    const cur = c.currentStudents ?? 0;
                    const isFull = max > 0 && cur >= max;
                    const isRegistering = registeringId === c.id;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.classCode}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">{c.className}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{c.courseTitle || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{c.lecturerName || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isFull ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {cur} / {max > 0 ? max : '∞'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Pill intent="neutral">{c.semester} · {c.academicYear}</Pill>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => void handleRegister(c)}
                            disabled={isFull || isRegistering}
                            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition shadow-sm ${isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50'}`}
                          >
                            {isRegistering ? 'Đang đăng ký...' : isFull ? 'Đã đủ sĩ số' : '+ Đăng ký'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">Danh sách học phần đã đăng ký thành công</h2>
              <p className="text-xs text-slate-500">Các lớp học phần nằm trong hồ sơ đăng ký kỳ này của bạn.</p>
            </div>
            <div className="flex gap-2">
              <Pill intent="info">{myRegistrations.length} lớp học phần</Pill>
              <Pill intent="success">Tổng: {totalRegisteredCredits} tín chỉ</Pill>
            </div>
          </div>

          {myRegistrations.length === 0 ? (
            <Empty msg="Bạn chưa đăng ký lớp học phần nào trong kỳ này" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-4">Mã lớp HP</th>
                    <th className="py-3 px-4">Mã môn</th>
                    <th className="py-3 px-4">Tên môn học</th>
                    <th className="py-3 px-4 text-center">Số tín chỉ</th>
                    <th className="py-3 px-4">Ngày đăng ký</th>
                    <th className="py-3 px-4 text-right">Hủy đăng ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myRegistrations.map((item) => (
                    <tr key={item.enrollmentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.clazzCode ?? '-'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{item.courseCode ?? '-'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">{item.courseTitle ?? '-'}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-700 dark:text-indigo-300">{item.credits ?? '-'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{new Date(item.enrolledAt).toLocaleDateString('vi-VN')}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => void handleUnregister(item.clazzId, item.clazzCode ?? undefined)}
                          disabled={unregisteringId === item.clazzId}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition"
                        >
                          {unregisteringId === item.clazzId ? 'Đang hủy...' : 'Hủy đăng ký'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
