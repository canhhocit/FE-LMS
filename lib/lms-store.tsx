"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  announcements as seedAnnouncements,
  assignments as seedAssignments,
  attendanceSessions as seedAttendance,
  courseGrades,
  courses,
  currentUsers,
  quizzes as seedQuizzes,
  students as seedStudents,
  type Announcement,
  type Assignment,
  type Quiz,
  type Role,
  type Student,
} from "@/lib/mock-data"

type LmsContextValue = {
  role: Role
  setRole: (role: Role) => void
  user: (typeof currentUsers)[Role]
  courses: typeof courses
  courseGrades: typeof courseGrades
  attendance: typeof seedAttendance
  assignments: Assignment[]
  quizzes: Quiz[]
  announcements: Announcement[]
  students: Student[]
  submitAssignment: (id: string, fileName: string) => void
  submitQuiz: (id: string, score: number) => void
  addAnnouncement: (data: Pick<Announcement, "title" | "body" | "courseId">) => void
  addStudents: (rows: Omit<Student, "id">[]) => number
}

const LmsContext = createContext<LmsContextValue | null>(null)

export function LmsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("student")
  const [assignments, setAssignments] = useState<Assignment[]>(seedAssignments)
  const [quizzes, setQuizzes] = useState<Quiz[]>(seedQuizzes)
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements)
  const [students, setStudents] = useState<Student[]>(seedStudents)

  const value = useMemo<LmsContextValue>(
    () => ({
      role,
      setRole,
      user: currentUsers[role],
      courses,
      courseGrades,
      attendance: seedAttendance,
      assignments,
      quizzes,
      announcements,
      students,
      submitAssignment: (id, fileName) =>
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "submitted",
                  fileName,
                  submittedAt: new Date().toISOString(),
                }
              : a,
          ),
        ),
      submitQuiz: (id, score) =>
        setQuizzes((prev) =>
          prev.map((q) => (q.id === id ? { ...q, attempted: true, score } : q)),
        ),
      addAnnouncement: ({ title, body, courseId }) =>
        setAnnouncements((prev) => [
          {
            id: `an-${Date.now()}`,
            title,
            body,
            courseId,
            author: currentUsers[role].name,
            date: new Date().toISOString(),
            pinned: false,
          },
          ...prev,
        ]),
      addStudents: (rows) => {
        let added = 0
        setStudents((prev) => {
          const existingCodes = new Set(prev.map((s) => s.studentCode))
          const next = [...prev]
          for (const row of rows) {
            if (!row.studentCode || existingCodes.has(row.studentCode)) continue
            existingCodes.add(row.studentCode)
            next.push({ ...row, id: `s-${row.studentCode}` })
            added += 1
          }
          return next
        })
        return added
      },
    }),
    [role, assignments, quizzes, announcements, students],
  )

  return <LmsContext.Provider value={value}>{children}</LmsContext.Provider>
}

export function useLms() {
  const ctx = useContext(LmsContext)
  if (!ctx) throw new Error("useLms must be used within LmsProvider")
  return ctx
}
