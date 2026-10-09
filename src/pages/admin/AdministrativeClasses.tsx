import { useEffect, useState } from 'react';
import { Eye, Edit3, Trash2, Plus, Users, Search, Building2 } from 'lucide-react';
import * as acService from '../../services/adminClassService';
import { listLecturers } from '../../services/adminService';
import { getDepartments, type DepartmentResponse } from '../../services/departmentService';
import { getCurricula } from '../../services/curriculumService';
import { PageHeader, Card, Button, Input, Select, Badge, Modal, Spinner, Empty, ErrorBox } from '../../components/ui';
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
      setErr((e as { message?: string })?.message ?? 'Lưu lớp hành chính thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Lớp hành chính này? Sinh viên thuộc lớp sẽ mất thông tin liên kết lớp.')) return;
    try {
      await acService.deleteAdminClass(id);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Xóa lớp thất bại');
    }
  };

  const handleViewStudents = async (c: AdminClassResponse) => {
    setSelectedClassObj(c);
    setShowStudentDrawer(true);
    setLoadingStudents(true);
    setStudentSearchKw('');
    try {
      const studList = await acService.getStudentsByAdminClass(c.id);
      setSelectedStudents(studList);
    } catch {
      setSelectedStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  if (loading) return <Spinner />;
  if (err && !classes.length) return <ErrorBox message={err} />;

  const filteredStudents = selectedStudents.filter((s) =>
    (s.fullName && s.fullName.toLowerCase().includes(studentSearchKw.toLowerCase())) ||
    (s.studentCode && s.studentCode.toLowerCase().includes(studentSearchKw.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(studentSearchKw.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Quản lý Lớp hành chính' }]}
        title="Quản lý Lớp Hành chính"
        subtitle="Tạo danh sách lớp sinh viên niên chế, gán Giáo viên Chủ nhiệm (GVCN) và Khung chương trình đào tạo"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Thêm Lớp mới
          </Button>
        }
      />

      {err && <ErrorBox message={err} />}

      {showForm && (
        <Card>
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">
            {editId ? 'Sửa thông tin Lớp hành chính' : 'Tạo Lớp hành chính mới'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên lớp hành chính *</label>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="VD: 62PM1, CNTT1-K62"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khoa / Bộ môn</label>
              {departments.length > 0 ? (
                <Select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  options={[
                    { label: '-- Chọn Khoa --', value: '' },
                    ...departments.map(d => ({ label: d.name, value: d.name }))
                  ]}
                />
              ) : (
                <Input
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="Công nghệ thông tin"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giáo viên chủ nhiệm (GVCN)</label>
              <Select
                value={homeroomTeacherId}
                onChange={(e) => setHomeroomTeacherId(e.target.value)}
                options={[
                  { label: '-- Chưa gán GVCN --', value: '' },
                  ...lecturers.map(l => ({ label: `${l.fullName} (${l.email})`, value: String(l.id) }))
                ]}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khung chương trình đào tạo</label>
              <Select
                value={curriculumId}
                onChange={(e) => setCurriculumId(e.target.value)}
                options={[
                  { label: '-- Chưa gắn chương trình --', value: '' },
                  ...curricula.map(c => ({ label: `${c.name} (${c.academicYear || ''})`, value: String(c.id) }))
                ]}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Khóa / Năm học</label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="VD: 2024-2028 (K62)"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={cancel}>Huỷ</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-navy-700 dark:text-navy-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Danh sách Lớp Hành chính ({classes.length})
            </h3>
          </div>
        </div>

        {classes.length === 0 ? (
          <Empty msg="Chưa có lớp hành chính nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tên Lớp HC</th>
                  <th className="py-3.5 px-4">Khoa / Bộ môn</th>
                  <th className="py-3.5 px-4">GVCN Phụ trách</th>
                  <th className="py-3.5 px-4">Chương trình đào tạo</th>
                  <th className="py-3.5 px-4 text-center">Khóa học</th>
                  <th className="py-3.5 px-4 text-center">Sĩ số</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-900 dark:text-navy-300">{c.className}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{c.faculty || c.facultyName || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {c.homeroomTeacherName ? (
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{c.homeroomTeacherName}</span>
                      ) : (
                        <span className="italic text-amber-600 dark:text-amber-400">Chưa phân công</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{c.curriculumName || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="neutral">{c.academicYear || '-'}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="info">
                        <Users className="w-3 h-3 mr-1" /> {c.studentCount ?? 0} SV
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => void handleViewStudents(c)}>
                        <Eye className="w-3.5 h-3.5 text-navy-700 dark:text-navy-300" /> SV
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Edit3 className="w-3.5 h-3.5" /> Sửa
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Drawer xem danh sách sinh viên */}
      <Modal
        isOpen={showStudentDrawer}
        onClose={() => setShowStudentDrawer(false)}
        title={`Danh sách Sinh viên Lớp: ${selectedClassObj?.className || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div className="w-full">
            <Input
              value={studentSearchKw}
              onChange={(e) => setStudentSearchKw(e.target.value)}
              placeholder="Tìm kiếm theo mã SV, họ tên, email..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {loadingStudents ? (
            <Spinner />
          ) : filteredStudents.length === 0 ? (
            <Empty msg="Không tìm thấy sinh viên nào thuộc lớp này" />
          ) : (
            <div className="overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Mã SV</th>
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-semibold text-navy-900 dark:text-navy-300">{s.studentCode || '-'}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{s.fullName}</td>
                      <td className="p-3 text-slate-500">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setShowStudentDrawer(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
