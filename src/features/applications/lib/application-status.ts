export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
] as const;

export type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number];
