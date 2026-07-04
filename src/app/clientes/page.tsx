import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { busca } = await searchParams;
  const termo = busca?.trim();

  const clientes = await prisma.cliente.findMany({
    where: {
      oficinaId: session.user.oficinaId,
      ...(termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" as const } },
              { telefone: { contains: termo } },
              {
                veiculos: {
                  some: { placa: { contains: termo, mode: "insensitive" as const } },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      veiculos: { select: { id: true, placa: true, marca: true, modelo: true } },
      _count: { select: { agendamentos: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <AppShell oficinaNome={session.user.oficinaNome}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-lg font-medium text-ink">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          <Plus size={14} strokeWidth={2} />
          Novo cliente
        </Link>
      </div>

      <form className="relative mb-4">
        <Search
          size={16}
          strokeWidth={1.75}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="text"
          name="busca"
          defaultValue={termo}
          placeholder="Buscar por nome, telefone ou placa"
          className="campo pl-9"
        />
      </form>

      {clientes.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          {termo
            ? "Nenhum cliente encontrado."
            : "Nenhum cliente cadastrado ainda."}
        </p>
      ) : (
        <ul className="space-y-2">
          {clientes.map((cliente) => {
            const veiculosDescricao = cliente.veiculos
              .map((v) => [v.marca, v.modelo, v.placa].filter(Boolean).join(" "))
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={cliente.id}>
                <Link
                  href={`/clientes/${cliente.id}`}
                  className="block rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">
                      {cliente.nome}
                    </span>
                    <span className="text-[11px] text-ink-faint">
                      {cliente._count.agendamentos}{" "}
                      {cliente._count.agendamentos === 1
                        ? "atendimento"
                        : "atendimentos"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {[cliente.telefone, veiculosDescricao || "Sem veículo cadastrado"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
