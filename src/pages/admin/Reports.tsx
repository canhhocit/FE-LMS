// Admin Reports page - charts + export + tuition rates management
import { useEffect, useState } from 'react';
import * as reportService from '../../services/reportService';
import { exportClazzScoresExcel, exportStudentTranscriptPdf, scanAcademicProbation } from '../../services/reportService';
import * as tuitionService from '../../services/tuitionService';
import { PageTitle, Card, Spinner, ErrorBox } from '../../components/Layout';
import type { EnrollmentReport, ScoreReport, TuitionRate } from '../../types';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function AdminReports() {
  const [enrolls, setEnrolls] = useState<EnrollmentReport[]>([]);
  const [scores, setScores] = useState<ScoreReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'enroll' | 'score' | 'clazz' | 'transcript' | null>(null);
  const [clazzIdInput, setClazzIdInput] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'tuition'>('reports');
  const [tuitionRates, setTuitionRates] = useState<TuitionRate[]>([]);
  const [loadingTuition, setLoadingTuition] = useState(false);
  const [editRateId, setEditRateId] = useState<number | null>(null);
  const [editRateYear, setEditRateYear] = useState('');
  const [editRatePrice, setEditRatePrice] = useState(0);
  const [editRateActive, setEditRateActive] = useState(true);
  const [savingRate, setSavingRate] = useState(false);
  const [showCreateRate, setShowCreateRate] = useState(false);
  const [newRateYear, setNewRateYear] = useState('');
  const [newRatePrice, setNewRatePrice] = useState(0);
  const [creatingRate, setCreatingRate] = useState(false);

  const loadTuitionRates = async () => {
    setLoadingTuition(true);
    try {
      const rates = await tuitionService.getTuitionRates();
      setTuitionRates(rates);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được mức học phí');
    } finally {
      setLoadingTuition(false);
    }
  };

  useEffect(() => {
    let m = true;
    Promise.all([reportService.getEnrollmentsByMonth(), reportService.getAverageScoreByClazz()])
      .then(([e, s]) => m && (setEnrolls(e), setScores(s)))
      .catch((e2) => m && setErr((e2 as { message?: string })?.message ?? 'Lỗi tải báo cáo'))
      .finally(() => m && setLoading(false));

    loadTuitionRates();
    return () => { m = false; };
  }, []);

  const handleExportEnrollments = async () => {
    try {
      setExporting('enroll');
      const blob = await reportService.exportEnrollmentsExcel();
      downloadBlob(blob, 'enrollments-by-month.xlsx');
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'Không thể xuất báo cáo đăng ký.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportScores = async () => {
    try {
      setExporting('score');
      const blob = await reportService.exportScorePdf();
      downloadBlob(blob, 'average-score-by-class.pdf');
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'Không thể xuất báo cáo điểm trung bình.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportClazzScores = async () => {
    const cid = Number(clazzIdInput);
    if (!cid) return;
    try {
      setExporting('clazz');
      const blob = await exportClazzScoresExcel(cid);
      downloadBlob(blob, `scores-clazz-${cid}.xlsx`);
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'Không thể xuất điểm lớp.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportTranscript = async () => {
    const sid = Number(studentIdInput);
    if (!sid) return;
    try {
      setExporting('transcript');
      const blob = await exportStudentTranscriptPdf(sid);
      downloadBlob(blob, `transcript-student-${sid}.pdf`);
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'Không thể xuất bảng điểm.');
    } finally {
      setExporting(null);
    }
  };

  const handleScanProbation = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scanAcademicProbation();
      setScanResult(`Quét xong: ${result.scanned} sinh viên, ${result.warnings} cảnh báo.`);
    } catch (error: unknown) {
      setScanResult((error as { message?: string })?.message ?? 'Quét thất bại.');
    } finally {
      setScanning(false);
    }
  };

  const startEditRate = (rate: TuitionRate) => {
    setEditRateId(rate.id);
    setEditRateYear(rate.academicYear);
    setEditRatePrice(rate.pricePerCredit);
    setEditRateActive(rate.isActive);
  };

  const cancelEditRate = () => {
    setEditRateId(null);
    setEditRateYear('');
    setEditRatePrice(0);
    setEditRateActive(true);
  };

  const handleSaveEditRate = async () => {
    if (!editRateId || !editRateYear.trim() || editRatePrice <= 0) return;
    setSavingRate(true);
    try {
      await tuitionService.updateTuitionRate(editRateId, {
        academicYear: editRateYear,
        pricePerCredit: editRatePrice,
        isActive: editRateActive,
      });
      cancelEditRate();
      loadTuitionRates();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Cập nhật thất bại');
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm('Xoá mức học phí này?')) return;
    try {
      await tuitionService.deleteTuitionRate(id);
      loadTuitionRates();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Xoá thất bại');
    }
  };

  const handleCreateRate = async () => {
    if (!newRateYear.trim() || newRatePrice <= 0) return;
    setCreatingRate(true);
    try {
      await tuitionService.createTuitionRate({
        academicYear: newRateYear,
        pricePerCredit: newRatePrice,
        isActive: true,
      });
      setShowCreateRate(false);
      setNewRateYear('');
      setNewRatePrice(0);
      loadTuitionRates();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Tạo thất bại');
    } finally {
      setCreatingRate(false);
    }
  };

  if (loading && loadingTuition) return <Spinner />;
  if (err && !enrolls.length && !scores.length) return <ErrorBox msg={err} />;

  const maxEnroll = Math.max(...enrolls.map((e) => e.count), 1);
  const maxScore = 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>Báo cáo & Thống kê</PageTitle>
        <div className="flex gap-2">
          <button aria-label="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Báo cáo hệ thống
          </button>
          <button aria-label="button"
            onClick={() => setActiveTab('tuition')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'tuition' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Quản lý Mức học phí
          </button>
        </div>
      </div>

      {err && <ErrorBox msg={err} />}

      {activeTab === 'reports' ? (
        <>
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">Xuất báo cáo & Quét nguy cơ học tập</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Xuất điểm lớp học phần (Excel)</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ID Lớp (VD: 1)"
                    value={clazzIdInput}
                    onChange={(e) => setClazzIdInput(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                  />
                  <button aria-label="button"
                    onClick={handleExportClazzScores}
                    disabled={exporting !== null || !clazzIdInput}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-500 disabled:opacity-50 shrink-0"
                  >
                    {exporting === 'clazz' ? 'Đang xuất…' : 'Xuất Excel'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Xuất bảng điểm sinh viên (PDF)</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ID Sinh viên (VD: 1)"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                  />
                  <button aria-label="button"
                    onClick={handleExportTranscript}
                    disabled={exporting !== null || !studentIdInput}
                    className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-500 disabled:opacity-50 shrink-0"
                  >
                    {exporting === 'transcript' ? 'Đang xuất…' : 'Xuất PDF'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Quét cảnh báo nguy cơ học vụ</div>
                <div className="flex flex-col gap-2">
                  <button aria-label="button"
                    onClick={handleScanProbation}
                    disabled={scanning}
                    className="w-full py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-500 disabled:opacity-50"
                  >
                    {scanning ? 'Đang quét…' : 'Chạy quét nguy cơ'}
                  </button>
                  {scanResult && <div className="text-xs font-medium text-amber-700">{scanResult}</div>}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button aria-label="button"
                onClick={handleExportEnrollments}
                disabled={exporting !== null}
                className="px-3 py-2 rounded text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500"
              >
                {exporting === 'enroll' ? 'Đang xuất…' : 'Xuất Excel Đăng ký theo tháng'}
              </button>
              <button aria-label="button"
                onClick={handleExportScores}
                disabled={exporting !== null}
                className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500"
              >
                {exporting === 'score' ? 'Đang xuất…' : 'Xuất PDF Điểm trung bình'}
              </button>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Đăng ký học theo tháng</h3>
              </div>
              <div className="space-y-2">
                {enrolls.map((e) => (
                  <div key={e.month} className="flex items-center gap-2 text-sm">
                    <div className="w-24 text-slate-500">{e.month}</div>
                    <div className="min-w-0 flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${(e.count / maxEnroll) * 100}%` }} />
                    </div>
                    <div className="w-16 text-right font-mono text-slate-700">{e.count}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Điểm TB theo lớp</h3>
              </div>
              <div className="space-y-2">
                {scores.map((s) => (
                  <div key={s.classId} className="flex items-center gap-2 text-sm">
                    <div className="w-32 truncate text-slate-500">{s.classCode}</div>
                    <div className="min-w-0 flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(s.averageScore / maxScore) * 100}%` }} />
                    </div>
                    <div className="w-16 text-right font-mono text-slate-700">{s.averageScore.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Danh sách Mức học phí theo Năm học</h3>
            <button aria-label="button"
              onClick={() => setShowCreateRate(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition"
            >
              + Tạo mức mới
            </button>
          </div>

          {showCreateRate && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-3">Tạo mức học phí mới</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Năm học (VD: 2024-2025)</label>
                  <input
                    type="text"
                    value={newRateYear}
                    onChange={(e) => setNewRateYear(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Giá mỗi tín chỉ (VNĐ)</label>
                  <input
                    type="number"
                    value={newRatePrice}
                    onChange={(e) => setNewRatePrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button aria-label="button"
                  onClick={() => setShowCreateRate(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-md"
                >
                  Hủy
                </button>
                <button aria-label="button"
                  onClick={handleCreateRate}
                  disabled={creatingRate}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creatingRate ? 'Đang tạo…' : 'Lưu mức mới'}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Năm học</th>
                  <th className="text-right p-3">Giá / Tín chỉ (VNĐ)</th>
                  <th className="text-center p-3">Trạng thái</th>
                  <th className="text-center p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tuitionRates.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{r.id}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      {editRateId === r.id ? (
                        <input
                          type="text"
                          value={editRateYear}
                          onChange={(e) => setEditRateYear(e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-300 rounded"
                        />
                      ) : (
                        r.academicYear
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-emerald-600">
                      {editRateId === r.id ? (
                        <input
                          type="number"
                          value={editRatePrice}
                          onChange={(e) => setEditRatePrice(Number(e.target.value))}
                          className="px-2 py-1 text-xs border border-slate-300 rounded w-32 text-right"
                        />
                      ) : (
                        r.pricePerCredit.toLocaleString('vi-VN') + ' đ'
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {editRateId === r.id ? (
                        <input
                          type="checkbox"
                          checked={editRateActive}
                          onChange={(e) => setEditRateActive(e.target.checked)}
                        />
                      ) : r.isActive ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">
                          Khóa
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      {editRateId === r.id ? (
                        <>
                          <button aria-label="button"
                            onClick={handleSaveEditRate}
                            disabled={savingRate}
                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500"
                          >
                            Lưu
                          </button>
                          <button aria-label="button"
                            onClick={cancelEditRate}
                            className="px-2 py-1 text-xs border border-slate-300 text-slate-600 rounded"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button aria-label="button"
                            onClick={() => startEditRate(r)}
                            className="px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                          >
                            Sửa
                          </button>
                          <button aria-label="button"
                            onClick={() => handleDeleteRate(r.id)}
                            className="px-2 py-1 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100"
                          >
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
