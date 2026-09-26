import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as clazzService from "../../services/clazzService";
import * as contentService from "../../services/contentService";
import * as assessmentService from "../../services/assessmentService";
import * as registrationService from "../../services/registrationService";
import * as progressService from "../../services/progressService";
import { useAuth } from "../../contexts/useAuth";
import { uploadCloudFile } from "../../services/storageService";
import { PageTitle, PageHeader, Card, Spinner, Empty, ErrorBox, Pill } from "../../components/Layout";
import type { Clazz, User, Chapter, Announcement, Assignment, Lesson, EnrollmentProgress, Submission, SubmissionType } from "../../types";
import { 
  FileText, Link2, Upload, ArrowUp, ArrowDown, Plus, Pencil, Trash2, 
  CheckCircle, Clock, Video, File, X, Sparkles, AlertCircle, HelpCircle
} from "lucide-react";

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
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Chapter & Lesson states
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterOrder, setChapterOrder] = useState(1);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideo, setLessonVideo] = useState<File | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Edit states
  const [editChapterId, setEditChapterId] = useState<number | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterOrder, setEditChapterOrder] = useState<number>(1);
  const [editLessonId, setEditLessonId] = useState<number | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  const [editAnnId, setEditAnnId] = useState<number | null>(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  // Assignment Modal State (Lecturer Create Assignment)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetChapterId, setAssignTargetChapterId] = useState<number | null>(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignMaxScore, setAssignMaxScore] = useState(10);
  const [assignFile, setAssignFile] = useState<File | null>(null);

  // Submission Modal State (Student Submit Assignment)
  const [activeSubmitAssignment, setActiveSubmitAssignment] = useState<Assignment | null>(null);
  const [subType, setSubType] = useState<SubmissionType>('FILE');
  const [subExternalLink, setSubExternalLink] = useState('');
  const [subSelectedFiles, setSubSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const loadChapters = async () => {
    try { 
      const list = await contentService.getChapters(cid); 
      setChapters(list.sort((a, b) => (a.sortOrder ?? 1) - (b.sortOrder ?? 1))); 
    } catch (e: unknown) { 
      setErr((e as { message?: string })?.message ?? 'Lỗi tải chương'); 
    }
  };

  const loadAnns = async () => {
    try { const list = await contentService.getAnnouncements(cid); setAnns(list); } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi tải thông báo'); }
  };

  const loadAssignments = async () => {
    try { 
      const list = await assessmentService.getAssignments(cid); 
      setAssigns(list); 
      if (isStudent) {
        const subs = await assessmentService.getMySubmissions();
        setMySubmissions(subs);
      }
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải bài tập');
    }
  };

  const handleLessonAttachmentUpload = async (lessonId: number, file: File) => {
    setUploadingAttachmentLessonId(lessonId);
    setAttachmentUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    try {
      await contentService.uploadLessonAttachment(lessonId, file, (percent) => {
        setAttachmentUploadProgress((prev) => ({ ...prev, [lessonId]: percent }));
      });
      await loadChapters();
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
        setClazz(c); 
        setStudents(st); 
        setChapters(ch.sort((a, b) => (a.sortOrder ?? 1) - (b.sortOrder ?? 1))); 
        setAnns(an); 
        setAssigns(as);
        if (isStudent) {
          const subs = await assessmentService.getMySubmissions().catch(() => []);
          if (mounted) setMySubmissions(subs);
        }
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (mounted) setErr(err?.message ?? "Lỗi tải dữ liệu lớp học");
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [cid, isStudent]);

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
        mapped[chapterId] = lessons.sort((a, b) => (a.sortOrder ?? 1) - (b.sortOrder ?? 1));
      });
      setChapterLessons(mapped);
    })().catch(() => {
      if (mounted) setErr('Không thể tải danh sách bài học');
    });
    return () => { mounted = false; };
  }, [chapters]);

  useEffect(() => {
    if (!isStudent || !cid) return;
    let mounted = true;
    (async () => {
      try {
        const registrations = await registrationService.getMyRegistrations().catch(() => []);
        const match = registrations.find(
          (item) => Number(item.clazzId ?? (item as any).classId ?? (item as any).id) === cid
        );
        let enrollmentId = match?.enrollmentId ?? (match as any)?.id;
        if (!enrollmentId) {
          const myClasses = await clazzService.getMyClasses().catch(() => []);
          const classMatch = myClasses.find((c) => c.id === cid);
          enrollmentId = (classMatch as any)?.enrollmentId ?? classMatch?.id ?? cid;
        }
        if (enrollmentId) {
          const progress = await progressService.getEnrollmentProgress(enrollmentId);
          if (mounted) setStudentProgress(progress);
        }
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
      const nextOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.sortOrder ?? 1)) + 1 : 1;
      await contentService.createChapter(cid, { title: chapterTitle.trim(), sortOrder: chapterOrder || nextOrder });
      setChapterTitle('');
      setChapterOrder(nextOrder + 1);
      await loadChapters();
      setFlash('Đã tạo chương mới thành công');
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Tạo chương thất bại');
    } finally { setSaving(false); }
  };

  const handleReorderChapter = async (chapter: Chapter, direction: 'up' | 'down') => {
    const currentIndex = chapters.findIndex(c => c.id === chapter.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const targetChapter = chapters[targetIndex];
    const newCurrentOrder = targetChapter.sortOrder ?? (targetIndex + 1);
    const newTargetOrder = chapter.sortOrder ?? (currentIndex + 1);

    try {
      await Promise.all([
        contentService.updateChapter(chapter.id, { sortOrder: newCurrentOrder }),
        contentService.updateChapter(targetChapter.id, { sortOrder: newTargetOrder }),
      ]);
      await loadChapters();
      setFlash('Đã cập nhật thứ tự chương học.');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi đổi thứ tự chương');
    }
  };

  const handleCreateAssignment = async () => {
    if (!isLecturer || !cid || !assignTitle.trim() || !assignDueDate) return;
    setSaving(true);
    try {
      const formattedTitle = assignTargetChapterId 
        ? `[Chương ${chapters.find(c => c.id === assignTargetChapterId)?.sortOrder ?? ''}] ${assignTitle.trim()}`
        : assignTitle.trim();

      let finalDesc = assignDesc.trim();
      if (assignFile) {
        try {
          const fileUrl = await uploadCloudFile(assignFile);
          finalDesc += `\n\n📎 **Tài liệu/Đề bài đính kèm:** [${assignFile.name}](${fileUrl})`;
        } catch {
          finalDesc += `\n\n📎 **Tài liệu đính kèm:** ${assignFile.name}`;
        }
      }

      await assessmentService.createAssignment(cid, {
        title: formattedTitle,
        description: finalDesc,
        dueDate: new Date(assignDueDate).toISOString(),
        maxScore: assignMaxScore || 10,
      });
      setShowAssignModal(false);
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      setAssignMaxScore(10);
      setAssignFile(null);
      setAssignTargetChapterId(null);
      await loadAssignments();
      setFlash('Đã tạo bài tập kèm file đề bài thành công');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Tạo bài tập thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleStudentSubmit = async () => {
    if (!activeSubmitAssignment) return;
    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (subType === 'FILE' && subSelectedFiles.length > 0) {
        if (subSelectedFiles.length === 1) {
          const url = await assessmentService.uploadSubmissionFile(activeSubmitAssignment.id, subSelectedFiles[0]);
          uploadedUrls = [url];
        } else {
          uploadedUrls = await assessmentService.uploadSubmissionFiles(activeSubmitAssignment.id, subSelectedFiles);
        }
      }

      await assessmentService.submitAssignment(activeSubmitAssignment.id, {
        submissionType: subType,
        fileUrl: uploadedUrls[0] || undefined,
        fileUrls: uploadedUrls.length > 1 ? uploadedUrls : undefined,
        externalLink: subExternalLink.trim() || undefined,
      });

      setActiveSubmitAssignment(null);
      setSubSelectedFiles([]);
      setSubExternalLink('');
      await loadAssignments();
      setFlash('Nộp bài tập thành công!');
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  const validateLessonVideoFile = (file: File) => {
    const allowedExt = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
    const allowedMime = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/avi'];
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = file.type.toLowerCase();

    if (!allowedExt.includes(extension) && !allowedMime.includes(mimeType)) {
      return { valid: false, message: 'Định dạng video không hợp lệ. Chỉ hỗ trợ MP4, WebM, MOV, MKV, AVI.' };
    }
    if (file.size > 200 * 1024 * 1024) {
      return { valid: false, message: 'Video vượt quá dung lượng tối đa 200MB.' };
    }
    return { valid: true, message: '' };
  };

  const handleLessonVideoUpload = async (lessonId: number, file: File) => {
    const validation = validateLessonVideoFile(file);
    if (!validation.valid) {
      setUploadStatus((prev) => ({ ...prev, [lessonId]: { type: 'error', message: validation.message } }));
      return;
    }
    setUploadingLessonId(lessonId);
    setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    try {
      await contentService.uploadLessonVideo(lessonId, file, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [lessonId]: percent }));
      });
      await loadChapters();
      setUploadStatus((prev) => ({ ...prev, [lessonId]: { type: 'success', message: 'Video đã được cập nhật thành công.' } }));
    } catch (e) {
      const message = (e as { message?: string })?.message ?? 'Upload video thất bại';
      setUploadStatus((prev) => ({ ...prev, [lessonId]: { type: 'error', message: `Upload video thất bại: ${message}` } }));
    } finally {
      setUploadingLessonId((current) => (current === lessonId ? null : current));
    }
  };

  const handleCreateLesson = async () => {
    if (!isLecturer || !selectedChapterId || !lessonTitle.trim()) return;
    setSaving(true);
    setFlash(null);
    if (lessonVideo) setCreatingLessonProgress(0);
    try {
      const existingLessons = chapterLessons[selectedChapterId] ?? [];
      const nextSortOrder = existingLessons.length > 0 ? Math.max(...existingLessons.map(l => l.sortOrder ?? 1)) + 1 : 1;

      const lesson = await contentService.createLesson(selectedChapterId, {
        title: lessonTitle.trim(),
        content: lessonContent.trim(),
        sortOrder: nextSortOrder,
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
        setFlash('Đã tạo bài học mới thành công');
      }

      setLessonTitle('');
      setLessonContent('');
      setLessonVideo(null);
      await loadChapters();
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
      await loadAnns();
      setFlash('Đã tạo thông báo mới thành công');
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

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  if (!clazz) return <Empty msg="Không tìm thấy thông tin lớp học phần" />;

  const handleDeleteChapter = async (chId: number) => {
    if (!confirm('Xóa chương này? Tất cả bài học thuộc chương cũng sẽ bị xóa.')) return;
    try {
      await contentService.deleteChapter(chId);
      setFlash('Đã xóa chương thành công.');
      await loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi xóa chương'); }
  };

  const startEditChapter = (ch: Chapter) => { 
    setEditChapterId(ch.id); 
    setEditChapterTitle(ch.title); 
    setEditChapterOrder(ch.sortOrder ?? 1);
  };

  const saveEditChapter = async () => {
    if (!editChapterId || !editChapterTitle.trim()) return;
    try {
      await contentService.updateChapter(editChapterId, { title: editChapterTitle, sortOrder: editChapterOrder });
      setEditChapterId(null);
      setFlash('Đã cập nhật tên và thứ tự chương.');
      await loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi cập nhật chương'); }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Xóa bài học này?')) return;
    try {
      await contentService.deleteLesson(lessonId);
      setFlash('Đã xóa bài học.');
      await loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi xóa bài học'); }
  };

  const startEditLesson = (l: Lesson) => { 
    setEditLessonId(l.id); 
    setEditLessonTitle(l.title); 
    setEditLessonContent(l.content ?? ''); 
  };

  const saveEditLesson = async () => {
    if (!editLessonId || !editLessonTitle.trim()) return;
    try {
      await contentService.updateLesson(editLessonId, { title: editLessonTitle, content: editLessonContent });
      setEditLessonId(null);
      setFlash('Đã cập nhật bài học.');
      await loadChapters();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };

  const handleDeleteAnnouncement = async (annId: number) => {
    if (!confirm('Xóa thông báo này?')) return;
    try {
      await contentService.deleteAnnouncement(annId);
      setFlash('Đã xóa thông báo.');
      await loadAnns();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };

  const startEditAnn = (a: Announcement) => { setEditAnnId(a.id); setEditAnnTitle(a.title); setEditAnnContent(a.content); };

  const saveEditAnn = async () => {
    if (!editAnnId || !editAnnTitle.trim() || !editAnnContent.trim()) return;
    try {
      await contentService.updateAnnouncement(editAnnId, { title: editAnnTitle, content: editAnnContent });
      setEditAnnId(null);
      setFlash('Đã cập nhật thông báo.');
      await loadAnns();
    } catch (e: unknown) { setErr((e as { message?: string })?.message ?? 'Lỗi'); }
  };

  const rolePath = isStudent ? '/student' : isLecturer ? '/lecturer' : '/admin';
  const breadcrumbs = [
    { label: 'Lớp học phần', to: `${rolePath}/classes` },
    { label: clazz ? `${clazz.classCode} - ${clazz.className}` : 'Chi tiết lớp học' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={`${clazz.classCode} - ${clazz.className}`}
        subtitle={`Học kỳ: ${clazz.semester} • Năm học: ${clazz.academicYear} • Giảng viên: ${clazz.lecturerName ?? 'Chưa phân công'}`}
        actions={
          <Link
            to={`${rolePath}/quizzes?classId=${cid}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Bài kiểm tra môn học</span>
          </Link>
        }
      />
      
      {/* Overview Metadata Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Giảng viên phụ trách</div>
          <div className="mt-1 text-base font-semibold text-slate-800">{clazz.lecturerName ?? "Chưa phân công"}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sĩ số</div>
          <div className="mt-1 text-base font-semibold text-slate-800">
            {clazz.currentStudents ?? students.length}/{clazz.maxStudents || '∞'} sinh viên
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Học kỳ / Năm học</div>
          <div className="mt-1"><Pill color="indigo">{clazz.semester} · Năm học {clazz.academicYear}</Pill></div>
        </Card>
      </div>

      {/* Student Progress Summary */}
      {isStudent && studentSummary && (
        <Card className="border border-indigo-100 bg-linear-to-r from-indigo-50/80 via-white to-blue-50/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-600">Tiến độ học tập môn học</div>
              <div className="mt-1 text-2xl font-bold text-slate-800">{studentProgress?.percentage ?? 0}%</div>
            </div>
            <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              {studentSummary.completed}/{studentSummary.total} bài học đã hoàn thành
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-blue-500 transition-all duration-300" style={{ width: `${Math.min(100, studentProgress?.percentage ?? 0)}%` }} />
          </div>
        </Card>
      )}

      {/* Main Grid Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Chapters & Curriculum (2 cols) */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Chương trình bài giảng</h3>
              <p className="text-xs text-slate-500">Quản lý bài học, thứ tự chương và bài tập học phần</p>
            </div>
            {isLecturer && (
              <div className="flex items-center gap-2">
                <input 
                  value={chapterTitle} 
                  onChange={(e) => setChapterTitle(e.target.value)} 
                  placeholder="Tên chương mới..." 
                  className="w-44 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
                <input 
                  type="number" 
                  value={chapterOrder} 
                  min={1} 
                  onChange={(e) => setChapterOrder(Number(e.target.value) || 1)} 
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-center" 
                  title="Số thứ tự chương (# STT)"
                />
                <button 
                  onClick={handleCreateChapter} 
                  disabled={saving || !chapterTitle.trim()} 
                  className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Chương
                </button>
              </div>
            )}
          </div>

          {chapters.length === 0 ? (
            <Empty msg="Chưa có chương học nào được tạo" />
          ) : (
            <ol className="space-y-4">
              {chapters.map((c: Chapter, idx: number) => {
                const chapterAssigns = assigns.filter(a => a.title.includes(`[Chương ${c.sortOrder ?? idx + 1}]`));
                return (
                  <li key={c.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs hover:border-indigo-200 transition">
                    <div className="flex items-center justify-between gap-3">
                      {editChapterId === c.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-semibold text-indigo-600"># STT:</span>
                          <input
                            type="number"
                            value={editChapterOrder}
                            onChange={(e) => setEditChapterOrder(Number(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-sm border rounded-md border-slate-300 text-center"
                          />
                          <input
                            value={editChapterTitle}
                            onChange={(e) => setEditChapterTitle(e.target.value)}
                            className="px-3 py-1 text-sm border rounded-md border-slate-300 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button onClick={saveEditChapter} className="px-3 py-1 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Lưu</button>
                          <button onClick={() => setEditChapterId(null)} className="px-3 py-1 text-xs font-medium rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300">Hủy</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-100">
                              #{c.sortOrder ?? idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800 text-base">{c.title}</div>
                              <div className="text-xs text-slate-500">{(chapterLessons[c.id]?.length ?? 0)} bài học</div>
                            </div>
                          </div>
                          {isLecturer && (
                            <div className="flex items-center gap-1">
                              {/* Reorder Buttons */}
                              <button
                                onClick={() => handleReorderChapter(c, 'up')}
                                disabled={idx === 0}
                                className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Đẩy chương lên trên"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReorderChapter(c, 'down')}
                                disabled={idx === chapters.length - 1}
                                className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                title="Đẩy chương xuống dưới"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Create Assignment Button for this Chapter */}
                              <button
                                onClick={() => {
                                  setAssignTargetChapterId(c.id);
                                  setShowAssignModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-medium rounded-md border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                                title="Tạo bài tập cho chương này"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>+ Bài tập</span>
                              </button>

                              <button
                                onClick={() => startEditChapter(c)}
                                className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                title="Sửa tên & số STT chương"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(c.id)}
                                className="p-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Xóa chương"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Lessons list */}
                    {(chapterLessons[c.id]?.length ?? 0) > 0 && (
                      <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        {chapterLessons[c.id]?.map((lesson: Lesson, lIdx: number) => {
                          const status = isStudent ? getLessonStatus(lesson.id) : null;
                          const lessonProgress = studentProgress?.lessons.find((item) => item.lessonId === lesson.id);

                          return (
                            <li key={lesson.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between hover:bg-white transition">
                              <div className="min-w-0 flex-1">
                                {editLessonId === lesson.id ? (
                                  <div className="space-y-2 my-1">
                                    <input
                                      value={editLessonTitle}
                                      onChange={(e) => setEditLessonTitle(e.target.value)}
                                      placeholder="Tên bài học"
                                      className="w-full px-3 py-1.5 text-sm border rounded-md border-slate-300"
                                    />
                                    <textarea
                                      value={editLessonContent}
                                      onChange={(e) => setEditLessonContent(e.target.value)}
                                      placeholder="Nội dung/mô tả bài học"
                                      rows={2}
                                      className="w-full px-3 py-1.5 text-xs border rounded-md border-slate-300"
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={saveEditLesson} className="px-3 py-1 text-xs font-medium rounded bg-indigo-600 text-white">Lưu</button>
                                      <button onClick={() => setEditLessonId(null)} className="px-3 py-1 text-xs font-medium rounded bg-slate-200 text-slate-700">Hủy</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400 font-mono">#{lIdx + 1}</span>
                                      {isStudent ? (
                                        <Link to={`/student/classes/${cid}/lessons/${lesson.id}`} className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline">{lesson.title}</Link>
                                      ) : (
                                        <span className="font-semibold text-slate-800">{lesson.title}</span>
                                      )}
                                      {isLecturer && (
                                        <div className="inline-flex items-center gap-1">
                                          <button onClick={() => startEditLesson(lesson)} className="text-slate-400 hover:text-indigo-600 p-1 rounded" title="Sửa bài học">
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => handleDeleteLesson(lesson.id)} className="text-slate-400 hover:text-rose-600 p-1 rounded" title="Xóa bài học">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                                      {lesson.videoUrl && (
                                        <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-medium hover:underline">
                                          <Video className="w-3.5 h-3.5" />
                                          <span>Video bài giảng</span>
                                        </a>
                                      )}
                                      {lesson.attachmentUrl && (
                                        <a href={lesson.attachmentUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                                          <File className="w-3.5 h-3.5" />
                                          <span>{lesson.attachmentName || 'Tài liệu đính kèm'}</span>
                                        </a>
                                      )}
                                    </div>

                                    {/* Upload Controls for Lecturer */}
                                    {isLecturer && (
                                      <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => fileInputRefs.current[lesson.id]?.click()}
                                          disabled={saving || uploadingLessonId === lesson.id}
                                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition cursor-pointer"
                                        >
                                          <Video className="w-3 h-3 text-indigo-500" />
                                          <span>{lesson.videoUrl ? 'Thay video' : '+ Tải video'}</span>
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
                                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition cursor-pointer"
                                        >
                                          <File className="w-3 h-3 text-emerald-500" />
                                          <span>{lesson.attachmentUrl ? 'Thay tài liệu' : '+ Tải tài liệu'}</span>
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
                                      </div>
                                    )}

                                    {isStudent && (
                                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        {status && (
                                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.className}`}>
                                            {status.label}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {isStudent && (
                                <Link
                                  to={`/student/classes/${cid}/lessons/${lesson.id}`}
                                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${lessonProgress?.isCompleted ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                  {lessonProgress?.isCompleted ? 'Ôn tập' : 'Vào học'}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Add Lesson Form */}
                    {isLecturer && (
                      <div className="mt-3 border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2">
                        <input
                          value={selectedChapterId === c.id ? lessonTitle : ''}
                          onChange={(e) => { setSelectedChapterId(c.id); setLessonTitle(e.target.value); }}
                          placeholder="Tên bài học mới..."
                          className="w-44 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          value={selectedChapterId === c.id ? lessonContent : ''}
                          onChange={(e) => { setSelectedChapterId(c.id); setLessonContent(e.target.value); }}
                          placeholder="Mô tả ngắn..."
                          className="w-48 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleCreateLesson}
                          disabled={saving || !lessonTitle.trim() || selectedChapterId !== c.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tạo bài học
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        {/* Right Column: Announcements & Assignments (1 col) */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 text-base">Thông báo lớp học</h3>
              {isLecturer && (
                <button 
                  onClick={handleCreateAnnouncement} 
                  disabled={saving || !announcementTitle.trim() || !announcementContent.trim()} 
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thông báo
                </button>
              )}
            </div>

            {isLecturer && (
              <div className="mb-4 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input 
                  value={announcementTitle} 
                  onChange={(e) => setAnnouncementTitle(e.target.value)} 
                  placeholder="Tiêu đề thông báo..." 
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
                <textarea 
                  value={announcementContent} 
                  onChange={(e) => setAnnouncementContent(e.target.value)} 
                  placeholder="Nội dung thông báo chi tiết..." 
                  rows={2} 
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            )}

            {anns.length === 0 ? <Empty msg="Chưa có thông báo nào" /> : (
              <ul className="space-y-3">
                {anns.map((a: Announcement) => (
                  <li key={a.id} className="border-l-3 border-indigo-500 pl-3 py-1">
                    {editAnnId === a.id ? (
                      <div className="space-y-2">
                        <input
                          value={editAnnTitle}
                          onChange={(e) => setEditAnnTitle(e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded border-slate-300 font-medium"
                        />
                        <textarea
                          value={editAnnContent}
                          onChange={(e) => setEditAnnContent(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-xs border rounded border-slate-300"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEditAnn} className="px-2.5 py-0.5 text-xs rounded bg-indigo-600 text-white">Lưu</button>
                          <button onClick={() => setEditAnnId(null)} className="px-2.5 py-0.5 text-xs rounded bg-slate-200 text-slate-700">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-slate-800 text-sm">{a.title}</div>
                          {isLecturer && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => startEditAnn(a)} className="text-slate-400 hover:text-indigo-600 p-0.5"><Pencil className="w-3 h-3" /></button>
                              <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-slate-400 hover:text-rose-600 p-0.5"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.content}</div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Assignments Card */}
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Bài tập & Đánh giá
              </h3>
              {isLecturer && (
                <button
                  onClick={() => {
                    setAssignTargetChapterId(null);
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Bài tập
                </button>
              )}
            </div>

            {assigns.length === 0 ? <Empty msg="Chưa có bài tập nào" /> : (
              <ul className="space-y-3">
                {assigns.map((a: Assignment) => {
                  const studentSub = mySubmissions.find(s => s.assignmentId === a.id);
                  return (
                    <li key={a.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 hover:bg-white transition space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{a.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{a.description}</div>
                        </div>
                        <span className="shrink-0 font-semibold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {a.maxScore} điểm
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                        
                        {isStudent && (
                          studentSub ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                              <CheckCircle className="w-3 h-3" />
                              {studentSub.score != null ? `Đã chấm (${studentSub.score}/${a.maxScore})` : 'Đã nộp bài'}
                            </span>
                          ) : (
                            <button
                              onClick={() => setActiveSubmitAssignment(a)}
                              className="px-2.5 py-1 font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer text-[11px]"
                            >
                              Nộp bài
                            </button>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Student Roster Table */}
      <Card className="mt-6">
        <h3 className="font-bold text-slate-800 text-base mb-3">Danh sách sinh viên lớp học phần ({students.length})</h3>
        {students.length === 0 ? <Empty msg="Lớp chưa có sinh viên nào đăng ký" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3 text-left"># STT</th>
                  <th className="py-2.5 px-3 text-left">Mã sinh viên</th>
                  <th className="py-2.5 px-3 text-left">Họ và tên</th>
                  <th className="py-2.5 px-3 text-left">Email sinh viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s: User, i: number) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-xs">{i + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">{s.studentCode || `SV${s.id}`}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{s.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Lecturer Create Assignment */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Tạo bài tập mới cho lớp
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bài tập</label>
                <input
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bài tập..."
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả bài tập & yêu cầu nộp</label>
                <textarea
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Yêu cầu đề bài, định dạng nộp bài (file, link github, google drive...)"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File Đề Bài / Tài Liệu Đính Kèm (PDF, Word, Zip, Ảnh...)</label>
                <input
                  type="file"
                  onChange={(e) => setAssignFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
                {assignFile && (
                  <div className="mt-1 text-xs text-emerald-600 font-medium">
                    Đã chọn file đề bài: {assignFile.name} ({(assignFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn nộp bài</label>
                  <input
                    type="datetime-local"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thang điểm tối đa</label>
                  <input
                    type="number"
                    value={assignMaxScore}
                    onChange={(e) => setAssignMaxScore(Number(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={saving || !assignTitle.trim() || !assignDueDate}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Đang tạo...' : 'Tạo bài tập'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Student Submit Assignment */}
      {activeSubmitAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Nộp bài tập: {activeSubmitAssignment.title}</h3>
                <p className="text-xs text-slate-500">Hạn nộp: {new Date(activeSubmitAssignment.dueDate).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setActiveSubmitAssignment(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hình thức nộp bài</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSubType('FILE')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer ${subType === 'FILE' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File (Multi-file)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubType('GITHUB_LINK')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer ${subType !== 'FILE' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Đường link (Drive / Git)
                  </button>
                </div>
              </div>

              {subType === 'FILE' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn file bài làm</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSubSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {subSelectedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-emerald-600 font-medium">
                      Đã chọn {subSelectedFiles.length} file: {subSelectedFiles.map(f => f.name).join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nhập đường link nộp bài (URL)</label>
                  <input
                    value={subExternalLink}
                    onChange={(e) => setSubExternalLink(e.target.value)}
                    placeholder="https://github.com/... hoặc https://drive.google.com/..."
                    className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setActiveSubmitAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleStudentSubmit}
                disabled={submitting || (subType === 'FILE' ? subSelectedFiles.length === 0 : !subExternalLink.trim())}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Đang nộp...' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
