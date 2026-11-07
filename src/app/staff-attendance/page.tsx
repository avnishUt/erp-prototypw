"use client";

import { useState } from "react";
import { CalendarPlus, Clock, LogIn, LogOut, MapPin, Timer } from "lucide-react";
import { classes, DAYS, SLOTS, teachers, timetable, TODAY, WORKDAYS } from "@/lib/seed";
import { fmtDate, useStore } from "@/lib/store";
import { fmtDur, fmtTime, lateBy, POLICY, STATUS_COLOR, staffStatus, toMin, workedMin } from "@/lib/time";
import type { LeaveRequest } from "@/lib/types";
import { Avatar, Badge, Button, Card, cx, Field, inputCls, Modal, PageHeader, Progress, Stat, Table, Tabs, Td } from "@/components/ui";

const todayName = DAYS[(new Date().getDay() + 6) % 7] ?? "Mon";

export default function StaffAttendancePage() {
  const { role } = useStore();
  return role === "admin" ? <AdminStaff /> : <TeacherSelf />;
}

function PolicyStrip() {
  return (
    <div className="mb-6 flex flex-wrap gap-2 text-xs">
      <Badge color="indigo">Reporting time {fmtTime(POLICY.reportBy)}</Badge>
      <Badge color="gray">Grace {POLICY.graceMin} min</Badge>
      <Badge color="gray">School ends {fmtTime(POLICY.schoolEnd)}</Badge>
      <Badge color="gray">Full day {POLICY.fullDayHours}h</Badge>
      <Badge color="gray">Half day if under {POLICY.halfDayBelowHours}h</Badge>
    </div>
  );
}

/** All dates with staff data (past working days + today), newest first. */
function staffDates(book: Record<string, unknown>) {
  return Object.keys(book).sort().reverse();
}

function monthStats(teacherId: string, book: ReturnType<typeof useStore>["staffAttendance"], now: string) {
  const month = TODAY.slice(0, 7);
  const dates = staffDates(book).filter((d) => d.startsWith(month));
  let present = 0,
    late = 0,
    leave = 0,
    absent = 0,
    half = 0,
    mins = 0,
    counted = 0;
  for (const d of dates) {
    const rec = book[d]?.[teacherId];
    const st = staffStatus(rec, d === TODAY);
    if (st === "Present") present++;
    if (st === "Late") {
      present++;
      late++;
    }
    if (st === "Half Day") {
      present++;
      half++;
    }
    if (st === "On Leave") leave++;
    if (st === "Absent") absent++;
    const w = workedMin(rec, d === TODAY ? now : undefined);
    if (w) {
      mins += w;
      if (rec?.out) counted++;
    }
  }
  const completedMins = dates.reduce((a, d) => a + (book[d]?.[teacherId]?.out ? workedMin(book[d][teacherId]) : 0), 0);
  return { dates, present, late, leave, absent, half, mins, avg: counted ? completedMins / counted : 0 };
}

/* ------------------------------------------------------------------ */
/* Teacher: my attendance                                              */
/* ------------------------------------------------------------------ */

function TeacherSelf() {
  const s = useStore();
  const tid = s.me.teacherId!;
  const rec = s.staffAttendance[TODAY]?.[tid];
  const status = staffStatus(rec, true);
  const worked = workedMin(rec, s.now);
  const [verifying, setVerifying] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [applying, setApplying] = useState(false);
  const m = monthStats(tid, s.staffAttendance, s.now);
  const myLeaves = s.leaves.filter((l) => l.teacherId === tid);

  const doCheckIn = () => {
    setVerifying(true);
    setTimeout(() => {
      s.checkIn(tid, s.now);
      setVerifying(false);
    }, 1100);
  };

  // Today's timeline: check-in → periods → student attendance → check-out
  const myClass = classes.find((c) => c.classTeacherId === tid);
  const sub = myClass ? s.submissions[TODAY]?.[myClass.id] : undefined;
  const periods = classes
    .flatMap((c) => timetable[c.id].filter((p) => p.day === todayName && p.teacherId === tid).map((p) => ({ ...p, c })))
    .sort((a, b) => a.slot - b.slot);
  type Ev = { time: string; title: string; sub?: string; state: "done" | "now" | "next" };
  const nowM = toMin(s.now);
  const ev: Ev[] = [];
  ev.push(rec?.in ? { time: rec.in, title: "Checked in", sub: rec.method, state: "done" } : { time: POLICY.reportBy, title: "Check in", sub: "Reporting time", state: "next" });
  if (myClass)
    ev.push(
      sub
        ? { time: sub.at, title: `Period 1 roll call – ${myClass.name}`, sub: `Submitted · ${sub.smsSent} parent SMS sent`, state: "done" }
        : { time: SLOTS[0], title: `Period 1 roll call – ${myClass.name}`, sub: "Pending", state: nowM >= toMin(SLOTS[0]) ? "now" : "next" },
    );
  for (const p of periods) {
    const start = toMin(SLOTS[p.slot]);
    ev.push({ time: SLOTS[p.slot], title: `Period ${p.slot + 1} · ${p.subject}`, sub: `${p.c.name} · ${p.c.room}`, state: nowM >= start + 45 ? "done" : nowM >= start ? "now" : "next" });
  }
  ev.push(rec?.out ? { time: rec.out, title: "Checked out", sub: `Worked ${fmtDur(worked)}`, state: "done" } : { time: POLICY.schoolEnd, title: "Check out", state: "next" });
  ev.sort((a, b) => toMin(a.time) - toMin(b.time));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Attendance"
        subtitle="Check in when you reach school and check out when you leave. Your working hours are calculated automatically."
        actions={
          <Button variant="secondary" onClick={() => setApplying(true)}>
            <CalendarPlus size={15} /> Apply leave
          </Button>
        }
      />
      <PolicyStrip />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{fmtDate(TODAY)}</p>
              <p className="text-4xl font-semibold tracking-tight text-slate-900">{fmtTime(s.now)}</p>
            </div>
            <Badge color={STATUS_COLOR[status]}>{status === "Late" ? `Late by ${lateBy(rec)} min` : status}</Badge>
          </div>

          {status === "On Leave" ? (
            <p className="mt-6 rounded-lg bg-sky-50 p-4 text-sm text-sky-800">You are on approved leave today.</p>
          ) : !rec?.in ? (
            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={15} className="text-emerald-600" /> Location check: inside school campus (simulated GPS)
              </p>
              <Button className="w-full !py-3 text-base" onClick={doCheckIn} disabled={verifying}>
                <LogIn size={18} /> {verifying ? "Verifying location…" : "Check in"}
              </Button>
              {toMin(s.now) > toMin(POLICY.reportBy) + POLICY.graceMin && (
                <p className="mt-2 text-xs text-amber-700">It&apos;s past {fmtTime(POLICY.reportBy)} — this check-in will be marked late.</p>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Check-in</p>
                  <p className="font-semibold text-slate-900">{fmtTime(rec.in)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Check-out</p>
                  <p className="font-semibold text-slate-900">{fmtTime(rec.out)}</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3">
                  <p className="text-xs text-indigo-600">Working time</p>
                  <p className="font-semibold text-indigo-900">{fmtDur(worked)}</p>
                </div>
              </div>
              <div>
                <Progress value={(worked / (POLICY.fullDayHours * 60)) * 100} tone={worked >= POLICY.fullDayHours * 60 ? "emerald" : "indigo"} />
                <p className="mt-1 text-xs text-slate-500">
                  {fmtDur(worked)} of {POLICY.fullDayHours}h full day{!rec.out && " · timer running"}
                </p>
              </div>
              {!rec.out && (
                <Button
                  variant="secondary"
                  className="w-full !py-3 text-base"
                  onClick={() => (toMin(s.now) < toMin(POLICY.schoolEnd) ? setConfirmOut(true) : s.checkOut(tid, s.now))}
                >
                  <LogOut size={18} /> Check out
                </Button>
              )}
            </div>
          )}
        </Card>

        <Card title={`Today's timeline (${todayName})`} className="lg:col-span-2">
          <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5">
            {ev.map((e, i) => (
              <li key={i} className="relative">
                <span
                  className={cx(
                    "absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white",
                    e.state === "done" ? "bg-emerald-500" : e.state === "now" ? "bg-indigo-500" : "bg-slate-300",
                  )}
                />
                <p className="font-mono text-xs text-slate-400">{fmtTime(e.time)}</p>
                <p className={cx("text-sm font-medium", e.state === "next" ? "text-slate-500" : "text-slate-800")}>{e.title}</p>
                {e.sub && <p className="text-xs text-slate-500">{e.sub}</p>}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">This month</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Days present" value={m.present} tone="emerald" />
        <Stat label="Late arrivals" value={m.late} tone="amber" />
        <Stat label="Leaves" value={m.leave} tone="sky" />
        <Stat label="Avg. working time" value={fmtDur(m.avg)} icon={<Timer size={18} />} />
        <Stat label="Total hours" value={fmtDur(m.mins)} icon={<Clock size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Day-wise log" className="lg:col-span-2">
          <DayLog teacherId={tid} />
        </Card>
        <Card title="My leave requests">
          <ul className="space-y-2">
            {myLeaves.map((l) => (
              <li key={l.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{l.type} leave</span>
                  <Badge color={l.status === "Approved" ? "green" : l.status === "Rejected" ? "red" : "amber"}>{l.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {fmtDate(l.from)}
                  {l.to !== l.from && ` – ${fmtDate(l.to)}`} · {l.reason}
                </p>
              </li>
            ))}
            {myLeaves.length === 0 && <p className="text-sm text-slate-500">No leave requests.</p>}
          </ul>
        </Card>
      </div>

      <Modal open={confirmOut} onClose={() => setConfirmOut(false)} title="Check out early?">
        <p className="text-sm text-slate-600">
          School ends at {fmtTime(POLICY.schoolEnd)}. You&apos;ve worked {fmtDur(worked)} today.
          {worked < POLICY.halfDayBelowHours * 60 && <span className="font-medium text-amber-700"> Under {POLICY.halfDayBelowHours}h counts as a half day.</span>}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOut(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              s.checkOut(tid, s.now);
              setConfirmOut(false);
            }}
          >
            Check out now
          </Button>
        </div>
      </Modal>
      {applying && <ApplyLeave onClose={() => setApplying(false)} />}
    </div>
  );
}

function DayLog({ teacherId }: { teacherId: string }) {
  const s = useStore();
  const dates = staffDates(s.staffAttendance).slice(0, 14);
  return (
    <Table head={["Date", "Check-in", "Check-out", "Working time", "Status"]}>
      {dates.map((d) => {
        const rec = s.staffAttendance[d]?.[teacherId];
        const st = staffStatus(rec, d === TODAY);
        return (
          <tr key={d}>
            <Td>{fmtDate(d)}</Td>
            <Td>{fmtTime(rec?.in)}</Td>
            <Td>{fmtTime(rec?.out)}</Td>
            <Td>{rec?.in ? fmtDur(workedMin(rec, d === TODAY ? s.now : undefined)) + (d === TODAY && !rec.out ? " (running)" : "") : "–"}</Td>
            <Td>
              <Badge color={STATUS_COLOR[st]}>{st === "Late" ? `Late ${lateBy(rec)}m` : st}</Badge>
            </Td>
          </tr>
        );
      })}
    </Table>
  );
}

function ApplyLeave({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState<Omit<LeaveRequest, "id" | "status" | "appliedOn" | "teacherId">>({ from: TODAY, to: TODAY, type: "Casual", reason: "" });
  return (
    <Modal open onClose={onClose} title="Apply for leave">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From">
          <input type="date" className={inputCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: e.target.value > f.to ? e.target.value : f.to })} />
        </Field>
        <Field label="To">
          <input type="date" className={inputCls} value={f.to} min={f.from} onChange={(e) => setF({ ...f, to: e.target.value })} />
        </Field>
        <Field label="Type">
          <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as LeaveRequest["type"] })}>
            <option>Casual</option>
            <option>Medical</option>
            <option>Earned</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Reason">
            <input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!f.reason.trim()}
          onClick={() => {
            s.applyLeave({ ...f, teacherId: s.me.teacherId! });
            onClose();
          }}
        >
          Send to principal
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Admin: staff board                                                  */
/* ------------------------------------------------------------------ */

function AdminStaff() {
  const s = useStore();
  const [tab, setTab] = useState<"today" | "month" | "leaves">("today");
  const [detail, setDetail] = useState<string>();
  const today = s.staffAttendance[TODAY] ?? {};
  const statuses = teachers.map((t) => ({ t, rec: today[t.id], st: staffStatus(today[t.id], true) }));
  const count = (k: string) => statuses.filter((x) => x.st === k).length;
  const ins = statuses.filter((x) => x.rec?.in).map((x) => toMin(x.rec!.in!));
  const avgIn = ins.length ? ins.reduce((a, b) => a + b, 0) / ins.length : 0;
  const pending = s.leaves.filter((l) => l.status === "Pending");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Teacher Attendance" subtitle="Live check-ins, working hours and leave — ready for payroll." />
      <PolicyStrip />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="In school" value={`${count("Present") + count("Late")} / ${teachers.length}`} tone="emerald" />
        <Stat label="Late today" value={count("Late")} tone="amber" />
        <Stat label="On leave" value={count("On Leave")} tone="sky" />
        <Stat label="Not checked in" value={count("Not checked in")} tone="rose" />
        <Stat label="Avg. check-in" value={avgIn ? fmtTime(`${String(Math.floor(avgIn / 60)).padStart(2, "0")}:${String(Math.round(avgIn % 60)).padStart(2, "0")}`) : "–"} tone="indigo" />
      </div>
      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "today", label: "Today" },
            { value: "month", label: "Monthly summary" },
            { value: "leaves", label: <>Leave requests {pending.length > 0 && <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[11px] text-white">{pending.length}</span>}</> },
          ]}
        />
      </div>

      {tab === "today" && (
        <Card>
          <Table head={["Teacher", "Check-in", "Check-out", "Working time", "Method", "Status"]}>
            {statuses.map(({ t, rec, st }) => (
              <tr key={t.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetail(t.id)}>
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar name={t.name} size={28} />
                    <span>
                      <span className="block font-medium text-slate-900">{t.name}</span>
                      <span className="text-xs text-slate-500">{t.subjects.join(", ")}</span>
                    </span>
                  </span>
                </Td>
                <Td>{fmtTime(rec?.in)}</Td>
                <Td>{fmtTime(rec?.out)}</Td>
                <Td>{rec?.in ? `${fmtDur(workedMin(rec, s.now))}${rec.out ? "" : " · running"}` : "–"}</Td>
                <Td className="text-xs">{rec?.method ?? "–"}</Td>
                <Td>
                  <Badge color={STATUS_COLOR[st]}>{st === "Late" ? `Late ${lateBy(rec)} min` : st}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === "month" && (
        <Card title={`${new Date(TODAY).toLocaleString("en-IN", { month: "long", year: "numeric" })} · ${WORKDAYS.filter((d) => d.startsWith(TODAY.slice(0, 7))).length + 1} working days so far`}>
          <Table head={["Teacher", "Present", "Late", "Half day", "Leave", "Absent", "Avg. hours/day", "Total hours"]}>
            {teachers.map((t) => {
              const m = monthStats(t.id, s.staffAttendance, s.now);
              return (
                <tr key={t.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetail(t.id)}>
                  <Td className="font-medium text-slate-900">{t.name}</Td>
                  <Td>{m.present}</Td>
                  <Td className={m.late ? "text-amber-600" : ""}>{m.late}</Td>
                  <Td>{m.half}</Td>
                  <Td>{m.leave}</Td>
                  <Td className={m.absent ? "font-medium text-rose-600" : ""}>{m.absent}</Td>
                  <Td>{fmtDur(m.avg)}</Td>
                  <Td className="font-medium">{fmtDur(m.mins)}</Td>
                </tr>
              );
            })}
          </Table>
          <p className="mt-3 text-xs text-slate-500">Click a teacher for the day-wise log. Export to payroll is planned for the full version.</p>
        </Card>
      )}

      {tab === "leaves" && (
        <Card>
          <Table head={["Teacher", "Type", "Dates", "Reason", "Applied", "Status", ""]}>
            {s.leaves.map((l) => (
              <tr key={l.id}>
                <Td className="font-medium text-slate-900">{teachers.find((t) => t.id === l.teacherId)?.name}</Td>
                <Td>{l.type}</Td>
                <Td>
                  {fmtDate(l.from)}
                  {l.to !== l.from && ` – ${fmtDate(l.to)}`}
                </Td>
                <Td>{l.reason}</Td>
                <Td>{fmtDate(l.appliedOn)}</Td>
                <Td>
                  <Badge color={l.status === "Approved" ? "green" : l.status === "Rejected" ? "red" : "amber"}>{l.status}</Badge>
                </Td>
                <Td>
                  {l.status === "Pending" && (
                    <span className="flex gap-1">
                      <Button size="sm" onClick={() => s.decideLeave(l.id, "Approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => s.decideLeave(l.id, "Rejected")}>
                        Reject
                      </Button>
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal open={!!detail} onClose={() => setDetail(undefined)} title={teachers.find((t) => t.id === detail)?.name ?? ""} wide>
        {detail && <DayLog teacherId={detail} />}
      </Modal>
    </div>
  );
}
