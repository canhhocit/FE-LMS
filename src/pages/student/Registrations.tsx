import { useEffect, useState, useCallback } from 'react';
import { Search, ListChecks, Clock, Hourglass, AlertCircle } from 'lucide-react';
import { PageHeader, Card, StatCard, Spinner, Empty, Badge, Button, Table, Toast, Tabs } from '../../components/ui';
import * as registrationService from '../../services/registrationService';
import type { Registration, RegistrationPeriod, Clazz } from '../../types';

const parseDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (Array.isArray(val)) {
    const [y, m, d, h = 0, min = 0, s = 0] = val;
    return new Date(y, m - 1, d, h, min, s);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    d = new Date(trimmed.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;

    const timeFirstMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (timeFirstMatch) {
      const [, h, min, s = '0', day, mon, yr] = timeFirstMatch;
      return new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(min), Number(s));
    }
    const dateFirstMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (dateFirstMatch) {
      const [, day, mon, yr, h = '0', min = '0', s = '0'] = dateFirstMatch;
      return new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(min), Number(s));
    }
  }
  return null;
};

const fmtDate = (s?: unknown) => {
  const d = parseDate(s);
  return d ? d.toLocaleString('vi-VN') : '—';
};

export default function StudentRegistrations() {
  const [tab, setTab] = useState<string>('REGISTER');
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
      setSuccessMsg(`Đăng ký thành công lớp học phần ${clazz.className} (${clazz.classCode})!`);
      loadData();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Đăng ký thất bại';
      setErr(msg);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleUnregister = async (clazzId: number, classCode?: string) => {
    if (classCode && !window.confirm(`Bạn có chắc chắn muốn hủy đăng ký lớp ${classCode}?`)) return;
    setUnregisteringId(clazzId);
    setErr(null);
    setSuccessMsg(null);
    try {
      await registrationService.unregisterClass(clazzId);
      setSuccessMsg('Đã hủy đăng ký lớp học phần thành công');
      loadData();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể hủy đăng ký');
    } finally {
      setUnregisteringId(null);
    }
  };

  if (loading) return <Spinner />;

  const totalRegisteredCredits = myRegistrations.reduce((sum, r) => sum + (r.credits ?? 0), 0);

  const now = new Date();
  const openAt = parseDate(activePeriod?.openAt);
  const closeAt = parseDate(activePeriod?.closeAt);

  const isPeriodOpen = !!(openAt && closeAt && now >= openAt && now <= closeAt);
  const isPeriodExpired = !!(closeAt && now > closeAt);
  const isPeriodUpcoming = !!(openAt && now < openAt);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cổng Đăng ký Học phần"
        subtitle="Tra cứu đợt đăng ký, đăng ký tín chỉ và quản lý danh sách học phần"
      />

      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />}
      {err && <Toast message={err} type="error" onClose={() => setErr(null)} />}

      {/* Registration Period Card */}
      {activePeriod ? (
        <Card className="border border-accent-200 dark:border-accent-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{activePeriod.name}</h3>
                {isPeriodOpen && <Badge color="emerald">Đang mở đăng ký</Badge>}
                {isPeriodExpired && <Badge color="red">Đã hết hạn</Badge>}
                {isPeriodUpcoming && <Badge color="amber">Sắp mở</Badge>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Học kỳ: <span className="font-semibold text-slate-700 dark:text-slate-300">{activePeriod.semester}</span> · Năm học: <span className="font-semibold text-slate-700 dark:text-slate-300">{activePeriod.academicYear}</span>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hạn mức tín chỉ</span>
              <span className="text-lg font-bold text-accent-600 dark:text-accent-400">{activePeriod.maxCredits ?? 'Không giới hạn'} tín</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div><span className="font-semibold">Mở từ:</span> {fmtDate(activePeriod.openAt)}</div>
            <div><span className="font-semibold">Hạn đến:</span> {fmtDate(activePeriod.closeAt)}</div>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            Hiện tại không có đợt đăng ký tín chỉ nào đang diễn ra. Bạn vẫn có thể xem lại các lớp đã đăng ký.
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'REGISTER', label: 'Đăng ký lớp mới', count: availableClasses.length },
          { id: 'MY_REGISTRATIONS', label: 'Đã đăng ký', count: myRegistrations.length },
        ]}
        activeTab={tab}
        onChange={(t) => setTab(t)}
      />

      {tab === 'REGISTER' ? (
        <div>
          {!activePeriod ? (
            <Empty msg="Đợt đăng ký hiện chưa mở" />
          ) : availableClasses.length === 0 ? (
            <Empty msg="Không có lớp học phần nào mở đăng ký trong đợt này" />
          ) : (
            <Table headers={['Mã lớp HP', 'Tên lớp HP', 'Môn học', 'Giảng viên', 'Sĩ số', 'Học kỳ', 'Đăng ký']}>
              {availableClasses.map((c) => {
                const max = c.maxStudents ?? 0;
                const cur = c.currentStudents ?? 0;
                const isFull = max > 0 && cur >= max;
                const isRegistering = registeringId === c.id;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-accent-600 dark:text-accent-400 text-xs">{c.classCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs">{c.className}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{c.courseTitle || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{c.lecturerName || '-'}</td>
                    <td className="px-4 py-3 text-center text-xs">
                      <Badge color={isFull ? 'red' : 'slate'}>{cur} / {max > 0 ? max : '∞'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">{c.semester}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        disabled={isFull || isRegistering || !isPeriodOpen}
                        onClick={() => void handleRegister(c)}
                      >
                        {isRegistering ? 'Đang gửi...' : isFull ? 'Đủ sĩ số' : 'Đăng ký'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      ) : (
        <div>
          {myRegistrations.length === 0 ? (
            <Empty msg="Bạn chưa đăng ký lớp học phần nào" />
          ) : (
            <Table headers={['Mã lớp HP', 'Mã môn', 'Tên môn học', 'Số tín chỉ', 'Ngày đăng ký', 'Hành động']}>
              {myRegistrations.map((item) => (
                <tr key={item.enrollmentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-bold text-accent-600 dark:text-accent-400 text-xs">{item.clazzCode ?? '-'}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{item.courseCode ?? '-'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs">{item.courseTitle ?? '-'}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white text-xs">{item.credits ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.enrolledAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={unregisteringId === item.clazzId}
                      onClick={() => void handleUnregister(item.clazzId, item.clazzCode ?? undefined)}
                    >
                      {unregisteringId === item.clazzId ? 'Đang hủy...' : 'Hủy đăng ký'}
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
