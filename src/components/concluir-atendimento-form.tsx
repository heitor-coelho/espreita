"use client";

import { useState, useTransition } from "react";
import { concluirAtendimento } from "@/app/actions/agendamentos";
import { montarLinkWhatsapp } from "@/lib/whatsapp";

export function ConcluirAtendimentoForm({
  agendamentoId,
  nomeCliente,
  telefoneCliente,
}: {
  agendamentoId: string;
  nomeCliente: string;
  telefoneCliente: string | null;
}) {
  const [valor, setValor] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set("id", agendamentoId);
    formData.set("valor", valor);

    startTransition(async () => {
      await concluirAtendimento(formData);

      if (telefoneCliente) {
        const primeiroNome = nomeCliente.split(" ")[0];
        const valorFormatado = Number(valor).toFixed(2).replace(".", ",");
        const mensagem =
          `Olá, ${primeiroNome}! Aqui é da oficina. Seu veículo está pronto ` +
          `pra retirada. Total: R$ ${valorFormatado}`;
        window.open(montarLinkWhatsapp(telefoneCliente, mensagem), "_blank");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <span className="text-xs text-ink-muted">R$</span>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="0,00"
        required
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="campo w-20 px-2 py-1.5 text-xs"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        Concluir
      </button>
    </form>
  );
}
