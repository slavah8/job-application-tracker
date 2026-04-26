import type { ApplicationStatusValue } from "@/features/applications/lib/application-status";

export type ApplicationFilters = {
  q?: string;
  status?: ApplicationStatusValue | "ALL";
};

export const DEFAULT_APPLICATION_FILTERS: ApplicationFilters = {
  q: "",
  status: "ALL",
};
