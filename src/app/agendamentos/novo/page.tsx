import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { criarAgendamento } from "./actions";

export default async function NovoAgendamentoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <h1 className="mb-4 text-lg font-medium text-ink">Novo agendamento</h1>

      <form action={criarAgendamento} className="space-y-4">
        <Campo label="Nome do cliente">
          <input name="clienteNome" required className="campo" />
        </Campo>

        <Campo label="Telefone do cliente">
          <input name="clienteTelefone" type="tel" className="campo" />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Marca/modelo">
            <input name="veiculoModelo" className="campo" />
          </Campo>
          <Campo label="Placa">
            <input name="veiculoPlaca" className="campo" />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data">
            <input
              name="data"
              type="date"
              defaultValue={hoje}
              required
              className="campo"
            />
          </Campo>
          <Campo label="Hora">
            <input name="hora" type="time" required className="campo" />
          </Campo>
        </div>

        <Campo label="Problema relatado">
          <textarea name="problema" rows={3} className="campo" />
        </Campo>

        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white"
        >
          Salvar agendamento
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
