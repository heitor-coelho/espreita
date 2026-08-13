import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";
import { inicioDoDia, inicioDaSemana, inicioDoMes } from "@/lib/datas";
import { VendaAcoes } from "@/components/venda-acoes";
import {
  PAGAMENTO_STATUS_LABEL,
  PAGAMENTO_STATUS_BADGE_CLASS,
} from "@/lib/pagamento-status";

function formatarReais(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function formatarDataHora(data: Date) {
  return `${data.toLocaleDateString("pt-BR")} ${data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default async function VendasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const oficinaId = session.user.oficinaId;
  const agora = new Date();
  // Vendida = qualquer coisa que não foi cancelada, tenha sido paga ou não.
  const naoCancelada = { not: "CANCELADO" as const };

  const [totalHoje, totalSemana, totalMes, aReceber, maisVendidos, vendas] =
    await Promise.all([
      prisma.venda.aggregate({
        where: { oficinaId, status: naoCancelada, dataHora: { gte: inicioDoDia(agora) } },
        _sum: { valorTotal: true },
      }),
      prisma.venda.aggregate({
        where: { oficinaId, status: naoCancelada, dataHora: { gte: inicioDaSemana(agora) } },
        _sum: { valorTotal: true },
      }),
      prisma.venda.aggregate({
        where: { oficinaId, status: naoCancelada, dataHora: { gte: inicioDoMes(agora) } },
        _sum: { valorTotal: true },
      }),
      prisma.venda.aggregate({
        where: { oficinaId, status: "PENDENTE" },
        _sum: { valorTotal: true },
        _count: true,
      }),
      prisma.itemVenda.groupBy({
        by: ["produtoId"],
        where: { venda: { oficinaId, status: naoCancelada, dataHora: { gte: inicioDoMes(agora) } } },
        _sum: { quantidade: true },
        orderBy: { _sum: { quantidade: "desc" } },
        take: 5,
      }),
      prisma.venda.findMany({
        where: { oficinaId },
        include: {
          cliente: { select: { nome: true } },
          itens: { include: { produto: { select: { nome: true } } } },
        },
        orderBy: { dataHora: "desc" },
        take: 50,
      }),
    ]);

  const produtosMaisVendidos = maisVendidos.length
    ? await prisma.produto.findMany({
        where: { id: { in: maisVendidos.map((m) => m.produtoId) } },
        select: { id: true, nome: true },
      })
    : [];
  const nomeProdutoPorId = new Map(
    produtosMaisVendidos.map((p) => [p.id, p.nome]),
  );

  const vendasAReceber = vendas.filter((v) => v.status === "PENDENTE");
  const vendasHistorico = vendas.filter((v) => v.status !== "PENDENTE");

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-lg font-medium text-ink">Vendas</h1>
        <Link
          href="/vendas/novo"
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          <Plus size={14} strokeWidth={2} />
          Nova venda
        </Link>
      </div>

      {Number(aReceber._sum.valorTotal ?? 0) > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-badge-agendado-ink/30 bg-badge-agendado/10 p-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-badge-agendado text-badge-agendado-ink">
            <Wallet size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">
              A receber · {aReceber._count} venda{aReceber._count > 1 ? "s" : ""}
            </p>
            <p className="text-lg font-semibold text-ink">
              {formatarReais(Number(aReceber._sum.valorTotal ?? 0))}
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2">
        <ResumoCard
          rotulo="Vendido hoje"
          valor={formatarReais(Number(totalHoje._sum.valorTotal ?? 0))}
        />
        <ResumoCard
          rotulo="Na semana"
          valor={formatarReais(Number(totalSemana._sum.valorTotal ?? 0))}
        />
        <ResumoCard
          rotulo="No mês"
          valor={formatarReais(Number(totalMes._sum.valorTotal ?? 0))}
        />
      </div>

      {maisVendidos.length > 0 && (
        <div className="mb-4 rounded-lg border border-border bg-surface p-3">
          <p className="mb-2 text-xs font-medium text-ink-muted">
            Mais vendidas no mês
          </p>
          <ul className="space-y-1">
            {maisVendidos.map((m) => (
              <li
                key={m.produtoId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink">
                  {nomeProdutoPorId.get(m.produtoId) ?? "Peça removida"}
                </span>
                <span className="text-ink-muted">
                  {m._sum.quantidade}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {vendas.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Nenhuma venda registrada ainda.
        </p>
      ) : (
        <div className="space-y-5">
          {vendasAReceber.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-ink">A receber</h2>
              <ul className="space-y-2">
                {vendasAReceber.map((venda) => (
                  <li
                    key={venda.id}
                    className="rounded-xl border border-border bg-surface p-3"
                  >
                    <VendaResumo venda={venda} />
                    <VendaAcoes vendaId={venda.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {vendasHistorico.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-ink">Histórico</h2>
              <ul className="space-y-2">
                {vendasHistorico.map((venda) => (
                  <li
                    key={venda.id}
                    className={`rounded-xl border border-border bg-surface p-3 ${
                      venda.status === "CANCELADO" ? "opacity-50" : ""
                    }`}
                  >
                    <VendaResumo venda={venda} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function VendaResumo({
  venda,
}: {
  venda: {
    id: string;
    status: "PENDENTE" | "PAGO" | "CANCELADO";
    valorTotal: unknown;
    dataHora: Date;
    cliente: { nome: string } | null;
    itens: { quantidade: number; produto: { nome: string } }[];
  };
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {venda.cliente?.nome ?? "Venda avulsa"}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {venda.itens
              .map((item) => `${item.quantidade}× ${item.produto.nome}`)
              .join(", ")}
          </p>
        </div>
        <div className="flex-none text-right">
          <p className="text-sm font-semibold text-ink">
            {formatarReais(Number(venda.valorTotal))}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${PAGAMENTO_STATUS_BADGE_CLASS[venda.status]}`}
          >
            {PAGAMENTO_STATUS_LABEL[venda.status]}
          </span>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-ink-faint">
        {formatarDataHora(venda.dataHora)}
      </p>
    </>
  );
}

function ResumoCard({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-ink-muted">{rotulo}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{valor}</p>
    </div>
  );
}
