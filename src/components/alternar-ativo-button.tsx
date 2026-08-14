"use client";

import { useTransition } from "react";
import { alternarAtivoFuncionario } from "@/app/actions/funcionarios";

export function AlternarAtivoButton({
  id,
  ativo,
}: {
  id: string;
  ativo: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (ativo && !confirm("Desativar esse funcionário? Ele não vai mais conseguir entrar no app.")) {
      return;
    }
    startTransition(() => {
      alternarAtivoFuncionario(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex-none rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
        ativo
          ? "bg-surface-2 text-ink-muted"
          : "bg-badge-concluido text-badge-concluido-ink"
      }`}
    >
      {ativo ? "Desativar" : "Reativar"}
    </button>
  );
}
