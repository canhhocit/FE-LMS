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
    name: "Elena Marsh",
    email: "elena.marsh@meridian.edu",
    role: "student",
    title: "BSc Computer Science · Year 2",
  },
  lecturer: {
    id: "l-10",
    name: "Dr. Aris Thorne",
    email: "a.thorne@meridian.edu",
    role: "lecturer",
    title: "Department of Computing",
  },
  admin: {
    id: "a-1",
    name: "Nadia Okonkwo",
    email: "n.okonkwo@meridian.edu",
    role: "admin",
    title: "Training Department",
  },
}

export const courses: Course[] = [
  {
    id: "c-cs201",
    code: "CS 201",
    title: "Data Structures & Algorithms",
    description:
      "Core data structures, algorithm design, and complexity analysis with hands-on labs.",
    lecturerId: "l-10",
    lecturerName: "Dr. Aris Thorne",
    term: "Fall 2026",
    credits: 4,
    color: "oklch(0.52 0.19 258)",
    progress: 68,
  },
  {
    id: "c-cs210",
    code: "CS 210",
    title: "Database Systems",
    description:
      "Relational modeling, SQL, transactions, and the internals of modern database engines.",
    lecturerId: "l-10",
    lecturerName: "Dr. Aris Thorne",
    term: "Fall 2026",
    credits: 3,
    color: "oklch(0.65 0.15 230)",
    progress: 42,
  },
  {
    id: "c-ma140",
    code: "MA 140",
    title: "Linear Algebra",
    description:
      "Vectors, matrices, eigenvalues, and their applications across computing and engineering.",
    lecturerId: "l-22",
    lecturerName: "Prof. Ivy Chen",
    term: "Fall 2026",
    credits: 3,
    color: "oklch(0.62 0.16 152)",
    progress: 80,
  },
  {
    id: "c-en105",
    code: "EN 105",
    title: "Academic Writing",
    description:
      "Research, argumentation, and scholarly writing conventions for the sciences.",
    lecturerId: "l-31",
    lecturerName: "Dr. Owen Blake",
    term: "Fall 2026",
    credits: 2,
    color: "oklch(0.72 0.16 75)",
    progress: 55,
  },
]

export const classSections: ClassSection[] = [
  {
    id: "cl-1",
    courseId: "c-cs201",
    name: "CS 201 · Section A",
    schedule: "Mon & Wed · 09:00–10:30",
    room: "Hall B-204",
    studentIds: ["s-100", "s-101", "s-102", "s-103", "s-104"],
  },
  {
    id: "cl-2",
    courseId: "c-cs210",
    name: "CS 210 · Section A",
    schedule: "Tue & Thu · 11:00–12:30",
    room: "Lab C-110",
    studentIds: ["s-100", "s-101", "s-105"],
  },
]

export const students: Student[] = [
  { id: "s-100", studentCode: "2024-CS-100", name: "Elena Marsh", email: "elena.marsh@meridian.edu", program: "Computer Science", year: 2 },
  { id: "s-101", studentCode: "2024-CS-101", name: "Marcus Lee", email: "marcus.lee@meridian.edu", program: "Computer Science", year: 2 },
  { id: "s-102", studentCode: "2024-CS-102", name: "Priya Nair", email: "priya.nair@meridian.edu", program: "Computer Science", year: 2 },
  { id: "s-103", studentCode: "2024-CS-103", name: "Diego Alvarez", email: "diego.alvarez@meridian.edu", program: "Software Engineering", year: 2 },
  { id: "s-104", studentCode: "2024-CS-104", name: "Sofia Rossi", email: "sofia.rossi@meridian.edu", program: "Computer Science", year: 2 },
  { id: "s-105", studentCode: "2024-CS-105", name: "Kenji Watanabe", email: "kenji.watanabe@meridian.edu", program: "Data Science", year: 3 },
]

export const assignments: Assignment[] = [
  {
    id: "as-1",
    courseId: "c-cs201",
    title: "Assignment 3 — Balanced Trees",
    description: "Implement an AVL tree with insert, delete, and rotation operations. Submit source and a short report.",
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
    title: "Lab 4 — Query Optimization",
    description: "Analyze and rewrite five slow SQL queries. Include EXPLAIN plans before and after.",
    dueDate: "2026-07-14T23:59:00",
    points: 50,
    status: "submitted",
    grade: null,
    fileName: "lab4_queries.pdf",
    submittedAt: "2026-07-11T18:22:00",
  },
  {
    id: "as-3",
    courseId: "c-ma140",
    title: "Problem Set 6 — Eigenvalues",
    description: "Solve the eigenvalue and eigenvector problems from chapter 6.",
    dueDate: "2026-07-09T23:59:00",
    points: 40,
    status: "graded",
    grade: 36,
    fileName: "ps6_marsh.pdf",
    submittedAt: "2026-07-08T20:10:00",
  },
  {
    id: "as-4",
    courseId: "c-en105",
    title: "Draft — Literature Review",
    description: "First draft of your literature review (1500 words) with cited sources.",
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
    title: "Quiz 4 — Trees & Heaps",
    durationMinutes: 10,
    availableUntil: "2026-07-18T23:59:00",
    attempted: false,
    score: null,
    questions: [
      {
        id: "q1",
        prompt: "What is the worst-case time complexity of search in a balanced binary search tree?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "In a max-heap, where is the largest element located?",
        options: ["At a leaf", "At the root", "In the middle level", "It varies"],
        correctIndex: 1,
      },
      {
        id: "q3",
        prompt: "Which traversal of a binary search tree yields sorted order?",
        options: ["Pre-order", "Post-order", "In-order", "Level-order"],
        correctIndex: 2,
      },
      {
        id: "q4",
        prompt: "An AVL tree rebalances when the balance factor of a node exceeds:",
        options: ["0", "1", "2", "3"],
        correctIndex: 1,
      },
      {
        id: "q5",
        prompt: "Building a heap from an unsorted array takes:",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(n^2)"],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "qz-2",
    courseId: "c-cs210",
    title: "Quiz 3 — Normalization",
    durationMinutes: 8,
    availableUntil: "2026-07-15T23:59:00",
    attempted: true,
    score: 80,
    questions: [
      {
        id: "q1",
        prompt: "A relation is in 1NF when:",
        options: ["It has no partial dependencies", "All attributes are atomic", "It has no transitive dependencies", "It has a foreign key"],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "Which normal form removes transitive dependencies?",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        correctIndex: 2,
      },
      {
        id: "q3",
        prompt: "A primary key must be:",
        options: ["Nullable", "Unique and non-null", "A single column", "An integer"],
        correctIndex: 1,
      },
    ],
  },
]

export const courseGrades: CourseGrade[] = [
  {
    courseId: "c-cs201",
    items: [
      { name: "Quiz 1", score: 18, max: 20, weight: 10 },
      { name: "Quiz 2", score: 16, max: 20, weight: 10 },
      { name: "Midterm", score: 74, max: 100, weight: 30 },
      { name: "Assignment 1", score: 92, max: 100, weight: 15 },
      { name: "Assignment 2", score: 88, max: 100, weight: 15 },
    ],
  },
  {
    courseId: "c-cs210",
    items: [
      { name: "Quiz 1", score: 15, max: 20, weight: 10 },
      { name: "Lab 1-3", score: 130, max: 150, weight: 25 },
      { name: "Midterm", score: 68, max: 100, weight: 30 },
    ],
  },
  {
    courseId: "c-ma140",
    items: [
      { name: "Problem Sets", score: 210, max: 240, weight: 30 },
      { name: "Midterm", score: 85, max: 100, weight: 30 },
      { name: "Quiz avg", score: 46, max: 50, weight: 20 },
    ],
  },
  {
    courseId: "c-en105",
    items: [
      { name: "Essay 1", score: 48, max: 60, weight: 25 },
      { name: "Participation", score: 18, max: 20, weight: 15 },
    ],
  },
]

export const attendanceSessions: AttendanceSession[] = [
  { id: "at-1", courseId: "c-cs201", date: "2026-07-06", topic: "Balanced trees", status: "present" },
  { id: "at-2", courseId: "c-cs201", date: "2026-07-01", topic: "Heaps & priority queues", status: "present" },
  { id: "at-3", courseId: "c-cs201", date: "2026-06-29", topic: "Hash tables", status: "late" },
  { id: "at-4", courseId: "c-cs201", date: "2026-06-24", topic: "Trees intro", status: "absent" },
  { id: "at-5", courseId: "c-cs210", date: "2026-07-07", topic: "Normalization", status: "present" },
  { id: "at-6", courseId: "c-cs210", date: "2026-07-02", topic: "Joins & subqueries", status: "present" },
  { id: "at-7", courseId: "c-ma140", date: "2026-07-06", topic: "Eigenvectors", status: "present" },
  { id: "at-8", courseId: "c-ma140", date: "2026-07-01", topic: "Determinants", status: "excused" },
]

export const announcements: Announcement[] = [
  {
    id: "an-1",
    courseId: "c-cs201",
    title: "Quiz 4 opens Friday",
    body: "Quiz 4 on trees and heaps will be available from Friday. You will have 10 minutes once you begin. Review chapters 6 and 7.",
    author: "Dr. Aris Thorne",
    date: "2026-07-11T09:00:00",
    pinned: true,
  },
  {
    id: "an-2",
    courseId: null,
    title: "Campus network maintenance this weekend",
    body: "The learning portal may be briefly unavailable on Sunday between 02:00 and 04:00 for scheduled maintenance.",
    author: "Training Department",
    date: "2026-07-10T15:30:00",
    pinned: true,
  },
  {
    id: "an-3",
    courseId: "c-cs210",
    title: "Lab 4 deadline reminder",
    body: "Please submit Lab 4 before Tuesday midnight. Late submissions lose 10% per day.",
    author: "Dr. Aris Thorne",
    date: "2026-07-09T13:10:00",
    pinned: false,
  },
  {
    id: "an-4",
    courseId: "c-ma140",
    title: "Extra office hours before midterm",
    body: "I will hold additional office hours on Thursday 16:00–18:00 in room A-112.",
    author: "Prof. Ivy Chen",
    date: "2026-07-08T11:00:00",
    pinned: false,
  },
]

export function courseById(id: string) {
  return courses.find((c) => c.id === id)
}
