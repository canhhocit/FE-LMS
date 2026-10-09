import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle2, RotateCcw, ArrowLeft, ChevronLeft, ChevronRight,
  Download, FileText, Plus, Clock, StickyNote
} from 'lucide-react';
import { PageHeader, Card, Spinner, Empty, ErrorBox, Badge, Button } from '../../components/ui';
import { LessonDiscussion } from '../../components/LessonDiscussion';
import * as clazzService from '../../services/clazzService';
import * as contentService from '../../services/contentService';
import * as progressService from '../../services/progressService';
import * as registrationService from '../../services/registrationService';
import * as videoLearningService from '../../services/videoLearningService';
import type { Chapter, Clazz, Lesson, EnrollmentProgress, Registration } from '../../types';
import type { StudentInVideoQuiz, StudentVideoNote } from '../../services/videoLearningService';

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const renderDocumentPreview = (url: string) => {
  const lower = url.toLowerCase();
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg')
  ) {
    return (
      <div className="flex justify-center p-2 bg-slate-900/5 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
        <img src={url} alt="Tài liệu đính kèm" className="max-h-96 rounded-lg object-contain shadow-xs" />
      </div>
    );
  }
  if (lower.endsWith('.pdf')) {
    return (
      <div className="w-full h-96 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
        <iframe src={url} className="w-full h-full border-0" title="Xem trước tài liệu PDF" />
      </div>
    );
  }
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg')) {
    return (
      <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
        <video src={url} controls className="w-full max-h-80" />
      </div>
    );
  }
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center text-sm text-slate-500 space-y-2">
      <FileText className="w-8 h-8 text-indigo-500 mx-auto opacity-80" />
      <p>Tài liệu này không hỗ trợ xem trước trực tiếp.</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Tải về máy</span>
      </a>
    </div>
  );
};

export default function StudentLessonLearning() {
  const { classId, lessonId } = useParams();
  const navigate = useNavigate();
  const classNum = Number(classId);
  const lessonNum = Number(lessonId);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxWatchedTimeRef = useRef<number>(0);
  const lastProgressSyncAtRef = useRef<number>(0);
  const progressSyncPendingRef = useRef<Promise<videoLearningService.VideoProgress> | null>(null);

  const [clazz, setClazz] = useState<Clazz | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterLessons, setChapterLessons] = useState<Record<number, Lesson[]>>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<EnrollmentProgress | null>(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [supplementaryError, setSupplementaryError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [videoRetryCount, setVideoRetryCount] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const enrollmentIdRef = useRef<number | null>(null);

  const [quizzes, setQuizzes] = useState<StudentInVideoQuiz[]>([]);
  const [notes, setNotes] = useState<StudentVideoNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [maxWatchedSec, setMaxWatchedSec] = useState<number>(0);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedLesson) return;
    setSavingNote(true);
    try {
      const timestamp = Math.floor(currentVideoTime || 0);
      const newNote = await videoLearningService.addNote({
        lessonId: selectedLesson.id,
        noteText: noteText.trim(),
        timestampSeconds: timestamp,
      });
      setNotes((prev) => [newNote, ...prev]);
      setNoteText('');
      setNoteError(null);
    } catch {
      setNoteError('Không thể lưu ghi chú. Vui lòng thử lại.');
    } finally {
      setSavingNote(false);
    }
  };

  const isLessonCompleted = selectedLesson
    ? progress?.lessons.some((item) => Number(item.lessonId) === Number(selectedLesson.id) && item.isCompleted)
    : false;
  const isLessonInProgress = selectedLesson
    ? !isLessonCompleted && Boolean(resumeSeconds > 5)
    : false;

  const canMarkComplete = useMemo(() => {
    if (isLessonCompleted) return true;
    if (!selectedLesson?.videoUrl) return true;
    const duration = videoDuration || Number(selectedLesson.duration ?? 0);
    if (duration <= 0) return false;
    const targetTime = duration * 0.8;
    return maxWatchedSec >= targetTime;
  }, [isLessonCompleted, selectedLesson?.videoUrl, selectedLesson?.duration, videoDuration, maxWatchedSec]);

  const saveResumePosition = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return;
    const safeSeconds = Math.max(0, Math.floor(seconds));
    setResumeSeconds(safeSeconds);
  };

  const clearResumePosition = () => {
    setResumeSeconds(0);
  };

  const syncVideoProgress = useCallback(async (force = false): Promise<void> => {
    const lesson = selectedLesson;
    const enrollmentId = enrollmentIdRef.current;
    const video = videoRef.current;
    if (!lesson?.videoUrl || !enrollmentId || !video) return;

    if (progressSyncPendingRef.current) {
      if (!force) return;
      await progressSyncPendingRef.current;
    }

    const now = Date.now();
    if (!force && now - lastProgressSyncAtRef.current < 15000) return;
    const lastWatchedSeconds = Math.floor(video.currentTime);
    const maxWatchedSeconds = Math.max(
      Math.floor(maxWatchedTimeRef.current),
      lastWatchedSeconds
    );
    const request = videoLearningService.upsertProgress({
      enrollmentId,
      lessonId: lesson.id,
      lastWatchedSeconds,
      maxWatchedSeconds,
    });
    progressSyncPendingRef.current = request;
    lastProgressSyncAtRef.current = now;
    try {
      const saved = await request;
      const serverLast = Number(saved.lastWatchedSeconds);
      const serverMax = Number(saved.maxWatchedSeconds);
      maxWatchedTimeRef.current = serverMax;
      setResumeSeconds(Math.floor(serverLast));
      setMaxWatchedSec(serverMax);
      setActionError(null);
      if (saved.completed && !isLessonCompleted) {
        setProgress(await progressService.getEnrollmentProgress(enrollmentId));
      }
    } catch (syncError) {
      lastProgressSyncAtRef.current = 0;
      throw syncError;
    } finally {
      progressSyncPendingRef.current = null;
    }
  }, [isLessonCompleted, selectedLesson]);

  const seekVideo = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    let nextTime = video.currentTime + deltaSeconds;
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
      setLoading(true);
      setError(null);
      setActionError(null);
      setNoteError(null);
      setSupplementaryError(null);
      setClazz(null);
      setSelectedLesson(null);
      setChapters([]);
      setChapterLessons({});
      setProgress(null);
      setQuizzes([]);
      setNotes([]);
      setVideoError(false);
      setVideoDuration(0);
      setResumeSeconds(0);
      setMaxWatchedSec(0);
      setCurrentVideoTime(0);
      maxWatchedTimeRef.current = 0;
      enrollmentIdRef.current = null;
      try {
        const [classData, chapterList] = await Promise.all([
          clazzService.getClazzDetail(classNum),
          contentService.getChapters(classNum),
        ]);

        if (!mounted) return;
        setClazz(classData);
        setChapters(chapterList);

        const lessonsByChapter = await Promise.all(
          chapterList.map(async (chapter) => {
            let lessons: Lesson[] = chapter.lessons ?? [];
            if (lessons.length === 0) {
              lessons = await contentService.getLessons(chapter.id);
            }
            return { chapterId: chapter.id, lessons };
          })
        );
        if (!mounted) return;

        const mapped: Record<number, Lesson[]> = {};
        lessonsByChapter.forEach(({ chapterId, lessons }) => {
          mapped[chapterId] = lessons;
        });
        setChapterLessons(mapped);

        const flatLessons = lessonsByChapter.flatMap(({ lessons }) => lessons);
        const listedLesson = flatLessons.find((item) => Number(item.id) === lessonNum);
        let lesson: Lesson;
        if (listedLesson) {
          lesson = listedLesson;
        } else {
          const detail = await contentService.getLessonDetail(lessonNum);
          if (!chapterList.some((chapter) => Number(chapter.id) === Number(detail.chapterId))) {
            throw new Error('Bài học không thuộc lớp này.');
          }
          lesson = detail;
        }
        if (!mounted) return;
        setSelectedLesson(lesson);
        setVideoDuration(Number(lesson.duration ?? 0));

        const registrations: Registration[] = await registrationService.getMyRegistrations();
        if (!mounted) return;
        const matchedRegistration = registrations.find((item) => Number(item.clazzId) === classNum);
        const enrollmentId = matchedRegistration?.enrollmentId;
        if (!enrollmentId) throw new Error('Không tìm thấy đăng ký học của lớp này.');
        enrollmentIdRef.current = enrollmentId;
        const serverProgress = await videoLearningService.getProgress(lessonNum, enrollmentId);
        if (!mounted) return;
        const serverLast = Number(serverProgress?.lastWatchedSeconds ?? 0);
        const serverMax = Number(serverProgress?.maxWatchedSeconds ?? 0);
        lastProgressSyncAtRef.current = 0;
        maxWatchedTimeRef.current = serverMax;
        setResumeSeconds(serverLast);
        setMaxWatchedSec(serverMax);
        setCurrentVideoTime(serverLast);

        void Promise.allSettled([
          videoLearningService.getQuizzesForLesson(lessonNum),
          videoLearningService.getNotes(lessonNum),
        ]).then(([quizResult, noteResult]) => {
          if (!mounted) return;
          if (quizResult.status === 'fulfilled') setQuizzes(quizResult.value);
          if (noteResult.status === 'fulfilled') setNotes(noteResult.value);
          const errors = [
            quizResult.status === 'rejected' ? 'Không thể tải câu hỏi video.' : null,
            noteResult.status === 'rejected' ? 'Không thể tải ghi chú.' : null,
          ].filter(Boolean);
          if (errors.length) setSupplementaryError(errors.join(' '));
        });

        let progressData = await progressService.getEnrollmentProgress(enrollmentId);
        if (!mounted) return;
        if (mounted) setProgress(progressData);

        if (!lesson.videoUrl) {
          const isAlreadyCompleted = progressData.lessons.some(
            (item) => Number(item.lessonId) === Number(lesson.id) && item.isCompleted
          );
          if (!isAlreadyCompleted) {
            await progressService.markLessonComplete(lesson.id, enrollmentId);
            if (!mounted) return;
            progressData = await progressService.getEnrollmentProgress(enrollmentId);
            if (mounted) setProgress(progressData);
          }
        }
      } catch (e: unknown) {
        if (mounted) setError((e as { message?: string })?.message ?? 'Không thể tải bài học.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [classNum, lessonNum, retryCount]);

  useEffect(() => () => {
    const video = videoRef.current;
    const lesson = selectedLesson;
    const enrollmentId = enrollmentIdRef.current;
    if (!video || !lesson?.videoUrl || !enrollmentId) return;
    void videoLearningService.upsertProgress({
      enrollmentId,
      lessonId: lesson.id,
      lastWatchedSeconds: Math.floor(video.currentTime),
      maxWatchedSeconds: Math.max(Math.floor(maxWatchedTimeRef.current), Math.floor(video.currentTime)),
    }).catch((syncError: unknown) => {
      console.error('Failed to save video progress when leaving the lesson', syncError);
    });
  }, [selectedLesson]);

  const onMarkCompleted = async () => {
    if (!selectedLesson || !progress) return;
    try {
      if (selectedLesson.videoUrl) await syncVideoProgress(true);
      await progressService.markLessonComplete(selectedLesson.id, progress.enrollmentId);
      const updated = await progressService.getEnrollmentProgress(progress.enrollmentId);
      setProgress(updated);
      clearResumePosition();
      setActionError(null);
    } catch (e: unknown) {
      setActionError((e as { message?: string })?.message ?? 'Không thể cập nhật tiến độ.');
    }
  };

  const handleVideoEnded = async () => {
    if (!selectedLesson || !progress || isLessonCompleted) return;
    await onMarkCompleted();
  };

  if (!classNum || !lessonNum) return <ErrorBox msg="Thiếu thông tin lớp học hoặc bài học." />;
  if (loading) return <Spinner />;
  if (error) return <ErrorBox msg={error} onRetry={() => setRetryCount((count) => count + 1)} />;
  if (!clazz || !selectedLesson) return <Empty msg="Không có dữ liệu bài học" />;

  const percent = progress?.percentage ?? 0;
  const orderedLessons = chapters.flatMap((chapter) => chapterLessons[chapter.id] ?? []);
  const currentLessonIndex = orderedLessons.findIndex((lesson) => Number(lesson.id) === Number(selectedLesson.id));
  const previousLesson = currentLessonIndex > 0 ? orderedLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 ? orderedLessons[currentLessonIndex + 1] ?? null : null;
  const currentChapter = chapters.find((chapter) => (chapterLessons[chapter.id] ?? []).some((lesson) => lesson.id === selectedLesson.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={selectedLesson.title}
        subtitle={`${clazz.classCode} · ${clazz.className} · ${currentChapter?.title ?? 'Chương học'}`}
        actions={
          <Link to={`/student/classes/${classNum}`}>
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại lớp học</span>
            </Button>
          </Link>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!previousLesson}
          onClick={() => previousLesson && navigate(`/student/classes/${classNum}/lessons/${previousLesson.id}`)}
        >
          <ChevronLeft className="w-4 h-4" /> Bài trước
        </Button>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {currentLessonIndex >= 0 ? `Bài ${currentLessonIndex + 1}/${orderedLessons.length}` : 'Bài học'}
          {selectedLesson.videoUrl && Number(selectedLesson.duration) > 0
            ? ` · ${formatTime(Number(selectedLesson.duration))}`
            : ''}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!nextLesson}
          onClick={() => nextLesson && navigate(`/student/classes/${classNum}/lessons/${nextLesson.id}`)}
        >
          Bài tiếp theo <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 text-sm">
              {isLessonCompleted ? (
                <Badge color="emerald">Đã học</Badge>
              ) : isLessonInProgress ? (
                <Badge color="amber">Đang xem ({formatTime(resumeSeconds)})</Badge>
              ) : (
                <Badge color="slate">Chưa học</Badge>
              )}
              {!isLessonCompleted && (
                <Badge color="rose">Chống tua tiến</Badge>
              )}
              {quizzes.length > 0 && (
                <Badge color="amber">{quizzes.length} câu hỏi video</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => seekVideo(-10)}>-10s</Button>
              <Button variant="ghost" size="sm" onClick={() => seekVideo(10)} disabled={!isLessonCompleted && currentVideoTime + 10 > maxWatchedSec}>+10s</Button>
              <Button variant="ghost" size="sm" onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                video.currentTime = 0;
                saveResumePosition(0);
              }}>
                <RotateCcw className="w-3 h-3" /> Xem lại
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl bg-slate-950 border border-slate-900">
              {selectedLesson.videoUrl ? (
                <video
                  key={videoRetryCount}
                  ref={videoRef}
                  className="w-full max-h-[460px] bg-black"
                  controls
                  preload="metadata"
                  src={selectedLesson.videoUrl}
                  onLoadedMetadata={() => {
                    const video = videoRef.current;
                    if (!video) return;
                    setVideoError(false);
                    if (Number(selectedLesson.duration) > 0) {
                      setVideoDuration(Number(selectedLesson.duration));
                    } else if (video.duration) {
                      setVideoDuration(video.duration);
                    }
                    const resumeAt = resumeSeconds;
                    if (resumeAt > 0) {
                      video.currentTime = Math.min(resumeAt, video.duration || resumeAt);
                    }
                  }}
                  onError={() => setVideoError(true)}
                  onSeeking={() => {
                    const video = videoRef.current;
                    if (!video || isLessonCompleted) return;
                    if (video.currentTime > maxWatchedTimeRef.current + 1.5) {
                      video.currentTime = maxWatchedTimeRef.current;
                    }
                  }}
                  onSeeked={() => {
                    void syncVideoProgress(true).catch((syncError: unknown) => {
                      setActionError((syncError as { message?: string })?.message ?? 'Không thể lưu tiến độ video.');
                    });
                  }}
                  onPause={() => {
                    void syncVideoProgress(true).catch((syncError: unknown) => {
                      setActionError((syncError as { message?: string })?.message ?? 'Không thể lưu tiến độ video.');
                    });
                  }}
                  onTimeUpdate={() => {
                    const video = videoRef.current;
                    if (!video) return;
                    const current = Number(video.currentTime || 0);
                    setCurrentVideoTime(current);

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
                    void syncVideoProgress().catch((syncError: unknown) => {
                      setActionError((syncError as { message?: string })?.message ?? 'Không thể lưu tiến độ video.');
                    });
                  }}
                  onEnded={() => void handleVideoEnded()}
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                  Bài học dạng tài liệu đọc
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {videoError && (
                <ErrorBox
                  msg="Không thể phát video. Kiểm tra kết nối hoặc thử tải lại video."
                  onRetry={() => {
                    setVideoError(false);
                    setVideoRetryCount((count) => count + 1);
                  }}
                />
              )}
              {actionError && <ErrorBox msg={actionError} />}
              {selectedLesson.videoUrl && videoDuration > 0 && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Đã xem {formatTime(maxWatchedSec)} / {formatTime(videoDuration)} · {Math.min(100, Math.floor((maxWatchedSec / videoDuration) * 100))}%
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedLesson.title}</h3>
                {selectedLesson.videoUrl && (
                  <Button
                    variant={isLessonCompleted ? "secondary" : "primary"}
                    size="sm"
                    disabled={!canMarkComplete}
                    onClick={() => void onMarkCompleted()}
                  >
                    {isLessonCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                  </Button>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedLesson.content || 'Chưa có thông tin mô tả chi tiết cho bài học này.'}
              </p>
            </div>
          </Card>

          {/* Attached Document Card (if lesson has attachment) */}
          {selectedLesson.attachmentUrl && (
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedLesson.attachmentName || 'Tài liệu đính kèm bài học'}
                  </h4>
                </div>
                {supplementaryError && (
                  <ErrorBox
                    msg={supplementaryError}
                    onRetry={() => setRetryCount((count) => count + 1)}
                  />
                )}
                {noteError && <ErrorBox msg={noteError} onRetry={() => {
                  setNoteError(null);
                  void handleAddNote();
                }} />}
                <a
                  href={selectedLesson.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải xuống</span>
                </a>
              </div>

              {renderDocumentPreview(selectedLesson.attachmentUrl)}
            </Card>
          )}

          {/* Personal Video/Lesson Notes Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Ghi chú cá nhân</h4>
                <Badge color="amber">{notes.length}</Badge>
              </div>
              {selectedLesson.videoUrl && (
                <span className="text-sm text-slate-400">
                  Thời điểm video: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatTime(currentVideoTime)}</strong>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddNote();
                  }
                }}
                placeholder={
                  selectedLesson.videoUrl
                    ? `Thêm ghi chú tại [${formatTime(currentVideoTime)}]...`
                    : "Nhập ghi chú cho bài học..."
                }
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-600"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={savingNote || !noteText.trim()}
                onClick={() => void handleAddNote()}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lưu</span>
              </Button>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                Chưa có ghi chú nào. Nhập nội dung ở trên để lưu ghi chú bài học.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {notes.map((note, idx) => (
                  <div
                    key={note.id ?? idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (note.timestampSeconds != null && videoRef.current) {
                            videoRef.current.currentTime = note.timestampSeconds;
                            saveResumePosition(note.timestampSeconds);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold hover:bg-amber-200 transition cursor-pointer"
                        title="Bấm để tua video tới thời điểm ghi chú này"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(note.timestampSeconds ?? 0)}</span>
                      </button>
                      {note.createdAt && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                      {note.noteText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <LessonDiscussion lessonId={selectedLesson.id} />
        </div>

        <div className="space-y-4">
          <Card>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-2">Tiến độ khóa học</h4>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-500">Bài đã hoàn thành</span>
              <span className="font-semibold">{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-accent-600 transition-all duration-300" style={{ width: `${percent}%` }} />
            </div>
          </Card>

          <Card>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-3">Danh sách bài học</h4>
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="space-y-1.5">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{chapter.title}</div>
                  <div className="space-y-1">
                    {(chapterLessons[chapter.id] ?? []).map((lesson) => {
                      const active = lesson.id === selectedLesson.id;
                      const done = progress?.lessons.some((item) => Number(item.lessonId) === Number(lesson.id) && item.isCompleted);
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => navigate(`/student/classes/${classNum}/lessons/${lesson.id}`)}
                          className={`flex w-full items-center justify-between gap-2 p-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                            active
                              ? 'bg-accent-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{lesson.title}</span>
                          {done ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] ${active ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                            </span>
                          ) : active ? (
                            <span className="text-[10px] text-white/80">Đang học</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Chưa học</span>
                          )}
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
