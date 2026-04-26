import type { Application } from "@prisma/client";

import type { EmailPreviewItem } from "@/features/email/db/email.queries";
import { sanitizeEmailPreview } from "@/features/email/lib/sanitize-email-preview";

export type EmailApplicationMatchResult = {
  applicationId: string | null;
  company: string | null;
  roleTitle: string | null;
  autoCreated: boolean;
  confidence: number;
  reasons: string[];
};

const MATCH_THRESHOLD = 0.6;
const GENERIC_COMPANY_WORDS = new Set([
  "and",
  "company",
  "corp",
  "corporation",
  "for",
  "inc",
  "llc",
  "solutions",
  "the",
]);

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getTokens(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !GENERIC_COMPANY_WORDS.has(token));
}

function getEmailText(email: EmailPreviewItem) {
  return normalizeText(
    [
      email.subject,
      email.fromAddress,
      sanitizeEmailPreview(email.bodyPreview) ?? "",
    ].join(" "),
  );
}

function getSenderDomain(email: EmailPreviewItem) {
  const match = email.fromAddress.match(/@([a-z0-9.-]+)/i);

  return normalizeText(match?.[1] ?? email.fromAddress);
}

function getTokenMatchRatio(tokens: string[], text: string) {
  if (tokens.length === 0) {
    return 0;
  }

  const matched = tokens.filter((token) => text.includes(token));

  return matched.length / tokens.length;
}

function scoreApplicationMatch(
  email: EmailPreviewItem,
  application: Application,
): EmailApplicationMatchResult {
  const reasons: string[] = [];
  let confidence = 0;

  const emailText = getEmailText(email);
  const senderDomain = getSenderDomain(email);
  const normalizedCompany = normalizeText(application.company);
  const normalizedRole = normalizeText(application.roleTitle);
  const companyTokens = getTokens(application.company);
  const roleTokens = getTokens(application.roleTitle);
  const compactDomain = compact(senderDomain);

  if (normalizedCompany && emailText.includes(normalizedCompany)) {
    confidence += 0.45;
    reasons.push(`Company appears in email text: "${application.company}"`);
  } else {
    const companyRatio = getTokenMatchRatio(companyTokens, emailText);

    if (companyRatio >= 0.5) {
      confidence += 0.35;
      reasons.push(`Partial company match: "${application.company}"`);
    }
  }

  if (normalizedRole && emailText.includes(normalizedRole)) {
    confidence += 0.45;
    reasons.push(`Role title appears in email text: "${application.roleTitle}"`);
  } else {
    const roleRatio = getTokenMatchRatio(roleTokens, emailText);

    if (roleRatio >= 0.6) {
      confidence += 0.35;
      reasons.push(`Partial role match: "${application.roleTitle}"`);
    }
  }

  const domainCompanyToken = companyTokens.find((token) =>
    compactDomain.includes(token),
  );

  if (domainCompanyToken) {
    confidence += 0.25;
    reasons.push(`Sender domain matches company token: "${domainCompanyToken}"`);
  }

  if (application.dateApplied) {
    const daysAfterApplied =
      (email.receivedAt.getTime() - application.dateApplied.getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysAfterApplied >= -3 && daysAfterApplied <= 180) {
      confidence += 0.1;
      reasons.push("Email date is near or after the application date.");
    }
  }

  return {
    applicationId: application.id,
    company: application.company,
    roleTitle: application.roleTitle,
    autoCreated:
      application.notes?.startsWith("Auto-created from Yahoo email:") ?? false,
    confidence: Math.min(confidence, 1),
    reasons,
  };
}

export function matchEmailToApplications(
  email: EmailPreviewItem,
  applications: Application[],
): EmailApplicationMatchResult {
  const bestMatch = applications
    .map((application) => scoreApplicationMatch(email, application))
    .sort((a, b) => b.confidence - a.confidence)[0];

  // The threshold prevents confident-looking UI for weak/generic coincidences.
  // We only display a match for now; status automation will stay separate later.
  if (!bestMatch || bestMatch.confidence < MATCH_THRESHOLD) {
    return {
      applicationId: null,
      company: null,
      roleTitle: null,
      autoCreated: false,
      confidence: bestMatch?.confidence ?? 0,
      reasons: bestMatch?.reasons ?? ["No application passed the match threshold."],
    };
  }

  return bestMatch;
}
