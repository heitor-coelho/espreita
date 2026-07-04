import type { StatusAgendamento } from "@prisma/client";
import { STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/agendamento-status";

export function StatusBadge({
  status,
  compact = false,
}: {
  status: StatusAgendamento;
  compact?: boolean;
}) {
  return (
    <span
      className={`rounded-full font-medium ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-xs"
      } ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
