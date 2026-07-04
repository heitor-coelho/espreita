import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { arquivoEhVideo } from "@/lib/midia";
import { ItemRevisaoAprovacao } from "@/components/item-revisao-aprovacao";
import {
  ITEM_REVISAO_STATUS_LABEL,
  ITEM_REVISAO_STATUS_BADGE_CLASS,
} from "@/lib/item-revisao-status";

// Página pública (sem login) — link enviado ao cliente por WhatsApp pra ele
// ver as fotos/vídeos e valores da revisão do próprio veículo.
export default async function RevisaoPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
    include: {
      cliente: { select: { nome: true } },
      veiculo: { select: { marca: true, modelo: true, placa: true } },
      oficina: { select: { nome: true, telefone: true } },
      itensRevisao: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!agendamento) notFound();

  const veiculoDescricao =
    [agendamento.veiculo.marca, agendamento.veiculo.modelo]
      .filter(Boolean)
      .join(" ") || "Veículo";

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

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-md">
        <p className="text-xs text-ink-muted">{agendamento.oficina.nome}</p>
        <h1 className="mb-1 text-lg font-medium text-ink">
          Revisão de {agendamento.cliente.nome}
        </h1>
        <p className="mb-1 text-xs text-ink-muted">
          {veiculoDescricao}
          {agendamento.veiculo.placa ? ` · ${agendamento.veiculo.placa}` : ""}
        </p>

        {agendamento.itensRevisao.length > 0 &&
          (agendamento.status === "CONCLUIDO" ? (
            <p className="mb-5 text-xs text-ink-muted">
              Atendimento já concluído. Veja abaixo o que foi decidido em cada
              item.
            </p>
          ) : (
            <p className="mb-5 text-xs text-ink-muted">
              Toque em cada item pra dizer se autoriza ou não o reparo. Você
              pode autorizar só o que quiser — o restante fica de fora.
            </p>
          ))}

        {agendamento.itensRevisao.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
            Nenhum item registrado ainda.
          </p>
        ) : (
          <ul className="space-y-3">
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
                          controls
                          className="h-28 w-28 flex-none rounded-lg object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="h-28 w-28 flex-none rounded-lg object-cover"
                        />
                      ),
                    )}
                  </div>
                )}
                {agendamento.status === "CONCLUIDO" ? (
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ITEM_REVISAO_STATUS_BADGE_CLASS[item.status]}`}
                  >
                    {ITEM_REVISAO_STATUS_LABEL[item.status]}
                  </span>
                ) : (
                  <ItemRevisaoAprovacao
                    agendamentoId={agendamento.id}
                    itemId={item.id}
                    statusInicial={item.status}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {agendamento.itensRevisao.length > 0 && (
          <div className="mt-4 space-y-1.5 rounded-lg bg-surface-2 px-3 py-2">
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
          </div>
        )}

        {agendamento.oficina.telefone && (
          <a
            href={`https://wa.me/55${agendamento.oficina.telefone.replace(/\D/g, "")}`}
            className="mt-5 block rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-medium text-white"
          >
            Falar com a oficina
          </a>
        )}
      </div>
    </div>
  );
}
