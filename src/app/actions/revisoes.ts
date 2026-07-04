"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { gerarUrlDeUpload } from "@/lib/storage";

export async function obterUrlDeUpload(nomeArquivo: string, contentType: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  return gerarUrlDeUpload(nomeArquivo, contentType);
}

export async function criarItemRevisao(dados: {
  agendamentoId: string;
  descricao: string;
  valor?: string;
  midias: string[];
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const agendamento = await prisma.agendamento.findFirst({
    where: { id: dados.agendamentoId, oficinaId: session.user.oficinaId },
    select: { id: true },
  });
  if (!agendamento) throw new Error("Agendamento não encontrado.");

  const descricao = dados.descricao.trim();
  if (!descricao) throw new Error("Descreva o item encontrado.");

  const valor =
    dados.valor && dados.valor.trim() !== "" ? Number(dados.valor) : null;

  await prisma.itemRevisao.create({
    data: {
      oficinaId: session.user.oficinaId,
      agendamentoId: dados.agendamentoId,
      descricao,
      valor,
      midias: dados.midias,
    },
  });

  revalidatePath(`/agendamentos/${dados.agendamentoId}`);
}

export async function removerItemRevisao(id: string, agendamentoId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.itemRevisao.deleteMany({
    where: { id, oficinaId: session.user.oficinaId },
  });

  revalidatePath(`/agendamentos/${agendamentoId}`);
}

export async function marcarRevisaoEnviada(agendamentoId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.agendamento.updateMany({
    where: { id: agendamentoId, oficinaId: session.user.oficinaId },
    data: { revisaoEnviadaEm: new Date() },
  });

  revalidatePath(`/agendamentos/${agendamentoId}`);
  revalidatePath(`/r/${agendamentoId}`);
}
