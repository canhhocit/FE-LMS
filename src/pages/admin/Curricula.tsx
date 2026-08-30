import { useEffect, useState } from 'react';
import * as curriculumService from '../../services/curriculumService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { Curriculum, Course, GradingPolicy, GpaScaleRule } from '../../types';

export default function AdminCurricula() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Curriculum | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'grading'>('courses');
  
  // Grading Policy state
  const [policy, setPolicy] = useState<GradingPolicy | null>(null);
  const [attendancePercent, setAttendancePercent] = useState<number>(0);
  const [midtermPercent, setMidtermPercent] = useState<number>(40);
  const [finalPercent, setFinalPercent] = useState<number>(60);
  const [policySaving, setPolicySaving] = useState(false);
  
  // Gpa Scale state
  const [gpaRules, setGpaRules] = useState<GpaScaleRule[]>([]);
  const [gpaSaving, setGpaSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let m = true;
    Promise.all([curriculumService.getCurricula(), curriculumService.getAllCourses()])
      .then(([cu, co]) => {
        if (m) {
          setCurricula(cu);
          setCourses(co);
          if (cu.length > 0) {
            setSelected(cu[0]);
          }
        }
      })
      .catch((e) => m && setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);

  // Fetch policy and GPA rules when selected curriculum changes
  useEffect(() => {
    if (!selected) return;
    let m = true;
    setMsg(null);
    Promise.all([
      curriculumService.getGradingPolicy(selected.id).catch(() => null),
      curriculumService.getGpaScaleRules(selected.id).catch(() => []),
    ]).then(([policyData, rulesData]) => {
      if (m) {
        if (policyData) {
          setPolicy(policyData);
          setAttendancePercent(Math.round(policyData.attendanceWeight * 100));
          setMidtermPercent(Math.round(policyData.midtermWeight * 100));
          setFinalPercent(Math.round(policyData.finalWeight * 100));
        } else {
          setPolicy(null);
          setAttendancePercent(0);
          setMidtermPercent(40);
          setFinalPercent(60);
        }
        // Sort rules by sortOrder or minScore10 descending
        const sortedRules = [...rulesData].sort((a, b) => a.sortOrder - b.sortOrder);
        setGpaRules(sortedRules);
      }
    });
    return () => { m = false; };
  }, [selected]);

  const handleSavePolicy = async () => {
    if (!selected) return;
    const total = attendancePercent + midtermPercent + finalPercent;
    if (total !== 100) {
      setMsg({ type: 'error', text: `Tổng trọng số phải bằng 100% (Hiện tại là: ${total}%)` });
      return;
    }
    setPolicySaving(true);
    setMsg(null);
    try {
      const saved = await curriculumService.updateGradingPolicy(selected.id, {
        attendanceWeight: attendancePercent / 100,
        midtermWeight: midtermPercent / 100,
        finalWeight: finalPercent / 100,
      });
      setPolicy(saved);
      setMsg({ type: 'success', text: 'Lưu công thức tính điểm thành công!' });
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Không thể lưu công thức tính điểm' });
    } finally {
      setPolicySaving(false);
    }
  };

  const handleAddGpaRule = () => {
    const newRule: GpaScaleRule = {
      curriculumId: selected?.id ?? 0,
      minScore10: 0,
      gpa4: 0,
      sortOrder: gpaRules.length + 1,
    };
    setGpaRules([...gpaRules, newRule]);
  };

  const handleRemoveGpaRule = (index: number) => {
    const updated = gpaRules.filter((_, i) => i !== index);
    // Recalculate sortOrder
    const resorted = updated.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    setGpaRules(resorted);
  };

  const handleGpaRuleChange = (index: number, field: keyof GpaScaleRule, value: number) => {
    const updated = [...gpaRules];
    updated[index] = { ...updated[index], [field]: value };
    setGpaRules(updated);
  };

  const handleSaveGpaRules = async () => {
    if (!selected) return;
    
    // Validate rules
    for (let i = 0; i < gpaRules.length; i++) {
      const r = gpaRules[i];
      if (r.minScore10 < 0 || r.minScore10 > 10) {
        setMsg({ type: 'error', text: `Dòng ${i + 1}: Ngưỡng điểm hệ 10 phải từ 0 đến 10` });
        return;
      }
      if (r.gpa4 < 0 || r.gpa4 > 4) {
        setMsg({ type: 'error', text: `Dòng ${i + 1}: Điểm GPA hệ 4 phải từ 0 đến 4` });
        return;
      }
    }

    setGpaSaving(true);
    setMsg(null);
    try {
      const saved = await curriculumService.updateGpaScaleRules(
        selected.id,
        gpaRules.map((r) => ({
          minScore10: r.minScore10,
          gpa4: r.gpa4,
          sortOrder: r.sortOrder,
        })),
      );
      setGpaRules(saved.sort((a, b) => a.sortOrder - b.sortOrder));
      setMsg({ type: 'success', text: 'Lưu thang quy đổi GPA thành công!' });
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'Không thể lưu thang quy đổi GPA' });
    } finally {
      setGpaSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-6">
      <PageTitle>Chương trình đào tạo & Môn học</PageTitle>

      {msg && (
        <div className={`p-4 rounded-xl text-sm border ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cột trái: Chọn chương trình đào tạo */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-800 mb-3">Chương trình đào tạo</h3>
            {curricula.length === 0 ? <Empty msg="Chưa có CTĐT" /> : (
              <ul className="space-y-2 text-sm">
                {curricula.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => { setSelected(c); setMsg(null); }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selected?.id === c.id
                          ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{c.faculty ?? '-'} · Khóa {c.academicYear ?? '-'}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Cột phải: Chi tiết CTĐT & Cấu hình */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 gap-4 mb-2">
                <button onClick={() => setActiveTab('courses')}
                  className={`pb-3 text-sm font-semibold relative ${
                    activeTab === 'courses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  Môn học của CTĐT
                </button>
                <button onClick={() => setActiveTab('grading')}
                  className={`pb-3 text-sm font-semibold relative ${
                    activeTab === 'grading' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  Cấu hình điểm & GPA
                </button>
              </div>

              {/* Tab content: Courses */}
              {activeTab === 'courses' && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">Danh sách môn học ({courses.length})</h3>
                    <Pill color="indigo">Khóa {selected.academicYear}</Pill>
                  </div>
                  {courses.length === 0 ? <Empty msg="Chưa có môn học" /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                          <tr>
                            <th className="text-left p-3">Mã môn</th>
                            <th className="text-left p-3">Tên môn</th>
                            <th className="text-center p-3">Tín chỉ</th>
                            <th className="text-left p-3">Môn tiên quyết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses.map((c) => (
                            <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-blue-600">{c.code}</td>
                              <td className="p-3 text-slate-800">{c.title}</td>
                              <td className="p-3 text-center text-slate-600">{c.credit}</td>
                              <td className="p-3 text-slate-400">
                                <span>-</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {/* Tab content: Grading & GPA */}
              {activeTab === 'grading' && (
                <div className="space-y-6">
                  {/* Trọng số điểm */}
                  <Card>
                    <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Cấu hình trọng số điểm {policy ? "(Đã thiết lập)" : "(Mặc định)"}</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Chuyên cần (%)</label>
                        <input type="number" min="0" max="100" value={attendancePercent} onChange={(e) => setAttendancePercent(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Giữa kỳ (%)</label>
                        <input type="number" min="0" max="100" value={midtermPercent} onChange={(e) => setMidtermPercent(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Cuối kỳ (%)</label>
                        <input type="number" min="0" max="100" value={finalPercent} onChange={(e) => setFinalPercent(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg mb-4">
                      <span className="text-xs text-slate-500">Tổng trọng số: <span className={`font-bold ${attendancePercent + midtermPercent + finalPercent === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>{attendancePercent + midtermPercent + finalPercent}%</span></span>
                      <span className="text-xs text-slate-400">Yêu cầu: 100%</span>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handleSavePolicy} disabled={policySaving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm">
                        {policySaving ? 'Đang lưu...' : 'Lưu trọng số'}
                      </button>
                    </div>
                  </Card>

                  {/* Thang quy đổi GPA */}
                  <Card>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <h3 className="font-bold text-slate-800">Thang quy đổi GPA hệ 4</h3>
                      <button onClick={handleAddGpaRule}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-50 transition">
                        + Thêm dòng
                      </button>
                    </div>
                    
                    {gpaRules.length === 0 ? (
                      <div className="text-center p-6 text-slate-400 text-xs">Chưa cấu hình thang quy đổi nào</div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-500 px-3">
                          <div className="col-span-2">Thứ tự</div>
                          <div className="col-span-5">Ngưỡng điểm hệ 10 (đóng)</div>
                          <div className="col-span-4">GPA hệ 4</div>
                          <div className="col-span-1"></div>
                        </div>
                        {gpaRules.map((rule, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                            <div className="col-span-2 font-mono text-center text-xs text-slate-500">{rule.sortOrder}</div>
                            <div className="col-span-5">
                              <input type="number" step="0.1" min="0" max="10" value={rule.minScore10} onChange={(e) => handleGpaRuleChange(idx, 'minScore10', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="col-span-4">
                              <input type="number" step="0.01" min="0" max="4" value={rule.gpa4} onChange={(e) => handleGpaRuleChange(idx, 'gpa4', Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="col-span-1 text-right">
                              <button onClick={() => handleRemoveGpaRule(idx)} className="text-rose-600 hover:text-rose-500 text-sm font-semibold p-1">
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <button onClick={handleSaveGpaRules} disabled={gpaSaving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm">
                        {gpaSaving ? 'Đang lưu...' : 'Lưu thang quy đổi'}
                      </button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
              Vui lòng chọn một chương trình đào tạo để thiết lập
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
