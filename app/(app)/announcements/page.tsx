"use client"

import { useState } from "react"
import { Megaphone, Pin, Plus, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useLms } from "@/lib/lms-store"
import { courseById } from "@/lib/mock-data"
import { formatDateTime } from "@/lib/format"

export default function AnnouncementsPage() {
  const { role, announcements, courses, addAnnouncement } = useLms()
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [courseId, setCourseId] = useState<string>("")

  const canPost = role === "lecturer" || role === "admin"

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return +new Date(b.date) - +new Date(a.date)
  })

  function handlePost() {
    if (!title.trim() || !body.trim()) return
    addAnnouncement({ title, body, courseId: courseId || null })
    setTitle("")
    setBody("")
    setCourseId("")
    setComposing(false)
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description={
          canPost ? "Post updates to students in your courses." : "Updates from your lecturers and the training department."
        }
      >
        {canPost && (
          <Button onClick={() => setComposing((c) => !c)}>
            <Plus className="size-4" /> New announcement
          </Button>
        )}
      </PageHeader>

      {canPost && composing && (
        <Card className="mb-6">
          <CardContent className="space-y-3 p-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">All students (general)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
              <Button className="ml-auto" onClick={handlePost} disabled={!title.trim() || !body.trim()}>
                <Send className="size-4" /> Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sorted.map((a) => {
          const course = a.courseId ? courseById(a.courseId) : null
          return (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Megaphone className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-base font-semibold text-foreground">{a.title}</h3>
                      {a.pinned && (
                        <Badge variant="warning">
                          <Pin className="size-3" /> Pinned
                        </Badge>
                      )}
                      <Badge variant="neutral">{course ? course.code : "General"}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{a.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {a.author} · {formatDateTime(a.date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
