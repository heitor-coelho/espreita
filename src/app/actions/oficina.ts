"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { exigirDono } from "@/lib/autorizacao";

export async function atualizarChavePix(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  exigirDono(session.user.papel);

  const chavePixBruta = formData.get("chavePix");
  const chavePix =
    typeof chavePixBruta === "string" && chavePixBruta.trim() !== ""
      ? chavePixBruta.trim()
      : null;

  await prisma.oficina.update({
    where: { id: session.user.oficinaId },
    data: { chavePix },
  });

  revalidatePath("/admin/pix");
}
