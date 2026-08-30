import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as clazzService from '../../services/clazzService';
import * as contentService from '../../services/contentService';
import * as progressService from '../../services/progressService';
import * as registrationService from '../../services/registrationService';
import type { Chapter, Clazz, Lesson, EnrollmentProgress, Registration } from '../../types';

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

  const [clazz, setClazz] = useState<Clazz | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterLessons, setChapterLessons] = useState<Record<number, Lesson[]>>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<EnrollmentProgress | null>(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const nextTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + deltaSeconds));
    video.currentTime = nextTime;
    saveResumePosition(nextTime);
  };

  useEffect(() => {
    if (!classNum || !lessonNum) {
      return;
    }

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

        const registrations: Registration[] = await registrationService.getMyRegistrations();
        const matchedRegistration = registrations.find((item) => item.clazzId === classNum);
        if (!matchedRegistration) {
          setError('Bạn chưa tham gia lớp học này.');
          return;
        }

        const progressData = await progressService.getEnrollmentProgress(matchedRegistration.enrollmentId);
        setProgress(progressData);
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
  }, [classNum, lessonNum, getStoredResumeSeconds]);

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
          <div className="mb-3 flex flex-wrap items-center gap-2">
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
            {hasResume && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                Tiếp tục từ {formatTime(resumeSeconds)}
              </span>
            )}
            <button
              type="button"
              onClick={() => seekVideo(-10)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              -10s
            </button>
            <button
              type="button"
              onClick={() => seekVideo(10)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
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
                  const resumeAt = getStoredResumeSeconds();
                  if (resumeAt > 0) {
                    video.currentTime = Math.min(resumeAt, video.duration || resumeAt);
                    setResumeSeconds(resumeAt);
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
                    saveResumePosition(video.currentTime || 0);
                  }
                }}
                onTimeUpdate={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  const nextTime = Number(video.currentTime || 0);
                  if (nextTime > 0) {
                    saveResumePosition(nextTime);
                  }
                }}
                onEnded={() => {
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
              <button
                type="button"
                onClick={() => void onMarkCompleted()}
                className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${isLessonCompleted ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              >
                {isLessonCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </button>
            </div>
            <div className="text-sm text-slate-600">{selectedLesson.content || 'Chưa có mô tả cho bài học này.'}</div>
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
