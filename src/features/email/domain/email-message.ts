import type { EmailProvider } from "@prisma/client";

export type EmailMessage = {
  provider: EmailProvider;
  providerMessageId: string;
  subject: string;
  fromAddress: string;
  bodyPreview?: string | null;
  receivedAt: Date;
};
