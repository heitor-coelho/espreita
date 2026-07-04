import type { StatusAgendamento } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { iniciarAtendimento } from "@/app/actions/agendamentos";
import { ConcluirAtendimentoForm } from "@/components/concluir-atendimento-form";

type AgendamentoCardProps = {
  agendamento: {
    id: string;
    status: StatusAgendamento;
    dataHora: Date;
    problemaRelatado: string | null;
    cliente: { nome: string; telefone: string | null };
    veiculo: {
      marca: string | null;
      modelo: string | null;
      placa: string | null;
    };
  };
  compact?: boolean;
  temNovidade?: boolean;
};

export function AgendamentoCard({
  agendamento: ag,
  compact = false,
  temNovidade = false,
}: AgendamentoCardProps) {
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(ag.dataHora);

  const veiculoDescricao =
    [ag.veiculo.marca, ag.veiculo.modelo].filter(Boolean).join(" ") ||
    "Veículo sem marca/modelo";

  if (compact) {
    return (
      <li className="rounded-xl border border-border bg-surface">
        <Link href={`/agendamentos/${ag.id}`} className="block p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
              {temNovidade && (
                <span
                  aria-label="Cliente respondeu a revisão"
                  title="Cliente respondeu a revisão"
                  className="h-1.5 w-1.5 flex-none rounded-full bg-danger-ink"
                />
              )}
              {hora}
            </span>
            <StatusBadge status={ag.status} compact />
          </div>
          <p className="mt-1 truncate text-[11px] text-ink-muted">
            {ag.cliente.nome}
          </p>
        </Link>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          {temNovidade && (
            <span
              aria-label="Cliente respondeu a revisão"
              title="Cliente respondeu a revisão"
              className="h-1.5 w-1.5 flex-none rounded-full bg-danger-ink"
            />
          )}
          {hora}
          {` · ${ag.cliente.nome}`}
        </span>
        <StatusBadge status={ag.status} />
      </div>

      <p className="mt-1 text-xs text-ink-muted">
        {veiculoDescricao}
        {ag.veiculo.placa ? ` · ${ag.veiculo.placa}` : ""}
      </p>
      {ag.problemaRelatado && (
        <p className="mt-1 text-xs text-ink-faint">{ag.problemaRelatado}</p>
      )}

      {ag.status === "AGENDADO" && (
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

      {(ag.status === "EM_ATENDIMENTO" || ag.status === "CONCLUIDO") && (
        <div className="mt-3 space-y-2">
          {temNovidade && (
            <p className="text-xs font-medium text-danger-ink">
              Cliente respondeu a revisão
            </p>
          )}
          <Link
            href={`/agendamentos/${ag.id}`}
            className="inline-block rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink"
          >
            {ag.status === "CONCLUIDO"
              ? "Ver revisão"
              : "Revisão (fotos e itens)"}
          </Link>
          {ag.status === "EM_ATENDIMENTO" && (
            <ConcluirAtendimentoForm
              agendamentoId={ag.id}
              nomeCliente={ag.cliente.nome}
              telefoneCliente={ag.cliente.telefone}
            />
          )}
        </div>
      )}
    </li>
  );
}
