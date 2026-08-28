import { useEffect, useState } from 'react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as registrationService from '../../services/registrationService';
import type { Registration } from '../../types';

export default function StudentRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setRegistrations(await registrationService.getMyRegistrations());
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được học phần đã đăng ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const remove = async (clazzId: number) => {
    if (!window.confirm('Hủy đăng ký học phần này?')) return;
    try {
      await registrationService.unregisterClass(clazzId);
      setRegistrations((items) => items.filter((item) => item.clazzId !== clazzId));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể hủy đăng ký');
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div>
      <PageTitle>Học phần đã đăng ký</PageTitle>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-semibold">Danh sách học phần</h2><p className="text-sm text-slate-500">Các lớp học phần hiện có trong hồ sơ đăng ký của bạn.</p></div>
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
