import { useEffect, useState } from 'react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as registrationService from '../../services/registrationService';
import type { Clazz, Registration } from '../../types';

export default function StudentRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Clazz[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      const [registered, available] = await Promise.all([
        registrationService.getMyRegistrations(),
        registrationService.getAvailableClassesToRegister(),
      ]);
      setRegistrations(registered);
      setAvailableClasses(available);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được thông tin đăng ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const register = async (clazzId: number) => {
    try {
      await registrationService.registerClass(clazzId);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể đăng ký lớp học');
    }
  };

  const remove = async (clazzId: number) => {
    if (!window.confirm('Hủy đăng ký học phần này?')) return;
    try {
      await registrationService.unregisterClass(clazzId);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể hủy đăng ký');
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-6">
      <PageTitle>Đăng ký học phần</PageTitle>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Lớp đang mở đăng ký</h2>
            <p className="text-sm text-slate-500">Danh sách lớp học phần có thể đăng ký trong đợt hiện tại.</p>
          </div>
          <Pill color="indigo">{availableClasses.length} lớp</Pill>
        </div>

        {availableClasses.length === 0 ? (
          <Empty msg="Hiện không có lớp nào mở đăng ký" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {availableClasses.map((clazz) => (
              <div key={clazz.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-700">{clazz.classCode}</span>
                  <Pill color="green">{clazz.semester}</Pill>
                </div>
                <div className="font-semibold text-slate-800">{clazz.className}</div>
                <div className="mt-1 text-sm text-slate-500">{clazz.courseTitle ?? 'Học phần'} · {clazz.lecturerName ?? 'Chưa phân công'}</div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Năm học {clazz.academicYear}</span>
                  <button
                    type="button"
                    onClick={() => void register(clazz.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Đăng ký
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Học phần đã đăng ký</h2>
            <p className="text-sm text-slate-500">Các lớp học phần hiện có trong hồ sơ đăng ký của bạn.</p>
          </div>
          <Pill color="indigo">{registrations.length} học phần</Pill>
        </div>
        {registrations.length === 0 ? <Empty msg="Bạn chưa đăng ký học phần nào" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="border-b border-slate-200 text-left text-xs text-slate-500"><tr><th className="py-2">Mã lớp</th><th>Mã môn</th><th>Tên môn</th><th>Tín chỉ</th><th>Ngày đăng ký</th><th /></tr></thead>
              <tbody>{registrations.map((item) => <tr key={item.enrollmentId} className="border-b border-slate-100"><td className="py-3 font-mono text-primary">{item.clazzCode ?? '-'}</td><td>{item.courseCode ?? '-'}</td><td>{item.courseTitle ?? '-'}</td><td className="text-center">{item.credits ?? '-'}</td><td>{new Date(item.enrolledAt).toLocaleDateString('vi-VN')}</td><td className="text-right"><button type="button" onClick={() => void remove(item.clazzId)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Hủy đăng ký</button></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
