"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { useLms } from "@/lib/lms-store"
import { courseById } from "@/lib/mock-data"
import { courseAverage, formatDate, relativeDue } from "@/lib/format"

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-serif text-2xl font-semibold leading-tight text-foreground">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { role, user, courses, courseGrades, assignments, quizzes, announcements, students } =
    useLms()

  const overallAvg = Math.round(
    courseGrades.reduce((s, g) => s + courseAverage(g), 0) / courseGrades.length,
  )
  const upcoming = assignments
    .filter((a) => a.status === "missing")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
  const openQuizzes = quizzes.filter((q) => !q.attempted)
  const pinned = announcements.filter((a) => a.pinned)

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={
          role === "student"
            ? "Here is what needs your attention this week."
            : role === "lecturer"
              ? "An overview of your courses and pending tasks."
              : "Training department overview for Fall 2026."
        }
      />

      {role === "student" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BookOpen} label="Enrolled courses" value={String(courses.length)} sub="12 credits this term" />
          <StatCard icon={TrendingUp} label="Overall average" value={`${overallAvg}%`} sub="Across all courses" />
          <StatCard icon={ClipboardList} label="Open assignments" value={String(upcoming.length)} sub="Awaiting submission" />
          <StatCard icon={Timer} label="Quizzes to take" value={String(openQuizzes.length)} sub="Available now" />
        </div>
      )}

      {role === "lecturer" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BookOpen} label="Courses teaching" value="2" sub="Fall 2026" />
          <StatCard icon={Users} label="Total students" value="8" sub="Across sections" />
          <StatCard icon={ClipboardList} label="To grade" value="1" sub="Submitted, ungraded" />
          <StatCard icon={Timer} label="Active quizzes" value={String(quizzes.length)} sub="Published" />
        </div>
      )}

      {role === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Students" value={String(students.length)} sub="Enrolled" />
          <StatCard icon={BookOpen} label="Courses" value={String(courses.length)} sub="Fall 2026" />
          <StatCard icon={GraduationCap} label="Lecturers" value="3" sub="Active faculty" />
          <StatCard icon={Megaphone} label="Announcements" value={String(announcements.length)} sub="Published" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {role !== "admin" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Upcoming deadlines</CardTitle>
                <Link href="/assignments" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View all <ArrowUpRight className="size-4" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcoming.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nothing due. You are all caught up.</p>
                )}
                {upcoming.map((a) => {
                  const course = courseById(a.courseId)
                  const overdue = relativeDue(a.dueDate).includes("overdue")
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <span
                        className="mt-0.5 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: course?.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course?.code} · {formatDate(a.dueDate)}
                        </p>
                      </div>
                      <Badge variant={overdue ? "destructive" : "warning"}>{relativeDue(a.dueDate)}</Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{role === "admin" ? "Course catalog" : "Course progress"}</CardTitle>
              <Link href="/courses" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.map((c) => (
                <div key={c.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-medium text-foreground">{c.code}</span>
                      <span className="hidden text-sm text-muted-foreground sm:inline">{c.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{c.progress}%</span>
                  </div>
                  <Progress value={c.progress} indicatorClassName="" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Announcements</CardTitle>
              <Megaphone className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {pinned.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {a.author} · {formatDate(a.date)}
                  </p>
                </div>
              ))}
              <Link href="/announcements" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                All announcements <ArrowUpRight className="size-4" />
              </Link>
            </CardContent>
          </Card>

          {role === "student" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Attendance</CardTitle>
                <CalendarCheck className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-serif text-3xl font-semibold text-foreground">92%</p>
                <p className="text-sm text-muted-foreground">Overall attendance this term</p>
                <Link href="/attendance" className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View record <ArrowUpRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
