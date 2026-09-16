import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as contentService from "../../services/contentService";
// Sprint 1: edit/delete helpers already in contentService
import * as assessmentService from "../../services/assessmentService";
import * as registrationService from "../../services/registrationService";
import * as gradingService from "../../services/gradingService";
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
  // Sprint 1: edit/delete states
  const [editChapterId, setEditChapterId] = useState<number | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editLessonId, setEditLessonId] = useState<number | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  const [editAnnId, setEditAnnId] = useState<number | null>(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const loadChapters = async () => {
    try { const list = await contentService.getChapters(cid); setChapters(list); } catch {}
  };
  const [studentProgress, setStudentProgress] = useState<EnrollmentProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLessonId, setUploadingLessonId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState<Record<number, number>>({});
  const [creatingLessonProgress, setCreatingLessonProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<Record<number, { type: 'success' | 'error'; message: string }>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const attachmentFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingAttachmentLessonId, setUploadingAttachmentLessonId] = useState<number | null>(null);
  const isLecturer = user?.role === 'LECTURER';
  const isStudent = user?.role === 'STUDENT';

  const handleLessonAttachmentUpload = async (lessonId: number, file: File) => {
    setUploadingAttachmentLessonId(lessonId);
    setAttachmentUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    try {
      await contentService.uploadLessonAttachment(lessonId, file, (percent) => {
        setAttachmentUploadProgress((prev) => ({ ...prev, [lessonId]: percent }));
      });
      const fresh = await contentService.getChapters(cid);
      setChapters(fresh);
      setFlash('Tài liệu đã được tải lên thành công.');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Upload tài liệu thất bại');
    } finally {
      setUploadingAttachmentLessonId(null);
    }
  };

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

  const validateLessonVideoFile = (file: File) => {
    const allowedExt = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
    const allowedMime = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/avi'];
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = file.type.toLowerCase();

    if (!allowedExt.includes(extension) && !allowedMime.includes(mimeType)) {
      return {
        valid: false,
        message: 'Định dạng video không hợp lệ. Chỉ hỗ trợ MP4, WebM, MOV, MKV, AVI.',
      };
    }

    if (file.size > 200 * 1024 * 1024) {
      return {
        valid: false,
        message: 'Video vượt quá dung lượng tối đa 200MB.',
      };
    }

    return { valid: true, message: '' };
  };

  const handleLessonVideoUpload = async (lessonId: number, file: File) => {
    const validation = validateLessonVideoFile(file);
    if (!validation.valid) {
      setUploadStatus((prev) => ({
        ...prev,
        [lessonId]: { type: 'error', message: validation.message },
      }));
      return;
    }

    setUploadingLessonId(lessonId);
    setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    setUploadStatus((prev) => ({
      ...prev,
      [lessonId]: { type: 'success', message: 'Đang tải video 0%...' },
    }));

    try {
      await contentService.uploadLessonVideo(lessonId, file, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [lessonId]: percent }));
        setUploadStatus((prev) => ({
          ...prev,
          [lessonId]: { type: 'success', message: `Đang tải video ${percent}%...` },
        }));
      });
      const fresh = await contentService.getChapters(cid);
      setChapters(fresh);
      setUploadStatus((prev) => ({
        ...prev,
        [lessonId]: { type: 'success', message: 'Video đã được cập nhật thành công.' },
      }));
    } catch (e) {
      const message = (e as { message?: string })?.message ?? 'Upload video thất bại';
      setUploadStatus((prev) => ({
        ...prev,
        [lessonId]: { type: 'error', message: `Upload video thất bại: ${message}` },
      }));
    } finally {
      setUploadingLessonId((current) => (current === lessonId ? null : current));
    }
  };

  const handleCreateLesson = async () => {
    if (!isLecturer || !selectedChapterId || !lessonTitle.trim()) return;
    setSaving(true);
    setFlash(null);
    if (lessonVideo) {
      setCreatingLessonProgress(0);
    }
    try {
      const lesson = await contentService.createLesson(selectedChapterId, {
        title: lessonTitle.trim(),
        content: lessonContent.trim(),
      });

      if (lessonVideo && lesson.id) {
        try {
          await contentService.uploadLessonVideo(lesson.id, lessonVideo, (percent) => {
            setCreatingLessonProgress(percent);
          });
          setFlash('Đã tạo bài học và tải video thành công');
        } catch (e) {
          const message = (e as { message?: string })?.message ?? 'Upload video thất bại';
          setFlash(`Đã tạo bài học nhưng upload video thất bại: ${message}`);
        }
      } else {
        setFlash('Đã tạo bài học mới');
      }

      setLessonTitle('');
      setLessonContent('');
      setLessonVideo(null);
      setSelectedChapterId(selectedChapterId);
      const fresh = await contentService.getChapters(cid);
      setChapters(fresh);
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Tạo bài học thất bại');
    } finally {
      setSaving(false);
      setCreatingLessonProgress(null);
    }
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


  // Sprint 1: handlers for edit/delete chapter, lesson, announcement
  const handleDeleteChapter = async (chId: number) => {
    if (!confirm('Xoá chương này? Các bài học trong chương cũng sẽ bị xoá.')) return;
    try {
      await contentService.deleteChapter(chId);
      setFlash('Đã xoá chương.');
      loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  const startEditChapter = (ch: Chapter) => { setEditChapterId(ch.id); setEditChapterTitle(ch.title); };
  const saveEditChapter = async () => {
    if (!editChapterId || !editChapterTitle.trim()) return;
    try {
      await contentService.updateChapter(editChapterId, { title: editChapterTitle });
      setEditChapterId(null);
      setFlash('Đã cập nhật chương.');
      loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Xoá bài học này?')) return;
    try {
      await contentService.deleteLesson(lessonId);
      setFlash('Đã xoá bài học.');
      loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  const startEditLesson = (l: Lesson) => { setEditLessonId(l.id); setEditLessonTitle(l.title); setEditLessonContent(l.content ?? ''); };
  const saveEditLesson = async () => {
    if (!editLessonId || !editLessonTitle.trim()) return;
    try {
      await contentService.updateLesson(editLessonId, { title: editLessonTitle, content: editLessonContent });
      setEditLessonId(null);
      setFlash('Đã cập nhật bài học.');
      loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  const handleDeleteAnnouncement = async (annId: number) => {
    if (!confirm('Xoá thông báo này?')) return;
    try {
      await contentService.deleteAnnouncement(annId);
      setFlash('Đã xoá thông báo.');
      loadAnns();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };
  const startEditAnn = (a: Announcement) => { setEditAnnId(a.id); setEditAnnTitle(a.title); setEditAnnContent(a.content); };
  const saveEditAnn = async () => {
    if (!editAnnId || !editAnnTitle.trim() || !editAnnContent.trim()) return;
    try {
      await contentService.updateAnnouncement(editAnnId, { title: editAnnTitle, content: editAnnContent });
      setEditAnnId(null);
      setFlash('Đã cập nhật thông báo.');
      loadAnns();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };

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
                  <div className="flex items-center justify-between gap-2">
                    {editChapterId === c.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          value={editChapterTitle}
                          onChange={(e) => setEditChapterTitle(e.target.value)}
                          className="px-2 py-1 text-sm border rounded border-slate-300 flex-1"
                        />
                        <button onClick={saveEditChapter} className="px-2 py-1 text-xs rounded bg-indigo-600 text-white">Lưu</button>
                        <button onClick={() => setEditChapterId(null)} className="px-2 py-1 text-xs rounded bg-slate-200 text-slate-700">Hủy</button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="font-semibold text-slate-800">{c.title}</div>
                          <div className="text-xs text-slate-500">Chương #{c.sortOrder ?? 1}</div>
                        </div>
                        {isLecturer && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => startEditChapter(c)}
                              className="px-2 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                              title="Sửa tên chương"
                            >
                              <svg className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(c.id)}
                              className="px-2 py-1 text-xs rounded border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                              title="Xóa chương"
                            >
                              <svg className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {(chapterLessons[c.id]?.length ?? 0) > 0 && (
                    <ul className="mt-2 space-y-1.5 pl-2 text-sm text-slate-600">
                      {chapterLessons[c.id]?.map((lesson: Lesson) => {
                        const status = isStudent ? getLessonStatus(lesson.id) : null;
                        const lessonProgress = studentProgress?.lessons.find((item) => item.lessonId === lesson.id);
                        const resumeSeconds = getResumeSeconds(lesson.id);
                        const isResumeActive = isStudent && !!lessonProgress && !lessonProgress.isCompleted && resumeSeconds > 10;

                        return (
                          <li key={lesson.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                              {editLessonId === lesson.id ? (
                                <div className="space-y-1.5 my-1">
                                  <input
                                    value={editLessonTitle}
                                    onChange={(e) => setEditLessonTitle(e.target.value)}
                                    placeholder="Tên bài học"
                                    className="w-full px-2 py-1 text-sm border rounded border-slate-300"
                                  />
                                  <textarea
                                    value={editLessonContent}
                                    onChange={(e) => setEditLessonContent(e.target.value)}
                                    placeholder="Nội dung/mô tả bài học"
                                    rows={2}
                                    className="w-full px-2 py-1 text-xs border rounded border-slate-300"
                                  />
                                  <div className="flex gap-1.5">
                                    <button onClick={saveEditLesson} className="px-2 py-1 text-xs rounded bg-indigo-600 text-white">Lưu</button>
                                    <button onClick={() => setEditLessonId(null)} className="px-2 py-1 text-xs rounded bg-slate-200 text-slate-700">Hủy</button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-2">
                                    {user?.role === 'STUDENT' ? (
                                      <Link to={`/student/classes/${cid}/lessons/${lesson.id}`} className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline">{lesson.title}</Link>
                                    ) : (
                                      <span className="font-semibold text-slate-800">{lesson.title}</span>
                                    )}
                                    {isLecturer && (
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          onClick={() => startEditLesson(lesson)}
                                          className="text-slate-400 hover:text-indigo-600 p-1 rounded transition"
                                          title="Sửa bài học"
                                        >
                                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLesson(lesson.id)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                                          title="Xóa bài học"
                                        >
                                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                    {lesson.videoUrl && (
                                      <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-medium hover:underline">
                                        <svg className="h-3.5 w-3.5 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        <span>Video</span>
                                      </a>
                                    )}
                                    {lesson.attachmentUrl && (
                                      <a href={lesson.attachmentUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                                        <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        <span>{lesson.attachmentName || 'Tài liệu'}</span>
                                      </a>
                                    )}
                                  </div>

                                  {isLecturer && (
                                    <div className="mt-2 space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => fileInputRefs.current[lesson.id]?.click()}
                                          disabled={saving || uploadingLessonId === lesson.id}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60 transition shadow-2xs"
                                        >
                                          {uploadingLessonId === lesson.id ? (
                                            <svg className="animate-spin h-3.5 w-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                          ) : (
                                            <svg className="h-3.5 w-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                          )}
                                          <span>
                                            {uploadingLessonId === lesson.id
                                              ? `Đang tải video ${uploadProgress[lesson.id] ?? 0}%...`
                                              : lesson.videoUrl
                                              ? 'Thay video'
                                              : 'Thêm video'}
                                          </span>
                                        </button>
                                        <input
                                          ref={(el) => { fileInputRefs.current[lesson.id] = el; }}
                                          type="file"
                                          accept=".mp4,.webm,.mov,.mkv,.avi"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            void handleLessonVideoUpload(lesson.id, file);
                                            e.target.value = '';
                                          }}
                                        />

                                        <button
                                          type="button"
                                          onClick={() => attachmentFileInputRefs.current[lesson.id]?.click()}
                                          disabled={saving || uploadingAttachmentLessonId === lesson.id}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-60 transition shadow-2xs"
                                        >
                                          {uploadingAttachmentLessonId === lesson.id ? (
                                            <svg className="animate-spin h-3.5 w-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                          ) : (
                                            <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                          )}
                                          <span>
                                            {uploadingAttachmentLessonId === lesson.id
                                              ? `Đang tải tài liệu ${attachmentUploadProgress[lesson.id] ?? 0}%...`
                                              : lesson.attachmentUrl
                                              ? 'Thay tài liệu'
                                              : 'Thêm tài liệu'}
                                          </span>
                                        </button>
                                        <input
                                          ref={(el) => { attachmentFileInputRefs.current[lesson.id] = el; }}
                                          type="file"
                                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            void handleLessonAttachmentUpload(lesson.id, file);
                                            e.target.value = '';
                                          }}
                                        />

                                        {uploadStatus[lesson.id] && uploadingLessonId !== lesson.id && (
                                          <span className={`text-[11px] ${uploadStatus[lesson.id].type === 'error' ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}`}>
                                            {uploadStatus[lesson.id].message}
                                          </span>
                                        )}
                                      </div>

                                      {uploadingLessonId === lesson.id && (
                                        <div className="w-full max-w-sm space-y-1 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                                          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700">
                                            <span className="flex items-center gap-1.5">
                                              <svg className="animate-spin h-3.5 w-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                              Đang tải video bài học lên hệ thống...
                                            </span>
                                            <span>{uploadProgress[lesson.id] ?? 0}%</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                              className="bg-indigo-600 h-full rounded-full transition-all duration-200 ease-out"
                                              style={{ width: `${uploadProgress[lesson.id] ?? 0}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {uploadingAttachmentLessonId === lesson.id && (
                                        <div className="w-full max-w-sm space-y-1 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                                          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                                            <span className="flex items-center gap-1.5">
                                              <svg className="animate-spin h-3.5 w-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                              </svg>
                                              Đang tải tài liệu lên hệ thống...
                                            </span>
                                            <span>{attachmentUploadProgress[lesson.id] ?? 0}%</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                              className="bg-emerald-600 h-full rounded-full transition-all duration-200 ease-out"
                                              style={{ width: `${attachmentUploadProgress[lesson.id] ?? 0}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

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
                              )}
                            </div>

                            {isStudent ? (
                              <Link
                                to={`/student/classes/${cid}/lessons/${lesson.id}`}
                                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${lessonProgress?.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                              >
                                {lessonProgress?.isCompleted ? 'Ôn tập' : 'Vào học'}
                              </Link>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {isLecturer && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={selectedChapterId === c.id ? lessonTitle : ''}
                          onChange={(e) => { setSelectedChapterId(c.id); setLessonTitle(e.target.value); }}
                          placeholder="Tên bài học"
                          className="w-40 px-2 py-1 rounded border border-slate-200 bg-white text-sm"
                        />
                        <input
                          value={selectedChapterId === c.id ? lessonContent : ''}
                          onChange={(e) => { setSelectedChapterId(c.id); setLessonContent(e.target.value); }}
                          placeholder="Mô tả bài học"
                          className="w-48 px-2 py-1 rounded border border-slate-200 bg-white text-sm"
                        />
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => { setSelectedChapterId(c.id); setLessonVideo(e.target.files?.[0] ?? null); }}
                          className="text-xs"
                        />
                        <button
                          onClick={handleCreateLesson}
                          disabled={saving || !lessonTitle.trim() || selectedChapterId !== c.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                        >
                          {saving && selectedChapterId === c.id ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>
                                {creatingLessonProgress !== null
                                  ? `Đang tải video ${creatingLessonProgress}%...`
                                  : 'Đang tạo...'}
                              </span>
                            </>
                          ) : (
                            <span>+ Bài học</span>
                          )}
                        </button>
                      </div>

                      {selectedChapterId === c.id && creatingLessonProgress !== null && (
                        <div className="w-full bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100 space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
                            <span className="flex items-center gap-1.5">
                              <svg className="animate-spin h-3.5 w-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Đang tải video cho bài học mới lên máy chủ...
                            </span>
                            <span>{creatingLessonProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-200 ease-out"
                              style={{ width: `${creatingLessonProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
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
