"use client"

import { useRef, useState } from "react"
import { CheckCircle2, FileText, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import { useLms } from "@/lib/lms-store"
import { courseById } from "@/lib/mock-data"
import { formatDate, formatDateTime, relativeDue } from "@/lib/format"
import type { Assignment } from "@/lib/mock-data"

const filters = ["All", "To do", "Submitted", "Graded"] as const

function SubmitPanel({ assignment }: { assignment: Assignment }) {
  const { submitAssignment } = useLms()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" /> Choose file
        </Button>
        <span className="text-sm text-muted-foreground">
          {fileName ?? "No file selected"}
        </span>
        <Button
          size="sm"
          className="ml-auto"
          disabled={!fileName}
          onClick={() => fileName && submitAssignment(assignment.id, fileName)}
        >
          Submit assignment
        </Button>
      </div>
    </div>
  )
}

export default function AssignmentsPage() {
  const { role, assignments } = useLms()
  const [filter, setFilter] = useState<(typeof filters)[number]>("All")

  const filtered = assignments.filter((a) => {
    if (filter === "All") return true
    if (filter === "To do") return a.status === "missing"
    if (filter === "Submitted") return a.status === "submitted"
    if (filter === "Graded") return a.status === "graded"
    return true
  })

  return (
    <div>
      <PageHeader
        title="Assignments"
        description={
          role === "student"
            ? "Submit your work and track feedback across all courses."
            : "Assignments across your courses and their submission status."
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((a) => {
          const course = courseById(a.courseId)
          return (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{course?.code}</Badge>
                        <span className="text-xs text-muted-foreground">{a.points} points</span>
                      </div>
                      <h3 className="mt-1.5 font-serif text-base font-semibold text-foreground">{a.title}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{a.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {a.status === "graded" && (
                      <Badge variant="success">
                        <CheckCircle2 className="size-3.5" /> {a.grade}/{a.points}
                      </Badge>
                    )}
                    {a.status === "submitted" && <Badge variant="default">Submitted</Badge>}
                    {a.status === "missing" && (
                      <Badge variant={relativeDue(a.dueDate).includes("overdue") ? "destructive" : "warning"}>
                        {relativeDue(a.dueDate)}
                      </Badge>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">Due {formatDate(a.dueDate)}</p>
                  </div>
                </div>

                {a.status !== "missing" && a.fileName && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{a.fileName}</span>
                    {a.submittedAt && (
                      <span className="text-xs text-muted-foreground">· submitted {formatDateTime(a.submittedAt)}</span>
                    )}
                  </div>
                )}

                {role === "student" && a.status === "missing" && <SubmitPanel assignment={a} />}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
