import React, { useState } from 'react';
import { Folder, Download, Upload, FileText, Send, ShieldAlert, CheckCircle2, User, FileCheck } from 'lucide-react';

export const DocumentHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'STUDENT_FORMS' | 'LECTURER_TEMPLATES'>('STUDENT_FORMS');
  const [msg, setMsg] = useState('');

  const studentForms = [
    { id: 1, title: 'Đơn xin hoãn nộp Học phí', category: 'Sinh viên', format: 'DOCX / PDF', size: '45 KB' },
    { id: 2, title: 'Mẫu đơn xin Bảo lưu kết quả học tập', category: 'Sinh viên', format: 'DOCX', size: '52 KB' },
    { id: 3, title: 'Đơn đăng ký thi bổ sung / Miễn giảm', category: 'Sinh viên', format: 'PDF', size: '38 KB' },
  ];

  const lecturerTemplates = [
    { id: 101, title: 'Biểu mẫu Bảng điểm Rèn luyện Lớp Hành chính', category: 'Giảng viên', format: 'XLSX', size: '120 KB' },
    { id: 102, title: 'Mẫu Danh sách Sinh viên dự thi & Điểm môn học', category: 'Giảng viên', format: 'XLSX', size: '95 KB' },
    { id: 103, title: 'Mẫu Biểu mẫu Xét tốt nghiệp Niên khóa', category: 'Giảng viên', format: 'XLSX / CSV', size: '150 KB' },
  ];

  const handleDownload = (filename: string) => {
    setMsg(`✅ Đã bắt đầu tải xuống mẫu: ${filename}`);
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Folder className="w-7 h-7" />
            Trung tâm Biểu mẫu & Kho Tài liệu 3 Mục
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Quản lý và tải về các biểu mẫu chuẩn dành cho Sinh viên, Giảng viên & Yêu cầu hệ thống
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {msg}
        </div>
      )}

      {/* 3-Tab Selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-4">
        <button
          onClick={() => setActiveTab('STUDENT_FORMS')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition ${
            activeTab === 'STUDENT_FORMS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" /> 1. Mẫu đơn Sinh viên (Xem & Tải về)
        </button>
        <button
          onClick={() => setActiveTab('LECTURER_TEMPLATES')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition ${
            activeTab === 'LECTURER_TEMPLATES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileCheck className="w-4 h-4" /> 2. Biểu mẫu Giảng viên (Điền & Import)
        </button>
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition ${
            activeTab === 'REQUESTS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> 3. Yêu cầu Hệ thống (Cấp quyền Giảng viên)
        </button>
      </div>

      {/* Tab 1: Student Forms */}
      {activeTab === 'STUDENT_FORMS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {studentForms.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h3>
                  <span className="text-[11px] text-gray-400 font-mono mt-1 block">Định dạng: {item.format} • {item.size}</span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(item.title)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold py-2 rounded-xl text-xs hover:bg-indigo-100 transition"
              >
                <Download className="w-4 h-4" /> Tải về Mẫu đơn
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Lecturer Templates */}
      {activeTab === 'LECTURER_TEMPLATES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {lecturerTemplates.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h3>
                  <span className="text-[11px] text-gray-400 font-mono mt-1 block">Mẫu Excel/CSV Import • {item.size}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(item.title)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-semibold py-2 rounded-xl text-xs hover:bg-emerald-500 transition shadow"
                >
                  <Download className="w-4 h-4" /> Tải Excel Mẫu
                </button>
                <label className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl cursor-pointer hover:bg-gray-200 transition">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept=".xlsx,.csv" className="hidden" onChange={() => setMsg(`✅ Đã import dữ liệu từ file ${item.title}`)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: System Requests */}
      {activeTab === 'REQUESTS' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yêu cầu Cấp quyền Hệ thống</h2>
          <p className="text-xs text-gray-500">Giảng viên có thể gửi yêu cầu trực tiếp lên Admin để xin bổ sung quyền dạy hoặc sửa điểm.</p>
          <button
            onClick={() => window.location.href = '/lecturer/permission-requests'}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow hover:bg-indigo-500 transition"
          >
            <Send className="w-4 h-4" /> Đi tới Trang Yêu Cầu Cấp Quyền (PBAC)
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentHubPage;
