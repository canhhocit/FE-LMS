"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Clock, FileText, MapPin, Timer, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useLms } from "@/lib/lms-store"
import { classSections } from "@/lib/mock-data"
import { courseAverage, formatDate, formatDateTime, letterGrade, relativeDue } from "@/lib/format"

const tabs = ["Overview", "Assignments", "Quizzes", "Attendance", "Grades"] as const
type Tab = (typeof tabs)[number]

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>("Overview")
  const { courses, assignments, quizzes, attendance, courseGrades, announcements } = useLms()

  const course = courses.find((c) => c.id === params.id)
  if (!course) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Link href="/courses" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Back to courses
        </Link>
      </div>
    )
  }

  const section = classSections.find((s) => s.courseId === course.id)
  const courseAssignments = assignments.filter((a) => a.courseId === course.id)
  const courseQuizzes = quizzes.filter((q) => q.courseId === course.id)
  const courseAttendance = attendance.filter((a) => a.courseId === course.id)
  const grade = courseGrades.find((g) => g.courseId === course.id)
  const courseAnnouncements = announcements.filter((a) => a.courseId === course.id)

  return (
    <div>
      <Link
        href="/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All courses
      </Link>

      <div className="rounded-xl border border-border bg-card p-6" style={{ borderTopColor: course.color, borderTopWidth: 3 }}>
        <Badge variant="neutral">{course.code}</Badge>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground text-balance">
          {course.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground text-pretty">{course.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="size-4" /> {course.lecturerName}</span>
          {section && (
            <>
              <span className="flex items-center gap-1.5"><Clock className="size-4" /> {section.schedule}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {section.room}</span>
            </>
          )}
          <span>{course.credits} credits</span>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-serif font-semibold text-foreground">Course progress</h3>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                      <span>Completed</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-serif font-semibold text-foreground">Recent announcements</h3>
                  <div className="mt-3 space-y-3">
                    {courseAnnouncements.length === 0 && (
                      <p className="text-sm text-muted-foreground">No announcements yet.</p>
                    )}
                    {courseAnnouncements.map((a) => (
                      <div key={a.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.date)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Current grade</p>
                  <p className="font-serif text-3xl font-semibold text-foreground">
                    {grade ? `${courseAverage(grade)}%` : "—"}{" "}
                    {grade && <span className="text-lg text-primary">{letterGrade(courseAverage(grade))}</span>}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-serif text-xl font-semibold text-foreground">{courseAssignments.length}</p>
                    <p className="text-xs text-muted-foreground">Assignments</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-serif text-xl font-semibold text-foreground">{courseQuizzes.length}</p>
                    <p className="text-xs text-muted-foreground">Quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "Assignments" && (
          <div className="space-y-3">
            {courseAssignments.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.points} pts · {formatDate(a.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status === "graded" && <Badge variant="success">Graded · {a.grade}/{a.points}</Badge>}
                    {a.status === "submitted" && <Badge variant="default">Submitted</Badge>}
                    {a.status === "missing" && <Badge variant="warning">{relativeDue(a.dueDate)}</Badge>}
                    <Link href="/assignments" className="text-sm font-medium text-primary hover:underline">Open</Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "Quizzes" && (
          <div className="space-y-3">
            {courseQuizzes.length === 0 && <p className="text-sm text-muted-foreground">No quizzes for this course.</p>}
            {courseQuizzes.map((q) => (
              <Card key={q.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <Timer className="mt-0.5 size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.questions.length} questions · {q.durationMinutes} min · closes {formatDate(q.availableUntil)}
                      </p>
                    </div>
                  </div>
                  {q.attempted ? (
                    <Badge variant="success">Scored {q.score}%</Badge>
                  ) : (
                    <Link href={`/quizzes/${q.id}`} className="text-sm font-medium text-primary hover:underline">Start quiz</Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "Attendance" && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Session</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courseAttendance.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(s.date, { weekday: "short" })}</td>
                      <td className="px-4 py-3 text-foreground">{s.topic}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            s.status === "present" ? "success" : s.status === "absent" ? "destructive" : s.status === "late" ? "warning" : "neutral"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {tab === "Grades" && grade && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Weight</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {grade.items.map((i) => (
                    <tr key={i.name} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{i.weight}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{i.score}/{i.max}</td>
                      <td className="px-4 py-3 text-foreground">{Math.round((i.score / i.max) * 100)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40">
                    <td className="px-4 py-3 font-semibold text-foreground" colSpan={3}>Weighted average</td>
                    <td className="px-4 py-3 font-semibold text-primary">{courseAverage(grade)}%</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
