import { useEffect, useState } from 'react';
import { PageTitle, Card, Spinner, ErrorBox } from '../../components/Layout';
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
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Trợ lý & Cố vấn Học tập AI</PageTitle>
          <p className="text-sm text-slate-500 mt-1">
            Phân tích phong cách học tập cá nhân hóa, điểm mạnh/điểm yếu và lộ trình nâng cao điểm số
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-600">Gemini AI Advisor Online</span>
        </div>
      </div>

      {err && <ErrorBox msg={err} />}

      {data && (
        <>
          {/* Header Overview Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{data.studentName}</h2>
                  {getStatusBadge(data.academicStatus)}
                </div>
                <p className="text-indigo-200 text-sm flex items-center gap-2">
                  <span className="font-semibold">Phong cách học tập:</span>
                  <span className="bg-white/15 px-2.5 py-0.5 rounded text-white">{data.learningStyle}</span>
                </p>
              </div>

              <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/15 shrink-0">
                <div className="text-center">
                  <div className="text-xs font-medium text-indigo-200">Điểm GPA Tích lũy</div>
                  <div className="text-3xl font-extrabold text-amber-300">{data.gpa} <span className="text-xs text-indigo-200">/ 10</span></div>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-xs font-medium text-indigo-200">Kế hoạch Hành động</div>
                  <div className="text-2xl font-bold text-white">{data.studyPlan?.length ?? 0} <span className="text-xs">bước</span></div>
                </div>
              </div>
            </div>

            {/* AI Advisor Summary */}
            <div className="mt-6 pt-5 border-t border-white/15 bg-white/5 p-4 rounded-xl">
              <div className="text-xs uppercase tracking-wider text-amber-300 font-bold mb-1 flex items-center gap-1.5">
                <span>🤖 Lời khuyên tổng quan từ Cố vấn AI</span>
              </div>
              <p className="text-sm text-indigo-100 leading-relaxed">
                {data.aiAdviceSummary}
              </p>
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold text-base">
                <span className="p-1.5 bg-emerald-100 rounded-lg">💪</span>
                <span>Điểm mạnh đã ghi nhận</span>
              </div>
              <ul className="space-y-2.5">
                {data.strengths?.map((s, idx) => (
                  <li key={`s-${idx}`} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4 text-amber-700 font-bold text-base">
                <span className="p-1.5 bg-amber-100 rounded-lg">🎯</span>
                <span>Điểm cần cải thiện & Khuyến nghị</span>
              </div>
              <ul className="space-y-2.5">
                {data.weaknesses?.map((w, idx) => (
                  <li key={`w-${idx}`} className="flex items-start gap-2 text-sm text-slate-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    <span className="text-amber-500 font-bold shrink-0">!</span>
                    <span>{w}</span>
                  </li>
                ))}
                {data.recommendations?.map((r, idx) => (
                  <li key={`r-${idx}`} className="flex items-start gap-2 text-sm text-indigo-900 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-indigo-600 font-bold shrink-0">💡</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Step-by-Step Study Plan Timeline */}
          <Card>
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <span> Lộ trình Cải thiện Điểm số Cá nhân hóa</span>
            </h3>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-indigo-100">
              {data.studyPlan?.map((step) => (
                <div key={step.stepOrder} className="relative flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 z-10 shadow-md">
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
            <h3 className="font-bold text-slate-800 text-base mb-2">💬 Tham vấn trực tiếp với AI Advisor</h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập câu hỏi hoặc băn khoăn về bài học, môn học để nhận định hướng giải đáp từ Cố vấn AI
            </p>
            <form onSubmit={handleAskAdvisor} className="flex gap-3">
              <input
                type="text"
                placeholder="Ví dụ: Làm sao để cải thiện kỹ năng làm bài thi trắc nghiệm giữa kỳ?"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={asking || !queryInput.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 shrink-0 flex items-center gap-2"
              >
                {asking ? 'Đang phân tích…' : 'Gửi câu hỏi'}
              </button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}