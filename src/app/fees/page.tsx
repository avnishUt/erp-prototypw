"use client";

import { useState } from "react";
import { CheckCircle2, Printer, Search } from "lucide-react";
import { classes, INSTITUTE, TODAY } from "@/lib/seed";
import { feeSummary, fmtDate, inr, useStore } from "@/lib/store";
import type { FeePayment, Student } from "@/lib/types";
import { Badge, Button, Card, Field, inputCls, Modal, PageHeader, Progress, Stat, Table, Td, Tabs } from "@/components/ui";

export default function FeesPage() {
  const { role } = useStore();
  return role === "admin" ? <AdminFees /> : <MyFees />;
}

function AdminFees() {
  const s = useStore();
  const [tab, setTab] = useState<"dues" | "payments">("dues");
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");
  const [collect, setCollect] = useState<Student>();
  const [receipt, setReceipt] = useState<FeePayment>();

  const rows = s.students
    .filter((x) => x.status === "Active" && (cls === "all" || x.classId === cls) && (!q || x.name.toLowerCase().includes(q.toLowerCase())))
    .map((st) => ({ st, ...feeSummary(st, s.payments) }));
  const total = rows.reduce((a, r) => a + r.total, 0);
  const paid = rows.reduce((a, r) => a + r.paid, 0);
  const todayCollected = s.payments.filter((p) => p.date === TODAY).reduce((a, p) => a + p.amount, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Fees" subtitle="Fee structure: 4 quarterly installments per student." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total billed" value={inr(total)} />
        <Stat label="Collected" value={inr(paid)} hint={`${total ? Math.round((paid / total) * 100) : 0}%`} tone="emerald" />
        <Stat label="Outstanding" value={inr(total - paid)} tone="rose" />
        <Stat label="Collected today" value={inr(todayCollected)} tone="sky" />
      </div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs value={tab} onChange={setTab} options={[{ value: "dues", label: "Student dues" }, { value: "payments", label: "Payment history" }]} />
          <select className={`${inputCls} !w-auto`} value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search student…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {tab === "dues" ? (
          <Table head={["Student", "Class", "Total", "Paid", "Due", "Progress", ""]}>
            {rows.map(({ st, total, paid, due }) => (
              <tr key={st.id}>
                <Td className="font-medium text-slate-900">{st.name}</Td>
                <Td>{classes.find((c) => c.id === st.classId)?.name}</Td>
                <Td>{inr(total)}</Td>
                <Td>{inr(paid)}</Td>
                <Td>{due ? <span className="font-medium text-rose-600">{inr(due)}</span> : <Badge color="green">Cleared</Badge>}</Td>
                <Td className="w-32">
                  <Progress value={(paid / total) * 100} tone={due ? "amber" : "emerald"} />
                </Td>
                <Td>
                  {due > 0 && (
                    <Button size="sm" variant="secondary" onClick={() => setCollect(st)}>
                      Collect
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table head={["Receipt", "Date", "Student", "Mode", "Amount", ""]}>
            {[...s.payments]
              .filter((p) => rows.some((r) => r.st.id === p.studentId))
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 60)
              .map((p) => (
                <tr key={p.id}>
                  <Td className="font-mono text-xs">{p.receiptNo}</Td>
                  <Td>{fmtDate(p.date)}</Td>
                  <Td>{s.students.find((x) => x.id === p.studentId)?.name}</Td>
                  <Td>
                    <Badge>{p.mode}</Badge>
                  </Td>
                  <Td className="font-medium">{inr(p.amount)}</Td>
                  <Td>
                    <Button size="sm" variant="ghost" onClick={() => setReceipt(p)}>
                      Receipt
                    </Button>
                  </Td>
                </tr>
              ))}
          </Table>
        )}
      </Card>
      {collect && (
        <CollectModal
          st={collect}
          onClose={() => setCollect(undefined)}
          onDone={(p) => {
            setCollect(undefined);
            setReceipt(p);
          }}
        />
      )}
      {receipt && <Receipt p={receipt} onClose={() => setReceipt(undefined)} />}
    </div>
  );
}

function CollectModal({ st, onClose, onDone }: { st: Student; onClose: () => void; onDone: (p: FeePayment) => void }) {
  const s = useStore();
  const { due } = feeSummary(st, s.payments);
  const [amount, setAmount] = useState(Math.min(due, st.feeTotal / 4));
  const [mode, setMode] = useState<FeePayment["mode"]>("Cash");
  return (
    <Modal open onClose={onClose} title={`Collect fee – ${st.name}`}>
      <p className="mb-4 text-sm text-slate-600">
        Outstanding: <span className="font-semibold text-rose-600">{inr(due)}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (₹)">
          <input type="number" className={inputCls} value={amount} max={due} onChange={(e) => setAmount(Math.min(due, Number(e.target.value)))} />
        </Field>
        <Field label="Mode">
          <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as FeePayment["mode"])}>
            {(["Cash", "UPI", "Card", "Bank Transfer"] as const).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={amount <= 0}
          onClick={() => {
            s.addPayment({ studentId: st.id, amount, date: TODAY, mode });
            onDone({ id: "new", studentId: st.id, amount, date: TODAY, mode, receiptNo: `VBPS/26/${1001 + s.payments.length}` });
          }}
        >
          Record payment
        </Button>
      </div>
    </Modal>
  );
}

function Receipt({ p, onClose }: { p: FeePayment; onClose: () => void }) {
  const s = useStore();
  const st = s.students.find((x) => x.id === p.studentId)!;
  return (
    <Modal open onClose={onClose} title="Fee receipt">
      <div className="rounded-lg border border-slate-200 p-5 text-sm">
        <div className="mb-4 border-b border-dashed border-slate-300 pb-3 text-center">
          <p className="font-semibold text-slate-900">{INSTITUTE.name}</p>
          <p className="text-xs text-slate-500">{INSTITUTE.city}</p>
        </div>
        <dl className="grid grid-cols-2 gap-y-1.5">
          <dt className="text-slate-500">Receipt no.</dt>
          <dd className="text-right font-mono">{p.receiptNo}</dd>
          <dt className="text-slate-500">Date</dt>
          <dd className="text-right">{fmtDate(p.date)}</dd>
          <dt className="text-slate-500">Student</dt>
          <dd className="text-right">{st.name}</dd>
          <dt className="text-slate-500">Class</dt>
          <dd className="text-right">{classes.find((c) => c.id === st.classId)?.name}</dd>
          <dt className="text-slate-500">Mode</dt>
          <dd className="text-right">{p.mode}</dd>
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-3">
          <span className="font-medium">Amount paid</span>
          <span className="text-lg font-semibold">{inr(p.amount)}</span>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}

function MyFees() {
  const s = useStore();
  const st = s.students.find((x) => x.id === s.me.studentId)!;
  const fee = feeSummary(st, s.payments);
  const mine = s.payments.filter((p) => p.studentId === st.id).sort((a, b) => a.date.localeCompare(b.date));
  const inst = st.feeTotal / 4;
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState<"choose" | "processing" | "done">("choose");
  const [receipt, setReceipt] = useState<FeePayment>();
  const nextAmount = Math.min(inst, fee.due);
  const dueDates = ["Apr 15", "Jul 15", "Oct 15", "Jan 15"];
  let remaining = fee.paid;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Fees" subtitle={`${st.name} · ${classes.find((c) => c.id === st.classId)?.name} · Session ${INSTITUTE.session}`} />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Annual fee" value={inr(fee.total)} />
        <Stat label="Paid" value={inr(fee.paid)} tone="emerald" />
        <Stat label="Due" value={inr(fee.due)} tone={fee.due ? "rose" : "emerald"} />
      </div>
      <Card
        title="Installments"
        action={
          fee.due > 0 &&
          s.role === "parent" && (
            <Button
              size="sm"
              onClick={() => {
                setStep("choose");
                setPaying(true);
              }}
            >
              Pay {inr(nextAmount)} online
            </Button>
          )
        }
      >
        <ul className="divide-y divide-slate-100 text-sm">
          {dueDates.map((d, i) => {
            const covered = remaining >= inst;
            remaining = Math.max(0, remaining - inst);
            return (
              <li key={d} className="flex items-center justify-between py-3">
                <span>
                  <span className="font-medium text-slate-800">Installment {i + 1}</span> <span className="text-slate-500">· due {d}</span>
                </span>
                <span className="flex items-center gap-3">
                  {inr(inst)}
                  {covered ? <Badge color="green">Paid</Badge> : <Badge color="amber">Pending</Badge>}
                </span>
              </li>
            );
          })}
        </ul>
        {s.role === "student" && fee.due > 0 && <p className="mt-3 text-xs text-slate-500">Online payment is available from the parent login.</p>}
      </Card>
      <Card title="Payment history" className="mt-6">
        <Table head={["Receipt", "Date", "Mode", "Amount", ""]}>
          {mine.map((p) => (
            <tr key={p.id}>
              <Td className="font-mono text-xs">{p.receiptNo}</Td>
              <Td>{fmtDate(p.date)}</Td>
              <Td>{p.mode}</Td>
              <Td className="font-medium">{inr(p.amount)}</Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={() => setReceipt(p)}>
                  Receipt
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={paying} onClose={() => setPaying(false)} title="Pay fees online">
        {step === "choose" && (
          <>
            <p className="text-sm text-slate-600">
              Amount: <span className="text-lg font-semibold text-slate-900">{inr(nextAmount)}</span>
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["UPI", "Card", "Net banking"].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setStep("processing");
                    setTimeout(() => {
                      s.addPayment({ studentId: st.id, amount: nextAmount, date: TODAY, mode: m === "Card" ? "Card" : m === "UPI" ? "UPI" : "Bank Transfer" });
                      setStep("done");
                    }, 1200);
                  }}
                  className="rounded-lg border border-slate-200 p-4 text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50"
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Prototype: no real payment is processed (a Razorpay / PhonePe gateway in production).</p>
          </>
        )}
        {step === "processing" && <p className="py-8 text-center text-sm text-slate-500">Processing payment…</p>}
        {step === "done" && (
          <div className="py-6 text-center">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
            <p className="mt-2 font-semibold text-slate-900">Payment successful</p>
            <p className="text-sm text-slate-500">Receipt sent on WhatsApp & email.</p>
            <Button className="mt-4" onClick={() => setPaying(false)}>
              Done
            </Button>
          </div>
        )}
      </Modal>
      {receipt && <Receipt p={receipt} onClose={() => setReceipt(undefined)} />}
    </div>
  );
}
