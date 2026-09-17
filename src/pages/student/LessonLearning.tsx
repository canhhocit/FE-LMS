import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, Check, CheckCircle2, AlertCircle, HelpCircle, FileText, Download, RotateCcw } from 'lucide-react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as clazzService from '../../services/clazzService';
import * as contentService from '../../services/contentService';
import * as progressService from '../../services/progressService';
import * as registrationService from '../../services/registrationService';
import * as videoLearningService from '../../services/videoLearningService';
import type { Chapter, Clazz, Lesson, EnrollmentProgress, Registration } from '../../types';
import type { InVideoQuiz, StudentVideoNote } from '../../services/videoLearningService';

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function StudentLessonLearning() {
  const { classId, lessonId } = useParams();
  const navigate = useNavigate();
  const classNum = Number(classId);
  const lessonNum = Number(lessonId);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedResumeRef = useRef<number>(0);
  const maxWatchedTimeRef = useRef<number>(0);

  const [clazz, setClazz] = useState<Clazz | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterLessons, setChapterLessons] = useState<Record<number, Lesson[]>>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<EnrollmentProgress | null>(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enrollmentIdRef = useRef<number | null>(null);

  const [quizzes, setQuizzes] = useState<InVideoQuiz[]>([]);
  const [notes, setNotes] = useState<StudentVideoNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [maxWatchedSec, setMaxWatchedSec] = useState<number>(0);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);

  const resumeKey = useMemo(
    () => `learninghub:resume:${classNum}:${lessonNum}`,
    [classNum, lessonNum]
  );

  const getStoredResumeSeconds = useCallback(() => {
    const saved = Number(localStorage.getItem(resumeKey) ?? '0');
    if (!Number.isFinite(saved) || saved < 0) return 0;
    return Math.max(0, Math.floor(saved));
  }, [resumeKey]);

  const isLessonCompleted = selectedLesson
    ? progress?.lessons.some((item) => item.lessonId === selectedLesson.id && item.isCompleted)
    : false;
  const isLessonInProgress = selectedLesson
    ? !isLessonCompleted && Boolean(resumeSeconds > 5)
    : false;

  const canMarkComplete = useMemo(() => {
    if (isLessonCompleted) return true;
    if (!selectedLesson?.videoUrl) return true;
    if (videoDuration <= 0) return false;
    const targetTime = videoDuration <= 10 ? videoDuration * 0.9 : videoDuration - 10;
    return maxWatchedSec >= targetTime;
  }, [isLessonCompleted, selectedLesson?.videoUrl, videoDuration, maxWatchedSec]);

  const saveResumePosition = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return;
    const safeSeconds = Math.max(0, Math.floor(seconds));
    if (safeSeconds === lastSavedResumeRef.current) return;

    lastSavedResumeRef.current = safeSeconds;
    localStorage.setItem(resumeKey, String(safeSeconds));
    setResumeSeconds(safeSeconds);
  };

  const clearResumePosition = () => {
    lastSavedResumeRef.current = 0;
    localStorage.removeItem(resumeKey);
    setResumeSeconds(0);
  };

  const seekVideo = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    let nextTime = video.currentTime + deltaSeconds;
    // Chống tua tiến vượt quá phần đã học khi chưa hoàn thành bài
    if (!isLessonCompleted && deltaSeconds > 0) {
      if (nextTime > maxWatchedTimeRef.current) {
        nextTime = maxWatchedTimeRef.current;
      }
    }
    nextTime = Math.max(0, Math.min(video.duration || 0, nextTime));
    video.currentTime = nextTime;
    saveResumePosition(nextTime);
  };

  useEffect(() => {
    if (!classNum || !lessonNum) return;

    let mounted = true;
    const load = async () => {
      try {
        const [classData, chapterList] = await Promise.all([
          clazzService.getClazzDetail(classNum),
          contentService.getChapters(classNum),
        ]);

        if (!mounted) return;
        setClazz(classData);
        setChapters(chapterList);

        const lessonsByChapter = await Promise.all(
          chapterList.map(async (chapter) => ({
            chapterId: chapter.id,
            lessons: await contentService.getLessons(chapter.id),
          }))
        );

        const mapped: Record<number, Lesson[]> = {};
        lessonsByChapter.forEach(({ chapterId, lessons }) => {
          mapped[chapterId] = lessons;
        });
        setChapterLessons(mapped);

        const flatLessons = lessonsByChapter.flatMap(({ lessons }) => lessons);
        const lesson = flatLessons.find((item) => item.id === lessonNum) ?? flatLessons[0] ?? null;
        if (!lesson) {
          setError('Bài học không tồn tại trong lớp này.');
          return;
        }
        setSelectedLesson(lesson);

        const savedResume = getStoredResumeSeconds();
        setResumeSeconds(savedResume);
        maxWatchedTimeRef.current = savedResume;
        setMaxWatchedSec(savedResume);

        const registrations: Registration[] = await registrationService.getMyRegistrations();
        const matchedRegistration = registrations.find((item) => item.clazzId === classNum);
        if (!matchedRegistration) {
          setError('Bạn chưa tham gia lớp học này.');
          return;
        }

        enrollmentIdRef.current = matchedRegistration.enrollmentId;

        // Load server-side progress
        const serverProgress = await videoLearningService.getProgress(lessonNum, matchedRegistration.enrollmentId);
        if (serverProgress) {
          const serverLast = Number(serverProgress.lastWatchedSeconds || 0);
          const serverMax = Number(serverProgress.maxWatchedSeconds || 0);
          const highestServer = Math.max(serverLast, serverMax);
          if (highestServer > getStoredResumeSeconds()) {
            localStorage.setItem(resumeKey, String(Math.floor(highestServer)));
            setResumeSeconds(Math.floor(highestServer));
          }
          maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, highestServer);
        }
        setMaxWatchedSec(maxWatchedTimeRef.current);

        // Load quizzes and notes
        const [quizData, noteData] = await Promise.all([
          videoLearningService.getQuizzesForLesson(lessonNum),
          videoLearningService.getNotes(lessonNum),
        ]);
        if (mounted) {
          setQuizzes(quizData ?? []);
          setNotes(noteData ?? []);
        }

        const progressData = await progressService.getEnrollmentProgress(matchedRegistration.enrollmentId);
        if (mounted) setProgress(progressData);

        // Auto mark complete if lesson has no video
        if (!lesson.videoUrl && matchedRegistration.enrollmentId) {
          const isAlreadyCompleted = progressData?.lessons.some((item) => item.lessonId === lesson.id && item.isCompleted);
          if (!isAlreadyCompleted) {
            try {
              await progressService.markLessonComplete(lesson.id, matchedRegistration.enrollmentId);
              const updated = await progressService.getEnrollmentProgress(matchedRegistration.enrollmentId);
              if (mounted) setProgress(updated);
            } catch {
              // Best effort auto-mark
            }
          }
        }
      } catch (e: unknown) {
        setError((e as { message?: string })?.message ?? 'Không thể tải bài học.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [classNum, lessonNum, getStoredResumeSeconds, resumeKey]);

  const orderedLessons = useMemo(
    () => Object.values(chapterLessons).flat().sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
    [chapterLessons]
  );

  const currentIndex = orderedLessons.findIndex((lesson) => lesson.id === selectedLesson?.id);
  const prevLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null;

  const onMarkCompleted = async () => {
    if (!selectedLesson || !progress) return;
    try {
      await progressService.markLessonComplete(selectedLesson.id, progress.enrollmentId);
      const updated = await progressService.getEnrollmentProgress(progress.enrollmentId);
      setProgress(updated);
      clearResumePosition();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Không thể cập nhật tiến độ.');
    }
  };

  const handleVideoEnded = async () => {
    if (!selectedLesson || !progress || isLessonCompleted) return;
    await onMarkCompleted();
  };

  if (!classNum || !lessonNum) return <ErrorBox msg="Thiếu thông tin lớp học hoặc bài học." />;
  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={error} />;
  if (!clazz || !selectedLesson) return <Empty msg="Không có dữ liệu bài học" />;

  const percent = progress?.percentage ?? 0;
  const hasResume = resumeSeconds > 10;
  const currentChapter = chapters.find((chapter) => (chapterLessons[chapter.id] ?? []).some((lesson) => lesson.id === selectedLesson.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <PageTitle>{selectedLesson.title}</PageTitle>
        <Link to={`/student/classes/${classNum}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">← Quay lại lớp học</Link>
      </div>

      <Card className="border border-indigo-100 bg-linear-to-r from-indigo-50 via-white to-blue-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500">Lớp học</div>
            <div className="mt-1 text-xl font-bold text-slate-800">{clazz.className}</div>
            <div className="mt-1 text-sm text-slate-500">{clazz.classCode} · {currentChapter?.title ?? 'Chương học'} · {selectedLesson.title}</div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">Hoàn thành {percent}%</span>
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0} bài</span>
            {hasResume && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">Tiếp tục từ {formatTime(resumeSeconds)}</span>}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_0.9fr]">
        <Card>
          <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 max-w-full whitespace-nowrap sm:flex-wrap sm:whitespace-normal scrollbar-none">
            {isLessonCompleted ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Đã học
              </span>
            ) : isLessonInProgress ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                Đang xem · {formatTime(resumeSeconds)}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Chưa học
              </span>
            )}
            {!isLessonCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600">
                <Lock className="w-3 h-3" />
                Chống tua tiến
              </span>
            )}
            {quizzes.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
                <HelpCircle className="w-3 h-3" />
                {quizzes.length} câu hỏi video
              </span>
            )}
            {hasResume && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                Tiếp tục từ {formatTime(resumeSeconds)}
              </span>
            )}
            <button
              type="button"
              onClick={() => seekVideo(-10)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              -10s
            </button>
            <button
              type="button"
              onClick={() => seekVideo(10)}
              disabled={!isLessonCompleted && currentVideoTime + 10 > maxWatchedSec}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              +10s
            </button>
            <button
              type="button"
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                video.currentTime = 0;
                saveResumePosition(0);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Bắt đầu lại
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            {selectedLesson.videoUrl ? (
              <video
                ref={videoRef}
                className="w-full max-h-120 bg-black"
                controls
                preload="metadata"
                src={selectedLesson.videoUrl}
                poster=""
                onLoadedMetadata={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  if (video.duration) setVideoDuration(video.duration);
                  const resumeAt = getStoredResumeSeconds();
                  if (resumeAt > 0) {
                    video.currentTime = Math.min(resumeAt, video.duration || resumeAt);
                    setResumeSeconds(resumeAt);
                    maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, resumeAt);
                    setMaxWatchedSec(maxWatchedTimeRef.current);
                  }
                }}
                onDurationChange={() => {
                  if (videoRef.current?.duration) {
                    setVideoDuration(videoRef.current.duration);
                  }
                }}
                onPlay={() => {
                  const video = videoRef.current;
                  if (video) {
                    setResumeSeconds(Number(video.currentTime || 0));
                  }
                }}
                onPause={() => {
                  const video = videoRef.current;
                  if (video) {
                    const cur = video.currentTime || 0;
                    saveResumePosition(cur);
                    if (enrollmentIdRef.current) {
                      void videoLearningService.upsertProgress({
                        enrollmentId: enrollmentIdRef.current,
                        lessonId: lessonNum,
                        lastWatchedSeconds: Math.floor(cur),
                        maxWatchedSeconds: Math.floor(maxWatchedTimeRef.current),
                      });
                    }
                  }
                }}
                onSeeking={() => {
                  if (isLessonCompleted) return;
                  const video = videoRef.current;
                  if (!video) return;
                  if (video.currentTime > maxWatchedTimeRef.current + 1.5) {
                    video.currentTime = maxWatchedTimeRef.current;
                  }
                }}
                onSeeked={() => {
                  if (isLessonCompleted) return;
                  const video = videoRef.current;
                  if (!video) return;
                  if (video.currentTime > maxWatchedTimeRef.current + 1.5) {
                    video.currentTime = maxWatchedTimeRef.current;
                  }
                }}
                onTimeUpdate={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  const current = Number(video.currentTime || 0);
                  setCurrentVideoTime(current);

                  // Kiểm tra và ghi nhận thời lượng xem lớn nhất
                  if (!isLessonCompleted) {
                    if (current > maxWatchedTimeRef.current + 1.5) {
                      video.currentTime = maxWatchedTimeRef.current;
                      return;
                    }
                    if (current > maxWatchedTimeRef.current) {
                      maxWatchedTimeRef.current = current;
                      setMaxWatchedSec(current);
                    }
                  }

                  if (current > 0) {
                    saveResumePosition(current);
                  }
                }}
                onEnded={() => {
                  if (videoRef.current?.duration) {
                    maxWatchedTimeRef.current = videoRef.current.duration;
                    setMaxWatchedSec(videoRef.current.duration);
                  }
                  if (enrollmentIdRef.current) {
                    void videoLearningService.upsertProgress({
                      enrollmentId: enrollmentIdRef.current,
                      lessonId: lessonNum,
                      lastWatchedSeconds: Math.floor(videoRef.current?.duration || maxWatchedTimeRef.current),
                      maxWatchedSeconds: Math.floor(videoRef.current?.duration || maxWatchedTimeRef.current),
                    });
                  }
                  void handleVideoEnded();
                }}
              />
            ) : (
              <div className="flex min-h-60 items-center justify-center bg-slate-900 text-sm text-slate-300">Bài học này chưa có video</div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-800">{selectedLesson.title}</h2>
              {!selectedLesson.videoUrl ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
                  <span>✓ Tự động hoàn thành (Bài học tài liệu)</span>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    disabled={!canMarkComplete}
                    onClick={() => void onMarkCompleted()}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                      isLessonCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : canMarkComplete
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-200 cursor-pointer'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300 opacity-80'
                    }`}
                  >
                    {isLessonCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        Đã hoàn thành
                      </>
                    ) : canMarkComplete ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Đánh dấu hoàn thành
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-500" />
                        Đánh dấu hoàn thành
                      </>
                    )}
                  </button>
                  {!isLessonCompleted && selectedLesson.videoUrl && !canMarkComplete && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      Cần xem hết video mới tính
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-slate-600">{selectedLesson.content || 'Chưa có mô tả cho bài học này.'}</div>
            
            {/* Attachment File Section */}
            {selectedLesson.attachmentUrl && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-indigo-100 bg-linear-to-r from-indigo-50/80 to-blue-50/80 p-3.5 text-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {selectedLesson.attachmentName || 'Tài liệu đính kèm bài học'}
                  </div>
                  <div className="text-xs text-slate-500">Tài liệu đính kèm kèm theo bài học</div>
                </div>
                <a
                  href={selectedLesson.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="shrink-0 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  Tải về / Xem tài liệu
                </a>
              </div>
            )}
            
            {/* Video Notes Section */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Ghi chú bài học ({notes.length})
                </span>
                <span className="text-slate-400">{showNotes ? '▲' : '▼'}</span>
              </button>
              {showNotes && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && noteText.trim()) {
                          const v = videoRef.current;
                          const ts = v ? Math.floor(v.currentTime) : 0;
                          videoLearningService.addNote({ lessonId: lessonNum, noteText: noteText.trim(), timestampSeconds: ts }).then((n) => {
                            setNotes((prev) => [...prev, n]);
                            setNoteText('');
                          });
                        }
                      }}
                      placeholder="Thêm ghi chú tại thời điểm hiện tại..."
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!noteText.trim()) return;
                        const v = videoRef.current;
                        const ts = v ? Math.floor(v.currentTime) : 0;
                        videoLearningService.addNote({ lessonId: lessonNum, noteText: noteText.trim(), timestampSeconds: ts }).then((n) => {
                          if (n && typeof n === 'object') {
                            setNotes((prev) => [...prev, n]);
                          }
                          setNoteText('');
                        });
                      }}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                  {notes.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {notes.filter((n): n is StudentVideoNote => Boolean(n && typeof n === 'object')).map((n, i) => (
                        <div key={n.id ?? i} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-sm group hover:bg-violet-50 transition-colors">
                          <button
                            type="button"
                            onClick={() => {
                              const v = videoRef.current;
                              if (v) { v.currentTime = Number(n.timestampSeconds || 0); v.play(); }
                            }}
                            className="shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-mono font-semibold text-violet-700 hover:bg-violet-200 transition-colors"
                          >
                            {formatTime(Number(n.timestampSeconds || 0))}
                          </button>
                          <span className="text-slate-700 flex-1">{n.noteText}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-sm font-semibold text-slate-700">{percent}%</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              {prevLesson ? (
                <button onClick={() => navigate(`/student/classes/${classNum}/lessons/${prevLesson.id}`)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Bài trước</button>
              ) : <span />}
              {nextLesson ? (
                <button onClick={() => navigate(`/student/classes/${classNum}/lessons/${nextLesson.id}`)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Bài tiếp</button>
              ) : <span />}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Tiến độ khóa học</h3>
              <Pill color="indigo">{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0}</Pill>
            </div>
            <div className="text-sm text-slate-600">{clazz.classCode} · {clazz.className}</div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-slate-800">Danh sách bài học</h3>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="mb-2 text-sm font-semibold text-slate-700">{chapter.title}</div>
                  <div className="space-y-1">
                    {(chapterLessons[chapter.id] ?? []).map((lesson) => {
                      const active = lesson.id === selectedLesson.id;
                      const done = progress?.lessons.some((item) => item.lessonId === lesson.id && item.isCompleted);
                      const inProgress = !done && progress?.lessons.some((item) => item.lessonId === lesson.id && !item.isCompleted);
                      const statusText = done ? 'Đã học' : inProgress ? 'Đang học' : 'Chưa học';
                      const statusClass = done
                        ? 'bg-emerald-100 text-emerald-700'
                        : inProgress
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600';

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => navigate(`/student/classes/${classNum}/lessons/${lesson.id}`)}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm ${active ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-white'}`}
                        >
                          <span className="truncate">{lesson.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
                            {statusText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
