import type { DoubtStatus } from "./types";

export const statusColor: Record<DoubtStatus, "amber" | "blue" | "green"> = { Open: "amber", Answered: "blue", Resolved: "green" };
