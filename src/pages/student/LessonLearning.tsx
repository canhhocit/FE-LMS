import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, Check, CheckCircle2, AlertCircle, HelpCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { PageHeader, Card, Spinner, Empty, ErrorBox, Badge, Button } from '../../components/ui';
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
    ? progress?.lessons.some((item) => Number(item.lessonId) === Number(selectedLesson.id) && item.isCompleted)
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
          clazzService.getClazzDetail(classNum).catch(() => null),
          contentService.getChapters(classNum).catch(() => []),
        ]);

        if (!mounted) return;
        if (classData) setClazz(classData);
        setChapters(chapterList);

        const lessonsByChapter = await Promise.all(
          chapterList.map(async (chapter) => {
            let lessons: Lesson[] = chapter.lessons ?? [];
            if (lessons.length === 0) {
              try {
                lessons = await contentService.getLessons(chapter.id);
              } catch {
                lessons = [];
              }
            }
            return { chapterId: chapter.id, lessons };
          })
        );

        const mapped: Record<number, Lesson[]> = {};
        lessonsByChapter.forEach(({ chapterId, lessons }) => {
          mapped[chapterId] = lessons;
        });
        setChapterLessons(mapped);

        const flatLessons = lessonsByChapter.flatMap(({ lessons }) => lessons);
        let lesson = flatLessons.find((item) => Number(item.id) === lessonNum) ?? null;
        if (!lesson) {
          try {
            lesson = await contentService.getLessonDetail(lessonNum);
          } catch {
            lesson = flatLessons[0] ?? null;
          }
        }
        if (!lesson) {
          setError('Bài học không tồn tại trong lớp này.');
          return;
        }
        setSelectedLesson(lesson);

        const savedResume = getStoredResumeSeconds();
        setResumeSeconds(savedResume);
        maxWatchedTimeRef.current = savedResume;
        setMaxWatchedSec(savedResume);

        const registrations: Registration[] = await registrationService.getMyRegistrations().catch(() => []);
        let matchedRegistration = registrations.find(
          (item) => Number(item.clazzId ?? (item as any).classId ?? (item as any).id) === classNum
        );

        let enrollmentId = matchedRegistration?.enrollmentId ?? (matchedRegistration as any)?.id;
        if (!enrollmentId) {
          const myClasses = await clazzService.getMyClasses().catch(() => []);
          const classMatch = myClasses.find((c) => c.id === classNum);
          if (classMatch) {
            enrollmentId = (classMatch as any).enrollmentId ?? (classMatch as any).id ?? classNum;
          } else {
            enrollmentId = classNum;
          }
        }

        enrollmentIdRef.current = enrollmentId;

        if (enrollmentId) {
          const serverProgress = await videoLearningService.getProgress(lessonNum, enrollmentId).catch(() => null);
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
        }
        setMaxWatchedSec(maxWatchedTimeRef.current);

        const [quizData, noteData] = await Promise.all([
          videoLearningService.getQuizzesForLesson(lessonNum).catch(() => []),
          videoLearningService.getNotes(lessonNum).catch(() => []),
        ]);
        if (mounted) {
          setQuizzes(quizData ?? []);
          setNotes(noteData ?? []);
        }

        let progressData = enrollmentId ? await progressService.getEnrollmentProgress(enrollmentId).catch(() => null) : null;
        if (!progressData) {
          progressData = {
            enrollmentId: enrollmentId ?? classNum,
            clazzId: classNum,
            completedCount: 0,
            totalCount: flatLessons.length,
            percentage: 0,
            lessons: flatLessons.map((l) => ({
              lessonId: l.id,
              lessonTitle: l.title,
              isCompleted: false,
              completedAt: null,
            })),
          };
        }
        if (mounted) setProgress(progressData);

        if (!lesson.videoUrl && enrollmentId) {
          const isAlreadyCompleted = progressData?.lessons.some(
            (item) => Number(item.lessonId) === Number(lesson.id) && item.isCompleted
          );
          if (!isAlreadyCompleted) {
            try {
              await progressService.markLessonComplete(lesson.id, enrollmentId);
              const updated = await progressService.getEnrollmentProgress(enrollmentId);
              if (mounted && updated) setProgress(updated);
            } catch {
              // Ignore
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
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
                  ref={videoRef}
                  className="w-full max-h-[460px] bg-black"
                  controls
                  preload="metadata"
                  src={selectedLesson.videoUrl}
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
                  }}
                  onEnded={() => void handleVideoEnded()}
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-xs text-slate-400">
                  Bài học dạng tài liệu đọc
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
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
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedLesson.content || 'Chưa có thông tin mô tả chi tiết cho bài học này.'}
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">Tiến độ khóa học</h4>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Bài đã hoàn thành</span>
              <span className="font-semibold">{progress?.completedCount ?? 0}/{progress?.totalCount ?? 0}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-accent-600 transition-all duration-300" style={{ width: `${percent}%` }} />
            </div>
          </Card>

          <Card>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">Danh sách bài học</h4>
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{chapter.title}</div>
                  <div className="space-y-1">
                    {(chapterLessons[chapter.id] ?? []).map((lesson) => {
                      const active = lesson.id === selectedLesson.id;
                      const done = progress?.lessons.some((item) => Number(item.lessonId) === Number(lesson.id) && item.isCompleted);
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => navigate(`/student/classes/${classNum}/lessons/${lesson.id}`)}
                          className={`flex w-full items-center justify-between gap-2 p-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            active
                              ? 'bg-accent-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{lesson.title}</span>
                          {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
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
