"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, ImagePlus, MessageSquare, Plus, Search, Star, ThumbsUp } from "lucide-react";
import { classes, subjectTeacher, teachers, TOPICS } from "@/lib/seed";
import { timeAgo, useStore } from "@/lib/store";
import { statusColor } from "@/lib/doubts";
import type { Doubt, DoubtStatus } from "@/lib/types";
import { Avatar, Badge, Button, Card, Empty, Field, inputCls, Modal, PageHeader, Stat, Tabs } from "@/components/ui";


type Scope = "all" | "mine";

export default function DoubtsPage() {
  const store = useStore();
  const router = useRouter();
  const { role, me } = store;
  const [status, setStatus] = useState<"All" | DoubtStatus>("All");
  const [scope, setScope] = useState<Scope>(role === "admin" ? "all" : "mine");
  const [subject, setSubject] = useState("All");
  const [q, setQ] = useState("");
  const [asking, setAsking] = useState(false);

  const myStudent = me.studentId ? store.students.find((s) => s.id === me.studentId) : undefined;

  // Students see doubts from their own class; teachers & admin see all.
  const visible = store.doubts.filter((d) => (role === "student" ? d.classId === myStudent?.classId : true));

  const list = useMemo(() => {
    return visible
      .filter((d) => status === "All" || d.status === status)
      .filter((d) => subject === "All" || d.subject === subject)
      .filter((d) => {
        if (scope !== "mine") return true;
        if (role === "student") return d.studentId === me.studentId;
        if (role === "teacher") return d.assignedTeacherId === me.teacherId;
        return true;
      })
      .filter((d) => !q || (d.title + d.description + d.topic).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [visible, status, subject, scope, q, role, me]);

  const subjects = [...new Set(visible.map((d) => d.subject))];
  const open = visible.filter((d) => d.status === "Open").length;
  const resolved = visible.filter((d) => d.status === "Resolved").length;
  const ratings = visible.filter((d) => d.rating).map((d) => d.rating!);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "–";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Doubt Solving"
        subtitle={
          role === "student"
            ? "Ask a question in any subject. It goes straight to your subject teacher."
            : role === "teacher"
              ? "Answer student doubts assigned to you."
              : "Track every doubt across classes, subjects and teachers."
        }
        actions={
          role === "student" && (
            <Button onClick={() => setAsking(true)}>
              <Plus size={16} /> Ask a doubt
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open doubts" value={open} icon={<Clock size={18} />} tone="amber" />
        <Stat label="Answered (awaiting student)" value={visible.filter((d) => d.status === "Answered").length} icon={<MessageSquare size={18} />} tone="sky" />
        <Stat label="Resolved" value={resolved} icon={<CheckCircle2 size={18} />} tone="emerald" />
        <Stat label="Avg. student rating" value={avgRating} hint={`${ratings.length} rated`} icon={<Star size={18} />} tone="indigo" />
      </div>

      {role === "admin" && <TeacherLoad doubts={store.doubts} />}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs
            value={status}
            onChange={setStatus}
            options={(["All", "Open", "Answered", "Resolved"] as const).map((s) => ({ value: s, label: s }))}
          />
          {role !== "admin" && (
            <Tabs
              value={scope}
              onChange={setScope}
              options={[
                { value: "mine", label: role === "student" ? "My doubts" : "Assigned to me" },
                { value: "all", label: role === "student" ? "Class doubts" : "All doubts" },
              ]}
            />
          )}
          <select className={`${inputCls} !w-auto`} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option>All</option>
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search doubts…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {list.length === 0 ? (
          <Empty>No doubts match these filters.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((d) => (
              <DoubtRow key={d.id} d={d} />
            ))}
          </ul>
        )}
      </Card>

      {asking && myStudent && (
        <AskDoubt
          classId={myStudent.classId}
          onClose={() => setAsking(false)}
          onCreate={(id) => {
            setAsking(false);
            router.push(`/doubts/${id}`);
          }}
        />
      )}
    </div>
  );
}

function DoubtRow({ d }: { d: Doubt }) {
  const store = useStore();
  const student = store.students.find((s) => s.id === d.studentId);
  const teacher = teachers.find((t) => t.id === d.assignedTeacherId);
  const cls = classes.find((c) => c.id === d.classId);
  return (
    <li>
      <Link href={`/doubts/${d.id}`} className="-mx-2 flex gap-4 rounded-lg px-2 py-4 hover:bg-slate-50">
        <Avatar name={student?.name ?? "?"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{d.title}</p>
            <Badge color={statusColor[d.status]}>{d.status}</Badge>
            {d.imageDataUrl && <Badge color="gray">📎 image</Badge>}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{d.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="font-medium text-indigo-600">
              {d.subject} · {d.topic}
            </span>
            <span>
              {student?.name} ({cls?.name})
            </span>
            <span>→ {teacher?.name}</span>
            <span>{timeAgo(d.createdAt)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MessageSquare size={13} /> {d.replies.length}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={13} /> {d.upvotes.length}
          </span>
        </div>
      </Link>
    </li>
  );
}

function TeacherLoad({ doubts }: { doubts: Doubt[] }) {
  const rows = teachers
    .map((t) => {
      const mine = doubts.filter((d) => d.assignedTeacherId === t.id);
      const rated = mine.filter((d) => d.rating);
      return {
        t,
        open: mine.filter((d) => d.status === "Open").length,
        answered: mine.filter((d) => d.status !== "Open").length,
        rating: rated.length ? (rated.reduce((a, d) => a + d.rating!, 0) / rated.length).toFixed(1) : "–",
        total: mine.length,
      };
    })
    .filter((r) => r.total > 0);
  return (
    <Card title="Teacher-wise doubt load" className="mb-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.t.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
            <Avatar name={r.t.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{r.t.name}</p>
              <p className="text-xs text-slate-500">{r.t.subjects.join(", ")}</p>
            </div>
            <div className="text-right text-xs">
              <p className={r.open ? "font-semibold text-amber-600" : "text-slate-500"}>{r.open} open</p>
              <p className="text-slate-500">
                {r.answered} answered · ★ {r.rating}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Downscale an uploaded photo so it fits comfortably in localStorage. */
function resizeImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.75));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function AskDoubt({ classId, onClose, onCreate }: { classId: string; onClose: () => void; onCreate: (id: string) => void }) {
  const store = useStore();
  const cls = classes.find((c) => c.id === classId)!;
  const [subject, setSubject] = useState(cls.subjects[0]);
  const [topic, setTopic] = useState(TOPICS[cls.subjects[0]][0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string>();

  const teacher = teachers.find((t) => t.id === subjectTeacher[subject]);

  // "Similar doubts" — nudges students to an existing answer before posting a duplicate.
  const similar = useMemo(() => {
    const words = title.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    if (!words.length) return [];
    return store.doubts
      .filter((d) => d.subject === subject && d.status !== "Open")
      .filter((d) => words.some((w) => (d.title + d.description).toLowerCase().includes(w)))
      .slice(0, 3);
  }, [title, subject, store.doubts]);

  const submit = () => {
    const id = store.askDoubt({
      studentId: store.me.studentId!,
      classId,
      subject,
      topic,
      title: title.trim(),
      description: description.trim(),
      imageDataUrl: image,
      assignedTeacherId: subjectTeacher[subject],
    });
    onCreate(id);
  };

  return (
    <Modal open onClose={onClose} title="Ask a doubt" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject">
          <select
            className={inputCls}
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic(TOPICS[e.target.value][0]);
            }}
          >
            {cls.subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Chapter / Topic">
          <select className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS[subject].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Your question (one line)">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How do I find the limiting reagent?" />
          </Field>
        </div>
        {similar.length > 0 && (
          <div className="rounded-lg bg-sky-50 p-3 text-sm sm:col-span-2">
            <p className="mb-1 font-medium text-sky-800">Similar doubts already answered:</p>
            <ul className="space-y-1">
              {similar.map((d) => (
                <li key={d.id}>
                  <Link href={`/doubts/${d.id}`} className="text-sky-700 hover:underline">
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label="Details">
            <textarea
              className={`${inputCls} min-h-28`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what you tried and where you got stuck…"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">Photo of the problem (optional)</span>
          {image ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Attached problem" className="max-h-48 rounded-lg border border-slate-200" />
              <button onClick={() => setImage(undefined)} className="absolute right-1 top-1 rounded bg-white/90 px-2 py-0.5 text-xs text-rose-600 shadow">
                Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-5 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600">
              <ImagePlus size={18} /> Upload or take a photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setImage(await resizeImage(f));
                }}
              />
            </label>
          )}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Will be sent to <span className="font-medium text-slate-700">{teacher?.name}</span> ({subject})
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || !description.trim()} onClick={submit}>
            Post doubt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
