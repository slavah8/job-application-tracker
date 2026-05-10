"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { syncYahooEmails } from "@/features/email/actions/sync-email";

type SyncEmailState = {
  message?: string;
  error?: string;
};

const initialSyncEmailState: SyncEmailState = {};

export function EmailSyncButton() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    syncYahooEmails,
    initialSyncEmailState,
  );

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [router, state.message]);

  return (
    <form action={formAction} className="space-y-2">
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "Syncing Yahoo..." : "Sync Yahoo"}
      </button>

      {state.message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {state.message}
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
