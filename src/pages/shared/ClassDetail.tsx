import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as contentService from "../../services/contentService";
import * as assessmentService from "../../services/assessmentService";
import * as registrationService from "../../services/registrationService";
import * as progressService from "../../services/progressService";
import { useAuth } from "../../contexts/useAuth";
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from "../../components/Layout";
import type { Clazz, User, Chapter, Announcement, Assignment, Lesson, EnrollmentProgress } from "../../types";

export default function ClassDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const cid = Number(id);
  const [clazz, setClazz] = useState<Clazz | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterLessons, setChapterLessons] = useState<Record<number, Lesson[]>>({});
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterOrder, setChapterOrder] = useState(1);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [studentProgress, setStudentProgress] = useState<EnrollmentProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const isLecturer = user?.role === 'LECTURER';
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [c, st, ch, an, as] = await Promise.all([
          clazzService.getClazzDetail(cid),
          clazzService.getClassStudents(cid),
          contentService.getChapters(cid),
          contentService.getAnnouncements(cid),
          assessmentService.getAssignments(cid),
        ]);
        if (!mounted) return;
        setClazz(c); setStudents(st); setChapters(ch); setAnns(an); setAssigns(as);
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (mounted) setErr(err?.message ?? "Loi tai du lieu");
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [cid]);

  useEffect(() => {
    if (!chapters.length) return;
    let mounted = true;
    (async () => {
      const results = await Promise.all(
        chapters.map(async (chapter) => ({
          chapterId: chapter.id,
          lessons: await contentService.getLessons(chapter.id),
        }))
      );
      if (!mounted) return;
      const mapped: Record<number, Lesson[]> = {};
      results.forEach(({ chapterId, lessons }) => {
        mapped[chapterId] = lessons;
      });
      setChapterLessons(mapped);
    })().catch(() => {
      if (mounted) setErr('Khong the tai danh sach bai hoc');
    });
    return () => { mounted = false; };
  }, [chapters]);

  useEffect(() => {
    if (!isStudent || !cid) return;

    let mounted = true;
    (async () => {
      try {
        const registrations = await registrationService.getMyRegistrations();
        const match = registrations.find((item) => item.clazzId === cid);
        if (!match) {
          if (mounted) setStudentProgress(null);
          return;
        }

        const progress = await progressService.getEnrollmentProgress(match.enrollmentId);
        if (mounted) setStudentProgress(progress);
      } catch {
        if (mounted) setStudentProgress(null);
      }
    })();

    return () => { mounted = false; };
  }, [cid, isStudent]);

  const handleCreateChapter = async () => {
    if (!isLecturer || !cid || !chapterTitle.trim()) return;
    setSaving(true);
    setFlash(null);
    try {
      await contentService.createChapter(cid, { title: chapterTitle.trim(), sortOrder: chapterOrder });
      setChapterTitle('');
      setChapterOrder(1);
      const fresh = await contentService.getChapters(cid);
      setChapters(fresh);
      setFlash('Đã tạo chương mới');
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Tạo chương thất bại');
    } finally { setSaving(false); }
  };

  const handleCreateLesson = async () => {
    if (!isLecturer || !selectedChapterId || !lessonTitle.trim()) return;
    setSaving(true);
    setFlash(null);
    try {
      const lesson = await contentService.createLesson(selectedChapterId, {
        title: lessonTitle.trim(),
        content: lessonContent.trim(),
      });
      if (lessonVideo && lesson.id) {
        await contentService.uploadLessonVideo(lesson.id, lessonVideo);
      }
      setLessonTitle('');
      setLessonContent('');
      setLessonVideo(null);
      setSelectedChapterId(selectedChapterId);
      const fresh = await contentService.getChapters(cid);
      setChapters(fresh);
      setFlash('Đã tạo bài học mới');
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Tạo bài học thất bại');
    } finally { setSaving(false); }
  };

  const handleCreateAnnouncement = async () => {
    if (!isLecturer || !cid || !announcementTitle.trim() || !announcementContent.trim()) return;
    setSaving(true);
    setFlash(null);
    try {
      await contentService.createAnnouncement(cid, {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
      });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      const fresh = await contentService.getAnnouncements(cid);
      setAnns(fresh);
      setFlash('Đã tạo thông báo');
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Tạo thông báo thất bại');
    } finally { setSaving(false); }
  };

  const getLessonStatus = (lessonId: number) => {
    if (!studentProgress) return { label: 'Chưa học', className: 'bg-slate-100 text-slate-600' };

    const match = studentProgress.lessons.find((item) => item.lessonId === lessonId);
    if (match?.isCompleted) return { label: 'Đã học', className: 'bg-emerald-100 text-emerald-700' };
    if (match) return { label: 'Đang học', className: 'bg-amber-100 text-amber-700' };
    return { label: 'Chưa học', className: 'bg-slate-100 text-slate-600' };
  };

  const studentSummary = isStudent && studentProgress ? {
    completed: studentProgress.completedCount,
    total: studentProgress.totalCount,
    inProgress: Math.max(studentProgress.lessons.filter((item) => !item.isCompleted).length, 0),
    notStarted: Math.max(studentProgress.totalCount - studentProgress.lessons.filter((item) => item.isCompleted).length - studentProgress.lessons.filter((item) => !item.isCompleted).length, 0),
  } : null;

  const getResumeSeconds = (lessonId: number) => {
    if (!isStudent) return 0;
    const value = Number(localStorage.getItem(`learninghub:resume:${cid}:${lessonId}`) ?? '0');
    return Number.isFinite(value) ? value : 0;
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  if (!clazz) return <Empty msg="Khong tim thay lop" />;

  return (
    <div>
      <PageTitle>{clazz.classCode} - {clazz.className}</PageTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card><div className="text-xs text-slate-400">Giang vien</div><div className="font-medium">{clazz.lecturerName ?? "-"}</div></Card>
        <Card><div className="text-xs text-slate-400">Sĩ số tối đa</div><div className="font-medium">{clazz.maxStudents} SV</div></Card>
        <Card><div className="text-xs text-slate-500">Học kỳ</div><div><Pill color="indigo">{clazz.semester} · {clazz.academicYear}</Pill></div></Card>
      </div>
      {isStudent && studentSummary && (
        <Card className="mb-4 border border-indigo-100 bg-linear-to-r from-indigo-50 via-white to-blue-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-500">Tiến độ học tập</div>
              <div className="mt-1 text-2xl font-bold text-slate-800">{studentProgress?.percentage ?? 0}%</div>
            </div>
            <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              {studentSummary.completed}/{studentSummary.total} bài đã hoàn thành
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-blue-500" style={{ width: `${Math.min(100, studentProgress?.percentage ?? 0)}%` }} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Đã học', value: studentSummary.completed, tone: 'bg-emerald-50 text-emerald-700' },
              { label: 'Đang học', value: studentSummary.inProgress, tone: 'bg-amber-50 text-amber-700' },
              { label: 'Chưa học', value: studentSummary.notStarted, tone: 'bg-slate-100 text-slate-600' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border border-white p-3 ${item.tone}`}>
                <div className="text-[11px] font-medium uppercase tracking-widest opacity-80">{item.label}</div>
                <div className="mt-1 text-xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-semibold">Chuong trinh hoc</h3>
            {isLecturer && (
              <div className="flex items-center gap-2">
                <input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="Tên chương" className="w-40 px-2 py-1 rounded border border-slate-200 bg-white text-sm" />
                <input type="number" value={chapterOrder} min={1} onChange={(e) => setChapterOrder(Number(e.target.value) || 1)} className="w-16 px-2 py-1 rounded border border-slate-200 bg-white text-sm" />
                <button onClick={handleCreateChapter} disabled={saving || !chapterTitle.trim()} className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white disabled:opacity-50">+ Chương</button>
              </div>
            )}
          </div>
          {chapters.length === 0 ? <Empty msg="Chua co chuong nao" /> : (
            <ol className="space-y-3">
              {chapters.map((c: Chapter) => (
                <li key={c.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-slate-500">Chuong #{c.sortOrder ?? 1}</div>
                  {(chapterLessons[c.id]?.length ?? 0) > 0 && (
                    <ul className="mt-2 space-y-1 pl-4 list-disc text-sm text-slate-600">
                      {chapterLessons[c.id]?.map((lesson: Lesson) => {
                        const status = isStudent ? getLessonStatus(lesson.id) : null;
                        const lessonProgress = studentProgress?.lessons.find((item) => item.lessonId === lesson.id);
                        const resumeSeconds = getResumeSeconds(lesson.id);
                        const isResumeActive = isStudent && !!lessonProgress && !lessonProgress.isCompleted && resumeSeconds > 10;

                        return (
                          <li key={lesson.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
                            <div className="min-w-0 flex-1">
                              {user?.role === 'STUDENT' ? (
                                <Link to={`/student/classes/${cid}/lessons/${lesson.id}`} className="font-medium text-slate-700 hover:text-indigo-600 hover:underline">{lesson.title}</Link>
                              ) : (
                                <span className="font-medium text-slate-700">{lesson.title}</span>
                              )}

                              {lesson.videoUrl && <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 underline">Video</a>}

                              {isStudent && (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {status && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                                      {status.label}
                                    </span>
                                  )}
                                  {isResumeActive && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                      Học tiếp · {Math.floor(resumeSeconds / 60)}:{String(Math.floor(resumeSeconds % 60)).padStart(2, '0')}
                                    </span>
                                  )}
                                  {!status || status.label === 'Chưa học' ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      Chưa bắt đầu
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {isStudent ? (
                              <Link
                                to={`/student/classes/${cid}/lessons/${lesson.id}`}
                                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${lessonProgress?.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                              >
                                {lessonProgress?.isCompleted ? 'Ôn tập' : 'Học tiếp'}
                              </Link>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {isLecturer && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <input value={selectedChapterId === c.id ? lessonTitle : ''} onChange={(e) => { setSelectedChapterId(c.id); setLessonTitle(e.target.value); }} placeholder="Tên bài học" className="w-40 px-2 py-1 rounded border border-slate-200 bg-white text-sm" />
                      <input value={selectedChapterId === c.id ? lessonContent : ''} onChange={(e) => { setSelectedChapterId(c.id); setLessonContent(e.target.value); }} placeholder="Mô tả bài học" className="w-48 px-2 py-1 rounded border border-slate-200 bg-white text-sm" />
                      <input type="file" accept="video/*" onChange={(e) => { setSelectedChapterId(c.id); setLessonVideo(e.target.files?.[0] ?? null); }} className="text-xs" />
                      <button onClick={handleCreateLesson} disabled={saving || !lessonTitle.trim() || selectedChapterId !== c.id} className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white disabled:opacity-50">+ Bài học</button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold">Thong bao</h3>
              {isLecturer && (
                <button onClick={handleCreateAnnouncement} disabled={saving || !announcementTitle.trim() || !announcementContent.trim()} className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white disabled:opacity-50">+ Thông báo</button>
              )}
            </div>
            {isLecturer && (
              <div className="mb-3 space-y-2">
                <input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} placeholder="Tiêu đề" className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-sm" />
                <textarea value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} placeholder="Nội dung thông báo" rows={3} className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-sm" />
              </div>
            )}
            {anns.length === 0 ? <Empty msg="Chua co thong bao" /> : (
              <ul className="space-y-2 text-sm">
                {anns.map((a: Announcement) => (
                  <li key={a.id} className="border-l-2 border-indigo-500 pl-2">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-slate-400 line-clamp-2">{a.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">Bai tap</h3>
            {assigns.length === 0 ? <Empty msg="Chua co bai tap" /> : (
              <ul className="space-y-2 text-sm">
                {assigns.map((a: Assignment) => (
                  <li key={a.id} className="flex justify-between border-b border-slate-800 pb-1">
                    <Link to="assignments" className="hover:underline">{a.title}</Link>
                    <span className="text-xs text-slate-400">{a.maxScore}d</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      {flash && <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{flash}</div>}
      <h3 className="font-semibold mt-6 mb-2">Sinh vien ({students.length})</h3>
      {students.length === 0 ? <Empty msg="Lop chua co sinh vien" /> : (
        <Card>
          <table className="w-full min-w-130 text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr><th className="text-left py-2">#</th><th className="text-left">Ho ten</th><th className="text-left">Email</th></tr>
            </thead>
            <tbody>
              {students.map((s: User, i: number) => (
                <tr key={s.id} className="border-b border-slate-800/50">
                  <td className="py-2 text-slate-500">{i + 1}</td>
                  <td>{s.fullName}</td>
                  <td className="text-slate-400">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
