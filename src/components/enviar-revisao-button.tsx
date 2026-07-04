"use client";

import { useState } from "react";
import { marcarRevisaoEnviada } from "@/app/actions/revisoes";

export function EnviarRevisaoButton({
  agendamentoId,
  telefoneCliente,
  nomeCliente,
  linkPublico,
  totalItens,
  valorTotal,
}: {
  agendamentoId: string;
  telefoneCliente: string;
  nomeCliente: string;
  linkPublico: string;
  totalItens: number;
  valorTotal: number;
}) {
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    setEnviando(true);

    const valorFormatado = valorTotal.toFixed(2).replace(".", ",");
    const primeiroNome = nomeCliente.split(" ")[0];
    const mensagem =
      `Olá, ${primeiroNome}! Aqui é da oficina. ` +
      `Encontramos ${totalItens} ${totalItens === 1 ? "item" : "itens"} na revisão do seu veículo ` +
      `(total estimado R$ ${valorFormatado}). Veja as fotos e os detalhes aqui: ${linkPublico}`;

    // Assume DDD + número (10/11 dígitos), sem código do país — heurística
    // simples pra v1, sem normalização formal de telefone ainda.
    const telefoneLimpo = telefoneCliente.replace(/\D/g, "");
    const linkWhatsapp = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;

    try {
      await marcarRevisaoEnviada(agendamentoId);
    } finally {
      window.open(linkWhatsapp, "_blank");
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enviando}
      className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
    >
      Enviar revisão pro cliente (WhatsApp)
    </button>
  );
}
