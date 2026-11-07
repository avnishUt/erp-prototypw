"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Check, ClipboardCheck, LayoutDashboard, LogIn, LogOut, MessageSquare, Smartphone, X } from "lucide-react";
import { fmtTime, POLICY } from "@/lib/time";
import { Card, PageHeader } from "@/components/ui";

const OLD = [
  "Teacher signs the staff register at the gate — time is written by hand, often filled in later.",
  "Class teacher calls out every name in Period 1 and ticks the paper register.",
  "Register goes to the office; absentee list is copied manually.",
  "Parents are informed only if someone calls — usually not the same day.",
  "Monthly totals and percentages are counted by hand at month-end.",
  "Principal has no live view of which classes or teachers are present.",
];
const NEW = [
  "Teacher checks in on the mobile app (GPS inside campus) — exact time is recorded.",
  "Class teacher does the Period-1 roll call on phone/tablet — one tap per student.",
  "Submit locks it for the whole day; office sees it instantly.",
  "Parents of absent students get SMS / WhatsApp within a minute.",
  "Register, percentages and below-75% alerts are calculated automatically.",
  "Live board shows every class and teacher status; working hours feed payroll.",
];

const FLOW: { time: string; icon: React.ElementType; title: string; who: string; detail: string; href: string }[] = [
  { time: "07:40", icon: LogIn, title: "Teacher check-in", who: "Every teacher", detail: `Check in on the app on arrival. After ${fmtTime(POLICY.reportBy)} + ${POLICY.graceMin} min grace it's marked Late.`, href: "/staff-attendance" },
  { time: "08:00", icon: ClipboardCheck, title: "Period 1 roll call", who: "Class teacher", detail: "Roll call one by one (Present / Absent / Leave) or quick list. Unmarked students block submission.", href: "/attendance" },
  { time: "08:10", icon: Check, title: "Submit — valid for the whole day", who: "Class teacher", detail: `Window ${fmtTime(POLICY.windowOpen)} – ${fmtTime(POLICY.windowClose)}. Later submissions are flagged. Corrections are logged.`, href: "/attendance" },
  { time: "08:11", icon: MessageSquare, title: "Parents alerted", who: "Automatic", detail: "SMS / WhatsApp to parents of absent students. Parents also see the status in their app.", href: "/attendance" },
  { time: "08:30", icon: LayoutDashboard, title: "Admin live board", who: "Principal / office", detail: "See which classes submitted, total present/absent, late teachers. Remind or mark on behalf.", href: "/attendance" },
  { time: "Periods 2–6", icon: BookOpen, title: "No repeat roll calls", who: "Subject teachers", detail: "Subject teachers see the day's absentees read-only — no time lost re-marking.", href: "/attendance" },
  { time: "14:30", icon: LogOut, title: "Teacher check-out", who: "Every teacher", detail: `Working time is calculated. Full day = ${POLICY.fullDayHours}h; under ${POLICY.halfDayBelowHours}h = half day.`, href: "/staff-attendance" },
  { time: "Month end", icon: Smartphone, title: "Reports ready", who: "Automatic", detail: "Student register (P/A/L grid), attendance %, teacher hours, late count and leaves.", href: "/staff-attendance" },
];

export default function AttendanceFlowPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Attendance Process" subtitle="How student and teacher attendance works today vs. with the portal." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Today — paper register">
          <ul className="space-y-3">
            {OLD.map((t) => (
              <li key={t} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-0.5 rounded-full bg-rose-100 p-1 text-rose-600">
                  <X size={12} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="With the portal">
          <ul className="space-y-3">
            {NEW.map((t) => (
              <li key={t} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                  <Check size={12} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">A school day, step by step</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {FLOW.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="relative">
              <Link href={f.href} className="block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                    <Icon size={18} />
                  </span>
                  <span className="font-mono text-xs text-slate-400">{f.time.includes(":") ? fmtTime(f.time) : f.time}</span>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Step {i + 1} · {f.who}
                </p>
                <p className="mt-1 font-semibold text-slate-900">{f.title}</p>
                <p className="mt-1 text-sm text-slate-600">{f.detail}</p>
              </Link>
              {i < FLOW.length - 1 && (
                <>
                  <ArrowRight size={16} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 lg:block" />
                  <ArrowDown size={16} className="mx-auto my-1 text-slate-300 md:hidden" />
                </>
              )}
            </div>
          );
        })}
      </div>

      <Card title="Rules" className="mt-8">
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-medium text-slate-800">One roll call a day</p>
            <p className="text-slate-500">Taken by the class teacher in Period 1 and valid for the whole day.</p>
          </div>
          <div>
            <p className="font-medium text-slate-800">Submission window</p>
            <p className="text-slate-500">
              {fmtTime(POLICY.windowOpen)} – {fmtTime(POLICY.windowClose)}. Late submissions are flagged on the admin board.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-800">Teacher timing</p>
            <p className="text-slate-500">
              Report by {fmtTime(POLICY.reportBy)} ({POLICY.graceMin} min grace). School ends {fmtTime(POLICY.schoolEnd)}.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-800">Working time</p>
            <p className="text-slate-500">
              Check-in to check-out. {POLICY.fullDayHours}h = full day; under {POLICY.halfDayBelowHours}h = half day.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
