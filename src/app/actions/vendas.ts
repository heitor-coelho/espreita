"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirDono } from "@/lib/autorizacao";

const schemaItem = z.object({
  produtoId: z.string().min(1),
  quantidade: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
});

const schemaVenda = z.object({
  clienteId: z.string().optional(),
  itens: z.array(schemaItem).min(1, "Adicione pelo menos uma peça"),
});

// Chamada via try/catch no client (VendaForm), não `<form action>` nativo —
// por isso usa throw em vez de redirect() pra autenticação/autorização
// (mesmo padrão de src/app/actions/produtos.ts).
export async function registrarVenda(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  const clienteIdBruto = formData.get("clienteId");
  const clienteId =
    typeof clienteIdBruto === "string" && clienteIdBruto.trim() !== ""
      ? clienteIdBruto
      : undefined;

  const itensBrutos = formData.get("itens");
  if (typeof itensBrutos !== "string") {
    throw new Error("Itens da venda inválidos.");
  }

  let itensJson: unknown;
  try {
    itensJson = JSON.parse(itensBrutos);
  } catch {
    throw new Error("Itens da venda inválidos.");
  }

  const dados = schemaVenda.parse({ clienteId, itens: itensJson });

  if (dados.clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: dados.clienteId, oficinaId: session.user.oficinaId },
      select: { id: true },
    });
    if (!cliente) throw new Error("Cliente não encontrado.");
  }

  const vendaId = await prisma.$transaction(async (tx) => {
    let valorTotal = 0;
    const itensParaCriar: {
      produtoId: string;
      quantidade: number;
      precoUnitario: number;
    }[] = [];

    for (const item of dados.itens) {
      const produto = await tx.produto.findFirst({
        where: {
          id: item.produtoId,
          oficinaId: session.user.oficinaId,
          ativo: true,
        },
      });
      if (!produto) throw new Error("Peça não encontrada.");
      if (produto.estoqueQtd < item.quantidade) {
        throw new Error(
          `Estoque insuficiente de "${produto.nome}" (disponível: ${produto.estoqueQtd}).`,
        );
      }

      await tx.produto.update({
        where: { id: produto.id },
        data: { estoqueQtd: { decrement: item.quantidade } },
      });

      const precoUnitario = Number(produto.precoVenda);
      itensParaCriar.push({
        produtoId: produto.id,
        quantidade: item.quantidade,
        precoUnitario,
      });
      valorTotal += precoUnitario * item.quantidade;
    }

    const criada = await tx.venda.create({
      data: {
        oficinaId: session.user.oficinaId,
        clienteId: dados.clienteId,
        usuarioId: session.user.id,
        valorTotal,
        itens: { create: itensParaCriar },
      },
    });
    return criada.id;
  });

  revalidatePath("/vendas");
  revalidatePath("/admin/pecas");

  // Retorna só o id, não a venda inteira: campos Decimal (valorTotal,
  // precoUnitario) não são serializáveis na resposta de uma Server Action
  // pro Client Component — devolver o objeto do Prisma direto trava a
  // promise no client sem erro visível (mesmo problema de produtos.ts).
  return { id: vendaId };
}

export async function marcarVendaPaga(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  await prisma.venda.updateMany({
    where: { id, oficinaId: session.user.oficinaId, status: "PENDENTE" },
    data: { status: "PAGO", pagoEm: new Date() },
  });

  revalidatePath("/vendas");
}

export async function cancelarVenda(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  // Cancelar não apaga a venda (histórico fica preservado) nem devolve
  // estoque automaticamente — decisão consciente: devolver estoque sem o
  // mecânico conferir a peça de volta na prateleira criaria discrepância.
  // Se a peça realmente voltou, ele ajusta o estoque manualmente em
  // /admin/pecas.
  await prisma.venda.updateMany({
    where: { id, oficinaId: session.user.oficinaId, status: { not: "CANCELADO" } },
    data: { status: "CANCELADO" },
  });

  revalidatePath("/vendas");
}
