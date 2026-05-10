import {
  getEmails,
  upsertEmails,
  type EmailPreviewItem,
} from "@/features/email/db/email.queries";
import { getApplications } from "@/features/applications/db/application.queries";
import {
  insertApplication,
  insertApplicationStatusHistory,
} from "@/features/applications/db/application.mutations";
import {
  RECENT_EMAIL_FETCH_LIMIT,
  YahooImapAdapter,
} from "@/features/email/adapters/yahoo-imap-adapter";
import {
  classifyEmail,
  type EmailClassification,
} from "@/features/email/services/email-classifier";
import {
  matchEmailToApplications,
  type EmailApplicationMatchResult,
} from "@/features/email/services/email-application-matcher";
import { extractApplicationFromEmail } from "@/features/email/services/email-application-extractor";
import { sanitizeEmailPreview } from "@/features/email/lib/sanitize-email-preview";

export type EmailWithSignal = EmailPreviewItem & {
  classification: EmailClassification;
  applicationMatch: EmailApplicationMatchResult;
};

export type RecentEmailsResult = {
  emails: EmailWithSignal[];
  hiddenEmails: EmailWithSignal[];
  scannedCount: number;
  fetchLimit: number;
  source: "db";
  error?: string;
  autoCreatedCount?: number;
};

function logYahooSync(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[YahooSync] ${message}`);
  }
}

async function classifyEmails(emails: EmailPreviewItem[]) {
  const applications = await getApplications();
  const classifiedEmails = emails.map((email) => {
    const cleanEmail = {
      ...email,
      bodyPreview: sanitizeEmailPreview(email.bodyPreview),
    };

    // Classification answers "what signal is this email?" Matching separately
    // answers "which saved application might this belong to?"
    return {
      ...cleanEmail,
      classification: classifyEmail(cleanEmail),
      applicationMatch: matchEmailToApplications(cleanEmail, applications),
    };
  });

  return {
    emails: classifiedEmails.filter((email) => email.classification.isJobRelated),
    hiddenEmails: classifiedEmails.filter(
      (email) => !email.classification.isJobRelated,
    ),
    scannedCount: classifiedEmails.length,
  };
}

function normalizeApplicationKey(company: string, roleTitle: string) {
  return [company, roleTitle]
    .join("::")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function autoCreateApplicationsFromEmails(emails: EmailPreviewItem[]) {
  let applications = await getApplications();
  const existingKeys = new Set(
    applications.map((application) =>
      normalizeApplicationKey(application.company, application.roleTitle),
    ),
  );
  let createdCount = 0;

  for (const email of emails) {
    const cleanEmail = {
      ...email,
      bodyPreview: sanitizeEmailPreview(email.bodyPreview),
    };
    const classification = classifyEmail(cleanEmail);

    if (!classification.isJobRelated) {
      continue;
    }

    const existingMatch = matchEmailToApplications(cleanEmail, applications);

    if (existingMatch.applicationId) {
      continue;
    }

    const extractedApplication = extractApplicationFromEmail(
      cleanEmail,
      classification,
    );

    if (
      !extractedApplication.shouldCreate ||
      !extractedApplication.company ||
      !extractedApplication.roleTitle
    ) {
      continue;
    }

    const duplicateKey = normalizeApplicationKey(
      extractedApplication.company,
      extractedApplication.roleTitle,
    );

    if (existingKeys.has(duplicateKey)) {
      continue;
    }

    // Auto-creation is intentionally conservative: high-confidence unmatched
    // emails can create records, but existing application statuses are untouched.
    const application = await insertApplication({
      company: extractedApplication.company,
      roleTitle: extractedApplication.roleTitle,
      dateApplied: extractedApplication.dateApplied,
      status: extractedApplication.status,
      notes: `Auto-created from Yahoo email: ${email.subject}`,
    });

    if (["REJECTED", "INTERVIEW", "OFFER"].includes(application.status)) {
      await insertApplicationStatusHistory({
        applicationId: application.id,
        previousStatus: null,
        newStatus: application.status,
        reason: "Auto-created from email classification.",
      });
    }

    applications = [...applications, application];
    existingKeys.add(duplicateKey);
    createdCount += 1;

    logYahooSync(
      `Auto-created application=${application.company} / ${application.roleTitle}`,
    );
  }

  logYahooSync(`Auto-created applications=${createdCount}`);

  return createdCount;
}

function buildResult(
  emails: EmailPreviewItem[],
  source: RecentEmailsResult["source"],
  error?: string,
  autoCreatedCount?: number,
): Promise<RecentEmailsResult> {
  return classifyEmails(emails).then((classifiedResult) => ({
    ...classifiedResult,
    fetchLimit: RECENT_EMAIL_FETCH_LIMIT,
    source,
    error,
    autoCreatedCount,
  }));
}

async function buildLoggedResult(
  emails: EmailPreviewItem[],
  source: RecentEmailsResult["source"],
  error?: string,
) {
  const result = await buildResult(emails, source, error);

  logYahooSync(`Job-related emails=${result.emails.length}`);
  logYahooSync(`Hidden/unrelated emails=${result.hiddenEmails.length}`);

  return {
    result,
  };
}

function isEmailSyncEnabled() {
  return process.env.EMAIL_SYNC_ENABLED === "true";
}

function getYahooCredentials() {
  return {
    emailAddress: process.env.YAHOO_EMAIL_ADDRESS,
    appPassword: process.env.YAHOO_APP_PASSWORD,
  };
}

export async function syncRecentEmails(
  limit = RECENT_EMAIL_FETCH_LIMIT,
): Promise<RecentEmailsResult> {
  const startedAt = Date.now();
  const syncEnabled = isEmailSyncEnabled();

  logYahooSync("Sync service started.");
  logYahooSync(`EMAIL_SYNC_ENABLED=${syncEnabled}`);
  logYahooSync(`Fetch limit=${limit}`);

  if (!isEmailSyncEnabled()) {
    logYahooSync("Sync skipped because EMAIL_SYNC_ENABLED is false.");

    return buildResult(
      await getEmails(limit),
      "db",
      "Yahoo email sync is disabled. Set EMAIL_SYNC_ENABLED=true to sync.",
    );
  }

  const { emailAddress, appPassword } = getYahooCredentials();

  if (!emailAddress || !appPassword) {
    const error =
      "Yahoo email sync is enabled, but YAHOO_EMAIL_ADDRESS or YAHOO_APP_PASSWORD is missing.";

    console.warn(`[YahooSync] ${error}`);

    return buildResult(await getEmails(limit), "db", error);
  }

  try {
    const adapter = new YahooImapAdapter({ emailAddress, appPassword });
    const messages = await adapter.fetchRecentMessages(limit);

    logYahooSync(`Messages fetched=${messages.length}`);

    const storedCount = await upsertEmails(messages);
    logYahooSync(`Emails stored/upserted=${storedCount}`);

    const syncedEmails = await getEmails(limit);
    const autoCreatedCount = await autoCreateApplicationsFromEmails(syncedEmails);

    const { result } = await buildLoggedResult(
      await getEmails(limit),
      "db",
      undefined,
    );
    result.autoCreatedCount = autoCreatedCount;
    logYahooSync(`Sync total time=${Date.now() - startedAt}ms`);

    return result;
  } catch (cause) {
    const error =
      cause instanceof Error
        ? `Yahoo email sync failed: ${cause.message}`
        : "Yahoo email sync failed.";

    console.warn(`[YahooSync] Error: ${error}`);
    logYahooSync(`Sync total time=${Date.now() - startedAt}ms`);

    return buildResult(await getEmails(limit), "db", error);
  }
}

export async function getRecentEmails(): Promise<RecentEmailsResult> {
  // Dashboard reads cached/stored emails only. Live Yahoo IMAP sync happens
  // from the manual sync action so page load is never blocked by the inbox.
  return buildResult(await getEmails(RECENT_EMAIL_FETCH_LIMIT), "db");
}
