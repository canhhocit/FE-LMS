import { useEffect, useState } from 'react';
import { BarChart3, FileSpreadsheet, FileText, AlertTriangle, Plus, Download, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import * as reportService from '../../services/reportService';
import { exportClazzScoresExcel, exportStudentTranscriptPdf, scanAcademicProbation } from '../../services/reportService';
import * as tuitionService from '../../services/tuitionService';
import { PageHeader, Card, Button, Input, Badge, Spinner, ErrorBox } from '../../components/ui';
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
  const [loadingTuition, setLoadingTuition] = useState(true);
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
    Promise.all([
      reportService.getEnrollmentsByMonth(),
      reportService.getAverageScoreByClazz(),
      tuitionService.getTuitionRates(),
    ])
      .then(([e, s, t]) => {
        if (m) {
          setEnrolls(e);
          setScores(s);
          setTuitionRates(t);
        }
      })
      .catch((e2) => m && setErr((e2 as { message?: string })?.message ?? 'Lỗi tải báo cáo'))
      .finally(() => {
        if (m) {
          setLoading(false);
          setLoadingTuition(false);
        }
      });

    return () => {
      m = false;
    };
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
  if (err && !enrolls.length && !scores.length) return <ErrorBox message={err} />;

  const maxEnroll = Math.max(...enrolls.map((e) => e.count), 1);
  const maxScore = 10;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Báo cáo & Thống kê' }]}
        title="Báo cáo & Thống kê Hệ thống"
        subtitle="Xuất file báo cáo Excel/PDF, phân tích dữ liệu học tập và quản lý định mức học phí tín chỉ"
        actions={
          <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'reports' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Báo cáo hệ thống
            </button>
            <button
              onClick={() => setActiveTab('tuition')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'tuition' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Quản lý Mức học phí
            </button>
          </div>
        }
      />

      {err && <ErrorBox message={err} />}

      {activeTab === 'reports' ? (
        <>
          <Card>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-navy-700 dark:text-navy-300" />
              Tác vụ Xuất Báo cáo & Quét nguy cơ học tập
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất điểm lớp học phần (Excel)
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="ID Lớp (VD: 1)"
                    value={clazzIdInput}
                    onChange={(e) => setClazzIdInput(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportClazzScores}
                    disabled={exporting !== null || !clazzIdInput}
                  >
                    {exporting === 'clazz' ? 'Đang xuất…' : 'Xuất Excel'}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" /> Xuất bảng điểm sinh viên (PDF)
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="ID Sinh viên (VD: 1)"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportTranscript}
                    disabled={exporting !== null || !studentIdInput}
                  >
                    {exporting === 'transcript' ? 'Đang xuất…' : 'Xuất PDF'}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Quét cảnh báo nguy cơ học vụ
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={handleScanProbation}
                    disabled={scanning}
                  >
                    {scanning ? 'Đang quét…' : 'Chạy quét nguy cơ'}
                  </Button>
                  {scanResult && <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">{scanResult}</div>}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportEnrollments}
                disabled={exporting !== null}
              >
                <Download className="w-3.5 h-3.5" />
                {exporting === 'enroll' ? 'Đang xuất Excel…' : 'Xuất Đăng ký theo Tháng (Excel)'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportScores}
                disabled={exporting !== null}
              >
                <Download className="w-3.5 h-3.5" />
                {exporting === 'score' ? 'Đang xuất PDF…' : 'Xuất Điểm TB theo Lớp (PDF)'}
              </Button>
            </div>
          </Card>

          {/* Graphical Distributions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Lượt đăng ký môn học theo Tháng</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Biểu đồ tổng hợp lưu lượng đăng ký học phần</p>
              <div className="space-y-3">
                {enrolls.map((item) => (
                  <div key={item.month}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>{item.month}</span>
                      <span className="font-bold text-navy-900 dark:text-navy-300">{item.count} lượt</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-navy-700 dark:bg-navy-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(item.count / maxEnroll) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Điểm trung bình theo Lớp học phần</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Đánh giá phổ điểm chung giữa các môn học</p>
              <div className="space-y-3">
                {scores.map((item, idx) => (
                  <div key={item.classCode || idx}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span className="truncate max-w-[200px]">{item.className || item.classCode}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.averageScore.toFixed(2)} / 10</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(item.averageScore / maxScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        /* Tuition Rates Tab */
        <Card padding="none">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Định mức Học phí / Tín chỉ theo Năm học</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cấu hình đơn giá 1 tín chỉ cho hệ thống tự động tính học phí sinh viên</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowCreateRate(true)}>
              <Plus className="w-4 h-4" /> Thêm định mức mới
            </Button>
          </div>

          {showCreateRate && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-navy-50/30 dark:bg-navy-950/30 flex flex-wrap items-center gap-3">
              <Input
                placeholder="Năm học (VD: 2026-2027)"
                value={newRateYear}
                onChange={(e) => setNewRateYear(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Giá / Tín chỉ (VNĐ)"
                value={newRatePrice || ''}
                onChange={(e) => setNewRatePrice(Number(e.target.value))}
              />
              <Button variant="primary" size="sm" onClick={handleCreateRate} disabled={creatingRate}>
                {creatingRate ? 'Đang tạo...' : 'Lưu mức mới'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowCreateRate(false)}>
                Hủy
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Năm học</th>
                  <th className="py-3.5 px-4">Đơn giá / Tín chỉ (VNĐ)</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {tuitionRates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{r.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {editRateId === r.id ? (
                        <Input value={editRateYear} onChange={(e) => setEditRateYear(e.target.value)} />
                      ) : (
                        r.academicYear
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-navy-900 dark:text-navy-300">
                      {editRateId === r.id ? (
                        <Input type="number" value={editRatePrice} onChange={(e) => setEditRatePrice(Number(e.target.value))} />
                      ) : (
                        `${r.pricePerCredit.toLocaleString()} VNĐ`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {editRateId === r.id ? (
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editRateActive} onChange={(e) => setEditRateActive(e.target.checked)} />
                          <span>Active</span>
                        </label>
                      ) : (
                        <Badge variant={r.isActive ? 'success' : 'neutral'}>
                          {r.isActive ? 'Kích hoạt' : 'Khóa'}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {editRateId === r.id ? (
                        <>
                          <Button variant="primary" size="sm" onClick={handleSaveEditRate} disabled={savingRate}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lưu
                          </Button>
                          <Button variant="secondary" size="sm" onClick={cancelEditRate}>
                            Hủy
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => startEditRate(r)}>
                            <Edit3 className="w-3.5 h-3.5" /> Sửa
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void handleDeleteRate(r.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa
                          </Button>
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
