"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as seed from "./seed";
import type {
  AttendanceBook,
  AttendanceMark,
  Doubt,
  DoubtReply,
  Enquiry,
  FeePayment,
  LeaveRequest,
  MarksBook,
  Notice,
  Role,
  StaffBook,
  Student,
  SubmissionLog,
} from "./types";
import { fromMin, toMin } from "./time";

interface Persisted {
  role: Role;
  students: Student[];
  attendance: AttendanceBook;
  payments: FeePayment[];
  marks: MarksBook;
  notices: Notice[];
  enquiries: Enquiry[];
  doubts: Doubt[];
  staffAttendance: StaffBook;
  leaves: LeaveRequest[];
  submissions: SubmissionLog;
  /** Demo clock: minutes added to the real time (null = real time). Lets the presenter jump to 7:40 AM, 8:05 AM, 2:35 PM… */
  clockOffsetMin: number | null;
}

const STORAGE_KEY = "vbps-school-erp-v3";

function initialState(): Persisted {
  return structuredClone({
    role: "admin" as Role,
    students: seed.students,
    attendance: seed.attendance,
    payments: seed.payments,
    marks: seed.marks,
    notices: seed.notices,
    enquiries: seed.enquiries,
    doubts: seed.doubts,
    staffAttendance: seed.staffAttendance,
    leaves: seed.leaves,
    submissions: seed.submissions,
    clockOffsetMin: null as number | null,
  });
}

/** Who "you" are for each role in the prototype. */
export const IDENTITIES: Record<Role, { name: string; subtitle: string; teacherId?: string; studentId?: string }> = {
  admin: { name: "Neha Arora", subtitle: "Administrator" },
  teacher: { name: "Priya Sharma", subtitle: "Mathematics · Class teacher 10-A", teacherId: "t1" },
  student: { name: "Aarav Mehta", subtitle: "Class 9-A · Roll 1", studentId: "s1" },
  parent: { name: "Rajesh Mehta", subtitle: "Parent of Aarav (9-A)", studentId: "s1" },
};

const uid = () => Math.random().toString(36).slice(2, 9);

function useStoreValue() {
  const [state, setState] = useState<Persisted>(initialState);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState(), ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked – prototype keeps working in-memory */
    }
  }, [state, ready]);

  const patch = useCallback((fn: (s: Persisted) => Partial<Persisted>) => setState((s) => ({ ...s, ...fn(s) })), []);

  const actions = useMemo(
    () => ({
      setRole: (role: Role) => patch(() => ({ role })),
      /** Set the demo clock to a given "HH:MM" today, or null for real time. */
      setClock: (hm: string | null) =>
        patch(() => {
          if (hm === null) return { clockOffsetMin: null };
          const d = new Date();
          return { clockOffsetMin: toMin(hm) - (d.getHours() * 60 + d.getMinutes()) };
        }),
      checkIn: (teacherId: string, at: string) =>
        patch((st) => ({
          staffAttendance: { ...st.staffAttendance, [seed.TODAY]: { ...st.staffAttendance[seed.TODAY], [teacherId]: { in: at, method: "Mobile app (GPS)" } } },
        })),
      checkOut: (teacherId: string, at: string) =>
        patch((st) => ({
          staffAttendance: {
            ...st.staffAttendance,
            [seed.TODAY]: { ...st.staffAttendance[seed.TODAY], [teacherId]: { ...st.staffAttendance[seed.TODAY]?.[teacherId], out: at } },
          },
        })),
      /** Class teacher submits the Period-1 roll call; it becomes the attendance for the whole day. */
      submitAttendance: (date: string, classId: string, marks: Record<string, AttendanceMark>, by: string, at: string) =>
        patch((st) => ({
          attendance: { ...st.attendance, [date]: { ...st.attendance[date], ...marks } },
          submissions: {
            ...st.submissions,
            [date]: { ...st.submissions[date], [classId]: { by, at, smsSent: Object.values(marks).filter((m) => m === "A").length } },
          },
        })),
      applyLeave: (l: Omit<LeaveRequest, "id" | "status" | "appliedOn">) =>
        patch((st) => ({ leaves: [{ ...l, id: `l${uid()}`, status: "Pending", appliedOn: seed.TODAY }, ...st.leaves] })),
      decideLeave: (id: string, status: "Approved" | "Rejected") =>
        patch((st) => {
          const l = st.leaves.find((x) => x.id === id)!;
          const staff = { ...st.staffAttendance };
          if (status === "Approved" && l.from <= seed.TODAY && l.to >= seed.TODAY) {
            staff[seed.TODAY] = { ...staff[seed.TODAY], [l.teacherId]: { leave: true } };
          }
          return { leaves: st.leaves.map((x) => (x.id === id ? { ...x, status } : x)), staffAttendance: staff };
        }),
      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(initialState());
      },
      addStudent: (s: Omit<Student, "id" | "roll">) =>
        patch((st) => {
          const roll = st.students.filter((x) => x.classId === s.classId).length + 1;
          return { students: [...st.students, { ...s, id: `s${uid()}`, roll }] };
        }),
      markAttendance: (date: string, marks: Record<string, AttendanceMark>) =>
        patch((st) => ({ attendance: { ...st.attendance, [date]: { ...st.attendance[date], ...marks } } })),
      addPayment: (p: Omit<FeePayment, "id" | "receiptNo">) =>
        patch((st) => {
          const n = 1001 + st.payments.length;
          return { payments: [...st.payments, { ...p, id: `p${uid()}`, receiptNo: `VBPS/26/${n}` }] };
        }),
      setMarks: (examId: string, studentId: string, subject: string, value: number) =>
        patch((st) => ({
          marks: {
            ...st.marks,
            [examId]: {
              ...st.marks[examId],
              [studentId]: { ...st.marks[examId]?.[studentId], [subject]: value },
            },
          },
        })),
      addNotice: (n: Omit<Notice, "id" | "date">) =>
        patch((st) => ({ notices: [{ ...n, id: `n${uid()}`, date: seed.TODAY }, ...st.notices] })),
      addEnquiry: (e: Omit<Enquiry, "id" | "createdAt">) =>
        patch((st) => ({ enquiries: [{ ...e, id: `q${uid()}`, createdAt: seed.TODAY }, ...st.enquiries] })),
      updateEnquiry: (id: string, changes: Partial<Enquiry>) =>
        patch((st) => ({ enquiries: st.enquiries.map((e) => (e.id === id ? { ...e, ...changes } : e)) })),
      askDoubt: (d: Omit<Doubt, "id" | "createdAt" | "replies" | "upvotes" | "status">) => {
        const id = `d${uid()}`;
        patch((st) => ({
          doubts: [{ ...d, id, createdAt: new Date().toISOString(), replies: [], upvotes: [], status: "Open" }, ...st.doubts],
        }));
        return id;
      },
      replyDoubt: (doubtId: string, reply: Omit<DoubtReply, "id" | "at">) =>
        patch((st) => ({
          doubts: st.doubts.map((d) =>
            d.id === doubtId
              ? {
                  ...d,
                  replies: [...d.replies, { ...reply, id: `r${uid()}`, at: new Date().toISOString() }],
                  status: reply.authorRole === "teacher" && d.status === "Open" ? "Answered" : d.status,
                }
              : d,
          ),
        })),
      resolveDoubt: (doubtId: string, rating?: number, acceptedReplyId?: string) =>
        patch((st) => ({
          doubts: st.doubts.map((d) =>
            d.id === doubtId
              ? {
                  ...d,
                  status: "Resolved",
                  rating,
                  replies: d.replies.map((r) => ({ ...r, accepted: r.id === acceptedReplyId ? true : r.accepted })),
                }
              : d,
          ),
        })),
      reopenDoubt: (doubtId: string) =>
        patch((st) => ({ doubts: st.doubts.map((d) => (d.id === doubtId ? { ...d, status: "Open", rating: undefined } : d)) })),
      reassignDoubt: (doubtId: string, teacherId: string) =>
        patch((st) => ({ doubts: st.doubts.map((d) => (d.id === doubtId ? { ...d, assignedTeacherId: teacherId } : d)) })),
      toggleUpvote: (doubtId: string, studentId: string) =>
        patch((st) => ({
          doubts: st.doubts.map((d) =>
            d.id === doubtId
              ? { ...d, upvotes: d.upvotes.includes(studentId) ? d.upvotes.filter((x) => x !== studentId) : [...d.upvotes, studentId] }
              : d,
          ),
        })),
    }),
    [patch],
  );

  // Current time ("HH:MM") — real time, or shifted by the demo clock.
  const d = new Date();
  void tick;
  const realMin = d.getHours() * 60 + d.getMinutes();
  const now = fromMin(((realMin + (state.clockOffsetMin ?? 0)) % 1440 + 1440) % 1440);

  return { ...state, ready, now, me: IDENTITIES[state.role], ...actions };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}

// ---------- derived helpers ----------
export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function feeSummary(student: Student, payments: FeePayment[]) {
  const paid = payments.filter((p) => p.studentId === student.id).reduce((a, p) => a + p.amount, 0);
  return { total: student.feeTotal, paid, due: Math.max(0, student.feeTotal - paid) };
}

export function attendancePct(studentId: string, book: AttendanceBook) {
  let p = 0,
    t = 0;
  for (const day of Object.values(book)) {
    const m = day[studentId];
    if (!m) continue;
    t++;
    if (m === "P") p++;
  }
  return t ? Math.round((p / t) * 100) : 0;
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
