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

export async function concluirAtendimento(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const id = formData.get("id") as string;
  const valorBruto = formData.get("valor") as string | null;
  if (!id) return;

  const valor =
    valorBruto && valorBruto.trim() !== "" ? Number(valorBruto) : null;

  await prisma.agendamento.updateMany({
    where: { id, oficinaId: session.user.oficinaId },
    data: {
      status: "CONCLUIDO",
      valor,
    },
  });

  revalidatePath("/");
  revalidatePath("/agenda");
}
