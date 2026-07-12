"use client"

import Link from "next/link"
import { ArrowUpRight, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/page-header"
import { useLms } from "@/lib/lms-store"
import { classSections } from "@/lib/mock-data"

export default function CoursesPage() {
  const { role, courses } = useLms()

  return (
    <div>
      <PageHeader
        title={role === "student" ? "My Courses" : "Courses"}
        description={
          role === "admin"
            ? "All courses offered this term."
            : role === "lecturer"
              ? "Courses you are teaching this term."
              : "Courses you are enrolled in this term."
        }
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {courses.map((c) => {
          const section = classSections.find((s) => s.courseId === c.id)
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: c.color }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="neutral">{c.code}</Badge>
                    <h3 className="mt-2 font-serif text-lg font-semibold leading-tight text-foreground text-balance">
                      {c.title}
                    </h3>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{c.credits} cr</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{c.lecturerName}</span>
                  {section && (
                    <>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {section.schedule}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" /> {section.studentIds.length} students
                      </span>
                    </>
                  )}
                </div>

                {role === "student" && (
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Course progress</span>
                      <span>{c.progress}%</span>
                    </div>
                    <Progress value={c.progress} />
                  </div>
                )}

                <Link
                  href={`/courses/${c.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open course <ArrowUpRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
