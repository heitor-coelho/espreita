"use client";

import { useState } from "react";
import { marcarRevisaoEnviada } from "@/app/actions/revisoes";
import { montarLinkWhatsapp } from "@/lib/whatsapp";

type Variante = "primeiro-envio" | "atualizacao" | "cobranca";

const TEXTO_BOTAO: Record<Variante, string> = {
  "primeiro-envio": "Enviar revisão pro cliente (WhatsApp)",
  atualizacao: "Enviar revisão atualizada (WhatsApp)",
  cobranca: "Cobrar resposta do cliente (WhatsApp)",
};

// Botão primário (fundo cheio) só quando tem algo novo pra comunicar.
// "Cobrar resposta" é uma ação secundária — a revisão já foi enviada, é só
// um lembrete — então fica com contorno em vez de competir visualmente.
const CLASSE_BOTAO: Record<Variante, string> = {
  "primeiro-envio":
    "w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50",
  atualizacao:
    "w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50",
  cobranca:
    "w-full rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink-muted disabled:opacity-50",
};

export function EnviarRevisaoButton({
  agendamentoId,
  telefoneCliente,
  nomeCliente,
  linkPublico,
  totalItens,
  pendentes,
  valorTotal,
  variante,
}: {
  agendamentoId: string;
  telefoneCliente: string;
  nomeCliente: string;
  linkPublico: string;
  totalItens: number;
  pendentes: number;
  valorTotal: number;
  variante: Variante;
}) {
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    setEnviando(true);

    const valorFormatado = valorTotal.toFixed(2).replace(".", ",");
    const primeiroNome = nomeCliente.split(" ")[0];

    const mensagem =
      variante === "cobranca"
        ? `Olá, ${primeiroNome}! Aqui é da oficina. Ainda estou aguardando sua resposta ` +
          `sobre ${pendentes === 1 ? "1 item" : `${pendentes} itens`} da revisão do seu veículo. ` +
          `Dá uma olhada quando puder: ${linkPublico}`
        : `Olá, ${primeiroNome}! Aqui é da oficina. ` +
          `Encontramos ${totalItens} ${totalItens === 1 ? "item" : "itens"} na revisão do seu veículo ` +
          `(total estimado R$ ${valorFormatado}). Veja as fotos e os detalhes aqui: ${linkPublico}`;

    const linkWhatsapp = montarLinkWhatsapp(telefoneCliente, mensagem);

    try {
      // Cobrança é só um lembrete — não reconta como "revisão enviada" de
      // novo, então não mexe em revisaoEnviadaEm.
      if (variante !== "cobranca") {
        await marcarRevisaoEnviada(agendamentoId);
      }
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
      className={CLASSE_BOTAO[variante]}
    >
      {TEXTO_BOTAO[variante]}
    </button>
  );
}
