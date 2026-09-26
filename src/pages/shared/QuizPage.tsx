import { useEffect, useMemo, useState, useRef, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageTitle, Card, Spinner, Empty, ErrorBox } from '../../components/Layout';
import * as clazzService from '../../services/clazzService';
import * as quizService from '../../services/quizService';
import type { QuestionRequest } from '../../services/quizService';
import type { Clazz, Quiz, QuizQuestion } from '../../types';
import { 
  Plus, Clock, CheckCircle2, FileText, 
  Upload, Trash2, Pencil, Timer, HelpCircle, X,
  FileSpreadsheet, Eye, Sparkles, Check, FileCode
} from 'lucide-react';

import { useAuth } from '../../contexts/useAuth';

export default function QuizPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramClassId = searchParams.get('classId');
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [startedQuizId, setStartedQuizId] = useState<number | null>(null);
  const [isLecturerPreview, setIsLecturerPreview] = useState(false);
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
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Question Edit Form
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  const [qA, setQA] = useState('');
  const [qB, setQB] = useState('');
  const [qC, setQC] = useState('');
  const [qD, setQD] = useState('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [savingQ, setSavingQ] = useState(false);

  // File / Quizlet Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'FILE' | 'TEXT'>('FILE');
  const [importText, setImportText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<QuestionRequest[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // AI Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiNum, setAiNum] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiDocName, setAiDocName] = useState<string | null>(null);

  const isLecturer = user?.role === 'LECTURER' || user?.role === 'ADMIN';

  // Auto dismiss flash banner after 5 seconds
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(timer);
  }, [flash]);

  // Load classes on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await clazzService.getMyClasses();
        if (!mounted) return;
        setClasses(list);
        if (paramClassId && list.some(c => c.id === Number(paramClassId))) {
          setSelectedClass(Number(paramClassId));
        } else if (list[0]) {
          setSelectedClass(list[0].id);
        }
      } catch (e: unknown) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Không tải được danh sách lớp học');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [paramClassId]);

  // Load quizzes when selectedClass changes
  const loadQuizzes = async (classId: number) => {
    try {
      const list = await quizService.getQuizzesByClass(classId);
      setQuizzes(list);
      if (list.length > 0 && !selectedQuizId) setSelectedQuizId(list[0].id);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được danh sách bài kiểm tra');
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
    setErr(null);
    try {
      const newQuiz = await quizService.createQuiz(selectedClass, {
        title: quizTitle.trim(),
        durationMinutes: quizDuration || 30,
        totalScore: quizTotalScore || 10,
      });
      setShowCreateQuizModal(false);
      setQuizTitle('');
      setFlash('Đã tạo bài kiểm tra mới thành công!');
      await loadQuizzes(selectedClass);
      if (newQuiz?.id) setSelectedQuizId(newQuiz.id);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Tạo bài kiểm tra thất bại');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này không?')) return;
    try {
      await quizService.deleteQuiz(quizId);
      setFlash('Đã xóa bài kiểm tra thành công.');
      setSelectedQuizId(null);
      if (selectedClass) await loadQuizzes(selectedClass);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Xóa bài kiểm tra thất bại');
    }
  };

  const handleStart = async () => {
    if (selectedQuizId == null || !activeQuiz) return;
    try {
      if (!isLecturerPreview) {
        await quizService.startQuiz(selectedQuizId);
      }
      setStartedQuizId(selectedQuizId);
      const minutes = activeQuiz.durationMinutes ?? 30;
      setTimeLeftSeconds(minutes > 0 ? minutes * 60 : 3600);
      setErr(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể bắt đầu làm bài. Có thể bài kiểm tra chưa mở hoặc đã kết thúc.');
    }
  };

  const handleSubmitAuto = async () => {
    if (!selectedQuizId) return;
    setSubmitting(true);
    try {
      if (!isLecturerPreview) {
        await quizService.submitQuiz(
          selectedQuizId,
          Object.entries(answers).map(([questionId, selected]) => ({
            questionId: Number(questionId),
            selectedAnswer: String.fromCharCode(65 + selected) as 'A' | 'B' | 'C' | 'D',
          }))
        );
      }
      setStartedQuizId(null);
      setTimeLeftSeconds(null);
      setIsLecturerPreview(false);
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
      if (!isLecturerPreview) {
        await quizService.submitQuiz(
          selectedQuizId,
          Object.entries(answers).map(([questionId, selected]) => ({
            questionId: Number(questionId),
            selectedAnswer: String.fromCharCode(65 + selected) as 'A' | 'B' | 'C' | 'D',
          }))
        );
      }
      setStartedQuizId(null);
      setTimeLeftSeconds(null);
      setIsLecturerPreview(false);
      setFlash(isLecturerPreview ? 'Đã hoàn thành xem trước bài làm thử.' : 'Chúc mừng! Bạn đã hoàn thành và nộp bài kiểm tra thành công.');
      if (selectedClass) await loadQuizzes(selectedClass);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!selectedQuizId || !aiTopic.trim()) return;
    setGeneratingAi(true);
    setErr(null);
    try {
      const generated = await quizService.generateAiQuestions(selectedQuizId, {
        content: aiTopic.trim(),
        numberOfQuestions: aiNum || 5,
        difficulty: aiDifficulty,
      });
      setShowAiModal(false);
      setAiTopic('');
      setAiDocName(null);
      setFlash(`Đã khởi tạo tự động thành công ${generated.length} câu hỏi mới bằng AI!`);
      const freshQuestions = await quizService.getQuizQuestions(selectedQuizId);
      setQuestions(freshQuestions);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tạo câu hỏi tự động. Vui lòng thử lại.');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Helper parser for Import text / file
  const parseQuestionText = (text: string): QuestionRequest[] => {
    const list: QuestionRequest[] = [];
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Try JSON parse first
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          for (const item of json) {
            if (item.questionText && item.optionA && item.optionB) {
              list.push({
                questionText: item.questionText || item.content || '',
                optionA: item.optionA || '',
                optionB: item.optionB || '',
                optionC: item.optionC || '',
                optionD: item.optionD || '',
                correctAnswer: (['A', 'B', 'C', 'D'].includes(item.correctAnswer) ? item.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D',
              });
            }
          }
          if (list.length > 0) return list;
        }
      } catch {
        // Fallback to text parsing
      }
    }

    // Tab-separated or comma-separated lines
    for (const line of lines) {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const cleanParts = parts.map((p) => p.trim());
      if (cleanParts.length >= 5) {
        const rawAns = cleanParts[5]?.toUpperCase();
        const correctAnswer = (['A', 'B', 'C', 'D'].includes(rawAns) ? rawAns : 'A') as 'A' | 'B' | 'C' | 'D';
        list.push({
          questionText: cleanParts[0],
          optionA: cleanParts[1],
          optionB: cleanParts[2],
          optionC: cleanParts[3] || '',
          optionD: cleanParts[4] || '',
          correctAnswer,
        });
      }
    }

    return list;
  };

  const handleTextOrFileParse = (text: string) => {
    setImportText(text);
    const parsed = parseQuestionText(text);
    setParsedQuestions(parsed);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, isForAi = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (isForAi) {
        setAiTopic(content);
        setAiDocName(file.name);
      } else {
        setFileName(file.name);
        handleTextOrFileParse(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!selectedQuizId || parsedQuestions.length === 0) return;
    setErr(null);
    try {
      let count = 0;
      for (const q of parsedQuestions) {
        await quizService.createQuestion(selectedQuizId, q);
        count++;
      }
      setShowImportModal(false);
      setImportText('');
      setParsedQuestions([]);
      setFileName(null);
      setFlash(`Đã nhập thành công ${count} câu hỏi vào bài kiểm tra!`);
      const freshQuestions = await quizService.getQuizQuestions(selectedQuizId);
      setQuestions(freshQuestions);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Import câu hỏi thất bại');
    }
  };

  const startEditQuestion = (q: QuizQuestion) => {
    setEditQuestionId(q.id);
    setQText(q.questionText ?? q.content ?? '');
    setQA(q.optionA ?? '');
    setQB(q.optionB ?? '');
    setQC(q.optionC ?? '');
    setQD(q.optionD ?? '');
    setQCorrect((q.correctAnswer as 'A' | 'B' | 'C' | 'D') || 'A');
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuizId || !qText.trim() || !qA.trim() || !qB.trim() || !qC.trim() || !qD.trim()) return;
    setSavingQ(true);
    setErr(null);
    try {
      const data: QuestionRequest = {
        questionText: qText.trim(),
        optionA: qA.trim(),
        optionB: qB.trim(),
        optionC: qC.trim(),
        optionD: qD.trim(),
        correctAnswer: qCorrect,
      };
      if (editQuestionId) {
        await quizService.updateQuestion(editQuestionId, data);
      } else {
        await quizService.createQuestion(selectedQuizId, data);
      }
      setEditQuestionId(null);
      setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQCorrect('A');
      setShowQuestionForm(false);
      const fresh = await quizService.getQuizQuestions(selectedQuizId);
      setQuestions(fresh);
      setFlash('Đã lưu câu hỏi thành công!');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lưu câu hỏi thất bại');
    } finally {
      setSavingQ(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Xóa câu hỏi này khỏi bài kiểm tra?')) return;
    setErr(null);
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
    <div className="space-y-5">
      <PageTitle>Bài Kiểm Tra Trắc Nghiệm</PageTitle>

      {/* Class Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lớp học phần:</label>
          <select 
            value={selectedClass ?? ''} 
            onChange={(e) => setSelectedClass(Number(e.target.value))} 
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            {classes.map((c) => <option key={c.id} value={c.id}>{c.classCode} — {c.className}</option>)}
          </select>
        </div>

        {isLecturer && (
          <button
            onClick={() => setShowCreateQuizModal(true)}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo Bài Kiểm Tra Mới
          </button>
        )}
      </div>

      {/* Flash Banner with Close Button & 5s Auto Dismiss */}
      {flash && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{flash}</span>
          </div>
          <button 
            onClick={() => setFlash(null)} 
            className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {err && <ErrorBox msg={err} />}

      {/* Main Split Layout: Left Fixed/Sticky List, Right Scrollable Content */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {/* Left Column: Fixed / Sticky Quiz List */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 space-y-3">
          <Card className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-semibold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Danh sách Bài kiểm tra ({quizzes.length})
              </h3>
            </div>

            {quizzes.length === 0 ? <Empty msg="Lớp này chưa có bài kiểm tra nào" /> : (
              <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {quizzes.map((q) => {
                  const isSelected = selectedQuizId === q.id;
                  return (
                    <div 
                      key={q.id}
                      className={`group relative rounded-md border p-3 transition cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected 
                          ? 'border-slate-900 dark:border-slate-600 bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white border-l-4 border-l-slate-900 dark:border-l-indigo-400 font-semibold' 
                          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                      onClick={() => { setSelectedQuizId(q.id); setStartedQuizId(null); setIsLecturerPreview(false); }} 
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="text-xs truncate">{q.title}</div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {q.durationMinutes ?? 30} phút
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            Thang {q.totalScore || 10} điểm
                          </span>
                        </div>
                      </div>

                      {isLecturer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteQuiz(q.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                          title="Xóa bài kiểm tra này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Independently Scrollable Detail & Questions */}
        <div className="lg:col-span-2">
          <Card className="rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
            {activeQuiz ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeQuiz.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bài kiểm tra trắc nghiệm ({questions.length} câu hỏi)</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                      {activeQuiz.durationMinutes ?? 30} phút làm bài
                    </span>
                    {isLecturer && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => setShowAiModal(true)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        >
                          Tạo tự động AI
                        </button>

                        <button
                          onClick={() => setShowImportModal(true)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          Import File
                        </button>

                        <button
                          onClick={() => {
                            setEditQuestionId(null);
                            setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQCorrect('A');
                            setShowQuestionForm(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Thêm câu hỏi
                        </button>

                        <button
                          onClick={() => handleDeleteQuiz(activeQuiz.id)}
                          className="p-1.5 text-xs rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Xóa bài kiểm tra này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* LECTURER VIEW: Questions & Answers List */}
                {isLecturer && !isLecturerPreview && startedQuizId !== selectedQuizId ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-md border border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                        Danh sách câu hỏi & đáp án ({questions.length} câu)
                      </span>
                      <button
                        onClick={() => {
                          setIsLecturerPreview(true);
                          void handleStart();
                        }}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem trước chế độ sinh viên
                      </button>
                    </div>

                    {questions.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md p-6 space-y-3">
                        <Sparkles className="w-8 h-8 text-slate-400 mx-auto opacity-80" />
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Bài kiểm tra chưa có câu hỏi nào</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Sử dụng tính năng Tạo tự động bằng AI hoặc Import file để thêm câu hỏi trắc nghiệm.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            onClick={() => setShowAiModal(true)}
                            className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            Tạo tự động bằng AI
                          </button>
                          <button
                            onClick={() => setShowImportModal(true)}
                            className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-xs hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Import từ file
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {questions.map((q, idx) => (
                          <div key={q.id} className="border border-slate-200 dark:border-slate-800 rounded-md p-3.5 bg-white dark:bg-slate-900 space-y-2.5">
                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                              <div className="font-medium text-slate-800 dark:text-white text-xs leading-relaxed">
                                <span className="font-bold text-slate-900 dark:text-white mr-1.5">Câu {idx + 1}:</span> 
                                {q.questionText ?? q.content}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button 
                                  onClick={() => startEditQuestion(q)} 
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" 
                                  title="Chỉnh sửa câu hỏi"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteQuestion(q.id)} 
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" 
                                  title="Xóa câu hỏi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {[
                                { key: 'A', text: q.optionA },
                                { key: 'B', text: q.optionB },
                                { key: 'C', text: q.optionC },
                                { key: 'D', text: q.optionD },
                              ].map((opt) => {
                                const isCorrect = q.correctAnswer === opt.key;
                                return (
                                  <div 
                                    key={`${q.id}-${opt.key}`} 
                                    className={`flex items-center justify-between p-2 rounded-md border text-xs transition ${
                                      isCorrect 
                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold' 
                                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span><strong className="mr-1">{opt.key}.</strong> {opt.text}</span>
                                    {isCorrect && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                                        <Check className="w-3 h-3" /> Đúng
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* STUDENT / IN-PROGRESS ATTEMPT VIEW */
                  <div>
                    {startedQuizId !== selectedQuizId ? (
                      <div className="py-8 text-center bg-slate-50/60 dark:bg-slate-800/40 rounded-md border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                        <Timer className="w-10 h-10 text-slate-500 mx-auto opacity-80" />
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">Sẵn sàng làm bài trắc nghiệm</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Thời gian làm bài sẽ được tính ngược ngay khi bạn bấm nút bắt đầu.
                        </p>
                        <button 
                          onClick={() => void handleStart()} 
                          className="px-5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium text-xs transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Bắt đầu làm bài ngay
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Countdown Timer Header */}
                        <div className="flex items-center justify-between p-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 sticky top-2 z-10">
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-slate-600 dark:text-slate-400 animate-pulse" />
                            <span className="font-semibold text-xs">Thời gian còn lại:</span>
                            {isLecturerPreview && (
                              <span className="text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                Xem trước
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                            {timeLeftSeconds != null ? formatTimer(timeLeftSeconds) : '--:--'}
                          </span>
                        </div>

                        {questions.length === 0 ? <Empty msg="Chưa có câu hỏi nào trong bài kiểm tra này" /> : (
                          <div className="space-y-3">
                            {questions.map((q, idx) => (
                              <div key={q.id} className="border border-slate-200 dark:border-slate-800 rounded-md p-3.5 bg-white dark:bg-slate-900 space-y-2.5">
                                <div className="font-medium text-slate-800 dark:text-white text-xs">
                                  <span className="font-bold text-slate-900 dark:text-white mr-1.5">Câu {idx + 1}:</span> 
                                  {q.questionText ?? q.content}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-0.5">
                                  {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, opIdx) => {
                                    const letter = String.fromCharCode(65 + opIdx);
                                    const isSelected = answers[q.id] === opIdx;
                                    return (
                                      <label 
                                        key={`${q.id}-${opIdx}`} 
                                        className={`flex items-center gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition ${
                                          isSelected 
                                            ? 'border-slate-900 bg-slate-100/80 dark:border-slate-500 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' 
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`q-${q.id}`}
                                          checked={isSelected}
                                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opIdx }))}
                                          className="text-slate-900 focus:ring-slate-500"
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

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          {isLecturerPreview && (
                            <button
                              onClick={() => {
                                setStartedQuizId(null);
                                setIsLecturerPreview(false);
                              }}
                              className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                            >
                              Thoát xem trước
                            </button>
                          )}
                          <button 
                            disabled={submitting || questions.length === 0} 
                            onClick={() => void handleSubmit()} 
                            className="ml-auto px-5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium text-xs disabled:opacity-50 transition cursor-pointer"
                          >
                            {submitting ? 'Đang nộp bài...' : 'Nộp bài kiểm tra'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : <Empty msg="Chọn một bài kiểm tra bên danh sách để xem nội dung" />}
          </Card>
        </div>
      </div>

      {/* Modal Lecturer Create Quiz */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-900 p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tạo Bài Kiểm Tra Trắc Nghiệm Mới</h3>
              <button onClick={() => setShowCreateQuizModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề Bài kiểm tra</label>
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Kiểm tra giữa kỳ, Bài kiểm tra 15 phút..."
                  className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Thời gian làm (Phút)</label>
                  <input
                    type="number"
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Thang điểm</label>
                  <input
                    type="number"
                    value={quizTotalScore}
                    onChange={(e) => setQuizTotalScore(Number(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setShowCreateQuizModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateQuiz}
                disabled={savingQuiz || !quizTitle.trim()}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50 cursor-pointer"
              >
                {savingQuiz ? 'Đang tạo...' : 'Tạo bài kiểm tra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern File & Quizlet Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                Import File Câu Hỏi Trắc Nghiệm
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Import Method Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                onClick={() => setImportTab('FILE')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  importTab === 'FILE'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Tải File (.txt, .csv, .json)
              </button>
              <button
                onClick={() => setImportTab('TEXT')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  importTab === 'TEXT'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> Dán Văn Bản Trực Tiếp
              </button>
            </div>

            {importTab === 'FILE' ? (
              <div className="space-y-3">
                <label className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 rounded-md p-5 text-center block cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/40">
                  <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5 opacity-80" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    {fileName ? `📄 ${fileName}` : 'Bấm vào đây để chọn file câu hỏi từ máy tính'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Hỗ trợ file định dạng `.txt`, `.csv`, `.tsv`, `.json`
                  </span>
                  <input type="file" accept=".txt,.csv,.tsv,.json" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dán định dạng Tab-separated / CSV: (Câu hỏi [TAB] Đáp án A [TAB] Đáp án B [TAB] Đáp án C [TAB] Đáp án D [TAB] Đáp án đúng)
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => handleTextOrFileParse(e.target.value)}
                  placeholder="Lập trình Java là gì?	Ngôn ngữ	Hệ điều hành	Cơ sở dữ liệu	Trình duyệt	A"
                  rows={5}
                  className="w-full px-3 py-2 text-xs font-mono border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>
            )}

            {/* Live Parsed Preview Badge */}
            {parsedQuestions.length > 0 && (
              <div className="p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Đã nhận diện {parsedQuestions.length} câu hỏi hợp lệ!
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={parsedQuestions.length === 0}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Nhập {parsedQuestions.length > 0 ? `${parsedQuestions.length} câu hỏi` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Modern AI Question Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tạo câu hỏi trắc nghiệm tự động bằng AI
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option to Upload Document for AI context */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đính kèm file tài liệu / bài giảng (Tùy chọn)
                </label>
                <label className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 rounded-md p-2.5 text-center block cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{aiDocName ? `📄 ${aiDocName}` : 'Tải file bài học (.txt, .md, .csv) để AI đọc nội dung'}</span>
                  </div>
                  <input type="file" accept=".txt,.md,.csv,.json" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung bài giảng / Chủ đề trắc nghiệm
                </label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Dán nội dung bài học hoặc chủ đề: Tổng quan Lập trình Hướng đối tượng Java, tính kế thừa, đa hình và đóng gói..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Số lượng câu hỏi
                  </label>
                  <div className="flex items-center gap-1">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setAiNum(num)}
                        className={`px-2 py-1 text-xs font-medium rounded-md border transition cursor-pointer ${
                          aiNum === num
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Tùy chỉnh:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={aiNum || ''}
                      onChange={(e) => setAiNum(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                      placeholder="Số câu (1-50)"
                      className="w-24 px-2 py-1 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-slate-400 font-mono"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">câu</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Độ khó
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      { key: 'EASY', label: 'Dễ' },
                      { key: 'MEDIUM', label: 'Vừa' },
                      { key: 'HARD', label: 'Khó' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.key}
                        onClick={() => setAiDifficulty(d.key as 'EASY' | 'MEDIUM' | 'HARD')}
                        className={`flex-1 py-1 text-xs font-medium rounded-md border transition cursor-pointer ${
                          aiDifficulty === d.key
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleGenerateAi}
                disabled={generatingAi || !aiTopic.trim()}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {generatingAi ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang tạo {aiNum} câu hỏi...</span>
                  </>
                ) : (
                  <span>Bắt đầu tạo câu hỏi</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Question Form */}
      {showQuestionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editQuestionId ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Trắc Nghiệm Mới'}
              </h3>
              <button onClick={() => setShowQuestionForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nội dung câu hỏi</label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Đáp án A</label>
                  <input value={qA} onChange={(e) => setQA(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Đáp án B</label>
                  <input value={qB} onChange={(e) => setQB(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Đáp án C</label>
                  <input value={qC} onChange={(e) => setQC(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Đáp án D</label>
                  <input value={qD} onChange={(e) => setQD(e.target.value)} className="w-full px-3 py-1.5 text-xs border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Đáp án đúng</label>
                <div className="flex items-center gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                    <button
                      type="button"
                      key={letter}
                      onClick={() => setQCorrect(letter)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition cursor-pointer ${
                        qCorrect === letter
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Đáp án {letter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setShowQuestionForm(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={savingQ || !qText.trim() || !qA.trim() || !qB.trim() || !qC.trim() || !qD.trim()}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50 cursor-pointer"
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
