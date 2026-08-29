import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as contentService from "../../services/contentService";
import * as assessmentService from "../../services/assessmentService";
import { useAuth } from "../../contexts/useAuth";
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from "../../components/Layout";
import type { Clazz, User, Chapter, Announcement, Assignment, Lesson } from "../../types";

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
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const isLecturer = user?.role === 'LECTURER';

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
                      {chapterLessons[c.id]?.map((lesson: Lesson) => (
                        <li key={lesson.id}>
                          <span className="font-medium text-slate-700">{lesson.title}</span>
                          {lesson.videoUrl && <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 underline">Video</a>}
                        </li>
                      ))}
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
