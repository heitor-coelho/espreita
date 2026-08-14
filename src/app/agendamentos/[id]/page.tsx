import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { arquivoEhVideo } from "@/lib/midia";
import {
  ITEM_REVISAO_STATUS_LABEL,
  ITEM_REVISAO_STATUS_BADGE_CLASS,
} from "@/lib/item-revisao-status";
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

  const [agendamento, produtos] = await Promise.all([
    prisma.agendamento.findFirst({
      where: { id, oficinaId: session.user.oficinaId },
      include: {
        cliente: true,
        veiculo: true,
        itensRevisao: {
          include: { produto: { select: { nome: true } } },
          orderBy: { criadoEm: "asc" },
        },
      },
    }),
    prisma.produto.findMany({
      where: { oficinaId: session.user.oficinaId, ativo: true },
      select: { id: true, nome: true, precoVenda: true, estoqueQtd: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!agendamento) notFound();

  const idsNaoVistos = agendamento.itensRevisao
    .filter((item) => item.status !== "PENDENTE" && !item.vistoOficinaEm)
    .map((item) => item.id);

  if (idsNaoVistos.length > 0) {
    await prisma.itemRevisao.updateMany({
      where: { id: { in: idsNaoVistos } },
      data: { vistoOficinaEm: new Date() },
    });
  }

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

  const valorAprovado = agendamento.itensRevisao
    .filter((item) => item.status === "APROVADO")
    .reduce((soma, item) => soma + (item.valor ? Number(item.valor) : 0), 0);

  const temDecisao = agendamento.itensRevisao.some(
    (item) => item.status !== "PENDENTE",
  );

  const itensPendentes = agendamento.itensRevisao.filter(
    (item) => item.status === "PENDENTE",
  ).length;

  // Se algum item foi adicionado depois do último envio, o cliente ainda
  // não viu ele — tratamos como uma revisão "atualizada" pra reenviar, e
  // não como cobrança do que já foi mandado.
  const temItemNovoDesdeEnvio =
    agendamento.revisaoEnviadaEm !== null &&
    agendamento.itensRevisao.some(
      (item) => item.criadoEm > agendamento.revisaoEnviadaEm!,
    );

  const variante: "primeiro-envio" | "atualizacao" | "cobranca" | null =
    !agendamento.revisaoEnviadaEm
      ? "primeiro-envio"
      : temItemNovoDesdeEnvio
        ? "atualizacao"
        : itensPendentes > 0
          ? "cobranca"
          : null; // já enviada, sem novidade e sem pendência: nada a fazer

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const linkPublico = `${baseUrl}/r/${agendamento.id}`;

  return (
    <AppShell oficinaNome={session.user.oficinaNome} papel={session.user.papel}>
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

      {(agendamento.servicoRealizado || agendamento.valor !== null) && (
        <div className="mb-4 rounded-lg border border-border bg-surface p-3 text-xs text-ink-muted">
          {agendamento.servicoRealizado && (
            <p>
              <span className="font-medium text-ink">Serviço realizado: </span>
              {agendamento.servicoRealizado}
            </p>
          )}
          {agendamento.valor !== null && (
            <p className={agendamento.servicoRealizado ? "mt-1" : ""}>
              <span className="font-medium text-ink">Valor cobrado: </span>
              R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}
            </p>
          )}
        </div>
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
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ITEM_REVISAO_STATUS_BADGE_CLASS[item.status]}`}
              >
                {ITEM_REVISAO_STATUS_LABEL[item.status]}
              </span>
              {item.produto && (
                <span className="ml-1.5 mt-1.5 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-ink-faint">
                  Estoque: {item.produto.nome}
                </span>
              )}
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
        <div className="mb-4 space-y-1.5 rounded-lg bg-surface-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Total estimado</span>
            <span className="text-sm font-medium text-ink">
              R$ {valorTotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
          {temDecisao && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Total autorizado</span>
              <span className="text-sm font-medium text-ink">
                R$ {valorAprovado.toFixed(2).replace(".", ",")}
              </span>
            </div>
          )}
          {agendamento.revisaoEnviadaEm && itensPendentes > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">Aguardando resposta</span>
              <span className="text-sm font-medium text-ink">
                {itensPendentes === 1 ? "1 item" : `${itensPendentes} itens`}
              </span>
            </div>
          )}
        </div>
      )}

      {agendamento.status === "CONCLUIDO" ? (
        <p className="rounded-lg border border-border bg-surface p-3 text-center text-xs text-ink-faint">
          Atendimento concluído — só consulta, sem edição.
        </p>
      ) : (
        <>
          <NovoItemRevisaoForm
            agendamentoId={agendamento.id}
            produtos={produtos.map((p) => ({
              ...p,
              precoVenda: p.precoVenda.toString(),
            }))}
          />

          {agendamento.itensRevisao.length > 0 &&
            agendamento.cliente.telefone && (
              <div className="mt-4">
                {agendamento.revisaoEnviadaEm && (
                  <p className="mb-2 text-center text-[11px] text-ink-faint">
                    Revisão enviada em{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(agendamento.revisaoEnviadaEm)}
                  </p>
                )}

                {variante ? (
                  <EnviarRevisaoButton
                    agendamentoId={agendamento.id}
                    telefoneCliente={agendamento.cliente.telefone}
                    nomeCliente={agendamento.cliente.nome}
                    linkPublico={linkPublico}
                    totalItens={agendamento.itensRevisao.length}
                    pendentes={itensPendentes}
                    valorTotal={valorTotal}
                    variante={variante}
                  />
                ) : (
                  <p className="rounded-lg border border-border bg-surface p-3 text-center text-xs text-ink-faint">
                    Cliente já respondeu todos os itens — nada pendente.
                  </p>
                )}
              </div>
            )}

          {agendamento.itensRevisao.length > 0 &&
            !agendamento.cliente.telefone && (
              <p className="mt-4 text-center text-xs text-ink-faint">
                Cadastre o telefone do cliente pra poder enviar a revisão.
              </p>
            )}
        </>
      )}
    </AppShell>
  );
}
