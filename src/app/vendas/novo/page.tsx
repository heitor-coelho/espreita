import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { VendaForm } from "@/components/venda-form";
import { exigirDono } from "@/lib/autorizacao";

export default async function NovaVendaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const [produtos, clientes] = await Promise.all([
    prisma.produto.findMany({
      where: {
        oficinaId: session.user.oficinaId,
        ativo: true,
        estoqueQtd: { gt: 0 },
      },
      select: {
        id: true,
        nome: true,
        precoVenda: true,
        estoqueQtd: true,
        unidade: true,
      },
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.findMany({
      where: { oficinaId: session.user.oficinaId },
      select: { id: true, nome: true, telefone: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/vendas" className="text-xs text-ink-faint">
        ← Voltar pras vendas
      </Link>

      <h1 className="mb-4 mt-3 text-lg font-medium text-ink">Nova venda</h1>

      {produtos.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Nenhuma peça com estoque disponível.{" "}
          <Link href="/admin/pecas" className="text-accent-strong">
            Cadastre peças
          </Link>{" "}
          antes de registrar uma venda.
        </p>
      ) : (
        <VendaForm
          produtos={produtos.map((p) => ({
            ...p,
            precoVenda: p.precoVenda.toString(),
          }))}
          clientes={clientes}
        />
      )}
    </AppShell>
  );
}
