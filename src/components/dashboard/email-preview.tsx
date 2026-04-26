import { getRecentEmails } from "@/features/email/services/email-service";
import { sanitizeEmailPreview } from "@/features/email/lib/sanitize-email-preview";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmailSignalBadge } from "@/components/ui/email-signal-badge";
import { EmailSyncButton } from "@/components/dashboard/email-sync-button";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function EmailPreviewText({ bodyPreview }: { bodyPreview: string | null }) {
  const preview = sanitizeEmailPreview(bodyPreview);

  if (!preview) {
    return null;
  }

  return (
    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
      {preview}
    </p>
  );
}

export async function EmailPreview() {
  const { emails, hiddenEmails, scannedCount, fetchLimit, source, error } =
    await getRecentEmails();

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Recent emails
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Cached Yahoo messages already stored in PostgreSQL.
            </p>
          </div>
          <EmailSyncButton />
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Dashboard load stays fast because live Yahoo IMAP sync only runs when
          you click the sync button.
        </p>
        <p className="text-sm text-slate-500">
          Showing {emails.length} job-related emails from the latest{" "}
          {source === "db" ? fetchLimit : scannedCount} stored messages.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      ) : null}

      {emails.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center">
          <p className="text-sm font-semibold text-slate-900">
            No job-related emails found in your latest synced messages.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Click Sync Yahoo to fetch your latest inbox messages read-only,
            store them, and then show only job-related results here.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {emails.map((email) => (
          <div
            key={email.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {email.subject}
                </p>
                <p className="text-sm text-slate-600">{email.fromAddress}</p>
              </div>
              <p className="shrink-0 text-xs font-medium text-slate-500">
                {formatDate(email.receivedAt)}
              </p>
            </div>

            <EmailPreviewText bodyPreview={email.bodyPreview} />

            {email.classification.label && email.classification.signalType ? (
              <div className="mt-2">
                <EmailSignalBadge
                  signalType={email.classification.signalType}
                  label={email.classification.label}
                />
              </div>
            ) : null}

            <div className="mt-3 text-sm text-slate-600">
              {email.applicationMatch.applicationId ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
                  <p className="font-medium text-blue-950">
                    <span className="text-blue-700">Matched:</span>{" "}
                    {email.applicationMatch.company} -{" "}
                    {email.applicationMatch.roleTitle}
                  </p>
                  {email.applicationMatch.autoCreated ? (
                    <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                      Auto-created from email
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  No matching application found
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {hiddenEmails.length > 0 ? (
        <details className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Show hidden unrelated emails ({hiddenEmails.length})
          </summary>
          <div className="mt-3 divide-y divide-slate-200">
            {hiddenEmails.map((email) => (
              <div key={email.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {email.subject}
                    </p>
                    <p className="text-sm text-slate-600">{email.fromAddress}</p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-slate-500">
                    {formatDate(email.receivedAt)}
                  </p>
                </div>
                <div className="mt-2">
                  <Badge className="px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    Hidden:{" "}
                    {email.classification.hiddenReasonLabel ?? "unrelated"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : emails.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No hidden unrelated emails in this cached set.
        </div>
      ) : null}
    </Card>
  );
}
