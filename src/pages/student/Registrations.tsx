import { useEffect, useState } from 'react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as registrationService from '../../services/registrationService';
import type { Clazz, Registration, RegistrationPeriod } from '../../types';

export default function StudentRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Clazz[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<RegistrationPeriod | null>(null);
  const [remaining, setRemaining] = useState('');

  const load = async () => {
    try {
      const [registered, available] = await Promise.all([
        registrationService.getMyRegistrations(),
        registrationService.getAvailableClassesToRegister(),
      ]);
      setRegistrations(registered);
      setAvailableClasses(available);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'KhĂ´ng táº£i Ä‘Æ°á»£c thĂ´ng tin Ä‘Äƒng kĂ½');
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
      setErr((e as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ Ä‘Äƒng kĂ½ lá»›p há»c');
    }
  };

  const remove = async (clazzId: number) => {
    if (!window.confirm('Há»§y Ä‘Äƒng kĂ½ há»c pháº§n nĂ y?')) return;
    try {
      await registrationService.unregisterClass(clazzId);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ há»§y Ä‘Äƒng kĂ½');
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-6">
      <PageTitle>ÄÄƒng kĂ½ há»c pháº§n</PageTitle>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Lá»›p Ä‘ang má»Ÿ Ä‘Äƒng kĂ½</h2>
            <p className="text-sm text-slate-500">Danh sĂ¡ch lá»›p há»c pháº§n cĂ³ thá»ƒ Ä‘Äƒng kĂ½ trong Ä‘á»£t hiá»‡n táº¡i.</p>
          </div>
          <Pill color="indigo">{availableClasses.length} lá»›p</Pill>
        </div>

        {availableClasses.length === 0 ? (
          <Empty msg="Hiá»‡n khĂ´ng cĂ³ lá»›p nĂ o má»Ÿ Ä‘Äƒng kĂ½" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {availableClasses.map((clazz) => (
              <div key={clazz.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-700">{clazz.classCode}</span>
                  <Pill color="green">{clazz.semester}</Pill>
                </div>
                <div className="font-semibold text-slate-800">{clazz.className}</div>
                <div className="mt-1 text-sm text-slate-500">{clazz.courseTitle ?? 'Há»c pháº§n'} Â· {clazz.lecturerName ?? 'ChÆ°a phĂ¢n cĂ´ng'}</div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">NÄƒm há»c {clazz.academicYear}</span>
                  <button
                    type="button"
                    onClick={() => void register(clazz.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    ÄÄƒng kĂ½
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
            <h2 className="font-semibold">Há»c pháº§n Ä‘Ă£ Ä‘Äƒng kĂ½</h2>
            <p className="text-sm text-slate-500">CĂ¡c lá»›p há»c pháº§n hiá»‡n cĂ³ trong há»“ sÆ¡ Ä‘Äƒng kĂ½ cá»§a báº¡n.</p>
          </div>
          <Pill color="indigo">{registrations.length} há»c pháº§n</Pill>
        </div>
        {registrations.length === 0 ? <Empty msg="Báº¡n chÆ°a Ä‘Äƒng kĂ½ há»c pháº§n nĂ o" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="border-b border-slate-200 text-left text-xs text-slate-500"><tr><th className="py-2">MĂ£ lá»›p</th><th>MĂ£ mĂ´n</th><th>TĂªn mĂ´n</th><th>TĂ­n chá»‰</th><th>NgĂ y Ä‘Äƒng kĂ½</th><th /></tr></thead>
              <tbody>{registrations.map((item) => <tr key={item.enrollmentId} className="border-b border-slate-100"><td className="py-3 font-mono text-primary">{item.clazzCode ?? '-'}</td><td>{item.courseCode ?? '-'}</td><td>{item.courseTitle ?? '-'}</td><td className="text-center">{item.credits ?? '-'}</td><td>{new Date(item.enrolledAt).toLocaleDateString('vi-VN')}</td><td className="text-right"><button type="button" onClick={() => void remove(item.clazzId)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Há»§y Ä‘Äƒng kĂ½</button></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

