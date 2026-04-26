import Link from "next/link";

import { ApplicationForm } from "@/components/forms/application-form";

export default function NewApplicationPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
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
          Add a new application
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Start by saving the core details for one job application.
        </p>
      </div>

      <ApplicationForm mode="create" />
    </main>
  );
}
