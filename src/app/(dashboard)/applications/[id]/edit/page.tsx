import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusHistoryList } from "@/components/dashboard/status-history-list";
import { ApplicationForm } from "@/components/forms/application-form";
import { getApplicationById } from "@/features/applications/db/application.queries";

type EditApplicationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditApplicationPage({
  params,
}: EditApplicationPageProps) {
  const { id } = await params;
  const application = await getApplicationById(id);

  if (!application) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="mb-8 space-y-2">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Back to dashboard
        </Link>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Applications
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Edit application
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Update the details for this application.
        </p>
      </div>

      <ApplicationForm
        mode="edit"
        applicationId={application.id}
        initialValues={{
          company: application.company,
          roleTitle: application.roleTitle,
          applicationLink: application.applicationLink ?? "",
          dateApplied: application.dateApplied
            ? application.dateApplied.toISOString().slice(0, 10)
            : "",
          notes: application.notes ?? "",
          status: application.status,
        }}
      />

      <StatusHistoryList history={application.statusHistory} />
    </main>
  );
}
