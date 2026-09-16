import { useEffect, useState } from 'react';
import * as curriculumService from '../../services/curriculumService';
import { removeCourseFromCurriculum, addCourseToCurriculum } from '../../services/curriculumService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { Curriculum, Course, GradingPolicy, GpaScaleRule } from '../../types';

export default function AdminCurricula() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Curriculum | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'grading'>('courses');
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseCredit, setEditCourseCredit] = useState(3);
  const [courseSaving, setCourseSaving] = useState(false);

  
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

  // Sprint 2: Add/remove course from curriculum
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<number | null>(null);
  const [addingCourse, setAddingCourse] = useState(false);
  const [curriculumCourses, setCurriculumCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

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
      .catch((e) => m && setErr((e as { message?: string })?.message ?? 'Lá»—i táº£i dá»¯ liá»‡u'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);

    const loadCurriculumCourses = async () => {
    if (!selected) return;
    setLoadingCourses(true);
    try {
      const cs = await curriculumService.getCoursesByCurriculum(selected.id);
      setCurriculumCourses(cs);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'KhĂ´ng táº£i Ä‘Æ°á»£c mĂ´n há»c cá»§a CTÄT');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleRemoveFromCurriculum = async (courseId: number) => {
    if (!selected || !confirm('Báº¡n cĂ³ cháº¯c muá»‘n xoĂ¡ mĂ´n há»c nĂ y khá»i CTÄT?')) return;
    try {
      await removeCourseFromCurriculum(selected.id, courseId);
      setMsg({ type: 'success', text: 'ÄĂ£ xoĂ¡ mĂ´n khá»i CTÄT' });
      loadCurriculumCourses();
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'XoĂ¡ khá»i CTÄT tháº¥t báº¡i' });
    }
  };

  const openAddCourseModal = () => {
    // Get courses not in this curriculum
    const available = courses.filter(c => !curriculumCourses.some(cc => cc.id === c.id));
    if (available.length === 0) {
      setMsg({ type: 'error', text: 'KhĂ´ng cĂ²n mĂ´n há»c nĂ o Ä‘á»ƒ thĂªm' });
      return;
    }
    setShowAddCourseModal(true);
  };

  const handleAddToCurriculum = async () => {
    if (!selected || !selectedCourseToAdd) return;
    setAddingCourse(true);
    try {
      await addCourseToCurriculum(selected.id, selectedCourseToAdd);
      setMsg({ type: 'success', text: 'ÄĂ£ thĂªm mĂ´n vĂ o CTÄT' });
      setShowAddCourseModal(false);
      setSelectedCourseToAdd(null);
      loadCurriculumCourses();
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'ThĂªm vĂ o CTÄT tháº¥t báº¡i' });
    } finally {
      setAddingCourse(false);
    }
  };

  // Override selected curriculum effect to load curriculum-specific courses
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
      setMsg({ type: 'error', text: `Tá»•ng trá»ng sá»‘ pháº£i báº±ng 100% (Hiá»‡n táº¡i lĂ : ${total}%)` });
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
      setMsg({ type: 'success', text: 'LÆ°u cĂ´ng thá»©c tĂ­nh Ä‘iá»ƒm thĂ nh cĂ´ng!' });
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ lÆ°u cĂ´ng thá»©c tĂ­nh Ä‘iá»ƒm' });
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
        setMsg({ type: 'error', text: `DĂ²ng ${i + 1}: NgÆ°á»¡ng Ä‘iá»ƒm há»‡ 10 pháº£i tá»« 0 Ä‘áº¿n 10` });
        return;
      }
      if (r.gpa4 < 0 || r.gpa4 > 4) {
        setMsg({ type: 'error', text: `DĂ²ng ${i + 1}: Äiá»ƒm GPA há»‡ 4 pháº£i tá»« 0 Ä‘áº¿n 4` });
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
      setMsg({ type: 'success', text: 'LÆ°u thang quy Ä‘á»•i GPA thĂ nh cĂ´ng!' });
    } catch (e: unknown) {
      setMsg({ type: 'error', text: (e as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ lÆ°u thang quy Ä‘á»•i GPA' });
    } finally {
      setGpaSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  const startEditCourse = (course: Course) => {
    setEditCourseId(course.id);
    setEditCourseCode(course.code);
    setEditCourseTitle(course.title);
    setEditCourseCredit(course.credit);
  };

  const cancelEditCourse = () => {
    setEditCourseId(null);
    setEditCourseCode('');
    setEditCourseTitle('');
    setEditCourseCredit(3);
  };

  const handleSaveEditCourse = async () => {
    if (!editCourseId || !editCourseCode.trim() || !editCourseTitle.trim()) return;
    setCourseSaving(true);
    try {
      // edit course
      cancelEditCourse();
      if (selected?.id) { const list = await curriculumService.getCoursesByCurriculum(selected.id); setCourses(list); }
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Cáº­p nháº­t mĂ´n há»c tháº¥t báº¡i.');
    } finally {
      setCourseSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Báº¡n cĂ³ cháº¯c muá»‘n xoĂ¡ mĂ´n há»c nĂ y?')) return;
    try {
      await curriculumService.deleteCourse(courseId);
      if (selected?.id) { const list = await curriculumService.getCoursesByCurriculum(selected.id); setCourses(list); }
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'XoĂ¡ mĂ´n há»c tháº¥t báº¡i.');
    }
  };


  return (
    <div className="space-y-6">
      {/* Sprint 2: Add Course to Curriculum Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddCourseModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">ThĂªm mĂ´n há»c vĂ o CTÄT</h2>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1">Chá»n mĂ´n há»c</label>
              <select value={selectedCourseToAdd ?? ''} onChange={(e) => setSelectedCourseToAdd(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
                <option value="">-- Chá»n mĂ´n há»c --</option>
                {courses.filter(c => !curriculumCourses.some(cc => cc.id === c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title} ({c.credit} TC)</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button aria-label="button" onClick={() => setShowAddCourseModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Huá»·</button>
              <button aria-label="button" onClick={handleAddToCurriculum} disabled={addingCourse || !selectedCourseToAdd}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                {addingCourse ? 'Äang thĂªm...' : 'ThĂªm vĂ o CTÄT'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sprint 2: Add Course to Curriculum Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddCourseModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">ThĂªm mĂ´n há»c vĂ o CTÄT</h2>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1">Chá»n mĂ´n há»c</label>
              <select value={selectedCourseToAdd ?? ''} onChange={(e) => setSelectedCourseToAdd(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
                <option value="">-- Chá»n mĂ´n há»c --</option>
                {courses.filter(c => !curriculumCourses.some(cc => cc.id === c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.title} ({c.credit} TC)</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button aria-label="button" onClick={() => setShowAddCourseModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Huá»·</button>
              <button aria-label="button" onClick={handleAddToCurriculum} disabled={addingCourse || !selectedCourseToAdd}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                {addingCourse ? 'Äang thĂªm...' : 'ThĂªm vĂ o CTÄT'}
              </button>
            </div>
          </div>
        </div>
      )}
      <PageTitle>ChÆ°Æ¡ng trĂ¬nh Ä‘Ă o táº¡o & MĂ´n há»c</PageTitle>

      {msg && (
        <div className={`p-4 rounded-xl text-sm border ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cá»™t trĂ¡i: Chá»n chÆ°Æ¡ng trĂ¬nh Ä‘Ă o táº¡o */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-800 mb-3">ChÆ°Æ¡ng trĂ¬nh Ä‘Ă o táº¡o</h3>
            {curricula.length === 0 ? <Empty msg="ChÆ°a cĂ³ CTÄT" /> : (
              <ul className="space-y-2 text-sm">
                {curricula.map((c) => (
                  <li key={c.id}>
                    <button aria-label="button" onClick={() => { setSelected(c); setMsg(null); }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selected?.id === c.id
                          ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{c.faculty ?? '-'} Â· KhĂ³a {c.academicYear ?? '-'}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Cá»™t pháº£i: Chi tiáº¿t CTÄT & Cáº¥u hĂ¬nh */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 gap-4 mb-2">
                <button aria-label="button" onClick={() => setActiveTab('courses')}
                  className={`pb-3 text-sm font-semibold relative ${
                    activeTab === 'courses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  MĂ´n há»c cá»§a CTÄT
                </button>
                <button aria-label="button" onClick={() => setActiveTab('grading')}
                  className={`pb-3 text-sm font-semibold relative ${
                    activeTab === 'grading' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  Cáº¥u hĂ¬nh Ä‘iá»ƒm & GPA
                </button>
              </div>

              {/* Tab content: Courses */}
              {activeTab === 'courses' && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">Danh sĂ¡ch mĂ´n há»c ({curriculumCourses.length})</h3>
                    <div className="flex items-center gap-2">
                      <Pill color="indigo">KhĂ³a {selected.academicYear}</Pill>
                      <button aria-label="button" onClick={openAddCourseModal} disabled={loadingCourses}
                        className="px-3 py-1.5 rounded text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-50">
                        + ThĂªm mĂ´n
                      </button>
                    </div>
                  </div>
                  {courses.length === 0 ? <Empty msg="ChÆ°a cĂ³ mĂ´n há»c" /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                          <tr>
                            <th className="text-left p-3">MĂ£ mĂ´n</th>
                            <th className="text-left p-3">TĂªn mĂ´n</th>
                            <th className="text-center p-3">TĂ­n chá»‰</th>
                            <th className="text-left p-3">MĂ´n tiĂªn quyáº¿t</th>
                            <th className="text-center p-3">Thao tĂ¡c</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingCourses ? (
                            <tr><td colSpan={5} className="text-center p-6 text-slate-400">Äang táº£i...</td></tr>
                          ) : curriculumCourses.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-6 text-slate-400">ChÆ°a cĂ³ mĂ´n há»c trong CTÄT nĂ y</td></tr>
                          ) : (
                            curriculumCourses.map((c) => (
                              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="p-3">{editCourseId === c.id ? <input value={editCourseCode} onChange={e=>setEditCourseCode(e.target.value)} className="w-24 px-2 py-1 border border-amber-300 rounded text-xs font-mono focus:ring-amber-400 focus:border-amber-400" /> : <span className="font-mono text-blue-600">{c.code}</span>}</td>
                                <td className="p-3">{editCourseId === c.id ? <input value={editCourseTitle} onChange={e=>setEditCourseTitle(e.target.value)} className="w-48 px-2 py-1 border border-amber-300 rounded text-xs focus:ring-amber-400 focus:border-amber-400" /> : <span className="text-slate-800">{c.title}</span>}</td>
                                <td className="p-3 text-center">{editCourseId === c.id ? <input type="number" min="1" max="10" value={editCourseCredit} onChange={e=>setEditCourseCredit(Number(e.target.value))} className="w-16 px-2 py-1 border border-amber-300 rounded text-xs text-center focus:ring-amber-400 focus:border-amber-400" /> : <span className="text-slate-600">{c.credit}</span>}</td>
                                <td className="p-3 text-slate-400"><span>-</span></td>
                                <td className="p-3 text-center space-x-1">
                                  {editCourseId === c.id ? (
                                    <>
                                      <button aria-label="button" onClick={handleSaveEditCourse} disabled={courseSaving} className="px-2 py-1 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50">LÆ°u</button>
                                      <button aria-label="button" onClick={cancelEditCourse} className="px-2 py-1 rounded text-xs bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition">Huá»·</button>
                                    </>
                                  ) : (
                                    <>
                                      <button aria-label="button" onClick={()=>startEditCourse(c)} className="px-2 py-1 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition">Sá»­a</button>
                                      <button aria-label="button" onClick={()=>handleRemoveFromCurriculum(c.id)} className="px-2 py-1 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition" title="XoĂ¡ khá»i CTÄT">XoĂ¡ khá»i CTÄT</button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {/* Tab content: Grading & GPA */}
              {activeTab === 'grading' && (
                <div className="space-y-6">
                  {/* Trá»ng sá»‘ Ä‘iá»ƒm */}
                  <Card>
                    <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Cáº¥u hĂ¬nh trá»ng sá»‘ Ä‘iá»ƒm {policy ? "(ÄĂ£ thiáº¿t láº­p)" : "(Máº·c Ä‘á»‹nh)"}</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">ChuyĂªn cáº§n (%)</label>
                        <input type="number" min="0" max="100" value={attendancePercent} onChange={(e) => setAttendancePercent(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Giá»¯a ká»³ (%)</label>
                        <input type="number" min="0" max="100" value={midtermPercent} onChange={(e) => setMidtermPercent(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Cuá»‘i ká»³ (%)</label>
                        <input type="number" min="0" max="100" value={finalPercent} onChange={(e) => setFinalPercent(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg mb-4">
                      <span className="text-xs text-slate-500">Tá»•ng trá»ng sá»‘: <span className={`font-bold ${attendancePercent + midtermPercent + finalPercent === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>{attendancePercent + midtermPercent + finalPercent}%</span></span>
                      <span className="text-xs text-slate-400">YĂªu cáº§u: 100%</span>
                    </div>
                    <div className="flex justify-end">
                      <button aria-label="button" onClick={handleSavePolicy} disabled={policySaving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm">
                        {policySaving ? 'Äang lÆ°u...' : 'LÆ°u trá»ng sá»‘'}
                      </button>
                    </div>
                  </Card>

                  {/* Thang quy Ä‘á»•i GPA */}
                  <Card>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <h3 className="font-bold text-slate-800">Thang quy Ä‘á»•i GPA há»‡ 4</h3>
                      <button aria-label="button" onClick={handleAddGpaRule}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-50 transition">
                        + ThĂªm dĂ²ng
                      </button>
                    </div>
                    
                    {gpaRules.length === 0 ? (
                      <div className="text-center p-6 text-slate-400 text-xs">ChÆ°a cáº¥u hĂ¬nh thang quy Ä‘á»•i nĂ o</div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-500 px-3">
                          <div className="col-span-2">Thá»© tá»±</div>
                          <div className="col-span-5">NgÆ°á»¡ng Ä‘iá»ƒm há»‡ 10 (Ä‘Ă³ng)</div>
                          <div className="col-span-4">GPA há»‡ 4</div>
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
                              <button aria-label="button" onClick={() => handleRemoveGpaRule(idx)} className="text-rose-600 hover:text-rose-500 text-sm font-semibold p-1">
                                âœ•
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <button aria-label="button" onClick={handleSaveGpaRules} disabled={gpaSaving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm">
                        {gpaSaving ? 'Äang lÆ°u...' : 'LÆ°u thang quy Ä‘á»•i'}
                      </button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
              Vui lĂ²ng chá»n má»™t chÆ°Æ¡ng trĂ¬nh Ä‘Ă o táº¡o Ä‘á»ƒ thiáº¿t láº­p
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

