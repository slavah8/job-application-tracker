import Link from "next/link";

import { ApplicationSummary } from "@/components/dashboard/application-summary";
import { ApplicationTable } from "@/components/dashboard/application-table";
import { EmailPreview } from "@/components/dashboard/email-preview";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { Card } from "@/components/ui/card";
import { getApplications } from "@/features/applications/db/application.queries";
import type { ApplicationFilters } from "@/features/applications/lib/application-filters";
import { APPLICATION_STATUSES } from "@/features/applications/lib/application-status";

type DashboardPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const wasCreated = resolvedSearchParams?.created === "1";
  const wasUpdated = resolvedSearchParams?.updated === "1";
  const wasDeleted = resolvedSearchParams?.deleted === "1";
  const requestedStatus = resolvedSearchParams?.status;
  const status =
    requestedStatus && [...APPLICATION_STATUSES, "ALL"].includes(requestedStatus)
      ? (requestedStatus as ApplicationFilters["status"])
      : "ALL";
  const q = resolvedSearchParams?.q ?? "";
  const applications = await getApplications({ q, status });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-7 bg-gradient-to-b from-slate-50 to-white px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Dashboard
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Job Application Tracker Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          View the applications you have added so far and keep building your
          tracker from here.
        </p>
      </div>

      {wasCreated ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Application created successfully.
        </div>
      ) : null}

      {wasUpdated ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Application updated successfully.
        </div>
      ) : null}

      {wasDeleted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Application deleted successfully.
        </div>
      ) : null}

      <Card className="space-y-4 bg-gradient-to-br from-slate-900 to-slate-700 text-white">
        <h2 className="text-lg font-semibold">Current status</h2>
        <p className="text-sm leading-6 text-slate-200">
          You can now create, edit, and delete applications from your tracker.
        </p>
        <div>
          <Link
            href="/applications/new"
            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold !text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            Add application
          </Link>
        </div>
      </Card>

      <ApplicationSummary applications={applications} />

      <FilterBar q={q} status={status} />

      <ApplicationTable applications={applications} />

      <EmailPreview />
    </main>
  );
}
