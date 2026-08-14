import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";
import { criarFuncionario } from "@/app/actions/funcionarios";

export default async function NovoFuncionarioPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);
  const params = await searchParams;

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/admin/funcionarios" className="text-xs text-ink-faint">
        ← Voltar pra funcionários
      </Link>

      <h1 className="mb-4 mt-3 text-lg font-medium text-ink">
        Novo funcionário
      </h1>

      <form action={criarFuncionario} className="space-y-4">
        {params?.erro && (
          <p className="rounded-lg bg-danger p-3 text-sm text-danger-ink">
            {params.erro}
          </p>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            Nome
          </label>
          <input name="nome" required autoFocus className="campo" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            Telefone (é o que ele vai usar pra entrar)
          </label>
          <input
            name="telefone"
            type="tel"
            required
            className="campo"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">
            Senha
          </label>
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            className="campo"
          />
          <p className="mt-1 text-[11px] text-ink-faint">
            Combine com ele depois — ele pode continuar usando essa senha ou
            você troca quando quiser criando outro funcionário.
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent p-3 text-sm font-semibold text-white active:bg-accent-strong"
        >
          Criar acesso
        </button>
      </form>
    </AppShell>
  );
}
