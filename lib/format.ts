import type { CourseGrade } from "@/lib/mock-data"

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    ...opts,
  })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function relativeDue(iso: string) {
  const now = new Date("2026-07-12T10:00:00").getTime()
  const diff = new Date(iso).getTime() - now
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`
  if (days === 0) return "Hạn hôm nay"
  if (days === 1) return "Hạn ngày mai"
  return `Còn ${days} ngày`
}

export function courseAverage(grade: CourseGrade) {
  if (grade.items.length === 0) return 0
  const totalWeight = grade.items.reduce((s, i) => s + i.weight, 0)
  const weighted = grade.items.reduce(
    (s, i) => s + (i.score / i.max) * i.weight,
    0,
  )
  return Math.round((weighted / totalWeight) * 100)
}

export function letterGrade(pct: number) {
  if (pct >= 93) return "A"
  if (pct >= 90) return "A-"
  if (pct >= 87) return "B+"
  if (pct >= 83) return "B"
  if (pct >= 80) return "B-"
  if (pct >= 77) return "C+"
  if (pct >= 73) return "C"
  if (pct >= 70) return "C-"
  if (pct >= 60) return "D"
  return "F"
}
