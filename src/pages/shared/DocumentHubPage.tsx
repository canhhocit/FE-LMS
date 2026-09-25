import React, { useState, useEffect } from 'react';
import { Folder, Download, Upload, FileText, CheckCircle2, User, FileCheck, X, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { uploadCloudFile } from '../../services/storageService';

interface DocumentItem {
  id: string;
  title: string;
  category: 'STUDENT_FORMS' | 'LECTURER_TEMPLATES';
  format: string;
  size: string;
  uploadedBy?: string;
  createdAt?: string;
  downloadUrl?: string;
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  // Student Forms
  { id: 'doc-1', title: 'Đơn xin hoãn thi / Thi bổ sung', category: 'STUDENT_FORMS', format: 'PDF', size: '245 KB' },
  { id: 'doc-2', title: 'Đơn xin miễn giảm học phí', category: 'STUDENT_FORMS', format: 'PDF', size: '180 KB' },
  { id: 'doc-3', title: 'Đơn xin nghỉ học tạm thời & Bảo lưu kết quả', category: 'STUDENT_FORMS', format: 'PDF', size: '310 KB' },
  { id: 'doc-4', title: 'Đơn xin phúc khảo bài thi học phần', category: 'STUDENT_FORMS', format: 'PDF', size: '150 KB' },
  { id: 'doc-5', title: 'Đơn đăng ký học vượt / Học lại môn', category: 'STUDENT_FORMS', format: 'PDF', size: '210 KB' },
  { id: 'doc-6', title: 'Giấy xác nhận Sinh viên đang theo học (Vay vốn & Nghĩa vụ)', category: 'STUDENT_FORMS', format: 'PDF', size: '195 KB' },

  // Lecturer Templates
  { id: 'doc-7', title: 'Mẫu Import Danh sách Điểm thi & Giữa kỳ', category: 'LECTURER_TEMPLATES', format: 'XLSX', size: '45 KB' },
  { id: 'doc-8', title: 'Mẫu Import Điểm rèn luyện Sinh viên (GVCN)', category: 'LECTURER_TEMPLATES', format: 'XLSX', size: '52 KB' },
  { id: 'doc-9', title: 'Mẫu Đề thi & Ngân hàng Câu hỏi Quiz', category: 'LECTURER_TEMPLATES', format: 'XLSX', size: '68 KB' },
  { id: 'doc-10', title: 'Mẫu Danh sách Điểm danh Lớp học phần', category: 'LECTURER_TEMPLATES', format: 'XLSX', size: '38 KB' },
];

export const DocumentHubPage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const isLecturer = user?.role === 'LECTURER';
  const isAdmin = user?.role === 'ADMIN';
  const isAdminOrLecturer = isAdmin || isLecturer;

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('lms_documents_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_DOCUMENTS;
  });

  const [activeTab, setActiveTab] = useState<'STUDENT_FORMS' | 'LECTURER_TEMPLATES'>(() => {
    if (user?.role === 'LECTURER') return 'LECTURER_TEMPLATES';
    return 'STUDENT_FORMS';
  });
  const [msg, setMsg] = useState('');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [isModalUploading, setIsModalUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Modal Form State
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<'STUDENT_FORMS' | 'LECTURER_TEMPLATES'>('STUDENT_FORMS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('lms_documents_list', JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents]);

  const handleDownload = (doc: DocumentItem) => {
    if (doc.downloadUrl) {
      const link = document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = `${doc.title}.${doc.format.toLowerCase()}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMsg(`Đang tải xuống tệp thực tế: "${doc.title}.${doc.format.toLowerCase()}"`);
    } else {
      // Create actual sample text/csv file for sample templates
      const sampleText = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nBIỂU MẪU CHUẨN HỆ THỐNG LMS\nTên biểu mẫu: ${doc.title}\nPhân loại: ${doc.category}\nĐịnh dạng: ${doc.format}\n\n(File mẫu được khởi tạo tự động từ hệ thống LearningHub)`;
      const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMsg(`Đã xuất tệp biểu mẫu thực tế: "${doc.title}.txt"`);
    }
    setTimeout(() => setMsg(''), 4000);
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa biểu mẫu này khỏi hệ thống?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setMsg('Đã xóa biểu mẫu thành công!');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleUpdateIndividualDocFile = async (docId: string, file: File) => {
    setUploadingDocId(docId);
    let realUrl = '';
    try {
      realUrl = await uploadCloudFile(file);
    } catch {
      // Fallback to local Object URL if backend is unreachable
      realUrl = URL.createObjectURL(file);
    }

    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const fileSizeStr = `${(file.size / 1024).toFixed(0)} KB`;

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            format: fileExt,
            size: fileSizeStr,
            downloadUrl: realUrl,
            uploadedBy: user?.fullName || 'Giảng viên / Admin',
            createdAt: new Date().toLocaleDateString('vi-VN'),
          };
        }
        return doc;
      })
    );
    setUploadingDocId(null);
    setMsg(`Đã upload tệp thực tế "${file.name}" và lưu thành công!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    setIsModalUploading(true);
    let realUrl = '';
    if (selectedFile) {
      try {
        realUrl = await uploadCloudFile(selectedFile);
      } catch {
        realUrl = URL.createObjectURL(selectedFile);
      }
    }

    const fileExt = selectedFile?.name.split('.').pop()?.toUpperCase() || 'PDF';
    const fileSizeStr = selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : '150 KB';

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: titleInput.trim(),
      category: categoryInput,
      format: fileExt,
      size: fileSizeStr,
      downloadUrl: realUrl,
      uploadedBy: user?.fullName || 'Admin',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setIsModalUploading(false);
    setShowUploadModal(false);
    setTitleInput('');
    setSelectedFile(null);

    setMsg(`Tải lên & lưu tệp thực tế "${newDoc.title}" thành công!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const studentForms = documents.filter((d) => d.category === 'STUDENT_FORMS');
  const lecturerTemplates = documents.filter((d) => d.category === 'LECTURER_TEMPLATES');

  const headerSubtitle = isStudent
    ? 'Danh sách các biểu mẫu đơn xin, giấy xác nhận sinh viên chuẩn. Bạn có thể tải về và điền thông tin khi cần.'
    : isLecturer
    ? 'Danh sách các biểu mẫu import điểm, đề thi và danh sách điểm danh dành cho Giảng viên.'
    : 'Quản lý, tải về và tải lên các mẫu đơn chuẩn cho Sinh viên & Giảng viên (Hỗ trợ upload & lưu tệp thực tế)';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isStudent ? 'Kho Biểu mẫu & Giấy xác nhận Sinh viên' : 'Trung tâm Biểu mẫu & Kho Tài liệu'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {headerSubtitle}
          </p>
        </div>

        {isAdminOrLecturer && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-sm"
          >
            <Upload className="w-4.5 h-4.5" />
            Tải lên Biểu mẫu / Tài liệu mới
          </button>
        )}
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {msg}
        </div>
      )}

      {/* Tab Selector: Only show for Admin/Lecturer, hide Lecturer tab for Students */}
      {!isStudent && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-4">
          <button
            onClick={() => setActiveTab('STUDENT_FORMS')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'STUDENT_FORMS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <User className="w-4 h-4" /> Mẫu đơn Sinh viên ({studentForms.length})
          </button>
          <button
            onClick={() => setActiveTab('LECTURER_TEMPLATES')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'LECTURER_TEMPLATES'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Biểu mẫu Giảng viên ({lecturerTemplates.length})
          </button>
        </div>
      )}

      {/* Tab 1: Student Forms */}
      {activeTab === 'STUDENT_FORMS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {studentForms.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-xl shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{item.title}</h3>
                    <span className="text-[11px] text-gray-400 font-mono mt-1 block">
                      Định dạng: {item.format} • {item.size} {item.uploadedBy ? `• Đăng bởi ${item.uploadedBy}` : ''}
                    </span>
                  </div>
                </div>
                {isAdminOrLecturer && (
                  <button onClick={() => handleDeleteDoc(item.id)} className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer" title="Xóa biểu mẫu">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Tải về ({item.format})
                </button>
                {isAdminOrLecturer && (
                  <label className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition gap-1.5 shrink-0" title="Cập nhật / Thay thế file mẫu đơn mới">
                    {uploadingDocId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingDocId === item.id ? 'Đang lưu...' : 'Cập nhật file'}</span>
                    <input
                      type="file"
                      disabled={uploadingDocId === item.id}
                      accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpdateIndividualDocFile(item.id, file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Lecturer Templates */}
      {activeTab === 'LECTURER_TEMPLATES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {lecturerTemplates.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-xl shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{item.title}</h3>
                    <span className="text-[11px] text-gray-400 font-mono mt-1 block">
                      Mẫu {item.format} Import • {item.size} {item.uploadedBy ? `• Đăng bởi ${item.uploadedBy}` : ''}
                    </span>
                  </div>
                </div>
                {isAdminOrLecturer && (
                  <button onClick={() => handleDeleteDoc(item.id)} className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer" title="Xóa biểu mẫu">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Tải Mẫu {item.format}
                </button>
                {isAdminOrLecturer && (
                  <label className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition gap-1.5 shrink-0" title="Cập nhật / Thay thế file mẫu mới">
                    {uploadingDocId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingDocId === item.id ? 'Đang lưu...' : 'Cập nhật file'}</span>
                    <input
                      type="file"
                      disabled={uploadingDocId === item.id}
                      accept=".xlsx,.csv,.pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpdateIndividualDocFile(item.id, file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Tải lên Biểu mẫu / Tài liệu mới (Lưu tệp thực tế)
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tên biểu mẫu / Tài liệu *
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Ví dụ: Đơn xin hoãn thi HK1 (Mẫu mới 2026)"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Phân loại đối tượng áp dụng *
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value as 'STUDENT_FORMS' | 'LECTURER_TEMPLATES')}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="STUDENT_FORMS">Mẫu đơn Sinh viên (Xem & Tải về)</option>
                  <option value="LECTURER_TEMPLATES">Biểu mẫu Giảng viên (Import & Điền)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Chọn tệp tài liệu (PDF, DOCX, XLSX...) *
                </label>
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-500 transition bg-gray-50/50 dark:bg-gray-900/50">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedFile ? selectedFile.name : 'Nhấp để chọn tệp từ máy tính'}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">Hỗ trợ các định dạng .pdf, .docx, .xlsx, .csv (Tối đa 25MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isModalUploading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  {isModalUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isModalUploading ? 'Đang upload tệp...' : 'Tải lên & Phát hành'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentHubPage;
