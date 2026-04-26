import type { ApplicationFormValues } from "@/features/applications/validations/application-schema";

export type ApplicationActionState = {
  errors: Partial<Record<keyof ApplicationFormValues, string[]>>;
  message?: string;
  values: ApplicationFormValues;
};

export function getInitialApplicationActionState(
  values?: Partial<ApplicationFormValues>,
): ApplicationActionState {
  return {
    errors: {},
    message: undefined,
    values: {
      company: values?.company ?? "",
      roleTitle: values?.roleTitle ?? "",
      applicationLink: values?.applicationLink ?? "",
      dateApplied: values?.dateApplied ?? "",
      notes: values?.notes ?? "",
      status: values?.status ?? "SAVED",
    },
  };
}

export const initialCreateApplicationState = getInitialApplicationActionState();
