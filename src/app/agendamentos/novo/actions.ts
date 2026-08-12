"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  clienteNome: z.string().min(1, "Informe o nome do cliente"),
  clienteTelefone: z.string().optional(),
  veiculoModelo: z.string().optional(),
  veiculoPlaca: z.string().optional(),
  data: z.string().min(1),
  hora: z.string().min(1),
  problema: z.string().optional(),
});

function semVazio(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

export async function criarAgendamento(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const dados = schema.parse({
    clienteNome: formData.get("clienteNome"),
    clienteTelefone: semVazio(formData.get("clienteTelefone")),
    veiculoModelo: semVazio(formData.get("veiculoModelo")),
    veiculoPlaca: semVazio(formData.get("veiculoPlaca")),
    data: formData.get("data"),
    hora: formData.get("hora"),
    problema: semVazio(formData.get("problema")),
  });

  const oficinaId = session.user.oficinaId;

  let cliente = dados.clienteTelefone
    ? await prisma.cliente.findFirst({
        where: { oficinaId, telefone: dados.clienteTelefone },
      })
    : null;

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        oficinaId,
        nome: dados.clienteNome,
        telefone: dados.clienteTelefone,
      },
    });
  }

  let veiculo = dados.veiculoPlaca
    ? await prisma.veiculo.findFirst({
        where: { oficinaId, placa: dados.veiculoPlaca, clienteId: cliente.id },
      })
    : null;

  if (!veiculo) {
    veiculo = await prisma.veiculo.create({
      data: {
        oficinaId,
        clienteId: cliente.id,
        modelo: dados.veiculoModelo,
        placa: dados.veiculoPlaca,
      },
    });
  }

  const dataHora = new Date(`${dados.data}T${dados.hora}:00`);

  await prisma.agendamento.create({
    data: {
      oficinaId,
      clienteId: cliente.id,
      veiculoId: veiculo.id,
      dataHora,
      problemaRelatado: dados.problema,
    },
  });

  revalidatePath("/");
  revalidatePath("/agenda");
  redirect("/");
}
