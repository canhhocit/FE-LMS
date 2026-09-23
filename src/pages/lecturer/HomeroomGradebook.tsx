import React, { useState } from 'react';
import { Users, Upload, Save, Award, CheckCircle2, FileSpreadsheet } from 'lucide-react';

interface StudentTrainingScore {
  id: number;
  studentCode: string;
  fullName: string;
  className: string;
  gpa: number;
  trainingScore: number;
  classification: string;
}

export const HomeroomGradebook: React.FC = () => {
  const [students, setStudents] = useState<StudentTrainingScore[]>([]);

  const [msg, setMsg] = useState('');

  const handleScoreChange = (id: number, val: number) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        let cls = 'Trung bình';
        if (val >= 90) cls = 'Xuất sắc';
        else if (val >= 80) cls = 'Tốt';
        else if (val >= 70) cls = 'Khá';
        return { ...s, trainingScore: val, classification: cls };
      }
      return s;
    }));
  };

  const handleSave = () => {
    setMsg('Đã lưu bảng Điểm rèn luyện lớp Chủ nhiệm thành công!');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-linear-to-r from-teal-600 via-emerald-600 to-green-700 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7" />
            Quản lý Điểm rèn luyện Lớp Chủ nhiệm (GVCN)
          </h1>
          <p className="text-teal-100 text-sm mt-1">
            Giáo viên chủ nhiệm có toàn quyền xem toàn bộ kết quả học tập & nhập Điểm rèn luyện niên khóa cho sinh viên lớp mình quản lý
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-white/30 transition">
            <Upload className="w-4 h-4" />
            Import Excel/CSV Điểm RL
            <input type="file" accept=".xlsx, .csv" className="hidden" onChange={() => setMsg('Đã import danh sách Điểm rèn luyện từ file Excel!')} />
          </label>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {msg}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Danh sách Sinh viên Lớp 62PM1 (Lớp Hành chính)
          </h2>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow hover:bg-emerald-500 transition"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                <th className="py-3 px-4">Mã SV</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Lớp HC</th>
                <th className="py-3 px-4">GPA Học tập (Tất cả HP)</th>
                <th className="py-3 px-4">Điểm rèn luyện (0 - 100)</th>
                <th className="py-3 px-4">Xếp loại Rèn luyện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{s.studentCode}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">{s.fullName}</td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{s.className}</td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600">{s.gpa} / 10.0</td>
                  <td className="py-3.5 px-4">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={s.trainingScore}
                      onChange={(e) => handleScoreChange(s.id, Number(e.target.value))}
                      className="w-24 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200">
                      <Award className="w-3.5 h-3.5" /> {s.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HomeroomGradebook;
