// ===== DTO theo API_CONTRACT.md — KHÔNG tự thêm field =====

export type Role = 'STUDENT' | 'LECTURER' | 'ADMIN';

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// ===== Auth =====
export interface LoginRequest {
  identifier: string;
  password: string;
}
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
export interface AuthUser {
  token: string;
  type: string;
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isFirstLogin: boolean;
}

// ===== User (Admin) =====
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active?: boolean;
  createdAt?: string;
}
export interface PageResp<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ===== Clazz =====
export interface Clazz {
  id: number;
  code: string;
  name: string;
  description?: string;
  lecturerId: number;
  lecturerName?: string;
  studentCount?: number;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'CLOSED' | 'UPCOMING' | 'PENDING';
  studentIds?: number[];
}

// ===== Content =====
export interface Chapter {
  id: number;
  classId: number;
  title: string;
  orderIndex: number;
  lessons?: Lesson[];
}
export interface Lesson {
  id: number;
  chapterId: number;
  title: string;
  content?: string;
  videoUrl?: string;
  orderIndex: number;
}
export interface Announcement {
  id: number;
  classId: number;
  title: string;
  content: string;
  createdBy: number;
  createdAt: string;
}

// ===== Assessment =====
export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  createdAt?: string;
}
export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName?: string;
  content: string;
  fileUrl?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
}

// ===== Grading =====
export interface Grade {
  id: number;
  classId: number;
  studentId: number;
  studentName?: string;
  score: number;
  gradeType: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT';
  note?: string;
  createdAt?: string;
}
export interface AttendanceRecord {
  studentId: number;
  studentName?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}
export interface Attendance {
  classId: number;
  date: string;
  records: AttendanceRecord[];
}

// ===== Chat =====
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
  read: boolean;
  courseId?: number;
}
export interface DashboardStats {
  totalUsers: number;
  totalClasses: number;
  totalEnrollments: number;
  totalAssignments: number;
  totalSubmissions: number;
}