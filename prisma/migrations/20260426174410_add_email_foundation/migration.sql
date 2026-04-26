-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "bodyPreview" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emails_applicationId_idx" ON "emails"("applicationId");

-- CreateIndex
CREATE INDEX "emails_receivedAt_idx" ON "emails"("receivedAt");

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
