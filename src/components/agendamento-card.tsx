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
  clicavel?: boolean;
  chavePixOficina?: string | null;
  nomeOficina?: string;
  cidadeOficina?: string | null;
};

export function AgendamentoCard({
  agendamento: ag,
  compact = false,
  temNovidade = false,
  clicavel = false,
  chavePixOficina = null,
  nomeOficina = "",
  cidadeOficina = null,
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
      {clicavel ? (
        <Link
          href={`/agendamentos/${ag.id}`}
          className="block rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label={`Ver detalhes do agendamento de ${ag.cliente.nome}`}
        >
          <ResumoAgendamento
            agendamento={ag}
            compact={compact}
            hora={hora}
            veiculoDescricao={veiculoDescricao}
            temNovidade={temNovidade}
          />
        </Link>
      ) : (
        <ResumoAgendamento
          agendamento={ag}
          compact={compact}
          hora={hora}
          veiculoDescricao={veiculoDescricao}
          temNovidade={temNovidade}
        />
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
              chavePixOficina={chavePixOficina}
              nomeOficina={nomeOficina}
              cidadeOficina={cidadeOficina}
            />
          )}
        </div>
      )}
    </li>
  );
}

function ResumoAgendamento({
  agendamento: ag,
  compact,
  hora,
  veiculoDescricao,
  temNovidade,
}: {
  agendamento: AgendamentoCardProps["agendamento"];
  compact: boolean;
  hora: string;
  veiculoDescricao: string;
  temNovidade: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex items-center gap-1.5 font-medium text-ink ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {temNovidade && (
            <span
              aria-label="Cliente respondeu a revisão"
              title="Cliente respondeu a revisão"
              className="h-1.5 w-1.5 flex-none rounded-full bg-danger-ink"
            />
          )}
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
            <p className="mt-1 text-xs text-ink-faint">{ag.problemaRelatado}</p>
          )}
        </>
      )}
    </>
  );
}
