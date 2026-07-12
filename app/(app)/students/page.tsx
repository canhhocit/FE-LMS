"use client"

import { useRef, useState } from "react"
import { CheckCircle2, Download, FileSpreadsheet, Search, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useLms } from "@/lib/lms-store"
import type { Student } from "@/lib/mock-data"
import { exportRowsToExcel, parseExcelFile } from "@/lib/excel"

function pick(row: Record<string, string>, keys: string[]) {
  const entries = Object.entries(row)
  for (const key of keys) {
    const found = entries.find(([k]) => k.trim().toLowerCase() === key.toLowerCase())
    if (found) return String(found[1]).trim()
  }
  return ""
}

export default function StudentsPage() {
  const { students, addStudents } = useLms()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()),
  )

  async function handleImport(file: File) {
    try {
      const rows = await parseExcelFile(file)
      const mapped: Omit<Student, "id">[] = rows.map((r) => ({
        studentCode: pick(r, ["studentCode", "student code", "code", "id"]),
        name: pick(r, ["name", "full name", "student name"]),
        email: pick(r, ["email", "e-mail", "mail"]),
        program: pick(r, ["program", "programme", "major"]) || "Undeclared",
        year: Number(pick(r, ["year", "level"])) || 1,
      }))
      const added = addStudents(mapped)
      setNotice(`Imported ${added} new student${added === 1 ? "" : "s"} from ${file.name}.`)
    } catch {
      setNotice("Could not read that file. Please upload a valid .xlsx or .csv file.")
    }
  }

  function handleExport() {
    exportRowsToExcel(
      students.map((s) => ({
        "Student Code": s.studentCode,
        Name: s.name,
        Email: s.email,
        Program: s.program,
        Year: s.year,
      })),
      "meridian-students.xlsx",
      "Students",
    )
  }

  function handleTemplate() {
    exportRowsToExcel(
      [{ studentCode: "2024-CS-200", name: "Jane Doe", email: "jane.doe@meridian.edu", program: "Computer Science", year: 1 }],
      "student-import-template.xlsx",
      "Template",
    )
  }

  return (
    <div>
      <PageHeader title="Students" description="Manage enrollment. Import from Excel or export the roster.">
        <Button variant="outline" onClick={handleTemplate}>
          <FileSpreadsheet className="size-4" /> Template
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" /> Export
        </Button>
        <Button onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" /> Import Excel
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
            e.target.value = ""
          }}
        />
      </PageHeader>

      {notice && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          {notice}
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              />
            </div>
            <Badge variant="neutral">{filtered.length} students</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Code</th>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Program</th>
                  <th className="px-3 py-2.5 font-medium">Year</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{s.studentCode}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{s.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.email}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.program}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">Year {s.year}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No students match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Import expects columns: studentCode, name, email, program, year. Download the template to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
