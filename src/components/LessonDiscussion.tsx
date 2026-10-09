import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';
import { Card, Button, Spinner, Badge } from './ui';
import * as contentService from '../services/contentService';
import { useAuth } from '../contexts/useAuth';

interface LessonDiscussionProps {
  lessonId: number;
}

export const LessonDiscussion: React.FC<LessonDiscussionProps> = ({ lessonId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<contentService.LessonComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadComments();
  }, [lessonId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await contentService.getLessonComments(lessonId);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      setSaving(true);
      await contentService.createLessonComment(lessonId, newComment.trim());
      setNewComment('');
      await loadComments();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await contentService.deleteLessonComment(id);
      await loadComments();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <h4 className="font-bold text-slate-900 dark:text-white text-base">Thảo luận chung</h4>
          <Badge color="blue">{comments.length}</Badge>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handlePost();
            }
          }}
          placeholder="Viết bình luận, thắc mắc về bài giảng này..."
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          variant="primary"
          size="sm"
          disabled={saving || !newComment.trim()}
          onClick={() => void handlePost()}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Gửi</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-4 flex justify-center"><Spinner /></div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          Chưa có bình luận nào.
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {comments.map((cmt) => (
            <div key={cmt.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                {cmt.userAvatar ? (
                  <img src={cmt.userAvatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{cmt.userName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(cmt.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {(user?.id === cmt.userId || user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
                    <button onClick={() => handleDelete(cmt.id)} className="text-slate-400 hover:text-red-500 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{cmt.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
