"use client"

import { GraduationCap, Shield, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLms } from "@/lib/lms-store"
import type { Role } from "@/lib/mock-data"

const roles: { value: Role; label: string; icon: React.ElementType }[] = [
  { value: "student", label: "Student", icon: UserRound },
  { value: "lecturer", label: "Lecturer", icon: GraduationCap },
  { value: "admin", label: "Admin", icon: Shield },
]

export function RoleSwitcher() {
  const { role, setRole } = useLms()
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1">
      {roles.map((r) => {
        const Icon = r.icon
        const active = r.value === role
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              active
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}
