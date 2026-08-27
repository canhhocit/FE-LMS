// Mock data + helper giả lập độ trễ. KHÔNG bịa field ngoài API_CONTRACT.
import type {
  AuthUser, User, Clazz, Chapter, Lesson, Announcement,
  Assignment, Submission, Grade, Attendance, Message, DashboardStats,
} from '../../types';

export const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms + Math.random() * 150));

// ===== Users =====
export const mockUsers: User[] = [
  { id: 1, email: 'admin@learninghub.edu.vn', fullName: 'Quản trị hệ thống', role: 'ADMIN', active: true, createdAt: '2025-01-10T08:00:00Z' },
  { id: 2, email: 'gv.nguyenvana@learninghub.edu.vn', fullName: 'Nguyễn Văn An', role: 'LECTURER', active: true, createdAt: '2025-02-15T08:00:00Z' },
  { id: 3, email: 'sv20240001@student.edu.vn', fullName: 'Phạm Hoàng Nam', role: 'STUDENT', active: true, createdAt: '2025-03-20T08:00:00Z' },
  { id: 4, email: 'sv20240002@student.edu.vn', fullName: 'Đỗ Minh Anh', role: 'STUDENT', active: true, createdAt: '2025-03-22T08:00:00Z' },
  { id: 5, email: 'sv20240003@student.edu.vn', fullName: 'Nguyễn Thùy Linh', role: 'STUDENT', active: false, createdAt: '2025-04-01T08:00:00Z' },
];

export const mockDemoPasswords: Record<string, string> = {
  'admin@learninghub.edu.vn': 'password',
  'gv.nguyenvana@learninghub.edu.vn': 'password',
  'sv20240001@student.edu.vn': 'password',
};

// ===== Auth (login theo identifier) =====
export const mockAuthUsers: Record<string, AuthUser> = {
  'admin@learninghub.edu.vn': { token: 'mock-jwt-admin-001', type: 'Bearer', id: 1, email: 'admin@learninghub.edu.vn', fullName: 'Quản trị hệ thống', role: 'ADMIN', isFirstLogin: false },
  'gv.nguyenvana@learninghub.edu.vn': { token: 'mock-jwt-lecturer-001', type: 'Bearer', id: 2, email: 'gv.nguyenvana@learninghub.edu.vn', fullName: 'Nguyễn Văn An', role: 'LECTURER', isFirstLogin: false },
  'sv20240001@student.edu.vn': { token: 'mock-jwt-student-001', type: 'Bearer', id: 3, email: 'sv20240001@student.edu.vn', fullName: 'Phạm Hoàng Nam', role: 'STUDENT', isFirstLogin: false },
};

// ===== Classes =====
export const mockClasses: Clazz[] = [
  { id: 101, classCode: 'CS101', className: 'Nhập môn Lập trình', description: 'Python cơ bản', lecturerId: 2, lecturerName: 'Trần Thị Giảng', maxStudents: 35, studentCount: 35, startDate: '2026-02-01', endDate: '2026-06-01', status: 'ACTIVE', code: 'CS101', name: 'Nhập môn Lập trình', studentIds: [3, 4] },
  { id: 102, classCode: 'CS201', className: 'Cấu trúc dữ liệu', description: 'Array, List, Tree', lecturerId: 2, lecturerName: 'Trần Thị Giảng', maxStudents: 35, studentCount: 28, startDate: '2026-02-01', endDate: '2026-06-01', status: 'ACTIVE', code: 'CS201', name: 'Cấu trúc dữ liệu', studentIds: [3, 4] },
  { id: 103, classCode: 'CS301', className: 'Cơ sở dữ liệu', description: 'SQL & NoSQL', lecturerId: 2, lecturerName: 'Trần Thị Giảng', maxStudents: 40, studentCount: 0, startDate: '2026-09-01', endDate: '2027-01-01', status: 'UPCOMING', code: 'CS301', name: 'Cơ sở dữ liệu', studentIds: [] },
  { id: 104, classCode: 'CS401', className: 'Trí tuệ nhân tạo', description: 'ML, Deep Learning', lecturerId: 2, lecturerName: 'Trần Thị Giảng', maxStudents: 30, studentCount: 20, startDate: '2025-09-01', endDate: '2026-01-01', status: 'CLOSED', code: 'CS401', name: 'Trí tuệ nhân tạo', studentIds: [3] },
];

// ===== Chapters & Lessons =====
export const mockChapters: Chapter[] = [
  { id: 1, classId: 101, title: 'Chương 1: Giới thiệu Python', orderIndex: 1 },
  { id: 2, classId: 101, title: 'Chương 2: Biến & Kiểu dữ liệu', orderIndex: 2 },
  { id: 3, classId: 101, title: 'Chương 3: Cấu trúc điều khiển', orderIndex: 3 },
];
export const mockLessons: Lesson[] = [
  { id: 11, chapterId: 1, title: '1.1 Cài đặt môi trường', content: 'Hướng dẫn cài Python 3.12', videoUrl: 'https://example.com/v1.mp4', orderIndex: 1 },
  { id: 12, chapterId: 1, title: '1.2 Hello World',         content: 'print("Hello")', orderIndex: 2 },
  { id: 13, chapterId: 2, title: '2.1 Khai báo biến',       content: 'x = 10', orderIndex: 1 },
  { id: 14, chapterId: 2, title: '2.2 Các kiểu dữ liệu',    content: 'int, float, str, bool', orderIndex: 2 },
];

// ===== Announcements =====
export const mockAnnouncements: Announcement[] = [
  { id: 1, classId: 101, title: 'Thông báo lịch học tuần 1', content: 'Lớp CS101 bắt đầu từ 02/02', createdBy: 2, createdAt: '2026-01-25T10:00:00Z' },
  { id: 2, classId: 101, title: 'Nộp bài tập lớn',           content: 'Deadline: 30/03/2026',         createdBy: 2, createdAt: '2026-03-20T10:00:00Z' },
];

// ===== Assignments =====
export const mockAssignments: Assignment[] = [
  { id: 1, classId: 101, title: 'Bài tập 1: Hello World', description: 'Viết chương trình in Hello',  dueDate: '2026-03-15T23:59:00Z', maxScore: 10, createdAt: '2026-03-01T08:00:00Z' },
  { id: 2, classId: 101, title: 'Bài tập 2: Tính tổng',    description: 'Nhập n, tính 1+2+...+n',      dueDate: '2026-04-01T23:59:00Z', maxScore: 10, createdAt: '2026-03-20T08:00:00Z' },
  { id: 3, classId: 101, title: 'Bài tập lớn cuối kỳ',     description: 'Xây dựng ứng dụng console',   dueDate: '2026-06-15T23:59:00Z', maxScore: 20, createdAt: '2026-05-01T08:00:00Z' },
];

// ===== Submissions =====
export const mockSubmissions: Submission[] = [
  { id: 1, assignmentId: 1, studentId: 3, studentName: 'Lê Văn Sinh',   content: 'print("Hello World")', submittedAt: '2026-03-10T15:30:00Z', score: 10, feedback: 'Tốt', status: 'GRADED' },
  { id: 2, assignmentId: 1, studentId: 4, studentName: 'Phạm Thị Học',  content: 'print("hello")',       submittedAt: '2026-03-12T10:00:00Z', status: 'SUBMITTED' },
  { id: 3, assignmentId: 2, studentId: 3, studentName: 'Lê Văn Sinh',   content: 'n = int(input()); print(sum(range(1,n+1)))', submittedAt: '2026-03-28T20:00:00Z', status: 'SUBMITTED' },
];

// ===== Grades =====
export const mockGrades: Grade[] = [
  { id: 1, classId: 101, studentId: 3, studentName: 'Lê Văn Sinh',  score: 8.5, gradeType: 'MIDTERM',    note: 'Khá tốt', createdAt: '2026-04-15T08:00:00Z' },
  { id: 2, classId: 101, studentId: 3, studentName: 'Lê Văn Sinh',  score: 9.0, gradeType: 'ASSIGNMENT', createdAt: '2026-03-15T08:00:00Z' },
  { id: 3, classId: 101, studentId: 4, studentName: 'Phạm Thị Học', score: 7.0, gradeType: 'MIDTERM',    createdAt: '2026-04-15T08:00:00Z' },
];

// ===== Attendance =====
export const mockAttendance: Attendance[] = [
  { classId: 101, date: '2026-03-10', records: [
    { studentId: 3, studentName: 'Lê Văn Sinh',  status: 'PRESENT' },
    { studentId: 4, studentName: 'Phạm Thị Học', status: 'LATE' },
  ]},
  { classId: 101, date: '2026-03-12', records: [
    { studentId: 3, studentName: 'Lê Văn Sinh',  status: 'PRESENT' },
    { studentId: 4, studentName: 'Phạm Thị Học', status: 'ABSENT' },
  ]},
];

// ===== Messages =====
export const mockMessages: Message[] = [
  { id: 1, senderId: 2, receiverId: 3, content: 'Chào em, em làm bài tập chưa?', sentAt: '2026-03-10T09:00:00Z', read: true },
  { id: 2, senderId: 3, receiverId: 2, content: 'Dạ em làm rồi ạ, nhờ cô xem', sentAt: '2026-03-10T09:05:00Z', read: true },
  { id: 3, senderId: 2, receiverId: 3, content: 'OK em, cô chấm xong sẽ phản hồi', sentAt: '2026-03-10T09:10:00Z', read: false },
];

// ===== Dashboard stats =====
export const mockStats: DashboardStats = {
  totalUsers: 128, totalClasses: 12, totalEnrollments: 340,
  totalAssignments: 45, totalSubmissions: 312,
};