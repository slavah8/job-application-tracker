-- Add provider metadata for read-only email sync.
ALTER TABLE "emails"
ADD COLUMN "provider" "EmailProvider" NOT NULL DEFAULT 'YAHOO',
ADD COLUMN "providerMessageId" TEXT;

-- Existing local rows, if any, get stable legacy ids so the new unique key is valid.
UPDATE "emails"
SET "providerMessageId" = 'legacy:' || "id"
WHERE "providerMessageId" IS NULL;

ALTER TABLE "emails"
ALTER COLUMN "providerMessageId" SET NOT NULL;

CREATE UNIQUE INDEX "emails_providerMessageId_key" ON "emails"("providerMessageId");
