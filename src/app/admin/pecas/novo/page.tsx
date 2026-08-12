import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProdutoForm } from "@/components/produto-form";
import { exigirDono } from "@/lib/autorizacao";

export default async function NovaPecaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/admin/pecas" className="text-xs text-ink-faint">
        ← Voltar pra peças
      </Link>

      <h1 className="mb-4 mt-3 text-lg font-medium text-ink">Nova peça</h1>

      <ProdutoForm />
    </AppShell>
  );
}
