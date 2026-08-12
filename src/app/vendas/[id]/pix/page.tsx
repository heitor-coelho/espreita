import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { exigirDono } from "@/lib/autorizacao";
import { gerarCodigoPix } from "@/lib/pix";
import { CopiarCodigoPix } from "@/components/copiar-codigo-pix";

export default async function VendaPixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  exigirDono(session.user.papel);

  const { id } = await params;

  const [venda, oficina] = await Promise.all([
    prisma.venda.findFirst({
      where: { id, oficinaId: session.user.oficinaId },
      select: { id: true, valorTotal: true, cliente: { select: { nome: true } } },
    }),
    prisma.oficina.findUniqueOrThrow({
      where: { id: session.user.oficinaId },
      select: { nome: true, cidade: true, chavePix: true },
    }),
  ]);

  if (!venda) notFound();

  const valor = Number(venda.valorTotal);

  if (!oficina.chavePix) {
    return (
      <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
        <Link href="/vendas" className="text-xs text-ink-faint">
          ← Voltar pras vendas
        </Link>
        <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Cadastre a chave Pix da oficina antes de cobrar por Pix.{" "}
          <Link href="/admin/pix" className="text-accent-strong">
            Configurar agora
          </Link>
        </p>
      </AppShell>
    );
  }

  const codigoPix = gerarCodigoPix({
    chave: oficina.chavePix,
    nomeRecebedor: oficina.nome,
    cidade: oficina.cidade,
    valor,
    identificador: venda.id,
  });

  const qrSvg = await QRCode.toString(codigoPix, { type: "svg", margin: 1 });

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
      <Link href="/vendas" className="text-xs text-ink-faint">
        ← Voltar pras vendas
      </Link>

      <h1 className="mb-1 mt-3 text-lg font-medium text-ink">Cobrar via Pix</h1>
      <p className="mb-4 text-xs text-ink-muted">
        {venda.cliente?.nome ?? "Venda avulsa"}
      </p>

      {/* SVG gerado localmente pela lib qrcode a partir do payload Pix —
          não tem input de usuário nessa string, então é seguro. */}
      <div className="mb-4 flex justify-center rounded-xl border border-border bg-white p-4">
        <div
          className="h-56 w-56 [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>

      <p className="mb-4 text-center text-2xl font-semibold text-ink">
        R$ {valor.toFixed(2).replace(".", ",")}
      </p>

      <CopiarCodigoPix codigo={codigoPix} />
    </AppShell>
  );
}
