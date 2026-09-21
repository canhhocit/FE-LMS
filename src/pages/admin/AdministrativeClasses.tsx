import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, X, Plus, Users, GraduationCap, Building2, BookOpen } from 'lucide-react';
import * as acService from '../../services/adminClassService';
import { listLecturers } from '../../services/adminService';
import { getDepartments, type DepartmentResponse } from '../../services/departmentService';
import { getCurricula } from '../../services/curriculumService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { AdminClassResponse, AdminClassRequest } from '../../services/adminClassService';
import type { Curriculum, User } from '../../types';

export default function AdminAdministrativeClasses() {
  const [classes, setClasses] = useState<AdminClassResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [className, setClassName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [curriculumId, setCurriculumId] = useState<string>('');
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState('');
  const [saving, setSaving] = useState(false);

  // Student Drawer Modal State
  const [showStudentDrawer, setShowStudentDrawer] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const [selectedClassObj, setSelectedClassObj] = useState<AdminClassResponse | null>(null);
  const [studentSearchKw, setStudentSearchKw] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const load = async () => {
    try {
      const [classList, depList, currList, lecList] = await Promise.all([
        acService.getAllAdminClasses(),
        getDepartments().catch(() => []),
        getCurricula().catch(() => []),
        listLecturers().catch(() => []),
      ]);
      setClasses(classList);
      setDepartments(depList);
      setCurricula(currList);
      setLecturers(lecList);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [classList, depList, currList, lecList] = await Promise.all([
          acService.getAllAdminClasses(),
          getDepartments().catch(() => []),
          getCurricula().catch(() => []),
          listLecturers().catch(() => []),
        ]);
        if (mounted) {
          setClasses(classList);
          setDepartments(depList);
          setCurricula(currList);
          setLecturers(lecList);
        }
      } catch (e: unknown) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openCreate = () => {
    setEditId(null);
    setClassName('');
    setFaculty(departments.length > 0 ? departments[0].name : '');
    setCurriculumId(curricula.length > 0 ? String(curricula[0].id) : '');
    setHomeroomTeacherId('');
    setAcademicYear('2024-2028');
    setShowForm(true);
  };

  const openEdit = (c: AdminClassResponse) => {
    setEditId(c.id);
    setClassName(c.className);
    setFaculty(c.faculty || c.facultyName || (departments.length > 0 ? departments[0].name : ''));
    setCurriculumId(c.curriculumId ? String(c.curriculumId) : '');
    setHomeroomTeacherId(c.homeroomTeacherId ? String(c.homeroomTeacherId) : '');
    setAcademicYear(c.academicYear ?? '');
    setShowForm(true);
  };

  const cancel = () => setShowForm(false);

  const handleSave = async () => {
    if (!className.trim()) return;
    setSaving(true);
    try {
      const data: AdminClassRequest = {
        className: className.trim(),
        faculty: faculty.trim() || undefined,
        curriculumId: curriculumId ? Number(curriculumId) : undefined,
        homeroomTeacherId: homeroomTeacherId ? Number(homeroomTeacherId) : undefined,
        academicYear: academicYear.trim() || undefined,
      };
      if (editId) {
        await acService.updateAdminClass(editId, data);
      } else {
        await acService.createAdminClass(data);
      }
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá lớp hành chính này?')) return;
    try {
      await acService.deleteAdminClass(id);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Xoá thất bại');
    }
  };

  const openStudentDrawer = async (c: AdminClassResponse) => {
    setSelectedClassObj(c);
    setShowStudentDrawer(true);
    setLoadingStudents(true);
    setStudentSearchKw('');
    try {
      const students = await acService.getStudentsByAdminClass(c.id);
      setSelectedStudents(students);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được sinh viên');
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = selectedStudents.filter((s) => {
    if (!studentSearchKw.trim()) return true;
    const kw = studentSearchKw.toLowerCase();
    return (
      (s.fullName && s.fullName.toLowerCase().includes(kw)) ||
      (s.email && s.email.toLowerCase().includes(kw)) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(kw))
    );
  });

  if (loading) return <Spinner />;
  if (err && !classes.length) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <PageTitle>Quản lý Lớp hành chính</PageTitle>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo lớp mới
        </button>
      </div>

      {err && <div className="p-3 rounded-xl text-sm bg-rose-50 border border-rose-200 text-rose-700 font-medium">{err}</div>}

      {/* Form Tạo / Sửa Lớp */}
      {showForm && (
        <Card className="border border-indigo-100 bg-indigo-50/30">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            {editId ? 'Sửa lớp hành chính' : 'Tạo lớp hành chính mới'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên lớp <span className="text-rose-500">*</span></label>
              <input value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="VD: 62PM1" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Khóa / Năm học</label>
              <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="VD: 2024-2028" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Khoa / Bộ môn</label>
              {departments.length > 0 ? (
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Chọn Khoa / Bộ môn --</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.name}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="VD: Công nghệ thông tin" />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chương trình đào tạo (CTĐT)</label>
              <select
                value={curriculumId}
                onChange={(e) => setCurriculumId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Chọn Chương trình đào tạo --</option>
                {curricula.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.academicYear || 'Toàn khóa'})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Giảng viên chủ nhiệm (GVCN)</label>
              <select
                value={homeroomTeacherId}
                onChange={(e) => setHomeroomTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800"
              >
                <option value="">-- Chưa gán Giảng viên chủ nhiệm --</option>
                {lecturers.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.fullName || lec.email} {lec.lecturerCode ? `(${lec.lecturerCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={cancel} className="px-4 py-2 rounded-lg text-sm border border-neutral-300 text-slate-600 hover:bg-neutral-100 transition cursor-pointer">Huỷ</button>
            <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        {classes.length === 0 ? <Empty msg="Chưa có lớp hành chính" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="text-left p-3.5">Tên lớp</th>
                  <th className="text-left p-3.5">Khoa / Bộ môn</th>
                  <th className="text-left p-3.5">GVCN</th>
                  <th className="text-left p-3.5">Chương trình đào tạo</th>
                  <th className="text-center p-3.5">Khóa</th>
                  <th className="text-center p-3.5">Sĩ số</th>
                  <th className="text-center p-3.5">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50/70 transition">
                    <td className="p-3.5 font-bold text-indigo-700 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      {c.className}
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{c.faculty || c.facultyName || '-'}</td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {c.homeroomTeacherName || c.advisorName ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                          <Pill color="purple">GVCN: {c.homeroomTeacherName || c.advisorName}</Pill>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa gán</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {c.curriculumName ? <Pill color="indigo">{c.curriculumName}</Pill> : '-'}
                    </td>
                    <td className="p-3.5 text-center text-slate-500 font-medium">{c.academicYear || '-'}</td>
                    <td className="p-3.5 text-center">
                      <Pill color="indigo">{c.studentCount ?? 0} SV</Pill>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openStudentDrawer(c)}
                          title="Xem danh sách sinh viên"
                          className="p-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          title="Chỉnh sửa lớp"
                          className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          title="Xóa lớp"
                          className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Slide-over Student List Drawer / Modal */}
      {showStudentDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-neutral-200 dark:border-slate-800 flex flex-col transition-transform transform duration-300 ease-in-out">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between bg-neutral-50/80 dark:bg-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Danh sách sinh viên
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Lớp: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedClassObj?.className}</span> • Tổng số: <span className="font-bold">{selectedStudents.length}</span> SV
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStudentDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search */}
              <div className="p-4 border-b border-neutral-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <input
                  type="text"
                  value={studentSearchKw}
                  onChange={(e) => setStudentSearchKw(e.target.value)}
                  placeholder="Tìm sinh viên theo Tên, Email hoặc MSV..."
                  className="w-full px-3.5 py-2 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs bg-neutral-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {loadingStudents ? (
                  <div className="py-12 text-center"><Spinner /></div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    {studentSearchKw ? 'Không tìm thấy sinh viên phù hợp' : 'Lớp chưa có sinh viên nào'}
                  </div>
                ) : (
                  filteredStudents.map((s, i) => (
                    <div
                      key={s.id || i}
                      className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-slate-800 bg-neutral-50/60 dark:bg-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                          {(s.fullName || s.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {s.fullName || 'Chưa cập nhật tên'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {s.email}
                          </div>
                        </div>
                      </div>
                      {s.studentCode && (
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                          {s.studentCode}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowStudentDrawer(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
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
