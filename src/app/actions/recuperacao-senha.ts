"use server";

import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";

const TOKEN_VALIDO_MS = 30 * 60 * 1000; // 30 minutos

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Sempre responde com a mesma mensagem de sucesso, exista ou não a conta —
// senão dá pra usar esse formulário pra descobrir quais telefones têm
// conta cadastrada (enumeração de usuários).
export async function solicitarRecuperacaoSenha(formData: FormData) {
  const telefone = z
    .string()
    .trim()
    .min(8)
    .safeParse(formData.get("telefone"));

  if (telefone.success) {
    const usuario = await prisma.usuario.findUnique({
      where: { telefone: telefone.data },
      select: { id: true, nome: true, email: true, ativo: true },
    });

    if (usuario?.ativo && usuario.email) {
      const token = randomBytes(32).toString("hex");
      await prisma.tokenRecuperacaoSenha.create({
        data: {
          usuarioId: usuario.id,
          tokenHash: hashToken(token),
          expiraEm: new Date(Date.now() + TOKEN_VALIDO_MS),
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const link = `${baseUrl}/redefinir-senha?token=${token}`;

      await enviarEmailRecuperacaoSenha({
        destinatario: usuario.email,
        nome: usuario.nome,
        link,
      });
    }
  }

  redirect("/esqueci-senha?enviado=1");
}

const schemaNovaSenha = z.object({
  token: z.string().min(1),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
});

export async function redefinirSenhaComToken(formData: FormData) {
  const resultado = schemaNovaSenha.safeParse({
    token: formData.get("token"),
    senha: formData.get("senha"),
  });

  if (!resultado.success) {
    const token = (formData.get("token") as string | null) ?? "";
    redirect(
      `/redefinir-senha?token=${encodeURIComponent(token)}&erro=${encodeURIComponent(resultado.error.issues[0]?.message ?? "Confira os dados e tente de novo.")}`,
    );
  }

  const { token, senha } = resultado.data;
  const tokenHash = hashToken(token);

  const registro = await prisma.tokenRecuperacaoSenha.findUnique({
    where: { tokenHash },
    select: { id: true, usuarioId: true, expiraEm: true, usadoEm: true },
  });

  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) {
    redirect(
      "/esqueci-senha?erro=" +
        encodeURIComponent(
          "Esse link expirou ou já foi usado. Peça um novo abaixo.",
        ),
    );
  }

  const senhaHash = await hashPassword(senha);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuarioId },
      data: { senhaHash },
    }),
    prisma.tokenRecuperacaoSenha.update({
      where: { id: registro.id },
      data: { usadoEm: new Date() },
    }),
  ]);

  redirect("/login?senhaRedefinida=1");
}
