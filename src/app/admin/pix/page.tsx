import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";
import { ChavePixForm } from "@/components/chave-pix-form";

export default async function ConfigurarPixPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const oficina = await prisma.oficina.findUniqueOrThrow({
    where: { id: session.user.oficinaId },
    select: { chavePix: true, nome: true, cidade: true },
  });

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/admin" className="text-xs text-ink-faint">
        ← Voltar pra administração
      </Link>

      <h1 className="mb-1 mt-3 text-lg font-medium text-ink">Cobrança via Pix</h1>
      <p className="mb-4 text-xs text-ink-muted">
        Cadastre a chave Pix da oficina pra gerar QR code e código
        &quot;copia e cola&quot; nas vendas e ao concluir atendimentos. O
        dinheiro cai direto na sua conta — não passa por nenhum
        intermediário.
      </p>

      <ChavePixForm chavePixAtual={oficina.chavePix} />

      {!oficina.cidade && (
        <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-ink-muted">
          A cidade da oficina não está cadastrada — o código Pix vai usar
          &quot;BRASIL&quot; no lugar. Isso não impede o pagamento.
        </p>
      )}
    </AppShell>
  );
}
