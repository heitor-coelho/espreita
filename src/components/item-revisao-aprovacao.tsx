"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { decidirItemRevisao } from "@/app/actions/revisoes";

type Status = "PENDENTE" | "APROVADO" | "RECUSADO";

export function ItemRevisaoAprovacao({
  agendamentoId,
  itemId,
  statusInicial,
}: {
  agendamentoId: string;
  itemId: string;
  statusInicial: Status;
}) {
  const [status, setStatus] = useState<Status>(statusInicial);
  const [isPending, startTransition] = useTransition();

  function decidir(decisao: "APROVADO" | "RECUSADO") {
    setStatus(decisao);
    startTransition(async () => {
      await decidirItemRevisao(agendamentoId, itemId, decisao);
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => decidir("APROVADO")}
        disabled={isPending}
        className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
          status === "APROVADO"
            ? "bg-badge-concluido text-badge-concluido-ink"
            : "border border-border bg-surface-2 text-ink-muted"
        }`}
      >
        <Check size={14} />
        Autorizo
      </button>
      <button
        type="button"
        onClick={() => decidir("RECUSADO")}
        disabled={isPending}
        className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
          status === "RECUSADO"
            ? "bg-danger text-danger-ink"
            : "border border-border bg-surface-2 text-ink-muted"
        }`}
      >
        <X size={14} />
        Não autorizo
      </button>
    </div>
  );
}
