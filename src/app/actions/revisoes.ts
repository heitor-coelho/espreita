"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { gerarUrlDeUpload } from "@/lib/storage";
import { enviarPushParaOficina } from "@/lib/push";

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
  produtoId?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const agendamento = await prisma.agendamento.findFirst({
    where: { id: dados.agendamentoId, oficinaId: session.user.oficinaId },
    select: { id: true, status: true },
  });
  if (!agendamento) throw new Error("Agendamento não encontrado.");
  if (agendamento.status === "CONCLUIDO") {
    throw new Error("Atendimento já concluído, sem edição.");
  }

  const descricao = dados.descricao.trim();
  if (!descricao) throw new Error("Descreva o item encontrado.");

  const valor =
    dados.valor && dados.valor.trim() !== "" ? Number(dados.valor) : null;

  // Vínculo com o catálogo de peças é opcional — texto livre continua
  // funcionando pra serviço/mão de obra sem controle de estoque.
  let produtoId: string | null = null;
  if (dados.produtoId) {
    const produto = await prisma.produto.findFirst({
      where: { id: dados.produtoId, oficinaId: session.user.oficinaId },
      select: { id: true },
    });
    if (!produto) throw new Error("Peça não encontrada.");
    produtoId = produto.id;
  }

  await prisma.itemRevisao.create({
    data: {
      oficinaId: session.user.oficinaId,
      agendamentoId: dados.agendamentoId,
      produtoId,
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
    where: {
      id,
      oficinaId: session.user.oficinaId,
      agendamento: { status: { not: "CONCLUIDO" } },
    },
  });

  revalidatePath(`/agendamentos/${agendamentoId}`);
}

export async function marcarRevisaoEnviada(agendamentoId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.agendamento.updateMany({
    where: {
      id: agendamentoId,
      oficinaId: session.user.oficinaId,
      status: { not: "CONCLUIDO" },
    },
    data: { revisaoEnviadaEm: new Date() },
  });

  revalidatePath(`/agendamentos/${agendamentoId}`);
  revalidatePath(`/r/${agendamentoId}`);
}

// Chamada a partir da página pública (/r/[id]), sem login — o cliente decide
// item por item o que autoriza. A segurança aqui é a mesma da página: o id
// do agendamento (cuid) funciona como o "token" de acesso.
export async function decidirItemRevisao(
  agendamentoId: string,
  itemId: string,
  decisao: "APROVADO" | "RECUSADO",
) {
  const item = await prisma.itemRevisao.findFirst({
    where: { id: itemId, agendamentoId },
    select: {
      descricao: true,
      oficinaId: true,
      agendamento: {
        select: { status: true, cliente: { select: { nome: true } } },
      },
    },
  });
  if (!item) return;
  if (item.agendamento.status === "CONCLUIDO") return;

  await prisma.itemRevisao.update({
    where: { id: itemId },
    data: { status: decisao, decididoEm: new Date(), vistoOficinaEm: null },
  });

  revalidatePath(`/r/${agendamentoId}`);
  revalidatePath(`/agendamentos/${agendamentoId}`);

  const acao = decisao === "APROVADO" ? "autorizou" : "não autorizou";
  await enviarPushParaOficina(item.oficinaId, {
    title: `${item.agendamento.cliente.nome} respondeu a revisão`,
    body: `${acao}: ${item.descricao}`,
    url: `/agendamentos/${agendamentoId}`,
  });
}
