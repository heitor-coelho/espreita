import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { criarCliente } from "@/app/actions/clientes";

export default async function NovoClientePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell oficinaNome={session.user.oficinaNome}>
      <Link href="/clientes" className="text-xs text-ink-faint">
        ← Voltar pra clientes
      </Link>

      <h1 className="mb-4 mt-3 text-lg font-medium text-ink">Novo cliente</h1>

      <form action={criarCliente} className="space-y-4">
        <Campo label="Nome">
          <input name="nome" required className="campo" />
        </Campo>

        <Campo label="Telefone (WhatsApp)">
          <input name="telefone" type="tel" className="campo" />
        </Campo>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white"
        >
          Salvar cliente
        </button>
      </form>
    </AppShell>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
