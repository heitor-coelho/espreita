import type { StatusAgendamento } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import {
  iniciarAtendimento,
  concluirAtendimento,
} from "@/app/actions/agendamentos";

type AgendamentoCardProps = {
  agendamento: {
    id: string;
    status: StatusAgendamento;
    dataHora: Date;
    problemaRelatado: string | null;
    cliente: { nome: string };
    veiculo: {
      marca: string | null;
      modelo: string | null;
      placa: string | null;
    };
  };
  compact?: boolean;
};

export function AgendamentoCard({
  agendamento: ag,
  compact = false,
}: AgendamentoCardProps) {
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(ag.dataHora);

  const veiculoDescricao =
    [ag.veiculo.marca, ag.veiculo.modelo].filter(Boolean).join(" ") ||
    "Veículo sem marca/modelo";

  return (
    <li
      className={`rounded-xl border border-border bg-surface ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-medium text-ink ${compact ? "text-xs" : "text-sm"}`}
        >
          {hora}
          {!compact && ` · ${ag.cliente.nome}`}
        </span>
        <StatusBadge status={ag.status} compact={compact} />
      </div>

      {compact ? (
        <p className="mt-1 truncate text-[11px] text-ink-muted">
          {ag.cliente.nome}
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-ink-muted">
            {veiculoDescricao}
            {ag.veiculo.placa ? ` · ${ag.veiculo.placa}` : ""}
          </p>
          {ag.problemaRelatado && (
            <p className="mt-1 text-xs text-ink-faint">
              {ag.problemaRelatado}
            </p>
          )}
        </>
      )}

      {!compact && ag.status === "AGENDADO" && (
        <form action={iniciarAtendimento} className="mt-3">
          <input type="hidden" name="id" value={ag.id} />
          <button
            type="submit"
            className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink"
          >
            Iniciar atendimento
          </button>
        </form>
      )}

      {!compact && ag.status === "EM_ATENDIMENTO" && (
        <div className="mt-3 space-y-2">
          <Link
            href={`/agendamentos/${ag.id}`}
            className="inline-block rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink"
          >
            Revisão (fotos e itens)
          </Link>
          <form
            action={concluirAtendimento}
            className="flex items-center gap-2"
          >
            <input type="hidden" name="id" value={ag.id} />
            <span className="text-xs text-ink-muted">R$</span>
            <input
              type="number"
              name="valor"
              step="0.01"
              min="0"
              placeholder="0,00"
              required
              className="campo w-20 px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
            >
              Concluir
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
