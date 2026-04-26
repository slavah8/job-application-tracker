import type { ApplicationStatus } from "@prisma/client";

import type { EmailPreviewItem } from "@/features/email/db/email.queries";
import type { EmailClassification } from "@/features/email/services/email-classifier";
import { sanitizeEmailPreview } from "@/features/email/lib/sanitize-email-preview";

export type ExtractedApplication = {
  shouldCreate: boolean;
  company: string | null;
  roleTitle: string | null;
  status: ApplicationStatus;
  dateApplied: Date | null;
  confidence: number;
  reasons: string[];
};

const EXTRACTION_THRESHOLD = 0.75;

function cleanValue(value: string | null | undefined) {
  return (value ?? "")
    .replace(/^(re|fw|fwd):\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s"'“”]+|[\s"'“”,.]+$/g, "")
    .trim();
}

function getReadableText(email: EmailPreviewItem) {
  return [
    email.subject,
    email.fromAddress,
    sanitizeEmailPreview(email.bodyPreview) ?? "",
  ].join(" ");
}

function inferStatus(classification: EmailClassification): ApplicationStatus {
  switch (classification.signalType) {
    case "REJECTION":
      return "REJECTED";
    case "INTERVIEW":
      return "INTERVIEW";
    case "OFFER":
      return "OFFER";
    case "APPLICATION_CONFIRMATION":
    case "PENDING_OR_UPDATE":
    default:
      return "APPLIED";
  }
}

function extractFromSubject(email: EmailPreviewItem) {
  const subject = cleanValue(email.subject);
  const reasons: string[] = [];
  let company: string | null = null;
  let roleTitle: string | null = null;
  let confidence = 0;

  const indeedMatch = subject.match(/^new message from\s+(.+?)\s+-\s+(.+)$/i);

  if (indeedMatch) {
    company = cleanValue(indeedMatch[1]);
    roleTitle = cleanValue(indeedMatch[2]);
    confidence += 0.85;
    reasons.push("Matched Indeed-style subject: New Message from Company - Role.");
  }

  const roleCompanyMatch = subject.match(/^(.+?)\s+position\s+-\s+(.+)$/i);

  if (!company && roleCompanyMatch) {
    roleTitle = cleanValue(roleCompanyMatch[1]);
    company = cleanValue(roleCompanyMatch[2]);
    confidence += 0.85;
    reasons.push("Matched subject pattern: Role position - Company.");
  }

  const interestMatch = subject.match(/thank you for your interest in\s+(.+)$/i);

  if (!company && interestMatch) {
    company = cleanValue(interestMatch[1]);
    confidence += 0.45;
    reasons.push("Matched subject pattern: Thank you for your interest in Company.");
  }

  return {
    company,
    roleTitle,
    confidence,
    reasons,
  };
}

function extractRoleFromBody(email: EmailPreviewItem) {
  const text = getReadableText(email);
  const submissionMatch = text.match(
    /(?:submission|application)\s+to\s+our\s+(.+?)\s+position/i,
  );

  if (submissionMatch) {
    return {
      roleTitle: cleanValue(submissionMatch[1]),
      confidence: 0.35,
      reason: "Matched body pattern: submission/application to our Role position.",
    };
  }

  return {
    roleTitle: null,
    confidence: 0,
    reason: null,
  };
}

function extractCompanyFromSenderDomain(email: EmailPreviewItem) {
  const match = email.fromAddress.match(/@(?:[a-z0-9-]+\.)?([a-z0-9-]+)\./i);
  const domainToken = match?.[1];

  if (!domainToken) {
    return {
      company: null,
      confidence: 0,
      reason: null,
    };
  }

  if (domainToken.toLowerCase() === "kbr") {
    return {
      company: "KBR",
      confidence: 0.35,
      reason: "Matched sender domain company clue: kbr.",
    };
  }

  return {
    company: null,
    confidence: 0,
    reason: null,
  };
}

export function extractApplicationFromEmail(
  email: EmailPreviewItem,
  classification: EmailClassification,
): ExtractedApplication {
  const reasons: string[] = [];
  const status = inferStatus(classification);
  const subjectExtraction = extractFromSubject(email);
  const bodyRoleExtraction = extractRoleFromBody(email);
  const senderCompanyExtraction = extractCompanyFromSenderDomain(email);
  let company = subjectExtraction.company;
  let roleTitle = subjectExtraction.roleTitle;
  let confidence = subjectExtraction.confidence;

  reasons.push(...subjectExtraction.reasons);

  if (!roleTitle && bodyRoleExtraction.roleTitle) {
    roleTitle = bodyRoleExtraction.roleTitle;
    confidence += bodyRoleExtraction.confidence;
    reasons.push(bodyRoleExtraction.reason ?? "");
  }

  if (!company && senderCompanyExtraction.company) {
    company = senderCompanyExtraction.company;
    confidence += senderCompanyExtraction.confidence;
    reasons.push(senderCompanyExtraction.reason ?? "");
  }

  if (classification.isJobRelated) {
    confidence += 0.1;
    reasons.push("Email is classified as job-related.");
  }

  confidence = Math.min(confidence, 1);

  return {
    shouldCreate:
      classification.isJobRelated &&
      Boolean(company) &&
      Boolean(roleTitle) &&
      confidence >= EXTRACTION_THRESHOLD,
    company,
    roleTitle,
    status,
    dateApplied: email.receivedAt,
    confidence,
    reasons: reasons.filter(Boolean),
  };
}
