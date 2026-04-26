"use server";

import { redirect } from "next/navigation";

import { deleteApplicationRecord } from "@/features/applications/db/application.mutations";

export async function deleteApplication(id: string) {
  await deleteApplicationRecord(id);
  redirect("/?deleted=1");
}
