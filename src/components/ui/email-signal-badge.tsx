import type { EmailSignalType } from "@/features/email/services/email-classifier";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EmailSignalBadgeProps = {
  signalType: EmailSignalType;
  label: string;
  className?: string;
};

const signalStyles: Record<EmailSignalType, string> = {
  APPLICATION_CONFIRMATION: "bg-blue-100 text-blue-800 ring-blue-300",
  PENDING_OR_UPDATE: "bg-indigo-100 text-indigo-800 ring-indigo-300",
  REJECTION: "bg-red-100 text-red-800 ring-red-300",
  INTERVIEW: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  OFFER: "bg-amber-100 text-amber-900 ring-amber-300",
};

const dotStyles: Record<EmailSignalType, string> = {
  APPLICATION_CONFIRMATION: "bg-blue-600",
  PENDING_OR_UPDATE: "bg-indigo-600",
  REJECTION: "bg-red-600",
  INTERVIEW: "bg-emerald-600",
  OFFER: "bg-amber-500",
};

export function EmailSignalBadge({
  signalType,
  label,
  className,
}: EmailSignalBadgeProps) {
  return (
    <Badge
      className={cn(
        "gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 shadow-sm",
        signalStyles[signalType],
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotStyles[signalType])} />
      Detected: {label}
    </Badge>
  );
}
