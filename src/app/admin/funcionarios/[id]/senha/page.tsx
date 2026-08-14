import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";
import { redefinirSenhaFuncionario } from "@/app/actions/funcionarios";

export default async function RedefinirSenhaFuncionarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const { id } = await params;
  const search = await searchParams;

  const funcionario = await prisma.usuario.findFirst({
    where: { id, oficinaId: session.user.oficinaId, papel: "FUNCIONARIO" },
    select: { id: true, nome: true },
  });
  if (!funcionario) notFound();

  const redefinirComId = redefinirSenhaFuncionario.bind(null, id);

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/admin/funcionarios" className="text-xs text-ink-faint">
        ← Voltar pra funcionários
      </Link>

      <h1 className="mb-1 mt-3 text-lg font-medium text-ink">
        Nova senha
      </h1>
      <p className="mb-4 text-xs text-ink-muted">
        Redefinir o acesso de <span className="text-ink">{funcionario.nome}</span>.
        A senha antiga para de funcionar assim que você salvar.
      </p>

      <form action={redefinirComId} className="space-y-4">
        {search?.erro && (
          <p className="rounded-lg bg-danger p-3 text-sm text-danger-ink">
            {search.erro}
          </p>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            Senha nova
          </label>
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            autoFocus
            className="campo"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent p-3 text-sm font-semibold text-white active:bg-accent-strong"
        >
          Salvar nova senha
        </button>
      </form>
    </AppShell>
  );
}
