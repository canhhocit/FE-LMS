"use client"

import { Download, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { useLms } from "@/lib/lms-store"
import { courseById } from "@/lib/mock-data"
import { courseAverage, letterGrade } from "@/lib/format"
import { exportRowsToExcel } from "@/lib/excel"

export default function GradesPage() {
  const { role, courseGrades } = useLms()

  const gpa = (
    courseGrades.reduce((s, g) => {
      const pct = courseAverage(g)
      return s + (pct >= 90 ? 4 : pct >= 80 ? 3 : pct >= 70 ? 2 : pct >= 60 ? 1 : 0)
    }, 0) / courseGrades.length
  ).toFixed(2)

  function handleExport() {
    const rows = courseGrades.flatMap((g) => {
      const course = courseById(g.courseId)
      return g.items.map((i) => ({
        Course: course?.code ?? "",
        Title: course?.title ?? "",
        Item: i.name,
        Score: i.score,
        Max: i.max,
        Percent: Math.round((i.score / i.max) * 100),
        Weight: i.weight,
      }))
    })
    courseGrades.forEach((g) => {
      const course = courseById(g.courseId)
      rows.push({
        Course: course?.code ?? "",
        Title: course?.title ?? "",
        Item: "WEIGHTED AVERAGE",
        Score: courseAverage(g),
        Max: 100,
        Percent: courseAverage(g),
        Weight: 100,
      })
    })
    exportRowsToExcel(rows, "meridian-grades-fall-2026.xlsx", "Grades")
  }

  return (
    <div>
      <PageHeader
        title={role === "admin" ? "Grade Records" : "Grades"}
        description={
          role === "admin"
            ? "Consolidated grade records. Export the full report to Excel."
            : "Your weighted grades across all courses this term."
        }
      >
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" /> Export to Excel
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Term GPA</p>
              <p className="font-serif text-2xl font-semibold text-foreground">{gpa}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Courses</p>
            <p className="font-serif text-2xl font-semibold text-foreground">{courseGrades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Credits in progress</p>
            <p className="font-serif text-2xl font-semibold text-foreground">12</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        {courseGrades.map((g) => {
          const course = courseById(g.courseId)
          const avg = courseAverage(g)
          return (
            <Card key={g.courseId}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ backgroundColor: course?.color }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{course?.code}</p>
                      <p className="text-xs text-muted-foreground">{course?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress value={avg} />
                    </div>
                    <span className="w-12 text-right font-serif text-lg font-semibold text-foreground">{avg}%</span>
                    <Badge variant={avg >= 80 ? "success" : avg >= 70 ? "warning" : "destructive"}>
                      {letterGrade(avg)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Item</th>
                        <th className="py-2 pr-4 font-medium">Weight</th>
                        <th className="py-2 pr-4 font-medium">Score</th>
                        <th className="py-2 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((i) => (
                        <tr key={i.name} className="border-b border-border last:border-0">
                          <td className="py-2 pr-4 font-medium text-foreground">{i.name}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{i.weight}%</td>
                          <td className="py-2 pr-4 text-muted-foreground">{i.score}/{i.max}</td>
                          <td className="py-2 text-foreground">{Math.round((i.score / i.max) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
