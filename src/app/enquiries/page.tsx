"use client";

import { useState } from "react";
import { Phone, Plus } from "lucide-react";
import { TODAY } from "@/lib/seed";
import { fmtDate, useStore } from "@/lib/store";
import type { Enquiry, EnquiryStatus } from "@/lib/types";
import { Badge, Button, cx, Field, inputCls, Modal, PageHeader, Stat } from "@/components/ui";

const STAGES: EnquiryStatus[] = ["New", "Contacted", "Demo Scheduled", "Converted", "Lost"];
const STAGE_LABEL: Record<EnquiryStatus, string> = { New: "New", Contacted: "Contacted", "Demo Scheduled": "Visit / Test Scheduled", Converted: "Admitted", Lost: "Lost" };
const STAGE_STYLE: Record<EnquiryStatus, string> = {
  New: "border-t-sky-500",
  Contacted: "border-t-indigo-500",
  "Demo Scheduled": "border-t-amber-500",
  Converted: "border-t-emerald-500",
  Lost: "border-t-slate-400",
};
const COURSES = ["Class 6 Admission", "Class 7 Admission", "Class 8 Admission", "Class 9 Admission", "Class 10 Admission"];
const SOURCES: Enquiry["source"][] = ["Walk-in", "Website", "Referral", "Instagram", "Google Ads"];

export default function EnquiriesPage() {
  const s = useStore();
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState<Enquiry>();
  const total = s.enquiries.length;
  const converted = s.enquiries.filter((e) => e.status === "Converted").length;
  const due = s.enquiries.filter((e) => e.followUp <= TODAY && !["Converted", "Lost"].includes(e.status)).length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Admission Enquiries"
        subtitle="Track every admission enquiry from first contact to confirmed admission."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} /> New enquiry
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total enquiries" value={total} />
        <Stat label="Admitted" value={converted} tone="emerald" />
        <Stat label="Conversion rate" value={`${total ? Math.round((converted / total) * 100) : 0}%`} tone="indigo" />
        <Stat label="Follow-ups due" value={due} tone="amber" />
      </div>
      <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">
        {STAGES.map((stage) => {
          const items = s.enquiries.filter((e) => e.status === stage);
          return (
            <div key={stage} className={cx("min-w-[220px] rounded-xl border border-t-4 border-slate-200 bg-slate-100/60 p-3", STAGE_STYLE[stage])}>
              <p className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                {STAGE_LABEL[stage]} <span className="rounded-full bg-white px-2 text-xs text-slate-500">{items.length}</span>
              </p>
              <div className="space-y-2">
                {items.map((e) => (
                  <button key={e.id} onClick={() => setEdit(e)} className="block w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-indigo-300">
                    <p className="text-sm font-medium text-slate-900">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.course}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge>{e.source}</Badge>
                      {!["Converted", "Lost"].includes(e.status) && (
                        <Badge color={e.followUp <= TODAY ? "red" : "gray"}>{e.followUp <= TODAY ? "Follow up today" : fmtDate(e.followUp)}</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {adding && <EnquiryForm onClose={() => setAdding(false)} />}
      {edit && <EnquiryForm initial={edit} onClose={() => setEdit(undefined)} />}
    </div>
  );
}

function EnquiryForm({ initial, onClose }: { initial?: Enquiry; onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState<Omit<Enquiry, "id" | "createdAt">>(
    initial ?? { name: "", phone: "", course: COURSES[2], source: "Walk-in", status: "New", followUp: TODAY, notes: "" },
  );
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title={initial ? initial.name : "New enquiry"}>
      {initial && (
        <a href={`tel:${initial.phone}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-indigo-600">
          <Phone size={14} /> {initial.phone}
        </a>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input className={inputCls} value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Admission sought for">
          <select className={inputCls} value={f.course} onChange={set("course")}>
            {COURSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select className={inputCls} value={f.source} onChange={set("source")}>
            {SOURCES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Stage">
          <select className={inputCls} value={f.status} onChange={set("status")}>
            {STAGES.map((c) => (
              <option key={c} value={c}>
                {STAGE_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Next follow-up">
          <input type="date" className={inputCls} value={f.followUp} onChange={set("followUp")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea className={`${inputCls} min-h-20`} value={f.notes} onChange={set("notes")} />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!f.name.trim() || !f.phone.trim()}
          onClick={() => {
            if (initial) s.updateEnquiry(initial.id, f);
            else s.addEnquiry(f);
            onClose();
          }}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}
