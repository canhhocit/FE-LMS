"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, ArrowLeft, CheckCircle2, Timer, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useLms } from "@/lib/lms-store"
import { courseById } from "@/lib/mock-data"

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function QuizPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { quizzes, submitQuiz } = useLms()
  const quiz = quizzes.find((q) => q.id === params.id)

  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const submittedRef = useRef(false)

  const finish = useCallback(() => {
    if (submittedRef.current || !quiz) return
    submittedRef.current = true
    const correct = quiz.questions.filter((q) => answers[q.id] === q.correctIndex).length
    const score = Math.round((correct / quiz.questions.length) * 100)
    submitQuiz(quiz.id, score)
    setResult(score)
  }, [answers, quiz, submitQuiz])

  useEffect(() => {
    if (!started || result !== null) return
    if (secondsLeft <= 0) {
      finish()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [started, secondsLeft, result, finish])

  if (!quiz) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Quiz not found.</p>
        <Link href="/quizzes" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Back to quizzes
        </Link>
      </div>
    )
  }

  const course = courseById(quiz.courseId)

  if (result !== null) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
              <CheckCircle2 className="size-7" />
            </div>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">Quiz submitted</h1>
            <p className="mt-1 text-sm text-muted-foreground">{quiz.title}</p>
            <p className="mt-6 font-serif text-5xl font-semibold text-primary">{result}%</p>
            <p className="text-sm text-muted-foreground">
              {quiz.questions.filter((q) => answers[q.id] === q.correctIndex).length} of{" "}
              {quiz.questions.length} correct
            </p>

            <div className="mt-6 space-y-2 text-left">
              {quiz.questions.map((q, i) => {
                const correct = answers[q.id] === q.correctIndex
                return (
                  <div key={q.id} className="flex items-start gap-2 rounded-lg border border-border p-3">
                    {correct ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {i + 1}. {q.prompt}
                      </p>
                      {!correct && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Correct answer: {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <Button className="mt-6" render={<Link href="/quizzes" />}>
              Back to quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/quizzes"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Quizzes
        </Link>
        <Card>
          <CardContent className="p-8">
            <Badge variant="neutral">{course?.code}</Badge>
            <h1 className="mt-3 font-serif text-2xl font-semibold text-foreground">{quiz.title}</h1>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="font-serif text-2xl font-semibold text-foreground">{quiz.questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-serif text-2xl font-semibold text-foreground">{quiz.durationMinutes} min</p>
                <p className="text-xs text-muted-foreground">Time limit</p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <p>
                Once you begin, a {quiz.durationMinutes}-minute countdown starts. The quiz auto-submits
                when time runs out. Do not refresh the page.
              </p>
            </div>
            <Button
              className="mt-6"
              onClick={() => {
                setSecondsLeft(quiz.durationMinutes * 60)
                setStarted(true)
              }}
            >
              Begin quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = quiz.questions[current]
  const answeredCount = Object.keys(answers).length
  const lowTime = secondsLeft <= 30

  return (
    <div className="mx-auto max-w-2xl">
      <div
        className={cn(
          "sticky top-16 z-10 mb-4 flex items-center justify-between rounded-xl border px-4 py-3",
          lowTime ? "border-destructive/40 bg-destructive/10" : "border-border bg-card",
        )}
      >
        <div>
          <p className="text-sm font-medium text-foreground">{quiz.title}</p>
          <p className="text-xs text-muted-foreground">
            Question {current + 1} of {quiz.questions.length} · {answeredCount} answered
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-semibold tabular-nums",
            lowTime ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary",
          )}
          aria-live="polite"
        >
          <Timer className="size-4" />
          {formatClock(secondsLeft)}
        </div>
      </div>

      <Progress value={((current + 1) / quiz.questions.length) * 100} className="mb-4" />

      <Card>
        <CardContent className="p-6">
          <p className="font-serif text-lg font-medium text-foreground text-pretty">{question.prompt}</p>
          <div className="mt-4 space-y-2">
            {question.options.map((opt, i) => {
              const selected = answers[question.id] === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: i }))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          Previous
        </Button>
        {current < quiz.questions.length - 1 ? (
          <Button onClick={() => setCurrent((c) => Math.min(quiz.questions.length - 1, c + 1))}>
            Next
          </Button>
        ) : (
          <Button onClick={finish}>Submit quiz</Button>
        )}
      </div>
    </div>
  )
}
