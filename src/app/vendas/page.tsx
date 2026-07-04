import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function VendasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell oficinaNome={session.user.oficinaNome}>
      <h1 className="mb-2 text-lg font-medium text-ink">Vendas</h1>
      <p className="text-sm text-ink-muted">
        A parte de loja (produtos, vendas e relatórios) chega na próxima
        etapa.
      </p>
    </AppShell>
  );
}
