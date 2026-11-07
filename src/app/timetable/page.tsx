"use client";

import { Fragment, useState } from "react";
import { classes, DAYS, SLOTS, teachers, timetable } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { Card, cx, inputCls, PageHeader } from "@/components/ui";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-indigo-50 text-indigo-800",
  Physics: "bg-sky-50 text-sky-800",
  Chemistry: "bg-emerald-50 text-emerald-800",
  Biology: "bg-lime-50 text-lime-800",
  English: "bg-amber-50 text-amber-800",
  "Social Science": "bg-rose-50 text-rose-800",
  Science: "bg-teal-50 text-teal-800",
  Hindi: "bg-orange-50 text-orange-800",
};

export default function TimetablePage() {
  const s = useStore();
  const own = s.me.studentId ? s.students.find((x) => x.id === s.me.studentId)?.classId : undefined;
  const isTeacher = s.role === "teacher";
  const [view, setView] = useState<string>(isTeacher ? "me" : (own ?? classes[0].id));

  const cell = (day: string, slot: number) => {
    if (view === "me") {
      const hit = classes
        .map((c) => ({ c, p: timetable[c.id].find((p) => p.day === day && p.slot === slot && p.teacherId === s.me.teacherId) }))
        .find((x) => x.p);
      return hit ? { subject: hit.p!.subject, sub: `${hit.c.name} · ${hit.c.room}` } : null;
    }
    const p = timetable[view].find((x) => x.day === day && x.slot === slot)!;
    return { subject: p.subject, sub: teachers.find((t) => t.id === p.teacherId)?.name ?? "" };
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Timetable"
        subtitle="Weekly schedule"
        actions={
          !own && (
            <select className={`${inputCls} !w-auto`} value={view} onChange={(e) => setView(e.target.value)}>
              {isTeacher && <option value="me">My timetable</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )
        }
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="w-20 text-left text-xs font-medium text-slate-500">Time</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-left text-xs font-medium uppercase text-slate-500">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((t, slot) => (
                <Fragment key={t}>
                  {slot === 3 && (
                    <tr>
                      <td className="font-mono text-xs text-slate-400">10:30</td>
                      <td colSpan={6} className="rounded-md bg-slate-50 py-1 text-center text-xs text-slate-400">
                        Break
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-mono text-xs text-slate-500">{t}</td>
                    {DAYS.map((d) => {
                      const c = cell(d, slot);
                      return (
                        <td key={d} className={cx("rounded-md p-2 align-top", c ? SUBJECT_COLORS[c.subject] : "bg-slate-50")}>
                          {c ? (
                            <>
                              <p className="font-medium">{c.subject}</p>
                              <p className="text-xs opacity-75">{c.sub}</p>
                            </>
                          ) : (
                            <p className="text-xs text-slate-400">Free</p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
