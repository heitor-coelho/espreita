"use client";

import { useState, useTransition } from "react";
import { concluirAtendimento } from "@/app/actions/agendamentos";
import { montarLinkWhatsapp } from "@/lib/whatsapp";
import { gerarCodigoPix } from "@/lib/pix";
import { celebrarAtendimentoConcluido } from "@/lib/celebrar";

export function ConcluirAtendimentoForm({
  agendamentoId,
  nomeCliente,
  telefoneCliente,
  chavePixOficina = null,
  nomeOficina = "",
  cidadeOficina = null,
}: {
  agendamentoId: string;
  nomeCliente: string;
  telefoneCliente: string | null;
  chavePixOficina?: string | null;
  nomeOficina?: string;
  cidadeOficina?: string | null;
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
      celebrarAtendimentoConcluido();

      if (telefoneCliente) {
        const primeiroNome = nomeCliente.split(" ")[0];
        const valorFormatado = Number(valor).toFixed(2).replace(".", ",");
        let mensagem =
          `Olá, ${primeiroNome}! Aqui é da oficina. Seu veículo está pronto ` +
          `pra retirada. Total: R$ ${valorFormatado}`;

        // Chave Pix configurada em /admin/pix — anexa o código "copia e
        // cola" direto na mensagem, sem precisar de QR (não dá pra
        // escanear dentro do próprio chat).
        if (chavePixOficina) {
          const codigoPix = gerarCodigoPix({
            chave: chavePixOficina,
            nomeRecebedor: nomeOficina,
            cidade: cidadeOficina,
            valor: Number(valor),
            identificador: agendamentoId,
          });
          mensagem += `\n\nPix copia e cola:\n${codigoPix}`;
        }

        // Pequeno atraso antes de sair pro WhatsApp — dá tempo do toast de
        // comemoração aparecer antes da troca de app/aba no celular.
        setTimeout(() => {
          window.open(montarLinkWhatsapp(telefoneCliente, mensagem), "_blank");
        }, 450);
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
