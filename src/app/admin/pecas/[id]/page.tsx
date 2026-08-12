import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { ProdutoForm } from "@/components/produto-form";
import { exigirDono } from "@/lib/autorizacao";
import { inativarProduto, reativarProduto } from "@/app/actions/produtos";

export default async function PecaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const { id } = await params;

  const produto = await prisma.produto.findFirst({
    where: { id, oficinaId: session.user.oficinaId },
  });

  if (!produto) notFound();

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/admin/pecas" className="text-xs text-ink-faint">
        ← Voltar pra peças
      </Link>

      <div className="mb-4 mt-3 flex items-center justify-between gap-2">
        <h1 className="text-lg font-medium text-ink">{produto.nome}</h1>
        {!produto.ativo && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink-faint">
            Inativa
          </span>
        )}
      </div>

      <ProdutoForm
        produto={{
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao,
          codigo: produto.codigo,
          categoria: produto.categoria,
          unidade: produto.unidade,
          precoVenda: produto.precoVenda.toString(),
          custo: produto.custo?.toString() ?? null,
          estoqueQtd: produto.estoqueQtd,
          estoqueMinimo: produto.estoqueMinimo,
        }}
      />

      <form
        action={
          produto.ativo
            ? inativarProduto.bind(null, produto.id)
            : reativarProduto.bind(null, produto.id)
        }
        className="mt-4"
      >
        <button
          type="submit"
          className="w-full rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-ink-muted"
        >
          {produto.ativo ? "Inativar peça" : "Reativar peça"}
        </button>
      </form>
    </AppShell>
  );
}
