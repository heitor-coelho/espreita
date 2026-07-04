import type { StatusAgendamento } from "@prisma/client";

export const STATUS_LABEL: Record<StatusAgendamento, string> = {
  AGENDADO: "Agendado",
  EM_ATENDIMENTO: "Atendendo",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const STATUS_BADGE_CLASS: Record<StatusAgendamento, string> = {
  AGENDADO: "bg-badge-agendado text-badge-agendado-ink",
  EM_ATENDIMENTO: "bg-badge-atendimento text-badge-atendimento-ink",
  CONCLUIDO: "bg-badge-concluido text-badge-concluido-ink",
  CANCELADO: "bg-badge-cancelado text-badge-cancelado-ink",
};
