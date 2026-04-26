export type EmailMessage = {
  providerMessageId: string;
  threadId?: string;
  fromAddress: string;
  toAddress?: string;
  subject: string;
  snippet?: string;
  receivedAt: Date;
  rawMetadata?: Record<string, unknown>;
};
