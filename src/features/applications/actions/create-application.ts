"use server";

import { redirect } from "next/navigation";

import { insertApplication } from "@/features/applications/db/application.mutations";
import type { ApplicationActionState } from "@/features/applications/actions/create-application-state";
import {
  applicationSchema,
  getApplicationFormValues,
} from "@/features/applications/validations/application-schema";

export async function createApplication(
  _previousState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const values = getApplicationFormValues(formData);
  const parsedValues = applicationSchema.safeParse(values);

  if (!parsedValues.success) {
    return {
      errors: parsedValues.error.flatten().fieldErrors,
      message: "Please fix the highlighted fields and try again.",
      values,
    } satisfies ApplicationActionState;
  }

  const { company, roleTitle, applicationLink, dateApplied, notes, status } =
    parsedValues.data;

  await insertApplication({
    company,
    roleTitle,
    applicationLink,
    dateApplied: dateApplied ? new Date(dateApplied) : undefined,
    notes,
    status,
  });

  redirect("/?created=1");
}
