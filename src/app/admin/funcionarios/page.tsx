import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";
import { AlternarAtivoButton } from "@/components/alternar-ativo-button";

export default async function FuncionariosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const funcionarios = await prisma.usuario.findMany({
    where: { oficinaId: session.user.oficinaId, papel: "FUNCIONARIO" },
    orderBy: { criadoEm: "asc" },
  });

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/admin" className="text-xs text-ink-faint">
        ← Voltar pra administração
      </Link>

      <div className="mb-1 mt-3 flex items-center justify-between">
        <h1 className="text-lg font-medium text-ink">Funcionários</h1>
        <Link
          href="/admin/funcionarios/novo"
          aria-label="Adicionar funcionário"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white"
        >
          <Plus size={18} />
        </Link>
      </div>
      <p className="mb-4 text-xs text-ink-muted">
        Quem tem conta de funcionário só vê as telas de Hoje e Agenda — sem
        acesso a clientes, vendas ou administração.
      </p>

      {funcionarios.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Nenhum funcionário cadastrado ainda. Toque no + pra criar o
          primeiro login.
        </p>
      ) : (
        <ul className="space-y-2">
          {funcionarios.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3"
            >
              <div>
                <p className="text-sm font-medium text-ink">{f.nome}</p>
                <p className="text-xs text-ink-muted">{f.telefone}</p>
              </div>
              <div className="flex flex-none items-center gap-1.5">
                <Link
                  href={`/admin/funcionarios/${f.id}/senha`}
                  className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-muted"
                >
                  Nova senha
                </Link>
                <AlternarAtivoButton id={f.id} ativo={f.ativo} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
