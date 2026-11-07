"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { fmtDate, useStore } from "@/lib/store";
import type { Notice } from "@/lib/types";
import { Badge, Button, Card, Field, inputCls, Modal, PageHeader, Tabs } from "@/components/ui";

const AUD_COLOR = { All: "indigo", Students: "blue", Parents: "amber", Teachers: "green" } as const;

export default function NoticesPage() {
  const s = useStore();
  const canPost = s.role === "admin" || s.role === "teacher";
  const mine = { admin: null, teacher: "Teachers", student: "Students", parent: "Parents" }[s.role];
  const [filter, setFilter] = useState<"All" | Notice["audience"]>("All");
  const [posting, setPosting] = useState(false);

  const list = s.notices
    .filter((n) => !mine || n.audience === "All" || n.audience === mine)
    .filter((n) => filter === "All" || n.audience === filter)
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Notices"
        subtitle="Announcements are also pushed via app notification, SMS and WhatsApp."
        actions={
          canPost && (
            <Button onClick={() => setPosting(true)}>
              <Plus size={16} /> New notice
            </Button>
          )
        }
      />
      {!mine && (
        <div className="mb-4">
          <Tabs value={filter} onChange={setFilter} options={(["All", "Students", "Parents", "Teachers"] as const).map((v) => ({ value: v, label: v }))} />
        </div>
      )}
      <div className="space-y-3">
        {list.map((n) => (
          <Card key={n.id}>
            <div className="flex gap-4">
              <span className="h-fit rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Megaphone size={18} />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-900">{n.title}</h3>
                  {n.pinned && <Badge color="amber">Pinned</Badge>}
                  <Badge color={AUD_COLOR[n.audience]}>{n.audience === "All" ? "Everyone" : n.audience}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {fmtDate(n.date)} · {n.author}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {posting && <PostNotice onClose={() => setPosting(false)} />}
    </div>
  );
}

function PostNotice({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Notice["audience"]>("All");
  const [pinned, setPinned] = useState(false);
  return (
    <Modal open onClose={onClose} title="New notice">
      <div className="space-y-4">
        <Field label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message">
          <textarea className={`${inputCls} min-h-28`} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <div className="flex items-end gap-4">
          <Field label="Send to">
            <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value as Notice["audience"])}>
              {(["All", "Students", "Parents", "Teachers"] as const).map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to top
          </label>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!title.trim() || !body.trim()}
          onClick={() => {
            s.addNotice({ title: title.trim(), body: body.trim(), audience, pinned, author: s.me.name });
            onClose();
          }}
        >
          Publish
        </Button>
      </div>
    </Modal>
  );
}
