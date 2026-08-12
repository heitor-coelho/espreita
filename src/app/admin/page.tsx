import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <h1 className="mb-4 text-lg font-medium text-ink">Administração</h1>

      <Link
        href="/admin/pecas"
        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
      >
        <Package size={20} strokeWidth={1.75} className="text-ink-muted" />
        <div>
          <p className="text-sm font-medium text-ink">Peças</p>
          <p className="text-xs text-ink-muted">Estoque, preços e custos</p>
        </div>
      </Link>
    </AppShell>
  );
}
