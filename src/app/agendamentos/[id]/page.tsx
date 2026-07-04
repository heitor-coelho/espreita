import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { arquivoEhVideo } from "@/lib/midia";
import { NovoItemRevisaoForm } from "@/components/novo-item-revisao-form";
import { EnviarRevisaoButton } from "@/components/enviar-revisao-button";

export default async function AgendamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const agendamento = await prisma.agendamento.findFirst({
    where: { id, oficinaId: session.user.oficinaId },
    include: {
      cliente: true,
      veiculo: true,
      itensRevisao: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!agendamento) notFound();

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(agendamento.dataHora);

  const veiculoDescricao =
    [agendamento.veiculo.marca, agendamento.veiculo.modelo]
      .filter(Boolean)
      .join(" ") || "Veículo sem marca/modelo";

  const valorTotal = agendamento.itensRevisao.reduce(
    (soma, item) => soma + (item.valor ? Number(item.valor) : 0),
    0,
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const linkPublico = `${baseUrl}/r/${agendamento.id}`;

  return (
    <AppShell oficinaNome={session.user.oficinaNome}>
      <Link href="/agenda" className="text-xs text-ink-faint">
        ← Voltar pra agenda
      </Link>

      <div className="mb-4 mt-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-medium text-ink">
            {agendamento.cliente.nome}
          </h1>
          <p className="text-xs text-ink-muted">
            {veiculoDescricao}
            {agendamento.veiculo.placa ? ` · ${agendamento.veiculo.placa}` : ""}
            {" · "}
            {dataFormatada}
          </p>
        </div>
        <StatusBadge status={agendamento.status} />
      </div>

      {agendamento.problemaRelatado && (
        <p className="mb-4 rounded-lg border border-border bg-surface p-3 text-xs text-ink-muted">
          <span className="font-medium text-ink">Relatado pelo cliente: </span>
          {agendamento.problemaRelatado}
        </p>
      )}

      <h2 className="mb-2 text-sm font-medium text-ink">Itens da revisão</h2>

      {agendamento.itensRevisao.length === 0 ? (
        <p className="mb-4 rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Nenhum item registrado ainda. Adicione abaixo o que for encontrado.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {agendamento.itensRevisao.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-ink">{item.descricao}</span>
                {item.valor !== null && (
                  <span className="text-sm font-medium text-ink">
                    R$ {Number(item.valor).toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
              {item.midias.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {item.midias.map((url) =>
                    arquivoEhVideo(url) ? (
                      <video
                        key={url}
                        src={url}
                        muted
                        className="h-16 w-16 flex-none rounded-lg object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="h-16 w-16 flex-none rounded-lg object-cover"
                      />
                    ),
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {agendamento.itensRevisao.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
          <span className="text-xs text-ink-muted">Total estimado</span>
          <span className="text-sm font-medium text-ink">
            R$ {valorTotal.toFixed(2).replace(".", ",")}
          </span>
        </div>
      )}

      <NovoItemRevisaoForm agendamentoId={agendamento.id} />

      {agendamento.itensRevisao.length > 0 && agendamento.cliente.telefone && (
        <div className="mt-4">
          <EnviarRevisaoButton
            agendamentoId={agendamento.id}
            telefoneCliente={agendamento.cliente.telefone}
            nomeCliente={agendamento.cliente.nome}
            linkPublico={linkPublico}
            totalItens={agendamento.itensRevisao.length}
            valorTotal={valorTotal}
          />
          {agendamento.revisaoEnviadaEm && (
            <p className="mt-1 text-center text-[11px] text-ink-faint">
              Enviado em{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }).format(agendamento.revisaoEnviadaEm)}
            </p>
          )}
        </div>
      )}

      {agendamento.itensRevisao.length > 0 && !agendamento.cliente.telefone && (
        <p className="mt-4 text-center text-xs text-ink-faint">
          Cadastre o telefone do cliente pra poder enviar a revisão.
        </p>
      )}
    </AppShell>
  );
}
