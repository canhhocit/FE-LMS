import { apiClient, unwrap } from './api/client';
import type { ForumPost, ForumComment } from '../types';
export const getPosts = async (classId: number): Promise<ForumPost[]> => unwrap(apiClient.get(`/classes/${classId}/forum/posts`));
export const createPost = async (classId: number, data: { title: string; content: string }): Promise<ForumPost> => unwrap(apiClient.post(`/classes/${classId}/forum/posts`, data));
export const deletePost = async (id: number): Promise<void> => unwrap(apiClient.delete(`/forum/posts/${id}`));
export const getComments = async (postId: number): Promise<ForumComment[]> => unwrap(apiClient.get(`/forum/posts/${postId}/comments`));
export const createComment = async (postId: number, content: string): Promise<ForumComment> => unwrap(apiClient.post(`/forum/posts/${postId}/comments`, { content }));
