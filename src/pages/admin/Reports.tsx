// Admin Reports page - charts + export
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
  const [exporting, setExporting] = useState<'enroll' | 'score' | null>(null);
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
      setErr((e as { message?: string })?.message ?? 'KhĂ´ng táº£i Ä‘Æ°á»£c má»©c há»c phĂ­');
    } finally {
      setLoadingTuition(false);
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
      alert((e as { message?: string })?.message ?? 'Cáº­p nháº­t tháº¥t báº¡i');
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm('XoĂ¡ má»©c há»c phĂ­ nĂ y?')) return;
    try {
      await tuitionService.deleteTuitionRate(id);
      loadTuitionRates();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'XoĂ¡ tháº¥t báº¡i');
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
      alert((e as { message?: string })?.message ?? 'Táº¡o tháº¥t báº¡i');
    } finally {
      setCreatingRate(false);
    }
  };

  // Load tuition rates on mount
  useEffect(() => {
    loadTuitionRates();
  }, []);

  useEffect(() => {
    let m = true;
    Promise.all([reportService.getEnrollmentsByMonth(), reportService.getAverageScoreByClazz()])
      .then(([e, s]) => m && (setEnrolls(e), setScores(s)))
      .catch((e2) => m && setErr((e2 as { message?: string })?.message ?? 'Lá»—i'))
      .finally(() => m && setLoading(false));
  
  const handleExportClazzScores = async () => {
    const cid = Number(clazzIdInput);
    if (!cid) return;
    try {
      setExporting('score');
      const blob = await exportClazzScoresExcel(cid);
      downloadBlob(blob, `scores-clazz-${cid}.xlsx`);
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ xuáº¥t Ä‘iá»ƒm lá»›p.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportTranscript = async () => {
    const sid = Number(studentIdInput);
    if (!sid) return;
    try {
      setExporting('enroll');
      const blob = await exportStudentTranscriptPdf(sid);
      downloadBlob(blob, `transcript-student-${sid}.pdf`);
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ xuáº¥t báº£ng Ä‘iá»ƒm.');
    } finally {
      setExporting(null);
    }
  };

  const handleScanProbation = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scanAcademicProbation();
      setScanResult(`QuĂ©t xong: ${result.scanned} sinh viĂªn, ${result.warnings} cáº£nh bĂ¡o.`);
    } catch (error: unknown) {
      setScanResult((error as { message?: string })?.message ?? 'QuĂ©t tháº¥t báº¡i.');
    } finally {
      setScanning(false);
    }
  };

  return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  const maxEnroll = Math.max(...enrolls.map((e) => e.count), 1);
  const maxScore = 10;

  const handleExportEnrollments = async () => {
    try {
      setExporting('enroll');
      const blob = await reportService.exportEnrollmentsExcel();
      downloadBlob(blob, 'enrollments-by-month.xlsx');
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ xuáº¥t bĂ¡o cĂ¡o Ä‘Äƒng kĂ½.');
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
      setErr((error as { message?: string })?.message ?? 'KhĂ´ng thá»ƒ xuáº¥t bĂ¡o cĂ¡o Ä‘iá»ƒm trung bĂ¬nh.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <PageTitle>BĂ¡o cĂ¡o & Thá»‘ng kĂª</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <button aria-label="button"
          onClick={handleExportEnrollments}
          disabled={exporting !== null}
          className="px-3 py-2 rounded text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500"
        >
          {exporting === 'enroll' ? 'Äang xuáº¥tâ€¦' : 'Xuáº¥t Excel theo thĂ¡ng'}
        </button>
        <button aria-label="button"
          onClick={handleExportScores}
          disabled={exporting !== null}
          className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500"
        >
          {exporting === 'score' ? 'Äang xuáº¥tâ€¦' : 'Xuáº¥t PDF Ä‘iá»ƒm TB'}
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">ÄÄƒng kĂ½ há»c theo thĂ¡ng</h3>
          </div>
          <div className="space-y-2">
            {enrolls.map((e) => (
              <div key={e.month} className="flex items-center gap-2 text-sm">
                <div className="w-24 text-slate-400">{e.month}</div>
                <div className="min-w-0 flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${(e.count / maxEnroll) * 100}%` }} />
                </div>
                <div className="w-16 text-right font-mono">{e.count}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Äiá»ƒm TB theo lá»›p</h3>
          </div>
          <div className="space-y-2">
            {scores.map((s) => (
              <div key={s.classId} className="flex items-center gap-2 text-sm">
                <div className="w-32 truncate text-slate-400">{s.classCode}</div>
                <div className="min-w-0 flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(s.averageScore / maxScore) * 100}%` }} />
                </div>
                <div className="w-16 text-right font-mono">{s.averageScore.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

