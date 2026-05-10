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
    .replace(/^(re|fw|fwd|external):\s*/i, "")
    .replace(/^\[external\]\s*/i, "")
    .replace(/\b[A-Z]\d{5,}\b/g, "")
    .replace(/\bR\d{5,}\b/gi, "")
    .replace(/\s+workday$/i, "")
    .replace(/\s+human resources$/i, "")
    .replace(/\s+hr$/i, "")
    .replace(/\s*,\s*,/g, ",")
    .replace(/^\s*the\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s"']+|[\s"',.]+$/g, "")
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

  const interestRoleCompanyMatch = subject.match(
    /^thanks for your interest\s+(.+?)\s+with\s+(.+)$/i,
  );

  if (!company && interestRoleCompanyMatch) {
    roleTitle = cleanValue(interestRoleCompanyMatch[1]);
    company = cleanValue(interestRoleCompanyMatch[2]);
    confidence += 0.85;
    reasons.push("Matched subject pattern: Thanks for your interest Role with Company.");
  }

  const applicationForRoleMatch = subject.match(/^your application for\s+(.+)$/i);

  if (!roleTitle && applicationForRoleMatch) {
    roleTitle = cleanValue(applicationForRoleMatch[1]);
    confidence += 0.35;
    reasons.push("Matched subject pattern: Your application for Role.");
  }

  const applicationWithCompanyMatch = subject.match(/^your application with\s+(.+)$/i);

  if (!company && applicationWithCompanyMatch) {
    company = cleanValue(applicationWithCompanyMatch[1]);
    confidence += 0.45;
    reasons.push("Matched subject pattern: Your Application with Company.");
  }

  const companyApplicationMatch = subject.match(
    /^(.+?)\s+thanks you for your application\s+-\s+(.+)$/i,
  );

  if (!company && companyApplicationMatch) {
    company = cleanValue(companyApplicationMatch[1]);
    roleTitle = cleanValue(companyApplicationMatch[2]);
    confidence += 0.85;
    reasons.push("Matched subject pattern: Company thanks you - Role.");
  }

  const recentApplicationMatch = subject.match(
    /^thank you for your recent application to\s+([^,]+),\s*(.+)$/i,
  );

  if (!company && recentApplicationMatch) {
    company = cleanValue(recentApplicationMatch[1]);
    roleTitle = cleanValue(recentApplicationMatch[2]);
    confidence += 0.85;
    reasons.push("Matched subject pattern: recent application to Company, Role.");
  }

  const applyingToCompanyMatch = subject.match(/^thank you for applying to\s+(.+)$/i);

  if (!company && applyingToCompanyMatch) {
    company = cleanValue(applyingToCompanyMatch[1]);
    confidence += 0.45;
    reasons.push("Matched subject pattern: Thank you for applying to Company.");
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
  const rolePatterns = [
    {
      pattern: /(?:submission|application)\s+to\s+our\s+(.+?)\s+position/i,
      reason: "Matched body pattern: submission/application to our Role position.",
      roleGroup: 1,
    },
    {
      pattern:
        /application\s+to\s+the\s+(.+?)\s*,?\s*(?:[A-Z]\d{5,}|R\d{5,})?\s*,?\s+position/i,
      reason: "Matched body pattern: application to the Role position.",
      roleGroup: 1,
    },
    {
      pattern: /application\s+for\s+the\s+(.+?)\s+role/i,
      reason: "Matched body pattern: application for the Role role.",
      roleGroup: 1,
    },
    {
      pattern: /apply\s+for\s+the\s+position\s+of\s+(.+?)\s+with\s+([A-Z][A-Za-z0-9 &.-]+)/i,
      reason: "Matched body pattern: position of Role with Company.",
      roleGroup: 1,
    },
    {
      pattern: /application\s+for\s+(.+?)\s+unfortunately/i,
      reason: "Matched body pattern: application for Role before rejection.",
      roleGroup: 1,
    },
    {
      pattern: /applying\s+to\s+(.+?)\s+for\s+the\s+(.+?)\s+role/i,
      reason: "Matched body pattern: applying to Company for the Role role.",
      roleGroup: 2,
    },
  ];

  for (const rolePattern of rolePatterns) {
    const match = text.match(rolePattern.pattern);

    if (match) {
      return {
        roleTitle: cleanValue(match[rolePattern.roleGroup]),
        confidence: 0.35,
        reason: rolePattern.reason,
      };
    }
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

function extractCompanyFromSenderDisplay(email: EmailPreviewItem) {
  const displayName = email.fromAddress.match(/^([^<@]+)</)?.[1];
  const cleanedDisplayName = cleanValue(displayName);

  if (!cleanedDisplayName || /^(no-reply|noreply|indeed)$/i.test(cleanedDisplayName)) {
    return {
      company: null,
      confidence: 0,
      reason: null,
    };
  }

  return {
    company: cleanedDisplayName,
    confidence: 0.35,
    reason: "Matched sender display name as company clue.",
  };
}

function extractCompanyFromBody(email: EmailPreviewItem) {
  const text = getReadableText(email);
  const footerMatch = text.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\s+·/);

  if (footerMatch) {
    return {
      company: cleanValue(footerMatch[1]),
      confidence: 0.35,
      reason: "Matched company footer text.",
    };
  }

  const positionWithCompanyMatch = text.match(
    /position\s+of\s+.+?\s+with\s+([A-Z][A-Za-z0-9 &.-]+?)(?:\.|\s+We\s)/,
  );

  if (positionWithCompanyMatch) {
    return {
      company: cleanValue(positionWithCompanyMatch[1]),
      confidence: 0.35,
      reason: "Matched body pattern: position with Company.",
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
  const senderDisplayExtraction = extractCompanyFromSenderDisplay(email);
  const bodyCompanyExtraction = extractCompanyFromBody(email);
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

  if (!company && senderDisplayExtraction.company) {
    company = senderDisplayExtraction.company;
    confidence += senderDisplayExtraction.confidence;
    reasons.push(senderDisplayExtraction.reason ?? "");
  }

  if (!company && bodyCompanyExtraction.company) {
    company = bodyCompanyExtraction.company;
    confidence += bodyCompanyExtraction.confidence;
    reasons.push(bodyCompanyExtraction.reason ?? "");
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
      confidence + Number.EPSILON >= EXTRACTION_THRESHOLD,
    company,
    roleTitle,
    status,
    dateApplied: email.receivedAt,
    confidence,
    reasons: reasons.filter(Boolean),
  };
}
