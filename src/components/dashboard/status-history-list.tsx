import type { ApplicationStatusHistory } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type StatusHistoryListProps = {
  history: ApplicationStatusHistory[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function StatusHistoryList({ history }: StatusHistoryListProps) {
  if (history.length === 0) {
    return (
      <Card className="space-y-2 bg-slate-50/70">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Status history
        </h2>
        <p className="text-sm text-slate-600">
          No status changes have been recorded yet.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Status history
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          A simple timeline of how this application status changed.
        </p>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              {entry.previousStatus ? (
                <StatusBadge status={entry.previousStatus} />
              ) : (
                <span className="rounded-full bg-slate-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Start
                </span>
              )}
              <span className="text-sm font-medium text-slate-400">to</span>
              <StatusBadge status={entry.newStatus} />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {entry.reason ?? "No reason provided."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {formatDate(entry.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
