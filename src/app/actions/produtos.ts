"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirDono } from "@/lib/autorizacao";

function semVazio(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

const schemaProduto = z.object({
  nome: z.string().min(1, "Informe o nome da peça"),
  descricao: z.string().optional(),
  codigo: z.string().optional(),
  categoria: z.string().optional(),
  unidade: z.string().optional(),
  precoVenda: z.coerce.number().min(0, "Valor de venda não pode ser negativo"),
  custo: z.coerce.number().min(0, "Custo não pode ser negativo").optional(),
  estoqueQtd: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  estoqueMinimo: z.coerce
    .number()
    .int()
    .min(0, "Estoque mínimo não pode ser negativo"),
});

function dadosDoForm(formData: FormData) {
  return schemaProduto.parse({
    nome: formData.get("nome"),
    descricao: semVazio(formData.get("descricao")),
    codigo: semVazio(formData.get("codigo")),
    categoria: semVazio(formData.get("categoria")),
    unidade: semVazio(formData.get("unidade")),
    precoVenda: formData.get("precoVenda"),
    custo: semVazio(formData.get("custo")),
    estoqueQtd: formData.get("estoqueQtd"),
    estoqueMinimo: formData.get("estoqueMinimo"),
  });
}

// As actions aqui são chamadas via try/catch no client (ProdutoForm), não
// `<form action>` nativo — por isso usam throw em vez de redirect() pra
// autenticação/autorização (redirect() dentro de um try/catch do client
// pode ser engolido em vez de navegar).

export async function criarProduto(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  const dados = dadosDoForm(formData);

  try {
    const produto = await prisma.produto.create({
      data: {
        oficinaId: session.user.oficinaId,
        nome: dados.nome,
        descricao: dados.descricao,
        codigo: dados.codigo,
        categoria: dados.categoria,
        unidade: dados.unidade,
        precoVenda: dados.precoVenda,
        custo: dados.custo,
        estoqueQtd: dados.estoqueQtd,
        estoqueMinimo: dados.estoqueMinimo,
      },
    });

    revalidatePath("/admin/pecas");
    // Retorna só o id, não o produto inteiro: campos Decimal (precoVenda,
    // custo) não são serializáveis na resposta de uma Server Action pro
    // Client Component — devolver o objeto do Prisma direto trava a
    // promise no client sem erro visível (botão fica "Salvando..." pra
    // sempre).
    return { id: produto.id };
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new Error("Já existe uma peça com esse código.");
    }
    throw erro;
  }
}

export async function atualizarProduto(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  const dados = dadosDoForm(formData);

  try {
    await prisma.produto.updateMany({
      where: { id, oficinaId: session.user.oficinaId },
      data: {
        nome: dados.nome,
        descricao: dados.descricao,
        codigo: dados.codigo,
        categoria: dados.categoria,
        unidade: dados.unidade,
        precoVenda: dados.precoVenda,
        custo: dados.custo,
        estoqueQtd: dados.estoqueQtd,
        estoqueMinimo: dados.estoqueMinimo,
      },
    });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new Error("Já existe uma peça com esse código.");
    }
    throw erro;
  }

  revalidatePath("/admin/pecas");
  revalidatePath(`/admin/pecas/${id}`);
}

export async function inativarProduto(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  await prisma.produto.updateMany({
    where: { id, oficinaId: session.user.oficinaId },
    data: { ativo: false },
  });

  revalidatePath("/admin/pecas");
  revalidatePath(`/admin/pecas/${id}`);
}

export async function reativarProduto(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  await prisma.produto.updateMany({
    where: { id, oficinaId: session.user.oficinaId },
    data: { ativo: true },
  });

  revalidatePath("/admin/pecas");
  revalidatePath(`/admin/pecas/${id}`);
}
