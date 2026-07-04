"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { TipoVeiculo } from "@prisma/client";

function semVazio(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

const schemaCliente = z.object({
  nome: z.string().min(1, "Informe o nome do cliente"),
  telefone: z.string().optional(),
});

export async function criarCliente(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const dados = schemaCliente.parse({
    nome: formData.get("nome"),
    telefone: semVazio(formData.get("telefone")),
  });

  const cliente = await prisma.cliente.create({
    data: {
      oficinaId: session.user.oficinaId,
      nome: dados.nome,
      telefone: dados.telefone,
    },
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${cliente.id}`);
}

export async function salvarVeiculo(dados: {
  veiculoId?: string;
  clienteId: string;
  tipo: TipoVeiculo;
  marca?: string;
  modelo?: string;
  placa?: string;
  anoFabricacao?: string;
  cor?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");

  const cliente = await prisma.cliente.findFirst({
    where: { id: dados.clienteId, oficinaId: session.user.oficinaId },
    select: { id: true },
  });
  if (!cliente) throw new Error("Cliente não encontrado.");

  const dadosVeiculo = {
    tipo: dados.tipo,
    marca: dados.marca?.trim() || null,
    modelo: dados.modelo?.trim() || null,
    placa: dados.placa?.trim() || null,
    anoFabricacao: dados.anoFabricacao ? Number(dados.anoFabricacao) : null,
    cor: dados.cor?.trim() || null,
  };

  if (dados.veiculoId) {
    await prisma.veiculo.updateMany({
      where: { id: dados.veiculoId, oficinaId: session.user.oficinaId },
      data: dadosVeiculo,
    });
  } else {
    await prisma.veiculo.create({
      data: {
        oficinaId: session.user.oficinaId,
        clienteId: cliente.id,
        ...dadosVeiculo,
      },
    });
  }

  revalidatePath(`/clientes/${dados.clienteId}`);
}
