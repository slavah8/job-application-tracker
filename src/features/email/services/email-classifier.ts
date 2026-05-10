import type { EmailPreviewItem } from "@/features/email/db/email.queries";
import { sanitizeEmailPreview } from "@/features/email/lib/sanitize-email-preview";

export type EmailSignalType =
  | "APPLICATION_CONFIRMATION"
  | "PENDING_OR_UPDATE"
  | "REJECTION"
  | "INTERVIEW"
  | "OFFER";

export type EmailClassificationSource = "RULES";

export type HiddenReasonType =
  | "SECURITY_OR_ACCOUNT"
  | "MARKETING"
  | "ORDER_OR_RECEIPT"
  | "SOCIAL_OR_SCHOOL"
  | "GENERIC_JOB_BOARD_PROMO"
  | "UNRELATED";

export type EmailClassification = {
  isJobRelated: boolean;
  signalType: EmailSignalType | null;
  label: string | null;
  confidence: number;
  reasons: string[];
  classificationSource: EmailClassificationSource;
  isAmbiguous: boolean;
  hiddenReasonType?: HiddenReasonType;
  hiddenReasonLabel?: string;
};

export type EmailClassifier = {
  classify(email: EmailPreviewItem): Promise<EmailClassification> | EmailClassification;
};

type KeywordGroup = {
  label: string;
  hiddenReasonType?: HiddenReasonType;
  hiddenReasonLabel?: string;
  phrases: string[];
};

type Match = {
  group: string;
  phrase: string;
  hiddenReasonType?: HiddenReasonType;
  hiddenReasonLabel?: string;
};

const signalLabels: Record<EmailSignalType, string> = {
  APPLICATION_CONFIRMATION: "Application confirmation",
  PENDING_OR_UPDATE: "Pending or update",
  REJECTION: "Rejection",
  INTERVIEW: "Interview",
  OFFER: "Offer",
};

const signalKeywordGroups: Record<EmailSignalType, KeywordGroup> = {
  OFFER: {
    label: "offer phrase",
    phrases: [
      "offer letter",
      "pleased to offer",
      "excited to offer",
      "employment offer",
      "job offer",
      "offer of employment",
    ],
  },
  INTERVIEW: {
    label: "interview phrase",
    phrases: [
      "schedule an interview",
      "interview",
      "schedule a call",
      "schedule a conversation",
      "availability",
      "recruiter screen",
      "technical screen",
      "next step",
      "next steps",
      "meet with",
      "speak with",
    ],
  },
  REJECTION: {
    label: "rejection phrase",
    phrases: [
      "unfortunately",
      "not moving forward",
      "not selected",
      "decided to proceed with other candidates",
      "decided to pursue other candidates",
      "decided to continue with another candidate",
      "continue with another candidate",
      "decided not to move forward",
      "proceed with other candidates",
      "unable to move forward",
      "unable to offer",
      "will not be moving forward",
      "we regret to inform you",
      // Some ATS rejection emails start warmly, then reject in the body.
      "cannot be considered",
      "application cannot be considered",
      "cannot be considered at this time",
      "your application cannot be considered",
      "your application cannot be considered at this time",
      "we wish you the best in your career search",
      "please continue to visit our career site",
      "continue to visit our career site",
      "other positions of interest",
      "based on established qualifications",
      "not able to consider",
      "unable to consider",
      "not under consideration",
      "no longer under consideration",
      "will not be considered",
      "we are unable to move forward",
      "we will not proceed",
      "we have decided not to proceed",
      "identified candidates whose skills",
      "more closely match our requirements",
      "candidates whose skills and backgrounds more closely match",
      "encourage you to monitor our current openings",
    ],
  },
  APPLICATION_CONFIRMATION: {
    label: "confirmation phrase",
    phrases: [
      "application received",
      "thank you for applying",
      "thanks for applying",
      "received your application",
      "submitted your application",
      "your application has been received",
      "we received your application",
    ],
  },
  PENDING_OR_UPDATE: {
    label: "pending or update phrase",
    phrases: [
      "application status",
      "still reviewing",
      "under review",
      "in review",
      "update on your application",
      "next steps soon",
      "we are reviewing",
    ],
  },
};

const contextDependentInterviewPhrases = [
  "availability",
  "schedule a call",
  "schedule a conversation",
  "schedule",
  "book",
  "meeting",
  "call",
  "interested",
  "reply to this email",
  "next step",
  "next steps",
  "meet with",
  "speak with",
];

const strongJobEvidenceGroups: KeywordGroup[] = [
  {
    label: "ATS sender phrase",
    phrases: [
      "greenhouse",
      "lever",
      "workday",
      "smartrecruiters",
      "ashby",
      "icims",
      "workable",
      "bamboohr",
    ],
  },
  {
    label: "specific employer message phrase",
    phrases: [
      "new message from",
      "employer message",
      "office assistant/technician",
      "junior software engineer position",
      "thank you for your interest in",
    ],
  },
  {
    label: "application-specific job phrase",
    phrases: [
      "application received",
      "thank you for applying",
      "received your application",
      "submitted your application",
      "application status",
      "your application",
      "schedule an interview",
      "interview",
      "recruiter screen",
      "technical screen",
      "schedule a call",
      "hiring team",
      "not moving forward",
      "unfortunately",
      "not selected",
      "offer letter",
      "pleased to offer",
    ],
  },
];

const weakJobEvidenceGroups: KeywordGroup[] = [
  {
    label: "weak job wording phrase",
    phrases: ["candidate", "position", "role"],
  },
  {
    label: "weak recruiting sender phrase",
    phrases: ["recruiter", "recruiting", "careers"],
  },
];

const unrelatedKeywordGroups: KeywordGroup[] = [
  {
    label: "security/account phrase",
    hiddenReasonType: "SECURITY_OR_ACCOUNT",
    hiddenReasonLabel: "security/account email",
    phrases: [
      "app password",
      "password change",
      "sign in notification",
      "sign-in notification",
      "third-party app",
      "yahoo account",
      "account security",
      "verification code",
      "security alert",
      "two-factor",
      "password reset",
      "authentication",
    ],
  },
  {
    label: "order/receipt phrase",
    hiddenReasonType: "ORDER_OR_RECEIPT",
    hiddenReasonLabel: "order/receipt email",
    phrases: [
      "order shipped",
      "tracking number",
      "receipt",
      "invoice",
      "your order",
      "order update",
      "shipping",
      "shipped",
      "delivery",
    ],
  },
  {
    label: "marketing phrase",
    hiddenReasonType: "MARKETING",
    hiddenReasonLabel: "marketing email",
    phrases: [
      "newsletter",
      "unsubscribe",
      "sale",
      "discount",
      "spring savings",
      "savings alert",
      "special offer",
      "discount offer",
      "new arrivals",
      "new nike",
      "nike phantom",
      "promotion",
      "promo",
      "limited time",
      "soccerpost.com",
      "soccer post",
      "host city playbooks",
    ],
  },
  {
    label: "marketing/event phrase",
    hiddenReasonType: "MARKETING",
    hiddenReasonLabel: "marketing/event email",
    phrases: [
      "complimentary champagne",
      "champagne bottle",
      "table reservation",
      "book a table",
      "mission member",
      "house champagne",
      "redeem",
      "package / table",
      "number of people in your party",
      "availability is limited",
      "first-come, first-serve",
      "nightclub",
      "nightlife",
      "reservation",
      "party",
    ],
  },
  {
    label: "generic job-board promo phrase",
    hiddenReasonType: "GENERIC_JOB_BOARD_PROMO",
    hiddenReasonLabel: "generic job-board promo",
    phrases: [
      "top talent on wellfound",
      "suggested jobs",
      "recommended jobs",
      "are you still interested in these jobs",
      "still interested in these jobs",
      "jobs you may like",
      "job recommendations",
      "new jobs for you",
      "wellfound weekly",
    ],
  },
  {
    label: "social/school phrase",
    hiddenReasonType: "SOCIAL_OR_SCHOOL",
    hiddenReasonLabel: "social/school email",
    phrases: [
      "social notification",
      "liked your post",
      "new follower",
      "friend request",
      "class announcement",
      "student portal",
      "school account",
      "campus",
    ],
  },
];

const unrelatedSenderGroups: KeywordGroup[] = [
  {
    label: "security/account sender",
    hiddenReasonType: "SECURITY_OR_ACCOUNT",
    hiddenReasonLabel: "security/account email",
    phrases: ["no-reply@cc.yahoo.com", "account-security", "yahoo-inc.com"],
  },
  {
    label: "marketing sender",
    hiddenReasonType: "MARKETING",
    hiddenReasonLabel: "marketing/event email",
    phrases: [
      "events@",
      "missionny.com",
      "soccerpost.com",
      "mail.soccerpost.com",
    ],
  },
  {
    label: "generic job-board sender",
    hiddenReasonType: "GENERIC_JOB_BOARD_PROMO",
    hiddenReasonLabel: "generic job-board promo",
    phrases: ["wellfound.com", "angel.co"],
  },
];

const marketingOfferPhrases = [
  "special offer",
  "discount offer",
  "limited time offer",
  "exclusive offer",
];

export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function buildSearchText(email: EmailPreviewItem): string {
  const cleanPreview = sanitizeEmailPreview(email.bodyPreview) ?? "";

  return normalizeText(
    [email.subject, email.fromAddress, cleanPreview].join(" "),
  );
}

function buildSenderText(email: EmailPreviewItem): string {
  return normalizeText(email.fromAddress);
}

function getMatchedPhrases(text: string, phrases: string[]) {
  return phrases.filter((phrase) => text.includes(phrase));
}

function getMatchedGroups(text: string, groups: KeywordGroup[]) {
  return groups.flatMap((group) =>
    getMatchedPhrases(text, group.phrases).map((phrase) => ({
      group: group.label,
      phrase,
      hiddenReasonType: group.hiddenReasonType,
      hiddenReasonLabel: group.hiddenReasonLabel,
    })),
  );
}

function formatMatchedReasons(matches: Match[], prefix: string) {
  return matches.map((match) => `${prefix}: "${match.phrase}"`);
}

function getPrimaryHiddenReason(matches: Match[]) {
  return matches.find((match) => match.hiddenReasonType);
}

function classifySignal(
  text: string,
  hasJobContext: boolean,
): Pick<
  EmailClassification,
  "signalType" | "label" | "confidence" | "reasons"
> {
  const rejectionGroup = signalKeywordGroups.REJECTION;
  const rejectionMatches = getMatchedPhrases(text, rejectionGroup.phrases);

  // Rejection language must override polite confirmation wording like
  // "thank you for your interest" when both appear in the same email.
  if (rejectionMatches.length > 0) {
    return {
      signalType: "REJECTION",
      label: signalLabels.REJECTION,
      confidence: Math.min(0.95, 0.78 + rejectionMatches.length * 0.06),
      reasons: rejectionMatches.map(
        (phrase) => `Matched ${rejectionGroup.label}: "${phrase}"`,
      ),
    };
  }

  const priority: EmailSignalType[] = [
    "OFFER",
    "INTERVIEW",
    "APPLICATION_CONFIRMATION",
    "PENDING_OR_UPDATE",
  ];

  for (const signalType of priority) {
    const group = signalKeywordGroups[signalType];
    let matches = getMatchedPhrases(text, group.phrases);

    if (signalType === "OFFER") {
      const marketingMatches = getMatchedPhrases(text, marketingOfferPhrases);
      matches = matches.filter(
        (phrase) => phrase !== "offer" || marketingMatches.length === 0,
      );
    }

    if (signalType === "INTERVIEW") {
      // Generic scheduling words are common in restaurant/event marketing.
      // Keep them only when the email also has real job context.
      matches = matches.filter(
        (phrase) =>
          hasJobContext ||
          !contextDependentInterviewPhrases.includes(phrase),
      );
    }

    if (matches.length > 0) {
      return {
        signalType,
        label: signalLabels[signalType],
        confidence: Math.min(0.95, 0.7 + matches.length * 0.08),
        reasons: matches.map(
          (phrase) => `Matched ${group.label}: "${phrase}"`,
        ),
      };
    }
  }

  return {
    signalType: null,
    label: null,
    confidence: 0,
    reasons: [],
  };
}

export class RuleBasedEmailClassifier implements EmailClassifier {
  classify(email: EmailPreviewItem): EmailClassification {
    const text = buildSearchText(email);
    const senderText = buildSenderText(email);
    const strongJobEvidence = getMatchedGroups(text, strongJobEvidenceGroups);
    const weakJobEvidence = getMatchedGroups(text, weakJobEvidenceGroups);
    const hasJobContext =
      strongJobEvidence.length > 0 || weakJobEvidence.length > 0;
    const signalEvidence = classifySignal(text, hasJobContext);
    const unrelatedEvidence = [
      ...getMatchedGroups(text, unrelatedKeywordGroups),
      ...getMatchedGroups(senderText, unrelatedSenderGroups),
    ];
    const hasStrongSignal = signalEvidence.signalType !== null;
    const hasStrongJobEvidence = strongJobEvidence.length > 0;
    const hasOnlyWeakJobEvidence =
      weakJobEvidence.length > 0 && !hasStrongSignal && !hasStrongJobEvidence;
    const primaryHiddenReason = getPrimaryHiddenReason(unrelatedEvidence);

    // Future AI hook: an AI classifier could be called only when rules are
    // ambiguous. We keep this local and deterministic for now.
    const isAmbiguous =
      !hasStrongSignal &&
      !hasStrongJobEvidence &&
      weakJobEvidence.length > 0 &&
      unrelatedEvidence.length === 0;

    if (
      unrelatedEvidence.length > 0 &&
      !hasStrongSignal &&
      !hasStrongJobEvidence
    ) {
      return {
        isJobRelated: false,
        signalType: null,
        label: null,
        confidence: 0.92,
        reasons: formatMatchedReasons(
          unrelatedEvidence,
          "Hidden because unrelated evidence matched",
        ),
        classificationSource: "RULES",
        isAmbiguous: false,
        hiddenReasonType: primaryHiddenReason?.hiddenReasonType ?? "UNRELATED",
        hiddenReasonLabel:
          primaryHiddenReason?.hiddenReasonLabel ?? "unrelated email",
      };
    }

    if (!hasStrongSignal && !hasStrongJobEvidence) {
      return {
        isJobRelated: false,
        signalType: null,
        label: null,
        confidence: hasOnlyWeakJobEvidence ? 0.65 : 0.45,
        reasons:
          weakJobEvidence.length > 0
            ? formatMatchedReasons(
                weakJobEvidence,
                "Hidden because only weak job evidence matched",
              )
            : ["Hidden because no strong job-related evidence matched."],
        classificationSource: "RULES",
        isAmbiguous,
        hiddenReasonType: hasOnlyWeakJobEvidence
          ? "GENERIC_JOB_BOARD_PROMO"
          : "UNRELATED",
        hiddenReasonLabel: hasOnlyWeakJobEvidence
          ? "generic job-board promo"
          : "unrelated email",
      };
    }

    return {
      isJobRelated: true,
      signalType: signalEvidence.signalType,
      label: signalEvidence.label,
      confidence: Math.max(
        signalEvidence.confidence,
        hasStrongJobEvidence ? 0.7 : 0.6,
      ),
      reasons: [
        ...signalEvidence.reasons,
        ...formatMatchedReasons(strongJobEvidence, "Matched strong job evidence"),
        ...formatMatchedReasons(weakJobEvidence, "Matched weak job evidence"),
        ...formatMatchedReasons(unrelatedEvidence, "Also matched unrelated evidence"),
      ],
      classificationSource: "RULES",
      isAmbiguous,
    };
  }
}

const ruleBasedEmailClassifier = new RuleBasedEmailClassifier();

export function classifyEmail(email: EmailPreviewItem): EmailClassification {
  return ruleBasedEmailClassifier.classify(email);
}
