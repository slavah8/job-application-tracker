import { z } from "zod";

import { APPLICATION_STATUSES } from "@/features/applications/lib/application-status";

export const applicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required."),
  roleTitle: z.string().trim().min(1, "Role title is required."),
  applicationLink: z
    .union([
      z.literal(""),
      z.string().trim().url("Application link must be a valid URL."),
    ])
    .transform((value) => value || undefined),
  dateApplied: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date applied must use YYYY-MM-DD."),
    ])
    .transform((value) => value || undefined),
  status: z.enum(APPLICATION_STATUSES).default("SAVED"),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

export type ApplicationFormValues = z.input<typeof applicationSchema>;
export type ValidatedApplicationValues = z.output<typeof applicationSchema>;

export function getApplicationFormValues(formData: FormData): ApplicationFormValues {
  return {
    company: String(formData.get("company") ?? ""),
    roleTitle: String(formData.get("roleTitle") ?? ""),
    applicationLink: String(formData.get("applicationLink") ?? ""),
    dateApplied: String(formData.get("dateApplied") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    status: String(formData.get("status") ?? "SAVED") as ApplicationFormValues["status"],
  };
}
