import type { EmailAccountConnection } from "@/features/email-sync/domain/email-account";
import type { EmailMessage } from "@/features/email-sync/domain/email-message";

export interface EmailSyncAdapter {
  connect(account: EmailAccountConnection): Promise<void>;
  syncMessages(): Promise<EmailMessage[]>;
  disconnect(): Promise<void>;
}
