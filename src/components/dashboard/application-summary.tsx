import type { Application, ApplicationStatus } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type ApplicationSummaryProps = {
  applications: Application[];
};

const trackedStatuses: Array<{
  label: string;
  status?: ApplicationStatus;
  accent: string;
}> = [
  { label: "Total applications", accent: "from-slate-100 to-white" },
  { label: "Applied", status: "APPLIED", accent: "from-blue-100 to-white" },
  {
    label: "Interview",
    status: "INTERVIEW",
    accent: "from-emerald-100 to-white",
  },
  { label: "Rejected", status: "REJECTED", accent: "from-red-100 to-white" },
  { label: "Offer", status: "OFFER", accent: "from-amber-100 to-white" },
];

export function ApplicationSummary({ applications }: ApplicationSummaryProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {trackedStatuses.map((item) => {
        const count = item.status
          ? applications.filter((application) => application.status === item.status)
              .length
          : applications.length;

        return (
          <Card
            key={item.label}
            className={`space-y-4 bg-gradient-to-br ${item.accent} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className="flex min-h-6 items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              {item.status ? <StatusBadge status={item.status} /> : null}
            </div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {count}
            </p>
          </Card>
        );
      })}
    </section>
  );
}
