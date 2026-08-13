import type { StatusPagamento } from "@prisma/client";

export const PAGAMENTO_STATUS_LABEL: Record<StatusPagamento, string> = {
  PENDENTE: "A receber",
  PAGO: "Pago",
  CANCELADO: "Cancelada",
};

export const PAGAMENTO_STATUS_BADGE_CLASS: Record<StatusPagamento, string> = {
  PENDENTE: "bg-badge-agendado text-badge-agendado-ink",
  PAGO: "bg-badge-concluido text-badge-concluido-ink",
  CANCELADO: "bg-badge-cancelado text-badge-cancelado-ink",
};
