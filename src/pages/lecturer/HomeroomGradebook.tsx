import React, { useState } from 'react';
import { Users, Upload, Save, Award, CheckCircle2, FileSpreadsheet, Search } from 'lucide-react';
import { PageHeader, Card, Button, Input, Badge } from '../../components/ui';

interface StudentTrainingScore {
  id: number;
  studentCode: string;
  fullName: string;
  className: string;
  gpa: number;
  trainingScore: number;
  classification: string;
}

const INITIAL_STUDENTS: StudentTrainingScore[] = [
  { id: 1, studentCode: 'SV001', fullName: 'Nguyen Van An', className: '62PM1', gpa: 8.75, trainingScore: 92, classification: 'Xuất sắc' },
  { id: 2, studentCode: 'SV002', fullName: 'Tran Thi Binh', className: '62PM1', gpa: 7.80, trainingScore: 85, classification: 'Tốt' },
  { id: 3, studentCode: 'SV003', fullName: 'Le Hoang Cuong', className: '62PM1', gpa: 6.90, trainingScore: 78, classification: 'Khá' },
  { id: 4, studentCode: 'SV004', fullName: 'Pham Minh Dung', className: '62PM1', gpa: 8.20, trainingScore: 88, classification: 'Tốt' },
  { id: 5, studentCode: 'SV005', fullName: 'Vo Thi Em', className: '62PM1', gpa: 5.40, trainingScore: 65, classification: 'Trung bình' },
];

export const HomeroomGradebook: React.FC = () => {
  const [students, setStudents] = useState<StudentTrainingScore[]>(INITIAL_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState('');

  const getClassification = (val: number) => {
    if (val >= 90) return 'Xuất sắc';
    if (val >= 80) return 'Tốt';
    if (val >= 70) return 'Khá';
    if (val >= 50) return 'Trung bình';
    return 'Yếu';
  };

  const getBadgeVariant = (cls: string) => {
    switch (cls) {
      case 'Xuất sắc': return 'success';
      case 'Tốt': return 'info';
      case 'Khá': return 'neutral';
      case 'Trung bình': return 'warning';
      default: return 'danger';
    }
  };

  const handleScoreChange = (id: number, val: number) => {
    const clampedVal = Math.min(100, Math.max(0, val));
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const cls = getClassification(clampedVal);
        return { ...s, trainingScore: clampedVal, classification: cls };
      }
      return s;
    }));
  };

  const handleSave = () => {
    setMsg('Đã lưu bảng Điểm rèn luyện lớp Chủ nhiệm thành công!');
    setTimeout(() => setMsg(''), 4000);
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="w-6 h-6 text-navy-900 dark:text-navy-100" />
            Quản lý Điểm rèn luyện Lớp Chủ nhiệm
          </span>
        }
        subtitle="Giáo viên chủ nhiệm xem kết quả học tập & nhập Điểm rèn luyện cho sinh viên lớp quản lý (Lớp 62PM1)"
        actions={
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .csv"
                className="hidden"
                onChange={() => setMsg('Đã import danh sách Điểm rèn luyện từ file thành công!')}
              />
              <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition border border-slate-200 dark:border-slate-700 shadow-xs">
                <Upload className="w-4 h-4 text-slate-500" />
                Import Excel/CSV
              </span>
            </label>

            <Button variant="primary" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </Button>
          </div>
        }
      />

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {msg}
        </div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-navy-700 dark:text-navy-300" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Danh sách Sinh viên Lớp 62PM1 ({filteredStudents.length} SV)
            </h2>
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Tìm kiếm theo mã SV, tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mã SV</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Lớp HC</th>
                <th className="py-3 px-4">GPA Học tập</th>
                <th className="py-3 px-4">Điểm rèn luyện (0 - 100)</th>
                <th className="py-3 px-4">Xếp loại Rèn luyện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy sinh viên phù hợp
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-navy-900 dark:text-navy-300">{s.studentCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{s.fullName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.className}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{s.gpa.toFixed(2)} / 10.0</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={s.trainingScore}
                        onChange={(e) => handleScoreChange(s.id, Number(e.target.value))}
                        className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getBadgeVariant(s.classification)}>
                        <Award className="w-3 h-3 mr-1" />
                        {s.classification}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default HomeroomGradebook;
