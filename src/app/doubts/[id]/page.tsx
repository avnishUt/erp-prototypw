"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw, Star, ThumbsUp } from "lucide-react";
import { classes, teachers } from "@/lib/seed";
import { statusColor } from "@/lib/doubts";
import { timeAgo, useStore } from "@/lib/store";
import { Avatar, Badge, Button, Card, cx, inputCls, Modal } from "@/components/ui";

export default function DoubtDetail() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { role, me } = store;
  const d = store.doubts.find((x) => x.id === id);
  const [reply, setReply] = useState("");
  const [resolving, setResolving] = useState(false);

  if (!d) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-slate-600">Doubt not found.</p>
        <Link href="/doubts" className="text-sm text-indigo-600 hover:underline">
          ← Back to doubts
        </Link>
      </div>
    );
  }

  const student = store.students.find((s) => s.id === d.studentId);
  const teacher = teachers.find((t) => t.id === d.assignedTeacherId);
  const cls = classes.find((c) => c.id === d.classId);
  const isOwner = role === "student" && me.studentId === d.studentId;
  const canReply = role === "teacher" || role === "admin" || isOwner;
  const upvoted = me.studentId ? d.upvotes.includes(me.studentId) : false;
  const teacherReplies = d.replies.filter((r) => r.authorRole === "teacher");

  const send = () => {
    if (!reply.trim()) return;
    store.replyDoubt(d.id, {
      authorName: role === "student" ? (student?.name ?? me.name) : me.name,
      authorRole: role === "admin" ? "teacher" : role,
      text: reply.trim(),
    });
    setReply("");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/doubts" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> All doubts
      </Link>

      <Card>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge color={statusColor[d.status]}>{d.status}</Badge>
          <Badge color="indigo">{d.subject}</Badge>
          <Badge color="gray">{d.topic}</Badge>
          <span className="text-slate-500">· {cls?.name}</span>
        </div>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">{d.title}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Avatar name={student?.name ?? "?"} size={24} />
          <span className="font-medium text-slate-700">{student?.name}</span>
          <span>asked {timeAgo(d.createdAt)}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-slate-700">{d.description}</p>
        {d.imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.imageDataUrl} alt="Problem attached by student" className="mt-4 max-h-96 rounded-lg border border-slate-200" />
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {role === "student" && !isOwner && (
            <Button variant={upvoted ? "primary" : "secondary"} size="sm" onClick={() => store.toggleUpvote(d.id, me.studentId!)}>
              <ThumbsUp size={14} /> I have this doubt too · {d.upvotes.length}
            </Button>
          )}
          {(role !== "student" || isOwner) && (
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <ThumbsUp size={14} /> {d.upvotes.length} students have the same doubt
            </span>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {role === "admin" ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Assigned to
                <select className={`${inputCls} !w-auto !py-1`} value={d.assignedTeacherId} onChange={(e) => store.reassignDoubt(d.id, e.target.value)}>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subjects.join(", ")})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="text-sm text-slate-500">
                Assigned to <span className="font-medium text-slate-700">{teacher?.name}</span>
              </span>
            )}
            {isOwner && d.status !== "Resolved" && teacherReplies.length > 0 && (
              <Button size="sm" onClick={() => setResolving(true)}>
                <CheckCircle2 size={14} /> Mark as resolved
              </Button>
            )}
            {isOwner && d.status === "Resolved" && (
              <Button size="sm" variant="secondary" onClick={() => store.reopenDoubt(d.id)}>
                <RotateCcw size={14} /> Still confused? Reopen
              </Button>
            )}
          </div>
        </div>
        {d.rating && (
          <p className="mt-3 flex items-center gap-1 text-sm text-slate-600">
            Student rated this answer:
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={14} className={n <= d.rating! ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
            ))}
          </p>
        )}
      </Card>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-700">
        {d.replies.length} {d.replies.length === 1 ? "reply" : "replies"}
      </h2>
      <div className="space-y-3">
        {d.replies.map((r) => (
          <div
            key={r.id}
            className={cx(
              "rounded-xl border p-4",
              r.accepted ? "border-emerald-300 bg-emerald-50/50" : r.authorRole === "teacher" ? "border-indigo-100 bg-white" : "border-slate-200 bg-white",
            )}
          >
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Avatar name={r.authorName} size={26} />
              <span className="font-medium text-slate-800">{r.authorName}</span>
              {r.authorRole === "teacher" && <Badge color="indigo">Teacher</Badge>}
              {r.accepted && <Badge color="green">✓ Accepted answer</Badge>}
              <span className="ml-auto text-xs text-slate-400">{timeAgo(r.at)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{r.text}</p>
          </div>
        ))}
        {d.replies.length === 0 && <p className="text-sm text-slate-500">No replies yet. {teacher?.name} has been notified.</p>}
      </div>

      {canReply && d.status !== "Resolved" && (
        <Card className="mt-4">
          <textarea
            className={`${inputCls} min-h-24`}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={role === "student" ? "Add a follow-up question or clarification…" : "Write your explanation…"}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={send} disabled={!reply.trim()}>
              {role === "student" ? "Post follow-up" : "Post answer"}
            </Button>
          </div>
        </Card>
      )}

      {resolving && (
        <ResolveModal
          replies={teacherReplies}
          onClose={() => setResolving(false)}
          onSubmit={(rating, accepted) => {
            store.resolveDoubt(d.id, rating, accepted);
            setResolving(false);
          }}
        />
      )}
    </div>
  );
}

function ResolveModal({
  replies,
  onClose,
  onSubmit,
}: {
  replies: { id: string; text: string; authorName: string }[];
  onClose: () => void;
  onSubmit: (rating: number, acceptedReplyId?: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [accepted, setAccepted] = useState(replies[replies.length - 1]?.id);
  return (
    <Modal open onClose={onClose} title="Mark doubt as resolved">
      <p className="mb-2 text-sm font-medium text-slate-700">Which answer helped you?</p>
      <div className="space-y-2">
        {replies.map((r) => (
          <label key={r.id} className={cx("flex cursor-pointer gap-3 rounded-lg border p-3 text-sm", accepted === r.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200")}>
            <input type="radio" checked={accepted === r.id} onChange={() => setAccepted(r.id)} className="mt-0.5" />
            <span className="line-clamp-2 text-slate-700">
              <span className="font-medium">{r.authorName}: </span>
              {r.text}
            </span>
          </label>
        ))}
      </div>
      <p className="mb-2 mt-5 text-sm font-medium text-slate-700">How helpful was the explanation?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star size={28} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(rating, accepted)}>Resolve</Button>
      </div>
    </Modal>
  );
}
