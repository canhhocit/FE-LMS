// Forum service (discussion trong lop hoc)
import { USE_MOCK, apiClient, unwrap } from './api/client';
import { delay } from './mock';
import type { ForumPost, ForumComment } from '../types';

export const getPosts = async (classId: number): Promise<ForumPost[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, classId, authorId: 2, authorName: 'Nguyen Van B', title: 'Hoi ve bai tap 1', content: 'Ai giup minh cau 3?', createdAt: '2026-03-08T08:00:00Z', commentCount: 2 },
      { id: 2, classId, authorId: 3, authorName: 'Le Van C', title: 'Tai lieu tham khao', content: 'Share tai lieu hay', createdAt: '2026-03-07T10:00:00Z', commentCount: 0 },
    ];
  }
  return unwrap<ForumPost[]>(apiClient.get(`/classes/${classId}/forum/posts`));
};

export const createPost = async (classId: number, data: { title: string; content: string }): Promise<ForumPost> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), classId, authorId: 1, title: data.title, content: data.content, createdAt: new Date().toISOString(), commentCount: 0 };
  }
  return unwrap<ForumPost>(apiClient.post(`/classes/${classId}/forum/posts`, data));
};

export const deletePost = async (id: number): Promise<void> => {
  if (USE_MOCK) { await delay(); return; }
  await unwrap<void>(apiClient.delete(`/forum/posts/${id}`));
};

export const getComments = async (postId: number): Promise<ForumComment[]> => {
  if (USE_MOCK) {
    await delay();
    return [
      { id: 1, postId, authorId: 2, authorName: 'Nguyen Van B', content: 'Tra loi: su dung mang', createdAt: '2026-03-08T09:00:00Z' },
    ];
  }
  return unwrap<ForumComment[]>(apiClient.get(`/forum/posts/${postId}/comments`));
};

export const createComment = async (postId: number, content: string): Promise<ForumComment> => {
  if (USE_MOCK) {
    await delay();
    return { id: Date.now(), postId, authorId: 1, content, createdAt: new Date().toISOString() };
  }
  return unwrap<ForumComment>(apiClient.post(`/forum/posts/${postId}/comments`, { content }));
};
