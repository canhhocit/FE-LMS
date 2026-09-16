import { useEffect, useState } from 'react';
import * as clazzService from '../../services/clazzService';
import * as cpService from '../../services/clazzPermissionService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';

interface Lecturer { id: number; fullName: string; email: string; }

export default function ClazzPermissions() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [selectedLecturer, setSelectedLecturer] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allPerms, setAllPerms] = useState<string[]>(['MANAGE_CONTENT', 'GRADE_STUDENTS', 'MANAGE_ATTENDANCE', 'VIEW_REPORTS']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await clazzService.getMyClasses();
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0].id);
      } catch (e: unknown) {
        setErr((e as { message?: string })?.message ?? 'Lá»—i táº£i lá»›p há»c');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      try {
        const students = await clazzService.getClassStudents(selectedClass);
        const lects = (students || []).filter((s: any) => s.role === 'LECTURER');
        setLecturers(lects);
        setSelectedLecturer(lects[0]?.id ?? null);
      } catch {
        setLecturers([]);
      }
    })();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedLecturer) { setPermissions([]); return; }
    (async () => {
      try {
        const perms = await cpService.getClazzPermissions(selectedClass, selectedLecturer);
        setPermissions(perms);
      } catch {
        setPermissions([]);
      }
    })();
  }, [selectedClass, selectedLecturer]);

  const togglePerm = (code: string) => {
    setPermissions(prev => prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedLecturer) return;
    setSaving(true);
    setMsg(null);
    try {
      await cpService.grantClazzPermissions(selectedClass, selectedLecturer, permissions);
      setMsg('LÆ°u phĂ¢n quyá»n thĂ nh cĂ´ng!');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedClass || !selectedLecturer) return;
    if (!confirm('Thu há»“i toĂ n bá»™ quyá»n cá»§a giáº£ng viĂªn nĂ y trong lá»›p?')) return;
    try {
      await cpService.revokeClazzPermissions(selectedClass, selectedLecturer);
      setPermissions([]);
      setMsg('ÄĂ£ thu há»“i táº¥t cáº£ quyá»n.');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Thu hồi thất bại');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageTitle>PhĂ¢n quyá»n Giáº£ng viĂªn theo Lá»›p há»c</PageTitle>

      {err && <ErrorBox msg={err} />}
      {msg && <div className="p-3 rounded-lg text-sm bg-emerald-50 border border-emerald-200 text-emerald-700">{msg}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-bold text-slate-800 mb-3">Chá»n lá»›p há»c</h3>
            <select value={selectedClass ?? ''} onChange={e => setSelectedClass(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500">
              {classes.map(c => <option key={c.id} value={c.id}>{c.classCode || c.className || ('Lớp #' + c.id)}</option>)}
            </select>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 mb-3">Giảng viên trong lớp</h3>
            {lecturers.length === 0 ? <Empty msg="Không có GV trong lớp này" /> : (
              <ul className="space-y-2">
                {lecturers.map(l => (
                  <li key={l.id}>
                    <button aria-label="button" onClick={() => { setSelectedLecturer(l.id); setMsg(null); }}
                      className={"w-full text-left p-3 rounded-lg border transition " + (selectedLecturer === l.id ? 'bg-violet-50 border-violet-200 text-violet-900' : 'bg-white border-slate-100 hover:bg-slate-50')}>
                      <div className="font-medium text-sm">{l.fullName || l.email}</div>
                      <div className="text-xs text-slate-400">{l.email}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">Quyá»n cá»§a giáº£ng viĂªn</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedLecturer ? ('User ID: ' + selectedLecturer) : 'ChÆ°a chá»n giáº£ng viĂªn'}</p>
              </div>
              {selectedLecturer && (
                <button aria-label="button" onClick={handleRevoke} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition">Thu hồi tất cả</button>
              )}
            </div>

            {!selectedLecturer ? <Empty msg="Chá»n má»™t giáº£ng viĂªn Ä‘á»ƒ quáº£n lĂ½ quyá»n" /> : (
              <>
                <div className="space-y-3 mb-6">
                  {allPerms.map(code => {
                    const checked = permissions.includes(code);
                    return (
                      <label key={code} className={"flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition " + (checked ? 'bg-violet-50/50 border-violet-200' : 'bg-white border-slate-200 hover:bg-slate-50')}>
                        <input type="checkbox" checked={checked} onChange={() => togglePerm(code)}
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{code}</div>
                          <div className="text-xs text-slate-500">
                            {code === 'MANAGE_CONTENT' && 'Quáº£n lĂ½ ná»™i dung (chÆ°Æ¡ng, bĂ i há»c, tĂ i liá»‡u)'}
                            {code === 'GRADE_STUDENTS' && 'Chấm điểm sinh viên'}
                            {code === 'MANAGE_ATTENDANCE' && 'Quản lý điểm danh'}
                            {code === 'VIEW_REPORTS' && 'Xem bĂ¡o cĂ¡o lá»›p há»c'}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <button aria-label="button" onClick={handleSave} disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition shadow-sm">
                    {saving ? 'Äang lÆ°u...' : 'LÆ°u phĂ¢n quyá»n'}
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

