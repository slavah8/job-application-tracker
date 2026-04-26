import type { EmailMessage } from "@/features/email/domain/email-message";

export type EmailSyncAdapter = {
  fetchRecentMessages(limit?: number): Promise<EmailMessage[]>;
};
