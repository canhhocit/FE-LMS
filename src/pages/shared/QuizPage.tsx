import { useEffect, useMemo, useState } from 'react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as clazzService from '../../services/clazzService';
import * as quizService from '../../services/quizService';
import type { Clazz, Quiz, QuizQuestion } from '../../types';

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await clazzService.getMyClasses();
        if (!mounted) return;
        setClasses(list);
        if (list[0]) {
          setSelectedClass(list[0].id);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        setErr((e as { message?: string })?.message ?? 'Không tải được lớp học');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedClass == null) return;
    (async () => {
      try {
        const list = await quizService.getQuizzesByClass(selectedClass);
        setQuizzes(list);
        setSelectedQuizId(list[0]?.id ?? null);
      } catch (e: unknown) {
        setErr((e as { message?: string })?.message ?? 'Không tải được quiz');
      }
    })();
  }, [selectedClass]);

  useEffect(() => {
    if (selectedQuizId == null || startedQuizId !== selectedQuizId) {
      setQuestions([]);
      return;
    }
    (async () => {
      try {
        const list = await quizService.getQuizQuestions(selectedQuizId);
        setQuestions(list);
        setAnswers({});
      } catch (e: unknown) {
        setErr((e as { message?: string })?.message ?? 'Không tải được câu hỏi');
      }
    })();
  }, [selectedQuizId, startedQuizId]);

  const activeQuiz = useMemo(() => quizzes.find((q) => q.id === selectedQuizId) ?? null, [quizzes, selectedQuizId]);

  const handleSubmit = async () => {
    if (!selectedQuizId) return;
    setSubmitting(true);
    try {
      await quizService.submitQuiz(selectedQuizId, Object.entries(answers).map(([questionId, selected]) => ({ questionId: Number(questionId), selectedAnswer: String.fromCharCode(65 + selected) as 'A' | 'B' | 'C' | 'D' })));
      setErr(null);
      setQuestions([]);
      setAnswers({});
      setStartedQuizId(null);
      const list = await quizService.getQuizzesByClass(selectedClass!);
      setQuizzes(list);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    if (selectedQuizId == null) return;
    try {
      await quizService.startQuiz(selectedQuizId);
      setStartedQuizId(selectedQuizId);
      setErr(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể bắt đầu quiz');
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div>
      <PageTitle>Quiz & Bài kiểm tra</PageTitle>
      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm text-slate-500">Lớp:</label>
        <select value={selectedClass ?? ''} onChange={(e) => setSelectedClass(Number(e.target.value))} className="bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-700">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.classCode} - {c.className}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold mb-3">Danh sách Quiz</h3>
          {quizzes.length === 0 ? <Empty msg="Chưa có quiz" /> : (
            <div className="space-y-2">
              {quizzes.map((q) => (
                <button key={q.id} onClick={() => { setSelectedQuizId(q.id); setStartedQuizId(null); }} className={`w-full text-left rounded-lg border p-3 ${selectedQuizId === q.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                  <div className="font-medium text-slate-800">{q.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{q.durationMinutes ?? 30} phút</div>
                  <div className="mt-2"><Pill color="indigo">{q.totalScore} điểm</Pill></div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          {activeQuiz ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{activeQuiz.title}</h3>
                  <div className="text-sm text-slate-500">Bài kiểm tra trắc nghiệm</div>
                </div>
                <Pill color="indigo">{activeQuiz.durationMinutes ?? 30} phút</Pill>
              </div>

              {startedQuizId !== selectedQuizId ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-600 mb-3">Bắt đầu quiz để tải câu hỏi.</p>
                  <button onClick={() => void handleStart()} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark">Bắt đầu quiz</button>
                </div>
              ) : questions.length === 0 ? <Empty msg="Chưa có câu hỏi cho quiz này" /> : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="font-medium mb-2">Câu {idx + 1}: {q.content}</div>
                      <div className="space-y-2">
                        {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, opIdx) => (
                          <label key={`${q.id}-${opIdx}`} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id] === opIdx}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opIdx }))}
                            />
                            <span>{String.fromCharCode(65 + opIdx)}. {opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button disabled={submitting || questions.length === 0} onClick={() => void handleSubmit()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500">
                  {submitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </div>
          ) : <Empty msg="Chọn một quiz để xem câu hỏi" />}
        </Card>
      </div>
    </div>
  );
}
