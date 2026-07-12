"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { useLms } from "@/lib/lms-store"
import { courseById } from "@/lib/mock-data"
import { formatDate } from "@/lib/format"
import type { AttendanceStatus } from "@/lib/mock-data"

const statusVariant: Record<AttendanceStatus, "success" | "destructive" | "warning" | "neutral"> = {
  present: "success",
  absent: "destructive",
  late: "warning",
  excused: "neutral",
}

export default function AttendancePage() {
  const { role, attendance, courses } = useLms()

  const total = attendance.length
  const present = attendance.filter((a) => a.status === "present").length
  const overall = Math.round((present / total) * 100)

  const byCourse = courses
    .map((c) => {
      const sessions = attendance.filter((a) => a.courseId === c.id)
      if (sessions.length === 0) return null
      const p = sessions.filter((s) => s.status === "present").length
      return {
        course: c,
        sessions,
        rate: Math.round((p / sessions.length) * 100),
      }
    })
    .filter(Boolean) as { course: (typeof courses)[number]; sessions: typeof attendance; rate: number }[]

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={
          role === "student"
            ? "Your attendance record across all courses this term."
            : "Attendance tracking for your course sections."
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="sm:col-span-1">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Overall</p>
            <p className="font-serif text-3xl font-semibold text-foreground">{overall}%</p>
            <Progress className="mt-2" value={overall} />
          </CardContent>
        </Card>
        {(["present", "late", "absent"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="p-5">
              <p className="text-sm capitalize text-muted-foreground">{s}</p>
              <p className="font-serif text-3xl font-semibold text-foreground">
                {attendance.filter((a) => a.status === s).length}
              </p>
              <p className="text-xs text-muted-foreground">sessions</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-5">
        {byCourse.map(({ course, sessions, rate }) => (
          <Card key={course.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ backgroundColor: course.color }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{course.code}</p>
                    <p className="text-xs text-muted-foreground">{course.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-28">
                    <Progress value={rate} />
                  </div>
                  <span className="font-serif text-lg font-semibold text-foreground">{rate}%</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground">{formatDate(s.date, { weekday: "short" })}</span>
                    <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
