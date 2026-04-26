"use server";

import { redirect } from "next/navigation";

import type { ApplicationActionState } from "@/features/applications/actions/create-application-state";
import {
  insertApplicationStatusHistory,
  updateApplicationRecord,
} from "@/features/applications/db/application.mutations";
import { getApplicationById } from "@/features/applications/db/application.queries";
import {
  applicationSchema,
  getApplicationFormValues,
} from "@/features/applications/validations/application-schema";

export async function updateApplication(
  id: string,
  _previousState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const values = getApplicationFormValues(formData);
  const parsedValues = applicationSchema.safeParse(values);
  const existingApplication = await getApplicationById(id);

  if (!existingApplication) {
    redirect("/");
  }

  if (!parsedValues.success) {
    return {
      errors: parsedValues.error.flatten().fieldErrors,
      message: "Please fix the highlighted fields and try again.",
      values,
    } satisfies ApplicationActionState;
  }

  const { company, roleTitle, applicationLink, dateApplied, notes, status } =
    parsedValues.data;

  await updateApplicationRecord(id, {
    company,
    roleTitle,
    applicationLink,
    dateApplied: dateApplied ? new Date(dateApplied) : null,
    notes,
    status,
  });

  if (existingApplication.status !== status) {
    await insertApplicationStatusHistory({
      applicationId: id,
      previousStatus: existingApplication.status,
      newStatus: status,
      reason: "Updated manually from the edit form.",
    });
  }

  redirect("/?updated=1");
}
