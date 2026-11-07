"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { classes, exams, TODAY } from "@/lib/seed";
import { fmtDate, useStore } from "@/lib/store";
import { Badge, Button, Card, inputCls, PageHeader, Table, Td } from "@/components/ui";

function grade(pct: number) {
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 33) return "D";
  return "E";
}

export default function ExamsPage() {
  const { role } = useStore();
  return role === "admin" || role === "teacher" ? <MarksEntry /> : <ReportCard />;
}

function MarksEntry() {
  const s = useStore();
  const done = exams.filter((e) => e.date <= TODAY);
  const [examId, setExamId] = useState(done[0].id);
  const exam = exams.find((e) => e.id === examId)!;
  const cls = classes.find((c) => c.id === exam.classId)!;
  const roster = s.students.filter((x) => x.classId === cls.id);
  const book = s.marks[examId] ?? {};
  const upcoming = exams.filter((e) => e.date > TODAY);

  const totals = roster.map((st) => ({ id: st.id, t: cls.subjects.reduce((a, sub) => a + (book[st.id]?.[sub] ?? 0), 0) }));
  const ranked = [...totals].sort((a, b) => b.t - a.t);
  const rank = (id: string) => ranked.findIndex((r) => r.id === id) + 1;
  const max = cls.subjects.length * exam.maxMarks;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Exams & Results" subtitle="Enter marks — totals, grades and ranks compute automatically." />
      {upcoming.length > 0 && (
        <Card title="Upcoming exams" className="mb-6">
          <ul className="flex flex-wrap gap-3 text-sm">
            {upcoming.map((e) => (
              <li key={e.id} className="rounded-lg bg-sky-50 px-3 py-2 text-sky-800">
                <span className="font-medium">{e.name}</span> · {classes.find((c) => c.id === e.classId)?.name} · {fmtDate(e.date)}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select className={`${inputCls} !w-auto`} value={examId} onChange={(e) => setExamId(e.target.value)}>
            {done.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {classes.find((c) => c.id === e.classId)?.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">
            {fmtDate(exam.date)} · Max {exam.maxMarks} per subject
          </span>
        </div>
        <Table head={["Roll", "Student", ...cls.subjects, "Total", "%", "Grade", "Rank"]}>
          {roster.map((st) => {
            const t = totals.find((x) => x.id === st.id)!.t;
            const pct = Math.round((t / max) * 100);
            return (
              <tr key={st.id}>
                <Td>{st.roll}</Td>
                <Td className="font-medium text-slate-900">{st.name}</Td>
                {cls.subjects.map((sub) => (
                  <Td key={sub}>
                    <input
                      type="number"
                      min={0}
                      max={exam.maxMarks}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                      value={book[st.id]?.[sub] ?? ""}
                      onChange={(e) => s.setMarks(examId, st.id, sub, Math.min(exam.maxMarks, Math.max(0, Number(e.target.value))))}
                    />
                  </Td>
                ))}
                <Td className="font-medium">{t}</Td>
                <Td>{pct}%</Td>
                <Td>
                  <Badge color={pct >= 71 ? "green" : pct >= 41 ? "blue" : "red"}>{grade(pct)}</Badge>
                </Td>
                <Td>#{rank(st.id)}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}

function ReportCard() {
  const s = useStore();
  const st = s.students.find((x) => x.id === s.me.studentId)!;
  const cls = classes.find((c) => c.id === st.classId)!;
  const mine = exams.filter((e) => e.classId === cls.id);
  const done = mine.filter((e) => s.marks[e.id]?.[st.id]);
  const [examId, setExamId] = useState(done.at(-1)?.id);
  const exam = exams.find((e) => e.id === examId);

  const peers = s.students.filter((x) => x.classId === cls.id);
  const marks = exam ? s.marks[exam.id]?.[st.id] : undefined;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Exams & Results"
        subtitle={`${st.name} · ${cls.name}`}
        actions={
          exam && (
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={15} /> Print report card
            </Button>
          )
        }
      />
      <Card title="Exam schedule" className="mb-6">
        <ul className="divide-y divide-slate-100 text-sm">
          {mine.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <span className="font-medium text-slate-800">{e.name}</span>
              <span className="flex items-center gap-2 text-slate-500">
                {fmtDate(e.date)} {e.date > TODAY ? <Badge color="blue">Upcoming</Badge> : <Badge color="green">Result out</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      {exam && marks && (
        <Card title="Report card" action={<select className={`${inputCls} !w-auto !py-1`} value={examId} onChange={(e) => setExamId(e.target.value)}>{done.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>}>
          <Table head={["Subject", "Marks", "Out of", "Class avg", "Class highest", "Grade"]}>
            {cls.subjects.map((sub) => {
              const all = peers.map((p) => s.marks[exam.id]?.[p.id]?.[sub] ?? 0);
              const m = marks[sub] ?? 0;
              return (
                <tr key={sub}>
                  <Td className="font-medium text-slate-900">{sub}</Td>
                  <Td>{m}</Td>
                  <Td>{exam.maxMarks}</Td>
                  <Td>{(all.reduce((a, b) => a + b, 0) / all.length).toFixed(1)}</Td>
                  <Td>{Math.max(...all)}</Td>
                  <Td>
                    <Badge color={m / exam.maxMarks >= 0.71 ? "green" : m / exam.maxMarks >= 0.41 ? "blue" : "red"}>{grade((m / exam.maxMarks) * 100)}</Badge>
                  </Td>
                </tr>
              );
            })}
          </Table>
          {(() => {
            const tot = Object.values(marks).reduce((a, b) => a + b, 0);
            const max = cls.subjects.length * exam.maxMarks;
            const totals = peers.map((p) => cls.subjects.reduce((a, sub) => a + (s.marks[exam.id]?.[p.id]?.[sub] ?? 0), 0)).sort((a, b) => b - a);
            return (
              <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4 text-center">
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-lg font-semibold">
                    {tot}/{max}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Percentage</p>
                  <p className="text-lg font-semibold">{Math.round((tot / max) * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Class rank</p>
                  <p className="text-lg font-semibold">
                    #{totals.indexOf(tot) + 1} <span className="text-sm font-normal text-slate-500">of {peers.length}</span>
                  </p>
                </div>
              </div>
            );
          })()}
        </Card>
      )}
    </div>
  );
}
