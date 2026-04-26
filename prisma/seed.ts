import {
  ApplicationStatus,
  EmailProvider,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

const demoApplications = [
  {
    company: "KBR",
    roleTitle: "Junior Software Engineer",
    status: ApplicationStatus.INTERVIEW,
    dateApplied: new Date("2026-04-17"),
    notes: "Demo application for portfolio screenshots.",
    history: [
      {
        previousStatus: null,
        newStatus: ApplicationStatus.APPLIED,
        reason: "Demo: application submitted.",
      },
      {
        previousStatus: ApplicationStatus.APPLIED,
        newStatus: ApplicationStatus.INTERVIEW,
        reason: "Demo: recruiter requested interview availability.",
      },
    ],
  },
  {
    company: "Dover Fueling Solutions",
    roleTitle: "Engineer, Software Intern",
    status: ApplicationStatus.REJECTED,
    dateApplied: new Date("2026-04-20"),
    notes: "Demo application for portfolio screenshots.",
    history: [
      {
        previousStatus: null,
        newStatus: ApplicationStatus.APPLIED,
        reason: "Demo: application submitted.",
      },
      {
        previousStatus: ApplicationStatus.APPLIED,
        newStatus: ApplicationStatus.REJECTED,
        reason: "Demo: rejection detected from email classification.",
      },
    ],
  },
  {
    company: "EYECARE for You",
    roleTitle: "Office Assistant/Technician",
    status: ApplicationStatus.APPLIED,
    dateApplied: new Date("2026-04-22"),
    notes: "Demo application for portfolio screenshots.",
    history: [
      {
        previousStatus: null,
        newStatus: ApplicationStatus.APPLIED,
        reason: "Demo: Indeed employer message received.",
      },
    ],
  },
  {
    company: "WHOOP",
    roleTitle: "Software Engineer",
    status: ApplicationStatus.SAVED,
    dateApplied: null,
    notes: "Demo saved role for portfolio screenshots.",
    history: [],
  },
  {
    company: "Invene",
    roleTitle: "Junior Software Engineer",
    status: ApplicationStatus.APPLIED,
    dateApplied: new Date("2026-04-24"),
    notes: "Demo application for portfolio screenshots.",
    history: [
      {
        previousStatus: null,
        newStatus: ApplicationStatus.APPLIED,
        reason: "Demo: application submitted manually.",
      },
    ],
  },
];

const demoEmails = [
  {
    providerMessageId: "demo-kbr-interview",
    subject: "RE: Junior Software Engineer position - KBR",
    fromAddress: "Demo Recruiter <recruiting@kbr.example>",
    bodyPreview:
      "Thanks for your interest in the Junior Software Engineer position. Could you share your availability for a recruiter screen?",
    receivedAt: new Date("2026-04-24T14:15:00"),
  },
  {
    providerMessageId: "demo-dover-rejection",
    subject: "Thank you for your interest in Dover Fueling Solutions",
    fromAddress: "Dover Recruiting <noreply@dover.example>",
    bodyPreview:
      "Thank you for your interest in Dover Fueling Solutions and your recent submission to our Engineer, Software Intern position. Based on established qualifications, your application cannot be considered at this time.",
    receivedAt: new Date("2026-04-25T10:30:00"),
  },
  {
    providerMessageId: "demo-eyecare-message",
    subject: "New Message from EYECARE for You - Office Assistant/Technician",
    fromAddress: "Indeed <messages@indeed.example>",
    bodyPreview:
      "You received a new employer message about Office Assistant/Technician.",
    receivedAt: new Date("2026-04-25T16:45:00"),
  },
  {
    providerMessageId: "demo-hidden-marketing",
    subject: "Spring Savings Alert",
    fromAddress: "Demo Store <promo@example.com>",
    bodyPreview:
      "Newsletter discount sale promotion. This demo email should be hidden as unrelated.",
    receivedAt: new Date("2026-04-25T18:00:00"),
  },
];

async function findOrCreateDemoApplication(
  application: (typeof demoApplications)[number],
) {
  const existingApplication = await prisma.application.findFirst({
    where: {
      company: application.company,
      roleTitle: application.roleTitle,
    },
  });

  if (existingApplication) {
    return existingApplication;
  }

  return prisma.application.create({
    data: {
      company: application.company,
      roleTitle: application.roleTitle,
      status: application.status,
      dateApplied: application.dateApplied,
      notes: application.notes,
    },
  });
}

async function seedStatusHistory(
  applicationId: string,
  history: (typeof demoApplications)[number]["history"],
) {
  if (history.length === 0) {
    return;
  }

  const existingHistoryCount = await prisma.applicationStatusHistory.count({
    where: { applicationId },
  });

  if (existingHistoryCount > 0) {
    return;
  }

  await prisma.applicationStatusHistory.createMany({
    data: history.map((entry) => ({
      applicationId,
      previousStatus: entry.previousStatus,
      newStatus: entry.newStatus,
      reason: entry.reason,
    })),
  });
}

async function main() {
  for (const demoApplication of demoApplications) {
    const application = await findOrCreateDemoApplication(demoApplication);
    await seedStatusHistory(application.id, demoApplication.history);
  }

  for (const demoEmail of demoEmails) {
    await prisma.email.upsert({
      where: { providerMessageId: demoEmail.providerMessageId },
      update: demoEmail,
      create: {
        ...demoEmail,
        provider: EmailProvider.YAHOO,
      },
    });
  }

  console.log("Seeded demo applications, status history, and demo emails.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
