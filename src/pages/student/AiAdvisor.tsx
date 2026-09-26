import { useEffect, useState } from 'react';
import { Bot, Check, Target, Lightbulb, ArrowRight, Send } from 'lucide-react';
import { PageHeader, Card, Spinner, ErrorBox, Badge, Button, Input } from '../../components/ui';
import { getMyAiAdvisorAnalysis, askAiAdvisor, type AiAdvisorResponse } from '../../services/aiAdvisorService';

export default function StudentAiAdvisor() {
  const [data, setData] = useState<AiAdvisorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let m = true;
    getMyAiAdvisorAnalysis()
      .then((res) => m && setData(res))
      .catch((e: unknown) => m && setErr((e as { message?: string })?.message ?? 'Không tải được dữ liệu Cố vấn AI'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);

  const handleAskAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setAsking(true);
    try {
      const updated = await askAiAdvisor(queryInput.trim());
      setData(updated);
      setQueryInput('');
    } catch (e: unknown) {
      alert((e as { message?: string })?.message ?? 'Không thể gửi câu hỏi');
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <Spinner />;
  if (err && !data) return <ErrorBox msg={err} />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return <Badge color="emerald">Xuất sắc</Badge>;
      case 'GOOD':
        return <Badge color="indigo">Tốt / Khá</Badge>;
      case 'WARNING':
        return <Badge color="amber">Cần chú ý</Badge>;
      default:
        return <Badge color="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cố vấn Học tập AI"
        subtitle="Phân tích tiến độ học tập cá nhân hóa, điểm mạnh/điểm yếu và khuyến nghị cải thiện kết quả"
      />

      {err && <ErrorBox msg={err} />}

      {data && (
        <>
          {/* Header Overview Card */}
          <Card>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center font-bold text-lg border border-slate-700 shrink-0">
                  {data.studentName?.charAt(0) || 'S'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{data.studentName}</h2>
                    {getStatusBadge(data.academicStatus)}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                    <span>Phong cách học tập:</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">{data.learningStyle}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">GPA Tích lũy</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{data.gpa} <span className="text-xs text-slate-400 font-normal">/ 10</span></div>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đề xuất</div>
                  <div className="text-2xl font-bold text-accent-600 dark:text-accent-400 mt-0.5">{data.studyPlan?.length ?? 0} <span className="text-xs text-slate-400 font-normal">bước</span></div>
                </div>
              </div>
            </div>

            {/* AI Advisor Summary */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <Bot className="w-4 h-4 text-accent-600 dark:text-accent-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">Tổng quan từ Cố vấn AI:</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {data.aiAdviceSummary}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Điểm mạnh đã ghi nhận</h3>
              <ul className="space-y-2">
                {data.strengths?.map((s, idx) => (
                  <li key={`s-${idx}`} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Điểm cần cải thiện & Khuyến nghị</h3>
              <ul className="space-y-2">
                {data.weaknesses?.map((w, idx) => (
                  <li key={`w-${idx}`} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                    <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
                {data.recommendations?.map((r, idx) => (
                  <li key={`r-${idx}`} className="flex items-start gap-2 text-xs text-accent-900 dark:text-accent-300 bg-accent-50/60 dark:bg-accent-950/30 p-2.5 rounded-lg border border-accent-200/60 dark:border-accent-900/40">
                    <Lightbulb className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Study Plan Steps */}
          <Card>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Lộ trình học tập đề xuất</h3>
            <div className="space-y-4">
              {data.studyPlan?.map((step) => (
                <div key={step.stepOrder} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {step.stepOrder}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{step.actionTitle}</h4>
                      <Badge color="slate">{step.timeframe}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Interactive Query Box */}
          <Card>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Đặt câu hỏi cho Cố vấn AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Nhập băn khoăn về môn học hoặc phương pháp ôn thi để nhận gợi ý giải đáp
            </p>
            <form onSubmit={handleAskAdvisor} className="flex gap-2">
              <input
                type="text"
                placeholder="Ví dụ: Làm sao để chuẩn bị tốt cho bài thi trắc nghiệm giữa kỳ?"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg outline-none focus:border-accent-600"
              />
              <Button type="submit" loading={asking} disabled={!queryInput.trim()}>
                Gửi câu hỏi
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}