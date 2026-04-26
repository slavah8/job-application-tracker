import type { Email } from "@prisma/client";

import type { EmailMessage } from "@/features/email/domain/email-message";
import { sanitizeEmailPreview } from "@/features/email/lib/sanitize-email-preview";
import { prisma } from "@/lib/prisma";

export type EmailPreviewItem = Pick<
  Email,
  | "id"
  | "provider"
  | "providerMessageId"
  | "subject"
  | "fromAddress"
  | "bodyPreview"
  | "receivedAt"
  | "applicationId"
>;

const mockEmails: EmailPreviewItem[] = [
  {
    id: "mock-email-1",
    provider: "YAHOO",
    providerMessageId: "mock-email-1",
    subject: "Thanks for applying to Frontend Engineer",
    fromAddress: "careers@example.com",
    bodyPreview: "We received your application and will review it soon.",
    receivedAt: new Date("2026-04-24T14:20:00"),
    applicationId: null,
  },
  {
    id: "mock-email-2",
    provider: "YAHOO",
    providerMessageId: "mock-email-2",
    subject: "Interview availability",
    fromAddress: "recruiting@example.com",
    bodyPreview: "Could you share a few times that work for a first conversation?",
    receivedAt: new Date("2026-04-23T10:05:00"),
    applicationId: null,
  },
  {
    id: "mock-email-3",
    provider: "YAHOO",
    providerMessageId: "mock-email-3",
    subject: "Application update",
    fromAddress: "jobs@example.com",
    bodyPreview: "Thank you for your interest. We wanted to share an update.",
    receivedAt: new Date("2026-04-22T16:45:00"),
    applicationId: null,
  },
  {
    id: "mock-email-4",
    provider: "YAHOO",
    providerMessageId: "mock-email-4",
    subject: "Yahoo account app password generated",
    fromAddress: "account-security-noreply@cc.yahoo-inc.com",
    bodyPreview: "A third-party app password was generated for your Yahoo account.",
    receivedAt: new Date("2026-04-21T09:30:00"),
    applicationId: null,
  },
];

export function getMockEmails(): EmailPreviewItem[] {
  return mockEmails.map((email) => ({
    ...email,
    bodyPreview: sanitizeEmailPreview(email.bodyPreview),
  }));
}

export async function getEmails(limit = 10): Promise<EmailPreviewItem[]> {
  const emails = await prisma.email.findMany({
    orderBy: {
      receivedAt: "desc",
    },
    take: limit,
  });

  return emails.map((email) => ({
    ...email,
    bodyPreview: sanitizeEmailPreview(email.bodyPreview),
  }));
}

export async function upsertEmails(messages: EmailMessage[]) {
  await Promise.all(
    messages.map((message) => {
      const bodyPreview = sanitizeEmailPreview(message.bodyPreview);

      return prisma.email.upsert({
        where: {
          providerMessageId: message.providerMessageId,
        },
        update: {
          subject: message.subject,
          fromAddress: message.fromAddress,
          bodyPreview,
          receivedAt: message.receivedAt,
        },
        create: {
          provider: message.provider,
          providerMessageId: message.providerMessageId,
          subject: message.subject,
          fromAddress: message.fromAddress,
          bodyPreview,
          receivedAt: message.receivedAt,
        },
      });
    }),
  );

  return messages.length;
}
