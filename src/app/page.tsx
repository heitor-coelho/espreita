import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { AgendamentoCard } from "@/components/agendamento-card";

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

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      oficinaId: session.user.oficinaId,
      dataHora: { gte: inicio, lte: fim },
    },
    include: { cliente: true, veiculo: true },
    orderBy: { dataHora: "asc" },
  });

  const hojeFormatado = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <AppShell oficinaNome={session.user.oficinaNome}>
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
        <ul className="space-y-3">
          {agendamentos.map((ag) => (
            <AgendamentoCard key={ag.id} agendamento={ag} />
          ))}
        </ul>
      )}
    </AppShell>
  );
}
