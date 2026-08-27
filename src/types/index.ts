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

// ===== Profile =====
export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  studentCode?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

// ===== Notification =====
export interface Notification {
  id: number;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  type: 'ASSIGNMENT' | 'GRADE' | 'ANNOUNCEMENT' | 'SYSTEM';
}

// ===== Schedule =====
export interface Schedule {
  id: number;
  classId: number;
  classCode?: string;
  className?: string;
  dayOfWeek: number; // 2=Mon..8=Sun (ISO)
  startTime: string; // "HH:mm"
  endTime: string;
  room?: string;
  lecturerName?: string;
}

// ===== Quiz =====
export interface Quiz {
  id: number;
  classId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxAttempts: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}
export interface QuizQuestion {
  id: number;
  quizId: number;
  content: string;
  options: string[];
  correctAnswer: number;
  points: number;
}
export interface QuizAttempt {
  id: number;
  quizId: number;
  userId: number;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  answers: Record<number, number>; // questionId -> selectedOption index
}

// ===== Forum =====
export interface ForumPost {
  id: number;
  classId: number;
  authorId: number;
  authorName?: string;
  title: string;
  content: string;
  createdAt: string;
  commentCount?: number;
}
export interface ForumComment {
  id: number;
  postId: number;
  authorId: number;
  authorName?: string;
  content: string;
  createdAt: string;
}

// ===== Curriculum =====
export interface Curriculum {
  id: number;
  code: string;
  name: string;
  description?: string;
  totalCredits: number;
}
export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  description?: string;
  prerequisites?: number[];
}
export interface Prerequisite {
  id: number;
  courseId: number;
  prerequisiteCourseId: number;
}

// ===== Registration Period =====
export interface RegistrationPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED';
}

// ===== Admin Reports =====
export interface EnrollmentReport {
  month: string; // "2026-01"
  count: number;
}
export interface ScoreReport {
  classId: number;
  classCode: string;
  className: string;
  averageScore: number;
  studentCount: number;
}

// ===== Academic Status =====
export interface AcademicStatus {
  semester: string;
  gpa: number;
  cumulativeGpa: number;
  totalCredits: number;
  earnedCredits: number;
  warningLevel?: 'NONE' | 'WARNING' | 'CRITICAL';
  message?: string;
}

// ===== Transcript (bảng điểm sinh viên) =====
export interface TranscriptItem {
  semester: string;
  courseCode: string;
  courseName: string;
  credits: number;
  score: number;
  letter?: string;
}

// ===== Enrollment (lớp đã đăng ký của sinh viên) =====
export interface Enrollment {
  id: number;
  classId: number;
  classCode?: string;
  className?: string;
  status?: 'ENROLLED' | 'COMPLETED' | 'DROPPED' | 'PENDING';
  progress?: number;
}

// ===== Progress =====
export interface LessonProgress {
  lessonId: number;
  completed: boolean;
  completedAt?: string;
}
export interface EnrollmentProgress {
  enrollmentId: number;
  classId: number;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  lessons: LessonProgress[];
}