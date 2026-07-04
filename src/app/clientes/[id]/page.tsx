import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { EditarVeiculoToggle, NovoVeiculoToggle } from "@/components/veiculo-form";

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id, oficinaId: session.user.oficinaId },
    include: {
      veiculos: { orderBy: { criadoEm: "asc" } },
      agendamentos: {
        orderBy: { dataHora: "desc" },
        include: { veiculo: { select: { marca: true, modelo: true, placa: true } } },
      },
    },
  });

  if (!cliente) notFound();

  const linkWhatsapp = cliente.telefone
    ? `https://wa.me/55${cliente.telefone.replace(/\D/g, "")}`
    : null;

  return (
    <AppShell oficinaNome={session.user.oficinaNome}>
      <Link href="/clientes" className="text-xs text-ink-faint">
        ← Voltar pra clientes
      </Link>

      <div className="mb-5 mt-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-medium text-ink">{cliente.nome}</h1>
          {cliente.telefone && (
            <p className="text-xs text-ink-muted">{cliente.telefone}</p>
          )}
        </div>
        {linkWhatsapp && (
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink"
          >
            <MessageCircle size={14} strokeWidth={1.75} />
            WhatsApp
          </a>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-ink">Veículos</h2>
      <div className="mb-5 space-y-2">
        {cliente.veiculos.map((veiculo) => (
          <EditarVeiculoToggle
            key={veiculo.id}
            clienteId={cliente.id}
            veiculo={veiculo}
          />
        ))}
        <NovoVeiculoToggle clienteId={cliente.id} />
      </div>

      <h2 className="mb-2 text-sm font-medium text-ink">Histórico</h2>
      {cliente.agendamentos.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Nenhum atendimento registrado ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {cliente.agendamentos.map((ag) => {
            const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }).format(ag.dataHora);

            const veiculoDescricao =
              [ag.veiculo.marca, ag.veiculo.modelo, ag.veiculo.placa]
                .filter(Boolean)
                .join(" · ") || "Veículo sem dados";

            return (
              <li key={ag.id}>
                <Link
                  href={`/agendamentos/${ag.id}`}
                  className="block rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-muted">{dataFormatada}</span>
                    <StatusBadge status={ag.status} compact />
                  </div>
                  <p className="mt-1 text-sm text-ink">{veiculoDescricao}</p>
                  {ag.problemaRelatado && (
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {ag.problemaRelatado}
                    </p>
                  )}
                  {ag.valor !== null && (
                    <p className="mt-1 text-xs font-medium text-ink">
                      R$ {Number(ag.valor).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
