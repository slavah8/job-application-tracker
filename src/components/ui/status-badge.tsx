import type { ApplicationStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: ApplicationStatus;
  className?: string;
};

const statusStyles: Record<ApplicationStatus, string> = {
  SAVED: "bg-slate-100 text-slate-800 ring-slate-300",
  APPLIED: "bg-blue-100 text-blue-800 ring-blue-300",
  OA: "bg-purple-100 text-purple-800 ring-purple-300",
  INTERVIEW: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  REJECTED: "bg-red-100 text-red-800 ring-red-300",
  OFFER: "bg-amber-100 text-amber-900 ring-amber-300",
};

const dotStyles: Record<ApplicationStatus, string> = {
  SAVED: "bg-slate-500",
  APPLIED: "bg-blue-600",
  OA: "bg-purple-600",
  INTERVIEW: "bg-emerald-600",
  REJECTED: "bg-red-600",
  OFFER: "bg-amber-500",
};

const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  OA: "OA",
  INTERVIEW: "Interview",
  REJECTED: "Rejected",
  OFFER: "Offer",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "gap-1.5 whitespace-nowrap px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 shadow-sm",
        statusStyles[status],
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotStyles[status])} />
      {statusLabels[status]}
    </Badge>
  );
}
