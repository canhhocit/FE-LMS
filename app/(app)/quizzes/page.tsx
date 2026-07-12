"use client"

import Link from "next/link"
import { CheckCircle2, Timer } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useLms } from "@/lib/lms-store"
import { courseById } from "@/lib/mock-data"
import { formatDate } from "@/lib/format"

export default function QuizzesPage() {
  const { role, quizzes } = useLms()

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description={
          role === "student"
            ? "Timed quizzes. Once you start, the countdown begins and auto-submits at zero."
            : "Published quizzes for your courses."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {quizzes.map((q) => {
          const course = courseById(q.courseId)
          return (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral">{course?.code}</Badge>
                  {q.attempted ? (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3.5" /> {q.score}%
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Timer className="size-3.5" /> {q.durationMinutes} min
                    </Badge>
                  )}
                </div>
                <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">{q.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {q.questions.length} questions · closes {formatDate(q.availableUntil)}
                </p>
                <div className="mt-4">
                  {q.attempted ? (
                    <Button variant="outline" size="sm" disabled>
                      Completed
                    </Button>
                  ) : role === "student" ? (
                    <Button size="sm" render={<Link href={`/quizzes/${q.id}`} />}>
                      Start quiz
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" render={<Link href={`/quizzes/${q.id}`} />}>
                      Preview
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
