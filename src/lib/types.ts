export type Role = "admin" | "teacher" | "student" | "parent";

export type ClassKind = "school" | "coaching";

export interface ClassGroup {
  id: string;
  name: string; // "Class 10-A" or "JEE 2027 – Batch A"
  kind: ClassKind;
  classTeacherId: string;
  subjects: string[];
  room: string;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  phone: string;
  email: string;
}

export interface Student {
  id: string;
  name: string;
  roll: number;
  classId: string;
  guardianName: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
  admissionDate: string;
  status: "Active" | "Inactive";
  feeTotal: number;
}

export type AttendanceMark = "P" | "A" | "L";
/** date (YYYY-MM-DD) -> studentId -> mark */
export type AttendanceBook = Record<string, Record<string, AttendanceMark>>;

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  mode: "Cash" | "UPI" | "Card" | "Bank Transfer";
  receiptNo: string;
}

export interface Exam {
  id: string;
  name: string;
  classId: string;
  date: string;
  maxMarks: number;
}

/** examId -> studentId -> subject -> marks */
export type MarksBook = Record<string, Record<string, Record<string, number>>>;

export interface Notice {
  id: string;
  title: string;
  body: string;
  date: string;
  audience: "All" | "Students" | "Parents" | "Teachers";
  author: string;
  pinned?: boolean;
}

export type EnquiryStatus = "New" | "Contacted" | "Demo Scheduled" | "Converted" | "Lost";

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  course: string;
  source: "Walk-in" | "Website" | "Referral" | "Instagram" | "Google Ads";
  status: EnquiryStatus;
  followUp: string;
  notes: string;
  createdAt: string;
}

export type DoubtStatus = "Open" | "Answered" | "Resolved";

export interface DoubtReply {
  id: string;
  authorName: string;
  authorRole: Role;
  text: string;
  at: string;
  accepted?: boolean;
}

export interface Doubt {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  topic: string;
  title: string;
  description: string;
  imageDataUrl?: string;
  status: DoubtStatus;
  assignedTeacherId: string;
  createdAt: string;
  replies: DoubtReply[];
  upvotes: string[]; // student ids
  rating?: number; // 1-5 given by student after resolution
}

export interface Period {
  day: string;
  slot: number;
  subject: string;
  teacherId: string;
}

// ---------- Staff (teacher) attendance ----------
export interface StaffDay {
  in?: string; // "HH:MM"
  out?: string; // "HH:MM"
  leave?: boolean;
  method?: "Mobile app (GPS)" | "Biometric" | "Admin entry";
}
/** date -> teacherId -> record */
export type StaffBook = Record<string, Record<string, StaffDay>>;

export interface LeaveRequest {
  id: string;
  teacherId: string;
  from: string;
  to: string;
  type: "Casual" | "Medical" | "Earned";
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
}

/** Who submitted a class's student attendance and when. date -> classId -> entry */
export interface AttendanceSubmission {
  by: string; // teacher name
  at: string; // "HH:MM"
  smsSent: number;
}
export type SubmissionLog = Record<string, Record<string, AttendanceSubmission>>;
