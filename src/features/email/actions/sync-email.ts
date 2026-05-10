"use server";

import { revalidatePath } from "next/cache";

import { syncRecentEmails } from "@/features/email/services/email-service";

function logYahooSync(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[YahooSync] ${message}`);
  }
}

export async function syncYahooEmails(
  previousState: {
    message?: string;
    error?: string;
  },
): Promise<{
  message?: string;
  error?: string;
}> {
  void previousState;

  const startedAt = Date.now();
  logYahooSync("Server action started.");

  // This is the only user-triggered live Yahoo IMAP fetch. Keeping it out of
  // dashboard render prevents slow inbox connections from blocking page load.
  const result = await syncRecentEmails();

  revalidatePath("/");

  logYahooSync(`Server action finished in ${Date.now() - startedAt}ms.`);

  if (result.error) {
    return {
      error: result.error,
    };
  }

  const createdText = result.autoCreatedCount
    ? ` Created ${result.autoCreatedCount} new applications.`
    : "";

  return {
    message: `Synced ${result.scannedCount} recent Yahoo emails.${createdText}`,
  };
}
