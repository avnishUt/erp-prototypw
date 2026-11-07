"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { classes, FEE, TODAY } from "@/lib/seed";
import { attendancePct, feeSummary, fmtDate, inr, useStore } from "@/lib/store";
import type { Student } from "@/lib/types";
import { Avatar, Badge, Button, Card, Field, inputCls, Modal, PageHeader, Table, Td } from "@/components/ui";

export default function StudentsPage() {
  const s = useStore();
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<Student>();

  const list = s.students
    .filter((x) => cls === "all" || x.classId === cls)
    .filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.phone.includes(q));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Students"
        subtitle={`${s.students.length} students across ${classes.length} sections`}
        actions={
          s.role === "admin" && (
            <Button onClick={() => setAdding(true)}>
              <Plus size={16} /> New admission
            </Button>
          )
        }
      />
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <select className={`${inputCls} !w-auto`} value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <Table head={["Student", "Class", "Roll", "Guardian", "Phone", "Attendance", "Fee due", "Status"]}>
          {list.map((st) => {
            const att = attendancePct(st.id, s.attendance);
            const due = feeSummary(st, s.payments).due;
            return (
              <tr key={st.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setView(st)}>
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar name={st.name} size={28} />
                    <span className="font-medium text-slate-900">{st.name}</span>
                  </span>
                </Td>
                <Td>{classes.find((c) => c.id === st.classId)?.name}</Td>
                <Td>{st.roll}</Td>
                <Td>{st.guardianName}</Td>
                <Td>{st.phone}</Td>
                <Td>
                  <span className={att < 85 ? "font-medium text-amber-600" : ""}>{att}%</span>
                </Td>
                <Td>{due ? <span className="text-rose-600">{inr(due)}</span> : <span className="text-emerald-600">Paid</span>}</Td>
                <Td>
                  <Badge color={st.status === "Active" ? "green" : "gray"}>{st.status}</Badge>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
      {adding && <AdmissionForm onClose={() => setAdding(false)} />}
      {view && <StudentProfile st={view} onClose={() => setView(undefined)} />}
    </div>
  );
}

function StudentProfile({ st, onClose }: { st: Student; onClose: () => void }) {
  const s = useStore();
  const fee = feeSummary(st, s.payments);
  const rows: [string, string][] = [
    ["Class", classes.find((c) => c.id === st.classId)?.name ?? ""],
    ["Roll no.", String(st.roll)],
    ["Date of birth", fmtDate(st.dob)],
    ["Guardian", st.guardianName],
    ["Phone", st.phone],
    ["Email", st.email],
    ["Address", st.address],
    ["Admission date", fmtDate(st.admissionDate)],
    ["Attendance", `${attendancePct(st.id, s.attendance)}%`],
    ["Fees", `${inr(fee.paid)} paid · ${inr(fee.due)} due`],
  ];
  return (
    <Modal open onClose={onClose} title="Student profile">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={st.name} size={48} />
        <div>
          <p className="text-lg font-semibold text-slate-900">{st.name}</p>
          <Badge color={st.status === "Active" ? "green" : "gray"}>{st.status}</Badge>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="col-span-2 text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}

function AdmissionForm({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState({ name: "", classId: classes[0].id, guardianName: "", phone: "", email: "", dob: "2012-01-01", address: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const valid = f.name.trim() && f.guardianName.trim() && f.phone.trim();
  return (
    <Modal open onClose={onClose} title="New admission" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student name *">
          <input className={inputCls} value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Class">
          <select className={inputCls} value={f.classId} onChange={set("classId")}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {inr(FEE[c.id])}/yr
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guardian name *">
          <input className={inputCls} value={f.guardianName} onChange={set("guardianName")} />
        </Field>
        <Field label="Phone *">
          <input className={inputCls} value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Email">
          <input className={inputCls} value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Date of birth">
          <input type="date" className={inputCls} value={f.dob} onChange={set("dob")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input className={inputCls} value={f.address} onChange={set("address")} />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!valid}
          onClick={() => {
            s.addStudent({ ...f, admissionDate: TODAY, status: "Active", feeTotal: FEE[f.classId] });
            onClose();
          }}
        >
          Admit student
        </Button>
      </div>
    </Modal>
  );
}
