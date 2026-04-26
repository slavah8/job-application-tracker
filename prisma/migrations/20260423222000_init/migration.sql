-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'OA', 'INTERVIEW', 'REJECTED', 'OFFER');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('YAHOO', 'GMAIL', 'OUTLOOK', 'IMAP');

-- CreateEnum
CREATE TYPE "EmailSyncStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "applicationLink" TEXT,
    "dateApplied" TIMESTAMP(3),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_accounts" (
    "id" TEXT NOT NULL,
    "provider" "EmailProvider" NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "syncStatus" "EmailSyncStatus" NOT NULL DEFAULT 'PAUSED',
    "lastSyncedAt" TIMESTAMP(3),
    "providerAccountId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_emails" (
    "id" TEXT NOT NULL,
    "emailAccountId" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "threadId" TEXT,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "subject" TEXT NOT NULL,
    "snippet" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "synced_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_application_matches" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "syncedEmailId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "matchReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_application_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_company_idx" ON "applications"("company");

-- CreateIndex
CREATE INDEX "applications_roleTitle_idx" ON "applications"("roleTitle");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "application_status_history_applicationId_idx" ON "application_status_history"("applicationId");

-- CreateIndex
CREATE INDEX "email_accounts_provider_idx" ON "email_accounts"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "email_accounts_provider_emailAddress_key" ON "email_accounts"("provider", "emailAddress");

-- CreateIndex
CREATE INDEX "synced_emails_emailAccountId_idx" ON "synced_emails"("emailAccountId");

-- CreateIndex
CREATE INDEX "synced_emails_receivedAt_idx" ON "synced_emails"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "synced_emails_emailAccountId_providerMessageId_key" ON "synced_emails"("emailAccountId", "providerMessageId");

-- CreateIndex
CREATE INDEX "email_application_matches_applicationId_idx" ON "email_application_matches"("applicationId");

-- CreateIndex
CREATE INDEX "email_application_matches_syncedEmailId_idx" ON "email_application_matches"("syncedEmailId");

-- CreateIndex
CREATE UNIQUE INDEX "email_application_matches_applicationId_syncedEmailId_key" ON "email_application_matches"("applicationId", "syncedEmailId");

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synced_emails" ADD CONSTRAINT "synced_emails_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "email_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_application_matches" ADD CONSTRAINT "email_application_matches_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_application_matches" ADD CONSTRAINT "email_application_matches_syncedEmailId_fkey" FOREIGN KEY ("syncedEmailId") REFERENCES "synced_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
