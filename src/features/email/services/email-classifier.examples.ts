import type { EmailPreviewItem } from "@/features/email/db/email.queries";
import type { EmailSignalType } from "@/features/email/services/email-classifier";

type EmailClassifierExample = {
  name: string;
  email: EmailPreviewItem;
  expected: {
    isJobRelated: boolean;
    signalType: EmailSignalType | null;
  };
};

export const emailClassifierExamples: EmailClassifierExample[] = [
  {
    name: "Mission nightlife marketing email",
    email: {
      id: "example-mission-event",
      provider: "YAHOO",
      providerMessageId: "example-mission-event",
      subject: "Complimentary Champagne for SABAI @ MISSION NYC",
      fromAddress: "Mission <events@missionny.com>",
      bodyPreview:
        "Hi slava, As a thank you for being a loyal Mission Member, please enjoy a House Champagne Bottle on us with your table reservation this Friday with SABAI! To redeem & book a table, please reply to this email before Friday at 2pm ET. Please include the number of people in your party & which package / table you are interested in. Availability is limited.",
      receivedAt: new Date("2026-04-26T12:00:00"),
      applicationId: null,
    },
    expected: {
      isJobRelated: false,
      signalType: null,
    },
  },
  {
    name: "Dover rejection with friendly subject",
    email: {
      id: "example-dover-rejection",
      provider: "YAHOO",
      providerMessageId: "example-dover-rejection",
      subject: "Thank you for your interest in Dover Fueling Solutions",
      fromAddress: "careers@doverfuelingsolutions.com",
      bodyPreview:
        "Thank you for your interest in Dover Fueling Solutions and your recent submission to our Engineer, Software Intern position. Based on established qualifications for this position, your application cannot be considered at this time. Please continue to visit our career site to search for other positions of interest. We wish you the best in your career search.",
      receivedAt: new Date("2026-04-26T12:00:00"),
      applicationId: null,
    },
    expected: {
      isJobRelated: true,
      signalType: "REJECTION",
    },
  },
  {
    name: "Dover rejection from Dovercorp noreply",
    email: {
      id: "example-dovercorp-rejection",
      provider: "YAHOO",
      providerMessageId: "example-dovercorp-rejection",
      subject: "Thank you for your interest in Dover Fueling Solutions",
      fromAddress: "Dovercorp Noreply <noreply@dovercorp.com>",
      bodyPreview:
        "Thank you for your interest in Dover Fueling Solutions, a Dover company and your recent submission to our Engineer, Software Intern position. Based on established qualifications for this position, your application cannot be considered at this time. Please continue to visit our career site to search for other positions of interest. We wish you the best in your career search.",
      receivedAt: new Date("2026-04-26T12:00:00"),
      applicationId: null,
    },
    expected: {
      isJobRelated: true,
      signalType: "REJECTION",
    },
  },
];
