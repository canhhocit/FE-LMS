import { useEffect, useMemo, useState, useRef } from 'react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as clazzService from '../../services/clazzService';
import * as quizService from '../../services/quizService';
import type { QuestionRequest } from '../../services/quizService';
import type { Clazz, Quiz, QuizQuestion } from '../../types';
import { 
  Sparkles, Plus, Clock, Calendar, CheckCircle2, AlertCircle, FileText, 
  Upload, Trash2, Pencil, Timer, HelpCircle, X
} from 'lucide-react';

export default function QuizPage() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [startedQuizId, setStartedQuizId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Timer countdown for active attempt
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lecturer Question & Quiz Form States
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState(30);
  const [quizTotalScore, setQuizTotalScore] = useState(10);
  const [quizStartTime, setQuizStartTime] = useState('');
  const [quizEndTime, setQuizEndTime] = useState('');
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Question Edit Form
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  const [qA, setQA] = useState('');
  const [qB, setQB] = useState('');
  const [qC, setQC] = useState('');
  const [qD, setQD] = useState('');
  const [savingQ, setSavingQ] = useState(false);

  // Quizlet Import Modal
  const [showQuizletModal, setShowQuizletModal] = useState(false);
  const [quizletText, setQuizletText] = useState('');

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiNum, setAiNum] = useState(5);
  const [generatingAi, setGeneratingAi] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const isLecturer = storedUser?.role === 'LECTURER' || storedUser?.role === 'ADMIN';

  // Load classes on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await clazzService.getMyClasses();
        if (!mounted) return;
        setClasses(list);
        if (list[0]) setSelectedClass(list[0].id);
      } catch (e: unknown) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Không tải được danh sách lớp học');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load quizzes when selectedClass changes
  const loadQuizzes = async (classId: number) => {
    try {
      const list = await quizService.getQuizzesByClass(classId);
      setQuizzes(list);
      if (list.length > 0 && !selectedQuizId) setSelectedQuizId(list[0].id);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được danh sách bài trắc nghiệm');
    }
  };

  useEffect(() => {
    if (selectedClass == null) return;
    void loadQuizzes(selectedClass);
  }, [selectedClass]);

  // Load questions when active quiz changes or starts
  useEffect(() => {
    if (selectedQuizId == null) {
      setQuestions([]);
      return;
    }
    (async () => {
      try {
        const list = await quizService.getQuizQuestions(selectedQuizId);
        setQuestions(list);
        if (startedQuizId !== selectedQuizId) setAnswers({});
      } catch {
        // Questions loading handles silently
      }
    })();
  }, [selectedQuizId, startedQuizId]);

  // Timer countdown handler
  useEffect(() => {
    if (startedQuizId == null || timeLeftSeconds == null) return;

    if (timeLeftSeconds <= 0) {
      void handleSubmitAuto();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeftSeconds((prev) => (prev != null ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startedQuizId, timeLeftSeconds]);

  const activeQuiz = useMemo(() => quizzes.find((q) => q.id === selectedQuizId) ?? null, [quizzes, selectedQuizId]);

  const handleCreateQuiz = async () => {
    if (!selectedClass || !quizTitle.trim()) return;
    setSavingQuiz(true);
    try {
      await quizService.createQuiz(selectedClass, {
        title: quizTitle.trim(),
        durationMinutes: quizDuration || 30,
        totalScore: quizTotalScore || 10,
      });
      setShowCreateQuizModal(false);
      setQuizTitle('');
      setFlash('Đã tạo Quiz mới thành công!');
      await loadQuizzes(selectedClass);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Tạo Quiz thất bại');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleStart = async () => {
    if (selectedQuizId == null || !activeQuiz) return;
    try {
      await quizService.startQuiz(selectedQuizId);
      setStartedQuizId(selectedQuizId);
      const minutes = activeQuiz.durationMinutes ?? 30;
      setTimeLeftSeconds(minutes > 0 ? minutes * 60 : 3600);
      setErr(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể bắt đầu quiz. Có thể quiz chưa mở hoặc đã kết thúc.');
    }
  };

  const handleSubmitAuto = async () => {
    if (!selectedQuizId) return;
    setSubmitting(true);
    try {
      await quizService.submitQuiz(
        selectedQuizId,
        Object.entries(answers).map(([questionId, selected]) => ({
          questionId: Number(questionId),
          selectedAnswer: String.fromCharCode(65 + selected) as 'A' | 'B' | 'C' | 'D',
        }))
      );
      setStartedQuizId(null);
      setTimeLeftSeconds(null);
      setFlash('Hết giờ làm bài! Bài làm của bạn đã được tự động nộp thành công.');
      if (selectedClass) await loadQuizzes(selectedClass);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuizId) return;
    setSubmitting(true);
    try {
      await quizService.submitQuiz(
        selectedQuizId,
        Object.entries(answers).map(([questionId, selected]) => ({
          questionId: Number(questionId),
          selectedAnswer: String.fromCharCode(65 + selected) as 'A' | 'B' | 'C' | 'D',
        }))
      );
      setStartedQuizId(null);
      setTimeLeftSeconds(null);
      setFlash('Chúc mừng! Bạn đã hoàn thành và nộp bài kiểm tra thành công.');
      if (selectedClass) await loadQuizzes(selectedClass);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) return;
    setGeneratingAi(true);
    try {
      const generated = await quizService.generateAiQuestions({ topic: aiTopic.trim(), numQuestions: aiNum });
      setQuestions((prev) => [...prev, ...generated]);
      setShowAiModal(false);
      setAiTopic('');
      setFlash(`AI đã tạo thành công ${generated.length} câu hỏi mới!`);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi sinh câu hỏi bằng AI');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleImportQuizlet = async () => {
    if (!selectedQuizId || !quizletText.trim()) return;
    try {
      const lines = quizletText.split('\n').filter(l => l.trim().length > 0);
      let count = 0;
      for (const line of lines) {
        const parts = line.split('\t').map(p => p.trim());
        if (parts.length >= 5) {
          await quizService.createQuestion(selectedQuizId, {
            questionText: parts[0],
            optionA: parts[1],
            optionB: parts[2],
            optionC: parts[3],
            optionD: parts[4],
          });
          count++;
        }
      }
      setShowQuizletModal(false);
      setQuizletText('');
      setFlash(`Đã nhập thành công ${count} câu hỏi định dạng Quizlet!`);
      const freshQuestions = await quizService.getQuizQuestions(selectedQuizId);
      setQuestions(freshQuestions);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Import Quizlet thất bại');
    }
  };

  const startEditQuestion = (q: QuizQuestion) => {
    setEditQuestionId(q.id);
    setQText(q.questionText ?? q.content ?? '');
    setQA(q.optionA ?? '');
    setQB(q.optionB ?? '');
    setQC(q.optionC ?? '');
    setQD(q.optionD ?? '');
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuizId || !qText.trim() || !qA.trim() || !qB.trim() || !qC.trim() || !qD.trim()) return;
    setSavingQ(true);
    try {
      const data: QuestionRequest = { questionText: qText, optionA: qA, optionB: qB, optionC: qC, optionD: qD };
      if (editQuestionId) {
        await quizService.updateQuestion(editQuestionId, data);
      } else {
        await quizService.createQuestion(selectedQuizId, data);
      }
      setEditQuestionId(null);
      setQText(''); setQA(''); setQB(''); setQC(''); setQD('');
      setShowQuestionForm(false);
      const fresh = await quizService.getQuizQuestions(selectedQuizId);
      setQuestions(fresh);
      setFlash('Đã lưu câu hỏi.');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lưu câu hỏi thất bại');
    } finally {
      setSavingQ(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Xóa câu hỏi này khỏi bài kiểm tra?')) return;
    try {
      await quizService.deleteQuestion(questionId);
      if (selectedQuizId) {
        const list = await quizService.getQuizQuestions(selectedQuizId);
        setQuestions(list);
      }
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Xóa câu hỏi thất bại');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageTitle>Quiz & Bài Kiểm Tra Trắc Nghiệm</PageTitle>

      {/* Class Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">Lớp học phần:</label>
          <select 
            value={selectedClass ?? ''} 
            onChange={(e) => setSelectedClass(Number(e.target.value))} 
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {classes.map((c) => <option key={c.id} value={c.id}>{c.classCode} — {c.className}</option>)}
          </select>
        </div>

        {isLecturer && (
          <button
            onClick={() => setShowCreateQuizModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Quiz Mới
          </button>
        )}
      </div>

      {flash && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {flash}
        </div>
      )}

      {err && <ErrorBox msg={err} />}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Quiz List */}
        <Card className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Danh sách Quiz ({quizzes.length})
            </h3>
          </div>

          {quizzes.length === 0 ? <Empty msg="Lớp này chưa có bài quiz trắc nghiệm nào" /> : (
            <div className="space-y-3 max-h-135 overflow-y-auto pr-1">
              {quizzes.map((q) => (
                <button 
                  key={q.id} 
                  onClick={() => { setSelectedQuizId(q.id); setStartedQuizId(null); }} 
                  className={`w-full text-left rounded-xl border p-4 transition cursor-pointer ${
                    selectedQuizId === q.id 
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-800 text-sm">{q.title}</div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {q.durationMinutes ?? 30} phút
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      Thang {q.totalScore || 10} điểm
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right Column: Quiz Detail & Attempt Area */}
        <Card className="lg:col-span-2 space-y-4">
          {activeQuiz ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{activeQuiz.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Bài kiểm tra đánh giá kiến thức trắc nghiệm</p>
                </div>

                <div className="flex items-center gap-2">
                  <Pill color="indigo">{activeQuiz.durationMinutes ?? 30} phút làm bài</Pill>
                  {isLecturer && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => setShowAiModal(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Tạo bằng AI
                      </button>

                      <button
                        onClick={() => setShowQuizletModal(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Import Quizlet
                      </button>

                      <button
                        onClick={() => setShowQuestionForm(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Câu hỏi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Student View (Before Start vs In Progress) */}
              {startedQuizId !== selectedQuizId ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 p-6 space-y-3">
                  <Timer className="w-12 h-12 text-indigo-500 mx-auto opacity-80" />
                  <h4 className="text-base font-bold text-slate-800">Sẵn sàng làm bài trắc nghiệm</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Thời gian làm bài sẽ được tính ngược ngay khi bạn bấm nút bắt đầu. Khi hết giờ, bài làm sẽ tự động được gửi lên hệ thống.
                  </p>
                  <button 
                    onClick={() => void handleStart()} 
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Bắt đầu làm bài ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Countdown Timer Header */}
                  {timeLeftSeconds != null && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 sticky top-2 z-10 shadow-sm">
                      <span className="font-semibold text-sm flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
                        Thời gian còn lại:
                      </span>
                      <span className="font-mono text-xl font-bold text-amber-700 tracking-wider">
                        {formatTimer(timeLeftSeconds)}
                      </span>
                    </div>
                  )}

                  {questions.length === 0 ? <Empty msg="Chưa có câu hỏi nào trong bài quiz này" /> : (
                    <div className="space-y-4">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-slate-800 text-sm">
                              Câu {idx + 1}: {q.questionText ?? q.content}
                            </div>
                            {isLecturer && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => startEditQuestion(q)} className="text-slate-400 hover:text-indigo-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                            {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, opIdx) => {
                              const letter = String.fromCharCode(65 + opIdx);
                              const isSelected = answers[q.id] === opIdx;
                              return (
                                <label 
                                  key={`${q.id}-${opIdx}`} 
                                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition ${
                                    isSelected 
                                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-1 ring-indigo-600' 
                                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    checked={isSelected}
                                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opIdx }))}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>{letter}. {opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button 
                      disabled={submitting || questions.length === 0} 
                      onClick={() => void handleSubmit()} 
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm disabled:opacity-50 hover:bg-indigo-700 transition shadow-md cursor-pointer"
                    >
                      {submitting ? 'Đang nộp bài...' : 'Nộp bài kiểm tra'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : <Empty msg="Chọn một Quiz bên danh sách để xem nội dung" />}
        </Card>
      </div>

      {/* Modal Lecturer Create Quiz */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Tạo Quiz Trắc Nghiệm Mới</h3>
              <button onClick={() => setShowCreateQuizModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề Quiz</label>
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Kiểm tra giữa kỳ, Quiz chương 1..."
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian làm (Phút)</label>
                  <input
                    type="number"
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thang điểm</label>
                  <input
                    type="number"
                    value={quizTotalScore}
                    onChange={(e) => setQuizTotalScore(Number(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowCreateQuizModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateQuiz}
                disabled={savingQuiz || !quizTitle.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {savingQuiz ? 'Đang tạo...' : 'Tạo Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quizlet Import */}
      {showQuizletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Import Định Dạng Quizlet / Text TSV
              </h3>
              <button onClick={() => setShowQuizletModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Dán danh sách câu hỏi dạng Tab-separated (Câu hỏi [TAB] Đáp án A [TAB] Đáp án B [TAB] Đáp án C [TAB] Đáp án D)
              </p>
              <textarea
                value={quizletText}
                onChange={(e) => setQuizletText(e.target.value)}
                placeholder="Ví dụ: Lập trình Java là gì?	Ngôn ngữ	Hệ điều hành	Cơ sở dữ liệu	Trình duyệt"
                rows={6}
                className="w-full px-3 py-2 text-xs font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowQuizletModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleImportQuizlet}
                disabled={!quizletText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Nhập câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal AI Question Generator */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Trợ Lý AI Tạo Câu Hỏi Tự Động
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ đề / Nội dung tài liệu</label>
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Nhập chủ đề: Lập trình Hướng đối tượng Java..."
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng câu hỏi tạo</label>
                <input
                  type="number"
                  value={aiNum}
                  onChange={(e) => setAiNum(Number(e.target.value) || 5)}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleGenerateAi}
                disabled={generatingAi || !aiTopic.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {generatingAi ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Tạo câu hỏi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Question Form */}
      {showQuestionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {editQuestionId ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Trắc Nghiệm Mới'}
              </h3>
              <button onClick={() => setShowQuestionForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung câu hỏi</label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án A</label>
                  <input value={qA} onChange={(e) => setQA(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án B</label>
                  <input value={qB} onChange={(e) => setQB(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án C</label>
                  <input value={qC} onChange={(e) => setQC(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án D</label>
                  <input value={qD} onChange={(e) => setQD(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowQuestionForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={savingQ || !qText.trim() || !qA.trim() || !qB.trim() || !qC.trim() || !qD.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {savingQ ? 'Đang lưu...' : 'Lưu câu hỏi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
