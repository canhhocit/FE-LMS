"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Menu,
  Timer,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLms } from "@/lib/lms-store"
import type { Role } from "@/lib/mock-data"
import { RoleSwitcher } from "@/components/role-switcher"

type NavItem = { href: string; label: string; icon: React.ElementType }

const navByRole: Record<Role, NavItem[]> = {
  student: [
    { href: "/", label: "Trang chủ", icon: LayoutDashboard },
    { href: "/courses", label: "Môn học của tôi", icon: BookOpen },
    { href: "/quizzes", label: "Bài kiểm tra", icon: Timer },
    { href: "/assignments", label: "Bài tập", icon: ClipboardList },
    { href: "/grades", label: "Điểm số", icon: GraduationCap },
    { href: "/attendance", label: "Điểm danh", icon: CalendarCheck },
    { href: "/announcements", label: "Thông báo", icon: Megaphone },
  ],
  lecturer: [
    { href: "/", label: "Trang chủ", icon: LayoutDashboard },
    { href: "/courses", label: "Môn học", icon: BookOpen },
    { href: "/quizzes", label: "Bài kiểm tra", icon: Timer },
    { href: "/assignments", label: "Bài tập", icon: ClipboardList },
    { href: "/grades", label: "Sổ điểm", icon: GraduationCap },
    { href: "/attendance", label: "Điểm danh", icon: CalendarCheck },
    { href: "/announcements", label: "Thông báo", icon: Megaphone },
  ],
  admin: [
    { href: "/", label: "Trang chủ", icon: LayoutDashboard },
    { href: "/courses", label: "Môn học", icon: BookOpen },
    { href: "/students", label: "Sinh viên", icon: Users },
    { href: "/grades", label: "Điểm số", icon: GraduationCap },
    { href: "/announcements", label: "Thông báo", icon: Megaphone },
  ],
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { role, user } = useLms()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = navByRole[role]

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-base font-semibold text-sidebar-foreground">Meridian</p>
            <p className="text-xs text-muted-foreground">University LMS</p>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.title}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-foreground">Fall 2026 Term</p>
            <p className="text-xs text-muted-foreground">Week 8 · Meridian University</p>
          </div>
          <div className="ml-auto">
            <RoleSwitcher />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
