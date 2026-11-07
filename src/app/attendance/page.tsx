"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, CheckCircle2, ClipboardList, Lock, MessageSquare, Pencil, Printer, UserCheck } from "lucide-react";
import { classes, DAYS, SLOTS, teachers, timetable, TODAY } from "@/lib/seed";
import { attendancePct, fmtDate, useStore } from "@/lib/store";
import { fmtTime, POLICY, toMin } from "@/lib/time";
import type { AttendanceMark, Student } from "@/lib/types";
import { Avatar, Badge, Button, Card, cx, inputCls, PageHeader, Progress, Stat, Tabs } from "@/components/ui";

const MARKS: { v: AttendanceMark; label: string; on: string; key: string }[] = [
  { v: "P", label: "Present", on: "bg-emerald-600 text-white", key: "P" },
  { v: "A", label: "Absent", on: "bg-rose-600 text-white", key: "A" },
  { v: "L", label: "Leave", on: "bg-amber-500 text-white", key: "L" },
];

export default function AttendancePage() {
  const { role } = useStore();
  if (role === "admin") return <AdminAttendance />;
  if (role === "teacher") return <TeacherAttendance />;
  return <MyAttendance />;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

function AdminAttendance() {
  const [tab, setTab] = useState<"live" | "take" | "register">("live");
  const [cls, setCls] = useState(classes[0].id);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Student Attendance" subtitle="Taken once by the class teacher in Period 1 and valid for the whole day." />
      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "live", label: "Today – live status" },
            { value: "take", label: "Take / edit" },
            { value: "register", label: "Monthly register" },
          ]}
        />
      </div>
      {tab === "live" && (
        <LiveStatus
          onOpen={(id) => {
            setCls(id);
            setTab("take");
          }}
        />
      )}
      {tab === "take" && <RollCallFlow classId={cls} onClassChange={setCls} allowClassPick />}
      {tab === "register" && <MonthlyRegister />}
    </div>
  );
}

function LiveStatus({ onOpen }: { onOpen: (classId: string) => void }) {
  const s = useStore();
  const [reminded, setReminded] = useState<string[]>([]);
  const log = s.submissions[TODAY] ?? {};
  const today = s.attendance[TODAY] ?? {};
  const submitted = classes.filter((c) => log[c.id]);
  const active = s.students.filter((x) => x.status === "Active");
  const inSubmitted = active.filter((x) => log[x.classId]);
  const present = inSubmitted.filter((x) => today[x.id] === "P").length;
  const absent = inSubmitted.filter((x) => today[x.id] === "A").length;
  const pastClose = toMin(s.now) > toMin(POLICY.windowClose);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Classes submitted" value={`${submitted.length} / ${classes.length}`} hint={`Window ${fmtTime(POLICY.windowOpen)} – ${fmtTime(POLICY.windowClose)}`} tone="indigo" />
        <Stat label="Present (submitted classes)" value={present} hint={`of ${inSubmitted.length} students`} tone="emerald" />
        <Stat label="Absent today" value={absent} hint="Parents alerted by SMS" tone="rose" />
        <Stat label="Pending classes" value={classes.length - submitted.length} hint={pastClose ? "Window closed – follow up" : "Still within window"} tone="amber" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((c) => {
          const entry = log[c.id];
          const t = teachers.find((x) => x.id === c.classTeacherId)!;
          const roster = active.filter((x) => x.classId === c.id);
          const p = roster.filter((x) => today[x.id] === "P").length;
          const absentees = roster.filter((x) => today[x.id] === "A");
          const late = entry && toMin(entry.at) > toMin(POLICY.windowClose);
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    Class teacher: {t.name} · {c.room}
                  </p>
                </div>
                {entry ? <Badge color={late ? "amber" : "green"}>{late ? "Submitted late" : "Submitted"}</Badge> : <Badge color={pastClose ? "red" : "gray"}>{pastClose ? "Overdue" : "Pending"}</Badge>}
              </div>
              {entry ? (
                <>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="font-semibold text-emerald-700">{p} present</span>
                    <span className="font-semibold text-rose-600">{absentees.length} absent</span>
                    <span className="text-slate-500">
                      by {entry.by} at {fmtTime(entry.at)}
                    </span>
                  </div>
                  <Progress value={roster.length ? (p / roster.length) * 100 : 0} tone="emerald" />
                  {absentees.length > 0 && <p className="mt-2 text-xs text-slate-500">Absent: {absentees.map((a) => a.name).join(", ")}</p>}
                  <button onClick={() => onOpen(c.id)} className="mt-3 text-xs font-medium text-indigo-600 hover:underline">
                    View / correct →
                  </button>
                </>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="flex-1 text-sm text-slate-500">{roster.length} students waiting to be marked.</p>
                  <Button size="sm" variant="secondary" disabled={reminded.includes(c.id)} onClick={() => setReminded([...reminded, c.id])}>
                    <Bell size={14} /> {reminded.includes(c.id) ? "Reminder sent" : `Remind ${t.name.split(" ")[0]}`}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onOpen(c.id)}>
                    Mark on behalf
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Teacher                                                             */
/* ------------------------------------------------------------------ */

function TeacherAttendance() {
  const s = useStore();
  const myClass = classes.find((c) => c.classTeacherId === s.me.teacherId);
  const [tab, setTab] = useState<"take" | "today" | "register">(myClass ? "take" : "today");
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Student Attendance"
        subtitle={myClass ? `You are the class teacher of ${myClass.name}. Take the roll call in Period 1 — it counts for the whole day.` : "Attendance is taken by class teachers in Period 1."}
      />
      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            ...(myClass ? [{ value: "take" as const, label: `Period 1 roll call – ${myClass.name}` }] : []),
            { value: "today" as const, label: "Absentees in my periods" },
            { value: "register" as const, label: "Monthly register" },
          ]}
        />
      </div>
      {tab === "take" && myClass && <RollCallFlow classId={myClass.id} />}
      {tab === "today" && <MyPeriodsToday />}
      {tab === "register" && <MonthlyRegister defaultClass={myClass?.id} />}
    </div>
  );
}

/** Subject teachers don't re-mark — they see who's absent for the day in each class they teach. */
function MyPeriodsToday() {
  const s = useStore();
  const day = DAYS[(new Date().getDay() + 6) % 7] ?? "Mon";
  const periods = classes
    .flatMap((c) => timetable[c.id].filter((p) => p.day === day && p.teacherId === s.me.teacherId).map((p) => ({ ...p, c })))
    .sort((a, b) => a.slot - b.slot);
  const today = s.attendance[TODAY] ?? {};
  return (
    <Card title="Today's periods">
      <p className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
        No need to call the roll again in later periods — the Period-1 attendance is valid for the whole day. You only see who is absent.
      </p>
      <ul className="divide-y divide-slate-100">
        {periods.map((p) => {
          const done = s.submissions[TODAY]?.[p.c.id];
          const abs = s.students.filter((x) => x.classId === p.c.id && today[x.id] && today[x.id] !== "P");
          return (
            <li key={`${p.c.id}-${p.slot}`} className="flex flex-wrap items-start gap-3 py-3 text-sm">
              <span className="w-16 font-mono text-xs text-slate-500">{fmtTime(SLOTS[p.slot])}</span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  Period {p.slot + 1} · {p.subject} · {p.c.name}
                </p>
                {done ? (
                  <p className="text-xs text-slate-500">{abs.length ? `Absent / on leave: ${abs.map((a) => a.name).join(", ")}` : "Full attendance today 🎉"}</p>
                ) : (
                  <p className="text-xs text-amber-700">Class teacher has not submitted attendance yet.</p>
                )}
              </div>
              {done ? <Badge color="green">Attendance locked</Badge> : <Badge color="amber">Pending</Badge>}
            </li>
          );
        })}
        {periods.length === 0 && <p className="text-sm text-slate-500">No periods today.</p>}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* The roll-call flow                                                  */
/* ------------------------------------------------------------------ */

type Step = "checkin" | "mark" | "review" | "done";

function RollCallFlow({ classId, onClassChange, allowClassPick }: { classId: string; onClassChange?: (id: string) => void; allowClassPick?: boolean }) {
  const s = useStore();
  const isTeacher = s.role === "teacher";
  const [date, setDate] = useState(TODAY);
  const cls = classes.find((c) => c.id === classId)!;
  const roster = useMemo(() => s.students.filter((x) => x.classId === classId && x.status === "Active"), [s.students, classId]);
  const entry = s.submissions[date]?.[classId];
  const checkedIn = !!s.staffAttendance[TODAY]?.[s.me.teacherId ?? ""]?.in;

  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"rollcall" | "list">("rollcall");
  const [draft, setDraft] = useState<Record<string, AttendanceMark>>({});
  const [idx, setIdx] = useState(0);
  const [review, setReview] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    const existing = s.attendance[date] ?? {};
    setDraft(entry ? Object.fromEntries(roster.map((st) => [st.id, existing[st.id] ?? "P"])) : {});
    setIdx(0);
    setReview(false);
    setEditing(false);
    setJustSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  const step: Step = isTeacher && !checkedIn && date === TODAY && !entry ? "checkin" : entry && !editing ? "done" : review ? "review" : "mark";
  const marked = roster.filter((st) => draft[st.id]).length;

  const mark = (id: string, m: AttendanceMark) => {
    setDraft((d) => ({ ...d, [id]: m }));
    if (mode === "rollcall") {
      if (idx < roster.length - 1) setIdx(idx + 1);
      else setReview(true);
    }
  };

  // Keyboard shortcuts in roll-call mode: P / A / L, ← to go back.
  useEffect(() => {
    if (step !== "mark" || mode !== "rollcall") return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const k = e.key.toUpperCase();
      const st = roster[idx];
      if (!st) return;
      if (k === "P" || k === "A" || k === "L") mark(st.id, k as AttendanceMark);
      if (e.key === "ArrowLeft") setIdx(Math.max(0, idx - 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const submit = () => {
    s.submitAttendance(date, classId, draft, isTeacher ? s.me.name : `${s.me.name} (Admin)`, s.now);
    setEditing(false);
    setReview(false);
    setJustSubmitted(true);
  };

  const nowMin = toMin(s.now);
  const windowState =
    date !== TODAY ? null : nowMin < toMin(POLICY.windowOpen) ? "early" : nowMin <= toMin(POLICY.windowClose) ? "open" : "late";

  return (
    <div>
      <Stepper step={step} isTeacher={isTeacher} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <ClipboardList size={18} />
          </span>
          <div className="mr-auto">
            <p className="font-semibold text-slate-900">
              {cls.name} · Period 1 ({fmtTime(SLOTS[0])}) · {cls.room}
            </p>
            <p className="text-xs text-slate-500">
              {roster.length} students · Class teacher {teachers.find((t) => t.id === cls.classTeacherId)?.name} · Marks apply to the <b>whole day</b>
            </p>
          </div>
          {allowClassPick && (
            <select className={`${inputCls} !w-auto`} value={classId} onChange={(e) => onClassChange?.(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {!isTeacher && <input type="date" max={TODAY} className={`${inputCls} !w-auto`} value={date} onChange={(e) => setDate(e.target.value)} />}
          {windowState === "early" && <Badge color="gray">Opens {fmtTime(POLICY.windowOpen)}</Badge>}
          {windowState === "open" && <Badge color="green">Window open till {fmtTime(POLICY.windowClose)}</Badge>}
          {windowState === "late" && <Badge color="amber">After {fmtTime(POLICY.windowClose)} – will be flagged late</Badge>}
        </div>
      </Card>

      {step === "checkin" && (
        <Card>
          <div className="py-6 text-center">
            <UserCheck size={40} className="mx-auto text-indigo-500" />
            <p className="mt-3 text-lg font-semibold text-slate-900">Check in first</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Your own attendance is recorded before you take the class roll call. It&apos;s {fmtTime(s.now)} now — reporting time is {fmtTime(POLICY.reportBy)}.
            </p>
            <Button className="mt-4" onClick={() => s.checkIn(s.me.teacherId!, s.now)}>
              Check in now
            </Button>
            <p className="mt-2 text-xs text-slate-400">or go to Teacher Attendance for the full check-in screen</p>
          </div>
        </Card>
      )}

      {step === "mark" && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Tabs
              value={mode}
              onChange={setMode}
              options={[
                { value: "rollcall", label: "Roll call (one by one)" },
                { value: "list", label: "Quick list" },
              ]}
            />
            <span className="ml-auto text-sm text-slate-500">
              {marked} / {roster.length} marked
            </span>
          </div>
          <Progress value={(marked / Math.max(1, roster.length)) * 100} />

          {mode === "rollcall" && roster[idx] && (
            <RollCallCard
              st={roster[idx]}
              pos={idx}
              total={roster.length}
              current={draft[roster[idx].id]}
              onMark={(m) => mark(roster[idx].id, m)}
              onPrev={() => setIdx(Math.max(0, idx - 1))}
              onNext={() => (idx < roster.length - 1 ? setIdx(idx + 1) : setReview(true))}
            />
          )}

          {mode === "list" && (
            <>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...Object.fromEntries(roster.map((st) => [st.id, "P" as AttendanceMark])), ...d }))}>
                  Mark remaining present
                </Button>
              </div>
              <ul className="divide-y divide-slate-100">
                {roster.map((st) => (
                  <li key={st.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 text-right text-xs text-slate-400">{st.roll}</span>
                    <Avatar name={st.name} size={28} />
                    <span className="flex-1 text-sm font-medium text-slate-800">{st.name}</span>
                    <MarkButtons value={draft[st.id]} onChange={(m) => setDraft({ ...draft, [st.id]: m })} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
            <Button onClick={() => setReview(true)} disabled={marked === 0}>
              Review & submit <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === "review" && (
        <ReviewStep roster={roster} draft={draft} clsName={cls.name} date={date} onBack={() => setReview(false)} onSubmit={submit} onMark={(id, m) => setDraft({ ...draft, [id]: m })} />
      )}

      {step === "done" && entry && (
        <Card>
          <div className="flex flex-wrap items-start gap-4">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-slate-900">{justSubmitted ? "Attendance submitted" : "Attendance already submitted"}</p>
              <p className="text-sm text-slate-500">
                By {entry.by} at {fmtTime(entry.at)} on {fmtDate(date)}
                {toMin(entry.at) > toMin(POLICY.windowClose) && <span className="text-amber-600"> · submitted after the window</span>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge color="green">{roster.filter((x) => s.attendance[date]?.[x.id] === "P").length} present</Badge>
                <Badge color="red">{roster.filter((x) => s.attendance[date]?.[x.id] === "A").length} absent</Badge>
                <Badge color="amber">{roster.filter((x) => s.attendance[date]?.[x.id] === "L").length} on leave</Badge>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-indigo-500" /> SMS / WhatsApp sent to {entry.smsSent} parent{entry.smsSent === 1 ? "" : "s"} of absent students
                </li>
                <li className="flex items-center gap-2">
                  <Lock size={14} className="text-indigo-500" /> Locked for the day — subject teachers in Periods 2–6 see it read-only
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-indigo-500" /> Visible to parents in their app and on the admin live board
                </li>
              </ul>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditing(true);
                setMode("list");
                setJustSubmitted(false);
              }}
            >
              <Pencil size={14} /> Correct attendance
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step, isTeacher }: { step: Step; isTeacher: boolean }) {
  const steps: { key: Step; label: string }[] = [
    ...(isTeacher ? [{ key: "checkin" as Step, label: "Teacher check-in" }] : []),
    { key: "mark", label: "Roll call in Period 1" },
    { key: "review", label: "Review" },
    { key: "done", label: "Submit · parents alerted" },
  ];
  const cur = steps.findIndex((x) => x.key === step);
  return (
    <ol className="mb-4 flex flex-wrap gap-2">
      {steps.map((x, i) => (
        <li
          key={x.key}
          className={cx(
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
            i < cur || step === "done" ? "bg-emerald-50 text-emerald-700" : i === cur ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500",
          )}
        >
          <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[11px]", i === cur && step !== "done" ? "bg-white/20" : "bg-white")}>
            {i < cur || step === "done" ? "✓" : i + 1}
          </span>
          {x.label}
        </li>
      ))}
    </ol>
  );
}

function MarkButtons({ value, onChange, big }: { value?: AttendanceMark; onChange: (m: AttendanceMark) => void; big?: boolean }) {
  return (
    <div className={cx("flex", big ? "gap-3" : "gap-1")}>
      {MARKS.map((m) => (
        <button
          key={m.v}
          title={m.label}
          onClick={() => onChange(m.v)}
          className={cx(
            "rounded-lg font-semibold transition",
            big ? "min-w-28 px-5 py-4 text-base" : "h-8 w-8 text-xs",
            value === m.v ? m.on : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          {big ? (
            <>
              {m.label} <span className="ml-1 text-xs opacity-60">({m.key})</span>
            </>
          ) : (
            m.v
          )}
        </button>
      ))}
    </div>
  );
}

function RollCallCard({
  st,
  pos,
  total,
  current,
  onMark,
  onPrev,
  onNext,
}: {
  st: Student;
  pos: number;
  total: number;
  current?: AttendanceMark;
  onMark: (m: AttendanceMark) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col items-center py-4 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Student {pos + 1} of {total}
      </p>
      <div className="mt-4">
        <Avatar name={st.name} size={88} />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{st.name}</p>
      <p className="text-sm text-slate-500">Roll no. {st.roll}</p>
      <div className="mt-6">
        <MarkButtons value={current} onChange={onMark} big />
      </div>
      <div className="mt-6 flex gap-2">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={pos === 0}>
          <ArrowLeft size={14} /> Previous
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext}>
          Skip <ArrowRight size={14} />
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-400">Keyboard: P / A / L · ← previous</p>
    </div>
  );
}

function ReviewStep({
  roster,
  draft,
  clsName,
  date,
  onBack,
  onSubmit,
  onMark,
}: {
  roster: Student[];
  draft: Record<string, AttendanceMark>;
  clsName: string;
  date: string;
  onBack: () => void;
  onSubmit: () => void;
  onMark: (id: string, m: AttendanceMark) => void;
}) {
  const unmarked = roster.filter((x) => !draft[x.id]);
  const absent = roster.filter((x) => draft[x.id] === "A");
  const leave = roster.filter((x) => draft[x.id] === "L");
  const present = roster.filter((x) => draft[x.id] === "P").length;
  return (
    <Card title="Review before submitting">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-semibold text-emerald-700">{present}</p>
          <p className="text-xs text-emerald-800">Present</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-3 text-center">
          <p className="text-2xl font-semibold text-rose-700">{absent.length}</p>
          <p className="text-xs text-rose-800">Absent</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-2xl font-semibold text-amber-700">{leave.length}</p>
          <p className="text-xs text-amber-800">Leave</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-2xl font-semibold text-slate-700">{unmarked.length}</p>
          <p className="text-xs text-slate-600">Not marked</p>
        </div>
      </div>

      {unmarked.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-sm font-medium text-amber-800">Mark these students before submitting:</p>
          <ul className="space-y-2">
            {unmarked.map((st) => (
              <li key={st.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1">
                  {st.roll}. {st.name}
                </span>
                <MarkButtons value={draft[st.id]} onChange={(m) => onMark(st.id, m)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {absent.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">SMS / WhatsApp to parents of absent students ({absent.length})</p>
          <div className="space-y-2">
            {absent.map((st) => (
              <div key={st.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p className="mb-1 text-xs text-slate-500">
                  To {st.guardianName} · {st.phone}
                </p>
                Dear Parent, your ward <b>{st.name}</b> (Roll {st.roll}, {clsName}) is <b>absent</b> today, {fmtDate(date)}. If this is unexpected, please contact the school. – Vidya Bharati Public School
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={15} /> Back to marking
        </Button>
        <Button onClick={onSubmit} disabled={unmarked.length > 0}>
          Submit attendance for the day
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly register (digital version of the paper register)            */
/* ------------------------------------------------------------------ */

function MonthlyRegister({ defaultClass }: { defaultClass?: string }) {
  const s = useStore();
  const [cls, setCls] = useState(defaultClass ?? classes[0].id);
  const thisMonth = TODAY.slice(0, 7);
  const prev = (() => {
    const d = new Date(TODAY);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();
  const [month, setMonth] = useState(thisMonth);
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const days = Array.from({ length: lastDay }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`).filter((d) => d <= TODAY);
  const roster = s.students.filter((x) => x.classId === cls);
  const monthName = new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const workingDays = days.filter((d) => s.submissions[d]?.[cls]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={`${inputCls} !w-auto`} value={cls} onChange={(e) => setCls(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className={`${inputCls} !w-auto`} value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value={thisMonth}>{new Date(TODAY).toLocaleString("en-IN", { month: "long", year: "numeric" })}</option>
          <option value={prev}>{new Date(prev + "-01").toLocaleString("en-IN", { month: "long", year: "numeric" })}</option>
        </select>
        <span className="text-sm text-slate-500">{workingDays.length} working days recorded</span>
        <Button variant="secondary" size="sm" className="ml-auto" onClick={() => window.print()}>
          <Printer size={14} /> Print register
        </Button>
      </div>
      <p className="mb-3 text-sm font-medium text-slate-700">
        Attendance Register · {classes.find((c) => c.id === cls)?.name} · {monthName}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="sticky left-0 z-10 border border-slate-200 bg-slate-50 px-2 py-1.5 text-left font-medium">Roll · Name</th>
              {days.map((d) => {
                const sun = new Date(d).getDay() === 0;
                return (
                  <th key={d} className={cx("w-7 border border-slate-200 px-1 py-1.5 font-medium", sun && "bg-slate-100 text-slate-400")}>
                    {Number(d.slice(8))}
                  </th>
                );
              })}
              <th className="border border-slate-200 px-2 py-1.5 font-medium">P</th>
              <th className="border border-slate-200 px-2 py-1.5 font-medium">A</th>
              <th className="border border-slate-200 px-2 py-1.5 font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((st) => {
              let p = 0,
                a = 0,
                t = 0;
              return (
                <tr key={st.id}>
                  <td className="sticky left-0 z-10 whitespace-nowrap border border-slate-200 bg-white px-2 py-1 text-slate-700">
                    {st.roll}. {st.name}
                  </td>
                  {days.map((d) => {
                    const sun = new Date(d).getDay() === 0;
                    const mk = s.submissions[d]?.[cls] ? s.attendance[d]?.[st.id] : undefined;
                    if (mk) {
                      t++;
                      if (mk === "P") p++;
                      if (mk === "A") a++;
                    }
                    return (
                      <td
                        key={d}
                        className={cx(
                          "border border-slate-200 text-center font-semibold",
                          sun ? "bg-slate-100 text-slate-400" : mk === "P" ? "text-emerald-600" : mk === "A" ? "bg-rose-50 text-rose-600" : mk === "L" ? "bg-amber-50 text-amber-600" : "text-slate-300",
                        )}
                      >
                        {sun ? "S" : (mk ?? "·")}
                      </td>
                    );
                  })}
                  <td className="border border-slate-200 text-center font-medium text-emerald-700">{p}</td>
                  <td className="border border-slate-200 text-center font-medium text-rose-600">{a}</td>
                  <td className={cx("border border-slate-200 text-center font-medium", t && p / t < 0.75 ? "text-rose-600" : "text-slate-700")}>{t ? Math.round((p / t) * 100) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">P = Present · A = Absent · L = Leave · S = Sunday · Below 75% is highlighted in red.</p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Student / Parent                                                    */
/* ------------------------------------------------------------------ */

function MyAttendance() {
  const s = useStore();
  const st = s.students.find((x) => x.id === s.me.studentId)!;
  const days = Object.keys(s.attendance).sort().reverse();
  const recs = days.map((d) => ({ d, m: s.submissions[d]?.[st.classId] ? s.attendance[d][st.id] : undefined })).filter((r) => r.m) as { d: string; m: AttendanceMark }[];
  const pct = attendancePct(st.id, s.attendance);
  const c = { P: 0, A: 0, L: 0 };
  recs.forEach((r) => c[r.m]++);
  const todayEntry = s.submissions[TODAY]?.[st.classId];
  const todayMark = todayEntry ? s.attendance[TODAY]?.[st.id] : undefined;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Attendance" subtitle={`${st.name} · ${classes.find((x) => x.id === st.classId)?.name}`} />
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <span className={cx("rounded-xl p-3", todayMark === "P" ? "bg-emerald-50 text-emerald-600" : todayMark ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500")}>
            <CheckCircle2 size={26} />
          </span>
          <div>
            <p className="text-sm text-slate-500">Today, {fmtDate(TODAY)}</p>
            {todayEntry ? (
              <p className="text-lg font-semibold text-slate-900">
                {MARKS.find((m) => m.v === todayMark)?.label ?? "–"}{" "}
                <span className="text-sm font-normal text-slate-500">
                  · marked at {fmtTime(todayEntry.at)} by {todayEntry.by} (Period 1)
                </span>
              </p>
            ) : (
              <p className="text-lg font-semibold text-slate-900">Not marked yet</p>
            )}
          </div>
        </div>
      </Card>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Overall" value={`${pct}%`} tone={pct >= 85 ? "emerald" : "amber"} />
        <Stat label="Present" value={c.P} tone="emerald" />
        <Stat label="Absent" value={c.A} tone="rose" />
        <Stat label="Leave" value={c.L} tone="amber" />
      </div>
      <Card title="Day-wise record">
        <div className="mb-4">
          <Progress value={pct} tone={pct >= 85 ? "emerald" : "amber"} />
          <p className="mt-1 text-xs text-slate-500">Minimum required: 75%</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {recs.map((r) => (
            <div key={r.d} className={cx("rounded-lg px-3 py-2 text-sm", r.m === "P" ? "bg-emerald-50 text-emerald-800" : r.m === "A" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800")}>
              <p className="text-xs opacity-75">{fmtDate(r.d)}</p>
              <p className="font-medium">{MARKS.find((m) => m.v === r.m)?.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Questions about a mark? <Link href="/notices" className="text-indigo-600 hover:underline">Contact the class teacher</Link>.
        </p>
      </Card>
    </div>
  );
}
