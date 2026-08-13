"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function iniciarAtendimento(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.agendamento.updateMany({
    where: { id, oficinaId: session.user.oficinaId },
    data: {
      status: "EM_ATENDIMENTO",
      usuarioResponsavelId: session.user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/agenda");
}

// Recebe a lista de ids na nova ordem (índice = posição na fila) e grava
// `ordemFila` de acordo. Serve tanto pro modo de botões subir/descer
// (que reordena o array em memória e reenvia tudo) quanto pro drag and
// drop — a interação muda, o "salvar" é sempre este mesmo bulk update.
export async function reordenarFila(idsEmOrdem: string[]) {
  const session = await auth();
  if (!session?.user) return;
  if (idsEmOrdem.length === 0) return;

  await prisma.$transaction(
    idsEmOrdem.map((id, indice) =>
      prisma.agendamento.updateMany({
        where: { id, oficinaId: session.user.oficinaId, status: "AGENDADO" },
        data: { ordemFila: indice },
      }),
    ),
  );

  revalidatePath("/");
}

export async function concluirAtendimento(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("id") as string;
  const valorBruto = formData.get("valor") as string | null;
  if (!id) return;

  const valor =
    valorBruto && valorBruto.trim() !== "" ? Number(valorBruto) : null;

  const agendamento = await prisma.agendamento.findFirst({
    where: { id, oficinaId: session.user.oficinaId, status: { not: "CONCLUIDO" } },
    select: { id: true, clienteId: true },
  });
  if (!agendamento) return;

  await prisma.$transaction(async (tx) => {
    await tx.agendamento.update({
      where: { id: agendamento.id },
      data: { status: "CONCLUIDO", valor },
    });

    // Itens que o cliente aprovou e o mecânico vinculou a uma peça do
    // catálogo viram venda automaticamente — desconta estoque e entra nos
    // relatórios de /vendas, sem o mecânico ter que registrar tudo de novo
    // numa segunda tela.
    const itensAprovados = await tx.itemRevisao.findMany({
      where: { agendamentoId: agendamento.id, status: "APROVADO", produtoId: { not: null } },
      select: { produtoId: true, valor: true },
    });

    if (itensAprovados.length === 0) return;

    let valorTotalVenda = 0;
    const itensVenda: {
      produtoId: string;
      quantidade: number;
      precoUnitario: number;
    }[] = [];

    for (const item of itensAprovados) {
      // Desconta estoque melhor-esforço: nunca trava a conclusão do
      // atendimento por falta de estoque (pode ficar negativo no caso raro
      // de a peça ter saído por outra venda nesse meio-tempo) — só registra
      // o desconto mesmo assim.
      await tx.produto.update({
        where: { id: item.produtoId! },
        data: { estoqueQtd: { decrement: 1 } },
      });

      const precoUnitario = Number(item.valor ?? 0);
      itensVenda.push({ produtoId: item.produtoId!, quantidade: 1, precoUnitario });
      valorTotalVenda += precoUnitario;
    }

    await tx.venda.create({
      data: {
        oficinaId: session.user.oficinaId,
        clienteId: agendamento.clienteId,
        agendamentoId: agendamento.id,
        usuarioId: session.user.id,
        valorTotal: valorTotalVenda,
        itens: { create: itensVenda },
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath(`/agendamentos/${id}`);
  revalidatePath("/vendas");
  revalidatePath("/admin/pecas");
}
