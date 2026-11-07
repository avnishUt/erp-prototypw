"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Clock,
  UserCheck,
  Workflow,
  GraduationCap,
  HelpCircle,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  Menu,
  RotateCcw,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { INSTITUTE } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Avatar, cx } from "./ui";

const NAV: { href: string; label: string; icon: React.ElementType; roles: Role[] }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher", "student", "parent"] },
  { href: "/enquiries", label: "Admission Enquiries", icon: UserPlus, roles: ["admin"] },
  { href: "/students", label: "Students", icon: Users, roles: ["admin", "teacher"] },
  { href: "/attendance-flow", label: "Attendance Process", icon: Workflow, roles: ["admin", "teacher"] },
  { href: "/attendance", label: "Student Attendance", icon: ClipboardCheck, roles: ["admin", "teacher", "student", "parent"] },
  { href: "/staff-attendance", label: "Teacher Attendance", icon: UserCheck, roles: ["admin", "teacher"] },
  { href: "/timetable", label: "Timetable", icon: CalendarDays, roles: ["admin", "teacher", "student", "parent"] },
  { href: "/exams", label: "Exams & Results", icon: GraduationCap, roles: ["admin", "teacher", "student", "parent"] },
  { href: "/fees", label: "Fees", icon: IndianRupee, roles: ["admin", "parent", "student"] },
  { href: "/doubts", label: "Doubt Solving", icon: HelpCircle, roles: ["admin", "teacher", "student"] },
  { href: "/notices", label: "Notices", icon: Megaphone, roles: ["admin", "teacher", "student", "parent"] },
];

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  if (!store.ready) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate-400">Loading portal…</div>;
  }

  const nav = NAV.filter((n) => n.roles.includes(store.role));
  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  const allowed = nav.some((n) => isActive(n.href));
  const openDoubts = store.doubts.filter((d) => d.status === "Open").length;

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <BookOpen size={18} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">{INSTITUTE.name}</p>
          <p className="text-xs text-slate-500">Session {INSTITUTE.session}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((n) => {
          const active = isActive(n.href);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon size={17} />
              <span className="flex-1">{n.label}</span>
              {n.href === "/doubts" && openDoubts > 0 && store.role !== "student" && (
                <span className="rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">{openDoubts}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={() => confirm("Reset all demo data to the original sample?") && store.resetDemo()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
        >
          <RotateCcw size={14} /> Reset demo data
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="relative">{sidebar}</div>
          <div className="flex-1 bg-slate-900/40" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <button className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Viewing as</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => store.setRole(r.value)}
                  className={cx(
                    "rounded-md px-2.5 py-1 font-medium transition",
                    store.role === r.value ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <DemoClock />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-slate-900">{store.me.name}</p>
              <p className="text-xs text-slate-500">{store.me.subtitle}</p>
            </div>
            <Avatar name={store.me.name} size={36} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {allowed ? (
            children
          ) : (
            <div className="mx-auto mt-20 max-w-md text-center">
              <p className="text-lg font-semibold text-slate-800">Not available for this role</p>
              <p className="mt-1 text-sm text-slate-500">Switch role from the top bar, or go back to the dashboard.</p>
              <Link href="/" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
                Go to dashboard →
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const PRESETS: { hm: string; label: string }[] = [
  { hm: "07:40", label: "7:40 AM · teachers arrive" },
  { hm: "08:05", label: "8:05 AM · Period 1 roll call" },
  { hm: "10:15", label: "10:15 AM · mid-day" },
  { hm: "14:35", label: "2:35 PM · school over" },
];

function DemoClock() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [h, m] = s.now.split(":").map(Number);
  const label = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cx(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset",
          s.clockOffsetMin !== null ? "bg-amber-50 text-amber-800 ring-amber-300" : "bg-white text-slate-600 ring-slate-200",
        )}
        title="Demo clock"
      >
        <Clock size={14} /> {label}
        {s.clockOffsetMin !== null && <span className="hidden sm:inline">(demo)</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-slate-700">Demo clock</p>
          <div className="space-y-1">
            {PRESETS.map((p) => (
              <button
                key={p.hm}
                onClick={() => {
                  s.setClock(p.hm);
                  setOpen(false);
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
            <input
              type="time"
              className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
              defaultValue={s.now}
              onChange={(e) => e.target.value && s.setClock(e.target.value)}
            />
            <button
              onClick={() => {
                s.setClock(null);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
            >
              Real time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
