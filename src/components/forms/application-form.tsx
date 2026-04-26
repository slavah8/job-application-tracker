"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createApplication } from "@/features/applications/actions/create-application";
import {
  getInitialApplicationActionState,
} from "@/features/applications/actions/create-application-state";
import { updateApplication } from "@/features/applications/actions/update-application";
import { APPLICATION_STATUSES } from "@/features/applications/lib/application-status";
import type { ApplicationFormValues } from "@/features/applications/validations/application-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApplicationFormProps = {
  initialValues?: Partial<ApplicationFormValues>;
  mode?: "create" | "edit";
  applicationId?: string;
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  const label = mode === "edit" ? "Update application" : "Save application";

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function ApplicationForm({
  initialValues,
  mode = "create",
  applicationId,
}: ApplicationFormProps) {
  const initialState = getInitialApplicationActionState(initialValues);
  const selectedAction =
    mode === "edit" && applicationId
      ? updateApplication.bind(null, applicationId)
      : createApplication;
  const [state, formAction] = useActionState(
    selectedAction,
    initialState,
  );
  const values = state?.values ?? initialState.values;
  const errors = state?.errors ?? {};
  const message = state?.message;
  const title = mode === "edit" ? "Edit application" : "New application";
  const description =
    mode === "edit"
      ? "Update the details for this saved job application."
      : "Add one job application manually. We'll build editing and tracking views next.";

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      {message ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="company"
            className="text-sm font-medium text-slate-700"
          >
            Company
          </label>
          <Input
            id="company"
            name="company"
            placeholder="Acme Inc."
            defaultValue={values.company}
          />
          {errors.company ? (
            <p className="text-sm text-rose-600">{errors.company[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="roleTitle"
            className="text-sm font-medium text-slate-700"
          >
            Role title
          </label>
          <Input
            id="roleTitle"
            name="roleTitle"
            placeholder="Frontend Developer"
            defaultValue={values.roleTitle}
          />
          {errors.roleTitle ? (
            <p className="text-sm text-rose-600">{errors.roleTitle[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="applicationLink"
            className="text-sm font-medium text-slate-700"
          >
            Application link
          </label>
          <Input
            id="applicationLink"
            name="applicationLink"
            type="url"
            placeholder="https://company.com/jobs/123"
            defaultValue={values.applicationLink}
          />
          {errors.applicationLink ? (
            <p className="text-sm text-rose-600">
              {errors.applicationLink[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="dateApplied"
            className="text-sm font-medium text-slate-700"
          >
            Date applied
          </label>
          <Input
            id="dateApplied"
            name="dateApplied"
            type="date"
            defaultValue={values.dateApplied}
          />
          {errors.dateApplied ? (
            <p className="text-sm text-rose-600">
              {errors.dateApplied[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium text-slate-700"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.status ? (
            <p className="text-sm text-rose-600">{errors.status[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={5}
            defaultValue={values.notes}
            placeholder="Add any notes about the role, recruiter, or timeline."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          {errors.notes ? (
            <p className="text-sm text-rose-600">{errors.notes[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
