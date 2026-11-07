"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <div className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {action}
        </div>
      )}
      <div className={title ? "p-5" : "p-5"}>{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone = "indigo" }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; tone?: "indigo" | "emerald" | "amber" | "rose" | "sky" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && <span className={cx("rounded-lg p-2", tones[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const BADGE: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  gray: "bg-slate-100 text-slate-700 ring-slate-500/20",
};
export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: keyof typeof BADGE }) {
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", BADGE[color])}>{children}</span>;
}

export function Button({ variant = "primary", size = "md", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  const v = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300",
    secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }[variant];
  const s = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  return <button className={cx("inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed", v, s, className)} {...props} />;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-16" onMouseDown={onClose}>
      <div className={cx("w-full rounded-xl bg-white shadow-xl", wide ? "max-w-3xl" : "max-w-lg")} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx("rounded-md px-3 py-1.5 text-sm font-medium transition", value === o.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cx("whitespace-nowrap px-3 py-2.5 text-slate-700", className)}>{children}</td>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</div>;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 55% 50%)` }}
    >
      {initials}
    </span>
  );
}

export function Progress({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "emerald" | "amber" | "rose" }) {
  const c = { indigo: "bg-indigo-500", emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cx("h-full rounded-full", c)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
