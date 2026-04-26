import Link from "next/link";

import type { Application } from "@prisma/client";

import { deleteApplication } from "@/features/applications/actions/delete-application";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type ApplicationTableProps = {
  applications: Application[];
};

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function ApplicationTable({ applications }: ApplicationTableProps) {
  if (applications.length === 0) {
    return (
      <Card className="space-y-4 border-dashed bg-slate-50/80 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          No applications found
        </h2>
        <p className="text-sm text-slate-600">
          Add a new application or clear your filters to broaden the dashboard.
        </p>
        <div>
          <Link
            href="/applications/new"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold !text-white shadow-sm transition hover:bg-slate-800"
          >
            Add application
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-6 py-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Applications
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Your recently added job applications.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created at
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {applications.map((application) => (
              <tr key={application.id} className="transition hover:bg-slate-50/80">
                <td className="px-6 py-5 text-sm font-semibold text-slate-950">
                  {application.company}
                </td>
                <td className="px-6 py-5 text-sm font-medium text-slate-700">
                  {application.roleTitle}
                </td>
                <td className="px-6 py-5 text-sm text-slate-700">
                  <StatusBadge status={application.status} />
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {formatDate(application.dateApplied)}
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {formatDate(application.createdAt)}
                </td>
                <td className="px-6 py-5 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/applications/${application.id}/edit`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <form action={deleteApplication.bind(null, application.id)}>
                      <button
                        type="submit"
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
