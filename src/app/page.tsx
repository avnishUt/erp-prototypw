"use client";

import Link from "next/link";
import { ClipboardCheck, GraduationCap, HelpCircle, IndianRupee, LogIn, Megaphone, UserCheck, UserPlus, Users } from "lucide-react";
import { fmtTime, staffStatus } from "@/lib/time";
import { Button } from "@/components/ui";
import { classes, DAYS, exams, INSTITUTE, SLOTS, teachers, timetable, TODAY } from "@/lib/seed";
import { attendancePct, feeSummary, fmtDate, inr, useStore } from "@/lib/store";
import { Badge, Card, PageHeader, Progress, Stat } from "@/components/ui";

const todayName = DAYS[(new Date().getDay() + 6) % 7] ?? "Mon"; // Sunday -> show Monday-ish fallback

export default function Dashboard() {
  const { role } = useStore();
  if (role === "admin") return <AdminDash />;
  if (role === "teacher") return <TeacherDash />;
  return <LearnerDash />;
}

function AdminDash() {
  const s = useStore();
  const active = s.students.filter((x) => x.status === "Active");
  const day = s.attendance[TODAY] ?? {};
  const present = Object.values(day).filter((m) => m === "P").length;
  const submittedCls = Object.keys(s.submissions[TODAY] ?? {}).length;
  const staffIn = teachers.filter((t) => ["Present", "Late"].includes(staffStatus(s.staffAttendance[TODAY]?.[t.id], true))).length;
  const fees = active.map((st) => feeSummary(st, s.payments));
  const collected = fees.reduce((a, f) => a + f.paid, 0);
  const due = fees.reduce((a, f) => a + f.due, 0);
  const openEnq = s.enquiries.filter((e) => !["Converted", "Lost"].includes(e.status));
  const followToday = s.enquiries.filter((e) => e.followUp <= TODAY && !["Converted", "Lost"].includes(e.status));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`Good day, ${s.me.name.split(" ")[0]}`} subtitle={`${INSTITUTE.name} · ${INSTITUTE.tagline} · ${INSTITUTE.city}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active students" value={active.length} hint={`${classes.length} sections`} icon={<Users size={18} />} />
        <Link href="/attendance">
          <Stat
            label="Student attendance today"
            value={`${Object.keys(day).length ? Math.round((present / Object.keys(day).length) * 100) : 0}%`}
            hint={`${submittedCls}/${classes.length} classes submitted · ${staffIn}/${teachers.length} teachers in`}
            icon={<ClipboardCheck size={18} />}
            tone="emerald"
          />
        </Link>
        <Stat label="Fees collected" value={inr(collected)} hint={`${inr(due)} outstanding`} icon={<IndianRupee size={18} />} tone="sky" />
        <Stat label="Open enquiries" value={openEnq.length} hint={`${followToday.length} follow-ups due`} icon={<UserPlus size={18} />} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Class-wise overview" className="lg:col-span-2">
          <div className="space-y-4">
            {classes.map((c) => {
              const st = active.filter((x) => x.classId === c.id);
              const att = st.length ? Math.round(st.reduce((a, x) => a + attendancePct(x.id, s.attendance), 0) / st.length) : 0;
              const f = st.map((x) => feeSummary(x, s.payments));
              const tot = f.reduce((a, x) => a + x.total, 0);
              const paid = f.reduce((a, x) => a + x.paid, 0);
              return (
                <div key={c.id} className="grid grid-cols-12 items-center gap-3 text-sm">
                  <div className="col-span-12 sm:col-span-4">
                    <p className="font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {st.length} students · Class teacher {teachers.find((t) => t.id === c.classTeacherId)?.name}
                    </p>
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <p className="mb-1 text-xs text-slate-500">Attendance {att}%</p>
                    <Progress value={att} tone={att >= 85 ? "emerald" : "amber"} />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                    <p className="mb-1 text-xs text-slate-500">Fees {tot ? Math.round((paid / tot) * 100) : 0}% collected</p>
                    <Progress value={tot ? (paid / tot) * 100 : 0} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Follow-ups due" action={<Link href="/enquiries" className="text-xs font-medium text-indigo-600">View all →</Link>}>
          {followToday.length === 0 ? (
            <p className="text-sm text-slate-500">No follow-ups due today.</p>
          ) : (
            <ul className="space-y-3">
              {followToday.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium text-slate-800">{e.name}</p>
                  <p className="text-xs text-slate-500">
                    {e.course} · {e.phone}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Doubt solving" action={<Link href="/doubts" className="text-xs font-medium text-indigo-600">Open →</Link>}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(["Open", "Answered", "Resolved"] as const).map((st) => (
              <div key={st} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xl font-semibold text-slate-900">{s.doubts.filter((d) => d.status === st).length}</p>
                <p className="text-xs text-slate-500">{st}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top fee defaulters" className="lg:col-span-2" action={<Link href="/fees" className="text-xs font-medium text-indigo-600">All fees →</Link>}>
          <ul className="divide-y divide-slate-100 text-sm">
            {active
              .map((st) => ({ st, ...feeSummary(st, s.payments) }))
              .sort((a, b) => b.due - a.due)
              .slice(0, 5)
              .map(({ st, due }) => (
                <li key={st.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium text-slate-800">{st.name}</span>{" "}
                    <span className="text-xs text-slate-500">{classes.find((c) => c.id === st.classId)?.name}</span>
                  </span>
                  <span className="font-medium text-rose-600">{inr(due)}</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
      <RecentNotices />
    </div>
  );
}

function TeacherDash() {
  const s = useStore();
  const tid = s.me.teacherId!;
  const today = Object.values(timetable)
    .flatMap((periods, i) => periods.filter((p) => p.day === todayName && p.teacherId === tid).map((p) => ({ ...p, cls: classes[i] })))
    .sort((a, b) => a.slot - b.slot);
  const myDoubts = s.doubts.filter((d) => d.assignedTeacherId === tid && d.status === "Open");
  const myClass = classes.find((c) => c.classTeacherId === tid);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`Good day, ${s.me.name.split(" ")[0]}`} subtitle={s.me.subtitle} />
      <CheckInBanner />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={`Classes on ${todayName}`} value={today.length} icon={<GraduationCap size={18} />} />
        <Stat label="Doubts waiting for you" value={myDoubts.length} icon={<HelpCircle size={18} />} tone="amber" />
        <Stat label="My class" value={myClass?.name ?? "–"} hint="Class teacher" icon={<Users size={18} />} tone="sky" />
        <Stat label="Subjects" value={teachers.find((t) => t.id === tid)?.subjects.join(", ")} icon={<ClipboardCheck size={18} />} tone="emerald" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={`My schedule – ${todayName}`}>
          <ul className="space-y-2">
            {today.map((p) => (
              <li key={`${p.cls.id}-${p.slot}`} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <span className="w-14 font-mono text-xs text-slate-500">{SLOTS[p.slot]}</span>
                <span className="font-medium text-slate-800">{p.subject}</span>
                <span className="text-slate-500">
                  {p.cls.name} · {p.cls.room}
                </span>
              </li>
            ))}
            {today.length === 0 && <p className="text-sm text-slate-500">No classes today.</p>}
          </ul>
          <Link href="/attendance" className="mt-4 inline-block text-sm font-medium text-indigo-600">
            {myClass && s.submissions[TODAY]?.[myClass.id] ? `${myClass.name} attendance submitted ✓` : `Take Period 1 roll call for ${myClass?.name} →`}
          </Link>
        </Card>
        <Card title="Doubts assigned to you" action={<Link href="/doubts" className="text-xs font-medium text-indigo-600">All →</Link>}>
          {myDoubts.length === 0 ? (
            <p className="text-sm text-slate-500">All caught up! 🎉</p>
          ) : (
            <ul className="space-y-3">
              {myDoubts.map((d) => (
                <li key={d.id}>
                  <Link href={`/doubts/${d.id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <p className="text-sm font-medium text-slate-800">{d.title}</p>
                    <p className="text-xs text-slate-500">
                      {d.topic} · {classes.find((c) => c.id === d.classId)?.name} · {d.upvotes.length} upvotes
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <RecentNotices />
    </div>
  );
}

function LearnerDash() {
  const s = useStore();
  const st = s.students.find((x) => x.id === s.me.studentId)!;
  const cls = classes.find((c) => c.id === st.classId)!;
  const fee = feeSummary(st, s.payments);
  const att = attendancePct(st.id, s.attendance);
  const lastExam = exams.filter((e) => e.classId === cls.id && s.marks[e.id]?.[st.id]).sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastMarks = lastExam ? s.marks[lastExam.id][st.id] : undefined;
  const pct = lastExam && lastMarks ? Math.round((Object.values(lastMarks).reduce((a, b) => a + b, 0) / (Object.keys(lastMarks).length * lastExam.maxMarks)) * 100) : null;
  const upcoming = exams.filter((e) => e.classId === cls.id && e.date >= TODAY);
  const today = timetable[cls.id].filter((p) => p.day === todayName);
  const parent = s.role === "parent";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={parent ? `Welcome, ${s.me.name.split(" ")[0]}` : `Hi ${st.name.split(" ")[0]} 👋`} subtitle={parent ? `Here's how ${st.name.split(" ")[0]} is doing` : s.me.subtitle} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Attendance" value={`${att}%`} hint="Last 20 days" icon={<ClipboardCheck size={18} />} tone={att >= 85 ? "emerald" : "amber"} />
        <Stat label={lastExam ? `${lastExam.name}` : "Last exam"} value={pct !== null ? `${pct}%` : "–"} icon={<GraduationCap size={18} />} />
        <Stat label="Fee due" value={inr(fee.due)} hint={`${inr(fee.paid)} of ${inr(fee.total)} paid`} icon={<IndianRupee size={18} />} tone={fee.due ? "rose" : "emerald"} />
        <Stat label="Upcoming exams" value={upcoming.length} hint={upcoming[0] ? `${upcoming[0].name} · ${fmtDate(upcoming[0].date)}` : undefined} icon={<Megaphone size={18} />} tone="sky" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title={`Timetable – ${todayName}`}>
          <ul className="space-y-2">
            {today.map((p) => (
              <li key={p.slot} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <span className="w-14 font-mono text-xs text-slate-500">{SLOTS[p.slot]}</span>
                <span className="font-medium text-slate-800">{p.subject}</span>
                <span className="text-slate-500">{teachers.find((t) => t.id === p.teacherId)?.name}</span>
              </li>
            ))}
          </ul>
        </Card>
        {parent ? (
          <Card title="Fees" action={<Link href="/fees" className="text-xs font-medium text-indigo-600">Pay now →</Link>}>
            <Progress value={(fee.paid / fee.total) * 100} tone="emerald" />
            <p className="mt-2 text-sm text-slate-600">
              {inr(fee.paid)} paid of {inr(fee.total)}. {fee.due > 0 ? <span className="font-medium text-rose-600">{inr(fee.due)} due.</span> : "All clear!"}
            </p>
          </Card>
        ) : (
          <Card title="My doubts" action={<Link href="/doubts" className="text-xs font-medium text-indigo-600">Ask a doubt →</Link>}>
            <ul className="space-y-2">
              {s.doubts
                .filter((d) => d.studentId === st.id)
                .slice(0, 4)
                .map((d) => (
                  <li key={d.id}>
                    <Link href={`/doubts/${d.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-3 text-sm hover:bg-slate-50">
                      <span className="truncate font-medium text-slate-800">{d.title}</span>
                      <Badge color={d.status === "Open" ? "amber" : d.status === "Answered" ? "blue" : "green"}>{d.status}</Badge>
                    </Link>
                  </li>
                ))}
            </ul>
          </Card>
        )}
      </div>
      <RecentNotices />
    </div>
  );
}

function RecentNotices() {
  const s = useStore();
  const aud = { admin: null, teacher: "Teachers", student: "Students", parent: "Parents" }[s.role];
  const list = s.notices.filter((n) => !aud || n.audience === "All" || n.audience === aud).slice(0, 3);
  return (
    <Card title="Latest notices" className="mt-6" action={<Link href="/notices" className="text-xs font-medium text-indigo-600">All notices →</Link>}>
      <ul className="divide-y divide-slate-100">
        {list.map((n) => (
          <li key={n.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-800">{n.title}</p>
              {n.pinned && <Badge color="amber">Pinned</Badge>}
            </div>
            <p className="text-xs text-slate-500">
              {fmtDate(n.date)} · {n.author}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CheckInBanner() {
  const s = useStore();
  const rec = s.staffAttendance[TODAY]?.[s.me.teacherId!];
  const st = staffStatus(rec, true);
  if (st === "On Leave") return null;
  if (!rec?.in)
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <LogIn size={20} className="text-amber-600" />
        <p className="flex-1 text-sm text-amber-900">
          You haven&apos;t checked in today. It&apos;s {fmtTime(s.now)}.
        </p>
        <Button size="sm" onClick={() => s.checkIn(s.me.teacherId!, s.now)}>
          Check in now
        </Button>
      </div>
    );
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <UserCheck size={20} className="text-emerald-600" />
      <span className="flex-1">
        Checked in at <b>{fmtTime(rec.in)}</b>
        {st === "Late" && " (late)"}
        {rec.out ? ` · checked out at ${fmtTime(rec.out)}` : ""}
      </span>
      <Link href="/staff-attendance" className="font-medium text-emerald-700 hover:underline">
        My attendance →
      </Link>
    </div>
  );
}
