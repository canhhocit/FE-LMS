export type Role = "student" | "lecturer" | "admin"

export type User = {
  id: string
  name: string
  email: string
  role: Role
  title: string
}

export type Course = {
  id: string
  code: string
  title: string
  description: string
  lecturerId: string
  lecturerName: string
  term: string
  credits: number
  color: string
  progress: number
}

export type ClassSection = {
  id: string
  courseId: string
  name: string
  schedule: string
  room: string
  studentIds: string[]
}

export type Student = {
  id: string
  studentCode: string
  name: string
  email: string
  program: string
  year: number
}

export type SubmissionStatus = "submitted" | "graded" | "missing" | "late"

export type Assignment = {
  id: string
  courseId: string
  title: string
  description: string
  dueDate: string
  points: number
  status: SubmissionStatus
  grade: number | null
  fileName: string | null
  submittedAt: string | null
}

export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
}

export type Quiz = {
  id: string
  courseId: string
  title: string
  durationMinutes: number
  availableUntil: string
  questions: QuizQuestion[]
  attempted: boolean
  score: number | null
}

export type GradeItem = {
  name: string
  score: number
  max: number
  weight: number
}

export type CourseGrade = {
  courseId: string
  items: GradeItem[]
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused"

export type AttendanceSession = {
  id: string
  courseId: string
  date: string
  topic: string
  status: AttendanceStatus
}

export type Announcement = {
  id: string
  courseId: string | null
  title: string
  body: string
  author: string
  date: string
  pinned: boolean
}

export const currentUsers: Record<Role, User> = {
  student: {
    id: "s-100",
    name: "Nguyễn Thị Mai",
    email: "mai.nguyen@meridian.edu.vn",
    role: "student",
    title: "Cử nhân CNTT · Năm 2",
  },
  lecturer: {
    id: "l-10",
    name: "TS. Trần Văn Anh",
    email: "anh.tran@meridian.edu.vn",
    role: "lecturer",
    title: "Khoa Công nghệ Thông tin",
  },
  admin: {
    id: "a-1",
    name: "Lê Thị Ngọc",
    email: "ngoc.le@meridian.edu.vn",
    role: "admin",
    title: "Phòng Đào tạo",
  },
}

export const courses: Course[] = [
  {
    id: "c-cs201",
    code: "CS 201",
    title: "Cấu trúc dữ liệu & Giải thuật",
    description:
      "Các cấu trúc dữ liệu cốt lõi, thiết kế thuật toán và phân tích độ phức tạp kèm bài thực hành.",
    lecturerId: "l-10",
    lecturerName: "TS. Trần Văn Anh",
    term: "Học kỳ 1 · 2026",
    credits: 4,
    color: "oklch(0.52 0.19 258)",
    progress: 68,
  },
  {
    id: "c-cs210",
    code: "CS 210",
    title: "Hệ quản trị cơ sở dữ liệu",
    description:
      "Mô hình quan hệ, SQL, giao dịch và cơ chế bên trong của các hệ cơ sở dữ liệu hiện đại.",
    lecturerId: "l-10",
    lecturerName: "TS. Trần Văn Anh",
    term: "Học kỳ 1 · 2026",
    credits: 3,
    color: "oklch(0.65 0.15 230)",
    progress: 42,
  },
  {
    id: "c-ma140",
    code: "MA 140",
    title: "Đại số tuyến tính",
    description:
      "Vector, ma trận, trị riêng và các ứng dụng trong tin học và kỹ thuật.",
    lecturerId: "l-22",
    lecturerName: "PGS. Phạm Thu Hà",
    term: "Học kỳ 1 · 2026",
    credits: 3,
    color: "oklch(0.62 0.16 152)",
    progress: 80,
  },
  {
    id: "c-en105",
    code: "EN 105",
    title: "Viết học thuật",
    description:
      "Nghiên cứu, lập luận và các quy chuẩn viết học thuật trong lĩnh vực khoa học.",
    lecturerId: "l-31",
    lecturerName: "TS. Hoàng Minh Đức",
    term: "Học kỳ 1 · 2026",
    credits: 2,
    color: "oklch(0.72 0.16 75)",
    progress: 55,
  },
]

export const classSections: ClassSection[] = [
  {
    id: "cl-1",
    courseId: "c-cs201",
    name: "CS 201 · Lớp A",
    schedule: "Thứ 2 & Thứ 4 · 09:00–10:30",
    room: "Giảng đường B-204",
    studentIds: ["s-100", "s-101", "s-102", "s-103", "s-104"],
  },
  {
    id: "cl-2",
    courseId: "c-cs210",
    name: "CS 210 · Lớp A",
    schedule: "Thứ 3 & Thứ 5 · 11:00–12:30",
    room: "Phòng LAB C-110",
    studentIds: ["s-100", "s-101", "s-105"],
  },
]

export const students: Student[] = [
  { id: "s-100", studentCode: "2024-CS-100", name: "Nguyễn Thị Mai", email: "mai.nguyen@meridian.edu.vn", program: "Công nghệ Thông tin", year: 2 },
  { id: "s-101", studentCode: "2024-CS-101", name: "Trần Quốc Bảo", email: "bao.tran@meridian.edu.vn", program: "Công nghệ Thông tin", year: 2 },
  { id: "s-102", studentCode: "2024-CS-102", name: "Phạm Ngọc Linh", email: "linh.pham@meridian.edu.vn", program: "Công nghệ Thông tin", year: 2 },
  { id: "s-103", studentCode: "2024-CS-103", name: "Đỗ Minh Quân", email: "quan.do@meridian.edu.vn", program: "Kỹ thuật Phần mềm", year: 2 },
  { id: "s-104", studentCode: "2024-CS-104", name: "Vũ Thị Hồng", email: "hong.vu@meridian.edu.vn", program: "Công nghệ Thông tin", year: 2 },
  { id: "s-105", studentCode: "2024-CS-105", name: "Lê Hoàng Nam", email: "nam.le@meridian.edu.vn", program: "Khoa học Dữ liệu", year: 3 },
]

export const assignments: Assignment[] = [
  {
    id: "as-1",
    courseId: "c-cs201",
    title: "Bài tập 3 — Cây cân bằng",
    description: "Cài đặt cây AVL với các thao tác chèn, xóa và xoay. Nộp mã nguồn kèm báo cáo ngắn.",
    dueDate: "2026-07-16T23:59:00",
    points: 100,
    status: "missing",
    grade: null,
    fileName: null,
    submittedAt: null,
  },
  {
    id: "as-2",
    courseId: "c-cs210",
    title: "Bài lab 4 — Tối ưu truy vấn",
    description: "Phân tích và viết lại năm truy vấn SQL chậm. Đính kèm kế hoạch EXPLAIN trước và sau.",
    dueDate: "2026-07-14T23:59:00",
    points: 50,
    status: "submitted",
    grade: null,
    fileName: "lab4_truyvan.pdf",
    submittedAt: "2026-07-11T18:22:00",
  },
  {
    id: "as-3",
    courseId: "c-ma140",
    title: "Bài tập lớn 6 — Trị riêng",
    description: "Giải các bài toán về trị riêng và vector riêng trong chương 6.",
    dueDate: "2026-07-09T23:59:00",
    points: 40,
    status: "graded",
    grade: 36,
    fileName: "btl6_mai.pdf",
    submittedAt: "2026-07-08T20:10:00",
  },
  {
    id: "as-4",
    courseId: "c-en105",
    title: "Bản nháp — Tổng quan tài liệu",
    description: "Bản nháp đầu tiên của phần tổng quan tài liệu (1500 từ) kèm nguồn trích dẫn.",
    dueDate: "2026-07-20T23:59:00",
    points: 60,
    status: "missing",
    grade: null,
    fileName: null,
    submittedAt: null,
  },
]

export const quizzes: Quiz[] = [
  {
    id: "qz-1",
    courseId: "c-cs201",
    title: "Bài kiểm tra 4 — Cây & Heap",
    durationMinutes: 10,
    availableUntil: "2026-07-18T23:59:00",
    attempted: false,
    score: null,
    questions: [
      {
        id: "q1",
        prompt: "Độ phức tạp thời gian trong trường hợp xấu nhất khi tìm kiếm trên cây nhị phân tìm kiếm cân bằng là gì?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "Trong max-heap, phần tử lớn nhất nằm ở đâu?",
        options: ["Ở một nút lá", "Ở nút gốc", "Ở tầng giữa", "Không cố định"],
        correctIndex: 1,
      },
      {
        id: "q3",
        prompt: "Phép duyệt nào của cây nhị phân tìm kiếm cho ra thứ tự đã sắp xếp?",
        options: ["Duyệt trước (pre-order)", "Duyệt sau (post-order)", "Duyệt giữa (in-order)", "Duyệt theo tầng"],
        correctIndex: 2,
      },
      {
        id: "q4",
        prompt: "Cây AVL cần tái cân bằng khi hệ số cân bằng của một nút vượt quá:",
        options: ["0", "1", "2", "3"],
        correctIndex: 1,
      },
      {
        id: "q5",
        prompt: "Việc xây dựng heap từ một mảng chưa sắp xếp có độ phức tạp:",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(n^2)"],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "qz-2",
    courseId: "c-cs210",
    title: "Bài kiểm tra 3 — Chuẩn hóa",
    durationMinutes: 8,
    availableUntil: "2026-07-15T23:59:00",
    attempted: true,
    score: 80,
    questions: [
      {
        id: "q1",
        prompt: "Một quan hệ đạt dạng chuẩn 1 (1NF) khi:",
        options: ["Không có phụ thuộc bộ phận", "Mọi thuộc tính đều nguyên tử", "Không có phụ thuộc bắc cầu", "Có khóa ngoại"],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "Dạng chuẩn nào loại bỏ phụ thuộc bắc cầu?",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        correctIndex: 2,
      },
      {
        id: "q3",
        prompt: "Khóa chính phải:",
        options: ["Có thể rỗng", "Duy nhất và khác rỗng", "Là một cột đơn", "Là số nguyên"],
        correctIndex: 1,
      },
    ],
  },
]

export const courseGrades: CourseGrade[] = [
  {
    courseId: "c-cs201",
    items: [
      { name: "Kiểm tra 1", score: 18, max: 20, weight: 10 },
      { name: "Kiểm tra 2", score: 16, max: 20, weight: 10 },
      { name: "Giữa kỳ", score: 74, max: 100, weight: 30 },
      { name: "Bài tập 1", score: 92, max: 100, weight: 15 },
      { name: "Bài tập 2", score: 88, max: 100, weight: 15 },
    ],
  },
  {
    courseId: "c-cs210",
    items: [
      { name: "Kiểm tra 1", score: 15, max: 20, weight: 10 },
      { name: "Lab 1-3", score: 130, max: 150, weight: 25 },
      { name: "Giữa kỳ", score: 68, max: 100, weight: 30 },
    ],
  },
  {
    courseId: "c-ma140",
    items: [
      { name: "Bài tập lớn", score: 210, max: 240, weight: 30 },
      { name: "Giữa kỳ", score: 85, max: 100, weight: 30 },
      { name: "Điểm KT TB", score: 46, max: 50, weight: 20 },
    ],
  },
  {
    courseId: "c-en105",
    items: [
      { name: "Bài luận 1", score: 48, max: 60, weight: 25 },
      { name: "Tham gia", score: 18, max: 20, weight: 15 },
    ],
  },
]

export const attendanceSessions: AttendanceSession[] = [
  { id: "at-1", courseId: "c-cs201", date: "2026-07-06", topic: "Cây cân bằng", status: "present" },
  { id: "at-2", courseId: "c-cs201", date: "2026-07-01", topic: "Heap & hàng đợi ưu tiên", status: "present" },
  { id: "at-3", courseId: "c-cs201", date: "2026-06-29", topic: "Bảng băm", status: "late" },
  { id: "at-4", courseId: "c-cs201", date: "2026-06-24", topic: "Giới thiệu về cây", status: "absent" },
  { id: "at-5", courseId: "c-cs210", date: "2026-07-07", topic: "Chuẩn hóa", status: "present" },
  { id: "at-6", courseId: "c-cs210", date: "2026-07-02", topic: "Phép nối & truy vấn con", status: "present" },
  { id: "at-7", courseId: "c-ma140", date: "2026-07-06", topic: "Vector riêng", status: "present" },
  { id: "at-8", courseId: "c-ma140", date: "2026-07-01", topic: "Định thức", status: "excused" },
]

export const announcements: Announcement[] = [
  {
    id: "an-1",
    courseId: "c-cs201",
    title: "Bài kiểm tra 4 mở vào thứ Sáu",
    body: "Bài kiểm tra 4 về cây và heap sẽ mở từ thứ Sáu. Bạn có 10 phút kể từ khi bắt đầu. Hãy ôn lại chương 6 và 7.",
    author: "TS. Trần Văn Anh",
    date: "2026-07-11T09:00:00",
    pinned: true,
  },
  {
    id: "an-2",
    courseId: null,
    title: "Bảo trì hệ thống mạng cuối tuần này",
    body: "Cổng học tập có thể tạm thời không truy cập được vào Chủ nhật từ 02:00 đến 04:00 để bảo trì theo lịch.",
    author: "Phòng Đào tạo",
    date: "2026-07-10T15:30:00",
    pinned: true,
  },
  {
    id: "an-3",
    courseId: "c-cs210",
    title: "Nhắc hạn nộp bài Lab 4",
    body: "Vui lòng nộp bài Lab 4 trước 24:00 thứ Ba. Nộp muộn bị trừ 10% mỗi ngày.",
    author: "TS. Trần Văn Anh",
    date: "2026-07-09T13:10:00",
    pinned: false,
  },
  {
    id: "an-4",
    courseId: "c-ma140",
    title: "Giờ tư vấn bổ sung trước kỳ giữa kỳ",
    body: "Tôi sẽ có thêm giờ tư vấn vào thứ Năm 16:00–18:00 tại phòng A-112.",
    author: "PGS. Phạm Thu Hà",
    date: "2026-07-08T11:00:00",
    pinned: false,
  },
]

export function courseById(id: string) {
  return courses.find((c) => c.id === id)
}
