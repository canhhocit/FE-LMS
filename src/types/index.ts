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
  isFirstLogin?: boolean;
  firstLogin?: boolean;
  refreshToken: string | null;
  permissions?: string[];
}

// ===== User (Admin) =====
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active?: boolean;
  createdAt?: string;
  studentCode?: string;
  phone?: string;
  adminClassId?: number;
}
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export type PageResp<T> = SpringPage<T>;

// ===== Clazz =====
export interface Clazz {
  id: number;
  classCode: string;
  className: string;
  semester: string;
  academicYear: string;
  courseId: number | null;
  courseTitle: string | null;
  lecturerId: number | null;
  lecturerName: string | null;
  maxStudents: number;
  createdAt: string;
}

// ===== Content =====
export interface Chapter {
  id: number;
  classId: number;
  title: string;
  sortOrder: number;
  lessons?: Lesson[];
}
export interface Lesson {
  id: number;
  chapterId: number;
  title: string;
  content?: string;
  videoUrl?: string;
  sortOrder?: number;
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
  fileUrl: string;
  submittedAt: string;
  isLate: boolean;
  score: number | null;
  feedback: string | null;
}

// ===== Grading =====
export interface Grade {
  id: number;
  classId: number;
  studentId: number;
  studentName: string;
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
}
export interface AttendanceRecord {
  id: number;
  classId: number;
  studentId: number;
  studentName: string;
  attendanceDate: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}
export type Attendance = AttendanceRecord;

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
  studentCode: string | null;
  lecturerCode: string | null;
  faculty: string | null;
  major: string | null;
  dateOfBirth: string | null;
  status: string;
  curriculumId?: number | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  dateOfBirth: string | null;
  faculty: string | null;
  major: string | null;
}

// ===== Notification =====
export interface Notification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type: 'NEW_ASSIGNMENT' | 'NEW_GRADE' | 'NEW_ANNOUNCEMENT' | 'ACADEMIC_WARNING';
  referenceId?: number;
}

export interface TuitionInvoice {
  id: number;
  studentId?: number;
  studentFullName?: string;
  semester: string;
  academicYear: string;
  totalCredits?: number;
  pricePerCredit: number;
  amount: number;
  status: string;
  paidAt?: string;
}

export interface TuitionRate {
  id: number;
  academicYear: string;
  pricePerCredit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Schedule =====
export interface Schedule {
  id: number;
  clazzId: number;
  clazzCode?: string;
  courseCode?: string;
  courseTitle?: string;
  dayOfWeek?: number;
  startPeriod?: number;
  endPeriod?: number;
  room?: string;
  classCode?: string;
  className?: string;
  startTime?: string;
  endTime?: string;
  lecturerName?: string;
}

// ===== Quiz =====
export interface Quiz {
  id: number;
  classId: number;
  title: string;
  durationMinutes: number;
  totalScore: number;
  createdAt: string;
}
export interface QuizQuestion {
  id: number;
  quizId: number;
  content: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}
export interface QuizAttempt {
  attemptId: number;
  quizId: number;
  studentId: number;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  totalScore: number;
  submittedAt: string;
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
  name: string;
  faculty?: string;
  academicYear?: string;
  isActive?: boolean;
}
export interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  credit: number;
  createdAt: string;
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
  semester: string;
  academicYear: string;
  openAt: string;
  closeAt: string;
  maxCredits: number | null;
  isActive: boolean;
}

// ===== Admin Reports =====
export interface EnrollmentReport {
  month: string; // "2026-01"
  count: number;
}
export interface ScoreReport {
  classId: string;
  classCode: string;
  className: string;
  averageScore: number;
}

// ===== Academic Status =====
export interface AcademicStatus {
  cumulativeGpa: number | null;
  totalCredits: number | null;
  passedCredits: number | null;
  academicWarning: boolean;
  warningLevel: number | null;
  totalCourses: number | null;
  passedCourses: number | null;
  failedCourses: Array<{
    courseCode: string;
    courseTitle: string;
    credit: number;
    totalScore: number | null;
  }>;
}

// ===== Transcript (bảng điểm sinh viên) =====
export interface TranscriptItem {
  courseCode: string;
  courseTitle: string;
  credit: number;
  totalScore: number | null;
  gpa: number | null;
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
  lessonTitle: string;
  isCompleted: boolean;
  completedAt: string | null;
}
export interface EnrollmentProgress {
  enrollmentId: number;
  clazzId: number;
  completedCount: number;
  totalCount: number;
  percentage: number;
  lessons: LessonProgress[];
}

export interface Registration {
  enrollmentId: number;
  clazzId: number;
  clazzCode: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  credits: number | null;
  enrolledAt: string;
}
export interface GradingPolicy {
  id?: number;
  curriculumId: number;
  attendanceWeight: number;
  midtermWeight: number;
  finalWeight: number;
}

export interface GpaScaleRule {
  id?: number;
  curriculumId: number;
  minScore10: number;
  gpa4: number;
  sortOrder: number;
}
