import Link from "next/link";

import { SearchInput } from "@/components/dashboard/search-input";
import { APPLICATION_STATUSES } from "@/features/applications/lib/application-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FilterBarProps = {
  q?: string;
  status?: string;
};

export function FilterBar({ q = "", status = "ALL" }: FilterBarProps) {
  const hasActiveFilters = q.trim() !== "" || status !== "ALL";

  return (
    <Card className="space-y-5 bg-slate-50/60">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Find applications
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Narrow the dashboard by keyword or application status.
        </p>
      </div>

      <form action="/" className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="ALL">All statuses</option>
            {APPLICATION_STATUSES.map((applicationStatus) => (
              <option key={applicationStatus} value={applicationStatus}>
                {applicationStatus}
              </option>
            ))}
          </select>
        </div>

        <SearchInput defaultValue={q} />

        <Button type="submit">Apply</Button>

        {hasActiveFilters ? (
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Clear
          </Link>
        ) : null}
      </form>
    </Card>
  );
}
