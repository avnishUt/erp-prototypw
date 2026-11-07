import type {
  LeaveRequest,
  StaffBook,
  SubmissionLog,
  AttendanceBook,
  ClassGroup,
  Doubt,
  Enquiry,
  Exam,
  FeePayment,
  MarksBook,
  Notice,
  Period,
  Student,
  Teacher,
} from "./types";

// Deterministic PRNG so the mock data is stable across reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

export const TODAY = new Date().toISOString().slice(0, 10);
export function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysAhead(n: number) {
  return daysAgo(-n);
}

export const INSTITUTE = {
  name: "Vidya Bharati Public School",
  tagline: "CBSE Affiliated · Classes 8–10",
  session: "2026–27",
  city: "Noida, UP",
};

export const teachers: Teacher[] = [
  { id: "t1", name: "Priya Sharma", subjects: ["Mathematics"], phone: "98110 22301", email: "priya@vbps.edu.in" },
  { id: "t2", name: "Rahul Verma", subjects: ["Physics", "Science"], phone: "98110 22302", email: "rahul@vbps.edu.in" },
  { id: "t3", name: "Anjali Gupta", subjects: ["Chemistry"], phone: "98110 22303", email: "anjali@vbps.edu.in" },
  { id: "t4", name: "Suresh Iyer", subjects: ["Biology"], phone: "98110 22304", email: "suresh@vbps.edu.in" },
  { id: "t5", name: "Meena Kapoor", subjects: ["English"], phone: "98110 22305", email: "meena@vbps.edu.in" },
  { id: "t6", name: "Vikram Singh", subjects: ["Social Science", "Hindi"], phone: "98110 22306", email: "vikram@vbps.edu.in" },
];

export const classes: ClassGroup[] = [
  { id: "c9a", name: "Class 9-A", kind: "school", classTeacherId: "t5", subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Social Science"], room: "R-101" },
  { id: "c10a", name: "Class 10-A", kind: "school", classTeacherId: "t1", subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Social Science"], room: "R-102" },
  { id: "c10b", name: "Class 10-B", kind: "school", classTeacherId: "t3", subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Social Science"], room: "R-103" },
  { id: "c8a", name: "Class 8-A", kind: "school", classTeacherId: "t6", subjects: ["Mathematics", "Science", "English", "Social Science", "Hindi"], room: "R-104" },
];

export const subjectTeacher: Record<string, string> = {
  Mathematics: "t1",
  Physics: "t2",
  Chemistry: "t3",
  Biology: "t4",
  English: "t5",
  "Social Science": "t6",
  Science: "t2",
  Hindi: "t6",
};

export const TOPICS: Record<string, string[]> = {
  Mathematics: ["Quadratic Equations", "Trigonometry", "Polynomials", "Probability", "Coordinate Geometry"],
  Physics: ["Motion", "Force & Laws of Motion", "Work & Energy", "Electricity", "Light – Reflection"],
  Chemistry: ["Atoms & Molecules", "Chemical Reactions", "Acids, Bases & Salts", "Carbon Compounds", "Periodic Classification"],
  Biology: ["The Cell", "Tissues", "Life Processes", "Heredity", "Our Environment"],
  Science: ["Crop Production", "Microorganisms", "Force & Pressure", "Friction", "Cell Structure"],
  Hindi: ["व्याकरण (Grammar)", "गद्य (Prose)", "पद्य (Poetry)", "लेखन (Writing)"],
  English: ["Grammar", "Comprehension", "Literature", "Writing Skills"],
  "Social Science": ["History", "Geography", "Civics", "Economics"],
};

const FIRST = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Arjun", "Sai", "Reyansh", "Kabir", "Ananya", "Diya", "Aadhya", "Saanvi", "Myra", "Kiara", "Riya", "Navya", "Tanvi", "Rohan", "Karan", "Neha", "Pooja", "Yash", "Dev", "Meera"];
const LAST = ["Sharma", "Verma", "Gupta", "Singh", "Patel", "Reddy", "Nair", "Iyer", "Joshi", "Mehta", "Agarwal", "Khan", "Das", "Bose"];
export const FEE: Record<string, number> = { c8a: 66000, c9a: 72000, c10a: 78000, c10b: 78000 };

export const students: Student[] = [];
let sid = 1;
for (const c of classes) {
  for (let r = 1; r <= 12; r++) {
    const first = sid === 1 ? "Aarav" : pick(FIRST);
    const last = sid === 1 ? "Mehta" : pick(LAST);
    students.push({
      id: `s${sid}`,
      name: `${first} ${last}`,
      roll: r,
      classId: c.id,
      guardianName: `${pick(["Rajesh", "Sunil", "Amit", "Manoj", "Deepak", "Sanjay"])} ${last}`,
      phone: `9${Math.floor(100000000 + rand() * 899999999)}`.replace(/(\d{5})(\d{5})/, "$1 $2"),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${sid}@mail.com`,
      dob: `${c.id === "c8a" ? 2013 : c.id === "c9a" ? 2012 : 2011}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
      address: `${Math.floor(rand() * 400) + 1}, Sector ${Math.floor(rand() * 120) + 1}, Noida`,
      admissionDate: `2026-04-${String(1 + Math.floor(rand() * 20)).padStart(2, "0")}`,
      status: rand() > 0.04 ? "Active" : "Inactive",
      feeTotal: FEE[c.id],
    });
    sid++;
  }
}

// --- Attendance: last 20 school days (skip Sundays) ---
export const attendance: AttendanceBook = {};
for (let i = 1, count = 0; count < 20; i++) {
  const date = daysAgo(i);
  if (new Date(date).getDay() === 0) continue;
  count++;
  attendance[date] = {};
  for (const s of students) {
    const x = rand();
    attendance[date][s.id] = x > 0.12 ? "P" : x > 0.04 ? "A" : "L";
  }
}

// --- Fees: 1–3 installments paid per student ---
export const payments: FeePayment[] = [];
let rc = 1001;
for (const s of students) {
  const inst = s.feeTotal / 4;
  const paidCount = Math.floor(rand() * 4); // 0..3 of 4 installments
  for (let k = 0; k < paidCount; k++) {
    payments.push({
      id: `p${rc}`,
      studentId: s.id,
      amount: inst,
      date: daysAgo(150 - k * 45 - Math.floor(rand() * 10)),
      mode: pick(["UPI", "UPI", "Cash", "Card", "Bank Transfer"] as const),
      receiptNo: `VBPS/26/${rc}`,
    });
    rc++;
  }
}

// --- Exams & marks ---
export const exams: Exam[] = [
  { id: "e1", name: "Unit Test 1", classId: "c9a", date: daysAgo(60), maxMarks: 25 },
  { id: "e2", name: "Unit Test 1", classId: "c10a", date: daysAgo(60), maxMarks: 25 },
  { id: "e3", name: "Half-Yearly", classId: "c10a", date: daysAgo(20), maxMarks: 80 },
  { id: "e4", name: "Half-Yearly", classId: "c10b", date: daysAgo(20), maxMarks: 80 },
  { id: "e5", name: "Unit Test 2", classId: "c8a", date: daysAgo(9), maxMarks: 25 },
  { id: "e6", name: "Half-Yearly", classId: "c9a", date: daysAhead(6), maxMarks: 80 },
];
export const marks: MarksBook = {};
for (const e of exams) {
  if (e.date > TODAY) continue;
  const c = classes.find((x) => x.id === e.classId)!;
  marks[e.id] = {};
  for (const s of students.filter((x) => x.classId === c.id)) {
    marks[e.id][s.id] = {};
    for (const sub of c.subjects) {
      marks[e.id][s.id][sub] = Math.round(e.maxMarks * (0.4 + rand() * 0.58));
    }
  }
}

// --- Timetable ---
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const SLOTS = ["08:00", "08:50", "09:40", "10:50", "11:40", "12:30"];
export const timetable: Record<string, Period[]> = {};
for (const c of classes) timetable[c.id] = [];
// Clash-free: a teacher is never in two classes in the same period.
DAYS.forEach((day, di) => {
  SLOTS.forEach((_, slot) => {
    const busy = new Set<string>();
    classes.forEach((c, ci) => {
      const n = c.subjects.length;
      for (let k = 0; k < n; k++) {
        const subject = c.subjects[(di + slot * 2 + ci * 3 + k) % n];
        const teacherId = subjectTeacher[subject];
        if (busy.has(teacherId)) continue;
        busy.add(teacherId);
        timetable[c.id].push({ day, slot, subject, teacherId });
        return;
      }
      timetable[c.id].push({ day, slot, subject: "Library", teacherId: "" });
    });
  });
});

// --- Notices ---
export const notices: Notice[] = [
  { id: "n1", title: "Half-Yearly exams for Class 9 start next week", body: "Date sheet has been shared with class teachers. Students must carry their admit cards. Syllabus: chapters 1–7 for all subjects.", date: daysAgo(1), audience: "All", author: "Principal's Office", pinned: true },
  { id: "n2", title: "Annual Science Exhibition – entries open", body: "Students of Classes 8–10 can register their projects with their science teacher by Friday. Exhibition on 28th in the school auditorium.", date: daysAgo(2), audience: "Students", author: "Rahul Verma" },
  { id: "n3", title: "Parent–Teacher Meeting on Saturday", body: "PTM for Classes 9 and 10 from 10 AM to 1 PM. Please collect the half-yearly progress report from the class teacher.", date: daysAgo(3), audience: "Parents", author: "Principal's Office" },
  { id: "n4", title: "Second fee installment due by 15th", body: "A late fee of ₹50/day applies after the due date. Pay online via UPI from the Fees section or at the accounts desk.", date: daysAgo(5), audience: "Parents", author: "Accounts" },
  { id: "n5", title: "Staff meeting – syllabus review", body: "All teachers to submit chapter-wise completion status before Friday's meeting.", date: daysAgo(6), audience: "Teachers", author: "Academic Coordinator" },
];

// --- Admission enquiries ---
export const enquiries: Enquiry[] = [
  { id: "q1", name: "Harsh Malhotra", phone: "98765 11001", course: "Class 9 Admission", source: "Website", status: "New", followUp: daysAhead(1), notes: "Transferring from Delhi, needs TC process info.", createdAt: daysAgo(0) },
  { id: "q2", name: "Sneha Rao", phone: "98765 11002", course: "Class 8 Admission", source: "Instagram", status: "Contacted", followUp: TODAY, notes: "Asked about sibling fee concession.", createdAt: daysAgo(2) },
  { id: "q3", name: "Aditya Kulkarni", phone: "98765 11003", course: "Class 6 Admission", source: "Referral", status: "Demo Scheduled", followUp: daysAhead(2), notes: "School visit & entrance test – Sat 11 AM.", createdAt: daysAgo(4) },
  { id: "q4", name: "Pallavi Jain", phone: "98765 11004", course: "Class 9 Admission", source: "Walk-in", status: "Converted", followUp: daysAgo(3), notes: "Admission done, fees paid (1st inst.).", createdAt: daysAgo(9) },
  { id: "q5", name: "Mohit Saxena", phone: "98765 11005", course: "Class 7 Admission", source: "Google Ads", status: "Lost", followUp: daysAgo(5), notes: "Chose a school closer to home – transport concern.", createdAt: daysAgo(12) },
  { id: "q6", name: "Ritika Bansal", phone: "98765 11006", course: "Class 8 Admission", source: "Website", status: "Contacted", followUp: daysAhead(3), notes: "Parent will visit on weekend.", createdAt: daysAgo(3) },
  { id: "q7", name: "Farhan Ali", phone: "98765 11007", course: "Class 10 Admission", source: "Referral", status: "New", followUp: TODAY, notes: "", createdAt: daysAgo(1) },
];

// --- Doubts ---
const iso = (d: number, h = 10) => `${daysAgo(d)}T${String(h).padStart(2, "0")}:15:00`;
export const doubts: Doubt[] = [
  {
    id: "d1", studentId: "s1", classId: "c9a", subject: "Mathematics", topic: "Quadratic Equations",
    title: "Why does the discriminant decide the nature of roots?",
    description: "In x² + 4x + 5 = 0 the discriminant is negative. I understand the formula, but why does b² − 4ac < 0 mean there are no real roots?",
    status: "Answered", assignedTeacherId: "t1", createdAt: iso(2, 18),
    replies: [
      { id: "r1", authorName: "Priya Sharma", authorRole: "teacher", text: "Great question! In the quadratic formula the term √(b² − 4ac) appears. If b² − 4ac is negative, you'd be taking the square root of a negative number, which isn't a real number. Graphically, the parabola y = x² + 4x + 5 never touches the x-axis — its lowest point is at (−2, 1).", at: iso(1, 9) },
    ],
    upvotes: ["s5", "s7"],
  },
  {
    id: "d2", studentId: "s1", classId: "c9a", subject: "Physics", topic: "Laws of Motion",
    title: "Action–reaction forces cancel each other?",
    description: "If every action has an equal and opposite reaction, why don't the forces cancel and why does anything move at all?",
    status: "Open", assignedTeacherId: "t2", createdAt: iso(0, 8), replies: [], upvotes: ["s3"],
  },
  {
    id: "d3", studentId: "s26", classId: "c10b", subject: "Chemistry", topic: "Chemical Reactions",
    title: "How do I balance Fe + H₂O → Fe₃O₄ + H₂?",
    description: "I keep getting different numbers on both sides. Is there a step-by-step method for balancing equations?",
    status: "Resolved", assignedTeacherId: "t3", createdAt: iso(5, 20),
    replies: [
      { id: "r2", authorName: "Anjali Gupta", authorRole: "teacher", text: "Use the hit-and-trial method: start with the compound having the most atoms (Fe₃O₄). Put 3 before Fe and 4 before H₂O to balance Fe and O. Now there are 8 H on the left, so put 4 before H₂. Final: 3Fe + 4H₂O → Fe₃O₄ + 4H₂.", at: iso(4, 11), accepted: true },
      { id: "r3", authorName: "Student", authorRole: "student", text: "Got it, thank you ma'am!", at: iso(4, 12) },
    ],
    upvotes: ["s27", "s29", "s30"], rating: 5,
  },
  {
    id: "d4", studentId: "s28", classId: "c10b", subject: "Mathematics", topic: "Trigonometry",
    title: "Why is sin²θ + cos²θ = 1 always true?",
    description: "Ma'am used it in every question today. I can memorise it but I want to understand where it comes from.",
    status: "Open", assignedTeacherId: "t1", createdAt: iso(1, 21), replies: [], upvotes: [],
  },
  {
    id: "d5", studentId: "s40", classId: "c8a", subject: "Science", topic: "Microorganisms",
    title: "Are all bacteria harmful?",
    description: "The chapter says bacteria cause diseases but also says curd is made by bacteria. How can both be true?",
    status: "Open", assignedTeacherId: "t2", createdAt: iso(3, 17), replies: [], upvotes: ["s41", "s42", "s44", "s45"],
  },
];

// ---------- Staff attendance (last 20 working days + today) ----------

export const WORKDAYS = Object.keys(attendance).sort(); // past working days, oldest first
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const staffAttendance: StaffBook = {};
for (const date of WORKDAYS) {
  staffAttendance[date] = {};
  for (const t of teachers) {
    const x = rand();
    if (x < 0.03) staffAttendance[date][t.id] = { leave: true };
    else if (x < 0.05) staffAttendance[date][t.id] = {}; // absent without leave
    else {
      const late = x > 0.88;
      const inM = late ? 466 + Math.floor(rand() * 25) : 445 + Math.floor(rand() * 20); // 07:25–07:45 or 07:46–08:10
      const halfDay = rand() < 0.03;
      const outM = halfDay ? 680 + Math.floor(rand() * 20) : 870 + Math.floor(rand() * 55); // ~11:20 or 14:30–15:25
      staffAttendance[date][t.id] = { in: hm(inM), out: hm(outM), method: rand() > 0.3 ? "Mobile app (GPS)" : "Biometric" };
    }
  }
}
// Today: a realistic morning in progress. You (Priya, t1) haven't checked in yet.
staffAttendance[TODAY] = {
  t2: { in: "07:32", method: "Mobile app (GPS)" },
  t3: { in: "07:38", method: "Biometric" },
  t4: { in: "07:41", method: "Mobile app (GPS)" },
  t5: { in: "07:53", method: "Mobile app (GPS)" },
  t6: { leave: true },
};

export const leaves: LeaveRequest[] = [
  { id: "l1", teacherId: "t6", from: TODAY, to: TODAY, type: "Casual", reason: "Family function", status: "Approved", appliedOn: daysAgo(3) },
  { id: "l2", teacherId: "t4", from: daysAhead(3), to: daysAhead(4), type: "Medical", reason: "Dental surgery", status: "Pending", appliedOn: daysAgo(1) },
  { id: "l3", teacherId: "t2", from: daysAgo(12), to: daysAgo(12), type: "Earned", reason: "Personal work", status: "Approved", appliedOn: daysAgo(16) },
  { id: "l4", teacherId: "t1", from: daysAgo(25), to: daysAgo(25), type: "Casual", reason: "Bank work", status: "Approved", appliedOn: daysAgo(27) },
];

// ---------- Student attendance submission log ----------
export const submissions: SubmissionLog = {};
for (const date of WORKDAYS) {
  submissions[date] = {};
  for (const c of classes) {
    const t = teachers.find((x) => x.id === c.classTeacherId)!;
    const absent = students.filter((s) => s.classId === c.id && attendance[date][s.id] === "A").length;
    submissions[date][c.id] = { by: t.name, at: hm(482 + Math.floor(rand() * 12)), smsSent: absent };
  }
}
// Today: 9-A and 10-B already submitted; 10-A (yours) and 8-A still pending.
attendance[TODAY] = {};
submissions[TODAY] = {};
for (const cid of ["c9a", "c10b"]) {
  const c = classes.find((x) => x.id === cid)!;
  let absent = 0;
  for (const s of students.filter((x) => x.classId === cid)) {
    const m = s.id === "s1" ? "P" : rand() > 0.1 ? "P" : "A";
    if (m === "A") absent++;
    attendance[TODAY][s.id] = m;
  }
  submissions[TODAY][cid] = { by: teachers.find((t) => t.id === c.classTeacherId)!.name, at: cid === "c9a" ? "08:06" : "08:11", smsSent: absent };
}
