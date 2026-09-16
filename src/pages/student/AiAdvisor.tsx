import { useEffect, useState } from 'react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 p-5 rounded-2xl border border-indigo-500/30 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative group shrink-0">
            <img
              src="/assets/anime_ai_avatar.jpg"
              alt="Hikari AI Mascot"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-400/80 shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-wide text-white mb-0">Trợ lý & Cố vấn Học tập AI Hikari</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-linear-to-r from-pink-500 to-purple-500 text-white uppercase tracking-wider shadow-xs">
                ✨ Anime AI Companion
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Phân tích phong cách học tập cá nhân hóa, điểm mạnh/điểm yếu và lộ trình nâng cao điểm số
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs font-semibold shrink-0">
          <img src="/assets/anime_chibi_bot.jpg" alt="Bot" className="w-6 h-6 rounded-full object-cover ring-1 ring-purple-300" />
          <span className="text-indigo-200">Gemini 2.0 AI Companion Online</span>
        </div>
      </div>

      {err && <ErrorBox msg={err} />}

      {data && (
        <>
          {/* Header Overview Card */}
          <div className="bg-linear-to-r from-indigo-950 via-indigo-900 to-purple-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-indigo-500/20">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/anime_ai_avatar.jpg"
                  alt="Student AI Profile"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-400/60 shadow-lg shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{data.studentName}</h2>
                    {getStatusBadge(data.academicStatus)}
                  </div>
                  <p className="text-indigo-200 text-sm flex items-center gap-2">
                    <span className="font-semibold text-purple-300">Phong cách học tập:</span>
                    <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-white font-medium text-xs">{data.learningStyle}</span>
                  </p>
                </div>
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
            <div className="mt-6 pt-5 border-t border-white/15 bg-white/5 p-4 rounded-xl flex items-start gap-3">
              <img
                src="/assets/anime_chibi_bot.jpg"
                alt="Chibi Bot"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-300/80 shrink-0 shadow-md"
              />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-amber-300 font-bold mb-1 flex items-center gap-1.5">
                  <span>✨ Lời khuyên tổng quan từ Cố vấn AI Hikari</span>
                </div>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  {data.aiAdviceSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2.5 mb-4 text-emerald-700 font-bold text-base">
                <span className="p-2 bg-emerald-100 rounded-xl text-lg">💪</span>
                <span>Điểm mạnh đã ghi nhận</span>
              </div>
              <ul className="space-y-2.5">
                {data.strengths?.map((s, idx) => (
                  <li key={`s-${idx}`} className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <div className="flex items-center gap-2.5 mb-4 text-amber-700 font-bold text-base">
                <span className="p-2 bg-amber-100 rounded-xl text-lg">🎯</span>
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
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl text-lg">🚀</span>
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
              <img
                src="/assets/anime_ai_avatar.jpg"
                alt="Hikari Chat Mascot"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-400 shadow-md shrink-0"
              />
              <div>
                <h3 className="font-bold text-slate-800 text-base">💬 Trò chuyện trực tiếp với Anime AI Advisor Hikari</h3>
                <p className="text-xs text-slate-500">
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
                className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={asking || !queryInput.trim()}
                className="px-5 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition shadow-md disabled:opacity-50 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                {asking ? 'Hikari đang phân tích…' : '✨ Gửi câu hỏi'}
              </button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}