import { useEffect, useState, useCallback } from 'react';
import * as curriculumService from '../../services/curriculumService';
import { getDepartments, type DepartmentResponse } from '../../services/departmentService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { Curriculum, Course, Prerequisite } from '../../types';

export default function AdminCurricula() {
  const [activeTab, setActiveTab] = useState<'COURSES' | 'CURRICULA'>('COURSES');
  
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Courses state
  const [searchCourse, setSearchCourse] = useState('');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    credit: 3,
    description: '',
  });
  const [submittingCourse, setSubmittingCourse] = useState(false);

  // Curricula state
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [curriculumCourses, setCurriculumCourses] = useState<Course[]>([]);
  const [loadingCurrCourses, setLoadingCurrCourses] = useState(false);
  const [showCurrModal, setShowCurrModal] = useState(false);
  const [currModalMode, setCurrModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingCurr, setEditingCurr] = useState<Curriculum | null>(null);
  const [currForm, setCurrForm] = useState({
    name: '',
    faculty: '',
    academicYear: '',
  });
  const [submittingCurr, setSubmittingCurr] = useState(false);
  const [addCourseId, setAddCourseId] = useState<string>('');

  // Prerequisites state
  const [prereqCourse, setPrereqCourse] = useState<Course | null>(null);
  const [prereqs, setPrereqs] = useState<Prerequisite[]>([]);
  const [loadingPrereqs, setLoadingPrereqs] = useState(false);
  const [addPrereqCourseId, setAddPrereqCourseId] = useState<string>('');

  // Initial Load
  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [cuList, coList, depList] = await Promise.all([
        curriculumService.getCurricula(),
        curriculumService.getAllCourses(),
        getDepartments().catch(() => []),
      ]);
      setCurricula(cuList);
      setCourses(coList);
      setDepartments(depList);
      if (cuList.length > 0 && !selectedCurriculum) {
        setSelectedCurriculum(cuList[0]);
      }
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [selectedCurriculum]);

  useEffect(() => {
    loadInitial();
  }, []);

  // Load courses of selected curriculum
  const loadCurriculumCourses = useCallback(async (currId: number) => {
    setLoadingCurrCourses(true);
    try {
      const list = await curriculumService.getCoursesByCurriculum(currId);
      setCurriculumCourses(list);
    } catch {
      setCurriculumCourses([]);
    } finally {
      setLoadingCurrCourses(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCurriculum) {
      loadCurriculumCourses(selectedCurriculum.id);
    }
  }, [selectedCurriculum, loadCurriculumCourses]);

  // Load Prerequisites
  const loadPrerequisites = async (courseId: number) => {
    setLoadingPrereqs(true);
    try {
      const list = await curriculumService.getPrerequisites(courseId);
      setPrereqs(list);
    } catch {
      setPrereqs([]);
    } finally {
      setLoadingPrereqs(false);
    }
  };

  // --- Course Handlers ---
  const openCreateCourse = () => {
    setCourseModalMode('CREATE');
    setEditingCourse(null);
    setCourseForm({ code: '', title: '', credit: 3, description: '' });
    setShowCourseModal(true);
  };

  const openEditCourse = (c: Course) => {
    setCourseModalMode('EDIT');
    setEditingCourse(c);
    setCourseForm({
      code: c.code || '',
      title: c.title || '',
      credit: c.credit || 3,
      description: c.description || '',
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code.trim() || !courseForm.title.trim()) return;
    setSubmittingCourse(true);
    setMsg(null);
    try {
      if (courseModalMode === 'CREATE') {
        await curriculumService.createCourse({
          code: courseForm.code.trim(),
          title: courseForm.title.trim(),
          credit: Number(courseForm.credit),
          description: courseForm.description.trim() || undefined,
        });
        setMsg(`Thêm môn học "${courseForm.title}" thành công.`);
      } else if (editingCourse) {
        await curriculumService.updateCourse(editingCourse.id, {
          code: courseForm.code.trim(),
          title: courseForm.title.trim(),
          credit: Number(courseForm.credit),
          description: courseForm.description.trim() || undefined,
        });
        setMsg(`Cập nhật môn học "${courseForm.title}" thành công.`);
      }
      setShowCourseModal(false);
      const coList = await curriculumService.getAllCourses();
      setCourses(coList);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Lưu môn học thất bại.');
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (c: Course) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa môn học "${c.title}" (${c.code})?`)) return;
    try {
      await curriculumService.deleteCourse(c.id);
      setMsg(`Xóa môn học "${c.title}" thành công.`);
      const coList = await curriculumService.getAllCourses();
      setCourses(coList);
      if (selectedCurriculum) {
        loadCurriculumCourses(selectedCurriculum.id);
      }
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Xóa môn học thất bại.');
    }
  };

  // --- Curriculum Handlers ---
  const openCreateCurr = () => {
    setCurrModalMode('CREATE');
    setEditingCurr(null);
    setCurrForm({
      name: '',
      faculty: departments.length > 0 ? departments[0].name : '',
      academicYear: '2024-2028',
    });
    setShowCurrModal(true);
  };

  const openEditCurr = (c: Curriculum) => {
    setCurrModalMode('EDIT');
    setEditingCurr(c);
    setCurrForm({
      name: c.name || '',
      faculty: c.faculty || (departments.length > 0 ? departments[0].name : ''),
      academicYear: c.academicYear || '',
    });
    setShowCurrModal(true);
  };

  const handleSaveCurr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currForm.name.trim()) return;
    setSubmittingCurr(true);
    setMsg(null);
    try {
      if (currModalMode === 'CREATE') {
        const created = await curriculumService.createCurriculum({
          name: currForm.name.trim(),
          faculty: currForm.faculty.trim() || undefined,
          academicYear: currForm.academicYear.trim() || undefined,
        });
        setMsg(`Tạo chương trình đào tạo "${created.name}" thành công.`);
      } else if (editingCurr) {
        const updated = await curriculumService.updateCurriculum(editingCurr.id, {
          name: currForm.name.trim(),
          faculty: currForm.faculty.trim() || undefined,
          academicYear: currForm.academicYear.trim() || undefined,
        });
        setMsg(`Cập nhật chương trình đào tạo "${updated.name}" thành công.`);
      }
      setShowCurrModal(false);
      const cuList = await curriculumService.getCurricula();
      setCurricula(cuList);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Lưu CTĐT thất bại.');
    } finally {
      setSubmittingCurr(false);
    }
  };

  const handleDeleteCurr = async (c: Curriculum) => {
    if (!confirm(`Xóa chương trình đào tạo "${c.name}"?`)) return;
    try {
      await curriculumService.deleteCurriculum(c.id);
      setMsg(`Xóa CTĐT "${c.name}" thành công.`);
      const cuList = await curriculumService.getCurricula();
      setCurricula(cuList);
      if (selectedCurriculum?.id === c.id) {
        setSelectedCurriculum(cuList[0] || null);
      }
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Xóa CTĐT thất bại.');
    }
  };

  // --- Curriculum Courses Handlers ---
  const handleAddCourseToCurr = async () => {
    if (!selectedCurriculum || !addCourseId) return;
    try {
      await curriculumService.addCourseToCurriculum(selectedCurriculum.id, Number(addCourseId));
      setAddCourseId('');
      loadCurriculumCourses(selectedCurriculum.id);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Gán môn học thất bại.');
    }
  };

  const handleRemoveCourseFromCurr = async (courseId: number) => {
    if (!selectedCurriculum) return;
    if (!confirm('Bạn có chắc muốn gỡ môn học này khỏi chương trình đào tạo?')) return;
    try {
      await curriculumService.removeCourseFromCurriculum(selectedCurriculum.id, courseId);
      loadCurriculumCourses(selectedCurriculum.id);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Gỡ môn học thất bại.');
    }
  };

  // --- Prerequisite Handlers ---
  const openPrereqModal = (c: Course) => {
    setPrereqCourse(c);
    setAddPrereqCourseId('');
    loadPrerequisites(c.id);
  };

  const handleAddPrereq = async () => {
    if (!prereqCourse || !addPrereqCourseId) return;
    try {
      await curriculumService.addPrerequisite(prereqCourse.id, Number(addPrereqCourseId));
      setAddPrereqCourseId('');
      loadPrerequisites(prereqCourse.id);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Thêm môn tiên quyết thất bại.');
    }
  };

  const handleRemovePrereq = async (prereqId: number) => {
    if (!prereqCourse) return;
    try {
      await curriculumService.removePrerequisite(prereqCourse.id, prereqId);
      loadPrerequisites(prereqCourse.id);
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Xóa môn tiên quyết thất bại.');
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!searchCourse.trim()) return true;
    const kw = searchCourse.trim().toLowerCase();
    return c.code.toLowerCase().includes(kw) || c.title.toLowerCase().includes(kw);
  });

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-4">
      <PageTitle>Quản lý Môn học & Chương trình đào tạo</PageTitle>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-4 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('COURSES')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'COURSES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Môn học ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CURRICULA')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'CURRICULA'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Chương trình đào tạo ({curricula.length})
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {msg}
        </div>
      )}

      {/* TAB 1: DANH SÁCH MÔN HỌC */}
      {activeTab === 'COURSES' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={searchCourse}
              onChange={(e) => setSearchCourse(e.target.value)}
              placeholder="Tìm theo mã hoặc tên môn học..."
              className="w-full sm:w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={openCreateCourse}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              + Thêm môn học mới
            </button>
          </div>

          <Card>
            {filteredCourses.length === 0 ? (
              <Empty msg="Chưa có môn học nào" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="text-left p-3">Mã môn</th>
                      <th className="text-left p-3">Tên môn học</th>
                      <th className="text-center p-3">Số tín chỉ</th>
                      <th className="text-left p-3">Mô tả</th>
                      <th className="text-center p-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono font-semibold text-indigo-600">{c.code}</td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{c.title}</td>
                        <td className="p-3 text-center">
                          <Pill color="indigo">{c.credit} TC</Pill>
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{c.description || '-'}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openPrereqModal(c)}
                              className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
                            >
                              Môn tiên quyết
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCourse(c)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(c)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: CHƯƠNG TRÌNH ĐÀO TẠO */}
      {activeTab === 'CURRICULA' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cột trái: Danh sách CTĐT */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Danh sách CTĐT</h3>
              <button
                type="button"
                onClick={openCreateCurr}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition"
              >
                + Tạo CTĐT
              </button>
            </div>

            <Card className="p-3">
              {curricula.length === 0 ? (
                <Empty msg="Chưa có CTĐT" />
              ) : (
                <div className="space-y-2">
                  {curricula.map((cu) => (
                    <div
                      key={cu.id}
                      onClick={() => setSelectedCurriculum(cu)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedCurriculum?.id === cu.id
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{cu.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {cu.faculty || 'Chưa xếp Khoa'} · {cu.academicYear || 'Toàn khóa'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openEditCurr(cu)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition"
                          title="Sửa CTĐT"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCurr(cu)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Xóa CTĐT"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Cột phải: Môn học trong CTĐT được chọn */}
          <div className="lg:col-span-2 space-y-3">
            {selectedCurriculum ? (
              <Card>
                <div className="border-b border-slate-100 pb-3 mb-4 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">
                    Môn học thuộc: <span className="text-indigo-600">{selectedCurriculum.name}</span>
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Khoa: {selectedCurriculum.faculty || '-'} | Niên khóa: {selectedCurriculum.academicYear || '-'}
                  </div>
                </div>

                {/* Gán môn học mới vào CTĐT */}
                <div className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <select
                    value={addCourseId}
                    onChange={(e) => setAddCourseId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">-- Chọn môn học để gán vào CTĐT --</option>
                    {courses
                      .filter((c) => !curriculumCourses.some((cc) => cc.id === c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.title} ({c.credit} tín chỉ)
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCourseToCurr}
                    disabled={!addCourseId}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition"
                  >
                    + Gán vào CTĐT
                  </button>
                </div>

                {loadingCurrCourses ? (
                  <Spinner />
                ) : curriculumCourses.length === 0 ? (
                  <Empty msg="Chương trình đào tạo này chưa có môn học nào" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="text-left p-3">Mã môn</th>
                          <th className="text-left p-3">Tên môn học</th>
                          <th className="text-center p-3">Tín chỉ</th>
                          <th className="text-center p-3">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {curriculumCourses.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                            <td className="p-3 font-mono font-semibold text-indigo-600">{c.code}</td>
                            <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{c.title}</td>
                            <td className="p-3 text-center">
                              <Pill color="indigo">{c.credit} TC</Pill>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveCourseFromCurr(c.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Gỡ khỏi CTĐT
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <Empty msg="Vui lòng chọn một Chương trình đào tạo ở danh sách bên trái" />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Môn học */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {courseModalMode === 'CREATE' ? 'Thêm môn học mới' : 'Chỉnh sửa môn học'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  placeholder="Ví dụ: IT101"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Ví dụ: Nhập môn lập trình"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số tín chỉ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={courseForm.credit}
                  onChange={(e) => setCourseForm({ ...courseForm, credit: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Mô tả nội dung môn học..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCourse}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingCourse ? 'Đang lưu...' : courseModalMode === 'CREATE' ? 'Thêm mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Chương trình đào tạo */}
      {showCurrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {currModalMode === 'CREATE' ? 'Tạo chương trình đào tạo' : 'Chỉnh sửa CTĐT'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCurrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCurr} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên chương trình đào tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currForm.name}
                  onChange={(e) => setCurrForm({ ...currForm, name: e.target.value })}
                  placeholder="Ví dụ: Công nghệ thông tin 2024"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Khoa / Bộ môn
                </label>
                {departments.length > 0 ? (
                  <select
                    value={currForm.faculty}
                    onChange={(e) => setCurrForm({ ...currForm, faculty: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">-- Chọn Khoa / Bộ môn --</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.name}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={currForm.faculty}
                    onChange={(e) => setCurrForm({ ...currForm, faculty: e.target.value })}
                    placeholder="Ví dụ: Công nghệ thông tin"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Khóa / Năm học
                </label>
                <input
                  type="text"
                  value={currForm.academicYear}
                  onChange={(e) => setCurrForm({ ...currForm, academicYear: e.target.value })}
                  placeholder="Ví dụ: 2024-2028"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCurrModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCurr}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingCurr ? 'Đang lưu...' : currModalMode === 'CREATE' ? 'Tạo mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quản lý Môn tiên quyết */}
      {prereqCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Môn học tiên quyết của: <span className="text-purple-600">{prereqCourse.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPrereqCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Form thêm môn tiên quyết */}
              <div className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <select
                  value={addPrereqCourseId}
                  onChange={(e) => setAddPrereqCourseId(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">-- Chọn môn tiên quyết cần có --</option>
                  {courses
                    .filter((c) => c.id !== prereqCourse.id && !prereqs.some((p) => p.prerequisiteCourseId === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddPrereq}
                  disabled={!addPrereqCourseId}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition"
                >
                  + Thêm tiên quyết
                </button>
              </div>

              {/* Danh sách môn tiên quyết */}
              {loadingPrereqs ? (
                <Spinner />
              ) : prereqs.length === 0 ? (
                <Empty msg="Môn học này không có môn tiên quyết nào" />
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {prereqs.map((p) => {
                    const matchedCourse = courses.find((c) => c.id === p.prerequisiteCourseId);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                            {matchedCourse ? `${matchedCourse.code} - ${matchedCourse.title}` : `Môn học #${p.prerequisiteCourseId}`}
                          </div>
                          <div className="text-xs text-slate-400">Yêu cầu học xong môn này trước</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePrereq(p.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                        >
                          Xóa
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPrereqCourse(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
