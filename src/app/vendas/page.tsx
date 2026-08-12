import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";
import { inicioDoDia, inicioDaSemana, inicioDoMes } from "@/lib/datas";

function formatarReais(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

export default async function VendasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const oficinaId = session.user.oficinaId;
  const agora = new Date();

  const [totalHoje, totalSemana, totalMes, maisVendidos, vendas] =
    await Promise.all([
      prisma.venda.aggregate({
        where: { oficinaId, dataHora: { gte: inicioDoDia(agora) } },
        _sum: { valorTotal: true },
      }),
      prisma.venda.aggregate({
        where: { oficinaId, dataHora: { gte: inicioDaSemana(agora) } },
        _sum: { valorTotal: true },
      }),
      prisma.venda.aggregate({
        where: { oficinaId, dataHora: { gte: inicioDoMes(agora) } },
        _sum: { valorTotal: true },
      }),
      prisma.itemVenda.groupBy({
        by: ["produtoId"],
        where: { venda: { oficinaId, dataHora: { gte: inicioDoMes(agora) } } },
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

      <div className="mb-4 grid grid-cols-3 gap-2">
        <ResumoCard
          rotulo="Hoje"
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
        <ul className="space-y-2">
          {vendas.map((venda) => (
            <li
              key={venda.id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">
                  {venda.cliente?.nome ?? "Venda avulsa"}
                </span>
                <span className="text-sm font-medium text-ink">
                  {formatarReais(Number(venda.valorTotal))}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {venda.itens
                  .map((item) => `${item.quantidade}× ${item.produto.nome}`)
                  .join(", ")}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-ink-faint">
                  {venda.dataHora.toLocaleDateString("pt-BR")}{" "}
                  {venda.dataHora.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <Link
                  href={`/vendas/${venda.id}/pix`}
                  className="text-xs font-medium text-accent-strong"
                >
                  Cobrar via Pix
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
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
