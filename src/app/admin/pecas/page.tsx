import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";

export default async function PecasPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; baixo?: string; inativos?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const { busca, baixo, inativos } = await searchParams;
  const termo = busca?.trim();
  const somenteBaixo = baixo === "1";
  const mostrarInativos = inativos === "1";

  const produtos = await prisma.produto.findMany({
    where: {
      oficinaId: session.user.oficinaId,
      ativo: !mostrarInativos,
      ...(termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" as const } },
              { codigo: { contains: termo, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
  });

  // Prisma não compara duas colunas da mesma linha em `where` — filtra em JS
  // (catálogo por oficina é pequeno, sem necessidade de SQL cru aqui).
  const lista = somenteBaixo
    ? produtos.filter((p) => p.estoqueQtd <= p.estoqueMinimo)
    : produtos;

  const paramsBase = new URLSearchParams();
  if (termo) paramsBase.set("busca", termo);
  if (mostrarInativos) paramsBase.set("inativos", "1");

  const hrefBaixo = new URLSearchParams(paramsBase);
  if (!somenteBaixo) hrefBaixo.set("baixo", "1");

  const hrefInativos = new URLSearchParams(paramsBase);
  hrefInativos.delete("inativos");
  if (somenteBaixo) hrefInativos.set("baixo", "1");
  if (!mostrarInativos) hrefInativos.set("inativos", "1");

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/admin" className="text-xs text-ink-faint">
        ← Voltar pra administração
      </Link>

      <div className="mb-4 mt-3 flex items-center justify-between gap-2">
        <h1 className="text-lg font-medium text-ink">Peças</h1>
        <Link
          href="/admin/pecas/novo"
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          <Plus size={14} strokeWidth={2} />
          Nova peça
        </Link>
      </div>

      <form className="relative mb-3">
        <Search
          size={16}
          strokeWidth={1.75}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="text"
          name="busca"
          defaultValue={termo}
          placeholder="Buscar por nome ou código"
          className="campo pl-9"
        />
        {somenteBaixo && <input type="hidden" name="baixo" value="1" />}
        {mostrarInativos && <input type="hidden" name="inativos" value="1" />}
      </form>

      <div className="mb-4 flex gap-2">
        <Link
          href={`/admin/pecas?${hrefBaixo.toString()}`}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            somenteBaixo
              ? "bg-accent text-white"
              : "border border-border bg-surface text-ink-muted"
          }`}
        >
          Estoque baixo
        </Link>
        <Link
          href={`/admin/pecas?${hrefInativos.toString()}`}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            mostrarInativos
              ? "bg-accent text-white"
              : "border border-border bg-surface text-ink-muted"
          }`}
        >
          {mostrarInativos ? "Vendo inativas" : "Ver inativas"}
        </Link>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          {termo || somenteBaixo || mostrarInativos
            ? "Nenhuma peça encontrada."
            : "Nenhuma peça cadastrada ainda."}
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((produto) => (
            <li key={produto.id}>
              <Link
                href={`/admin/pecas/${produto.id}`}
                className="block rounded-xl border border-border bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {produto.nome}
                  </span>
                  <span className="text-sm font-medium text-ink">
                    R$ {Number(produto.precoVenda).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Estoque: {produto.estoqueQtd}
                  {produto.unidade ? ` ${produto.unidade}` : ""}
                  {" · mínimo "}
                  {produto.estoqueMinimo}
                  {produto.codigo ? ` · ${produto.codigo}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
