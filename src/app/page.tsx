import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { AgendamentoCard } from "@/components/agendamento-card";
import { FilaAgendamentos } from "@/components/fila-agendamentos";

function inicioFimDoDia(data: Date) {
  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(data);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

export default async function HojePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { inicio, fim } = inicioFimDoDia(new Date());

  const [agendamentos, oficina] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        oficinaId: session.user.oficinaId,
        OR: [
          { dataHora: { gte: inicio, lte: fim } },
          { status: "EM_ATENDIMENTO" },
        ],
      },
      include: {
        cliente: true,
        veiculo: true,
        itensRevisao: {
          where: { status: { not: "PENDENTE" }, vistoOficinaEm: null },
          select: { id: true },
        },
      },
      orderBy: [{ ordemFila: "asc" }, { dataHora: "asc" }],
    }),
    prisma.oficina.findUniqueOrThrow({
      where: { id: session.user.oficinaId },
      select: { nome: true, cidade: true, chavePix: true },
    }),
  ]);

  const emAtendimento = agendamentos.filter((ag) => ag.status === "EM_ATENDIMENTO");
  const fila = agendamentos
    .filter((ag) => ag.status === "AGENDADO")
    .map((ag) => ({ ...ag, temNovidade: ag.itensRevisao.length > 0 }));
  const concluidosHoje = agendamentos.filter((ag) => ag.status === "CONCLUIDO");

  const hojeFormatado = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-ink">Hoje</h1>
          <p className="text-xs capitalize text-ink-muted">{hojeFormatado}</p>
        </div>
        <Link
          href="/agendamentos/novo"
          aria-label="Novo agendamento"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white"
        >
          <Plus size={20} />
        </Link>
      </div>

      {agendamentos.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Nenhum agendamento para hoje. Toque no + para criar o primeiro.
        </p>
      ) : (
        <div className="space-y-5">
          {emAtendimento.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-ink">Em atendimento</h2>
              <ul className="space-y-3">
                {emAtendimento.map((ag) => (
                  <AgendamentoCard
                    key={ag.id}
                    agendamento={ag}
                    temNovidade={ag.itensRevisao.length > 0}
                    chavePixOficina={oficina.chavePix}
                    nomeOficina={oficina.nome}
                    cidadeOficina={oficina.cidade}
                  />
                ))}
              </ul>
            </div>
          )}

          <FilaAgendamentos
            agendamentos={fila}
            chavePixOficina={oficina.chavePix}
            nomeOficina={oficina.nome}
            cidadeOficina={oficina.cidade}
          />

          {concluidosHoje.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-ink">Concluídos hoje</h2>
              <ul className="space-y-3">
                {concluidosHoje.map((ag) => (
                  <AgendamentoCard key={ag.id} agendamento={ag} compact />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
