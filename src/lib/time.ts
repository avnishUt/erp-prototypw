import type { StaffDay } from "./types";

/** School attendance policy shown across the portal. */
export const POLICY = {
  reportBy: "07:45",
  graceMin: 5,
  schoolEnd: "14:30",
  fullDayHours: 7,
  halfDayBelowHours: 4,
  windowOpen: "07:50",
  windowClose: "08:30",
};

export const toMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;

export function fmtTime(hm?: string) {
  if (!hm) return "–";
  const [h, m] = hm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function fmtDur(mins: number) {
  if (mins <= 0) return "0h 0m";
  return `${Math.floor(mins / 60)}h ${String(Math.round(mins % 60)).padStart(2, "0")}m`;
}

export type StaffStatus = "Present" | "Late" | "Half Day" | "Absent" | "On Leave" | "Not checked in";

export function lateBy(rec?: StaffDay) {
  if (!rec?.in) return 0;
  return Math.max(0, toMin(rec.in) - toMin(POLICY.reportBy));
}

export function workedMin(rec: StaffDay | undefined, now?: string) {
  if (!rec?.in) return 0;
  const end = rec.out ?? now;
  if (!end) return 0;
  return Math.max(0, toMin(end) - toMin(rec.in));
}

export function staffStatus(rec: StaffDay | undefined, isToday: boolean): StaffStatus {
  if (rec?.leave) return "On Leave";
  if (!rec?.in) return isToday ? "Not checked in" : "Absent";
  if (rec.out && workedMin(rec) < POLICY.halfDayBelowHours * 60) return "Half Day";
  if (lateBy(rec) > POLICY.graceMin) return "Late";
  return "Present";
}

export const STATUS_COLOR: Record<StaffStatus, "green" | "amber" | "red" | "blue" | "gray" | "indigo"> = {
  Present: "green",
  Late: "amber",
  "Half Day": "indigo",
  Absent: "red",
  "On Leave": "blue",
  "Not checked in": "gray",
};
