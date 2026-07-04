import type { StatusItemRevisao } from "@prisma/client";

export const ITEM_REVISAO_STATUS_LABEL: Record<StatusItemRevisao, string> = {
  PENDENTE: "Aguardando aprovação",
  APROVADO: "Autorizado",
  RECUSADO: "Não autorizado",
};

export const ITEM_REVISAO_STATUS_BADGE_CLASS: Record<StatusItemRevisao, string> = {
  PENDENTE: "bg-badge-agendado text-badge-agendado-ink",
  APROVADO: "bg-badge-concluido text-badge-concluido-ink",
  RECUSADO: "bg-danger text-danger-ink",
};
