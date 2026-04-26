import { text as readStreamText } from "node:stream/consumers";

import { ImapFlow, type MessageStructureObject } from "imapflow";

import type { EmailSyncAdapter } from "@/features/email/adapters/types";
import type { EmailMessage } from "@/features/email/domain/email-message";
import { sanitizeEmailPreview } from "@/features/email/lib/sanitize-email-preview";

export const RECENT_EMAIL_FETCH_LIMIT = 50;
const BODY_PREVIEW_BYTES = 12_000;
const BODY_DOWNLOAD_TIMEOUT_MS = 5_000;

function logYahooSync(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[YahooSync] ${message}`);
  }
}

type YahooImapAdapterOptions = {
  emailAddress: string;
  appPassword: string;
};

type FetchedMessageMetadata = {
  uid: number;
  subject: string;
  fromAddress: string;
  receivedAt: Date;
  bodyStructure?: MessageStructureObject;
};

function formatFromAddress(
  from?: Array<{ name?: string; address?: string }>,
) {
  const sender = from?.[0];

  if (!sender) {
    return "Unknown sender";
  }

  if (sender.name && sender.address) {
    return `${sender.name} <${sender.address}>`;
  }

  return sender.address ?? sender.name ?? "Unknown sender";
}

function collectTextBodyParts(
  bodyStructure?: MessageStructureObject,
): Array<{ part: string; type: string }> {
  if (!bodyStructure) {
    return [];
  }

  const children = bodyStructure.childNodes ?? [];
  const isAttachment = bodyStructure.disposition?.toLowerCase() === "attachment";
  const type = bodyStructure.type.toLowerCase();
  const isTextPart =
    !isAttachment &&
    bodyStructure.part &&
    ["text/plain", "text/html"].includes(type);

  const currentPart = isTextPart
    ? [{ part: bodyStructure.part ?? "", type }]
    : [];

  return [
    ...currentPart,
    ...children.flatMap((child) => collectTextBodyParts(child)),
  ];
}

async function downloadBodyPreview(
  client: ImapFlow,
  uid: number,
  bodyStructure?: MessageStructureObject,
) {
  const bodyParts = collectTextBodyParts(bodyStructure).sort((a, b) => {
    if (a.type === b.type) {
      return 0;
    }

    return a.type === "text/plain" ? -1 : 1;
  });

  if (bodyParts.length === 0) {
    return null;
  }

  for (const bodyPart of bodyParts) {
    const { content } = await client.download(String(uid), bodyPart.part, {
      uid: true,
      maxBytes: BODY_PREVIEW_BYTES,
    });
    const preview = sanitizeEmailPreview(await readStreamText(content));

    if (preview) {
      return preview;
    }
  }

  return null;
}

async function downloadRawSourcePreview(client: ImapFlow, uid: number) {
  const { content } = await client.download(String(uid), undefined, {
    uid: true,
    maxBytes: BODY_PREVIEW_BYTES,
  });

  return sanitizeEmailPreview(await readStreamText(content));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export class YahooImapAdapter implements EmailSyncAdapter {
  private readonly emailAddress: string;
  private readonly appPassword: string;

  constructor(options: YahooImapAdapterOptions) {
    this.emailAddress = options.emailAddress;
    this.appPassword = options.appPassword;
  }

  async fetchRecentMessages(
    limit = RECENT_EMAIL_FETCH_LIMIT,
  ): Promise<EmailMessage[]> {
    const client = new ImapFlow({
      host: "imap.mail.yahoo.com",
      port: 993,
      secure: true,
      auth: {
        user: this.emailAddress,
        pass: this.appPassword,
      },
      logger: false,
    });

    try {
      logYahooSync("IMAP connect start.");
      await client.connect();
      logYahooSync("IMAP connect end.");

      logYahooSync("Inbox open start.");
      const mailbox = await client.mailboxOpen("INBOX", { readOnly: true });
      logYahooSync(`Inbox open end. messages discovered=${mailbox.exists}`);

      if (!mailbox.exists) {
        logYahooSync("Inbox is empty; fetched 0 messages.");
        return [];
      }

      const totalMessages = mailbox.exists;
      const endSeq = totalMessages;
      const startSeq = Math.max(1, endSeq - limit + 1);
      const range = `${startSeq}:${endSeq}`;
      const fetchedMessages: FetchedMessageMetadata[] = [];

      logYahooSync(`Fetch sequence range=${range}`);
      logYahooSync("IMAP fetch start.");

      for await (const message of client.fetch(range, {
        bodyStructure: true,
        envelope: true,
        uid: true,
      })) {
        const subject = message.envelope?.subject?.trim() || "(No subject)";
        const receivedAt = message.envelope?.date ?? new Date();

        fetchedMessages.push({
          uid: message.uid,
          subject,
          fromAddress: formatFromAddress(message.envelope?.from),
          receivedAt,
          bodyStructure: message.bodyStructure,
        });
      }

      logYahooSync(`IMAP messages fetched=${fetchedMessages.length}`);
      logYahooSync("IMAP fetch end.");

      const messages: EmailMessage[] = [];

      for (const message of fetchedMessages) {
        let bodyPreview = await withTimeout(
          downloadBodyPreview(client, message.uid, message.bodyStructure),
          BODY_DOWNLOAD_TIMEOUT_MS,
          `Body download timed out for uid=${message.uid}`,
        ).catch((cause) => {
          const message =
            cause instanceof Error ? cause.message : "Body download failed.";

          logYahooSync(message);

          return null;
        });

        if (!bodyPreview) {
          bodyPreview = await withTimeout(
            downloadRawSourcePreview(client, message.uid),
            BODY_DOWNLOAD_TIMEOUT_MS,
            `Raw source fallback timed out for uid=${message.uid}`,
          ).catch((cause) => {
            const message =
              cause instanceof Error
                ? cause.message
                : "Raw source fallback failed.";

            logYahooSync(message);

            return null;
          });
        }

        messages.push({
          provider: "YAHOO",
          providerMessageId: `yahoo:${message.uid}`,
          subject: message.subject,
          fromAddress: message.fromAddress,
          bodyPreview,
          receivedAt: message.receivedAt,
        });
      }

      return [...messages].reverse();
    } finally {
      await client.logout().catch(() => undefined);
    }
  }
}
