import { useRef, useState } from "react";
import { X, FileText, Video, File, Upload, Loader2 } from "lucide-react";
import * as contentService from "../services/contentService";
import type { Lesson } from "../types";

interface ManageMaterialsModalProps {
  lesson: Lesson;
  onClose: () => void;
  onUpdated: () => void;
  uploadingVideoId: number | null;
  uploadingAttachmentId: number | null;
  videoProgress: number;
  attachmentProgress: number;
  onUploadVideo: (lessonId: number, file: globalThis.File) => Promise<void>;
  onUploadAttachment: (lessonId: number, file: globalThis.File) => Promise<void>;
}

export function ManageMaterialsModal({ 
  lesson, 
  onClose, 
  onUpdated,
  uploadingVideoId,
  uploadingAttachmentId,
  videoProgress,
  attachmentProgress,
  onUploadVideo,
  onUploadAttachment
}: ManageMaterialsModalProps) {
  const [currentLesson, setCurrentLesson] = useState<Lesson>(lesson);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Sync when prop changes just in case
  if (lesson.id !== currentLesson.id) {
    setCurrentLesson(lesson);
  }

  // To preview Google Drive properly in iframe
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.split('/view')[0] + '/preview';
    }
    return url;
  };

  const handleDeleteVideo = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa video này?')) return;
    try {
      await contentService.updateLesson(currentLesson.id, { videoUrl: '' });
      setCurrentLesson(prev => ({ ...prev, videoUrl: '' }));
      onUpdated();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi xóa video.');
    }
  };

  const handleDeleteAttachment = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await contentService.updateLesson(currentLesson.id, { attachmentUrl: '', attachmentName: '' });
      setCurrentLesson(prev => ({ ...prev, attachmentUrl: '', attachmentName: '' }));
      onUpdated();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi xóa tài liệu.');
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadVideo(currentLesson.id, file);
    e.target.value = '';
    onUpdated();
  };

  const handleAttachmentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadAttachment(currentLesson.id, file);
    e.target.value = '';
    onUpdated();
  };

  // We should also check if the lesson in parent has updated (e.g. after upload finishes)
  // For simplicity, we just rely on the parent causing a re-render if it changes its state
  if (lesson.videoUrl !== currentLesson.videoUrl || lesson.attachmentUrl !== currentLesson.attachmentUrl) {
     setCurrentLesson(lesson);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Quản lý học liệu: {currentLesson.title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
          {/* VIDEO SECTION */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="flex items-center gap-2"><Video className="w-5 h-5 text-indigo-500"/> Video bài giảng</span>
              {currentLesson.videoUrl && (
                <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition cursor-pointer border border-transparent">Thay video khác</button>
                  <button onClick={handleDeleteVideo} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition cursor-pointer border border-transparent">Xóa video</button>
                </div>
              )}
            </h4>
            {currentLesson.videoUrl ? (
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-black flex justify-center">
                <video src={currentLesson.videoUrl} controls className="w-full max-h-[400px]" />
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">Bài học này chưa có video bài giảng.</p>
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-2 mx-auto">
                  <Upload className="w-4 h-4" /> Tải video lên
                </button>
              </div>
            )}
            
            {uploadingVideoId === currentLesson.id && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex justify-between text-indigo-700 mb-1.5 font-medium text-xs">
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải lên video...</span>
                  <span>{videoProgress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-indigo-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${videoProgress || 0}%` }} />
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.webm,.mov,.mkv,.avi"
              className="hidden"
              onChange={handleVideoFileChange}
            />
          </div>

          {/* ATTACHMENT SECTION */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="flex items-center gap-2"><File className="w-5 h-5 text-emerald-500"/> Tài liệu đính kèm</span>
              {currentLesson.attachmentUrl && (
                <div className="flex gap-2">
                  <button onClick={() => attachmentInputRef.current?.click()} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-md hover:bg-emerald-100 transition cursor-pointer border border-transparent">Thay tài liệu khác</button>
                  <button onClick={handleDeleteAttachment} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition cursor-pointer border border-transparent">Xóa tài liệu</button>
                </div>
              )}
            </h4>
            {currentLesson.attachmentUrl ? (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <iframe src={getEmbedUrl(currentLesson.attachmentUrl)} className="w-full h-[500px] bg-slate-50" allow="autoplay" title="Tài liệu preview" />
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <File className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">Bài học này chưa có tài liệu đính kèm.</p>
                <button onClick={() => attachmentInputRef.current?.click()} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-2 mx-auto">
                  <Upload className="w-4 h-4" /> Tải tài liệu lên
                </button>
              </div>
            )}

            {uploadingAttachmentId === currentLesson.id && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex justify-between text-emerald-700 mb-1.5 font-medium text-xs">
                  <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải lên tài liệu...</span>
                  <span>{attachmentProgress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-emerald-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${attachmentProgress || 0}%` }} />
                </div>
              </div>
            )}

            <input
              ref={attachmentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
              className="hidden"
              onChange={handleAttachmentFileChange}
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
           <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition">
             Đóng
           </button>
        </div>
      </div>
    </div>
  );
}
