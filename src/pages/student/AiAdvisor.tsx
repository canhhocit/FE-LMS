import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Check, Target, Lightbulb, Rocket, MessageSquare } from 'lucide-react';
import { Card, Spinner, ErrorBox } from '../../components/Layout';
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
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-xs">Xuất sắc</span>;
      case 'GOOD':
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded-full text-xs">Khá / Tốt</span>;
      case 'WARNING':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 font-semibold rounded-full text-xs">Cần chú ý (Warning)</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Trợ lý & Cố vấn Học tập AI</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                AI Companion Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phân tích phong cách học tập cá nhân hóa, điểm mạnh/điểm yếu và lộ trình nâng cao điểm số
            </p>
          </div>
        </div>
      </div>

      {err && <ErrorBox msg={err} />}

      {data && (
        <>
          {/* Header Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-lg border border-slate-200 dark:border-slate-700 shrink-0">
                  {data.studentName?.charAt(0) || 'S'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.studentName}</h2>
                    {getStatusBadge(data.academicStatus)}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Phong cách học tập:</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 font-medium">{data.learningStyle}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                <div className="text-center">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">GPA Tích lũy</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.gpa} <span className="text-xs text-slate-500 font-normal">/ 10</span></div>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="text-center">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Hành động đề xuất</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.studyPlan?.length ?? 0} <span className="text-xs text-slate-500 font-normal">bước</span></div>
                </div>
              </div>
            </div>

            {/* AI Advisor Summary */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-xl flex items-start gap-3 border border-indigo-100/80 dark:border-indigo-900/40">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-bold mb-1 flex items-center gap-1.5">
                  <span>Lời khuyên tổng quan từ Cố vấn AI</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {data.aiAdviceSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2.5 mb-4 text-emerald-700 font-bold text-base">
                <span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></span>
                <span>Điểm mạnh đã ghi nhận</span>
              </div>
              <ul className="space-y-2.5">
                {data.strengths?.map((s, idx) => (
                  <li key={`s-${idx}`} className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2.5 mb-4 text-amber-700 font-bold text-base">
                <span className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Target className="w-5 h-5" /></span>
                <span>Điểm cần cải thiện & Khuyến nghị</span>
              </div>
              <ul className="space-y-2.5">
                {data.weaknesses?.map((w, idx) => (
                  <li key={`w-${idx}`} className="flex items-start gap-2.5 text-sm text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <span className="text-amber-500 font-bold shrink-0">!</span>
                    <span>{w}</span>
                  </li>
                ))}
                {data.recommendations?.map((r, idx) => (
                  <li key={`r-${idx}`} className="flex items-start gap-2.5 text-sm text-indigo-900 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                    <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Step-by-Step Study Plan Timeline */}
          <Card>
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Rocket className="w-5 h-5" /></span>
              <span>Lộ trình Cải thiện Điểm số Cá nhân hóa</span>
            </h3>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-indigo-100">
              {data.studyPlan?.map((step) => (
                <div key={step.stepOrder} className="relative flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 z-10 shadow-md ring-4 ring-white">
                    {step.stepOrder}
                  </div>
                  <div className="flex-1 bg-slate-50 group-hover:bg-indigo-50/40 p-4 rounded-xl border border-slate-200 group-hover:border-indigo-200 transition">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-800 text-base">{step.actionTitle}</h4>
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        {step.timeframe}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Interactive Chat Box */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <span>Trò chuyện trực tiếp với Cố vấn AI</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập câu hỏi hoặc băn khoăn về bài học, môn học để nhận định hướng giải đáp từ Cố vấn AI
                </p>
              </div>
            </div>
            <form onSubmit={handleAskAdvisor} className="flex gap-3">
              <input
                type="text"
                placeholder="Ví dụ: Làm sao để cải thiện kỹ năng làm bài thi trắc nghiệm giữa kỳ?"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200/80 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={asking || !queryInput.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-50 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                {asking ? (
                  'Đang phân tích…'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Gửi câu hỏi
                  </>
                )}
              </button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}