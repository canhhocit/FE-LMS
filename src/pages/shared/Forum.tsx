import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as forumService from '../../services/forumService';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle, Card, Spinner, Empty, ErrorBox } from '../../components/Layout';
import type { ForumPost, ForumComment } from '../../types';

export default function Forum() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const classId = Number(params.get('classId')) || 0;

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await forumService.getPosts(classId);
        if (mounted) setPosts(data);
      } catch (e) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải bài viết');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [classId]);

  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const data = await forumService.getComments(selectedPost.id);
        if (mounted) setComments(data);
      } catch (e) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải bình luận');
      }
    })();
    return () => { mounted = false; };
  }, [selectedPost]);

  const handleCreatePost = async () => {
    if (!classId || !newPostTitle.trim() || !newPostContent.trim()) return;
    setSaving(true);
    setFlash(null);
    try {
      await forumService.createPost(classId, { title: newPostTitle.trim(), content: newPostContent.trim() });
      const fresh = await forumService.getPosts(classId);
      setPosts(fresh);
      setNewPostTitle('');
      setNewPostContent('');
      setSelectedPost(null);
      setFlash('Đã đăng bài viết');
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Đăng bài thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    setSaving(true);
    setFlash(null);
    try {
      await forumService.deletePost(id);
      const fresh = await forumService.getPosts(classId);
      setPosts(fresh);
      setSelectedPost(null);
      setFlash('Đã xóa bài viết');
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Xóa bài thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newCommentContent.trim()) return;
    setSaving(true);
    setFlash(null);
    try {
      await forumService.createComment(selectedPost.id, newCommentContent.trim());
      const fresh = await forumService.getComments(selectedPost.id);
      setComments(fresh);
      setNewCommentContent('');
      setFlash('Đã bình luận');
    } catch (e) {
      setFlash((e as { message?: string })?.message ?? 'Bình luận thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!classId) return <Empty msg="Vui lòng chọn lớp học phần" />;
  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div>
      <PageTitle>Diễn đàn thảo luận</PageTitle>

      {/* Form tạo bài viết */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-3">Đăng bài viết mới</h3>
        <div className="space-y-3">
          <input
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Tiêu đề bài viết"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
          />
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Nội dung bài viết"
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
          />
          <button
            onClick={handleCreatePost}
            disabled={saving || !newPostTitle.trim() || !newPostContent.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-indigo-500"
          >
            {saving ? 'Đang đăng...' : 'Đăng bài viết'}
          </button>
        </div>
      </Card>

      {flash && (
        <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {flash}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Danh sách bài viết */}
        <Card className="lg:col-span-1">
          <h3 className="font-semibold mb-3">Bài viết ({posts.length})</h3>
          {posts.length === 0 ? (
            <Empty msg="Chưa có bài viết" />
          ) : (
            <ul className="space-y-2">
              {posts.map((post) => (
                <li
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`p-2 rounded-lg cursor-pointer border-l-4 transition ${
                    selectedPost?.id === post.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-medium text-sm line-clamp-2">{post.title}</div>
                  <div className="text-xs text-slate-500">
                    {post.authorName} · {post.commentCount ?? 0} bình luận
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Chi tiết bài viết và bình luận */}
        {selectedPost ? (
          <Card className="lg:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{selectedPost.title}</h3>
                <div className="text-xs text-slate-500">
                  {selectedPost.authorName} · {new Date(selectedPost.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
              {user?.id === selectedPost.authorId && (
                <button
                  onClick={() => handleDeletePost(selectedPost.id)}
                  disabled={saving}
                  className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  Xóa
                </button>
              )}
            </div>

            <div className="mb-6 p-3 rounded-lg bg-slate-50 text-sm">{selectedPost.content}</div>

            {/* Danh sách bình luận */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Bình luận ({comments.length})</h4>
              {comments.length === 0 ? (
                <div className="text-sm text-slate-500">Chưa có bình luận</div>
              ) : (
                <ul className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <li key={comment.id} className="p-2 border-l-2 border-slate-300 pl-3">
                      <div className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{comment.authorName}</span> ·{' '}
                        {new Date(comment.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-sm text-slate-700 mt-1">{comment.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Form bình luận */}
            <div className="border-t border-slate-200 pt-4">
              <div className="space-y-2">
                <textarea
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="Viết bình luận của bạn"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
                />
                <button
                  onClick={handleAddComment}
                  disabled={saving || !newCommentContent.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-emerald-500"
                >
                  {saving ? 'Đang gửi...' : 'Gửi bình luận'}
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-center h-64 text-slate-500">
              Chọn bài viết để xem chi tiết
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
